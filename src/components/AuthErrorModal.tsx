import React, { useState } from 'react';
import {
  AlertTriangle,
  ExternalLink,
  Copy,
  Check,
  X,
  ShieldAlert,
  HelpCircle,
  RefreshCw,
  Globe,
  ArrowRight
} from 'lucide-react';
import firebaseConfig from '../../firebase-applet-config.json';

export interface AuthErrorInfo {
  code?: string;
  message: string;
  domain?: string;
  rawError?: any;
}

interface AuthErrorModalProps {
  isOpen: boolean;
  onClose: () => void;
  errorInfo: AuthErrorInfo | null;
  onRetryLogin: () => void;
}

export const AuthErrorModal: React.FC<AuthErrorModalProps> = ({
  isOpen,
  onClose,
  errorInfo,
  onRetryLogin,
}) => {
  const [copied, setCopied] = useState(false);

  if (!isOpen || !errorInfo) return null;

  const currentHostname = typeof window !== 'undefined' ? window.location.hostname : 'absensi-gurumapel.netlify.app';
  const currentOrigin = typeof window !== 'undefined' ? window.location.origin : 'https://absensi-gurumapel.netlify.app';
  const isUnauthorizedDomain =
    errorInfo.code === 'auth/unauthorized-domain' ||
    (errorInfo.message && errorInfo.message.includes('auth/unauthorized-domain')) ||
    (errorInfo.message && errorInfo.message.includes('unauthorized-domain'));

  const firebaseProjectId = firebaseConfig.projectId || 'gen-lang-client-0314496614';
  const firebaseConsoleUrl = `https://console.firebase.google.com/project/${firebaseProjectId}/authentication/settings`;

  const handleCopyDomain = (textToCopy: string) => {
    navigator.clipboard.writeText(textToCopy);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div
      id="auth-error-modal-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-in fade-in"
    >
      <div
        id="auth-error-modal-container"
        className="w-full max-w-xl bg-slate-900/95 backdrop-blur-2xl rounded-2xl shadow-2xl border border-white/10 overflow-hidden flex flex-col max-h-[90vh] text-white"
      >
        {/* Header */}
        <div className="p-5 border-b border-white/10 bg-white/5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
              isUnauthorizedDomain
                ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
            }`}>
              {isUnauthorizedDomain ? (
                <ShieldAlert className="w-5 h-5" />
              ) : (
                <AlertTriangle className="w-5 h-5" />
              )}
            </div>
            <div>
              <h3 className="text-base font-bold text-white">
                {isUnauthorizedDomain
                  ? 'Domain Belum Diizinkan (Authorized Domain)'
                  : 'Gagal Menghubungkan Akun Google'}
              </h3>
              <p className="text-xs text-slate-300">
                {isUnauthorizedDomain
                  ? 'Konfigurasi izin domain di Firebase Authentication'
                  : 'Terjadi kendala saat melakukan otorisasi login'}
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

        {/* Content */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-4 text-xs">
          {isUnauthorizedDomain ? (
            <>
              <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-xl space-y-2">
                <p className="text-amber-200 font-semibold text-sm flex items-center gap-1.5">
                  <Globe className="w-4 h-4 text-amber-400" />
                  <span>Penyebab Error:</span>
                </p>
                <p className="text-slate-200 leading-relaxed">
                  Firebase Authentication memblokir login dari domain ini karena domain hosting Anda (<strong>{currentHostname}</strong>) belum didaftarkan di daftar <em>Authorized domains</em> Firebase Console.
                </p>
              </div>

              {/* Current Domain Box */}
              <div className="space-y-1.5">
                <label className="text-slate-300 font-semibold block">
                  Domain Anda yang Perlu Ditambahkan:
                </label>
                <div className="flex items-center gap-2">
                  <div className="flex-1 px-3.5 py-2.5 bg-white/5 border border-white/10 rounded-xl font-mono text-xs sm:text-sm text-blue-300 truncate">
                    {currentHostname}
                  </div>
                  <button
                    type="button"
                    onClick={() => handleCopyDomain(currentHostname)}
                    className="px-3.5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold flex items-center gap-1.5 transition-colors cursor-pointer shadow-lg shadow-blue-600/30"
                  >
                    {copied ? <Check className="w-4 h-4 text-emerald-300" /> : <Copy className="w-4 h-4" />}
                    <span>{copied ? 'Tersalin!' : 'Salin Domain'}</span>
                  </button>
                </div>
              </div>

              {/* Step by Step Guide */}
              <div className="p-4 bg-white/5 border border-white/10 rounded-xl space-y-3">
                <h4 className="font-bold text-white text-xs flex items-center gap-1.5">
                  <HelpCircle className="w-4 h-4 text-blue-400" />
                  <span>Cara Memperbaiki (Hanya 1 Menit):</span>
                </h4>
                <ol className="space-y-2 text-slate-300 list-decimal list-inside pl-1 leading-relaxed">
                  <li>
                    Buka <a
                      href={firebaseConsoleUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-400 hover:underline font-bold inline-flex items-center gap-0.5"
                    >
                      Firebase Console Authorized Domains <ExternalLink className="w-3 h-3" />
                    </a>
                  </li>
                  <li>
                    Pilih tab <strong>Settings</strong> &gt; sub-tab <strong>Authorized domains</strong> (Domain yang diotorisasi).
                  </li>
                  <li>
                    Klik tombol <strong>Add domain</strong> (Tambah domain).
                  </li>
                  <li>
                    Tempelkan domain: <span className="font-mono bg-white/10 text-emerald-300 px-1.5 py-0.5 rounded">{currentHostname}</span> (atau <span className="font-mono bg-white/10 text-emerald-300 px-1.5 py-0.5 rounded">netlify.app</span>) lalu klik <strong>Add / Simpan</strong>.
                  </li>
                  <li>
                    Kembali ke halaman ini dan klik tombol <strong>Coba Login Lagi</strong> di bawah.
                  </li>
                </ol>
              </div>

              <div className="pt-2 flex flex-col sm:flex-row items-center gap-2">
                <a
                  href={firebaseConsoleUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full sm:flex-1 py-2.5 px-4 bg-white/10 hover:bg-white/15 border border-white/10 text-white rounded-xl font-bold flex items-center justify-center gap-2 transition-colors cursor-pointer text-center"
                >
                  <ExternalLink className="w-4 h-4 text-blue-400" />
                  <span>Buka Firebase Console</span>
                </a>
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onRetryLogin();
                  }}
                  className="w-full sm:flex-1 py-2.5 px-4 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold flex items-center justify-center gap-2 transition-colors cursor-pointer shadow-lg shadow-blue-600/30"
                >
                  <RefreshCw className="w-4 h-4" />
                  <span>Coba Login Lagi</span>
                </button>
              </div>
            </>
          ) : (
            <>
              <div className="p-4 bg-rose-500/10 border border-rose-500/20 rounded-xl space-y-1.5">
                <p className="text-rose-300 font-semibold">Pesan Error:</p>
                <p className="text-slate-200 font-mono text-xs break-words">
                  {errorInfo.message || 'Terjadi kesalahan otentikasi Google.'}
                </p>
                {errorInfo.code && (
                  <p className="text-slate-400 text-[11px]">
                    Kode: <span className="font-mono text-rose-400">{errorInfo.code}</span>
                  </p>
                )}
              </div>

              <div className="p-4 bg-white/5 border border-white/10 rounded-xl space-y-2">
                <h4 className="font-bold text-white text-xs">Saran Penanganan:</h4>
                <ul className="space-y-1.5 text-slate-300 list-disc list-inside">
                  <li>Pastikan pop-up browser tidak diblokir saat jendela Google Sign-In muncul.</li>
                  <li>Pastikan koneksi internet Anda stabil.</li>
                  <li>Periksa izin akun Google Workspace / Google Drive Anda.</li>
                </ul>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white rounded-xl font-semibold transition-colors border border-white/10 cursor-pointer"
                >
                  Tutup
                </button>
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onRetryLogin();
                  }}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold flex items-center gap-1.5 transition-colors cursor-pointer shadow-lg shadow-blue-600/30"
                >
                  <RefreshCw className="w-4 h-4" />
                  <span>Coba Lagi</span>
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
