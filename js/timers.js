/**
 * Workout Timer System
 * Handles rest timers, workout duration, audio alerts, and background functionality
 */

class WorkoutTimers {
    constructor() {
        this.timers = new Map();
        this.audioContext = null;
        this.wakeLock = null;
        this.isBackgroundMode = false;
        
        // Timer states
        this.workoutTimer = {
            startTime: null,
            pausedTime: 0,
            isRunning: false,
            duration: 0
        };
        
        this.restTimer = {
            duration: 0,
            remaining: 0,
            isRunning: false,
            intervalId: null,
            startTime: null,
            exerciseId: null,
            customDuration: null
        };
        
        // Settings
        this.settings = {
            defaultRestTime: 90, // seconds
            audioEnabled: true,
            vibrationEnabled: true,
            backgroundTimers: true,
            countdownBeeps: true,
            autoStartRest: true,
            customRestTimes: new Map() // exerciseId -> restTime
        };
        
        // Audio buffers
        this.audioBuffers = new Map();
        
        // Event listeners
        this.eventListeners = new Map();
        
        this.init();
    }

    async init() {
        await this.loadSettings();
        await this.initializeAudio();
        this.setupBackgroundHandling();
        this.setupVisibilityChange();
        this.loadCustomRestTimes();
    }

    // Settings Management
    async loadSettings() {
        const saved = localStorage.getItem('workoutTimer_settings');
        if (saved) {
            this.settings = { ...this.settings, ...JSON.parse(saved) };
        }
    }

    async saveSettings() {
        localStorage.setItem('workoutTimer_settings', JSON.stringify(this.settings));
    }

    updateSettings(newSettings) {
        this.settings = { ...this.settings, ...newSettings };
        this.saveSettings();
        this.emit('settingsUpdated', this.settings);
    }

    // Audio System
    async initializeAudio() {
        try {
            // Initialize Web Audio API for better performance
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            
            // Load audio files
            await this.loadAudioBuffers();
            
            console.log('Audio system initialized');
        } catch (error) {
            console.warn('Audio initialization failed:', error);
            this.settings.audioEnabled = false;
        }
    }

    async loadAudioBuffers() {
        const audioFiles = {
            'beep': this.generateBeepTone(800, 0.2), // High beep
            'countdown': this.generateBeepTone(600, 0.15), // Mid beep
            'complete': this.generateCompleteTone(), // Success tone
            'warning': this.generateBeepTone(400, 0.3) // Low warning
        };

        for (const [name, audioData] of Object.entries(audioFiles)) {
            try {
                const arrayBuffer = await audioData;
                const audioBuffer = await this.audioContext.decodeAudioData(arrayBuffer);
                this.audioBuffers.set(name, audioBuffer);
            } catch (error) {
                console.warn(`Failed to load ${name} audio:`, error);
            }
        }
    }

    generateBeepTone(frequency, duration) {
        const sampleRate = 44100;
        const frameCount = sampleRate * duration;
        const arrayBuffer = new ArrayBuffer(44 + frameCount * 2);
        const view = new DataView(arrayBuffer);
        
        // WAV header
        const writeString = (offset, string) => {
            for (let i = 0; i < string.length; i++) {
                view.setUint8(offset + i, string.charCodeAt(i));
            }
        };
        
        writeString(0, 'RIFF');
        view.setUint32(4, 36 + frameCount * 2, true);
        writeString(8, 'WAVE');
        writeString(12, 'fmt ');
        view.setUint32(16, 16, true);
        view.setUint16(20, 1, true);
        view.setUint16(22, 1, true);
        view.setUint32(24, sampleRate, true);
        view.setUint32(28, sampleRate * 2, true);
        view.setUint16(32, 2, true);
        view.setUint16(34, 16, true);
        writeString(36, 'data');
        view.setUint32(40, frameCount * 2, true);
        
        // Generate sine wave
        for (let i = 0; i < frameCount; i++) {
            const sample = Math.sin(2 * Math.PI * frequency * i / sampleRate) * 0.3;
            view.setInt16(44 + i * 2, sample * 32767, true);
        }
        
        return Promise.resolve(arrayBuffer);
    }

    generateCompleteTone() {
        const sampleRate = 44100;
        const duration = 0.6;
        const frameCount = sampleRate * duration;
        const arrayBuffer = new ArrayBuffer(44 + frameCount * 2);
        const view = new DataView(arrayBuffer);
        
        // WAV header (same as above)
        const writeString = (offset, string) => {
            for (let i = 0; i < string.length; i++) {
                view.setUint8(offset + i, string.charCodeAt(i));
            }
        };
        
        writeString(0, 'RIFF');
        view.setUint32(4, 36 + frameCount * 2, true);
        writeString(8, 'WAVE');
        writeString(12, 'fmt ');
        view.setUint32(16, 16, true);
        view.setUint16(20, 1, true);
        view.setUint16(22, 1, true);
        view.setUint32(24, sampleRate, true);
        view.setUint32(28, sampleRate * 2, true);
        view.setUint16(32, 2, true);
        view.setUint16(34, 16, true);
        writeString(36, 'data');
        view.setUint32(40, frameCount * 2, true);
        
        // Generate ascending tone sequence
        for (let i = 0; i < frameCount; i++) {
            const progress = i / frameCount;
            const frequency = 600 + (progress * 400); // 600Hz to 1000Hz
            const amplitude = Math.max(0, 0.4 * (1 - progress * 2)); // Fade out
            const sample = Math.sin(2 * Math.PI * frequency * i / sampleRate) * amplitude;
            view.setInt16(44 + i * 2, sample * 32767, true);
        }
        
        return Promise.resolve(arrayBuffer);
    }

    playSound(soundName) {
        if (!this.settings.audioEnabled || !this.audioContext || !this.audioBuffers.has(soundName)) {
            return;
        }

        try {
            const source = this.audioContext.createBufferSource();
            source.buffer = this.audioBuffers.get(soundName);
            source.connect(this.audioContext.destination);
            source.start();
        } catch (error) {
            console.warn('Failed to play sound:', error);
        }
    }

    // Vibration
    vibrate(pattern = [200]) {
        if (!this.settings.vibrationEnabled || !navigator.vibrate) {
            return;
        }

        try {
            navigator.vibrate(pattern);
        } catch (error) {
            console.warn('Vibration failed:', error);
        }
    }

    // Workout Duration Timer
    startWorkoutTimer() {
        if (this.workoutTimer.isRunning) return;
        
        this.workoutTimer.startTime = Date.now() - this.workoutTimer.pausedTime;
        this.workoutTimer.isRunning = true;
        this.workoutTimer.pausedTime = 0;
        
        this.updateWorkoutDuration();
        this.emit('workoutTimerStarted', this.workoutTimer);
    }

    pauseWorkoutTimer() {
        if (!this.workoutTimer.isRunning) return;
        
        this.workoutTimer.pausedTime = Date.now() - this.workoutTimer.startTime;
        this.workoutTimer.isRunning = false;
        
        this.emit('workoutTimerPaused', this.workoutTimer);
    }

    stopWorkoutTimer() {
        this.workoutTimer.isRunning = false;
        this.workoutTimer.startTime = null;
        this.workoutTimer.pausedTime = 0;
        this.workoutTimer.duration = 0;
        
        this.emit('workoutTimerStopped', this.workoutTimer);
    }

    updateWorkoutDuration() {
        if (!this.workoutTimer.isRunning) return;
        
        this.workoutTimer.duration = Date.now() - this.workoutTimer.startTime;
        this.emit('workoutDurationUpdate', {
            duration: this.workoutTimer.duration,
            formatted: this.formatDuration(this.workoutTimer.duration)
        });
        
        // Continue updating
        setTimeout(() => this.updateWorkoutDuration(), 1000);
    }

    getWorkoutDuration() {
        if (this.workoutTimer.isRunning) {
            return Date.now() - this.workoutTimer.startTime;
        }
        return this.workoutTimer.pausedTime || this.workoutTimer.duration;
    }

    // Rest Timer
    startRestTimer(exerciseId = null, customDuration = null) {
        // Stop any existing rest timer
        this.stopRestTimer();
        
        // Determine rest duration
        let duration = customDuration || this.getRestTimeForExercise(exerciseId) || this.settings.defaultRestTime;
        
        this.restTimer = {
            duration: duration,
            remaining: duration,
            isRunning: true,
            startTime: Date.now(),
            exerciseId: exerciseId,
            customDuration: customDuration
        };
        
        this.runRestTimer();
        this.emit('restTimerStarted', {
            duration: duration,
            exerciseId: exerciseId
        });
        
        return duration;
    }

    runRestTimer() {
        if (!this.restTimer.isRunning) return;
        
        const elapsed = Math.floor((Date.now() - this.restTimer.startTime) / 1000);
        this.restTimer.remaining = Math.max(0, this.restTimer.duration - elapsed);
        
        // Emit progress update
        this.emit('restTimerUpdate', {
            remaining: this.restTimer.remaining,
            duration: this.restTimer.duration,
            progress: ((this.restTimer.duration - this.restTimer.remaining) / this.restTimer.duration) * 100,
            formatted: this.formatTime(this.restTimer.remaining)
        });
        
        // Countdown beeps in last 5 seconds
        if (this.settings.countdownBeeps && this.restTimer.remaining <= 5 && this.restTimer.remaining > 0) {
            this.playSound('countdown');
            this.vibrate([100]);
        }
        
        // Timer completed
        if (this.restTimer.remaining <= 0) {
            this.completeRestTimer();
            return;
        }
        
        // Continue timer
        this.restTimer.intervalId = setTimeout(() => this.runRestTimer(), 1000);
    }

    completeRestTimer() {
        this.playSound('complete');
        this.vibrate([200, 100, 200]);
        
        const timerData = { ...this.restTimer };
        this.stopRestTimer();
        
        this.emit('restTimerCompleted', timerData);
        
        // Show notification if in background
        if (this.isBackgroundMode) {
            this.showNotification('Rest Complete!', 'Time to get back to your workout');
        }
    }

    pauseRestTimer() {
        if (!this.restTimer.isRunning) return;
        
        if (this.restTimer.intervalId) {
            clearTimeout(this.restTimer.intervalId);
            this.restTimer.intervalId = null;
        }
        
        const elapsed = Math.floor((Date.now() - this.restTimer.startTime) / 1000);
        this.restTimer.remaining = Math.max(0, this.restTimer.duration - elapsed);
        this.restTimer.isRunning = false;
        
        this.emit('restTimerPaused', this.restTimer);
    }

    resumeRestTimer() {
        if (this.restTimer.isRunning || this.restTimer.remaining <= 0) return;
        
        this.restTimer.startTime = Date.now() - ((this.restTimer.duration - this.restTimer.remaining) * 1000);
        this.restTimer.isRunning = true;
        
        this.runRestTimer();
        this.emit('restTimerResumed', this.restTimer);
    }

    stopRestTimer() {
        if (this.restTimer.intervalId) {
            clearTimeout(this.restTimer.intervalId);
            this.restTimer.intervalId = null;
        }
        
        this.restTimer.isRunning = false;
        this.restTimer.remaining = 0;
        
        this.emit('restTimerStopped', this.restTimer);
    }

    addRestTime(seconds) {
        if (!this.restTimer.isRunning) return;
        
        this.restTimer.duration += seconds;
        this.restTimer.remaining += seconds;
        
        this.emit('restTimeAdded', {
            added: seconds,
            newDuration: this.restTimer.duration,
            remaining: this.restTimer.remaining
        });
    }

    // Custom Rest Times
    setCustomRestTime(exerciseId, restTime) {
        this.settings.customRestTimes.set(exerciseId, restTime);
        this.saveCustomRestTimes();
        this.emit('customRestTimeSet', { exerciseId, restTime });
    }

    getRestTimeForExercise(exerciseId) {
        if (!exerciseId) return this.settings.defaultRestTime;
        return this.settings.customRestTimes.get(exerciseId) || this.settings.defaultRestTime;
    }

    saveCustomRestTimes() {
        const customTimes = Object.fromEntries(this.settings.customRestTimes);
        localStorage.setItem('workoutTimer_customRestTimes', JSON.stringify(customTimes));
    }

    loadCustomRestTimes() {
        const saved = localStorage.getItem('workoutTimer_customRestTimes');
        if (saved) {
            const customTimes = JSON.parse(saved);
            this.settings.customRestTimes = new Map(Object.entries(customTimes));
        }
    }

    // Background Functionality
    setupBackgroundHandling() {
        // Request wake lock to keep timers running
        if ('wakeLock' in navigator) {
            this.requestWakeLock();
        }
    }

    async requestWakeLock() {
        try {
            this.wakeLock = await navigator.wakeLock.request('screen');
            console.log('Wake lock acquired');
            
            this.wakeLock.addEventListener('release', () => {
                console.log('Wake lock released');
            });
        } catch (error) {
            console.warn('Wake lock failed:', error);
        }
    }

    setupVisibilityChange() {
        document.addEventListener('visibilitychange', () => {
            this.isBackgroundMode = document.hidden;
            
            if (this.isBackgroundMode) {
                this.handleAppBackgrounded();
            } else {
                this.handleAppForegrounded();
            }
        });
    }

    handleAppBackgrounded() {
        console.log('App backgrounded - timers continue running');
        this.emit('appBackgrounded', {
            workoutRunning: this.workoutTimer.isRunning,
            restRunning: this.restTimer.isRunning
        });
    }

    handleAppForegrounded() {
        console.log('App foregrounded');
        this.emit('appForegrounded', {
            workoutRunning: this.workoutTimer.isRunning,
            restRunning: this.restTimer.isRunning
        });
    }

    // Notifications
    async showNotification(title, body, options = {}) {
        if (!('Notification' in window)) return;
        
        if (Notification.permission === 'granted') {
            const notification = new Notification(title, {
                body: body,
                icon: '/icons/icon-192.svg',
                badge: '/icons/icon-96.svg',
                tag: 'workout-timer',
                requireInteraction: true,
                ...options
            });
            
            notification.onclick = () => {
                window.focus();
                notification.close();
            };
            
            // Auto-close after 5 seconds
            setTimeout(() => notification.close(), 5000);
        }
    }

    async requestNotificationPermission() {
        if (!('Notification' in window)) {
            return 'not-supported';
        }
        
        if (Notification.permission === 'default') {
            const permission = await Notification.requestPermission();
            return permission;
        }
        
        return Notification.permission;
    }

    // Utility Functions
    formatTime(seconds) {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    }

    formatDuration(milliseconds) {
        const totalSeconds = Math.floor(milliseconds / 1000);
        const hours = Math.floor(totalSeconds / 3600);
        const minutes = Math.floor((totalSeconds % 3600) / 60);
        const seconds = totalSeconds % 60;
        
        if (hours > 0) {
            return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        }
        return `${minutes}:${seconds.toString().padStart(2, '0')}`;
    }

    // State Management
    getTimerState() {
        return {
            workout: {
                ...this.workoutTimer,
                duration: this.getWorkoutDuration(),
                formatted: this.formatDuration(this.getWorkoutDuration())
            },
            rest: {
                ...this.restTimer,
                formatted: this.formatTime(this.restTimer.remaining),
                progress: this.restTimer.duration > 0 ? 
                    ((this.restTimer.duration - this.restTimer.remaining) / this.restTimer.duration) * 100 : 0
            },
            settings: this.settings
        };
    }

    saveState() {
        const state = {
            workoutTimer: this.workoutTimer,
            restTimer: this.restTimer,
            settings: this.settings
        };
        localStorage.setItem('workoutTimer_state', JSON.stringify(state));
    }

    loadState() {
        const saved = localStorage.getItem('workoutTimer_state');
        if (saved) {
            const state = JSON.parse(saved);
            
            // Restore workout timer
            if (state.workoutTimer && state.workoutTimer.isRunning) {
                this.workoutTimer = state.workoutTimer;
                this.updateWorkoutDuration();
            }
            
            // Restore rest timer
            if (state.restTimer && state.restTimer.isRunning) {
                this.restTimer = state.restTimer;
                // Recalculate remaining time
                const elapsed = Math.floor((Date.now() - this.restTimer.startTime) / 1000);
                this.restTimer.remaining = Math.max(0, this.restTimer.duration - elapsed);
                
                if (this.restTimer.remaining > 0) {
                    this.runRestTimer();
                } else {
                    this.completeRestTimer();
                }
            }
        }
    }

    // Event System
    addEventListener(event, callback) {
        if (!this.eventListeners.has(event)) {
            this.eventListeners.set(event, []);
        }
        this.eventListeners.get(event).push(callback);
    }

    removeEventListener(event, callback) {
        if (this.eventListeners.has(event)) {
            const listeners = this.eventListeners.get(event);
            const index = listeners.indexOf(callback);
            if (index > -1) {
                listeners.splice(index, 1);
            }
        }
    }

    emit(event, data) {
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

    // Cleanup
    destroy() {
        this.stopWorkoutTimer();
        this.stopRestTimer();
        
        if (this.wakeLock) {
            this.wakeLock.release();
        }
        
        if (this.audioContext) {
            this.audioContext.close();
        }
        
        this.eventListeners.clear();
        this.audioBuffers.clear();
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = WorkoutTimers;
}