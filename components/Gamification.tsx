import React from 'react';
import { Trophy, Medal, Star, Flame } from 'lucide-react';
import { mockService } from '../services/mockService';

const Gamification: React.FC = () => {
  const students = mockService.getStudents().sort((a, b) => b.totalPoints - a.totalPoints);
  const topThree = students.slice(0, 3);
  const rest = students.slice(3);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
         <div>
             <h2 className="text-2xl font-bold text-slate-800">Gamification & Leaderboard</h2>
             <p className="text-slate-500 text-sm mt-1">Track top performers and manage badges.</p>
         </div>
         <button className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 text-sm font-medium">
             Manage Rules
         </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Leaderboard Section */}
        <div className="lg:col-span-2 space-y-6">
            <h3 className="font-bold text-slate-700 flex items-center gap-2"><Trophy className="text-yellow-500" size={20}/> Global Leaderboard</h3>
            
            {/* Top 3 Podium (Visual) */}
            <div className="flex justify-center items-end gap-4 pb-8 pt-4">
                {topThree[1] && (
                    <div className="flex flex-col items-center">
                        <div className="w-16 h-16 rounded-full bg-slate-200 border-4 border-slate-300 mb-2 flex items-center justify-center font-bold text-slate-500 text-xl overflow-hidden">
                            {topThree[1].name.charAt(0)}
                        </div>
                        <div className="w-24 h-32 bg-slate-200 rounded-t-lg flex flex-col justify-end items-center p-2 shadow">
                            <span className="font-bold text-slate-600 text-center text-sm mb-1">{topThree[1].name}</span>
                            <span className="font-bold text-indigo-600 text-xs">{topThree[1].totalPoints} pts</span>
                            <div className="text-3xl font-bold text-slate-400 opacity-20">2</div>
                        </div>
                    </div>
                )}
                
                {topThree[0] && (
                    <div className="flex flex-col items-center">
                        <div className="relative">
                            <Flame className="absolute -top-6 left-1/2 -translate-x-1/2 text-orange-500 fill-orange-500" size={24} />
                            <div className="w-20 h-20 rounded-full bg-yellow-100 border-4 border-yellow-400 mb-2 flex items-center justify-center font-bold text-yellow-600 text-2xl overflow-hidden">
                                {topThree[0].name.charAt(0)}
                            </div>
                        </div>
                        <div className="w-28 h-40 bg-yellow-50 rounded-t-lg border-t-4 border-yellow-400 flex flex-col justify-end items-center p-2 shadow-lg z-10">
                             <span className="font-bold text-slate-800 text-center text-sm mb-1">{topThree[0].name}</span>
                            <span className="font-bold text-indigo-600 text-sm">{topThree[0].totalPoints} pts</span>
                            <div className="text-4xl font-bold text-yellow-600 opacity-20">1</div>
                        </div>
                    </div>
                )}

                {topThree[2] && (
                    <div className="flex flex-col items-center">
                        <div className="w-16 h-16 rounded-full bg-orange-100 border-4 border-orange-200 mb-2 flex items-center justify-center font-bold text-orange-600 text-xl overflow-hidden">
                             {topThree[2].name.charAt(0)}
                        </div>
                        <div className="w-24 h-24 bg-orange-50 rounded-t-lg flex flex-col justify-end items-center p-2 shadow">
                             <span className="font-bold text-slate-600 text-center text-sm mb-1">{topThree[2].name}</span>
                            <span className="font-bold text-indigo-600 text-xs">{topThree[2].totalPoints} pts</span>
                            <div className="text-3xl font-bold text-orange-900 opacity-10">3</div>
                        </div>
                    </div>
                )}
            </div>

            {/* List for rest */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
                <table className="w-full text-sm">
                    <thead className="bg-slate-50 text-slate-600">
                        <tr>
                            <th className="px-6 py-3 text-left">Rank</th>
                            <th className="px-6 py-3 text-left">Student</th>
                            <th className="px-6 py-3 text-left">College</th>
                            <th className="px-6 py-3 text-right">Points</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {rest.length > 0 ? rest.map((s, idx) => (
                            <tr key={s.id} className="hover:bg-slate-50">
                                <td className="px-6 py-3 font-mono text-slate-400">#{idx + 4}</td>
                                <td className="px-6 py-3 font-medium text-slate-700">{s.name}</td>
                                <td className="px-6 py-3 text-slate-500 text-xs">{(mockService.getColleges().find(c => c.id === s.collegeId)?.name)}</td>
                                <td className="px-6 py-3 text-right font-bold text-indigo-600">{s.totalPoints}</td>
                            </tr>
                        )) : (
                            <tr><td colSpan={4} className="text-center py-4 text-slate-400 text-xs">No more students ranked.</td></tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>

        {/* Badges Section */}
        <div className="space-y-6">
            <h3 className="font-bold text-slate-700 flex items-center gap-2"><Medal className="text-purple-500" size={20}/> Available Badges</h3>
            <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6 space-y-4">
                {mockService.getBadges().map(badge => (
                    <div key={badge.id} className="flex items-center gap-4 p-3 bg-slate-50 rounded-lg border border-slate-100 hover:border-indigo-200 transition-colors">
                        <div className="w-12 h-12 flex items-center justify-center text-2xl bg-white rounded-full shadow-sm">
                            {badge.icon}
                        </div>
                        <div>
                            <h4 className="font-bold text-slate-800 text-sm">{badge.name}</h4>
                            <p className="text-xs text-slate-500">{badge.criteria}</p>
                        </div>
                    </div>
                ))}
                <button className="w-full py-2 border border-dashed border-slate-300 rounded-lg text-slate-500 text-sm hover:bg-slate-50 hover:text-indigo-600 transition-colors">
                    + Create New Badge
                </button>
            </div>

            <div className="bg-gradient-to-br from-indigo-600 to-purple-700 rounded-xl shadow-lg p-6 text-white">
                <div className="flex items-start justify-between mb-4">
                    <div>
                        <h4 className="font-bold text-lg">Workshop Status</h4>
                        <p className="text-indigo-200 text-sm">Overall progress</p>
                    </div>
                    <Star className="text-yellow-400 fill-yellow-400" />
                </div>
                <div className="w-full bg-indigo-900/50 rounded-full h-2 mb-2">
                    <div className="bg-yellow-400 h-2 rounded-full" style={{width: '65%'}}></div>
                </div>
                <div className="flex justify-between text-xs text-indigo-200">
                    <span>Avg Points: 124</span>
                    <span>Target: 200</span>
                </div>
            </div>
        </div>
      </div>
    </div>
  );
};

export default Gamification;
