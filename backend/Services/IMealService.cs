namespace Hackathon.Api.Services;
using Hackathon.Api.Data;
using Hackathon.Api.Models;

public interface IMealService
{
   Task <List<Meal>> GetAllMealsAsync(GetMealsRequest request);
   Task <int> AddMealAsync (AddMealRequest request);
}