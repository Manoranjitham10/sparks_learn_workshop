
import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  School,
  Users,
  BarChart3,
  PieChart,
  ArrowLeft,
  MapPin,
  ChevronRight,
  Search,
  Plus,
  Eye,
  X,
  FileText,
  Calendar,
  Award,
  Clock,
  Briefcase,
  Activity,
  User as UserIcon,
  Upload,
  UserPlus,
  AlertCircle,
  CheckCircle2,
  Loader2,
  Download,
  Printer,
  FileDown,
  Target,
  Zap,
  TrendingUp,
  AlertTriangle,
  Filter,
  Shield as ShieldIcon,
  UserCircle,
  Trash2,
  CheckSquare,
  Square,
  LogOut
} from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, Cell, PieChart as RechartPie, Pie, RadarChart, PolarGrid, PolarAngleAxis,
  Radar, LineChart, Line, Legend, ComposedChart
} from 'recharts';
import { mockService } from '../services/mockService';
import { registerStudentInFirebase, deleteStudentFromFirebase, fetchStudentsFromFirebase, fetchCollegesFromFirebase, registerCollegeInFirebase } from '../services/studentService';
import { College, Student } from '../types';

type SubTab = 'students' | 'reports' | 'stats';

/** 
 * PDF PAGE WRAPPER 
 * Ensures page breaks and consistent A4 dimensions for export.
 */
const ReportPage: React.FC<{ children: React.ReactNode; pageNumber: number }> = ({ children, pageNumber }) => (
  <div className="report-page bg-white shadow-sm mb-8 print:mb-0 print:shadow-none relative p-12 border border-slate-100 rounded-[40px] overflow-hidden break-inside-avoid">
    <div className="flex justify-between items-center mb-8 pb-4 border-b border-slate-100">
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 bg-indigo-900 rounded-lg flex items-center justify-center text-white font-black text-xs">SL</div>
        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Sparks Learn Intel Hub</span>
      </div>
      <span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest italic">Executive Node Audit • Page {pageNumber}</span>
    </div>
    {children}
    <div className="absolute bottom-8 left-12 right-12 flex justify-between items-center pt-4 border-t border-slate-50 print:flex">
      <p className="text-[7px] font-bold text-slate-300 uppercase tracking-widest">Confidential Strategy Document • Sparks Learn Platform</p>
      <p className="text-[7px] font-bold text-slate-300 uppercase tracking-widest">Ref: AUDIT-{Math.floor(Date.now() / 1000)}</p>
    </div>
  </div>
);

/**
 * EXECUTIVE AUDIT BLOCK
 */
const AuditInsight: React.FC<{
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

    <div className="flex-1 min-h-[300px] w-full mb-8 bg-slate-50/40 rounded-[32px] p-6 border border-slate-100">
      {children}
    </div>

    <div className="grid grid-cols-2 gap-4 pt-6 border-t border-slate-100">
      <div className="p-5 bg-indigo-50/50 rounded-2xl border border-indigo-50 space-y-4">
        <div>
          <p className="text-[8px] font-black text-indigo-500 uppercase tracking-widest mb-1">Pattern Detected</p>
          <p className="text-[11px] font-bold text-slate-800 leading-tight">{pattern}</p>
        </div>
        <div>
          <p className="text-[8px] font-black text-emerald-500 uppercase tracking-widest mb-1">Intelligence Insight</p>
          <p className="text-[11px] text-slate-600 leading-tight">{insight}</p>
        </div>
      </div>
      <div className="p-5 bg-slate-900 rounded-2xl border border-slate-800 text-white space-y-4 shadow-xl">
        <div>
          <p className="text-[8px] font-black text-indigo-300 uppercase tracking-widest mb-1">Business Meaning</p>
          <p className="text-[11px] text-slate-300 leading-tight">{meaning}</p>
        </div>
        <div>
          <p className="text-[8px] font-black text-amber-400 uppercase tracking-widest mb-1">Strategic Action</p>
          <p className="text-[11px] font-black text-white underline decoration-amber-400 decoration-2 underline-offset-4">{action}</p>
        </div>
      </div>
    </div>
  </div>
);

const CMS: React.FC = () => {
  const [colleges, setColleges] = useState<College[]>([]);
  const [selectedCollege, setSelectedCollege] = useState<College | null>(null);
  const [activeSubTab, setActiveSubTab] = useState<SubTab>('students');
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStudent, setSelectedStudent] = useState<any | null>(null);
  const [students, setStudents] = useState<any[]>([]);
  const [showExecutiveReport, setShowExecutiveReport] = useState(false);

  const [selectedStudentIds, setSelectedStudentIds] = useState<Set<string>>(new Set());
  const [isDeleting, setIsDeleting] = useState(false);

  const [isManualModalOpen, setIsManualModalOpen] = useState(false);
  const [isAddCollegeModalOpen, setIsAddCollegeModalOpen] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [importFeedback, setImportFeedback] = useState<{ success: number; errors: string[] } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Stats Tab Filtering
  const [statsFilter, setStatsFilter] = useState<'All' | 'High' | 'Low'>('All');

  const [manualStudent, setManualStudent] = useState({
    name: '',
    roll_no: '',
    email: '',
    dob: ''
  });

  const [newCollegeData, setNewCollegeData] = useState({
    name: '',
    location: '',
    adminName: ''
  });

  const loadData = async () => {
    setLoading(true);
    // FETCH COLLEGES FROM FIREBASE
    const data = await fetchCollegesFromFirebase();
    // If no colleges in DB, maybe fallback to mock or just empty? 
    // For now, let's mix or just use DB. If DB is empty, user needs to create one.
    if (data.length === 0) {
      const mocks = await mockService.getColleges();
      // Optional: Auto-seed? No, let's just stick to what we pull. 
      // If we want to move away from mock completely, we rely on DB.
      setColleges(mocks); // Fallback for demo if DB empty
    } else {
      setColleges(data);
    }
    setLoading(false);
  };

  const loadStudents = async () => {
    if (selectedCollege) {
      setLoading(true);
      // FETCH FROM FIREBASE (Single Source of Truth)
      const firebaseData = await fetchStudentsFromFirebase(selectedCollege.id);

      // If Firebase is empty, maybe fallback to mock? Or just show empty.
      // For now, let's map the Firebase data to the UI's expected format.
      // We need to generate the "Detailed Mock Metrics" on the fly since they don't exist in DB yet.

      const enhancedData = firebaseData.map((s, idx) => ({
        ...s,
        // Default/Calculated fields for UI Demo since these aren't in Student schema yet
        workshopName: (s as any).workshopName || (idx % 2 === 0 ? 'React & AI Masterclass' : 'Advanced Architecture'),
        workshopDuration: '12 Weeks',
        tasksAssigned: 15,
        totalPoints: s.totalPoints || 0,
        tasksCompleted: s.tasksCompleted || 0,
        attendance: s.attendance || 0,
        submissionQualityScore: `${85 + (idx % 15)}%`,
        lastActiveDate: 'Oct 24, 2024',
        globalRank: idx + 10,
        // Ensure ID is string
        id: s.id
      }));
      setStudents(enhancedData);
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, []);
  useEffect(() => { loadStudents(); }, [selectedCollege]);

  const filteredStudents = useMemo(() => {
    return students.filter(s =>
      s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.roll_no.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [students, searchQuery]);

  const handleExportPerformanceCSV = () => {
    if (!selectedCollege || students.length === 0) return;
    const headers = ["Student Name", "Roll No", "Email", "DOB", "College Name", "Workshop Name", "Workshop Duration", "Total Points", "Tasks Assigned", "Tasks Completed", "Attendance Percentage", "Rank", "Submission Quality Score", "Last Active Date"];
    const rows = students.map(s => [
      s.name, s.roll_no, s.email, s.dob, selectedCollege.name, s.workshopName, s.workshopDuration, s.totalPoints, s.tasksAssigned, s.tasksCompleted, `${s.attendance}%`, s.globalRank, s.submissionQualityScore, s.lastActiveDate
    ]);
    const csvContent = [headers.join(','), ...rows.map(r => r.map(val => `"${val}"`).join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `Performance_Audit_${selectedCollege.name.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleManualSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCollege) return;
    const newStudent: Student = {
      id: `s-manual-${Date.now()}`,
      name: manualStudent.name,
      roll_no: manualStudent.roll_no,
      email: manualStudent.email,
      dob: manualStudent.dob,
      collegeId: selectedCollege.id,
      totalPoints: 0,
      badges: [],
      tasksCompleted: 0,
      attendance: 0
    };
    // Sync to Firebase
    const result = await registerStudentInFirebase(newStudent);
    if (!result.success) {
      alert(`Firebase Sync Failed: ${result.error}`);
    } else {
      alert('Student synced to Firebase successfully!');
    }

    await loadStudents();
    setIsManualModalOpen(false);
    setManualStudent({ name: '', roll_no: '', email: '', dob: '' });
  };

  const handleRegisterCollege = async (e: React.FormEvent) => {
    e.preventDefault();
    const college: College = {
      id: `c-${Date.now()}`,
      name: newCollegeData.name,
      location: newCollegeData.location,
      adminName: newCollegeData.adminName,
      studentCount: 0,
      status: 'Active'
    };

    // Save to Firebase
    await registerCollegeInFirebase(college);
    // Also update local mock for safety if we are falling back
    await mockService.addCollege(college);

    await loadData();
    setIsAddCollegeModalOpen(false);
    setNewCollegeData({ name: '', location: '', adminName: '' });
  };

  const handleImportCSV = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !selectedCollege) return;
    setIsImporting(true);
    const reader = new FileReader();
    reader.onload = async (event) => {
      const text = event.target?.result as string;
      const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 0);
      if (lines.length <= 1) {
        setImportFeedback({ success: 0, errors: ["CSV is empty or missing data rows."] });
        setIsImporting(false);
        return;
      }
      const headers = lines[0].toLowerCase().split(',').map(h => h.trim());
      const expectedHeaders = ['name', 'roll_no', 'email', 'dob', 'college_name'];
      const missingHeaders = expectedHeaders.filter(h => !headers.includes(h));
      if (missingHeaders.length > 0) {
        setImportFeedback({ success: 0, errors: [`Missing columns: ${missingHeaders.join(', ')}`] });
        setIsImporting(false);
        return;
      }

      const nameIdx = headers.indexOf('name');
      const rollIdx = headers.indexOf('roll_no');
      const emailIdx = headers.indexOf('email');
      const dobIdx = headers.indexOf('dob');
      const collegeIdx = headers.indexOf('college_name');

      const newStudents: Student[] = [];
      const errorsList: string[] = [];
      const normalize = (str: string) => str.toLowerCase().replace(/\s+/g, ' ').trim();
      const currentCollegeNameNorm = normalize(selectedCollege.name);

      lines.slice(1).forEach((line, i) => {
        const parts = line.split(',').map(p => p.trim());
        if (parts.length < expectedHeaders.length) return;
        const csvCollegeNameNorm = normalize(parts[collegeIdx]);
        if (csvCollegeNameNorm === currentCollegeNameNorm) {
          newStudents.push({
            id: `s-${Date.now()}-${i}`,
            name: parts[nameIdx],
            roll_no: parts[rollIdx],
            email: parts[emailIdx],
            dob: parts[dobIdx],
            collegeId: selectedCollege.id,
            totalPoints: 0,
            badges: [],
            tasksCompleted: 0,
            attendance: 0
          });
        } else {
          errorsList.push(`Row ${i + 2}: College mismatch ("${parts[collegeIdx]}" vs "${selectedCollege.name}")`);
        }
      });
      if (newStudents.length > 0) {
        // Sync to Firebase
        let syncSuccessCount = 0;
        const syncErrors: string[] = [];

        for (const student of newStudents) {
          const result = await registerStudentInFirebase(student);
          if (result.success) {
            syncSuccessCount++;
          } else {
            syncErrors.push(`Failed to sync ${student.name}: ${result.error}`);
          }
        }

        if (syncErrors.length > 0) {
          errorsList.push(...syncErrors);
        }

        await loadStudents();
        setImportFeedback({ success: syncSuccessCount, errors: errorsList });
      } else {
        setImportFeedback({ success: 0, errors: errorsList });
      }
      setIsImporting(false);
    };
    reader.readAsText(file);
    e.target.value = '';
  };



  const toggleStudentSelection = (studentId: string) => {
    const newSelection = new Set(selectedStudentIds);
    if (newSelection.has(studentId)) {
      newSelection.delete(studentId);
    } else {
      newSelection.add(studentId);
    }
    setSelectedStudentIds(newSelection);
  };

  const toggleAllSelection = () => {
    if (selectedStudentIds.size === filteredStudents.length) {
      setSelectedStudentIds(new Set());
    } else {
      setSelectedStudentIds(new Set(filteredStudents.map(s => s.id)));
    }
  };

  const handleDelete = async (studentId: string) => {
    setIsDeleting(true);

    // 1. Delete from Firebase
    const student = students.find(s => s.id === studentId);
    const firebaseId = student?.uid || studentId;
    const result = await deleteStudentFromFirebase(firebaseId, student?.email);
    if (!result.success) {
      // Use the returned error which is now user-friendly for permissions
      alert(result.error || "Failed to delete from Firebase.");
    }

    // 3. Update UI
    setStudents(prev => prev.filter(s => s.id !== studentId));
    setSelectedStudentIds(prev => {
      const next = new Set(prev);
      next.delete(studentId);
      return next;
    });
    setIsDeleting(false);
  };

  const handleBulkDelete = async () => {
    if (selectedStudentIds.size === 0) return;

    setIsDeleting(true);
    const idsToDelete = Array.from(selectedStudentIds) as string[];

    // 1. Delete from Firebase
    let failCount = 0;
    for (const id of idsToDelete) {
      const student = students.find(s => s.id === id);
      const firebaseId = student?.uid || id;
      const result = await deleteStudentFromFirebase(firebaseId, student?.email);
      if (!result.success) failCount++;
    }

    if (failCount > 0) {
      // Ideally show unique errors
      alert(`Deleted with ${failCount} errors in Firebase sync. Check permissions.`);
    }

    // 3. Update UI
    setStudents(prev => prev.filter(s => !selectedStudentIds.has(s.id)));
    setSelectedStudentIds(new Set());
    setIsDeleting(false);
  };



  const renderExecutivePDFView = () => {
    if (!selectedCollege) return null;
    const analytics = mockService.getCollegeVisualAnalytics(selectedCollege.id);
    const sparklineData = [{ d: 1, a: 80, c: 70, p: 10 }, { d: 2, a: 82, c: 75, p: 25 }, { d: 3, a: 78, c: 72, p: 40 }, { d: 4, a: 85, c: 80, p: 65 }, { d: 5, a: 88, c: 85, p: 90 }];
    const workshopBarData = [{ name: 'AI Lab', participation: 85 }, { name: 'React', participation: 92 }, { name: 'Cloud', participation: 74 }, { name: 'Sec', participation: 68 }];
    const taskStackedData = [{ name: 'W1', assigned: 10, completed: 8, missed: 2 }, { name: 'W2', assigned: 12, completed: 9, missed: 3 }, { name: 'W3', assigned: 8, completed: 7, missed: 1 }];
    const qualityTrendData = [{ d: 1, q: 65 }, { d: 2, q: 72 }, { d: 3, q: 78 }, { d: 4, q: 84 }, { d: 5, q: 92 }];
    const radarData = [{ subject: 'Quality', A: 92, B: 85 }, { subject: 'Attend', A: 88, B: 82 }, { subject: 'Tasks', A: 85, B: 75 }, { subject: 'Speed', A: 70, B: 80 }, { subject: 'Growth', A: 95, B: 70 }];

    return (
      <div className="fixed inset-0 bg-slate-900/90 backdrop-blur-md z-[200] flex flex-col items-center overflow-y-auto no-scrollbar p-10 print:bg-white print:static print:h-auto print:p-0 print:overflow-visible print:z-0 print:block">
        <div className="w-full max-w-5xl mb-10 flex justify-between items-center bg-white/10 p-6 rounded-3xl border border-white/10 backdrop-blur-xl no-print">
          <div>
            <h2 className="text-white text-2xl font-black uppercase tracking-tighter">Executive Node Audit</h2>
            <p className="text-white/50 text-xs font-bold uppercase tracking-widest">{selectedCollege.name} • Season 2024</p>
          </div>
          <div className="flex gap-4">
            <button onClick={() => window.print()} className="px-8 py-3 bg-indigo-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl flex items-center gap-2 hover:bg-indigo-700 transition-all">
              <Printer size={18} /> Print to PDF
            </button>
            <button onClick={() => setShowExecutiveReport(false)} className="p-3 bg-white/10 text-white rounded-2xl border border-white/20 hover:bg-white/20 transition-all">
              <X size={20} />
            </button>
          </div>
        </div>

        <div className="w-full max-w-4xl space-y-20 pb-40 print:pb-0 print:space-y-0">
          {/* PAGE 1: OVERVIEW */}
          <ReportPage pageNumber={1}>
            <div className="bg-slate-900 rounded-[32px] p-10 text-white mb-10 overflow-hidden relative shadow-2xl">
              <div className="relative z-10">
                <h2 className="text-4xl font-black tracking-tighter uppercase mb-6 leading-none">Executive Performance Overview</h2>
                <div className="grid grid-cols-3 gap-8">
                  {[
                    { l: 'Enrollment', v: analytics.kpis.totalStudents, c: 'text-white' },
                    { l: 'Active Yield', v: '92%', c: 'text-emerald-400' },
                    { l: 'Avg Attendance', v: '88%', c: 'text-indigo-400' },
                    { l: 'Completion', v: '75%', c: 'text-amber-400' },
                    { l: 'Total Points', v: '124K', c: 'text-white' },
                    { l: 'Global Rank', v: '#12', c: 'text-rose-400' }
                  ].map((k, i) => (
                    <div key={i}>
                      <p className="text-[8px] font-black text-white/30 uppercase tracking-widest mb-1">{k.l}</p>
                      <h4 className={`text-3xl font-black ${k.c}`}>{k.v}</h4>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-6 h-60 mb-10">
              <div className="p-4 bg-slate-50 border border-slate-100 rounded-2xl space-y-2">
                <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Attendance Trend</p>
                <ResponsiveContainer width="100%" height="70%" minWidth={0}>
                  <AreaChart data={sparklineData}><Area type="monotone" dataKey="a" stroke="#4f46e5" fill="#4f46e5" fillOpacity={0.1} /></AreaChart>
                </ResponsiveContainer>
              </div>
              <div className="p-4 bg-slate-50 border border-slate-100 rounded-2xl space-y-2">
                <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Completion Trend</p>
                <ResponsiveContainer width="100%" height="70%" minWidth={0}>
                  <AreaChart data={sparklineData}><Area type="monotone" dataKey="c" stroke="#10b981" fill="#10b981" fillOpacity={0.1} /></AreaChart>
                </ResponsiveContainer>
              </div>
              <div className="p-4 bg-slate-50 border border-slate-100 rounded-2xl space-y-2">
                <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Points Growth</p>
                <ResponsiveContainer width="100%" height="70%" minWidth={0}>
                  <AreaChart data={sparklineData}><Area type="monotone" dataKey="p" stroke="#f59e0b" fill="#f59e0b" fillOpacity={0.1} /></AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
            <div className="p-8 bg-indigo-50/50 rounded-3xl border border-indigo-100">
              <h5 className="text-[10px] font-black text-indigo-600 uppercase tracking-[2px] mb-3 flex items-center gap-2"><Zap size={14} /> Intelligence Logic</h5>
              <p className="text-sm text-slate-600 leading-relaxed italic">"Performance data indicates a highly stable node with 92% active student retention. Engagement health is optimized in technical modules but shows minor volatility during administrative cycle transitions."</p>
            </div>
          </ReportPage>

          {/* PAGE 2: WORKSHOP PARTICIPATION */}
          <ReportPage pageNumber={2}>
            <AuditInsight
              title="Workshop Participation & Engagement" subtitle="Ecosystem Density Metrics"
              pattern="Engagement peaks in AI modules (92%) and declines in Cloud infrastructure (74%)."
              insight="Cohort shows strong bias towards innovative emerging tech over traditional systems."
              meaning="The node is producing high-potential 'Innovation Specialists' but lacks 'Systems Maintenance' depth."
              action="Incentivize foundational cloud modules with double-point multipliers to balance output."
            >
              <div className="grid grid-cols-2 gap-8 h-full">
                <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                  <BarChart data={workshopBarData}><CartesianGrid vertical={false} strokeDasharray="3 3" /><XAxis dataKey="name" tick={{ fontSize: 9 }} /><YAxis hide /><Tooltip /><Bar dataKey="participation" fill="#4f46e5" radius={[6, 6, 0, 0]} /></BarChart>
                </ResponsiveContainer>
                <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                  <LineChart data={sparklineData}><CartesianGrid vertical={false} strokeDasharray="3 3" /><XAxis dataKey="d" tick={{ fontSize: 9 }} /><YAxis hide /><Tooltip /><Line type="monotone" dataKey="a" stroke="#4f46e5" strokeWidth={4} dot={{ r: 4 }} /></LineChart>
                </ResponsiveContainer>
              </div>
            </AuditInsight>
          </ReportPage>

          {/* PAGE 3: TASK & ATTENDANCE */}
          <ReportPage pageNumber={3}>
            <AuditInsight
              title="Task Completion & Discipline" subtitle="Reliability Benchmarking"
              pattern="Completion consistency is high for W1/W3 (85%) but drops significantly in W2 (75%)."
              insight="Task complexity in W2 is causing a 'submission wall' for mid-tier students."
              meaning="The academic progression is creating an elitist divide within the cohort."
              action="Introduce mandatory peer-review sub-tasks to scaffold mid-tier learners during complex modules."
            >
              <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                <BarChart data={taskStackedData}><CartesianGrid vertical={false} /><XAxis dataKey="name" /><YAxis hide /><Tooltip /><Legend iconType="circle" /><Bar dataKey="completed" stackId="a" fill="#10b981" radius={[0, 0, 0, 0]} /><Bar dataKey="missed" stackId="a" fill="#f43f5e" radius={[6, 6, 0, 0]} /></BarChart>
              </ResponsiveContainer>
            </AuditInsight>
          </ReportPage>

          {/* PAGE 4: SUBMISSION QUALITY */}
          <ReportPage pageNumber={4}>
            <AuditInsight
              title="Submission Quality Analysis" subtitle="Review Integrity Audit"
              pattern="Rejection rates spike during intermediate phases but decline by 15% WoW."
              insight="Students are rapidly internalizing feedback loops, showing strong adaptive intelligence."
              meaning="The node has a high 'Instructional Absorption' capacity."
              action="Advance next season curriculum difficulty by 10% to sustain growth velocity."
            >
              <div className="grid grid-cols-2 gap-10 h-full items-center">
                <div className="h-full">
                  <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                    <RechartPie>
                      <Pie data={[{ n: 'Approve', v: 82, c: '#10b981' }, { n: 'Reject', v: 18, c: '#f43f5e' }]} dataKey="v" innerRadius={60} outerRadius={80} paddingAngle={10} stroke="none">
                        <Cell fill="#10b981" />
                        <Cell fill="#f43f5e" />
                      </Pie>
                      <Tooltip />
                    </RechartPie>
                  </ResponsiveContainer>
                </div>
                <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                  <AreaChart data={qualityTrendData}><XAxis hide /><YAxis hide /><Tooltip /><Area type="step" dataKey="q" stroke="#4f46e5" fill="#4f46e5" fillOpacity={0.1} /></AreaChart>
                </ResponsiveContainer>
              </div>
            </AuditInsight>
          </ReportPage>

          {/* PAGE 5: GAMIFICATION */}
          <ReportPage pageNumber={5}>
            <AuditInsight
              title="Gamification Response" subtitle="Motivation Dynamics"
              pattern="Rank movement shows a 'Ladder Effect'—top 10 students are locked in position."
              insight="Current point system rewards consistency over breakthrough innovation."
              meaning="Engagement among top students may stagnate due to lack of risk-reward opportunities."
              action="Introduce 'Bounty Tasks' with variable points to disrupt the top-tier rankings."
            >
              <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                <LineChart data={sparklineData}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="d" /><YAxis hide /><Tooltip /><Line type="stepAfter" dataKey="p" stroke="#f59e0b" strokeWidth={5} dot={{ r: 6, fill: '#fff' }} /></LineChart>
              </ResponsiveContainer>
            </AuditInsight>
          </ReportPage>

          {/* PAGE 6: BENCHMARKING */}
          <ReportPage pageNumber={6}>
            <AuditInsight
              title="Comparative Benchmarking" subtitle="Node vs Platform Averages"
              pattern="Outperforming platform avg in Quality (92) and Growth (95)."
              insight="This institution is a 'High Quality' lighthouse node for the ecosystem."
              meaning="Ideal candidate for 'Showcase' projects and pilot feature testing."
              action="Grant 'Beta Hub' status for the upcoming V3 platform launch experiments."
            >
              <div className="grid grid-cols-2 gap-10 h-full">
                <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                  <RadarChart data={radarData}>
                    <PolarGrid stroke="#f1f5f9" />
                    <PolarAngleAxis dataKey="subject" tick={{ fontSize: 10, fontWeight: 900 }} />
                    <Radar name="This College" dataKey="A" stroke="#4f46e5" fill="#4f46e5" fillOpacity={0.6} />
                    <Radar name="Platform Avg" dataKey="B" stroke="#cbd5e1" fill="#cbd5e1" fillOpacity={0.2} />
                  </RadarChart>
                </ResponsiveContainer>
                <div className="flex flex-col justify-center space-y-6">
                  {[{ l: 'Quality Lead', v: '+7%', c: 'text-emerald-500' }, { l: 'Attendance Gap', v: '+12%', c: 'text-indigo-500' }].map((b, i) => (
                    <div key={i} className="bg-white border border-slate-100 p-6 rounded-3xl shadow-sm">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{b.l}</p>
                      <h4 className={`text-3xl font-black ${b.c}`}>{b.v}</h4>
                    </div>
                  ))}
                </div>
              </div>
            </AuditInsight>
          </ReportPage>

          {/* PAGE 7: RISK & OPPORTUNITY */}
          <ReportPage pageNumber={7}>
            <AuditInsight
              title="Risk & Opportunity Detection" subtitle="Predictive Analytics"
              pattern="22% of students show activity decline after missed tasks. HIGH RISK."
              insight="Platform drop-off is strictly task-correlated, not time-correlated."
              meaning="Failure in one module creates a domino effect for the entire season."
              action="Deploy automated 'Remediation Sprints' for any student missing 2 consecutive tasks."
            >
              <div className="space-y-10 h-full">
                <div className="h-40">
                  <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                    <AreaChart data={[{ d: 1, v: 100 }, { d: 2, v: 95 }, { d: 3, v: 90 }, { d: 4, v: 78 }, { d: 5, v: 75 }]}><Area type="basis" dataKey="v" fill="#f43f5e" fillOpacity={0.1} stroke="#f43f5e" strokeWidth={4} /></AreaChart>
                  </ResponsiveContainer>
                </div>
                <div className="grid grid-cols-2 gap-6">
                  <div className="p-6 bg-rose-50 border border-rose-100 rounded-3xl flex items-start gap-4 shadow-sm">
                    <AlertTriangle className="text-rose-500 flex-shrink-0" size={24} />
                    <div><h4 className="font-black text-[10px] text-rose-800 uppercase mb-1">Risk: Churn Vulnerability</h4><p className="text-[11px] text-rose-600 leading-tight">Drop-off rate is high among students with less than 70% score.</p></div>
                  </div>
                  <div className="p-6 bg-emerald-50 border border-emerald-100 rounded-3xl flex items-start gap-4 shadow-sm">
                    <Target className="text-emerald-500 flex-shrink-0" size={24} />
                    <div><h4 className="font-black text-[10px] text-emerald-800 uppercase mb-1">Opportunity: Talent Scaling</h4><p className="text-[11px] text-emerald-600 leading-tight">Top 15% are ready for advanced internship placement.</p></div>
                  </div>
                </div>
              </div>
            </AuditInsight>
          </ReportPage>
        </div>
      </div>
    );
  };

  const renderReportsView = () => (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-500 pb-20">
      <div className="bg-white rounded-[40px] border border-slate-200 p-12 overflow-hidden relative shadow-sm">
        <div className="absolute top-0 right-0 p-12 opacity-5 pointer-events-none">
          <FileText size={240} className="text-indigo-600" />
        </div>

        <div className="relative z-10 max-w-2xl">
          <div className="w-16 h-16 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center mb-6 shadow-sm">
            <BarChart3 size={32} />
          </div>
          <h3 className="text-3xl font-black text-slate-800 uppercase tracking-tighter leading-none mb-4">Institutional Audit Hub</h3>
          <p className="text-slate-500 font-medium text-lg mb-10 leading-relaxed">
            Generate high-fidelity performance reports and AI-driven executive audits for <span className="text-indigo-600 font-black">{selectedCollege?.name}</span>.
          </p>

          <div className="flex flex-wrap gap-4">
            <button
              onClick={handleExportPerformanceCSV}
              className="flex items-center justify-center gap-3 px-8 py-4 bg-white border border-slate-200 text-slate-700 text-[10px] font-black uppercase tracking-[2px] hover:bg-slate-50 transition-all rounded-[24px] shadow-sm group"
            >
              <FileDown size={20} className="group-hover:translate-y-0.5 transition-transform" />
              Export Performance CSV
            </button>
            <button
              onClick={() => setShowExecutiveReport(true)}
              className="flex items-center justify-center gap-3 px-10 py-4 bg-indigo-600 text-white text-[10px] font-black uppercase tracking-[3px] hover:bg-indigo-700 transition-all rounded-[24px] shadow-xl group"
            >
              <Activity size={20} className="group-hover:scale-110 transition-transform" />
              Generate Executive Report
            </button>
          </div>
        </div>

        <div className="mt-16 pt-10 border-t border-slate-100 grid grid-cols-1 md:grid-cols-3 gap-10">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-[10px] font-black text-indigo-500 uppercase tracking-widest"><CheckCircle2 size={14} /> Analytics Ready</div>
            <p className="text-xs text-slate-400 font-bold leading-relaxed">CSV includes rank, submission quality, and attendance metrics for deep analysis.</p>
          </div>
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-[10px] font-black text-indigo-500 uppercase tracking-widest"><ShieldIcon size={14} /> Compliance Safe</div>
            <p className="text-xs text-slate-400 font-bold leading-relaxed">No raw logs or internal platform IDs are exposed in the export.</p>
          </div>
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-[10px] font-black text-indigo-500 uppercase tracking-widest"><Activity size={14} /> AI Intelligence</div>
            <p className="text-xs text-slate-400 font-bold leading-relaxed">Executive PDF includes predictive risk detection and pattern analysis.</p>
          </div>
        </div>
      </div>
    </div>
  );

  /**
   * INTERACTIVE STATS VIEW
   * Supporting hover, simple AI-friendly charts, and basic filtering.
   */
  const renderStatsView = () => {
    if (!selectedCollege) return null;
    const analytics = mockService.getCollegeVisualAnalytics(selectedCollege.id);

    // Filtering Logic for Demo
    const engagementData = analytics.visuals.dailyEngagement.map((val, i) => ({
      day: `Day ${i + 1}`,
      score: val
    })).filter(d => {
      if (statsFilter === 'High') return d.score >= 85;
      if (statsFilter === 'Low') return d.score < 85;
      return true;
    });

    const completionData = analytics.visuals.workshopPerformance.map(w => ({
      name: w.title.split(' ')[0],
      pct: w.completion
    }));

    const statusData = [
      { name: 'Approved', value: 72, color: '#10b981' },
      { name: 'Pending', value: 18, color: '#f59e0b' },
      { name: 'Rejected', value: 10, color: '#f43f5e' }
    ];

    return (
      <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-500">
        {/* Filters Bar */}
        <div className="bg-white px-8 py-4 rounded-[24px] border border-slate-200 shadow-sm flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Filter size={18} className="text-slate-400" />
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Filter Intensity:</span>
            <div className="flex gap-2">
              {(['All', 'High', 'Low'] as const).map(f => (
                <button
                  key={f}
                  onClick={() => setStatsFilter(f)}
                  className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest transition-all ${statsFilter === f ? 'bg-indigo-600 text-white shadow-lg' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}
                >
                  {f}
                </button>
              ))}
            </div>
          </div>
          <p className="text-[10px] font-black text-indigo-500 uppercase tracking-widest flex items-center gap-2">
            <Activity size={14} /> Live Sync Active
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* 1. Line Chart: Engagement over time */}
          <div className="bg-white p-8 rounded-[40px] border border-slate-200 shadow-sm space-y-6">
            <div className="flex justify-between items-start">
              <div>
                <h4 className="text-lg font-black text-slate-800 uppercase tracking-tighter">Engagement Velocity</h4>
                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-[2px]">Platform Interaction Trends</p>
              </div>
              <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-600"><TrendingUp size={20} /></div>
            </div>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                <LineChart data={engagementData}>
                  <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 900, fill: '#94a3b8' }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 900, fill: '#94a3b8' }} domain={[0, 100]} />
                  <Tooltip
                    contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)' }}
                    itemStyle={{ fontSize: '12px', fontWeight: '900', textTransform: 'uppercase' }}
                  />
                  <Line type="monotone" dataKey="score" stroke="#4f46e5" strokeWidth={4} dot={{ r: 6, fill: '#fff', stroke: '#4f46e5', strokeWidth: 3 }} activeDot={{ r: 8 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* 2. Bar Chart: Task completion per task */}
          <div className="bg-white p-8 rounded-[40px] border border-slate-200 shadow-sm space-y-6">
            <div className="flex justify-between items-start">
              <div>
                <h4 className="text-lg font-black text-slate-800 uppercase tracking-tighter">Module Completion</h4>
                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-[2px]">Task Fulfillment Efficiency</p>
              </div>
              <div className="w-10 h-10 bg-emerald-50 rounded-xl flex items-center justify-center text-emerald-600"><CheckCircle2 size={20} /></div>
            </div>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                <BarChart data={completionData}>
                  <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 900, fill: '#94a3b8' }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 900, fill: '#94a3b8' }} />
                  <Tooltip cursor={{ fill: '#f8fafc' }} contentStyle={{ borderRadius: '16px', border: 'none' }} />
                  <Bar dataKey="pct" fill="#10b981" radius={[8, 8, 0, 0]} barSize={40} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* 3. Donut Chart: Submission status */}
          <div className="bg-white p-8 rounded-[40px] border border-slate-200 shadow-sm space-y-6">
            <div className="flex justify-between items-start">
              <div>
                <h4 className="text-lg font-black text-slate-800 uppercase tracking-tighter">Review Distribution</h4>
                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-[2px]">Academic Integrity Status</p>
              </div>
              <div className="w-10 h-10 bg-amber-50 rounded-xl flex items-center justify-center text-amber-600"><FileText size={20} /></div>
            </div>
            <div className="h-64 w-full flex items-center">
              <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                <RechartPie>
                  <Pie data={statusData} dataKey="value" innerRadius={60} outerRadius={90} paddingAngle={8} stroke="none">
                    {statusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ borderRadius: '16px', border: 'none' }} />
                  <Legend verticalAlign="middle" align="right" layout="vertical" iconType="circle" wrapperStyle={{ fontSize: '10px', fontWeight: '900', textTransform: 'uppercase' }} />
                </RechartPie>
              </ResponsiveContainer>
            </div>
          </div>

          {/* AI Insight Box for Stats */}
          <div className="bg-indigo-900 rounded-[40px] p-8 text-white shadow-xl relative overflow-hidden flex flex-col justify-center">
            <div className="absolute top-0 right-0 p-8 opacity-10"><Zap size={120} /></div>
            <div className="relative z-10 space-y-4">
              <h4 className="text-[10px] font-black uppercase tracking-[4px] text-indigo-300">Intelligent Summary</h4>
              <p className="text-xl font-bold leading-relaxed">
                Based on current trends, the node is maintaining a <span className="text-emerald-400">stable 85% participation rate</span>.
                Approval velocity is 12% higher than the regional average, indicating superior instructional clarity.
              </p>
              <div className="pt-4 flex gap-4">
                <div className="bg-white/10 px-4 py-2 rounded-2xl border border-white/10">
                  <p className="text-[8px] font-black text-indigo-200 uppercase tracking-widest">Health Score</p>
                  <p className="text-lg font-black">94/100</p>
                </div>
                <div className="bg-white/10 px-4 py-2 rounded-2xl border border-white/10">
                  <p className="text-[8px] font-black text-indigo-200 uppercase tracking-widest">Risk Index</p>
                  <p className="text-lg font-black">Low</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderStudentTable = () => (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500 no-print">
      <div className="flex flex-col lg:flex-row justify-between items-center gap-6">
        <div className="relative w-full lg:w-96 group">
          <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-600 transition-colors" />
          <input type="text" placeholder="Search by Name or Roll No..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full pl-12 pr-4 py-4 bg-white border border-slate-200 rounded-[20px] text-sm font-bold focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all shadow-sm" />
        </div>
        <div className="flex gap-4 w-full lg:w-auto overflow-x-auto pb-2 lg:pb-0">
          {selectedStudentIds.size > 0 && (
            <button onClick={handleBulkDelete} disabled={isDeleting} className="flex-1 lg:flex-none flex items-center justify-center gap-2 px-6 py-4 bg-rose-50 border border-rose-100 text-[10px] font-black uppercase tracking-widest text-rose-600 hover:bg-rose-100 transition-all rounded-[20px] shadow-sm whitespace-nowrap">
              {isDeleting ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />} Delete ({selectedStudentIds.size})
            </button>
          )}

          <div className="relative flex-1 lg:flex-none">
            <input
              type="file"
              accept=".csv"
              onChange={handleImportCSV}
              className="hidden"
              id="csv-upload"
              ref={fileInputRef}
              disabled={isImporting}
            />
            <label
              htmlFor="csv-upload"
              className={`flex items-center justify-center gap-3 px-6 py-3 bg-white border border-slate-200 text-slate-700 text-[10px] font-black uppercase tracking-[2px] rounded-[20px] shadow-sm hover:bg-slate-50 transition-all cursor-pointer whitespace-nowrap h-full ${isImporting ? 'opacity-50 cursor-wait' : ''}`}
            >
              {isImporting ? <Loader2 size={16} className="animate-spin" /> : <Upload size={16} />}
              {isImporting ? 'Importing...' : 'Import Students CSV'}
            </label>
          </div>

          <button
            onClick={() => setIsManualModalOpen(true)}
            className="flex-1 lg:flex-none flex items-center justify-center gap-3 px-8 py-3 bg-indigo-600 text-white text-[10px] font-black uppercase tracking-[2px] rounded-[20px] shadow-xl hover:bg-indigo-700 transition-all hover:shadow-2xl hover:-translate-y-1 whitespace-nowrap"
          >
            <UserPlus size={16} />
            Add Student Manually
          </button>
        </div>
      </div>

      <div className="bg-white rounded-[40px] border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50 text-slate-400 border-b border-slate-100">
              <tr>
                <th className="px-6 py-6 font-black uppercase tracking-widest text-[10px] w-10">
                  <button onClick={toggleAllSelection} className="text-slate-400 hover:text-indigo-600 transition-colors">
                    {selectedStudentIds.size > 0 && selectedStudentIds.size === filteredStudents.length ? <CheckSquare size={18} /> : <Square size={18} />}
                  </button>
                </th>
                <th className="px-10 py-6 font-black uppercase tracking-widest text-[10px]">Primary Identity</th>
                <th className="px-10 py-6 font-black uppercase tracking-widest text-[10px]">Workshop Context</th>
                <th className="px-10 py-6 font-black uppercase tracking-widest text-[10px]">Performance</th>
                <th className="px-10 py-6 font-black uppercase tracking-widest text-[10px] text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredStudents.length === 0 ? (
                <tr><td colSpan={5} className="p-20 text-center"><div className="flex flex-col items-center justify-center text-slate-300"><Users size={64} className="mb-4 opacity-10" /><p className="font-black uppercase tracking-[4px] text-sm">No Student Data</p></div></td></tr>
              ) : (
                filteredStudents.map((student) => (
                  <tr key={student.id} className={`hover:bg-slate-50 transition-colors group ${selectedStudentIds.has(student.id) ? 'bg-indigo-50/30' : ''}`}>
                    <td className="px-6 py-6">
                      <button onClick={() => toggleStudentSelection(student.id)} className={`transition-colors ${selectedStudentIds.has(student.id) ? 'text-indigo-600' : 'text-slate-300 group-hover:text-slate-400'}`}>
                        {selectedStudentIds.has(student.id) ? <CheckSquare size={18} /> : <Square size={18} />}
                      </button>
                    </td>
                    <td className="px-10 py-6"><div className="flex items-center gap-4"><div className="w-12 h-12 bg-slate-100 text-slate-500 rounded-2xl flex items-center justify-center font-black text-sm group-hover:bg-indigo-600 group-hover:text-white transition-all shadow-sm">{student.name.charAt(0)}</div><div><p className="font-black text-slate-800 uppercase tracking-tighter leading-tight">{student.name}</p><p className="text-[10px] font-bold text-indigo-400 uppercase tracking-tight">{student.roll_no}</p></div></div></td>
                    <td className="px-10 py-6"><div className="flex flex-col"><span className="text-xs font-black text-slate-800 uppercase tracking-tight">{student.workshopName}</span><span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest italic">{student.workshopDuration}</span></div></td>
                    <td className="px-10 py-6"><div className="flex gap-4 items-center"><div className="flex flex-col"><span className="text-[9px] font-black text-slate-400 uppercase leading-none mb-1">Attend.</span><span className="text-sm font-black text-slate-800">{student.attendance}%</span></div><div className="w-px h-6 bg-slate-100" /><div className="flex flex-col"><span className="text-[9px] font-black text-slate-400 uppercase leading-none mb-1">Rank</span><span className="text-sm font-black text-indigo-600">#{student.globalRank}</span></div></div></td>
                    <td className="px-10 py-6 text-right">
                      <div className="flex justify-end gap-2">
                        <button onClick={() => setSelectedStudent(student)} className="p-3 text-slate-300 hover:text-indigo-600 hover:bg-indigo-50 rounded-2xl transition-all shadow-sm bg-white border border-slate-100"><Eye size={18} /></button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  const renderStudentModal = () => {
    if (!selectedStudent) return null;
    return (
      <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[100] flex items-center justify-center p-6 animate-in fade-in duration-300 no-print">
        <div className="bg-white w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-[48px] shadow-2xl relative animate-in zoom-in-95 duration-300 border border-slate-200">
          <button onClick={() => setSelectedStudent(null)} className="absolute top-10 right-10 p-4 bg-slate-50 hover:bg-slate-100 text-slate-400 hover:text-slate-800 rounded-2xl transition-all border border-slate-200"><X size={24} /></button>
          <div className="p-16">
            <div className="flex flex-col md:flex-row gap-12 items-start">
              <div className="md:w-1/3 space-y-10">
                <div className="flex flex-col items-center text-center">
                  <div className="w-32 h-32 bg-indigo-600 text-white rounded-[40px] flex items-center justify-center text-4xl font-black shadow-2xl mb-6">{selectedStudent.name.charAt(0)}</div>
                  <h3 className="text-3xl font-black text-slate-800 tracking-tighter uppercase mb-2">{selectedStudent.name}</h3>
                  <span className="px-4 py-1.5 bg-indigo-50 text-indigo-600 rounded-full text-[10px] font-black uppercase tracking-widest border border-indigo-100">Active Student Node</span>
                </div>
                <div className="space-y-6 pt-10 border-t border-slate-100">
                  <h4 className="text-xs font-black text-slate-300 uppercase tracking-[2px]">Identity Info</h4>
                  <div className="space-y-4">
                    <div className="flex items-center gap-4 group">
                      <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 group-hover:bg-indigo-50 group-hover:text-indigo-600 transition-all"><UserIcon size={18} /></div>
                      <div><p className="text-[10px] font-black text-slate-400 uppercase tracking-tight leading-none">Roll Number</p><p className="text-sm font-bold text-slate-800">{selectedStudent.roll_no}</p></div>
                    </div>
                    <div className="flex items-center gap-4 group">
                      <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 group-hover:bg-indigo-50 group-hover:text-indigo-600 transition-all"><Briefcase size={18} /></div>
                      <div><p className="text-[10px] font-black text-slate-400 uppercase tracking-tight leading-none">Email Address</p><p className="text-sm font-bold text-slate-800">{selectedStudent.email}</p></div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="flex-1 space-y-12">
                <section>
                  <h4 className="text-xs font-black text-indigo-500 uppercase tracking-[3px] mb-6 flex items-center gap-2"><FileText size={16} /> Workshop Enrollment</h4>
                  <div className="bg-slate-50 rounded-3xl p-8 border border-slate-100 flex justify-between items-center">
                    <div><p className="text-sm font-black text-slate-800 uppercase tracking-tighter mb-1">{selectedStudent.workshopName}</p><p className="text-xs font-bold text-slate-400 uppercase tracking-widest">{selectedStudent.workshopDuration} Duration</p></div>
                    <div className="w-12 h-12 rounded-2xl bg-white flex items-center justify-center text-indigo-600 shadow-sm"><ChevronRight size={24} /></div>
                  </div>
                </section>
                <section>
                  <h4 className="text-xs font-black text-emerald-500 uppercase tracking-[3px] mb-6 flex items-center gap-2"><Activity size={16} /> Performance Metrics</h4>
                  <div className="grid grid-cols-2 gap-6">
                    <div className="p-6 bg-white border border-slate-100 rounded-3xl shadow-sm hover:border-indigo-100 transition-all"><p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-1.5"><Award size={12} className="text-indigo-400" /> Total Points</p><p className="text-2xl font-black text-slate-800">{selectedStudent.totalPoints} <span className="text-[10px] text-indigo-500">PTS</span></p></div>
                    <div className="p-6 bg-white border border-slate-100 rounded-3xl shadow-sm hover:border-indigo-100 transition-all"><p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-1.5"><Clock size={12} className="text-indigo-400" /> Attendance</p><p className="text-2xl font-black text-slate-800">{selectedStudent.attendance}%</p></div>
                  </div>
                </section>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderManualEntryModal = () => (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[110] flex items-center justify-center p-6 animate-in fade-in duration-300 no-print">
      <div className="bg-white w-full max-w-lg rounded-[48px] shadow-2xl p-12 border border-slate-200 animate-in zoom-in-95 duration-300">
        <div className="flex justify-between items-center mb-10">
          <div><h3 className="text-3xl font-black text-slate-800 uppercase tracking-tighter leading-none">Manual Entry</h3><p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-2">{selectedCollege?.name}</p></div>
          <button onClick={() => setIsManualModalOpen(false)} className="p-3 bg-slate-50 hover:bg-slate-100 text-slate-400 rounded-2xl transition-all"><X size={20} /></button>
        </div>
        <form onSubmit={handleManualSubmit} className="space-y-6">
          <div className="space-y-1.5"><label className="text-[10px] font-black text-slate-400 uppercase tracking-[2px] ml-1">Full Student Name</label><input required type="text" placeholder="e.g. Johnathan Smith" className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all" value={manualStudent.name} onChange={(e) => setManualStudent({ ...manualStudent, name: e.target.value })} /></div>
          <div className="space-y-1.5"><label className="text-[10px] font-black text-slate-400 uppercase tracking-[2px] ml-1">Institutional Roll No</label><input required type="text" placeholder="e.g. 21CS001" className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all" value={manualStudent.roll_no} onChange={(e) => setManualStudent({ ...manualStudent, roll_no: e.target.value })} /></div>
          <div className="space-y-1.5"><label className="text-[10px] font-black text-slate-400 uppercase tracking-[2px] ml-1">Email Address</label><input required type="email" placeholder="e.g. john@example.com" className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all" value={manualStudent.email} onChange={(e) => setManualStudent({ ...manualStudent, email: e.target.value })} /></div>
          <div className="space-y-1.5"><label className="text-[10px] font-black text-slate-400 uppercase tracking-[2px] ml-1">Date of Birth</label><input required type="date" className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all" value={manualStudent.dob} onChange={(e) => setManualStudent({ ...manualStudent, dob: e.target.value })} /></div>
          <button type="submit" className="w-full py-5 bg-indigo-600 text-white rounded-[24px] font-black text-[10px] uppercase tracking-[3px] shadow-xl hover:bg-indigo-700 transition-all mt-4">Register Student Node</button>
        </form>
      </div>
    </div>
  );

  const renderAddCollegeModal = () => (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[210] flex items-center justify-center p-6 animate-in fade-in duration-300">
      <div className="bg-white w-full max-w-lg rounded-[48px] shadow-2xl p-12 border border-slate-200 animate-in zoom-in-95 duration-300">
        <div className="flex justify-between items-center mb-10">
          <div>
            <h3 className="text-3xl font-black text-slate-800 uppercase tracking-tighter leading-none">Register College</h3>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-2">Initialize New Institutional Node</p>
          </div>
          <button onClick={() => setIsAddCollegeModalOpen(false)} className="p-3 bg-slate-50 hover:bg-slate-100 text-slate-400 rounded-2xl transition-all"><X size={20} /></button>
        </div>
        <form onSubmit={handleRegisterCollege} className="space-y-6">
          <div className="space-y-1.5">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-[2px] ml-1">College Name</label>
            <div className="relative">
              <School className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
              <input required type="text" placeholder="e.g. MIT Institute" className="w-full pl-12 pr-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all" value={newCollegeData.name} onChange={(e) => setNewCollegeData({ ...newCollegeData, name: e.target.value })} />
            </div>
          </div>
          <div className="space-y-1.5">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-[2px] ml-1">Location</label>
            <div className="relative">
              <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
              <input required type="text" placeholder="e.g. Cambridge, MA" className="w-full pl-12 pr-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all" value={newCollegeData.location} onChange={(e) => setNewCollegeData({ ...newCollegeData, location: e.target.value })} />
            </div>
          </div>
          <div className="space-y-1.5">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-[2px] ml-1">Admin Name</label>
            <div className="relative">
              <UserCircle className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
              <input required type="text" placeholder="e.g. Dr. Robert Smith" className="w-full pl-12 pr-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all" value={newCollegeData.adminName} onChange={(e) => setNewCollegeData({ ...newCollegeData, adminName: e.target.value })} />
            </div>
          </div>
          <button type="submit" className="w-full py-5 bg-indigo-600 text-white rounded-[24px] font-black text-[10px] uppercase tracking-[3px] shadow-xl hover:bg-indigo-700 transition-all mt-4 flex items-center justify-center gap-2">
            <Plus size={16} /> Deploy College Node
          </button>
        </form>
      </div>
    </div>
  );

  const renderCollegeList = () => (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-4xl font-black text-slate-800 tracking-tighter uppercase leading-none mb-2">College Command Center</h2>
          <p className="text-slate-500 font-medium text-lg">Centralized oversight of all institutional nodes.</p>
        </div>
        <button
          onClick={() => setIsAddCollegeModalOpen(true)}
          className="px-10 py-5 bg-indigo-600 text-white rounded-[24px] font-black text-[10px] uppercase tracking-[3px] shadow-xl hover:bg-indigo-700 transition-all flex items-center gap-2 group"
        >
          <Plus size={18} className="group-hover:rotate-90 transition-transform duration-300" />
          Register University Node
        </button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {colleges.map((college) => (
          <div
            key={college.id}
            className="bg-white rounded-[40px] shadow-sm border border-slate-200 overflow-hidden hover:shadow-2xl hover:-translate-y-2 transition-all group cursor-pointer"
            onClick={() => setSelectedCollege(college)}
          >
            <div className="p-10">
              <div className="flex justify-between items-start mb-8">
                <div className="w-16 h-16 bg-slate-900 text-white rounded-2xl group-hover:bg-indigo-600 transition-all flex items-center justify-center shadow-lg">
                  <School size={32} />
                </div>
                <span className={`text-[10px] font-black uppercase tracking-[3px] px-4 py-1.5 rounded-full border ${college.status === 'Active' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 'bg-slate-50 text-slate-500 border-slate-200'}`}>
                  {college.status}
                </span>
              </div>
              <h3 className="text-2xl font-black text-slate-800 mb-2 group-hover:text-indigo-600 transition-colors uppercase tracking-tighter">
                {college.name}
              </h3>
              <div className="space-y-1">
                <p className="text-sm text-slate-500 flex items-center gap-1 font-bold">
                  <MapPin size={16} className="text-indigo-500" /> {college.location}
                </p>
                <p className="text-[10px] text-slate-400 flex items-center gap-1 font-black uppercase tracking-widest">
                  <UserCircle size={14} className="text-slate-300" /> Admin: {college.adminName}
                </p>
              </div>
            </div>
            <div className="px-10 py-5 bg-slate-50/50 flex justify-between items-center border-t border-slate-100 group-hover:bg-indigo-50 transition-all text-[10px] font-black text-slate-400 group-hover:text-indigo-600 uppercase tracking-[4px]">
              Access Operational Node <ChevronRight size={18} className="text-slate-300 group-hover:text-indigo-600 group-hover:translate-x-1 transition-all" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );


  const renderCollegeDetail = () => {
    if (!selectedCollege) return null;
    return (
      <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
        {renderStudentModal()}
        {isManualModalOpen && renderManualEntryModal()}
        {showExecutiveReport && renderExecutivePDFView()}

        <div className="bg-white rounded-[40px] border border-slate-200 p-8 shadow-sm print:hidden">
          <button onClick={() => setSelectedCollege(null)} className="flex items-center gap-2 text-[10px] font-black text-slate-400 hover:text-indigo-600 transition-all mb-8 uppercase tracking-[2px]"><ArrowLeft size={16} /> Global Registry</button>
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-8">
            <div className="flex items-center gap-6">
              <div className="w-20 h-20 bg-slate-900 text-white rounded-3xl flex items-center justify-center shadow-xl"><School size={40} /></div>
              <div>
                <h2 className="text-3xl font-black text-slate-800 tracking-tighter uppercase leading-none mb-2">{selectedCollege.name}</h2>
                <div className="flex flex-wrap gap-4">
                  <p className="text-slate-500 font-bold flex items-center gap-2 text-sm uppercase tracking-wider"><MapPin size={16} className="text-indigo-500" /> {selectedCollege.location}</p>
                  <p className="text-slate-400 font-bold flex items-center gap-2 text-sm uppercase tracking-wider"><UserCircle size={16} className="text-indigo-400" /> Admin: {selectedCollege.adminName}</p>
                </div>
              </div>
            </div>
            <div className="flex bg-slate-100 p-1.5 rounded-[24px] shadow-inner border border-slate-200 w-full md:w-auto">
              {[
                { id: 'students', label: 'Students', icon: Users },
                { id: 'reports', label: 'Reports', icon: BarChart3 },
                { id: 'stats', label: 'Stats', icon: PieChart }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveSubTab(tab.id as SubTab)}
                  className={`flex-1 md:flex-none flex items-center justify-center gap-3 px-8 py-3.5 rounded-[18px] text-[10px] font-black uppercase tracking-widest transition-all ${activeSubTab === tab.id ? 'bg-indigo-600 text-white shadow-xl translate-y-[-1px]' : 'text-slate-400 hover:text-slate-600 hover:bg-white/50'}`}
                >
                  <tab.icon size={16} /> {tab.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="min-h-[400px] print:hidden">
          {activeSubTab === 'students' && renderStudentTable()}
          {activeSubTab === 'reports' && renderReportsView()}
          {activeSubTab === 'stats' && renderStatsView()}
        </div>
      </div>
    );
  };

  if (loading) return <div className="flex flex-col items-center justify-center h-96"><div className="w-16 h-16 border-4 border-indigo-600/20 border-t-indigo-600 rounded-full animate-spin mb-4" /><p className="text-[10px] font-black text-slate-400 uppercase tracking-[4px]">Syncing Registry Data...</p></div>;

  return (
    <>
      {selectedCollege ? renderCollegeDetail() : renderCollegeList()}
      {isAddCollegeModalOpen && renderAddCollegeModal()}
    </>
  );
};

export default CMS;
