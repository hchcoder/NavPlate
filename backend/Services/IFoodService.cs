namespace Hackathon.Api.Services;
using Hackathon.Api.Data;
using Hackathon.Api.Models;

public interface IFoodService
{
    Task<List<Food>> GetAllFoodsAsync(GetFoodRequest request);

}