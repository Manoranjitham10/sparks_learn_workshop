
import React, { useState } from 'react';
import Layout from './components/Layout';
import Dashboard from './components/Dashboard';
import WorkshopManager from './components/WorkshopManager';
import SubmissionGrader from './components/SubmissionGrader';
import Gamification from './components/Gamification';
import Settings from './components/Settings';
import CMS from './components/CMS';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState('dashboard');

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
      case 'reports': 
        return <Dashboard />;
      case 'workshops':
        return <WorkshopManager />;
      case 'submissions':
        return <SubmissionGrader />;
      case 'gamification':
        return <Gamification />;
      case 'cms':
        return <CMS />;
      case 'settings':
        return <Settings />;
      case 'users':
        return (
          <div className="flex flex-col items-center justify-center h-96 text-slate-400">
            <div className="w-16 h-16 border-2 border-slate-200 rounded-full flex items-center justify-center mb-4">
               <span className="text-2xl">🚧</span>
            </div>
            <h3 className="text-lg font-semibold text-slate-600">Coming Soon</h3>
            <p className="text-sm">The {activeTab} module is currently under development.</p>
          </div>
        );
      default:
        return <Dashboard />;
    }
  };

  return (
    <Layout activeTab={activeTab} onTabChange={setActiveTab}>
      {renderContent()}
    </Layout>
  );
};

export default App;
