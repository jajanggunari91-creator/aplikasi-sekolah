import React, { useState, useMemo } from 'react';
import confetti from 'canvas-confetti';
import {
  CheckCircle2,
  Users,
  Search,
  CheckCheck,
  RotateCcw,
  Save,
  FileSpreadsheet,
  AlertCircle,
  HelpCircle,
  Clock,
  Sparkles,
  Info,
} from 'lucide-react';
import {
  Student,
  AttendanceStatus,
  AttendanceItem,
  AttendanceRecord,
  ClassGrade,
  SheetConfig,
} from '../types';
import { STATUS_CONFIG } from '../data/initialData';
import { ConfirmationModal } from './ConfirmationModal';

interface AttendanceSheetProps {
  students: Student[];
  teacherName: string;
  selectedSubject: string;
  selectedClass: ClassGrade;
  period: string;
  date: string;
  topic: string;
  sheetConfig: SheetConfig | null;
  onSaveAttendance: (record: AttendanceRecord) => Promise<void>;
  isSaving: boolean;
  onOpenSheetModal: () => void;
}

export const AttendanceSheet: React.FC<AttendanceSheetProps> = ({
  students,
  teacherName,
  selectedSubject,
  selectedClass,
  period,
  date,
  topic,
  sheetConfig,
  onSaveAttendance,
  isSaving,
  onOpenSheetModal,
}) => {
  // Map of studentId -> status ('H' | 'I' | 'S' | 'A')
  const [attendanceState, setAttendanceState] = useState<Record<string, AttendanceStatus>>(() => {
    const initial: Record<string, AttendanceStatus> = {};
    students.forEach((s) => {
      initial[s.id] = 'H';
    });
    return initial;
  });

  // Map of studentId -> note
  const [notesState, setNotesState] = useState<Record<string, string>>({});

  // Search & Filter
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | AttendanceStatus>('ALL');
  const [genderFilter, setGenderFilter] = useState<'ALL' | 'L' | 'P'>('ALL');

  // Confirmation modal state
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [saveSuccessNotice, setSaveSuccessNotice] = useState<string | null>(null);

  // Update attendance state when student list changes
  React.useEffect(() => {
    setAttendanceState((prev) => {
      const next = { ...prev };
      students.forEach((s) => {
        if (!next[s.id]) {
          next[s.id] = 'H';
        }
      });
      return next;
    });
  }, [students]);

  // Handle single status change
  const handleStatusChange = (studentId: string, status: AttendanceStatus) => {
    setAttendanceState((prev) => ({
      ...prev,
      [studentId]: status,
    }));
  };

  // Handle single note change
  const handleNoteChange = (studentId: string, note: string) => {
    setNotesState((prev) => ({
      ...prev,
      [studentId]: note,
    }));
  };

  // Bulk: Mark All Present
  const handleMarkAllPresent = () => {
    const updated: Record<string, AttendanceStatus> = {};
    students.forEach((s) => {
      updated[s.id] = 'H';
    });
    setAttendanceState(updated);
  };

  // Bulk: Reset
  const handleReset = () => {
    const updated: Record<string, AttendanceStatus> = {};
    students.forEach((s) => {
      updated[s.id] = 'H';
    });
    setAttendanceState(updated);
    setNotesState({});
  };

  // Calculation of Stats
  const stats = useMemo(() => {
    let present = 0;
    let permission = 0;
    let sick = 0;
    let absent = 0;

    students.forEach((s) => {
      const status = attendanceState[s.id] || 'H';
      if (status === 'H') present++;
      else if (status === 'I') permission++;
      else if (status === 'S') sick++;
      else if (status === 'A') absent++;
    });

    const total = students.length || 1;
    const percentage = Math.round((present / total) * 100);

    return {
      total: students.length,
      present,
      permission,
      sick,
      absent,
      percentage,
    };
  }, [students, attendanceState]);

  // Filtered students
  const filteredStudents = useMemo(() => {
    return students.filter((s) => {
      const matchesSearch =
        s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.nis.toLowerCase().includes(searchQuery.toLowerCase());
      const currentStatus = attendanceState[s.id] || 'H';
      const matchesStatus = statusFilter === 'ALL' || currentStatus === statusFilter;
      const matchesGender = genderFilter === 'ALL' || s.gender === genderFilter;
      return matchesSearch && matchesStatus && matchesGender;
    });
  }, [students, searchQuery, statusFilter, genderFilter, attendanceState]);

  // Prepare submission record
  const handleOpenConfirm = () => {
    if (!teacherName.trim()) {
      alert('Mohon lengkapi Nama Guru Pengampu terlebih dahulu.');
      return;
    }
    setIsConfirmModalOpen(true);
  };

  const handleConfirmSubmit = async () => {
    setIsConfirmModalOpen(false);

    const details: AttendanceItem[] = students.map((s) => ({
      studentId: s.id,
      nis: s.nis,
      studentName: s.name,
      gender: s.gender,
      status: attendanceState[s.id] || 'H',
      notes: notesState[s.id] || '',
    }));

    const now = new Date();
    const timeStr = now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
    const randomSalt = Math.random().toString(36).substring(2, 8).toUpperCase();
    const recordId = `ABS-${Date.now()}-${randomSalt}-${selectedClass.replace(/\s+/g, '')}`;

    const newRecord: AttendanceRecord = {
      id: recordId,
      date: date || now.toISOString().split('T')[0],
      time: timeStr,
      period: period || 'Jam ke 1-2',
      teacherName: teacherName.trim(),
      subject: selectedSubject,
      className: selectedClass,
      topic: topic.trim() || 'Pembelajaran Reguler',
      totalStudents: stats.total,
      presentCount: stats.present,
      permissionCount: stats.permission,
      sickCount: stats.sick,
      absentCount: stats.absent,
      attendancePercentage: stats.percentage,
      details,
      spreadsheetSynced: false,
    };

    try {
      await onSaveAttendance(newRecord);
      if (stats.percentage === 100) {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
        });
      }
      setSaveSuccessNotice(
        `Presensi kelas ${selectedClass} (${selectedSubject}) berhasil disimpan!`
      );
      setTimeout(() => {
        setSaveSuccessNotice(null);
      }, 5000);
    } catch (err: any) {
      console.error('Error saving attendance:', err);
    }
  };

  return (
    <div className="space-y-6">
      {/* Success Notification Banner */}
      {saveSuccessNotice && (
        <div className="p-4 bg-emerald-500/20 border border-emerald-500/40 text-emerald-200 rounded-2xl flex items-center justify-between shadow-lg backdrop-blur-md animate-in fade-in slide-in-from-top-2">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
            <span className="text-xs sm:text-sm font-semibold">{saveSuccessNotice}</span>
          </div>
          <button
            onClick={() => setSaveSuccessNotice(null)}
            className="text-xs font-semibold text-emerald-300 hover:text-white underline ml-3 cursor-pointer"
          >
            Tutup
          </button>
        </div>
      )}

      {/* Real-time Summary Stat Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {/* Total Siswa */}
        <div className="bg-white/10 backdrop-blur-xl p-4 rounded-2xl border border-white/10 shadow-xl">
          <div className="flex items-center justify-between text-slate-300 mb-1">
            <span className="text-xs font-semibold">Total Siswa</span>
            <Users className="w-4 h-4 text-blue-400" />
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl font-black text-white">{stats.total}</span>
            <span className="text-xs font-medium text-slate-400">Siswa</span>
          </div>
        </div>

        {/* Hadir (H) */}
        <div className="bg-emerald-500/15 backdrop-blur-xl p-4 rounded-2xl border border-emerald-500/30 shadow-xl">
          <div className="flex items-center justify-between text-emerald-300 mb-1">
            <span className="text-xs font-semibold">Hadir (H)</span>
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400"></span>
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl font-black text-emerald-400">{stats.present}</span>
            <span className="text-xs font-bold text-emerald-300">{stats.percentage}%</span>
          </div>
        </div>

        {/* Izin (I) */}
        <div className="bg-blue-500/15 backdrop-blur-xl p-4 rounded-2xl border border-blue-500/30 shadow-xl">
          <div className="flex items-center justify-between text-blue-300 mb-1">
            <span className="text-xs font-semibold">Izin (I)</span>
            <span className="w-2.5 h-2.5 rounded-full bg-blue-400"></span>
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl font-black text-blue-400">{stats.permission}</span>
            <span className="text-xs font-medium text-blue-300">Siswa</span>
          </div>
        </div>

        {/* Sakit (S) */}
        <div className="bg-amber-500/15 backdrop-blur-xl p-4 rounded-2xl border border-amber-500/30 shadow-xl">
          <div className="flex items-center justify-between text-amber-300 mb-1">
            <span className="text-xs font-semibold">Sakit (S)</span>
            <span className="w-2.5 h-2.5 rounded-full bg-amber-400"></span>
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl font-black text-amber-400">{stats.sick}</span>
            <span className="text-xs font-medium text-amber-300">Siswa</span>
          </div>
        </div>

        {/* Alpa (A) */}
        <div className="bg-rose-500/15 backdrop-blur-xl p-4 rounded-2xl border border-rose-500/30 shadow-xl">
          <div className="flex items-center justify-between text-rose-300 mb-1">
            <span className="text-xs font-semibold">Alpa (A)</span>
            <span className="w-2.5 h-2.5 rounded-full bg-rose-400"></span>
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl font-black text-rose-400">{stats.absent}</span>
            <span className="text-xs font-medium text-rose-300">Siswa</span>
          </div>
        </div>

        {/* Google Sheet Sync Status */}
        <div className="bg-white/10 backdrop-blur-xl p-4 rounded-2xl border border-white/10 shadow-xl flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-300">
            <span className="text-xs font-semibold">Tujuan Simpan</span>
            <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
          </div>
          {sheetConfig ? (
            <div>
              <p className="text-xs font-bold text-white truncate" title={sheetConfig.spreadsheetTitle}>
                {sheetConfig.spreadsheetTitle}
              </p>
              <p className="text-[10px] text-emerald-400 font-medium flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                Sheet terhubung
              </p>
            </div>
          ) : (
            <div>
              <button
                type="button"
                onClick={onOpenSheetModal}
                className="text-xs font-bold text-blue-400 hover:text-blue-300 underline block cursor-pointer"
              >
                + Hubungkan Sheet
              </button>
              <p className="text-[10px] text-slate-400">Tersimpan lokal</p>
            </div>
          )}
        </div>
      </div>

      {/* Main Student List Container */}
      <div className="bg-white/10 backdrop-blur-xl rounded-2xl border border-white/10 shadow-2xl overflow-hidden">
        {/* Controls and Search Bar */}
        <div className="p-4 sm:p-5 border-b border-white/10 bg-white/5 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex flex-col sm:flex-row sm:items-center gap-3 flex-1">
            {/* Search Input */}
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                id="search-student-input"
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari nama siswa atau NIS..."
                className="w-full pl-9.5 pr-4 py-2 bg-white/5 border border-white/10 rounded-xl text-xs sm:text-sm font-medium text-white placeholder:text-slate-400 focus:outline-none focus:bg-white/10 focus:border-blue-400 focus:ring-2 focus:ring-blue-500/30 transition-all"
              />
            </div>

            {/* Status Filter Tabs */}
            <div className="flex items-center gap-1 p-1 bg-white/5 border border-white/10 rounded-xl overflow-x-auto">
              {(['ALL', 'H', 'I', 'S', 'A'] as const).map((st) => {
                const label =
                  st === 'ALL'
                    ? 'Semua'
                    : st === 'H'
                    ? 'Hadir'
                    : st === 'I'
                    ? 'Izin'
                    : st === 'S'
                    ? 'Sakit'
                    : 'Alpa';
                return (
                  <button
                    key={st}
                    type="button"
                    onClick={() => setStatusFilter(st)}
                    className={`px-2.5 py-1 text-xs font-bold rounded-lg transition-colors cursor-pointer whitespace-nowrap ${
                      statusFilter === st
                        ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30'
                        : 'text-slate-300 hover:text-white hover:bg-white/10'
                    }`}
                  >
                    {label}
                  </button>
                );
              })}
            </div>

            {/* Gender Filter */}
            <div className="flex items-center gap-1 p-1 bg-white/5 border border-white/10 rounded-xl">
              {(['ALL', 'L', 'P'] as const).map((g) => (
                <button
                  key={g}
                  type="button"
                  onClick={() => setGenderFilter(g)}
                  className={`px-2 py-1 text-xs font-bold rounded-lg transition-colors cursor-pointer ${
                    genderFilter === g
                      ? 'bg-blue-600 text-white'
                      : 'text-slate-300 hover:text-white hover:bg-white/10'
                  }`}
                >
                  {g === 'ALL' ? 'L/P' : g}
                </button>
              ))}
            </div>
          </div>

          {/* Quick Action Buttons */}
          <div className="flex items-center gap-2 self-end lg:self-auto">
            <button
              id="mark-all-present-btn"
              type="button"
              onClick={handleMarkAllPresent}
              className="flex items-center gap-1.5 px-3 py-2 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-lg shadow-emerald-500/10"
            >
              <CheckCheck className="w-4 h-4" />
              <span>Semua Hadir (H)</span>
            </button>

            <button
              id="reset-attendance-btn"
              type="button"
              onClick={handleReset}
              className="p-2 text-slate-300 hover:text-white hover:bg-white/10 rounded-xl border border-white/10 transition-colors cursor-pointer"
              title="Reset pilihan"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Student Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-900/80 border-b border-white/10 text-[11px] font-bold text-slate-300 uppercase tracking-wider">
                <th className="py-3.5 px-4 w-12 text-center">No</th>
                <th className="py-3.5 px-4 w-28">NIS</th>
                <th className="py-3.5 px-4 min-w-[200px]">Nama Siswa</th>
                <th className="py-3.5 px-4 w-14 text-center">L/P</th>
                <th className="py-3.5 px-4 min-w-[240px] text-center">Status Kehadiran</th>
                <th className="py-3.5 px-4 min-w-[220px]">Keterangan / Catatan</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 text-sm">
              {filteredStudents.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    <AlertCircle className="w-8 h-8 mx-auto mb-2 text-slate-500" />
                    <p className="font-semibold text-slate-300">Tidak ada siswa ditemukan</p>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Coba ubah kata kunci pencarian atau filter status.
                    </p>
                  </td>
                </tr>
              ) : (
                filteredStudents.map((student, index) => {
                  const currentStatus = attendanceState[student.id] || 'H';
                  const currentNote = notesState[student.id] || '';

                  return (
                    <tr
                      key={student.id}
                      className={`hover:bg-white/5 transition-colors ${
                        currentStatus === 'A'
                          ? 'bg-rose-500/10'
                          : currentStatus === 'S'
                          ? 'bg-amber-500/10'
                          : currentStatus === 'I'
                          ? 'bg-blue-500/10'
                          : ''
                      }`}
                    >
                      {/* No */}
                      <td className="py-3 px-4 text-xs font-semibold text-slate-400 text-center">
                        {index + 1}
                      </td>

                      {/* NIS */}
                      <td className="py-3 px-4 text-xs font-mono font-medium text-slate-300">
                        {student.nis}
                      </td>

                      {/* Nama Siswa */}
                      <td className="py-3 px-4">
                        <div className="font-semibold text-white text-xs sm:text-sm">
                          {student.name}
                        </div>
                      </td>

                      {/* Gender */}
                      <td className="py-3 px-4 text-center">
                        <span
                          className={`inline-block px-2 py-0.5 rounded-md text-[11px] font-bold ${
                            student.gender === 'L'
                              ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                              : 'bg-pink-500/20 text-pink-300 border border-pink-500/30'
                          }`}
                        >
                          {student.gender}
                        </span>
                      </td>

                      {/* Status Buttons */}
                      <td className="py-3 px-4">
                        <div className="flex items-center justify-center gap-1.5">
                          {(['H', 'I', 'S', 'A'] as AttendanceStatus[]).map((st) => {
                            const isSelected = currentStatus === st;
                            const config = STATUS_CONFIG[st];

                            let activeClass = '';
                            if (isSelected) {
                              if (st === 'H') activeClass = 'bg-emerald-500 text-white font-black shadow-lg shadow-emerald-500/30 ring-2 ring-emerald-300';
                              else if (st === 'I') activeClass = 'bg-blue-500 text-white font-black shadow-lg shadow-blue-500/30 ring-2 ring-blue-300';
                              else if (st === 'S') activeClass = 'bg-amber-500 text-white font-black shadow-lg shadow-amber-500/30 ring-2 ring-amber-300';
                              else if (st === 'A') activeClass = 'bg-rose-500 text-white font-black shadow-lg shadow-rose-500/30 ring-2 ring-rose-300';
                            } else {
                              activeClass = 'bg-white/5 hover:bg-white/15 text-slate-300 border border-white/10 font-bold';
                            }

                            return (
                              <button
                                key={st}
                                type="button"
                                id={`status-btn-${student.id}-${st}`}
                                onClick={() => handleStatusChange(student.id, st)}
                                className={`w-9 h-8 rounded-lg text-xs transition-all cursor-pointer flex items-center justify-center ${activeClass}`}
                                title={`${config.label} - ${config.desc}`}
                              >
                                {st}
                              </button>
                            );
                          })}
                        </div>
                      </td>

                      {/* Notes / Alasan */}
                      <td className="py-3 px-4">
                        <input
                          id={`note-input-${student.id}`}
                          type="text"
                          value={currentNote}
                          onChange={(e) => handleNoteChange(student.id, e.target.value)}
                          placeholder={
                            currentStatus === 'I'
                              ? 'Alasan izin (dispensasi, acara, dll)'
                              : currentStatus === 'S'
                              ? 'Keterangan sakit (demam, dll)'
                              : currentStatus === 'A'
                              ? 'Tanpa keterangan'
                              : 'Keterangan tambahan (opsional)...'
                          }
                          className="w-full px-3 py-1.5 bg-white/5 border border-white/10 rounded-lg text-xs text-white placeholder:text-slate-500 focus:bg-white/10 focus:border-blue-400 outline-none transition-all"
                        />
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Footer / Submit Bar */}
        <div className="p-4 sm:p-5 bg-white/5 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-xs text-slate-300">
            <Info className="w-4 h-4 text-blue-400 shrink-0" />
            <span>
              Presensi akan disimpan ke database lokal dan otomatis disinkronkan ke sheet{' '}
              <strong className="text-emerald-300 font-semibold">"Absensi {selectedClass}"</strong> jika Google Sheet terhubung.
            </span>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            <button
              id="submit-attendance-btn"
              type="button"
              disabled={isSaving || students.length === 0}
              onClick={handleOpenConfirm}
              className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white rounded-xl text-sm font-bold shadow-lg shadow-blue-600/30 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Save className="w-4 h-4" />
              <span>{isSaving ? 'Menyimpan Presensi...' : 'Simpan Presensi Kelas'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Confirmation Modal */}
      <ConfirmationModal
        isOpen={isConfirmModalOpen}
        title="Konfirmasi Simpan Presensi"
        message={`Apakah Anda yakin ingin menyimpan data presensi untuk kelas ${selectedClass}?`}
        confirmText="Ya, Simpan Presensi"
        cancelText="Periksa Kembali"
        type="primary"
        onConfirm={handleConfirmSubmit}
        onCancel={() => setIsConfirmModalOpen(false)}
        details={[
          { label: 'Guru Pengampu', value: teacherName || '-' },
          { label: 'Mata Pelajaran', value: selectedSubject },
          { label: 'Kelas', value: selectedClass },
          { label: 'Tanggal & Sesi', value: `${date} (${period})` },
          { label: 'Materi / Topik', value: topic || 'Pembelajaran Reguler' },
          { label: 'Total Siswa', value: `${stats.total} Orang` },
          {
            label: 'Rincian Kehadiran',
            value: `Hadir: ${stats.present} | Izin: ${stats.permission} | Sakit: ${stats.sick} | Alpa: ${stats.absent} (${stats.percentage}%)`,
          },
          {
            label: 'Penyimpanan',
            value: sheetConfig
              ? `Google Sheet ("${sheetConfig.spreadsheetTitle}") & Penyimpanan Lokal`
              : 'Penyimpanan Lokal (Sheet belum terhubung)',
          },
        ]}
      />
    </div>
  );
};
