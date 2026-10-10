import React from 'react';
import { WorkspaceProvider } from './context/WorkspaceContext';
import { ToastProvider } from './context/ToastContext';
import { AppShell } from './components/shell/AppShell';

export const App: React.FC = () => {
  return (
    <ToastProvider>
      <WorkspaceProvider>
        <AppShell />
      </WorkspaceProvider>
    </ToastProvider>
  );
};

export default App;
