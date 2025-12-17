import React, { useState } from 'react';
import { Check, X, ExternalLink, Download, MessageSquare } from 'lucide-react';
import { mockService } from '../services/mockService';
import { Submission, Task } from '../types';

const SubmissionGrader: React.FC = () => {
  const [submissions, setSubmissions] = useState<Submission[]>(mockService.getSubmissions());
  const [selectedSubmissionId, setSelectedSubmissionId] = useState<string | null>(null);
  
  // Grading State
  const [scores, setScores] = useState<Record<string, number>>({});
  const [feedback, setFeedback] = useState('');

  const selectedSubmission = submissions.find(s => s.id === selectedSubmissionId);
  const relatedTask = selectedSubmission ? mockService.getTasks().find(t => t.id === selectedSubmission.taskId) : null;
  const student = selectedSubmission ? mockService.getStudents().find(s => s.id === selectedSubmission.studentId) : null;

  const handleScoreChange = (rubricId: string, value: number, max: number) => {
    const val = Math.min(Math.max(0, value), max);
    setScores(prev => ({ ...prev, [rubricId]: val }));
  };

  const submitGrade = (status: 'Approved' | 'Rejected') => {
    if (!selectedSubmission) return;

    const totalScore = Object.values(scores).reduce((a: number, b: number) => a + b, 0);
    
    const updated: Submission = {
      ...selectedSubmission,
      status,
      score: status === 'Approved' ? totalScore : 0,
      feedback,
      breakdown: scores
    };

    mockService.updateSubmission(updated);
    setSubmissions(mockService.getSubmissions());
    setSelectedSubmissionId(null);
    setScores({});
    setFeedback('');
  };

  if (selectedSubmission && relatedTask && student) {
    const totalPossible = relatedTask.totalPoints;
    const currentTotal = Object.values(scores).reduce((a: number, b: number) => a + b, 0);

    return (
      <div className="h-full flex flex-col">
         <button onClick={() => setSelectedSubmissionId(null)} className="mb-4 text-indigo-600 text-sm hover:underline self-start">
            &larr; Back to Submissions
         </button>
         
         <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-6 h-full overflow-hidden">
            {/* Left: Content Viewer */}
            <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-slate-200 flex flex-col h-full overflow-hidden">
                <div className="p-4 border-b border-slate-200 bg-slate-50 flex justify-between items-center">
                    <div>
                        <h3 className="font-bold text-slate-800">{relatedTask.title}</h3>
                        <p className="text-xs text-slate-500">Submitted by <span className="font-semibold text-slate-700">{student.name}</span></p>
                    </div>
                    <span className="bg-blue-100 text-blue-700 text-xs px-2 py-1 rounded font-medium">{relatedTask.type}</span>
                </div>
                <div className="flex-1 bg-slate-100 p-8 flex items-center justify-center overflow-auto">
                    {relatedTask.type === 'PROJECT_URL' ? (
                        <div className="text-center">
                            <ExternalLink size={48} className="mx-auto text-slate-400 mb-4" />
                            <h4 className="text-lg font-medium text-slate-700 mb-2">External Link Submission</h4>
                            <a href="#" className="text-indigo-600 hover:underline break-all">{selectedSubmission.content}</a>
                            <p className="text-sm text-slate-500 mt-2">Open link in new tab to review.</p>
                        </div>
                    ) : (
                         <div className="text-center">
                            <Download size={48} className="mx-auto text-slate-400 mb-4" />
                            <h4 className="text-lg font-medium text-slate-700 mb-2">File Submission</h4>
                            <p className="font-mono bg-white px-3 py-1 rounded border text-sm">{selectedSubmission.content}</p>
                            <button className="mt-4 text-sm bg-indigo-600 text-white px-4 py-2 rounded shadow hover:bg-indigo-700">Download File</button>
                        </div>
                    )}
                </div>
            </div>

            {/* Right: Grading Panel */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 flex flex-col h-full overflow-hidden">
                <div className="p-4 border-b border-slate-200 bg-indigo-50">
                    <h3 className="font-bold text-indigo-900">Evaluation</h3>
                    <p className="text-xs text-indigo-700">Evaluate against defined criteria.</p>
                </div>
                
                <div className="flex-1 overflow-y-auto p-6 space-y-6">
                    {relatedTask.rubric ? (
                        <div className="space-y-4">
                            {relatedTask.rubric.map((item) => (
                                <div key={item.id} className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                                    <div className="flex justify-between text-sm mb-2">
                                        <span className="font-medium text-slate-700">{item.description}</span>
                                        <span className="text-slate-500 text-xs">Max: {item.maxPoints}</span>
                                    </div>
                                    <input 
                                        type="range" 
                                        min="0" 
                                        max={item.maxPoints} 
                                        value={scores[item.id] || 0}
                                        onChange={(e) => handleScoreChange(item.id, parseInt(e.target.value), item.maxPoints)}
                                        className="w-full accent-indigo-600 h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer"
                                    />
                                    <div className="text-right text-xs font-bold text-indigo-600 mt-1">
                                        {scores[item.id] || 0} / {item.maxPoints} Pts
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center text-slate-500 text-sm py-4">
                            No specific rubric. Assign global score.
                            <div className="mt-4">
                                 <label className="block text-left text-xs font-semibold mb-1">Total Score</label>
                                 <input 
                                    type="number" 
                                    max={totalPossible}
                                    className="w-full border rounded px-3 py-2"
                                    value={scores['global'] || 0}
                                    onChange={(e) => handleScoreChange('global', parseInt(e.target.value), totalPossible)}
                                 />
                            </div>
                        </div>
                    )}

                    <div className="space-y-2">
                        <label className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                            <MessageSquare size={16} /> Feedback
                        </label>
                        <textarea 
                            className="w-full border border-slate-300 rounded-lg p-3 text-sm focus:ring-2 focus:ring-indigo-500 outline-none h-32 resize-none"
                            placeholder="Constructive feedback for the student..."
                            value={feedback}
                            onChange={(e) => setFeedback(e.target.value)}
                        />
                    </div>
                </div>

                <div className="p-4 border-t border-slate-200 bg-slate-50">
                    <div className="flex justify-between items-center mb-4">
                        <span className="text-sm font-medium text-slate-600">Total Score</span>
                        <span className="text-xl font-bold text-indigo-700">{currentTotal} <span className="text-sm text-slate-400 font-normal">/ {totalPossible}</span></span>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                        <button 
                            onClick={() => submitGrade('Rejected')}
                            className="flex items-center justify-center gap-2 px-4 py-2 border border-red-200 text-red-700 bg-red-50 hover:bg-red-100 rounded-lg transition-colors font-medium text-sm"
                        >
                            <X size={16} /> Reject
                        </button>
                        <button 
                            onClick={() => submitGrade('Approved')}
                            className="flex items-center justify-center gap-2 px-4 py-2 bg-indigo-600 text-white hover:bg-indigo-700 rounded-lg transition-colors font-medium text-sm shadow-md"
                        >
                            <Check size={16} /> Approve
                        </button>
                    </div>
                </div>
            </div>
         </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
       <div>
           <h2 className="text-2xl font-bold text-slate-800">Submission Grading</h2>
           <p className="text-slate-500 text-sm mt-1">Review and grade pending student work.</p>
       </div>

       <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
         <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-600">
                <thead className="bg-slate-50 text-slate-800 font-semibold border-b border-slate-200">
                    <tr>
                        <th className="px-6 py-4">Task</th>
                        <th className="px-6 py-4">Student</th>
                        <th className="px-6 py-4">Submitted At</th>
                        <th className="px-6 py-4">Status</th>
                        <th className="px-6 py-4">Score</th>
                        <th className="px-6 py-4 text-right">Action</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                    {submissions.length === 0 && (
                        <tr><td colSpan={6} className="text-center py-8 text-slate-400 italic">No submissions found.</td></tr>
                    )}
                    {submissions.map(sub => {
                        const t = mockService.getTasks().find(task => task.id === sub.taskId);
                        const s = mockService.getStudents().find(stu => stu.id === sub.studentId);
                        if (!t || !s) return null;
                        return (
                            <tr key={sub.id} className="hover:bg-slate-50 transition-colors">
                                <td className="px-6 py-4 font-medium text-slate-800">{t.title}</td>
                                <td className="px-6 py-4">{s.name}</td>
                                <td className="px-6 py-4 text-slate-500">{new Date(sub.submittedAt).toLocaleDateString()}</td>
                                <td className="px-6 py-4">
                                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium 
                                        ${sub.status === 'Pending' ? 'bg-yellow-100 text-yellow-800' : 
                                          sub.status === 'Approved' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                        {sub.status}
                                    </span>
                                </td>
                                <td className="px-6 py-4 font-mono">{sub.status === 'Pending' ? '-' : sub.score}</td>
                                <td className="px-6 py-4 text-right">
                                    {sub.status === 'Pending' && (
                                        <button 
                                            onClick={() => setSelectedSubmissionId(sub.id)}
                                            className="text-indigo-600 hover:text-indigo-800 font-medium text-xs border border-indigo-200 px-3 py-1 rounded bg-indigo-50"
                                        >
                                            Grade
                                        </button>
                                    )}
                                </td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>
         </div>
       </div>
    </div>
  );
};

export default SubmissionGrader;