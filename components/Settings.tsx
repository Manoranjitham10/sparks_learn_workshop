
import React, { useState } from 'react';
import { 
  Settings as SettingsIcon, Globe, Shield, Zap, Award, 
  Save, RefreshCw, Lock, Bell, Mail, Clock, CheckCircle2,
  Cpu, Trash2, Key, Info, Activity
} from 'lucide-react';

const Settings: React.FC = () => {
  const [activeSection, setActiveSection] = useState<'general' | 'academic' | 'security' | 'gamification'>('general');
  const [isSaving, setIsSaving] = useState(false);
  const [isArchiving, setIsArchiving] = useState(false);
  const [aiEnabled, setAiEnabled] = useState(true);

  const handleSave = () => {
    setIsSaving(true);
    setTimeout(() => {
      setIsSaving(false);
      alert("Operational settings saved to persistence layer.");
    }, 1500);
  };

  const handleArchive = () => {
    if (confirm("This will archive all current student points and badges. Proceed?")) {
      setIsArchiving(true);
      setTimeout(() => {
        setIsArchiving(false);
        alert("Podium reset. Global leaderboards are now empty for the new season.");
      }, 2000);
    }
  };

  const navItems = [
    { id: 'general', label: 'General', icon: Globe },
    { id: 'academic', label: 'Academic', icon: CheckCircle2 },
    { id: 'security', label: 'Security & AI', icon: Shield },
    { id: 'gamification', label: 'Gamification', icon: Award },
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-4xl font-black text-slate-800 tracking-tight">Platform Config</h2>
          <p className="text-slate-500 text-lg font-medium mt-1">Global operational rules for Sparks Learn.</p>
        </div>
        <button 
          onClick={handleSave}
          disabled={isSaving}
          className={`flex items-center gap-2 px-8 py-4 bg-indigo-600 text-white rounded-2xl hover:bg-indigo-700 shadow-2xl font-black text-xs uppercase tracking-widest transition-all ${isSaving ? 'opacity-70 cursor-not-allowed' : ''}`}
        >
          {isSaving ? <RefreshCw className="animate-spin" size={18} /> : <Save size={18} />}
          {isSaving ? 'Syncing...' : 'Save Global Changes'}
        </button>
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        <div className="lg:w-64 space-y-2">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveSection(item.id as any)}
              className={`w-full flex items-center gap-3 px-5 py-4 rounded-2xl font-black text-xs uppercase tracking-widest transition-all ${
                activeSection === item.id 
                  ? 'bg-white text-indigo-600 shadow-md border border-slate-100' 
                  : 'text-slate-400 hover:text-slate-600 hover:bg-slate-100'
              }`}
            >
              <item.icon size={18} />
              {item.label}
            </button>
          ))}
        </div>

        <div className="flex-1 bg-white rounded-[40px] shadow-sm border border-slate-200 p-10 min-h-[600px]">
          {activeSection === 'general' && (
            <div className="space-y-10 animate-in fade-in slide-in-from-right-4">
              <section>
                <h3 className="text-xl font-black text-slate-800 mb-6 flex items-center gap-3">
                  <Globe className="text-indigo-600" /> Identity & Branding
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Platform Name</label>
                    <input type="text" className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold" defaultValue="Sparks Learn" />
                  </div>
                </div>
              </section>
            </div>
          )}

          {activeSection === 'academic' && (
            <div className="space-y-10 animate-in fade-in slide-in-from-right-4">
              <section>
                <h3 className="text-xl font-black text-slate-800 mb-6 flex items-center gap-3">
                  <Zap className="text-indigo-600" /> Automation Engine
                </h3>
                <div 
                  onClick={() => setAiEnabled(!aiEnabled)}
                  className="flex items-center justify-between p-6 bg-white border border-slate-200 rounded-2xl shadow-sm cursor-pointer hover:bg-slate-50 transition-colors"
                >
                   <div>
                     <p className="font-black text-slate-800">AI Rubric Assistance</p>
                     <p className="text-xs text-slate-500 font-medium">Allow Gemini to suggest grading comments based on submission content.</p>
                   </div>
                   <div className={`w-14 h-8 ${aiEnabled ? 'bg-indigo-600' : 'bg-slate-300'} rounded-full relative transition-all shadow-inner`}>
                      <div className={`absolute ${aiEnabled ? 'right-1' : 'left-1'} top-1 w-6 h-6 bg-white rounded-full shadow-md transition-all`}></div>
                   </div>
                </div>
              </section>
            </div>
          )}

          {activeSection === 'gamification' && (
            <div className="space-y-10 animate-in fade-in slide-in-from-right-4">
              <section className="bg-slate-900 rounded-[40px] p-10 text-white relative overflow-hidden shadow-2xl">
                 <div className="relative z-10">
                    <h3 className="text-3xl font-black mb-4">Season Management</h3>
                    <p className="text-slate-400 text-lg mb-10 font-medium">Concluding a season will archive all current points and reset the global podium.</p>
                    <button 
                      onClick={handleArchive}
                      disabled={isArchiving}
                      className="px-10 py-5 bg-rose-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-rose-700 shadow-xl transition-all flex items-center gap-3"
                    >
                       {isArchiving ? <RefreshCw className="animate-spin" size={18} /> : <RefreshCw size={18} />}
                       {isArchiving ? 'Archiving...' : 'Archive Season & Reset Podium'}
                    </button>
                 </div>
              </section>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Settings;
