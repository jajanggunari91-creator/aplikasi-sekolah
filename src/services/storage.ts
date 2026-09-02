import { AttendanceRecord, Student, SheetConfig, TeacherProfile, ClassGrade } from '../types';
import { INITIAL_STUDENTS } from '../data/initialData';

const STORAGE_KEYS = {
  ATTENDANCE_RECORDS: 'absensi_tjkt_records_v1',
  STUDENTS: 'absensi_tjkt_students_v1',
  SHEET_CONFIG: 'absensi_tjkt_sheet_config_v1',
  TEACHER_PROFILE: 'absensi_tjkt_teacher_profile_v1',
  ACTIVE_SESSION: 'absensi_tjkt_active_session_v1',
};

// Teacher Profile
export const getSavedTeacherProfile = (): TeacherProfile => {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.TEACHER_PROFILE);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.error('Error reading teacher profile:', e);
  }
  return { name: '', defaultSubject: 'Koding dan Kecerdasan Artifisial' };
};

export const saveTeacherProfile = (profile: TeacherProfile) => {
  try {
    localStorage.setItem(STORAGE_KEYS.TEACHER_PROFILE, JSON.stringify(profile));
  } catch (e) {
    console.error('Error saving teacher profile:', e);
  }
};

// Sheet Config
export const getSavedSheetConfig = (): SheetConfig | null => {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.SHEET_CONFIG);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.error('Error reading sheet config:', e);
  }
  return null;
};

export const saveSheetConfig = (config: SheetConfig | null) => {
  try {
    if (config) {
      localStorage.setItem(STORAGE_KEYS.SHEET_CONFIG, JSON.stringify(config));
    } else {
      localStorage.removeItem(STORAGE_KEYS.SHEET_CONFIG);
    }
  } catch (e) {
    console.error('Error saving sheet config:', e);
  }
};

// Students (local store & cached from sheet)
export const getLocalStudents = (className?: ClassGrade): Student[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.STUDENTS);
    const allStudents: Student[] = raw ? JSON.parse(raw) : INITIAL_STUDENTS;
    if (className) {
      return allStudents.filter((s) => s.className === className);
    }
    return allStudents;
  } catch (e) {
    console.error('Error reading students:', e);
    return className ? INITIAL_STUDENTS.filter((s) => s.className === className) : INITIAL_STUDENTS;
  }
};

export const saveStudents = (students: Student[]) => {
  try {
    localStorage.setItem(STORAGE_KEYS.STUDENTS, JSON.stringify(students));
  } catch (e) {
    console.error('Error saving students:', e);
  }
};

export const updateClassStudents = (className: ClassGrade, newStudents: Student[]) => {
  const current = getLocalStudents();
  const filtered = current.filter((s) => s.className !== className);
  const updated = [...filtered, ...newStudents];
  saveStudents(updated);
};

// Attendance Records
export const getAttendanceRecords = (): AttendanceRecord[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.ATTENDANCE_RECORDS);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch (e) {
    console.error('Error reading attendance records:', e);
  }
  return [];
};

export const saveAttendanceRecord = (record: AttendanceRecord) => {
  const records = getAttendanceRecords();
  // Prepend new record so latest appears first
  const updated = [record, ...records.filter((r) => r.id !== record.id)];
  try {
    localStorage.setItem(STORAGE_KEYS.ATTENDANCE_RECORDS, JSON.stringify(updated));
  } catch (e) {
    console.error('Error saving attendance record:', e);
  }
  return updated;
};

export const markRecordAsSynced = (id: string) => {
  const records = getAttendanceRecords();
  const updated = records.map((r) =>
    r.id === id ? { ...r, spreadsheetSynced: true, syncedAt: new Date().toISOString() } : r
  );
  try {
    localStorage.setItem(STORAGE_KEYS.ATTENDANCE_RECORDS, JSON.stringify(updated));
  } catch (e) {
    console.error('Error updating sync status:', e);
  }
  return updated;
};
