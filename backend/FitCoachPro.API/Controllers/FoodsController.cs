using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using FitCoachPro.API.DTOs;
using FitCoachPro.API.Services.Interfaces;
using System.Security.Claims;

namespace FitCoachPro.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class FoodsController : ControllerBase
{
    private readonly IFoodService _foodService;

    public FoodsController(IFoodService foodService)
    {
        _foodService = foodService;
    }

    [HttpGet]
    public async Task<ActionResult<List<FoodDto>>> GetFoods()
    {
        var foods = await _foodService.GetAllFoodsAsync();
        return Ok(foods);
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<FoodDto>> GetFood(Guid id)
    {
        var food = await _foodService.GetFoodByIdAsync(id);
        if (food == null) return NotFound();
        return Ok(food);
    }

    [HttpGet("coach/{coachId}")]
    public async Task<ActionResult<List<FoodDto>>> GetFoodsByCoach(Guid coachId)
    {
        var foods = await _foodService.GetFoodsByCoachAsync(coachId);
        return Ok(foods);
    }

    [HttpPost]
    [Authorize(Policy = "CoachOnly")]
    public async Task<ActionResult<FoodDto>> CreateFood([FromBody] CreateFoodRequest request)
    {
        var userId = Guid.Parse(User.FindFirst(ClaimTypes.NameIdentifier)!.Value);
        var food = await _foodService.CreateFoodAsync(request, userId);
        return CreatedAtAction(nameof(GetFood), new { id = food.Id }, food);
    }

    [HttpPut("{id}")]
    [Authorize(Policy = "CoachOnly")]
    public async Task<ActionResult<FoodDto>> UpdateFood(Guid id, [FromBody] UpdateFoodRequest request)
    {
        var userId = Guid.Parse(User.FindFirst(ClaimTypes.NameIdentifier)!.Value);
        var food = await _foodService.UpdateFoodAsync(id, request, userId);
        if (food == null) return NotFound();
        return Ok(food);
    }

    [HttpDelete("{id}")]
    [Authorize(Policy = "CoachOnly")]
    public async Task<IActionResult> DeleteFood(Guid id)
    {
        var userId = Guid.Parse(User.FindFirst(ClaimTypes.NameIdentifier)!.Value);
        var result = await _foodService.DeleteFoodAsync(id, userId);
        if (!result) return NotFound();
        return NoContent();
    }
}
