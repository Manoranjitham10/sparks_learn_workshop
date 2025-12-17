import React, { useState } from 'react';
import { Plus, MoreVertical, Search, FileDown, Edit, Trash2 } from 'lucide-react';
import { mockService } from '../services/mockService';
import { College } from '../types';

const CollegeManager: React.FC = () => {
  const [colleges, setColleges] = useState<College[]>(mockService.getColleges());
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newCollege, setNewCollege] = useState<Partial<College>>({ status: 'Active' });
  const [activeActionId, setActiveActionId] = useState<string | null>(null);

  const handleSaveCollege = () => {
    if (newCollege.name && newCollege.location) {
      if (newCollege.id) {
          // Update existing
          const updatedCollege = { ...newCollege } as College;
          mockService.updateCollege(updatedCollege);
          setColleges(mockService.getColleges());
      } else {
          // Create new
          const college: College = {
            id: `c${Date.now()}`,
            name: newCollege.name,
            location: newCollege.location,
            adminName: newCollege.adminName || 'Unassigned',
            studentCount: 0,
            status: newCollege.status as 'Active' | 'Inactive' || 'Active',
          };
          mockService.addCollege(college);
          setColleges(mockService.getColleges());
      }
      setIsModalOpen(false);
      setNewCollege({ status: 'Active' });
    }
  };

  const handleEditClick = (college: College) => {
      setNewCollege(college);
      setIsModalOpen(true);
      setActiveActionId(null);
  };

  const handleDeleteClick = (id: string) => {
      if(window.confirm("Are you sure you want to delete this college?")) {
          mockService.deleteCollege(id);
          setColleges(mockService.getColleges());
      }
      setActiveActionId(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
           <h2 className="text-2xl font-bold text-slate-800">College Management</h2>
           <p className="text-slate-500 text-sm mt-1">Manage registered institutions and their admins.</p>
        </div>
        
        <div className="flex gap-2 w-full sm:w-auto">
          <button className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-50 transition-colors">
            <FileDown size={18} />
            <span className="hidden sm:inline">Export</span>
          </button>
          <button 
            onClick={() => { setNewCollege({ status: 'Active' }); setIsModalOpen(true); }}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 shadow-md transition-colors w-full sm:w-auto justify-center"
          >
            <Plus size={18} />
            Add College
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden" style={{ minHeight: '300px' }}>
        <div className="p-4 border-b border-slate-100">
            <div className="relative max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input 
                    type="text" 
                    placeholder="Search colleges..." 
                    className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm"
                />
            </div>
        </div>
        <div className="overflow-x-visible">
          <table className="w-full text-left text-sm text-slate-600">
            <thead className="bg-slate-50 text-slate-800 font-semibold border-b border-slate-200">
              <tr>
                <th className="px-6 py-4">College Name</th>
                <th className="px-6 py-4">Location</th>
                <th className="px-6 py-4">Admin</th>
                <th className="px-6 py-4 text-center">Students</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {colleges.map((college) => (
                <tr key={college.id} className="hover:bg-slate-50 transition-colors relative">
                  <td className="px-6 py-4 font-medium text-slate-800">{college.name}</td>
                  <td className="px-6 py-4">{college.location}</td>
                  <td className="px-6 py-4">{college.adminName}</td>
                  <td className="px-6 py-4 text-center">
                    <span className="inline-flex items-center justify-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      {college.studentCount}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${college.status === 'Active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                      {college.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right relative">
                    <button 
                        onClick={() => setActiveActionId(activeActionId === college.id ? null : college.id)}
                        className={`transition-colors p-1 rounded hover:bg-slate-200 ${activeActionId === college.id ? 'text-indigo-600 bg-indigo-50' : 'text-slate-400'}`}
                    >
                      <MoreVertical size={18} />
                    </button>
                    
                    {activeActionId === college.id && (
                        <>
                            <div className="fixed inset-0 z-10 cursor-default" onClick={() => setActiveActionId(null)}></div>
                            <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-xl z-20 border border-slate-100 py-1 overflow-hidden ring-1 ring-black ring-opacity-5">
                                <button 
                                    onClick={() => handleEditClick(college)} 
                                    className="w-full text-left px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                                >
                                    <Edit size={14} className="text-slate-400" /> Edit Details
                                </button>
                                <button 
                                    onClick={() => handleDeleteClick(college.id)} 
                                    className="w-full text-left px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                                >
                                    <Trash2 size={14} /> Delete College
                                </button>
                            </div>
                        </>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
            <h3 className="text-xl font-bold text-slate-800 mb-4">{newCollege.id ? 'Edit College' : 'Add New College'}</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">College Name</label>
                <input 
                  type="text" 
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                  value={newCollege.name || ''}
                  onChange={e => setNewCollege({...newCollege, name: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Location</label>
                <input 
                  type="text" 
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                  value={newCollege.location || ''}
                  onChange={e => setNewCollege({...newCollege, location: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Admin Name</label>
                <input 
                  type="text" 
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                  value={newCollege.adminName || ''}
                  onChange={e => setNewCollege({...newCollege, adminName: e.target.value})}
                />
              </div>
              <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Status</label>
                  <select 
                      className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none bg-white"
                      value={newCollege.status}
                      onChange={e => setNewCollege({...newCollege, status: e.target.value as 'Active' | 'Inactive'})}
                  >
                      <option value="Active">Active</option>
                      <option value="Inactive">Inactive</option>
                  </select>
              </div>
            </div>
            <div className="mt-6 flex justify-end gap-3">
              <button 
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={handleSaveCollege}
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
              >
                {newCollege.id ? 'Save Changes' : 'Create College'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CollegeManager;