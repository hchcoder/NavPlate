using Hackathon.Api.Data;
using Hackathon.Api.Models;

namespace Hackathon.Api.Models;

public class Meal
{
    public int MealId {get; set;}
    public int UserId{get; set;}
    public string MealType {get; set;}
    public DateTime Date {get; set;}

}
