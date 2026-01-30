# CyberDash

A tiny library for providing quick monthly security practice updates with modern visualizations.

## Features

- **External Data Files**: Update your security data by editing JSON files - no code changes needed
- **Modern UI**: Glassmorphism, smooth animations, and responsive design
- **Component Library**: Reusable components for building custom dashboards
- **Recharts Integration**: Beautiful radar and bar charts
- **Framer Motion**: Fluid animations throughout

## Quick Start

```bash
npm install
npm run dev
```

## Data Structure

### Organization Data (`src/data/organization.json`)

```json
{
  "name": "Security Practices Status Update",
  "reportingPeriod": "January 2025",
  "businessUnits": [
    {
      "id": "unique-id",
      "name": "Business Unit Name",
      "squads": [
        {
          "id": "squad-id",
          "name": "Squad Name",
          "practices": {
            "embeddedSecurityExperts": true,
            "threatModeling": 3
          },
          "monthlyUpdate": {
            "summary": "What was done this month",
            "nextPeriod": "What's planned next",
            "trend": "improving|stable|declining",
            "keyMetric": {
              "label": "Metric Name",
              "value": "100%",
              "target": "100%"
            }
          }
        }
      ]
    }
  ]
}
```

### Practice Definitions (`src/data/practices.json`)

```json
{
  "practiceId": {
    "id": "practiceId",
    "name": "Full Practice Name",
    "shortName": "Short Name",
    "description": "What this practice covers",
    "type": "boolean|maturity",
    "category": "people|process|tooling"
  }
}
```

## Monthly Update Workflow

1. Edit `src/data/organization.json` with new squad updates
2. Update `reportingPeriod` to the current month
3. Update each squad's `monthlyUpdate` section
4. Build and deploy

## Components

### Dashboard

Main component that renders the complete dashboard.

```jsx
import { Dashboard } from 'cyberdash';
import orgData from './data/organization.json';
import practices from './data/practices.json';

<Dashboard
  organizationData={orgData}
  practiceDefinitions={practices}
/>
```

### Individual Components

```jsx
import {
  RadialProgress,
  TrendIndicator,
  StatusBadge,
  MetricCard,
  PracticeGrid,
  BusinessUnitCard,
  SquadCard,
} from 'cyberdash/components';
```

### Hooks

```jsx
import { useDashboardData } from 'cyberdash';

const {
  enrichedData,
  currentBusinessUnit,
  organizationStats,
  selectBusinessUnit,
  goBack,
  goHome,
} = useDashboardData(orgData, practices);
```

## Scoring

- **Boolean practices**: Yes = 1, No = 0
- **Maturity practices**: 1-4 scale, ≥3 considered "adopted"
- **RAG Status**:
  - Green: ≥75% score
  - Amber: ≥40% score
  - Red: <40% score

## Tech Stack

- React 18
- Vite 5
- Tailwind CSS 3
- Recharts
- Framer Motion
- Lucide Icons

## License

MIT
