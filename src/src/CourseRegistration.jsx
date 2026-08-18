import React, { useState, useEffect } from 'react';
import { collection, getDocs, query, where, addDoc } from 'firebase/firestore';
import { db, auth } from './firebase';

export default function CourseRegistration({ userData }) {
  const [currentTerm, setCurrentTerm] = useState(null);
  const [courses, setCourses] = useState([]);
  const [selectedCourseIds, setSelectedCourseIds] = useState([]);
  const [existingRegistration, setExistingRegistration] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const yearLevel = userData.yearLevel || 1;
      const semester = userData.semester || 1;

      const termsSnap = await getDocs(collection(db, 'terms'));
      const allTerms = termsSnap.docs.map(d => ({ id: d.id, ...d.data() }));
      const matchingTerm = allTerms.find(
        t => t.yearLevel === yearLevel && t.semester === semester && t.status === 'open'
      );
      setCurrentTerm(matchingTerm || null);

      if (matchingTerm) {
        const coursesSnap = await getDocs(
          query(collection(db, 'courses'), where('termId', '==', matchingTerm.id))
        );
        setCourses(coursesSnap.docs.map(d => ({ id: d.id, ...d.data() })));

        const regsSnap = await getDocs(
          query(
            collection(db, 'registrations'),
            where('studentId', '==', auth.currentUser.uid),
            where('termId', '==', matchingTerm.id)
          )
        );
        if (!regsSnap.empty) {
          const reg = { id: regsSnap.docs[0].id, ...regsSnap.docs[0].data() };
          setExistingRegistration(reg);
          setSelectedCourseIds(reg.courseIds || []);
        }
      }
    } catch (err) {
      console.error('Error loading registration data:', err);
    } finally {
      setLoading(false);
    }
  };

  const toggleCourse = (courseId) => {
    setSelectedCourseIds(prev =>
      prev.includes(courseId) ? prev.filter(id => id !== courseId) : [...prev, courseId]
    );
  };

  const handleSubmit = async () => {
    if (selectedCourseIds.length === 0) {
      alert('Please select at least one course.');
      return;
    }
    setSubmitting(true);
    try {
      await addDoc(collection(db, 'registrations'), {
        studentId: auth.currentUser.uid,
        termId: currentTerm.id,
        courseIds: selectedCourseIds,
        status: 'pending',
        submittedAt: new Date().toISOString()
      });
      alert('Registration submitted. It will be confirmed by the administration office.');
      loadData();
    } catch (err) {
      alert('Error submitting registration: ' + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const totalCredits = courses
    .filter(c => selectedCourseIds.includes(c.id))
    .reduce((sum, c) => sum + (c.credits || 0), 0);

  if (loading) {
    return (
      <div className="bg-gray-900 p-6 rounded-2xl border border-gray-800 shadow-xl text-center text-yellow-500 text-sm">
        Loading course registration...
      </div>
    );
  }

  if (!currentTerm) {
    return (
      <div className="bg-gray-900 p-6 rounded-2xl border border-gray-800 shadow-xl text-center">
        <p className="text-gray-300 text-sm">
          There is no open registration term for Year {userData.yearLevel || 1}, Semester {userData.semester || 1} right now.
          Please check back once the administration office opens registration.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-gray-900 p-6 rounded-2xl border border-gray-800 shadow-xl space-y-5">
      <div>
        <h3 className="text-xl font-bold text-white">Course Registration</h3>
        <p className="text-yellow-500 text-sm font-medium">{currentTerm.name}</p>
      </div>

      {existingRegistration && (
        <div className={`p-3 rounded-lg text-sm border ${
          existingRegistration.status === 'confirmed'
            ? 'bg-green-500/10 border-green-500/20 text-green-400'
            : 'bg-yellow-500/10 border-yellow-500/20 text-yellow-400'
        }`}>
          {existingRegistration.status === 'confirmed'
            ? 'Your registration for this term has been confirmed by admin.'
            : 'Your registration is submitted and awaiting confirmation from admin. You can still edit and resubmit below.'}
        </div>
      )}

      {courses.length === 0 ? (
        <p className="text-gray-400 text-sm">No courses have been added for this term yet.</p>
      ) : (
        <div className="space-y-2">
          {courses.map(course => (
            <label
              key={course.id}
              className="flex items-center justify-between p-3 bg-gray-950 rounded-lg border border-gray-800 cursor-pointer hover:border-gray-700"
            >
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={selectedCourseIds.includes(course.id)}
                  onChange={() => toggleCourse(course.id)}
                  className="w-4 h-4 accent-yellow-500"
                />
                <div>
                  <span className="text-xs text-yellow-500 font-mono font-bold mr-2">{course.courseCode}</span>
                  <span className="text-white text-sm">{course.courseName}</span>
                  <p className="text-xs text-gray-400">{course.lecturerName}</p>
                </div>
              </div>
              <span className="text-xs text-gray-400">{course.credits} cr</span>
            </label>
          ))}
        </div>
      )}

      {courses.length > 0 && (
        <div className="flex justify-between items-center pt-2 border-t border-gray-800">
          <span className="text-sm text-gray-300">
            Selected: {selectedCourseIds.length} course{selectedCourseIds.length !== 1 ? 's' : ''} • {totalCredits} credit hours
          </span>
          <button
            onClick={handleSubmit}
            disabled={submitting}
            className="bg-yellow-500 hover:bg-yellow-400 font-semibold text-gray-950 px-5 py-2 rounded-lg transition-all disabled:opacity-60"
          >
            {submitting ? 'Submitting...' : existingRegistration ? 'Update Registration' : 'Submit Registration'}
          </button>
        </div>
      )}
    </div>
  );
      }
