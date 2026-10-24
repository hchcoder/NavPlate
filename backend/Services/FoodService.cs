
using Hackathon.Api.Data;
using Hackathon.Api.Models;
using MySqlConnector;

namespace Hackathon.Api.Services; // 

public class FoodService : IFoodService
{
    private readonly IDbConnectionFactory _connectionFactory;

    public FoodService(IDbConnectionFactory connectionFactory)
    {
        _connectionFactory = connectionFactory;
    }

    public async Task<List<Food>> GetAllFoodsAsync(GetFoodRequest request)
    {
        await using var connection =
            _connectionFactory.CreateConnection();

        await connection.OpenAsync();

        const string sql = """
            SELECT *
            FROM foods
            WHERE Food_Item LIKE @searchText
            """;

        await using var command = new MySqlCommand(sql, connection);
        command.Parameters.AddWithValue("@searchText", $"%{request.SearchText}%");

        await using var reader = await command.ExecuteReaderAsync();

        var foods = new List<Food>();

        while (await reader.ReadAsync())
        {
            foods.Add(new Food
            {
                Food_Item = reader.GetString("Food_Item"),
                Category = reader.GetString("Category"),
                Calories = reader.GetInt32("Calories"),
                Protein = reader.GetFloat("Protein"),
                Carbohydrates = reader.GetFloat("Carbohydrates"),
                Fat = reader.GetFloat("Fat"),
                Fiber = reader.GetFloat("Fiber"),
                Sugars = reader.GetFloat("Sugars"),
                Sodium = reader.GetInt32("Sodium"),
                Cholesterol = reader.GetInt32("Cholesterol"),
                Meal_Type = reader.GetString("Meal_Type"),
                Water_Intake = reader.GetInt32("Water_Intake"),
            
            });
        }

        return foods;
    }
}
