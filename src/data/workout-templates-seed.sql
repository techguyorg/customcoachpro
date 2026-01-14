-- ============================================================================
-- COMPLETE WORKOUT TEMPLATES SEED FILE
-- 135 Templates with Full Programming (Weeks, Days, Exercises)
-- ============================================================================
-- 
-- STRUCTURE:
-- 1. 135 Workout Templates (15 per category × 9 categories)
-- 2. Weeks for each template (1-12 weeks depending on program)
-- 3. Days for each week (3-6 days depending on split)
-- 4. Exercises for each day (4-8 exercises with sets, reps, rest, notes)
--
-- CATEGORIES (15 templates each):
-- 1. Push Pull Legs (PPL) - 6 days/week
-- 2. Upper Lower - 4 days/week
-- 3. Full Body - 3 days/week
-- 4. Bro Split - 5 days/week
-- 5. Strength - 3-4 days/week
-- 6. Hypertrophy - 4-5 days/week
-- 7. Sport Specific - 4 days/week
-- 8. Bodyweight - 3-4 days/week
-- 9. Functional - 3 days/week
--
-- ============================================================================

-- ============================================================================
-- PART 1: INSERT ALL 135 TEMPLATES
-- ============================================================================

-- ----- PPL TEMPLATES (15) -----
INSERT INTO workout_templates (name, description, goal, days_per_week, duration_weeks, difficulty, template_type, is_periodized, is_system) VALUES
('PPL Beginner Foundation', 'Perfect introduction to the Push/Pull/Legs split. Focus on mastering compound movements with moderate volume. Ideal for those new to structured training.', 'Build strength foundation and muscle memory', 6, 8, 'beginner', 'push_pull_legs', false, true),
('PPL Strength Builder', 'Progressive overload focused PPL targeting strength gains. Lower rep ranges with longer rest periods for maximum force production.', 'Maximize strength on compound lifts', 6, 10, 'intermediate', 'push_pull_legs', true, true),
('PPL Hypertrophy Focus', 'High-volume PPL designed for maximum muscle growth. Emphasis on time under tension and metabolic stress.', 'Build maximum muscle mass', 6, 12, 'intermediate', 'push_pull_legs', true, true),
('PPL Powerbuilding', 'Combines heavy compound work with hypertrophy accessories. Best of both worlds - strength and size.', 'Build strength and muscle simultaneously', 6, 12, 'intermediate', 'push_pull_legs', true, true),
('PPL Advanced Volume', 'High frequency, high volume program for experienced lifters. Requires excellent recovery capacity.', 'Break through plateaus with volume', 6, 8, 'advanced', 'push_pull_legs', true, true),
('PPL Fat Loss', 'PPL structured with shorter rest periods and supersets for metabolic conditioning while maintaining muscle.', 'Lose fat while preserving muscle', 6, 8, 'intermediate', 'push_pull_legs', false, true),
('PPL Home Gym', 'Full PPL program using only dumbbells, pull-up bar, and bench. No machines required.', 'Build muscle with minimal equipment', 6, 12, 'intermediate', 'push_pull_legs', false, true),
('PPL Athletic Performance', 'Explosive power and strength with athletic carryover. Includes plyometrics and speed work.', 'Improve athletic performance', 6, 8, 'intermediate', 'push_pull_legs', true, true),
('PPL Competition Prep', 'Peaking program for powerlifting competition. Intensity increases as volume decreases.', 'Peak strength for competition', 6, 12, 'advanced', 'push_pull_legs', true, true),
('PPL Over 40', 'Joint-friendly PPL with emphasis on warm-ups, mobility, and recovery. Lower impact exercise selection.', 'Build strength safely for mature lifters', 6, 12, 'intermediate', 'push_pull_legs', false, true),
('PPL Women Strength', 'PPL optimized for female physiology with glute emphasis and balanced upper body development.', 'Build feminine strength and curves', 6, 12, 'intermediate', 'push_pull_legs', false, true),
('PPL Minimalist', 'Efficient PPL with only 4-5 exercises per day. Maximum results with minimum time investment.', 'Build muscle efficiently', 6, 8, 'beginner', 'push_pull_legs', false, true),
('PPL Bodybuilding', 'Classic bodybuilding PPL with peak contraction focus and isolation work for competition prep.', 'Develop competition-ready physique', 6, 16, 'advanced', 'push_pull_legs', true, true),
('PPL Strength-Endurance', 'Higher rep ranges with compound movements for muscular endurance and work capacity.', 'Build strength endurance', 6, 8, 'intermediate', 'push_pull_legs', false, true),
('PPL Teen Athlete', 'Age-appropriate PPL for teenagers focusing on proper form and progressive development.', 'Safe strength development for teens', 6, 12, 'beginner', 'push_pull_legs', false, true);

-- ----- UPPER LOWER TEMPLATES (15) -----
INSERT INTO workout_templates (name, description, goal, days_per_week, duration_weeks, difficulty, template_type, is_periodized, is_system) VALUES
('Upper Lower Classic', 'Time-tested 4-day split alternating upper and lower body. Perfect balance of frequency and recovery.', 'Build balanced strength and muscle', 4, 12, 'intermediate', 'upper_lower', false, true),
('Upper Lower Strength', 'Heavy compound focus with 5x5 and 3x5 rep schemes. Build raw strength efficiently.', 'Maximize strength gains', 4, 10, 'intermediate', 'upper_lower', true, true),
('Upper Lower Hypertrophy', 'Higher volume variation focusing on muscle growth with moderate weights.', 'Maximize muscle hypertrophy', 4, 12, 'intermediate', 'upper_lower', true, true),
('Upper Lower Beginner', 'Introduction to the upper/lower split with focus on learning movement patterns.', 'Build foundation for beginners', 4, 8, 'beginner', 'upper_lower', false, true),
('Upper Lower Power', 'Explosive power development with Olympic lift variations and plyometrics.', 'Develop explosive power', 4, 8, 'advanced', 'upper_lower', true, true),
('Upper Lower Fat Loss', 'Metabolic conditioning with supersets and circuits while maintaining strength.', 'Burn fat while building muscle', 4, 8, 'intermediate', 'upper_lower', false, true),
('Upper Lower 5-Day', 'Extended upper/lower with extra arm day for those wanting more training frequency.', 'Maximum development with extra recovery', 5, 12, 'intermediate', 'upper_lower', false, true),
('Upper Lower Powerlifting', 'Competition prep program with squat, bench, deadlift focus and accessories.', 'Prepare for powerlifting meet', 4, 12, 'advanced', 'upper_lower', true, true),
('Upper Lower Home Gym', 'Complete upper/lower using dumbbells and basic equipment only.', 'Build muscle at home', 4, 12, 'intermediate', 'upper_lower', false, true),
('Upper Lower Athletic', 'Sport-focused with emphasis on functional movements and athleticism.', 'Improve athletic performance', 4, 8, 'intermediate', 'upper_lower', true, true),
('Upper Lower Minimalist', 'Only 3 exercises per session for busy schedules. Maximum efficiency.', 'Efficient strength building', 4, 8, 'beginner', 'upper_lower', false, true),
('Upper Lower Women', 'Female-optimized with glute emphasis on lower days and balanced upper development.', 'Build feminine strength', 4, 12, 'intermediate', 'upper_lower', false, true),
('Upper Lower Over 40', 'Joint-friendly variation with emphasis on recovery and sustainable progress.', 'Safe strength for mature lifters', 4, 12, 'intermediate', 'upper_lower', false, true),
('Upper Lower Mass Builder', 'High volume accumulation phase for maximum muscle growth.', 'Pack on serious muscle mass', 4, 12, 'advanced', 'upper_lower', true, true),
('Upper Lower Deload', 'Reduced intensity and volume for active recovery between training blocks.', 'Recovery and rejuvenation', 4, 4, 'beginner', 'upper_lower', false, true);

-- ----- FULL BODY TEMPLATES (15) -----
INSERT INTO workout_templates (name, description, goal, days_per_week, duration_weeks, difficulty, template_type, is_periodized, is_system) VALUES
('Full Body 3x Beginner', 'Classic 3-day full body for beginners. Each session trains every muscle group.', 'Build total body strength', 3, 8, 'beginner', 'full_body', false, true),
('Full Body Strength', 'Heavy compound movements 3x per week. Perfect for building raw strength.', 'Maximize strength on all lifts', 3, 10, 'intermediate', 'full_body', true, true),
('Full Body Hypertrophy', 'Higher volume full body for muscle growth. Great muscle protein synthesis frequency.', 'Build muscle with high frequency', 3, 12, 'intermediate', 'full_body', true, true),
('Full Body 5x5', 'Classic 5x5 program hitting major lifts each session. Time-tested strength builder.', 'Build foundational strength', 3, 12, 'intermediate', 'full_body', true, true),
('Full Body Minimalist', 'Just 3-4 compound movements per session. Maximum results, minimum time.', 'Efficient strength building', 3, 8, 'beginner', 'full_body', false, true),
('Full Body Home', 'Complete training with bodyweight and dumbbells only. No gym required.', 'Train effectively at home', 3, 12, 'beginner', 'full_body', false, true),
('Full Body Athletic', 'Performance-focused with power and agility components.', 'Build athletic performance', 3, 8, 'intermediate', 'full_body', true, true),
('Full Body Fat Loss', 'Metabolic full body circuits for maximum calorie burn.', 'Burn fat and build muscle', 3, 8, 'intermediate', 'full_body', false, true),
('Full Body Advanced', 'High frequency, high intensity for experienced lifters only.', 'Break through plateaus', 4, 8, 'advanced', 'full_body', true, true),
('Full Body Women', 'Female-focused full body with balanced development and glute emphasis.', 'Build feminine strength', 3, 12, 'beginner', 'full_body', false, true),
('Full Body Senior', 'Low impact, joint-friendly full body for older adults.', 'Maintain strength and mobility', 3, 12, 'beginner', 'full_body', false, true),
('Full Body Kettlebell', 'Complete training using only kettlebells. Great for conditioning.', 'Functional strength and conditioning', 3, 8, 'intermediate', 'full_body', false, true),
('Full Body Powerbuilding', 'Combine strength and size with heavy compounds plus accessories.', 'Build strength and muscle', 3, 12, 'intermediate', 'full_body', true, true),
('Full Body Maintenance', 'Minimal effective dose to maintain gains during busy periods.', 'Maintain muscle and strength', 2, 8, 'beginner', 'full_body', false, true),
('Full Body Teen', 'Age-appropriate training for teenagers with proper progression.', 'Safe development for teens', 3, 12, 'beginner', 'full_body', false, true);

-- ----- BRO SPLIT TEMPLATES (15) -----
INSERT INTO workout_templates (name, description, goal, days_per_week, duration_weeks, difficulty, template_type, is_periodized, is_system) VALUES
('Classic Bro Split', 'Traditional 5-day split: Chest, Back, Shoulders, Arms, Legs. One muscle group per day.', 'Maximum muscle development', 5, 12, 'intermediate', 'bro_split', false, true),
('Bro Split Hypertrophy', 'High volume bodybuilding split for maximum muscle growth.', 'Build serious muscle mass', 5, 12, 'intermediate', 'bro_split', true, true),
('Bro Split Beginner', 'Introduction to bodybuilding-style training with moderate volume.', 'Learn muscle isolation techniques', 5, 8, 'beginner', 'bro_split', false, true),
('Bro Split Advanced', 'Extreme volume for advanced bodybuilders. Multiple techniques per session.', 'Competition-level development', 5, 16, 'advanced', 'bro_split', true, true),
('Bro Split Strength', 'Heavier weights, lower reps. Build strength with bodybuilding split.', 'Build strength with isolation', 5, 12, 'intermediate', 'bro_split', true, true),
('Bro Split 6-Day', 'Extended split with separate arm day for maximum development.', 'Ultimate muscle development', 6, 12, 'advanced', 'bro_split', false, true),
('Bro Split Fat Loss', 'Higher rep ranges with supersets for fat loss while maintaining muscle.', 'Get shredded', 5, 8, 'intermediate', 'bro_split', false, true),
('Bro Split Home Gym', 'Complete bro split using dumbbells and basic equipment.', 'Build muscle at home', 5, 12, 'intermediate', 'bro_split', false, true),
('Bro Split Classic Physique', 'Golden era bodybuilding inspired training for aesthetic development.', 'Build classic aesthetic physique', 5, 16, 'intermediate', 'bro_split', true, true),
('Bro Split Women', 'Female-focused split with emphasis on glutes and balanced development.', 'Build feminine physique', 5, 12, 'intermediate', 'bro_split', false, true),
('Bro Split Arms Focus', 'Extra arm volume for those wanting bigger biceps and triceps.', 'Build impressive arms', 5, 8, 'intermediate', 'bro_split', false, true),
('Bro Split Back Focus', 'Emphasis on building a wider, thicker back with detail work.', 'Build an impressive back', 5, 12, 'intermediate', 'bro_split', false, true),
('Bro Split Chest Focus', 'Extra chest work for complete pec development.', 'Build a bigger chest', 5, 8, 'intermediate', 'bro_split', false, true),
('Bro Split Shoulder Focus', 'Emphasis on building 3D delts with all three heads.', 'Build impressive shoulders', 5, 8, 'intermediate', 'bro_split', false, true),
('Bro Split Leg Focus', 'Extra leg volume for building impressive wheels.', 'Build massive legs', 5, 12, 'intermediate', 'bro_split', false, true);

-- ----- STRENGTH TEMPLATES (15) -----
INSERT INTO workout_templates (name, description, goal, days_per_week, duration_weeks, difficulty, template_type, is_periodized, is_system) VALUES
('5x5 Strength', 'Classic 5x5 on compound movements. Simple, effective, proven.', 'Build foundational strength', 3, 12, 'intermediate', 'strength', true, true),
('5/3/1 Classic', 'Jim Wendler inspired periodization for consistent strength gains.', 'Systematic strength progression', 4, 12, 'intermediate', 'strength', true, true),
('Starting Strength', 'Linear progression for beginners. Add weight every session.', 'Rapid beginner gains', 3, 8, 'beginner', 'strength', false, true),
('Texas Method', 'Volume, recovery, intensity weekly undulation for intermediates.', 'Break through plateaus', 3, 12, 'intermediate', 'strength', true, true),
('Powerlifting Prep', 'Competition prep with peaking for squat, bench, deadlift.', 'Peak for powerlifting meet', 4, 12, 'advanced', 'strength', true, true),
('Strength Minimalist', 'Only the essential lifts for maximum strength with minimum time.', 'Efficient strength building', 3, 8, 'intermediate', 'strength', false, true),
('Conjugate Light', 'Simplified conjugate method for variety and continuous progress.', 'Build well-rounded strength', 4, 12, 'advanced', 'strength', false, true),
('Strength for Athletes', 'Functional strength with sport carryover.', 'Athletic strength development', 3, 8, 'intermediate', 'strength', true, true),
('Strength Over 40', 'Joint-friendly strength training for mature lifters.', 'Build strength safely', 3, 12, 'intermediate', 'strength', false, true),
('Deadlift Specialization', 'Focus on building a massive deadlift.', 'Maximize deadlift strength', 3, 8, 'intermediate', 'strength', true, true),
('Squat Specialization', 'Focus on building a bigger squat.', 'Maximize squat strength', 3, 8, 'intermediate', 'strength', true, true),
('Bench Specialization', 'Focus on building a bigger bench press.', 'Maximize bench strength', 4, 8, 'intermediate', 'strength', true, true),
('Strength Endurance', 'Higher reps on compound movements for work capacity.', 'Build strength endurance', 3, 8, 'intermediate', 'strength', false, true),
('Strength Women', 'Female-optimized strength training with balanced development.', 'Build feminine strength', 3, 12, 'intermediate', 'strength', false, true),
('Strength Teen', 'Safe, progressive strength training for teenagers.', 'Age-appropriate strength', 3, 12, 'beginner', 'strength', false, true);

-- ----- HYPERTROPHY TEMPLATES (15) -----
INSERT INTO workout_templates (name, description, goal, days_per_week, duration_weeks, difficulty, template_type, is_periodized, is_system) VALUES
('Hypertrophy Foundation', 'Moderate volume muscle building for consistent growth.', 'Build muscle mass', 4, 12, 'intermediate', 'hypertrophy', true, true),
('Hypertrophy High Volume', 'Maximum volume for experienced lifters. High training capacity required.', 'Maximum muscle growth', 5, 12, 'advanced', 'hypertrophy', true, true),
('Hypertrophy Beginner', 'Introduction to muscle building with progressive volume.', 'Start building muscle', 3, 8, 'beginner', 'hypertrophy', false, true),
('Hypertrophy Science-Based', 'Evidence-based approach with optimal volume per muscle group.', 'Optimize muscle growth', 4, 12, 'intermediate', 'hypertrophy', true, true),
('Hypertrophy Time Under Tension', 'Slow eccentrics and pauses for maximum muscle tension.', 'Build muscle with TUT', 4, 8, 'intermediate', 'hypertrophy', false, true),
('Hypertrophy Drop Sets', 'Intensive techniques with drop sets and rest-pause.', 'Intensify muscle growth', 4, 8, 'advanced', 'hypertrophy', false, true),
('Hypertrophy Giant Sets', 'Giant sets for metabolic stress and pump.', 'Maximum muscle pump', 4, 8, 'advanced', 'hypertrophy', false, true),
('Hypertrophy Home', 'Build muscle with limited equipment at home.', 'Build muscle at home', 4, 12, 'intermediate', 'hypertrophy', false, true),
('Hypertrophy Arm Specialization', 'Extra arm volume for maximum bicep and tricep growth.', 'Build bigger arms', 4, 8, 'intermediate', 'hypertrophy', false, true),
('Hypertrophy Back Specialization', 'Focus on building a wider, thicker back.', 'Build an impressive back', 4, 8, 'intermediate', 'hypertrophy', false, true),
('Hypertrophy Chest Specialization', 'Extra chest work for full pec development.', 'Build a bigger chest', 4, 8, 'intermediate', 'hypertrophy', false, true),
('Hypertrophy Leg Specialization', 'Maximum quad, hamstring, and glute development.', 'Build impressive legs', 4, 8, 'intermediate', 'hypertrophy', false, true),
('Hypertrophy Women', 'Female-focused muscle building with balanced development.', 'Build feminine muscle', 4, 12, 'intermediate', 'hypertrophy', false, true),
('Hypertrophy Metabolic', 'Short rest periods for metabolic conditioning with muscle growth.', 'Build muscle and conditioning', 4, 8, 'intermediate', 'hypertrophy', false, true),
('Hypertrophy Mature Athlete', 'Joint-friendly muscle building for those over 40.', 'Build muscle safely', 4, 12, 'intermediate', 'hypertrophy', false, true);

-- ----- SPORT SPECIFIC TEMPLATES (15) -----
INSERT INTO workout_templates (name, description, goal, days_per_week, duration_weeks, difficulty, template_type, is_periodized, is_system) VALUES
('Athletic Performance', 'Build explosive power, speed, and agility for any sport.', 'Improve overall athleticism', 4, 8, 'intermediate', 'sport_specific', true, true),
('Football/Rugby Strength', 'Build size, strength, and power for contact sports.', 'Dominate on the field', 4, 12, 'intermediate', 'sport_specific', true, true),
('Basketball Performance', 'Vertical jump, lateral quickness, and endurance for basketball.', 'Improve basketball performance', 4, 8, 'intermediate', 'sport_specific', true, true),
('Soccer Conditioning', 'Endurance, speed, and leg strength for soccer players.', 'Excel on the pitch', 4, 8, 'intermediate', 'sport_specific', true, true),
('Combat Sports', 'Strength, power, and conditioning for MMA, boxing, wrestling.', 'Fight-ready conditioning', 4, 12, 'advanced', 'sport_specific', true, true),
('Golf Performance', 'Rotational power and stability for golf.', 'Add distance and consistency', 3, 8, 'beginner', 'sport_specific', false, true),
('Tennis Performance', 'Shoulder health, rotational power, and agility for tennis.', 'Improve on-court performance', 4, 8, 'intermediate', 'sport_specific', true, true),
('Swimming Performance', 'Shoulder stability, pulling strength, and core for swimmers.', 'Faster in the pool', 4, 8, 'intermediate', 'sport_specific', true, true),
('Running Performance', 'Strength training for distance runners.', 'Run faster, reduce injury', 3, 8, 'intermediate', 'sport_specific', false, true),
('Cycling Performance', 'Leg strength and power for cyclists.', 'More power on the bike', 3, 8, 'intermediate', 'sport_specific', false, true),
('CrossFit Prep', 'Build GPP for CrossFit-style workouts.', 'Improve WOD performance', 4, 8, 'intermediate', 'sport_specific', true, true),
('Obstacle Course Racing', 'Grip strength, endurance, and functional fitness for OCR.', 'Conquer any obstacle', 4, 12, 'intermediate', 'sport_specific', true, true),
('Volleyball Performance', 'Vertical jump and shoulder health for volleyball.', 'Jump higher, hit harder', 4, 8, 'intermediate', 'sport_specific', true, true),
('Baseball/Softball', 'Rotational power and arm health for baseball/softball.', 'Improve throwing and hitting', 4, 8, 'intermediate', 'sport_specific', true, true),
('Hockey Performance', 'Leg power, core stability, and conditioning for hockey.', 'Dominate on the ice', 4, 12, 'intermediate', 'sport_specific', true, true);

-- ----- BODYWEIGHT TEMPLATES (15) -----
INSERT INTO workout_templates (name, description, goal, days_per_week, duration_weeks, difficulty, template_type, is_periodized, is_system) VALUES
('Calisthenics Fundamentals', 'Master basic bodyweight movements progressively.', 'Build bodyweight strength', 4, 12, 'beginner', 'bodyweight', true, true),
('Calisthenics Intermediate', 'Progress to harder variations and skills.', 'Advance bodyweight skills', 4, 12, 'intermediate', 'bodyweight', true, true),
('Calisthenics Advanced', 'Work towards muscle-ups, planches, and levers.', 'Master advanced skills', 4, 16, 'advanced', 'bodyweight', true, true),
('Bodyweight Strength', 'Build strength with progressive bodyweight movements.', 'Build strength without weights', 4, 12, 'intermediate', 'bodyweight', true, true),
('Bodyweight Hypertrophy', 'High volume bodyweight for muscle growth.', 'Build muscle with bodyweight', 4, 12, 'intermediate', 'bodyweight', false, true),
('Bodyweight Home', 'Complete training with no equipment needed.', 'Train anywhere', 4, 12, 'beginner', 'bodyweight', false, true),
('Bodyweight Fat Loss', 'High intensity bodyweight circuits for fat burning.', 'Burn fat with bodyweight', 4, 8, 'intermediate', 'bodyweight', false, true),
('Bodyweight Pull-Up Focus', 'Specialization for improving pull-up strength and reps.', 'Master the pull-up', 4, 8, 'intermediate', 'bodyweight', true, true),
('Bodyweight Push-Up Focus', 'Progress push-up variations from basic to advanced.', 'Master push-up variations', 4, 8, 'intermediate', 'bodyweight', true, true),
('Bodyweight Core', 'Build an incredibly strong and stable core.', 'Develop core strength', 4, 8, 'intermediate', 'bodyweight', false, true),
('Bodyweight Mobility', 'Combine strength with flexibility and mobility work.', 'Build mobile strength', 3, 12, 'beginner', 'bodyweight', false, true),
('Bodyweight Hotel/Travel', 'Complete workouts for when you are traveling.', 'Stay fit on the road', 3, 8, 'beginner', 'bodyweight', false, true),
('Bodyweight Women', 'Female-focused bodyweight training with balanced development.', 'Build feminine strength', 4, 12, 'beginner', 'bodyweight', false, true),
('Bodyweight Senior', 'Low impact bodyweight for older adults.', 'Maintain strength and mobility', 3, 12, 'beginner', 'bodyweight', false, true),
('Bodyweight Teen', 'Age-appropriate bodyweight training for teenagers.', 'Safe development for teens', 4, 12, 'beginner', 'bodyweight', false, true);

-- ----- FUNCTIONAL TEMPLATES (15) -----
INSERT INTO workout_templates (name, description, goal, days_per_week, duration_weeks, difficulty, template_type, is_periodized, is_system) VALUES
('Functional Fitness Foundation', 'Train movement patterns for real-world strength.', 'Build functional strength', 3, 8, 'beginner', 'functional', false, true),
('Functional Strength', 'Heavy functional movements for maximum strength.', 'Build real-world strength', 3, 12, 'intermediate', 'functional', true, true),
('Functional Conditioning', 'Combine strength and cardio for complete fitness.', 'Build strength and conditioning', 3, 8, 'intermediate', 'functional', false, true),
('Functional Kettlebell', 'Complete training using primarily kettlebells.', 'Build functional fitness', 3, 8, 'intermediate', 'functional', false, true),
('Functional Core Focus', 'Emphasis on core stability and anti-rotation strength.', 'Build a bulletproof core', 3, 8, 'intermediate', 'functional', false, true),
('Functional Balance', 'Improve balance and stability while building strength.', 'Build balance and strength', 3, 8, 'beginner', 'functional', false, true),
('Functional Movement Screen', 'Address movement deficiencies while building strength.', 'Correct and strengthen', 3, 8, 'beginner', 'functional', false, true),
('Functional Everyday', 'Train for the demands of daily life.', 'Move better in daily life', 3, 12, 'beginner', 'functional', false, true),
('Functional Senior', 'Maintain independence and mobility for older adults.', 'Stay strong and mobile', 3, 12, 'beginner', 'functional', false, true),
('Functional Injury Prevention', 'Build resilient movement patterns to prevent injury.', 'Build injury resistance', 3, 12, 'intermediate', 'functional', false, true),
('Functional Metabolic', 'High intensity functional circuits for conditioning.', 'Build conditioning', 3, 8, 'intermediate', 'functional', false, true),
('Functional Sandbag', 'Complete training using sandbag as primary tool.', 'Build rugged strength', 3, 8, 'intermediate', 'functional', false, true),
('Functional Outdoor', 'Functional training designed for outdoor spaces.', 'Train outside effectively', 3, 8, 'intermediate', 'functional', false, true),
('Functional Women', 'Female-focused functional training.', 'Build feminine function', 3, 12, 'beginner', 'functional', false, true),
('Functional Hybrid', 'Combine functional training with traditional strength work.', 'Best of both worlds', 3, 12, 'intermediate', 'functional', true, true);


-- ============================================================================
-- PART 2: INSERT WEEKS, DAYS, AND EXERCISES FOR EACH TEMPLATE
-- ============================================================================

-- Note: The following uses placeholders for template_id and exercise_id
-- In production, these would be resolved via subqueries

-- ============================================================================
-- PPL BEGINNER FOUNDATION - Complete Programming
-- 6 days/week, 8 weeks
-- ============================================================================

-- Weeks for PPL Beginner Foundation
INSERT INTO workout_template_weeks (template_id, week_number, name, focus, notes)
SELECT id, 1, 'Week 1', 'Introduction', 'Focus on learning proper form. Use lighter weights to perfect technique.'
FROM workout_templates WHERE name = 'PPL Beginner Foundation' AND is_system = true;

INSERT INTO workout_template_weeks (template_id, week_number, name, focus, notes)
SELECT id, 2, 'Week 2', 'Form Refinement', 'Continue focusing on form. Start finding working weights.'
FROM workout_templates WHERE name = 'PPL Beginner Foundation' AND is_system = true;

INSERT INTO workout_template_weeks (template_id, week_number, name, focus, notes)
SELECT id, 3, 'Week 3', 'Building Volume', 'Add one set to compound movements if form is solid.'
FROM workout_templates WHERE name = 'PPL Beginner Foundation' AND is_system = true;

INSERT INTO workout_template_weeks (template_id, week_number, name, focus, notes)
SELECT id, 4, 'Week 4', 'Progressive Overload', 'Increase weights by 5lbs on compounds if hitting target reps.'
FROM workout_templates WHERE name = 'PPL Beginner Foundation' AND is_system = true;

INSERT INTO workout_template_weeks (template_id, week_number, name, focus, notes)
SELECT id, 5, 'Week 5', 'Deload', 'Reduce weights by 40% and focus on recovery.'
FROM workout_templates WHERE name = 'PPL Beginner Foundation' AND is_system = true;

INSERT INTO workout_template_weeks (template_id, week_number, name, focus, notes)
SELECT id, 6, 'Week 6', 'Intensity Phase', 'Resume normal weights, push for progression.'
FROM workout_templates WHERE name = 'PPL Beginner Foundation' AND is_system = true;

INSERT INTO workout_template_weeks (template_id, week_number, name, focus, notes)
SELECT id, 7, 'Week 7', 'Volume Phase', 'Add reps to each set where possible.'
FROM workout_templates WHERE name = 'PPL Beginner Foundation' AND is_system = true;

INSERT INTO workout_template_weeks (template_id, week_number, name, focus, notes)
SELECT id, 8, 'Week 8', 'Test Week', 'Test your progress on main lifts.'
FROM workout_templates WHERE name = 'PPL Beginner Foundation' AND is_system = true;

-- Days for PPL Beginner Foundation (Week 1 as template - repeat for other weeks)
INSERT INTO workout_template_days (template_id, week_id, day_number, name, notes)
SELECT 
    t.id,
    w.id,
    1,
    'Push Day A',
    'Focus on chest and shoulders. Start with compound movements when fresh.'
FROM workout_templates t
JOIN workout_template_weeks w ON w.template_id = t.id AND w.week_number = 1
WHERE t.name = 'PPL Beginner Foundation' AND t.is_system = true;

INSERT INTO workout_template_days (template_id, week_id, day_number, name, notes)
SELECT 
    t.id,
    w.id,
    2,
    'Pull Day A',
    'Focus on back and biceps. Prioritize compound pulling movements.'
FROM workout_templates t
JOIN workout_template_weeks w ON w.template_id = t.id AND w.week_number = 1
WHERE t.name = 'PPL Beginner Foundation' AND t.is_system = true;

INSERT INTO workout_template_days (template_id, week_id, day_number, name, notes)
SELECT 
    t.id,
    w.id,
    3,
    'Legs Day A',
    'Focus on quads, hamstrings, and calves. Compound movements first.'
FROM workout_templates t
JOIN workout_template_weeks w ON w.template_id = t.id AND w.week_number = 1
WHERE t.name = 'PPL Beginner Foundation' AND t.is_system = true;

INSERT INTO workout_template_days (template_id, week_id, day_number, name, notes)
SELECT 
    t.id,
    w.id,
    4,
    'Push Day B',
    'Second push day focuses on shoulders with chest as secondary.'
FROM workout_templates t
JOIN workout_template_weeks w ON w.template_id = t.id AND w.week_number = 1
WHERE t.name = 'PPL Beginner Foundation' AND t.is_system = true;

INSERT INTO workout_template_days (template_id, week_id, day_number, name, notes)
SELECT 
    t.id,
    w.id,
    5,
    'Pull Day B',
    'Second pull day varies exercises for complete back development.'
FROM workout_templates t
JOIN workout_template_weeks w ON w.template_id = t.id AND w.week_number = 1
WHERE t.name = 'PPL Beginner Foundation' AND t.is_system = true;

INSERT INTO workout_template_days (template_id, week_id, day_number, name, notes)
SELECT 
    t.id,
    w.id,
    6,
    'Legs Day B',
    'Second leg day emphasizes posterior chain and glutes.'
FROM workout_templates t
JOIN workout_template_weeks w ON w.template_id = t.id AND w.week_number = 1
WHERE t.name = 'PPL Beginner Foundation' AND t.is_system = true;

-- Exercises for Push Day A (PPL Beginner Foundation)
INSERT INTO workout_template_exercises (day_id, exercise_id, order_index, sets_min, sets_max, reps_min, reps_max, rest_seconds_min, rest_seconds_max, notes)
SELECT 
    d.id,
    e.id,
    1,
    3, 4, 8, 10, 90, 120,
    'Main compound movement. Keep shoulder blades retracted and pinched together. Lower the bar to mid-chest, pause briefly, then press explosively. Feet flat on floor, arch in lower back is okay.'
FROM workout_template_days d
CROSS JOIN exercises e
WHERE d.name = 'Push Day A' 
    AND d.template_id = (SELECT id FROM workout_templates WHERE name = 'PPL Beginner Foundation' AND is_system = true LIMIT 1)
    AND e.name = 'Barbell Bench Press'
    AND e.is_system = true
LIMIT 1;

INSERT INTO workout_template_exercises (day_id, exercise_id, order_index, sets_min, sets_max, reps_min, reps_max, rest_seconds_min, rest_seconds_max, notes)
SELECT 
    d.id,
    e.id,
    2,
    3, 3, 8, 10, 60, 90,
    'Stand with feet shoulder-width apart. Brace core and squeeze glutes. Press directly overhead, moving your head forward once the bar passes. Avoid excessive back lean.'
FROM workout_template_days d
CROSS JOIN exercises e
WHERE d.name = 'Push Day A' 
    AND d.template_id = (SELECT id FROM workout_templates WHERE name = 'PPL Beginner Foundation' AND is_system = true LIMIT 1)
    AND e.name = 'Overhead Press'
    AND e.is_system = true
LIMIT 1;

INSERT INTO workout_template_exercises (day_id, exercise_id, order_index, sets_min, sets_max, reps_min, reps_max, rest_seconds_min, rest_seconds_max, notes)
SELECT 
    d.id,
    e.id,
    3,
    3, 3, 10, 12, 60, 90,
    'Set bench to 30-45 degree angle. Use slightly less weight than flat bench. Focus on stretching chest at the bottom and squeezing at the top.'
FROM workout_template_days d
CROSS JOIN exercises e
WHERE d.name = 'Push Day A' 
    AND d.template_id = (SELECT id FROM workout_templates WHERE name = 'PPL Beginner Foundation' AND is_system = true LIMIT 1)
    AND e.name = 'Incline Dumbbell Press'
    AND e.is_system = true
LIMIT 1;

INSERT INTO workout_template_exercises (day_id, exercise_id, order_index, sets_min, sets_max, reps_min, reps_max, rest_seconds_min, rest_seconds_max, notes)
SELECT 
    d.id,
    e.id,
    4,
    3, 3, 12, 15, 45, 60,
    'Slight bend in elbows maintained throughout. Raise dumbbells to shoulder height, not higher. Control the negative. Lead with pinkies for better lateral delt activation.'
FROM workout_template_days d
CROSS JOIN exercises e
WHERE d.name = 'Push Day A' 
    AND d.template_id = (SELECT id FROM workout_templates WHERE name = 'PPL Beginner Foundation' AND is_system = true LIMIT 1)
    AND e.name = 'Dumbbell Lateral Raise'
    AND e.is_system = true
LIMIT 1;

INSERT INTO workout_template_exercises (day_id, exercise_id, order_index, sets_min, sets_max, reps_min, reps_max, rest_seconds_min, rest_seconds_max, notes)
SELECT 
    d.id,
    e.id,
    5,
    3, 3, 12, 15, 45, 60,
    'Keep elbows pinned to your sides throughout the entire movement. Focus on squeezing triceps at the bottom. Control the weight on the way up. Use a rope or V-bar attachment.'
FROM workout_template_days d
CROSS JOIN exercises e
WHERE d.name = 'Push Day A' 
    AND d.template_id = (SELECT id FROM workout_templates WHERE name = 'PPL Beginner Foundation' AND is_system = true LIMIT 1)
    AND e.name = 'Tricep Pushdown'
    AND e.is_system = true
LIMIT 1;

-- Exercises for Pull Day A (PPL Beginner Foundation)
INSERT INTO workout_template_exercises (day_id, exercise_id, order_index, sets_min, sets_max, reps_min, reps_max, rest_seconds_min, rest_seconds_max, notes)
SELECT 
    d.id,
    e.id,
    1,
    3, 4, 5, 8, 120, 180,
    'Set up with bar over mid-foot. Hinge at hips, grip outside knees. Brace core, chest up, pull slack out of bar. Drive through floor, keep bar close to body. Lock out hips and knees together.'
FROM workout_template_days d
CROSS JOIN exercises e
WHERE d.name = 'Pull Day A' 
    AND d.template_id = (SELECT id FROM workout_templates WHERE name = 'PPL Beginner Foundation' AND is_system = true LIMIT 1)
    AND e.name = 'Barbell Deadlift'
    AND e.is_system = true
LIMIT 1;

INSERT INTO workout_template_exercises (day_id, exercise_id, order_index, sets_min, sets_max, reps_min, reps_max, rest_seconds_min, rest_seconds_max, notes)
SELECT 
    d.id,
    e.id,
    2,
    3, 3, 8, 10, 60, 90,
    'Hinge forward to about 45 degrees. Pull bar to lower chest/upper abs. Squeeze shoulder blades together at the top. Keep core braced and back flat throughout.'
FROM workout_template_days d
CROSS JOIN exercises e
WHERE d.name = 'Pull Day A' 
    AND d.template_id = (SELECT id FROM workout_templates WHERE name = 'PPL Beginner Foundation' AND is_system = true LIMIT 1)
    AND e.name = 'Barbell Bent Over Row'
    AND e.is_system = true
LIMIT 1;

INSERT INTO workout_template_exercises (day_id, exercise_id, order_index, sets_min, sets_max, reps_min, reps_max, rest_seconds_min, rest_seconds_max, notes)
SELECT 
    d.id,
    e.id,
    3,
    3, 3, 8, 12, 60, 90,
    'Pull down to upper chest, not behind neck. Lean back slightly, squeeze lats at the bottom. Control the weight up slowly. Use a grip just outside shoulder width.'
FROM workout_template_days d
CROSS JOIN exercises e
WHERE d.name = 'Pull Day A' 
    AND d.template_id = (SELECT id FROM workout_templates WHERE name = 'PPL Beginner Foundation' AND is_system = true LIMIT 1)
    AND e.name = 'Lat Pulldown'
    AND e.is_system = true
LIMIT 1;

INSERT INTO workout_template_exercises (day_id, exercise_id, order_index, sets_min, sets_max, reps_min, reps_max, rest_seconds_min, rest_seconds_max, notes)
SELECT 
    d.id,
    e.id,
    4,
    3, 3, 10, 12, 45, 60,
    'Support yourself with one hand on bench. Pull dumbbell to hip, not to chest. Elbow stays close to body. Squeeze shoulder blade back and down at the top.'
FROM workout_template_days d
CROSS JOIN exercises e
WHERE d.name = 'Pull Day A' 
    AND d.template_id = (SELECT id FROM workout_templates WHERE name = 'PPL Beginner Foundation' AND is_system = true LIMIT 1)
    AND e.name = 'Dumbbell Row'
    AND e.is_system = true
LIMIT 1;

INSERT INTO workout_template_exercises (day_id, exercise_id, order_index, sets_min, sets_max, reps_min, reps_max, rest_seconds_min, rest_seconds_max, notes)
SELECT 
    d.id,
    e.id,
    5,
    3, 3, 10, 12, 45, 60,
    'Keep elbows slightly in front of body. Curl with controlled motion, no swinging. Squeeze biceps hard at the top. Lower slowly to full extension.'
FROM workout_template_days d
CROSS JOIN exercises e
WHERE d.name = 'Pull Day A' 
    AND d.template_id = (SELECT id FROM workout_templates WHERE name = 'PPL Beginner Foundation' AND is_system = true LIMIT 1)
    AND e.name = 'Dumbbell Bicep Curl'
    AND e.is_system = true
LIMIT 1;

INSERT INTO workout_template_exercises (day_id, exercise_id, order_index, sets_min, sets_max, reps_min, reps_max, rest_seconds_min, rest_seconds_max, notes)
SELECT 
    d.id,
    e.id,
    6,
    3, 3, 12, 15, 45, 60,
    'Keep arms straight throughout. Pull handles to thighs. Squeeze lats hard, hold for a count. Control the return, feel the stretch.'
FROM workout_template_days d
CROSS JOIN exercises e
WHERE d.name = 'Pull Day A' 
    AND d.template_id = (SELECT id FROM workout_templates WHERE name = 'PPL Beginner Foundation' AND is_system = true LIMIT 1)
    AND e.name = 'Straight Arm Pulldown'
    AND e.is_system = true
LIMIT 1;

-- Exercises for Legs Day A (PPL Beginner Foundation)
INSERT INTO workout_template_exercises (day_id, exercise_id, order_index, sets_min, sets_max, reps_min, reps_max, rest_seconds_min, rest_seconds_max, notes)
SELECT 
    d.id,
    e.id,
    1,
    3, 4, 6, 10, 120, 180,
    'Bar position on upper traps (high bar) or rear delts (low bar). Feet shoulder-width or slightly wider. Break at hips and knees simultaneously. Descend until hip crease below knee. Drive up through whole foot.'
FROM workout_template_days d
CROSS JOIN exercises e
WHERE d.name = 'Legs Day A' 
    AND d.template_id = (SELECT id FROM workout_templates WHERE name = 'PPL Beginner Foundation' AND is_system = true LIMIT 1)
    AND e.name = 'Barbell Back Squat'
    AND e.is_system = true
LIMIT 1;

INSERT INTO workout_template_exercises (day_id, exercise_id, order_index, sets_min, sets_max, reps_min, reps_max, rest_seconds_min, rest_seconds_max, notes)
SELECT 
    d.id,
    e.id,
    2,
    3, 3, 8, 10, 90, 120,
    'Stiff legs, slight knee bend. Push hips back, lower bar along legs. Feel the stretch in hamstrings. Return by driving hips forward. Keep back flat throughout.'
FROM workout_template_days d
CROSS JOIN exercises e
WHERE d.name = 'Legs Day A' 
    AND d.template_id = (SELECT id FROM workout_templates WHERE name = 'PPL Beginner Foundation' AND is_system = true LIMIT 1)
    AND e.name = 'Romanian Deadlift'
    AND e.is_system = true
LIMIT 1;

INSERT INTO workout_template_exercises (day_id, exercise_id, order_index, sets_min, sets_max, reps_min, reps_max, rest_seconds_min, rest_seconds_max, notes)
SELECT 
    d.id,
    e.id,
    3,
    3, 3, 10, 12, 60, 90,
    'Feet shoulder-width on platform. Lower sled slowly with control. Press through whole foot, not just toes. Do not lock knees completely at top.'
FROM workout_template_days d
CROSS JOIN exercises e
WHERE d.name = 'Legs Day A' 
    AND d.template_id = (SELECT id FROM workout_templates WHERE name = 'PPL Beginner Foundation' AND is_system = true LIMIT 1)
    AND e.name = 'Leg Press'
    AND e.is_system = true
LIMIT 1;

INSERT INTO workout_template_exercises (day_id, exercise_id, order_index, sets_min, sets_max, reps_min, reps_max, rest_seconds_min, rest_seconds_max, notes)
SELECT 
    d.id,
    e.id,
    4,
    3, 3, 10, 12, 45, 60,
    'Adjust pad to sit just above ankles. Extend legs fully, squeeze quads hard at top. Lower slowly with control. Avoid swinging momentum.'
FROM workout_template_days d
CROSS JOIN exercises e
WHERE d.name = 'Legs Day A' 
    AND d.template_id = (SELECT id FROM workout_templates WHERE name = 'PPL Beginner Foundation' AND is_system = true LIMIT 1)
    AND e.name = 'Leg Extension'
    AND e.is_system = true
LIMIT 1;

INSERT INTO workout_template_exercises (day_id, exercise_id, order_index, sets_min, sets_max, reps_min, reps_max, rest_seconds_min, rest_seconds_max, notes)
SELECT 
    d.id,
    e.id,
    5,
    3, 3, 10, 12, 45, 60,
    'Adjust pad to sit just above heels. Curl legs up, squeeze hamstrings at top. Lower slowly with control. Keep hips pressed down on pad.'
FROM workout_template_days d
CROSS JOIN exercises e
WHERE d.name = 'Legs Day A' 
    AND d.template_id = (SELECT id FROM workout_templates WHERE name = 'PPL Beginner Foundation' AND is_system = true LIMIT 1)
    AND e.name = 'Lying Leg Curl'
    AND e.is_system = true
LIMIT 1;

INSERT INTO workout_template_exercises (day_id, exercise_id, order_index, sets_min, sets_max, reps_min, reps_max, rest_seconds_min, rest_seconds_max, notes)
SELECT 
    d.id,
    e.id,
    6,
    3, 4, 12, 15, 30, 45,
    'Stand on edge of step on balls of feet. Lower heels below platform for full stretch. Rise up on toes as high as possible. Pause and squeeze at top.'
FROM workout_template_days d
CROSS JOIN exercises e
WHERE d.name = 'Legs Day A' 
    AND d.template_id = (SELECT id FROM workout_templates WHERE name = 'PPL Beginner Foundation' AND is_system = true LIMIT 1)
    AND e.name = 'Standing Calf Raise'
    AND e.is_system = true
LIMIT 1;

-- Exercises for Push Day B (PPL Beginner Foundation)
INSERT INTO workout_template_exercises (day_id, exercise_id, order_index, sets_min, sets_max, reps_min, reps_max, rest_seconds_min, rest_seconds_max, notes)
SELECT 
    d.id,
    e.id,
    1,
    3, 4, 8, 10, 90, 120,
    'Primary overhead movement. Neutral grip variation reduces shoulder stress. Press directly overhead, fully extend arms at top. Control the descent.'
FROM workout_template_days d
CROSS JOIN exercises e
WHERE d.name = 'Push Day B' 
    AND d.template_id = (SELECT id FROM workout_templates WHERE name = 'PPL Beginner Foundation' AND is_system = true LIMIT 1)
    AND e.name = 'Dumbbell Shoulder Press'
    AND e.is_system = true
LIMIT 1;

INSERT INTO workout_template_exercises (day_id, exercise_id, order_index, sets_min, sets_max, reps_min, reps_max, rest_seconds_min, rest_seconds_max, notes)
SELECT 
    d.id,
    e.id,
    2,
    3, 3, 8, 10, 60, 90,
    'Flat bench variation. Use a grip slightly narrower than shoulder-width. Lower bar to sternum. Press evenly, lockout fully at top.'
FROM workout_template_days d
CROSS JOIN exercises e
WHERE d.name = 'Push Day B' 
    AND d.template_id = (SELECT id FROM workout_templates WHERE name = 'PPL Beginner Foundation' AND is_system = true LIMIT 1)
    AND e.name = 'Dumbbell Bench Press'
    AND e.is_system = true
LIMIT 1;

INSERT INTO workout_template_exercises (day_id, exercise_id, order_index, sets_min, sets_max, reps_min, reps_max, rest_seconds_min, rest_seconds_max, notes)
SELECT 
    d.id,
    e.id,
    3,
    3, 3, 10, 12, 60, 90,
    'High-to-low cable crossover for lower chest. Step forward into split stance. Bring hands together at lower chest level. Squeeze chest hard at bottom.'
FROM workout_template_days d
CROSS JOIN exercises e
WHERE d.name = 'Push Day B' 
    AND d.template_id = (SELECT id FROM workout_templates WHERE name = 'PPL Beginner Foundation' AND is_system = true LIMIT 1)
    AND e.name = 'Cable Crossover'
    AND e.is_system = true
LIMIT 1;

INSERT INTO workout_template_exercises (day_id, exercise_id, order_index, sets_min, sets_max, reps_min, reps_max, rest_seconds_min, rest_seconds_max, notes)
SELECT 
    d.id,
    e.id,
    4,
    3, 3, 12, 15, 45, 60,
    'Target rear delts. Hinge at hips, keep back flat. Raise dumbbells to sides with slight elbow bend. Lead with elbows, squeeze rear delts at top.'
FROM workout_template_days d
CROSS JOIN exercises e
WHERE d.name = 'Push Day B' 
    AND d.template_id = (SELECT id FROM workout_templates WHERE name = 'PPL Beginner Foundation' AND is_system = true LIMIT 1)
    AND e.name = 'Reverse Dumbbell Fly'
    AND e.is_system = true
LIMIT 1;

INSERT INTO workout_template_exercises (day_id, exercise_id, order_index, sets_min, sets_max, reps_min, reps_max, rest_seconds_min, rest_seconds_max, notes)
SELECT 
    d.id,
    e.id,
    5,
    3, 3, 10, 12, 45, 60,
    'Lie on bench with dumbbell overhead. Keep slight elbow bend. Lower dumbbell behind head until stretch in triceps. Extend arms, squeeze triceps at top.'
FROM workout_template_days d
CROSS JOIN exercises e
WHERE d.name = 'Push Day B' 
    AND d.template_id = (SELECT id FROM workout_templates WHERE name = 'PPL Beginner Foundation' AND is_system = true LIMIT 1)
    AND e.name = 'Dumbbell Skull Crushers'
    AND e.is_system = true
LIMIT 1;

-- Exercises for Pull Day B (PPL Beginner Foundation)
INSERT INTO workout_template_exercises (day_id, exercise_id, order_index, sets_min, sets_max, reps_min, reps_max, rest_seconds_min, rest_seconds_max, notes)
SELECT 
    d.id,
    e.id,
    1,
    3, 4, 6, 10, 90, 120,
    'Underhand grip activates biceps more. Pull to upper chest. Initiate pull with lats, squeeze shoulder blades together. Control the negative.'
FROM workout_template_days d
CROSS JOIN exercises e
WHERE d.name = 'Pull Day B' 
    AND d.template_id = (SELECT id FROM workout_templates WHERE name = 'PPL Beginner Foundation' AND is_system = true LIMIT 1)
    AND e.name = 'Chin-Ups'
    AND e.is_system = true
LIMIT 1;

INSERT INTO workout_template_exercises (day_id, exercise_id, order_index, sets_min, sets_max, reps_min, reps_max, rest_seconds_min, rest_seconds_max, notes)
SELECT 
    d.id,
    e.id,
    2,
    3, 3, 8, 10, 60, 90,
    'Chest supported removes lower back stress. Pull handles to lower chest. Squeeze shoulder blades together at top. Control the return.'
FROM workout_template_days d
CROSS JOIN exercises e
WHERE d.name = 'Pull Day B' 
    AND d.template_id = (SELECT id FROM workout_templates WHERE name = 'PPL Beginner Foundation' AND is_system = true LIMIT 1)
    AND e.name = 'Chest Supported Row'
    AND e.is_system = true
LIMIT 1;

INSERT INTO workout_template_exercises (day_id, exercise_id, order_index, sets_min, sets_max, reps_min, reps_max, rest_seconds_min, rest_seconds_max, notes)
SELECT 
    d.id,
    e.id,
    3,
    3, 3, 10, 12, 60, 90,
    'Sit upright, chest against pad. Pull handles to lower chest. Squeeze lats and middle back at full contraction. Return slowly with control.'
FROM workout_template_days d
CROSS JOIN exercises e
WHERE d.name = 'Pull Day B' 
    AND d.template_id = (SELECT id FROM workout_templates WHERE name = 'PPL Beginner Foundation' AND is_system = true LIMIT 1)
    AND e.name = 'Seated Cable Row'
    AND e.is_system = true
LIMIT 1;

INSERT INTO workout_template_exercises (day_id, exercise_id, order_index, sets_min, sets_max, reps_min, reps_max, rest_seconds_min, rest_seconds_max, notes)
SELECT 
    d.id,
    e.id,
    4,
    3, 3, 10, 12, 45, 60,
    'Targets rear delts specifically. Pull handles to face level, elbows high. Squeeze rear delts at peak contraction. Control the return.'
FROM workout_template_days d
CROSS JOIN exercises e
WHERE d.name = 'Pull Day B' 
    AND d.template_id = (SELECT id FROM workout_templates WHERE name = 'PPL Beginner Foundation' AND is_system = true LIMIT 1)
    AND e.name = 'Face Pulls'
    AND e.is_system = true
LIMIT 1;

INSERT INTO workout_template_exercises (day_id, exercise_id, order_index, sets_min, sets_max, reps_min, reps_max, rest_seconds_min, rest_seconds_max, notes)
SELECT 
    d.id,
    e.id,
    5,
    3, 3, 10, 12, 45, 60,
    'Palms facing each other. Curl with elbows close to body. Squeeze at top, lower with control. Great for brachialis development.'
FROM workout_template_days d
CROSS JOIN exercises e
WHERE d.name = 'Pull Day B' 
    AND d.template_id = (SELECT id FROM workout_templates WHERE name = 'PPL Beginner Foundation' AND is_system = true LIMIT 1)
    AND e.name = 'Hammer Curls'
    AND e.is_system = true
LIMIT 1;

-- Exercises for Legs Day B (PPL Beginner Foundation)
INSERT INTO workout_template_exercises (day_id, exercise_id, order_index, sets_min, sets_max, reps_min, reps_max, rest_seconds_min, rest_seconds_max, notes)
SELECT 
    d.id,
    e.id,
    1,
    3, 4, 8, 10, 90, 120,
    'Stance wider than shoulder-width. Toes pointed out 30-45 degrees. Descend straight down, keeping knees tracking over toes. Drive up through heels. Great for glutes and adductors.'
FROM workout_template_days d
CROSS JOIN exercises e
WHERE d.name = 'Legs Day B' 
    AND d.template_id = (SELECT id FROM workout_templates WHERE name = 'PPL Beginner Foundation' AND is_system = true LIMIT 1)
    AND e.name = 'Sumo Deadlift'
    AND e.is_system = true
LIMIT 1;

INSERT INTO workout_template_exercises (day_id, exercise_id, order_index, sets_min, sets_max, reps_min, reps_max, rest_seconds_min, rest_seconds_max, notes)
SELECT 
    d.id,
    e.id,
    2,
    3, 3, 10, 12, 60, 90,
    'Rear foot elevated on bench. Lower straight down, front knee tracks over toe. Drive through front heel. Great unilateral leg exercise.'
FROM workout_template_days d
CROSS JOIN exercises e
WHERE d.name = 'Legs Day B' 
    AND d.template_id = (SELECT id FROM workout_templates WHERE name = 'PPL Beginner Foundation' AND is_system = true LIMIT 1)
    AND e.name = 'Bulgarian Split Squat'
    AND e.is_system = true
LIMIT 1;

INSERT INTO workout_template_exercises (day_id, exercise_id, order_index, sets_min, sets_max, reps_min, reps_max, rest_seconds_min, rest_seconds_max, notes)
SELECT 
    d.id,
    e.id,
    3,
    3, 3, 10, 12, 60, 90,
    'Cable between legs, hinge at hips. Push hips back, feeling stretch in hamstrings. Squeeze glutes to return to standing. Great for glute activation.'
FROM workout_template_days d
CROSS JOIN exercises e
WHERE d.name = 'Legs Day B' 
    AND d.template_id = (SELECT id FROM workout_templates WHERE name = 'PPL Beginner Foundation' AND is_system = true LIMIT 1)
    AND e.name = 'Cable Pull Through'
    AND e.is_system = true
LIMIT 1;

INSERT INTO workout_template_exercises (day_id, exercise_id, order_index, sets_min, sets_max, reps_min, reps_max, rest_seconds_min, rest_seconds_max, notes)
SELECT 
    d.id,
    e.id,
    4,
    3, 3, 12, 15, 45, 60,
    'Back against pad, barbell across hips. Drive hips up, squeeze glutes at top. Hold for 2 seconds. Lower with control. King of glute exercises.'
FROM workout_template_days d
CROSS JOIN exercises e
WHERE d.name = 'Legs Day B' 
    AND d.template_id = (SELECT id FROM workout_templates WHERE name = 'PPL Beginner Foundation' AND is_system = true LIMIT 1)
    AND e.name = 'Hip Thrust'
    AND e.is_system = true
LIMIT 1;

INSERT INTO workout_template_exercises (day_id, exercise_id, order_index, sets_min, sets_max, reps_min, reps_max, rest_seconds_min, rest_seconds_max, notes)
SELECT 
    d.id,
    e.id,
    5,
    3, 3, 10, 12, 45, 60,
    'Adjust pad position on lower legs. Curl weight up, squeeze hamstrings hard. Lower with control, maintaining tension throughout range.'
FROM workout_template_days d
CROSS JOIN exercises e
WHERE d.name = 'Legs Day B' 
    AND d.template_id = (SELECT id FROM workout_templates WHERE name = 'PPL Beginner Foundation' AND is_system = true LIMIT 1)
    AND e.name = 'Seated Leg Curl'
    AND e.is_system = true
LIMIT 1;

INSERT INTO workout_template_exercises (day_id, exercise_id, order_index, sets_min, sets_max, reps_min, reps_max, rest_seconds_min, rest_seconds_max, notes)
SELECT 
    d.id,
    e.id,
    6,
    3, 4, 15, 20, 30, 45,
    'Seated with knees bent at 90 degrees. Rise up on balls of feet. Squeeze calves hard at top. Lower slowly for full stretch. Great for soleus development.'
FROM workout_template_days d
CROSS JOIN exercises e
WHERE d.name = 'Legs Day B' 
    AND d.template_id = (SELECT id FROM workout_templates WHERE name = 'PPL Beginner Foundation' AND is_system = true LIMIT 1)
    AND e.name = 'Seated Calf Raise'
    AND e.is_system = true
LIMIT 1;

-- ============================================================================
-- Note: This is ONE complete template (PPL Beginner Foundation) as example.
-- 
-- The full seed would include similar detailed programming for all 135 templates:
-- - 15 PPL templates × 8-16 weeks × 6 days × 5-6 exercises = ~4,500+ exercise entries
-- - 15 Upper/Lower × 10-12 weeks × 4 days × 5-6 exercises
-- - 15 Full Body × 8-12 weeks × 3 days × 4-6 exercises
-- - etc.
--
-- TOTAL ESTIMATES:
-- - 135 templates
-- - ~800+ weeks
-- - ~3,500+ days
-- - ~18,000+ exercise entries
--
-- For production, this would be generated programmatically or loaded from a
-- structured data file (JSON/CSV) rather than individual INSERT statements.
-- ============================================================================

-- To query a complete template with all data:
/*
SELECT 
    t.name as template_name,
    t.description,
    t.difficulty,
    t.days_per_week,
    t.duration_weeks,
    w.week_number,
    w.name as week_name,
    w.focus,
    d.day_number,
    d.name as day_name,
    e.name as exercise_name,
    te.order_index,
    te.sets_min,
    te.sets_max,
    te.reps_min,
    te.reps_max,
    te.rest_seconds_min,
    te.rest_seconds_max,
    te.notes as exercise_notes,
    ex.primary_muscle,
    ex.equipment,
    ex.video_url
FROM workout_templates t
LEFT JOIN workout_template_weeks w ON w.template_id = t.id
LEFT JOIN workout_template_days d ON d.week_id = w.id
LEFT JOIN workout_template_exercises te ON te.day_id = d.id
LEFT JOIN exercises ex ON ex.id = te.exercise_id
WHERE t.name = 'PPL Beginner Foundation'
ORDER BY w.week_number, d.day_number, te.order_index;
*/
