import React, { useState, useEffect } from 'react';
import { collection, getDocs, addDoc, updateDoc, doc, setDoc } from 'firebase/firestore';
import { initializeApp, deleteApp } from 'firebase/app';
import { getAuth, createUserWithEmailAndPassword, signOut } from 'firebase/auth';
import { db, firebaseConfig } from './firebase';

function generatePassword() {
  const digits = Math.floor(1000 + Math.random() * 9000);
  const letters = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
  const l1 = letters[Math.floor(Math.random() * letters.length)];
  const l2 = letters[Math.floor(Math.random() * letters.length)];
  return `Sun${digits}${l1}${l2}`;
}

async function createUserWithoutSignOut(email, password) {
  const tempAppName = `secondary-${Date.now()}`;
  const secondaryApp = initializeApp(firebaseConfig, tempAppName);
  const secondaryAuth = getAuth(secondaryApp);
  try {
    const userCredential = await createUserWithEmailAndPassword(secondaryAuth, email, password);
    const uid = userCredential.user.uid;
    await signOut(secondaryAuth);
    await deleteApp(secondaryApp);
    return uid;
  } catch (err) {
    await deleteApp(secondaryApp);
    throw err;
  }
}

export default function AdminCurriculum() {
  const [activeTab, setActiveTab] = useState('links');
  const [courses, setCourses] = useState([]);
  const [users, setUsers] = useState([]);
  const [externalLinks, setExternalLinks] = useState([]);
  const [terms, setTerms] = useState([]);
  const [registrations, setRegistrations] = useState([]);
  const [termResults, setTermResults] = useState([]);
  const [loading, setLoading] = useState(false);

  const [systemName, setSystemName] = useState('');
  const [category, setCategory] = useState('Library Resource');
  const [targetUrl, setTargetUrl] = useState('');

  const [newFullName, setNewFullName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newRole, setNewRole] = useState('student');
  const [newDepartment, setNewDepartment] = useState('');
  const [newYearLevel, setNewYearLevel] = useState(1);
  const [newSemester, setNewSemester] = useState(1);
  const [creatingUser, setCreatingUser] = useState(false);
  const [lastCreated, setLastCreated] = useState(null);

  const [newTermName, setNewTermName] = useState('');
  const [newTermYearLevel, setNewTermYearLevel] = useState(1);
  const [newTermSemester, setNewTermSemester] = useState(1);

  const [selectedTermId, setSelectedTermId] = useState('');
  const [newCourseCode, setNewCourseCode] = useState('');
  const [newCourseName, setNewCourseName] = useState('');
  const [newCourseCredits, setNewCourseCredits] = useState(3);
  const [newCourseLecturer, setNewCourseLecturer] = useState('');

  const [resultsTermId, setResultsTermId] = useState('');

  useEffect(() => {
    fetchAdminData();
  }, []);

  const fetchAdminData = async () => {
    setLoading(true);
    try {
      const coursesSnap = await getDocs(collection(db, 'courses'));
      setCourses(coursesSnap.docs.map(d => ({ id: d.id, ...d.data() })));

      const usersSnap = await getDocs(collection(db, 'users'));
      setUsers(usersSnap.docs.map(d => ({ id: d.id, ...d.data() })));

      const linksSnap = await getDocs(collection(db, 'external_links'));
      setExternalLinks(linksSnap.docs.map(d => ({ id: d.id, ...d.data() })));

      const termsSnap = await getDocs(collection(db, 'terms'));
      setTerms(termsSnap.docs.map(d => ({ id: d.id, ...d.data() })));

      const regsSnap = await getDocs(collection(db, 'registrations'));
      setRegistrations(regsSnap.docs.map(d => ({ id: d.id, ...d.data() })));

      const resultsSnap = await getDocs(collection(db, 'termResults'));
      setTermResults(resultsSnap.docs.map(d => ({ id: d.id, ...d.data() })));
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
        systemName, category, targetUrl,
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
    const newRoleValue = currentRole === 'student' ? 'lecturer' : 'student';
    try {
      await updateDoc(doc(db, 'users', userId), { role: newRoleValue });
      fetchAdminData();
    } catch (err) {
      alert("Error updating role: " + err.message);
    }
  };

  const handleCreateUser = async (e) => {
    e.preventDefault();
    if (!newFullName || !newEmail) {
      alert("Please fill in the name and email.");
      return;
    }

    setCreatingUser(true);
    setLastCreated(null);
    const generatedPassword = generatePassword();

    try {
      const uid = await createUserWithoutSignOut(newEmail, generatedPassword);

      const profile = {
        fullName: newFullName,
        email: newEmail,
        role: newRole,
        department: newDepartment || 'General'
      };
      if (newRole === 'student') {
        profile.yearLevel = Number(newYearLevel);
        profile.semester = Number(newSemester);
      }

      await setDoc(doc(db, 'users', uid), profile);

      setLastCreated({
        fullName: newFullName,
        email: newEmail,
        password: generatedPassword,
        role: newRole
      });

      setNewFullName('');
      setNewEmail('');
      setNewDepartment('');
      setNewRole('student');
      setNewYearLevel(1);
      setNewSemester(1);
      fetchAdminData();
    } catch (err) {
      if (err.code === 'auth/email-already-in-use') {
        alert("An account with this email already exists.");
      } else {
        alert("Error creating account: " + err.message);
      }
    } finally {
      setCreatingUser(false);
    }
  };

  const handleCreateTerm = async (e) => {
    e.preventDefault();
    if (!newTermName) {
      alert("Please give the term a name.");
      return;
    }
    try {
      await addDoc(collection(db, 'terms'), {
        name: newTermName,
        yearLevel: Number(newTermYearLevel),
        semester: Number(newTermSemester),
        status: 'open'
      });
      setNewTermName('');
      fetchAdminData();
    } catch (err) {
      alert("Error creating term: " + err.message);
    }
  };

  const closeTerm = async (termId) => {
    try {
      await updateDoc(doc(db, 'terms', termId), { status: 'closed' });
      fetchAdminData();
    } catch (err) {
      alert("Error closing term: " + err.message);
    }
  };

  const reopenTerm = async (termId) => {
    try {
      await updateDoc(doc(db, 'terms', termId), { status: 'open' });
      fetchAdminData();
    } catch (err) {
      alert("Error reopening term: " + err.message);
    }
  };

  const handleAddCourse = async (e) => {
    e.preventDefault();
    if (!selectedTermId || !newCourseCode || !newCourseName) {
      alert("Please select a term and fill in course code and name.");
      return;
    }
    try {
      await addDoc(collection(db, 'courses'), {
        termId: selectedTermId,
        courseCode: newCourseCode,
        courseName: newCourseName,
        credits: Number(newCourseCredits),
        lecturerName: newCourseLecturer || 'Unassigned'
      });
      setNewCourseCode('');
      setNewCourseName('');
      setNewCourseCredits(3);
      setNewCourseLecturer('');
      fetchAdminData();
    } catch (err) {
      alert("Error adding course: " + err.message);
    }
  };

  const confirmRegistration = async (regId) => {
    try {
      await updateDoc(doc(db, 'registrations', regId), { status: 'confirmed' });
      fetchAdminData();
    } catch (err) {
      alert("Error confirming registration: " + err.message);
    }
  };

  const markResult = async (studentId, termId, result, term) => {
    try {
      await addDoc(collection(db, 'termResults'), {
        studentId, termId, result, markedAt: new Date().toISOString()
      });

      if (result === 'passed' && term) {
        let nextYearLevel = term.yearLevel;
        let nextSemester = term.semester;
        if (term.semester === 1) {
          nextSemester = 2;
        } else {
          nextSemester = 1;
          nextYearLevel = term.yearLevel + 1;
        }
        await updateDoc(doc(db, 'users', studentId), {
          yearLevel: nextYearLevel,
          semester: nextSemester
        });
      }
      fetchAdminData();
    } catch (err) {
      alert("Error recording result: " + err.message);
    }
  };

  const getTermName = (termId) => terms.find(t => t.id === termId)?.name || 'Unknown Term';
  const getUserName = (userId) => users.find(u => u.id === userId)?.fullName || 'Unknown Student';
  const getCourseLabel = (courseId) => {
    const c = courses.find(c => c.id === courseId);
    return c ? `${c.courseCode} - ${c.courseName}` : courseId;
  };

  const coursesForSelectedTerm = courses.filter(c => c.termId === selectedTermId);
  const pendingRegistrations = registrations.filter(r => r.status === 'pending');
  const confirmedForResultsTerm = registrations.filter(r => r.status === 'confirmed' && r.termId === resultsTermId);
  const alreadyMarked = (studentId, termId) => termResults.some(r => r.studentId === studentId && r.termId === termId);
  const lecturers = users.filter(u => u.role === 'lecturer');

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center bg-gray-900 p-6 rounded-2xl border border-gray-800 shadow-xl gap-4">
        <div>
          <h2 className="text-xl font-bold text-white">Administrative Management Portal</h2>
          <p className="text-gray-400 text-sm">Manage terms, courses, registrations, user access, and integrations.</p>
        </div>
        <div className="flex flex-wrap gap-2 bg-gray-950 p-1.5 rounded-xl border border-gray-800">
          {[
            ['links', 'API Links'],
            ['users', 'User Accounts'],
            ['terms', 'Terms & Courses'],
            ['registrations', 'Registrations & Results']
          ].map(([key, label]) => (
            <button
              key={key}
              onClick={() => setActiveTab(key)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === key ? 'bg-yellow-500 text-gray-950 font-semibold' : 'text-gray-400 hover:text-white'}`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12 text-yellow-500 font-medium">Loading administrative records...</div>
      ) : (
        <>
          {activeTab === 'links' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="bg-gray-900 p-6 rounded-2xl border border-gray-800 shadow-xl h-fit">
                <h3 className="text-lg font-bold text-white mb-4">Add External Integration</h3>
                <form onSubmit={handleAddLink} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">System Name</label>
                    <input type="text" required value={systemName} onChange={(e) => setSystemName(e.target.value)}
                      placeholder="e.g., Zanaco Payment Portal"
                      className="w-full rounded-lg bg-gray-950 border border-gray-800 px-4 py-2.5 text-white focus:border-yellow-500 focus:outline-none" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">Category</label>
                    <select value={category} onChange={(e) => setCategory(e.target.value)}
                      className="w-full rounded-lg bg-gray-950 border border-gray-800 px-4 py-2.5 text-white focus:border-yellow-500 focus:outline-none">
                      <option value="Library Resource">Library Resource</option>
                      <option value="Finance">Finance</option>
                      <option value="Communication">Communication</option>
                      <option value="External LMS">External LMS</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">Target URL</label>
                    <input type="url" required value={targetUrl} onChange={(e) => setTargetUrl(e.target.value)}
                      placeholder="https://..."
                      className="w-full rounded-lg bg-gray-950 border border-gray-800 px-4 py-2.5 text-white focus:border-yellow-500 focus:outline-none" />
                  </div>
                  <button type="submit" className="w-full bg-yellow-500 hover:bg-yellow-400 font-semibold text-gray-950 py-2.5 rounded-lg transition-all">
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
                        <span className="px-2.5 py-1 text-xs rounded-full bg-green-500/10 text-green-400 border border-green-500/20 font-medium">Active</span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'users' && (
            <div className="space-y-6">
              <div className="bg-gray-900 p-6 rounded-2xl border border-gray-800 shadow-xl">
                <h3 className="text-lg font-bold text-white mb-1">Create New Account</h3>
                <p className="text-gray-400 text-sm mb-4">A secure password is generated automatically — you'll see it once after creation to share with the user.</p>

                <form onSubmit={handleCreateUser} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">Full Name</label>
                    <input type="text" required value={newFullName} onChange={(e) => setNewFullName(e.target.value)}
                      placeholder="e.g., Chanda Mwansa"
                      className="w-full rounded-lg bg-gray-950 border border-gray-800 px-4 py-2.5 text-white focus:border-yellow-500 focus:outline-none" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">Email</label>
                    <input type="email" required value={newEmail} onChange={(e) => setNewEmail(e.target.value)}
                      placeholder="name@sunningdale.edu"
                      className="w-full rounded-lg bg-gray-950 border border-gray-800 px-4 py-2.5 text-white focus:border-yellow-500 focus:outline-none" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">Role</label>
                    <select value={newRole} onChange={(e) => setNewRole(e.target.value)}
                      className="w-full rounded-lg bg-gray-950 border border-gray-800 px-4 py-2.5 text-white focus:border-yellow-500 focus:outline-none">
                      <option value="student">Student</option>
                      <option value="lecturer">Lecturer</option>
                      <option value="admin">Admin</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">Department</label>
                    <input type="text" value={newDepartment} onChange={(e) => setNewDepartment(e.target.value)}
                      placeholder="e.g., Business Administration"
                      className="w-full rounded-lg bg-gray-950 border border-gray-800 px-4 py-2.5 text-white focus:border-yellow-500 focus:outline-none" />
                  </div>

                  {newRole === 'student' && (
                    <>
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-1">Starting Year Level</label>
                        <select value={newYearLevel} onChange={(e) => setNewYearLevel(e.target.value)}
                          className="w-full rounded-lg bg-gray-950 border border-gray-800 px-4 py-2.5 text-white focus:border-yellow-500 focus:outline-none">
                          <option value={1}>Year 1</option>
                          <option value={2}>Year 2</option>
                          <option value={3}>Year 3</option>
                          <option value={4}>Year 4</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-1">Starting Semester</label>
                        <select value={newSemester} onChange={(e) => setNewSemester(e.target.value)}
                          className="w-full rounded-lg bg-gray-950 border border-gray-800 px-4 py-2.5 text-white focus:border-yellow-500 focus:outline-none">
                          <option value={1}>Semester 1</option>
                          <option value={2}>Semester 2</option>
                        </select>
                      </div>
                    </>
                  )}

                  <div className="md:col-span-2">
                    <button type="submit" disabled={creatingUser}
                      className="w-full bg-yellow-500 hover:bg-yellow-400 font-semibold text-gray-950 py-2.5 rounded-lg transition-all disabled:opacity-60">
                      {creatingUser ? 'Creating Account...' : 'Generate Account & Password'}
                    </button>
                  </div>
                </form>

                {lastCreated && (
                  <div className="mt-5 p-4 rounded-xl bg-green-500/10 border border-green-500/20 space-y-1">
                    <p className="text-sm font-semibold text-green-400">Account created successfully — share these credentials now, they won't be shown again:</p>
                    <p className="text-sm text-gray-200"><span className="text-gray-400">Name:</span> {lastCreated.fullName}</p>
                    <p className="text-sm text-gray-200"><span className="text-gray-400">Role:</span> {lastCreated.role}</p>
                    <p className="text-sm text-gray-200"><span className="text-gray-400">Email:</span> {lastCreated.email}</p>
                    <p className="text-sm text-gray-200"><span className="text-gray-400">Password:</span> <span className="font-mono font-bold text-yellow-400">{lastCreated.password}</span></p>
                  </div>
                )}
              </div>

              <div className="bg-gray-900 p-6 rounded-2xl border border-gray-800 shadow-xl overflow-x-auto">
                <h3 className="text-lg font-bold text-white mb-4">Registered Platform Users</h3>
                <table className="w-full text-left border-collapse
