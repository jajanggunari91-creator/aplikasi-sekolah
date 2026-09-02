import React, { useState, useEffect, useCallback } from 'react';
import { User } from 'firebase/auth';
import {
  initAuth,
  googleSignIn,
  logoutGoogle,
  getAccessToken,
} from './services/googleAuth';
import {
  getSavedTeacherProfile,
  saveTeacherProfile,
  getSavedSheetConfig,
  saveSheetConfig,
  getLocalStudents,
  saveStudents,
  getAttendanceRecords,
  saveAttendanceRecord,
  markRecordAsSynced,
} from './services/storage';
import { appendAttendanceRecordToSheet } from './services/googleSheets';
import {
  ClassGrade,
  Student,
  Subject,
  AttendanceRecord,
  SheetConfig,
  SUBJECT_LIST,
} from './types';
import { Header } from './components/Header';
import { TeacherSetup } from './components/TeacherSetup';
import { AttendanceSheet } from './components/AttendanceSheet';
import { DailySummary } from './components/DailySummary';
import { HistoryLog } from './components/HistoryLog';
import { SpreadsheetManagerModal } from './components/SpreadsheetManagerModal';

export default function App() {
  // Navigation
  const [activeTab, setActiveTab] = useState<'attendance' | 'summary' | 'history' | 'sheets'>('attendance');

  // Auth & Workspace
  const [user, setUser] = useState<User | null>(null);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [sheetConfig, setSheetConfig] = useState<SheetConfig | null>(() => getSavedSheetConfig());
  const [isSheetModalOpen, setIsSheetModalOpen] = useState(false);

  // Teacher & Class Selection State
  const initialProfile = getSavedTeacherProfile();
  const [teacherName, setTeacherName] = useState(initialProfile.name || '');
  const [selectedSubject, setSelectedSubject] = useState<string>(
    initialProfile.defaultSubject || 'Koding dan Kecerdasan Artifisial'
  );
  const [selectedClass, setSelectedClass] = useState<ClassGrade>('10 TJKT');
  const [period, setPeriod] = useState('Jam ke 1 - 2 (07.00 - 08.30)');
  const [date, setDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [topic, setTopic] = useState('');

  // Data State
  const [students, setStudents] = useState<Student[]>(() => getLocalStudents('10 TJKT'));
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>(() =>
    getAttendanceRecords()
  );
  const [isSaving, setIsSaving] = useState(false);

  // Init Auth on mount
  useEffect(() => {
    const unsubscribe = initAuth(
      (currentUser) => {
        setUser(currentUser);
        // If teacher name is empty, prefill from Google Display Name
        if (!teacherName && currentUser.displayName) {
          setTeacherName(currentUser.displayName);
        }
      },
      () => {
        setUser(null);
      }
    );
    return () => {
      if (typeof unsubscribe === 'function') unsubscribe();
    };
  }, []);

  // Update students when selectedClass changes
  useEffect(() => {
    const classStudents = getLocalStudents(selectedClass);
    setStudents(classStudents);
  }, [selectedClass]);

  // Save teacher profile changes
  useEffect(() => {
    if (teacherName) {
      saveTeacherProfile({
        name: teacherName,
        defaultSubject: selectedSubject as Subject,
      });
    }
  }, [teacherName, selectedSubject]);

  // Auth Handlers
  const handleGoogleLogin = async () => {
    setIsLoggingIn(true);
    try {
      const res = await googleSignIn();
      if (res) {
        setUser(res.user);
        if (!teacherName && res.user.displayName) {
          setTeacherName(res.user.displayName);
        }
      }
    } catch (err: any) {
      console.error('Google Sign in failed:', err);
      alert(err.message || 'Gagal masuk dengan Google.');
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleGoogleLogout = async () => {
    try {
      await logoutGoogle();
      setUser(null);
    } catch (e) {
      console.error('Logout error:', e);
    }
  };

  // Sheet Config Handler
  const handleSaveSheetConfig = (config: SheetConfig | null) => {
    setSheetConfig(config);
    saveSheetConfig(config);
  };

  // Update student roster from Sheet
  const handleStudentsUpdated = (studentsByClass: Record<ClassGrade, Student[]>) => {
    const allExisting = getLocalStudents();
    let merged = [...allExisting];

    (Object.keys(studentsByClass) as ClassGrade[]).forEach((cls) => {
      const newItems = studentsByClass[cls];
      if (newItems && newItems.length > 0) {
        merged = merged.filter((s) => s.className !== cls).concat(newItems);
      }
    });

    saveStudents(merged);
    setStudents(getLocalStudents(selectedClass));
  };

  // Save Attendance (Local + Google Sheets if connected)
  const handleSaveAttendance = async (record: AttendanceRecord) => {
    setIsSaving(true);
    try {
      let isSynced = false;

      // If Google Sheet is connected and user is logged in, append to Sheet
      if (sheetConfig && user) {
        try {
          const token = await getAccessToken();
          if (token) {
            await appendAttendanceRecordToSheet(
              sheetConfig.spreadsheetId,
              sheetConfig.logSheetName || 'Rekap Absensi Harian',
              record
            );
            isSynced = true;
          }
        } catch (sheetErr: any) {
          console.warn('Could not sync to Google Sheets immediately:', sheetErr);
        }
      }

      const finalRecord: AttendanceRecord = {
        ...record,
        spreadsheetSynced: isSynced,
        syncedAt: isSynced ? new Date().toISOString() : undefined,
      };

      const updatedList = saveAttendanceRecord(finalRecord);
      setAttendanceRecords(updatedList);
    } finally {
      setIsSaving(false);
    }
  };

  // Manual Re-sync record to Google Sheets
  const handleSyncRecordToSheet = async (record: AttendanceRecord): Promise<boolean> => {
    if (!sheetConfig) {
      setIsSheetModalOpen(true);
      return false;
    }

    try {
      await appendAttendanceRecordToSheet(
        sheetConfig.spreadsheetId,
        sheetConfig.logSheetName || 'Rekap Absensi Harian',
        record
      );
      const updated = markRecordAsSynced(record.id);
      setAttendanceRecords(updated);
      return true;
    } catch (err: any) {
      alert(`Gagal menyinkronkan ke Sheet: ${err.message}`);
      return false;
    }
  };

  return (
    <div
      className="min-h-screen text-slate-100 flex flex-col font-sans selection:bg-blue-500 selection:text-white relative overflow-x-hidden"
      style={{
        background: 'radial-gradient(circle at top left, #1e3a8a, #0f172a), radial-gradient(circle at bottom right, #312e81, #1e1b4b)',
        backgroundColor: '#0f172a',
      }}
    >
      {/* Frosted Glass Background Glowing Light Orbs */}
      <div className="fixed top-[-10%] left-[-10%] w-[45vw] h-[45vw] bg-blue-500/20 rounded-full blur-[130px] pointer-events-none z-0"></div>
      <div className="fixed bottom-[-10%] right-[-10%] w-[45vw] h-[45vw] bg-indigo-500/20 rounded-full blur-[130px] pointer-events-none z-0"></div>
      <div className="fixed top-[45%] right-[25%] w-[30vw] h-[30vw] bg-sky-500/10 rounded-full blur-[150px] pointer-events-none z-0"></div>

      {/* Header */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        user={user}
        sheetConfig={sheetConfig}
        onLogin={handleGoogleLogin}
        onLogout={handleGoogleLogout}
        onOpenSheetModal={() => setIsSheetModalOpen(true)}
        isLoggingIn={isLoggingIn}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 z-10 relative">
        {/* Tab 1: Attendance Sheet Entry */}
        {activeTab === 'attendance' && (
          <div className="space-y-6 animate-in fade-in duration-200">
            {/* Teacher, Subject, Class setup bar */}
            <TeacherSetup
              teacherName={teacherName}
              setTeacherName={setTeacherName}
              selectedSubject={selectedSubject}
              setSelectedSubject={setSelectedSubject}
              selectedClass={selectedClass}
              setSelectedClass={setSelectedClass}
              period={period}
              setPeriod={setPeriod}
              date={date}
              setDate={setDate}
              topic={topic}
              setTopic={setTopic}
            />

            {/* Attendance Roster & Marking */}
            <AttendanceSheet
              students={students}
              teacherName={teacherName}
              selectedSubject={selectedSubject}
              selectedClass={selectedClass}
              period={period}
              date={date}
              topic={topic}
              sheetConfig={sheetConfig}
              onSaveAttendance={handleSaveAttendance}
              isSaving={isSaving}
              onOpenSheetModal={() => setIsSheetModalOpen(true)}
            />
          </div>
        )}

        {/* Tab 2: Daily Summary (Automatic recap for teachers) */}
        {activeTab === 'summary' && (
          <div className="animate-in fade-in duration-200">
            <DailySummary
              records={attendanceRecords}
              currentTeacherName={teacherName}
              onNavigateToAttendance={() => setActiveTab('attendance')}
            />
          </div>
        )}

        {/* Tab 3: History Logs */}
        {activeTab === 'history' && (
          <div className="animate-in fade-in duration-200">
            <HistoryLog
              records={attendanceRecords}
              sheetConfig={sheetConfig}
              onSyncRecordToSheet={handleSyncRecordToSheet}
            />
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-white/5 backdrop-blur-md border-t border-white/10 py-6 text-center text-xs text-slate-400 z-10 relative">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <p className="font-semibold text-slate-300">
            Sistem Informasi Presensi Guru Mata Pelajaran — SMK TJKT
          </p>
          <p className="text-slate-400">
            Terintegrasi Google Workspace (Drive & Spreadsheet API)
          </p>
        </div>
      </footer>

      {/* Spreadsheet Management Modal */}
      <SpreadsheetManagerModal
        isOpen={isSheetModalOpen}
        onClose={() => setIsSheetModalOpen(false)}
        sheetConfig={sheetConfig}
        onSaveConfig={handleSaveSheetConfig}
        onStudentsUpdated={handleStudentsUpdated}
        isLoggedIn={Boolean(user)}
        onTriggerLogin={handleGoogleLogin}
      />
    </div>
  );
}
