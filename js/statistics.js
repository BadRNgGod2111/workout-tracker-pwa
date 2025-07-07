/**
 * Statistics and Progress Tracking Module
 * Handles data aggregation, progress charts, streaks, and goals
 */

class Statistics {
    constructor(database) {
        this.db = database;
        this.charts = new Map();
        this.achievements = [];
        this.goals = [];
        this.measurements = [];
        this.streaks = {
            current: 0,
            longest: 0,
            lastWorkoutDate: null
        };
        
        this.init();
    }

    async init() {
        await this.loadGoals();
        await this.loadMeasurements();
        await this.calculateStreaks();
        await this.checkAchievements();
    }

    // Data Aggregation Functions
    async getWorkoutSummary(period = 'week') {
        const workouts = await this.db.getAllWorkouts();
        const now = new Date();
        const startDate = this.getStartDate(now, period);
        
        const filteredWorkouts = workouts.filter(workout => 
            new Date(workout.date) >= startDate
        );

        const summary = {
            period,
            totalWorkouts: filteredWorkouts.length,
            totalDuration: filteredWorkouts.reduce((sum, w) => sum + (w.duration || 0), 0),
            totalSets: 0,
            totalReps: 0,
            totalWeight: 0,
            averageDuration: 0,
            topExercises: {},
            muscleGroups: {},
            dailyDistribution: this.getDailyDistribution(filteredWorkouts),
            weeklyGoal: this.getGoal('weekly_workouts'),
            progress: 0
        };

        // Calculate detailed stats
        filteredWorkouts.forEach(workout => {
            if (workout.exercises) {
                workout.exercises.forEach(exercise => {
                    summary.totalSets += exercise.sets?.length || 0;
                    
                    if (exercise.sets) {
                        exercise.sets.forEach(set => {
                            summary.totalReps += set.reps || 0;
                            summary.totalWeight += (set.weight || 0) * (set.reps || 0);
                        });
                    }

                    // Track exercise frequency
                    const exerciseName = exercise.name || exercise.exerciseId;
                    summary.topExercises[exerciseName] = (summary.topExercises[exerciseName] || 0) + 1;

                    // Track muscle groups
                    if (exercise.muscleGroup) {
                        summary.muscleGroups[exercise.muscleGroup] = 
                            (summary.muscleGroups[exercise.muscleGroup] || 0) + 1;
                    }
                });
            }
        });

        summary.averageDuration = summary.totalWorkouts > 0 ? 
            Math.round(summary.totalDuration / summary.totalWorkouts) : 0;

        // Calculate progress towards weekly goal
        if (summary.weeklyGoal) {
            summary.progress = Math.min(100, (summary.totalWorkouts / summary.weeklyGoal.target) * 100);
        }

        return summary;
    }

    async getExerciseProgression(exerciseId, period = 'month') {
        const workouts = await this.db.getAllWorkouts();
        const now = new Date();
        const startDate = this.getStartDate(now, period);
        
        const progression = [];
        
        workouts.forEach(workout => {
            const workoutDate = new Date(workout.date);
            if (workoutDate >= startDate && workout.exercises) {
                const exercise = workout.exercises.find(ex => 
                    ex.exerciseId === exerciseId || ex.name === exerciseId
                );
                
                if (exercise && exercise.sets) {
                    const maxWeight = Math.max(...exercise.sets.map(set => set.weight || 0));
                    const totalReps = exercise.sets.reduce((sum, set) => sum + (set.reps || 0), 0);
                    const volume = exercise.sets.reduce((sum, set) => 
                        sum + ((set.weight || 0) * (set.reps || 0)), 0
                    );

                    progression.push({
                        date: workout.date,
                        maxWeight,
                        totalReps,
                        volume,
                        sets: exercise.sets.length,
                        oneRepMax: this.calculateOneRepMax(maxWeight, Math.max(...exercise.sets.map(set => set.reps || 0)))
                    });
                }
            }
        });

        return progression.sort((a, b) => new Date(a.date) - new Date(b.date));
    }

    // Streak Calculation
    async calculateStreaks() {
        const workouts = await this.db.getAllWorkouts();
        if (workouts.length === 0) {
            this.streaks = { current: 0, longest: 0, lastWorkoutDate: null };
            return this.streaks;
        }

        // Sort workouts by date
        const sortedWorkouts = workouts
            .map(w => new Date(w.date))
            .sort((a, b) => a - b);

        // Remove duplicates (same day workouts)
        const uniqueDates = [...new Set(sortedWorkouts.map(d => d.toDateString()))]
            .map(d => new Date(d));

        let currentStreak = 0;
        let longestStreak = 0;
        let tempStreak = 1;

        // Calculate streaks
        for (let i = 1; i < uniqueDates.length; i++) {
            const daysDiff = Math.floor((uniqueDates[i] - uniqueDates[i-1]) / (1000 * 60 * 60 * 24));
            
            if (daysDiff === 1) {
                tempStreak++;
            } else {
                longestStreak = Math.max(longestStreak, tempStreak);
                tempStreak = 1;
            }
        }
        longestStreak = Math.max(longestStreak, tempStreak);

        // Calculate current streak
        const today = new Date();
        const lastWorkoutDate = uniqueDates[uniqueDates.length - 1];
        const daysSinceLastWorkout = Math.floor((today - lastWorkoutDate) / (1000 * 60 * 60 * 24));

        if (daysSinceLastWorkout <= 1) {
            // Find current streak from the end
            for (let i = uniqueDates.length - 2; i >= 0; i--) {
                const daysDiff = Math.floor((uniqueDates[i+1] - uniqueDates[i]) / (1000 * 60 * 60 * 24));
                if (daysDiff === 1) {
                    currentStreak++;
                } else {
                    break;
                }
            }
            currentStreak++; // Include the last workout day
        }

        this.streaks = {
            current: currentStreak,
            longest: longestStreak,
            lastWorkoutDate: lastWorkoutDate
        };

        return this.streaks;
    }

    // Body Measurements
    async addMeasurement(measurement) {
        const measurementData = {
            id: Date.now().toString(),
            date: new Date().toISOString(),
            ...measurement,
            createdAt: new Date().toISOString()
        };

        this.measurements.push(measurementData);
        await this.saveMeasurements();
        return measurementData;
    }

    async getMeasurements(type = null, period = 'year') {
        const startDate = this.getStartDate(new Date(), period);
        
        let filteredMeasurements = this.measurements.filter(m => 
            new Date(m.date) >= startDate
        );

        if (type) {
            filteredMeasurements = filteredMeasurements.filter(m => m.type === type);
        }

        return filteredMeasurements.sort((a, b) => new Date(a.date) - new Date(b.date));
    }

    // Goal System
    async setGoal(goal) {
        const goalData = {
            id: Date.now().toString(),
            type: goal.type, // 'weekly_workouts', 'weight_loss', 'strength_gain', etc.
            target: goal.target,
            current: goal.current || 0,
            startDate: goal.startDate || new Date().toISOString(),
            endDate: goal.endDate,
            description: goal.description,
            unit: goal.unit || '',
            isActive: true,
            createdAt: new Date().toISOString()
        };

        this.goals.push(goalData);
        await this.saveGoals();
        return goalData;
    }

    async updateGoalProgress(goalId, progress) {
        const goal = this.goals.find(g => g.id === goalId);
        if (goal) {
            goal.current = progress;
            goal.updatedAt = new Date().toISOString();
            
            // Check if goal is achieved
            if (progress >= goal.target && !goal.achievedAt) {
                goal.achievedAt = new Date().toISOString();
                await this.addAchievement({
                    type: 'goal_completed',
                    title: `Goal Achieved: ${goal.description}`,
                    description: `You reached your target of ${goal.target} ${goal.unit}!`,
                    goalId: goalId
                });
            }
            
            await this.saveGoals();
        }
    }

    getGoal(type) {
        return this.goals.find(g => g.type === type && g.isActive);
    }

    // Achievement System
    async checkAchievements() {
        const workouts = await this.db.getAllWorkouts();
        const stats = await this.getWorkoutSummary('all');

        // Check various achievement criteria
        const achievements = [
            {
                id: 'first_workout',
                condition: workouts.length >= 1,
                title: 'First Step',
                description: 'Completed your first workout!',
                icon: '🎯'
            },
            {
                id: 'workout_week',
                condition: stats.totalWorkouts >= 7,
                title: 'Week Warrior',
                description: 'Completed 7 workouts!',
                icon: '💪'
            },
            {
                id: 'workout_month',
                condition: stats.totalWorkouts >= 30,
                title: 'Monthly Master',
                description: 'Completed 30 workouts!',
                icon: '🏆'
            },
            {
                id: 'streak_7',
                condition: this.streaks.longest >= 7,
                title: 'Week Streak',
                description: '7-day workout streak!',
                icon: '🔥'
            },
            {
                id: 'streak_30',
                condition: this.streaks.longest >= 30,
                title: 'Unstoppable',
                description: '30-day workout streak!',
                icon: '⚡'
            }
        ];

        for (const achievement of achievements) {
            if (achievement.condition && !this.hasAchievement(achievement.id)) {
                await this.addAchievement(achievement);
            }
        }
    }

    async addAchievement(achievement) {
        const achievementData = {
            id: achievement.id || Date.now().toString(),
            title: achievement.title,
            description: achievement.description,
            icon: achievement.icon || '🏅',
            unlockedAt: new Date().toISOString(),
            type: achievement.type || 'milestone'
        };

        this.achievements.push(achievementData);
        await this.saveAchievements();
        
        // Show achievement notification
        this.showAchievementNotification(achievementData);
        
        return achievementData;
    }

    hasAchievement(achievementId) {
        return this.achievements.some(a => a.id === achievementId);
    }

    // Utility Functions
    getStartDate(currentDate, period) {
        const date = new Date(currentDate);
        
        switch (period) {
            case 'week':
                date.setDate(date.getDate() - 7);
                break;
            case 'month':
                date.setMonth(date.getMonth() - 1);
                break;
            case 'quarter':
                date.setMonth(date.getMonth() - 3);
                break;
            case 'year':
                date.setFullYear(date.getFullYear() - 1);
                break;
            case 'all':
                return new Date(0);
            default:
                date.setDate(date.getDate() - 7);
        }
        
        return date;
    }

    getDailyDistribution(workouts) {
        const distribution = {
            Monday: 0, Tuesday: 0, Wednesday: 0, Thursday: 0,
            Friday: 0, Saturday: 0, Sunday: 0
        };

        workouts.forEach(workout => {
            const day = new Date(workout.date).toLocaleDateString('en-US', { weekday: 'long' });
            distribution[day]++;
        });

        return distribution;
    }

    calculateOneRepMax(weight, reps) {
        if (reps === 1) return weight;
        // Brzycki formula
        return Math.round(weight * (36 / (37 - reps)));
    }

    // Data Persistence
    async saveGoals() {
        localStorage.setItem('workoutTracker_goals', JSON.stringify(this.goals));
    }

    async loadGoals() {
        const saved = localStorage.getItem('workoutTracker_goals');
        this.goals = saved ? JSON.parse(saved) : [];
    }

    async saveMeasurements() {
        localStorage.setItem('workoutTracker_measurements', JSON.stringify(this.measurements));
    }

    async loadMeasurements() {
        const saved = localStorage.getItem('workoutTracker_measurements');
        this.measurements = saved ? JSON.parse(saved) : [];
    }

    async saveAchievements() {
        localStorage.setItem('workoutTracker_achievements', JSON.stringify(this.achievements));
    }

    async loadAchievements() {
        const saved = localStorage.getItem('workoutTracker_achievements');
        this.achievements = saved ? JSON.parse(saved) : [];
    }

    // UI Helpers
    showAchievementNotification(achievement) {
        // Create achievement notification
        const notification = document.createElement('div');
        notification.className = 'achievement-notification';
        notification.innerHTML = `
            <div class="achievement-content">
                <div class="achievement-icon">${achievement.icon}</div>
                <div class="achievement-text">
                    <div class="achievement-title">${achievement.title}</div>
                    <div class="achievement-description">${achievement.description}</div>
                </div>
            </div>
        `;

        document.body.appendChild(notification);

        // Animate in
        setTimeout(() => notification.classList.add('show'), 100);

        // Remove after 5 seconds
        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => notification.remove(), 300);
        }, 5000);
    }

    // Export data for backup
    exportData() {
        return {
            goals: this.goals,
            measurements: this.measurements,
            achievements: this.achievements,
            streaks: this.streaks,
            exportDate: new Date().toISOString()
        };
    }

    // Import data from backup
    async importData(data) {
        if (data.goals) this.goals = data.goals;
        if (data.measurements) this.measurements = data.measurements;
        if (data.achievements) this.achievements = data.achievements;
        if (data.streaks) this.streaks = data.streaks;

        await this.saveGoals();
        await this.saveMeasurements();
        await this.saveAchievements();
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = Statistics;
}