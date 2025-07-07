/**
 * Test Script for Workout Tracker PWA
 * Run this in browser console to test functionality
 */

console.log('🧪 Starting Workout Tracker PWA Tests...');

// Test 1: Check if all required classes are loaded
function testClassesLoaded() {
    const requiredClasses = [
        'Database',
        'ExerciseManager', 
        'WorkoutManager',
        'PlanManager',
        'DataManager',
        'WorkoutTrackerApp'
    ];
    
    const results = {};
    requiredClasses.forEach(className => {
        results[className] = typeof window[className] !== 'undefined';
    });
    
    console.log('📋 Class Loading Test:', results);
    return results;
}

// Test 2: Check database initialization
async function testDatabaseInit() {
    try {
        console.log('💾 Testing Database Initialization...');
        await Database.init();
        console.log('✅ Database initialized successfully');
        return true;
    } catch (error) {
        console.error('❌ Database initialization failed:', error);
        return false;
    }
}

// Test 3: Test Exercise CRUD operations
async function testExerciseCRUD() {
    console.log('🏋️ Testing Exercise CRUD Operations...');
    
    try {
        // Test Create
        const testExercise = {
            name: 'Test Push-up',
            category: 'chest',
            description: 'A test exercise',
            difficulty: 'beginner',
            equipment: 'bodyweight',
            muscleGroups: ['pectoralis-major']
        };
        
        const addedExercise = await ExerciseManager.addExercise(testExercise);
        console.log('✅ Exercise created:', addedExercise);
        
        // Test Read
        const retrievedExercise = await ExerciseManager.getExerciseById(addedExercise.id);
        console.log('✅ Exercise retrieved:', retrievedExercise);
        
        // Test Update
        const updatedData = { ...testExercise, description: 'Updated description' };
        const updatedExercise = await ExerciseManager.updateExercise(addedExercise.id, updatedData);
        console.log('✅ Exercise updated:', updatedExercise);
        
        // Test Delete
        await ExerciseManager.deleteExercise(addedExercise.id);
        console.log('✅ Exercise deleted');
        
        return true;
    } catch (error) {
        console.error('❌ Exercise CRUD test failed:', error);
        return false;
    }
}

// Test 4: Test UI rendering
function testUIRendering() {
    console.log('🎨 Testing UI Rendering...');
    
    const criticalElements = [
        'exercises-tab',
        'workouts-tab', 
        'plans-tab',
        'profile-tab',
        'exercise-list',
        'recent-workouts-list',
        'plans-list'
    ];
    
    const results = {};
    criticalElements.forEach(elementId => {
        const element = document.getElementById(elementId);
        results[elementId] = {
            exists: !!element,
            visible: element ? !element.classList.contains('hidden') : false
        };
    });
    
    console.log('🎨 UI Element Test:', results);
    return results;
}

// Test 5: Test responsive design
function testResponsiveDesign() {
    console.log('📱 Testing Responsive Design...');
    
    const breakpoints = [
        { name: 'Mobile', width: 375 },
        { name: 'Tablet', width: 768 },
        { name: 'Desktop', width: 1024 },
        { name: 'Large Desktop', width: 1440 }
    ];
    
    const results = {};
    
    breakpoints.forEach(bp => {
        // Simulate viewport
        const viewport = document.querySelector('meta[name="viewport"]');
        document.body.style.width = bp.width + 'px';
        
        // Check if navigation is accessible
        const tabBar = document.querySelector('.tab-bar');
        const tabButtons = document.querySelectorAll('.tab-button');
        
        results[bp.name] = {
            width: bp.width,
            tabBarVisible: tabBar ? getComputedStyle(tabBar).display !== 'none' : false,
            allTabsVisible: Array.from(tabButtons).every(btn => 
                getComputedStyle(btn).display !== 'none'
            )
        };
    });
    
    // Reset body width
    document.body.style.width = '';
    
    console.log('📱 Responsive Test:', results);
    return results;
}

// Test 6: Test data persistence
async function testDataPersistence() {
    console.log('💾 Testing Data Persistence...');
    
    try {
        // Test localStorage
        const testKey = 'test_persistence';
        const testValue = { timestamp: Date.now(), test: true };
        
        localStorage.setItem(testKey, JSON.stringify(testValue));
        const retrieved = JSON.parse(localStorage.getItem(testKey));
        
        const localStorageWorks = JSON.stringify(retrieved) === JSON.stringify(testValue);
        localStorage.removeItem(testKey);
        
        // Test IndexedDB
        const testData = { name: 'Persistence Test', category: 'test' };
        const stored = await Database.add('exercises', testData);
        const retrieved2 = await Database.get('exercises', stored.id);
        await Database.delete('exercises', stored.id);
        
        const indexedDBWorks = retrieved2.name === testData.name;
        
        console.log('✅ Data persistence test completed');
        return { localStorage: localStorageWorks, indexedDB: indexedDBWorks };
    } catch (error) {
        console.error('❌ Data persistence test failed:', error);
        return { localStorage: false, indexedDB: false };
    }
}

// Test 7: Test PWA features
function testPWAFeatures() {
    console.log('📱 Testing PWA Features...');
    
    const results = {
        serviceWorker: 'serviceWorker' in navigator,
        manifest: !!document.querySelector('link[rel="manifest"]'),
        https: location.protocol === 'https:',
        installPrompt: 'onbeforeinstallprompt' in window,
        notifications: 'Notification' in window,
        offlineCapable: false // Will be tested separately
    };
    
    // Check if service worker is registered
    if (results.serviceWorker) {
        navigator.serviceWorker.getRegistration().then(registration => {
            results.swRegistered = !!registration;
            console.log('🔧 Service Worker Registration:', results.swRegistered);
        });
    }
    
    console.log('📱 PWA Features Test:', results);
    return results;
}

// Main test runner
async function runAllTests() {
    console.log('🚀 Running Comprehensive Tests...');
    
    const results = {
        classesLoaded: testClassesLoaded(),
        databaseInit: await testDatabaseInit(),
        exerciseCRUD: await testExerciseCRUD(),
        uiRendering: testUIRendering(),
        responsiveDesign: testResponsiveDesign(),
        dataPersistence: await testDataPersistence(),
        pwaFeatures: testPWAFeatures()
    };
    
    console.log('📊 Complete Test Results:', results);
    
    // Generate summary
    const totalTests = Object.keys(results).length;
    const passedTests = Object.values(results).filter(result => {
        if (typeof result === 'boolean') return result;
        if (typeof result === 'object') {
            return Object.values(result).every(val => val === true || (typeof val === 'object' && Object.values(val).some(v => v === true)));
        }
        return false;
    }).length;
    
    console.log(`📈 Test Summary: ${passedTests}/${totalTests} test suites passed`);
    
    return results;
}

// Performance testing
function testPerformance() {
    console.log('⚡ Testing Performance...');
    
    const startTime = performance.now();
    
    // Test tab switching performance
    const tabButtons = document.querySelectorAll('.tab-button');
    const switchTimes = [];
    
    if (tabButtons.length > 0) {
        tabButtons.forEach((button, index) => {
            const switchStart = performance.now();
            button.click();
            const switchEnd = performance.now();
            switchTimes.push(switchEnd - switchStart);
        });
    }
    
    const endTime = performance.now();
    
    const results = {
        totalTestTime: endTime - startTime,
        averageTabSwitchTime: switchTimes.length > 0 ? switchTimes.reduce((a, b) => a + b, 0) / switchTimes.length : 0,
        maxTabSwitchTime: switchTimes.length > 0 ? Math.max(...switchTimes) : 0
    };
    
    console.log('⚡ Performance Results:', results);
    return results;
}

// Export functions for manual testing
window.workoutTrackerTests = {
    runAllTests,
    testClassesLoaded,
    testDatabaseInit,
    testExerciseCRUD,
    testUIRendering,
    testResponsiveDesign,
    testDataPersistence,
    testPWAFeatures,
    testPerformance
};

console.log('🧪 Test script loaded! Run window.workoutTrackerTests.runAllTests() to start.');