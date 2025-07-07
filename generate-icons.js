/**
 * Icon Generation Script
 * This script demonstrates how to generate PNG icons from SVG sources
 * Run with: node generate-icons.js
 */

const fs = require('fs');
const path = require('path');

// Icon sizes needed for PWA
const ICON_SIZES = [
  // Standard sizes
  16, 32, 48, 72, 96, 128, 144, 152, 180, 192, 256, 384, 512,
  
  // iOS specific sizes
  57, 60, 76, 114, 120,
  
  // Microsoft Tile sizes
  70, 150, 310
];

// Shortcut icon sizes
const SHORTCUT_SIZES = [96];

// Splash screen sizes for iOS
const SPLASH_SIZES = [
  // iPhone sizes
  { width: 640, height: 1136, name: 'iPhone 5/SE' },
  { width: 750, height: 1334, name: 'iPhone 6/7/8' },
  { width: 1125, height: 2436, name: 'iPhone X/XS' },
  { width: 1242, height: 2208, name: 'iPhone 6/7/8 Plus' },
  { width: 828, height: 1792, name: 'iPhone XR' },
  { width: 1242, height: 2688, name: 'iPhone XS Max' },
  { width: 1170, height: 2532, name: 'iPhone 12/13 Pro' },
  { width: 1284, height: 2778, name: 'iPhone 12/13 Pro Max' },
  { width: 1179, height: 2556, name: 'iPhone 14 Pro' },
  { width: 1290, height: 2796, name: 'iPhone 14 Pro Max' },
  
  // iPad sizes
  { width: 1536, height: 2048, name: 'iPad 9.7"' },
  { width: 1668, height: 2224, name: 'iPad 10.5"' },
  { width: 1620, height: 2160, name: 'iPad Air 10.9"' },
  { width: 1668, height: 2388, name: 'iPad Pro 11"' },
  { width: 2048, height: 2732, name: 'iPad Pro 12.9"' },
  
  // Landscape versions (swap width/height)
];

// Create directories if they don't exist
const ensureDir = (dir) => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
};

// Generate placeholder PNG data (base64 encoded)
const generatePlaceholderPNG = (size, color = '#007AFF', icon = 'dumbbell') => {
  // This is a simplified placeholder - in a real implementation,
  // you would use a library like sharp, canvas, or puppeteer to convert SVG to PNG
  
  const svgTemplate = `
    <svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
      <rect width="${size}" height="${size}" fill="${color}" rx="${size * 0.1}"/>
      <g transform="translate(${size/2},${size/2})" fill="white">
        ${getIconPath(icon, size)}
      </g>
    </svg>
  `;
  
  return svgTemplate;
};

// Get icon path based on type and size
const getIconPath = (iconType, size) => {
  const scale = size / 512; // Base scale for 512px
  
  switch (iconType) {
    case 'dumbbell':
      return `
        <!-- Dumbbell -->
        <rect x="${-60 * scale}" y="${-20 * scale}" width="${20 * scale}" height="${40 * scale}" rx="${4 * scale}"/>
        <rect x="${-35 * scale}" y="${-4 * scale}" width="${70 * scale}" height="${8 * scale}" rx="${4 * scale}"/>
        <rect x="${40 * scale}" y="${-20 * scale}" width="${20 * scale}" height="${40 * scale}" rx="${4 * scale}"/>
      `;
    case 'play':
      return `<polygon points="${-8 * scale},${-12 * scale} ${-8 * scale},${12 * scale} ${12 * scale},0"/>`;
    case 'chart':
      return `
        <rect x="${-10 * scale}" y="${4 * scale}" width="${3 * scale}" height="${6 * scale}"/>
        <rect x="${-5 * scale}" y="${2 * scale}" width="${3 * scale}" height="${8 * scale}"/>
        <rect x="${0 * scale}" y="${-2 * scale}" width="${3 * scale}" height="${12 * scale}"/>
        <rect x="${5 * scale}" y="${-4 * scale}" width="${3 * scale}" height="${14 * scale}"/>
      `;
    case 'calendar':
      return `
        <rect x="${-9 * scale}" y="${-6 * scale}" width="${18 * scale}" height="${15 * scale}" rx="${2 * scale}"/>
        <rect x="${-9 * scale}" y="${-9 * scale}" width="${18 * scale}" height="${4 * scale}" rx="${2 * scale}"/>
        <circle cx="${-5 * scale}" cy="${-8 * scale}" r="${1 * scale}"/>
        <circle cx="${5 * scale}" cy="${-8 * scale}" r="${1 * scale}"/>
      `;
    default:
      return `<circle cx="0" cy="0" r="${size * 0.3}" fill="white"/>`;
  }
};

// Generate all icon files
const generateIcons = () => {
  console.log('🎨 Generating PWA icons...');
  
  ensureDir('./icons');
  ensureDir('./splash');
  ensureDir('./screenshots');
  
  // Generate main app icons
  ICON_SIZES.forEach(size => {
    const svgContent = generatePlaceholderPNG(size, '#007AFF', 'dumbbell');
    fs.writeFileSync(`./icons/icon-${size}.svg`, svgContent);
    console.log(`✅ Generated icon-${size}.svg`);
  });
  
  // Generate maskable icons
  [192, 512].forEach(size => {
    const svgContent = generatePlaceholderPNG(size, '#007AFF', 'dumbbell');
    // For maskable icons, we need to ensure the icon fits in the safe zone (80% of the size)
    const maskableSvg = svgContent.replace(
      /transform="translate\((\d+),(\d+)\)"/,
      `transform="translate(${size/2},${size/2}) scale(0.7)"`
    );
    fs.writeFileSync(`./icons/icon-${size}-maskable.svg`, maskableSvg);
    console.log(`✅ Generated icon-${size}-maskable.svg`);
  });
  
  // Generate shortcut icons
  const shortcuts = [
    { name: 'workout', color: '#34C759', icon: 'play' },
    { name: 'exercises', color: '#FF9500', icon: 'dumbbell' },
    { name: 'plans', color: '#AF52DE', icon: 'calendar' },
    { name: 'progress', color: '#5AC8FA', icon: 'chart' }
  ];
  
  shortcuts.forEach(shortcut => {
    SHORTCUT_SIZES.forEach(size => {
      const svgContent = generatePlaceholderPNG(size, shortcut.color, shortcut.icon);
      fs.writeFileSync(`./icons/shortcut-${shortcut.name}.svg`, svgContent);
      console.log(`✅ Generated shortcut-${shortcut.name}.svg`);
    });
  });
  
  // Generate favicon
  const faviconSvg = generatePlaceholderPNG(32, '#007AFF', 'dumbbell');
  fs.writeFileSync('./favicon.svg', faviconSvg);
  
  // Generate Microsoft tile icons
  const tileSizes = [70, 150, 310];
  tileSizes.forEach(size => {
    const svgContent = generatePlaceholderPNG(size, '#007AFF', 'dumbbell');
    fs.writeFileSync(`./icons/icon-${size}.svg`, svgContent);
    console.log(`✅ Generated tile icon-${size}.svg`);
  });
  
  // Generate wide tile (310x150)
  const wideTileSvg = `
    <svg width="310" height="150" viewBox="0 0 310 150" xmlns="http://www.w3.org/2000/svg">
      <rect width="310" height="150" fill="#007AFF" rx="15"/>
      <g transform="translate(75,75)" fill="white">
        ${getIconPath('dumbbell', 150)}
      </g>
      <text x="170" y="80" fill="white" font-family="Arial" font-size="24" font-weight="bold">Workout</text>
      <text x="170" y="105" fill="white" font-family="Arial" font-size="24" font-weight="bold">Tracker</text>
    </svg>
  `;
  fs.writeFileSync('./icons/icon-310x150.svg', wideTileSvg);
  console.log('✅ Generated wide tile icon-310x150.svg');
  
  console.log('\n📱 To convert SVG to PNG, you can use:');
  console.log('1. Online tools like CloudConvert, SVGPNG.com');
  console.log('2. Command line tools like ImageMagick or Inkscape');
  console.log('3. Node.js libraries like sharp or puppeteer');
  console.log('\nExample with ImageMagick:');
  console.log('convert icon.svg -resize 192x192 icon-192.png');
  
  console.log('\n🎯 Don\'t forget to:');
  console.log('1. Generate actual PNG files from the SVG templates');
  console.log('2. Create splash screen images for iOS');
  console.log('3. Take screenshots for the PWA manifest');
  console.log('4. Test icons on different devices and platforms');
};

// Generate splash screen templates
const generateSplashTemplates = () => {
  console.log('\n🌅 Generating splash screen templates...');
  
  SPLASH_SIZES.forEach(splash => {
    const svgContent = `
      <svg width="${splash.width}" height="${splash.height}" viewBox="0 0 ${splash.width} ${splash.height}" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" style="stop-color:#007AFF;stop-opacity:1" />
            <stop offset="100%" style="stop-color:#0051D0;stop-opacity:1" />
          </linearGradient>
        </defs>
        
        <!-- Background -->
        <rect width="${splash.width}" height="${splash.height}" fill="url(#gradient)"/>
        
        <!-- App Icon -->
        <g transform="translate(${splash.width/2},${splash.height/2 - 50})">
          <circle cx="0" cy="0" r="60" fill="rgba(255,255,255,0.1)"/>
          ${getIconPath('dumbbell', 120)}
        </g>
        
        <!-- App Name -->
        <text x="${splash.width/2}" y="${splash.height/2 + 80}" fill="white" font-family="SF Pro Display, -apple-system, sans-serif" font-size="28" font-weight="600" text-anchor="middle">
          Workout Tracker
        </text>
        
        <!-- Loading Indicator -->
        <g transform="translate(${splash.width/2},${splash.height/2 + 140})">
          <circle cx="0" cy="0" r="20" fill="none" stroke="rgba(255,255,255,0.3)" stroke-width="2"/>
          <circle cx="0" cy="0" r="20" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" 
                  stroke-dasharray="31.416" stroke-dashoffset="15.708">
            <animateTransform attributeName="transform" type="rotate" dur="1s" repeatCount="indefinite" values="0;360"/>
          </circle>
        </g>
      </svg>
    `;
    
    fs.writeFileSync(`./splash/splash-${splash.width}x${splash.height}.svg`, svgContent);
    console.log(`✅ Generated splash-${splash.width}x${splash.height}.svg (${splash.name})`);
    
    // Generate landscape version
    const landscapeSvg = svgContent
      .replace(`width="${splash.width}" height="${splash.height}"`, `width="${splash.height}" height="${splash.width}"`)
      .replace(`viewBox="0 0 ${splash.width} ${splash.height}"`, `viewBox="0 0 ${splash.height} ${splash.width}"`)
      .replace(`width="${splash.width}" height="${splash.height}"`, `width="${splash.height}" height="${splash.width}"`)
      .replace(`translate(${splash.width/2},${splash.height/2 - 50})`, `translate(${splash.height/2},${splash.width/2 - 50})`)
      .replace(`x="${splash.width/2}" y="${splash.height/2 + 80}"`, `x="${splash.height/2}" y="${splash.width/2 + 80}"`)
      .replace(`translate(${splash.width/2},${splash.height/2 + 140})`, `translate(${splash.height/2},${splash.width/2 + 140})`);
    
    fs.writeFileSync(`./splash/splash-${splash.height}x${splash.width}.svg`, landscapeSvg);
    console.log(`✅ Generated splash-${splash.height}x${splash.width}.svg (${splash.name} Landscape)`);
  });
};

// Run the generation
if (require.main === module) {
  generateIcons();
  generateSplashTemplates();
  
  console.log('\n🎉 Icon generation complete!');
  console.log('📁 Check the /icons and /splash directories for the generated files.');
  console.log('\n💡 Next steps:');
  console.log('1. Convert SVG files to PNG using your preferred tool');
  console.log('2. Optimize PNG files for size (tinypng.com, etc.)');
  console.log('3. Test the PWA installation on various devices');
  console.log('4. Update the manifest.json if you change any icon paths');
}

module.exports = {
  generateIcons,
  generateSplashTemplates,
  ICON_SIZES,
  SPLASH_SIZES
};