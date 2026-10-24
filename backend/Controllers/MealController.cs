
using Microsoft.AspNetCore.Mvc;
using Hackathon.Api.Models;
using Hackathon.Api.Services;

namespace Hackathon.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class MealController : ControllerBase
{
    private readonly IMealService _mealService;

    public MealController(IMealService mealService)
    {
        _mealService = mealService;
    }

    // GET api/meal
    [HttpGet]
    public async Task<ActionResult<List<Meal>>> GetAllMealsAsync (
        [FromQuery] GetMealsRequest request)
    {
        var meals = await _mealService.GetAllMealsAsync(request);
        return Ok(meals);
    }

    // POST api/meal
    [HttpPost]
    public async Task<ActionResult<int>> AddMealAsync (
        [FromBody] AddMealRequest request)
    {
        int newMealId = await _mealService.AddMealAsync(request);

        return Ok(newMealId);
    }
}
