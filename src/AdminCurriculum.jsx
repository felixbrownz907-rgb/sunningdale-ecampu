import React, { useState, useEffect } from 'react';
import { collection, getDocs, addDoc, updateDoc, doc, deleteDoc } from 'firebase/firestore';
import { db } from './firebase';

export default function AdminCurriculum() {
  const [activeTab, setActiveTab] = useState('links');
  const [courses, setCourses] = useState([]);
  const [users, setUsers] = useState([]);
  const [externalLinks, setExternalLinks] = useState([]);
  const [loading, setLoading] = useState(false);

  // Form states for adding external integration gateway links
  const [systemName, setSystemName] = useState('');
  const [category, setCategory] = useState('Library Resource');
  const [targetUrl, setTargetUrl] = useState('');

  useEffect(() => {
    fetchAdminData();
  }, []);

  const fetchAdminData = async () => {
    setLoading(true);
    try {
      const coursesSnap = await getDocs(collection(db, 'courses'));
      setCourses(coursesSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));

      const usersSnap = await getDocs(collection(db, 'users'));
      setUsers(usersSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));

      const linksSnap = await getDocs(collection(db, 'external_links'));
      setExternalLinks(linksSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    } catch (err) {
      console.error("Error fetching admin control panel data:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddLink = async (e) => {
    e.preventDefault();
    try {
      await addDoc(collection(db, 'external_links'), {
        systemName,
        category,
        targetUrl,
        isActive: true,
        displayOrder: externalLinks.length + 1,
        targetRoles: ['student', 'lecturer', 'admin']
      });
      setSystemName('');
      setTargetUrl('');
      fetchAdminData();
    } catch (err) {
      alert("Error adding integration link: " + err.message);
    }
  };

  const toggleUserRole = async (userId, currentRole) => {
    const newRole = currentRole === 'student' ? 'lecturer' : 'student';
    try {
      await updateDoc(doc(db, 'users', userId), { role: newRole });
      fetchAdminData();
    } catch (err) {
      alert("Error updating role: " + err.message);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center bg-gray-900 p-6 rounded-2xl border border-gray-800 shadow-xl gap-4">
        <div>
          <h2 className="text-xl font-bold text-white">Administrative Management Portal</h2>
          <p className="text-gray-400 text-sm">Manage institutional curriculum, user access control, and external integration gateways.</p>
        </div>
        <div className="flex space-x-2 bg-gray-950 p-1.5 rounded-xl border border-gray-800">
          <button
            onClick={() => setActiveTab('links')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === 'links' ? 'bg-yellow-500 text-gray-950 font-semibold' : 'text-gray-400 hover:text-white'}`}
          >
            API Gateway Links
          </button>
          <button
            onClick={() => setActiveTab('users')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === 'users' ? 'bg-yellow-500 text-gray-950 font-semibold' : 'text-gray-400 hover:text-white'}`}
          >
            User Accounts
          </button>
          <button
            onClick={() => setActiveTab('courses')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === 'courses' ? 'bg-yellow-500 text-gray-950 font-semibold' : 'text-gray-400 hover:text-white'}`}
          >
            Courses
          </button>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12 text-yellow-500 font-medium">Loading administrative records...</div>
      ) : (
        <>
          {/* External Integration Gateway Section */}
          {activeTab === 'links' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="bg-gray-900 p-6 rounded-2xl border border-gray-800 shadow-xl h-fit">
                <h3 className="text-lg font-bold text-white mb-4">Add External Integration</h3>
                <form onSubmit={handleAddLink} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">System Name</label>
                    <input
                      type="text"
                      required
                      value={systemName}
                      onChange={(e) => setSystemName(e.target.value)}
                      placeholder="e.g., Zanaco Payment Portal"
                      className="w-full rounded-lg bg-gray-950 border border-gray-800 px-4 py-2.5 text-white focus:border-yellow-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">Category</label>
                    <select
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      className="w-full rounded-lg bg-gray-950 border border-gray-800 px-4 py-2.5 text-white focus:border-yellow-500 focus:outline-none"
                    >
                      <option value="Library Resource">Library Resource</option>
                      <option value="Finance">Finance</option>
                      <option value="Communication">Communication</option>
                      <option value="External LMS">External LMS</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">Target URL</label>
                    <input
                      type="url"
                      required
                      value={targetUrl}
                      onChange={(e) => setTargetUrl(e.target.value)}
                      placeholder="https://..."
                      className="w-full rounded-lg bg-gray-950 border border-gray-800 px-4 py-2.5 text-white focus:border-yellow-500 focus:outline-none"
                    />
                  </div>
                  <button
                    type="submit"
                    className="w-full bg-yellow-500 hover:bg-yellow-400 font-semibold text-gray-950 py-2.5 rounded-lg transition-all"
                  >
                    Register Integration Link
                  </button>
                </form>
              </div>

              <div className="lg:col-span-2 bg-gray-900 p-6 rounded-2xl border border-gray-800 shadow-xl">
                <h3 className="text-lg font-bold text-white mb-4">Active Gateway Integrations</h3>
                <div className="space-y-3">
                  {externalLinks.length === 0 ? (
                    <p className="text-gray-400 text-sm">No external systems registered yet.</p>
                  ) : (
                    externalLinks.map((link) => (
                      <div key={link.id} className="flex justify-between items-center p-4 bg-gray-950 rounded-xl border border-gray-800">
                        <div>
                          <h4 className="font-semibold text-white">{link.systemName}</h4>
                          <p className="text-xs text-yellow-500">{link.category} • <span className="text-gray-400">{link.targetUrl}</span></p>
                        </div>
                        <span className="px-2.5 py-1 text-xs rounded-full bg-green-500/10 text-green-400 border border-green-500/20 font-medium">
                          Active
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          )}

          {/* User Management Section */}
          {activeTab === 'users' && (
            <div className="bg-gray-900 p-6 rounded-2xl border border-gray-800 shadow-xl overflow-x-auto">
              <h3 className="text-lg font-bold text-white mb-4">Registered Platform Users</h3>
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-gray-800 text-gray-400 text-sm">
                    <th className="pb-3 px-4">Full Name</th>
                    <th className="pb-3 px-4">Email / ID</th>
                    <th className="pb-3 px-4">Department</th>
                    <th className="pb-3 px-4">Role</th>
                    <th className="pb-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-800 text-sm">
                  {users.map((u) => (
                    <tr key={u.id} className="hover:bg-gray-950/50">
                      <td className="py-3 px-4 font-medium text-white">{u.fullName}</td>
                      <td className="py-3 px-4 text-gray-400">{u.email}</td>
                      <td className="py-3 px-4 text-gray-400">{u.department || 'General'}</td>
                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 text-xs rounded-full bg-yellow-500/10 text-yellow-500 border border-yellow-500/20 font-semibold uppercase">
                          {u.role}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        {u.role !== 'admin' && (
                          <button
                            onClick={() => toggleUserRole(u.id, u.role)}
                            className="text-xs text-yellow-500 hover:underline font-medium"
                          >
                            Toggle Role
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Courses Section */}
          {activeTab === 'courses' && (
            <div className="bg-gray-900 p-6 rounded-2xl border border-gray-800 shadow-xl">
              <h3 className="text-lg font-bold text-white mb-4">Academic Modules & Courses</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {courses.length === 0 ? (
                  <p className="text-gray-400 text-sm col-span-full">No courses recorded in Firestore yet.</p>
                ) : (
                  courses.map((course) => (
                    <div key={course.id} className="p-4 bg-gray-950 rounded-xl border border-gray-800 space-y-2">
                      <span className="text-xs text-yellow-500 font-mono font-bold">{course.courseCode}</span>
                      <h4 className="font-bold text-white">{course.courseName}</h4>
                      <p className="text-xs text-gray-400">{course.department} • {course.semester}</p>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
          }
