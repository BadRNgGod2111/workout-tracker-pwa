/**
 * Notification System
 * Handles push notifications, background notifications, and permission management
 */

class NotificationManager {
    constructor() {
        this.permission = 'default';
        this.registration = null;
        this.isSupported = 'Notification' in window;
        this.subscribers = new Map();
        
        this.init();
    }

    async init() {
        if (!this.isSupported) {
            console.warn('Notifications not supported in this browser');
            return;
        }

        this.permission = Notification.permission;
        
        // Get service worker registration
        if ('serviceWorker' in navigator) {
            try {
                this.registration = await navigator.serviceWorker.ready;
                console.log('Notification manager initialized with service worker');
            } catch (error) {
                console.warn('Service worker not available for notifications:', error);
            }
        }
    }

    // Permission Management
    async requestPermission() {
        if (!this.isSupported) {
            return 'not-supported';
        }

        if (this.permission === 'granted') {
            return 'granted';
        }

        if (this.permission === 'denied') {
            return 'denied';
        }

        try {
            this.permission = await Notification.requestPermission();
            return this.permission;
        } catch (error) {
            console.error('Error requesting notification permission:', error);
            return 'error';
        }
    }

    isPermissionGranted() {
        return this.permission === 'granted';
    }

    // Basic Notifications
    async showNotification(title, options = {}) {
        if (!this.isPermissionGranted()) {
            console.warn('Notification permission not granted');
            return null;
        }

        const defaultOptions = {
            body: '',
            icon: '/icons/icon-192.svg',
            badge: '/icons/icon-96.svg',
            tag: 'workout-tracker',
            requireInteraction: false,
            silent: false,
            vibrate: [200, 100, 200],
            data: {
                timestamp: Date.now()
            },
            ...options
        };

        try {
            if (this.registration && this.registration.showNotification) {
                // Use service worker for persistent notifications
                return await this.registration.showNotification(title, defaultOptions);
            } else {
                // Fallback to basic notification
                const notification = new Notification(title, defaultOptions);
                
                // Auto-close after delay
                if (defaultOptions.autoClose !== false) {
                    setTimeout(() => {
                        notification.close();
                    }, defaultOptions.duration || 5000);
                }
                
                return notification;
            }
        } catch (error) {
            console.error('Failed to show notification:', error);
            return null;
        }
    }

    // Workout-specific notifications
    async showWorkoutNotification(type, data = {}) {
        const notifications = {
            'workout-started': {
                title: '💪 Workout Started!',
                body: 'Time to get stronger. You\'ve got this!',
                icon: '/icons/shortcut-workout.svg'
            },
            'workout-completed': {
                title: '🎉 Workout Complete!',
                body: `Great job! You worked out for ${data.duration || 'some time'}.`,
                icon: '/icons/shortcut-workout.svg',
                actions: [
                    { action: 'view-stats', title: 'View Stats' },
                    { action: 'dismiss', title: 'Dismiss' }
                ]
            },
            'rest-timer-started': {
                title: '⏱️ Rest Timer Started',
                body: `Rest for ${data.duration || '90'} seconds`,
                icon: '/icons/icon-192.svg',
                silent: true
            },
            'rest-timer-warning': {
                title: '⚠️ Rest Almost Over',
                body: '10 seconds remaining',
                icon: '/icons/icon-192.svg',
                vibrate: [100, 50, 100]
            },
            'rest-timer-completed': {
                title: '✅ Rest Complete!',
                body: 'Time for your next set',
                icon: '/icons/icon-192.svg',
                vibrate: [200, 100, 200],
                actions: [
                    { action: 'start-set', title: 'Start Set' },
                    { action: 'extend-rest', title: '+30s' }
                ]
            },
            'goal-achieved': {
                title: '🏆 Goal Achieved!',
                body: data.goalName || 'You reached your fitness goal!',
                icon: '/icons/shortcut-progress.svg',
                requireInteraction: true,
                actions: [
                    { action: 'celebrate', title: 'Celebrate!' },
                    { action: 'set-new-goal', title: 'Set New Goal' }
                ]
            },
            'streak-milestone': {
                title: '🔥 Streak Milestone!',
                body: `${data.streakDays} days in a row! Keep it up!`,
                icon: '/icons/shortcut-progress.svg',
                requireInteraction: true
            },
            'workout-reminder': {
                title: '💪 Workout Reminder',
                body: 'Time for your scheduled workout',
                icon: '/icons/icon-192.svg',
                actions: [
                    { action: 'start-workout', title: 'Start Now' },
                    { action: 'snooze', title: 'Remind Later' }
                ]
            }
        };

        const notification = notifications[type];
        if (!notification) {
            console.warn(`Unknown notification type: ${type}`);
            return null;
        }

        return await this.showNotification(notification.title, {
            ...notification,
            data: {
                type: type,
                ...notification.data,
                ...data
            }
        });
    }

    // Scheduled Notifications
    async scheduleNotification(title, options = {}, delay = 0) {
        if (delay <= 0) {
            return await this.showNotification(title, options);
        }

        return new Promise((resolve) => {
            setTimeout(async () => {
                const notification = await this.showNotification(title, options);
                resolve(notification);
            }, delay);
        });
    }

    // Background Notifications (when app is not visible)
    async showBackgroundNotification(title, options = {}) {
        if (!document.hidden) {
            // App is visible, show in-app notification instead
            return this.showInAppNotification(title, options);
        }

        return await this.showNotification(title, {
            ...options,
            requireInteraction: true,
            silent: false
        });
    }

    // In-app notification (when app is visible)
    showInAppNotification(title, options = {}) {
        const notification = document.createElement('div');
        notification.className = 'in-app-notification';
        notification.innerHTML = `
            <div class="notification-content">
                <div class="notification-icon">${options.emoji || '📱'}</div>
                <div class="notification-text">
                    <div class="notification-title">${title}</div>
                    ${options.body ? `<div class="notification-body">${options.body}</div>` : ''}
                </div>
                <button class="notification-close">&times;</button>
            </div>
        `;

        // Add to page
        document.body.appendChild(notification);

        // Show animation
        setTimeout(() => notification.classList.add('show'), 100);

        // Auto-hide
        const duration = options.duration || 4000;
        const autoHideTimer = setTimeout(() => {
            this.hideInAppNotification(notification);
        }, duration);

        // Manual close
        notification.querySelector('.notification-close').addEventListener('click', () => {
            clearTimeout(autoHideTimer);
            this.hideInAppNotification(notification);
        });

        // Click handler
        if (options.onClick) {
            notification.addEventListener('click', options.onClick);
        }

        return notification;
    }

    hideInAppNotification(notification) {
        notification.classList.remove('show');
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 300);
    }

    // Timer-specific helpers
    async startRestTimerNotifications(duration, exerciseId = null) {
        // Initial notification
        await this.showWorkoutNotification('rest-timer-started', { duration });

        // Warning at 10 seconds remaining
        if (duration > 10) {
            setTimeout(() => {
                this.showWorkoutNotification('rest-timer-warning');
            }, (duration - 10) * 1000);
        }

        // Completion notification
        setTimeout(() => {
            this.showWorkoutNotification('rest-timer-completed', { exerciseId });
        }, duration * 1000);
    }

    // Workout session notifications
    async notifyWorkoutStarted(workoutData = {}) {
        return await this.showWorkoutNotification('workout-started', workoutData);
    }

    async notifyWorkoutCompleted(workoutData = {}) {
        return await this.showWorkoutNotification('workout-completed', workoutData);
    }

    async notifyGoalAchieved(goalData = {}) {
        return await this.showWorkoutNotification('goal-achieved', goalData);
    }

    async notifyStreakMilestone(streakData = {}) {
        return await this.showWorkoutNotification('streak-milestone', streakData);
    }

    // Settings and preferences
    async updateNotificationSettings(settings = {}) {
        const defaultSettings = {
            enabled: true,
            workoutStart: true,
            workoutComplete: true,
            restTimer: true,
            goals: true,
            streaks: true,
            reminders: true,
            sound: true,
            vibration: true
        };

        this.settings = { ...defaultSettings, ...settings };
        localStorage.setItem('notification_settings', JSON.stringify(this.settings));
    }

    loadNotificationSettings() {
        const saved = localStorage.getItem('notification_settings');
        if (saved) {
            this.settings = JSON.parse(saved);
        } else {
            this.updateNotificationSettings();
        }
        return this.settings;
    }

    // Event handlers for notification clicks
    handleNotificationClick(event) {
        const notification = event.notification;
        const data = notification.data || {};

        // Close the notification
        notification.close();

        // Handle different actions
        switch (data.type) {
            case 'workout-completed':
                if (event.action === 'view-stats') {
                    // Open stats page
                    this.openApp('/progress');
                }
                break;
            
            case 'rest-timer-completed':
                if (event.action === 'start-set') {
                    this.openApp('/workouts');
                } else if (event.action === 'extend-rest') {
                    // Extend rest timer
                    this.emit('extend-rest', { duration: 30 });
                }
                break;
            
            case 'goal-achieved':
                if (event.action === 'set-new-goal') {
                    this.openApp('/progress?action=new-goal');
                }
                break;
            
            case 'workout-reminder':
                if (event.action === 'start-workout') {
                    this.openApp('/workouts');
                } else if (event.action === 'snooze') {
                    // Schedule another reminder
                    this.scheduleWorkoutReminder(15 * 60 * 1000); // 15 minutes
                }
                break;
            
            default:
                // Default action: open the app
                this.openApp();
        }
    }

    openApp(path = '/') {
        if ('clients' in self) {
            // In service worker context
            clients.openWindow(path);
        } else {
            // In main thread
            window.focus();
            if (path !== '/' && window.app && window.app.navigateTo) {
                window.app.navigateTo(path);
            }
        }
    }

    // Event system
    addEventListener(event, callback) {
        if (!this.subscribers.has(event)) {
            this.subscribers.set(event, []);
        }
        this.subscribers.get(event).push(callback);
    }

    emit(event, data) {
        if (this.subscribers.has(event)) {
            this.subscribers.get(event).forEach(callback => {
                try {
                    callback(data);
                } catch (error) {
                    console.error(`Error in notification event listener for ${event}:`, error);
                }
            });
        }
    }

    // Cleanup
    destroy() {
        this.subscribers.clear();
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = NotificationManager;
}