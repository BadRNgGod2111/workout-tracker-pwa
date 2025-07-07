/**
 * Timer UI Components
 * Manages timer displays, controls, and user interactions
 */

class TimerUI {
    constructor(timers) {
        this.timers = timers;
        this.elements = new Map();
        this.isVisible = false;
        this.currentExercise = null;
        
        this.init();
    }

    init() {
        this.createTimerComponents();
        this.setupEventListeners();
        this.setupTimerEventListeners();
    }

    createTimerComponents() {
        // Create workout timer display (always visible during workout)
        this.createWorkoutTimerDisplay();
        
        // Create rest timer overlay
        this.createRestTimerOverlay();
        
        // Create timer settings modal
        this.createTimerSettingsModal();
        
        // Create timer controls for exercises
        this.createTimerControls();
    }

    createWorkoutTimerDisplay() {
        const workoutTimerHTML = `
            <div class="workout-timer-display" id="workout-timer-display">
                <div class="workout-timer-content">
                    <div class="timer-icon">⏱️</div>
                    <div class="timer-text">
                        <div class="timer-duration" id="workout-duration">0:00</div>
                        <div class="timer-label">Workout Time</div>
                    </div>
                    <button class="timer-control-btn" id="workout-timer-toggle">
                        <span class="btn-icon" id="workout-timer-icon">⏸️</span>
                    </button>
                </div>
            </div>
        `;

        // Add to workout tab
        const workoutTab = document.getElementById('workouts-tab');
        if (workoutTab) {
            const quickStart = workoutTab.querySelector('.quick-start-card');
            if (quickStart) {
                quickStart.insertAdjacentHTML('afterend', workoutTimerHTML);
            }
        }
    }

    createRestTimerOverlay() {
        const restTimerHTML = `
            <div class="rest-timer-overlay" id="rest-timer-overlay">
                <div class="rest-timer-content">
                    <div class="rest-timer-header">
                        <h2>Rest Time</h2>
                        <button class="close-rest-timer" id="close-rest-timer">×</button>
                    </div>
                    
                    <div class="rest-timer-circle">
                        <svg class="progress-ring" viewBox="0 0 120 120">
                            <circle class="progress-ring-background" cx="60" cy="60" r="50"/>
                            <circle class="progress-ring-progress" cx="60" cy="60" r="50" id="rest-progress-circle"/>
                        </svg>
                        <div class="rest-time-display">
                            <div class="rest-time-number" id="rest-time-number">0:00</div>
                            <div class="rest-time-label">remaining</div>
                        </div>
                    </div>
                    
                    <div class="rest-timer-controls">
                        <button class="rest-control-btn secondary" id="rest-minus-30">-30s</button>
                        <button class="rest-control-btn primary" id="rest-pause-resume">
                            <span id="rest-pause-icon">⏸️</span>
                        </button>
                        <button class="rest-control-btn secondary" id="rest-plus-30">+30s</button>
                    </div>
                    
                    <div class="rest-timer-actions">
                        <button class="ios-button ios-button-secondary" id="skip-rest">Skip Rest</button>
                        <button class="ios-button" id="rest-timer-settings">Settings</button>
                    </div>
                    
                    <div class="next-exercise-info" id="next-exercise-info">
                        <div class="next-exercise-label">Next Exercise:</div>
                        <div class="next-exercise-name" id="next-exercise-name">-</div>
                    </div>
                </div>
            </div>
        `;

        document.body.insertAdjacentHTML('beforeend', restTimerHTML);
    }

    createTimerSettingsModal() {
        const settingsHTML = `
            <div class="modal" id="timer-settings-modal">
                <div class="modal-content ios-card">
                    <div class="modal-header">
                        <h3>Timer Settings</h3>
                        <button class="close-btn" data-modal="timer-settings-modal">&times;</button>
                    </div>
                    <div class="modal-body">
                        <div class="form-group">
                            <label>Default Rest Time</label>
                            <div class="time-input-group">
                                <input type="number" class="ios-input time-input" 
                                       id="default-rest-minutes" min="0" max="10" value="1">
                                <span class="time-separator">:</span>
                                <input type="number" class="ios-input time-input" 
                                       id="default-rest-seconds" min="0" max="59" value="30">
                            </div>
                        </div>
                        
                        <div class="form-group">
                            <label class="checkbox-label">
                                <input type="checkbox" id="auto-start-rest" checked>
                                <span class="checkmark"></span>
                                Auto-start rest timer after sets
                            </label>
                        </div>
                        
                        <div class="form-group">
                            <label class="checkbox-label">
                                <input type="checkbox" id="countdown-beeps" checked>
                                <span class="checkmark"></span>
                                Countdown beeps (last 5 seconds)
                            </label>
                        </div>
                        
                        <div class="form-group">
                            <label class="checkbox-label">
                                <input type="checkbox" id="audio-enabled" checked>
                                <span class="checkmark"></span>
                                Audio alerts
                            </label>
                        </div>
                        
                        <div class="form-group">
                            <label class="checkbox-label">
                                <input type="checkbox" id="vibration-enabled" checked>
                                <span class="checkmark"></span>
                                Vibration alerts
                            </label>
                        </div>
                        
                        <div class="form-group">
                            <label class="checkbox-label">
                                <input type="checkbox" id="background-timers" checked>
                                <span class="checkmark"></span>
                                Keep timers running in background
                            </label>
                        </div>
                        
                        <div class="form-actions">
                            <button type="button" class="ios-button ios-button-secondary" data-modal="timer-settings-modal">Cancel</button>
                            <button type="button" class="ios-button" id="save-timer-settings">Save Settings</button>
                        </div>
                    </div>
                </div>
            </div>
        `;

        document.body.insertAdjacentHTML('beforeend', settingsHTML);
    }

    createTimerControls() {
        // This will be added to exercise items dynamically
        // Called when exercises are rendered
    }

    addExerciseTimerControls(exerciseElement, exerciseId) {
        const timerControlsHTML = `
            <div class="exercise-timer-controls">
                <button class="timer-quick-btn" data-time="60" data-exercise="${exerciseId}">1m</button>
                <button class="timer-quick-btn" data-time="90" data-exercise="${exerciseId}">1.5m</button>
                <button class="timer-quick-btn" data-time="120" data-exercise="${exerciseId}">2m</button>
                <button class="timer-quick-btn" data-time="180" data-exercise="${exerciseId}">3m</button>
                <button class="timer-custom-btn" data-exercise="${exerciseId}">Custom</button>
            </div>
        `;

        const setsContainer = exerciseElement.querySelector('.sets-container');
        if (setsContainer) {
            setsContainer.insertAdjacentHTML('afterend', timerControlsHTML);
        }
    }

    setupEventListeners() {
        // Workout timer controls
        document.addEventListener('click', (e) => {
            if (e.target.id === 'workout-timer-toggle') {
                this.toggleWorkoutTimer();
            }
            
            // Rest timer controls
            if (e.target.id === 'close-rest-timer' || e.target.id === 'skip-rest') {
                this.closeRestTimer();
            }
            
            if (e.target.id === 'rest-pause-resume') {
                this.toggleRestTimer();
            }
            
            if (e.target.id === 'rest-minus-30') {
                this.adjustRestTime(-30);
            }
            
            if (e.target.id === 'rest-plus-30') {
                this.adjustRestTime(30);
            }
            
            // Timer quick buttons
            if (e.target.matches('.timer-quick-btn')) {
                const time = parseInt(e.target.dataset.time);
                const exerciseId = e.target.dataset.exercise;
                this.startRestTimer(exerciseId, time);
            }
            
            if (e.target.matches('.timer-custom-btn')) {
                const exerciseId = e.target.dataset.exercise;
                this.showCustomTimerDialog(exerciseId);
            }
            
            // Settings
            if (e.target.id === 'rest-timer-settings') {
                this.showTimerSettings();
            }
            
            if (e.target.id === 'save-timer-settings') {
                this.saveTimerSettings();
            }
            
            // Modal handlers
            if (e.target.matches('[data-modal]')) {
                this.hideModal(e.target.dataset.modal);
            }
        });
    }

    setupTimerEventListeners() {
        // Workout timer events
        this.timers.addEventListener('workoutTimerStarted', () => {
            this.updateWorkoutTimerDisplay();
            this.showWorkoutTimer();
        });
        
        this.timers.addEventListener('workoutTimerPaused', () => {
            this.updateWorkoutTimerDisplay();
        });
        
        this.timers.addEventListener('workoutTimerStopped', () => {
            this.hideWorkoutTimer();
        });
        
        this.timers.addEventListener('workoutDurationUpdate', (data) => {
            this.updateWorkoutDuration(data.formatted);
        });
        
        // Rest timer events
        this.timers.addEventListener('restTimerStarted', (data) => {
            this.showRestTimer(data);
        });
        
        this.timers.addEventListener('restTimerUpdate', (data) => {
            this.updateRestTimer(data);
        });
        
        this.timers.addEventListener('restTimerCompleted', () => {
            this.handleRestTimerCompleted();
        });
        
        this.timers.addEventListener('restTimerPaused', () => {
            this.updateRestTimerControls();
        });
        
        this.timers.addEventListener('restTimerResumed', () => {
            this.updateRestTimerControls();
        });
        
        this.timers.addEventListener('restTimeAdded', (data) => {
            this.showTimeAdjustmentFeedback(data.added);
        });
    }

    // Workout Timer UI
    showWorkoutTimer() {
        const display = document.getElementById('workout-timer-display');
        if (display) {
            display.classList.add('active');
        }
    }

    hideWorkoutTimer() {
        const display = document.getElementById('workout-timer-display');
        if (display) {
            display.classList.remove('active');
        }
    }

    updateWorkoutTimerDisplay() {
        const timerState = this.timers.getTimerState();
        const icon = document.getElementById('workout-timer-icon');
        
        if (icon) {
            icon.textContent = timerState.workout.isRunning ? '⏸️' : '▶️';
        }
    }

    updateWorkoutDuration(formatted) {
        const durationElement = document.getElementById('workout-duration');
        if (durationElement) {
            durationElement.textContent = formatted;
        }
    }

    toggleWorkoutTimer() {
        const timerState = this.timers.getTimerState();
        
        if (timerState.workout.isRunning) {
            this.timers.pauseWorkoutTimer();
        } else {
            this.timers.startWorkoutTimer();
        }
    }

    // Rest Timer UI
    showRestTimer(data) {
        const overlay = document.getElementById('rest-timer-overlay');
        if (overlay) {
            overlay.classList.add('active');
            this.updateRestTimerControls();
            
            // Set up progress circle
            const circle = document.getElementById('rest-progress-circle');
            if (circle) {
                const circumference = 2 * Math.PI * 50; // radius = 50
                circle.style.strokeDasharray = circumference;
                circle.style.strokeDashoffset = circumference;
            }
        }
    }

    hideRestTimer() {
        const overlay = document.getElementById('rest-timer-overlay');
        if (overlay) {
            overlay.classList.remove('active');
        }
    }

    closeRestTimer() {
        this.timers.stopRestTimer();
        this.hideRestTimer();
    }

    updateRestTimer(data) {
        // Update time display
        const timeNumber = document.getElementById('rest-time-number');
        if (timeNumber) {
            timeNumber.textContent = data.formatted;
        }
        
        // Update progress circle
        const circle = document.getElementById('rest-progress-circle');
        if (circle) {
            const circumference = 2 * Math.PI * 50;
            const offset = circumference - (data.progress / 100) * circumference;
            circle.style.strokeDashoffset = offset;
        }
        
        // Color coding for urgency
        const overlay = document.getElementById('rest-timer-overlay');
        if (overlay) {
            overlay.classList.remove('warning', 'critical');
            
            if (data.remaining <= 10) {
                overlay.classList.add('critical');
            } else if (data.remaining <= 30) {
                overlay.classList.add('warning');
            }
        }
    }

    updateRestTimerControls() {
        const timerState = this.timers.getTimerState();
        const pauseIcon = document.getElementById('rest-pause-icon');
        
        if (pauseIcon) {
            pauseIcon.textContent = timerState.rest.isRunning ? '⏸️' : '▶️';
        }
    }

    toggleRestTimer() {
        const timerState = this.timers.getTimerState();
        
        if (timerState.rest.isRunning) {
            this.timers.pauseRestTimer();
        } else {
            this.timers.resumeRestTimer();
        }
    }

    adjustRestTime(seconds) {
        this.timers.addRestTime(seconds);
    }

    showTimeAdjustmentFeedback(seconds) {
        const feedback = document.createElement('div');
        feedback.className = 'time-adjustment-feedback';
        feedback.textContent = seconds > 0 ? `+${seconds}s` : `${seconds}s`;
        
        const overlay = document.getElementById('rest-timer-overlay');
        if (overlay) {
            overlay.appendChild(feedback);
            
            setTimeout(() => {
                feedback.classList.add('show');
            }, 10);
            
            setTimeout(() => {
                feedback.remove();
            }, 2000);
        }
    }

    handleRestTimerCompleted() {
        // Flash the screen or show completion animation
        const overlay = document.getElementById('rest-timer-overlay');
        if (overlay) {
            overlay.classList.add('completed');
            
            setTimeout(() => {
                overlay.classList.remove('completed');
            }, 2000);
        }
        
        // Vibrate and play sound are handled by the timer system
        // Show completion message
        this.showCompletionMessage();
    }

    showCompletionMessage() {
        const message = document.createElement('div');
        message.className = 'rest-completion-message';
        message.innerHTML = `
            <div class="completion-content">
                <div class="completion-icon">✅</div>
                <div class="completion-text">Rest Complete!</div>
                <div class="completion-subtext">Ready for your next set</div>
            </div>
        `;
        
        document.body.appendChild(message);
        
        setTimeout(() => {
            message.classList.add('show');
        }, 10);
        
        setTimeout(() => {
            message.classList.remove('show');
            setTimeout(() => message.remove(), 300);
        }, 3000);
    }

    // Custom Timer Dialog
    showCustomTimerDialog(exerciseId) {
        const currentRestTime = this.timers.getRestTimeForExercise(exerciseId);
        const minutes = Math.floor(currentRestTime / 60);
        const seconds = currentRestTime % 60;
        
        const dialog = document.createElement('div');
        dialog.className = 'custom-timer-dialog';
        dialog.innerHTML = `
            <div class="dialog-content">
                <h3>Set Rest Time</h3>
                <div class="time-input-group">
                    <input type="number" class="ios-input time-input" 
                           id="custom-minutes" min="0" max="10" value="${minutes}">
                    <span class="time-separator">:</span>
                    <input type="number" class="ios-input time-input" 
                           id="custom-seconds" min="0" max="59" value="${seconds}">
                </div>
                <div class="dialog-actions">
                    <button class="ios-button ios-button-secondary" id="cancel-custom-timer">Cancel</button>
                    <button class="ios-button" id="start-custom-timer" data-exercise="${exerciseId}">Start Timer</button>
                </div>
            </div>
        `;
        
        document.body.appendChild(dialog);
        
        setTimeout(() => dialog.classList.add('show'), 10);
        
        // Event listeners for custom dialog
        dialog.addEventListener('click', (e) => {
            if (e.target.id === 'cancel-custom-timer') {
                dialog.remove();
            }
            
            if (e.target.id === 'start-custom-timer') {
                const minutes = parseInt(document.getElementById('custom-minutes').value) || 0;
                const seconds = parseInt(document.getElementById('custom-seconds').value) || 0;
                const totalSeconds = (minutes * 60) + seconds;
                
                if (totalSeconds > 0) {
                    this.timers.setCustomRestTime(exerciseId, totalSeconds);
                    this.startRestTimer(exerciseId, totalSeconds);
                }
                
                dialog.remove();
            }
        });
    }

    // Settings
    showTimerSettings() {
        this.loadSettingsToModal();
        this.showModal('timer-settings-modal');
    }

    loadSettingsToModal() {
        const settings = this.timers.settings;
        
        const defaultRestTime = settings.defaultRestTime;
        const minutes = Math.floor(defaultRestTime / 60);
        const seconds = defaultRestTime % 60;
        
        document.getElementById('default-rest-minutes').value = minutes;
        document.getElementById('default-rest-seconds').value = seconds;
        document.getElementById('auto-start-rest').checked = settings.autoStartRest;
        document.getElementById('countdown-beeps').checked = settings.countdownBeeps;
        document.getElementById('audio-enabled').checked = settings.audioEnabled;
        document.getElementById('vibration-enabled').checked = settings.vibrationEnabled;
        document.getElementById('background-timers').checked = settings.backgroundTimers;
    }

    saveTimerSettings() {
        const minutes = parseInt(document.getElementById('default-rest-minutes').value) || 0;
        const seconds = parseInt(document.getElementById('default-rest-seconds').value) || 0;
        
        const newSettings = {
            defaultRestTime: (minutes * 60) + seconds,
            autoStartRest: document.getElementById('auto-start-rest').checked,
            countdownBeeps: document.getElementById('countdown-beeps').checked,
            audioEnabled: document.getElementById('audio-enabled').checked,
            vibrationEnabled: document.getElementById('vibration-enabled').checked,
            backgroundTimers: document.getElementById('background-timers').checked
        };
        
        this.timers.updateSettings(newSettings);
        this.hideModal('timer-settings-modal');
        
        // Show success message
        this.showNotification('Timer settings saved!', 'success');
    }

    // Helper Methods
    startRestTimer(exerciseId, customTime = null) {
        this.currentExercise = exerciseId;
        this.timers.startRestTimer(exerciseId, customTime);
    }

    showModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.classList.add('show');
        }
    }

    hideModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.classList.remove('show');
        }
    }

    showNotification(message, type = 'info') {
        // Integration with app notification system
        if (window.app && window.app.showNotification) {
            window.app.showNotification(message, type);
        } else {
            console.log(`${type.toUpperCase()}: ${message}`);
        }
    }

    // Public API
    setNextExercise(exerciseName) {
        const nextExerciseElement = document.getElementById('next-exercise-name');
        if (nextExerciseElement) {
            nextExerciseElement.textContent = exerciseName || '-';
        }
    }

    updateExerciseRestTime(exerciseId, restTime) {
        // Update any displayed rest time for this exercise
        const exerciseElements = document.querySelectorAll(`[data-exercise="${exerciseId}"]`);
        exerciseElements.forEach(element => {
            // Update custom timer button text or display
            const customBtn = element.querySelector('.timer-custom-btn');
            if (customBtn && restTime !== this.timers.settings.defaultRestTime) {
                const minutes = Math.floor(restTime / 60);
                const seconds = restTime % 60;
                customBtn.textContent = `${minutes}:${seconds.toString().padStart(2, '0')}`;
            }
        });
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = TimerUI;
}