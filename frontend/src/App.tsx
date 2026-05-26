import React from 'react';
import { AppProvider, useApp } from './context';
import TopBar from './components/TopBar';
import LeftPanel from './components/LeftPanel';
import MapPanel from './components/MapPanel';
import RightPanel from './components/RightPanel';
import TriageView from './components/TriageView';

function Shell() {
  const { view, loading, error } = useApp();
  if (loading) return <div className="flex-1 flex items-center justify-center text-muted">Loading data…</div>;
  if (error) return <div className="flex-1 flex items-center justify-center text-critical">Error: {error}</div>;
  if (view === 'Triage') return <TriageView />;
  return (
    <div className="flex flex-1 overflow-hidden">
      <LeftPanel />
      <MapPanel />
      <RightPanel />
    </div>
  );
}

export default function App() {
  return (
    <AppProvider>
      <div className="flex flex-col h-screen bg-base text-primary">
        <TopBar />
        <Shell />
      </div>
    </AppProvider>
  );
}
