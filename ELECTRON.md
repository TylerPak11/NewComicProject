# Comic Collection Manager - Electron App

This document explains how to build and package the Comic Collection Manager as a desktop application using Electron.

## Development

### Prerequisites
- Node.js (v18 or higher)
- npm

### Setup
1. Install dependencies:
   ```bash
   npm install
   ```

2. Run in development mode (Electron + Next.js):
   ```bash
   npm run electron-dev
   ```
   This will start the Next.js development server and launch Electron.

3. Run only Electron (requires Next.js server running separately):
   ```bash
   npm run dev        # In one terminal
   npm run electron   # In another terminal
   ```

## Building and Packaging

### 1. Build for Distribution
Build the application for all platforms:
```bash
npm run dist
```

### 2. Build for Specific Platforms

#### macOS (DMG)
```bash
npm run dist -- --mac
```

#### Windows (NSIS Installer)
```bash
npm run dist -- --win
```

#### Linux (AppImage)
```bash
npm run dist -- --linux
```

### 3. Development Build (Unpacked)
Create an unpacked build for testing:
```bash
npm run pack
```

## Output Files

The built applications will be in the `dist/` directory:

- **macOS**: `Comic Collection Manager-1.0.0.dmg`
- **Windows**: `Comic Collection Manager Setup 1.0.0.exe`
- **Linux**: `Comic Collection Manager-1.0.0.AppImage`

## App Icons

Replace the placeholder icon files with your actual app icons:

- `build/icon.icns` - macOS icon (512x512 ICNS format)
- `build/icon.ico` - Windows icon (256x256 ICO format)
- `public/icon.png` - General purpose icon (512x512 PNG format)

You can use online tools or applications like:
- [IconGenerator](https://icon.kitchen/) - Online icon generator
- [Image2Icon](http://www.img2icnsapp.com/) - macOS app for creating ICNS files

## Database Handling

The app automatically handles the SQLite database:

- **Development**: Uses `comics.db` in the project root
- **Production**: Creates database in user's app data directory
  - macOS: `~/Library/Application Support/Comic Collection Manager/comics.db`
  - Windows: `%APPDATA%/Comic Collection Manager/comics.db`
  - Linux: `~/.config/Comic Collection Manager/comics.db`

## Features

The Electron app includes:

- ✅ Cross-platform support (macOS, Windows, Linux)
- ✅ Auto-updater ready (publish configuration in package.json)
- ✅ Native menu integration
- ✅ Deep link support (comic-collection:// protocol)
- ✅ Secure preload script
- ✅ Database persistence across app launches
- ✅ External link handling (opens in system browser)

## Troubleshooting

### Build Issues

1. **Native dependencies**: If you encounter issues with native dependencies like `better-sqlite3`:
   ```bash
   npm run postinstall
   ```

2. **Code signing** (macOS): For distribution, you'll need to sign the app:
   ```bash
   export CSC_IDENTITY_AUTO_DISCOVERY=false  # Skip signing for development
   npm run dist -- --mac
   ```

3. **Windows builds on macOS/Linux**: Install wine:
   ```bash
   # macOS
   brew install --cask wine-stable
   
   # Ubuntu/Debian
   sudo apt install wine
   ```

### Runtime Issues

1. **Database not found**: Check that `comics.db` exists or will be created in the user data directory.

2. **CORS errors**: The app uses `file://` protocol in production, so external API calls might be restricted.

## App Configuration

Edit `package.json` build configuration to customize:

- App name and description
- Bundle identifier
- Target platforms and architectures
- Installer options
- Auto-updater settings

## Security

The app follows Electron security best practices:

- Context isolation enabled
- Node integration disabled
- Preload script for secure API exposure
- External URL handling via system browser
- Web security enabled

## Next Steps

1. **Auto-updater**: Configure update server in package.json publish section
2. **Code signing**: Set up certificates for distribution
3. **Custom icons**: Replace placeholder icons with branded ones
4. **App store**: Configure for Mac App Store or Microsoft Store distribution