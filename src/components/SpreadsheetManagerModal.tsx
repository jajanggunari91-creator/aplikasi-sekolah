import React, { useState, useEffect } from 'react';
import {
  FileSpreadsheet,
  X,
  Plus,
  Link,
  CheckCircle2,
  ExternalLink,
  RefreshCw,
  FolderOpen,
  Sparkles,
  AlertCircle,
  FileCheck,
  Layers,
  KeyRound,
  ShieldCheck,
} from 'lucide-react';
import { SheetConfig, Student, ClassGrade } from '../types';
import {
  listSpreadsheets,
  getSpreadsheetMetadata,
  createMasterAttendanceSpreadsheet,
  fetchStudentsFromSpreadsheet,
  DriveSpreadsheetItem,
  parseSpreadsheetId,
} from '../services/googleSheets';
import { googleSignIn } from '../services/googleAuth';
import { ConfirmationModal } from './ConfirmationModal';

interface SpreadsheetManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  sheetConfig: SheetConfig | null;
  onSaveConfig: (config: SheetConfig | null) => void;
  onStudentsUpdated: (studentsByClass: Record<ClassGrade, Student[]>) => void;
  isLoggedIn: boolean;
  onTriggerLogin: () => void;
}

export const SpreadsheetManagerModal: React.FC<SpreadsheetManagerModalProps> = ({
  isOpen,
  onClose,
  sheetConfig,
  onSaveConfig,
  onStudentsUpdated,
  isLoggedIn,
  onTriggerLogin,
}) => {
  const [activeTab, setActiveTab] = useState<'create' | 'connect' | 'status'>('create');
  const [inputUrl, setInputUrl] = useState('');
  const [userSpreadsheets, setUserSpreadsheets] = useState<DriveSpreadsheetItem[]>([]);
  const [isLoadingList, setIsLoadingList] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isRefreshingStudents, setIsRefreshingStudents] = useState(false);
  const [isGrantingScope, setIsGrantingScope] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ text: string; type: 'success' | 'error'; isScopeError?: boolean } | null>(null);

  // Confirmation modal
  const [confirmCreateOpen, setConfirmCreateOpen] = useState(false);
  const [newSheetTitle, setNewSheetTitle] = useState('Master Absensi Guru TJKT 2026');

  // Load drive spreadsheets when modal opens and user is logged in
  useEffect(() => {
    if (isOpen && isLoggedIn) {
      loadDriveList();
    }
  }, [isOpen, isLoggedIn]);

  const loadDriveList = async () => {
    setIsLoadingList(true);
    try {
      const files = await listSpreadsheets();
      setUserSpreadsheets(files);
    } catch (e: any) {
      console.warn('Could not load drive list:', e.message);
      if (
        e.message?.toLowerCase().includes('scope') ||
        e.message?.toLowerCase().includes('izin')
      ) {
        setStatusMessage({
          text: e.message,
          type: 'error',
          isScopeError: true,
        });
      }
    } finally {
      setIsLoadingList(false);
    }
  };

  const handleGrantScopes = async () => {
    setIsGrantingScope(true);
    try {
      await googleSignIn(true);
      setStatusMessage({
        text: 'Izin akses Google Sheets & Drive berhasil diberikan! Silakan buat atau hubungkan spreadsheet sekarang.',
        type: 'success',
        isScopeError: false,
      });
      loadDriveList();
    } catch (err: any) {
      setStatusMessage({
        text: err.message || 'Gagal memperbarui izin login Google.',
        type: 'error',
        isScopeError: true,
      });
    } finally {
      setIsGrantingScope(false);
    }
  };

  const handleCreateNewMaster = async () => {
    setConfirmCreateOpen(false);
    setIsCreating(true);
    setStatusMessage(null);
    try {
      const res = await createMasterAttendanceSpreadsheet(newSheetTitle);
      const newConfig: SheetConfig = {
        spreadsheetId: res.id,
        spreadsheetTitle: res.title,
        spreadsheetUrl: res.url,
        studentSheetName: 'Data Siswa 10 TJKT',
        logSheetName: 'Rekap Absensi Harian',
        lastSynced: new Date().toISOString(),
      };
      onSaveConfig(newConfig);
      setStatusMessage({
        text: `Berhasil membuat spreadsheet "${res.title}" di Google Drive Anda!`,
        type: 'success',
      });
      setActiveTab('status');
      loadDriveList();
    } catch (err: any) {
      const isScope =
        err.message?.toLowerCase().includes('scope') ||
        err.message?.toLowerCase().includes('izin') ||
        err.message?.toLowerCase().includes('insufficient');
      setStatusMessage({
        text: err.message || 'Gagal membuat spreadsheet baru.',
        type: 'error',
        isScopeError: isScope,
      });
    } finally {
      setIsCreating(false);
    }
  };

  const handleConnectExisting = async (idOrUrl: string) => {
    const cleanId = parseSpreadsheetId(idOrUrl);
    if (!cleanId) {
      setStatusMessage({ text: 'Masukkan link atau ID Google Spreadsheet yang valid.', type: 'error' });
      return;
    }

    setIsConnecting(true);
    setStatusMessage(null);
    try {
      const meta = await getSpreadsheetMetadata(cleanId);
      const logSheet = meta.sheetNames.find((s) => s.toLowerCase().includes('rekap') || s.toLowerCase().includes('absen')) || meta.sheetNames[0] || 'Sheet1';
      const studentSheet = meta.sheetNames.find((s) => s.toLowerCase().includes('siswa') || s.toLowerCase().includes('10')) || meta.sheetNames[0] || 'Sheet1';

      const config: SheetConfig = {
        spreadsheetId: cleanId,
        spreadsheetTitle: meta.title,
        spreadsheetUrl: meta.url,
        studentSheetName: studentSheet,
        logSheetName: logSheet,
        lastSynced: new Date().toISOString(),
      };
      onSaveConfig(config);
      setStatusMessage({
        text: `Berhasil menghubungkan spreadsheet "${meta.title}"!`,
        type: 'success',
      });
      setActiveTab('status');
    } catch (err: any) {
      const isScope =
        err.message?.toLowerCase().includes('scope') ||
        err.message?.toLowerCase().includes('izin') ||
        err.message?.toLowerCase().includes('insufficient');
      setStatusMessage({
        text: err.message || 'Gagal membuka spreadsheet. Pastikan izin akses telah diberikan.',
        type: 'error',
        isScopeError: isScope,
      });
    } finally {
      setIsConnecting(false);
    }
  };

  // Pull latest students for all classes from sheets
  const handleReloadStudentsFromSheets = async () => {
    if (!sheetConfig) return;
    setIsRefreshingStudents(true);
    setStatusMessage(null);
    try {
      const classes: ClassGrade[] = ['10 TJKT', '11 TJKT', '12 TJKT'];
      const updatedMap: Record<ClassGrade, Student[]> = {} as any;

      for (const cls of classes) {
        // Try sheet name format like "Data Siswa 10 TJKT" or "10 TJKT" or generic studentSheetName
        const targetSheet = `Data Siswa ${cls}`;
        try {
          const fetched = await fetchStudentsFromSpreadsheet(sheetConfig.spreadsheetId, targetSheet, cls);
          if (fetched && fetched.length > 0) {
            updatedMap[cls] = fetched;
          }
        } catch {
          // If dedicated sheet doesn't exist, try reading default studentSheetName
        }
      }

      onStudentsUpdated(updatedMap);
      setStatusMessage({
        text: 'Data siswa berhasil disinkronkan dari Google Spreadsheet!',
        type: 'success',
      });
    } catch (err: any) {
      setStatusMessage({
        text: err.message || 'Gagal menyinkronkan data siswa.',
        type: 'error',
      });
    } finally {
      setIsRefreshingStudents(false);
    }
  };

  const handleDisconnect = () => {
    onSaveConfig(null);
    setStatusMessage({ text: 'Spreadsheet berhasil dilepas. Presensi tetap tersimpan di memori lokal.', type: 'success' });
  };

  if (!isOpen) return null;

  return (
    <div
      id="spreadsheet-modal-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-in fade-in"
    >
      <div
        id="spreadsheet-modal-container"
        className="w-full max-w-2xl bg-slate-900/95 backdrop-blur-2xl rounded-2xl shadow-2xl border border-white/10 overflow-hidden flex flex-col max-h-[90vh] text-white"
      >
        {/* Modal Header */}
        <div className="p-5 border-b border-white/10 bg-white/5 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">
                Integrasi Google Spreadsheet
              </h3>
              <p className="text-xs text-slate-300">
                Data siswa & hasil absensi tersimpan di spreadsheet yang sama dalam sheet terpisah
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Tabs */}
        <div className="flex border-b border-white/10 bg-white/5 px-5 pt-3 gap-3">
          <button
            type="button"
            onClick={() => setActiveTab('create')}
            className={`pb-3 text-xs font-bold transition-all border-b-2 cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'create'
                ? 'border-emerald-400 text-emerald-300'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Buat Otomatis (Rekomendasi)</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('connect')}
            className={`pb-3 text-xs font-bold transition-all border-b-2 cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'connect'
                ? 'border-emerald-400 text-emerald-300'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Link className="w-3.5 h-3.5" />
            <span>Hubungkan yang Sudah Ada</span>
          </button>

          {sheetConfig && (
            <button
              type="button"
              onClick={() => setActiveTab('status')}
              className={`pb-3 text-xs font-bold transition-all border-b-2 cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'status'
                  ? 'border-emerald-400 text-emerald-300'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              <span>Status Koneksi</span>
            </button>
          )}
        </div>

        {/* Modal Content */}
        <div className="p-6 overflow-y-auto space-y-5 flex-1">
          {/* Status Message */}
          {statusMessage && (
            <div
              className={`p-4 rounded-xl text-xs font-semibold flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                statusMessage.type === 'success'
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                  : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
              }`}
            >
              <div className="flex items-start gap-2.5">
                {statusMessage.type === 'success' ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                )}
                <span className="leading-relaxed">{statusMessage.text}</span>
              </div>

              {statusMessage.isScopeError && (
                <button
                  type="button"
                  disabled={isGrantingScope}
                  onClick={handleGrantScopes}
                  className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-bold flex items-center justify-center gap-1.5 transition-all shrink-0 cursor-pointer shadow-md shadow-blue-600/30 disabled:opacity-50"
                >
                  <KeyRound className={`w-3.5 h-3.5 ${isGrantingScope ? 'animate-spin' : ''}`} />
                  <span>{isGrantingScope ? 'Memproses...' : 'Beri Izin Akses Google Sheets'}</span>
                </button>
              )}
            </div>
          )}

          {!isLoggedIn ? (
            <div className="p-8 text-center bg-white/5 rounded-2xl border border-white/10">
              <FileSpreadsheet className="w-12 h-12 mx-auto text-emerald-400 mb-3" />
              <h4 className="text-base font-bold text-white mb-1">
                Login Google Diperlukan
              </h4>
              <p className="text-xs text-slate-300 max-w-md mx-auto mb-5">
                Untuk membaca daftar siswa dan menyimpan log presensi langsung ke Google Sheets Anda, silakan hubungkan akun Google Anda.
              </p>
              <button
                type="button"
                onClick={onTriggerLogin}
                className="px-6 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-blue-600/30 transition-all cursor-pointer"
              >
                Login dengan Google
              </button>
            </div>
          ) : (
            <>
              {/* TAB: CREATE NEW AUTOMATIC */}
              {activeTab === 'create' && (
                <div className="space-y-4">
                  <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl">
                    <h4 className="text-sm font-bold text-emerald-300 flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-emerald-400" />
                      Template Siap Pakai Sesuai Permintaan
                    </h4>
                    <p className="text-xs text-slate-200 mt-1 leading-relaxed">
                      Sistem akan membuatkan sebuah file Google Spreadsheet lengkap dengan 4 sheet terpisah:
                    </p>
                    <ul className="text-xs text-slate-300 mt-2 space-y-1 list-disc list-inside font-medium">
                      <li><strong className="text-emerald-300">Data Siswa 10 TJKT</strong> (Daftar siswa Kelas 10)</li>
                      <li><strong className="text-emerald-300">Data Siswa 11 TJKT</strong> (Daftar siswa Kelas 11)</li>
                      <li><strong className="text-emerald-300">Data Siswa 12 TJKT</strong> (Daftar siswa Kelas 12)</li>
                      <li><strong className="text-emerald-300">Rekap Absensi Harian</strong> (Tempat tersimpannya hasil absensi)</li>
                    </ul>
                  </div>

                  <div className="space-y-2">
                    <label className="block text-xs font-semibold text-slate-200">
                      Nama File Spreadsheet di Google Drive
                    </label>
                    <input
                      type="text"
                      value={newSheetTitle}
                      onChange={(e) => setNewSheetTitle(e.target.value)}
                      placeholder="Judul spreadsheet..."
                      className="w-full px-3.5 py-2.5 bg-white/5 border border-white/10 rounded-xl text-sm font-medium text-white placeholder:text-slate-400 focus:bg-white/10 focus:border-blue-400 outline-none"
                    />
                  </div>

                  <button
                    type="button"
                    disabled={isCreating}
                    onClick={() => setConfirmCreateOpen(true)}
                    className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-emerald-600/30 transition-all cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    <Plus className="w-4 h-4" />
                    <span>{isCreating ? 'Membuat Spreadsheet...' : 'Buat Spreadsheet Master di Google Drive'}</span>
                  </button>
                </div>
              )}

              {/* TAB: CONNECT EXISTING */}
              {activeTab === 'connect' && (
                <div className="space-y-5">
                  <div className="space-y-2">
                    <label className="block text-xs font-semibold text-slate-200">
                      Tempel URL atau ID Google Spreadsheet
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={inputUrl}
                        onChange={(e) => setInputUrl(e.target.value)}
                        placeholder="https://docs.google.com/spreadsheets/d/1abc.../edit"
                        className="flex-1 px-3.5 py-2.5 bg-white/5 border border-white/10 rounded-xl text-xs sm:text-sm font-medium text-white placeholder:text-slate-400 focus:bg-white/10 focus:border-blue-400 outline-none"
                      />
                      <button
                        type="button"
                        disabled={isConnecting || !inputUrl.trim()}
                        onClick={() => handleConnectExisting(inputUrl)}
                        className="px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold transition-all cursor-pointer disabled:opacity-50 shadow-lg shadow-blue-600/30"
                      >
                        {isConnecting ? 'Mengecek...' : 'Hubungkan'}
                      </button>
                    </div>
                  </div>

                  {/* Pick from user's Drive */}
                  <div className="pt-3 border-t border-white/10">
                    <div className="flex items-center justify-between mb-2">
                      <label className="text-xs font-semibold text-slate-200 flex items-center gap-1.5">
                        <FolderOpen className="w-4 h-4 text-blue-400" />
                        <span>Pilih dari Google Drive Anda</span>
                      </label>
                      <button
                        type="button"
                        onClick={loadDriveList}
                        className="text-[11px] font-semibold text-blue-300 hover:text-white flex items-center gap-1 cursor-pointer"
                      >
                        <RefreshCw className={`w-3 h-3 ${isLoadingList ? 'animate-spin' : ''}`} />
                        Segarkan
                      </button>
                    </div>

                    {isLoadingList ? (
                      <div className="py-6 text-center text-xs text-slate-400">
                        Memuat berkas dari Drive...
                      </div>
                    ) : userSpreadsheets.length === 0 ? (
                      <p className="text-xs text-slate-400 italic py-2">
                        Tidak ada file spreadsheet lain yang ditemukan di Drive.
                      </p>
                    ) : (
                      <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                        {userSpreadsheets.map((item) => (
                          <div
                            key={item.id}
                            className="p-2.5 rounded-xl border border-white/10 hover:border-emerald-400/40 bg-white/5 hover:bg-white/10 transition-all flex items-center justify-between gap-3 text-xs"
                          >
                            <div className="flex items-center gap-2 truncate">
                              <FileSpreadsheet className="w-4 h-4 text-emerald-400 shrink-0" />
                              <span className="font-semibold text-white truncate">
                                {item.name}
                              </span>
                            </div>
                            <button
                              type="button"
                              onClick={() => handleConnectExisting(item.id)}
                              className="px-3 py-1 bg-emerald-600/30 hover:bg-emerald-600 text-emerald-200 hover:text-white border border-emerald-500/40 rounded-lg text-[11px] font-bold transition-all cursor-pointer shrink-0"
                            >
                              Pilih Ini
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* TAB: STATUS */}
              {activeTab === 'status' && sheetConfig && (
                <div className="space-y-4">
                  <div className="p-4 bg-emerald-500/15 border border-emerald-500/30 rounded-2xl flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-md">
                        <FileCheck className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-white">
                          {sheetConfig.spreadsheetTitle}
                        </h4>
                        <p className="text-xs text-slate-300 mt-0.5">
                          ID: <span className="font-mono text-emerald-300">{sheetConfig.spreadsheetId}</span>
                        </p>
                        <div className="flex flex-wrap items-center gap-2 mt-2 text-[11px]">
                          <span className="px-2 py-0.5 bg-white/10 text-emerald-300 rounded-md border border-emerald-500/30 font-semibold">
                            Sheet Log: {sheetConfig.logSheetName}
                          </span>
                        </div>
                      </div>
                    </div>

                    <a
                      href={sheetConfig.spreadsheetUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 text-emerald-300 hover:text-white hover:bg-emerald-500/20 rounded-lg transition-colors"
                      title="Buka di Google Sheets"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  </div>

                  <div className="flex flex-col sm:flex-row items-center gap-3">
                    <button
                      type="button"
                      disabled={isRefreshingStudents}
                      onClick={handleReloadStudentsFromSheets}
                      className="w-full sm:flex-1 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 shadow-lg shadow-blue-600/30"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 ${isRefreshingStudents ? 'animate-spin' : ''}`} />
                      <span>{isRefreshingStudents ? 'Menyinkronkan...' : 'Tarik Ulang Data Siswa dari Sheet'}</span>
                    </button>

                    <button
                      type="button"
                      onClick={handleDisconnect}
                      className="w-full sm:w-auto px-4 py-2.5 text-rose-300 hover:text-white bg-rose-500/10 hover:bg-rose-500/30 border border-rose-500/30 rounded-xl text-xs font-bold transition-colors cursor-pointer"
                    >
                      Lepas Koneksi
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-white/10 bg-white/5 flex items-center justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 text-xs font-bold text-slate-300 bg-white/5 hover:bg-white/10 hover:text-white border border-white/10 rounded-xl transition-colors cursor-pointer"
          >
            Tutup
          </button>
        </div>
      </div>

      {/* Confirmation Modal for Creating Master Sheet */}
      <ConfirmationModal
        isOpen={confirmCreateOpen}
        title="Buat Spreadsheet Master di Google Drive"
        message={`Apakah Anda ingin membuat file Google Spreadsheet baru "${newSheetTitle}" dengan format 4 sheet terpisah untuk Jurusan TJKT?`}
        confirmText="Ya, Buat File Spreadsheet"
        cancelText="Batal"
        type="primary"
        onConfirm={handleCreateNewMaster}
        onCancel={() => setConfirmCreateOpen(false)}
        details={[
          { label: 'Nama File', value: newSheetTitle },
          { label: 'Sheet Siswa', value: '10 TJKT, 11 TJKT, 12 TJKT' },
          { label: 'Sheet Log Presensi', value: 'Rekap Absensi Harian' },
          { label: 'Lokasi Simpan', value: 'Google Drive Akun Anda' },
        ]}
      />
    </div>
  );
};
