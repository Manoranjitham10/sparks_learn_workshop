
import React, { useState, useEffect } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line, AreaChart, Area, Legend
} from 'recharts';
import {
  Users, School, CheckCircle, Award, Clock, FileText,
  TrendingUp, AlertCircle, Plus, FileDown, Filter, ChevronRight,
  Zap, Target, Activity, Search, Calendar, ChevronDown,
  User, CheckCircle2, XCircle, LayoutGrid, BarChart3, ShieldAlert
} from 'lucide-react';
import { mockService } from '../services/mockService';
import { College, Student, Submission } from '../types';

const Dashboard: React.FC = () => {
  const [allColleges, setAllColleges] = useState<College[]>([]);
  const [allStudents, setAllStudents] = useState<Student[]>([]);
  const [allSubmissions, setAllSubmissions] = useState<Submission[]>([]);

  useEffect(() => {
    const load = async () => {
      setAllColleges(await mockService.getColleges());
      setAllStudents(await mockService.getStudents());
      setAllSubmissions(await mockService.getSubmissions());
    };
    load();
  }, []);

  const renderKPIs = () => {
    return [
      { label: 'Total Universities', value: allColleges.length, icon: School, color: 'bg-indigo-600' },
      { label: 'Active Students', value: allStudents.length, icon: Users, color: 'bg-emerald-500' },
      { label: 'Module Completion', value: '72%', icon: Target, color: 'bg-amber-500' },
      { label: 'Pending Audits', value: allSubmissions.filter(s => s.status === 'Pending').length, icon: Clock, color: 'bg-rose-500' },
    ];
  };

  const exportGlobalCSV = () => {
    const headers = ["College", "Total Students", "Active Status", "Avg Points"];
    const rows = allColleges.map(c => {
      const collegeStudents = allStudents.filter(s => s.collegeId === c.id);
      const avgPoints = (collegeStudents.reduce((a, b) => a + b.totalPoints, 0) / (collegeStudents.length || 1)).toFixed(2);
      return [c.name, c.studentCount, c.status, avgPoints];
    });

    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `Global_Intelligence_Report_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const collegePerformanceData = allColleges.map(c => ({
    name: c.name.split(' ')[0],
    active: Math.floor(Math.random() * 50) + 50,
    platform: 65
  }));

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-4xl font-black text-slate-800 tracking-tight">Intelligence Dashboard</h2>
          <p className="text-slate-500 text-lg font-medium mt-1">Global oversight across the Sparks Learn ecosystem.</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={exportGlobalCSV}
            className="px-6 py-3 bg-white border border-slate-200 text-slate-700 rounded-xl hover:bg-slate-50 font-black text-xs uppercase tracking-widest shadow-sm flex items-center gap-2"
          >
            <FileDown size={16} /> Export Global CSV
          </button>
          <button
            onClick={() => alert("Deep Operational Audit is scheduled for nightly processing.")}
            className="px-6 py-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 font-black text-xs uppercase tracking-widest shadow-xl flex items-center gap-2"
          >
            <BarChart3 size={16} /> Operational Audit
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {renderKPIs().map((stat, idx) => (
          <div key={idx} className="bg-white p-6 rounded-[28px] shadow-sm border border-slate-100 flex items-center gap-5 group hover:shadow-xl transition-all">
            <div className={`w-14 h-14 rounded-2xl ${stat.color} flex items-center justify-center text-white shadow-lg group-hover:scale-110 transition-transform`}>
              <stat.icon size={28} />
            </div>
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-[2px] mb-1">{stat.label}</p>
              <h4 className="text-2xl font-black text-slate-800 leading-none">{stat.value}</h4>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        <div className="xl:col-span-2 bg-white rounded-[32px] shadow-sm border border-slate-200 p-8">
          <div className="flex justify-between items-center mb-10">
            <h3 className="text-lg font-black text-slate-800 uppercase tracking-widest flex items-center gap-3">
              <Activity className="text-indigo-600" /> Comparative Performance Index
            </h3>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-full bg-indigo-600"></div><span className="text-[10px] font-black text-slate-400 uppercase">College</span></div>
              <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-full bg-slate-200"></div><span className="text-[10px] font-black text-slate-400 uppercase">Avg</span></div>
            </div>
          </div>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%" minWidth={0}>
              <BarChart data={collegePerformanceData} barGap={8}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 900 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 900 }} />
                <Tooltip cursor={{ fill: '#f8fafc' }} contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)' }} />
                <Bar dataKey="active" fill="#4f46e5" radius={[6, 6, 0, 0]} barSize={24} />
                <Bar dataKey="platform" fill="#e2e8f0" radius={[6, 6, 0, 0]} barSize={24} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="space-y-8">
          <div className="bg-rose-50 rounded-[32px] border border-rose-100 p-8 flex flex-col">
            <h3 className="text-sm font-black text-rose-800 uppercase tracking-widest flex items-center gap-2 mb-6">
              <ShieldAlert size={18} /> Opportunity Identifiers
            </h3>
            <div className="space-y-4">
              <div className="bg-white p-4 rounded-2xl shadow-sm border border-rose-100 flex items-center gap-4">
                <div className="w-10 h-10 bg-rose-100 text-rose-600 rounded-xl flex items-center justify-center font-black">!</div>
                <div className="flex-1">
                  <p className="text-xs font-black text-slate-800">Low Attendance Trigger</p>
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-tight">Global Valley • 48% Yield</p>
                </div>
              </div>
              <div className="bg-white p-4 rounded-2xl shadow-sm border border-rose-100 flex items-center gap-4">
                <div className="w-10 h-10 bg-amber-100 text-amber-600 rounded-xl flex items-center justify-center font-black">?</div>
                <div className="flex-1">
                  <p className="text-xs font-black text-slate-800">Approval Velocity Lag</p>
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-tight">Future Academy • -15% WoW</p>
                </div>
              </div>
            </div>
            <button
              onClick={() => alert("Risk assessment tools are currently being calibrated.")}
              className="mt-8 py-4 bg-rose-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg hover:bg-rose-700 transition-all">Review Risks</button>
          </div>

          <div className="bg-white rounded-[32px] border border-slate-200 p-8 shadow-sm">
            <h3 className="text-xs font-black text-slate-800 uppercase tracking-widest mb-6">Engagement Density</h3>
            <div className="h-40">
              <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                <PieChart>
                  <Pie data={[{ name: 'High', val: 65 }, { name: 'Mid', val: 25 }, { name: 'Low', val: 10 }]} innerRadius={40} outerRadius={60} paddingAngle={8} dataKey="val">
                    <Cell fill="#4f46e5" />
                    <Cell fill="#818cf8" />
                    <Cell fill="#e2e8f0" />
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
