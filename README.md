# Sharova Life OS

**Sharova Life OS** is a mobile-friendly personal operating system for organizing the practical parts of everyday life in one calm workspace.

## What is included

- **Dashboard** — quick view of tasks, deadlines, career items and documents.
- **Documents** — track important documents, expiry dates, categories and notes.
- **Money** — record income and expenses, set a current balance and savings goal.
- **Career** — track jobs, internships and other opportunities through a clear pipeline.
- **Student Life** — a dedicated workspace for school students, university students and parents managing a child's study routine.
- **Classes & timetable** — units/subjects, lecturers or teachers, rooms, days and times.
- **Assignments & coursework** — deadlines, priority and completion planning.
- **Tests & exams** — exam dates and revision plans.
- **Grades & GPA** — store results and calculate a simple percentage average.
- **Academic calendar** — semester dates, registration, holidays and school events.
- **Student money** — fees, allowances and education-related expenses.
- **Scholarships & opportunities** — applications, internships and other student opportunities.
- **Campus activities** — clubs, societies, events, leadership and volunteering.
- **Group projects** — teammates, personal tasks and deadlines.
- **Study planner** — focused study sessions and revision targets.
- **Deadlines** — manage due dates, priorities and notes.
- **Travel** — create trips with preparation checklists.
- **Home & Tasks** — everyday tasks, priorities, due dates and repeating routines.
- **AI Assistant** — an in-app assistant area for priorities, summaries and planning.
- **Settings** — personalize the workspace and export/import backups.
- **PWA support** — app-like web experience with manifest and service worker support.

## Life-stage personalization

Sharova Life OS is not a separate product for each audience. During first use, the workspace can be personalized around:

- Student
- University Student
- Job Seeker
- Working Professional
- Entrepreneur
- Parent / Family
- Other

A parent can select **Parent / Family** and optionally identify the student whose school or university routine they are managing. The rest of the Life OS remains available regardless of the selected stage.

## Data and privacy

Core workspace data is stored locally in the browser using `localStorage`. Export a backup before clearing browser storage or moving to another device. Account access is handled separately through the configured authentication service.

The repository does not contain a hard-coded customer database or personal student records.

## Project structure

```text
index.html      Main application UI
styles.css      Responsive visual system
polish.css      UI polish layer
student.css     Student + Family Study visual system
app.js          Core workspace state, forms and navigation
student.js      Student Life + Family Study state and forms
ai.js           AI assistant client-side integration
cloud.js        Account/cloud workspace integration
api/            Server-side AI endpoint(s)
auth.js         Customer authentication and access gate
manifest.json   PWA metadata
sw.js           Service worker/cache
icon.svg        Application icon
```

## Product direction

Sharova Life OS is designed to feel like a calm, practical personal operating system rather than a collection of disconnected templates. The same product adapts to different life stages while keeping the core workspace consistent.

**Created by Sharon Ndeda.**
