# Contributing to Workout Tracker PWA

Thank you for your interest in contributing to the Workout Tracker PWA! This document provides guidelines and information for contributors.

## 🎯 Project Goals

The Workout Tracker PWA aims to provide:
- **iOS-native experience** on iPhone with PWA installation
- **Complete offline functionality** for all core features
- **Privacy-first approach** with local-only data storage
- **Professional fitness tracking** with comprehensive features
- **Cross-platform compatibility** while optimizing for iPhone

## 🚀 Getting Started

### Development Setup
1. **Fork the repository** on GitHub
2. **Clone your fork** locally:
   ```bash
   git clone https://github.com/YOUR_USERNAME/workout-tracker-pwa.git
   cd workout-tracker-pwa
   ```
3. **Serve locally** for development:
   ```bash
   # Option 1: Python
   python -m http.server 8000
   
   # Option 2: Node.js
   npx serve . -p 8000
   
   # Option 3: Live reload
   npx live-server --port=8000
   ```
4. **Open in browser**: `http://localhost:8000`

### Development Requirements
- **Primary testing**: iPhone Safari (PWA installation)
- **Secondary testing**: Chrome desktop, Android Chrome
- **HTTPS required**: For full PWA features (use localhost for development)
- **No build process**: Pure vanilla JavaScript, HTML, CSS

## 📁 Project Structure

```
workout-tracker-pwa/
├── index.html              # App entry point & shell
├── manifest.json           # PWA configuration
├── sw.js                  # Service Worker (offline functionality)
├── css/
│   ├── app.css           # Main styles & responsive design
│   └── ios-theme.css     # iOS-specific styling
├── js/
│   ├── app.js           # Main application controller
│   ├── database.js      # IndexedDB wrapper & data management
│   ├── exercises.js     # Exercise library & CRUD operations
│   ├── workouts.js      # Workout tracking & timers
│   ├── plans.js         # Workout plans management
│   ├── data-manager.js  # Export/import/backup functionality
│   ├── statistics.js    # Progress tracking & analytics
│   ├── charts.js        # Progress visualization
│   ├── progress.js      # Progress dashboard
│   ├── timers.js        # Workout & rest timers
│   ├── timer-ui.js      # Timer UI components
│   └── notifications.js # Push notifications & alerts
├── icons/               # PWA icons (SVG & PNG)
├── splash/              # iOS splash screens
└── docs/                # Documentation
```

## 🛠️ Development Guidelines

### Code Style
- **Vanilla JavaScript**: ES6+ features, no frameworks
- **Modular architecture**: Each JS file handles specific functionality
- **Class-based**: Use ES6 classes for major components
- **Async/await**: Preferred over promises where applicable
- **Error handling**: Comprehensive try/catch blocks
- **Comments**: JSDoc style for functions and classes

### CSS Guidelines
- **iOS Design System**: Follow iOS visual patterns
- **CSS Variables**: Use CSS custom properties for theming
- **Mobile-first**: Design for iPhone, enhance for other devices
- **Smooth animations**: 60fps using transforms and opacity
- **Safe areas**: Handle iPhone notches and home indicator

### JavaScript Patterns
```javascript
// Use this pattern for new components
class ComponentName {
    constructor(dependencies) {
        this.dependency = dependencies;
        this.init();
    }
    
    async init() {
        try {
            // Initialization logic
        } catch (error) {
            console.error('Component initialization failed:', error);
            throw error;
        }
    }
    
    // Use async/await for database operations
    async methodName() {
        try {
            const result = await Database.operation();
            return result;
        } catch (error) {
            console.error('Operation failed:', error);
            throw error;
        }
    }
}
```

### Database Patterns
```javascript
// Follow this pattern for database operations
static async create(data) {
    try {
        // Validate data
        const validation = this.validateData(data);
        if (!validation.isValid) {
            throw new Error(`Validation failed: ${validation.errors.join(', ')}`);
        }
        
        // Add to database
        const id = await Database.add(this.STORE_NAME, data);
        return await this.getById(id);
    } catch (error) {
        console.error('Create operation failed:', error);
        throw error;
    }
}
```

## 🧪 Testing Requirements

### Manual Testing Checklist
Before submitting changes, test on:
- ✅ **iPhone Safari** (PWA installation)
- ✅ **Chrome Desktop** (basic functionality)
- ✅ **Offline mode** (disconnect internet)
- ✅ **PWA installation** (home screen icon)
- ✅ **Data persistence** (reload app, check data)

### Feature Testing
For new features, verify:
- ✅ **Works offline** (if applicable)
- ✅ **Data exports/imports** correctly
- ✅ **Responsive design** on different screen sizes
- ✅ **Touch-friendly** interface on mobile
- ✅ **No console errors** in browser DevTools

### PWA Testing
- ✅ **Service Worker** registers correctly
- ✅ **Manifest.json** is valid
- ✅ **Install prompt** appears appropriately
- ✅ **Offline functionality** works as expected
- ✅ **Updates** deploy correctly

Use browser DevTools:
- **Application tab**: Check Service Worker, Manifest
- **Lighthouse**: Run PWA audit (should score 90+)
- **Console**: No errors or warnings

## 🐛 Bug Reports

### Before Reporting
1. **Search existing issues** to avoid duplicates
2. **Test on iPhone Safari** (primary platform)
3. **Try in incognito/private mode** to rule out cache issues
4. **Check console** for JavaScript errors

### Include in Bug Reports
- **Device**: iPhone 12, Android Pixel, etc.
- **Browser**: Safari 16.1, Chrome 108, etc.
- **PWA status**: Installed vs. browser
- **Steps to reproduce**: Detailed, numbered steps
- **Expected vs. actual behavior**
- **Screenshots**: If applicable
- **Console errors**: From browser DevTools

## ✨ Feature Requests

### Good Feature Requests
- **Solve real problems** for fitness tracking
- **Maintain offline-first** approach
- **Consider iOS design patterns**
- **Include user flow** description
- **Specify platform requirements**

### Feature Categories
- **Core functionality**: Exercise tracking, workouts, plans
- **UI/UX improvements**: Better visual design, easier navigation
- **Data management**: Export, import, analytics
- **Performance**: Faster loading, smoother animations
- **Accessibility**: Screen reader support, keyboard navigation

## 🔀 Pull Request Process

### Before Submitting
1. **Create feature branch**: `git checkout -b feature/description`
2. **Test thoroughly** on multiple platforms
3. **Update documentation** if needed
4. **Check for console errors**
5. **Verify PWA functionality**

### PR Requirements
- **Descriptive title**: `[TYPE] Brief description`
- **Complete description**: What, why, how
- **Testing details**: Platforms and scenarios tested
- **Screenshots**: Before/after for UI changes
- **Link related issues**: `Fixes #123`

### PR Review Process
1. **Automated checks**: GitHub Actions will run
2. **Manual review**: Code quality and functionality
3. **PWA testing**: Installation and offline functionality
4. **Cross-platform verification**: iPhone, Android, desktop
5. **Documentation review**: README, guides updated

## 📝 Documentation

### When to Update Documentation
- **New features**: Add to README and guides
- **Installation changes**: Update setup instructions
- **API changes**: Update code documentation
- **Bug fixes**: Update troubleshooting guides

### Documentation Standards
- **Clear language**: Non-technical users should understand
- **Step-by-step**: Numbered instructions with screenshots
- **Platform-specific**: Separate iPhone/Android instructions
- **Keep current**: Update with each significant change

## 🎨 Design Guidelines

### iOS Design Principles
- **Clarity**: Interface elements are clear and easy to understand
- **Depth**: Visual layers and realistic motion provide vitality
- **Deference**: UI helps users understand and interact with content

### Visual Standards
- **Typography**: SF Pro Display/Text font family
- **Colors**: iOS system colors (blues, grays)
- **Spacing**: 8px grid system (8, 16, 24, 32px)
- **Animations**: Ease-out curves, 250-350ms duration
- **Touch targets**: Minimum 44x44px for buttons

### Component Patterns
- **iOS List Items**: For settings and navigation
- **iOS Cards**: For content grouping
- **iOS Buttons**: Primary, secondary, destructive styles
- **iOS Inputs**: Native form styling
- **iOS Modals**: Full-screen overlays with proper close buttons

## 🔒 Security Guidelines

### Data Privacy
- **Local-only storage**: No external data transmission
- **User consent**: For exports and sharing
- **Secure defaults**: Private by default
- **Data validation**: Sanitize all inputs

### Code Security
- **Input validation**: All user inputs
- **XSS prevention**: Proper HTML escaping
- **SQL injection**: Use parameterized queries (IndexedDB)
- **HTTPS enforcement**: Required for PWA features

## 📦 Release Process

### Version Numbering
- **Major**: Breaking changes or significant new features
- **Minor**: New features, backward compatible
- **Patch**: Bug fixes, small improvements

### Release Checklist
1. **Update version** in manifest.json
2. **Update service worker** cache version
3. **Test deployment** on staging
4. **Update documentation**
5. **Create GitHub release** with changelog
6. **Verify PWA installation** after deployment

## 🆘 Getting Help

### Resources
- **README.md**: Installation and usage instructions
- **TESTING_CHECKLIST.md**: Comprehensive testing guide
- **DEPLOYMENT_GUIDE.md**: Production deployment help
- **GitHub Issues**: Ask questions and report bugs

### Community Guidelines
- **Be respectful**: Professional and friendly communication
- **Be specific**: Provide detailed information
- **Be patient**: Maintainers respond as time allows
- **Be helpful**: Help other users when you can

## 🏆 Recognition

Contributors will be recognized in:
- **README.md**: Contributors section
- **GitHub releases**: Release notes acknowledgments
- **Special recognition**: For significant contributions

## 📄 License

By contributing, you agree that your contributions will be licensed under the same license as the project (MIT License).

---

**Thank you for contributing to making the Workout Tracker PWA better for everyone!** 🎉

For questions about contributing, please open an issue with the `question` label.