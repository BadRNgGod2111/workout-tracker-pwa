/**
 * Data Management System
 * Handles export, import, sharing, backup, and storage management
 */

class DataManager {
    constructor(database) {
        this.database = database;
        this.version = '1.0.0';
        this.exportFormats = ['json', 'csv', 'txt'];
        this.maxFileSize = 50 * 1024 * 1024; // 50MB
        
        this.init();
    }

    init() {
        this.calculateStorageUsage();
    }

    // Data Export Functions
    async exportAllData(format = 'json', options = {}) {
        try {
            const data = await this.collectAllData();
            
            switch (format.toLowerCase()) {
                case 'json':
                    return this.exportAsJSON(data, options);
                case 'csv':
                    return this.exportAsCSV(data, options);
                case 'txt':
                    return this.exportAsText(data, options);
                default:
                    throw new Error(`Unsupported export format: ${format}`);
            }
        } catch (error) {
            console.error('Export failed:', error);
            throw error;
        }
    }

    async collectAllData() {
        const [
            workouts,
            exercises,
            plans,
            goals,
            measurements,
            achievements,
            settings
        ] = await Promise.all([
            this.database.getAllWorkouts(),
            this.database.getAllExercises(),
            this.database.getAllPlans ? this.database.getAllPlans() : [],
            this.getGoalsData(),
            this.getMeasurementsData(),
            this.getAchievementsData(),
            this.getSettingsData()
        ]);

        return {
            metadata: {
                exportDate: new Date().toISOString(),
                version: this.version,
                appVersion: '1.0.0',
                platform: navigator.platform,
                userAgent: navigator.userAgent,
                totalWorkouts: workouts.length,
                totalExercises: exercises.length,
                totalPlans: plans.length
            },
            workouts,
            exercises,
            plans,
            goals,
            measurements,
            achievements,
            settings,
            statistics: await this.getStatisticsData()
        };
    }

    async exportAsJSON(data, options = {}) {
        const exportData = {
            ...data,
            exportOptions: {
                includePersonalData: options.includePersonalData !== false,
                includeStatistics: options.includeStatistics !== false,
                dateRange: options.dateRange || null,
                compression: options.compression || false
            }
        };

        // Filter data based on options
        if (options.dateRange) {
            exportData.workouts = this.filterByDateRange(exportData.workouts, options.dateRange);
            exportData.measurements = this.filterByDateRange(exportData.measurements, options.dateRange);
        }

        if (!options.includePersonalData) {
            delete exportData.measurements;
            delete exportData.goals;
        }

        const jsonString = JSON.stringify(exportData, null, options.compact ? 0 : 2);
        const blob = new Blob([jsonString], { type: 'application/json' });
        
        return {
            blob,
            filename: this.generateFilename('workout-tracker-backup', 'json'),
            size: blob.size,
            data: exportData
        };
    }

    async exportAsCSV(data, options = {}) {
        const csvData = [];
        
        // Export workouts as CSV
        if (data.workouts && data.workouts.length > 0) {
            const workoutsCSV = this.convertWorkoutsToCSV(data.workouts);
            csvData.push('# Workouts Data');
            csvData.push(workoutsCSV);
            csvData.push('');
        }

        // Export exercises as CSV
        if (data.exercises && data.exercises.length > 0) {
            const exercisesCSV = this.convertExercisesToCSV(data.exercises);
            csvData.push('# Exercises Data');
            csvData.push(exercisesCSV);
            csvData.push('');
        }

        // Export measurements as CSV
        if (data.measurements && data.measurements.length > 0) {
            const measurementsCSV = this.convertMeasurementsToCSV(data.measurements);
            csvData.push('# Measurements Data');
            csvData.push(measurementsCSV);
        }

        const csvString = csvData.join('\n');
        const blob = new Blob([csvString], { type: 'text/csv' });
        
        return {
            blob,
            filename: this.generateFilename('workout-tracker-data', 'csv'),
            size: blob.size,
            data: csvString
        };
    }

    async exportAsText(data, options = {}) {
        const textData = [];
        
        textData.push('WORKOUT TRACKER DATA EXPORT');
        textData.push('=' .repeat(40));
        textData.push(`Export Date: ${new Date().toLocaleString()}`);
        textData.push(`Total Workouts: ${data.workouts?.length || 0}`);
        textData.push(`Total Exercises: ${data.exercises?.length || 0}`);
        textData.push('');

        // Recent workouts summary
        if (data.workouts && data.workouts.length > 0) {
            textData.push('RECENT WORKOUTS');
            textData.push('-'.repeat(20));
            
            const recentWorkouts = data.workouts
                .sort((a, b) => new Date(b.date) - new Date(a.date))
                .slice(0, 10);
            
            recentWorkouts.forEach(workout => {
                textData.push(`${new Date(workout.date).toLocaleDateString()}: ${workout.name || 'Workout'}`);
                if (workout.exercises) {
                    workout.exercises.forEach(exercise => {
                        textData.push(`  - ${exercise.name}: ${exercise.sets?.length || 0} sets`);
                    });
                }
                textData.push('');
            });
        }

        // Exercise library
        if (data.exercises && data.exercises.length > 0) {
            textData.push('EXERCISE LIBRARY');
            textData.push('-'.repeat(20));
            
            const groupedExercises = this.groupExercisesByCategory(data.exercises);
            Object.entries(groupedExercises).forEach(([category, exercises]) => {
                textData.push(`${category.toUpperCase()}:`);
                exercises.forEach(exercise => {
                    textData.push(`  - ${exercise.name}`);
                });
                textData.push('');
            });
        }

        const textString = textData.join('\n');
        const blob = new Blob([textString], { type: 'text/plain' });
        
        return {
            blob,
            filename: this.generateFilename('workout-tracker-summary', 'txt'),
            size: blob.size,
            data: textString
        };
    }

    // Data Import Functions
    async importData(file, options = {}) {
        if (!file) {
            throw new Error('No file provided for import');
        }

        if (file.size > this.maxFileSize) {
            throw new Error(`File too large. Maximum size is ${this.maxFileSize / (1024 * 1024)}MB`);
        }

        const fileType = this.detectFileType(file);
        const content = await this.readFile(file);

        try {
            switch (fileType) {
                case 'json':
                    return await this.importFromJSON(content, options);
                case 'csv':
                    return await this.importFromCSV(content, options);
                default:
                    throw new Error(`Unsupported file type: ${fileType}`);
            }
        } catch (error) {
            console.error('Import failed:', error);
            throw new Error(`Import failed: ${error.message}`);
        }
    }

    async importFromJSON(jsonContent, options = {}) {
        let data;
        
        try {
            data = JSON.parse(jsonContent);
        } catch (error) {
            throw new Error('Invalid JSON format');
        }

        // Validate data structure
        this.validateImportData(data);

        const importResults = {
            workouts: 0,
            exercises: 0,
            plans: 0,
            goals: 0,
            measurements: 0,
            errors: [],
            warnings: []
        };

        // Import exercises first (dependencies)
        if (data.exercises && Array.isArray(data.exercises)) {
            try {
                for (const exercise of data.exercises) {
                    if (this.validateExercise(exercise)) {
                        await this.database.addExercise(exercise);
                        importResults.exercises++;
                    }
                }
            } catch (error) {
                importResults.errors.push(`Exercise import error: ${error.message}`);
            }
        }

        // Import workouts
        if (data.workouts && Array.isArray(data.workouts)) {
            for (const workout of data.workouts) {
                try {
                    if (this.validateWorkout(workout)) {
                        // Check for duplicates
                        if (options.skipDuplicates) {
                            const existing = await this.database.getWorkoutByDate(workout.date);
                            if (existing) {
                                importResults.warnings.push(`Skipped duplicate workout: ${workout.date}`);
                                continue;
                            }
                        }
                        
                        await this.database.addWorkout(workout);
                        importResults.workouts++;
                    }
                } catch (error) {
                    importResults.errors.push(`Workout import error: ${error.message}`);
                }
            }
        }

        // Import plans
        if (data.plans && Array.isArray(data.plans)) {
            for (const plan of data.plans) {
                try {
                    if (this.validatePlan(plan)) {
                        await this.database.addPlan(plan);
                        importResults.plans++;
                    }
                } catch (error) {
                    importResults.errors.push(`Plan import error: ${error.message}`);
                }
            }
        }

        // Import goals, measurements, etc.
        await this.importSupplementaryData(data, importResults, options);

        return importResults;
    }

    async importFromCSV(csvContent, options = {}) {
        const lines = csvContent.split('\n').filter(line => line.trim());
        const importResults = {
            workouts: 0,
            exercises: 0,
            errors: [],
            warnings: []
        };

        let currentSection = null;
        let headers = [];
        
        for (const line of lines) {
            if (line.startsWith('#')) {
                currentSection = line.substring(1).trim().toLowerCase();
                continue;
            }
            
            if (line.includes(',')) {
                const values = this.parseCSVLine(line);
                
                if (headers.length === 0) {
                    headers = values;
                    continue;
                }
                
                try {
                    const obj = this.csvRowToObject(headers, values);
                    
                    if (currentSection === 'workouts data') {
                        await this.database.addWorkout(obj);
                        importResults.workouts++;
                    } else if (currentSection === 'exercises data') {
                        await this.database.addExercise(obj);
                        importResults.exercises++;
                    }
                } catch (error) {
                    importResults.errors.push(`CSV import error: ${error.message}`);
                }
            }
        }

        return importResults;
    }

    // Sharing Functions
    async shareWorkoutPlan(planId, format = 'text') {
        const plan = await this.database.getPlan(planId);
        if (!plan) {
            throw new Error('Plan not found');
        }

        switch (format) {
            case 'text':
                return this.formatPlanAsText(plan);
            case 'json':
                return this.formatPlanAsJSON(plan);
            case 'url':
                return this.generatePlanShareURL(plan);
            default:
                throw new Error(`Unsupported share format: ${format}`);
        }
    }

    formatPlanAsText(plan) {
        const lines = [];
        
        lines.push(`🏋️ ${plan.name.toUpperCase()}`);
        lines.push('='.repeat(plan.name.length + 4));
        
        if (plan.description) {
            lines.push(plan.description);
            lines.push('');
        }
        
        lines.push(`Duration: ${plan.duration || 'Flexible'}`);
        lines.push(`Difficulty: ${plan.difficulty || 'Intermediate'}`);
        lines.push(`Target: ${plan.targetMuscleGroups?.join(', ') || 'Full Body'}`);
        lines.push('');
        
        if (plan.exercises && plan.exercises.length > 0) {
            lines.push('EXERCISES:');
            lines.push('-'.repeat(10));
            
            plan.exercises.forEach((exercise, index) => {
                lines.push(`${index + 1}. ${exercise.name}`);
                
                if (exercise.sets && exercise.reps) {
                    lines.push(`   ${exercise.sets} sets × ${exercise.reps} reps`);
                }
                
                if (exercise.weight) {
                    lines.push(`   Weight: ${exercise.weight}lbs`);
                }
                
                if (exercise.restTime) {
                    lines.push(`   Rest: ${Math.floor(exercise.restTime / 60)}:${(exercise.restTime % 60).toString().padStart(2, '0')}`);
                }
                
                if (exercise.notes) {
                    lines.push(`   Notes: ${exercise.notes}`);
                }
                
                lines.push('');
            });
        }
        
        lines.push(`Created with Workout Tracker`);
        lines.push(`Shared on ${new Date().toLocaleDateString()}`);
        
        return lines.join('\n');
    }

    formatPlanAsJSON(plan) {
        const sharePlan = {
            name: plan.name,
            description: plan.description,
            difficulty: plan.difficulty,
            duration: plan.duration,
            targetMuscleGroups: plan.targetMuscleGroups,
            exercises: plan.exercises?.map(exercise => ({
                name: exercise.name,
                sets: exercise.sets,
                reps: exercise.reps,
                weight: exercise.weight,
                restTime: exercise.restTime,
                notes: exercise.notes,
                muscleGroup: exercise.muscleGroup
            })),
            metadata: {
                sharedFrom: 'Workout Tracker',
                shareDate: new Date().toISOString(),
                version: this.version
            }
        };
        
        return JSON.stringify(sharePlan, null, 2);
    }

    // Data Cleanup and Reset Functions
    async resetAllData(options = {}) {
        const resetResults = {
            workouts: 0,
            exercises: 0,
            plans: 0,
            goals: 0,
            measurements: 0,
            achievements: 0,
            settings: false
        };

        try {
            if (options.workouts !== false) {
                const workouts = await this.database.getAllWorkouts();
                resetResults.workouts = workouts.length;
                await this.database.clearWorkouts();
            }

            if (options.exercises !== false) {
                const exercises = await this.database.getAllExercises();
                resetResults.exercises = exercises.length;
                await this.database.clearExercises();
            }

            if (options.plans !== false && this.database.clearPlans) {
                const plans = await this.database.getAllPlans();
                resetResults.plans = plans.length;
                await this.database.clearPlans();
            }

            if (options.goals !== false) {
                resetResults.goals = this.clearGoalsData();
            }

            if (options.measurements !== false) {
                resetResults.measurements = this.clearMeasurementsData();
            }

            if (options.achievements !== false) {
                resetResults.achievements = this.clearAchievementsData();
            }

            if (options.settings !== false) {
                resetResults.settings = this.clearSettingsData();
            }

            // Clear cache and recalculate storage
            await this.clearAppCache();
            this.calculateStorageUsage();

            return resetResults;
        } catch (error) {
            console.error('Reset failed:', error);
            throw error;
        }
    }

    async cleanupOldData(daysOld = 90) {
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - daysOld);

        const cleanupResults = {
            workouts: 0,
            measurements: 0,
            oldExercises: 0
        };

        try {
            // Remove old workouts
            const workouts = await this.database.getAllWorkouts();
            const oldWorkouts = workouts.filter(w => new Date(w.date) < cutoffDate);
            
            for (const workout of oldWorkouts) {
                await this.database.deleteWorkout(workout.id);
                cleanupResults.workouts++;
            }

            // Remove old measurements
            const measurements = this.getMeasurementsData();
            const oldMeasurements = measurements.filter(m => new Date(m.date) < cutoffDate);
            cleanupResults.measurements = oldMeasurements.length;
            this.setMeasurementsData(measurements.filter(m => new Date(m.date) >= cutoffDate));

            // Remove unused exercises
            const exercises = await this.database.getAllExercises();
            const usedExerciseIds = new Set();
            
            workouts.forEach(workout => {
                workout.exercises?.forEach(exercise => {
                    if (exercise.exerciseId) {
                        usedExerciseIds.add(exercise.exerciseId);
                    }
                });
            });

            const unusedExercises = exercises.filter(ex => !usedExerciseIds.has(ex.id));
            for (const exercise of unusedExercises) {
                await this.database.deleteExercise(exercise.id);
                cleanupResults.oldExercises++;
            }

            this.calculateStorageUsage();
            return cleanupResults;
        } catch (error) {
            console.error('Cleanup failed:', error);
            throw error;
        }
    }

    // Storage Statistics
    calculateStorageUsage() {
        const storage = {
            total: 0,
            available: 0,
            used: 0,
            breakdown: {}
        };

        try {
            // Calculate localStorage usage
            let localStorageSize = 0;
            for (let key in localStorage) {
                if (localStorage.hasOwnProperty(key)) {
                    localStorageSize += localStorage[key].length + key.length;
                }
            }

            storage.breakdown.localStorage = localStorageSize;

            // Estimate IndexedDB usage (if available)
            if ('storage' in navigator && 'estimate' in navigator.storage) {
                navigator.storage.estimate().then(estimate => {
                    storage.total = estimate.quota || 0;
                    storage.used = estimate.usage || 0;
                    storage.available = storage.total - storage.used;
                    this.storageStats = storage;
                });
            } else {
                storage.used = localStorageSize;
                this.storageStats = storage;
            }

            // Break down by data type
            storage.breakdown.workouts = this.estimateDataSize('workouts');
            storage.breakdown.exercises = this.estimateDataSize('exercises');
            storage.breakdown.settings = this.estimateDataSize('settings');
            storage.breakdown.cache = this.estimateDataSize('cache');

            this.storageStats = storage;
            return storage;
        } catch (error) {
            console.error('Storage calculation failed:', error);
            return storage;
        }
    }

    getStorageStats() {
        return this.storageStats || this.calculateStorageUsage();
    }

    // Utility Functions
    generateFilename(prefix, extension) {
        const date = new Date();
        const dateStr = date.toISOString().split('T')[0];
        const timeStr = date.toTimeString().split(' ')[0].replace(/:/g, '-');
        return `${prefix}-${dateStr}-${timeStr}.${extension}`;
    }

    detectFileType(file) {
        const extension = file.name.split('.').pop().toLowerCase();
        const mimeType = file.type.toLowerCase();
        
        if (extension === 'json' || mimeType.includes('json')) {
            return 'json';
        } else if (extension === 'csv' || mimeType.includes('csv')) {
            return 'csv';
        } else if (extension === 'txt' || mimeType.includes('text')) {
            return 'txt';
        }
        
        return 'unknown';
    }

    async readFile(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result);
            reader.onerror = () => reject(new Error('Failed to read file'));
            reader.readAsText(file);
        });
    }

    filterByDateRange(items, dateRange) {
        if (!dateRange || !dateRange.start || !dateRange.end) {
            return items;
        }
        
        const start = new Date(dateRange.start);
        const end = new Date(dateRange.end);
        
        return items.filter(item => {
            const itemDate = new Date(item.date || item.createdAt);
            return itemDate >= start && itemDate <= end;
        });
    }

    // Validation Functions
    validateImportData(data) {
        if (!data || typeof data !== 'object') {
            throw new Error('Invalid data format');
        }
        
        if (data.metadata) {
            if (!data.metadata.version) {
                console.warn('No version information in import data');
            }
        }
        
        return true;
    }

    validateWorkout(workout) {
        return workout && workout.date && typeof workout.date === 'string';
    }

    validateExercise(exercise) {
        return exercise && exercise.name && typeof exercise.name === 'string';
    }

    validatePlan(plan) {
        return plan && plan.name && typeof plan.name === 'string';
    }

    // Data conversion helpers
    convertWorkoutsToCSV(workouts) {
        const headers = ['Date', 'Name', 'Duration', 'Exercises', 'Sets', 'Notes'];
        const rows = [headers.join(',')];
        
        workouts.forEach(workout => {
            const row = [
                workout.date || '',
                workout.name || '',
                workout.duration || '',
                workout.exercises?.length || 0,
                workout.exercises?.reduce((sum, ex) => sum + (ex.sets?.length || 0), 0) || 0,
                (workout.notes || '').replace(/,/g, ';')
            ];
            rows.push(row.join(','));
        });
        
        return rows.join('\n');
    }

    convertExercisesToCSV(exercises) {
        const headers = ['Name', 'Category', 'Muscle Group', 'Equipment', 'Instructions'];
        const rows = [headers.join(',')];
        
        exercises.forEach(exercise => {
            const row = [
                exercise.name || '',
                exercise.category || '',
                exercise.muscleGroup || '',
                exercise.equipment || '',
                (exercise.instructions || '').replace(/,/g, ';')
            ];
            rows.push(row.join(','));
        });
        
        return rows.join('\n');
    }

    convertMeasurementsToCSV(measurements) {
        const headers = ['Date', 'Type', 'Value', 'Unit', 'Notes'];
        const rows = [headers.join(',')];
        
        measurements.forEach(measurement => {
            const row = [
                measurement.date || '',
                measurement.type || '',
                measurement.value || '',
                measurement.unit || '',
                (measurement.notes || '').replace(/,/g, ';')
            ];
            rows.push(row.join(','));
        });
        
        return rows.join('\n');
    }

    parseCSVLine(line) {
        const result = [];
        let current = '';
        let inQuotes = false;
        
        for (let i = 0; i < line.length; i++) {
            const char = line[i];
            
            if (char === '"') {
                inQuotes = !inQuotes;
            } else if (char === ',' && !inQuotes) {
                result.push(current.trim());
                current = '';
            } else {
                current += char;
            }
        }
        
        result.push(current.trim());
        return result;
    }

    csvRowToObject(headers, values) {
        const obj = {};
        headers.forEach((header, index) => {
            obj[header.toLowerCase().replace(/\s+/g, '')] = values[index] || '';
        });
        return obj;
    }

    groupExercisesByCategory(exercises) {
        return exercises.reduce((groups, exercise) => {
            const category = exercise.category || exercise.muscleGroup || 'Other';
            if (!groups[category]) {
                groups[category] = [];
            }
            groups[category].push(exercise);
            return groups;
        }, {});
    }

    estimateDataSize(dataType) {
        try {
            const keys = Object.keys(localStorage).filter(key => key.includes(dataType));
            return keys.reduce((size, key) => {
                return size + (localStorage[key]?.length || 0);
            }, 0);
        } catch (error) {
            return 0;
        }
    }

    // Data access helpers for supplementary data
    getGoalsData() {
        try {
            const saved = localStorage.getItem('workoutTracker_goals');
            return saved ? JSON.parse(saved) : [];
        } catch (error) {
            return [];
        }
    }

    getMeasurementsData() {
        try {
            const saved = localStorage.getItem('workoutTracker_measurements');
            return saved ? JSON.parse(saved) : [];
        } catch (error) {
            return [];
        }
    }

    getAchievementsData() {
        try {
            const saved = localStorage.getItem('workoutTracker_achievements');
            return saved ? JSON.parse(saved) : [];
        } catch (error) {
            return [];
        }
    }

    getSettingsData() {
        try {
            const settings = {};
            Object.keys(localStorage).forEach(key => {
                if (key.includes('settings') || key.includes('preferences')) {
                    settings[key] = localStorage.getItem(key);
                }
            });
            return settings;
        } catch (error) {
            return {};
        }
    }

    async getStatisticsData() {
        try {
            // Get basic statistics
            const workouts = await this.database.getAllWorkouts();
            const exercises = await this.database.getAllExercises();
            
            return {
                totalWorkouts: workouts.length,
                totalExercises: exercises.length,
                firstWorkout: workouts.length > 0 ? Math.min(...workouts.map(w => new Date(w.date))) : null,
                lastWorkout: workouts.length > 0 ? Math.max(...workouts.map(w => new Date(w.date))) : null,
                totalSets: workouts.reduce((sum, w) => sum + (w.exercises?.reduce((s, e) => s + (e.sets?.length || 0), 0) || 0), 0),
                averageWorkoutDuration: workouts.length > 0 ? workouts.reduce((sum, w) => sum + (w.duration || 0), 0) / workouts.length : 0
            };
        } catch (error) {
            console.error('Failed to get statistics:', error);
            return {};
        }
    }

    async importSupplementaryData(data, importResults, options) {
        // Import goals
        if (data.goals && Array.isArray(data.goals)) {
            try {
                localStorage.setItem('workoutTracker_goals', JSON.stringify(data.goals));
                importResults.goals = data.goals.length;
            } catch (error) {
                importResults.errors.push(`Goals import error: ${error.message}`);
            }
        }

        // Import measurements
        if (data.measurements && Array.isArray(data.measurements)) {
            try {
                localStorage.setItem('workoutTracker_measurements', JSON.stringify(data.measurements));
                importResults.measurements = data.measurements.length;
            } catch (error) {
                importResults.errors.push(`Measurements import error: ${error.message}`);
            }
        }
    }

    setMeasurementsData(measurements) {
        localStorage.setItem('workoutTracker_measurements', JSON.stringify(measurements));
    }

    clearGoalsData() {
        const goals = this.getGoalsData();
        localStorage.removeItem('workoutTracker_goals');
        return goals.length;
    }

    clearMeasurementsData() {
        const measurements = this.getMeasurementsData();
        localStorage.removeItem('workoutTracker_measurements');
        return measurements.length;
    }

    clearAchievementsData() {
        const achievements = this.getAchievementsData();
        localStorage.removeItem('workoutTracker_achievements');
        return achievements.length;
    }

    clearSettingsData() {
        const settingsKeys = Object.keys(localStorage).filter(key => 
            key.includes('settings') || key.includes('preferences') || key.includes('workoutTracker_')
        );
        settingsKeys.forEach(key => localStorage.removeItem(key));
        return settingsKeys.length > 0;
    }

    async clearAppCache() {
        if ('caches' in window) {
            const cacheNames = await caches.keys();
            await Promise.all(cacheNames.map(name => caches.delete(name)));
        }
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = DataManager;
}