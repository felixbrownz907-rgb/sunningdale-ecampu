import React, { useState, useEffect } from 'react';
import { collection, getDocs, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from './firebase';

export default function AssignmentUpload() {
  const [courses, setCourses] = useState([]);
  const [selectedCourse, setSelectedCourse] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const coursesSnap = await getDocs(collection(db, 'courses'));
      setCourses(coursesSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));

      const assignmentsSnap = await getDocs(collection(db, 'assignments'));
      setAssignments(assignmentsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    } catch (err) {
      console.error("Error fetching assignments data:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!selectedCourse || !title) {
      alert("Please fill in all required fields.");
      return;
    }

    setUploading(true);
    try {
      await addDoc(collection(db, 'assignments'), {
        courseId: selectedCourse,
        title,
        description,
        createdAt: serverTimestamp()
      });
      setTitle('');
      setDescription('');
      setSelectedCourse('');
      fetchData();
      alert("Assignment published successfully!");
    } catch (err) {
      alert("Error publishing assignment: " + err.message);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-gray-900 p-6 rounded-2xl border border-gray-800 shadow-xl">
        <h3 className="text-xl font-bold text-white mb-2">Assignment & Coursework Hub</h3>
        <p className="text-gray-400 text-sm mb-6">Publish assignments or view coursework tasks linked to your enrolled modules.</p>

        <form onSubmit={handleUpload} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Select Course</label>
              <select
                value={selectedCourse}
                onChange={(e) => setSelectedCourse(e.target.value)}
                required
                className="w-full rounded-lg bg-gray-950 border border-gray-800 px-4 py-2.5 text-white focus:border-yellow-500 focus:outline-none"
              >
                <option value="">-- Choose Module --</option>
                {courses.map(course => (
                  <option key={course.id} value={course.id}>
                    {course.courseCode} - {course.courseName}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Assignment Title</label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g., Midterm Case Study Analysis"
                className="w-full rounded-lg bg-gray-950 border border-gray-800 px-4 py-2.5 text-white focus:border-yellow-500 focus:outline-none"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Description & Instructions</label>
            <textarea
              rows="3"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Provide assignment guidelines and submission parameters..."
              className="w-full rounded-lg bg-gray-950 border border-gray-800 px-4 py-2.5 text-white focus:border-yellow-500 focus:outline-none resize-none"
            ></textarea>
          </div>
          <button
            type="submit"
            disabled={uploading}
            className="w-full bg-yellow-500 hover:bg-yellow-400 font-semibold text-gray-950 py-3 rounded-lg transition-all shadow-lg shadow-yellow-500/10"
          >
            {uploading ? 'Publishing...' : 'Publish Assignment'}
          </button>
        </form>
      </div>

      <div className="bg-gray-900 p-6 rounded-2xl border border-gray-800 shadow-xl">
        <h4 className="text-lg font-bold text-white mb-4">Active Course Assignments</h4>
        {loading ? (
          <div className="text-center py-6 text-yellow-500 text-sm">Loading assignments...</div>
        ) : assignments.length === 0 ? (
          <p className="text-gray-400 text-sm">No assignments posted yet.</p>
        ) : (
          <div className="space-y-3">
            {assignments.map(item => (
              <div key={item.id} className="p-4 bg-gray-950 rounded-xl border border-gray-800 space-y-1">
                <h5 className="font-bold text-white">{item.title}</h5>
                <p className="text-xs text-gray-400">{item.description || 'No additional instructions provided.'}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
        }
