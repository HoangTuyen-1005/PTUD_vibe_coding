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

  // Khởi tạo dữ liệu lớp học mẫu nếu chưa có
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
    if(window.confirm('Are you sure?')) {
      await fetch(`${API_URL}/students/${id}`, { method: 'DELETE' });
      fetchStudents();
      fetchStats();
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8 font-sans">
      <div className="max-w-5xl mx-auto bg-white p-6 rounded-lg shadow-md">
        
        <div className="flex justify-between items-center mb-6 border-b pb-4">
          <h1 className="text-3xl font-bold text-gray-800">Advanced Student Manager</h1>
          <div className="space-x-3">
            <a href={`${API_URL}/export`} className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 no-underline inline-block">
              Export CSV
            </a>
            <button onClick={() => setView(view === 'list' ? 'form' : 'list')} className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
              {view === 'list' ? '+ Add Student' : 'Back to List'}
            </button>
          </div>
        </div>

        {view === 'list' && (
          <>
            {/* Dashboard Thống kê */}
            <div className="grid grid-cols-3 gap-4 mb-6">
              <div className="bg-blue-100 p-4 rounded-lg shadow">
                <h3 className="text-gray-600 font-semibold">Total Students</h3>
                <p className="text-2xl font-bold">{stats.total_students}</p>
              </div>
              <div className="bg-green-100 p-4 rounded-lg shadow">
                <h3 className="text-gray-600 font-semibold">Average GPA</h3>
                <p className="text-2xl font-bold">{stats.average_gpa}</p>
              </div>
              <div className="bg-purple-100 p-4 rounded-lg shadow overflow-auto h-24">
                <h3 className="text-gray-600 font-semibold">By Major</h3>
                <ul className="text-sm">
                  {Object.entries(stats.by_major).map(([major, count]) => (
                    <li key={major}>• {major}: {count}</li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Thanh Tìm kiếm */}
            <form onSubmit={handleSearch} className="mb-4 flex gap-2">
              <input 
                type="text" 
                placeholder="Search student by name..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="p-2 border rounded w-full max-w-md"
              />
              <button type="submit" className="bg-gray-800 text-white px-4 py-2 rounded">Search</button>
              <button type="button" onClick={() => {setSearchQuery(''); fetchStudents('');}} className="bg-gray-300 px-4 py-2 rounded">Clear</button>
            </form>

            {/* Bảng dữ liệu */}
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-800 text-white">
                  <th className="p-3 border">ID</th>
                  <th className="p-3 border">Name</th>
                  <th className="p-3 border">Class ID</th>
                  <th className="p-3 border">Major</th>
                  <th className="p-3 border">GPA</th>
                  <th className="p-3 border text-center">Action</th>
                </tr>
              </thead>
              <tbody>
                {students.map((s) => (
                  <tr key={s.student_id} className="hover:bg-gray-100">
                    <td className="p-3 border">{s.student_id}</td>
                    <td className="p-3 border">{s.name}</td>
                    <td className="p-3 border font-semibold text-blue-600">{s.class_id}</td>
                    <td className="p-3 border">{s.major}</td>
                    <td className="p-3 border">{s.gpa}</td>
                    <td className="p-3 border text-center space-x-2">
                      <button onClick={() => { setFormData(s); setIsEditing(true); setView('form'); }} className="bg-yellow-500 text-white px-3 py-1 rounded">Edit</button>
                      <button onClick={() => handleDelete(s.student_id)} className="bg-red-500 text-white px-3 py-1 rounded">Delete</button>
                    </td>
                  </tr>
                ))}
                {students.length === 0 && <tr><td colSpan="6" className="p-4 text-center text-gray-500">No students found.</td></tr>}
              </tbody>
            </table>
          </>
        )}

        {/* Form Thêm/Sửa */}
        {view === 'form' && (
          <form onSubmit={handleSubmit} className="space-y-4 bg-gray-50 p-6 rounded border">
            {/* Các field cũ giữ nguyên */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-gray-700">Student ID</label>
                <input type="text" required disabled={isEditing} value={formData.student_id} onChange={(e) => setFormData({...formData, student_id: e.target.value})} className="w-full p-2 border rounded" />
              </div>
              <div>
                <label className="block text-gray-700">Name</label>
                <input type="text" required value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} className="w-full p-2 border rounded" />
              </div>
              <div>
                <label className="block text-gray-700">Birth Year</label>
                <input type="number" required value={formData.birth_year} onChange={(e) => setFormData({...formData, birth_year: e.target.value})} className="w-full p-2 border rounded" />
              </div>
              <div>
                <label className="block text-gray-700">Major</label>
                <input type="text" required value={formData.major} onChange={(e) => setFormData({...formData, major: e.target.value})} className="w-full p-2 border rounded" />
              </div>
              <div>
                <label className="block text-gray-700">GPA</label>
                <input type="number" step="0.1" required value={formData.gpa} onChange={(e) => setFormData({...formData, gpa: e.target.value})} className="w-full p-2 border rounded" />
              </div>
              
              {/* Field mới: Chọn Lớp học */}
              <div>
                <label className="block text-gray-700 font-bold">Class Assignment</label>
                <select required value={formData.class_id} onChange={(e) => setFormData({...formData, class_id: e.target.value})} className="w-full p-2 border rounded bg-white">
                  <option value="" disabled>Select a class</option>
                  {classes.map(c => (
                    <option key={c.class_id} value={c.class_id}>{c.class_id} - {c.class_name}</option>
                  ))}
                </select>
              </div>
            </div>

            <button type="submit" className="bg-green-600 text-white px-6 py-2 rounded hover:bg-green-700 mt-4">
              {isEditing ? 'Save Changes' : 'Create Student'}
            </button>
          </form>
        )}

      </div>
    </div>
  );
}

export default App;