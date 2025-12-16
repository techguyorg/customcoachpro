using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using FitCoachPro.API.DTOs;
using FitCoachPro.API.Services.Interfaces;
using System.Security.Claims;

namespace FitCoachPro.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class MealsController : ControllerBase
{
    private readonly IMealService _mealService;

    public MealsController(IMealService mealService)
    {
        _mealService = mealService;
    }

    [HttpGet]
    public async Task<ActionResult<List<MealDto>>> GetMeals()
    {
        var meals = await _mealService.GetAllMealsAsync();
        return Ok(meals);
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<MealDto>> GetMeal(Guid id)
    {
        var meal = await _mealService.GetMealByIdAsync(id);
        if (meal == null) return NotFound();
        return Ok(meal);
    }

    [HttpGet("coach/{coachId}")]
    public async Task<ActionResult<List<MealDto>>> GetMealsByCoach(Guid coachId)
    {
        var meals = await _mealService.GetMealsByCoachAsync(coachId);
        return Ok(meals);
    }

    [HttpPost]
    [Authorize(Policy = "CoachOnly")]
    public async Task<ActionResult<MealDto>> CreateMeal([FromBody] CreateMealRequest request)
    {
        var userId = Guid.Parse(User.FindFirst(ClaimTypes.NameIdentifier)!.Value);
        var meal = await _mealService.CreateMealAsync(request, userId);
        return CreatedAtAction(nameof(GetMeal), new { id = meal.Id }, meal);
    }

    [HttpPut("{id}")]
    [Authorize(Policy = "CoachOnly")]
    public async Task<ActionResult<MealDto>> UpdateMeal(Guid id, [FromBody] CreateMealRequest request)
    {
        var userId = Guid.Parse(User.FindFirst(ClaimTypes.NameIdentifier)!.Value);
        var meal = await _mealService.UpdateMealAsync(id, request, userId);
        if (meal == null) return NotFound();
        return Ok(meal);
    }

    [HttpDelete("{id}")]
    [Authorize(Policy = "CoachOnly")]
    public async Task<IActionResult> DeleteMeal(Guid id)
    {
        var userId = Guid.Parse(User.FindFirst(ClaimTypes.NameIdentifier)!.Value);
        var result = await _mealService.DeleteMealAsync(id, userId);
        if (!result) return NotFound();
        return NoContent();
    }

    [HttpPost("{id}/foods")]
    [Authorize(Policy = "CoachOnly")]
    public async Task<ActionResult<MealFoodDto>> AddFoodToMeal(Guid id, [FromBody] CreateMealFoodRequest request)
    {
        var userId = Guid.Parse(User.FindFirst(ClaimTypes.NameIdentifier)!.Value);
        var mealFood = await _mealService.AddFoodToMealAsync(id, request, userId);
        if (mealFood == null) return NotFound();
        return Ok(mealFood);
    }
}
