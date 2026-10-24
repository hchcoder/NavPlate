using MySqlConnector;

namespace Hackathon.Api.Data;

public interface IDbConnectionFactory
{
    MySqlConnection CreateConnection();
}