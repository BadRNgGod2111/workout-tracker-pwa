/**
 * Workout Plans System
 * Comprehensive plan management with templates, scheduling, and progress tracking
 */

class PlanManager {
    // Plan difficulty levels
    static DIFFICULTY_LEVELS = {
        BEGINNER: 'beginner',
        INTERMEDIATE: 'intermediate',
        ADVANCED: 'advanced'
    };

    // Plan categories
    static PLAN_CATEGORIES = {
        STRENGTH: 'strength',
        HYPERTROPHY: 'hypertrophy',
        ENDURANCE: 'endurance',
        POWERLIFTING: 'powerlifting',
        BODYBUILDING: 'bodybuilding',
        CROSSFIT: 'crossfit',
        CARDIO: 'cardio',
        FLEXIBILITY: 'flexibility',
        GENERAL: 'general'
    };

    // Plan types
    static PLAN_TYPES = {
        CUSTOM: 'custom',
        TEMPLATE: 'template',
        SHARED: 'shared'
    };

    static listeners = new Map();

    /**
     * Get all plans with optional filtering
     */
    static async getAllPlans(options = {}) {
        try {
            const {
                category = null,
                difficulty = null,
                type = null,
                sortBy = 'name',
                sortOrder = 'asc'
            } = options;

            let plans = await Database.getAll(Database.STORES.PLANS, {
                sortBy,
                sortOrder
            });

            // Apply filters
            if (category) {
                plans = plans.filter(plan => plan.category === category);
            }

            if (difficulty) {
                plans = plans.filter(plan => plan.difficulty === difficulty);
            }

            if (type) {
                plans = plans.filter(plan => plan.type === type);
            }

            return plans.map(plan => this.enrichPlanData(plan));
        } catch (error) {
            console.error('Error getting all plans:', error);
            throw error;
        }
    }

    /**
     * Get plan by ID with enriched data
     */
    static async getPlanById(id) {
        try {
            const plan = await Database.get(Database.STORES.PLANS, id);
            if (!plan) {
                return null;
            }

            return this.enrichPlanData(plan);
        } catch (error) {
            console.error('Error getting plan by ID:', error);
            throw error;
        }
    }

    /**
     * Create a new custom workout plan
     */
    static async createPlan(planData) {
        try {
            const plan = {
                name: planData.name.trim(),
                description: planData.description || '',
                difficulty: planData.difficulty || this.DIFFICULTY_LEVELS.BEGINNER,
                category: planData.category || this.PLAN_CATEGORIES.GENERAL,
                type: planData.type || this.PLAN_TYPES.CUSTOM,
                estimatedDuration: planData.estimatedDuration || 30, // minutes
                exercises: planData.exercises || [],
                tags: planData.tags || [],
                targetMuscleGroups: planData.targetMuscleGroups || [],
                equipment: planData.equipment || [],
                goals: planData.goals || [],
                schedule: planData.schedule || null, // Weekly schedule
                isPublic: planData.isPublic || false,
                isTemplate: planData.isTemplate || false,
                createdBy: planData.createdBy || 'user',
                createdAt: new Date(),
                updatedAt: new Date(),
                version: 1,
                usage: 0,
                rating: 0,
                ratingCount: 0
            };

            // Validate plan data
            const validation = this.validatePlan(plan);
            if (!validation.isValid) {
                throw new Error(`Plan validation failed: ${validation.errors.join(', ')}`);
            }

            // Calculate estimated calories and total sets
            plan.estimatedCalories = this.calculateEstimatedCalories(plan);
            plan.totalSets = this.calculateTotalSets(plan);
            plan.totalExercises = plan.exercises.length;

            const planId = await Database.add(Database.STORES.PLANS, plan);
            const createdPlan = { id: planId, ...plan };

            // Emit plan created event
            this.emitEvent('planCreated', createdPlan);

            console.log('Plan created:', createdPlan);
            return createdPlan;
        } catch (error) {
            console.error('Error creating plan:', error);
            throw error;
        }
    }

    static async updatePlan(id, planData) {
        try {
            const existingPlan = await Database.get('plans', id);
            if (!existingPlan) {
                throw new Error('Plan not found');
            }

            const updatedPlan = {
                ...existingPlan,
                ...planData,
                id: id,
                version: (existingPlan.version || 1) + 1
            };

            const validation = this.validatePlan(updatedPlan);
            if (!validation.isValid) {
                throw new Error(`Plan validation failed: ${validation.errors.join(', ')}`);
            }

            await Database.update('plans', updatedPlan);
            return updatedPlan;
        } catch (error) {
            console.error('Error updating plan:', error);
            throw error;
        }
    }

    static async deletePlan(id) {
        try {
            const plan = await Database.get('plans', id);
            if (!plan) {
                throw new Error('Plan not found');
            }

            await Database.delete('plans', id);
            return true;
        } catch (error) {
            console.error('Error deleting plan:', error);
            throw error;
        }
    }

    static async duplicatePlan(id) {
        try {
            const originalPlan = await Database.get('plans', id);
            if (!originalPlan) {
                throw new Error('Plan not found');
            }

            const duplicatedPlan = {
                ...originalPlan,
                name: `${originalPlan.name} (Copy)`,
                id: undefined,
                createdAt: undefined,
                updatedAt: undefined,
                version: 1
            };

            return await this.createPlan(duplicatedPlan);
        } catch (error) {
            console.error('Error duplicating plan:', error);
            throw error;
        }
    }

    /**
     * Add exercise to plan with target sets, reps, and weight
     */
    static async addExerciseToPlan(planId, exerciseData) {
        try {
            const plan = await Database.get(Database.STORES.PLANS, planId);
            if (!plan) {
                throw new Error('Plan not found');
            }

            // Get exercise details for validation
            const exercise = await ExerciseManager.getExerciseById(exerciseData.exerciseId);
            if (!exercise) {
                throw new Error('Exercise not found');
            }

            const planExercise = {
                exerciseId: exerciseData.exerciseId,
                exerciseName: exercise.name,
                category: exercise.category,
                muscleGroups: exercise.muscleGroups,
                equipment: exercise.equipment,
                difficulty: exercise.difficulty,
                targetSets: exerciseData.targetSets || 3,
                targetReps: exerciseData.targetReps || 10,
                targetWeight: exerciseData.targetWeight || 0,
                targetDuration: exerciseData.targetDuration || 0, // for cardio/timed exercises
                restTime: exerciseData.restTime || this.getDefaultRestTime(exercise),
                notes: exerciseData.notes || '',
                order: exerciseData.order || (plan.exercises.length + 1),
                isSuperset: exerciseData.isSuperset || false,
                supersetGroup: exerciseData.supersetGroup || null,
                isDropSet: exerciseData.isDropSet || false,
                rpeTarget: exerciseData.rpeTarget || null, // Rate of Perceived Exertion target
                tempoTarget: exerciseData.tempoTarget || null, // Exercise tempo
                progressionType: exerciseData.progressionType || 'weight', // 'weight', 'reps', 'sets'
                progressionAmount: exerciseData.progressionAmount || 0
            };

            plan.exercises = plan.exercises || [];
            plan.exercises.push(planExercise);

            // Update plan metadata
            plan.updatedAt = new Date();
            plan.totalExercises = plan.exercises.length;
            plan.totalSets = this.calculateTotalSets(plan);
            plan.estimatedDuration = this.calculateEstimatedDuration(plan);
            plan.estimatedCalories = this.calculateEstimatedCalories(plan);
            plan.targetMuscleGroups = this.calculateTargetMuscleGroups(plan);

            await Database.update(Database.STORES.PLANS, plan);

            // Emit exercise added event
            this.emitEvent('exerciseAddedToPlan', {
                planId: planId,
                exercise: planExercise,
                exerciseIndex: plan.exercises.length - 1
            });

            console.log('Exercise added to plan:', planExercise);
            return planExercise;
        } catch (error) {
            console.error('Error adding exercise to plan:', error);
            throw error;
        }
    }

    static async removeExerciseFromPlan(planId, exerciseIndex) {
        try {
            const plan = await Database.get('plans', planId);
            if (!plan) {
                throw new Error('Plan not found');
            }

            if (!plan.exercises || exerciseIndex >= plan.exercises.length) {
                throw new Error('Exercise not found in plan');
            }

            plan.exercises.splice(exerciseIndex, 1);

            plan.exercises.forEach((exercise, index) => {
                exercise.order = index + 1;
            });

            await Database.update('plans', plan);
            return true;
        } catch (error) {
            console.error('Error removing exercise from plan:', error);
            throw error;
        }
    }

    static async updatePlanExercise(planId, exerciseIndex, exerciseData) {
        try {
            const plan = await Database.get('plans', planId);
            if (!plan) {
                throw new Error('Plan not found');
            }

            if (!plan.exercises || exerciseIndex >= plan.exercises.length) {
                throw new Error('Exercise not found in plan');
            }

            plan.exercises[exerciseIndex] = {
                ...plan.exercises[exerciseIndex],
                ...exerciseData
            };

            await Database.update('plans', plan);
            return plan.exercises[exerciseIndex];
        } catch (error) {
            console.error('Error updating plan exercise:', error);
            throw error;
        }
    }

    static async reorderPlanExercises(planId, newOrder) {
        try {
            const plan = await Database.get('plans', planId);
            if (!plan) {
                throw new Error('Plan not found');
            }

            if (!Array.isArray(newOrder) || newOrder.length !== plan.exercises.length) {
                throw new Error('Invalid order array');
            }

            const reorderedExercises = newOrder.map((index, newIndex) => ({
                ...plan.exercises[index],
                order: newIndex + 1
            }));

            plan.exercises = reorderedExercises;
            await Database.update('plans', plan);
            return reorderedExercises;
        } catch (error) {
            console.error('Error reordering plan exercises:', error);
            throw error;
        }
    }

    static async getPlansByDifficulty(difficulty) {
        try {
            const plans = await Database.getByIndex('plans', 'difficulty', difficulty);
            return plans.sort((a, b) => a.name.localeCompare(b.name));
        } catch (error) {
            console.error('Error getting plans by difficulty:', error);
            throw error;
        }
    }

    static async searchPlans(query) {
        try {
            if (!query || query.trim() === '') {
                return await this.getAllPlans();
            }

            const searchResults = await Database.search('plans', 'name', query);
            return searchResults.sort((a, b) => a.name.localeCompare(b.name));
        } catch (error) {
            console.error('Error searching plans:', error);
            throw error;
        }
    }

    static async getPlanStats(planId) {
        try {
            const plan = await Database.get('plans', planId);
            if (!plan) {
                return null;
            }

            const workouts = await Database.getByIndex('workouts', 'planId', planId);
            const completedWorkouts = workouts.filter(w => w.status === 'completed');
            
            const totalExercises = plan.exercises ? plan.exercises.length : 0;
            const estimatedCalories = this.calculateEstimatedCalories(plan);
            const muscleGroups = await this.getPlanMuscleGroups(plan);

            return {
                totalWorkouts: workouts.length,
                completedWorkouts: completedWorkouts.length,
                totalExercises,
                estimatedCalories,
                muscleGroups,
                averageRating: await this.calculateAverageRating(planId),
                lastUsed: workouts.length > 0 ? Math.max(...workouts.map(w => new Date(w.startTime).getTime())) : null
            };
        } catch (error) {
            console.error('Error getting plan stats:', error);
            throw error;
        }
    }

    /**
     * Calculate estimated calories for plan
     */
    static calculateEstimatedCalories(plan) {
        if (!plan.exercises || plan.exercises.length === 0) {
            return 0;
        }

        const baseCaloriesPerSet = {
            'strength': 12,
            'hypertrophy': 10,
            'endurance': 8,
            'cardio': 15,
            'powerlifting': 15,
            'bodybuilding': 10,
            'general': 10
        };

        const difficultyMultiplier = {
            'beginner': 0.8,
            'intermediate': 1.0,
            'advanced': 1.3
        };

        const baseCalories = baseCaloriesPerSet[plan.category] || 10;
        const multiplier = difficultyMultiplier[plan.difficulty] || 1.0;
        const totalSets = plan.exercises.reduce((sum, ex) => sum + (ex.targetSets || 3), 0);
        
        return Math.round(totalSets * baseCalories * multiplier);
    }

    static async getPlanMuscleGroups(plan) {
        try {
            const muscleGroups = new Set();
            
            if (plan.exercises) {
                for (const planExercise of plan.exercises) {
                    const exercise = await Database.get('exercises', planExercise.exerciseId);
                    if (exercise && exercise.muscleGroups) {
                        exercise.muscleGroups.forEach(group => muscleGroups.add(group));
                    }
                }
            }
            
            return Array.from(muscleGroups);
        } catch (error) {
            console.error('Error getting plan muscle groups:', error);
            return [];
        }
    }

    static async calculateAverageRating(planId) {
        try {
            const ratings = await Database.getByIndex('ratings', 'planId', planId);
            if (ratings.length === 0) return 0;
            
            const totalRating = ratings.reduce((sum, rating) => sum + rating.rating, 0);
            return Math.round((totalRating / ratings.length) * 10) / 10;
        } catch (error) {
            console.error('Error calculating average rating:', error);
            return 0;
        }
    }

    /**
     * Create pre-built plan templates
     */
    static async createPrebuiltTemplates() {
        try {
            const templates = [
                // Beginner Templates
                {
                    name: "Beginner Full Body",
                    description: "Perfect starter routine targeting all major muscle groups",
                    difficulty: this.DIFFICULTY_LEVELS.BEGINNER,
                    category: this.PLAN_CATEGORIES.GENERAL,
                    type: this.PLAN_TYPES.TEMPLATE,
                    isTemplate: true,
                    estimatedDuration: 45,
                    goals: ['muscle-building', 'strength'],
                    schedule: {
                        frequency: 3,
                        daysPerWeek: ['monday', 'wednesday', 'friday']
                    },
                    exercises: [
                        { exerciseId: 'push-ups', targetSets: 3, targetReps: 8, restTime: 90 },
                        { exerciseId: 'squats', targetSets: 3, targetReps: 12, restTime: 90 },
                        { exerciseId: 'plank', targetSets: 3, targetDuration: 30, restTime: 60 },
                        { exerciseId: 'lunges', targetSets: 3, targetReps: 10, restTime: 90 },
                        { exerciseId: 'pull-ups', targetSets: 2, targetReps: 5, restTime: 120 }
                    ]
                },
                {
                    name: "Push Day (Beginner)",
                    description: "Chest, shoulders, and triceps focused workout",
                    difficulty: this.DIFFICULTY_LEVELS.BEGINNER,
                    category: this.PLAN_CATEGORIES.STRENGTH,
                    type: this.PLAN_TYPES.TEMPLATE,
                    isTemplate: true,
                    estimatedDuration: 40,
                    goals: ['muscle-building'],
                    exercises: [
                        { exerciseId: 'bench-press', targetSets: 3, targetReps: 8, restTime: 120 },
                        { exerciseId: 'shoulder-press', targetSets: 3, targetReps: 10, restTime: 90 },
                        { exerciseId: 'chest-flyes', targetSets: 3, targetReps: 12, restTime: 90 },
                        { exerciseId: 'tricep-dips', targetSets: 3, targetReps: 8, restTime: 90 }
                    ]
                },
                {
                    name: "Leg Day (Beginner)",
                    description: "Complete lower body strength and muscle building",
                    difficulty: this.DIFFICULTY_LEVELS.BEGINNER,
                    category: this.PLAN_CATEGORIES.STRENGTH,
                    type: this.PLAN_TYPES.TEMPLATE,
                    isTemplate: true,
                    estimatedDuration: 50,
                    goals: ['muscle-building', 'strength'],
                    exercises: [
                        { exerciseId: 'squats', targetSets: 4, targetReps: 10, restTime: 120 },
                        { exerciseId: 'leg-press', targetSets: 3, targetReps: 12, restTime: 90 },
                        { exerciseId: 'lunges', targetSets: 3, targetReps: 10, restTime: 90 },
                        { exerciseId: 'calf-raises', targetSets: 4, targetReps: 15, restTime: 60 }
                    ]
                },
                // Intermediate Templates
                {
                    name: "Push/Pull/Legs (Intermediate)",
                    description: "Classic 3-day split for intermediate lifters",
                    difficulty: this.DIFFICULTY_LEVELS.INTERMEDIATE,
                    category: this.PLAN_CATEGORIES.BODYBUILDING,
                    type: this.PLAN_TYPES.TEMPLATE,
                    isTemplate: true,
                    estimatedDuration: 75,
                    goals: ['muscle-building', 'strength'],
                    schedule: {
                        frequency: 6,
                        daysPerWeek: ['monday', 'tuesday', 'thursday', 'friday', 'saturday', 'sunday']
                    },
                    exercises: [
                        { exerciseId: 'bench-press', targetSets: 4, targetReps: 8, restTime: 150 },
                        { exerciseId: 'incline-press', targetSets: 3, targetReps: 10, restTime: 120 },
                        { exerciseId: 'pull-ups', targetSets: 4, targetReps: 8, restTime: 120 },
                        { exerciseId: 'rows', targetSets: 4, targetReps: 10, restTime: 120 },
                        { exerciseId: 'squats', targetSets: 4, targetReps: 10, restTime: 180 },
                        { exerciseId: 'deadlifts', targetSets: 3, targetReps: 6, restTime: 180 }
                    ]
                },
                {
                    name: "Upper/Lower Split",
                    description: "4-day upper/lower body split for balanced development",
                    difficulty: this.DIFFICULTY_LEVELS.INTERMEDIATE,
                    category: this.PLAN_CATEGORIES.STRENGTH,
                    type: this.PLAN_TYPES.TEMPLATE,
                    isTemplate: true,
                    estimatedDuration: 60,
                    goals: ['muscle-building', 'strength'],
                    exercises: [
                        { exerciseId: 'bench-press', targetSets: 4, targetReps: 8, restTime: 150 },
                        { exerciseId: 'rows', targetSets: 4, targetReps: 8, restTime: 150 },
                        { exerciseId: 'squats', targetSets: 4, targetReps: 10, restTime: 180 },
                        { exerciseId: 'romanian-deadlifts', targetSets: 3, targetReps: 10, restTime: 150 }
                    ]
                },
                // Advanced Templates
                {
                    name: "Powerlifting Program",
                    description: "Advanced strength program focusing on the big 3 lifts",
                    difficulty: this.DIFFICULTY_LEVELS.ADVANCED,
                    category: this.PLAN_CATEGORIES.POWERLIFTING,
                    type: this.PLAN_TYPES.TEMPLATE,
                    isTemplate: true,
                    estimatedDuration: 90,
                    goals: ['strength', 'powerlifting'],
                    exercises: [
                        { exerciseId: 'squats', targetSets: 5, targetReps: 5, restTime: 300 },
                        { exerciseId: 'bench-press', targetSets: 5, targetReps: 5, restTime: 300 },
                        { exerciseId: 'deadlifts', targetSets: 5, targetReps: 3, restTime: 300 },
                        { exerciseId: 'overhead-press', targetSets: 3, targetReps: 8, restTime: 180 }
                    ]
                },
                {
                    name: "HIIT Cardio Blast",
                    description: "High-intensity interval training for fat loss",
                    difficulty: this.DIFFICULTY_LEVELS.INTERMEDIATE,
                    category: this.PLAN_CATEGORIES.CARDIO,
                    type: this.PLAN_TYPES.TEMPLATE,
                    isTemplate: true,
                    estimatedDuration: 25,
                    goals: ['weight-loss', 'endurance'],
                    exercises: [
                        { exerciseId: 'burpees', targetSets: 5, targetDuration: 30, restTime: 30 },
                        { exerciseId: 'mountain-climbers', targetSets: 5, targetDuration: 30, restTime: 30 },
                        { exerciseId: 'jump-squats', targetSets: 5, targetDuration: 30, restTime: 30 },
                        { exerciseId: 'high-knees', targetSets: 5, targetDuration: 30, restTime: 30 }
                    ]
                }
            ];

            const createdTemplates = [];
            for (const template of templates) {
                try {
                    const created = await this.createPlan(template);
                    createdTemplates.push(created);
                } catch (error) {
                    console.error('Error creating template:', template.name, error);
                }
            }

            console.log(`Created ${createdTemplates.length} plan templates`);
            return createdTemplates;
        } catch (error) {
            console.error('Error creating prebuilt templates:', error);
            throw error;
        }
    }

    /**
     * Get popular plans based on usage
     */
    static async getPopularPlans(limit = 10) {
        try {
            const plans = await this.getAllPlans({ sortBy: 'usage', sortOrder: 'desc' });
            return plans.slice(0, limit);
        } catch (error) {
            console.error('Error getting popular plans:', error);
            throw error;
        }
    }

    static async getRecommendedPlans(userPreferences = {}) {
        try {
            let plans = await this.getAllPlans();
            
            if (userPreferences.difficulty) {
                plans = plans.filter(plan => plan.difficulty === userPreferences.difficulty);
            }
            
            if (userPreferences.maxDuration) {
                plans = plans.filter(plan => {
                    const duration = this.parseDuration(plan.estimatedDuration);
                    return duration <= userPreferences.maxDuration;
                });
            }
            
            if (userPreferences.muscleGroups && userPreferences.muscleGroups.length > 0) {
                const filteredPlans = [];
                for (const plan of plans) {
                    const planMuscleGroups = await this.getPlanMuscleGroups(plan);
                    const hasMatchingMuscleGroup = userPreferences.muscleGroups.some(group => 
                        planMuscleGroups.includes(group)
                    );
                    if (hasMatchingMuscleGroup) {
                        filteredPlans.push(plan);
                    }
                }
                plans = filteredPlans;
            }
            
            const shuffled = plans.sort(() => 0.5 - Math.random());
            return shuffled.slice(0, 5);
        } catch (error) {
            console.error('Error getting recommended plans:', error);
            throw error;
        }
    }

    static parseDuration(durationString) {
        if (!durationString) return 0;
        
        const match = durationString.match(/(\d+)/);
        return match ? parseInt(match[1]) : 0;
    }

    static async exportPlans() {
        try {
            const plans = await this.getAllPlans();
            return plans.map(plan => ({
                name: plan.name,
                description: plan.description,
                difficulty: plan.difficulty,
                estimatedDuration: plan.estimatedDuration,
                category: plan.category,
                exercises: plan.exercises,
                tags: plan.tags
            }));
        } catch (error) {
            console.error('Error exporting plans:', error);
            throw error;
        }
    }

    static async importPlans(plansData) {
        try {
            const importedPlans = [];
            
            for (const planData of plansData) {
                try {
                    const plan = await this.createPlan(planData);
                    importedPlans.push(plan);
                } catch (error) {
                    console.error('Error importing plan:', planData.name, error);
                }
            }
            
            return importedPlans;
        } catch (error) {
            console.error('Error importing plans:', error);
            throw error;
        }
    }

    /**
     * Schedule plan for specific days of the week
     */
    static async schedulePlan(planId, schedule) {
        try {
            const plan = await Database.get(Database.STORES.PLANS, planId);
            if (!plan) {
                throw new Error('Plan not found');
            }

            // Validate schedule format
            const validation = this.validateSchedule(schedule);
            if (!validation.isValid) {
                throw new Error(`Schedule validation failed: ${validation.errors.join(', ')}`);
            }

            plan.schedule = {
                frequency: schedule.frequency || 1, // times per week
                daysPerWeek: schedule.daysPerWeek || [], // ['monday', 'wednesday', 'friday']
                timeOfDay: schedule.timeOfDay || null, // 'morning', 'afternoon', 'evening'
                duration: schedule.duration || plan.estimatedDuration,
                startDate: schedule.startDate || new Date(),
                endDate: schedule.endDate || null,
                isActive: schedule.isActive !== false,
                reminders: schedule.reminders || false,
                reminderTime: schedule.reminderTime || null // minutes before workout
            };

            plan.updatedAt = new Date();

            await Database.update(Database.STORES.PLANS, plan);

            // Emit schedule updated event
            this.emitEvent('planScheduled', {
                planId: planId,
                schedule: plan.schedule
            });

            console.log('Plan scheduled:', plan.schedule);
            return plan.schedule;
        } catch (error) {
            console.error('Error scheduling plan:', error);
            throw error;
        }
    }

    /**
     * Get scheduled plans for a specific date
     */
    static async getScheduledPlans(date = new Date()) {
        try {
            const dayOfWeek = date.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
            const plans = await this.getAllPlans();

            return plans.filter(plan => {
                if (!plan.schedule || !plan.schedule.isActive) {
                    return false;
                }

                // Check if plan is scheduled for this day
                if (plan.schedule.daysPerWeek && plan.schedule.daysPerWeek.includes(dayOfWeek)) {
                    // Check date range if specified
                    if (plan.schedule.startDate) {
                        const startDate = new Date(plan.schedule.startDate);
                        if (date < startDate) return false;
                    }

                    if (plan.schedule.endDate) {
                        const endDate = new Date(plan.schedule.endDate);
                        if (date > endDate) return false;
                    }

                    return true;
                }

                return false;
            });
        } catch (error) {
            console.error('Error getting scheduled plans:', error);
            throw error;
        }
    }

    /**
     * Start workout from plan
     */
    static async startPlanWorkout(planId) {
        try {
            const plan = await Database.get(Database.STORES.PLANS, planId);
            if (!plan) {
                throw new Error('Plan not found');
            }

            // Start new workout with plan reference
            const workout = await WorkoutManager.startNewWorkout(plan.name, planId);
            
            // Add all exercises from the plan
            if (plan.exercises && plan.exercises.length > 0) {
                for (const planExercise of plan.exercises) {
                    await WorkoutManager.addExerciseToWorkout(
                        planExercise.exerciseId,
                        planExercise.targetSets,
                        planExercise.targetReps,
                        planExercise.targetWeight
                    );
                }
            }

            // Update plan usage statistics
            plan.usage = (plan.usage || 0) + 1;
            plan.lastUsed = new Date();
            await Database.update(Database.STORES.PLANS, plan);

            // Emit plan workout started event
            this.emitEvent('planWorkoutStarted', {
                planId: planId,
                workoutId: workout.id,
                plan: plan
            });

            return workout;
        } catch (error) {
            console.error('Error starting plan workout:', error);
            throw error;
        }
    }

    /**
     * Track progress for planned workouts
     */
    static async trackPlanProgress(planId, workoutId) {
        try {
            const plan = await Database.get(Database.STORES.PLANS, planId);
            const workout = await WorkoutManager.getWorkoutById(workoutId);

            if (!plan || !workout) {
                throw new Error('Plan or workout not found');
            }

            // Calculate progress metrics
            const progress = {
                planId: planId,
                workoutId: workoutId,
                date: new Date(workout.startTime),
                completionRate: this.calculateWorkoutCompletionRate(plan, workout),
                volumeProgress: this.calculateVolumeProgress(plan, workout),
                strengthProgress: this.calculateStrengthProgress(plan, workout),
                adherenceScore: this.calculateAdherenceScore(plan, workout),
                personalBests: await this.findPersonalBests(plan, workout),
                notes: workout.notes || ''
            };

            // Store progress record
            const progressId = await Database.add(Database.STORES.PROGRESS, {
                ...progress,
                timestamp: new Date()
            });

            // Update plan statistics
            await this.updatePlanStatistics(planId, progress);

            // Emit progress tracked event
            this.emitEvent('planProgressTracked', {
                progressId: progressId,
                progress: progress
            });

            return { id: progressId, ...progress };
        } catch (error) {
            console.error('Error tracking plan progress:', error);
            throw error;
        }
    }

    /**
     * Get plan progress history
     */
    static async getPlanProgress(planId, options = {}) {
        try {
            const {
                limit = 50,
                startDate = null,
                endDate = null
            } = options;

            let progressRecords = await Database.getByIndex(Database.STORES.PROGRESS, 'planId', planId);

            // Apply date filters
            if (startDate || endDate) {
                progressRecords = progressRecords.filter(record => {
                    const recordDate = new Date(record.timestamp);
                    if (startDate && recordDate < new Date(startDate)) return false;
                    if (endDate && recordDate > new Date(endDate)) return false;
                    return true;
                });
            }

            // Sort by date (newest first) and limit
            progressRecords = progressRecords
                .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
                .slice(0, limit);

            // Calculate trend analysis
            const trendAnalysis = this.calculateProgressTrends(progressRecords);

            return {
                progress: progressRecords,
                trends: trendAnalysis,
                total: progressRecords.length
            };
        } catch (error) {
            console.error('Error getting plan progress:', error);
            throw error;
        }
    }

    /**
     * Share plan as template
     */
    static async sharePlan(planId, shareOptions = {}) {
        try {
            const plan = await Database.get(Database.STORES.PLANS, planId);
            if (!plan) {
                throw new Error('Plan not found');
            }

            // Create shared version
            const sharedPlan = {
                ...plan,
                id: undefined, // Remove original ID
                type: this.PLAN_TYPES.SHARED,
                isTemplate: true,
                isPublic: shareOptions.isPublic !== false,
                originalPlanId: planId,
                sharedBy: shareOptions.sharedBy || 'user',
                sharedAt: new Date(),
                shareCode: this.generateShareCode(),
                downloadCount: 0,
                version: 1
            };

            // Remove usage statistics from shared version
            delete sharedPlan.usage;
            delete sharedPlan.lastUsed;
            delete sharedPlan.schedule;

            const sharedPlanId = await Database.add(Database.STORES.PLANS, sharedPlan);

            // Emit plan shared event
            this.emitEvent('planShared', {
                originalPlanId: planId,
                sharedPlanId: sharedPlanId,
                shareCode: sharedPlan.shareCode
            });

            return {
                id: sharedPlanId,
                shareCode: sharedPlan.shareCode,
                shareUrl: this.generateShareUrl(sharedPlan.shareCode)
            };
        } catch (error) {
            console.error('Error sharing plan:', error);
            throw error;
        }
    }

    /**
     * Import shared plan by share code
     */
    static async importSharedPlan(shareCode) {
        try {
            // Find plan by share code
            const sharedPlans = await Database.getAll(Database.STORES.PLANS);
            const sharedPlan = sharedPlans.find(plan => plan.shareCode === shareCode);

            if (!sharedPlan) {
                throw new Error('Shared plan not found');
            }

            // Create user's copy
            const importedPlan = {
                ...sharedPlan,
                id: undefined,
                name: `${sharedPlan.name} (Imported)`,
                type: this.PLAN_TYPES.CUSTOM,
                isTemplate: false,
                isPublic: false,
                createdBy: 'user',
                createdAt: new Date(),
                updatedAt: new Date(),
                usage: 0,
                version: 1
            };

            // Remove sharing metadata
            delete importedPlan.shareCode;
            delete importedPlan.sharedBy;
            delete importedPlan.sharedAt;
            delete importedPlan.originalPlanId;
            delete importedPlan.downloadCount;

            const importedPlanId = await this.createPlan(importedPlan);

            // Update download count for shared plan
            sharedPlan.downloadCount = (sharedPlan.downloadCount || 0) + 1;
            await Database.update(Database.STORES.PLANS, sharedPlan);

            return importedPlanId;
        } catch (error) {
            console.error('Error importing shared plan:', error);
            throw error;
        }
    }

    // Helper Methods

    /**
     * Validate plan data
     */
    static validatePlan(plan) {
        const errors = [];
        
        if (!plan.name || plan.name.trim() === '') {
            errors.push('Plan name is required');
        }
        
        if (!plan.difficulty || !Object.values(this.DIFFICULTY_LEVELS).includes(plan.difficulty)) {
            errors.push('Valid difficulty level is required');
        }
        
        if (!plan.category || !Object.values(this.PLAN_CATEGORIES).includes(plan.category)) {
            errors.push('Valid category is required');
        }

        if (!plan.exercises || !Array.isArray(plan.exercises)) {
            errors.push('Plan must have exercises array');
        }
        
        if (plan.exercises) {
            plan.exercises.forEach((exercise, index) => {
                if (!exercise.exerciseId) {
                    errors.push(`Exercise ${index + 1} must have an exercise ID`);
                }
                if (!exercise.targetSets || exercise.targetSets < 1) {
                    errors.push(`Exercise ${index + 1} must have at least 1 set`);
                }
                if (!exercise.targetReps && !exercise.targetDuration) {
                    errors.push(`Exercise ${index + 1} must have target reps or duration`);
                }
            });
        }
        
        return {
            isValid: errors.length === 0,
            errors: errors
        };
    }

    /**
     * Validate schedule data
     */
    static validateSchedule(schedule) {
        const errors = [];
        const validDays = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
        
        if (schedule.frequency && (schedule.frequency < 1 || schedule.frequency > 7)) {
            errors.push('Frequency must be between 1 and 7 days per week');
        }
        
        if (schedule.daysPerWeek && Array.isArray(schedule.daysPerWeek)) {
            const invalidDays = schedule.daysPerWeek.filter(day => !validDays.includes(day.toLowerCase()));
            if (invalidDays.length > 0) {
                errors.push(`Invalid days: ${invalidDays.join(', ')}`);
            }
        }
        
        return {
            isValid: errors.length === 0,
            errors: errors
        };
    }

    static getPlanDisplayInfo(plan) {
        return {
            id: plan.id,
            name: plan.name,
            description: plan.description || 'No description',
            difficulty: plan.difficulty || 'Beginner',
            estimatedDuration: plan.estimatedDuration || 'N/A',
            exerciseCount: plan.exercises?.length || 0,
            category: plan.category || 'General',
            tags: plan.tags || [],
            version: plan.version || 1
        };
    }

    static async createSuperset(planId, exerciseIndices) {
        try {
            const plan = await Database.get('plans', planId);
            if (!plan) {
                throw new Error('Plan not found');
            }

            const supersetId = this.generateSupersetId();
            
            exerciseIndices.forEach(index => {
                if (plan.exercises[index]) {
                    plan.exercises[index].isSuperset = true;
                    plan.exercises[index].supersetGroup = supersetId;
                }
            });

            await Database.update('plans', plan);
            return supersetId;
        } catch (error) {
            console.error('Error creating superset:', error);
            throw error;
        }
    }

    static async removeSuperset(planId, supersetId) {
        try {
            const plan = await Database.get('plans', planId);
            if (!plan) {
                throw new Error('Plan not found');
            }

            plan.exercises.forEach(exercise => {
                if (exercise.supersetGroup === supersetId) {
                    exercise.isSuperset = false;
                    exercise.supersetGroup = null;
                }
            });

            await Database.update('plans', plan);
            return true;
        } catch (error) {
            console.error('Error removing superset:', error);
            throw error;
        }
    }

    /**
     * Calculate estimated duration based on exercises
     */
    static calculateEstimatedDuration(plan) {
        if (!plan.exercises || plan.exercises.length === 0) {
            return 30; // default 30 minutes
        }

        let totalTime = 0;
        plan.exercises.forEach(exercise => {
            const sets = exercise.targetSets || 3;
            const restTime = exercise.restTime || 90;
            const exerciseTime = exercise.targetDuration || 45; // estimated time per set
            
            totalTime += (sets * exerciseTime) + ((sets - 1) * restTime);
        });

        // Add warm-up and cool-down time
        totalTime += 10 * 60; // 10 minutes
        
        return Math.round(totalTime / 60); // convert to minutes
    }

    /**
     * Calculate total sets in plan
     */
    static calculateTotalSets(plan) {
        if (!plan.exercises) return 0;
        return plan.exercises.reduce((total, exercise) => total + (exercise.targetSets || 0), 0);
    }

    /**
     * Calculate target muscle groups
     */
    static calculateTargetMuscleGroups(plan) {
        const muscleGroups = new Set();
        if (plan.exercises) {
            plan.exercises.forEach(exercise => {
                if (exercise.muscleGroups) {
                    exercise.muscleGroups.forEach(group => muscleGroups.add(group));
                }
            });
        }
        return Array.from(muscleGroups);
    }

    /**
     * Get default rest time for exercise
     */
    static getDefaultRestTime(exercise) {
        const restTimes = {
            'strength': 180,
            'hypertrophy': 90,
            'endurance': 60,
            'cardio': 30
        };

        if (exercise.category === 'cardio') return restTimes.cardio;
        if (exercise.difficulty === 'advanced') return restTimes.strength;
        if (exercise.category === 'core') return restTimes.endurance;
        return restTimes.hypertrophy;
    }

    /**
     * Enrich plan data with additional information
     */
    static enrichPlanData(plan) {
        return {
            ...plan,
            formattedDuration: `${plan.estimatedDuration || 30} min`,
            difficultyBadge: this.getDifficultyBadge(plan.difficulty),
            categoryInfo: this.getCategoryInfo(plan.category),
            exerciseCount: plan.exercises ? plan.exercises.length : 0,
            lastUsedFormatted: plan.lastUsed ? new Date(plan.lastUsed).toLocaleDateString() : 'Never',
            isScheduled: !!(plan.schedule && plan.schedule.isActive),
            completionRate: this.calculatePlanCompletionRate(plan)
        };
    }

    /**
     * Get difficulty badge styling
     */
    static getDifficultyBadge(difficulty) {
        const badges = {
            'beginner': { class: 'ios-status-success', text: 'Beginner', color: '#34C759' },
            'intermediate': { class: 'ios-status-warning', text: 'Intermediate', color: '#FF9500' },
            'advanced': { class: 'ios-status-error', text: 'Advanced', color: '#FF3B30' }
        };
        return badges[difficulty] || badges.beginner;
    }

    /**
     * Get category information
     */
    static getCategoryInfo(category) {
        const categories = {
            'strength': { name: 'Strength', icon: '🏋️', description: 'Build maximum strength' },
            'hypertrophy': { name: 'Muscle Building', icon: '💪', description: 'Increase muscle size' },
            'endurance': { name: 'Endurance', icon: '🏃', description: 'Improve stamina' },
            'powerlifting': { name: 'Powerlifting', icon: '⚡', description: 'Competition lifts' },
            'bodybuilding': { name: 'Bodybuilding', icon: '🏆', description: 'Aesthetic development' },
            'cardio': { name: 'Cardio', icon: '❤️', description: 'Cardiovascular health' },
            'general': { name: 'General', icon: '🎯', description: 'Overall fitness' }
        };
        return categories[category] || categories.general;
    }

    // Event System
    static addEventListener(event, callback) {
        if (!this.listeners.has(event)) {
            this.listeners.set(event, []);
        }
        this.listeners.get(event).push(callback);
    }

    static emitEvent(event, data) {
        if (this.listeners.has(event)) {
            this.listeners.get(event).forEach(callback => {
                try {
                    callback(data);
                } catch (error) {
                    console.error(`Error in event listener for ${event}:`, error);
                }
            });
        }
    }

    // Utility Functions
    static generateShareCode() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2, 5).toUpperCase();
    }

    static generateShareUrl(shareCode) {
        return `${window.location.origin}/plan/share/${shareCode}`;
    }

    static generateSupersetId() {
        return 'superset_' + Date.now().toString(36) + Math.random().toString(36).substr(2);
    }

    // Progress calculation helpers would be implemented here
    static calculateWorkoutCompletionRate(plan, workout) {
        // Implementation for completion rate calculation
        return 100; // placeholder
    }

    static calculateVolumeProgress(plan, workout) {
        // Implementation for volume progress calculation
        return {}; // placeholder
    }

    static calculateStrengthProgress(plan, workout) {
        // Implementation for strength progress calculation
        return {}; // placeholder
    }

    static calculateAdherenceScore(plan, workout) {
        // Implementation for adherence score calculation
        return 100; // placeholder
    }

    static async findPersonalBests(plan, workout) {
        // Implementation for personal bests detection
        return []; // placeholder
    }

    static async updatePlanStatistics(planId, progress) {
        // Implementation for updating plan statistics
    }

    static calculateProgressTrends(progressRecords) {
        // Implementation for trend analysis
        return {}; // placeholder
    }

    static calculatePlanCompletionRate(plan) {
        // Implementation for overall plan completion rate
        return 0; // placeholder
    }
}

// Auto-initialize plan manager
document.addEventListener('DOMContentLoaded', () => {
    console.log('PlanManager initialized');
});
}