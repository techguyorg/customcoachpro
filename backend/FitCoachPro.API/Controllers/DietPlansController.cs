using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using FitCoachPro.API.DTOs;
using FitCoachPro.API.Services.Interfaces;
using System.Security.Claims;

namespace FitCoachPro.API.Controllers;

[ApiController]
[Route("api/diet-plans")]
[Authorize]
public class DietPlansController : ControllerBase
{
    private readonly IDietPlanService _dietPlanService;

    public DietPlansController(IDietPlanService dietPlanService)
    {
        _dietPlanService = dietPlanService;
    }

    [HttpGet]
    public async Task<ActionResult<List<DietPlanListDto>>> GetDietPlans()
    {
        var plans = await _dietPlanService.GetAllDietPlansAsync();
        return Ok(plans);
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<DietPlanDto>> GetDietPlan(Guid id)
    {
        var plan = await _dietPlanService.GetDietPlanByIdAsync(id);
        if (plan == null) return NotFound();
        return Ok(plan);
    }

    [HttpGet("coach/{coachId}")]
    public async Task<ActionResult<List<DietPlanListDto>>> GetDietPlansByCoach(Guid coachId)
    {
        var plans = await _dietPlanService.GetDietPlansByCoachAsync(coachId);
        return Ok(plans);
    }

    [HttpGet("client/{clientId}")]
    public async Task<ActionResult<List<ClientDietPlanDto>>> GetClientDietPlans(Guid clientId)
    {
        var plans = await _dietPlanService.GetClientDietPlansAsync(clientId);
        return Ok(plans);
    }

    [HttpPost]
    [Authorize(Policy = "CoachOnly")]
    public async Task<ActionResult<DietPlanDto>> CreateDietPlan([FromBody] CreateDietPlanRequest request)
    {
        var userId = Guid.Parse(User.FindFirst(ClaimTypes.NameIdentifier)!.Value);
        var plan = await _dietPlanService.CreateDietPlanAsync(request, userId);
        return CreatedAtAction(nameof(GetDietPlan), new { id = plan.Id }, plan);
    }

    [HttpPut("{id}")]
    [Authorize(Policy = "CoachOnly")]
    public async Task<ActionResult<DietPlanDto>> UpdateDietPlan(Guid id, [FromBody] CreateDietPlanRequest request)
    {
        var userId = Guid.Parse(User.FindFirst(ClaimTypes.NameIdentifier)!.Value);
        var plan = await _dietPlanService.UpdateDietPlanAsync(id, request, userId);
        if (plan == null) return NotFound();
        return Ok(plan);
    }

    [HttpDelete("{id}")]
    [Authorize(Policy = "CoachOnly")]
    public async Task<IActionResult> DeleteDietPlan(Guid id)
    {
        var userId = Guid.Parse(User.FindFirst(ClaimTypes.NameIdentifier)!.Value);
        var result = await _dietPlanService.DeleteDietPlanAsync(id, userId);
        if (!result) return NotFound();
        return NoContent();
    }

    [HttpPost("assign")]
    [Authorize(Policy = "CoachOnly")]
    public async Task<ActionResult<ClientDietPlanDto>> AssignDietPlan([FromBody] AssignDietPlanRequest request)
    {
        var userId = Guid.Parse(User.FindFirst(ClaimTypes.NameIdentifier)!.Value);
        var assignment = await _dietPlanService.AssignDietPlanAsync(request, userId);
        if (assignment == null) return BadRequest("Failed to assign diet plan");
        return Ok(assignment);
    }

    [HttpPost("{id}/meals")]
    [Authorize(Policy = "CoachOnly")]
    public async Task<ActionResult<DietPlanMealDto>> AddMealToPlan(Guid id, [FromBody] AddMealToDietPlanRequest request)
    {
        var userId = Guid.Parse(User.FindFirst(ClaimTypes.NameIdentifier)!.Value);
        var meal = await _dietPlanService.AddMealToPlanAsync(id, request, userId);
        if (meal == null) return NotFound();
        return Ok(meal);
    }
}
