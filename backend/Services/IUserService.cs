namespace Hackathon.Api.Services;
using Hackathon.Api.Data;
using Hackathon.Api.Models;

public interface IUserService
{
    Task<User?> GetUserAsync (String username); // need to mandate unique username for this to work
    Task<User?> GetUserAsync (int id);
    Task<int> CreateUserAsync (CreateUserRequest request); // return id
    Task UpdateUserAsync (int id, UpdateUserRequest request);
}