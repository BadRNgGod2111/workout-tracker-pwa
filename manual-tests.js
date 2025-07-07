/**
 * Manual Tests for Workout Tracker PWA
 * Instructions: Copy and paste these tests into browser console
 */

// Test 1: Basic Database CRUD for Exercises
async function testExerciseCRUD() {
    console.log('🧪 Testing Exercise CRUD Operations...');
    
    try {
        // Initialize database
        await Database.init();
        console.log('✅ Database initialized');
        
        // Create test exercise
        const testExercise = {
            name: 'Test Push-Up',
            category: 'chest',
            muscleGroups: ['pectoralis-major'],
            equipment: 'bodyweight',
            difficulty: 'beginner',
            instructions: 'Test instructions',
            isCustom: true
        };
        
        // Test CREATE
        const created = await ExerciseManager.addExercise(testExercise);
        console.log('✅ Exercise created:', created);
        
        // Test READ
        const retrieved = await ExerciseManager.getExerciseById(created.id);
        console.log('✅ Exercise retrieved:', retrieved);
        
        // Test UPDATE
        const updatedData = { ...testExercise, name: 'Updated Test Push-Up' };
        const updated = await ExerciseManager.updateExercise(created.id, updatedData);
        console.log('✅ Exercise updated:', updated);
        
        // Test DELETE
        await ExerciseManager.deleteExercise(created.id);
        console.log('✅ Exercise deleted');
        
        return true;
    } catch (error) {
        console.error('❌ Exercise CRUD test failed:', error);
        return false;
    }
}

// Test 2: Workout Operations
async function testWorkoutOperations() {
    console.log('🏋️ Testing Workout Operations...');
    
    try {
        // Start new workout
        const workout = await WorkoutManager.startNewWorkout('Test Workout');
        console.log('✅ Workout started:', workout);
        
        // Add exercise to workout (using a built-in exercise ID)
        await WorkoutManager.addExerciseToWorkout('builtin-pushup', 3, 10, 0);
        console.log('✅ Exercise added to workout');
        
        // Log a set
        const setData = { reps: 10, weight: 0, restTime: 60, notes: 'Test set' };
        await WorkoutManager.logSet(0, setData);
        console.log('✅ Set logged');
        
        // Complete workout
        await WorkoutManager.completeWorkout('Test workout completed');
        console.log('✅ Workout completed');
        
        return true;
    } catch (error) {
        console.error('❌ Workout operations test failed:', error);
        return false;
    }
}

// Test 3: UI Components
function testUIComponents() {
    console.log('🎨 Testing UI Components...');
    
    const results = {};
    
    // Check critical elements exist
    const criticalElements = [
        'exercises-tab',
        'workouts-tab',
        'plans-tab',
        'profile-tab',
        'exercise-list',
        'recent-workouts-list',
        'plans-list'
    ];
    
    criticalElements.forEach(id => {
        const element = document.getElementById(id);
        results[id] = !!element;
        if (!element) {
            console.warn(`⚠️ Missing element: ${id}`);
        }
    });
    
    console.log('🎨 UI Components test results:', results);
    return results;
}

// Test 4: Data Management Features
async function testDataManagement() {
    console.log('💾 Testing Data Management...');
    
    try {
        // Test if DataManager is available
        if (typeof window.app === 'undefined' || !window.app.dataManager) {
            throw new Error('DataManager not initialized');
        }
        
        const dataManager = window.app.dataManager;
        
        // Test storage usage calculation
        const storageStats = dataManager.calculateStorageUsage();
        console.log('✅ Storage stats calculated:', storageStats);
        
        // Test export functionality
        const exportResult = await dataManager.exportAllData('json', { compact: true });
        console.log('✅ Data export successful, size:', exportResult.size);
        
        return true;
    } catch (error) {
        console.error('❌ Data management test failed:', error);
        return false;
    }
}

// Test 5: PWA Features
function testPWAFeatures() {
    console.log('📱 Testing PWA Features...');
    
    const features = {
        serviceWorker: 'serviceWorker' in navigator,
        manifest: !!document.querySelector('link[rel="manifest"]'),
        https: location.protocol === 'https:',
        notifications: 'Notification' in window,
        storage: 'storage' in navigator,
        share: 'share' in navigator,
        webApp: window.matchMedia('(display-mode: standalone)').matches
    };
    
    console.log('📱 PWA Features:', features);
    return features;
}

// Test 6: Performance Benchmarks
async function testPerformance() {
    console.log('⚡ Testing Performance...');
    
    const results = {};
    
    // Test tab switching speed
    const tabButtons = document.querySelectorAll('.tab-button');
    if (tabButtons.length > 0) {
        const startTime = performance.now();
        tabButtons[1]?.click(); // Switch to second tab
        const endTime = performance.now();
        results.tabSwitchTime = endTime - startTime;
    }
    
    // Test data loading speed
    try {
        const loadStart = performance.now();
        await ExerciseManager.getAllExercises();
        const loadEnd = performance.now();
        results.dataLoadTime = loadEnd - loadStart;
    } catch (error) {
        results.dataLoadTime = 'Error';
    }
    
    console.log('⚡ Performance results:', results);
    return results;
}

// Test 7: Responsive Design
function testResponsiveDesign() {
    console.log('📱 Testing Responsive Design...');
    
    const breakpoints = [320, 375, 768, 1024, 1440];
    const results = {};
    
    const originalWidth = window.innerWidth;
    
    breakpoints.forEach(width => {
        // Simulate different viewport widths
        Object.defineProperty(window, 'innerWidth', {
            value: width,
            configurable: true
        });
        
        // Trigger resize event
        window.dispatchEvent(new Event('resize'));
        
        // Check if navigation is still accessible
        const tabBar = document.querySelector('.tab-bar');
        const isVisible = tabBar && getComputedStyle(tabBar).display !== 'none';
        
        results[`${width}px`] = {
            navigationVisible: isVisible,
            width: width
        };
    });
    
    // Restore original width
    Object.defineProperty(window, 'innerWidth', {
        value: originalWidth,
        configurable: true
    });
    window.dispatchEvent(new Event('resize'));
    
    console.log('📱 Responsive design results:', results);
    return results;
}

// Run all tests
async function runAllTests() {
    console.log('🚀 Starting Complete Test Suite...');
    
    const testResults = {
        exerciseCRUD: await testExerciseCRUD(),
        workoutOperations: await testWorkoutOperations(),
        uiComponents: testUIComponents(),
        dataManagement: await testDataManagement(),
        pwaFeatures: testPWAFeatures(),
        performance: await testPerformance(),
        responsiveDesign: testResponsiveDesign()
    };
    
    console.log('📊 Complete Test Results:', testResults);
    
    // Calculate pass rate
    const totalTests = Object.keys(testResults).length;
    const passedTests = Object.values(testResults).filter(result => {
        if (typeof result === 'boolean') return result;
        if (typeof result === 'object') {
            return Object.values(result).some(val => val === true);
        }
        return false;
    }).length;
    
    console.log(`📈 Test Summary: ${passedTests}/${totalTests} test suites passed (${Math.round(passedTests/totalTests*100)}%)`);
    
    return testResults;
}

// Quick test for immediate feedback
async function quickTest() {
    console.log('⚡ Running Quick Test...');
    
    try {
        // Test if app is initialized
        if (typeof window.app === 'undefined') {
            throw new Error('App not initialized');
        }
        
        // Test if database is accessible
        await Database.init();
        
        // Test if exercises can be loaded
        const exercises = await ExerciseManager.getAllExercises();
        
        console.log('✅ Quick test passed!');
        console.log(`📊 Found ${exercises.length} exercises in database`);
        
        return true;
    } catch (error) {
        console.error('❌ Quick test failed:', error);
        return false;
    }
}

// Export test functions
window.workoutTrackerManualTests = {
    runAllTests,
    quickTest,
    testExerciseCRUD,
    testWorkoutOperations,
    testUIComponents,
    testDataManagement,
    testPWAFeatures,
    testPerformance,
    testResponsiveDesign
};

console.log('🧪 Manual test suite loaded!');
console.log('Run: window.workoutTrackerManualTests.quickTest() for a quick check');
console.log('Run: window.workoutTrackerManualTests.runAllTests() for full test suite');