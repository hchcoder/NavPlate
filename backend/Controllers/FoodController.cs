
using Microsoft.AspNetCore.Mvc;
using Hackathon.Api.Models;
using Hackathon.Api.Services;

namespace Hackathon.Api.Controllers;

[ApiController] // 
[Route("api/[controller]")]
public class FoodController : ControllerBase
{
    private readonly IFoodService _foodService;

    public FoodController(IFoodService foodService)
    {
        _foodService = foodService;
    }

    // GET api/food?searchText=apple
    [HttpGet]
    public async Task<ActionResult<List<Food>>> GetAllFoods(
        [FromQuery] GetFoodRequest request)
    {
        var foods = await _foodService.GetAllFoodsAsync(request);
        return Ok(foods);
    }
}
