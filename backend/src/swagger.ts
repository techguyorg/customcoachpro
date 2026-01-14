import swaggerJsdoc from 'swagger-jsdoc';
import { config } from './config';

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'CustomCoachPro API',
      version: '1.0.0',
      description: 'Complete API documentation for CustomCoachPro fitness platform',
      contact: {
        name: 'CustomCoachPro Support',
        email: 's.susheel9@gmail.com',
      },
    },
    servers: [
      {
        url: 'https://customcoachpro-api.azurewebsites.net',
        description: 'Production',
      },
      {
        url: `http://localhost:${config.port}`,
        description: 'Development (localhost)',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
      schemas: {
        Error: {
          type: 'object',
          properties: {
            error: { type: 'string' },
            message: { type: 'string' },
          },
        },
        User: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            email: { type: 'string', format: 'email' },
            full_name: { type: 'string' },
            roles: { type: 'array', items: { type: 'string' } },
            email_verified: { type: 'boolean' },
          },
        },
        Exercise: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            name: { type: 'string' },
            description: { type: 'string' },
            primary_muscle: { type: 'string' },
            secondary_muscles: { type: 'array', items: { type: 'string' } },
            equipment: { type: 'string' },
            difficulty: { type: 'string', enum: ['beginner', 'intermediate', 'advanced'] },
            instructions: { type: 'array', items: { type: 'string' } },
            tips: { type: 'array', items: { type: 'string' } },
            common_mistakes: { type: 'array', items: { type: 'string' } },
            video_url: { type: 'string' },
            is_system: { type: 'boolean' },
          },
        },
        WorkoutTemplate: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            name: { type: 'string' },
            description: { type: 'string' },
            difficulty: { type: 'string' },
            duration_weeks: { type: 'integer' },
            days_per_week: { type: 'integer' },
            goal: { type: 'string' },
            is_system: { type: 'boolean' },
          },
        },
        Food: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            name: { type: 'string' },
            category: { type: 'string' },
            calories_per_100g: { type: 'number' },
            protein_per_100g: { type: 'number' },
            carbs_per_100g: { type: 'number' },
            fat_per_100g: { type: 'number' },
            is_system: { type: 'boolean' },
          },
        },
        DietPlan: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            name: { type: 'string' },
            description: { type: 'string' },
            calories_target: { type: 'integer' },
            protein_grams: { type: 'integer' },
            carbs_grams: { type: 'integer' },
            fat_grams: { type: 'integer' },
            is_system: { type: 'boolean' },
          },
        },
        Recipe: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            name: { type: 'string' },
            description: { type: 'string' },
            prep_time_minutes: { type: 'integer' },
            cook_time_minutes: { type: 'integer' },
            servings: { type: 'integer' },
            calories_per_serving: { type: 'number' },
            is_system: { type: 'boolean' },
          },
        },
        AuthResponse: {
          type: 'object',
          properties: {
            user: { $ref: '#/components/schemas/User' },
            accessToken: { type: 'string' },
            refreshToken: { type: 'string' },
          },
        },
      },
    },
    tags: [
      { name: 'Auth', description: 'Authentication endpoints' },
      { name: 'Exercises', description: 'Exercise management' },
      { name: 'Workouts', description: 'Workout templates and programs' },
      { name: 'Diet', description: 'Diet plans management' },
      { name: 'Foods', description: 'Food database' },
      { name: 'Recipes', description: 'Recipe management' },
      { name: 'Users', description: 'User profiles and management' },
      { name: 'Coach', description: 'Coach-specific endpoints' },
      { name: 'Client', description: 'Client-specific endpoints' },
      { name: 'Admin', description: 'Admin-only endpoints' },
    ],
  },
  apis: ['./src/routes/*.ts', './dist/routes/*.js'],
};

export const swaggerSpec = swaggerJsdoc(options);
