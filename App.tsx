import React, { useState } from 'react';
import Layout from './components/Layout';
import Dashboard from './components/Dashboard';
import CollegeManager from './components/CollegeManager';
import WorkshopManager from './components/WorkshopManager';
import SubmissionGrader from './components/SubmissionGrader';
import Gamification from './components/Gamification';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState('dashboard');

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <Dashboard />;
      case 'colleges':
        return <CollegeManager />;
      case 'workshops':
        return <WorkshopManager />;
      case 'submissions':
        return <SubmissionGrader />;
      case 'gamification':
        return <Gamification />;
      case 'users':
      case 'reports':
      case 'settings':
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