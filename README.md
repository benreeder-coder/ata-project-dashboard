# ATA Project Dashboard

A project tracking dashboard for the Applied Technology Academy Sales Automation project.

## Quick Start

### Option 1: Open Locally
1. Open `index.html` in your web browser
2. **Note**: Due to browser security, you may need to use a local server for the JSON file to load

### Option 2: Use Local Server (Recommended)
```bash
# Using Python 3
cd dashboard
python -m http.server 8000
# Then open http://localhost:8000

# Using Node.js (if npx available)
npx serve .
# Then open http://localhost:3000
```

### Option 3: VS Code Live Server
1. Install the "Live Server" extension in VS Code
2. Right-click `index.html` and select "Open with Live Server"

---

## Updating Project Data

All project data is stored in `data/project-data.json`. Edit this file to update the dashboard.

### Update Task Status

Find the task in the `phases` array and change its `status`:

```json
{
  "id": "p1t1",
  "title": "Audit all 8 Zoho forms",
  "status": "complete"  // Options: "not_started", "in_progress", "blocked", "complete"
}
```

### Add a Task Blocker

```json
{
  "id": "p1t1",
  "title": "Task name",
  "status": "blocked",
  "blockedBy": "Description of what's blocking this task"
}
```

### Add a New Action Item

Add to the `actionItems` array:

```json
{
  "id": "a8",
  "title": "Description of the action",
  "assignee": "lynn",
  "dueDate": "2025-12-20",
  "status": "pending",
  "notes": "Optional notes"
}
```

**Stakeholder IDs:**
- `lynn` - Lynn Fisher
- `matt` - Matt Marshall
- `christine` - Christine Harper
- `kim` - Kim
- `ben` - Ben Reeder

### Add a New Blocker

Add to the `blockers` array:

```json
{
  "id": "b4",
  "title": "Blocker title",
  "description": "What's happening",
  "impact": "What it affects",
  "mitigation": "How to work around it",
  "status": "pending",
  "affectedTasks": ["p2t1", "p2t2"]
}
```

### Add a Pending Decision

Add to the `pendingDecisions` array:

```json
{
  "id": "d3",
  "title": "Decision needed",
  "description": "Context for the decision",
  "owner": "lynn",
  "status": "pending",
  "options": ["Option A", "Option B"],
  "decision": null
}
```

### Update Last Modified Date

Always update the `lastUpdated` field when making changes:

```json
{
  "project": {
    "lastUpdated": "2025-12-18"
  }
}
```

---

## Status Reference

### Task Statuses
- `not_started` - Work hasn't begun
- `in_progress` - Currently being worked on
- `blocked` - Cannot proceed due to blocker
- `complete` - Work finished

### Blocker Statuses
- `pending` - Not yet addressed
- `acknowledged` - Understood, working on mitigation
- `resolved` - No longer blocking

### Action Item Statuses
- `pending` - Not started
- `in_progress` - Being worked on
- `complete` - Done

---

## Keyboard Shortcuts

- Click any phase card to expand/collapse task details
- Click a stakeholder in sidebar to filter (future feature)

---

## Console Commands

Open browser console (F12) and use these commands:

```javascript
// Refresh data from JSON file
refreshDashboard()

// Export current data as JSON file
exportData()

// Print dashboard
printDashboard()
```

---

## Deployment to GitHub Pages

1. Create a new GitHub repository
2. Push the `dashboard` folder contents
3. Go to Settings > Pages
4. Select "Deploy from a branch" and choose `main`
5. Share the generated URL with stakeholders

---

## File Structure

```
dashboard/
├── index.html          # Main page
├── data/
│   └── project-data.json   # All project data (edit this!)
├── styles/
│   ├── variables.css   # Design tokens & colors
│   ├── main.css        # Layout styles
│   └── components.css  # UI component styles
├── scripts/
│   ├── data.js         # Data loading & calculations
│   ├── ui.js           # UI rendering
│   └── app.js          # Main application
├── assets/
│   └── logo.webp       # ATA logo
└── README.md           # This file
```

---

## Support

Contact Ben Reeder at benreeder@builderbenai.com for questions about this dashboard.
