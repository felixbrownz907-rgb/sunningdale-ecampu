import React, { useState, useEffect } from 'react';
import { collection, getDocs, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from './firebase';

export default function AttendanceTracker() {
  const [courses, setCourses] = useState([]);
  const [selectedCourse, setSelectedCourse] = useState('');
  const [students, setStudents] = useState([]);
  const [attendanceRecords, setAttendanceRecords] = useState({});
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchCoursesAndStudents();
  }, []);

  const fetchCoursesAndStudents = async () => {
    setLoading(true);
    try {
      const coursesSnap = await getDocs(collection(db, 'courses'));
      setCourses(coursesSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));

      const usersSnap = await getDocs(collection(db, 'users'));
      const studentList = usersSnap.docs
        .map(doc => ({ id: doc.id, ...doc.data() }))
        .filter(user => user.role === 'student');
      setStudents(studentList);
    } catch (err) {
      console.error("Error fetching roster data:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = (studentId, status) => {
    setAttendanceRecords(prev => ({
      ...prev,
      [studentId]: status
    }));
  };

  const saveAttendance = async (e) => {
    e.preventDefault();
    if (!selectedCourse) {
      alert("Please select a course first.");
      return;
    }

    setSaving(true);
    try {
      await addDoc(collection(db, 'attendance'), {
        courseId: selectedCourse,
        date: new Date().toISOString().split('T')[0],
        records: attendanceRecords,
        createdAt: serverTimestamp()
      });
      alert("Attendance successfully recorded!");
    } catch (err) {
      alert("Error saving attendance: " + err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="bg-gray-900 p-6 rounded-2xl border border-gray-800 shadow-xl space-y-6">
      <div>
        <h3 className="text-xl font-bold text-white">Lecturer Attendance Tracker</h3>
        <p className="text-gray-400 text-sm">Select a course to record student class attendance and participation.</p>
      </div>

      {loading ? (
        <div className="text-center py-8 text-yellow-500 font-medium">Loading roster details...</div>
      ) : (
        <form onSubmit={saveAttendance} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Select Course</label>
            <select
              value={selectedCourse}
              onChange={(e) => setSelectedCourse(e.target.value)}
              required
              className="w-full rounded-lg bg-gray-950 border border-gray-800 px-4 py-2.5 text-white focus:border-yellow-500 focus:outline-none"
            >
              <option value="">-- Choose Course Module --</option>
              {courses.map(course => (
                <option key={course.id} value={course.id}>
                  {course.courseCode} - {course.courseName}
                </option>
              ))}
            </select>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-gray-800 text-gray-400 text-sm">
                  <th className="pb-3 px-4">Student Name</th>
                  <th className="pb-3 px-4">Department</th>
                  <th className="pb-3 px-4 text-center">Status (Present / Absent / Late)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800 text-sm">
                {students.length === 0 ? (
                  <tr>
                    <td colSpan="3" className="py-4 text-center text-gray-400">No students found in database.</td>
                  </tr>
                ) : (
                  students.map(student => (
                    <tr key={student.id} className="hover:bg-gray-950/50">
                      <td className="py-3 px-4 font-medium text-white">{student.fullName}</td>
                      <td className="py-3 px-4 text-gray-400">{student.department || 'General'}</td>
                      <td className="py-3 px-4 text-center">
                        <div className="flex justify-center space-x-2">
                          {['Present', 'Absent', 'Late'].map(status => (
                            <button
                              type="button"
                              key={status}
                              onClick={() => handleStatusChange(student.id, status)}
                              className={`px-3 py-1 rounded-lg text-xs font-semibold transition-colors ${
                                attendanceRecords[student.id] === status
                                  ? status === 'Present'
                                    ? 'bg-green-500 text-gray-950'
                                    : status === 'Absent'
                                    ? 'bg-red-500 text-white'
                                    : 'bg-yellow-500 text-gray-950'
                                  : 'bg-gray-950 text-gray-400 border border-gray-800 hover:border-gray-700'
                              }`}
                            >
                              {status}
                            </button>
                          ))}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <button
            type="submit"
            disabled={saving || !selectedCourse}
            className="w-full bg-yellow-500 hover:bg-yellow-400 font-semibold text-gray-950 py-3 rounded-lg transition-all shadow-lg shadow-yellow-500/10"
          >
            {saving ? 'Saving Attendance...' : 'Submit Attendance Register'}
          </button>
        </form>
      )}
    </div>
  );
}
