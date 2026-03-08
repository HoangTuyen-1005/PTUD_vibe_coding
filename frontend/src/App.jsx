import React, { useState, useEffect } from 'react';

const API_URL = 'http://localhost:8000/students';

function App() {
  const [students, setStudents] = useState([]);
  const [view, setView] = useState('list'); // 'list' hoặc 'form'
  const [formData, setFormData] = useState({
    student_id: '', name: '', birth_year: '', major: '', gpa: ''
  });
  const [isEditing, setIsEditing] = useState(false);

  // Fetch dữ liệu từ FastAPI
  const fetchStudents = async () => {
    const res = await fetch(API_URL);
    const data = await res.json();
    setStudents(data);
  };

  useEffect(() => {
    fetchStudents();
  }, []);

  // Xử lý Form Submit (Add hoặc Edit)
  const handleSubmit = async (e) => {
    e.preventDefault();
    const method = isEditing ? 'PUT' : 'POST';
    const url = isEditing ? `${API_URL}/${formData.student_id}` : API_URL;

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
    setView('list');
    setIsEditing(false);
    setFormData({ student_id: '', name: '', birth_year: '', major: '', gpa: '' });
  };

  // Xử lý Xóa sinh viên
  const handleDelete = async (id) => {
    if(window.confirm('Are you sure you want to delete this student?')) {
      await fetch(`${API_URL}/${id}`, { method: 'DELETE' });
      fetchStudents();
    }
  };

  // Xử lý Mở Form Sửa
  const handleEdit = (student) => {
    setFormData(student);
    setIsEditing(true);
    setView('form');
  };

  return (
    <div className="min-h-screen bg-gray-100 p-8 font-sans">
      <div className="max-w-4xl mx-auto bg-white p-6 rounded-lg shadow-md">
        
        {/* Header & Điều hướng */}
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-800">Student Management</h1>
          <button 
            onClick={() => {
              setView(view === 'list' ? 'form' : 'list');
              if (view === 'list') { setIsEditing(false); setFormData({ student_id: '', name: '', birth_year: '', major: '', gpa: '' }); }
            }}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            {view === 'list' ? '+ Add Student' : 'Back to List'}
          </button>
        </div>

        {/* Màn hình 1: Danh sách sinh viên */}
        {view === 'list' && (
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-200">
                <th className="p-3 border">ID</th>
                <th className="p-3 border">Name</th>
                <th className="p-3 border">Major</th>
                <th className="p-3 border">GPA</th>
                <th className="p-3 border text-center">Action</th>
              </tr>
            </thead>
            <tbody>
              {students.map((s) => (
                <tr key={s.student_id} className="hover:bg-gray-50">
                  <td className="p-3 border">{s.student_id}</td>
                  <td className="p-3 border">{s.name}</td>
                  <td className="p-3 border">{s.major}</td>
                  <td className="p-3 border">{s.gpa}</td>
                  <td className="p-3 border text-center space-x-2">
                    <button onClick={() => handleEdit(s)} className="bg-yellow-500 text-white px-3 py-1 rounded">Edit</button>
                    <button onClick={() => handleDelete(s.student_id)} className="bg-red-500 text-white px-3 py-1 rounded">Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {/* Màn hình 2: Form Thêm/Sửa sinh viên */}
        {view === 'form' && (
          <form onSubmit={handleSubmit} className="space-y-4">
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
            <button type="submit" className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700">
              {isEditing ? 'Update Student' : 'Add Student'}
            </button>
          </form>
        )}

      </div>
    </div>
  );
}

export default App;