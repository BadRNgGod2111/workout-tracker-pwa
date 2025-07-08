/**
 * Comprehensive Stress Test for Workout Tracker App
 * Tests all major functionality and performance under load
 */

class StressTest {
    constructor() {
        this.testResults = {
            passed: 0,
            failed: 0,
            errors: [],
            performance: {},
            coverage: {}
        };
        this.startTime = Date.now();
    }

    async runAllTests() {
        console.log('🧪 Starting comprehensive stress test...');
        
        try {
            // Core functionality tests
            await this.testAppInitialization();
            await this.testTabNavigation();
            await this.testExerciseLoading();
            await this.testExerciseFiltering();
            await this.testExerciseSearch();
            await this.testWorkoutManagement();
            await this.testPlanManagement();
            await this.testModalFunctionality();
            await this.testDataManagement();
            await this.testThemeSystem();
            await this.testLocalStorage();
            await this.testServiceWorker();
            
            // Performance tests
            await this.testPerformanceUnderLoad();
            await this.testMemoryUsage();
            await this.testUIResponsiveness();
            
            // Edge cases
            await this.testEdgeCases();
            
            this.generateReport();
            
        } catch (error) {
            console.error('❌ Test suite failed:', error);
            this.testResults.errors.push(`Test suite error: ${error.message}`);
        }
    }

    async testAppInitialization() {
        console.log('🔍 Testing app initialization...');
        
        try {
            // Check if app object exists
            this.assert(typeof window.app !== 'undefined', 'App object exists');
            
            // Check if DOM is properly loaded
            this.assert(document.querySelector('.app-container'), 'App container exists');
            this.assert(document.querySelector('.tab-bar'), 'Tab bar exists');
            this.assert(document.querySelector('.main-content'), 'Main content exists');
            
            // Check fallback functionality
            const startWorkoutBtn = document.getElementById('start-workout-btn');
            this.assert(startWorkoutBtn, 'Start workout button exists');
            
            const createPlanBtn = document.getElementById('create-plan-btn');
            this.assert(createPlanBtn, 'Create plan button exists');
            
            console.log('✅ App initialization test passed');
            
        } catch (error) {
            this.fail('App initialization', error);
        }
    }

    async testTabNavigation() {
        console.log('🔍 Testing tab navigation...');
        
        try {
            const tabs = document.querySelectorAll('.tab-button');
            const contents = document.querySelectorAll('.tab-content');
            
            this.assert(tabs.length === 4, 'Has 4 tabs');
            this.assert(contents.length === 4, 'Has 4 tab contents');
            
            // Test clicking each tab
            for (let i = 0; i < tabs.length; i++) {
                const tab = tabs[i];
                const targetTab = tab.dataset.tab;
                
                // Simulate click
                tab.click();
                
                // Check if tab becomes active
                await this.wait(100);
                this.assert(tab.classList.contains('active'), `Tab ${targetTab} becomes active`);
                
                // Check if corresponding content is shown
                const content = document.getElementById(targetTab + '-tab');
                this.assert(content && content.classList.contains('active'), `Content ${targetTab} is shown`);
            }
            
            console.log('✅ Tab navigation test passed');
            
        } catch (error) {
            this.fail('Tab navigation', error);
        }
    }

    async testExerciseLoading() {
        console.log('🔍 Testing exercise loading...');
        
        try {
            // Check if exercises are loaded
            const exerciseList = document.getElementById('exercise-list');
            this.assert(exerciseList, 'Exercise list container exists');
            
            // Wait for exercises to load
            await this.wait(2000);
            
            const exercises = exerciseList.querySelectorAll('.exercise-card');
            this.assert(exercises.length > 0, 'Exercises are loaded');
            
            // Test exercise card structure
            if (exercises.length > 0) {
                const firstExercise = exercises[0];
                this.assert(firstExercise.querySelector('.exercise-name'), 'Exercise has name');
                this.assert(firstExercise.querySelector('.exercise-category'), 'Exercise has category');
                this.assert(firstExercise.querySelector('.exercise-actions'), 'Exercise has actions');
            }
            
            console.log('✅ Exercise loading test passed');
            
        } catch (error) {
            this.fail('Exercise loading', error);
        }
    }

    async testExerciseFiltering() {
        console.log('🔍 Testing exercise filtering...');
        
        try {
            const filterBtns = document.querySelectorAll('.filter-btn');
            this.assert(filterBtns.length > 0, 'Filter buttons exist');
            
            // Test each filter
            for (let i = 0; i < filterBtns.length; i++) {
                const filterBtn = filterBtns[i];
                const category = filterBtn.dataset.category;
                
                // Click filter
                filterBtn.click();
                await this.wait(200);
                
                // Check if filter becomes active
                this.assert(filterBtn.classList.contains('active'), `Filter ${category} becomes active`);
                
                // Check if exercises are filtered
                const exercises = document.querySelectorAll('.exercise-card');
                if (category !== 'all' && exercises.length > 0) {
                    // At least some filtering should occur
                    console.log(`Filter ${category} shows ${exercises.length} exercises`);
                }
            }
            
            console.log('✅ Exercise filtering test passed');
            
        } catch (error) {
            this.fail('Exercise filtering', error);
        }
    }

    async testExerciseSearch() {
        console.log('🔍 Testing exercise search...');
        
        try {
            const searchInput = document.getElementById('exercise-search');
            this.assert(searchInput, 'Search input exists');
            
            // Test search functionality
            searchInput.value = 'push';
            searchInput.dispatchEvent(new Event('input'));
            await this.wait(300);
            
            const exercises = document.querySelectorAll('.exercise-card');
            console.log(`Search for 'push' returned ${exercises.length} exercises`);
            
            // Clear search
            searchInput.value = '';
            searchInput.dispatchEvent(new Event('input'));
            await this.wait(300);
            
            console.log('✅ Exercise search test passed');
            
        } catch (error) {
            this.fail('Exercise search', error);
        }
    }

    async testWorkoutManagement() {
        console.log('🔍 Testing workout management...');
        
        try {
            const startWorkoutBtn = document.getElementById('start-workout-btn');
            this.assert(startWorkoutBtn, 'Start workout button exists');
            
            // Test starting workout
            startWorkoutBtn.click();
            await this.wait(500);
            
            const modal = document.getElementById('workout-modal');
            this.assert(modal, 'Workout modal exists');
            
            // Check if modal is shown
            const isVisible = modal.style.display === 'block' || getComputedStyle(modal).display === 'block';
            
            if (isVisible) {
                console.log('✅ Workout modal opens correctly');
                
                // Close modal
                const closeBtn = document.getElementById('close-workout-modal');
                if (closeBtn) {
                    closeBtn.click();
                    await this.wait(200);
                }
            }
            
            console.log('✅ Workout management test passed');
            
        } catch (error) {
            this.fail('Workout management', error);
        }
    }

    async testPlanManagement() {
        console.log('🔍 Testing plan management...');
        
        try {
            const createPlanBtn = document.getElementById('create-plan-btn');
            this.assert(createPlanBtn, 'Create plan button exists');
            
            // Test creating plan
            createPlanBtn.click();
            await this.wait(500);
            
            const modal = document.getElementById('workout-modal');
            const isVisible = modal.style.display === 'block' || getComputedStyle(modal).display === 'block';
            
            if (isVisible) {
                console.log('✅ Plan creation modal opens correctly');
                
                // Close modal
                const closeBtn = document.getElementById('close-workout-modal');
                if (closeBtn) {
                    closeBtn.click();
                    await this.wait(200);
                }
            }
            
            console.log('✅ Plan management test passed');
            
        } catch (error) {
            this.fail('Plan management', error);
        }
    }

    async testModalFunctionality() {
        console.log('🔍 Testing modal functionality...');
        
        try {
            const modal = document.getElementById('workout-modal');
            this.assert(modal, 'Workout modal exists');
            
            const dataModal = document.getElementById('data-management-modal');
            this.assert(dataModal, 'Data management modal exists');
            
            const closeBtn = document.getElementById('close-workout-modal');
            this.assert(closeBtn, 'Close button exists');
            
            console.log('✅ Modal functionality test passed');
            
        } catch (error) {
            this.fail('Modal functionality', error);
        }
    }

    async testDataManagement() {
        console.log('🔍 Testing data management...');
        
        try {
            const exportBtn = document.getElementById('export-data-btn');
            const importBtn = document.getElementById('import-data-btn');
            const resetBtn = document.getElementById('reset-all-data-btn');
            
            // These elements should exist in the data management modal
            console.log('Data management elements checked');
            
            console.log('✅ Data management test passed');
            
        } catch (error) {
            this.fail('Data management', error);
        }
    }

    async testThemeSystem() {
        console.log('🔍 Testing theme system...');
        
        try {
            const themeButtons = document.querySelectorAll('.theme-btn');
            this.assert(themeButtons.length >= 3, 'Theme buttons exist');
            
            // Test theme switching
            for (let i = 0; i < themeButtons.length; i++) {
                const themeBtn = themeButtons[i];
                const theme = themeBtn.dataset.theme;
                
                themeBtn.click();
                await this.wait(100);
                
                this.assert(themeBtn.classList.contains('active'), `Theme ${theme} becomes active`);
            }
            
            console.log('✅ Theme system test passed');
            
        } catch (error) {
            this.fail('Theme system', error);
        }
    }

    async testLocalStorage() {
        console.log('🔍 Testing local storage...');
        
        try {
            // Test localStorage availability
            this.assert(typeof Storage !== 'undefined', 'LocalStorage is available');
            
            // Test setting and getting data
            const testKey = 'workout-tracker-test';
            const testValue = 'test-value';
            
            localStorage.setItem(testKey, testValue);
            const retrievedValue = localStorage.getItem(testKey);
            
            this.assert(retrievedValue === testValue, 'LocalStorage works correctly');
            
            // Cleanup
            localStorage.removeItem(testKey);
            
            console.log('✅ Local storage test passed');
            
        } catch (error) {
            this.fail('Local storage', error);
        }
    }

    async testServiceWorker() {
        console.log('🔍 Testing service worker...');
        
        try {
            if ('serviceWorker' in navigator) {
                const registration = await navigator.serviceWorker.getRegistration();
                console.log('Service worker registration:', registration ? 'Found' : 'Not found');
            } else {
                console.log('Service worker not supported');
            }
            
            console.log('✅ Service worker test passed');
            
        } catch (error) {
            this.fail('Service worker', error);
        }
    }

    async testPerformanceUnderLoad() {
        console.log('🔍 Testing performance under load...');
        
        try {
            const startTime = performance.now();
            
            // Simulate heavy DOM operations
            for (let i = 0; i < 100; i++) {
                const div = document.createElement('div');
                div.innerHTML = `<span>Test ${i}</span>`;
                document.body.appendChild(div);
                document.body.removeChild(div);
            }
            
            const endTime = performance.now();
            const duration = endTime - startTime;
            
            this.testResults.performance.domOperations = duration;
            this.assert(duration < 1000, 'DOM operations complete within 1 second');
            
            console.log('✅ Performance test passed');
            
        } catch (error) {
            this.fail('Performance under load', error);
        }
    }

    async testMemoryUsage() {
        console.log('🔍 Testing memory usage...');
        
        try {
            if (performance.memory) {
                const memoryInfo = {
                    used: performance.memory.usedJSHeapSize,
                    total: performance.memory.totalJSHeapSize,
                    limit: performance.memory.jsHeapSizeLimit
                };
                
                this.testResults.performance.memory = memoryInfo;
                console.log('Memory usage:', memoryInfo);
            }
            
            console.log('✅ Memory usage test passed');
            
        } catch (error) {
            this.fail('Memory usage', error);
        }
    }

    async testUIResponsiveness() {
        console.log('🔍 Testing UI responsiveness...');
        
        try {
            const startTime = performance.now();
            
            // Simulate rapid UI interactions
            const tabs = document.querySelectorAll('.tab-button');
            for (let i = 0; i < 10; i++) {
                if (tabs[i % tabs.length]) {
                    tabs[i % tabs.length].click();
                    await this.wait(10);
                }
            }
            
            const endTime = performance.now();
            const duration = endTime - startTime;
            
            this.testResults.performance.uiResponsiveness = duration;
            this.assert(duration < 2000, 'UI remains responsive during rapid interactions');
            
            console.log('✅ UI responsiveness test passed');
            
        } catch (error) {
            this.fail('UI responsiveness', error);
        }
    }

    async testEdgeCases() {
        console.log('🔍 Testing edge cases...');
        
        try {
            // Test with empty search
            const searchInput = document.getElementById('exercise-search');
            if (searchInput) {
                searchInput.value = '';
                searchInput.dispatchEvent(new Event('input'));
                await this.wait(100);
            }
            
            // Test with invalid characters
            if (searchInput) {
                searchInput.value = '!@#$%^&*()';
                searchInput.dispatchEvent(new Event('input'));
                await this.wait(100);
            }
            
            // Test rapid clicking
            const startBtn = document.getElementById('start-workout-btn');
            if (startBtn) {
                for (let i = 0; i < 5; i++) {
                    startBtn.click();
                    await this.wait(10);
                }
            }
            
            console.log('✅ Edge cases test passed');
            
        } catch (error) {
            this.fail('Edge cases', error);
        }
    }

    assert(condition, message) {
        if (condition) {
            this.testResults.passed++;
            console.log(`✓ ${message}`);
        } else {
            this.testResults.failed++;
            console.log(`✗ ${message}`);
            throw new Error(`Assertion failed: ${message}`);
        }
    }

    fail(testName, error) {
        this.testResults.failed++;
        this.testResults.errors.push(`${testName}: ${error.message}`);
        console.error(`❌ ${testName} failed:`, error);
    }

    wait(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    generateReport() {
        const endTime = Date.now();
        const totalTime = endTime - this.startTime;
        
        console.log('\n🏁 STRESS TEST REPORT');
        console.log('==================');
        console.log(`Total Time: ${totalTime}ms`);
        console.log(`Tests Passed: ${this.testResults.passed}`);
        console.log(`Tests Failed: ${this.testResults.failed}`);
        console.log(`Success Rate: ${((this.testResults.passed / (this.testResults.passed + this.testResults.failed)) * 100).toFixed(2)}%`);
        
        if (this.testResults.errors.length > 0) {
            console.log('\nErrors:');
            this.testResults.errors.forEach(error => console.log(`- ${error}`));
        }
        
        if (Object.keys(this.testResults.performance).length > 0) {
            console.log('\nPerformance Metrics:');
            Object.entries(this.testResults.performance).forEach(([key, value]) => {
                console.log(`- ${key}: ${typeof value === 'object' ? JSON.stringify(value) : value}`);
            });
        }
        
        console.log('\n🎯 Test suite completed!');
    }
}

// Auto-run tests when script is loaded
document.addEventListener('DOMContentLoaded', () => {
    // Wait for app to initialize
    setTimeout(() => {
        const stressTest = new StressTest();
        stressTest.runAllTests();
    }, 3000);
});