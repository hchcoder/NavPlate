namespace Hackathon.Api.Models;

// One food inside a meal, with its numbers already multiplied by servings
public class MealFood
{
    public string Food_Item {get; set;} = "";
    public float Servings {get; set;}
    public float Calories {get; set;}
    public float Protein {get; set;}
    public float Carbohydrates {get; set;}
    public float Fat {get; set;}
    public float Fiber {get; set;}
    public float Sugars {get; set;}
    public float Sodium {get; set;}
}
