# CyberDash

A simple browser-based app for managing monthly security practice updates. All data stored in localStorage - no server needed.

## Quick Start

```bash
npm install
npm run dev
```

## Features

- **Click to Edit** - Click any field to edit inline
- **Month Management** - Create new months, switch between them
- **Auto-save** - All changes saved to localStorage automatically
- **Export/Import** - Download data as JSON, restore from backup
- **RAG Status** - Auto-calculated from practice scores

## How to Use

### Monthly Workflow

1. Click **+** next to month selector to create a new month
2. Enter month key (e.g., `2025-02`) and label (e.g., `February 2025`)
3. New month copies structure from previous, clears update fields
4. Click into each squad to update practices and monthly summary

### Editing

- **Text fields**: Click to edit, Enter to save, Escape to cancel
- **Practices**: Click toggles for boolean, click 1-4 buttons for maturity
- **Trends**: Select from dropdown
- **Metrics**: Click each part (label, value, target) to edit

### Data Management

- **Export**: Downloads all months as JSON file
- **Import**: Restore from previously exported JSON
- **Reset**: Clear all data and start fresh

## Scoring

- **Boolean practices**: Yes/No
- **Maturity practices**: 1-4 scale
- **RAG Status** (auto-calculated):
  - Green: ≥75% score
  - Amber: ≥40% score
  - Red: <40% score

## Tech Stack

- React 18 + Vite
- Tailwind CSS
- localStorage (no server)
