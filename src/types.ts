export type ClassGrade = '10 TJKT' | '11 TJKT' | '12 TJKT';

export const SUBJECT_LIST = [
  'Koding dan Kecerdasan Artifisial',
  'Teknik Komputer dan Jaringan',
  'Bahasa Indonesia',
  'Bisnis Digital',
  'Bahasa Inggris',
  'Matematika',
  'Pend. Jasmani Olahraga dan Kesehatan',
  'Dasar-Dasar TJKT',
  'Informatika',
  'Seni',
  'Sejarah',
  'Kreatifitas, Inovasi dan Kewirausahaan',
  'Pendidikan Pancasila',
  'Pend. Agama Islam dan Budi Pekerti',
  'Projek IPAS',
  'Fisika',
  'Bahasa Sunda',
] as const;

export type Subject = typeof SUBJECT_LIST[number];

export type AttendanceStatus = 'H' | 'I' | 'S' | 'A';

export interface Student {
  id: string;
  nis: string;
  name: string;
  gender: 'L' | 'P';
  className: ClassGrade;
}

export interface AttendanceItem {
  studentId: string;
  nis: string;
  studentName: string;
  gender: 'L' | 'P';
  status: AttendanceStatus;
  notes?: string;
}

export interface AttendanceRecord {
  id: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:mm
  period: string; // Jam Ke- (e.g. "1-2", "3-4")
  teacherName: string;
  subject: string;
  className: ClassGrade;
  topic: string; // Materi Pokok / Topik Pembelajaran
  totalStudents: number;
  presentCount: number;
  permissionCount: number; // Izin
  sickCount: number; // Sakit
  absentCount: number; // Alpa
  attendancePercentage: number;
  details: AttendanceItem[];
  spreadsheetSynced: boolean;
  syncedAt?: string;
}

export interface TeacherProfile {
  name: string;
  nip?: string;
  defaultSubject?: Subject;
}

export interface SheetConfig {
  spreadsheetId: string;
  spreadsheetTitle: string;
  spreadsheetUrl: string;
  studentSheetName: string;
  logSheetName: string;
  lastSynced?: string;
}

export interface DailySummaryStats {
  date: string;
  teacherName: string;
  sessionsCount: number;
  totalStudentsHandled: number;
  totalPresent: number;
  totalPermission: number;
  totalSick: number;
  totalAbsent: number;
  averageAttendanceRate: number;
  classesTaught: ClassGrade[];
  subjectsTaught: string[];
  records: AttendanceRecord[];
  absenteeList: Array<{
    studentName: string;
    className: ClassGrade;
    subject: string;
    status: AttendanceStatus;
    notes?: string;
  }>;
}
