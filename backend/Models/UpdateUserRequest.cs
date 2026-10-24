namespace Hackathon.Api.Models;

// Preferences a user can change after setup (the username stays the same)
public class UpdateUserRequest
{
    public bool SeeCalories {get; set;}
    public bool SeeProtein {get; set;}
    public bool SeeCarbs {get; set;}
    public bool SeeFat {get; set;}
    public bool SeeFiber {get; set;}
    public bool SeeSugar {get; set;}
    public bool SeeSodium {get; set;}
}
