import { Document, Page, Text, View } from '@react-pdf/renderer';
import { pdfStyles, formatPdfDate } from '@/lib/pdf-utils';

interface Exercise {
  name: string;
  sets: string;
  reps: string;
  notes?: string;
  instructions?: string;
  muscleGroup?: string;
  equipment?: string;
  restTime?: string;
}

interface Day {
  name: string;
  dayNumber: number;
  exercises: Exercise[];
  notes?: string;
  focus?: string;
}

interface Week {
  weekNumber: number;
  name?: string;
  focus?: string;
  days: Day[];
}

interface WorkoutPlanData {
  name: string;
  description?: string;
  goal?: string;
  difficulty: string;
  daysPerWeek: number;
  durationWeeks?: number;
  templateType?: string;
  weeks: Week[];
  notes?: string;
  createdBy?: string;
  clientName?: string;
}

export function WorkoutPlanPdf({ data }: { data: WorkoutPlanData }) {
  const totalExercises = data.weeks.reduce(
    (sum, week) => sum + week.days.reduce((dSum, day) => dSum + day.exercises.length, 0),
    0
  );

  return (
    <Document>
      <Page size="A4" style={pdfStyles.page}>
        {/* Header */}
        <View style={pdfStyles.header}>
          <Text style={pdfStyles.title}>{data.name}</Text>
          {data.goal && <Text style={pdfStyles.subtitle}>Goal: {data.goal}</Text>}
          {data.clientName && (
            <Text style={{ fontSize: 10, color: '#6b7280', marginTop: 2 }}>
              Prepared for: {data.clientName}
            </Text>
          )}
          <Text style={pdfStyles.date}>Generated on {formatPdfDate(new Date())}</Text>
        </View>

        {/* Description */}
        {data.description && (
          <View style={pdfStyles.section}>
            <Text style={pdfStyles.sectionTitle}>Program Description</Text>
            <Text style={{ color: '#4b5563', fontSize: 10, lineHeight: 1.5 }}>
              {data.description}
            </Text>
          </View>
        )}

        {/* Overview */}
        <View style={pdfStyles.section}>
          <Text style={pdfStyles.sectionTitle}>Program Overview</Text>
          <View style={pdfStyles.statsGrid}>
            <View style={pdfStyles.statBox}>
              <Text style={pdfStyles.statValue}>{data.daysPerWeek}</Text>
              <Text style={pdfStyles.statLabel}>Days per Week</Text>
            </View>
            <View style={pdfStyles.statBox}>
              <Text style={pdfStyles.statValue}>{data.durationWeeks || '—'}</Text>
              <Text style={pdfStyles.statLabel}>Duration (Weeks)</Text>
            </View>
            <View style={pdfStyles.statBox}>
              <Text style={pdfStyles.statValue}>{data.difficulty}</Text>
              <Text style={pdfStyles.statLabel}>Difficulty</Text>
            </View>
            <View style={pdfStyles.statBox}>
              <Text style={pdfStyles.statValue}>{totalExercises}</Text>
              <Text style={pdfStyles.statLabel}>Total Exercises</Text>
            </View>
          </View>
          
          {data.templateType && (
            <View style={pdfStyles.row}>
              <Text style={pdfStyles.label}>Program Type</Text>
              <Text style={pdfStyles.value}>{data.templateType.replace(/_/g, ' ')}</Text>
            </View>
          )}
        </View>

        {/* Program Structure */}
        {data.weeks.map((week, weekIndex) => (
          <View key={weekIndex} style={pdfStyles.section} wrap={false}>
            <Text style={pdfStyles.sectionTitle}>
              Week {week.weekNumber}{week.name ? `: ${week.name}` : ''}
              {week.focus ? ` - ${week.focus}` : ''}
            </Text>
            
            {week.days.map((day, dayIndex) => (
              <View key={dayIndex} style={pdfStyles.mealCard}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                  <Text style={pdfStyles.mealTitle}>
                    Day {day.dayNumber}: {day.name}
                  </Text>
                  {day.focus && (
                    <Text style={{ fontSize: 9, color: '#6b7280', fontStyle: 'italic' }}>
                      Focus: {day.focus}
                    </Text>
                  )}
                </View>
                
                {day.exercises.length > 0 ? (
                  <View style={{ marginTop: 4 }}>
                    {/* Exercise Table Header */}
                    <View style={{ flexDirection: 'row', paddingVertical: 4, paddingHorizontal: 8, backgroundColor: '#e5e7eb', borderRadius: 4, marginBottom: 4 }}>
                      <Text style={{ flex: 2, fontSize: 8, fontWeight: 'bold', color: '#374151' }}>Exercise</Text>
                      <Text style={{ flex: 1, fontSize: 8, fontWeight: 'bold', color: '#374151', textAlign: 'center' }}>Sets × Reps</Text>
                      <Text style={{ flex: 1, fontSize: 8, fontWeight: 'bold', color: '#374151', textAlign: 'center' }}>Muscle</Text>
                      <Text style={{ flex: 1, fontSize: 8, fontWeight: 'bold', color: '#374151', textAlign: 'center' }}>Equipment</Text>
                    </View>
                    
                    {day.exercises.map((exercise, exIndex) => (
                      <View key={exIndex}>
                        <View style={pdfStyles.exerciseItem}>
                          <Text style={{ flex: 2, color: '#1f2937', fontSize: 9, fontWeight: 'bold' }}>
                            {exIndex + 1}. {exercise.name}
                          </Text>
                          <Text style={{ flex: 1, color: '#6b7280', fontSize: 9, textAlign: 'center' }}>
                            {exercise.sets} × {exercise.reps}
                          </Text>
                          <Text style={{ flex: 1, color: '#6b7280', fontSize: 8, textAlign: 'center' }}>
                            {exercise.muscleGroup?.replace(/_/g, ' ') || '—'}
                          </Text>
                          <Text style={{ flex: 1, color: '#6b7280', fontSize: 8, textAlign: 'center' }}>
                            {exercise.equipment?.replace(/_/g, ' ') || '—'}
                          </Text>
                        </View>
                        
                        {/* Exercise Instructions */}
                        {exercise.instructions && (
                          <View style={{ paddingHorizontal: 12, paddingBottom: 6 }}>
                            <Text style={{ fontSize: 8, color: '#4b5563', fontStyle: 'italic' }}>
                              Instructions: {exercise.instructions}
                            </Text>
                          </View>
                        )}
                        
                        {/* Exercise Notes */}
                        {exercise.notes && (
                          <View style={{ paddingHorizontal: 12, paddingBottom: 6 }}>
                            <Text style={{ fontSize: 8, color: '#6b7280' }}>
                              Note: {exercise.notes}
                            </Text>
                          </View>
                        )}
                        
                        {/* Rest Time */}
                        {exercise.restTime && (
                          <View style={{ paddingHorizontal: 12, paddingBottom: 6 }}>
                            <Text style={{ fontSize: 8, color: '#9ca3af' }}>
                              Rest: {exercise.restTime}
                            </Text>
                          </View>
                        )}
                      </View>
                    ))}
                  </View>
                ) : (
                  <Text style={{ color: '#9ca3af', fontSize: 9, fontStyle: 'italic' }}>
                    Rest Day - Recovery and regeneration
                  </Text>
                )}
                
                {day.notes && (
                  <Text style={{ color: '#6b7280', fontSize: 8, marginTop: 8, fontStyle: 'italic', paddingTop: 6, borderTopWidth: 1, borderTopColor: '#e5e7eb' }}>
                    Day Notes: {day.notes}
                  </Text>
                )}
              </View>
            ))}
          </View>
        ))}

        {/* General Notes */}
        {data.notes && (
          <View style={pdfStyles.section}>
            <Text style={pdfStyles.sectionTitle}>Program Notes</Text>
            <Text style={{ color: '#4b5563', fontSize: 10, lineHeight: 1.5 }}>
              {data.notes}
            </Text>
          </View>
        )}

        {/* Quick Reference - Exercise List */}
        <View style={pdfStyles.section} wrap={false}>
          <Text style={pdfStyles.sectionTitle}>Quick Reference - All Exercises</Text>
          <View style={{ marginTop: 8 }}>
            {data.weeks.flatMap((week) => 
              week.days.flatMap((day) => 
                day.exercises.map((ex) => ex.name)
              )
            ).filter((name, index, self) => self.indexOf(name) === index)
            .map((exerciseName, index) => (
              <Text key={index} style={{ fontSize: 9, color: '#4b5563', paddingVertical: 2 }}>
                • {exerciseName}
              </Text>
            ))}
          </View>
        </View>

        {/* Footer */}
        <Text style={pdfStyles.footer}>
          CustomCoachPro - Workout Plan • {formatPdfDate(new Date())}
          {data.createdBy && ` • Created by ${data.createdBy}`}
        </Text>
      </Page>
    </Document>
  );
}