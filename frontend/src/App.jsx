import React, { useState, useEffect } from 'react';

const API_URL = 'http://localhost:8000';

function App() {
  const [students, setStudents] = useState([]);
  const [classes, setClasses] = useState([]);
  const [stats, setStats] = useState({ total_students: 0, average_gpa: 0, by_major: {} });
  const [searchQuery, setSearchQuery] = useState('');
  
  const [view, setView] = useState('list');
  const [formData, setFormData] = useState({
    student_id: '', name: '', birth_year: '', major: '', gpa: '', class_id: ''
  });
  const [isEditing, setIsEditing] = useState(false);

  const initClasses = async () => {
    const res = await fetch(`${API_URL}/classes`);
    const data = await res.json();
    if (data.length === 0) {
      await fetch(`${API_URL}/classes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ class_id: 'C01', class_name: 'Khoa học máy tính 1', advisor: 'Nguyen Van A' })
      });
      fetchClasses();
    } else {
      setClasses(data);
    }
  };

  const fetchClasses = async () => {
    const res = await fetch(`${API_URL}/classes`);
    setClasses(await res.json());
  };

  const fetchStudents = async (query = '') => {
    const url = query ? `${API_URL}/students?name=${query}` : `${API_URL}/students`;
    const res = await fetch(url);
    setStudents(await res.json());
  };

  const fetchStats = async () => {
    const res = await fetch(`${API_URL}/statistics`);
    setStats(await res.json());
  };

  useEffect(() => {
    initClasses();
    fetchStudents();
    fetchStats();
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    fetchStudents(searchQuery);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const method = isEditing ? 'PUT' : 'POST';
    const url = isEditing ? `${API_URL}/students/${formData.student_id}` : `${API_URL}/students`;

    await fetch(url, {
      method: method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...formData,
        birth_year: parseInt(formData.birth_year),
        gpa: parseFloat(formData.gpa)
      })
    });

    fetchStudents();
    fetchStats();
    setView('list');
    setIsEditing(false);
    setFormData({ student_id: '', name: '', birth_year: '', major: '', gpa: '', class_id: '' });
  };

  const handleDelete = async (id) => {
    if(window.confirm('WARNING: Trục xuất sinh viên này khỏi hệ thống?')) {
      await fetch(`${API_URL}/students/${id}`, { method: 'DELETE' });
      fetchStudents();
      fetchStats();
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 p-8 font-sans bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-900 via-slate-950 to-black">
      <div className="max-w-6xl mx-auto">
        
        {/* Header Section */}
        <div className="flex justify-between items-center mb-10 pb-6 border-b border-slate-800/60">
          <div>
            <h1 className="text-4xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 to-fuchsia-500 drop-shadow-lg">
              Nexus Student Hub
            </h1>
            <p className="text-slate-400 mt-2 text-sm tracking-wider uppercase">Advanced Management System</p>
          </div>
          <div className="space-x-4">
            <a href={`${API_URL}/export`} className="inline-block bg-slate-800 border border-slate-700 hover:border-fuchsia-500 hover:text-fuchsia-400 text-slate-300 px-5 py-2.5 rounded-xl transition-all duration-300 shadow-[0_0_15px_rgba(217,70,239,0.1)] hover:shadow-[0_0_20px_rgba(217,70,239,0.3)]">
              ⬇ Export CSV
            </a>
            <button onClick={() => setView(view === 'list' ? 'form' : 'list')} className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white px-6 py-2.5 rounded-xl font-semibold transition-all duration-300 transform hover:scale-105 shadow-[0_0_20px_rgba(6,182,212,0.4)]">
              {view === 'list' ? '✦ Add Entity' : '← Return Home'}
            </button>
          </div>
        </div>

        {view === 'list' && (
          <div className="animate-fade-in">
            {/* Stats Dashboard - Glassmorphism */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
              <div className="bg-slate-900/50 backdrop-blur-xl border border-slate-800/80 p-6 rounded-2xl shadow-xl relative overflow-hidden group">
                <div className="absolute top-0 left-0 w-1 h-full bg-cyan-500 group-hover:w-full group-hover:opacity-10 transition-all duration-500"></div>
                <h3 className="text-slate-400 font-medium tracking-wide text-sm uppercase mb-2">Total Population</h3>
                <p className="text-4xl font-black text-cyan-400">{stats.total_students}</p>
              </div>
              
              <div className="bg-slate-900/50 backdrop-blur-xl border border-slate-800/80 p-6 rounded-2xl shadow-xl relative overflow-hidden group">
                <div className="absolute top-0 left-0 w-1 h-full bg-fuchsia-500 group-hover:w-full group-hover:opacity-10 transition-all duration-500"></div>
                <h3 className="text-slate-400 font-medium tracking-wide text-sm uppercase mb-2">Global GPA Avg</h3>
                <p className="text-4xl font-black text-fuchsia-400">{stats.average_gpa}</p>
              </div>
              
              <div className="bg-slate-900/50 backdrop-blur-xl border border-slate-800/80 p-6 rounded-2xl shadow-xl relative overflow-hidden h-32 overflow-y-auto custom-scrollbar group">
                <div className="absolute top-0 left-0 w-1 h-full bg-blue-500 group-hover:w-full group-hover:opacity-10 transition-all duration-500"></div>
                <h3 className="text-slate-400 font-medium tracking-wide text-sm uppercase mb-2">Demographics</h3>
                <ul className="text-sm space-y-1 text-slate-300">
                  {Object.entries(stats.by_major).map(([major, count]) => (
                    <li key={major} className="flex justify-between border-b border-slate-800/50 pb-1">
                      <span>{major}</span> <span className="text-blue-400 font-bold">{count}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Search Bar */}
            <form onSubmit={handleSearch} className="mb-6 flex gap-3">
              <input 
                type="text" 
                placeholder="Query database by name..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full max-w-lg bg-slate-900/80 border border-slate-700 text-slate-200 p-3 rounded-xl focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 focus:outline-none transition-all placeholder-slate-500"
              />
              <button type="submit" className="bg-slate-800 hover:bg-slate-700 text-white px-6 py-3 rounded-xl border border-slate-700 transition-colors">🔍</button>
              <button type="button" onClick={() => {setSearchQuery(''); fetchStudents('');}} className="bg-slate-900 hover:bg-red-900/40 text-slate-400 hover:text-red-400 px-6 py-3 rounded-xl border border-slate-800 transition-colors">Clear</button>
            </form>

            {/* Data Table */}
            <div className="bg-slate-900/60 backdrop-blur-lg border border-slate-800/80 rounded-2xl shadow-2xl overflow-hidden">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-950/80 text-slate-400 text-sm uppercase tracking-wider">
                    <th className="p-4 border-b border-slate-800 font-medium">ID</th>
                    <th className="p-4 border-b border-slate-800 font-medium">Name</th>
                    <th className="p-4 border-b border-slate-800 font-medium">Class</th>
                    <th className="p-4 border-b border-slate-800 font-medium">Major</th>
                    <th className="p-4 border-b border-slate-800 font-medium">GPA</th>
                    <th className="p-4 border-b border-slate-800 font-medium text-center">Protocol</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {students.map((s) => (
                    <tr key={s.student_id} className="hover:bg-slate-800/40 transition-colors duration-200 group">
                      <td className="p-4 font-mono text-slate-300">{s.student_id}</td>
                      <td className="p-4 font-medium text-slate-100">{s.name}</td>
                      <td className="p-4 text-cyan-400 font-semibold">{s.class_id}</td>
                      <td className="p-4 text-slate-300">{s.major}</td>
                      <td className="p-4 text-fuchsia-400 font-mono">{s.gpa}</td>
                      <td className="p-4 text-center space-x-3">
                        <button onClick={() => { setFormData(s); setIsEditing(true); setView('form'); }} className="text-yellow-500 hover:text-yellow-400 hover:scale-110 transition-transform px-2 py-1">
                          Edit
                        </button>
                        <button onClick={() => handleDelete(s.student_id)} className="text-red-500 hover:text-red-400 hover:scale-110 transition-transform px-2 py-1">
                          Del
                        </button>
                      </td>
                    </tr>
                  ))}
                  {students.length === 0 && (
                    <tr><td colSpan="6" className="p-8 text-center text-slate-500 italic">No entities found in the current sector.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Form Add/Edit */}
        {view === 'form' && (
          <div className="max-w-3xl mx-auto bg-slate-900/60 backdrop-blur-xl border border-slate-800 p-8 rounded-2xl shadow-2xl animate-fade-in">
            <h2 className="text-2xl font-bold mb-6 text-cyan-400 border-b border-slate-800 pb-4">
              {isEditing ? 'System Override: Edit Profile' : 'Initialize New Entity'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-slate-400 text-sm font-medium mb-2">Entity ID (Student ID)</label>
                  <input type="text" required disabled={isEditing} value={formData.student_id} onChange={(e) => setFormData({...formData, student_id: e.target.value})} className="w-full p-3 bg-slate-950 border border-slate-800 rounded-xl focus:ring-2 focus:ring-cyan-500 focus:outline-none text-slate-200 disabled:opacity-50" />
                </div>
                <div>
                  <label className="block text-slate-400 text-sm font-medium mb-2">Full Name</label>
                  <input type="text" required value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} className="w-full p-3 bg-slate-950 border border-slate-800 rounded-xl focus:ring-2 focus:ring-cyan-500 focus:outline-none text-slate-200" />
                </div>
                <div>
                  <label className="block text-slate-400 text-sm font-medium mb-2">Birth Year</label>
                  <input type="number" required value={formData.birth_year} onChange={(e) => setFormData({...formData, birth_year: e.target.value})} className="w-full p-3 bg-slate-950 border border-slate-800 rounded-xl focus:ring-2 focus:ring-cyan-500 focus:outline-none text-slate-200" />
                </div>
                <div>
                  <label className="block text-slate-400 text-sm font-medium mb-2">Specialization (Major)</label>
                  <input type="text" required value={formData.major} onChange={(e) => setFormData({...formData, major: e.target.value})} className="w-full p-3 bg-slate-950 border border-slate-800 rounded-xl focus:ring-2 focus:ring-cyan-500 focus:outline-none text-slate-200" />
                </div>
                <div>
                  <label className="block text-slate-400 text-sm font-medium mb-2">Performance Index (GPA)</label>
                  <input type="number" step="0.1" required value={formData.gpa} onChange={(e) => setFormData({...formData, gpa: e.target.value})} className="w-full p-3 bg-slate-950 border border-slate-800 rounded-xl focus:ring-2 focus:ring-cyan-500 focus:outline-none text-slate-200" />
                </div>
                <div>
                  <label className="block text-cyan-400 text-sm font-bold mb-2">Class Assignment</label>
                  <select required value={formData.class_id} onChange={(e) => setFormData({...formData, class_id: e.target.value})} className="w-full p-3 bg-slate-950 border border-slate-800 rounded-xl focus:ring-2 focus:ring-cyan-500 focus:outline-none text-slate-200 appearance-none">
                    <option value="" disabled>Select a class...</option>
                    {classes.map(c => (
                      <option key={c.class_id} value={c.class_id}>{c.class_id} - {c.class_name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex justify-end pt-4 border-t border-slate-800">
                <button type="submit" className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-400 hover:to-emerald-500 text-white px-8 py-3 rounded-xl font-bold transition-all transform hover:-translate-y-1 shadow-[0_0_15px_rgba(16,185,129,0.3)]">
                  {isEditing ? 'Commit Changes' : 'Initialize'}
                </button>
              </div>
            </form>
          </div>
        )}

      </div>
    </div>
  );
}

export default App;