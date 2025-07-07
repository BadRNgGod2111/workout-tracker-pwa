/**
 * Main Application Controller
 * Manages app initialization, navigation, state, and module integration
 */

class WorkoutTrackerApp {
    constructor() {
        // Application state
        this.currentTab = 'exercises'; // Start with exercises tab
        this.appState = {
            isInitialized: false,
            isOnline: navigator.onLine,
            theme: 'auto', // 'light', 'dark', 'auto'
            currentWorkout: null,
            isWorkoutActive: false,
            notifications: [],
            settings: {}
        };

        // Navigation state
        this.navigationStack = [];
        this.isNavigating = false;

        // Touch gesture handling
        this.touchStartX = null;
        this.touchStartY = null;
        this.swipeThreshold = 50;
        this.swipeVelocityThreshold = 0.3;

        // Event listeners
        this.eventListeners = new Map();
        
        // Module references
        this.modules = {
            database: Database,
            exercises: ExerciseManager,
            workouts: WorkoutManager,
            plans: PlanManager,
            progress: ProgressDashboard
        };

        this.init();
    }

    /**
     * Initialize the application
     */
    async init() {
        try {
            this.showLoading(true, 'Initializing app...');

            // Initialize core systems
            await this.initializeServiceWorker();
            await this.initializeDatabase();
            await this.loadSettings();
            
            // Setup UI and navigation
            this.setupEventListeners();
            this.setupTabNavigation();
            this.setupTouchGestures();
            this.setupNotificationSystem();
            
            // Initialize modules
            await this.initializeModules();
            
            // Load initial data
            await this.loadInitialData();
            
            // Setup theme
            this.applyTheme();
            
            // Check for workout state restoration
            await this.restoreWorkoutState();
            
            this.appState.isInitialized = true;
            this.emitEvent('appInitialized');
            
            console.log('🎯 Workout Tracker App initialized successfully');
        } catch (error) {
            console.error('❌ App initialization failed:', error);
            this.showError('Failed to initialize app. Please refresh the page.');
        } finally {
            this.showLoading(false);
        }
    }

    async initializeServiceWorker() {
        if ('serviceWorker' in navigator) {
            try {
                const registration = await navigator.serviceWorker.register('/sw.js');
                console.log('Service Worker registered successfully:', registration);
                
                registration.addEventListener('updatefound', () => {
                    const newWorker = registration.installing;
                    newWorker.addEventListener('statechange', () => {
                        if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                            this.showUpdateAvailable();
                        }
                    });
                });
            } catch (error) {
                console.error('Service Worker registration failed:', error);
            }
        }
    }

    async initializeDatabase() {
        try {
            await Database.init();
            console.log('Database initialized successfully');
        } catch (error) {
            console.error('Database initialization failed:', error);
            this.showError('Failed to initialize database');
        }
    }

    /**
     * Initialize modules and set up event listeners
     */
    async initializeModules() {
        try {
            // Listen to WorkoutManager events
            WorkoutManager.addEventListener('workoutStarted', (data) => {
                this.handleWorkoutStarted(data);
            });
            
            WorkoutManager.addEventListener('workoutCompleted', (data) => {
                this.handleWorkoutCompleted(data);
            });
            
            WorkoutManager.addEventListener('restTimerCompleted', (data) => {
                this.handleRestTimerCompleted(data);
            });
            
            WorkoutManager.addEventListener('workoutDurationUpdate', (data) => {
                this.updateWorkoutTimer(data);
            });

            // Listen to PlanManager events
            PlanManager.addEventListener('planCreated', (data) => {
                this.handlePlanCreated(data);
            });
            
            PlanManager.addEventListener('planWorkoutStarted', (data) => {
                this.handlePlanWorkoutStarted(data);
            });

            // Create pre-built templates if they don't exist
            const existingPlans = await PlanManager.getAllPlans();
            if (existingPlans.length === 0) {
                await PlanManager.createPrebuiltTemplates();
                console.log('✅ Pre-built plan templates created');
            }

            // Initialize progress dashboard
            this.progressDashboard = new ProgressDashboard(this);
            console.log('✅ Progress dashboard initialized');

            // Initialize timer system
            this.timers = new WorkoutTimers();
            this.timerUI = new TimerUI(this.timers);
            await this.setupTimerIntegration();
            console.log('✅ Timer system initialized');

            // Initialize data manager
            this.dataManager = new DataManager(Database);
            await this.setupDataManagement();
            console.log('✅ Data management system initialized');

        } catch (error) {
            console.error('Error initializing modules:', error);
        }
    }

    /**
     * Setup all event listeners
     */
    setupEventListeners() {
        // Online/offline status
        window.addEventListener('online', () => {
            this.appState.isOnline = true;
            this.showNotification('Back online', 'success');
        });
        
        window.addEventListener('offline', () => {
            this.appState.isOnline = false;
            this.showNotification('Working offline', 'warning');
        });

        // Visibility change (for pause/resume)
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                this.handleAppPause();
            } else {
                this.handleAppResume();
            }
        });

        // Before unload (save state)
        window.addEventListener('beforeunload', () => {
            this.saveAppState();
        });

        // DOM content loaded
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => {
                this.setupDOMEventListeners();
            });
        } else {
            this.setupDOMEventListeners();
        }
    }

    /**
     * Setup DOM-dependent event listeners
     */
    setupDOMEventListeners() {
        this.setupButtonEvents();
        this.setupSearchEvents();
        this.setupModalEvents();
        this.setupProfileEvents();
        this.setupKeyboardShortcuts();
    }

    setupButtonEvents() {
        const startWorkoutBtn = document.getElementById('start-workout-btn');
        const createPlanBtn = document.getElementById('create-plan-btn');
        const exerciseSearch = document.getElementById('exercise-search');
        
        if (startWorkoutBtn) {
            startWorkoutBtn.addEventListener('click', () => this.startWorkout());
        }
        
        if (createPlanBtn) {
            createPlanBtn.addEventListener('click', () => this.createPlan());
        }
        
        if (exerciseSearch) {
            exerciseSearch.addEventListener('input', (e) => this.searchExercises(e.target.value));
        }

        const filterBtns = document.querySelectorAll('.filter-btn');
        filterBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                filterBtns.forEach(b => b.classList.remove('active'));
                e.target.classList.add('active');
                this.filterExercises(e.target.dataset.category);
            });
        });
    }

    setupSearchEvents() {
        const searchInput = document.getElementById('exercise-search');
        if (searchInput) {
            let searchTimeout;
            searchInput.addEventListener('input', (e) => {
                clearTimeout(searchTimeout);
                searchTimeout = setTimeout(() => {
                    this.searchExercises(e.target.value);
                }, 300);
            });
        }
    }

    setupModalEvents() {
        const workoutModal = document.getElementById('workout-modal');
        const closeModalBtn = document.getElementById('close-workout-modal');
        
        if (closeModalBtn) {
            closeModalBtn.addEventListener('click', () => {
                this.closeWorkoutModal();
            });
        }
        
        if (workoutModal) {
            workoutModal.addEventListener('click', (e) => {
                if (e.target === workoutModal) {
                    this.closeWorkoutModal();
                }
            });
        }
    }

    /**
     * Setup tab navigation with history management
     */
    setupTabNavigation() {
        const tabButtons = document.querySelectorAll('.tab-button');
        const tabContents = document.querySelectorAll('.tab-content');
        
        tabButtons.forEach(button => {
            button.addEventListener('click', (e) => {
                e.preventDefault();
                const targetTab = e.currentTarget.dataset.tab;
                this.navigateToTab(targetTab);
            });
        });

        // Handle browser back/forward
        window.addEventListener('popstate', (e) => {
            if (e.state && e.state.tab) {
                this.navigateToTab(e.state.tab, false);
            }
        });

        // Set initial history state
        if (history.state === null) {
            history.replaceState({ tab: this.currentTab }, '', `#${this.currentTab}`);
        }
    }

    /**
     * Navigate to specific tab
     */
    async navigateToTab(targetTab, pushState = true) {
        if (this.isNavigating || targetTab === this.currentTab) {
            return;
        }

        this.isNavigating = true;
        
        try {
            // Add to navigation stack
            this.navigationStack.push(this.currentTab);
            
            // Update UI
            const tabButtons = document.querySelectorAll('.tab-button');
            const tabContents = document.querySelectorAll('.tab-content');
            
            // Remove active classes
            tabButtons.forEach(btn => btn.classList.remove('active'));
            tabContents.forEach(content => content.classList.remove('active'));
            
            // Add active classes
            const targetButton = document.querySelector(`[data-tab="${targetTab}"]`);
            const targetContent = document.getElementById(`${targetTab}-tab`);
            
            if (targetButton) targetButton.classList.add('active');
            if (targetContent) {
                targetContent.classList.add('active');
                // Add slide animation
                targetContent.style.animation = 'fadeInUp 0.25s ease-out';
            }
            
            // Update state
            this.currentTab = targetTab;
            
            // Update browser history
            if (pushState) {
                history.pushState({ tab: targetTab }, '', `#${targetTab}`);
            }
            
            // Load content
            await this.loadTabContent(targetTab);
            
            // Emit navigation event
            this.emitEvent('tabChanged', { from: this.navigationStack[this.navigationStack.length - 1], to: targetTab });
            
        } catch (error) {
            console.error('Navigation error:', error);
            this.showError('Navigation failed');
        } finally {
            this.isNavigating = false;
        }
    }

    async loadInitialData() {
        this.showLoading(true);
        
        try {
            // Load all tab content to ensure data is available
            await this.loadTabContent('exercises');
            await this.loadTabContent('workouts');
            await this.loadTabContent('plans');
            await this.loadProgressStats();
        } catch (error) {
            console.error('Failed to load initial data:', error);
            this.showError('Failed to load data');
        } finally {
            this.showLoading(false);
        }
    }

    /**
     * Setup touch gestures for swipe navigation
     */
    setupTouchGestures() {
        const appContainer = document.querySelector('.app-container');
        if (!appContainer) return;

        let startTime;
        
        appContainer.addEventListener('touchstart', (e) => {
            this.touchStartX = e.touches[0].clientX;
            this.touchStartY = e.touches[0].clientY;
            startTime = Date.now();
        }, { passive: true });
        
        appContainer.addEventListener('touchend', (e) => {
            if (!this.touchStartX || !this.touchStartY) return;
            
            const touchEndX = e.changedTouches[0].clientX;
            const touchEndY = e.changedTouches[0].clientY;
            const deltaX = touchEndX - this.touchStartX;
            const deltaY = touchEndY - this.touchStartY;
            const deltaTime = Date.now() - startTime;
            const velocity = Math.abs(deltaX) / deltaTime;
            
            // Check if it's a horizontal swipe
            if (Math.abs(deltaX) > Math.abs(deltaY) && 
                Math.abs(deltaX) > this.swipeThreshold &&
                velocity > this.swipeVelocityThreshold) {
                
                if (deltaX > 0) {
                    this.handleSwipeRight();
                } else {
                    this.handleSwipeLeft();
                }
            }
            
            this.touchStartX = null;
            this.touchStartY = null;
        }, { passive: true });
    }

    /**
     * Handle swipe right (previous tab)
     */
    handleSwipeRight() {
        const tabs = ['exercises', 'workouts', 'plans', 'profile'];
        const currentIndex = tabs.indexOf(this.currentTab);
        if (currentIndex > 0) {
            this.navigateToTab(tabs[currentIndex - 1]);
            // Add haptic feedback if available
            this.triggerHapticFeedback('light');
        }
    }

    /**
     * Handle swipe left (next tab)
     */
    handleSwipeLeft() {
        const tabs = ['exercises', 'workouts', 'plans', 'profile'];
        const currentIndex = tabs.indexOf(this.currentTab);
        if (currentIndex < tabs.length - 1) {
            this.navigateToTab(tabs[currentIndex + 1]);
            // Add haptic feedback if available
            this.triggerHapticFeedback('light');
        }
    }

    /**
     * Trigger haptic feedback if available
     */
    triggerHapticFeedback(type = 'light') {
        if ('vibrate' in navigator) {
            const patterns = {
                light: [10],
                medium: [20],
                heavy: [30]
            };
            navigator.vibrate(patterns[type] || patterns.light);
        }
    }

    /**
     * Load content for specific tab
     */
    async loadTabContent(tab) {
        try {
            switch (tab) {
                case 'exercises':
                    await this.loadExercises();
                    break;
                case 'workouts':
                    await this.loadRecentWorkouts();
                    break;
                case 'plans':
                    await this.loadPlans();
                    break;
                case 'profile':
                    await this.loadProgressStats();
                    break;
            }
        } catch (error) {
            console.error(`Error loading ${tab} content:`, error);
            this.showError(`Failed to load ${tab} content`);
        }
    }

    async loadRecentWorkouts() {
        try {
            const workouts = await WorkoutManager.getRecentWorkouts(5);
            this.displayRecentWorkouts(workouts);
        } catch (error) {
            console.error('Failed to load recent workouts:', error);
        }
    }

    async loadExercises() {
        try {
            const exercises = await ExerciseManager.getAllExercises();
            this.displayExercises(exercises);
        } catch (error) {
            console.error('Failed to load exercises:', error);
        }
    }

    async loadPlans() {
        try {
            const plans = await PlanManager.getAllPlans();
            this.displayPlans(plans);
        } catch (error) {
            console.error('Failed to load plans:', error);
        }
    }

    async loadProgressStats() {
        try {
            const stats = await WorkoutManager.getProgressStats();
            this.displayProgressStats(stats);
        } catch (error) {
            console.error('Failed to load progress stats:', error);
        }
    }

    displayRecentWorkouts(workouts) {
        const container = document.getElementById('recent-workouts-list');
        if (!container) return;

        container.innerHTML = '';
        
        if (workouts.length === 0) {
            container.innerHTML = '<p class="no-data">No recent workouts found. Start your first workout!</p>';
            return;
        }

        workouts.forEach(workout => {
            const workoutElement = this.createWorkoutElement(workout);
            container.appendChild(workoutElement);
        });
    }

    displayExercises(exercises) {
        const container = document.getElementById('exercise-list');
        if (!container) return;

        container.innerHTML = '';
        
        exercises.forEach(exercise => {
            const exerciseElement = this.createExerciseElement(exercise);
            container.appendChild(exerciseElement);
        });
    }

    displayPlans(plans) {
        const container = document.getElementById('plans-list');
        if (!container) return;

        container.innerHTML = '';
        
        if (plans.length === 0) {
            container.innerHTML = '<p class="no-data">No workout plans found. Create your first plan!</p>';
            return;
        }

        plans.forEach(plan => {
            const planElement = this.createPlanElement(plan);
            container.appendChild(planElement);
        });
    }

    displayProgressStats(stats) {
        const totalWorkouts = document.getElementById('total-workouts');
        const totalExercises = document.getElementById('total-exercises');
        const currentStreak = document.getElementById('current-streak');

        if (totalWorkouts) totalWorkouts.textContent = stats.totalWorkouts || 0;
        if (totalExercises) totalExercises.textContent = stats.totalExercises || 0;
        if (currentStreak) currentStreak.textContent = stats.currentStreak || 0;
    }

    createWorkoutElement(workout) {
        const element = document.createElement('div');
        element.className = 'workout-item';
        element.innerHTML = `
            <h4>${workout.name}</h4>
            <div class="workout-meta">
                <span>${this.formatDate(workout.date)}</span>
                <span>${workout.duration || 'N/A'}</span>
                <span>${workout.exercises?.length || 0} exercises</span>
            </div>
        `;
        
        element.addEventListener('click', () => this.viewWorkout(workout));
        return element;
    }

    createExerciseElement(exercise) {
        const element = document.createElement('div');
        element.className = 'exercise-item';
        element.innerHTML = `
            <h4>${exercise.name}</h4>
            <div class="exercise-meta">
                <span>${exercise.category}</span>
                <span>${exercise.equipment || 'Bodyweight'}</span>
                <span>${exercise.muscleGroups?.join(', ') || 'N/A'}</span>
            </div>
        `;
        
        element.addEventListener('click', () => this.viewExercise(exercise));
        return element;
    }

    createPlanElement(plan) {
        const element = document.createElement('div');
        element.className = 'plan-item';
        element.innerHTML = `
            <h4>${plan.name}</h4>
            <div class="plan-meta">
                <span>${plan.exercises?.length || 0} exercises</span>
                <span>${plan.estimatedDuration || 'N/A'}</span>
                <span>${plan.difficulty || 'Beginner'}</span>
            </div>
        `;
        
        element.addEventListener('click', () => this.viewPlan(plan));
        return element;
    }

    /**
     * Start a new workout
     */
    async startWorkout() {
        if (this.appState.isWorkoutActive) {
            this.showWorkoutModal();
            return;
        }

        try {
            const workout = await WorkoutManager.startNewWorkout();
            this.appState.isWorkoutActive = true;
            this.appState.currentWorkout = workout;
            this.showWorkoutModal();
            this.showSuccess('Workout started!');
        } catch (error) {
            console.error('Failed to start workout:', error);
            this.showError('Failed to start workout');
        }
    }

    showWorkoutModal() {
        const modal = document.getElementById('workout-modal');
        const body = document.getElementById('workout-modal-body');
        
        if (!modal || !body) return;

        body.innerHTML = this.generateWorkoutModalContent();
        modal.classList.add('active');
        
        this.setupWorkoutModalEvents();
    }

    closeWorkoutModal() {
        const modal = document.getElementById('workout-modal');
        if (modal) {
            modal.classList.remove('active');
        }
    }

    generateWorkoutModalContent() {
        if (!this.currentWorkout) {
            return '<p>No active workout</p>';
        }

        return `
            <div class="workout-header">
                <h3>${this.currentWorkout.name}</h3>
                <div class="workout-timer" id="workout-timer">00:00</div>
            </div>
            <div class="workout-exercises">
                <h4>Exercises</h4>
                <div id="workout-exercise-list">
                    <!-- Exercise list will be populated here -->
                </div>
            </div>
            <div class="workout-controls">
                <button class="btn btn-secondary" id="pause-workout-btn">Pause</button>
                <button class="btn btn-primary" id="finish-workout-btn">Finish</button>
            </div>
        `;
    }

    setupWorkoutModalEvents() {
        const pauseBtn = document.getElementById('pause-workout-btn');
        const finishBtn = document.getElementById('finish-workout-btn');
        
        if (pauseBtn) {
            pauseBtn.addEventListener('click', () => this.pauseWorkout());
        }
        
        if (finishBtn) {
            finishBtn.addEventListener('click', () => this.finishWorkout());
        }
    }

    async pauseWorkout() {
        try {
            await WorkoutManager.pauseWorkout(this.currentWorkout.id);
            console.log('Workout paused');
        } catch (error) {
            console.error('Failed to pause workout:', error);
        }
    }

    async finishWorkout() {
        try {
            await WorkoutManager.finishWorkout(this.currentWorkout.id);
            this.isWorkoutActive = false;
            this.currentWorkout = null;
            this.closeWorkoutModal();
            this.loadRecentWorkouts();
            this.loadProgressStats();
        } catch (error) {
            console.error('Failed to finish workout:', error);
            this.showError('Failed to finish workout');
        }
    }

    async searchExercises(query) {
        try {
            const exercises = await ExerciseManager.searchExercises(query);
            this.displayExercises(exercises);
        } catch (error) {
            console.error('Failed to search exercises:', error);
        }
    }

    async filterExercises(category) {
        try {
            const exercises = category === 'all' 
                ? await ExerciseManager.getAllExercises()
                : await ExerciseManager.getExercisesByCategory(category);
            this.displayExercises(exercises);
        } catch (error) {
            console.error('Failed to filter exercises:', error);
        }
    }

    viewWorkout(workout) {
        console.log('Viewing workout:', workout);
    }

    viewExercise(exercise) {
        console.log('Viewing exercise:', exercise);
    }

    /**
     * Setup timer system integration
     */
    async setupTimerIntegration() {
        // Request notification permission
        await this.timers.requestNotificationPermission();
        
        // Load previous timer state
        this.timers.loadState();
        
        // Setup timer event listeners
        this.timers.addEventListener('workoutTimerStarted', (data) => {
            console.log('Workout timer started:', data);
            this.appState.isWorkoutActive = true;
        });
        
        this.timers.addEventListener('workoutTimerStopped', (data) => {
            console.log('Workout timer stopped:', data);
            this.appState.isWorkoutActive = false;
        });
        
        this.timers.addEventListener('restTimerCompleted', (data) => {
            console.log('Rest timer completed:', data);
            // Auto-start next exercise if configured
            if (this.timers.settings.autoStartRest) {
                // Implementation for auto-advance to next exercise
            }
        });
        
        // Save timer state on visibility change
        document.addEventListener('visibilitychange', () => {
            this.timers.saveState();
        });
        
        // Save timer state before unload
        window.addEventListener('beforeunload', () => {
            this.timers.saveState();
        });
    }

    /**
     * Setup data management system and event listeners
     */
    async setupDataManagement() {
        // Setup data management event listeners
        const dataManagementBtn = document.getElementById('data-management-btn');
        const exportDataBtn = document.getElementById('export-data-btn');
        const closeDataManagementModal = document.getElementById('close-data-management-modal');

        if (dataManagementBtn) {
            dataManagementBtn.addEventListener('click', () => {
                this.openDataManagementModal();
            });
        }

        if (exportDataBtn) {
            exportDataBtn.addEventListener('click', () => {
                this.openDataManagementModal();
            });
        }

        if (closeDataManagementModal) {
            closeDataManagementModal.addEventListener('click', () => {
                this.closeDataManagementModal();
            });
        }

        // Setup modal event listeners
        this.setupDataManagementModalListeners();
    }

    /**
     * Setup data management modal event listeners
     */
    setupDataManagementModalListeners() {
        // Export data button
        const exportDataBtnModal = document.getElementById('export-data-btn-modal');
        if (exportDataBtnModal) {
            exportDataBtnModal.addEventListener('click', () => {
                this.handleDataExport();
            });
        }

        // File selection for import
        const selectImportFile = document.getElementById('select-import-file');
        const importFileInput = document.getElementById('import-file-input');
        if (selectImportFile && importFileInput) {
            selectImportFile.addEventListener('click', () => {
                importFileInput.click();
            });

            importFileInput.addEventListener('change', (e) => {
                this.handleFileSelection(e.target.files[0]);
            });
        }

        // Import data button
        const importDataBtn = document.getElementById('import-data-btn');
        if (importDataBtn) {
            importDataBtn.addEventListener('click', () => {
                this.handleDataImport();
            });
        }

        // Share plan functionality
        const sharePlanBtn = document.getElementById('share-plan-btn');
        const sharePlanSelect = document.getElementById('share-plan-select');
        if (sharePlanBtn && sharePlanSelect) {
            sharePlanSelect.addEventListener('change', (e) => {
                sharePlanBtn.disabled = !e.target.value;
            });

            sharePlanBtn.addEventListener('click', () => {
                this.handlePlanShare();
            });
        }

        // Cleanup old data
        const cleanupOldDataBtn = document.getElementById('cleanup-old-data-btn');
        if (cleanupOldDataBtn) {
            cleanupOldDataBtn.addEventListener('click', () => {
                this.handleDataCleanup();
            });
        }

        // Reset all data
        const resetAllDataBtn = document.getElementById('reset-all-data-btn');
        if (resetAllDataBtn) {
            resetAllDataBtn.addEventListener('click', () => {
                this.handleDataReset();
            });
        }
    }

    /**
     * Open data management modal
     */
    async openDataManagementModal() {
        const modal = document.getElementById('data-management-modal');
        if (modal) {
            // Update storage stats
            await this.updateStorageStats();
            
            // Load available plans for sharing
            await this.loadPlansForSharing();
            
            modal.classList.add('active');
        }
    }

    /**
     * Close data management modal
     */
    closeDataManagementModal() {
        const modal = document.getElementById('data-management-modal');
        if (modal) {
            modal.classList.remove('active');
        }
    }

    /**
     * Update storage usage statistics
     */
    async updateStorageStats() {
        try {
            const stats = this.dataManager.calculateStorageUsage();
            const storageDetails = document.getElementById('storage-details');
            const storageUsedBar = document.getElementById('storage-used-bar');

            if (storageDetails && storageUsedBar) {
                const usedMB = Math.round(stats.used / (1024 * 1024) * 100) / 100;
                const totalMB = stats.total ? Math.round(stats.total / (1024 * 1024)) : 'Unknown';
                const percentage = stats.total ? Math.round((stats.used / stats.total) * 100) : 0;

                storageDetails.innerHTML = `
                    <div class="storage-text">Used: ${usedMB} MB${stats.total ? ` of ${totalMB} MB` : ''}</div>
                    ${stats.total ? `<div class="storage-text">${percentage}% used</div>` : ''}
                `;

                storageUsedBar.style.width = `${percentage}%`;
            }
        } catch (error) {
            console.error('Failed to update storage stats:', error);
        }
    }

    /**
     * Load available plans for sharing
     */
    async loadPlansForSharing() {
        try {
            const plans = await PlanManager.getAllPlans();
            const sharePlanSelect = document.getElementById('share-plan-select');
            
            if (sharePlanSelect) {
                // Clear existing options except the first one
                sharePlanSelect.innerHTML = '<option value="">Choose a plan to share...</option>';
                
                plans.forEach(plan => {
                    const option = document.createElement('option');
                    option.value = plan.id;
                    option.textContent = plan.name;
                    sharePlanSelect.appendChild(option);
                });
            }
        } catch (error) {
            console.error('Failed to load plans:', error);
        }
    }

    /**
     * Handle data export
     */
    async handleDataExport() {
        try {
            const format = document.getElementById('export-format-select').value;
            const includePersonalData = document.getElementById('include-personal-data').checked;
            const includeStatistics = document.getElementById('include-statistics').checked;
            const compact = document.getElementById('compact-export').checked;

            const options = {
                includePersonalData,
                includeStatistics,
                compact
            };

            this.showLoading(true, 'Exporting data...');
            
            const result = await this.dataManager.exportAllData(format, options);
            
            // Create download link
            const url = URL.createObjectURL(result.blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = result.filename;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);

            this.showNotification(`Data exported successfully as ${result.filename}`, 'success');
        } catch (error) {
            console.error('Export failed:', error);
            this.showNotification('Export failed: ' + error.message, 'error');
        } finally {
            this.showLoading(false);
        }
    }

    /**
     * Handle file selection for import
     */
    handleFileSelection(file) {
        const fileInfo = document.getElementById('import-file-info');
        const importBtn = document.getElementById('import-data-btn');

        if (!file) {
            if (fileInfo) {
                fileInfo.classList.remove('show');
            }
            if (importBtn) {
                importBtn.disabled = true;
            }
            return;
        }

        if (fileInfo) {
            const sizeMB = Math.round(file.size / (1024 * 1024) * 100) / 100;
            fileInfo.innerHTML = `Selected: ${file.name} (${sizeMB} MB)`;
            fileInfo.className = 'file-info show success';
        }

        if (importBtn) {
            importBtn.disabled = false;
        }
    }

    /**
     * Handle data import
     */
    async handleDataImport() {
        try {
            const fileInput = document.getElementById('import-file-input');
            const skipDuplicates = document.getElementById('skip-duplicates').checked;
            const validateImport = document.getElementById('validate-import').checked;

            if (!fileInput.files[0]) {
                this.showNotification('Please select a file to import', 'warning');
                return;
            }

            const options = {
                skipDuplicates,
                validateImport
            };

            this.showLoading(true, 'Importing data...');

            const result = await this.dataManager.importData(fileInput.files[0], options);

            let message = `Import completed: ${result.workouts} workouts, ${result.exercises} exercises`;
            if (result.plans > 0) message += `, ${result.plans} plans`;
            if (result.goals > 0) message += `, ${result.goals} goals`;
            if (result.measurements > 0) message += `, ${result.measurements} measurements`;

            if (result.errors.length > 0) {
                message += `. ${result.errors.length} errors occurred.`;
                console.warn('Import errors:', result.errors);
            }

            this.showNotification(message, result.errors.length > 0 ? 'warning' : 'success');

            // Refresh the current tab to show new data
            await this.refreshCurrentTab();
        } catch (error) {
            console.error('Import failed:', error);
            this.showNotification('Import failed: ' + error.message, 'error');
        } finally {
            this.showLoading(false);
        }
    }

    /**
     * Handle workout plan sharing
     */
    async handlePlanShare() {
        try {
            const planId = document.getElementById('share-plan-select').value;
            const format = document.getElementById('share-format-select').value;

            if (!planId) {
                this.showNotification('Please select a plan to share', 'warning');
                return;
            }

            const shareData = await this.dataManager.shareWorkoutPlan(planId, format);

            // Use Web Share API if available
            if (navigator.share) {
                await navigator.share({
                    title: 'Workout Plan',
                    text: shareData
                });
            } else {
                // Fallback: copy to clipboard
                await navigator.clipboard.writeText(shareData);
                this.showNotification('Plan copied to clipboard!', 'success');
            }
        } catch (error) {
            console.error('Share failed:', error);
            this.showNotification('Share failed: ' + error.message, 'error');
        }
    }

    /**
     * Handle data cleanup
     */
    async handleDataCleanup() {
        try {
            const daysOld = parseInt(document.getElementById('cleanup-age-select').value);
            
            const confirm = window.confirm(`This will permanently delete data older than ${daysOld} days. Continue?`);
            if (!confirm) return;

            this.showLoading(true, 'Cleaning up old data...');

            const result = await this.dataManager.cleanupOldData(daysOld);

            let message = `Cleanup completed: removed ${result.workouts} old workouts`;
            if (result.measurements > 0) message += `, ${result.measurements} measurements`;
            if (result.oldExercises > 0) message += `, ${result.oldExercises} unused exercises`;

            this.showNotification(message, 'success');
            await this.updateStorageStats();
        } catch (error) {
            console.error('Cleanup failed:', error);
            this.showNotification('Cleanup failed: ' + error.message, 'error');
        } finally {
            this.showLoading(false);
        }
    }

    /**
     * Handle complete data reset
     */
    async handleDataReset() {
        try {
            const confirm = window.confirm('⚠️ This will permanently delete ALL your data. This action cannot be undone. Are you sure?');
            if (!confirm) return;

            const doubleConfirm = window.confirm('Last chance: This will delete everything. Type YES in the prompt to confirm.');
            if (!doubleConfirm) return;

            const userInput = prompt('Type "DELETE ALL DATA" to confirm (case sensitive):');
            if (userInput !== 'DELETE ALL DATA') {
                this.showNotification('Reset cancelled - incorrect confirmation text', 'info');
                return;
            }

            this.showLoading(true, 'Resetting all data...');

            const result = await this.dataManager.resetAllData();

            let message = `Reset completed: removed ${result.workouts} workouts, ${result.exercises} exercises`;
            if (result.plans > 0) message += `, ${result.plans} plans`;

            this.showNotification(message, 'success');
            await this.updateStorageStats();
            await this.refreshCurrentTab();
            this.closeDataManagementModal();
        } catch (error) {
            console.error('Reset failed:', error);
            this.showNotification('Reset failed: ' + error.message, 'error');
        } finally {
            this.showLoading(false);
        }
    }

    /**
     * Refresh current tab data
     */
    async refreshCurrentTab() {
        try {
            switch (this.currentTab) {
                case 'exercises':
                    if (window.ExerciseManager) {
                        await ExerciseManager.renderExerciseList();
                    }
                    break;
                case 'workouts':
                    if (window.WorkoutManager) {
                        await WorkoutManager.renderRecentWorkouts();
                    }
                    break;
                case 'plans':
                    if (window.PlanManager) {
                        await PlanManager.renderPlans();
                    }
                    break;
                case 'profile':
                    if (this.progressDashboard) {
                        await this.progressDashboard.refresh();
                    }
                    break;
            }
        } catch (error) {
            console.error('Failed to refresh tab:', error);
        }
    }

    /**
     * Start workout timer when workout begins
     */
    startWorkoutWithTimer(workout) {
        this.timers.startWorkoutTimer();
        this.currentWorkout = workout;
        this.appState.isWorkoutActive = true;
        
        // Show workout timer UI
        this.timerUI.showWorkoutTimer();
    }

    /**
     * Start rest timer after completing a set
     */
    startRestTimer(exerciseId, customTime = null) {
        this.timers.startRestTimer(exerciseId, customTime);
    }

    /**
     * Stop all timers when workout ends
     */
    stopWorkoutTimers() {
        this.timers.stopWorkoutTimer();
        this.timers.stopRestTimer();
        this.appState.isWorkoutActive = false;
    }

    viewPlan(plan) {
        console.log('Viewing plan:', plan);
    }

    createPlan() {
        console.log('Creating new plan');
    }

    /**
     * Setup notification system
     */
    setupNotificationSystem() {
        // Request notification permission
        if ('Notification' in window && Notification.permission === 'default') {
            Notification.requestPermission();
        }

        // Setup workout reminders
        this.setupWorkoutReminders();
    }

    /**
     * Setup workout reminders based on scheduled plans
     */
    async setupWorkoutReminders() {
        try {
            const today = new Date();
            const scheduledPlans = await PlanManager.getScheduledPlans(today);
            
            scheduledPlans.forEach(plan => {
                if (plan.schedule.reminders && plan.schedule.reminderTime) {
                    this.scheduleWorkoutReminder(plan);
                }
            });
        } catch (error) {
            console.error('Error setting up workout reminders:', error);
        }
    }

    /**
     * Schedule workout reminder notification
     */
    scheduleWorkoutReminder(plan) {
        const reminderTime = plan.schedule.reminderTime; // minutes before
        const workoutTime = this.calculateNextWorkoutTime(plan);
        const reminderTimestamp = workoutTime - (reminderTime * 60 * 1000);
        const now = Date.now();
        
        if (reminderTimestamp > now) {
            const timeUntilReminder = reminderTimestamp - now;
            
            setTimeout(() => {
                this.showWorkoutReminder(plan);
            }, timeUntilReminder);
        }
    }

    /**
     * Show workout reminder notification
     */
    showWorkoutReminder(plan) {
        const title = 'Workout Reminder';
        const body = `Time for your ${plan.name} workout!`;
        
        if ('Notification' in window && Notification.permission === 'granted') {
            const notification = new Notification(title, {
                body: body,
                icon: '/icons/icon-192.svg',
                badge: '/icons/icon-72.svg',
                tag: `workout-reminder-${plan.id}`,
                requireInteraction: true,
                actions: [
                    { action: 'start', title: 'Start Workout' },
                    { action: 'snooze', title: 'Remind in 10 min' },
                    { action: 'dismiss', title: 'Dismiss' }
                ]
            });
            
            notification.onclick = () => {
                window.focus();
                this.startPlanWorkout(plan.id);
                notification.close();
            };
        } else {
            // Fallback to in-app notification
            this.showNotification(`Time for your ${plan.name} workout!`, 'info', {
                persistent: true,
                actions: [
                    { text: 'Start Workout', action: () => this.startPlanWorkout(plan.id) },
                    { text: 'Dismiss', action: () => {} }
                ]
            });
        }
    }

    /**
     * Setup keyboard shortcuts
     */
    setupKeyboardShortcuts() {
        document.addEventListener('keydown', (e) => {
            // Only handle shortcuts when not typing in inputs
            if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
                return;
            }
            
            if (e.metaKey || e.ctrlKey) {
                switch (e.key) {
                    case '1':
                        e.preventDefault();
                        this.navigateToTab('exercises');
                        break;
                    case '2':
                        e.preventDefault();
                        this.navigateToTab('workouts');
                        break;
                    case '3':
                        e.preventDefault();
                        this.navigateToTab('plans');
                        break;
                    case '4':
                        e.preventDefault();
                        this.navigateToTab('profile');
                        break;
                    case 'k':
                        e.preventDefault();
                        this.focusSearch();
                        break;
                    case 'n':
                        e.preventDefault();
                        this.startQuickWorkout();
                        break;
                }
            }
            
            // Escape key
            if (e.key === 'Escape') {
                this.closeModals();
            }
        });
    }

    /**
     * Setup profile-specific events
     */
    setupProfileEvents() {
        const settingsBtn = document.getElementById('settings-btn');
        const exportDataBtn = document.getElementById('export-data-btn');
        const aboutBtn = document.getElementById('about-btn');
        
        if (settingsBtn) {
            settingsBtn.addEventListener('click', () => this.showSettings());
        }
        
        if (exportDataBtn) {
            exportDataBtn.addEventListener('click', () => this.exportData());
        }
        
        if (aboutBtn) {
            aboutBtn.addEventListener('click', () => this.showAbout());
        }
    }

    /**
     * Show loading spinner with optional message
     */
    showLoading(show, message = 'Loading...') {
        const spinner = document.getElementById('loading-spinner');
        if (spinner) {
            spinner.classList.toggle('active', show);
            
            // Update loading message if provided
            const loadingText = spinner.querySelector('.loading-text');
            if (loadingText && message) {
                loadingText.textContent = message;
            }
        }
    }

    /**
     * Show notification to user
     */
    showNotification(message, type = 'info', options = {}) {
        const notification = {
            id: Date.now().toString(),
            message: message,
            type: type, // 'success', 'error', 'warning', 'info'
            timestamp: new Date(),
            persistent: options.persistent || false,
            actions: options.actions || []
        };
        
        this.appState.notifications.push(notification);
        this.displayNotification(notification);
        
        // Auto-remove non-persistent notifications
        if (!notification.persistent) {
            setTimeout(() => {
                this.removeNotification(notification.id);
            }, options.duration || 5000);
        }
    }

    /**
     * Display notification in UI
     */
    displayNotification(notification) {
        const container = this.getOrCreateNotificationContainer();
        
        const element = document.createElement('div');
        element.className = `notification notification-${notification.type}`;
        element.dataset.notificationId = notification.id;
        
        let actionsHtml = '';
        if (notification.actions.length > 0) {
            actionsHtml = `
                <div class="notification-actions">
                    ${notification.actions.map(action => 
                        `<button class="notification-action" data-action="${action.text}">${action.text}</button>`
                    ).join('')}
                </div>
            `;
        }
        
        element.innerHTML = `
            <div class="notification-content">
                <div class="notification-message">${notification.message}</div>
                ${actionsHtml}
            </div>
            <button class="notification-close">&times;</button>
        `;
        
        // Setup action handlers
        notification.actions.forEach(action => {
            const actionBtn = element.querySelector(`[data-action="${action.text}"]`);
            if (actionBtn) {
                actionBtn.addEventListener('click', () => {
                    action.action();
                    this.removeNotification(notification.id);
                });
            }
        });
        
        // Setup close handler
        const closeBtn = element.querySelector('.notification-close');
        closeBtn.addEventListener('click', () => {
            this.removeNotification(notification.id);
        });
        
        container.appendChild(element);
        
        // Animate in
        requestAnimationFrame(() => {
            element.classList.add('notification-show');
        });
    }

    /**
     * Remove notification
     */
    removeNotification(notificationId) {
        const element = document.querySelector(`[data-notification-id="${notificationId}"]`);
        if (element) {
            element.classList.add('notification-hide');
            setTimeout(() => {
                element.remove();
            }, 300);
        }
        
        this.appState.notifications = this.appState.notifications.filter(
            n => n.id !== notificationId
        );
    }

    /**
     * Get or create notification container
     */
    getOrCreateNotificationContainer() {
        let container = document.getElementById('notification-container');
        if (!container) {
            container = document.createElement('div');
            container.id = 'notification-container';
            container.className = 'notification-container';
            document.body.appendChild(container);
        }
        return container;
    }

    /**
     * Show error message
     */
    showError(message, options = {}) {
        this.showNotification(message, 'error', options);
    }

    /**
     * Show success message
     */
    showSuccess(message, options = {}) {
        this.showNotification(message, 'success', options);
    }

    showUpdateAvailable() {
        const updateBanner = document.createElement('div');
        updateBanner.className = 'update-banner';
        updateBanner.innerHTML = `
            <p>A new version is available!</p>
            <button onclick="location.reload()">Update</button>
        `;
        document.body.appendChild(updateBanner);
    }

    /**
     * Settings and preferences management
     */
    async loadSettings() {
        try {
            const settings = await Database.get(Database.STORES.SETTINGS, 'app-settings');
            if (settings) {
                this.appState.settings = {
                    theme: 'auto',
                    notifications: true,
                    hapticFeedback: true,
                    autoStartRestTimer: true,
                    defaultRestTime: 90,
                    units: 'imperial', // 'imperial' or 'metric'
                    workoutReminders: true,
                    soundEffects: true,
                    ...settings
                };
            } else {
                // Create default settings
                this.appState.settings = {
                    theme: 'auto',
                    notifications: true,
                    hapticFeedback: true,
                    autoStartRestTimer: true,
                    defaultRestTime: 90,
                    units: 'imperial',
                    workoutReminders: true,
                    soundEffects: true
                };
                await this.saveSettings();
            }
        } catch (error) {
            console.error('Error loading settings:', error);
            // Use default settings
            this.appState.settings = {
                theme: 'auto',
                notifications: true,
                hapticFeedback: true,
                autoStartRestTimer: true,
                defaultRestTime: 90,
                units: 'imperial',
                workoutReminders: true,
                soundEffects: true
            };
        }
    }

    /**
     * Save settings to database
     */
    async saveSettings() {
        try {
            await Database.update(Database.STORES.SETTINGS, {
                id: 'app-settings',
                ...this.appState.settings,
                updatedAt: new Date()
            });
        } catch (error) {
            console.error('Error saving settings:', error);
        }
    }

    /**
     * Update setting
     */
    async updateSetting(key, value) {
        this.appState.settings[key] = value;
        await this.saveSettings();
        
        // Apply setting changes
        switch (key) {
            case 'theme':
                this.applyTheme();
                break;
            case 'workoutReminders':
                if (value) {
                    this.setupWorkoutReminders();
                }
                break;
        }
        
        this.emitEvent('settingChanged', { key, value });
    }

    /**
     * Apply theme based on settings
     */
    applyTheme() {
        const theme = this.appState.settings.theme;
        const html = document.documentElement;
        
        html.classList.remove('theme-light', 'theme-dark');
        
        if (theme === 'light') {
            html.classList.add('theme-light');
        } else if (theme === 'dark') {
            html.classList.add('theme-dark');
        } else {
            // Auto theme - use system preference
            if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
                html.classList.add('theme-dark');
            } else {
                html.classList.add('theme-light');
            }
        }
    }

    /**
     * Export all data for backup
     */
    async exportData() {
        try {
            this.showLoading(true, 'Exporting data...');
            
            const exportData = {
                version: '1.0.0',
                timestamp: new Date().toISOString(),
                exercises: await ExerciseManager.exportExercises(),
                workouts: await WorkoutManager.exportWorkouts(),
                plans: await PlanManager.exportPlans(),
                settings: this.appState.settings
            };
            
            const blob = new Blob([JSON.stringify(exportData, null, 2)], {
                type: 'application/json'
            });
            
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `workout-tracker-backup-${new Date().toISOString().split('T')[0]}.json`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            
            this.showSuccess('Data exported successfully!');
        } catch (error) {
            console.error('Export error:', error);
            this.showError('Failed to export data');
        } finally {
            this.showLoading(false);
        }
    }

    // Event System
    
    /**
     * Add event listener
     */
    addEventListener(event, callback) {
        if (!this.eventListeners.has(event)) {
            this.eventListeners.set(event, []);
        }
        this.eventListeners.get(event).push(callback);
    }
    
    /**
     * Emit event
     */
    emitEvent(event, data) {
        if (this.eventListeners.has(event)) {
            this.eventListeners.get(event).forEach(callback => {
                try {
                    callback(data);
                } catch (error) {
                    console.error(`Error in event listener for ${event}:`, error);
                }
            });
        }
    }

    // Utility Methods
    
    /**
     * Format date for display
     */
    formatDate(date) {
        if (!date) return 'N/A';
        return new Date(date).toLocaleDateString();
    }

    /**
     * Calculate next workout time for a plan
     */
    calculateNextWorkoutTime(plan) {
        // Simplified calculation - would need more sophisticated logic
        const now = new Date();
        const schedule = plan.schedule;
        
        if (schedule && schedule.timeOfDay) {
            const timeMap = {
                'morning': 8,
                'afternoon': 14,
                'evening': 18
            };
            
            const hour = timeMap[schedule.timeOfDay] || 12;
            const nextWorkout = new Date(now);
            nextWorkout.setHours(hour, 0, 0, 0);
            
            if (nextWorkout <= now) {
                nextWorkout.setDate(nextWorkout.getDate() + 1);
            }
            
            return nextWorkout.getTime();
        }
        
        return now.getTime() + (24 * 60 * 60 * 1000); // Default to 24 hours
    }

    // Placeholder methods for future implementation
    async restoreWorkoutState() { /* TODO */ }
    saveAppState() { /* TODO */ }
    handleAppPause() { /* TODO */ }
    handleAppResume() { /* TODO */ }
    handleWorkoutStarted(data) { this.appState.currentWorkout = data; }
    handleWorkoutCompleted(data) { this.appState.currentWorkout = null; this.showSuccess('Workout completed!'); }
    handleRestTimerCompleted(data) { this.showNotification('Rest time over!', 'info'); }
    updateWorkoutTimer(data) { /* TODO */ }
    handlePlanCreated(data) { this.showSuccess('Plan created successfully!'); }
    handlePlanWorkoutStarted(data) { this.appState.currentWorkout = data.workoutId; }
    focusSearch() { const search = document.getElementById('exercise-search'); if (search) search.focus(); }
    startQuickWorkout() { this.startWorkout(); }
    closeModals() { const modals = document.querySelectorAll('.modal.active'); modals.forEach(m => m.classList.remove('active')); }
    showSettings() { /* TODO */ }
    showAbout() { /* TODO */ }
    async startPlanWorkout(planId) { await PlanManager.startPlanWorkout(planId); }
}

// Initialize app when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeApp);
} else {
    initializeApp();
}

function initializeApp() {
    window.app = new WorkoutTrackerApp();
    
    // Make app globally available for debugging
    if (process?.env?.NODE_ENV === 'development') {
        window.WorkoutTrackerApp = WorkoutTrackerApp;
        window.Database = Database;
        window.ExerciseManager = ExerciseManager;
        window.WorkoutManager = WorkoutManager;
        window.PlanManager = PlanManager;
    }
}

// Service Worker registration with additional logic
if ('serviceWorker' in navigator) {
    window.addEventListener('load', async () => {
        try {
            const registration = await navigator.serviceWorker.register('/sw.js');
            console.log('✅ Service Worker registered:', registration);
            
            // Handle service worker updates
            registration.addEventListener('updatefound', () => {
                const newWorker = registration.installing;
                console.log('🔄 New service worker installing...');
                
                newWorker.addEventListener('statechange', () => {
                    if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                        console.log('🎉 New service worker installed!');
                        if (window.app) {
                            window.app.showUpdateAvailable();
                        }
                    }
                });
            });
            
        } catch (error) {
            console.error('❌ Service Worker registration failed:', error);
        }
    });
}

// Global error handler
window.addEventListener('error', (event) => {
    console.error('Global error:', event.error);
    if (window.app) {
        window.app.showError('An unexpected error occurred');
    }
});

// Unhandled promise rejection handler
window.addEventListener('unhandledrejection', (event) => {
    console.error('Unhandled promise rejection:', event.reason);
    if (window.app) {
        window.app.showError('An unexpected error occurred');
    }
    event.preventDefault();
});