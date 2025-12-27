import checkInService, { CreateCheckInPayload, CheckIn } from "./checkInService";
import dietPlanService from "./dietPlanService";
import workoutPlanService from "./workoutPlanService";
import type { ClientDietPlan, ClientWorkoutPlan, DietPlan, WorkoutPlan } from "@/types";

export type AssignedPlan<TAssignment, TPlan> = {
  assignment: TAssignment | null;
  plan: TPlan | null;
};

const getActiveAssignment = <T extends { isActive: boolean }>(assignments: T[]) =>
  assignments.find((assignment) => assignment.isActive) ?? assignments[0] ?? null;

const clientPortalService = {
  async getAssignedWorkoutPlan(clientId: string): Promise<AssignedPlan<ClientWorkoutPlan, WorkoutPlan>> {
    const assignments = await workoutPlanService.listForClient(clientId);
    const assignment = getActiveAssignment(assignments);
    const plan = assignment ? await workoutPlanService.get(assignment.workoutPlanId) : null;

    return { assignment: assignment ?? null, plan };
  },

  async getAssignedDietPlan(clientId: string): Promise<AssignedPlan<ClientDietPlan, DietPlan>> {
    const assignments = await dietPlanService.listForClient(clientId);
    const assignment = getActiveAssignment(assignments);
    const plan = assignment ? await dietPlanService.get(assignment.dietPlanId) : null;

    return { assignment: assignment ?? null, plan };
  },

  async getCheckIns(): Promise<CheckIn[]> {
    return checkInService.getCheckIns();
  },

  async submitCheckIn(payload: CreateCheckInPayload): Promise<CheckIn> {
    return checkInService.createCheckIn(payload);
  },
};

export default clientPortalService;
