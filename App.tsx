import React, { useState } from 'react';
import { Layout } from './components/Layout';
import { JourneyMap } from './components/JourneyMap';
import { ArchitectureDiagram } from './components/ArchitectureDiagram';
import { DesignSystem } from './components/DesignSystem';
import { AppView } from './types';

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<AppView>(AppView.JOURNEY_MAP);

  return (
    <Layout currentView={currentView} onNavigate={setCurrentView}>
      {currentView === AppView.JOURNEY_MAP && <JourneyMap />}
      {currentView === AppView.INFO_ARCH && <ArchitectureDiagram />}
      {currentView === AppView.DESIGN_SYSTEM && <DesignSystem />}
    </Layout>
  );
};

export default App;
