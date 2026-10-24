using Hackathon.Api.Data;
using Hackathon.Api.Models;

namespace Hackathon.Api.Models;

public class Meal
{
    public int MealId {get; set;}
    public int UserId{get; set;}
    public MealType MealType {get; set;}
    public DateTime Date {get; set;}
    public List<MealFood> Foods {get; set;} = new();

    // Meal totals, added up from the foods (already multiplied by servings)
    public float Calories => Foods.Sum(f => f.Calories);
    public float Protein => Foods.Sum(f => f.Protein);
    public float Carbohydrates => Foods.Sum(f => f.Carbohydrates);
    public float Fat => Foods.Sum(f => f.Fat);
    public float Fiber => Foods.Sum(f => f.Fiber);
    public float Sugars => Foods.Sum(f => f.Sugars);
    public float Sodium => Foods.Sum(f => f.Sodium);
}
