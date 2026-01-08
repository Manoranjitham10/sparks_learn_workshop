
import React, { ReactNode, useState, useEffect } from 'react';
import { 
  LayoutDashboard, 
  School, 
  Presentation, 
  CheckSquare, 
  FileCheck, 
  Trophy, 
  Users, 
  BarChart, 
  Settings,
  LogOut,
  Database
} from 'lucide-react';

interface LayoutProps {
  children: ReactNode;
  activeTab: string;
  onTabChange: (tab: string) => void;
}

const Layout: React.FC<LayoutProps> = ({ children, activeTab, onTabChange }) => {
  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'workshops', label: 'Workshops', icon: Presentation },
    { id: 'submissions', label: 'Submissions', icon: FileCheck },
    { id: 'gamification', label: 'Gamification', icon: Trophy },
    { id: 'cms', label: 'CMS', icon: Database },
    { id: 'users', label: 'Users', icon: Users },
    { id: 'reports', label: 'Analytics', icon: BarChart },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  return (
    <div className="flex h-screen bg-slate-50">
      {/* Sidebar */}
      <aside className="w-64 bg-slate-900 text-white flex flex-col fixed h-full shadow-xl z-20">
        <div className="p-8 border-b border-slate-800 flex items-center gap-3">
            <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center font-bold text-xl text-white">S</div>
            <div>
              <h1 className="text-xl font-bold tracking-tight">Sparks Learn</h1>
              <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">Super Admin Hub</p>
            </div>
        </div>
        
        <nav className="flex-1 py-6 px-4 space-y-1 overflow-y-auto no-scrollbar">
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => onTabChange(item.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-semibold rounded-xl transition-all ${
                activeTab === item.id 
                  ? 'bg-indigo-600 text-white shadow-lg' 
                  : 'text-slate-400 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <item.icon size={18} />
              {item.label}
            </button>
          ))}
        </nav>

        <div className="p-6 border-t border-slate-800">
          <button className="flex items-center gap-3 w-full px-4 py-3 text-sm font-semibold text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-all">
            <LogOut size={18} />
            Logout
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 ml-64 flex flex-col h-full overflow-hidden">
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-10 z-10 no-print">
          <h2 className="text-xl font-bold text-slate-800">
            {menuItems.find(m => m.id === activeTab)?.label}
          </h2>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-sm font-bold text-slate-800">Administrator</p>
              <p className="text-xs text-slate-500">System Level Access</p>
            </div>
            <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 font-bold border border-slate-200">
              AD
            </div>
          </div>
        </header>
        
        <div className="flex-1 overflow-auto p-8">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </div>
      </main>
    </div>
  );
};

export default Layout;
