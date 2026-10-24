using Microsoft.AspNetCore.Mvc;
using Hackathon.Api.Models;
using Hackathon.Api.Services;

namespace Hackathon.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class UserController : ControllerBase
{
    private readonly IUserService _userService;

    public UserController(IUserService userService)
    {
        _userService = userService;
    }

    // GET api/user/username/alice
    [HttpGet("username/{username}")]
    public async Task<ActionResult<User>> GetUserByUsername(string username)
    {
        var user = await _userService.GetUserAsync(username);

        if (user == null)
            return NotFound();

        return Ok(user);
    }

    // GET api/user/5
    [HttpGet("{id:int}")]
    public async Task<ActionResult<User>> GetUserById(int id)
    {
        var user = await _userService.GetUserAsync(id);

        if (user == null)
            return NotFound();

        return Ok(user);
    }

    // POST api/user
    [HttpPost]
    public async Task<ActionResult<User>> CreateUser(
        [FromBody] CreateUserRequest request)
    {
        int newUserId = await _userService.CreateUserAsync(request);

        var user = await _userService.GetUserAsync(newUserId);

        if (user == null)
            return Problem("User was created, but could not be retrieved.");

        return CreatedAtAction(
            nameof(GetUserById),
            new { id = newUserId },
            user
        );
    }

    // PUT api/user/5
    [HttpPut("{id:int}")]
    public async Task<ActionResult<User>> UpdateUser(
        int id, [FromBody] UpdateUserRequest request)
    {
        if (await _userService.GetUserAsync(id) == null)
            return NotFound();

        await _userService.UpdateUserAsync(id, request);

        var user = await _userService.GetUserAsync(id);

        if (user == null)
            return Problem("User was updated, but could not be retrieved.");

        return Ok(user);
    }
}