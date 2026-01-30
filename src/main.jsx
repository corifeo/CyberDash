import React from 'react';
import ReactDOM from 'react-dom/client';
import { Dashboard } from './components/Dashboard';
import organizationData from './data/organization.json';
import practiceDefinitions from './data/practices.json';
import './index.css';

/**
 * CyberDash - Security Practices Monthly Update Dashboard
 *
 * This is the main entry point for the application.
 * The Dashboard component reads from external JSON data files
 * for easy monthly updates without code changes.
 */
function App() {
  return (
    <Dashboard
      organizationData={organizationData}
      practiceDefinitions={practiceDefinitions}
    />
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
