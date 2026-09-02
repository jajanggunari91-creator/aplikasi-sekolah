import React, { useState, useMemo } from 'react';
import {
  Calendar,
  UserCheck,
  BarChart3,
  CheckCircle2,
  AlertTriangle,
  Copy,
  Printer,
  Sparkles,
  GraduationCap,
  BookOpen,
  Clock,
  ChevronRight,
  Send,
  FileSpreadsheet,
  Users,
} from 'lucide-react';
import { AttendanceRecord, ClassGrade, DailySummaryStats } from '../types';
import { STATUS_CONFIG } from '../data/initialData';

interface DailySummaryProps {
  records: AttendanceRecord[];
  currentTeacherName: string;
  onSelectRecordForDetail?: (record: AttendanceRecord) => void;
  onNavigateToAttendance?: () => void;
}

export const DailySummary: React.FC<DailySummaryProps> = ({
  records,
  currentTeacherName,
  onNavigateToAttendance,
}) => {
  const todayStr = new Date().toISOString().split('T')[0];
  const [selectedDate, setSelectedDate] = useState(todayStr);
  const [selectedTeacher, setSelectedTeacher] = useState<string>(currentTeacherName || 'ALL');
  const [copiedNotification, setCopiedNotification] = useState(false);

  // Sync teacher selection if current teacher changes and was empty
  React.useEffect(() => {
    if (currentTeacherName && selectedTeacher === 'ALL') {
      setSelectedTeacher(currentTeacherName);
    }
  }, [currentTeacherName]);

  // Extract list of all unique teachers from records
  const teacherOptions = useMemo(() => {
    const set = new Set<string>();
    if (currentTeacherName) set.add(currentTeacherName);
    records.forEach((r) => {
      if (r.teacherName) set.add(r.teacherName);
    });
    return Array.from(set);
  }, [records, currentTeacherName]);

  // Filter records by date and teacher
  const dailyRecords = useMemo(() => {
    return records.filter((r) => {
      const matchDate = r.date === selectedDate;
      const matchTeacher =
        selectedTeacher === 'ALL' ||
        r.teacherName.toLowerCase() === selectedTeacher.toLowerCase();
      return matchDate && matchTeacher;
    });
  }, [records, selectedDate, selectedTeacher]);

  // Calculate daily automated summary stats
  const summaryStats: DailySummaryStats = useMemo(() => {
    let totalStudents = 0;
    let totalPresent = 0;
    let totalPermission = 0;
    let totalSick = 0;
    let totalAbsent = 0;

    const classesSet = new Set<ClassGrade>();
    const subjectsSet = new Set<string>();
    const absenteeList: DailySummaryStats['absenteeList'] = [];

    dailyRecords.forEach((record) => {
      totalStudents += record.totalStudents;
      totalPresent += record.presentCount;
      totalPermission += record.permissionCount;
      totalSick += record.sickCount;
      totalAbsent += record.absentCount;

      classesSet.add(record.className);
      subjectsSet.add(record.subject);

      // Collect non-present students
      record.details.forEach((item) => {
        if (item.status !== 'H') {
          absenteeList.push({
            studentName: item.studentName,
            className: record.className,
            subject: record.subject,
            status: item.status,
            notes: item.notes,
          });
        }
      });
    });

    const averageRate =
      totalStudents > 0 ? Math.round((totalPresent / totalStudents) * 100) : 0;

    return {
      date: selectedDate,
      teacherName: selectedTeacher === 'ALL' ? 'Semua Guru Pengampu' : selectedTeacher,
      sessionsCount: dailyRecords.length,
      totalStudentsHandled: totalStudents,
      totalPresent,
      totalPermission,
      totalSick,
      totalAbsent,
      averageAttendanceRate: averageRate,
      classesTaught: Array.from(classesSet),
      subjectsTaught: Array.from(subjectsSet),
      records: dailyRecords,
      absenteeList,
    };
  }, [dailyRecords, selectedDate, selectedTeacher]);

  // Format WhatsApp message
  const generateWhatsAppReport = () => {
    const formattedDate = new Date(selectedDate).toLocaleDateString('id-ID', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });

    let msg = `*LAPORAN HARIAN KEHADIRAN SISWA - JURUSAN TJKT*\n`;
    msg += `-------------------------------------------\n`;
    msg += `📅 *Hari / Tanggal*: ${formattedDate}\n`;
    msg += `👨‍🏫 *Guru Pengampu*: ${summaryStats.teacherName}\n`;
    msg += `📚 *Mata Pelajaran*: ${summaryStats.subjectsTaught.join(', ') || '-'}\n`;
    msg += `🏫 *Kelas yang Diajar*: ${summaryStats.classesTaught.join(', ') || '-'}\n`;
    msg += `⏱️ *Total Sesi Diajar*: ${summaryStats.sessionsCount} Sesi Kelas\n\n`;

    msg += `*📊 RINGKASAN KEHADIRAN:*\n`;
    msg += `• Total Siswa Ditangani: ${summaryStats.totalStudentsHandled} Siswa\n`;
    msg += `• Hadir (H): ${summaryStats.totalPresent} (${summaryStats.averageAttendanceRate}%)\n`;
    msg += `• Izin (I): ${summaryStats.totalPermission}\n`;
    msg += `• Sakit (S): ${summaryStats.totalSick}\n`;
    msg += `• Alpa (A): ${summaryStats.totalAbsent}\n\n`;

    msg += `*📋 RINCIAN PER KELAS & MATERI:*\n`;
    if (summaryStats.records.length === 0) {
      msg += `_(Belum ada sesi presensi tersimpan pada tanggal ini)_\n`;
    } else {
      summaryStats.records.forEach((r, idx) => {
        msg += `${idx + 1}. *${r.className}* (${r.subject}) - Jam ${r.period}\n`;
        msg += `   - Topik: ${r.topic || '-'}\n`;
        msg += `   - Kehadiran: ${r.presentCount}/${r.totalStudents} (${r.attendancePercentage}%) [I:${r.permissionCount}, S:${r.sickCount}, A:${r.absentCount}]\n`;
      });
    }

    msg += `\n*⚠️ DAFTAR SISWA TIDAK HADIR (TINDAK LANJUT):*\n`;
    if (summaryStats.absenteeList.length === 0) {
      msg += `✨ *Alhamdulillah, semua siswa hadir 100%!* ✨\n`;
    } else {
      summaryStats.absenteeList.forEach((abs, idx) => {
        const statusLabel =
          abs.status === 'I' ? 'Izin' : abs.status === 'S' ? 'Sakit' : 'Alpa';
        msg += `${idx + 1}. *${abs.studentName}* (${abs.className}) -> *${statusLabel}* ${
          abs.notes ? `(Ket: ${abs.notes})` : ''
        }\n`;
      });
    }

    msg += `\n-------------------------------------------\n`;
    msg += `_Laporan otomatis dibuat melalui Aplikasi Absensi Guru Mapel TJKT_`;

    return msg;
  };

  const handleCopyWhatsApp = async () => {
    const text = generateWhatsAppReport();
    try {
      await navigator.clipboard.writeText(text);
      setCopiedNotification(true);
      setTimeout(() => setCopiedNotification(false), 3000);
    } catch (e) {
      console.error('Failed to copy text:', e);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6 text-white">
      {/* Top Filter & Header Bar */}
      <div className="bg-white/10 backdrop-blur-xl rounded-2xl border border-white/10 p-5 sm:p-6 shadow-2xl">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-5 border-b border-white/10">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-1.5 bg-blue-500/20 border border-blue-400/30 text-blue-400 rounded-xl">
                <BarChart3 className="w-5 h-5" />
              </span>
              <h2 className="text-lg sm:text-xl font-bold text-white">
                Ringkasan Kehadiran Harian Pengajar
              </h2>
            </div>
            <p className="text-xs text-slate-300 mt-1">
              Rekapitulasi otomatis data kehadiran harian per guru mata pelajaran
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              id="copy-whatsapp-btn"
              type="button"
              onClick={handleCopyWhatsApp}
              className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition-all shadow-lg shadow-emerald-600/30 cursor-pointer"
            >
              {copiedNotification ? (
                <>
                  <CheckCircle2 className="w-4 h-4 text-emerald-200" />
                  <span>Tersalin ke Clipboard!</span>
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  <span>Salin Format WhatsApp</span>
                </>
              )}
            </button>

            <button
              id="print-summary-btn"
              type="button"
              onClick={handlePrint}
              className="flex items-center gap-2 px-3.5 py-2 bg-white/5 hover:bg-white/10 border border-white/10 text-slate-200 hover:text-white rounded-xl text-xs font-bold transition-colors cursor-pointer"
            >
              <Printer className="w-4 h-4 text-slate-300" />
              <span>Cetak Laporan</span>
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-5">
          {/* Pilih Tanggal */}
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-slate-200 flex items-center gap-1.5">
              <Calendar className="w-4 h-4 text-blue-400" />
              <span>Pilih Tanggal Rekap</span>
            </label>
            <input
              id="summary-date-picker"
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-white/5 border border-white/10 rounded-xl text-sm font-medium text-white focus:bg-white/10 focus:border-blue-400 outline-none transition-all cursor-pointer"
            />
          </div>

          {/* Pilih Guru Pengampu */}
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-slate-200 flex items-center gap-1.5">
              <UserCheck className="w-4 h-4 text-blue-400" />
              <span>Filter Guru Pengampu</span>
            </label>
            <select
              id="summary-teacher-select"
              value={selectedTeacher}
              onChange={(e) => setSelectedTeacher(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-900/90 border border-white/10 rounded-xl text-sm font-medium text-white focus:bg-slate-900 focus:border-blue-400 outline-none transition-all cursor-pointer"
            >
              <option value="ALL" className="bg-slate-900 text-white">-- Semua Guru Pengampu --</option>
              {teacherOptions.map((t) => (
                <option key={t} value={t} className="bg-slate-900 text-white">
                  {t}
                </option>
              ))}
            </select>
          </div>

          {/* Quick Date Shortcuts */}
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-slate-200">
              Pilihan Cepat
            </label>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setSelectedDate(todayStr)}
                className={`flex-1 py-2 text-xs font-bold rounded-xl border transition-all cursor-pointer ${
                  selectedDate === todayStr
                    ? 'bg-blue-600 text-white border-blue-400 shadow-lg shadow-blue-600/30'
                    : 'bg-white/5 text-slate-300 border-white/10 hover:bg-white/10 hover:text-white'
                }`}
              >
                Hari Ini
              </button>
              <button
                type="button"
                onClick={() => {
                  const d = new Date();
                  d.setDate(d.getDate() - 1);
                  setSelectedDate(d.toISOString().split('T')[0]);
                }}
                className="flex-1 py-2 text-xs font-bold rounded-xl border border-white/10 bg-white/5 text-slate-300 hover:bg-white/10 hover:text-white transition-all cursor-pointer"
              >
                Kemarin
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Daily Metrics Dashboard Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Sesi Mengajar */}
        <div className="bg-white/10 backdrop-blur-xl p-5 rounded-2xl border border-white/10 shadow-2xl">
          <div className="flex items-center justify-between text-slate-300 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Sesi Mengajar</span>
            <Clock className="w-4 h-4 text-blue-400" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black text-white">
              {summaryStats.sessionsCount}
            </span>
            <span className="text-xs font-semibold text-slate-400">Kelas</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-2 truncate">
            {summaryStats.classesTaught.join(', ') || 'Belum ada sesi'}
          </p>
        </div>

        {/* Rata-Rata Kehadiran */}
        <div className="bg-white/10 backdrop-blur-xl p-5 rounded-2xl border border-white/10 shadow-2xl">
          <div className="flex items-center justify-between text-emerald-300 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-300">
              Rata-Rata Hadir
            </span>
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400"></span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black text-emerald-400">
              {summaryStats.averageAttendanceRate}%
            </span>
            <span className="text-xs font-semibold text-emerald-300">
              {summaryStats.totalPresent}/{summaryStats.totalStudentsHandled}
            </span>
          </div>
          <div className="w-full bg-white/10 h-2 rounded-full mt-3 overflow-hidden">
            <div
              className="bg-emerald-400 h-full rounded-full transition-all duration-500 shadow-sm"
              style={{ width: `${summaryStats.averageAttendanceRate}%` }}
            ></div>
          </div>
        </div>

        {/* Siswa Izin & Sakit */}
        <div className="bg-white/10 backdrop-blur-xl p-5 rounded-2xl border border-white/10 shadow-2xl">
          <div className="flex items-center justify-between text-slate-300 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Izin & Sakit</span>
            <div className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-blue-400"></span>
              <span className="w-2 h-2 rounded-full bg-amber-400"></span>
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black text-white">
              {summaryStats.totalPermission + summaryStats.totalSick}
            </span>
            <span className="text-xs font-semibold text-slate-400">Siswa</span>
          </div>
          <div className="flex items-center gap-3 mt-2 text-xs">
            <span className="text-blue-300 font-semibold">Izin: {summaryStats.totalPermission}</span>
            <span className="text-slate-500">|</span>
            <span className="text-amber-300 font-semibold">Sakit: {summaryStats.totalSick}</span>
          </div>
        </div>

        {/* Siswa Alpa (Tanpa Keterangan) */}
        <div className="bg-white/10 backdrop-blur-xl p-5 rounded-2xl border border-white/10 shadow-2xl">
          <div className="flex items-center justify-between text-rose-300 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-300">
              Alpa (A)
            </span>
            <span className="w-2.5 h-2.5 rounded-full bg-rose-400"></span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black text-rose-400">
              {summaryStats.totalAbsent}
            </span>
            <span className="text-xs font-semibold text-rose-300">Siswa</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-2">
            {summaryStats.totalAbsent === 0
              ? 'Nihil (Tertib 100%)'
              : 'Perlu konfirmasi wali murid'}
          </p>
        </div>
      </div>

      {/* Main Content Layout: Class Sessions Breakdown + Absentee Follow-up List */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Sesi Pembelajaran Hari Ini (2 cols) */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white/10 backdrop-blur-xl rounded-2xl border border-white/10 p-5 sm:p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-4 mb-4 border-b border-white/10">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-blue-400" />
                Rincian Sesi Pembelajaran & Materi ({summaryStats.records.length})
              </h3>
              <span className="text-xs font-semibold text-slate-400">
                {new Date(selectedDate).toLocaleDateString('id-ID', {
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric',
                })}
              </span>
            </div>

            {summaryStats.records.length === 0 ? (
              <div className="py-12 text-center text-slate-400">
                <Calendar className="w-10 h-10 mx-auto mb-2 text-slate-500" />
                <p className="font-semibold text-slate-200">
                  Belum ada data presensi pada tanggal ini
                </p>
                <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                  Silakan isi dan simpan presensi melalui menu "Presensi Kelas" terlebih dahulu.
                </p>
                {onNavigateToAttendance && (
                  <button
                    type="button"
                    onClick={onNavigateToAttendance}
                    className="mt-4 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-xl transition-all shadow-lg shadow-blue-600/30 cursor-pointer"
                  >
                    Buka Formulir Presensi
                  </button>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                {summaryStats.records.map((rec, index) => (
                  <div
                    key={rec.id || index}
                    className="p-4 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 hover:border-blue-400/40 transition-all backdrop-blur-md"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div className="flex items-center gap-2.5">
                        <span className="w-7 h-7 rounded-lg bg-blue-600 text-white flex items-center justify-center text-xs font-bold shadow-md">
                          {index + 1}
                        </span>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-white text-sm">
                              {rec.className}
                            </span>
                            <span className="text-xs text-slate-400">•</span>
                            <span className="text-xs font-semibold text-blue-300">
                              {rec.subject}
                            </span>
                          </div>
                          <p className="text-xs text-slate-400 flex items-center gap-1.5 mt-0.5">
                            <Clock className="w-3.5 h-3.5 text-slate-400" />
                            <span>{rec.period}</span>
                            <span>•</span>
                            <span>Guru: {rec.teacherName}</span>
                          </p>
                        </div>
                      </div>

                      {/* Attendance Percentage Badge */}
                      <div className="flex items-center gap-2 self-start sm:self-auto">
                        <div className="text-right">
                          <span className="text-sm font-black text-emerald-400">
                            {rec.attendancePercentage}%
                          </span>
                          <p className="text-[10px] text-slate-400">
                            {rec.presentCount}/{rec.totalStudents} Hadir
                          </p>
                        </div>
                        <span
                          className={`w-3 h-3 rounded-full ${
                            rec.attendancePercentage >= 90
                              ? 'bg-emerald-400'
                              : rec.attendancePercentage >= 75
                              ? 'bg-amber-400'
                              : 'bg-rose-400'
                          }`}
                        ></span>
                      </div>
                    </div>

                    {/* Topic & Breakdown */}
                    <div className="mt-3 pt-3 border-t border-white/10 flex flex-col sm:flex-row sm:items-center justify-between text-xs gap-2">
                      <div className="text-slate-300">
                        <span className="font-semibold text-slate-400">Topik Materi: </span>
                        <span>{rec.topic || 'Pembelajaran Reguler'}</span>
                      </div>

                      <div className="flex items-center gap-2 text-[11px] font-bold">
                        <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 rounded-md">
                          H: {rec.presentCount}
                        </span>
                        <span className="px-2 py-0.5 bg-blue-500/20 text-blue-300 border border-blue-500/30 rounded-md">
                          I: {rec.permissionCount}
                        </span>
                        <span className="px-2 py-0.5 bg-amber-500/20 text-amber-300 border border-amber-500/30 rounded-md">
                          S: {rec.sickCount}
                        </span>
                        <span className="px-2 py-0.5 bg-rose-500/20 text-rose-300 border border-rose-500/30 rounded-md">
                          A: {rec.absentCount}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Daftar Siswa Tidak Hadir (Tindak Lanjut) */}
        <div className="space-y-4">
          <div className="bg-white/10 backdrop-blur-xl rounded-2xl border border-white/10 p-5 sm:p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-3 mb-3 border-b border-white/10">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-400" />
                <span>Siswa Tidak Hadir ({summaryStats.absenteeList.length})</span>
              </h3>
            </div>
            <p className="text-xs text-slate-400 mb-4">
              Daftar siswa yang memerlukan konfirmasi atau tindak lanjut ke wali kelas / BK
            </p>

            {summaryStats.absenteeList.length === 0 ? (
              <div className="py-8 text-center bg-emerald-500/10 rounded-xl border border-emerald-500/20 p-4">
                <Sparkles className="w-8 h-8 mx-auto mb-2 text-emerald-400" />
                <p className="text-xs font-bold text-emerald-300">
                  Kehadiran Sempurna (100%)
                </p>
                <p className="text-[11px] text-emerald-400/80 mt-0.5">
                  Seluruh siswa hadir pada semua sesi pembelajaran hari ini.
                </p>
              </div>
            ) : (
              <div className="space-y-2.5 max-h-[420px] overflow-y-auto pr-1">
                {summaryStats.absenteeList.map((item, idx) => {
                  const statusConf = STATUS_CONFIG[item.status];
                  return (
                    <div
                      key={idx}
                      className="p-3 rounded-xl border border-white/10 bg-white/5 flex items-start justify-between gap-2 text-xs backdrop-blur-md"
                    >
                      <div>
                        <p className="font-bold text-white">{item.studentName}</p>
                        <p className="text-[11px] text-slate-400 mt-0.5">
                          {item.className} • {item.subject}
                        </p>
                        {item.notes && (
                          <p className="text-[11px] text-blue-300 font-medium mt-1 bg-blue-500/20 border border-blue-400/30 px-2 py-0.5 rounded-md inline-block">
                            Ket: {item.notes}
                          </p>
                        )}
                      </div>
                      <span
                        className={`px-2 py-1 rounded-lg text-[11px] font-black shrink-0 ${
                          item.status === 'A'
                            ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                            : item.status === 'S'
                            ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                            : 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                        }`}
                      >
                        {statusConf.label} ({item.status})
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Quick WhatsApp Preview Box */}
          <div className="bg-white/10 backdrop-blur-xl border border-white/10 text-white rounded-2xl p-5 shadow-2xl">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold text-emerald-400 flex items-center gap-1.5">
                <Send className="w-3.5 h-3.5" />
                Format WhatsApp Siap Kirim
              </span>
              <button
                type="button"
                onClick={handleCopyWhatsApp}
                className="text-[11px] font-bold text-blue-300 hover:text-white underline cursor-pointer"
              >
                Salin Teks
              </button>
            </div>
            <div className="p-3 bg-black/40 rounded-xl text-[11px] font-mono whitespace-pre-line max-h-40 overflow-y-auto leading-relaxed border border-white/10 text-slate-200">
              {generateWhatsAppReport()}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
