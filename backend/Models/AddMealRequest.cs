using Hackathon.Api.Data;
using Hackathon.Api.Models;

namespace Hackathon.Api.Models;

public class AddMealRequest
{
    public List<FoodInstance> FoodInstances {get; set;}
    public int UserId {get; set;}
    public MealType Type {get; set;}
    public DateTime Date {get; set;}

}
