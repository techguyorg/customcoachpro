using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using FitCoachPro.API.DTOs;
using FitCoachPro.API.Services.Interfaces;
using System.Security.Claims;

namespace FitCoachPro.API.Controllers;

[ApiController]
[Route("api/workout-plans")]
[Authorize]
public class WorkoutPlansController : ControllerBase
{
    private readonly IWorkoutPlanService _workoutPlanService;

    public WorkoutPlansController(IWorkoutPlanService workoutPlanService)
    {
        _workoutPlanService = workoutPlanService;
    }

    [HttpGet]
    public async Task<ActionResult<List<WorkoutPlanListDto>>> GetWorkoutPlans()
    {
        var plans = await _workoutPlanService.GetAllWorkoutPlansAsync();
        return Ok(plans);
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<WorkoutPlanDto>> GetWorkoutPlan(Guid id)
    {
        var plan = await _workoutPlanService.GetWorkoutPlanByIdAsync(id);
        if (plan == null) return NotFound();
        return Ok(plan);
    }

    [HttpGet("coach/{coachId}")]
    public async Task<ActionResult<List<WorkoutPlanListDto>>> GetWorkoutPlansByCoach(Guid coachId)
    {
        var plans = await _workoutPlanService.GetWorkoutPlansByCoachAsync(coachId);
        return Ok(plans);
    }

    [HttpGet("client/{clientId}")]
    public async Task<ActionResult<List<ClientWorkoutPlanDto>>> GetClientWorkoutPlans(Guid clientId)
    {
        var plans = await _workoutPlanService.GetClientWorkoutPlansAsync(clientId);
        return Ok(plans);
    }

    [HttpPost]
    [Authorize(Policy = "CoachOnly")]
    public async Task<ActionResult<WorkoutPlanDto>> CreateWorkoutPlan([FromBody] CreateWorkoutPlanRequest request)
    {
        var userId = Guid.Parse(User.FindFirst(ClaimTypes.NameIdentifier)!.Value);
        var plan = await _workoutPlanService.CreateWorkoutPlanAsync(request, userId);
        return CreatedAtAction(nameof(GetWorkoutPlan), new { id = plan.Id }, plan);
    }

    [HttpPut("{id}")]
    [Authorize(Policy = "CoachOnly")]
    public async Task<ActionResult<WorkoutPlanDto>> UpdateWorkoutPlan(Guid id, [FromBody] UpdateWorkoutPlanRequest request)
    {
        var userId = Guid.Parse(User.FindFirst(ClaimTypes.NameIdentifier)!.Value);
        var plan = await _workoutPlanService.UpdateWorkoutPlanAsync(id, request, userId);
        if (plan == null) return NotFound();
        return Ok(plan);
    }

    [HttpDelete("{id}")]
    [Authorize(Policy = "CoachOnly")]
    public async Task<IActionResult> DeleteWorkoutPlan(Guid id)
    {
        var userId = Guid.Parse(User.FindFirst(ClaimTypes.NameIdentifier)!.Value);
        var result = await _workoutPlanService.DeleteWorkoutPlanAsync(id, userId);
        if (!result) return NotFound();
        return NoContent();
    }

    [HttpPost("assign")]
    [Authorize(Policy = "CoachOnly")]
    public async Task<ActionResult<ClientWorkoutPlanDto>> AssignWorkoutPlan([FromBody] AssignWorkoutPlanRequest request)
    {
        var userId = Guid.Parse(User.FindFirst(ClaimTypes.NameIdentifier)!.Value);
        var assignment = await _workoutPlanService.AssignWorkoutPlanAsync(request, userId);
        if (assignment == null) return BadRequest("Failed to assign workout plan");
        return Ok(assignment);
    }

    [HttpPost("{id}/days")]
    [Authorize(Policy = "CoachOnly")]
    public async Task<ActionResult<WorkoutDayDto>> AddWorkoutDay(Guid id, [FromBody] CreateWorkoutDayRequest request)
    {
        var userId = Guid.Parse(User.FindFirst(ClaimTypes.NameIdentifier)!.Value);
        var day = await _workoutPlanService.AddWorkoutDayAsync(id, request, userId);
        if (day == null) return NotFound();
        return Ok(day);
    }

    [HttpPost("days/{dayId}/exercises")]
    [Authorize(Policy = "CoachOnly")]
    public async Task<ActionResult<WorkoutExerciseDto>> AddExerciseToDay(Guid dayId, [FromBody] CreateWorkoutExerciseRequest request)
    {
        var userId = Guid.Parse(User.FindFirst(ClaimTypes.NameIdentifier)!.Value);
        var exercise = await _workoutPlanService.AddExerciseToDayAsync(dayId, request, userId);
        if (exercise == null) return NotFound();
        return Ok(exercise);
    }
}
