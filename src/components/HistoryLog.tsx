import React, { useState, useMemo } from 'react';
import {
  History,
  Calendar,
  Search,
  FileSpreadsheet,
  Clock,
  UserCheck,
  CheckCircle2,
  RefreshCw,
  Eye,
  X,
  ExternalLink,
  Download,
  AlertCircle,
} from 'lucide-react';
import { AttendanceRecord, SheetConfig } from '../types';
import { STATUS_CONFIG } from '../data/initialData';
import { ConfirmationModal } from './ConfirmationModal';

interface HistoryLogProps {
  records: AttendanceRecord[];
  sheetConfig: SheetConfig | null;
  onSyncRecordToSheet: (record: AttendanceRecord) => Promise<boolean>;
}

export const HistoryLog: React.FC<HistoryLogProps> = ({
  records,
  sheetConfig,
  onSyncRecordToSheet,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedClassFilter, setSelectedClassFilter] = useState('ALL');
  const [detailRecord, setDetailRecord] = useState<AttendanceRecord | null>(null);
  const [syncingId, setSyncingId] = useState<string | null>(null);
  const [syncModalRecord, setSyncModalRecord] = useState<AttendanceRecord | null>(null);

  // Filter records
  const filteredRecords = useMemo(() => {
    return records.filter((r) => {
      const matchSearch =
        r.teacherName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.topic.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.className.toLowerCase().includes(searchQuery.toLowerCase());
      const matchClass =
        selectedClassFilter === 'ALL' || r.className === selectedClassFilter;
      return matchSearch && matchClass;
    });
  }, [records, searchQuery, selectedClassFilter]);

  const handleTriggerSync = async (record: AttendanceRecord) => {
    setSyncModalRecord(record);
  };

  const handleConfirmSync = async () => {
    if (!syncModalRecord) return;
    const target = syncModalRecord;
    setSyncModalRecord(null);
    setSyncingId(target.id);
    try {
      await onSyncRecordToSheet(target);
    } catch (e) {
      console.error('Sync failed:', e);
    } finally {
      setSyncingId(null);
    }
  };

  const handleExportCSV = (record: AttendanceRecord) => {
    let csv = `ID Sesi;Tanggal;Jam;Guru;Mata Pelajaran;Kelas;NIS;Nama Siswa;Gender;Status;Keterangan;Topik\n`;
    record.details.forEach((d) => {
      csv += `"${record.id}";"${record.date}";"${record.period}";"${record.teacherName}";"${record.subject}";"${record.className}";"${d.nis}";"${d.studentName}";"${d.gender}";"${d.status}";"${d.notes || '-'}";"${record.topic}"\n`;
    });

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Presensi_${record.className}_${record.date}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6 text-white">
      {/* Top Bar */}
      <div className="bg-white/10 backdrop-blur-xl rounded-2xl border border-white/10 p-5 sm:p-6 shadow-2xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 mb-4 border-b border-white/10">
          <div>
            <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
              <History className="w-5 h-5 text-blue-400" />
              <span>Riwayat & Arsip Presensi Pembelajaran</span>
            </h2>
            <p className="text-xs text-slate-300 mt-0.5">
              Daftar sesi presensi yang tersimpan di sistem dan status sinkronisasi ke spreadsheet
            </p>
          </div>
          <span className="text-xs font-bold text-blue-300 px-3 py-1 bg-blue-500/20 border border-blue-400/30 rounded-full self-start sm:self-auto">
            Total {records.length} Sesi
          </span>
        </div>

        {/* Filter Controls */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari guru, mata pelajaran, topik, atau kelas..."
              className="w-full pl-9.5 pr-4 py-2 bg-white/5 border border-white/10 rounded-xl text-xs sm:text-sm font-medium text-white placeholder:text-slate-400 focus:bg-white/10 focus:border-blue-400 outline-none"
            />
          </div>

          <div className="flex items-center gap-2">
            {(['ALL', '10 TJKT', '11 TJKT', '12 TJKT'] as const).map((cls) => (
              <button
                key={cls}
                type="button"
                onClick={() => setSelectedClassFilter(cls)}
                className={`px-3 py-2 text-xs font-bold rounded-xl border transition-colors cursor-pointer whitespace-nowrap ${
                  selectedClassFilter === cls
                    ? 'bg-blue-600 text-white border-blue-400 shadow-lg shadow-blue-600/30'
                    : 'bg-white/5 border-white/10 text-slate-300 hover:bg-white/10 hover:text-white'
                }`}
              >
                {cls === 'ALL' ? 'Semua Kelas' : cls}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Record Cards */}
      {filteredRecords.length === 0 ? (
        <div className="bg-white/10 backdrop-blur-xl rounded-2xl border border-white/10 p-12 text-center text-slate-400 shadow-2xl">
          <AlertCircle className="w-10 h-10 mx-auto mb-2 text-slate-500" />
          <p className="font-semibold text-slate-200">Belum ada riwayat presensi</p>
          <p className="text-xs text-slate-400 mt-1">
            Data presensi yang Anda simpan akan otomatis tercatat di halaman riwayat ini.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredRecords.map((record) => (
            <div
              key={record.id}
              className="bg-white/10 backdrop-blur-xl rounded-2xl border border-white/10 p-5 shadow-2xl hover:border-blue-400/40 transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div>
                    <span className="inline-block px-2.5 py-0.5 rounded-lg text-xs font-black bg-blue-500/20 text-blue-300 border border-blue-400/30">
                      {record.className}
                    </span>
                    <h3 className="font-bold text-white text-sm mt-1.5 line-clamp-1">
                      {record.subject}
                    </h3>
                  </div>

                  <div className="text-right">
                    <span className="text-base font-black text-emerald-400">
                      {record.attendancePercentage}%
                    </span>
                    <p className="text-[10px] text-slate-400">Kehadiran</p>
                  </div>
                </div>

                <div className="space-y-1.5 text-xs text-slate-300 mb-4 bg-white/5 border border-white/10 p-3 rounded-xl">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Guru:</span>
                    <span className="font-semibold text-white">{record.teacherName}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Tanggal & Jam:</span>
                    <span className="font-medium text-slate-200">
                      {record.date} ({record.period})
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Materi:</span>
                    <span className="font-medium text-slate-200 truncate max-w-[180px]">
                      {record.topic || '-'}
                    </span>
                  </div>
                </div>

                {/* Breakdown Badge */}
                <div className="flex items-center gap-1.5 text-[11px] font-bold mb-4">
                  <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 rounded-md">
                    Hadir: {record.presentCount}
                  </span>
                  <span className="px-2 py-0.5 bg-blue-500/20 text-blue-300 border border-blue-500/30 rounded-md">
                    Izin: {record.permissionCount}
                  </span>
                  <span className="px-2 py-0.5 bg-amber-500/20 text-amber-300 border border-amber-500/30 rounded-md">
                    Sakit: {record.sickCount}
                  </span>
                  <span className="px-2 py-0.5 bg-rose-500/20 text-rose-300 border border-rose-500/30 rounded-md">
                    Alpa: {record.absentCount}
                  </span>
                </div>
              </div>

              {/* Card Actions */}
              <div className="pt-3 border-t border-white/10 flex items-center justify-between gap-2">
                <div className="flex items-center gap-1.5 text-[11px]">
                  {record.spreadsheetSynced ? (
                    <span className="flex items-center gap-1 text-emerald-400 font-semibold">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Tersinkron Sheet
                    </span>
                  ) : sheetConfig ? (
                    <button
                      type="button"
                      disabled={syncingId === record.id}
                      onClick={() => handleTriggerSync(record)}
                      className="flex items-center gap-1 text-blue-400 hover:text-blue-300 font-bold underline cursor-pointer"
                    >
                      <RefreshCw
                        className={`w-3 h-3 ${syncingId === record.id ? 'animate-spin' : ''}`}
                      />
                      <span>Sinkronkan ke Sheet</span>
                    </button>
                  ) : (
                    <span className="text-slate-400">Tersimpan lokal</span>
                  )}
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => handleExportCSV(record)}
                    title="Export CSV"
                    className="p-1.5 text-slate-300 hover:text-white hover:bg-white/10 rounded-lg transition-colors cursor-pointer border border-white/10"
                  >
                    <Download className="w-4 h-4" />
                  </button>

                  <button
                    type="button"
                    onClick={() => setDetailRecord(record)}
                    className="flex items-center gap-1 px-2.5 py-1.5 bg-white/5 hover:bg-white/10 text-white rounded-lg text-xs font-bold transition-colors cursor-pointer border border-white/10"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>Lihat Detail</span>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Detail Modal */}
      {detailRecord && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
          <div className="w-full max-w-2xl bg-slate-900/95 backdrop-blur-2xl rounded-2xl shadow-2xl border border-white/10 overflow-hidden flex flex-col max-h-[90vh] text-white">
            <div className="p-5 border-b border-white/10 flex items-center justify-between bg-white/5">
              <div>
                <span className="text-xs font-black text-blue-300 bg-blue-500/20 border border-blue-400/30 px-2 py-0.5 rounded-md">
                  {detailRecord.className}
                </span>
                <h3 className="text-base font-bold text-white mt-1">
                  {detailRecord.subject}
                </h3>
                <p className="text-xs text-slate-300">
                  {detailRecord.date} ({detailRecord.period}) • Guru: {detailRecord.teacherName}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setDetailRecord(null)}
                className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 overflow-y-auto flex-1">
              <div className="mb-4 p-3 bg-white/5 rounded-xl text-xs border border-white/10">
                <span className="font-semibold text-slate-400">Topik / Materi Pokok: </span>
                <span className="text-white font-medium">
                  {detailRecord.topic || 'Pembelajaran Reguler'}
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-white/5 text-slate-300 font-bold border-b border-white/10">
                      <th className="py-2 px-3 w-10 text-center">No</th>
                      <th className="py-2 px-3">NIS</th>
                      <th className="py-2 px-3">Nama Siswa</th>
                      <th className="py-2 px-3 text-center">L/P</th>
                      <th className="py-2 px-3 text-center">Status</th>
                      <th className="py-2 px-3">Keterangan</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {detailRecord.details.map((d, i) => (
                      <tr key={d.studentId || i} className="hover:bg-white/5 transition-colors">
                        <td className="py-2 px-3 text-center text-slate-400">{i + 1}</td>
                        <td className="py-2 px-3 font-mono text-slate-300">{d.nis}</td>
                        <td className="py-2 px-3 font-semibold text-white">{d.studentName}</td>
                        <td className="py-2 px-3 text-center text-slate-300">{d.gender}</td>
                        <td className="py-2 px-3 text-center">
                          <span
                            className={`inline-block px-2 py-0.5 rounded-md font-black text-[11px] ${
                              d.status === 'H'
                                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                                : d.status === 'I'
                                ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                                : d.status === 'S'
                                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                                : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                            }`}
                          >
                            {d.status}
                          </span>
                        </td>
                        <td className="py-2 px-3 text-slate-300">{d.notes || '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="p-4 border-t border-white/10 bg-white/5 flex items-center justify-between">
              <button
                type="button"
                onClick={() => handleExportCSV(detailRecord)}
                className="flex items-center gap-1.5 px-3 py-2 bg-white/5 border border-white/10 hover:bg-white/10 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Unduh CSV</span>
              </button>

              <button
                type="button"
                onClick={() => setDetailRecord(null)}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer shadow-lg shadow-blue-600/30"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Modal for Manual Sync */}
      <ConfirmationModal
        isOpen={Boolean(syncModalRecord)}
        title="Sinkronkan Presensi ke Google Sheets"
        message={`Kirim data presensi kelas ${syncModalRecord?.className} (${syncModalRecord?.subject}) ke Google Spreadsheet?`}
        confirmText="Ya, Sinkronkan"
        cancelText="Batal"
        type="primary"
        onConfirm={handleConfirmSync}
        onCancel={() => setSyncModalRecord(null)}
        details={
          syncModalRecord
            ? [
                { label: 'Kelas', value: syncModalRecord.className },
                { label: 'Mata Pelajaran', value: syncModalRecord.subject },
                { label: 'Tanggal', value: syncModalRecord.date },
                { label: 'Total Siswa', value: `${syncModalRecord.totalStudents} Siswa` },
                { label: 'Target Sheet', value: sheetConfig?.spreadsheetTitle || '-' },
              ]
            : []
        }
      />
    </div>
  );
};
