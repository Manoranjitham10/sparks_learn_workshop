
import React, { useState, useEffect } from 'react';
import { 
  Trophy, Medal, Star, Flame, Award, Zap, ChevronRight, 
  Target, TrendingUp, Sparkles, Loader2, BrainCircuit, ShieldCheck, 
  Cpu, Layers, ZapOff
} from 'lucide-react';
import { mockService } from '../services/mockService';
import { Student, College, Workshop, Task, TaskType } from '../types';
import { GoogleGenAI, Type } from "@google/genai";

interface AIBadge {
  name: string;
  description: string;
  category: 'Completion' | 'Consistency' | 'Quality' | 'Performance' | 'Excellence';
  rarity: 'Common' | 'Rare' | 'Epic';
  eligibilityRule: string;
  iconType: 'sparkle' | 'cpu' | 'zap' | 'award' | 'star';
}

const Gamification: React.FC = () => {
  const [students, setStudents] = useState<Student[]>([]);
  const [colleges, setColleges] = useState<College[]>([]);
  const [activeWorkshop, setActiveWorkshop] = useState<Workshop | null>(null);
  const [workshopTasks, setWorkshopTasks] = useState<Task[]>([]);
  const [aiBadges, setAiBadges] = useState<AIBadge[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadContext = async () => {
      try {
        const [sData, cData, wData, tData] = await Promise.all([
          mockService.getStudents(),
          mockService.getColleges(),
          mockService.getWorkshops(),
          mockService.getTasks()
        ]);

        setStudents(sData.sort((a, b) => b.totalPoints - a.totalPoints));
        setColleges(cData);

        // Find the most relevant workshop context
        const workshop = wData.find(w => w.status === 'Ongoing') || wData[0];
        setActiveWorkshop(workshop);

        if (workshop) {
          const tasks = tData.filter(t => t.workshopId === workshop.id);
          setWorkshopTasks(tasks);
          generateThemedBadges(workshop, tasks);
        }
      } catch (err) {
        console.error("Context loading failed", err);
        setError("Failed to synchronize with backend intelligence.");
      }
    };
    loadContext();
  }, []);

  const generateThemedBadges = async (workshop: Workshop, tasks: Task[]) => {
    setIsGenerating(true);
    setError(null);
    
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const prompt = `You are a Reward Architect for Sparks Learn.
      Analyze the current workshop context and generate 5 unique, themed badges.
      
      Workshop: ${workshop.title}
      Total Tasks: ${tasks.length}
      Task Types: ${Array.from(new Set(tasks.map(t => t.type))).join(', ')}
      Max Possible Points: ${tasks.reduce((sum, t) => sum + t.totalPoints, 0)}
      
      Requirements:
      1. Badge Names must align with the workshop theme "${workshop.title}".
      2. No generic names like 'Fast Finisher'. Use names like 'Neural Pioneer' if it's an AI workshop.
      3. Eligibility rules must be quantifiable (e.g., 'Submit 3 build tasks with >90% score').
      4. Distribute rarities: at least 1 Epic, 2 Rare, 2 Common.`;

      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                name: { type: Type.STRING },
                description: { type: Type.STRING },
                category: { type: Type.STRING, enum: ['Completion', 'Consistency', 'Quality', 'Performance', 'Excellence'] },
                rarity: { type: Type.STRING, enum: ['Common', 'Rare', 'Epic'] },
                eligibilityRule: { type: Type.STRING },
                iconType: { type: Type.STRING, enum: ['sparkle', 'cpu', 'zap', 'award', 'star'] }
              },
              required: ['name', 'description', 'category', 'rarity', 'eligibilityRule', 'iconType']
            }
          }
        }
      });

      const generated = JSON.parse(response.text || '[]');
      setAiBadges(generated);
    } catch (err) {
      console.error("AI Badge Generation failed", err);
      setError("AI Generation offline. Reverting to standard protocol.");
    } finally {
      setIsGenerating(false);
    }
  };

  const getRarityStyles = (rarity: string) => {
    switch (rarity) {
      case 'Epic': return 'border-purple-200 bg-purple-50 text-purple-700 ring-purple-500/20';
      case 'Rare': return 'border-indigo-200 bg-indigo-50 text-indigo-700 ring-indigo-500/20';
      default: return 'border-slate-200 bg-slate-50 text-slate-700 ring-slate-500/10';
    }
  };

  const getIcon = (type: string, rarity: string) => {
    const size = 24;
    const colorClass = rarity === 'Epic' ? 'text-purple-600' : rarity === 'Rare' ? 'text-indigo-600' : 'text-slate-600';
    
    switch (type) {
      case 'cpu': return <Cpu size={size} className={colorClass} />;
      case 'zap': return <Zap size={size} className={colorClass} />;
      case 'award': return <Award size={size} className={colorClass} />;
      case 'star': return <Star size={size} className={colorClass} />;
      default: return <Sparkles size={size} className={colorClass} />;
    }
  };

  const rest = students.slice(3);

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-6">
         <div>
             <div className="flex items-center gap-3 mb-2">
                <BrainCircuit className="text-indigo-600" size={32} />
                <h2 className="text-4xl font-black text-slate-800 tracking-tight uppercase leading-none">Incentive Intelligence</h2>
             </div>
             <p className="text-slate-500 text-lg font-medium">AI-driven gamification rules for <span className="text-indigo-600 font-black">{activeWorkshop?.title || 'Active Session'}</span>.</p>
         </div>
         <div className="flex gap-3">
             <button onClick={() => activeWorkshop && generateThemedBadges(activeWorkshop, workshopTasks)} disabled={isGenerating} className="px-6 py-3 bg-white border border-slate-200 text-slate-700 rounded-xl hover:bg-slate-50 font-black text-[10px] uppercase tracking-[3px] shadow-sm flex items-center gap-2">
                 <RefreshCw size={14} className={isGenerating ? 'animate-spin' : ''} /> Re-Synthesize Rewards
             </button>
             <button className="px-6 py-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 font-black text-[10px] uppercase tracking-[3px] shadow-xl">Deploy Assets</button>
         </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        <div className="lg:col-span-2 space-y-10">
            {/* Visual Podium */}
            <div className="bg-white rounded-[40px] border border-slate-200 p-10 shadow-sm relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-12 opacity-5 pointer-events-none group-hover:scale-110 transition-transform duration-700">
                   <BrainCircuit size={300} />
                </div>
                <div className="flex justify-center items-end gap-6 relative z-10">
                    {/* 2nd Place */}
                    {students[1] && (
                        <div className="flex flex-col items-center group/p">
                            <div className="w-20 h-20 rounded-[28px] bg-slate-100 border-4 border-slate-200 mb-4 flex items-center justify-center font-black text-slate-400 text-3xl group-hover/p:scale-110 transition-transform shadow-lg">{students[1].name.charAt(0)}</div>
                            <div className="w-32 h-44 bg-slate-50 rounded-t-[32px] border-t-4 border-slate-200 flex flex-col justify-end items-center p-6 shadow-xl">
                                <span className="font-black text-slate-700 text-center text-sm leading-tight mb-2">{students[1].name.split(' ')[0]}</span>
                                <span className="font-black text-indigo-600 text-lg">{students[1].totalPoints}</span>
                                <div className="mt-4 w-10 h-10 bg-slate-200 rounded-full flex items-center justify-center font-black text-slate-400 text-xl">2</div>
                            </div>
                        </div>
                    )}
                    
                    {/* 1st Place */}
                    {students[0] && (
                        <div className="flex flex-col items-center group/p">
                            <div className="relative mb-4">
                                <Flame className="absolute -top-10 left-1/2 -translate-x-1/2 text-orange-500 fill-orange-500 animate-bounce" size={40} />
                                <div className="w-28 h-28 rounded-[36px] bg-yellow-400 border-4 border-yellow-200 flex items-center justify-center font-black text-white text-4xl group-hover/p:scale-110 transition-transform shadow-2xl shadow-yellow-200">{students[0].name.charAt(0)}</div>
                            </div>
                            <div className="w-40 h-64 bg-slate-900 rounded-t-[40px] border-t-8 border-yellow-400 flex flex-col justify-end items-center p-8 shadow-2xl relative">
                                 <span className="font-black text-white text-center text-lg leading-tight mb-2">{students[0].name.split(' ')[0]}</span>
                                <span className="font-black text-yellow-400 text-2xl">{students[0].totalPoints}</span>
                                <div className="mt-6 w-14 h-14 bg-white/10 rounded-full flex items-center justify-center font-black text-yellow-400 text-3xl border border-white/20 shadow-inner">1</div>
                            </div>
                        </div>
                    )}

                    {/* 3rd Place */}
                    {students[2] && (
                        <div className="flex flex-col items-center group/p">
                            <div className="w-20 h-20 rounded-[28px] bg-amber-50 border-4 border-amber-200 mb-4 flex items-center justify-center font-black text-amber-600 text-3xl group-hover/p:scale-110 transition-transform shadow-lg">{students[2].name.charAt(0)}</div>
                            <div className="w-32 h-32 bg-amber-50 rounded-t-[32px] border-t-4 border-amber-200 flex flex-col justify-end items-center p-6 shadow-xl">
                                 <span className="font-black text-slate-700 text-center text-sm leading-tight mb-2">{students[2].name.split(' ')[0]}</span>
                                <span className="font-black text-indigo-600 text-lg">{students[2].totalPoints}</span>
                                <div className="mt-4 w-10 h-10 bg-amber-100 rounded-full flex items-center justify-center font-black text-amber-600 text-xl">3</div>
                            </div>
                        </div>
                    )}
                </div>
                <div className="absolute top-10 left-10 text-[10px] font-black text-slate-300 uppercase tracking-[4px]">Elite Performance Node</div>
            </div>

            {/* Sub-List */}
            <div className="bg-white rounded-[32px] border border-slate-200 shadow-sm overflow-hidden">
                <table className="w-full text-sm">
                    <thead className="bg-slate-50 text-slate-500">
                        <tr>
                            <th className="px-8 py-5 text-left font-black uppercase tracking-widest text-[10px]">Rank</th>
                            <th className="px-8 py-5 text-left font-black uppercase tracking-widest text-[10px]">Student Identity</th>
                            <th className="px-8 py-5 text-left font-black uppercase tracking-widest text-[10px]">Audit Points</th>
                            <th className="px-8 py-5 text-right font-black uppercase tracking-widest text-[10px]">Intelligence</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {rest.length === 0 ? (
                            <tr><td colSpan={4} className="p-10 text-center text-slate-400 italic font-medium">Awaiting node synchronization...</td></tr>
                        ) : rest.map((s, idx) => (
                            <tr key={s.id} className="hover:bg-slate-50 transition-colors">
                                <td className="px-8 py-5 font-black text-slate-300">#{idx + 4}</td>
                                <td className="px-8 py-5"><div className="flex items-center gap-3"><div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center font-black text-indigo-400 text-sm">{s.name.charAt(0)}</div><div><p className="font-black text-slate-800">{s.name}</p><p className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">{colleges.find(c => c.id === s.collegeId)?.name || 'Syncing...'}</p></div></div></td>
                                <td className="px-8 py-5 font-black text-indigo-600 text-lg">{s.totalPoints}</td>
                                <td className="px-8 py-5 text-right font-black text-emerald-500 uppercase text-[10px]"><div className="flex items-center justify-end gap-1"><TrendingUp size={14} /> Stable</div></td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>

        <div className="space-y-8">
            <div className="bg-white rounded-[32px] border border-slate-200 p-8 shadow-sm">
                <div className="flex justify-between items-center mb-8">
                    <h3 className="font-black text-slate-800 flex items-center gap-3 uppercase tracking-widest text-sm"><Layers className="text-indigo-500" size={20}/> Themed Rewards</h3>
                    {isGenerating && <Loader2 className="animate-spin text-indigo-600" size={18} />}
                </div>

                {isGenerating ? (
                  <div className="space-y-4">
                    {[1, 2, 3, 4, 5].map(i => (
                      <div key={i} className="h-24 bg-slate-50 rounded-2xl animate-pulse border border-slate-100"></div>
                    ))}
                    <p className="text-center text-[10px] font-black text-indigo-400 uppercase tracking-widest animate-pulse">AI is parsing workshop schema...</p>
                  </div>
                ) : error ? (
                  <div className="p-8 text-center bg-rose-50 rounded-3xl border border-rose-100">
                    <ZapOff className="text-rose-400 mx-auto mb-4" size={32} />
                    <p className="text-xs font-bold text-rose-800 uppercase tracking-widest">{error}</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                      {aiBadges.map((badge, idx) => (
                          <div key={idx} className={`p-5 rounded-2xl border transition-all group relative ring-1 ${getRarityStyles(badge.rarity)}`}>
                              <div className="flex items-center gap-5">
                                  <div className="w-14 h-14 flex items-center justify-center text-3xl bg-white/80 rounded-xl shadow-sm group-hover:scale-110 transition-transform">
                                      {getIcon(badge.iconType, badge.rarity)}
                                  </div>
                                  <div className="flex-1">
                                      <div className="flex justify-between items-start">
                                        <h4 className="font-black text-slate-800 text-sm group-hover:text-indigo-600 transition-colors uppercase tracking-tight">{badge.name}</h4>
                                        <span className="text-[7px] font-black uppercase px-2 py-0.5 rounded-full bg-white/50 border border-slate-200">{badge.rarity}</span>
                                      </div>
                                      <p className="text-[10px] font-bold text-slate-500 uppercase tracking-tight line-clamp-1">{badge.description}</p>
                                  </div>
                              </div>
                              <div className="mt-4 pt-4 border-t border-black/5">
                                  <div className="flex items-start gap-2">
                                      <ShieldCheck size={14} className="mt-0.5 opacity-50" />
                                      <div>
                                        <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Eligibility Protocol</p>
                                        <p className="text-[10px] font-bold text-slate-600 leading-tight">{badge.eligibilityRule}</p>
                                      </div>
                                  </div>
                              </div>
                          </div>
                      ))}
                  </div>
                )}
            </div>

            <div className="bg-slate-900 rounded-[32px] p-8 text-white shadow-2xl relative overflow-hidden group">
                <div className="relative z-10">
                    <div className="flex items-start justify-between mb-8">
                        <div>
                            <h4 className="font-black text-xl mb-1 uppercase tracking-tighter">Cohort Resonance</h4>
                            <p className="text-indigo-300 text-[10px] font-black uppercase tracking-widest">Neural Sync Status</p>
                        </div>
                        <Sparkles className="text-yellow-400 fill-yellow-400 animate-pulse" />
                    </div>
                    <div className="w-full bg-white/10 rounded-full h-3 mb-4">
                        <div className="bg-indigo-500 h-3 rounded-full shadow-[0_0_15px_rgba(99,102,241,0.6)] group-hover:w-[85%] transition-all duration-1000" style={{width: '65%'}}></div>
                    </div>
                    <div className="flex justify-between text-[10px] font-black text-indigo-300 uppercase tracking-widest">
                        <span>Current: 92%</span>
                        <span>Threshold: 100%</span>
                    </div>
                </div>
                <div className="absolute -right-10 -bottom-10 w-40 h-40 bg-indigo-500/10 rounded-full blur-3xl"></div>
            </div>
        </div>
      </div>
    </div>
  );
};

const RefreshCw: React.FC<any> = (props) => (
  <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" /><path d="M21 3v5h-5" /><path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16" /><path d="M3 21v-5h5" /></svg>
);

export default Gamification;
