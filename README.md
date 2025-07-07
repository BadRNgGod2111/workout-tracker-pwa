# Workout Tracker PWA

A Progressive Web App for tracking workouts, exercises, and fitness plans, designed specifically for iPhone users with an iOS-like interface and offline-first functionality.

## Features

### Core Functionality
- **Exercise Library**: Comprehensive database of exercises with instructions and muscle group targeting
- **Workout Tracking**: Real-time workout session recording with sets, reps, and weights
- **Workout Plans**: Pre-built and customizable workout routines
- **Progress Tracking**: Statistics and progress visualization
- **Offline Support**: Full functionality without internet connection

### iOS-Optimized Design
- **Native iOS Feel**: Follows iOS design patterns and visual language
- **Touch-Friendly**: Optimized for iPhone touch interactions
- **Safe Area Support**: Proper handling of iPhone notches and safe areas
- **Smooth Animations**: 60fps animations using CSS transforms

## Tech Stack

- **Frontend**: HTML5, CSS3, JavaScript (ES6+)
- **Storage**: IndexedDB for offline data persistence
- **PWA**: Service Worker for offline functionality and caching
- **Design**: iOS-themed CSS with smooth animations

## Project Structure

```
/
├── index.html              # Main app entry point
├── manifest.json           # PWA manifest file
├── sw.js                  # Service Worker for offline functionality
├── CLAUDE.md              # Claude Code guidance file
├── README.md              # This file
├── css/
│   ├── app.css           # Main stylesheet
│   └── ios-theme.css     # iOS-specific styling
├── js/
│   ├── app.js           # Main application logic
│   ├── database.js      # IndexedDB wrapper and data management
│   ├── exercises.js     # Exercise library management
│   ├── workouts.js      # Workout tracking functionality
│   └── plans.js         # Workout plans management
└── icons/               # PWA icons (to be added)
```

## 📱 Installation Guide

### Quick Start
🌐 **Web Access**: Visit the app URL in any modern browser  
📲 **PWA Installation**: Install as an app for the best experience

---

## 🍎 Installing on iPhone (Recommended)

### Step 1: Open in Safari
1. **Open Safari** on your iPhone (not Chrome or other browsers)
2. **Navigate** to the app URL: `https://your-app-url.com`
3. **Wait** for the app to fully load (you'll see the workout tracker interface)

### Step 2: Add to Home Screen
1. **Tap the Share button** (📤) at the bottom of Safari
2. **Scroll down** in the share menu
3. **Tap "Add to Home Screen"** 📱
4. **Customize the name** (default: "Workout Tracker") if desired
5. **Tap "Add"** in the top-right corner

### Step 3: Launch the App
1. **Find the app icon** on your home screen (it looks like a native app!)
2. **Tap to open** - the app will launch without Safari's address bar
3. **Enjoy** the full-screen, native-like experience

### ✨ What You Get on iPhone:
- **Native App Feel**: No browser interface, just your workout tracker
- **Home Screen Icon**: Tap to launch instantly
- **Offline Access**: Works without internet connection
- **Fast Performance**: Optimized for iOS with smooth animations
- **Push Notifications**: Workout reminders and rest timer alerts (if enabled)

---

## 🤖 Installing on Android

### Chrome Browser
1. **Open Chrome** and navigate to the app URL
2. **Look for the install prompt** that appears at the bottom
3. **Tap "Install"** or **tap the menu (⋮)** and select "Install app"
4. **Confirm installation** when prompted

### Samsung Internet
1. **Open Samsung Internet** and navigate to the app
2. **Tap the menu** and select "Add page to"
3. **Choose "Apps screen"** for a native app experience

---

## 💻 Installing on Desktop

### Chrome/Edge
1. **Look for the install icon** (⊕) in the address bar
2. **Click "Install Workout Tracker"**
3. **The app opens in its own window** like a native application

### Safari (macOS)
1. **Open Safari** and navigate to the app
2. **Safari will treat it as a web app** with bookmark capabilities
3. **Add to Dock** for quick access

---

## 🔧 Troubleshooting Installation Issues

### iPhone Safari Issues

#### ❌ "Add to Home Screen" Option Missing
**Causes:**
- Using Chrome/Firefox instead of Safari
- Private/Incognito browsing mode
- iOS version too old (requires iOS 11.3+)

**Solutions:**
- ✅ Use Safari browser specifically
- ✅ Exit private browsing mode
- ✅ Update iOS to the latest version
- ✅ Make sure JavaScript is enabled in Safari settings

#### ❌ App Won't Load or Shows White Screen
**Solutions:**
- ✅ Check internet connection
- ✅ Clear Safari cache: Settings → Safari → Clear History and Website Data
- ✅ Force refresh: Pull down on the page to refresh
- ✅ Restart Safari and try again

#### ❌ App Icon Appears Blank or Generic
**Solutions:**
- ✅ Wait for the page to fully load before adding to home screen
- ✅ Remove the app and re-add it after the page loads completely
- ✅ Check that the manifest.json file is accessible

### Android Chrome Issues

#### ❌ Install Prompt Doesn't Appear
**Solutions:**
- ✅ Make sure you're using HTTPS (not HTTP)
- ✅ Visit the app multiple times to trigger the prompt
- ✅ Manually install: Menu (⋮) → "Install app"
- ✅ Enable "Desktop site" if the option is missing

#### ❌ App Doesn't Work Offline
**Solutions:**
- ✅ Ensure the app loaded completely online first
- ✅ Check that Service Worker is registered: DevTools → Application → Service Workers
- ✅ Clear browser cache and reload

### General Issues

#### ❌ Poor Performance or Slow Loading
**Solutions:**
- ✅ Close other browser tabs to free up memory
- ✅ Restart your device if performance is consistently poor
- ✅ Check available storage space (app needs ~50MB)
- ✅ Update your browser to the latest version

#### ❌ Data Not Saving
**Solutions:**
- ✅ Allow storage permissions if prompted
- ✅ Check device storage space
- ✅ Don't use private/incognito mode for regular use
- ✅ Enable cookies and site data in browser settings

---

## 🔄 Updating the App

### Automatic Updates
The app checks for updates automatically when you:
- **Open the app** while connected to the internet
- **Navigate between tabs** with an internet connection

### Manual Update Check
1. **Ensure internet connection**
2. **Open the app**
3. **Look for update notification** (blue banner at top)
4. **Tap "Update Now"** if available
5. **App will reload** with the latest version

### Force Update (if needed)
If you're not getting updates:

**On iPhone:**
1. **Remove the app** from home screen (long press → "Remove App")
2. **Revisit the URL in Safari**
3. **Re-add to home screen**

**On Android:**
1. **Long press the app icon** → "App info"
2. **Tap "Storage"** → "Clear Storage"
3. **Reopen the app** to get the latest version

---

## 💾 Backup and Restore Data

### 📤 Creating a Backup

#### Method 1: Built-in Export (Recommended)
1. **Open the app**
2. **Go to Profile tab** (📊)
3. **Tap "Data Management"** 💾
4. **Choose export format:**
   - **JSON**: Complete backup with all data
   - **CSV**: Spreadsheet format for analysis
   - **TXT**: Human-readable summary
5. **Configure options:**
   - ✅ Include personal data (measurements, goals)
   - ✅ Include statistics
   - ⬜ Compact format (smaller file size)
6. **Tap "Export Data"**
7. **Save the file** to your device or cloud storage

#### Method 2: Share to Cloud
1. **Follow export steps above**
2. **When file downloads**, use the **Share button**
3. **Save to:**
   - iCloud Drive
   - Google Drive
   - Dropbox
   - Email to yourself

### 📥 Restoring from Backup

#### Step 1: Access Import Feature
1. **Open the app**
2. **Go to Profile tab** (📊)
3. **Tap "Data Management"** 💾
4. **Scroll to "Import Data" section**

#### Step 2: Select Backup File
1. **Tap "Select File"**
2. **Choose your backup file** (.json or .csv)
3. **Verify file shows** as selected

#### Step 3: Configure Import Options
- ✅ **Skip duplicates**: Avoid importing duplicate workouts
- ✅ **Validate data**: Check data integrity before import

#### Step 4: Import
1. **Tap "Import Data"**
2. **Wait for import to complete** (progress shown)
3. **Review import summary** (shows what was imported)

### 🔄 Data Migration Between Devices

#### Moving to a New Phone
1. **Create backup** on old device (export as JSON)
2. **Save backup** to cloud storage or email
3. **Install app** on new device
4. **Download backup file** on new device
5. **Import backup** following restore steps above

#### Sharing Data with Another User
1. **Export specific data** (you can choose what to include)
2. **Share the file** via email, messaging, or cloud storage
3. **Recipient imports** the file on their device

### 📊 What Gets Backed Up

**Complete JSON Backup includes:**
- ✅ All workout sessions with dates, exercises, sets, and reps
- ✅ Exercise library (including custom exercises)
- ✅ Workout plans (built-in and custom)
- ✅ Personal measurements and body weight tracking
- ✅ Goals and targets
- ✅ App settings and preferences
- ✅ Statistics and progress data
- ✅ Achievement records

**CSV Backup includes:**
- ✅ Workout data in spreadsheet format
- ✅ Exercise library
- ✅ Measurements data
- ⚠️ Limited metadata (good for analysis, not complete restore)

### 🔒 Data Security Notes
- **Local Storage**: All data stays on your device
- **No Cloud Sync**: Data isn't automatically synced to servers
- **Manual Backups**: You control when and where backups are created
- **Privacy**: Backups contain your personal fitness data - store securely

---

## ❓ FAQ

**Q: Do I need to install the app or can I just use the website?**  
A: You can use both! The website works great, but installing as a PWA gives you:
- Faster loading times
- Offline access
- Native app feel
- Home screen icon

**Q: Will the app work without internet?**  
A: Yes! After the initial load, the app works completely offline. All your data is stored locally on your device.

**Q: How much storage space does the app use?**  
A: The app uses approximately 2-5MB for the core files, plus your workout data (typically 1-10MB depending on usage).

**Q: Can I use the app on multiple devices?**  
A: Yes, but data doesn't sync automatically. Use the export/import feature to transfer data between devices.

**Q: Is my data secure?**  
A: Yes! All data is stored locally on your device. Nothing is sent to external servers unless you explicitly export and share it.

---

## 🚀 Live Demo & Installation

### 🌐 Try the App
Visit the live demo: **[Workout Tracker PWA](https://YOUR_USERNAME.github.io/workout-tracker-pwa/)**

### 📱 Quick Install
1. **iPhone**: Open link in Safari → Share (📤) → "Add to Home Screen"
2. **Android**: Open link in Chrome → Menu (⋮) → "Install app"
3. **Desktop**: Look for install icon (⊕) in address bar

---

## 🔗 Links & Resources

- **🌐 Live App**: [https://YOUR_USERNAME.github.io/workout-tracker-pwa/](https://YOUR_USERNAME.github.io/workout-tracker-pwa/)
- **💻 GitHub Repository**: [https://github.com/YOUR_USERNAME/workout-tracker-pwa](https://github.com/YOUR_USERNAME/workout-tracker-pwa)
- **📋 Issues & Bug Reports**: [GitHub Issues](https://github.com/YOUR_USERNAME/workout-tracker-pwa/issues)
- **🚀 Setup Your Own**: [GitHub Setup Guide](GITHUB_SETUP.md)

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

- **🐛 Report Bugs**: [Bug Report Template](https://github.com/YOUR_USERNAME/workout-tracker-pwa/issues/new?template=bug_report.md)
- **💡 Feature Requests**: [Feature Request Template](https://github.com/YOUR_USERNAME/workout-tracker-pwa/issues/new?template=feature_request.md)  
- **❓ Get Help**: [Installation Help Template](https://github.com/YOUR_USERNAME/workout-tracker-pwa/issues/new?template=installation_help.md)

## 📖 Documentation

- **📱 Installation Guide**: [Complete installation instructions above](#-installation-guide)
- **🔧 Troubleshooting**: [Testing Checklist](TESTING_CHECKLIST.md)
- **🚀 Deployment**: [Deployment Guide](DEPLOYMENT_GUIDE.md)
- **🧪 Testing**: [Testing Results](TESTING_RESULTS.md)

For technical issues or feature requests, please check our [troubleshooting guide](TESTING_CHECKLIST.md) or [deployment documentation](DEPLOYMENT_GUIDE.md).

## Development

### Key Files

- `index.html`: Main app shell with navigation and basic structure
- `js/app.js`: Main application controller and UI management
- `js/database.js`: IndexedDB operations and data management
- `js/exercises.js`: Exercise library functionality
- `js/workouts.js`: Workout tracking and timer functionality
- `js/plans.js`: Workout plan creation and management

### Database Schema

The app uses IndexedDB with the following object stores:

- **exercises**: Exercise library with categories, muscle groups, and instructions
- **workouts**: Workout sessions with timing and metadata
- **plans**: Pre-defined workout routines
- **sets**: Individual exercise sets with reps, weights, and notes
- **settings**: App configuration and user preferences

### CSS Architecture

- `css/app.css`: Main application styles and responsive design
- `css/ios-theme.css`: iOS-specific theming, animations, and components

### Service Worker

The service worker (`sw.js`) provides:
- Offline caching of static assets
- Background sync for workout data
- PWA installation prompts

## Features in Detail

### Workout Tracking
- Start/pause/finish workout sessions
- Add exercises to active workouts
- Track sets, reps, weights, and rest times
- Real-time workout timer
- Exercise performance history

### Exercise Library
- Pre-loaded exercise database
- Search and filter by category, muscle group, equipment
- Exercise instructions and tips
- Custom exercise creation
- Exercise statistics and personal bests

### Workout Plans
- Pre-built workout routines
- Custom plan creation
- Plan difficulty levels (beginner, intermediate, advanced)
- Estimated duration and calories
- Superset support

### Progress Tracking
- Workout statistics and trends
- Personal records tracking
- Workout frequency and streaks
- Volume and strength progression

## Browser Compatibility

- **Primary Target**: iOS Safari (iPhone)
- **Supported**: Modern browsers with ES6+ and IndexedDB support
- **PWA Features**: Best experience on iOS Safari and Chrome

## Offline Functionality

The app is designed to work completely offline:
- All data stored locally in IndexedDB
- Service worker caches static assets
- Background sync for future server integration
- No internet connection required for core features

## Contributing

When contributing to this project:

1. Follow the existing code style and structure
2. Test on iPhone Safari for optimal iOS experience
3. Ensure offline functionality is maintained
4. Update documentation for new features

## License

This project is open source and available under the MIT License.

## Future Enhancements

Planned features for future versions:
- Cloud sync and backup
- Social features and workout sharing
- Advanced analytics and insights
- Integration with fitness trackers
- Nutrition tracking
- Photo progress tracking
- Video exercise demonstrations