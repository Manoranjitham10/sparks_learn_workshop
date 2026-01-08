
import React, { useState, useEffect } from 'react';
import { Check, X, MessageSquare, Loader2, User, FileText, AlertCircle } from 'lucide-react';
import { mockService } from '../services/mockService';
import { Submission, Task, Student } from '../types';

const SubmissionGrader: React.FC = () => {
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [selectedSubmissionId, setSelectedSubmissionId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Grading State
  const [scores, setScores] = useState<Record<string, number>>({});
  const [feedback, setFeedback] = useState('');

  useEffect(() => {
    loadSubmissions();
  }, []);

  const loadSubmissions = async () => {
    setIsLoading(true);
    const data = await mockService.getSubmissions();
    setSubmissions(data);
    setIsLoading(false);
  };

  const selectedSubmission = submissions.find(s => s.id === selectedSubmissionId);
  const [activeTask, setActiveTask] = useState<Task | null>(null);
  const [activeStudent, setActiveStudent] = useState<Student | null>(null);

  useEffect(() => {
    if (selectedSubmission) {
      mockService.getTasks().then(tasks => {
        const t = tasks.find(x => x.id === selectedSubmission.taskId);
        if (t) setActiveTask(t);
      });
      mockService.getStudents().then(students => {
        const s = students.find(x => x.id === selectedSubmission.studentId);
        if (s) setActiveStudent(s);
      });
      
      setScores(selectedSubmission.breakdown || {});
      setFeedback(selectedSubmission.feedback || '');
    }
  }, [selectedSubmission]);

  const handleScoreChange = (rubricId: string, value: number, max: number) => {
    const val = Math.min(Math.max(0, value), max);
    setScores(prev => ({ ...prev, [rubricId]: val }));
  };

  const submitGrade = async (status: 'Approved' | 'Rejected') => {
    if (!selectedSubmission) return;

    const totalScore = Object.values(scores).reduce((a: number, b: number) => a + b, 0);
    
    const updated: Submission = {
      ...selectedSubmission,
      status,
      score: status === 'Approved' ? totalScore : 0,
      feedback,
      breakdown: scores
    };

    await mockService.updateSubmission(updated);
    loadSubmissions();
    setSelectedSubmissionId(null);
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-96">
        <Loader2 className="animate-spin text-indigo-600 mb-4" size={48} />
        <p className="text-slate-500 font-medium">Loading submissions...</p>
      </div>
    );
  }

  if (selectedSubmission && activeTask && activeStudent) {
    const totalPossible = activeTask.totalPoints;
    const currentTotal = Object.values(scores).reduce((a: number, b: number) => a + b, 0);

    return (
      <div className="h-full flex flex-col animate-in fade-in duration-300">
         <button onClick={() => setSelectedSubmissionId(null)} className="mb-6 text-indigo-600 font-semibold flex items-center gap-2 hover:underline self-start">
            &larr; Back to Registry
         </button>
         
         <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-6 h-full overflow-hidden">
            <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-slate-200 flex flex-col h-full overflow-hidden">
                <div className="p-6 border-b border-slate-200 bg-slate-50 flex justify-between items-center">
                    <div>
                        <h3 className="font-bold text-slate-800 text-lg">{activeTask.title}</h3>
                        <p className="text-sm text-slate-500">Student: {activeStudent.name} ({activeStudent.roll_no})</p>
                    </div>
                </div>
                <div className="flex-1 bg-slate-100 p-8 overflow-auto">
                    <div className="w-full bg-white p-8 rounded-xl border border-slate-200 shadow-sm min-h-full">
                        <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Submission Content</h4>
                        <div className="p-6 bg-slate-50 rounded-lg text-slate-800 font-mono text-sm leading-relaxed whitespace-pre-wrap border border-slate-200">
                            {selectedSubmission.content}
                        </div>
                    </div>
                </div>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 flex flex-col h-full overflow-hidden">
                <div className="p-6 border-b border-slate-200 bg-slate-50">
                    <h3 className="font-bold text-slate-800">Grading & Feedback</h3>
                </div>
                
                <div className="flex-1 overflow-y-auto p-6 space-y-6">
                    {activeTask.rubric ? (
                        <div className="space-y-6">
                            {activeTask.rubric.map((item) => (
                                <div key={item.id} className="space-y-2">
                                    <div className="flex justify-between text-sm">
                                        <span className="font-medium text-slate-700">{item.description}</span>
                                        <span className="font-bold text-indigo-600">{scores[item.id] || 0} / {item.maxPoints}</span>
                                    </div>
                                    <input 
                                        type="range" 
                                        min="0" 
                                        max={item.maxPoints} 
                                        value={scores[item.id] || 0}
                                        onChange={(e) => handleScoreChange(item.id, parseInt(e.target.value), item.maxPoints)}
                                        className="w-full accent-indigo-600 h-2 bg-slate-100 rounded-full appearance-none cursor-pointer"
                                    />
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="space-y-2">
                           <label className="block text-sm font-semibold text-slate-700">Total Score (Max {totalPossible})</label>
                           <input 
                              type="number" 
                              max={totalPossible}
                              className="w-full bg-slate-50 border border-slate-200 rounded-xl p-4 font-bold text-xl text-indigo-600 focus:ring-2 focus:ring-indigo-500 outline-none"
                              value={scores['global'] || 0}
                              onChange={(e) => handleScoreChange('global', parseInt(e.target.value), totalPossible)}
                           />
                        </div>
                    )}

                    <div className="space-y-2 pt-4">
                        <label className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                            <MessageSquare size={16} /> Comments
                        </label>
                        <textarea 
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl p-4 text-sm focus:ring-2 focus:ring-indigo-500 outline-none h-40 resize-none"
                            placeholder="Add evaluation comments..."
                            value={feedback}
                            onChange={(e) => setFeedback(e.target.value)}
                        />
                    </div>
                </div>

                <div className="p-6 border-t border-slate-200 bg-slate-50">
                    <div className="flex justify-between items-center mb-6">
                        <span className="text-sm font-bold text-slate-500 uppercase tracking-widest">Total Points</span>
                        <div className="flex items-baseline gap-1">
                          <span className="text-3xl font-bold text-indigo-600">{currentTotal}</span>
                          <span className="text-sm font-semibold text-slate-400">/ {totalPossible}</span>
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <button 
                            onClick={() => submitGrade('Rejected')}
                            className="flex items-center justify-center gap-2 py-3 border border-slate-200 text-slate-600 bg-white hover:bg-rose-50 hover:text-rose-600 hover:border-rose-100 rounded-xl transition-all font-bold text-sm"
                        >
                            <X size={18} /> Reject
                        </button>
                        <button 
                            onClick={() => submitGrade('Approved')}
                            className="flex items-center justify-center gap-2 py-3 bg-indigo-600 text-white hover:bg-indigo-700 rounded-xl transition-all font-bold text-sm shadow-md"
                        >
                            <Check size={18} /> Approve
                        </button>
                    </div>
                </div>
            </div>
         </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
       <div className="flex justify-between items-center">
           <div>
               <h2 className="text-3xl font-bold text-slate-800">Submissions Registry</h2>
               <p className="text-slate-500">Review and audit student work across all workshops.</p>
           </div>
           <button onClick={loadSubmissions} className="p-3 bg-white border border-slate-200 rounded-xl text-slate-500 hover:text-indigo-600 hover:bg-slate-50 transition-all shadow-sm">
             <Loader2 size={20} className={isLoading ? 'animate-spin' : ''} />
           </button>
       </div>

       <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
         <div className="overflow-x-auto">
            <table className="w-full text-left">
                <thead className="bg-slate-50 text-slate-500 border-b border-slate-200">
                    <tr>
                        <th className="px-6 py-4 font-bold uppercase tracking-wider text-xs">Module</th>
                        <th className="px-6 py-4 font-bold uppercase tracking-wider text-xs">Student ID</th>
                        <th className="px-6 py-4 font-bold uppercase tracking-wider text-xs">Submitted At</th>
                        <th className="px-6 py-4 font-bold uppercase tracking-wider text-xs">Status</th>
                        <th className="px-6 py-4 font-bold uppercase tracking-wider text-xs">Score</th>
                        <th className="px-6 py-4 font-bold uppercase tracking-wider text-xs text-right">Actions</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                    {submissions.length === 0 && (
                        <tr><td colSpan={6} className="text-center py-20 text-slate-400 italic">No submissions found</td></tr>
                    )}
                    {submissions.map(sub => (
                        <tr key={sub.id} className="hover:bg-slate-50 transition-colors group">
                            <td className="px-6 py-4 font-semibold text-slate-800">{sub.taskId}</td>
                            <td className="px-6 py-4 text-slate-600">{sub.studentId.toUpperCase()}</td>
                            <td className="px-6 py-4 text-xs text-slate-400">{new Date(sub.submittedAt).toLocaleString()}</td>
                            <td className="px-6 py-4">
                                <span className={`inline-flex items-center px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest 
                                    ${sub.status === 'Pending' ? 'bg-amber-100 text-amber-700' : 
                                      sub.status === 'Approved' ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
                                    {sub.status}
                                </span>
                            </td>
                            <td className="px-6 py-4 font-bold text-slate-700">{sub.status === 'Pending' ? '-' : sub.score}</td>
                            <td className="px-6 py-4 text-right">
                                {sub.status === 'Pending' ? (
                                    <button 
                                        onClick={() => setSelectedSubmissionId(sub.id)}
                                        className="px-4 py-2 bg-indigo-600 text-white font-bold text-xs uppercase rounded-lg shadow-sm hover:bg-indigo-700 transition-all"
                                    >
                                        Audit
                                    </button>
                                ) : (
                                    <div className="text-slate-400 text-xs font-bold uppercase">Archived</div>
                                )}
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
         </div>
       </div>
    </div>
  );
};

export default SubmissionGrader;
