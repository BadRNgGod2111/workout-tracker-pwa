/**
 * Progress Charts Module
 * Creates visual charts using Canvas API for workout statistics
 */

class ProgressCharts {
    constructor() {
        this.colors = {
            primary: '#007AFF',
            secondary: '#34C759',
            accent: '#FF9500',
            danger: '#FF3B30',
            warning: '#FFCC02',
            gray: '#8E8E93',
            background: '#F2F2F7',
            surface: '#FFFFFF'
        };
        
        this.charts = new Map();
    }

    // Line Chart for Exercise Progression
    createProgressionChart(canvasId, data, options = {}) {
        const canvas = document.getElementById(canvasId);
        if (!canvas) return null;

        const ctx = canvas.getContext('2d');
        const chart = new LineChart(ctx, data, {
            responsive: true,
            maintainAspectRatio: false,
            colors: this.colors,
            ...options
        });

        this.charts.set(canvasId, chart);
        return chart;
    }

    // Bar Chart for Workout Summary
    createSummaryChart(canvasId, data, options = {}) {
        const canvas = document.getElementById(canvasId);
        if (!canvas) return null;

        const ctx = canvas.getContext('2d');
        const chart = new BarChart(ctx, data, {
            responsive: true,
            colors: this.colors,
            ...options
        });

        this.charts.set(canvasId, chart);
        return chart;
    }

    // Pie Chart for Muscle Group Distribution
    createDistributionChart(canvasId, data, options = {}) {
        const canvas = document.getElementById(canvasId);
        if (!canvas) return null;

        const ctx = canvas.getContext('2d');
        const chart = new PieChart(ctx, data, {
            responsive: true,
            colors: this.colors,
            ...options
        });

        this.charts.set(canvasId, chart);
        return chart;
    }

    // Heatmap for Workout Calendar
    createHeatmapChart(canvasId, data, options = {}) {
        const canvas = document.getElementById(canvasId);
        if (!canvas) return null;

        const ctx = canvas.getContext('2d');
        const chart = new HeatmapChart(ctx, data, {
            responsive: true,
            colors: this.colors,
            ...options
        });

        this.charts.set(canvasId, chart);
        return chart;
    }

    // Update existing chart
    updateChart(canvasId, newData) {
        const chart = this.charts.get(canvasId);
        if (chart) {
            chart.updateData(newData);
            chart.render();
        }
    }

    // Destroy chart
    destroyChart(canvasId) {
        const chart = this.charts.get(canvasId);
        if (chart) {
            chart.destroy();
            this.charts.delete(canvasId);
        }
    }
}

// Base Chart Class
class BaseChart {
    constructor(ctx, data, options = {}) {
        this.ctx = ctx;
        this.canvas = ctx.canvas;
        this.data = data;
        this.options = {
            padding: 40,
            colors: {
                primary: '#007AFF',
                secondary: '#34C759',
                text: '#000000',
                grid: '#E5E5EA'
            },
            animation: true,
            ...options
        };

        this.width = this.canvas.width;
        this.height = this.canvas.height;
        this.plotArea = {
            x: this.options.padding,
            y: this.options.padding,
            width: this.width - (this.options.padding * 2),
            height: this.height - (this.options.padding * 2)
        };

        this.setupCanvas();
        this.render();
    }

    setupCanvas() {
        // Set up high DPI canvas
        const dpr = window.devicePixelRatio || 1;
        const rect = this.canvas.getBoundingClientRect();
        
        this.canvas.width = rect.width * dpr;
        this.canvas.height = rect.height * dpr;
        this.canvas.style.width = rect.width + 'px';
        this.canvas.style.height = rect.height + 'px';
        
        this.ctx.scale(dpr, dpr);
        this.width = rect.width;
        this.height = rect.height;
        
        this.plotArea = {
            x: this.options.padding,
            y: this.options.padding,
            width: this.width - (this.options.padding * 2),
            height: this.height - (this.options.padding * 2)
        };
    }

    clear() {
        this.ctx.clearRect(0, 0, this.width, this.height);
    }

    drawGrid() {
        this.ctx.strokeStyle = this.options.colors.grid;
        this.ctx.lineWidth = 1;
        this.ctx.setLineDash([2, 2]);

        // Horizontal grid lines
        for (let i = 0; i <= 5; i++) {
            const y = this.plotArea.y + (this.plotArea.height / 5) * i;
            this.ctx.beginPath();
            this.ctx.moveTo(this.plotArea.x, y);
            this.ctx.lineTo(this.plotArea.x + this.plotArea.width, y);
            this.ctx.stroke();
        }

        this.ctx.setLineDash([]);
    }

    drawText(text, x, y, options = {}) {
        const opts = {
            font: '12px -apple-system, BlinkMacSystemFont, sans-serif',
            color: this.options.colors.text,
            align: 'left',
            baseline: 'top',
            ...options
        };

        this.ctx.font = opts.font;
        this.ctx.fillStyle = opts.color;
        this.ctx.textAlign = opts.align;
        this.ctx.textBaseline = opts.baseline;
        this.ctx.fillText(text, x, y);
    }

    updateData(newData) {
        this.data = newData;
    }

    destroy() {
        this.clear();
    }
}

// Line Chart Implementation
class LineChart extends BaseChart {
    render() {
        this.clear();
        
        if (!this.data || !this.data.datasets || this.data.datasets.length === 0) {
            this.drawText('No data available', this.width / 2, this.height / 2, {
                align: 'center',
                baseline: 'middle'
            });
            return;
        }

        this.drawGrid();
        this.drawAxes();
        this.drawData();
        this.drawLegend();
    }

    drawAxes() {
        const { labels } = this.data;
        if (!labels) return;

        // X-axis labels
        labels.forEach((label, index) => {
            const x = this.plotArea.x + (this.plotArea.width / (labels.length - 1)) * index;
            this.drawText(label, x, this.plotArea.y + this.plotArea.height + 10, {
                align: 'center'
            });
        });

        // Y-axis labels
        const maxValue = Math.max(...this.data.datasets.flatMap(d => d.data));
        for (let i = 0; i <= 5; i++) {
            const value = Math.round((maxValue / 5) * i);
            const y = this.plotArea.y + this.plotArea.height - (this.plotArea.height / 5) * i;
            this.drawText(value.toString(), this.plotArea.x - 10, y, {
                align: 'right',
                baseline: 'middle'
            });
        }
    }

    drawData() {
        const { labels, datasets } = this.data;
        if (!labels || !datasets) return;

        const maxValue = Math.max(...datasets.flatMap(d => d.data));

        datasets.forEach((dataset, datasetIndex) => {
            const color = dataset.color || this.options.colors.primary;
            
            // Draw line
            this.ctx.strokeStyle = color;
            this.ctx.lineWidth = 2;
            this.ctx.beginPath();

            dataset.data.forEach((value, index) => {
                const x = this.plotArea.x + (this.plotArea.width / (labels.length - 1)) * index;
                const y = this.plotArea.y + this.plotArea.height - 
                    (this.plotArea.height * (value / maxValue));

                if (index === 0) {
                    this.ctx.moveTo(x, y);
                } else {
                    this.ctx.lineTo(x, y);
                }
            });

            this.ctx.stroke();

            // Draw points
            this.ctx.fillStyle = color;
            dataset.data.forEach((value, index) => {
                const x = this.plotArea.x + (this.plotArea.width / (labels.length - 1)) * index;
                const y = this.plotArea.y + this.plotArea.height - 
                    (this.plotArea.height * (value / maxValue));

                this.ctx.beginPath();
                this.ctx.arc(x, y, 4, 0, Math.PI * 2);
                this.ctx.fill();
            });
        });
    }

    drawLegend() {
        const { datasets } = this.data;
        if (!datasets || datasets.length <= 1) return;

        let legendX = this.plotArea.x;
        const legendY = 10;

        datasets.forEach((dataset, index) => {
            const color = dataset.color || this.options.colors.primary;
            
            // Legend color box
            this.ctx.fillStyle = color;
            this.ctx.fillRect(legendX, legendY, 12, 12);
            
            // Legend text
            this.drawText(dataset.label || `Dataset ${index + 1}`, 
                legendX + 20, legendY, { baseline: 'top' });
            
            legendX += 100;
        });
    }
}

// Bar Chart Implementation
class BarChart extends BaseChart {
    render() {
        this.clear();
        
        if (!this.data || !this.data.labels || this.data.labels.length === 0) {
            this.drawText('No data available', this.width / 2, this.height / 2, {
                align: 'center',
                baseline: 'middle'
            });
            return;
        }

        this.drawGrid();
        this.drawAxes();
        this.drawBars();
    }

    drawAxes() {
        const { labels, data } = this.data;
        
        // X-axis labels
        labels.forEach((label, index) => {
            const barWidth = this.plotArea.width / labels.length;
            const x = this.plotArea.x + barWidth * index + barWidth / 2;
            this.drawText(label, x, this.plotArea.y + this.plotArea.height + 10, {
                align: 'center'
            });
        });

        // Y-axis labels
        const maxValue = Math.max(...data);
        for (let i = 0; i <= 5; i++) {
            const value = Math.round((maxValue / 5) * i);
            const y = this.plotArea.y + this.plotArea.height - (this.plotArea.height / 5) * i;
            this.drawText(value.toString(), this.plotArea.x - 10, y, {
                align: 'right',
                baseline: 'middle'
            });
        }
    }

    drawBars() {
        const { labels, data } = this.data;
        const maxValue = Math.max(...data);
        const barWidth = this.plotArea.width / labels.length;
        const barPadding = barWidth * 0.2;

        data.forEach((value, index) => {
            const barHeight = (this.plotArea.height * (value / maxValue));
            const x = this.plotArea.x + barWidth * index + barPadding / 2;
            const y = this.plotArea.y + this.plotArea.height - barHeight;
            const width = barWidth - barPadding;

            // Draw bar
            const gradient = this.ctx.createLinearGradient(x, y, x, y + barHeight);
            gradient.addColorStop(0, this.options.colors.primary);
            gradient.addColorStop(1, this.options.colors.secondary);
            
            this.ctx.fillStyle = gradient;
            this.ctx.fillRect(x, y, width, barHeight);

            // Draw value on top of bar
            this.drawText(value.toString(), x + width / 2, y - 5, {
                align: 'center',
                baseline: 'bottom',
                font: '11px -apple-system, BlinkMacSystemFont, sans-serif'
            });
        });
    }
}

// Pie Chart Implementation
class PieChart extends BaseChart {
    render() {
        this.clear();
        
        if (!this.data || !this.data.data || this.data.data.length === 0) {
            this.drawText('No data available', this.width / 2, this.height / 2, {
                align: 'center',
                baseline: 'middle'
            });
            return;
        }

        this.drawPie();
        this.drawLegend();
    }

    drawPie() {
        const { data, labels } = this.data;
        const total = data.reduce((sum, value) => sum + value, 0);
        
        const centerX = this.width / 2;
        const centerY = this.height / 2;
        const radius = Math.min(this.plotArea.width, this.plotArea.height) / 3;

        let currentAngle = -Math.PI / 2; // Start from top

        data.forEach((value, index) => {
            const sliceAngle = (value / total) * Math.PI * 2;
            const color = this.getSliceColor(index);

            // Draw slice
            this.ctx.fillStyle = color;
            this.ctx.beginPath();
            this.ctx.moveTo(centerX, centerY);
            this.ctx.arc(centerX, centerY, radius, currentAngle, currentAngle + sliceAngle);
            this.ctx.closePath();
            this.ctx.fill();

            // Draw percentage label
            const labelAngle = currentAngle + sliceAngle / 2;
            const labelX = centerX + Math.cos(labelAngle) * (radius * 0.7);
            const labelY = centerY + Math.sin(labelAngle) * (radius * 0.7);
            const percentage = Math.round((value / total) * 100);
            
            if (percentage > 5) { // Only show label if slice is large enough
                this.drawText(`${percentage}%`, labelX, labelY, {
                    align: 'center',
                    baseline: 'middle',
                    color: '#FFFFFF',
                    font: 'bold 11px -apple-system, BlinkMacSystemFont, sans-serif'
                });
            }

            currentAngle += sliceAngle;
        });
    }

    drawLegend() {
        const { data, labels } = this.data;
        const legendX = this.width - 120;
        let legendY = 50;

        labels.forEach((label, index) => {
            const color = this.getSliceColor(index);
            
            // Legend color box
            this.ctx.fillStyle = color;
            this.ctx.fillRect(legendX, legendY, 12, 12);
            
            // Legend text
            this.drawText(label, legendX + 20, legendY, { baseline: 'top' });
            
            legendY += 20;
        });
    }

    getSliceColor(index) {
        const colors = [
            this.options.colors.primary,
            this.options.colors.secondary,
            this.options.colors.accent,
            this.options.colors.warning,
            this.options.colors.danger,
            this.options.colors.gray
        ];
        return colors[index % colors.length];
    }
}

// Heatmap Chart Implementation
class HeatmapChart extends BaseChart {
    render() {
        this.clear();
        
        if (!this.data || !this.data.data) {
            this.drawText('No data available', this.width / 2, this.height / 2, {
                align: 'center',
                baseline: 'middle'
            });
            return;
        }

        this.drawHeatmap();
        this.drawLabels();
    }

    drawHeatmap() {
        const { data, maxValue } = this.data;
        const cellWidth = this.plotArea.width / 53; // 53 weeks in a year
        const cellHeight = this.plotArea.height / 7; // 7 days

        data.forEach((week, weekIndex) => {
            week.forEach((day, dayIndex) => {
                const x = this.plotArea.x + weekIndex * cellWidth;
                const y = this.plotArea.y + dayIndex * cellHeight;
                
                const intensity = day.value / maxValue;
                const color = this.getHeatmapColor(intensity);
                
                this.ctx.fillStyle = color;
                this.ctx.fillRect(x, y, cellWidth - 1, cellHeight - 1);
            });
        });
    }

    drawLabels() {
        const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        const cellHeight = this.plotArea.height / 7;

        days.forEach((day, index) => {
            const y = this.plotArea.y + index * cellHeight + cellHeight / 2;
            this.drawText(day, this.plotArea.x - 30, y, {
                align: 'right',
                baseline: 'middle',
                font: '10px -apple-system, BlinkMacSystemFont, sans-serif'
            });
        });
    }

    getHeatmapColor(intensity) {
        if (intensity === 0) return '#EBEDF0';
        if (intensity < 0.25) return '#C6E48B';
        if (intensity < 0.5) return '#7BC96F';
        if (intensity < 0.75) return '#239A3B';
        return '#196127';
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ProgressCharts;
}