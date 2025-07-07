/**
 * Progress Dashboard Module
 * Manages the progress/statistics UI and integrates with charts
 */

class ProgressDashboard {
    constructor(app) {
        this.app = app;
        this.statistics = new Statistics(app.database);
        this.charts = new ProgressCharts();
        this.currentPeriod = 'week';
        this.currentView = 'overview';
        
        this.init();
    }

    async init() {
        await this.statistics.init();
        this.setupEventListeners();
        this.createProgressUI();
        await this.updateDashboard();
    }

    createProgressUI() {
        const progressTab = document.getElementById('profile-tab');
        progressTab.innerHTML = `
            <div class="progress-dashboard">
                <!-- Dashboard Header -->
                <div class="dashboard-header ios-card">
                    <h2>Progress Dashboard</h2>
                    <div class="period-selector ios-segment-control">
                        <button class="ios-segment-item active" data-period="week">Week</button>
                        <button class="ios-segment-item" data-period="month">Month</button>
                        <button class="ios-segment-item" data-period="quarter">Quarter</button>
                        <button class="ios-segment-item" data-period="year">Year</button>
                    </div>
                </div>

                <!-- Quick Stats -->
                <div class="quick-stats">
                    <div class="stat-card ios-card" id="workout-count">
                        <div class="stat-icon">💪</div>
                        <div class="stat-content">
                            <div class="stat-value">0</div>
                            <div class="stat-label">Workouts</div>
                        </div>
                    </div>
                    <div class="stat-card ios-card" id="current-streak">
                        <div class="stat-icon">🔥</div>
                        <div class="stat-content">
                            <div class="stat-value">0</div>
                            <div class="stat-label">Day Streak</div>
                        </div>
                    </div>
                    <div class="stat-card ios-card" id="total-volume">
                        <div class="stat-icon">⚡</div>
                        <div class="stat-content">
                            <div class="stat-value">0</div>
                            <div class="stat-label">Total Volume</div>
                        </div>
                    </div>
                    <div class="stat-card ios-card" id="avg-duration">
                        <div class="stat-icon">⏱️</div>
                        <div class="stat-content">
                            <div class="stat-value">0</div>
                            <div class="stat-label">Avg Duration</div>
                        </div>
                    </div>
                </div>

                <!-- Progress Charts Section -->
                <div class="charts-section">
                    <!-- Chart Navigation -->
                    <div class="chart-nav ios-card">
                        <div class="chart-tabs ios-segment-control">
                            <button class="ios-segment-item active" data-view="overview">Overview</button>
                            <button class="ios-segment-item" data-view="progression">Progression</button>
                            <button class="ios-segment-item" data-view="distribution">Distribution</button>
                            <button class="ios-segment-item" data-view="calendar">Calendar</button>
                        </div>
                    </div>

                    <!-- Chart Content -->
                    <div class="chart-content" id="chart-content">
                        <!-- Dynamic chart content -->
                    </div>
                </div>

                <!-- Goals Section -->
                <div class="goals-section ios-card">
                    <div class="section-header">
                        <h3>Goals</h3>
                        <button class="ios-button ios-button-small" id="add-goal-btn">Add Goal</button>
                    </div>
                    <div class="goals-list" id="goals-list">
                        <!-- Goals will be inserted here -->
                    </div>
                </div>

                <!-- Measurements Section -->
                <div class="measurements-section ios-card">
                    <div class="section-header">
                        <h3>Body Measurements</h3>
                        <button class="ios-button ios-button-small" id="add-measurement-btn">Add Measurement</button>
                    </div>
                    <div class="measurements-list" id="measurements-list">
                        <!-- Measurements will be inserted here -->
                    </div>
                </div>

                <!-- Achievements Section -->
                <div class="achievements-section ios-card">
                    <div class="section-header">
                        <h3>Achievements</h3>
                        <div class="achievement-count" id="achievement-count">0 unlocked</div>
                    </div>
                    <div class="achievements-grid" id="achievements-grid">
                        <!-- Achievements will be inserted here -->
                    </div>
                </div>
            </div>

            <!-- Modals -->
            <div class="modal" id="goal-modal">
                <div class="modal-content ios-card">
                    <div class="modal-header">
                        <h3>Add New Goal</h3>
                        <button class="close-btn" data-modal="goal-modal">&times;</button>
                    </div>
                    <div class="modal-body">
                        <form id="goal-form">
                            <div class="form-group">
                                <label>Goal Type</label>
                                <select class="ios-input" id="goal-type" required>
                                    <option value="">Select goal type</option>
                                    <option value="weekly_workouts">Weekly Workouts</option>
                                    <option value="weight_loss">Weight Loss</option>
                                    <option value="weight_gain">Weight Gain</option>
                                    <option value="strength_gain">Strength Gain</option>
                                    <option value="endurance">Endurance</option>
                                    <option value="body_fat">Body Fat %</option>
                                </select>
                            </div>
                            <div class="form-group">
                                <label>Target Value</label>
                                <input type="number" class="ios-input" id="goal-target" required>
                            </div>
                            <div class="form-group">
                                <label>Unit</label>
                                <input type="text" class="ios-input" id="goal-unit" placeholder="e.g., lbs, %, workouts">
                            </div>
                            <div class="form-group">
                                <label>Description</label>
                                <input type="text" class="ios-input" id="goal-description" required>
                            </div>
                            <div class="form-group">
                                <label>Target Date</label>
                                <input type="date" class="ios-input" id="goal-date">
                            </div>
                            <div class="form-actions">
                                <button type="button" class="ios-button ios-button-secondary" data-modal="goal-modal">Cancel</button>
                                <button type="submit" class="ios-button">Add Goal</button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>

            <div class="modal" id="measurement-modal">
                <div class="modal-content ios-card">
                    <div class="modal-header">
                        <h3>Add Measurement</h3>
                        <button class="close-btn" data-modal="measurement-modal">&times;</button>
                    </div>
                    <div class="modal-body">
                        <form id="measurement-form">
                            <div class="form-group">
                                <label>Measurement Type</label>
                                <select class="ios-input" id="measurement-type" required>
                                    <option value="">Select type</option>
                                    <option value="weight">Weight</option>
                                    <option value="body_fat">Body Fat %</option>
                                    <option value="muscle_mass">Muscle Mass</option>
                                    <option value="chest">Chest</option>
                                    <option value="waist">Waist</option>
                                    <option value="hips">Hips</option>
                                    <option value="arms">Arms</option>
                                    <option value="thighs">Thighs</option>
                                </select>
                            </div>
                            <div class="form-group">
                                <label>Value</label>
                                <input type="number" step="0.1" class="ios-input" id="measurement-value" required>
                            </div>
                            <div class="form-group">
                                <label>Unit</label>
                                <select class="ios-input" id="measurement-unit" required>
                                    <option value="lbs">Pounds (lbs)</option>
                                    <option value="kg">Kilograms (kg)</option>
                                    <option value="inches">Inches</option>
                                    <option value="cm">Centimeters</option>
                                    <option value="percent">Percentage (%)</option>
                                </select>
                            </div>
                            <div class="form-group">
                                <label>Notes</label>
                                <textarea class="ios-input" id="measurement-notes" placeholder="Optional notes"></textarea>
                            </div>
                            <div class="form-actions">
                                <button type="button" class="ios-button ios-button-secondary" data-modal="measurement-modal">Cancel</button>
                                <button type="submit" class="ios-button">Add Measurement</button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        `;
    }

    setupEventListeners() {
        // Period selector
        document.addEventListener('click', async (e) => {
            if (e.target.matches('[data-period]')) {
                document.querySelectorAll('[data-period]').forEach(btn => 
                    btn.classList.remove('active'));
                e.target.classList.add('active');
                this.currentPeriod = e.target.dataset.period;
                await this.updateDashboard();
            }

            // Chart view selector
            if (e.target.matches('[data-view]')) {
                document.querySelectorAll('[data-view]').forEach(btn => 
                    btn.classList.remove('active'));
                e.target.classList.add('active');
                this.currentView = e.target.dataset.view;
                await this.updateChartView();
            }

            // Modal handlers
            if (e.target.id === 'add-goal-btn') {
                this.showModal('goal-modal');
            }
            
            if (e.target.id === 'add-measurement-btn') {
                this.showModal('measurement-modal');
            }

            if (e.target.matches('[data-modal]')) {
                this.hideModal(e.target.dataset.modal);
            }

            if (e.target.matches('.close-btn')) {
                this.hideModal(e.target.dataset.modal);
            }
        });

        // Form submissions
        document.addEventListener('submit', async (e) => {
            if (e.target.id === 'goal-form') {
                e.preventDefault();
                await this.handleGoalSubmission();
            }

            if (e.target.id === 'measurement-form') {
                e.preventDefault();
                await this.handleMeasurementSubmission();
            }
        });
    }

    async updateDashboard() {
        await this.updateQuickStats();
        await this.updateChartView();
        await this.updateGoals();
        await this.updateMeasurements();
        await this.updateAchievements();
    }

    async updateQuickStats() {
        const summary = await this.statistics.getWorkoutSummary(this.currentPeriod);
        const streaks = await this.statistics.calculateStreaks();

        // Update stat cards
        document.querySelector('#workout-count .stat-value').textContent = summary.totalWorkouts;
        document.querySelector('#current-streak .stat-value').textContent = streaks.current;
        
        const volumeKg = Math.round(summary.totalWeight * 0.453592); // Convert to kg
        document.querySelector('#total-volume .stat-value').textContent = 
            volumeKg > 1000 ? `${(volumeKg/1000).toFixed(1)}k` : volumeKg;
        
        const avgMinutes = Math.round(summary.averageDuration / 60);
        document.querySelector('#avg-duration .stat-value').textContent = `${avgMinutes}m`;
    }

    async updateChartView() {
        const chartContent = document.getElementById('chart-content');
        
        switch (this.currentView) {
            case 'overview':
                await this.renderOverviewCharts(chartContent);
                break;
            case 'progression':
                await this.renderProgressionCharts(chartContent);
                break;
            case 'distribution':
                await this.renderDistributionCharts(chartContent);
                break;
            case 'calendar':
                await this.renderCalendarChart(chartContent);
                break;
        }
    }

    async renderOverviewCharts(container) {
        const summary = await this.statistics.getWorkoutSummary(this.currentPeriod);
        
        container.innerHTML = `
            <div class="chart-row">
                <div class="chart-container ios-card">
                    <h4>Workout Frequency</h4>
                    <canvas id="frequency-chart" width="300" height="200"></canvas>
                </div>
                <div class="chart-container ios-card">
                    <h4>Muscle Groups</h4>
                    <canvas id="muscle-chart" width="300" height="200"></canvas>
                </div>
            </div>
        `;

        // Frequency chart
        const dailyData = Object.values(summary.dailyDistribution);
        const dailyLabels = Object.keys(summary.dailyDistribution).map(day => day.substr(0, 3));
        
        this.charts.createSummaryChart('frequency-chart', {
            labels: dailyLabels,
            data: dailyData
        });

        // Muscle groups pie chart
        const muscleLabels = Object.keys(summary.muscleGroups);
        const muscleData = Object.values(summary.muscleGroups);
        
        if (muscleLabels.length > 0) {
            this.charts.createDistributionChart('muscle-chart', {
                labels: muscleLabels,
                data: muscleData
            });
        }
    }

    async renderProgressionCharts(container) {
        // Get top exercises for progression tracking
        const exercises = await this.app.database.getAllExercises();
        const topExercises = exercises.slice(0, 3); // Show top 3

        container.innerHTML = `
            <div class="progression-controls">
                <select class="ios-input" id="exercise-selector">
                    ${topExercises.map(ex => 
                        `<option value="${ex.id}">${ex.name}</option>`
                    ).join('')}
                </select>
            </div>
            <div class="chart-container ios-card">
                <h4>Exercise Progression</h4>
                <canvas id="progression-chart" width="400" height="250"></canvas>
            </div>
        `;

        if (topExercises.length > 0) {
            await this.renderExerciseProgression(topExercises[0].id);
            
            // Add exercise selector listener
            document.getElementById('exercise-selector').addEventListener('change', async (e) => {
                await this.renderExerciseProgression(e.target.value);
            });
        }
    }

    async renderExerciseProgression(exerciseId) {
        const progression = await this.statistics.getExerciseProgression(exerciseId, this.currentPeriod);
        
        if (progression.length === 0) return;

        const labels = progression.map(p => new Date(p.date).toLocaleDateString());
        const weightData = progression.map(p => p.maxWeight);
        const volumeData = progression.map(p => p.volume);

        this.charts.createProgressionChart('progression-chart', {
            labels,
            datasets: [
                {
                    label: 'Max Weight',
                    data: weightData,
                    color: '#007AFF'
                },
                {
                    label: 'Volume',
                    data: volumeData,
                    color: '#34C759'
                }
            ]
        });
    }

    async renderDistributionCharts(container) {
        const summary = await this.statistics.getWorkoutSummary(this.currentPeriod);
        
        container.innerHTML = `
            <div class="chart-row">
                <div class="chart-container ios-card">
                    <h4>Top Exercises</h4>
                    <canvas id="exercises-chart" width="300" height="200"></canvas>
                </div>
                <div class="chart-container ios-card">
                    <h4>Weekly Distribution</h4>
                    <canvas id="weekly-chart" width="300" height="200"></canvas>
                </div>
            </div>
        `;

        // Top exercises
        const exerciseEntries = Object.entries(summary.topExercises)
            .sort(([,a], [,b]) => b - a)
            .slice(0, 5);
        
        if (exerciseEntries.length > 0) {
            this.charts.createDistributionChart('exercises-chart', {
                labels: exerciseEntries.map(([name]) => name),
                data: exerciseEntries.map(([,count]) => count)
            });
        }

        // Weekly distribution
        const weeklyLabels = Object.keys(summary.dailyDistribution);
        const weeklyData = Object.values(summary.dailyDistribution);
        
        this.charts.createSummaryChart('weekly-chart', {
            labels: weeklyLabels.map(day => day.substr(0, 3)),
            data: weeklyData
        });
    }

    async renderCalendarChart(container) {
        // Calendar heatmap implementation would go here
        container.innerHTML = `
            <div class="chart-container ios-card">
                <h4>Workout Calendar</h4>
                <div class="calendar-placeholder">
                    <p>Calendar heatmap coming soon!</p>
                    <p>This will show your workout intensity over time.</p>
                </div>
            </div>
        `;
    }

    async updateGoals() {
        const goalsList = document.getElementById('goals-list');
        const goals = this.statistics.goals.filter(g => g.isActive);

        if (goals.length === 0) {
            goalsList.innerHTML = '<p class="empty-state">No active goals. Add one to get started!</p>';
            return;
        }

        goalsList.innerHTML = goals.map(goal => {
            const progress = Math.min(100, (goal.current / goal.target) * 100);
            const isCompleted = goal.achievedAt;
            
            return `
                <div class="goal-item ${isCompleted ? 'completed' : ''}">
                    <div class="goal-info">
                        <h4>${goal.description}</h4>
                        <p>${goal.current} / ${goal.target} ${goal.unit}</p>
                    </div>
                    <div class="goal-progress">
                        <div class="progress-bar">
                            <div class="progress-fill" style="width: ${progress}%"></div>
                        </div>
                        <span class="progress-text">${Math.round(progress)}%</span>
                    </div>
                    ${isCompleted ? '<div class="goal-badge">✅ Completed</div>' : ''}
                </div>
            `;
        }).join('');
    }

    async updateMeasurements() {
        const measurementsList = document.getElementById('measurements-list');
        const measurements = await this.statistics.getMeasurements(null, 'month');

        if (measurements.length === 0) {
            measurementsList.innerHTML = '<p class="empty-state">No measurements recorded.</p>';
            return;
        }

        // Group by type and show latest
        const latestMeasurements = {};
        measurements.forEach(m => {
            if (!latestMeasurements[m.type] || new Date(m.date) > new Date(latestMeasurements[m.type].date)) {
                latestMeasurements[m.type] = m;
            }
        });

        measurementsList.innerHTML = Object.values(latestMeasurements).map(measurement => `
            <div class="measurement-item">
                <div class="measurement-type">${measurement.type}</div>
                <div class="measurement-value">${measurement.value} ${measurement.unit}</div>
                <div class="measurement-date">${new Date(measurement.date).toLocaleDateString()}</div>
            </div>
        `).join('');
    }

    async updateAchievements() {
        const achievementsGrid = document.getElementById('achievements-grid');
        const achievementCount = document.getElementById('achievement-count');
        
        achievementCount.textContent = `${this.statistics.achievements.length} unlocked`;

        if (this.statistics.achievements.length === 0) {
            achievementsGrid.innerHTML = '<p class="empty-state">Complete workouts to unlock achievements!</p>';
            return;
        }

        achievementsGrid.innerHTML = this.statistics.achievements.map(achievement => `
            <div class="achievement-item">
                <div class="achievement-icon">${achievement.icon}</div>
                <div class="achievement-title">${achievement.title}</div>
                <div class="achievement-description">${achievement.description}</div>
                <div class="achievement-date">${new Date(achievement.unlockedAt).toLocaleDateString()}</div>
            </div>
        `).join('');
    }

    async handleGoalSubmission() {
        const form = document.getElementById('goal-form');
        const formData = new FormData(form);
        
        const goal = {
            type: formData.get('goal-type') || document.getElementById('goal-type').value,
            target: parseFloat(document.getElementById('goal-target').value),
            unit: document.getElementById('goal-unit').value,
            description: document.getElementById('goal-description').value,
            endDate: document.getElementById('goal-date').value || null
        };

        await this.statistics.setGoal(goal);
        this.hideModal('goal-modal');
        form.reset();
        await this.updateGoals();
    }

    async handleMeasurementSubmission() {
        const form = document.getElementById('measurement-form');
        
        const measurement = {
            type: document.getElementById('measurement-type').value,
            value: parseFloat(document.getElementById('measurement-value').value),
            unit: document.getElementById('measurement-unit').value,
            notes: document.getElementById('measurement-notes').value
        };

        await this.statistics.addMeasurement(measurement);
        this.hideModal('measurement-modal');
        form.reset();
        await this.updateMeasurements();
    }

    showModal(modalId) {
        const modal = document.getElementById(modalId);
        modal.classList.add('show');
    }

    hideModal(modalId) {
        const modal = document.getElementById(modalId);
        modal.classList.remove('show');
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ProgressDashboard;
}