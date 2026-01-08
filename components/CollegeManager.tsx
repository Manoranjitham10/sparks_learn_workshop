
import React, { useState, useRef, useEffect } from 'react';
import { 
  Plus, School, MapPin, ArrowLeft, Upload, CheckCircle2, 
  Eye, X, Trophy, Activity, Printer, FileDown, 
  ChevronRight, Loader2, Target, Zap, ShieldAlert, 
  AlertTriangle, CheckCircle, Layers, Users, Calendar, Award
} from 'lucide-react';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, Cell, PieChart, Pie, RadarChart, PolarGrid, PolarAngleAxis, 
  Radar, LineChart, Line, Legend, ComposedChart
} from 'recharts';
import { mockService } from '../services/mockService';
import { College, Student, Workshop, Task } from '../types';

/** 
 * PDF PAGE WRAPPER 
 * Ensures page breaks and consistent A4 dimensions for export.
 */
const ReportPage: React.FC<{ children: React.ReactNode; pageNumber: number }> = ({ children, pageNumber }) => (
  <div className="report-page bg-white shadow-sm mb-8 print:mb-0 print:shadow-none relative">
    <div className="flex justify-between items-center mb-8 pb-4 border-b border-slate-100">
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 bg-indigo-900 rounded-lg flex items-center justify-center text-white font-black text-xs">SL</div>
        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Sparks Learn Intel Hub</span>
      </div>
      <span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest italic">Node Audit • Page {pageNumber}</span>
    </div>
    {children}
    <div className="absolute bottom-8 left-10 right-10 flex justify-between items-center pt-4 border-t border-slate-50 print:flex">
        <p className="text-[7px] font-bold text-slate-300 uppercase tracking-widest">Confidential Strategy Document • Sparks Learn Platform</p>
        <p className="text-[7px] font-bold text-slate-300 uppercase tracking-widest">Ref: AUDIT-{Math.floor(Date.now()/1000)}</p>
    </div>
  </div>
);

/**
 * EXECUTIVE CONTENT BLOCK
 * Standardized layout for Patterns and Insights.
 */
const AuditSection: React.FC<{
  title: string;
  subtitle: string;
  pattern: string;
  insight: string;
  meaning: string;
  action: string;
  children: React.ReactNode;
}> = ({ title, subtitle, pattern, insight, meaning, action, children }) => (
  <div className="h-full flex flex-col">
    <div className="mb-6">
      <h3 className="text-xl font-black text-slate-900 tracking-tighter uppercase leading-none">{title}</h3>
      <p className="text-slate-400 font-bold text-[9px] uppercase tracking-widest mt-1.5">{subtitle}</p>
    </div>
    
    <div className="flex-1 min-h-[350px] w-full mb-8 bg-slate-50/40 rounded-[32px] p-6 border border-slate-100">
      {children}
    </div>

    <div className="grid grid-cols-2 gap-4 pt-6 border-t border-slate-100">
      <div className="p-4 bg-indigo-50/50 rounded-2xl border border-indigo-50 space-y-3">
        <div>
          <p className="text-[8px] font-black text-indigo-500 uppercase tracking-widest">1. Pattern Detected</p>
          <p className="text-xs font-bold text-slate-800">{pattern}</p>
        </div>
        <div className="pt-2 border-t border-indigo-100">
          <p className="text-[8px] font-black text-emerald-500 uppercase tracking-widest">2. Intelligence Insight</p>
          <p className="text-xs text-slate-600">{insight}</p>
        </div>
      </div>
      <div className="p-4 bg-slate-900 rounded-2xl border border-slate-800 text-white space-y-3">
        <div>
          <p className="text-[8px] font-black text-indigo-300 uppercase tracking-widest">3. Business Meaning</p>
          <p className="text-xs text-slate-300">{meaning}</p>
        </div>
        <div className="pt-2 border-t border-white/10">
          <p className="text-[8px] font-black text-amber-400 uppercase tracking-widest">4. Strategic Action</p>
          <p className="text-xs font-black text-white underline decoration-amber-400 decoration-2 underline-offset-4">{action}</p>
        </div>
      </div>
    </div>
  </div>
);

const CollegeManager: React.FC = () => {
  const [colleges, setColleges] = useState<College[]>([]);
  const [selectedCollege, setSelectedCollege] = useState<College | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [isStudentDetailOpen, setIsStudentDetailOpen] = useState(false);
  const [activeStudent, setActiveStudent] = useState<any>(null);
  const [students, setStudents] = useState<any[]>([]);
  const [importReport, setImportReport] = useState<{success: number, skipped: number, errors: string[]} | null>(null);
  const [newCollege, setNewCollege] = useState<Partial<College>>({ name: '', location: '', status: 'Active' });
  const [tab, setTab] = useState<'roster' | 'executive'>('roster');
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { loadColleges(); }, []);
  useEffect(() => { if (selectedCollege) loadStudents(); }, [selectedCollege]);

  const loadColleges = async () => { setColleges(await mockService.getColleges()); };
  const loadStudents = () => { if (selectedCollege) setStudents(mockService.getDetailedStudentAudit(selectedCollege.id)); };

  // --- MODULE 1: STICKY CSV IMPORT (FIXED FOR SAMPLE DATA) ---
  const handleImportCSV = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !selectedCollege) return;

    setIsImporting(true);
    const reader = new FileReader();
    reader.onload = async (event) => {
      const text = event.target?.result as string;
      const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 5);
      
      const headerLine = lines[0].toLowerCase();
      if (!headerLine.includes("name") || !headerLine.includes("roll_no")) {
        setImportReport({ success: 0, skipped: lines.length - 1, errors: ["Invalid CSV Headers. Required: name,roll_no,email,dob,college_name"] });
        setIsImporting(false);
        return;
      }

      const existingStudents = await mockService.getStudents();
      const successList: Student[] = [];
      const errorsList: string[] = [];
      let skippedCount = 0;

      lines.slice(1).forEach((line, i) => {
        const parts = line.split(',').map(p => p.trim());
        if (parts.length < 5) { skippedCount++; return; }

        const [studentName, studentRoll, studentEmail, studentDob, collegeLabel] = parts;

        // NORMALIZATION ENGINE (Fixes matching issues)
        const normImport = collegeLabel.toLowerCase().replace(/\s+/g, ' ');
        const normSelected = selectedCollege.name.toLowerCase().replace(/\s+/g, ' ');

        const collegeMatches = normImport === normSelected;
        const isEmailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(studentEmail);
        const isDuplicate = existingStudents.some(s => s.email.toLowerCase() === studentEmail.toLowerCase());

        if (collegeMatches && isEmailValid && !isDuplicate) {
          successList.push({
            id: `s-${Date.now()}-${i}`,
            name: studentName, 
            roll_no: studentRoll, 
            email: studentEmail, 
            dob: studentDob, 
            collegeId: selectedCollege.id,
            totalPoints: 0, 
            badges: [], 
            tasksCompleted: 0, 
            attendance: 0
          });
        } else {
          if (!collegeMatches) errorsList.push(`Row ${i+2}: College Name mismatch ("${collegeLabel}" vs "${selectedCollege.name}")`);
          else if (!isEmailValid) errorsList.push(`Row ${i+2}: Invalid Email`);
          else if (isDuplicate) errorsList.push(`Row ${i+2}: Duplicate User`);
          skippedCount++;
        }
      });

      if (successList.length > 0) await mockService.addStudents(successList);
      setImportReport({ success: successList.length, skipped: skippedCount, errors: errorsList });
      setIsImporting(false);
      loadStudents();
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  // --- MODULE 2: STRUCTURED CSV EXPORT ---
  const handleExportCSV = async () => {
    if (!selectedCollege) return;
    const studentsData = mockService.getDetailedStudentAudit(selectedCollege.id);
    const headers = [
      "name", "roll_no", "email", "dob", "college_name", "workshop_name", 
      "workshop_duration", "total_points", "tasks_completed", "tasks_assigned", 
      "attendance_percentage", "rank", "submission_quality_score", "last_active_date"
    ];
    const rows = studentsData.map(s => [
      `"${s.name}"`, `"${s.roll_no}"`, `"${s.email}"`, `"${s.dob}"`, `"${selectedCollege.name}"`,
      "Module A", "7 Days", s.totalPoints, s.tasksCompleted, 10, `${s.attendance}%`, s.globalRank, "90%", "2024-05-20"
    ]);
    const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `Registry_Audit_${selectedCollege.name.replace(/\s+/g, '_')}.csv`;
    link.click();
  };

  // --- MODULE 3: 6-PAGE EXECUTIVE PDF REPORT ---
  const renderExecutivePDF = () => {
    if (!selectedCollege) return null;
    const analytics = mockService.getCollegeVisualAnalytics(selectedCollege.id);
    const dailyData = analytics.visuals.dailyEngagement.map((v, i) => ({ d: `D${i+1}`, v }));
    const workshopData = analytics.visuals.workshopPerformance;
    const radarData = [ { subject: 'Attend', A: 88, B: 75 }, { subject: 'Task', A: 75, B: 80 }, { subject: 'Quality', A: 92, B: 85 }, { subject: 'Velo', A: 60, B: 70 }, { subject: 'Engagement', A: 85, B: 82 } ];

    return (
      <div className="print:block no-scrollbar bg-slate-50 p-6 print:p-0">
        
        {/* PAGE 1: EXECUTIVE SUMMARY */}
        <ReportPage pageNumber={1}>
           <div className="bg-slate-900 rounded-[32px] p-12 text-white shadow-2xl relative overflow-hidden h-[400px] flex flex-col justify-center mb-10">
              <div className="absolute top-0 right-0 p-12 opacity-5"><Activity size={320} /></div>
              <div className="relative z-10">
                 <h2 className="text-5xl font-black tracking-tighter uppercase mb-4 leading-none">Node Performance Audit</h2>
                 <p className="text-indigo-400 font-bold uppercase tracking-[6px] text-xs mb-12">Intelligence Hub Season Audit • {selectedCollege.name}</p>
                 <div className="grid grid-cols-4 gap-10">
                    {[
                      { l: 'Enrollment', v: analytics.kpis.totalStudents, c: 'text-white' },
                      { l: 'Active Yield', v: analytics.kpis.activePercentage + '%', c: 'text-emerald-400' },
                      { l: 'Attendance', v: analytics.kpis.avgAttendance + '%', c: 'text-indigo-400' },
                      { l: 'Node Rank', v: '#' + analytics.kpis.globalRank, c: 'text-amber-400' }
                    ].map((k, i) => (
                      <div key={i} className="space-y-1">
                         <p className="text-[9px] font-black text-white/30 uppercase tracking-widest">{k.l}</p>
                         <h4 className={`text-4xl font-black ${k.c}`}>{k.v}</h4>
                      </div>
                    ))}
                 </div>
              </div>
           </div>
           <div className="grid grid-cols-3 gap-6">
              <div className="p-6 bg-slate-50 border border-slate-100 rounded-3xl">
                 <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2">Trend Velocity</p>
                 <div className="h-20"><ResponsiveContainer><AreaChart data={dailyData}><Area type="monotone" dataKey="v" stroke="#4f46e5" fill="#4f46e5" fillOpacity={0.1}/></AreaChart></ResponsiveContainer></div>
              </div>
              <div className="col-span-2 p-8 bg-white border border-slate-200 rounded-[32px] flex flex-col justify-center">
                 <h4 className="text-[10px] font-black text-slate-900 uppercase tracking-widest mb-4 flex items-center gap-2"><ShieldAlert size={14} className="text-indigo-600"/> Audit Summary</h4>
                 <p className="text-sm text-slate-600 leading-relaxed italic">"Performance data indicates a high-yield institutional cycle with a 12% lead over platform averages in technical submission quality. Attendance remains the primary volatility risk."</p>
              </div>
           </div>
        </ReportPage>

        {/* PAGE 2: PARTICIPATION LIFECYCLE */}
        <ReportPage pageNumber={2}>
           <AuditSection 
             title="Participation Lifecycle" subtitle="Engagement Decay per Module"
             pattern="Engagement peaks at Day 2 and drops by 18% during cycle transitions."
             insight="Students exhibits 'Burst Learning'—high intensity followed by total silence."
             meaning="The academic load is being perceived as 'crunch-heavy' rather than a steady flow."
             action="Restructure next phase into 48-hour sprints to prevent mid-cycle burnout."
           >
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={dailyData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="d" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 10}} />
                  <YAxis hide />
                  <Tooltip cursor={{fill: '#f1f5f9'}} />
                  <Area type="monotone" dataKey="v" fill="#4f46e5" fillOpacity={0.05} stroke="#4f46e5" strokeWidth={4} />
                  <Bar dataKey="v" barSize={12} fill="#e2e8f0" radius={[4, 4, 0, 0]} />
                </ComposedChart>
              </ResponsiveContainer>
           </AuditSection>
        </ReportPage>

        {/* PAGE 3: TASK FULFILLMENT */}
        <ReportPage pageNumber={3}>
           <AuditSection 
             title="Task Fulfillment Logic" subtitle="Submission Ratios vs Complexity"
             pattern="30% of students ignore optional documentation but finish 95% of code."
             insight="Motivation is purely credential-driven; non-scored tasks are largely skipped."
             meaning="The cohort is producing 'Implementers' rather than well-rounded 'Architects'."
             action="Mandate documentation as a prerequisite for high-tier badge unlocking."
           >
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={workshopData} layout="vertical">
                  <XAxis type="number" hide />
                  <YAxis dataKey="title" type="category" width={110} tick={{fontSize: 9, fontWeight: 900, fill: '#64748b'}} axisLine={false} tickLine={false} />
                  <Bar dataKey="completion" stackId="a" fill="#4f46e5" radius={[0, 0, 0, 0]} barSize={24} name="Fulfilled" />
                  <Bar dataKey="participation" stackId="a" fill="#cbd5e1" radius={[0, 12, 12, 0]} barSize={24} name="Deferred" />
                </BarChart>
              </ResponsiveContainer>
           </AuditSection>
        </ReportPage>

        {/* PAGE 4: SUBMISSION QUALITY */}
        <ReportPage pageNumber={4}>
           <AuditSection 
             title="Submission Quality Audit" subtitle="Review Outcomes & Approval Ratios"
             pattern="Approval rate (78%) is steady, but rejections spike in 'Intermediate' modules."
             insight="Instructional material for Intermediate modules is too abstract for this cohort."
             meaning="There is a 'Complexity Wall' that needs a technical bridge."
             action="Deploy mandatory micro-instructional videos for all 'Intermediate' difficulty tasks."
           >
              <div className="grid grid-cols-2 h-full items-center">
                 <div className="h-full">
                    <ResponsiveContainer width="100%" height="100%">
                       <PieChart>
                          <Pie data={[ { n: 'Approve', v: 78, c: '#10b981' }, { n: 'Reject', v: 12, c: '#f43f5e' }, { n: 'Wait', v: 10, c: '#f59e0b' } ]} dataKey="v" innerRadius={70} outerRadius={95} paddingAngle={8} stroke="none">
                             {[ '#10b981', '#f43f5e', '#f59e0b' ].map((c, i) => <Cell key={i} fill={c} />)}
                          </Pie>
                       </PieChart>
                    </ResponsiveContainer>
                 </div>
                 <div className="space-y-4">
                    {[ { l: 'Approved', v: '78%' }, { l: 'Rejected', v: '12%' }, { l: 'Pending', v: '10%' } ].map((d, i) => (
                      <div key={i} className="flex justify-between items-center p-5 bg-white border border-slate-100 rounded-2xl shadow-sm">
                         <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{d.l}</span>
                         <span className="text-xl font-black text-slate-800">{d.v}</span>
                      </div>
                    ))}
                 </div>
              </div>
           </AuditSection>
        </ReportPage>

        {/* PAGE 5: GAMIFICATION RESPONSE */}
        <ReportPage pageNumber={5}>
           <AuditSection 
             title="Competitive Dynamics" subtitle="Rank Movement & Points Velocity"
             pattern="Global Rank shows upward mobility (↑9 slots) despite steady points."
             insight="This college is out-performing others in 'Points per Active Student' efficiency."
             meaning="The cohort is highly competitive, reacting strongly to public leaderboard changes."
             action="Introduce 'Intra-College' micro-leagues to sustain this internal momentum."
           >
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={analytics.visuals.rankHistory.map((r,i)=>({day:i,rank:r}))}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="day" hide />
                  <YAxis reversed domain={[0, 20]} axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 10, fontWeight: 900}} />
                  <Line type="step" dataKey="rank" stroke="#4f46e5" strokeWidth={6} dot={{r: 8, fill: '#fff', stroke: '#4f46e5', strokeWidth: 4}} />
                </LineChart>
              </ResponsiveContainer>
           </AuditSection>
        </ReportPage>

        {/* PAGE 6: RISK BENCHMARKING */}
        <ReportPage pageNumber={6}>
           <AuditSection 
             title="Strategic Risk Matrix" subtitle="Platform Comparison & Churn Vulnerability"
             pattern="Leading in Quality (92) but lagging in Submission Velocity (60)."
             insight="Students are 'Perfection-Focused', delaying submissions to ensure high scores."
             meaning="High risk of deadline-bottlenecking causing mass stress and late failures."
             action="Shift grading rubric to reward 'Early Drafts' with 20% of total point weight."
           >
              <div className="grid grid-cols-2 gap-10 h-full">
                 <div className="h-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <RadarChart data={radarData}>
                        <PolarGrid stroke="#f1f5f9" />
                        <PolarAngleAxis dataKey="subject" tick={{fill: '#94a3b8', fontSize: 10, fontWeight: 900}} />
                        <Radar name="College" dataKey="A" stroke="#4f46e5" fill="#4f46e5" fillOpacity={0.6} />
                        <Radar name="Platform" dataKey="B" stroke="#cbd5e1" fill="#cbd5e1" fillOpacity={0.2} />
                      </RadarChart>
                    </ResponsiveContainer>
                 </div>
                 <div className="space-y-4 flex flex-col justify-center">
                    <div className="p-6 bg-rose-50 border border-rose-100 rounded-[28px] flex items-start gap-4">
                       <AlertTriangle className="text-rose-500" />
                       <div><h4 className="font-black text-rose-800 text-[10px] uppercase mb-1">Risk: Churn Potential</h4><p className="text-[10px] text-rose-600 leading-relaxed font-medium">"22% of students show activity decline after missed tasks. HIGH RISK."</p></div>
                    </div>
                    <div className="p-6 bg-indigo-50 border border-indigo-100 rounded-[28px] flex items-start gap-4">
                       <Award className="text-indigo-500" />
                       <div><h4 className="font-black text-indigo-800 text-[10px] uppercase mb-1">Strength: Academic Quality</h4><p className="text-[10px] text-indigo-600 leading-relaxed font-medium">"Top 5% of students are outperforming global node averages by 40%."</p></div>
                    </div>
                 </div>
              </div>
           </AuditSection>
        </ReportPage>
      </div>
    );
  };

  const handleRegisterCollege = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCollege.name || !newCollege.location) return;
    await mockService.addCollege({ 
      id: `c${Date.now()}`, 
      name: newCollege.name, 
      location: newCollege.location, 
      studentCount: 0, 
      adminName: 'Admin', 
      status: 'Active' 
    });
    loadColleges();
    setIsModalOpen(false);
    setNewCollege({ name: '', location: '', status: 'Active' });
  };

  const renderCollegeDetail = () => {
    if (!selectedCollege) return null;
    return (
      <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
        <div className="bg-white rounded-3xl shadow-sm border border-slate-200 p-8 no-print">
          <button onClick={() => setSelectedCollege(null)} className="flex items-center gap-2 text-sm font-bold text-slate-400 hover:text-indigo-600 transition-all mb-6 uppercase tracking-wider"><ArrowLeft size={16} /> Back to Hub</button>
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
            <div className="flex items-center gap-6">
              <div className="w-16 h-16 bg-slate-100 text-slate-600 rounded-2xl flex items-center justify-center border border-slate-200 shadow-sm"><School size={32} /></div>
              <div><h2 className="text-2xl font-bold text-slate-800">{selectedCollege.name}</h2><p className="text-slate-500 text-sm flex items-center gap-1 font-medium"><MapPin size={14} className="text-indigo-500" /> {selectedCollege.location}</p></div>
            </div>
            <div className="flex bg-slate-100 p-1 rounded-xl">
               <button onClick={() => setTab('roster')} className={`px-6 py-2 text-[10px] font-black rounded-lg transition-all uppercase tracking-wider ${tab === 'roster' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500'}`}>Registry</button>
               <button onClick={() => setTab('executive')} className={`px-6 py-2 text-[10px] font-black rounded-lg transition-all uppercase tracking-wider ${tab === 'executive' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500'}`}>Executive Audit</button>
            </div>
          </div>
        </div>

        {tab === 'roster' ? (
          <div className="bg-white rounded-[40px] border border-slate-200 shadow-sm overflow-hidden no-print">
            <div className="p-10 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <div><h3 className="text-2xl font-black text-slate-800 tracking-tighter uppercase">Student Onboarding</h3><p className="text-slate-500 text-xs font-bold uppercase tracking-widest mt-1">Manage Institutional Enrollment</p></div>
              <div className="flex gap-4">
                <button disabled={isImporting} onClick={() => fileInputRef.current?.click()} className="px-8 py-3 bg-indigo-600 text-white rounded-2xl text-[10px] font-black uppercase shadow-xl hover:bg-indigo-700 transition-all flex items-center gap-2">
                   {isImporting ? <Loader2 size={14} className="animate-spin" /> : <Upload size={14} />} Import Students (CSV)
                </button>
                <input type="file" ref={fileInputRef} className="hidden" accept=".csv" onChange={handleImportCSV} />
              </div>
            </div>

            {importReport && (
              <div className="m-8 p-6 bg-slate-900 rounded-3xl text-white flex flex-col gap-4 animate-in slide-in-from-top-4">
                 <div className="flex justify-between items-center">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center"><CheckCircle2 className="text-emerald-400" /></div>
                      <div><p className="font-black uppercase tracking-widest text-[10px] text-indigo-300">Import Report</p><p className="text-sm font-bold">{importReport.success} added. {importReport.skipped} skipped.</p></div>
                    </div>
                    <button onClick={() => setImportReport(null)} className="text-white/40 hover:text-white"><X size={20}/></button>
                 </div>
                 {importReport.errors.length > 0 && (
                   <div className="p-4 bg-white/5 rounded-xl border border-white/10 text-[10px] font-mono text-slate-400 space-y-1 overflow-y-auto max-h-32">
                      {importReport.errors.map((err, i) => <p key={i}>• {err}</p>)}
                   </div>
                 )}
              </div>
            )}

            <div className="overflow-x-auto"><table className="w-full text-left"><thead className="bg-slate-50 text-slate-400 border-b border-slate-100"><tr><th className="px-10 py-5 font-black uppercase tracking-widest text-[10px]">Student Identity</th><th className="px-10 py-5 font-black uppercase tracking-widest text-[10px]">Roll Node</th><th className="px-10 py-5 font-black uppercase tracking-widest text-[10px]">Audit Points</th><th className="px-10 py-5 font-black uppercase tracking-widest text-[10px] text-right">Actions</th></tr></thead><tbody className="divide-y divide-slate-100">{students.map(s => (<tr key={s.id} className="hover:bg-slate-50 transition-colors group"><td className="px-10 py-6"><div className="flex items-center gap-4"><div className="w-12 h-12 bg-slate-100 text-slate-500 rounded-2xl flex items-center justify-center font-black text-sm group-hover:bg-indigo-600 group-hover:text-white transition-all shadow-sm">{s.name.charAt(0)}</div><div><p className="font-black text-slate-800">{s.name}</p><p className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">{s.email}</p></div></div></td><td className="px-10 py-6 font-black text-slate-500 tracking-tighter text-sm uppercase">{s.roll_no}</td><td className="px-10 py-6 font-black text-indigo-600 text-lg">{s.totalPoints} <span className="text-[10px] text-slate-400">PTS</span></td><td className="px-10 py-6 text-right"><button onClick={() => { setActiveStudent(s); setIsStudentDetailOpen(true); }} className="p-3 text-slate-300 hover:text-indigo-600 hover:bg-indigo-50 rounded-2xl transition-all shadow-sm bg-white border border-slate-100"><Eye size={18} /></button></td></tr>))}</tbody></table></div>
          </div>
        ) : (
          <div className="animate-in fade-in duration-500">
            <div className="flex justify-between items-center mb-8 no-print">
               <div><h3 className="text-2xl font-black text-slate-800 tracking-tighter uppercase">Board Audit Center</h3><p className="text-slate-500 text-sm font-medium">Downloadable high-fidelity institutional audits.</p></div>
               <div className="flex gap-4">
                  <button onClick={handleExportCSV} className="px-6 py-3 bg-white border border-slate-200 rounded-2xl text-[10px] font-black uppercase text-slate-600 hover:bg-slate-50 shadow-sm flex items-center gap-2"><FileDown size={14} /> Download Audit CSV</button>
                  <button onClick={() => window.print()} className="px-10 py-3 bg-slate-900 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl hover:bg-black flex items-center gap-3"><Printer size={16} /> Print Executive PDF</button>
               </div>
            </div>
            {renderExecutivePDF()}
          </div>
        )}

        {isStudentDetailOpen && activeStudent && (
          <div className="fixed inset-0 bg-black/60 z-[100] flex items-center justify-center p-6 backdrop-blur-md animate-in fade-in duration-300 no-print">
             <div className="bg-white w-full max-w-2xl rounded-[40px] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
                <div className="bg-slate-900 p-12 text-white relative overflow-hidden">
                   <div className="relative z-10 flex gap-6 items-center"><div className="w-20 h-20 bg-indigo-600 rounded-3xl flex items-center justify-center font-black text-3xl border-4 border-white/10 shadow-2xl">{activeStudent.name.charAt(0)}</div><div><h3 className="text-3xl font-black tracking-tighter uppercase">{activeStudent.name}</h3><p className="text-indigo-300 font-bold uppercase tracking-widest text-xs">{activeStudent.roll_no} • {activeStudent.email}</p></div></div>
                   <button onClick={() => setIsStudentDetailOpen(false)} className="absolute top-10 right-10 text-white/30 hover:text-white transition-colors"><X size={24}/></button>
                </div>
                <div className="p-12 space-y-10">
                   <div className="grid grid-cols-2 gap-6"><div className="p-8 bg-slate-50 border border-slate-100 rounded-3xl"><p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Onboarding Date</p><p className="text-xl font-black text-slate-800">{activeStudent.dob}</p></div><div className="p-8 bg-slate-50 border border-slate-100 rounded-3xl"><p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Global Standing</p><p className="text-xl font-black text-indigo-600">#{activeStudent.globalRank || 'N/A'}</p></div></div>
                   <button onClick={() => setIsStudentDetailOpen(false)} className="w-full py-5 bg-slate-900 text-white font-black text-xs uppercase tracking-widest rounded-2xl hover:bg-black transition-all">Close Profile Audit</button>
                </div>
             </div>
          </div>
        )}
      </div>
    );
  };

  const renderCollegeList = () => (
    <div className="space-y-8 animate-in fade-in duration-500 no-print">
      <div className="flex justify-between items-end">
        <div><h2 className="text-4xl font-black text-slate-800 tracking-tighter uppercase">University Ecosystem</h2><p className="text-slate-500 font-medium text-lg">Platform Nodes & Institutional Partners.</p></div>
        <button onClick={() => setIsModalOpen(true)} className="flex items-center gap-2 px-10 py-4 bg-indigo-600 text-white rounded-[20px] hover:bg-indigo-700 shadow-2xl font-black text-xs uppercase tracking-widest transition-all hover:-translate-y-1"><Plus size={20} /> Register Partner</button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
        {colleges.map((college) => (
          <div key={college.id} className="bg-white rounded-[40px] shadow-sm border border-slate-200 overflow-hidden hover:shadow-2xl hover:-translate-y-2 transition-all group cursor-pointer" onClick={() => setSelectedCollege(college)}>
            <div className="p-10">
              <div className="flex justify-between items-start mb-8"><div className="w-14 h-14 bg-slate-50 text-slate-400 rounded-2xl group-hover:bg-indigo-600 group-hover:text-white transition-all flex items-center justify-center border border-slate-200 shadow-sm"><School size={28} /></div><span className={`text-[10px] font-black uppercase tracking-[3px] px-4 py-1.5 rounded-full border ${college.status === 'Active' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 'bg-slate-50 text-slate-500 border-slate-200'}`}>{college.status}</span></div>
              <h3 className="text-2xl font-black text-slate-800 mb-2 group-hover:text-indigo-600 transition-colors leading-tight uppercase tracking-tighter">{college.name}</h3><p className="text-sm text-slate-500 flex items-center gap-1 font-bold"><MapPin size={16} className="text-indigo-500" /> {college.location}</p>
            </div>
            <div className="px-10 py-5 bg-slate-50/50 flex justify-between items-center border-t border-slate-100 group-hover:bg-indigo-50 transition-all text-[10px] font-black text-slate-400 group-hover:text-indigo-600 uppercase tracking-[4px]">Access Operational Node <ChevronRight size={18} className="text-slate-300 group-hover:text-indigo-600 group-hover:translate-x-1 transition-all" /></div>
          </div>
        ))}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 z-[100] flex items-center justify-center p-6 backdrop-blur-md animate-in fade-in duration-300">
          <div className="bg-white w-full max-w-md rounded-[40px] shadow-2xl p-12 animate-in zoom-in-95 duration-300">
             <div className="flex justify-between items-start mb-8"><h3 className="text-2xl font-black text-slate-800 uppercase tracking-tighter">Initialize Node</h3><button onClick={() => setIsModalOpen(false)} className="text-slate-300 hover:text-slate-600 transition-colors"><X size={24} /></button></div>
             <form onSubmit={handleRegisterCollege} className="space-y-6">
                <div className="space-y-2"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">University Name</label><input required type="text" value={newCollege.name || ''} onChange={e => setNewCollege({...newCollege, name: e.target.value})} className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold focus:ring-4 focus:ring-indigo-500/10 outline-none" placeholder="e.g. ABC Technology Institute" /></div>
                <div className="space-y-2"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Geographic Location</label><input required type="text" value={newCollege.location || ''} onChange={e => setNewCollege({...newCollege, location: e.target.value})} className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold focus:ring-4 focus:ring-indigo-500/10 outline-none" placeholder="City, State" /></div>
                <button type="submit" className="w-full py-5 bg-slate-900 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-2xl hover:bg-black transition-all mt-4">Initialize University Node</button>
             </form>
          </div>
        </div>
      )}
    </div>
  );

  return selectedCollege ? renderCollegeDetail() : renderCollegeList();
};

export default CollegeManager;
