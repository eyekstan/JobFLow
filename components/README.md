# JobFlow - Contractor Job Management PWA

A fast, simple Progressive Web App for contractors and handymen to manage job leads and projects while on the phone with customers.

## Features

- **Quick Capture** - Add new leads in seconds with minimal taps
- **Today's Actions** - See overdue and today's tasks at a glance
- **Pipeline View** - Track jobs through workflow stages
- **Project Details** - Update status, add notes, schedule follow-ups
- **Phone Integration** - Tap to call customers directly
- **Offline Support** - Works without internet connection
- **Add to Home Screen** - Install as a native app

## Tech Stack

- Vanilla JavaScript (no frameworks)
- TailwindCSS via CDN
- LocalStorage for data persistence
- Service Worker for PWA features

## Project Structure

```
JobFlow 3.0/
├── index.html           # Main HTML file
├── app.js               # Main application logic
├── styles.css           # Custom styles
├── manifest.json        # PWA manifest
├── service-worker.js    # Service worker for offline
├── components/
│   ├── ProjectCard.js   # Project card component
│   └── ActionButton.js  # Action button component
├── screens/
│   ├── DashboardScreen.js      # Main dashboard
│   ├── QuickCaptureScreen.js   # New lead form
│   ├── ProjectDetailScreen.js  # Project details
│   └── PipelineScreen.js       # Pipeline view
└── README.md
```

## How to Run

1. Open `index.html` in a web browser
2. Or serve the folder with a local server:
   ```bash
   # Using Python
   python -m http.server 8000
   
   # Using Node.js
   npx serve .
   ```
3. Open http://localhost:8000

## How It Works

### Data Storage

All data is stored in the browser's LocalStorage under the key `projects`. Each project contains:

```javascript
{
  id: "unique-id",
  name: "Customer Name",
  phone: "555-555-5555",
  address: "123 Main St",
  note: "Project description",
  status: "Lead", // Lead, Visit, Quote, Approved, Scheduled, In Progress, Complete
  next_action: "Follow up",
  next_action_date: "2026-03-10",
  created_at: 1710000000
}
```

### Navigation

The app uses a simple state-based navigation system:
- Dashboard: Today's actions and active projects
- Pipeline: Projects grouped by status
- New Lead: Quick capture form

### Status Workflow

```
Lead → Visit → Quote → Approved → Scheduled → In Progress → Complete
```

### PWA Features

- **Manifest** - Enables "Add to Home Screen"
- **Service Worker** - Caches files for offline use
- **Theme Color** - Matches app branding

## Deployment

Deploy as a static site to any free hosting:

### Netlify (Recommended)
1. Drag and drop the folder to Netlify Drop
2. Or connect a Git repository

### GitHub Pages
1. Push to a GitHub repository
2. Enable Pages in settings

### Vercel
```bash
npm i -g vercel
vercel
```

## Modifying the Code

### Adding a New Field

1. Update `app.js` - Add field to project object in Storage
2. Update screens that display/edit projects
3. Update `styles.css` if needed

### Adding a New Status

1. Update `STATUSES` array in `app.js`
2. Add status transitions in `STATUS_ACTIONS`
3. Add CSS class in `styles.css`

### Changing Colors

Update Tailwind classes in HTML or custom colors in `styles.css`:
- Primary: `#007AFF`
- Success: `#34C759`
- Accent: `#FF9500`

## Browser Support

- Chrome/Edge (recommended)
- Safari (iOS)
- Firefox

## Data Migration

To migrate to a backend later:

1. Export data:
   ```javascript
   const data = localStorage.getItem('projects');
   console.log(JSON.parse(data));
   ```

2. Replace `Storage` object in `app.js` with API calls

## License

MIT
