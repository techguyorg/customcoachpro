using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace FitCoachPro.Api.Migrations;

public partial class AddMeasurementsAndPreferredUnit : Migration
{
    protected override void Up(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.AddColumn<decimal>(
            name: "ArmsCm",
            table: "UserProfiles",
            type: "decimal(18,2)",
            nullable: true);

        migrationBuilder.AddColumn<decimal>(
            name: "HipsCm",
            table: "UserProfiles",
            type: "decimal(18,2)",
            nullable: true);

        migrationBuilder.AddColumn<decimal>(
            name: "NeckCm",
            table: "UserProfiles",
            type: "decimal(18,2)",
            nullable: true);

        migrationBuilder.AddColumn<string>(
            name: "PreferredUnitSystem",
            table: "UserProfiles",
            type: "nvarchar(20)",
            nullable: false,
            defaultValue: "imperial");

        migrationBuilder.AddColumn<decimal>(
            name: "QuadsCm",
            table: "UserProfiles",
            type: "decimal(18,2)",
            nullable: true);
    }

    protected override void Down(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.DropColumn(
            name: "ArmsCm",
            table: "UserProfiles");

        migrationBuilder.DropColumn(
            name: "HipsCm",
            table: "UserProfiles");

        migrationBuilder.DropColumn(
            name: "NeckCm",
            table: "UserProfiles");

        migrationBuilder.DropColumn(
            name: "PreferredUnitSystem",
            table: "UserProfiles");

        migrationBuilder.DropColumn(
            name: "QuadsCm",
            table: "UserProfiles");
    }
}
