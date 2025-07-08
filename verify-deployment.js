#!/usr/bin/env node

/**
 * Deployment Verification Script
 * Checks if all required files are present and properly configured
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 Verifying Workout Tracker Deployment...\n');

const requiredFiles = [
    'index.html',
    'manifest.json',
    'sw.js',
    'css/app.css',
    'css/ios-theme.css',
    'css/user-profile.css',
    'js/app.js',
    'js/database.js',
    'js/user-profile.js',
    'js/profile-ui.js',
    'js/exercises.js',
    'js/workouts.js',
    'js/plans.js'
];

const requiredDirectories = [
    'css',
    'js',
    'icons',
    'splash'
];

let allPassed = true;

// Check required files
console.log('📁 Checking required files:');
requiredFiles.forEach(file => {
    if (fs.existsSync(file)) {
        const size = fs.statSync(file).size;
        console.log(`✅ ${file} (${size} bytes)`);
    } else {
        console.log(`❌ ${file} - MISSING`);
        allPassed = false;
    }
});

console.log('\n📂 Checking required directories:');
requiredDirectories.forEach(dir => {
    if (fs.existsSync(dir)) {
        const files = fs.readdirSync(dir);
        console.log(`✅ ${dir}/ (${files.length} files)`);
    } else {
        console.log(`❌ ${dir}/ - MISSING`);
        allPassed = false;
    }
});

// Check manifest.json
console.log('\n📋 Checking manifest.json:');
if (fs.existsSync('manifest.json')) {
    try {
        const manifest = JSON.parse(fs.readFileSync('manifest.json', 'utf8'));
        console.log(`✅ Valid JSON`);
        console.log(`✅ Name: ${manifest.name}`);
        console.log(`✅ Start URL: ${manifest.start_url}`);
        console.log(`✅ Icons: ${manifest.icons ? manifest.icons.length : 0} defined`);
    } catch (error) {
        console.log(`❌ Invalid JSON: ${error.message}`);
        allPassed = false;
    }
}

// Check service worker
console.log('\n🔧 Checking service worker:');
if (fs.existsSync('sw.js')) {
    const swContent = fs.readFileSync('sw.js', 'utf8');
    if (swContent.includes('user-profile.css') && swContent.includes('profile-ui.js')) {
        console.log(`✅ Profile files included in cache`);
    } else {
        console.log(`⚠️  Profile files may not be cached`);
    }
    
    if (swContent.includes('workout-tracker-v2')) {
        console.log(`✅ Cache version updated`);
    } else {
        console.log(`⚠️  Cache version not updated`);
    }
}

// Check HTML integration
console.log('\n🌐 Checking HTML integration:');
if (fs.existsSync('index.html')) {
    const htmlContent = fs.readFileSync('index.html', 'utf8');
    
    const checks = [
        { pattern: 'user-profile.css', name: 'Profile CSS included' },
        { pattern: 'user-profile.js', name: 'UserProfile JS included' },
        { pattern: 'profile-ui.js', name: 'ProfileUI JS included' },
        { pattern: 'profile-header', name: 'Profile header structure' },
        { pattern: 'settings-btn', name: 'Settings button' }
    ];
    
    checks.forEach(check => {
        if (htmlContent.includes(check.pattern)) {
            console.log(`✅ ${check.name}`);
        } else {
            console.log(`❌ ${check.name} - MISSING`);
            allPassed = false;
        }
    });
}

// Check JavaScript integration
console.log('\n⚙️  Checking JavaScript integration:');
if (fs.existsSync('js/app.js')) {
    const appContent = fs.readFileSync('js/app.js', 'utf8');
    
    const jsChecks = [
        { pattern: 'UserProfile', name: 'UserProfile class reference' },
        { pattern: 'ProfileUI', name: 'ProfileUI class reference' },
        { pattern: 'this.userProfile = new UserProfile', name: 'UserProfile initialization' },
        { pattern: 'this.profileUI = new ProfileUI', name: 'ProfileUI initialization' }
    ];
    
    jsChecks.forEach(check => {
        if (appContent.includes(check.pattern)) {
            console.log(`✅ ${check.name}`);
        } else {
            console.log(`❌ ${check.name} - MISSING`);
            allPassed = false;
        }
    });
}

// Final result
console.log('\n' + '='.repeat(50));
if (allPassed) {
    console.log('🎉 All checks passed! Deployment should work correctly.');
    console.log('\n📋 Next steps:');
    console.log('1. Ensure GitHub Pages is enabled in repository settings');
    console.log('2. Wait 5-10 minutes for deployment to complete');
    console.log('3. Visit: https://badrngod2111.github.io/workout-tracker-2.0/');
    console.log('4. Test profile features by clicking Settings button');
} else {
    console.log('❌ Some issues found. Please fix the missing files/configurations.');
}
console.log('='.repeat(50));