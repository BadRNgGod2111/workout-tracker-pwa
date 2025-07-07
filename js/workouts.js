/**
 * Workout Tracking System
 * Comprehensive workout session management with real-time tracking, timers, and analytics
 */

class WorkoutManager {
    static currentWorkout = null;
    static workoutTimer = null;
    static restTimer = null;
    static isWorkoutActive = false;
    static startTime = null;
    static listeners = new Map();

    // Workout session states
    static WORKOUT_STATES = {
        IDLE: 'idle',
        ACTIVE: 'active',
        PAUSED: 'paused',
        RESTING: 'resting',
        COMPLETED: 'completed'
    };

    static currentState = this.WORKOUT_STATES.IDLE;

    // Default rest times by exercise type (in seconds)
    static DEFAULT_REST_TIMES = {
        'strength': 180,      // 3 minutes for strength training
        'hypertrophy': 90,    // 90 seconds for muscle building
        'endurance': 60,      // 1 minute for endurance
        'cardio': 30,         // 30 seconds for cardio
        'default': 120        // 2 minutes default
    };

    /**
     * Start a new workout session
     */
    static async startNewWorkout(workoutName = null, planId = null) {
        try {
            if (this.isWorkoutActive) {
                throw new Error('A workout is already in progress');
            }

            const workoutData = {
                name: workoutName || `Workout ${new Date().toLocaleDateString()}`,
                planId: planId,
                startTime: new Date(),
                endTime: null,
                duration: 0,
                exercises: [],
                totalSets: 0,
                totalReps: 0,
                totalWeight: 0,
                totalVolume: 0,
                notes: '',
                isTemplate: false
            };

            // Create workout record in database
            const workoutId = await Database.add(Database.STORES.WORKOUTS, workoutData);
            
            this.currentWorkout = {
                id: workoutId,
                ...workoutData,
                currentExerciseIndex: -1,
                currentSetIndex: 0
            };

            this.isWorkoutActive = true;
            this.startTime = new Date();
            this.currentState = this.WORKOUT_STATES.ACTIVE;

            // Start workout duration timer
            this.startWorkoutTimer();

            // Emit workout started event
            this.emitEvent('workoutStarted', this.currentWorkout);

            console.log('New workout started:', this.currentWorkout);
            return this.currentWorkout;
        } catch (error) {
            console.error('Error starting new workout:', error);
            throw error;
        }
    }

    /**
     * Add exercise to current workout
     */
    static async addExerciseToWorkout(exerciseId, targetSets = 3, targetReps = 10, targetWeight = 0) {
        try {
            if (!this.isWorkoutActive || !this.currentWorkout) {
                throw new Error('No active workout session');
            }

            // Get exercise details
            const exercise = await ExerciseManager.getExerciseById(exerciseId);
            if (!exercise) {
                throw new Error('Exercise not found');
            }

            const workoutExercise = {
                exerciseId: exerciseId,
                exerciseName: exercise.name,
                category: exercise.category,
                muscleGroups: exercise.muscleGroups,
                equipment: exercise.equipment,
                difficulty: exercise.difficulty,
                targetSets: targetSets,
                targetReps: targetReps,
                targetWeight: targetWeight,
                completedSets: [],
                currentSet: 1,
                isCompleted: false,
                restTime: this.getDefaultRestTime(exercise),
                notes: '',
                addedAt: new Date()
            };

            this.currentWorkout.exercises.push(workoutExercise);
            this.currentWorkout.currentExerciseIndex = this.currentWorkout.exercises.length - 1;

            // Update workout in database
            await this.updateWorkoutInDatabase();

            // Emit exercise added event
            this.emitEvent('exerciseAdded', {
                exercise: workoutExercise,
                exerciseIndex: this.currentWorkout.currentExerciseIndex
            });

            console.log('Exercise added to workout:', workoutExercise);
            return workoutExercise;
        } catch (error) {
            console.error('Error adding exercise to workout:', error);
            throw error;
        }
    }

    /**
     * Log a set for the current exercise
     */
    static async logSet(exerciseIndex, setData) {
        try {
            if (!this.isWorkoutActive || !this.currentWorkout) {
                throw new Error('No active workout session');
            }

            if (exerciseIndex < 0 || exerciseIndex >= this.currentWorkout.exercises.length) {
                throw new Error('Invalid exercise index');
            }

            const exercise = this.currentWorkout.exercises[exerciseIndex];
            
            // Validate set data
            const validation = this.validateSetData(setData);
            if (!validation.isValid) {
                throw new Error(`Set validation failed: ${validation.errors.join(', ')}`);
            }

            const setRecord = {
                setNumber: exercise.completedSets.length + 1,
                reps: parseInt(setData.reps) || 0,
                weight: parseFloat(setData.weight) || 0,
                restTime: parseInt(setData.restTime) || exercise.restTime,
                completed: true,
                timestamp: new Date(),
                notes: setData.notes || '',
                rpe: setData.rpe || null, // Rate of Perceived Exertion (1-10)
                tempo: setData.tempo || null, // Exercise tempo (e.g., "3-1-2-1")
                isDropSet: setData.isDropSet || false,
                isWarmupSet: setData.isWarmupSet || false
            };

            // Calculate volume for this set
            setRecord.volume = setRecord.reps * setRecord.weight;

            exercise.completedSets.push(setRecord);
            exercise.currentSet = exercise.completedSets.length + 1;

            // Check if exercise is completed
            if (exercise.completedSets.length >= exercise.targetSets) {
                exercise.isCompleted = true;
            }

            // Update workout totals
            this.updateWorkoutTotals();

            // Save set to database
            const setId = await Database.add(Database.STORES.SETS, {
                workoutId: this.currentWorkout.id,
                exerciseId: exercise.exerciseId,
                ...setRecord
            });

            setRecord.id = setId;

            // Update workout in database
            await this.updateWorkoutInDatabase();

            // Start rest timer if specified
            if (setRecord.restTime > 0 && !exercise.isCompleted) {
                this.startRestTimer(setRecord.restTime, exerciseIndex);
            }

            // Emit set logged event
            this.emitEvent('setLogged', {
                set: setRecord,
                exercise: exercise,
                exerciseIndex: exerciseIndex
            });

            console.log('Set logged:', setRecord);
            return setRecord;
        } catch (error) {
            console.error('Error logging set:', error);
            throw error;
        }
    }

    /**
     * Start rest timer for specified duration
     */
    static startRestTimer(duration, exerciseIndex = null) {
        try {
            // Clear existing rest timer
            this.stopRestTimer();

            this.currentState = this.WORKOUT_STATES.RESTING;
            
            this.restTimer = {
                duration: duration,
                remaining: duration,
                exerciseIndex: exerciseIndex,
                startTime: Date.now(),
                intervalId: null,
                isActive: true
            };

            // Start countdown
            this.restTimer.intervalId = setInterval(() => {
                this.restTimer.remaining = Math.max(0, 
                    this.restTimer.duration - Math.floor((Date.now() - this.restTimer.startTime) / 1000)
                );

                // Emit timer update event
                this.emitEvent('restTimerUpdate', {
                    remaining: this.restTimer.remaining,
                    duration: this.restTimer.duration,
                    exerciseIndex: this.restTimer.exerciseIndex
                });

                // Check if timer completed
                if (this.restTimer.remaining <= 0) {
                    this.stopRestTimer();
                    this.currentState = this.WORKOUT_STATES.ACTIVE;
                    
                    // Emit timer completed event
                    this.emitEvent('restTimerCompleted', {
                        exerciseIndex: this.restTimer.exerciseIndex
                    });
                }
            }, 1000);

            // Emit timer started event
            this.emitEvent('restTimerStarted', {
                duration: duration,
                exerciseIndex: exerciseIndex
            });

            console.log(`Rest timer started: ${duration} seconds`);
            return this.restTimer;
        } catch (error) {
            console.error('Error starting rest timer:', error);
            throw error;
        }
    }

    /**
     * Stop rest timer
     */
    static stopRestTimer() {
        if (this.restTimer && this.restTimer.intervalId) {
            clearInterval(this.restTimer.intervalId);
            
            // Emit timer stopped event
            this.emitEvent('restTimerStopped', {
                remaining: this.restTimer.remaining,
                exerciseIndex: this.restTimer.exerciseIndex
            });
            
            this.restTimer = null;
            
            if (this.currentState === this.WORKOUT_STATES.RESTING) {
                this.currentState = this.WORKOUT_STATES.ACTIVE;
            }
        }
    }

    /**
     * Start workout duration timer
     */
    static startWorkoutTimer() {
        if (this.workoutTimer) {
            clearInterval(this.workoutTimer);
        }

        this.workoutTimer = setInterval(() => {
            if (this.currentWorkout && this.startTime) {
                const now = new Date();
                this.currentWorkout.duration = Math.floor((now - this.startTime) / 1000);
                
                // Emit duration update event
                this.emitEvent('workoutDurationUpdate', {
                    duration: this.currentWorkout.duration,
                    formattedDuration: this.formatDuration(this.currentWorkout.duration)
                });
            }
        }, 1000);
    }

    /**
     * Stop workout duration timer
     */
    static stopWorkoutTimer() {
        if (this.workoutTimer) {
            clearInterval(this.workoutTimer);
            this.workoutTimer = null;
        }
    }

    /**
     * Complete and save current workout
     */
    static async completeWorkout(notes = '') {
        try {
            if (!this.isWorkoutActive || !this.currentWorkout) {
                throw new Error('No active workout session');
            }

            // Stop all timers
            this.stopWorkoutTimer();
            this.stopRestTimer();

            // Finalize workout data
            this.currentWorkout.endTime = new Date();
            this.currentWorkout.notes = notes;
            this.currentState = this.WORKOUT_STATES.COMPLETED;

            // Update final totals
            this.updateWorkoutTotals();

            // Update workout in database
            await this.updateWorkoutInDatabase();

            // Reset state
            const completedWorkout = { ...this.currentWorkout };
            this.currentWorkout = null;
            this.isWorkoutActive = false;
            this.startTime = null;
            this.currentState = this.WORKOUT_STATES.IDLE;

            // Emit workout completed event
            this.emitEvent('workoutCompleted', completedWorkout);

            console.log('Workout completed:', completedWorkout);
            return completedWorkout;
        } catch (error) {
            console.error('Error completing workout:', error);
            throw error;
        }
    }

    /**
     * Restart a previous workout
     */
    static async restartWorkout(workoutId) {
        try {
            const originalWorkout = await this.getWorkoutById(workoutId);
            if (!originalWorkout) {
                throw new Error('Workout not found');
            }

            // Start new workout with same name
            const newWorkout = await this.startNewWorkout(
                `${originalWorkout.name} (Restart)`,
                originalWorkout.planId
            );

            // Add all exercises from original workout
            for (const exercise of originalWorkout.exercises) {
                await this.addExerciseToWorkout(
                    exercise.exerciseId,
                    exercise.targetSets,
                    exercise.targetReps,
                    exercise.targetWeight
                );
            }

            // Emit workout restarted event
            this.emitEvent('workoutRestarted', {
                newWorkout: newWorkout,
                originalWorkout: originalWorkout
            });

            return newWorkout;
        } catch (error) {
            console.error('Error restarting workout:', error);
            throw error;
        }
    }

    /**
     * Get workout statistics
     */
    static async getWorkoutStatistics(options = {}) {
        try {
            const {
                startDate = null,
                endDate = null,
                period = 'all' // 'week', 'month', 'year', 'all'
            } = options;

            // Calculate date range based on period
            let dateFilter = {};
            const now = new Date();
            
            switch (period) {
                case 'week':
                    dateFilter.startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
                    break;
                case 'month':
                    dateFilter.startDate = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
                    break;
                case 'year':
                    dateFilter.startDate = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());
                    break;
                default:
                    if (startDate) dateFilter.startDate = new Date(startDate);
                    if (endDate) dateFilter.endDate = new Date(endDate);
            }

            // Get workouts and sets for the period
            const workoutsResult = await this.getWorkoutHistory({
                limit: 1000,
                ...dateFilter
            });
            const workouts = workoutsResult.workouts;

            const allSets = await Database.getAll(Database.STORES.SETS);
            const periodSets = allSets.filter(set => {
                const setDate = new Date(set.timestamp);
                if (dateFilter.startDate && setDate < dateFilter.startDate) return false;
                if (dateFilter.endDate && setDate > dateFilter.endDate) return false;
                return true;
            });

            // Calculate statistics
            const stats = {
                totalWorkouts: workouts.length,
                totalDuration: workouts.reduce((sum, w) => sum + (w.duration || 0), 0),
                averageDuration: 0,
                totalSets: periodSets.length,
                totalReps: periodSets.reduce((sum, set) => sum + (set.reps || 0), 0),
                totalWeight: periodSets.reduce((sum, set) => sum + (set.weight || 0), 0),
                totalVolume: periodSets.reduce((sum, set) => sum + ((set.weight || 0) * (set.reps || 0)), 0),
                averageVolume: 0,
                workoutFrequency: this.calculateWorkoutFrequency(workouts, period),
                muscleGroupDistribution: this.calculateMuscleGroupDistribution(workouts),
                exerciseFrequency: this.calculateExerciseFrequency(periodSets),
                personalBests: await this.getPersonalBests(periodSets),
                progressTrend: this.calculateProgressTrend(workouts),
                consistencyScore: this.calculateConsistencyScore(workouts, period)
            };

            // Calculate averages
            if (stats.totalWorkouts > 0) {
                stats.averageDuration = Math.round(stats.totalDuration / stats.totalWorkouts);
                stats.averageVolume = Math.round(stats.totalVolume / stats.totalWorkouts);
            }

            return stats;
        } catch (error) {
            console.error('Error getting workout statistics:', error);
            throw error;
        }
    }

    // Helper Methods

    /**
     * Update workout totals based on completed sets
     */
    static updateWorkoutTotals() {
        if (!this.currentWorkout) return;

        let totalSets = 0;
        let totalReps = 0;
        let totalWeight = 0;
        let totalVolume = 0;

        this.currentWorkout.exercises.forEach(exercise => {
            exercise.completedSets.forEach(set => {
                if (set.completed && !set.isWarmupSet) {
                    totalSets++;
                    totalReps += set.reps || 0;
                    totalWeight += set.weight || 0;
                    totalVolume += (set.weight || 0) * (set.reps || 0);
                }
            });
        });

        this.currentWorkout.totalSets = totalSets;
        this.currentWorkout.totalReps = totalReps;
        this.currentWorkout.totalWeight = totalWeight;
        this.currentWorkout.totalVolume = totalVolume;
    }

    /**
     * Update workout in database
     */
    static async updateWorkoutInDatabase() {
        if (!this.currentWorkout || !this.currentWorkout.id) return;

        try {
            await Database.update(Database.STORES.WORKOUTS, this.currentWorkout);
        } catch (error) {
            console.error('Error updating workout in database:', error);
        }
    }

    /**
     * Get default rest time for an exercise
     */
    static getDefaultRestTime(exercise) {
        // Determine rest time based on exercise characteristics
        if (exercise.category === 'cardio') {
            return this.DEFAULT_REST_TIMES.cardio;
        } else if (exercise.difficulty === 'advanced' || exercise.category === 'legs') {
            return this.DEFAULT_REST_TIMES.strength;
        } else if (exercise.category === 'core') {
            return this.DEFAULT_REST_TIMES.endurance;
        } else {
            return this.DEFAULT_REST_TIMES.hypertrophy;
        }
    }

    /**
     * Validate set data
     */
    static validateSetData(setData) {
        const errors = [];

        if (!setData.reps || setData.reps < 0 || setData.reps > 1000) {
            errors.push('Reps must be between 1 and 1000');
        }

        if (setData.weight && (setData.weight < 0 || setData.weight > 10000)) {
            errors.push('Weight must be between 0 and 10000 lbs');
        }

        if (setData.rpe && (setData.rpe < 1 || setData.rpe > 10)) {
            errors.push('RPE must be between 1 and 10');
        }

        return {
            isValid: errors.length === 0,
            errors: errors
        };
    }

    /**
     * Get workout by ID with full details
     */
    static async getWorkoutById(id) {
        try {
            const workout = await Database.get(Database.STORES.WORKOUTS, id);
            if (!workout) {
                return null;
            }

            // Get all sets for this workout
            const sets = await Database.getByIndex(Database.STORES.SETS, 'workoutId', id);
            
            // Group sets by exercise
            const exerciseMap = new Map();
            sets.forEach(set => {
                if (!exerciseMap.has(set.exerciseId)) {
                    exerciseMap.set(set.exerciseId, []);
                }
                exerciseMap.get(set.exerciseId).push(set);
            });

            // Reconstruct exercises with their sets
            if (workout.exercises) {
                workout.exercises.forEach(exercise => {
                    const exerciseSets = exerciseMap.get(exercise.exerciseId) || [];
                    exercise.completedSets = exerciseSets.sort((a, b) => a.setNumber - b.setNumber);
                });
            }

            return this.enrichWorkoutData(workout);
        } catch (error) {
            console.error('Error getting workout by ID:', error);
            throw error;
        }
    }

    /**
     * Get workout history with filtering and sorting
     */
    static async getWorkoutHistory(options = {}) {
        try {
            const {
                limit = 50,
                offset = 0,
                sortBy = 'startTime',
                sortOrder = 'desc',
                startDate = null,
                endDate = null,
                exerciseId = null
            } = options;

            let workouts = await Database.getAll(Database.STORES.WORKOUTS, {
                sortBy,
                sortOrder,
                limit: limit + offset
            });

            // Apply date filters
            if (startDate || endDate) {
                workouts = workouts.filter(workout => {
                    const workoutDate = new Date(workout.startTime);
                    if (startDate && workoutDate < new Date(startDate)) return false;
                    if (endDate && workoutDate > new Date(endDate)) return false;
                    return true;
                });
            }

            // Apply exercise filter
            if (exerciseId) {
                workouts = workouts.filter(workout => 
                    workout.exercises && 
                    workout.exercises.some(ex => ex.exerciseId === exerciseId)
                );
            }

            // Apply pagination
            const paginatedWorkouts = workouts.slice(offset, offset + limit);

            // Enrich workout data
            const enrichedWorkouts = paginatedWorkouts.map(workout => this.enrichWorkoutData(workout));

            return {
                workouts: enrichedWorkouts,
                total: workouts.length,
                hasMore: workouts.length > offset + limit
            };
        } catch (error) {
            console.error('Error getting workout history:', error);
            throw error;
        }
    }

    /**
     * Get recent workouts for quick access
     */
    static async getRecentWorkouts(limit = 10) {
        try {
            const result = await this.getWorkoutHistory({ limit, sortBy: 'startTime', sortOrder: 'desc' });
            return result.workouts;
        } catch (error) {
            console.error('Error getting recent workouts:', error);
            throw error;
        }
    }

    static async getWorkoutsByDateRange(startDate, endDate) {
        try {
            const workouts = await Database.getAll('workouts');
            const start = new Date(startDate);
            const end = new Date(endDate);

            return workouts.filter(workout => {
                const workoutDate = new Date(workout.startTime);
                return workoutDate >= start && workoutDate <= end;
            });
        } catch (error) {
            console.error('Error getting workouts by date range:', error);
            throw error;
        }
    }

    static async getWorkoutStats(workoutId) {
        try {
            const workout = await this.getWorkoutById(workoutId);
            if (!workout) {
                return null;
            }

            const sets = workout.sets || [];
            const totalSets = sets.length;
            const totalReps = sets.reduce((sum, set) => sum + (set.reps || 0), 0);
            const totalWeight = sets.reduce((sum, set) => sum + (set.weight || 0), 0);
            const totalVolume = sets.reduce((sum, set) => sum + ((set.weight || 0) * (set.reps || 0)), 0);

            const uniqueExercises = [...new Set(sets.map(set => set.exerciseId))];

            return {
                totalSets,
                totalReps,
                totalWeight,
                totalVolume,
                exerciseCount: uniqueExercises.length,
                duration: workout.duration || 0,
                startTime: workout.startTime,
                endTime: workout.endTime
            };
        } catch (error) {
            console.error('Error getting workout stats:', error);
            throw error;
        }
    }


    /**
     * Format duration in human-readable format
     */
    static formatDuration(seconds) {
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        const secs = seconds % 60;

        if (hours > 0) {
            return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
        } else {
            return `${minutes}:${secs.toString().padStart(2, '0')}`;
        }
    }

    /**
     * Enrich workout data with additional information
     */
    static enrichWorkoutData(workout) {
        return {
            ...workout,
            formattedDuration: this.formatDuration(workout.duration || 0),
            formattedDate: new Date(workout.startTime).toLocaleDateString(),
            formattedTime: new Date(workout.startTime).toLocaleTimeString(),
            dayOfWeek: new Date(workout.startTime).toLocaleDateString('en-US', { weekday: 'long' }),
            averageRestTime: this.calculateAverageRestTime(workout),
            volumePerMinute: workout.duration > 0 ? Math.round((workout.totalVolume || 0) / (workout.duration / 60)) : 0,
            setsPerExercise: workout.exercises ? Math.round(workout.totalSets / Math.max(1, workout.exercises.length)) : 0,
            completionRate: this.calculateCompletionRate(workout)
        };
    }

    /**
     * Calculate workout frequency for statistics
     */
    static calculateWorkoutFrequency(workouts, period) {
        if (workouts.length === 0) return 0;

        const now = new Date();
        let days;

        switch (period) {
            case 'week': days = 7; break;
            case 'month': days = 30; break;
            case 'year': days = 365; break;
            default:
                // Calculate actual days in range
                const dates = workouts.map(w => new Date(w.startTime));
                const minDate = new Date(Math.min(...dates));
                const maxDate = new Date(Math.max(...dates));
                days = Math.max(1, Math.ceil((maxDate - minDate) / (1000 * 60 * 60 * 24)));
        }

        return parseFloat((workouts.length / days * 7).toFixed(2)); // workouts per week
    }

    /**
     * Calculate muscle group distribution
     */
    static calculateMuscleGroupDistribution(workouts) {
        const distribution = {};

        workouts.forEach(workout => {
            if (workout.exercises) {
                workout.exercises.forEach(exercise => {
                    if (exercise.muscleGroups) {
                        exercise.muscleGroups.forEach(muscle => {
                            distribution[muscle] = (distribution[muscle] || 0) + 1;
                        });
                    }
                });
            }
        });

        return distribution;
    }

    /**
     * Get current workout state
     */
    static getCurrentWorkoutState() {
        return {
            isActive: this.isWorkoutActive,
            state: this.currentState,
            workout: this.currentWorkout,
            duration: this.currentWorkout ? this.currentWorkout.duration : 0,
            restTimer: this.restTimer ? {
                remaining: this.restTimer.remaining,
                duration: this.restTimer.duration,
                isActive: this.restTimer.isActive,
                exerciseIndex: this.restTimer.exerciseIndex
            } : null
        };
    }

    // Event System

    /**
     * Add event listener
     */
    static addEventListener(event, callback) {
        if (!this.listeners.has(event)) {
            this.listeners.set(event, []);
        }
        this.listeners.get(event).push(callback);
    }

    /**
     * Emit event to all listeners
     */
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

    static calculateAverageRestTime(workout) {
        if (!workout.exercises) return 0;

        let totalRestTime = 0;
        let restCount = 0;

        workout.exercises.forEach(exercise => {
            if (exercise.completedSets) {
                exercise.completedSets.forEach(set => {
                    if (set.restTime > 0) {
                        totalRestTime += set.restTime;
                        restCount++;
                    }
                });
            }
        });

        return restCount > 0 ? Math.round(totalRestTime / restCount) : 0;
    }

    static calculateCompletionRate(workout) {
        if (!workout.exercises || workout.exercises.length === 0) return 0;

        let targetSets = 0;
        let completedSets = 0;

        workout.exercises.forEach(exercise => {
            targetSets += exercise.targetSets || 0;
            completedSets += exercise.completedSets ? exercise.completedSets.length : 0;
        });

        return targetSets > 0 ? Math.round((completedSets / targetSets) * 100) : 0;
    }

    static calculateExerciseFrequency(sets) {
        const frequency = {};

        sets.forEach(set => {
            const exerciseId = set.exerciseId;
            frequency[exerciseId] = (frequency[exerciseId] || 0) + 1;
        });

        return Object.entries(frequency)
            .sort(([,a], [,b]) => b - a)
            .slice(0, 10)
            .reduce((obj, [key, value]) => {
                obj[key] = value;
                return obj;
            }, {});
    }

    static async getPersonalBests(sets) {
        const bests = {
            heaviestSet: null,
            mostReps: null,
            highestVolume: null,
            bestEstimated1RM: null
        };

        sets.forEach(set => {
            if (!bests.heaviestSet || (set.weight || 0) > (bests.heaviestSet.weight || 0)) {
                bests.heaviestSet = set;
            }

            if (!bests.mostReps || (set.reps || 0) > (bests.mostReps.reps || 0)) {
                bests.mostReps = set;
            }

            const volume = (set.weight || 0) * (set.reps || 0);
            const bestVolume = (bests.highestVolume?.weight || 0) * (bests.highestVolume?.reps || 0);
            if (!bests.highestVolume || volume > bestVolume) {
                bests.highestVolume = set;
            }

            const estimated1RM = ExerciseManager.calculate1RM(set.weight || 0, set.reps || 0);
            const best1RM = bests.bestEstimated1RM ? 
                ExerciseManager.calculate1RM(bests.bestEstimated1RM.weight || 0, bests.bestEstimated1RM.reps || 0) : 0;
            
            if (!bests.bestEstimated1RM || estimated1RM > best1RM) {
                bests.bestEstimated1RM = set;
            }
        });

        return bests;
    }

    static calculateProgressTrend(workouts) {
        if (workouts.length < 2) return 'stable';

        const sortedWorkouts = workouts.sort((a, b) => new Date(a.startTime) - new Date(b.startTime));
        
        const recentCount = Math.min(5, Math.floor(sortedWorkouts.length / 2));
        const recent = sortedWorkouts.slice(-recentCount);
        const earlier = sortedWorkouts.slice(0, recentCount);

        const recentAvgVolume = recent.reduce((sum, w) => sum + (w.totalVolume || 0), 0) / recent.length;
        const earlierAvgVolume = earlier.reduce((sum, w) => sum + (w.totalVolume || 0), 0) / earlier.length;

        const changePercent = earlierAvgVolume > 0 ? ((recentAvgVolume - earlierAvgVolume) / earlierAvgVolume) * 100 : 0;

        if (changePercent > 10) return 'improving';
        if (changePercent < -10) return 'declining';
        return 'stable';
    }

    static calculateConsistencyScore(workouts, period) {
        if (workouts.length === 0) return 0;

        const frequency = this.calculateWorkoutFrequency(workouts, period);
        const target = period === 'week' ? 3 : period === 'month' ? 12 : 150;
        
        return Math.min(100, Math.round((frequency / target) * 100));
    }
}

// Auto-initialize workout manager
document.addEventListener('DOMContentLoaded', () => {
    console.log('WorkoutManager initialized');
});
}