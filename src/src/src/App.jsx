import React, { useState, useEffect } from 'react';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from './firebase';
import Login from './Login';
import AdminCurriculum from './AdminCurriculum';
import AttendanceTracker from './AttendanceTracker';
import AssignmentUpload from './AssignmentUpload';

export default function App() {
  const [user, setUser] = useState(null);
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('dashboard');

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        setUser(firebaseUser);
        try {
          const docRef = doc(db, 'users', firebaseUser.uid);
          const docSnap = await getDoc(docRef);
          if (docSnap.exists()) {
            setUserData(docSnap.data());
          }
        } catch (err) {
          console.error("Error fetching user profile:", err);
        }
      } else {
        setUser(null);
        setUserData(null);
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const handleLogout = () => signOut(auth);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-950 text-yellow-500 font-medium">
        Loading Sunningdale E-Campus...
      </div>
    );
  }

  if (!user || !userData) {
    return <Login onLoginSuccess={(data) => setUserData(data)} />;
  }

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 flex flex-col">
      {/* Top Navbar */}
      <header className="bg-gray-900 border-b border-gray-800 px-6 py-4 flex justify-between items-center shadow-md">
        <div className="flex items-center space-x-3">
          <img src="/logo.png" alt="Sunningdale Logo" className="h-10 w-auto object-contain" />
          <div>
            <h1 className="font-bold text-lg text-white tracking-wide">Sunningdale E-Campus</h1>
            <p className="text-xs text-yellow-500 uppercase tracking-wider font-semibold">
              {userData.role} Portal {userData.department ? `• ${userData.department}` : ''}
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-4">
          <span className="text-sm text-gray-300 hidden md:inline font-medium">{userData.fullName}</span>
          <button
            onClick={handleLogout}
            className="bg-red-500/10 text-red-400 hover:bg-red-500/20 px-3 py-1.5 rounded-lg text-sm font-medium border border-red-500/20 transition-colors"
          >
            Logout
          </button>
        </div>
      </header>

      {/* Dynamic Portal Content */}
      <main className="flex-1 p-6 max-w-7xl mx-auto w-full">
        {userData.role === 'admin' && <AdminCurriculum />}
        
        {userData.role === 'lecturer' && (
          <div className="space-y-6">
            <div className="flex space-x-2 border-b border-gray-800 pb-3">
              <button 
                onClick={() => setActiveTab('attendance')}
                className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors ${activeTab === 'attendance' ? 'bg-yellow-500 text-gray-950 font-semibold' : 'text-gray-400 hover:text-white bg-gray-900'}`}
              >
                Attendance Tracker
              </button>
              <button 
                onClick={() => setActiveTab('assignments')}
                className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors ${activeTab === 'assignments' ? 'bg-yellow-500 text-gray-950 font-semibold' : 'text-gray-400 hover:text-white bg-gray-900'}`}
              >
                Assignment Hub
              </button>
            </div>
            {activeTab === 'attendance' ? <AttendanceTracker /> : <AssignmentUpload />}
          </div>
        )}

        {userData.role === 'student' && (
          <div className="space-y-6">
            <div className="rounded-xl bg-gray-900 p-6 border border-gray-800 shadow-xl">
              <h2 className="text-xl font-bold text-white mb-2">Welcome back, {userData.fullName}</h2>
              <p className="text-gray-400 text-sm">
                Track your course progress, check semester registration status, and upload your coursework assignments below.
              </p>
            </div>
            <AssignmentUpload />
          </div>
        )}
      </main>
    </div>
  );
}
