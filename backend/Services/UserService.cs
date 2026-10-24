using Hackathon.Api.Data;
using Hackathon.Api.Models;
using MySqlConnector;

namespace Hackathon.Api.Services;

public class UserService : IUserService
{
    private readonly IDbConnectionFactory _connectionFactory;

    public UserService(IDbConnectionFactory connectionFactory)
    {
        _connectionFactory = connectionFactory;
    }

    public async Task<User?> GetUserAsync(string username)
    {
        await using var connection =
            _connectionFactory.CreateConnection();

        await connection.OpenAsync();

        const string sql = """
            SELECT *
            FROM users
            WHERE username = @username
            """;

        await using var command = new MySqlCommand(sql, connection);
        command.Parameters.AddWithValue("@username", username);

        await using var reader = await command.ExecuteReaderAsync();

        if (await reader.ReadAsync())
        {
            return new User
            {
                UserId = reader.GetInt32("userId"),
                Username = reader.GetString("username"),
                SeeCalories = reader.GetBoolean("seeCalories"),
                SeeProtein = reader.GetBoolean("seeProtein"),
                SeeCarbs = reader.GetBoolean("seeCarbs"),
                SeeFat = reader.GetBoolean("seeFat"),
                SeeFiber = reader.GetBoolean("seeFiber"),
                SeeSugar = reader.GetBoolean("seeSugar"),
                SeeSodium = reader.GetBoolean("seeSodium")
            };
        }

        return null;
    }

    public async Task<User?> GetUserAsync(int id)
    {
        await using var connection =
            _connectionFactory.CreateConnection();

        await connection.OpenAsync();

        const string sql = """
            SELECT *
            FROM users
            WHERE userId = @id
            """;

        await using var command = new MySqlCommand(sql, connection);
        command.Parameters.AddWithValue("@id", id);

        await using var reader = await command.ExecuteReaderAsync();

        if (await reader.ReadAsync())
        {
            return new User
            {
                UserId = reader.GetInt32("userId"),
                Username = reader.GetString("username"),
                SeeCalories = reader.GetBoolean("seeCalories"),
                SeeProtein = reader.GetBoolean("seeProtein"),
                SeeCarbs = reader.GetBoolean("seeCarbs"),
                SeeFat = reader.GetBoolean("seeFat"),
                SeeFiber = reader.GetBoolean("seeFiber"),
                SeeSugar = reader.GetBoolean("seeSugar"),
                SeeSodium = reader.GetBoolean("seeSodium")
            };
        }

        return null;
    }

    public async Task<int> CreateUserAsync(CreateUserRequest request)
    {
        await using var connection =
            _connectionFactory.CreateConnection();

        await connection.OpenAsync();

        const string sql = """
            INSERT INTO users
                (Username, SeeCalories, SeeProtein, SeeCarbs,
                 SeeFat, SeeFiber, SeeSugar, SeeSodium)
            VALUES
                (@username, @seeCalories, @seeProtein, @seeCarbs,
                 @seeFat, @seeFiber, @seeSugar, @seeSodium)
            """;

        await using var command = new MySqlCommand(sql, connection);

        command.Parameters.AddWithValue("@username", request.Username);
        command.Parameters.AddWithValue("@seeCalories", request.SeeCalories);
        command.Parameters.AddWithValue("@seeProtein", request.SeeProtein);
        command.Parameters.AddWithValue("@seeCarbs", request.SeeCarbs);
        command.Parameters.AddWithValue("@seeFat", request.SeeFat);
        command.Parameters.AddWithValue("@seeFiber", request.SeeFiber);
        command.Parameters.AddWithValue("@seeSugar", request.SeeSugar);
        command.Parameters.AddWithValue("@seeSodium", request.SeeSodium);

        await command.ExecuteNonQueryAsync();

        return checked((int)command.LastInsertedId);
    }

    public async Task UpdateUserAsync(int id, UpdateUserRequest request)
    {
        await using var connection =
            _connectionFactory.CreateConnection();

        await connection.OpenAsync();

        const string sql = """
            UPDATE users
            SET SeeCalories = @seeCalories,
                SeeProtein = @seeProtein,
                SeeCarbs = @seeCarbs,
                SeeFat = @seeFat,
                SeeFiber = @seeFiber,
                SeeSugar = @seeSugar,
                SeeSodium = @seeSodium
            WHERE userId = @id
            """;

        await using var command = new MySqlCommand(sql, connection);

        command.Parameters.AddWithValue("@id", id);
        command.Parameters.AddWithValue("@seeCalories", request.SeeCalories);
        command.Parameters.AddWithValue("@seeProtein", request.SeeProtein);
        command.Parameters.AddWithValue("@seeCarbs", request.SeeCarbs);
        command.Parameters.AddWithValue("@seeFat", request.SeeFat);
        command.Parameters.AddWithValue("@seeFiber", request.SeeFiber);
        command.Parameters.AddWithValue("@seeSugar", request.SeeSugar);
        command.Parameters.AddWithValue("@seeSodium", request.SeeSodium);

        await command.ExecuteNonQueryAsync();
    }
}