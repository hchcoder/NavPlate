using Hackathon.Api.Data;
using Hackathon.Api.Models;

namespace Hackathon.Api.Models;

public class Food
{
    public String Food_Item {get; set;}
    public String Category {get; set;}
    public int Calories {get; set;} 
    public float Protein {get; set;}
    public float Carbohydrates {get; set;} 
    public float Fat {get; set;}
    public float Fiber{get; set;} 
    public float Sugars{get; set;} 
    public int Sodium {get; set;} 
    public int Cholesterol {get; set;}
    public String Meal_Type {get; set;} 
    public int Water_Intake {get; set;}
}
