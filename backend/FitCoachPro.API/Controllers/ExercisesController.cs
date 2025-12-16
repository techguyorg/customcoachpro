using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using FitCoachPro.API.DTOs;
using FitCoachPro.API.Services.Interfaces;
using System.Security.Claims;

namespace FitCoachPro.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class ExercisesController : ControllerBase
{
    private readonly IExerciseService _exerciseService;

    public ExercisesController(IExerciseService exerciseService)
    {
        _exerciseService = exerciseService;
    }

    [HttpGet]
    public async Task<ActionResult<List<ExerciseListDto>>> GetExercises()
    {
        var exercises = await _exerciseService.GetAllExercisesAsync();
        return Ok(exercises);
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<ExerciseDto>> GetExercise(Guid id)
    {
        var exercise = await _exerciseService.GetExerciseByIdAsync(id);
        if (exercise == null) return NotFound();
        return Ok(exercise);
    }

    [HttpGet("coach/{coachId}")]
    public async Task<ActionResult<List<ExerciseListDto>>> GetExercisesByCoach(Guid coachId)
    {
        var exercises = await _exerciseService.GetExercisesByCoachAsync(coachId);
        return Ok(exercises);
    }

    [HttpPost]
    [Authorize(Policy = "CoachOnly")]
    public async Task<ActionResult<ExerciseDto>> CreateExercise([FromBody] CreateExerciseRequest request)
    {
        var userId = Guid.Parse(User.FindFirst(ClaimTypes.NameIdentifier)!.Value);
        var exercise = await _exerciseService.CreateExerciseAsync(request, userId);
        return CreatedAtAction(nameof(GetExercise), new { id = exercise.Id }, exercise);
    }

    [HttpPut("{id}")]
    [Authorize(Policy = "CoachOnly")]
    public async Task<ActionResult<ExerciseDto>> UpdateExercise(Guid id, [FromBody] UpdateExerciseRequest request)
    {
        var userId = Guid.Parse(User.FindFirst(ClaimTypes.NameIdentifier)!.Value);
        var exercise = await _exerciseService.UpdateExerciseAsync(id, request, userId);
        if (exercise == null) return NotFound();
        return Ok(exercise);
    }

    [HttpDelete("{id}")]
    [Authorize(Policy = "CoachOnly")]
    public async Task<IActionResult> DeleteExercise(Guid id)
    {
        var userId = Guid.Parse(User.FindFirst(ClaimTypes.NameIdentifier)!.Value);
        var result = await _exerciseService.DeleteExerciseAsync(id, userId);
        if (!result) return NotFound();
        return NoContent();
    }
}
