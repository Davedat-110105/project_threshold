import React from 'react';
import { AppProvider, useApp } from './context';
import TopBar from './components/TopBar';
import LeftPanel from './components/LeftPanel';
import MapPanel from './components/MapPanel';
import RightPanel from './components/RightPanel';
import TriageView from './components/TriageView';

function Shell() {
  const { view, loading, error } = useApp();
  if (loading) return (
    <div className="flex-1 flex items-center justify-center bg-base">
      <div className="flex flex-col items-center gap-3">
        <div className="w-8 h-8 rounded-full border-2 border-accent/30 border-t-accent animate-spin" />
        <span className="text-xs text-muted tracking-widest uppercase">Loading Brampton data</span>
      </div>
    </div>
  );
  if (error) return (
    <div className="flex-1 flex items-center justify-center bg-base">
      <div className="text-xs text-critical bg-critical/10 border border-critical/30 rounded-lg px-4 py-3">
        {error}
      </div>
    </div>
  );
  if (view === 'Triage') return <TriageView />;
  return (
    <div className="flex flex-1 overflow-hidden">
      <LeftPanel />
      <MapPanel />
      <RightPanel />
    </div>
  );
}

function ThemedShell() {
  const { theme } = useApp();
  return (
    <div data-theme={theme} className="flex flex-col h-screen bg-base text-primary">
      <TopBar />
      <Shell />
    </div>
  );
}

export default function App() {
  return (
    <AppProvider>
      <ThemedShell />
    </AppProvider>
  );
}
