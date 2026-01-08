
import React, { useState, useEffect } from 'react';
import { 
  Presentation, Calendar, MapPin, ArrowRight, ArrowLeft, 
  Target, Activity, Info
} from 'lucide-react';
import { mockService } from '../services/mockService';
import { Workshop, College, Student, Task } from '../types';
import TaskManager from './TaskManager';

const WorkshopManager: React.FC = () => {
  // Fixed: Use state for all data fetched asynchronously from mockService
  const [workshops, setWorkshops] = useState<Workshop[]>([]);
  const [colleges, setColleges] = useState<College[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [selectedWorkshop, setSelectedWorkshop] = useState<Workshop | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'tasks'>('overview');
  
  // Fixed: Load data in useEffect instead of during initial state declaration
  useEffect(() => {
    const loadData = async () => {
      const [wData, cData, sData, tData] = await Promise.all([
        mockService.getWorkshops(),
        mockService.getColleges(),
        mockService.getStudents(),
        mockService.getTasks()
      ]);
      setWorkshops(wData);
      setColleges(cData);
      setStudents(sData);
      setTasks(tData);
    };
    loadData();
  }, []);

  const getCollegeName = (collegeId: string) => {
      return colleges.find(c => c.id === collegeId)?.name || 'Unknown College';
  };

  const renderWorkshopList = () => (
      <div className="space-y-6">
          <div className="flex justify-between items-center">
             <div>
                <h2 className="text-2xl font-black text-slate-800 tracking-tight">Workshop Operations</h2>
                <p className="text-slate-500 text-sm mt-1">Manage event lifecycles and assigned academic tracks.</p>
             </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {workshops.map(workshop => (
                  <div key={workshop.id} className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 hover:shadow-md transition-all flex flex-col h-full group">
                      <div className="flex justify-between items-start mb-4">
                          <div className={`p-4 rounded-xl ${
                              workshop.status === 'Ongoing' ? 'bg-emerald-100 text-emerald-600' :
                              workshop.status === 'Upcoming' ? 'bg-indigo-100 text-indigo-600' :
                              'bg-slate-100 text-slate-500'
                          } group-hover:scale-110 transition-transform`}>
                              <Presentation size={24} />
                          </div>
                          <span className={`text-[10px] px-2 py-1 rounded-full font-black uppercase tracking-widest ${
                              workshop.status === 'Ongoing' ? 'bg-emerald-50 text-emerald-700' :
                              workshop.status === 'Upcoming' ? 'bg-indigo-50 text-indigo-700' :
                              'bg-slate-50 text-slate-700'
                          }`}>
                              {workshop.status}
                          </span>
                      </div>
                      
                      <h3 className="text-lg font-black text-slate-800 mb-2 group-hover:text-indigo-600 transition-colors">{workshop.title}</h3>
                      <div className="space-y-2 mb-6 flex-1">
                          <div className="flex items-center gap-2 text-sm text-slate-500 font-medium">
                              <MapPin size={16} className="text-slate-400" />
                              <span className="line-clamp-1">{getCollegeName(workshop.collegeId)}</span>
                          </div>
                          <div className="flex items-center gap-2 text-sm text-slate-500 font-medium">
                              <Calendar size={16} className="text-slate-400" />
                              <span>{new Date(workshop.startDate).toLocaleDateString()} - {new Date(workshop.endDate).toLocaleDateString()}</span>
                          </div>
                      </div>

                      <button 
                          onClick={() => setSelectedWorkshop(workshop)}
                          className="w-full py-3 bg-slate-50 text-slate-700 rounded-xl hover:bg-indigo-600 hover:text-white transition-all font-bold text-sm flex items-center justify-center gap-2"
                      >
                          Manage Operations <ArrowRight size={16} />
                      </button>
                  </div>
              ))}
          </div>
      </div>
  );

  const renderWorkshopDetail = () => {
      if (!selectedWorkshop) return null;

      return (
          <div className="space-y-6 h-full flex flex-col">
              <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
                  <button 
                      onClick={() => { setSelectedWorkshop(null); setActiveTab('overview'); }}
                      className="text-sm font-bold text-slate-500 hover:text-indigo-600 flex items-center gap-1 mb-4"
                  >
                      <ArrowLeft size={16} /> Back to Workshop List
                  </button>
                  <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
                      <div>
                          <h2 className="text-2xl font-black text-slate-800">{selectedWorkshop.title}</h2>
                          <p className="text-slate-500 text-sm flex items-center gap-2 mt-1">
                             <MapPin size={14} className="text-indigo-500" /> {getCollegeName(selectedWorkshop.collegeId)}
                             <span className="text-slate-200">|</span>
                             <Calendar size={14} className="text-indigo-500" /> {new Date(selectedWorkshop.startDate).toLocaleDateString()}
                          </p>
                      </div>
                      <div className="flex bg-slate-100 p-1 rounded-xl">
                          {['overview', 'tasks'].map(tab => (
                              <button
                                  key={tab}
                                  onClick={() => setActiveTab(tab as any)}
                                  className={`px-4 py-2 rounded-lg text-xs font-black uppercase tracking-widest transition-all ${
                                      activeTab === tab 
                                      ? 'bg-white text-indigo-600 shadow-sm' 
                                      : 'text-slate-500 hover:text-slate-700'
                                  }`}
                              >
                                  {tab}
                              </button>
                          ))}
                      </div>
                  </div>
              </div>

              <div className="flex-1">
                  {activeTab === 'tasks' ? (
                      <TaskManager workshopId={selectedWorkshop.id} />
                  ) : (
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                          <div className="col-span-2 bg-white rounded-2xl border border-slate-200 p-8">
                              <h3 className="font-black text-slate-800 mb-6 text-lg uppercase tracking-wider">Strategic Overview</h3>
                              <p className="text-slate-600 text-sm leading-relaxed mb-8">
                                  This workshop is configured for targeted institutional capacity building. 
                                  Use the <span className="font-bold text-indigo-600">Tasks</span> module to deploy learning tracks, 
                                  quizzes, and project-based assessments. High engagement correlates with automated leaderboard updates.
                              </p>
                              <div className="grid grid-cols-2 gap-6">
                                  <div className="p-6 bg-indigo-50 rounded-2xl border border-indigo-100">
                                      <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-1">Target Audience</p>
                                      <p className="text-2xl font-black text-indigo-900">{students.filter(s => s.collegeId === selectedWorkshop.collegeId).length}</p>
                                  </div>
                                  <div className="p-6 bg-emerald-50 rounded-2xl border border-emerald-100">
                                      <p className="text-[10px] font-black text-emerald-400 uppercase tracking-widest mb-1">Active Modules</p>
                                      <p className="text-2xl font-black text-emerald-900">{tasks.filter(t => t.workshopId === selectedWorkshop.id).length}</p>
                                  </div>
                              </div>
                          </div>
                          <div className="bg-white rounded-2xl border border-slate-200 p-8 flex flex-col">
                              <h3 className="font-black text-slate-800 mb-6 text-sm uppercase tracking-wider">Live Metrics</h3>
                              <div className="space-y-6 flex-1">
                                  <div className="flex justify-between items-center pb-3 border-b border-slate-50">
                                      <span className="text-xs font-bold text-slate-500">Participation Rate</span>
                                      <span className="text-sm font-black text-emerald-600">85%</span>
                                  </div>
                                  <div className="flex justify-between items-center pb-3 border-b border-slate-50">
                                      <span className="text-xs font-bold text-slate-500">Quality Score</span>
                                      <span className="text-sm font-black text-indigo-600">92/100</span>
                                  </div>
                              </div>
                              <div className="mt-8 p-4 bg-slate-50 rounded-xl flex items-start gap-3">
                                <Info size={16} className="text-indigo-400 flex-shrink-0 mt-0.5" />
                                <p className="text-[10px] font-bold text-slate-500 leading-relaxed uppercase">Institutional data like roll numbers are managed in the College module.</p>
                              </div>
                          </div>
                      </div>
                  )}
              </div>
          </div>
      );
  };

  return selectedWorkshop ? renderWorkshopDetail() : renderWorkshopList();
};

export default WorkshopManager;
