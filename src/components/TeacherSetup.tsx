import React, { useState, useEffect } from 'react';
import {
  UserCheck,
  BookOpen,
  GraduationCap,
  Clock,
  FileText,
  Calendar,
  Sparkles,
  ChevronDown,
  Timer,
  PlayCircle,
  StopCircle,
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

const JAM_KE_PRESETS: Array<{ label: string; value: string; mulai: string; selesai: string }> = [
  { label: 'Jam ke 1 - 2', value: '1 - 2', mulai: '07:00', selesai: '08:30' },
  { label: 'Jam ke 3 - 4', value: '3 - 4', mulai: '08:30', selesai: '10:00' },
  { label: 'Jam ke 5 - 6', value: '5 - 6', mulai: '10:15', selesai: '11:45' },
  { label: 'Jam ke 7 - 8', value: '7 - 8', mulai: '12:30', selesai: '14:00' },
  { label: 'Jam ke 9 - 10', value: '9 - 10', mulai: '14:00', selesai: '15:30' },
  { label: 'Jam ke 1 - 4 (Blok Pagi)', value: '1 - 4', mulai: '07:00', selesai: '10:00' },
  { label: 'Jam ke 5 - 8 (Blok Siang)', value: '5 - 8', mulai: '10:15', selesai: '14:00' },
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

const parsePeriod = (pStr: string) => {
  if (!pStr) return { jamKe: '1 - 2', mulai: '07:00', selesai: '08:30' };
  
  // Format: "Jam ke X (HH:mm - HH:mm)" or "Jam ke X (HH.mm - HH.mm)"
  const match = pStr.match(/Jam ke\s*([^(]+)\s*\(([^)]+)\)/i);
  if (match) {
    const jamKe = match[1].trim();
    const timeParts = match[2].split('-');
    if (timeParts.length === 2) {
      const mulai = timeParts[0].trim().replace('.', ':').padStart(5, '0');
      const selesai = timeParts[1].trim().replace('.', ':').padStart(5, '0');
      return { jamKe, mulai, selesai };
    }
    return { jamKe, mulai: '07:00', selesai: '08:30' };
  }
  return { jamKe: '1 - 2', mulai: '07:00', selesai: '08:30' };
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
  const initialParsed = parsePeriod(period);
  const [jamKe, setJamKe] = useState(initialParsed.jamKe);
  const [jamMulai, setJamMulai] = useState(initialParsed.mulai);
  const [jamSelesai, setJamSelesai] = useState(initialParsed.selesai);
  const [isCustomJamKe, setIsCustomJamKe] = useState(false);

  // Sync back to period string whenever jamKe, jamMulai, or jamSelesai change
  const updateCombinedPeriod = (newJamKe: string, newMulai: string, newSelesai: string) => {
    const cleanJamKe = newJamKe.trim() || '1 - 2';
    const cleanMulai = newMulai.trim() || '07:00';
    const cleanSelesai = newSelesai.trim() || '08:30';
    const formatted = `Jam ke ${cleanJamKe} (${cleanMulai} - ${cleanSelesai})`;
    setPeriod(formatted);
  };

  const handlePresetSelect = (preset: typeof JAM_KE_PRESETS[0]) => {
    setJamKe(preset.value);
    setJamMulai(preset.mulai);
    setJamSelesai(preset.selesai);
    setIsCustomJamKe(false);
    updateCombinedPeriod(preset.value, preset.mulai, preset.selesai);
  };

  const handleJamKeChange = (val: string) => {
    if (val === 'CUSTOM') {
      setIsCustomJamKe(true);
      return;
    }
    setIsCustomJamKe(false);
    setJamKe(val);
    const matchedPreset = JAM_KE_PRESETS.find((p) => p.value === val);
    if (matchedPreset) {
      setJamMulai(matchedPreset.mulai);
      setJamSelesai(matchedPreset.selesai);
      updateCombinedPeriod(val, matchedPreset.mulai, matchedPreset.selesai);
    } else {
      updateCombinedPeriod(val, jamMulai, jamSelesai);
    }
  };

  const handleCustomJamKeInput = (val: string) => {
    setJamKe(val);
    updateCombinedPeriod(val, jamMulai, jamSelesai);
  };

  const handleMulaiChange = (val: string) => {
    setJamMulai(val);
    updateCombinedPeriod(jamKe, val, jamSelesai);
  };

  const handleSelesaiChange = (val: string) => {
    setJamSelesai(val);
    updateCombinedPeriod(jamKe, jamMulai, val);
  };

  return (
    <div className="bg-white/10 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl p-5 sm:p-6 mb-6 text-white">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 mb-5 border-b border-white/10">
        <div>
          <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-blue-400"></span>
            Informasi Pembelajaran & Guru Pengampu
          </h2>
          <p className="text-xs text-slate-300 mt-0.5">
            Lengkapi data guru, mata pelajaran, kelas, sesi jam pelajaran, dan materi pokok
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

        {/* Tanggal Presensi */}
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

        {/* Pilihan Sesi Jam Pelajaran: Jam Ke, Mulai, Selesai */}
        <div className="space-y-1.5 md:col-span-2 lg:col-span-2">
          <label className="block text-xs font-semibold text-slate-200 flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-blue-400" />
              <span>Jam Pelajaran / Sesi</span>
            </span>
            <span className="text-[11px] font-mono text-blue-300 bg-blue-500/10 px-2 py-0.5 rounded border border-blue-500/20">
              Jam ke {jamKe} ({jamMulai} - {jamSelesai})
            </span>
          </label>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 bg-white/5 p-3 rounded-xl border border-white/10">
            {/* 1. Jam Ke */}
            <div className="space-y-1">
              <label
                htmlFor="period-jam-ke-select"
                className="text-[11px] font-semibold text-slate-300 flex items-center gap-1"
              >
                <Timer className="w-3.5 h-3.5 text-blue-400" />
                <span>Jam Ke:</span>
              </label>

              {!isCustomJamKe ? (
                <div className="relative">
                  <select
                    id="period-jam-ke-select"
                    value={jamKe}
                    onChange={(e) => handleJamKeChange(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-900/90 border border-white/10 rounded-lg text-xs font-semibold text-white focus:border-blue-400 outline-none transition-all appearance-none cursor-pointer pr-8"
                  >
                    {JAM_KE_PRESETS.map((p) => (
                      <option key={p.value} value={p.value} className="bg-slate-900 text-white">
                        {p.label}
                      </option>
                    ))}
                    <option value="CUSTOM" className="bg-slate-900 text-amber-300 font-semibold">
                      ✏️ Tulis Jam Ke Sendiri...
                    </option>
                  </select>
                  <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>
              ) : (
                <div className="flex items-center gap-1">
                  <input
                    id="period-jam-ke-custom-input"
                    type="text"
                    value={jamKe}
                    onChange={(e) => handleCustomJamKeInput(e.target.value)}
                    placeholder="Misal: 1 - 3 atau Praktik"
                    className="w-full px-3 py-2 bg-white/10 border border-blue-400/50 rounded-lg text-xs font-semibold text-white outline-none focus:ring-1 focus:ring-blue-400"
                    autoFocus
                  />
                  <button
                    type="button"
                    onClick={() => setIsCustomJamKe(false)}
                    className="px-2 py-2 text-[10px] font-bold bg-white/10 hover:bg-white/20 rounded-lg text-slate-300 hover:text-white"
                    title="Pilih dari daftar preset"
                  >
                    Daftar
                  </button>
                </div>
              )}
            </div>

            {/* 2. Mulai */}
            <div className="space-y-1">
              <label
                htmlFor="period-mulai-input"
                className="text-[11px] font-semibold text-slate-300 flex items-center gap-1"
              >
                <PlayCircle className="w-3.5 h-3.5 text-emerald-400" />
                <span>Mulai:</span>
              </label>
              <input
                id="period-mulai-input"
                type="time"
                value={jamMulai}
                onChange={(e) => handleMulaiChange(e.target.value)}
                className="w-full px-3 py-2 bg-slate-900/90 border border-white/10 rounded-lg text-xs font-semibold text-white focus:border-blue-400 outline-none transition-all cursor-pointer"
              />
            </div>

            {/* 3. Selesai */}
            <div className="space-y-1">
              <label
                htmlFor="period-selesai-input"
                className="text-[11px] font-semibold text-slate-300 flex items-center gap-1"
              >
                <StopCircle className="w-3.5 h-3.5 text-rose-400" />
                <span>Selesai:</span>
              </label>
              <input
                id="period-selesai-input"
                type="time"
                value={jamSelesai}
                onChange={(e) => handleSelesaiChange(e.target.value)}
                className="w-full px-3 py-2 bg-slate-900/90 border border-white/10 rounded-lg text-xs font-semibold text-white focus:border-blue-400 outline-none transition-all cursor-pointer"
              />
            </div>
          </div>
        </div>

        {/* Topik / Materi Pembelajaran */}
        <div className="space-y-1.5 md:col-span-2 lg:col-span-3">
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

