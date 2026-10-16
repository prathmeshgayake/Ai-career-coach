import React, { useEffect, useState } from 'react';
import { User, Users, ChevronDown, Check, Plus, Sparkles } from 'lucide-react';
import { apiClient } from '../api/client';
import type { StudentProfile } from '../types';

interface StudentSwitcherProps {
  onStudentChanged?: (student: StudentProfile) => void;
}

export const StudentSwitcher: React.FC<StudentSwitcherProps> = ({ onStudentChanged }) => {
  const [students, setStudents] = useState<StudentProfile[]>([]);
  const [currentStudent, setCurrentStudent] = useState<StudentProfile | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Load students & active student
  useEffect(() => {
    let isMounted = true;
    apiClient.getStudents()
      .then((res) => {
        if (!isMounted) return;
        const list = Array.isArray(res.data) ? res.data : [];
        setStudents(list);

        const activeId = localStorage.getItem('activeStudentId') || 'student-aarav';
        const found = list.find((s) => s.id === activeId) || list[0] || null;
        setCurrentStudent(found);
      })
      .catch((err) => {
        console.error('Failed to load students', err);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const handleSelectStudent = async (studentId: string) => {
    setIsLoading(true);
    try {
      const res = await apiClient.switchStudent(studentId);
      const student = res.data;
      localStorage.setItem('activeStudentId', student.id);
      setCurrentStudent(student);
      setIsOpen(false);
      if (onStudentChanged) {
        onStudentChanged(student);
      } else {
        // Reload to let all current page hooks re-fetch with new x-user-id
        window.location.reload();
      }
    } catch (err) {
      console.error('Failed to switch student', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateNewStudent = () => {
    const name = window.prompt('Enter new student name:');
    if (!name || !name.trim()) return;
    const customId = `student-${name.trim().toLowerCase().replace(/[^a-z0-9]/g, '-')}-${Date.now().toString().slice(-4)}`;
    handleSelectStudent(customId);
  };

  if (!currentStudent) {
    return null;
  }

  return (
    <div style={{ position: 'relative', display: 'inline-block' }}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '8px',
          padding: '6px 12px',
          backgroundColor: '#ffffff',
          border: '1px solid #cbd5e1',
          borderRadius: '8px',
          cursor: 'pointer',
          boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
        }}
        title="Switch student profile"
      >
        <div
          style={{
            width: '24px',
            height: '24px',
            borderRadius: '50%',
            backgroundColor: '#eef2ff',
            color: '#4f46e5',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '0.75rem',
            fontWeight: 700,
          }}
        >
          {currentStudent.name ? currentStudent.name.charAt(0) : 'S'}
        </div>
        <div style={{ textAlign: 'left', lineHeight: 1.2 }}>
          <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#0f172a' }}>
            {currentStudent.name}
          </div>
          <div style={{ fontSize: '0.65rem', color: '#64748b' }}>
            {currentStudent.role || 'Student'}
          </div>
        </div>
        <ChevronDown size={14} color="#64748b" />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <>
          <div
            style={{ position: 'fixed', inset: 0, zIndex: 40 }}
            onClick={() => setIsOpen(false)}
          />
          <div
            style={{
              position: 'absolute',
              top: '100%',
              right: 0,
              marginTop: '6px',
              width: '280px',
              backgroundColor: '#ffffff',
              border: '1px solid #e2e8f0',
              borderRadius: '10px',
              boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1), 0 4px 6px -2px rgba(0,0,0,0.05)',
              zIndex: 50,
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                padding: '10px 14px',
                borderBottom: '1px solid #f1f5f9',
                backgroundColor: '#f8fafc',
              }}
            >
              <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Select Active Student Account
              </span>
              <p style={{ fontSize: '0.7rem', color: '#64748b', marginTop: '2px' }}>
                Each student has completely isolated records, repositories, and assessments.
              </p>
            </div>

            <div style={{ maxHeight: '240px', overflowY: 'auto' }}>
              {students.map((st) => {
                const isSelected = st.id === currentStudent.id;
                return (
                  <button
                    key={st.id}
                    type="button"
                    onClick={() => handleSelectStudent(st.id)}
                    style={{
                      width: '100%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '10px 14px',
                      border: 'none',
                      backgroundColor: isSelected ? '#f0fdf4' : 'transparent',
                      textAlign: 'left',
                      cursor: 'pointer',
                      borderBottom: '1px solid #f8fafc',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div
                        style={{
                          width: '28px',
                          height: '28px',
                          borderRadius: '50%',
                          backgroundColor: isSelected ? '#bbf7d0' : '#e2e8f0',
                          color: isSelected ? '#15803d' : '#475569',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '0.8rem',
                          fontWeight: 700,
                        }}
                      >
                        {st.name.charAt(0)}
                      </div>
                      <div>
                        <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#0f172a' }}>
                          {st.name}
                        </div>
                        <div style={{ fontSize: '0.7rem', color: '#64748b' }}>
                          {st.role} • @{st.githubUsername}
                        </div>
                      </div>
                    </div>
                    {isSelected && <Check size={16} color="#15803d" />}
                  </button>
                );
              })}
            </div>

            {/* Create new fresh student option */}
            <div style={{ padding: '8px', borderTop: '1px solid #f1f5f9', backgroundColor: '#ffffff' }}>
              <button
                type="button"
                onClick={handleCreateNewStudent}
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                  padding: '8px',
                  border: '1px dashed #cbd5e1',
                  borderRadius: '6px',
                  backgroundColor: '#f8fafc',
                  color: '#4f46e5',
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                <Plus size={14} />
                <span>Add Fresh Student Account</span>
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default StudentSwitcher;
