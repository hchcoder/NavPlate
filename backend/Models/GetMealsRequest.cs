using Hackathon.Api.Data;
using Hackathon.Api.Models;

namespace Hackathon.Api.Models;

public class GetMealsRequest
{
    public int UserId {get; set;}
    public DateTime? Date {get; set;}
}
