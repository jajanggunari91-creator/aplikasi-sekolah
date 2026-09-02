import React from 'react';
import {
  UserCheck,
  BookOpen,
  GraduationCap,
  Clock,
  FileText,
  Calendar,
  Sparkles,
  ChevronDown,
} from 'lucide-react';
import { SUBJECT_LIST, ClassGrade, Subject } from '../types';
import { CLASSES_LIST } from '../data/initialData';

interface TeacherSetupProps {
  teacherName: string;
  setTeacherName: (name: string) => void;
  selectedSubject: string;
  setSelectedSubject: (subject: string) => void;
  selectedClass: ClassGrade;
  setSelectedClass: (cls: ClassGrade) => void;
  period: string;
  setPeriod: (p: string) => void;
  date: string;
  setDate: (d: string) => void;
  topic: string;
  setTopic: (t: string) => void;
  onResetSelection?: () => void;
}

const PERIOD_PRESETS = [
  'Jam ke 1 - 2 (07.00 - 08.30)',
  'Jam ke 3 - 4 (08.30 - 10.00)',
  'Jam ke 5 - 6 (10.15 - 11.45)',
  'Jam ke 7 - 8 (12.30 - 14.00)',
  'Jam ke 9 - 10 (14.00 - 15.30)',
];

const SUGGESTED_TOPICS: Record<string, string[]> = {
  'Koding dan Kecerdasan Artifisial': [
    'Pengenalan Algoritma & Prompt AI',
    'Pemrograman Python untuk Analisis Data',
    'Integrasi API AI & Machine Learning Dasar',
  ],
  'Teknik Komputer dan Jaringan': [
    'Konfigurasi Routing MikroTik & VLAN',
    'Instalasi Server Debian & DNS Server',
    'Troubleshooting Jaringan WAN & Fiber Optic',
  ],
  'Dasar-Dasar TJKT': [
    'K3LH dan Budaya Kerja Industri',
    'Pengenalan Komponen Hardware & Topologi Jaringan',
    'Crimping Kabel UTP & Pengujian LAN',
  ],
  'Informatika': [
    'Berpikir Komputasional & Struktur Data',
    'Sistem Komputer & Keamanan Siber',
    'Analisis Data & Lembar Sebar',
  ],
};

export const TeacherSetup: React.FC<TeacherSetupProps> = ({
  teacherName,
  setTeacherName,
  selectedSubject,
  setSelectedSubject,
  selectedClass,
  setSelectedClass,
  period,
  setPeriod,
  date,
  setDate,
  topic,
  setTopic,
}) => {
  return (
    <div className="bg-white/10 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl p-5 sm:p-6 mb-6 text-white">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 mb-5 border-b border-white/10">
        <div>
          <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-blue-400"></span>
            Informasi Pembelajaran & Guru Pengampu
          </h2>
          <p className="text-xs text-slate-300 mt-0.5">
            Lengkapi data guru, mata pelajaran, kelas, dan materi sebelum mengisi presensi
          </p>
        </div>
        <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-blue-500/20 text-blue-300 rounded-full text-xs font-semibold self-start sm:self-auto border border-blue-400/30">
          <Sparkles className="w-3.5 h-3.5 text-blue-400" />
          SMK Jurusan TJKT
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
        {/* Nama Guru Pengampu */}
        <div className="space-y-1.5">
          <label
            htmlFor="teacher-name-input"
            className="block text-xs font-semibold text-slate-200 flex items-center gap-1.5"
          >
            <UserCheck className="w-4 h-4 text-blue-400" />
            <span>Nama Guru Pengampu</span>
            <span className="text-rose-400">*</span>
          </label>
          <div className="relative">
            <input
              id="teacher-name-input"
              type="text"
              value={teacherName}
              onChange={(e) => setTeacherName(e.target.value)}
              placeholder="Contoh: Bpk. Jajang Gunari, S.Kom."
              className="w-full px-3.5 py-2.5 bg-white/5 border border-white/10 rounded-xl text-sm font-medium text-white placeholder:text-slate-400 focus:bg-white/10 focus:border-blue-400 focus:ring-2 focus:ring-blue-500/30 outline-none transition-all"
            />
          </div>
        </div>

        {/* Mata Pelajaran */}
        <div className="space-y-1.5">
          <label
            htmlFor="subject-select"
            className="block text-xs font-semibold text-slate-200 flex items-center gap-1.5"
          >
            <BookOpen className="w-4 h-4 text-blue-400" />
            <span>Mata Pelajaran</span>
            <span className="text-rose-400">*</span>
          </label>
          <div className="relative">
            <select
              id="subject-select"
              value={selectedSubject}
              onChange={(e) => setSelectedSubject(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-900/90 border border-white/10 rounded-xl text-sm font-medium text-white focus:bg-slate-900 focus:border-blue-400 focus:ring-2 focus:ring-blue-500/30 outline-none transition-all appearance-none cursor-pointer pr-10"
            >
              {SUBJECT_LIST.map((subject) => (
                <option key={subject} value={subject} className="bg-slate-900 text-white">
                  {subject}
                </option>
              ))}
            </select>
            <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>
        </div>

        {/* Kelas */}
        <div className="space-y-1.5">
          <label className="block text-xs font-semibold text-slate-200 flex items-center gap-1.5">
            <GraduationCap className="w-4 h-4 text-blue-400" />
            <span>Kelas / Rombel</span>
            <span className="text-rose-400">*</span>
          </label>
          <div className="grid grid-cols-3 gap-2">
            {CLASSES_LIST.map((cls) => {
              const isSelected = selectedClass === cls;
              return (
                <button
                  key={cls}
                  type="button"
                  id={`select-class-${cls.replace(/\s+/g, '-').toLowerCase()}`}
                  onClick={() => setSelectedClass(cls)}
                  className={`py-2 px-3 text-xs font-bold rounded-xl border transition-all cursor-pointer text-center ${
                    isSelected
                      ? 'bg-blue-600 border-blue-400 text-white shadow-lg shadow-blue-600/30'
                      : 'bg-white/5 border-white/10 text-slate-300 hover:bg-white/10 hover:text-white'
                  }`}
                >
                  {cls}
                </button>
              );
            })}
          </div>
        </div>

        {/* Tanggal Pelaksanaan */}
        <div className="space-y-1.5">
          <label
            htmlFor="attendance-date-input"
            className="block text-xs font-semibold text-slate-200 flex items-center gap-1.5"
          >
            <Calendar className="w-4 h-4 text-blue-400" />
            <span>Tanggal Presensi</span>
          </label>
          <input
            id="attendance-date-input"
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="w-full px-3.5 py-2.5 bg-white/5 border border-white/10 rounded-xl text-sm font-medium text-white focus:bg-white/10 focus:border-blue-400 focus:ring-2 focus:ring-blue-500/30 outline-none transition-all cursor-pointer"
          />
        </div>

        {/* Jam Pelajaran / Sesi */}
        <div className="space-y-1.5">
          <label
            htmlFor="period-select"
            className="block text-xs font-semibold text-slate-200 flex items-center gap-1.5"
          >
            <Clock className="w-4 h-4 text-blue-400" />
            <span>Jam Pelajaran / Sesi</span>
          </label>
          <div className="relative">
            <select
              id="period-select"
              value={period}
              onChange={(e) => setPeriod(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-900/90 border border-white/10 rounded-xl text-sm font-medium text-white focus:bg-slate-900 focus:border-blue-400 focus:ring-2 focus:ring-blue-500/30 outline-none transition-all appearance-none cursor-pointer pr-10"
            >
              {PERIOD_PRESETS.map((p) => (
                <option key={p} value={p} className="bg-slate-900 text-white">
                  {p}
                </option>
              ))}
              <option value="Sesi Tambahan / Praktik Bengkel" className="bg-slate-900 text-white">
                Sesi Tambahan / Praktik Bengkel
              </option>
            </select>
            <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>
        </div>

        {/* Topik / Materi Pokok */}
        <div className="space-y-1.5 md:col-span-2 lg:col-span-1">
          <label
            htmlFor="topic-input"
            className="block text-xs font-semibold text-slate-200 flex items-center gap-1.5"
          >
            <FileText className="w-4 h-4 text-blue-400" />
            <span>Topik / Materi Pembelajaran</span>
          </label>
          <input
            id="topic-input"
            type="text"
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            placeholder="Contoh: Konfigurasi Jaringan & Routing Dinamis"
            className="w-full px-3.5 py-2.5 bg-white/5 border border-white/10 rounded-xl text-sm font-medium text-white placeholder:text-slate-400 focus:bg-white/10 focus:border-blue-400 focus:ring-2 focus:ring-blue-500/30 outline-none transition-all"
          />
        </div>
      </div>

      {/* Suggested Topics if available */}
      {SUGGESTED_TOPICS[selectedSubject] && (
        <div className="mt-4 pt-3 border-t border-white/10 flex flex-wrap items-center gap-2">
          <span className="text-[11px] font-semibold text-slate-400">
            Saran Materi {selectedSubject}:
          </span>
          {SUGGESTED_TOPICS[selectedSubject].map((sug) => (
            <button
              key={sug}
              type="button"
              onClick={() => setTopic(sug)}
              className="text-[11px] px-2.5 py-1 bg-white/5 hover:bg-white/10 hover:text-white text-slate-300 rounded-lg transition-colors cursor-pointer border border-white/10"
            >
              + {sug}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
