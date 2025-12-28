using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace FitCoachPro.Api.Migrations;

public partial class AddPublishingFields : Migration
{
    protected override void Up(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.AddColumn<Guid>(
            name: "CreatedBy",
            table: "WorkoutPlans",
            type: "uniqueidentifier",
            nullable: false,
            defaultValue: Guid.Empty);

        migrationBuilder.AddColumn<bool>(
            name: "IsPublished",
            table: "WorkoutPlans",
            type: "bit",
            nullable: false,
            defaultValue: false);

        migrationBuilder.AddColumn<Guid>(
            name: "CreatedBy",
            table: "Meals",
            type: "uniqueidentifier",
            nullable: false,
            defaultValue: Guid.Empty);

        migrationBuilder.AddColumn<bool>(
            name: "IsPublished",
            table: "Meals",
            type: "bit",
            nullable: false,
            defaultValue: false);

        migrationBuilder.AddColumn<Guid>(
            name: "CreatedBy",
            table: "Foods",
            type: "uniqueidentifier",
            nullable: false,
            defaultValue: Guid.Empty);

        migrationBuilder.AddColumn<bool>(
            name: "IsPublished",
            table: "Foods",
            type: "bit",
            nullable: false,
            defaultValue: false);

        migrationBuilder.AddColumn<Guid>(
            name: "CreatedBy",
            table: "Exercises",
            type: "uniqueidentifier",
            nullable: false,
            defaultValue: Guid.Empty);

        migrationBuilder.AddColumn<bool>(
            name: "IsPublished",
            table: "Exercises",
            type: "bit",
            nullable: false,
            defaultValue: false);

        migrationBuilder.AddColumn<string>(
            name: "PrimaryMuscleGroup",
            table: "Exercises",
            type: "nvarchar(120)",
            maxLength: 120,
            nullable: false,
            defaultValue: "");

        migrationBuilder.AddColumn<Guid>(
            name: "CreatedBy",
            table: "DietPlans",
            type: "uniqueidentifier",
            nullable: false,
            defaultValue: Guid.Empty);

        migrationBuilder.AddColumn<bool>(
            name: "IsPublished",
            table: "DietPlans",
            type: "bit",
            nullable: false,
            defaultValue: false);

        migrationBuilder.CreateIndex(
            name: "IX_WorkoutPlans_Name",
            table: "WorkoutPlans",
            column: "Name");

        migrationBuilder.CreateIndex(
            name: "IX_Meals_Name",
            table: "Meals",
            column: "Name");

        migrationBuilder.CreateIndex(
            name: "IX_Foods_Name",
            table: "Foods",
            column: "Name");

        migrationBuilder.CreateIndex(
            name: "IX_Exercises_Name",
            table: "Exercises",
            column: "Name");

        migrationBuilder.CreateIndex(
            name: "IX_Exercises_PrimaryMuscleGroup",
            table: "Exercises",
            column: "PrimaryMuscleGroup");

        migrationBuilder.CreateIndex(
            name: "IX_Exercises_Tags",
            table: "Exercises",
            column: "Tags");

        migrationBuilder.CreateIndex(
            name: "IX_DietPlans_Name",
            table: "DietPlans",
            column: "Name");
    }

    protected override void Down(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.DropIndex(
            name: "IX_WorkoutPlans_Name",
            table: "WorkoutPlans");

        migrationBuilder.DropIndex(
            name: "IX_Meals_Name",
            table: "Meals");

        migrationBuilder.DropIndex(
            name: "IX_Foods_Name",
            table: "Foods");

        migrationBuilder.DropIndex(
            name: "IX_Exercises_Name",
            table: "Exercises");

        migrationBuilder.DropIndex(
            name: "IX_Exercises_PrimaryMuscleGroup",
            table: "Exercises");

        migrationBuilder.DropIndex(
            name: "IX_Exercises_Tags",
            table: "Exercises");

        migrationBuilder.DropIndex(
            name: "IX_DietPlans_Name",
            table: "DietPlans");

        migrationBuilder.DropColumn(
            name: "CreatedBy",
            table: "WorkoutPlans");

        migrationBuilder.DropColumn(
            name: "IsPublished",
            table: "WorkoutPlans");

        migrationBuilder.DropColumn(
            name: "CreatedBy",
            table: "Meals");

        migrationBuilder.DropColumn(
            name: "IsPublished",
            table: "Meals");

        migrationBuilder.DropColumn(
            name: "CreatedBy",
            table: "Foods");

        migrationBuilder.DropColumn(
            name: "IsPublished",
            table: "Foods");

        migrationBuilder.DropColumn(
            name: "CreatedBy",
            table: "Exercises");

        migrationBuilder.DropColumn(
            name: "IsPublished",
            table: "Exercises");

        migrationBuilder.DropColumn(
            name: "PrimaryMuscleGroup",
            table: "Exercises");

        migrationBuilder.DropColumn(
            name: "CreatedBy",
            table: "DietPlans");

        migrationBuilder.DropColumn(
            name: "IsPublished",
            table: "DietPlans");
    }
}
