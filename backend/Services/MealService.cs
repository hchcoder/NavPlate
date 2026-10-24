
using Hackathon.Api.Data;
using Hackathon.Api.Models;
using MySqlConnector;

namespace Hackathon.Api.Services;

public class MealService : IMealService
{
    private readonly IDbConnectionFactory _connectionFactory;

    public MealService(IDbConnectionFactory connectionFactory)
    {
        _connectionFactory = connectionFactory;
    }

    public async Task<List<Meal>> GetAllMealsAsync(GetMealsRequest request)
    {
        await using var connection =
            _connectionFactory.CreateConnection();

        await connection.OpenAsync();

        // One row per food in each meal (LEFT JOIN keeps meals with no foods).
        const string sql = """
            SELECT m.mealId, m.userId, m.mealType, m.date,
                   fi.food_item, fi.servings,
                   f.calories, f.protein, f.carbohydrates, f.fat,
                   f.fiber, f.sugars, f.sodium
            FROM meals m
            LEFT JOIN food_instance fi ON fi.mealId = m.mealId
            LEFT JOIN foods f ON f.food_item = fi.food_item
            WHERE m.userId = @userId
              AND (@date IS NULL OR DATE(m.date) = @date)
            ORDER BY m.date, m.mealId, fi.instanceId
            """;

        await using var command = new MySqlCommand(sql, connection);
        command.Parameters.AddWithValue("@userId", request.UserId);
        command.Parameters.AddWithValue(
            "@date", (object?)request.Date?.Date ?? DBNull.Value);

        await using var reader = await command.ExecuteReaderAsync();

        // NULL (e.g. a food with no fiber listed) counts as 0
        float Number(string column)
        {
            int i = reader.GetOrdinal(column);
            return reader.IsDBNull(i) ? 0 : Convert.ToSingle(reader.GetValue(i));
        }

        var meals = new List<Meal>();
        Meal? current = null;

        while (await reader.ReadAsync())
        {
            int mealId = reader.GetInt32("mealId");

            // Rows are ordered by meal, so a new mealId starts a new meal
            if (current == null || current.MealId != mealId)
            {
                current = new Meal
                {
                    MealId = mealId,
                    UserId = reader.GetInt32("userId"),
                    MealType = Enum.Parse<MealType>(reader.GetString("mealType")),
                    Date = reader.GetDateTime("date")
                };
                meals.Add(current);
            }

            if (reader.IsDBNull(reader.GetOrdinal("food_item")))
                continue;

            // Foods' numbers are per serving, so multiply by servings
            float servings = Number("servings");
            current.Foods.Add(new MealFood
            {
                Food_Item = reader.GetString("food_item"),
                Servings = servings,
                Calories = Number("calories") * servings,
                Protein = Number("protein") * servings,
                Carbohydrates = Number("carbohydrates") * servings,
                Fat = Number("fat") * servings,
                Fiber = Number("fiber") * servings,
                Sugars = Number("sugars") * servings,
                Sodium = Number("sodium") * servings
            });
        }

        return meals;
    }

    public async Task<int> AddMealAsync(AddMealRequest request)
{
    await using var connection =
        _connectionFactory.CreateConnection();

    await connection.OpenAsync();

    await using var transaction =
        await connection.BeginTransactionAsync();

    try
    {
        // Insert the meal
        const string sql = """
            INSERT INTO meals (userId, mealType, date)
            VALUES (@userId, @mealType, @date)
            """;

        int mealId;

        await using (var command = new MySqlCommand(
            sql, connection, transaction))
        {
            command.Parameters.AddWithValue("@userId", request.UserId);
            command.Parameters.AddWithValue("@mealType", request.Type.ToString());
            command.Parameters.AddWithValue("@date", request.Date);

            await command.ExecuteNonQueryAsync();
            mealId = checked((int)command.LastInsertedId);
        }

        // Insert each food instance
        const string foodSql = """
            INSERT INTO food_instance (mealId, food_item, servings)
            VALUES (@mealId, @foodItem, @servings)
            """;

        foreach (var foodInstance in request.FoodInstances)
        {
            await using var foodCommand = new MySqlCommand(
                foodSql, connection, transaction);

            foodCommand.Parameters.AddWithValue("@mealId", mealId);
            foodCommand.Parameters.AddWithValue(
                "@servings", foodInstance.Servings);
            foodCommand.Parameters.AddWithValue(
                "@foodItem", foodInstance.Food_Item);

            await foodCommand.ExecuteNonQueryAsync();
        }

        await transaction.CommitAsync();

        return mealId;
    }
    catch
    {
        await transaction.RollbackAsync();
        throw;
    }
}
}
