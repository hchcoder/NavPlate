using Hackathon.Api.Data;
using Hackathon.Api.Models;

namespace Hackathon.Api.Models;

public class FoodInstance
{
    public int InstanceId {get; set;} 
    public int MealId {get; set;}
    public String Food_Item {get; set;} 
    public float Servings {get; set;}
}
