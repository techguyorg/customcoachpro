/**
 * Azure SQL Seed Script
 * Seeds system data (exercises, foods, templates) into Azure SQL
 * 
 * Usage: npm run seed:azure
 */

import sql from 'mssql';
import dotenv from 'dotenv';

dotenv.config();

const config: sql.config = {
  server: process.env.SQL_SERVER || '',
  database: process.env.SQL_DATABASE || '',
  user: process.env.SQL_USER || '',
  password: process.env.SQL_PASSWORD || '',
  options: {
    encrypt: true,
    trustServerCertificate: false,
  },
};

// Sample exercises data
const exercises = [
  { name: 'Barbell Bench Press', description: 'Classic chest compound exercise', primary_muscle: 'chest', equipment: 'barbell', difficulty: 'intermediate', exercise_type: 'compound' },
  { name: 'Barbell Squat', description: 'Fundamental leg exercise', primary_muscle: 'quadriceps', equipment: 'barbell', difficulty: 'intermediate', exercise_type: 'compound' },
  { name: 'Deadlift', description: 'Full body pulling exercise', primary_muscle: 'back', equipment: 'barbell', difficulty: 'advanced', exercise_type: 'compound' },
  { name: 'Pull-ups', description: 'Upper body pulling exercise', primary_muscle: 'lats', equipment: 'pull_up_bar', difficulty: 'intermediate', exercise_type: 'compound' },
  { name: 'Dumbbell Shoulder Press', description: 'Shoulder pressing movement', primary_muscle: 'shoulders', equipment: 'dumbbell', difficulty: 'beginner', exercise_type: 'compound' },
  { name: 'Barbell Row', description: 'Back rowing exercise', primary_muscle: 'back', equipment: 'barbell', difficulty: 'intermediate', exercise_type: 'compound' },
  { name: 'Dumbbell Curl', description: 'Bicep isolation exercise', primary_muscle: 'biceps', equipment: 'dumbbell', difficulty: 'beginner', exercise_type: 'isolation' },
  { name: 'Tricep Pushdown', description: 'Tricep isolation exercise', primary_muscle: 'triceps', equipment: 'cable', difficulty: 'beginner', exercise_type: 'isolation' },
  { name: 'Leg Press', description: 'Machine leg exercise', primary_muscle: 'quadriceps', equipment: 'machine', difficulty: 'beginner', exercise_type: 'compound' },
  { name: 'Lat Pulldown', description: 'Back pulling exercise', primary_muscle: 'lats', equipment: 'cable', difficulty: 'beginner', exercise_type: 'compound' },
];

// Sample foods data
const foods = [
  { name: 'Chicken Breast', category: 'protein', calories_per_100g: 165, protein_per_100g: 31, carbs_per_100g: 0, fat_per_100g: 3.6 },
  { name: 'Brown Rice', category: 'grains', calories_per_100g: 111, protein_per_100g: 2.6, carbs_per_100g: 23, fat_per_100g: 0.9 },
  { name: 'Broccoli', category: 'vegetables', calories_per_100g: 34, protein_per_100g: 2.8, carbs_per_100g: 7, fat_per_100g: 0.4 },
  { name: 'Salmon', category: 'protein', calories_per_100g: 208, protein_per_100g: 20, carbs_per_100g: 0, fat_per_100g: 13 },
  { name: 'Eggs', category: 'protein', calories_per_100g: 155, protein_per_100g: 13, carbs_per_100g: 1.1, fat_per_100g: 11 },
  { name: 'Oatmeal', category: 'grains', calories_per_100g: 68, protein_per_100g: 2.4, carbs_per_100g: 12, fat_per_100g: 1.4 },
  { name: 'Greek Yogurt', category: 'dairy', calories_per_100g: 59, protein_per_100g: 10, carbs_per_100g: 3.6, fat_per_100g: 0.7 },
  { name: 'Almonds', category: 'nuts', calories_per_100g: 579, protein_per_100g: 21, carbs_per_100g: 22, fat_per_100g: 50 },
  { name: 'Sweet Potato', category: 'vegetables', calories_per_100g: 86, protein_per_100g: 1.6, carbs_per_100g: 20, fat_per_100g: 0.1 },
  { name: 'Banana', category: 'fruits', calories_per_100g: 89, protein_per_100g: 1.1, carbs_per_100g: 23, fat_per_100g: 0.3 },
];

// Sample workout templates
const workoutTemplates = [
  { name: 'Push Pull Legs', description: '6-day split focusing on push, pull, and leg movements', difficulty: 'intermediate', days_per_week: 6, duration_weeks: 12, template_type: 'push_pull_legs', goal: 'Build muscle' },
  { name: 'Full Body 3x', description: '3-day full body program for beginners', difficulty: 'beginner', days_per_week: 3, duration_weeks: 8, template_type: 'full_body', goal: 'General fitness' },
  { name: 'Upper Lower Split', description: '4-day upper/lower body split', difficulty: 'intermediate', days_per_week: 4, duration_weeks: 10, template_type: 'upper_lower', goal: 'Build strength' },
  { name: 'Strength Foundation', description: 'Focus on compound lifts for strength', difficulty: 'beginner', days_per_week: 3, duration_weeks: 12, template_type: 'strength', goal: 'Build strength' },
  { name: 'Hypertrophy Focus', description: 'Volume-based program for muscle growth', difficulty: 'advanced', days_per_week: 5, duration_weeks: 8, template_type: 'hypertrophy', goal: 'Build muscle' },
];

async function seed() {
  console.log('🌱 Starting Azure SQL seed...');
  
  try {
    await sql.connect(config);
    console.log('✅ Connected to Azure SQL');

    // Seed exercises
    console.log('📦 Seeding exercises...');
    for (const ex of exercises) {
      await sql.query`
        IF NOT EXISTS (SELECT 1 FROM dbo.exercises WHERE name = ${ex.name} AND is_system = 1)
        INSERT INTO dbo.exercises (name, description, primary_muscle, equipment, difficulty, exercise_type, is_system)
        VALUES (${ex.name}, ${ex.description}, ${ex.primary_muscle}, ${ex.equipment}, ${ex.difficulty}, ${ex.exercise_type}, 1)
      `;
    }
    console.log(`✅ Seeded ${exercises.length} exercises`);

    // Seed foods
    console.log('📦 Seeding foods...');
    for (const food of foods) {
      await sql.query`
        IF NOT EXISTS (SELECT 1 FROM dbo.foods WHERE name = ${food.name} AND is_system = 1)
        INSERT INTO dbo.foods (name, category, calories_per_100g, protein_per_100g, carbs_per_100g, fat_per_100g, is_system, default_serving_size, default_serving_unit)
        VALUES (${food.name}, ${food.category}, ${food.calories_per_100g}, ${food.protein_per_100g}, ${food.carbs_per_100g}, ${food.fat_per_100g}, 1, 100, 'g')
      `;
    }
    console.log(`✅ Seeded ${foods.length} foods`);

    // Seed workout templates
    console.log('📦 Seeding workout templates...');
    for (const tmpl of workoutTemplates) {
      await sql.query`
        IF NOT EXISTS (SELECT 1 FROM dbo.workout_templates WHERE name = ${tmpl.name} AND is_system = 1)
        INSERT INTO dbo.workout_templates (name, description, difficulty, days_per_week, duration_weeks, template_type, goal, is_system)
        VALUES (${tmpl.name}, ${tmpl.description}, ${tmpl.difficulty}, ${tmpl.days_per_week}, ${tmpl.duration_weeks}, ${tmpl.template_type}, ${tmpl.goal}, 1)
      `;
    }
    console.log(`✅ Seeded ${workoutTemplates.length} workout templates`);

    console.log('🎉 Seed complete!');
  } catch (error) {
    console.error('❌ Seed failed:', error);
    process.exit(1);
  } finally {
    await sql.close();
  }
}

seed();
