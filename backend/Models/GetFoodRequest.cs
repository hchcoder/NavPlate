using Hackathon.Api.Data;
using Hackathon.Api.Models;

namespace Hackathon.Api.Models;

public class GetFoodRequest
{
    public string SearchText {get; set;} = "";
}
