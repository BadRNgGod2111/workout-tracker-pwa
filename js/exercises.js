/**
 * Exercise Management System
 * Comprehensive exercise library with CRUD operations, search, filtering, and detailed exercise information
 */

console.log('📦 exercises.js loaded');

class ExerciseManager {
    // Exercise categories with descriptions
    static CATEGORIES = {
        CHEST: {
            id: 'chest',
            name: 'Chest',
            description: 'Chest muscles (pectorals)',
            icon: '💪',
            primaryMuscles: ['pectoralis-major', 'pectoralis-minor']
        },
        BACK: {
            id: 'back',
            name: 'Back',
            description: 'Back muscles',
            icon: '🏋️',
            primaryMuscles: ['latissimus-dorsi', 'rhomboids', 'trapezius', 'erector-spinae']
        },
        SHOULDERS: {
            id: 'shoulders',
            name: 'Shoulders',
            description: 'Shoulder muscles (deltoids)',
            icon: '🤸',
            primaryMuscles: ['anterior-deltoids', 'lateral-deltoids', 'posterior-deltoids']
        },
        ARMS: {
            id: 'arms',
            name: 'Arms',
            description: 'Arm muscles (biceps, triceps, forearms)',
            icon: '💪',
            primaryMuscles: ['biceps', 'triceps', 'forearms']
        },
        LEGS: {
            id: 'legs',
            name: 'Legs',
            description: 'Leg muscles',
            icon: '🦵',
            primaryMuscles: ['quadriceps', 'hamstrings', 'glutes', 'calves']
        },
        CORE: {
            id: 'core',
            name: 'Core',
            description: 'Core and abdominal muscles',
            icon: '🎯',
            primaryMuscles: ['rectus-abdominis', 'obliques', 'transverse-abdominis']
        },
        CARDIO: {
            id: 'cardio',
            name: 'Cardio',
            description: 'Cardiovascular exercises',
            icon: '❤️',
            primaryMuscles: ['full-body']
        },
        FULL_BODY: {
            id: 'full-body',
            name: 'Full Body',
            description: 'Full body compound movements',
            icon: '🏃',
            primaryMuscles: ['full-body']
        }
    };

    // Muscle groups with anatomical information
    static MUSCLE_GROUPS = {
        // Chest
        'pectoralis-major': { name: 'Pectoralis Major', category: 'chest', type: 'primary' },
        'pectoralis-minor': { name: 'Pectoralis Minor', category: 'chest', type: 'secondary' },
        
        // Back
        'latissimus-dorsi': { name: 'Latissimus Dorsi', category: 'back', type: 'primary' },
        'rhomboids': { name: 'Rhomboids', category: 'back', type: 'primary' },
        'trapezius': { name: 'Trapezius', category: 'back', type: 'primary' },
        'erector-spinae': { name: 'Erector Spinae', category: 'back', type: 'primary' },
        'rear-deltoids': { name: 'Rear Deltoids', category: 'shoulders', type: 'secondary' },
        
        // Shoulders
        'anterior-deltoids': { name: 'Anterior Deltoids', category: 'shoulders', type: 'primary' },
        'lateral-deltoids': { name: 'Lateral Deltoids', category: 'shoulders', type: 'primary' },
        'posterior-deltoids': { name: 'Posterior Deltoids', category: 'shoulders', type: 'primary' },
        
        // Arms
        'biceps': { name: 'Biceps', category: 'arms', type: 'primary' },
        'triceps': { name: 'Triceps', category: 'arms', type: 'primary' },
        'forearms': { name: 'Forearms', category: 'arms', type: 'secondary' },
        
        // Legs
        'quadriceps': { name: 'Quadriceps', category: 'legs', type: 'primary' },
        'hamstrings': { name: 'Hamstrings', category: 'legs', type: 'primary' },
        'glutes': { name: 'Glutes', category: 'legs', type: 'primary' },
        'calves': { name: 'Calves', category: 'legs', type: 'primary' },
        'hip-flexors': { name: 'Hip Flexors', category: 'legs', type: 'secondary' },
        
        // Core
        'rectus-abdominis': { name: 'Rectus Abdominis', category: 'core', type: 'primary' },
        'obliques': { name: 'Obliques', category: 'core', type: 'primary' },
        'transverse-abdominis': { name: 'Transverse Abdominis', category: 'core', type: 'secondary' },
        'lower-back': { name: 'Lower Back', category: 'core', type: 'secondary' },
        
        // Full body
        'full-body': { name: 'Full Body', category: 'full-body', type: 'primary' }
    };

    // Equipment types with descriptions
    static EQUIPMENT_TYPES = {
        'bodyweight': { name: 'Bodyweight', description: 'No equipment needed', icon: '🤸' },
        'dumbbells': { name: 'Dumbbells', description: 'Adjustable dumbbells', icon: '🏋️' },
        'barbell': { name: 'Barbell', description: 'Olympic barbell with plates', icon: '🏋️' },
        'kettlebell': { name: 'Kettlebell', description: 'Kettlebell weights', icon: '⚖️' },
        'resistance-bands': { name: 'Resistance Bands', description: 'Elastic resistance bands', icon: '🔗' },
        'pull-up-bar': { name: 'Pull-up Bar', description: 'Pull-up/chin-up bar', icon: '🔄' },
        'bench': { name: 'Bench', description: 'Weight bench', icon: '🪑' },
        'machine': { name: 'Machine', description: 'Gym machines', icon: '⚙️' },
        'cables': { name: 'Cables', description: 'Cable machine', icon: '🔗' },
        'medicine-ball': { name: 'Medicine Ball', description: 'Weighted medicine ball', icon: '⚽' },
        'suspension-trainer': { name: 'Suspension Trainer', description: 'TRX or similar', icon: '🔗' }
    };

    /**
     * Get all exercises with optional sorting and filtering
     */
    static async getAllExercises(options = {}) {
        try {
            const exercises = await Database.getAll(Database.STORES.EXERCISES, {
                sortBy: options.sortBy || 'name',
                sortOrder: options.sortOrder || 'asc',
                limit: options.limit
            });
            
            return exercises;
        } catch (error) {
            console.error('Error getting all exercises:', error);
            throw error;
        }
    }

    /**
     * Get exercise by ID with detailed information
     */
    static async getExerciseById(id) {
        try {
            const exercise = await Database.get(Database.STORES.EXERCISES, id);
            if (exercise) {
                return this.enrichExerciseData(exercise);
            }
            return null;
        } catch (error) {
            console.error('Error getting exercise by ID:', error);
            throw error;
        }
    }

    /**
     * Get exercises by category
     */
    static async getExercisesByCategory(category) {
        try {
            const exercises = await Database.getByIndex(Database.STORES.EXERCISES, 'category', category);
            return exercises
                .map(exercise => this.enrichExerciseData(exercise))
                .sort((a, b) => a.name.localeCompare(b.name));
        } catch (error) {
            console.error('Error getting exercises by category:', error);
            throw error;
        }
    }

    /**
     * Get exercises by muscle group
     */
    static async getExercisesByMuscleGroup(muscleGroup) {
        try {
            const exercises = await Database.getByIndex(Database.STORES.EXERCISES, 'muscleGroups', muscleGroup);
            return exercises
                .map(exercise => this.enrichExerciseData(exercise))
                .sort((a, b) => a.name.localeCompare(b.name));
        } catch (error) {
            console.error('Error getting exercises by muscle group:', error);
            throw error;
        }
    }

    /**
     * Get exercises by equipment type
     */
    static async getExercisesByEquipment(equipment) {
        try {
            const exercises = await Database.getByIndex(Database.STORES.EXERCISES, 'equipment', equipment);
            return exercises
                .map(exercise => this.enrichExerciseData(exercise))
                .sort((a, b) => a.name.localeCompare(b.name));
        } catch (error) {
            console.error('Error getting exercises by equipment:', error);
            throw error;
        }
    }

    /**
     * Get exercises by difficulty level
     */
    static async getExercisesByDifficulty(difficulty) {
        try {
            const exercises = await Database.getByIndex(Database.STORES.EXERCISES, 'difficulty', difficulty);
            return exercises
                .map(exercise => this.enrichExerciseData(exercise))
                .sort((a, b) => a.name.localeCompare(b.name));
        } catch (error) {
            console.error('Error getting exercises by difficulty:', error);
            throw error;
        }
    }

    /**
     * Search exercises with advanced filtering
     */
    static async searchExercises(query, filters = {}) {
        try {
            let exercises;
            
            if (!query || query.trim() === '') {
                exercises = await this.getAllExercises();
            } else {
                exercises = await Database.search(Database.STORES.EXERCISES, 'name', query, {
                    limit: filters.limit || 50
                });
            }

            // Apply additional filters
            exercises = this.applyFilters(exercises, filters);
            
            return exercises
                .map(exercise => this.enrichExerciseData(exercise))
                .sort((a, b) => a.name.localeCompare(b.name));
        } catch (error) {
            console.error('Error searching exercises:', error);
            throw error;
        }
    }

    /**
     * Apply advanced filters to exercise list
     */
    static applyFilters(exercises, filters) {
        let filtered = [...exercises];

        // Filter by category
        if (filters.category && filters.category !== 'all') {
            filtered = filtered.filter(exercise => exercise.category === filters.category);
        }

        // Filter by equipment
        if (filters.equipment && filters.equipment !== 'all') {
            filtered = filtered.filter(exercise => exercise.equipment === filters.equipment);
        }

        // Filter by difficulty
        if (filters.difficulty && filters.difficulty !== 'all') {
            filtered = filtered.filter(exercise => exercise.difficulty === filters.difficulty);
        }

        // Filter by muscle groups
        if (filters.muscleGroups && filters.muscleGroups.length > 0) {
            filtered = filtered.filter(exercise => 
                exercise.muscleGroups && 
                exercise.muscleGroups.some(group => filters.muscleGroups.includes(group))
            );
        }

        // Filter custom vs built-in exercises
        if (filters.isCustom !== undefined) {
            filtered = filtered.filter(exercise => exercise.isCustom === filters.isCustom);
        }

        return filtered;
    }

    /**
     * Add a new custom exercise
     */
    static async addExercise(exerciseData) {
        try {
            // Validate exercise data
            const validation = this.validateExerciseData(exerciseData);
            if (!validation.isValid) {
                throw new Error(`Validation failed: ${validation.errors.join(', ')}`);
            }

            const exercise = {
                name: exerciseData.name.trim(),
                category: exerciseData.category,
                muscleGroups: exerciseData.muscleGroups || [],
                equipment: exerciseData.equipment || 'bodyweight',
                difficulty: exerciseData.difficulty || 'beginner',
                instructions: exerciseData.instructions || '',
                tips: exerciseData.tips || [],
                variations: exerciseData.variations || [],
                safetyNotes: exerciseData.safetyNotes || [],
                videoUrl: exerciseData.videoUrl || '',
                imageUrl: exerciseData.imageUrl || '',
                isCustom: true
            };

            const id = await Database.add(Database.STORES.EXERCISES, exercise);
            return await this.getExerciseById(id);
        } catch (error) {
            console.error('Error adding exercise:', error);
            throw error;
        }
    }

    /**
     * Update an existing exercise
     */
    static async updateExercise(id, exerciseData) {
        try {
            const existingExercise = await Database.get(Database.STORES.EXERCISES, id);
            if (!existingExercise) {
                throw new Error('Exercise not found');
            }

            // Only allow editing custom exercises
            if (!existingExercise.isCustom) {
                throw new Error('Cannot edit built-in exercises');
            }

            // Validate updated data
            const validation = this.validateExerciseData(exerciseData);
            if (!validation.isValid) {
                throw new Error(`Validation failed: ${validation.errors.join(', ')}`);
            }

            const updatedExercise = {
                ...existingExercise,
                ...exerciseData,
                id: id,
                isCustom: true // Ensure this remains true
            };

            await Database.update(Database.STORES.EXERCISES, updatedExercise);
            return await this.getExerciseById(id);
        } catch (error) {
            console.error('Error updating exercise:', error);
            throw error;
        }
    }

    /**
     * Delete a custom exercise
     */
    static async deleteExercise(id) {
        try {
            const exercise = await Database.get(Database.STORES.EXERCISES, id);
            if (!exercise) {
                throw new Error('Exercise not found');
            }

            // Only allow deleting custom exercises
            if (!exercise.isCustom) {
                throw new Error('Cannot delete built-in exercises');
            }

            // Check if exercise is used in any workouts or plans
            const isUsed = await this.isExerciseInUse(id);
            if (isUsed) {
                throw new Error('Cannot delete exercise that is used in workouts or plans');
            }

            await Database.delete(Database.STORES.EXERCISES, id);
            return true;
        } catch (error) {
            console.error('Error deleting exercise:', error);
            throw error;
        }
    }

    /**
     * Check if exercise is used in workouts or plans
     */
    static async isExerciseInUse(exerciseId) {
        try {
            // Check sets table
            const sets = await Database.getByIndex(Database.STORES.SETS, 'exerciseId', exerciseId);
            if (sets.length > 0) {
                return true;
            }

            // Check plans
            const plans = await Database.getAll(Database.STORES.PLANS);
            for (const plan of plans) {
                if (plan.exercises && plan.exercises.some(ex => ex.exerciseId === exerciseId)) {
                    return true;
                }
            }

            return false;
        } catch (error) {
            console.error('Error checking exercise usage:', error);
            return false;
        }
    }

    /**
     * Duplicate an exercise (create custom copy)
     */
    static async duplicateExercise(id) {
        try {
            const originalExercise = await Database.get(Database.STORES.EXERCISES, id);
            if (!originalExercise) {
                throw new Error('Exercise not found');
            }

            const duplicatedExercise = {
                name: `${originalExercise.name} (Copy)`,
                category: originalExercise.category,
                muscleGroups: [...(originalExercise.muscleGroups || [])],
                equipment: originalExercise.equipment,
                difficulty: originalExercise.difficulty,
                instructions: originalExercise.instructions,
                tips: [...(originalExercise.tips || [])],
                variations: [...(originalExercise.variations || [])],
                safetyNotes: [...(originalExercise.safetyNotes || [])],
                videoUrl: originalExercise.videoUrl,
                imageUrl: originalExercise.imageUrl
            };

            return await this.addExercise(duplicatedExercise);
        } catch (error) {
            console.error('Error duplicating exercise:', error);
            throw error;
        }
    }

    /**
     * Get exercise statistics and usage
     */
    static async getExerciseStats(id) {
        try {
            const sets = await Database.getByIndex(Database.STORES.SETS, 'exerciseId', id);
            
            if (sets.length === 0) {
                return {
                    totalSets: 0,
                    totalReps: 0,
                    totalWeight: 0,
                    totalVolume: 0,
                    averageReps: 0,
                    averageWeight: 0,
                    maxWeight: 0,
                    maxReps: 0,
                    lastPerformed: null,
                    personalBests: [],
                    workoutCount: 0
                };
            }

            const totalSets = sets.length;
            const totalReps = sets.reduce((sum, set) => sum + (set.reps || 0), 0);
            const totalWeight = sets.reduce((sum, set) => sum + (set.weight || 0), 0);
            const totalVolume = sets.reduce((sum, set) => sum + ((set.weight || 0) * (set.reps || 0)), 0);
            const averageReps = totalReps / totalSets;
            const averageWeight = totalWeight / totalSets;
            const maxWeight = Math.max(...sets.map(set => set.weight || 0));
            const maxReps = Math.max(...sets.map(set => set.reps || 0));
            const lastPerformed = Math.max(...sets.map(set => new Date(set.timestamp).getTime()));
            const workoutCount = new Set(sets.map(set => set.workoutId)).size;

            const personalBests = this.calculatePersonalBests(sets);

            return {
                totalSets,
                totalReps,
                totalWeight,
                totalVolume,
                averageReps: parseFloat(averageReps.toFixed(1)),
                averageWeight: parseFloat(averageWeight.toFixed(1)),
                maxWeight,
                maxReps,
                lastPerformed: new Date(lastPerformed),
                personalBests,
                workoutCount
            };
        } catch (error) {
            console.error('Error getting exercise stats:', error);
            throw error;
        }
    }

    /**
     * Calculate personal bests for an exercise
     */
    static calculatePersonalBests(sets) {
        const personalBests = [];
        
        const maxWeight = Math.max(...sets.map(set => set.weight || 0));
        const maxReps = Math.max(...sets.map(set => set.reps || 0));
        const maxVolume = Math.max(...sets.map(set => (set.weight || 0) * (set.reps || 0)));
        const max1RM = Math.max(...sets.map(set => this.calculate1RM(set.weight || 0, set.reps || 0)));
        
        if (maxWeight > 0) {
            personalBests.push({
                type: 'max_weight',
                value: maxWeight,
                date: this.findDateForValue(sets, 'weight', maxWeight),
                description: `Max Weight: ${maxWeight} lbs`
            });
        }
        
        if (maxReps > 0) {
            personalBests.push({
                type: 'max_reps',
                value: maxReps,
                date: this.findDateForValue(sets, 'reps', maxReps),
                description: `Max Reps: ${maxReps}`
            });
        }
        
        if (maxVolume > 0) {
            personalBests.push({
                type: 'max_volume',
                value: maxVolume,
                date: this.findDateForVolume(sets, maxVolume),
                description: `Max Volume: ${maxVolume} lbs`
            });
        }

        if (max1RM > 0) {
            personalBests.push({
                type: 'max_1rm',
                value: max1RM,
                date: this.findDateFor1RM(sets, max1RM),
                description: `Estimated 1RM: ${max1RM.toFixed(1)} lbs`
            });
        }
        
        return personalBests;
    }

    /**
     * Calculate estimated 1-rep max using Epley formula
     */
    static calculate1RM(weight, reps) {
        if (!weight || !reps || reps === 0) return 0;
        if (reps === 1) return weight;
        return weight * (1 + reps / 30);
    }

    /**
     * Helper functions for finding dates of personal bests
     */
    static findDateForValue(sets, field, value) {
        const matchingSet = sets.find(set => set[field] === value);
        return matchingSet ? new Date(matchingSet.timestamp) : null;
    }

    static findDateForVolume(sets, volume) {
        const matchingSet = sets.find(set => (set.weight || 0) * (set.reps || 0) === volume);
        return matchingSet ? new Date(matchingSet.timestamp) : null;
    }

    static findDateFor1RM(sets, targetRM) {
        let closestSet = null;
        let closestDiff = Infinity;
        
        sets.forEach(set => {
            const setRM = this.calculate1RM(set.weight || 0, set.reps || 0);
            const diff = Math.abs(setRM - targetRM);
            if (diff < closestDiff) {
                closestDiff = diff;
                closestSet = set;
            }
        });
        
        return closestSet ? new Date(closestSet.timestamp) : null;
    }

    /**
     * Get exercise history and progress
     */
    static async getExerciseHistory(id, limit = 30) {
        try {
            const sets = await Database.getByIndex(Database.STORES.SETS, 'exerciseId', id);
            
            return sets
                .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
                .slice(0, limit)
                .map(set => ({
                    ...set,
                    date: new Date(set.timestamp),
                    volume: (set.weight || 0) * (set.reps || 0),
                    estimated1RM: this.calculate1RM(set.weight || 0, set.reps || 0)
                }));
        } catch (error) {
            console.error('Error getting exercise history:', error);
            throw error;
        }
    }

    /**
     * Get popular exercises based on usage
     */
    static async getPopularExercises(limit = 10) {
        try {
            const allSets = await Database.getAll(Database.STORES.SETS);
            const exerciseFrequency = {};
            
            allSets.forEach(set => {
                if (set.exerciseId) {
                    exerciseFrequency[set.exerciseId] = (exerciseFrequency[set.exerciseId] || 0) + 1;
                }
            });
            
            const sortedExercises = Object.entries(exerciseFrequency)
                .sort(([, a], [, b]) => b - a)
                .slice(0, limit);
            
            const popularExercises = [];
            for (const [exerciseId, frequency] of sortedExercises) {
                const exercise = await this.getExerciseById(parseInt(exerciseId));
                if (exercise) {
                    popularExercises.push({
                        ...exercise,
                        frequency,
                        usagePercentage: ((frequency / allSets.length) * 100).toFixed(1)
                    });
                }
            }
            
            return popularExercises;
        } catch (error) {
            console.error('Error getting popular exercises:', error);
            throw error;
        }
    }

    /**
     * Get recommended exercises based on criteria
     */
    static async getRecommendedExercises(criteria = {}) {
        try {
            const {
                muscleGroups = [],
                equipment = [],
                difficulty = null,
                excludeIds = [],
                limit = 5
            } = criteria;

            let exercises = await this.getAllExercises();
            
            // Filter by muscle groups
            if (muscleGroups.length > 0) {
                exercises = exercises.filter(exercise => 
                    exercise.muscleGroups && 
                    exercise.muscleGroups.some(group => muscleGroups.includes(group))
                );
            }
            
            // Filter by equipment
            if (equipment.length > 0) {
                exercises = exercises.filter(exercise => 
                    equipment.includes(exercise.equipment)
                );
            }
            
            // Filter by difficulty
            if (difficulty) {
                exercises = exercises.filter(exercise => 
                    exercise.difficulty === difficulty
                );
            }

            // Exclude specific exercises
            if (excludeIds.length > 0) {
                exercises = exercises.filter(exercise => 
                    !excludeIds.includes(exercise.id)
                );
            }
            
            // Shuffle and limit results
            const shuffled = exercises
                .map(exercise => this.enrichExerciseData(exercise))
                .sort(() => 0.5 - Math.random());
            
            return shuffled.slice(0, limit);
        } catch (error) {
            console.error('Error getting recommended exercises:', error);
            throw error;
        }
    }

    /**
     * Get exercises for specific workout goals
     */
    static async getExercisesForGoal(goal, options = {}) {
        const goalMappings = {
            'strength': {
                categories: ['chest', 'back', 'legs', 'shoulders'],
                equipment: ['barbell', 'dumbbells'],
                difficulty: ['intermediate', 'advanced']
            },
            'endurance': {
                categories: ['cardio', 'full-body'],
                equipment: ['bodyweight', 'resistance-bands'],
                difficulty: ['beginner', 'intermediate']
            },
            'muscle-building': {
                categories: ['chest', 'back', 'arms', 'legs', 'shoulders'],
                equipment: ['dumbbells', 'barbell', 'machine'],
                difficulty: ['intermediate', 'advanced']
            },
            'weight-loss': {
                categories: ['cardio', 'full-body'],
                equipment: ['bodyweight', 'kettlebell'],
                difficulty: ['beginner', 'intermediate']
            },
            'flexibility': {
                categories: ['core', 'full-body'],
                equipment: ['bodyweight'],
                difficulty: ['beginner']
            }
        };

        const mapping = goalMappings[goal];
        if (!mapping) {
            throw new Error('Invalid workout goal');
        }

        return await this.getRecommendedExercises({
            muscleGroups: mapping.categories,
            equipment: mapping.equipment,
            difficulty: mapping.difficulty[0], // Use first difficulty as primary
            limit: options.limit || 8
        });
    }

    /**
     * Validate exercise data
     */
    static validateExerciseData(data) {
        const errors = [];
        
        if (!data.name || typeof data.name !== 'string' || data.name.trim().length === 0) {
            errors.push('Exercise name is required and must be a non-empty string');
        }
        
        if (!data.category || !Object.values(this.CATEGORIES).some(cat => cat.id === data.category)) {
            errors.push('Valid exercise category is required');
        }
        
        if (data.difficulty && !['beginner', 'intermediate', 'advanced'].includes(data.difficulty)) {
            errors.push('Difficulty must be beginner, intermediate, or advanced');
        }
        
        if (!data.muscleGroups || !Array.isArray(data.muscleGroups) || data.muscleGroups.length === 0) {
            errors.push('Exercise must target at least one muscle group');
        }

        if (data.equipment && !Object.keys(this.EQUIPMENT_TYPES).includes(data.equipment)) {
            errors.push('Invalid equipment type');
        }
        
        return {
            isValid: errors.length === 0,
            errors: errors
        };
    }

    /**
     * Enrich exercise data with additional information
     */
    static enrichExerciseData(exercise) {
        return {
            ...exercise,
            categoryInfo: this.CATEGORIES[exercise.category.toUpperCase()] || this.CATEGORIES.FULL_BODY,
            equipmentInfo: this.EQUIPMENT_TYPES[exercise.equipment] || this.EQUIPMENT_TYPES.bodyweight,
            muscleGroupsInfo: (exercise.muscleGroups || []).map(group => 
                this.MUSCLE_GROUPS[group] || { name: group, category: 'unknown', type: 'primary' }
            ),
            difficultyLevel: exercise.difficulty || 'beginner',
            isBuiltIn: !exercise.isCustom
        };
    }

    /**
     * Export exercises for backup
     */
    static async exportExercises() {
        try {
            const exercises = await this.getAllExercises();
            return exercises.map(exercise => ({
                name: exercise.name,
                category: exercise.category,
                muscleGroups: exercise.muscleGroups,
                equipment: exercise.equipment,
                difficulty: exercise.difficulty,
                instructions: exercise.instructions,
                tips: exercise.tips,
                variations: exercise.variations,
                safetyNotes: exercise.safetyNotes,
                isCustom: exercise.isCustom
            }));
        } catch (error) {
            console.error('Error exporting exercises:', error);
            throw error;
        }
    }

    /**
     * Import exercises from backup
     */
    static async importExercises(exercisesData) {
        try {
            const importedExercises = [];
            
            for (const exerciseData of exercisesData) {
                try {
                    // Only import custom exercises to avoid duplicating built-ins
                    if (exerciseData.isCustom) {
                        const exercise = await this.addExercise(exerciseData);
                        importedExercises.push(exercise);
                    }
                } catch (error) {
                    console.error('Error importing exercise:', exerciseData.name, error);
                }
            }
            
            return importedExercises;
        } catch (error) {
            console.error('Error importing exercises:', error);
            throw error;
        }
    }

    /**
     * Get all available categories
     */
    static getCategories() {
        return Object.values(this.CATEGORIES);
    }

    /**
     * Get all available muscle groups
     */
    static getMuscleGroups() {
        return Object.entries(this.MUSCLE_GROUPS).map(([key, value]) => ({
            id: key,
            ...value
        }));
    }

    /**
     * Get all available equipment types
     */
    static getEquipmentTypes() {
        return Object.entries(this.EQUIPMENT_TYPES).map(([key, value]) => ({
            id: key,
            ...value
        }));
    }

    /**
     * Get difficulty levels
     */
    static getDifficultyLevels() {
        return [
            { id: 'beginner', name: 'Beginner', description: 'New to exercise or this movement' },
            { id: 'intermediate', name: 'Intermediate', description: 'Some experience with exercise' },
            { id: 'advanced', name: 'Advanced', description: 'Experienced with complex movements' }
        ];
    }

    /**
     * Generate exercise display information for UI
     */
    static getExerciseDisplayInfo(exercise) {
        const enriched = this.enrichExerciseData(exercise);
        return {
            id: enriched.id,
            name: enriched.name,
            category: enriched.categoryInfo.name,
            categoryIcon: enriched.categoryInfo.icon,
            muscleGroups: enriched.muscleGroupsInfo.map(mg => mg.name).join(', '),
            equipment: enriched.equipmentInfo.name,
            equipmentIcon: enriched.equipmentInfo.icon,
            difficulty: enriched.difficultyLevel,
            difficultyBadge: this.getDifficultyBadge(enriched.difficultyLevel),
            instructions: enriched.instructions || 'No instructions available',
            tips: enriched.tips || [],
            variations: enriched.variations || [],
            safetyNotes: enriched.safetyNotes || [],
            isCustom: enriched.isCustom || false,
            hasVideo: !!(enriched.videoUrl),
            hasImage: !!(enriched.imageUrl)
        };
    }

    /**
     * Get difficulty badge styling
     */
    static getDifficultyBadge(difficulty) {
        const badges = {
            'beginner': { class: 'ios-status-success', text: 'Beginner' },
            'intermediate': { class: 'ios-status-warning', text: 'Intermediate' },
            'advanced': { class: 'ios-status-error', text: 'Advanced' }
        };
        return badges[difficulty] || badges.beginner;
    }

    /**
     * Generate unique exercise ID for custom exercises
     */
    static generateExerciseId() {
        return 'exercise_' + Date.now().toString(36) + Math.random().toString(36).substr(2);
    }
}