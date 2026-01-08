
import React, { useState, useEffect } from 'react';
import { 
  Plus, ChevronDown, CheckSquare, ListChecks, FileText, Globe, GraduationCap, 
  Upload, HelpCircle, FileJson, Trash2, Edit2, Save, X, Calendar, ArrowLeft, Loader2, Eye
} from 'lucide-react';
import { mockService } from '../services/mockService';
import { Task, TaskType, RubricItem, QuizQuestion, Workshop } from '../types';
import { GoogleGenAI, Type } from "@google/genai";

interface ImportedTask extends Omit<Task, 'id' | 'workshopId'> {
  day: string; // e.g., "Day 1"
  tempId: string;
}

interface TaskManagerProps {
    workshopId?: string; // If provided, manage tasks only for this workshop
}

const TaskManager: React.FC<TaskManagerProps> = ({ workshopId }) => {
  // Use empty array for initial state as mockService.getTasks() is async
  const [tasks, setTasks] = useState<Task[]>([]);
  const [workshops, setWorkshops] = useState<Workshop[]>([]);
  const [view, setView] = useState<'list' | 'create' | 'import'>('list');

  // Form State
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState<TaskType>(TaskType.FILE_UPLOAD);
  const [points, setPoints] = useState(10);
  const [deadline, setDeadline] = useState('');
  
  // Evaluation Logic State
  const [rubric, setRubric] = useState<RubricItem[]>([]);
  const [quizQuestions, setQuizQuestions] = useState<QuizQuestion[]>([]);

  // Import State
  const [importedTasks, setImportedTasks] = useState<ImportedTask[]>([]);
  const [importStep, setImportStep] = useState<'upload' | 'preview'>('upload');
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<ImportedTask>>({});
  
  // Initialize with empty string; will be resolved in useEffect
  const [selectedWorkshopId, setSelectedWorkshopId] = useState<string>(workshopId || '');
  
  const [isParsing, setIsParsing] = useState(false);

  // View Details State
  const [viewingTask, setViewingTask] = useState<Task | null>(null);

  // Load tasks and workshops asynchronously on mount
  useEffect(() => {
    const loadData = async () => {
      const [t, w] = await Promise.all([mockService.getTasks(), mockService.getWorkshops()]);
      setTasks(t);
      setWorkshops(w);
      if (!selectedWorkshopId && w.length > 0 && !workshopId) {
        setSelectedWorkshopId(w[0].id);
      }
    };
    loadData();
  }, [workshopId]);

  // Sync prop changes if workshopId changes dynamically
  useEffect(() => {
      if (workshopId) setSelectedWorkshopId(workshopId);
  }, [workshopId]);

  // Filter tasks based on the workshop context
  const filteredTasks = workshopId 
      ? tasks.filter(t => t.workshopId === workshopId)
      : tasks;

  const handleAddRubricItem = () => {
    setRubric([...rubric, { id: `r${Date.now()}`, description: '', maxPoints: 5 }]);
  };

  const safeUpdateRubricItem = (index: number, field: keyof RubricItem, value: any) => {
    const newRubric = [...rubric];
    newRubric[index] = { ...newRubric[index], [field]: value };
    setRubric(newRubric);
  };

  const handleAddQuestion = () => {
    setQuizQuestions([...quizQuestions, { 
      id: `q${Date.now()}`, 
      question: '', 
      options: ['', '', '', ''], 
      correctAnswerIndex: 0, 
      points: 5 
    }]);
  };

  const updateQuestion = (index: number, field: keyof QuizQuestion, value: any) => {
    const newQs = [...quizQuestions];
    newQs[index] = { ...newQs[index], [field]: value };
    setQuizQuestions(newQs);
  };

  const updateOption = (qIndex: number, oIndex: number, value: string) => {
    const newQs = [...quizQuestions];
    newQs[qIndex].options[oIndex] = value;
    setQuizQuestions(newQs);
  };

  const parseFileWithGemini = async (fileContent: string) => {
    setIsParsing(true);
    try {
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
        const response = await ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: `You are a data parser. Extract workshop tasks from the following file content. 
            The file might be CSV, Text, Markdown, or JSON.
            Structure the output strictly as a JSON array of tasks.
            
            For "type", infer based on content: 
            - "QUIZ" if it has questions/options.
            - "FILE_UPLOAD" if it asks for screenshots or files.
            - "PROJECT_URL" if it asks for links/github.
            - "PROMPT" if it asks for text.
            
            Group them by "day" (e.g., "Day 1", "Day 2"). 
            If no day is specified, assume "Day 1".
            
            File Content:
            ${fileContent.substring(0, 40000)}`,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.ARRAY,
                    items: {
                        type: Type.OBJECT,
                        properties: {
                            day: { type: Type.STRING },
                            title: { type: Type.STRING },
                            description: { type: Type.STRING },
                            type: { type: Type.STRING, enum: ["QUIZ", "FILE_UPLOAD", "PROJECT_URL", "PROMPT", "DOCUMENTATION"] },
                            points: { type: Type.INTEGER },
                            deadline: { type: Type.STRING },
                            quizData: {
                                type: Type.ARRAY,
                                items: {
                                    type: Type.OBJECT,
                                    properties: {
                                        question: { type: Type.STRING },
                                        options: { type: Type.ARRAY, items: { type: Type.STRING } },
                                        correctAnswerIndex: { type: Type.INTEGER },
                                        points: { type: Type.INTEGER }
                                    }
                                }
                            },
                            rubric: {
                                type: Type.ARRAY,
                                items: {
                                    type: Type.OBJECT,
                                    properties: {
                                        description: { type: Type.STRING },
                                        maxPoints: { type: Type.INTEGER }
                                    }
                                }
                            }
                        },
                        required: ["day", "title", "type", "points"]
                    }
                }
            }
        });

        const parsedData = JSON.parse(response.text || '[]');
        
        const tasksToImport: ImportedTask[] = parsedData.map((item: any, idx: number) => ({
            tempId: `temp-${Date.now()}-${idx}`,
            day: item.day || 'Day 1',
            title: item.title || 'Untitled Task',
            description: item.description || '',
            type: item.type as TaskType,
            totalPoints: item.points || 10,
            deadline: item.deadline || '',
            rubric: item.rubric?.map((r: any, i: number) => ({...r, id: `r-${i}`})),
            quizData: item.quizData?.map((q: any, i: number) => ({...q, id: `q-${i}`}))
        }));

        if (tasksToImport.length === 0) {
            alert("No tasks could be identified in the file.");
        } else {
            setImportedTasks(tasksToImport);
            setImportStep('preview');
        }

    } catch (error) {
        console.error("Parsing failed", error);
        alert("Failed to parse file content. Please check the file format or try again.");
    } finally {
        setIsParsing(false);
    }
  };

  const handleBulkImportUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
        const content = e.target?.result as string;
        parseFileWithGemini(content);
    };
    reader.readAsText(file);
    event.target.value = '';
  };

  const handleCreateTask = async () => {
    const newTask: Task = {
      id: `t${Date.now()}`,
      title,
      description,
      workshopId: selectedWorkshopId,
      type,
      totalPoints: points,
      deadline,
      rubric: type !== TaskType.QUIZ ? rubric : undefined,
      quizData: type === TaskType.QUIZ ? quizQuestions : undefined
    };
    await mockService.addTask(newTask);
    setTasks(await mockService.getTasks());
    setView('list');
    resetForm();
  };

  const handleFinalizeImport = async () => {
      for (const imported of importedTasks) {
          const newTask: Task = {
              id: `t${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
              title: imported.title,
              description: imported.description,
              workshopId: selectedWorkshopId,
              type: imported.type,
              totalPoints: imported.totalPoints,
              deadline: imported.deadline,
              rubric: imported.rubric,
              quizData: imported.quizData
          };
          await mockService.addTask(newTask);
      }
      setTasks(await mockService.getTasks());
      setImportedTasks([]);
      setImportStep('upload');
      setView('list');
  };

  const handleDeleteImportedTask = (tempId: string) => {
      setImportedTasks(prev => prev.filter(t => t.tempId !== tempId));
  };

  const startEditImportedTask = (task: ImportedTask) => {
      setEditingTaskId(task.tempId);
      setEditForm(task);
  };

  const saveEditImportedTask = () => {
      setImportedTasks(prev => prev.map(t => t.tempId === editingTaskId ? { ...t, ...editForm } as ImportedTask : t));
      setEditingTaskId(null);
      setEditForm({});
  };

  const resetForm = () => {
    setTitle('');
    setDescription('');
    setType(TaskType.FILE_UPLOAD);
    setPoints(10);
    setRubric([]);
    setQuizQuestions([]);
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if(!file) return;
      const reader = new FileReader();
      reader.onload = (e) => {
          // Placeholder for manual single task upload logic
      };
      reader.readAsText(file);
  };
  
  const handleDeleteTask = async (taskId: string) => {
      if (window.confirm("Are you sure you want to delete this task?")) {
          await mockService.deleteTask(taskId);
          setTasks(await mockService.getTasks());
      }
  };

  // Group imported tasks by Day
  const groupedTasks = importedTasks.reduce((acc, task) => {
      if (!acc[task.day]) acc[task.day] = [];
      acc[task.day].push(task);
      return acc;
  }, {} as Record<string, ImportedTask[]>);

  const renderTaskDetailsModal = () => {
      if (!viewingTask) return null;
      return (
          <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden">
                  <div className="p-6 border-b border-slate-100 flex justify-between items-start">
                      <div>
                          <div className="flex items-center gap-2 mb-2">
                              <span className={`px-2 py-0.5 rounded text-xs font-bold uppercase tracking-wider
                                    ${viewingTask.type === TaskType.QUIZ ? 'bg-purple-100 text-purple-700' : 
                                      viewingTask.type === TaskType.FILE_UPLOAD ? 'bg-blue-100 text-blue-700' : 
                                      'bg-orange-100 text-orange-700'}`}>
                                    {viewingTask.type}
                                </span>
                                <span className="text-sm text-slate-500">
                                    {workshops.find(w => w.id === viewingTask.workshopId)?.title || 'Unknown Workshop'}
                                </span>
                          </div>
                          <h3 className="text-xl font-bold text-slate-800">{viewingTask.title}</h3>
                      </div>
                      <button onClick={() => setViewingTask(null)} className="text-slate-400 hover:text-slate-600">
                          <X size={24} />
                      </button>
                  </div>
                  
                  <div className="flex-1 overflow-y-auto p-6 space-y-6">
                      <div className="space-y-2">
                          <h4 className="text-sm font-bold text-slate-900 uppercase tracking-wide">Guidelines / Description</h4>
                          <p className="text-slate-600 text-sm whitespace-pre-line">{viewingTask.description || "No description provided."}</p>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                          <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                              <span className="block text-xs text-slate-500 uppercase">Points</span>
                              <span className="font-bold text-slate-800">{viewingTask.totalPoints}</span>
                          </div>
                          <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                              <span className="block text-xs text-slate-500 uppercase">Deadline</span>
                              <span className="font-bold text-slate-800">{viewingTask.deadline || "None"}</span>
                          </div>
                      </div>

                      {viewingTask.type === TaskType.QUIZ && viewingTask.quizData && (
                          <div className="space-y-3">
                              <h4 className="text-sm font-bold text-slate-900 uppercase tracking-wide">Quiz Questions ({viewingTask.quizData.length})</h4>
                              {viewingTask.quizData.map((q, i) => (
                                  <div key={i} className="border border-slate-200 rounded-lg p-3">
                                      <div className="flex justify-between mb-2">
                                          <span className="font-semibold text-sm text-slate-700">Q{i+1}: {q.question}</span>
                                          <span className="text-xs text-slate-500">{q.points} pts</span>
                                      </div>
                                      <ul className="space-y-1 ml-2">
                                          {q.options.map((opt, optIdx) => (
                                              <li key={optIdx} className={`text-sm flex items-center gap-2 ${optIdx === q.correctAnswerIndex ? 'text-green-700 font-medium' : 'text-slate-500'}`}>
                                                  <div className={`w-2 h-2 rounded-full ${optIdx === q.correctAnswerIndex ? 'bg-green-500' : 'bg-slate-300'}`}></div>
                                                  {opt}
                                              </li>
                                          ))}
                                      </ul>
                                  </div>
                              ))}
                          </div>
                      )}

                      {viewingTask.rubric && viewingTask.rubric.length > 0 && (
                          <div className="space-y-3">
                              <h4 className="text-sm font-bold text-slate-900 uppercase tracking-wide">Grading Rubric</h4>
                              <div className="space-y-2">
                                  {viewingTask.rubric.map((r, i) => (
                                      <div key={i} className="flex justify-between items-center bg-white border border-slate-100 p-2 rounded">
                                          <span className="text-sm text-slate-600">{r.description}</span>
                                          <span className="text-xs font-bold text-slate-400 bg-slate-100 px-2 py-1 rounded">{r.maxPoints} pts</span>
                                      </div>
                                  ))}
                              </div>
                          </div>
                      )}
                  </div>

                  <div className="p-4 border-t border-slate-100 bg-slate-50 flex justify-end">
                      <button onClick={() => setViewingTask(null)} className="px-4 py-2 bg-white border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-100 text-sm">
                          Close
                      </button>
                  </div>
              </div>
          </div>
      );
  };

  const renderImportView = () => (
      <div className="bg-white rounded-xl shadow-lg border border-slate-200 overflow-hidden max-w-5xl mx-auto relative">
          {isParsing && (
              <div className="absolute inset-0 bg-white/80 z-50 flex flex-col items-center justify-center">
                  <Loader2 className="animate-spin text-indigo-600 mb-2" size={48} />
                  <p className="text-indigo-900 font-semibold animate-pulse">Analyzing file content with Gemini...</p>
                  <p className="text-indigo-500 text-sm">Parsing format and structure</p>
              </div>
          )}

          <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
            <div className="flex items-center gap-3">
                <button onClick={() => setView('list')} className="text-slate-400 hover:text-indigo-600 transition-colors">
                    <ArrowLeft size={20} />
                </button>
                <h3 className="text-xl font-bold text-slate-800">Bulk Import Tasks</h3>
            </div>
            <div className="flex gap-3">
                {importStep === 'preview' && (
                    <>
                        <button onClick={() => { setImportedTasks([]); setImportStep('upload'); }} className="text-sm text-slate-500 hover:text-red-600 px-4">
                            Discard All
                        </button>
                        <button onClick={handleFinalizeImport} className="flex items-center gap-2 px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 shadow-md font-medium transition-colors">
                            <CheckSquare size={18} />
                            Create {importedTasks.length} Tasks
                        </button>
                    </>
                )}
            </div>
          </div>

          <div className="p-8">
              {importStep === 'upload' ? (
                  <div className="max-w-xl mx-auto space-y-6">
                      {!workshopId && (
                          <div className="space-y-2">
                              <label className="block text-sm font-medium text-slate-700">Select Workshop</label>
                              <select 
                                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none bg-white"
                                  value={selectedWorkshopId}
                                  onChange={(e) => setSelectedWorkshopId(e.target.value)}
                              >
                                  {workshops.map(w => (
                                      <option key={w.id} value={w.id}>{w.title}</option>
                                  ))}
                              </select>
                              <p className="text-xs text-slate-500">All imported tasks will be assigned to this workshop.</p>
                          </div>
                      )}

                      <div className="border-2 border-dashed border-slate-300 rounded-xl p-12 text-center bg-slate-50 hover:bg-slate-100 transition-colors relative">
                          <div className="w-16 h-16 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center mx-auto mb-4">
                              <Upload size={32} />
                          </div>
                          <h4 className="text-lg font-bold text-slate-800 mb-2">Upload Schedule File</h4>
                          <p className="text-slate-500 mb-6 text-sm">
                              Upload <strong>any text file</strong> (CSV, JSON, Markdown, Text). <br/>
                              Our AI will automatically parse days, tasks, questions, and guidelines.
                          </p>
                          <label className="inline-flex cursor-pointer">
                              <span className="px-6 py-3 bg-indigo-600 text-white rounded-lg font-medium shadow-md hover:bg-indigo-700 transition-colors">
                                  Select File
                              </span>
                              <input type="file" className="hidden" accept="*" onChange={handleBulkImportUpload} />
                          </label>
                      </div>

                      <div className="bg-indigo-50 p-4 rounded-lg border border-indigo-100 text-sm text-indigo-800">
                          <strong>💡 Tip:</strong> You can upload a plain text file like: <br/>
                          <em className="text-indigo-600">"Day 1: Intro Quiz. Question 1: What is React? Options: Library, Framework..."</em>
                      </div>
                  </div>
              ) : (
                  <div className="space-y-8">
                      {Object.keys(groupedTasks).sort().map(day => (
                          <div key={day} className="space-y-4">
                              <h4 className="text-lg font-bold text-slate-700 flex items-center gap-2">
                                  <Calendar size={20} className="text-indigo-500"/>
                                  {day}
                              </h4>
                              <div className="grid grid-cols-1 gap-4">
                                  {groupedTasks[day].map(task => (
                                      <div key={task.tempId} className={`p-4 rounded-lg border transition-all ${editingTaskId === task.tempId ? 'border-indigo-500 ring-1 ring-indigo-500 bg-white' : 'border-slate-200 bg-white hover:border-indigo-300'}`}>
                                          {editingTaskId === task.tempId ? (
                                              <div className="space-y-3">
                                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                      <div>
                                                          <label className="block text-xs font-semibold text-slate-500 mb-1">Title</label>
                                                          <input 
                                                              type="text" 
                                                              className="w-full px-3 py-2 border rounded text-sm focus:ring-1 focus:ring-indigo-500 outline-none"
                                                              value={editForm.title || ''}
                                                              onChange={e => setEditForm({...editForm, title: e.target.value})}
                                                          />
                                                      </div>
                                                      <div>
                                                          <label className="block text-xs font-semibold text-slate-500 mb-1">Type</label>
                                                          <select 
                                                              className="w-full px-3 py-2 border rounded text-sm focus:ring-1 focus:ring-indigo-500 outline-none"
                                                              value={editForm.type}
                                                              onChange={e => setEditForm({...editForm, type: e.target.value as TaskType})}
                                                          >
                                                              <option value={TaskType.QUIZ}>Quiz</option>
                                                              <option value={TaskType.FILE_UPLOAD}>File Upload</option>
                                                              <option value={TaskType.PROJECT_URL}>Project URL</option>
                                                              <option value={TaskType.PROMPT}>Text Prompt</option>
                                                          </select>
                                                      </div>
                                                  </div>
                                                  <div>
                                                       <label className="block text-xs font-semibold text-slate-500 mb-1">Guidelines</label>
                                                       <textarea 
                                                          className="w-full px-3 py-2 border rounded text-sm focus:ring-1 focus:ring-indigo-500 outline-none"
                                                          value={editForm.description || ''}
                                                          onChange={e => setEditForm({...editForm, description: e.target.value})}
                                                       />
                                                  </div>
                                                  <div className="flex justify-end gap-2 pt-2">
                                                      <button onClick={() => setEditingTaskId(null)} className="px-3 py-1 text-xs text-slate-500 hover:bg-slate-100 rounded">Cancel</button>
                                                      <button onClick={saveEditImportedTask} className="flex items-center gap-1 px-3 py-1 text-xs bg-indigo-600 text-white rounded hover:bg-indigo-700">
                                                          <Save size={14} /> Save
                                                      </button>
                                                  </div>
                                              </div>
                                          ) : (
                                              <div className="flex justify-between items-start">
                                                  <div>
                                                      <div className="flex items-center gap-2 mb-1">
                                                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider
                                                              ${task.type === TaskType.QUIZ ? 'bg-purple-100 text-purple-700' : 
                                                                task.type === TaskType.FILE_UPLOAD ? 'bg-blue-100 text-blue-700' : 
                                                                'bg-orange-100 text-orange-700'}`}>
                                                              {task.type}
                                                          </span>
                                                          <span className="text-xs text-slate-400 font-mono">{task.totalPoints} pts</span>
                                                      </div>
                                                      <h5 className="font-bold text-slate-800">{task.title}</h5>
                                                      <p className="text-sm text-slate-500 line-clamp-1 mt-1">{task.description}</p>
                                                      
                                                      {task.type === TaskType.QUIZ && task.quizData && (
                                                          <div className="mt-2 text-xs text-slate-500 flex items-center gap-1">
                                                              <HelpCircle size={12} /> {task.quizData.length} Questions
                                                          </div>
                                                      )}
                                                  </div>
                                                  <div className="flex items-center gap-2">
                                                      <button onClick={() => startEditImportedTask(task)} className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded transition-colors">
                                                          <Edit2 size={16} />
                                                      </button>
                                                      <button onClick={() => handleDeleteImportedTask(task.tempId)} className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors">
                                                          <Trash2 size={16} />
                                                      </button>
                                                  </div>
                                              </div>
                                          )}
                                      </div>
                                  ))}
                              </div>
                          </div>
                      ))}
                  </div>
              )}
          </div>
      </div>
  );

  const renderCreateView = () => (
    <div className="bg-white rounded-xl shadow-lg border border-slate-200 overflow-hidden max-w-4xl mx-auto">
      <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
        <h3 className="text-xl font-bold text-slate-800">Create New Task</h3>
        <button onClick={() => setView('list')} className="text-sm text-indigo-600 hover:underline">Cancel</button>
      </div>
      
      <div className="p-8 space-y-8">
        {/* Basic Info */}
        <section className="space-y-4">
            <h4 className="font-semibold text-slate-900 border-b pb-2">1. Basic Information</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Task Title</label>
                    <input type="text" className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none" 
                        value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g. Build a Landing Page" />
                </div>
                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Total Points</label>
                    <input type="number" className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none" 
                        value={points} onChange={e => setPoints(parseInt(e.target.value))} />
                </div>
                <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
                    <textarea className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none h-24" 
                        value={description} onChange={e => setDescription(e.target.value)} placeholder="Detailed instructions..." />
                </div>
                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Deadline</label>
                    <input type="date" className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none" 
                        value={deadline} onChange={e => setDeadline(e.target.value)} />
                </div>
                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Submission Type</label>
                    <div className="relative">
                        <select className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none appearance-none bg-white" 
                            value={type} onChange={e => setType(e.target.value as TaskType)}>
                            <option value={TaskType.FILE_UPLOAD}>File Upload (Screenshot/PDF)</option>
                            <option value={TaskType.PROJECT_URL}>Project URL (GitHub/Vercel)</option>
                            <option value={TaskType.QUIZ}>Quiz (Auto-evaluated)</option>
                            <option value={TaskType.PROMPT}>Text Prompt</option>
                        </select>
                        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={16} />
                    </div>
                </div>
            </div>
        </section>

        {/* Evaluation Logic */}
        <section className="space-y-4">
            <h4 className="font-semibold text-slate-900 border-b pb-2 flex justify-between items-center">
                <div className="flex items-center gap-2">
                    2. Evaluation Logic
                </div>
                
                {type !== TaskType.QUIZ ? (
                    <button onClick={handleAddRubricItem} className="text-xs bg-indigo-50 text-indigo-700 px-3 py-1 rounded-full hover:bg-indigo-100 transition flex items-center gap-1">
                        <Plus size={14} /> Add Check Item
                    </button>
                ) : (
                    <div className="flex gap-2">
                        <label className="cursor-pointer flex items-center gap-1 text-xs bg-white border border-indigo-200 text-indigo-700 px-3 py-1 rounded-full hover:bg-indigo-50 transition">
                            <Upload size={14} /> Import File
                            <input type="file" className="hidden" accept="*" onChange={handleFileUpload} />
                        </label>
                        <button onClick={handleAddQuestion} className="flex items-center gap-1 text-xs bg-indigo-50 text-indigo-700 px-3 py-1 rounded-full hover:bg-indigo-100 transition">
                            <Plus size={14} /> Add Question
                        </button>
                    </div>
                )}
            </h4>
            
            <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
                {type !== TaskType.QUIZ ? (
                    // Rubric / Checklist Builder
                    <div className="space-y-3">
                        {rubric.length === 0 && <p className="text-sm text-slate-500 italic text-center py-4">No evaluation criteria added yet.</p>}
                        {rubric.map((item, idx) => (
                            <div key={item.id} className="flex gap-3 items-start">
                                <span className="pt-2 text-slate-400 text-sm font-mono">{idx + 1}.</span>
                                <input 
                                    type="text" 
                                    placeholder="Criteria description (e.g. Code compiles without errors)"
                                    className="flex-1 px-3 py-2 border rounded-md text-sm focus:ring-1 focus:ring-indigo-500 outline-none"
                                    value={item.description}
                                    onChange={(e) => safeUpdateRubricItem(idx, 'description', e.target.value)}
                                />
                                <div className="w-24">
                                    <input 
                                        type="number" 
                                        placeholder="Pts"
                                        className="w-full px-3 py-2 border rounded-md text-sm focus:ring-1 focus:ring-indigo-500 outline-none"
                                        value={item.maxPoints}
                                        onChange={(e) => safeUpdateRubricItem(idx, 'maxPoints', parseInt(e.target.value))}
                                    />
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    // Quiz Builder
                    <div className="space-y-6">
                        {quizQuestions.length === 0 && <p className="text-sm text-slate-500 italic text-center py-4">No questions added yet. Import a file or add manually.</p>}
                        {quizQuestions.map((q, qIdx) => (
                            <div key={q.id} className="bg-white p-4 rounded-md border border-slate-200 shadow-sm">
                                <div className="flex justify-between mb-3">
                                    <h5 className="text-sm font-semibold text-slate-700">Question {qIdx + 1}</h5>
                                    <input 
                                        type="number" 
                                        className="w-20 px-2 py-1 border rounded text-xs"
                                        value={q.points}
                                        onChange={(e) => updateQuestion(qIdx, 'points', parseInt(e.target.value))}
                                        placeholder="Pts"
                                    />
                                </div>
                                <input 
                                    type="text" 
                                    className="w-full mb-3 px-3 py-2 border rounded-md text-sm bg-slate-50"
                                    placeholder="Enter question text..."
                                    value={q.question}
                                    onChange={(e) => updateQuestion(qIdx, 'question', e.target.value)}
                                />
                                <div className="grid grid-cols-2 gap-3">
                                    {q.options.map((opt, oIdx) => (
                                        <div key={oIdx} className="flex items-center gap-2">
                                            <input 
                                                type="radio" 
                                                name={`q-${q.id}`} 
                                                checked={q.correctAnswerIndex === oIdx}
                                                onChange={() => updateQuestion(qIdx, 'correctAnswerIndex', oIdx)}
                                                className="text-indigo-600 focus:ring-indigo-500"
                                            />
                                            <input 
                                                type="text" 
                                                className="flex-1 px-2 py-1 border rounded text-sm"
                                                placeholder={`Option ${oIdx + 1}`}
                                                value={opt}
                                                onChange={(e) => updateOption(qIdx, oIdx, e.target.value)}
                                            />
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </section>

        <div className="flex justify-end pt-4 border-t border-slate-100">
            <button onClick={handleCreateTask} className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 shadow-md font-medium transition-colors">
                Save & Publish Task
            </button>
        </div>
      </div>
    </div>
  );

  const renderListView = () => (
    <div className="space-y-6">
       {viewingTask && renderTaskDetailsModal()}
       <div className="flex justify-between items-center">
        <div>
           <h2 className="text-2xl font-bold text-slate-800">Task Management</h2>
           <p className="text-slate-500 text-sm mt-1">
               {workshopId ? 'Manage tasks for this workshop.' : 'Create, assign, and manage workshop tasks.'}
           </p>
        </div>
        <div className="flex gap-2">
             <button 
                onClick={() => setView('import')}
                className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 shadow-sm transition-colors"
            >
                <FileJson size={18} />
                Bulk Import
            </button>
            <button 
                onClick={() => setView('create')}
                className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 shadow-md transition-colors"
            >
                <Plus size={18} />
                Create Task
            </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredTasks.length === 0 && (
            <div className="col-span-3 text-center py-12 text-slate-400 bg-white rounded-xl border border-dashed border-slate-200">
                <p>No tasks found for this workshop.</p>
                <p className="text-xs mt-1">Create a new task or import from a file.</p>
            </div>
        )}
        {filteredTasks.map(task => (
            <div 
                key={task.id} 
                onClick={() => setViewingTask(task)}
                className="bg-white rounded-xl shadow-sm border border-slate-100 p-5 hover:shadow-md transition-all cursor-pointer group relative"
            >
                <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button 
                        onClick={(e) => { e.stopPropagation(); handleDeleteTask(task.id); }}
                        className="p-2 bg-white text-slate-400 hover:text-red-600 rounded-full shadow-sm border border-slate-100 hover:bg-red-50"
                        title="Delete Task"
                    >
                        <Trash2 size={16} />
                    </button>
                </div>
                
                <div className="flex justify-between items-start mb-3 pr-8">
                    <span className={`px-2 py-1 rounded text-xs font-semibold 
                        ${task.type === TaskType.QUIZ ? 'bg-purple-100 text-purple-700' : 
                          task.type === TaskType.FILE_UPLOAD ? 'bg-blue-100 text-blue-700' : 
                          'bg-orange-100 text-orange-700'}`}>
                        {task.type.replace('_', ' ')}
                    </span>
                    <span className="text-xs font-bold text-slate-500">{task.totalPoints} Pts</span>
                </div>
                <h3 className="font-bold text-slate-800 mb-2 group-hover:text-indigo-600 transition-colors">{task.title}</h3>
                <p className="text-sm text-slate-500 line-clamp-2 mb-4">{task.description}</p>
                <div className="pt-4 border-t border-slate-50 flex justify-between items-center text-xs text-slate-400">
                    <span className="flex items-center gap-1"><GraduationCap size={14}/> {workshops.find(w => w.id === task.workshopId)?.title.split(' ')[0] || 'Workshop'}</span>
                    <span>Due: {task.deadline || 'No Date'}</span>
                </div>
            </div>
        ))}
      </div>
    </div>
  );

  if (view === 'import') return renderImportView();
  return view === 'create' ? renderCreateView() : renderListView();
};

export default TaskManager;
