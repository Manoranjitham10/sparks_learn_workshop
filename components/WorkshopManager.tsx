import React, { useState } from 'react';
import { Presentation, Calendar, Users, MapPin, ArrowRight, ArrowLeft } from 'lucide-react';
import { mockService } from '../services/mockService';
import { Workshop } from '../types';
import TaskManager from './TaskManager';

const WorkshopManager: React.FC = () => {
  const [workshops, setWorkshops] = useState<Workshop[]>(mockService.getWorkshops());
  const [selectedWorkshop, setSelectedWorkshop] = useState<Workshop | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'tasks' | 'students'>('overview');

  const getCollegeName = (collegeId: string) => {
      return mockService.getColleges().find(c => c.id === collegeId)?.name || 'Unknown College';
  };

  const renderWorkshopList = () => (
      <div className="space-y-6">
          <div>
             <h2 className="text-2xl font-bold text-slate-800">Workshop Management</h2>
             <p className="text-slate-500 text-sm mt-1">View and manage all workshops across colleges.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {workshops.map(workshop => (
                  <div key={workshop.id} className="bg-white rounded-xl shadow-sm border border-slate-100 p-6 hover:shadow-md transition-shadow flex flex-col h-full">
                      <div className="flex justify-between items-start mb-4">
                          <div className={`p-3 rounded-lg ${
                              workshop.status === 'Ongoing' ? 'bg-green-100 text-green-600' :
                              workshop.status === 'Upcoming' ? 'bg-blue-100 text-blue-600' :
                              'bg-slate-100 text-slate-500'
                          }`}>
                              <Presentation size={24} />
                          </div>
                          <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                              workshop.status === 'Ongoing' ? 'bg-green-50 text-green-700 border border-green-100' :
                              workshop.status === 'Upcoming' ? 'bg-blue-50 text-blue-700 border border-blue-100' :
                              'bg-slate-50 text-slate-700 border border-slate-100'
                          }`}>
                              {workshop.status}
                          </span>
                      </div>
                      
                      <h3 className="text-lg font-bold text-slate-800 mb-2">{workshop.title}</h3>
                      <div className="space-y-2 mb-6 flex-1">
                          <div className="flex items-center gap-2 text-sm text-slate-500">
                              <MapPin size={16} />
                              <span className="line-clamp-1">{getCollegeName(workshop.collegeId)}</span>
                          </div>
                          <div className="flex items-center gap-2 text-sm text-slate-500">
                              <Calendar size={16} />
                              <span>{new Date(workshop.startDate).toLocaleDateString()} - {new Date(workshop.endDate).toLocaleDateString()}</span>
                          </div>
                      </div>

                      <button 
                          onClick={() => setSelectedWorkshop(workshop)}
                          className="w-full py-2 bg-indigo-50 text-indigo-700 rounded-lg hover:bg-indigo-100 transition-colors font-medium flex items-center justify-center gap-2"
                      >
                          Manage Workshop <ArrowRight size={16} />
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
              {/* Header */}
              <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm">
                  <button 
                      onClick={() => { setSelectedWorkshop(null); setActiveTab('overview'); }}
                      className="text-sm text-slate-500 hover:text-indigo-600 flex items-center gap-1 mb-4"
                  >
                      <ArrowLeft size={16} /> Back to Workshops
                  </button>
                  <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
                      <div>
                          <h2 className="text-2xl font-bold text-slate-800">{selectedWorkshop.title}</h2>
                          <p className="text-slate-500 text-sm flex items-center gap-2 mt-1">
                             <MapPin size={14} /> {getCollegeName(selectedWorkshop.collegeId)}
                             <span className="text-slate-300">|</span>
                             <Calendar size={14} /> {new Date(selectedWorkshop.startDate).toLocaleDateString()} - {new Date(selectedWorkshop.endDate).toLocaleDateString()}
                          </p>
                      </div>
                      <div className="flex gap-2">
                          {['overview', 'tasks', 'students'].map(tab => (
                              <button
                                  key={tab}
                                  onClick={() => setActiveTab(tab as any)}
                                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                                      activeTab === tab 
                                      ? 'bg-indigo-600 text-white shadow-md' 
                                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                  }`}
                              >
                                  {tab.charAt(0).toUpperCase() + tab.slice(1)}
                              </button>
                          ))}
                      </div>
                  </div>
              </div>

              {/* Content Area */}
              <div className="flex-1">
                  {activeTab === 'tasks' ? (
                      <TaskManager workshopId={selectedWorkshop.id} />
                  ) : activeTab === 'students' ? (
                      <div className="bg-white rounded-xl border border-slate-200 p-12 text-center text-slate-400">
                          <Users className="mx-auto mb-3 opacity-50" size={48} />
                          <p>Student management for this workshop coming soon.</p>
                      </div>
                  ) : (
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                          <div className="col-span-2 bg-white rounded-xl border border-slate-200 p-6">
                              <h3 className="font-bold text-slate-800 mb-4">Workshop Overview</h3>
                              <p className="text-slate-600 text-sm leading-relaxed">
                                  This workshop focuses on advanced topics and practical implementation. 
                                  Students will engage in hands-on tasks and quizzes to reinforce their learning.
                                  Manage tasks in the "Tasks" tab to assign work to enrolled students.
                              </p>
                          </div>
                          <div className="bg-white rounded-xl border border-slate-200 p-6">
                              <h3 className="font-bold text-slate-800 mb-4">Quick Stats</h3>
                              <div className="space-y-4">
                                  <div className="flex justify-between items-center pb-2 border-b border-slate-50">
                                      <span className="text-sm text-slate-500">Enrolled Students</span>
                                      <span className="font-bold text-slate-800">24</span>
                                  </div>
                                  <div className="flex justify-between items-center pb-2 border-b border-slate-50">
                                      <span className="text-sm text-slate-500">Completion Rate</span>
                                      <span className="font-bold text-green-600">85%</span>
                                  </div>
                                  <div className="flex justify-between items-center pb-2 border-b border-slate-50">
                                      <span className="text-sm text-slate-500">Avg. Score</span>
                                      <span className="font-bold text-indigo-600">92/100</span>
                                  </div>
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