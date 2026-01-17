# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

The Spinning Wheel is a front-end only web application designed for **team/workplace random selection**. It displays a colorful spinning wheel with pie slices representing team member names. Users can spin the wheel to randomly select a person. Built with vanilla HTML, CSS, and JavaScript—no build tools or frameworks required.

**Primary Use Case:** Workplace/team environments for random selection of team members (e.g., picking someone for a task, selecting a presenter, etc.)

## Project Structure

```
IngestionWheel/
├── index.html              # Main HTML entry point (router/navigation)
├── src/
│   ├── css/
│   │   └── styles.css      # All stylesheets (includes light/dark themes)
│   ├── js/
│   │   ├── app.js          # Main application logic and page routing
│   │   ├── wheel.js        # Wheel rendering and spin logic
│   │   ├── storage.js      # localStorage management
│   │   ├── sounds.js       # Audio management
│   │   └── effects.js      # Winner celebration effects
│   └── audio/              # Sound effect files (optional, if included locally)
│       ├── spinning.mp3
│       ├── stop.mp3
│       └── fanfare.mp3
└── feature/
    └── SpinningHTMLWheelFeature.md
```

## Running the Project Locally

Since this is a simple front-end project with no build tools, serve the files locally:

**Using Python 3:**
```bash
python -m http.server 8000
```

**Using Python 2:**
```bash
python -m SimpleHTTPServer 8000
```

**Using Node.js (http-server package):**
```bash
npx http-server
```

Then open `http://localhost:8000` in your browser.

## Hosting on GitHub Pages

This project can be easily hosted for free using GitHub Pages.

### Setup Instructions

1. **Push code to GitHub repository**
   - Create a new repository on GitHub (e.g., `IngestionWheel`)
   - Push all code to the `main` or `master` branch
   - Ensure `index.html` is at the root of the repository

2. **Enable GitHub Pages**
   - Go to repository **Settings**
   - Scroll to **Pages** section (left sidebar)
   - Under "Source", select **Deploy from a branch**
   - Select branch: **main** (or **master**)
   - Select folder: **/ (root)**
   - Click **Save**

3. **Access Your Site**
   - GitHub will display your site URL: `https://USERNAME.github.io/IngestionWheel/`
   - Site builds automatically after each push
   - Changes appear live within 1-2 minutes

### Important Considerations for GitHub Pages

- **No server-side processing**: The app is entirely client-side (HTML, CSS, JS), so it works perfectly on GitHub Pages
- **localStorage persistence**: Works normally on GitHub Pages (persists data in user's browser)
- **Sound files**: If hosting sound files locally in `src/audio/`, ensure paths are relative (e.g., `src/audio/spinning.mp3`)
- **HTTPS enforced**: GitHub Pages uses HTTPS by default (safe for all features)
- **Custom domain (optional)**: Can point a custom domain to your GitHub Pages site via repository settings

### Deployment Workflow

1. Make code changes locally
2. Commit and push to GitHub:
   ```bash
   git add .
   git commit -m "Your commit message"
   git push origin main
   ```
3. GitHub automatically rebuilds the site (check **Actions** tab for build status)
4. Visit your live URL to see changes

### Troubleshooting GitHub Pages

- **Site not building?** Check the **Actions** tab for errors
- **Assets not loading?** Ensure paths are relative (not absolute) and use forward slashes
- **localStorage not working?** Works on GitHub Pages; check browser console for errors
- **Sounds not playing?** Verify sound file paths and that files are committed to git

## Core Architecture

### Application Structure
The app is a **multi-view single-page application** with navigation between different sections:
- **Wheel View**: Main spin interface
- **User Management View**: Add/edit/delete names and colors
- **History View**: List of previous spins
- **Settings View**: Configurable options and theme

### HTML Structure (index.html)
- Router/navigation system (top navigation bar with tabs)
- Container divs for each view (wheel, users, history, settings)
- Loads external CSS and JavaScript files

### Styling (src/css/styles.css)
- **Light and Dark Themes**: CSS variables for theme switching
- **Wheel Styling**: Container, pie slices with 3D effects (shadows, gradients, depth)
- **Spin Animation**: CSS `@keyframes` with momentum/deceleration easing
- **Visual Indicators**: Pointer at top and slice highlight styling
- **Responsive Design**: Works on mobile and desktop
- **Theme Variables**: Colors for both light and dark modes

### Logic Modules

**app.js - Main Application Controller**
- Router/navigation between views
- State management (current users, settings, history)
- View rendering logic
- Settings persistence

**wheel.js - Wheel Rendering & Spin**
- **Wheel Generation**: Dynamically creates pie slices from user list with CSS transforms
- **Spin Logic**: Calculates random rotation angle, applies animation with deceleration
- **User Selection**: Determines which user based on final rotation angle
- **Visual Feedback**: Updates pointer and slice highlight
- **Touch Support**: Handle swipe gestures on mobile

**storage.js - Data Persistence**
- Load/save user names and colors to localStorage
- Load/save spin history to localStorage
- Load/save settings to localStorage
- Export history to CSV/JSON
- Clear history or reset entire app

**sounds.js - Audio Management**
- Play spinning sound (looped during spin)
- Play stop/click sound (when wheel stops)
- Play fanfare/notification sound (winner announcement)
- Handle mute/unmute based on settings
- Graceful fallback if audio files unavailable

**effects.js - Winner Celebration Effects**
- Confetti burst animation
- Fireworks particle effects
- Balloons rising animation
- Sparkles, rainbow flashes, glow pulses
- Light show, ticker tape, screen flash effects
- Winner popup and celebration pack (multiple effects combined)
- Triggered based on winner effect setting from Storage

## Random Selection Algorithm

**Key Requirement:** Prevent the same user from being selected in consecutive spins.

**Algorithm:**
1. Generate a random index from 0 to (number of users - 1)
2. If selected user matches the previously selected user:
   - Generate a new random index
   - Repeat until a different user is selected
3. This ensures fair randomness while preventing back-to-back selections of the same person
4. First spin has no restriction (no previous selection to compare against)

## Keyboard Navigation & Shortcuts

### Navigation Between Views
- **Number Keys**: 1 (Wheel) | 2 (Users) | 3 (History) | 4 (Settings)
- **Arrow Keys**: Left/Right arrows cycle through tabs
- **Mnemonic Shortcuts**: Alt+H for History (and similar)
- **Tab Navigation**: Full keyboard navigation through form fields

### Spin Control
- **Enter or Space**: Trigger spin when Wheel view is active or spin button is focused

### View Persistence
- App remembers which view was last visited
- Reloading page returns to that view
- Stored in localStorage

## Key Concepts

### Wheel Rendering
The wheel is built by creating pie slices positioned in a circle. Each slice is a CSS-styled element with its angle calculated and positioned using CSS transforms. Colors are applied per-user based on user selection.

### Spin Animation
Uses CSS `@keyframes` animation for the rotation with deceleration/momentum effects. JavaScript controls the final rotation angle based on random selection. The spin button is disabled during spinning to prevent simultaneous spins.

### User Selection
When the wheel stops, JavaScript calculates which slice is at the top (or designated stop point) based on the final rotation angle and the number of users, then identifies the corresponding user. The selected user is displayed prominently.

## Implementation Details

### User Management View
- Form to add new users with name and color selection
- **Name Validation**:
  - Min 2 characters, max 15 characters
  - Prevent duplicate names (case-sensitive check)
  - Show validation error messages
- **Color Selection**:
  - Extended predefined color palette (10+ distinct colors)
  - HTML5 color picker for custom colors
  - Preview color before adding
- **CRUD Operations**:
  - Add user with name and color
  - Edit existing user (name and color)
  - Delete user with confirmation
- **Delete User Behavior**:
  - When user is deleted, keep history entries but show as "Deleted User"
  - Statistics still include deleted user (for historical accuracy)
  - Spinner is re-generated without the deleted user
- **Constraints**:
  - Minimum 2 users required (spin button disabled otherwise)
  - Maximum 20 users (block adding more, show warning)
- **Animations**:
  - New user slices fade in when added
  - (No fade-out animation on delete)

### Spin Mechanics
- **Spin Duration**:
  - Configurable range: 1 second (min) to 10 seconds (max)
  - Default: 7 seconds on first load
  - User can adjust duration in Settings
- **Deceleration Effect**: Momentum-based animation (gradual slowdown)
- **Button State**: Disabled while spinning to prevent simultaneous spins
- **Keyboard Support**:
  - Enter or Space key triggers spin
  - Tab navigation through form fields
  - Number keys for view navigation (1=Wheel, 2=Users, 3=History, 4=Settings)
  - Arrow keys to switch between tabs
  - Alt+H for History shortcut
- **Touch Support**: Swipe gesture on wheel to initiate spin
- **Animation Settings**:
  - Configurable animation speed multiplier for momentum effect
- **Rotation Direction**: Configurable clockwise or counter-clockwise spin
- **Random Selection Logic**:
  - Completely random but **prevents same user from being selected twice in a row**
  - If last selected user matches new random pick, re-roll until different user selected
- **Result Display**:
  - Keep result visible until next spin
  - Browser tab title updates with winner name (e.g., "John Doe | Spinning Wheel")
  - Result always visible; no auto-clear

### Wheel Display & Rendering
- **User Names on Slices**: Display names inside each slice (text overlay)
- **Long Name Handling**: Truncate with ellipsis (...) if name exceeds space
- **Responsive Scaling**: Wheel scales proportionally to fit screen size (maintains aspect ratio on mobile and desktop)

### Wheel Visual Customization
- **Title/Center Label**: Customizable text in wheel center (e.g., "Pick a presenter")
- **Slice Animations**: Different visual effects available (pulse, glow, or other effects)
- **Rotation Direction**: Toggle between clockwise and counter-clockwise
- **Slice Fade-in Animation**: New user slices fade in when added
- All customizations persist in localStorage

### Result Handling
When the wheel stops:
1. Display the selected user name prominently
2. **Visual Feedback**:
   - Fixed pointer/arrow at top of wheel
   - Highlight/glow on selected slice
   - Animated highlight effect
3. **Sound Feedback**:
   - Play stop/click sound
   - Play fanfare/notification sound (winner announcement)
4. Record selection in history with timestamp
5. Re-enable spin button and allow next spin
6. **Sharing Options**:
   - Copy result to clipboard button
   - Generate shareable link (encodes wheel state)

### Selection History View
- Separate page/view accessible via top navigation
- Display complete list of all spins in reverse chronological order (newest first)
- Show for each entry: timestamp, selected user name
- **History Limit**: Keep a rolling window of last 500 spins (oldest automatically removed when limit exceeded)
- Persistence: Stored in localStorage across sessions

### Statistics View (Part of History View)
Displays analysis of spin results:
- **Win Count Per User**: Total number of times each user was selected (leaderboard style)
- **Selection Percentage**: Show percentage of total spins for each user
- **Streak Tracking**:
  - Current streak for each user (consecutive wins)
  - Longest streak achieved for each user
- Updates in real-time as new spins are recorded
- Stored in localStorage for persistence

### Settings/Options View
- **Configurable Options**:
  - Spin duration slider (1-10 seconds, default 7 seconds)
  - Animation speed multiplier (for momentum effect intensity)
  - Sound toggle (on/off)
  - Light/Dark theme toggle
  - Rotation direction (clockwise/counter-clockwise)
  - Wheel title/center label customization
  - Slice animation effect selection
- **Sharing & Clipboard**:
  - Copy current result to clipboard
  - Generate shareable link (URL-encoded wheel state with users, colors, settings)
  - When sharing link is loaded: **prompt user before overwriting** existing data
- **Data Management**:
  - Clear History button (deletes spins, keeps users)
  - Reset App button (clears everything: users, colors, history)
  - Export History (download as CSV format)
  - Settings saved to localStorage for persistence
- **View Memory**:
  - Remember last viewed section (Wheel, Users, History, Settings)
  - Return to that view on page reload

### Wheel Visual Design
- **3D Effect**: Shadows, gradients, and depth
- **Bright and Vibrant Colors**: Colorful palette for visual appeal
- **Responsive Sizing**: Scales appropriately on mobile and desktop
- **Pointer Indicator**: Fixed arrow or pointer at top center
- **Slice Design**: Distinct visual separation between slices

### Navigation
- **Top Navigation Bar**: Tabs/menu for switching between views
  - Wheel
  - User Management
  - History
  - Settings
- Mobile-responsive: May collapse to hamburger menu on small screens

### Dark Mode
- **Manual Toggle**: Dark mode setting in Settings view
- **Theme Colors**:
  - Light theme with vibrant colors
  - Dark theme with darker background and adjusted colors
  - CSS variables used for easy theme switching
- All views support both light and dark themes

### Onboarding
- **Welcome Screen**: Shown on first visit (if no users exist)
  - Explains purpose of the app
  - Pre-populate with example users (Alice, Bob, Charlie) as starting point
  - Quick start instructions
  - Link to full Help/FAQ
  - Auto-dismiss and go to Wheel view once user adds first name
- **Tooltips**: Hover help text on key UI elements
- **Help/FAQ Section**: In Settings or separate help page
  - How to add users
  - How to spin
  - How to manage data
  - FAQ for common questions

### Data Persistence (localStorage)
- User names and assigned colors
- Complete spin history (timestamp + selected user)
- Current settings (spin duration, sound, theme, animation speed)
- Welcome screen flag (to show/hide on future visits)

### Offline Support
- **Full offline capability**: App works completely without internet connection
- All assets (HTML, CSS, JS, sounds) must be local (no CDN dependencies)
- Sound files included in `src/audio/` directory
- localStorage persists data offline
- No external API calls

### Browser Support
- Target latest versions of modern browsers (Chrome, Firefox, Safari, Edge)
- No legacy browser support required
- Uses modern JavaScript features (ES6+, Promise, localStorage)
- Assumes CSS Grid and CSS custom properties support
- Must work offline with no external dependencies

### Accessibility
- **Keyboard Navigation**: Full tab navigation through all form fields
- **Keyboard Shortcuts**: Enter/Space to spin
- Form labels and error messages for validation
- Sufficient color contrast in both light and dark modes
- **Note**: Full ARIA/screen reader support not a priority; focus is on keyboard and mouse usability

## Sound Files

The app uses three sound effects (optional to include locally, can use external CDN):
- **spinning.mp3**: Looped background sound while wheel is spinning
- **stop.mp3**: Click/stop sound when wheel comes to rest
- **fanfare.mp3**: Celebratory notification sound when winner is announced

If sound files are not available locally, the app should gracefully degrade (no errors, just no sound).

## Feature Requirements (from SpinningHTMLWheelFeature.md)

**Phase 1 Implementation:**
- **User Management:**
  - Full CRUD operations (add, edit, delete names)
  - 2-15 character name validation, no duplicates
  - Extended color palette (10+ colors) + custom color picker
  - Deleted users preserved in history as "Deleted User"
  - New user fade-in animation
- **Wheel Display:**
  - Names inside slices with ellipsis truncation for long names
  - Responsive scaling (maintains aspect ratio on all devices)
  - 3D visual styling with shadows and gradients
- **Spin Mechanics:**
  - Duration: 1-10 seconds (default: 7 seconds)
  - Deceleration/momentum animation
  - No consecutive same-user selection
  - Sound effects (spinning, stop, fanfare) with toggle
  - Swipe gesture support on mobile
  - Customizable rotation direction (clockwise/counter-clockwise)
  - Customizable wheel title/label
  - Slice animation effects (pulse, glow, etc.)
- **Result Display:**
  - Prominent winner announcement
  - Browser tab title updates with winner name
  - Copy to clipboard button
  - Shareable link (URL-encoded state with overwrite confirmation)
  - Result persists until next spin
- **History & Statistics:**
  - Separate History view in top navigation
  - Rolling 500-spin history limit
  - Win count per user
  - Selection percentage
  - Streak tracking (current and longest)
  - CSV export capability
  - Delete history option
  - Reset app option
- **Navigation:**
  - Top navigation bar (Wheel, Users, History, Settings)
  - Keyboard shortcuts (number keys, arrow keys, Alt+letter)
  - View memory (remember last visited section)
- **Settings:**
  - Spin duration slider
  - Animation speed multiplier
  - Sound toggle
  - Light/Dark theme toggle
  - Rotation direction
  - Wheel title customization
  - Slice animation selection
- **Onboarding:**
  - Welcome screen with example users (Alice, Bob, Charlie)
  - Auto-dismiss on first user addition
  - Tooltips on UI elements
  - Help/FAQ section
- **Accessibility:**
  - Full keyboard navigation
  - Enter/Space to spin
  - Tab through forms
- **Offline Support:**
  - Full offline capability
  - All assets local (no CDN dependencies)
  - Works in any modern browser offline

**Scope Clarifications:**
- Single wheel only (no multiple wheels/configurations)
- No preview or undo functionality
- No multiple user sessions/accounts
- Designed for modern browsers only (Chrome, Firefox, Safari, Edge latest)
- Full offline functionality required
- Team/workplace use case (random selection for assignments, presentations, etc.)

**Acceptance Criteria:**
- Users selected randomly with prevention of consecutive same-user selection
- Equal probability for all users (except consecutive prevention)
- Minimum 2 users required to spin; maximum 20 supported
- Spin duration configurable 1-10 seconds (default: 7)
- History limited to rolling 500 spins
- Statistics accurate (win counts, percentages, streaks)
- All data persists in localStorage
- App works on desktop and mobile devices
- Full keyboard and touch interaction support
- Works on latest browser versions
- Full offline functionality with no external dependencies
- Shareable links load with confirmation prompt
- Browser tab title reflects winner name
- Long names truncated with ellipsis in slices
- New users fade in when added
- Deleted users preserved in history
