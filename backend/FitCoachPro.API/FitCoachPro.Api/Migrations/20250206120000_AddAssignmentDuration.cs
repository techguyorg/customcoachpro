using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace FitCoachPro.Api.Migrations;

public partial class AddAssignmentDuration : Migration
{
    protected override void Up(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.AddColumn<int>(
            name: "DurationDays",
            table: "ClientWorkoutPlans",
            type: "int",
            nullable: true);

        migrationBuilder.AddColumn<int>(
            name: "DurationDays",
            table: "ClientDietPlans",
            type: "int",
            nullable: true);
    }

    protected override void Down(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.DropColumn(
            name: "DurationDays",
            table: "ClientWorkoutPlans");

        migrationBuilder.DropColumn(
            name: "DurationDays",
            table: "ClientDietPlans");
    }
}
