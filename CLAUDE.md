# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a Progressive Web App (PWA) for workout tracking, specifically designed for iPhone users. The app provides a comprehensive fitness tracking experience with an iOS-like interface and offline-first functionality.

### Core Features
- **Exercise Library**: Comprehensive database of exercises with instructions and muscle group targeting
- **Workout Tracking**: Real-time workout session recording with sets, reps, and weights
- **Workout Plans**: Pre-built and customizable workout routines

### Tech Stack
- **Frontend**: HTML5, CSS3, JavaScript (ES6+)
- **Storage**: IndexedDB for offline data persistence
- **PWA**: Service Worker for offline functionality and caching
- **Design**: iOS-like interface with smooth animations

### Design Principles
- **Mobile-First**: Optimized for iPhone viewport and touch interactions
- **iOS-Like Interface**: Following iOS design patterns and visual language
- **Smooth Animations**: 60fps animations using CSS transforms and transitions
- **Offline-First**: All core functionality available without internet connection

## File Structure

```
/
├── index.html              # Main app entry point
├── manifest.json           # PWA manifest file
├── sw.js                  # Service Worker for offline functionality
├── css/
│   ├── styles.css         # Main stylesheet
│   ├── ios-theme.css      # iOS-specific styling
│   └── animations.css     # Animation definitions
├── js/
│   ├── app.js            # Main application logic
│   ├── db.js             # IndexedDB wrapper and data management
│   ├── exercises.js      # Exercise library management
│   ├── workouts.js       # Workout tracking functionality
│   └── plans.js          # Workout plans management
├── data/
│   └── exercises.json    # Exercise database
├── assets/
│   ├── icons/           # PWA icons and exercise illustrations
│   └── images/          # App imagery
└── components/
    ├── exercise-card.js  # Reusable exercise component
    ├── workout-timer.js  # Workout timer component
    └── progress-chart.js # Progress visualization component
```

## Common Development Commands

Since this is a vanilla JavaScript PWA, development is straightforward:

```bash
# Serve locally (use any static server)
python -m http.server 8000
# or
npx serve .

# For development with live reload
npx live-server --port=8000
```

## Key Architecture Patterns

### Data Management
- **IndexedDB**: All workout data, exercise library, and user preferences stored locally
- **Data Sync**: Designed for offline-first with eventual sync capabilities
- **State Management**: Centralized state in `app.js` with event-driven updates

### Component Structure
- **Modular Components**: Each UI component is self-contained with its own CSS and JS
- **Event-Driven**: Components communicate through custom events
- **Responsive Design**: All components adapt to iPhone screen sizes and orientations

### PWA Implementation
- **Service Worker**: Caches static assets and API responses for offline use
- **App Shell**: Core UI loads instantly, content loads progressively
- **Install Prompts**: Native iOS Add to Home Screen integration

## iOS-Specific Considerations

### Viewport and Touch
- Uses `viewport-fit=cover` for iPhone X+ safe areas
- Touch-friendly tap targets (minimum 44px)
- Momentum scrolling with `-webkit-overflow-scrolling: touch`

### Animations
- Hardware-accelerated animations using `transform3d`
- iOS-style easing curves (`cubic-bezier`)
- Respects user's reduced motion preferences

### Storage Limits
- IndexedDB quota management for iOS Safari
- Fallback to localStorage for critical data
- Data cleanup strategies for storage optimization