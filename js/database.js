/**
 * Database Layer - IndexedDB Implementation for Workout Tracker PWA
 * Provides comprehensive data management with CRUD operations, validation, and backup functionality
 */

console.log('📦 database.js loaded');

class Database {
    static dbName = 'WorkoutTrackerDB';
    static version = 2; // Increased for enhanced schema
    static db = null;
    static isInitialized = false;

    // Database Schema Constants
    static STORES = {
        EXERCISES: 'exercises',
        WORKOUTS: 'workouts',
        PLANS: 'plans',
        SETS: 'sets',
        SETTINGS: 'settings',
        PROGRESS: 'progress'
    };

    static EXERCISE_CATEGORIES = [
        'chest', 'back', 'shoulders', 'arms', 'legs', 'core', 'cardio', 'full-body'
    ];

    static DIFFICULTY_LEVELS = ['beginner', 'intermediate', 'advanced'];

    static EQUIPMENT_TYPES = [
        'bodyweight', 'dumbbells', 'barbell', 'resistance-bands', 'kettlebell', 
        'pull-up-bar', 'bench', 'machine', 'cables', 'medicine-ball'
    ];

    /**
     * Initialize the database and create object stores
     */
    static async init() {
        if (this.isInitialized) {
            return Promise.resolve();
        }

        return new Promise((resolve, reject) => {
            if (!window.indexedDB) {
                reject(new Error('IndexedDB is not supported in this browser'));
                return;
            }

            const request = indexedDB.open(this.dbName, this.version);

            request.onerror = () => {
                const error = new Error(`Database failed to open: ${request.error?.message || 'Unknown error'}`);
                console.error('Database initialization error:', error);
                reject(error);
            };

            request.onsuccess = async () => {
                this.db = request.result;
                this.isInitialized = true;
                
                // Set up error handler for the database
                this.db.onerror = (event) => {
                    console.error('Database error:', event.target.error);
                };

                console.log('Database initialized successfully');
                
                // Initialize default data if needed
                try {
                    await this.initializeDefaultData();
                    resolve();
                } catch (error) {
                    console.error('Error initializing default data:', error);
                    resolve(); // Don't fail initialization for default data errors
                }
            };

            request.onupgradeneeded = (event) => {
                const db = event.target.result;
                console.log(`Database upgrade needed from version ${event.oldVersion} to ${event.newVersion}`);
                this.createObjectStores(db, event.oldVersion);
            };

            request.onblocked = () => {
                console.warn('Database upgrade blocked. Please close other tabs with this app.');
            };
        });
    }

    /**
     * Create and configure object stores with indexes
     */
    static createObjectStores(db, oldVersion) {
        try {
            // Exercises Store
            if (!db.objectStoreNames.contains(this.STORES.EXERCISES)) {
                const exerciseStore = db.createObjectStore(this.STORES.EXERCISES, {
                    keyPath: 'id',
                    autoIncrement: true
                });
                
                // Create indexes for efficient querying
                exerciseStore.createIndex('name', 'name', { unique: false });
                exerciseStore.createIndex('category', 'category', { unique: false });
                exerciseStore.createIndex('difficulty', 'difficulty', { unique: false });
                exerciseStore.createIndex('equipment', 'equipment', { unique: false });
                exerciseStore.createIndex('muscleGroups', 'muscleGroups', { unique: false, multiEntry: true });
                exerciseStore.createIndex('isCustom', 'isCustom', { unique: false });
                exerciseStore.createIndex('createdAt', 'createdAt', { unique: false });
                
                console.log('Exercises store created');
            }

            // Workouts Store
            if (!db.objectStoreNames.contains(this.STORES.WORKOUTS)) {
                const workoutStore = db.createObjectStore(this.STORES.WORKOUTS, {
                    keyPath: 'id',
                    autoIncrement: true
                });
                
                workoutStore.createIndex('name', 'name', { unique: false });
                workoutStore.createIndex('date', 'date', { unique: false });
                workoutStore.createIndex('startTime', 'startTime', { unique: false });
                workoutStore.createIndex('endTime', 'endTime', { unique: false });
                workoutStore.createIndex('status', 'status', { unique: false });
                workoutStore.createIndex('planId', 'planId', { unique: false });
                workoutStore.createIndex('synced', 'synced', { unique: false });
                
                console.log('Workouts store created');
            }

            // Plans Store
            if (!db.objectStoreNames.contains(this.STORES.PLANS)) {
                const planStore = db.createObjectStore(this.STORES.PLANS, {
                    keyPath: 'id',
                    autoIncrement: true
                });
                
                planStore.createIndex('name', 'name', { unique: false });
                planStore.createIndex('difficulty', 'difficulty', { unique: false });
                planStore.createIndex('category', 'category', { unique: false });
                planStore.createIndex('isPublic', 'isPublic', { unique: false });
                planStore.createIndex('createdBy', 'createdBy', { unique: false });
                planStore.createIndex('tags', 'tags', { unique: false, multiEntry: true });
                
                console.log('Plans store created');
            }

            // Sets Store
            if (!db.objectStoreNames.contains(this.STORES.SETS)) {
                const setStore = db.createObjectStore(this.STORES.SETS, {
                    keyPath: 'id',
                    autoIncrement: true
                });
                
                setStore.createIndex('workoutId', 'workoutId', { unique: false });
                setStore.createIndex('exerciseId', 'exerciseId', { unique: false });
                setStore.createIndex('timestamp', 'timestamp', { unique: false });
                setStore.createIndex('setNumber', 'setNumber', { unique: false });
                
                console.log('Sets store created');
            }

            // Settings Store
            if (!db.objectStoreNames.contains(this.STORES.SETTINGS)) {
                const settingsStore = db.createObjectStore(this.STORES.SETTINGS, {
                    keyPath: 'key'
                });
                
                console.log('Settings store created');
            }

            // Progress Store (New in v2)
            if (!db.objectStoreNames.contains(this.STORES.PROGRESS)) {
                const progressStore = db.createObjectStore(this.STORES.PROGRESS, {
                    keyPath: 'id',
                    autoIncrement: true
                });
                
                progressStore.createIndex('exerciseId', 'exerciseId', { unique: false });
                progressStore.createIndex('date', 'date', { unique: false });
                progressStore.createIndex('type', 'type', { unique: false }); // 'weight', 'reps', 'time', etc.
                
                console.log('Progress store created');
            }

        } catch (error) {
            console.error('Error creating object stores:', error);
            throw error;
        }
    }

    /**
     * Validate data before database operations
     */
    static validateData(storeName, data) {
        const errors = [];

        switch (storeName) {
            case this.STORES.EXERCISES:
                if (!data.name || typeof data.name !== 'string' || data.name.trim().length === 0) {
                    errors.push('Exercise name is required and must be a non-empty string');
                }
                if (!data.category || !this.EXERCISE_CATEGORIES.includes(data.category)) {
                    errors.push(`Exercise category must be one of: ${this.EXERCISE_CATEGORIES.join(', ')}`);
                }
                if (data.difficulty && !this.DIFFICULTY_LEVELS.includes(data.difficulty)) {
                    errors.push(`Difficulty must be one of: ${this.DIFFICULTY_LEVELS.join(', ')}`);
                }
                if (!data.muscleGroups || !Array.isArray(data.muscleGroups) || data.muscleGroups.length === 0) {
                    errors.push('Exercise must target at least one muscle group');
                }
                break;

            case this.STORES.WORKOUTS:
                if (!data.name || typeof data.name !== 'string' || data.name.trim().length === 0) {
                    errors.push('Workout name is required');
                }
                if (!data.startTime || !this.isValidISODate(data.startTime)) {
                    errors.push('Valid start time is required');
                }
                if (data.endTime && !this.isValidISODate(data.endTime)) {
                    errors.push('End time must be a valid ISO date string');
                }
                break;

            case this.STORES.PLANS:
                if (!data.name || typeof data.name !== 'string' || data.name.trim().length === 0) {
                    errors.push('Plan name is required');
                }
                if (data.difficulty && !this.DIFFICULTY_LEVELS.includes(data.difficulty)) {
                    errors.push(`Plan difficulty must be one of: ${this.DIFFICULTY_LEVELS.join(', ')}`);
                }
                if (!data.exercises || !Array.isArray(data.exercises)) {
                    errors.push('Plan must include an exercises array');
                }
                break;

            case this.STORES.SETS:
                if (!data.workoutId || typeof data.workoutId !== 'number') {
                    errors.push('Set must belong to a valid workout');
                }
                if (!data.exerciseId || typeof data.exerciseId !== 'number') {
                    errors.push('Set must reference a valid exercise');
                }
                if (data.reps !== undefined && (typeof data.reps !== 'number' || data.reps < 0)) {
                    errors.push('Reps must be a non-negative number');
                }
                if (data.weight !== undefined && (typeof data.weight !== 'number' || data.weight < 0)) {
                    errors.push('Weight must be a non-negative number');
                }
                break;
        }

        return {
            isValid: errors.length === 0,
            errors: errors
        };
    }

    /**
     * Check if a string is a valid ISO date
     */
    static isValidISODate(dateString) {
        if (typeof dateString !== 'string') return false;
        const date = new Date(dateString);
        return date instanceof Date && !isNaN(date.getTime()) && dateString.includes('T');
    }

    /**
     * Sanitize data by removing potential harmful content
     */
    static sanitizeData(data) {
        const sanitized = { ...data };
        
        // Remove HTML tags from string fields
        const stringFields = ['name', 'description', 'instructions', 'notes'];
        stringFields.forEach(field => {
            if (sanitized[field] && typeof sanitized[field] === 'string') {
                sanitized[field] = sanitized[field].replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
                sanitized[field] = sanitized[field].trim();
            }
        });

        return sanitized;
    }

    /**
     * Add a new record to the specified store
     */
    static async add(storeName, data) {
        try {
            if (!this.db) {
                throw new Error('Database not initialized. Call Database.init() first.');
            }

            // Sanitize and validate data
            const sanitizedData = this.sanitizeData(data);
            const validation = this.validateData(storeName, sanitizedData);
            
            if (!validation.isValid) {
                throw new Error(`Validation failed: ${validation.errors.join(', ')}`);
            }

            return new Promise((resolve, reject) => {
                const transaction = this.db.transaction([storeName], 'readwrite');
                const store = transaction.objectStore(storeName);
                
                const dataWithMetadata = {
                    ...sanitizedData,
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString()
                };

                const request = store.add(dataWithMetadata);

                transaction.onerror = () => {
                    const error = new Error(`Transaction failed: ${transaction.error?.message}`);
                    console.error('Add transaction error:', error);
                    reject(error);
                };

                request.onerror = () => {
                    const error = new Error(`Add operation failed: ${request.error?.message}`);
                    console.error('Add request error:', error);
                    reject(error);
                };

                request.onsuccess = () => {
                    console.log(`Added record to ${storeName} with ID:`, request.result);
                    resolve(request.result);
                };
            });
        } catch (error) {
            console.error(`Error adding to ${storeName}:`, error);
            throw error;
        }
    }

    /**
     * Get a record by ID from the specified store
     */
    static async get(storeName, id) {
        try {
            if (!this.db) {
                throw new Error('Database not initialized');
            }

            if (id === undefined || id === null) {
                throw new Error('ID is required');
            }

            return new Promise((resolve, reject) => {
                const transaction = this.db.transaction([storeName], 'readonly');
                const store = transaction.objectStore(storeName);
                const request = store.get(id);

                transaction.onerror = () => {
                    reject(new Error(`Transaction failed: ${transaction.error?.message}`));
                };

                request.onerror = () => {
                    reject(new Error(`Get operation failed: ${request.error?.message}`));
                };

                request.onsuccess = () => {
                    resolve(request.result || null);
                };
            });
        } catch (error) {
            console.error(`Error getting from ${storeName}:`, error);
            throw error;
        }
    }

    /**
     * Get all records from the specified store
     */
    static async getAll(storeName, options = {}) {
        try {
            if (!this.db) {
                throw new Error('Database not initialized');
            }

            return new Promise((resolve, reject) => {
                const transaction = this.db.transaction([storeName], 'readonly');
                const store = transaction.objectStore(storeName);
                const request = store.getAll();

                transaction.onerror = () => {
                    reject(new Error(`Transaction failed: ${transaction.error?.message}`));
                };

                request.onerror = () => {
                    reject(new Error(`GetAll operation failed: ${request.error?.message}`));
                };

                request.onsuccess = () => {
                    let results = request.result || [];
                    
                    // Apply sorting if specified
                    if (options.sortBy) {
                        results.sort((a, b) => {
                            const aVal = a[options.sortBy];
                            const bVal = b[options.sortBy];
                            
                            if (options.sortOrder === 'desc') {
                                return bVal > aVal ? 1 : bVal < aVal ? -1 : 0;
                            } else {
                                return aVal > bVal ? 1 : aVal < bVal ? -1 : 0;
                            }
                        });
                    }
                    
                    // Apply limit if specified
                    if (options.limit && options.limit > 0) {
                        results = results.slice(0, options.limit);
                    }
                    
                    resolve(results);
                };
            });
        } catch (error) {
            console.error(`Error getting all from ${storeName}:`, error);
            throw error;
        }
    }

    /**
     * Update an existing record
     */
    static async update(storeName, data) {
        try {
            if (!this.db) {
                throw new Error('Database not initialized');
            }

            if (!data.id) {
                throw new Error('ID is required for update operation');
            }

            // Sanitize and validate data
            const sanitizedData = this.sanitizeData(data);
            const validation = this.validateData(storeName, sanitizedData);
            
            if (!validation.isValid) {
                throw new Error(`Validation failed: ${validation.errors.join(', ')}`);
            }

            return new Promise((resolve, reject) => {
                const transaction = this.db.transaction([storeName], 'readwrite');
                const store = transaction.objectStore(storeName);
                
                const dataWithMetadata = {
                    ...sanitizedData,
                    updatedAt: new Date().toISOString()
                };

                const request = store.put(dataWithMetadata);

                transaction.onerror = () => {
                    reject(new Error(`Transaction failed: ${transaction.error?.message}`));
                };

                request.onerror = () => {
                    reject(new Error(`Update operation failed: ${request.error?.message}`));
                };

                request.onsuccess = () => {
                    console.log(`Updated record in ${storeName} with ID:`, request.result);
                    resolve(request.result);
                };
            });
        } catch (error) {
            console.error(`Error updating ${storeName}:`, error);
            throw error;
        }
    }

    /**
     * Delete a record by ID
     */
    static async delete(storeName, id) {
        try {
            if (!this.db) {
                throw new Error('Database not initialized');
            }

            if (id === undefined || id === null) {
                throw new Error('ID is required for delete operation');
            }

            return new Promise((resolve, reject) => {
                const transaction = this.db.transaction([storeName], 'readwrite');
                const store = transaction.objectStore(storeName);
                const request = store.delete(id);

                transaction.onerror = () => {
                    reject(new Error(`Transaction failed: ${transaction.error?.message}`));
                };

                request.onerror = () => {
                    reject(new Error(`Delete operation failed: ${request.error?.message}`));
                };

                request.onsuccess = () => {
                    console.log(`Deleted record from ${storeName} with ID:`, id);
                    resolve(true);
                };
            });
        } catch (error) {
            console.error(`Error deleting from ${storeName}:`, error);
            throw error;
        }
    }

    /**
     * Get records by index value
     */
    static async getByIndex(storeName, indexName, value) {
        try {
            if (!this.db) {
                throw new Error('Database not initialized');
            }

            return new Promise((resolve, reject) => {
                const transaction = this.db.transaction([storeName], 'readonly');
                const store = transaction.objectStore(storeName);
                
                if (!store.indexNames.contains(indexName)) {
                    reject(new Error(`Index '${indexName}' does not exist in store '${storeName}'`));
                    return;
                }
                
                const index = store.index(indexName);
                const request = index.getAll(value);

                transaction.onerror = () => {
                    reject(new Error(`Transaction failed: ${transaction.error?.message}`));
                };

                request.onerror = () => {
                    reject(new Error(`GetByIndex operation failed: ${request.error?.message}`));
                };

                request.onsuccess = () => {
                    resolve(request.result || []);
                };
            });
        } catch (error) {
            console.error(`Error getting by index from ${storeName}:`, error);
            throw error;
        }
    }

    /**
     * Search records using text query
     */
    static async search(storeName, indexName, query, options = {}) {
        try {
            if (!this.db) {
                throw new Error('Database not initialized');
            }

            if (!query || typeof query !== 'string') {
                return [];
            }

            return new Promise((resolve, reject) => {
                const transaction = this.db.transaction([storeName], 'readonly');
                const store = transaction.objectStore(storeName);
                
                if (!store.indexNames.contains(indexName)) {
                    reject(new Error(`Index '${indexName}' does not exist in store '${storeName}'`));
                    return;
                }
                
                const index = store.index(indexName);
                const request = index.openCursor();
                const results = [];
                const lowerQuery = query.toLowerCase();

                transaction.onerror = () => {
                    reject(new Error(`Transaction failed: ${transaction.error?.message}`));
                };

                request.onerror = () => {
                    reject(new Error(`Search operation failed: ${request.error?.message}`));
                };

                request.onsuccess = (event) => {
                    const cursor = event.target.result;
                    if (cursor && (!options.limit || results.length < options.limit)) {
                        const value = cursor.value;
                        const searchField = value[indexName];
                        
                        if (searchField && typeof searchField === 'string' && 
                            searchField.toLowerCase().includes(lowerQuery)) {
                            results.push(value);
                        }
                        cursor.continue();
                    } else {
                        resolve(results);
                    }
                };
            });
        } catch (error) {
            console.error(`Error searching in ${storeName}:`, error);
            throw error;
        }
    }

    /**
     * Get recent records
     */
    static async getRecent(storeName, indexName, limit = 10) {
        try {
            if (!this.db) {
                throw new Error('Database not initialized');
            }

            return new Promise((resolve, reject) => {
                const transaction = this.db.transaction([storeName], 'readonly');
                const store = transaction.objectStore(storeName);
                
                if (!store.indexNames.contains(indexName)) {
                    reject(new Error(`Index '${indexName}' does not exist in store '${storeName}'`));
                    return;
                }
                
                const index = store.index(indexName);
                const request = index.openCursor(null, 'prev');
                const results = [];

                transaction.onerror = () => {
                    reject(new Error(`Transaction failed: ${transaction.error?.message}`));
                };

                request.onerror = () => {
                    reject(new Error(`GetRecent operation failed: ${request.error?.message}`));
                };

                request.onsuccess = (event) => {
                    const cursor = event.target.result;
                    if (cursor && results.length < limit) {
                        results.push(cursor.value);
                        cursor.continue();
                    } else {
                        resolve(results);
                    }
                };
            });
        } catch (error) {
            console.error(`Error getting recent from ${storeName}:`, error);
            throw error;
        }
    }

    /**
     * Count records in a store
     */
    static async count(storeName) {
        try {
            if (!this.db) {
                throw new Error('Database not initialized');
            }

            return new Promise((resolve, reject) => {
                const transaction = this.db.transaction([storeName], 'readonly');
                const store = transaction.objectStore(storeName);
                const request = store.count();

                transaction.onerror = () => {
                    reject(new Error(`Transaction failed: ${transaction.error?.message}`));
                };

                request.onerror = () => {
                    reject(new Error(`Count operation failed: ${request.error?.message}`));
                };

                request.onsuccess = () => {
                    resolve(request.result);
                };
            });
        } catch (error) {
            console.error(`Error counting ${storeName}:`, error);
            throw error;
        }
    }

    /**
     * Clear all records from a store
     */
    static async clear(storeName) {
        try {
            if (!this.db) {
                throw new Error('Database not initialized');
            }

            return new Promise((resolve, reject) => {
                const transaction = this.db.transaction([storeName], 'readwrite');
                const store = transaction.objectStore(storeName);
                const request = store.clear();

                transaction.onerror = () => {
                    reject(new Error(`Transaction failed: ${transaction.error?.message}`));
                };

                request.onerror = () => {
                    reject(new Error(`Clear operation failed: ${request.error?.message}`));
                };

                request.onsuccess = () => {
                    console.log(`Cleared all records from ${storeName}`);
                    resolve(true);
                };
            });
        } catch (error) {
            console.error(`Error clearing ${storeName}:`, error);
            throw error;
        }
    }

    /**
     * Bulk add multiple records
     */
    static async bulkAdd(storeName, dataArray) {
        try {
            if (!this.db) {
                throw new Error('Database not initialized');
            }

            if (!Array.isArray(dataArray) || dataArray.length === 0) {
                throw new Error('Data array is required and must not be empty');
            }

            return new Promise((resolve, reject) => {
                const transaction = this.db.transaction([storeName], 'readwrite');
                const store = transaction.objectStore(storeName);
                const results = [];
                let completed = 0;

                transaction.onerror = () => {
                    reject(new Error(`Transaction failed: ${transaction.error?.message}`));
                };

                transaction.oncomplete = () => {
                    console.log(`Bulk added ${results.length} records to ${storeName}`);
                    resolve(results);
                };

                dataArray.forEach((data, index) => {
                    try {
                        // Sanitize and validate each item
                        const sanitizedData = this.sanitizeData(data);
                        const validation = this.validateData(storeName, sanitizedData);
                        
                        if (!validation.isValid) {
                            console.warn(`Skipping invalid record at index ${index}:`, validation.errors);
                            completed++;
                            return;
                        }

                        const dataWithMetadata = {
                            ...sanitizedData,
                            createdAt: new Date().toISOString(),
                            updatedAt: new Date().toISOString()
                        };

                        const request = store.add(dataWithMetadata);
                        
                        request.onsuccess = () => {
                            results.push(request.result);
                            completed++;
                        };
                        
                        request.onerror = () => {
                            console.error(`Failed to add record at index ${index}:`, request.error);
                            completed++;
                        };
                    } catch (error) {
                        console.error(`Error processing record at index ${index}:`, error);
                        completed++;
                    }
                });
            });
        } catch (error) {
            console.error(`Error bulk adding to ${storeName}:`, error);
            throw error;
        }
    }

    /**
     * Settings management
     */
    static async getSetting(key, defaultValue = null) {
        try {
            const setting = await this.get(this.STORES.SETTINGS, key);
            return setting ? setting.value : defaultValue;
        } catch (error) {
            console.error('Error getting setting:', error);
            return defaultValue;
        }
    }

    static async setSetting(key, value) {
        try {
            if (!key || typeof key !== 'string') {
                throw new Error('Setting key must be a non-empty string');
            }

            const setting = {
                key: key,
                value: value,
                updatedAt: new Date().toISOString()
            };
            
            await this.update(this.STORES.SETTINGS, setting);
            return true;
        } catch (error) {
            console.error('Error setting setting:', error);
            throw error;
        }
    }

    /**
     * Initialize default data
     */
    static async initializeDefaultData() {
        try {
            // Check if exercises already exist
            const exerciseCount = await this.count(this.STORES.EXERCISES);
            if (exerciseCount === 0) {
                console.log('Initializing default exercises...');
                await this.seedExercises();
            }
            
            // Check if plans already exist
            const planCount = await this.count(this.STORES.PLANS);
            if (planCount === 0) {
                console.log('Initializing default plans...');
                await this.seedPlans();
            }

            // Set initial settings
            const isFirstRun = await this.getSetting('isFirstRun');
            if (isFirstRun === null) {
                await this.setSetting('isFirstRun', false);
                await this.setSetting('appVersion', '1.0.0');
                await this.setSetting('theme', 'auto');
                await this.setSetting('units', 'metric');
                await this.setSetting('restTimerEnabled', true);
                await this.setSetting('soundEnabled', true);
                console.log('Default settings initialized');
            }
        } catch (error) {
            console.error('Error initializing default data:', error);
            throw error;
        }
    }

    /**
     * Seed default exercises
     */
    static async seedExercises() {
        const defaultExercises = [
            {
                name: 'Push-ups',
                category: 'chest',
                muscleGroups: ['chest', 'triceps', 'anterior-deltoids'],
                equipment: 'bodyweight',
                difficulty: 'beginner',
                instructions: 'Start in a plank position with hands slightly wider than shoulders. Lower your body until chest nearly touches the floor, then push back up to starting position.',
                tips: ['Keep your body in a straight line', 'Engage your core throughout', 'Control the movement'],
                isCustom: false
            },
            {
                name: 'Squats',
                category: 'legs',
                muscleGroups: ['quadriceps', 'glutes', 'hamstrings', 'calves'],
                equipment: 'bodyweight',
                difficulty: 'beginner',
                instructions: 'Stand with feet shoulder-width apart. Lower your body by bending at hips and knees as if sitting back into a chair. Return to starting position.',
                tips: ['Keep chest up and core engaged', 'Weight on heels', 'Knees track over toes'],
                isCustom: false
            },
            {
                name: 'Pull-ups',
                category: 'back',
                muscleGroups: ['latissimus-dorsi', 'rhomboids', 'biceps', 'rear-deltoids'],
                equipment: 'pull-up-bar',
                difficulty: 'intermediate',
                instructions: 'Hang from a pull-up bar with arms fully extended. Pull your body up until chin clears the bar, then lower with control.',
                tips: ['Start from dead hang', 'Pull with your back muscles', 'Control the descent'],
                isCustom: false
            },
            {
                name: 'Plank',
                category: 'core',
                muscleGroups: ['rectus-abdominis', 'transverse-abdominis', 'obliques'],
                equipment: 'bodyweight',
                difficulty: 'beginner',
                instructions: 'Start in push-up position. Hold your body in a straight line from head to heels, supporting weight on forearms and toes.',
                tips: ['Keep hips level', 'Breathe normally', 'Engage core muscles'],
                isCustom: false
            },
            {
                name: 'Lunges',
                category: 'legs',
                muscleGroups: ['quadriceps', 'glutes', 'hamstrings', 'calves'],
                equipment: 'bodyweight',
                difficulty: 'beginner',
                instructions: 'Step forward with one leg, lowering hips until both knees are bent at 90 degrees. Push back to starting position.',
                tips: ['Keep front knee over ankle', 'Drop back knee toward floor', 'Maintain upright torso'],
                isCustom: false
            },
            {
                name: 'Burpees',
                category: 'full-body',
                muscleGroups: ['full-body'],
                equipment: 'bodyweight',
                difficulty: 'intermediate',
                instructions: 'Start standing, drop into squat, kick feet back to plank, do push-up, jump feet to squat, then jump up with arms overhead.',
                tips: ['Move with control', 'Modify by stepping instead of jumping', 'Keep core engaged'],
                isCustom: false
            },
            {
                name: 'Mountain Climbers',
                category: 'cardio',
                muscleGroups: ['core', 'shoulders', 'legs'],
                equipment: 'bodyweight',
                difficulty: 'beginner',
                instructions: 'Start in plank position. Alternate bringing knees toward chest in a running motion while maintaining plank position.',
                tips: ['Keep hips level', 'Drive knees up', 'Maintain steady rhythm'],
                isCustom: false
            },
            {
                name: 'Jumping Jacks',
                category: 'cardio',
                muscleGroups: ['full-body'],
                equipment: 'bodyweight',
                difficulty: 'beginner',
                instructions: 'Start with feet together and arms at sides. Jump feet apart while raising arms overhead, then return to start.',
                tips: ['Land softly on balls of feet', 'Keep core engaged', 'Maintain steady pace'],
                isCustom: false
            }
        ];

        await this.bulkAdd(this.STORES.EXERCISES, defaultExercises);
        console.log('Default exercises seeded successfully');
    }

    /**
     * Seed default workout plans
     */
    static async seedPlans() {
        const defaultPlans = [
            {
                name: 'Beginner Full Body',
                description: 'A complete full-body workout perfect for beginners',
                difficulty: 'beginner',
                estimatedDuration: '30 minutes',
                category: 'full-body',
                exercises: [
                    { exerciseId: 1, sets: 3, reps: 10, restTime: 60 },
                    { exerciseId: 2, sets: 3, reps: 15, restTime: 60 },
                    { exerciseId: 4, sets: 2, duration: 30, restTime: 60 },
                    { exerciseId: 5, sets: 2, reps: 10, restTime: 60 }
                ],
                tags: ['beginner', 'full-body', 'bodyweight'],
                isPublic: true,
                createdBy: 'system'
            },
            {
                name: 'Upper Body Strength',
                description: 'Build upper body strength with this focused workout',
                difficulty: 'intermediate',
                estimatedDuration: '45 minutes',
                category: 'upper-body',
                exercises: [
                    { exerciseId: 1, sets: 4, reps: 12, restTime: 90 },
                    { exerciseId: 3, sets: 3, reps: 8, restTime: 120 },
                    { exerciseId: 4, sets: 3, duration: 45, restTime: 60 }
                ],
                tags: ['intermediate', 'upper-body', 'strength'],
                isPublic: true,
                createdBy: 'system'
            },
            {
                name: 'Quick HIIT',
                description: 'High-intensity interval training for maximum efficiency',
                difficulty: 'intermediate',
                estimatedDuration: '20 minutes',
                category: 'cardio',
                exercises: [
                    { exerciseId: 6, sets: 4, reps: 10, restTime: 30 },
                    { exerciseId: 7, sets: 4, duration: 30, restTime: 30 },
                    { exerciseId: 8, sets: 4, duration: 45, restTime: 30 }
                ],
                tags: ['hiit', 'cardio', 'quick'],
                isPublic: true,
                createdBy: 'system'
            }
        ];

        await this.bulkAdd(this.STORES.PLANS, defaultPlans);
        console.log('Default plans seeded successfully');
    }

    /**
     * Export all data for backup
     */
    static async exportData() {
        try {
            if (!this.db) {
                throw new Error('Database not initialized');
            }

            const data = {
                version: this.version,
                exportDate: new Date().toISOString(),
                exercises: await this.getAll(this.STORES.EXERCISES),
                workouts: await this.getAll(this.STORES.WORKOUTS),
                plans: await this.getAll(this.STORES.PLANS),
                sets: await this.getAll(this.STORES.SETS),
                progress: await this.getAll(this.STORES.PROGRESS),
                settings: await this.getAll(this.STORES.SETTINGS)
            };

            console.log('Data exported successfully');
            return data;
        } catch (error) {
            console.error('Error exporting data:', error);
            throw error;
        }
    }

    /**
     * Import data from backup
     */
    static async importData(data, options = {}) {
        try {
            if (!this.db) {
                throw new Error('Database not initialized');
            }

            if (!data || typeof data !== 'object') {
                throw new Error('Invalid data format');
            }

            const { clearExisting = true, skipValidation = false } = options;

            // Clear existing data if requested
            if (clearExisting) {
                console.log('Clearing existing data...');
                await Promise.all([
                    this.clear(this.STORES.EXERCISES),
                    this.clear(this.STORES.WORKOUTS),
                    this.clear(this.STORES.PLANS),
                    this.clear(this.STORES.SETS),
                    this.clear(this.STORES.PROGRESS),
                    this.clear(this.STORES.SETTINGS)
                ]);
            }

            // Import data in order (due to foreign key relationships)
            const importOrder = [
                { store: this.STORES.EXERCISES, data: data.exercises },
                { store: this.STORES.PLANS, data: data.plans },
                { store: this.STORES.WORKOUTS, data: data.workouts },
                { store: this.STORES.SETS, data: data.sets },
                { store: this.STORES.PROGRESS, data: data.progress },
                { store: this.STORES.SETTINGS, data: data.settings }
            ];

            const results = {};

            for (const { store, data: storeData } of importOrder) {
                if (storeData && Array.isArray(storeData) && storeData.length > 0) {
                    try {
                        // Remove IDs for new inserts if clearing existing data
                        const dataToImport = clearExisting 
                            ? storeData.map(item => {
                                const { id, ...rest } = item;
                                return rest;
                            })
                            : storeData;

                        const imported = await this.bulkAdd(store, dataToImport);
                        results[store] = imported.length;
                        console.log(`Imported ${imported.length} records to ${store}`);
                    } catch (error) {
                        console.error(`Error importing to ${store}:`, error);
                        if (!skipValidation) {
                            throw error;
                        }
                    }
                }
            }

            console.log('Data import completed:', results);
            return results;
        } catch (error) {
            console.error('Error importing data:', error);
            throw error;
        }
    }

    /**
     * Create a downloadable backup file
     */
    static async createBackupFile() {
        try {
            const data = await this.exportData();
            const blob = new Blob([JSON.stringify(data, null, 2)], {
                type: 'application/json'
            });
            
            const url = URL.createObjectURL(blob);
            const filename = `workout-tracker-backup-${new Date().toISOString().slice(0, 10)}.json`;
            
            // Create download link
            const a = document.createElement('a');
            a.href = url;
            a.download = filename;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            
            console.log('Backup file created:', filename);
            return filename;
        } catch (error) {
            console.error('Error creating backup file:', error);
            throw error;
        }
    }

    /**
     * Get database statistics
     */
    static async getStats() {
        try {
            if (!this.db) {
                throw new Error('Database not initialized');
            }

            const stats = {
                exercises: await this.count(this.STORES.EXERCISES),
                workouts: await this.count(this.STORES.WORKOUTS),
                plans: await this.count(this.STORES.PLANS),
                sets: await this.count(this.STORES.SETS),
                progress: await this.count(this.STORES.PROGRESS),
                settings: await this.count(this.STORES.SETTINGS),
                totalRecords: 0
            };

            stats.totalRecords = Object.values(stats).reduce((sum, count) => sum + count, 0);
            
            return stats;
        } catch (error) {
            console.error('Error getting database stats:', error);
            throw error;
        }
    }

    /**
     * Close database connection
     */
    static close() {
        if (this.db) {
            this.db.close();
            this.db = null;
            this.isInitialized = false;
            console.log('Database connection closed');
        }
    }

    /**
     * Delete the entire database
     */
    static async deleteDatabase() {
        try {
            this.close();
            
            return new Promise((resolve, reject) => {
                const deleteRequest = indexedDB.deleteDatabase(this.dbName);
                
                deleteRequest.onerror = () => {
                    reject(new Error('Failed to delete database'));
                };
                
                deleteRequest.onsuccess = () => {
                    console.log('Database deleted successfully');
                    resolve();
                };
                
                deleteRequest.onblocked = () => {
                    console.warn('Database deletion blocked. Please close other tabs.');
                };
            });
        } catch (error) {
            console.error('Error deleting database:', error);
            throw error;
        }
    }
}