using Hackathon.Api.Data;
using Hackathon.Api.Models;

namespace Hackathon.Api.Models;

public class User
{
    public int UserId {get; set;}
    public string Username {get; set;}
    public bool SeeCalories {get; set;} = false;
    public bool SeeProtein {get; set;} = true;
    public bool SeeCarbs {get; set;} = true;
    public bool SeeFat {get; set;} = true;
    public bool SeeFiber {get; set;} = true;
    public bool SeeSugar {get; set;} = true;
    public bool SeeSodium {get; set;} = true;
}
