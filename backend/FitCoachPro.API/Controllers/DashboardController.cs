using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using FitCoachPro.API.DTOs;
using FitCoachPro.API.Services.Interfaces;
using System.Security.Claims;

namespace FitCoachPro.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class DashboardController : ControllerBase
{
    private readonly IDashboardService _dashboardService;

    public DashboardController(IDashboardService dashboardService)
    {
        _dashboardService = dashboardService;
    }

    [HttpGet("coach")]
    [Authorize(Policy = "CoachOnly")]
    public async Task<ActionResult<CoachDashboardDto>> GetCoachDashboard()
    {
        var userId = Guid.Parse(User.FindFirst(ClaimTypes.NameIdentifier)!.Value);
        var dashboard = await _dashboardService.GetCoachDashboardAsync(userId);
        return Ok(dashboard);
    }

    [HttpGet("client")]
    [Authorize(Policy = "ClientOnly")]
    public async Task<ActionResult<ClientDashboardDto>> GetClientDashboard()
    {
        var userId = Guid.Parse(User.FindFirst(ClaimTypes.NameIdentifier)!.Value);
        var dashboard = await _dashboardService.GetClientDashboardAsync(userId);
        if (dashboard == null) return NotFound("Client profile not found");
        return Ok(dashboard);
    }
}
