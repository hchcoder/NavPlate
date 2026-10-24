
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

        const string sql = """
            SELECT mealId, userId, mealType, date
            FROM Meals
            WHERE userId = @userId
            """;

        await using var command = new MySqlCommand(sql, connection);
        command.Parameters.AddWithValue("@userId", request.UserId);

        await using var reader = await command.ExecuteReaderAsync();

        var meals = new List<Meal>();

        while (await reader.ReadAsync())
        {
            meals.Add(new Meal
            {
                MealId = reader.GetInt32("mealId"),
                UserId = reader.GetInt32("userId"),
                MealType = reader.GetString("mealType"),
                Date = reader.GetDateTime("date")
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
            INSERT INTO Meals (userId, mealType, date)
            VALUES (@userId, @mealType, @date)
            """;

        int mealId;

        await using (var command = new MySqlCommand(
            sql, connection, transaction))
        {
            command.Parameters.AddWithValue("@userId", request.UserId);
            command.Parameters.AddWithValue("@mealType", request.Type);
            command.Parameters.AddWithValue("@date", request.Date);

            await command.ExecuteNonQueryAsync();
            mealId = checked((int)command.LastInsertedId);
        }

        // Insert each food instance
        const string foodSql = """
            INSERT INTO FoodInstance (mealId, food_item, servings)
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
