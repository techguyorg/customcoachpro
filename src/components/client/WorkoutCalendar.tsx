import { useState } from "react";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import { format, isSameDay, startOfMonth, endOfMonth, eachDayOfInterval } from "date-fns";
import { useWorkoutLogs } from "@/hooks/useWorkoutLogs";
import { useActiveAssignments } from "@/hooks/usePlanAssignments";
import { Dumbbell, Clock, CheckCircle, ChevronLeft, ChevronRight } from "lucide-react";
import { Link } from "react-router-dom";

interface WorkoutCalendarProps {
  className?: string;
}

export function WorkoutCalendar({ className }: WorkoutCalendarProps) {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>();
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [sheetOpen, setSheetOpen] = useState(false);
  
  const { data: workoutLogs = [] } = useWorkoutLogs();
  const activeAssignments = useActiveAssignments();
  
  const activeWorkoutPlan = activeAssignments?.find(a => a.plan_type === "workout");
  
  // Get workouts for the selected date
  const getWorkoutsForDate = (date: Date) => {
    return workoutLogs.filter(log => 
      isSameDay(new Date(log.workout_date), date)
    );
  };
  
  // Get planned workout days based on program
  const getPlannedDays = () => {
    if (!activeWorkoutPlan?.workout_template) return [];
    const daysPerWeek = activeWorkoutPlan.workout_template.days_per_week || 3;
    const startDate = new Date(activeWorkoutPlan.start_date);
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(currentMonth);
    
    // Generate planned days based on program schedule
    const plannedDays: Date[] = [];
    const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });
    
    daysInMonth.forEach((day, index) => {
      // Simple logic: plan workouts on first N days of each week
      const dayOfWeek = day.getDay();
      if (dayOfWeek > 0 && dayOfWeek <= daysPerWeek && day >= startDate) {
        plannedDays.push(day);
      }
    });
    
    return plannedDays;
  };
  
  const plannedDays = getPlannedDays();
  
  // Custom modifiers for the calendar
  const completedDates = workoutLogs
    .filter(log => log.status === "completed")
    .map(log => new Date(log.workout_date));
  
  const inProgressDates = workoutLogs
    .filter(log => log.status === "in_progress")
    .map(log => new Date(log.workout_date));
  
  const handleDateClick = (date: Date | undefined) => {
    if (date) {
      setSelectedDate(date);
      const workouts = getWorkoutsForDate(date);
      if (workouts.length > 0) {
        setSheetOpen(true);
      }
    }
  };
  
  const selectedDateWorkouts = selectedDate ? getWorkoutsForDate(selectedDate) : [];
  
  // Check if a date has workouts or is planned
  const isCompletedDay = (date: Date) => 
    completedDates.some(d => isSameDay(d, date));
  
  const isPlannedDay = (date: Date) => 
    plannedDays.some(d => isSameDay(d, date)) && !isCompletedDay(date);

  return (
    <>
      <Card className={className}>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">Workout Calendar</CardTitle>
            <div className="flex items-center gap-1">
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-7 w-7"
                onClick={() => setCurrentMonth(prev => new Date(prev.getFullYear(), prev.getMonth() - 1))}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="text-sm font-medium min-w-[100px] text-center">
                {format(currentMonth, "MMMM yyyy")}
              </span>
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-7 w-7"
                onClick={() => setCurrentMonth(prev => new Date(prev.getFullYear(), prev.getMonth() + 1))}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <Calendar
            mode="single"
            selected={selectedDate}
            onSelect={handleDateClick}
            month={currentMonth}
            onMonthChange={setCurrentMonth}
            className="p-0 pointer-events-auto"
            modifiers={{
              completed: completedDates,
              inProgress: inProgressDates,
              planned: plannedDays.filter(d => !isCompletedDay(d)),
            }}
            modifiersStyles={{
              completed: {
                backgroundColor: "hsl(var(--primary) / 0.2)",
                color: "hsl(var(--primary))",
                fontWeight: "bold",
              },
              inProgress: {
                backgroundColor: "hsl(var(--warning) / 0.2)",
                color: "hsl(var(--warning))",
              },
              planned: {
                border: "2px dashed hsl(var(--muted-foreground) / 0.3)",
              },
            }}
          />
          
          {/* Legend */}
          <div className="flex flex-wrap gap-3 mt-4 pt-3 border-t border-border text-xs text-muted-foreground">
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded-full bg-primary/20 border-2 border-primary" />
              <span>Completed</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded-full border-2 border-dashed border-muted-foreground/30" />
              <span>Planned</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded-full bg-warning/20 border-2 border-warning" />
              <span>In Progress</span>
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Workout Detail Sheet */}
      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent>
          <SheetHeader>
            <SheetTitle className="flex items-center gap-2">
              <Dumbbell className="h-5 w-5" />
              {selectedDate && format(selectedDate, "EEEE, MMMM d")}
            </SheetTitle>
          </SheetHeader>
          
          <ScrollArea className="h-[calc(100vh-120px)] mt-4">
            <div className="space-y-4">
              {selectedDateWorkouts.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Dumbbell className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p>No workouts on this day</p>
                </div>
              ) : (
                selectedDateWorkouts.map(workout => (
                  <Card key={workout.id}>
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h4 className="font-medium">Workout Session</h4>
                          <p className="text-sm text-muted-foreground">
                            {workout.started_at && format(new Date(workout.started_at), "h:mm a")}
                          </p>
                        </div>
                        <Badge 
                          variant={workout.status === "completed" ? "default" : "secondary"}
                          className="capitalize"
                        >
                          {workout.status === "completed" && <CheckCircle className="h-3 w-3 mr-1" />}
                          {workout.status}
                        </Badge>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-3 text-sm">
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Clock className="h-4 w-4" />
                          <span>{workout.duration_minutes || 0} min</span>
                        </div>
                        {workout.perceived_effort && (
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <span>Effort: {workout.perceived_effort}/10</span>
                          </div>
                        )}
                      </div>
                      
                      {workout.notes && (
                        <p className="text-sm text-muted-foreground mt-3 pt-3 border-t">
                          {workout.notes}
                        </p>
                      )}
                      
                      {workout.status === "in_progress" && (
                        <Link to={`/client/workouts/${workout.id}`}>
                          <Button className="w-full mt-3" size="sm">
                            Continue Workout
                          </Button>
                        </Link>
                      )}
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </ScrollArea>
        </SheetContent>
      </Sheet>
    </>
  );
}
