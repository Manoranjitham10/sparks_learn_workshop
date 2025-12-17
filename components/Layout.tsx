import React, { ReactNode } from 'react';
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
  LogOut
} from 'lucide-react';

interface LayoutProps {
  children: ReactNode;
  activeTab: string;
  onTabChange: (tab: string) => void;
}

const Layout: React.FC<LayoutProps> = ({ children, activeTab, onTabChange }) => {
  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'colleges', label: 'Colleges', icon: School },
    { id: 'workshops', label: 'Workshops', icon: Presentation },
    // Tasks removed from sidebar, moved inside Workshops
    { id: 'submissions', label: 'Submissions', icon: FileCheck },
    { id: 'gamification', label: 'Gamification', icon: Trophy },
    { id: 'users', label: 'Users', icon: Users },
    { id: 'reports', label: 'Analytics', icon: BarChart },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  return (
    <div className="flex h-screen bg-slate-50">
      {/* Sidebar */}
      <aside className="w-64 bg-indigo-900 text-white flex flex-col fixed h-full shadow-xl z-20">
        <div className="p-6 border-b border-indigo-800 flex items-center gap-2">
            <div className="w-8 h-8 bg-indigo-500 rounded-lg flex items-center justify-center font-bold text-white">S</div>
            <h1 className="text-xl font-bold tracking-tight">Sparks Learn</h1>
        </div>
        
        <nav className="flex-1 py-6 px-3 space-y-1 overflow-y-auto">
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => onTabChange(item.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-lg transition-all duration-200 ${
                activeTab === item.id 
                  ? 'bg-indigo-600 text-white shadow-md' 
                  : 'text-indigo-200 hover:bg-indigo-800 hover:text-white'
              }`}
            >
              <item.icon size={20} />
              {item.label}
            </button>
          ))}
        </nav>

        <div className="p-4 border-t border-indigo-800">
          <button className="flex items-center gap-3 w-full px-4 py-3 text-sm font-medium text-indigo-200 hover:text-white hover:bg-indigo-800 rounded-lg transition-colors">
            <LogOut size={20} />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 ml-64 flex flex-col h-full overflow-hidden">
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-8 shadow-sm z-10">
          <h2 className="text-xl font-semibold text-slate-800 capitalize">
            {menuItems.find(m => m.id === activeTab)?.label}
          </h2>
          <div className="flex items-center gap-4">
            <div className="text-right hidden sm:block">
              <p className="text-sm font-semibold text-slate-700">Super Admin</p>
              <p className="text-xs text-slate-500">sparks-admin@example.com</p>
            </div>
            <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold border border-indigo-200">
              SA
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