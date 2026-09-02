import React from 'react';
import { User } from 'firebase/auth';
import {
  BookOpen,
  CalendarCheck,
  FileSpreadsheet,
  BarChart3,
  History,
  LogOut,
  Sparkles,
  ExternalLink,
  ShieldCheck,
} from 'lucide-react';
import { SheetConfig } from '../types';

interface HeaderProps {
  activeTab: 'attendance' | 'summary' | 'history' | 'sheets';
  setActiveTab: (tab: 'attendance' | 'summary' | 'history' | 'sheets') => void;
  user: User | null;
  sheetConfig: SheetConfig | null;
  onLogin: () => void;
  onLogout: () => void;
  onOpenSheetModal: () => void;
  isLoggingIn: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  user,
  sheetConfig,
  onLogin,
  onLogout,
  onOpenSheetModal,
  isLoggingIn,
}) => {
  const currentDate = new Date().toLocaleDateString('id-ID', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  return (
    <header className="bg-white/5 backdrop-blur-md border-b border-white/10 sticky top-0 z-30 shadow-2xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-20 gap-4">
          {/* Logo & Title */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-500 flex items-center justify-center text-white font-bold shadow-lg shadow-blue-500/30 ring-1 ring-white/20">
              <CalendarCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg sm:text-xl font-bold text-white tracking-tight">
                  Presensi<span className="text-blue-400">Guru</span>
                </h1>
                <span className="px-2 py-0.5 text-[11px] font-bold bg-blue-500/20 text-blue-300 border border-blue-400/30 rounded-full">
                  TJKT
                </span>
              </div>
              <p className="text-xs text-slate-400 font-medium hidden sm:block">
                {currentDate}
              </p>
            </div>
          </div>

          {/* Navigation Tabs */}
          <nav className="hidden md:flex items-center p-1 bg-white/5 backdrop-blur-md rounded-xl border border-white/10">
            <button
              id="tab-attendance-btn"
              onClick={() => setActiveTab('attendance')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                activeTab === 'attendance'
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30'
                  : 'text-slate-300 hover:text-white hover:bg-white/5'
              }`}
            >
              <BookOpen className="w-4 h-4" />
              <span>Presensi Kelas</span>
            </button>

            <button
              id="tab-summary-btn"
              onClick={() => setActiveTab('summary')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                activeTab === 'summary'
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30'
                  : 'text-slate-300 hover:text-white hover:bg-white/5'
              }`}
            >
              <BarChart3 className="w-4 h-4" />
              <span>Rekap Harian Guru</span>
              <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
            </button>

            <button
              id="tab-history-btn"
              onClick={() => setActiveTab('history')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                activeTab === 'history'
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30'
                  : 'text-slate-300 hover:text-white hover:bg-white/5'
              }`}
            >
              <History className="w-4 h-4" />
              <span>Riwayat Absensi</span>
            </button>

            <button
              id="tab-sheets-btn"
              onClick={onOpenSheetModal}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                activeTab === 'sheets'
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30'
                  : 'text-slate-300 hover:text-white hover:bg-white/5'
              }`}
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
              <span>Google Sheet</span>
              {sheetConfig && (
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
              )}
            </button>
          </nav>

          {/* User Auth & Actions */}
          <div className="flex items-center gap-3">
            {/* Sheet Status Indicator */}
            {sheetConfig ? (
              <button
                id="header-sheet-status-btn"
                onClick={onOpenSheetModal}
                title="Spreadsheet terhubung"
                className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/40 text-emerald-300 rounded-xl text-xs font-medium transition-colors cursor-pointer backdrop-blur-md"
              >
                <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
                <span className="max-w-[120px] truncate">{sheetConfig.spreadsheetTitle}</span>
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              </button>
            ) : (
              <button
                id="header-connect-sheet-btn"
                onClick={onOpenSheetModal}
                className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-amber-300 rounded-xl text-xs font-medium transition-colors cursor-pointer backdrop-blur-md"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                <span>Hubungkan Sheet</span>
              </button>
            )}

            {/* Google Auth Button */}
            {user ? (
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-2 pl-2 pr-3 py-1 bg-white/10 rounded-full border border-white/15 backdrop-blur-md">
                  {user.photoURL ? (
                    <img
                      src={user.photoURL}
                      alt={user.displayName || 'Guru'}
                      className="w-7 h-7 rounded-full object-cover ring-1 ring-white/30"
                    />
                  ) : (
                    <div className="w-7 h-7 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs font-bold ring-1 ring-white/30">
                      {(user.displayName || user.email || 'G').charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div className="text-left hidden sm:block">
                    <p className="text-xs font-semibold text-white leading-tight max-w-[120px] truncate">
                      {user.displayName || user.email?.split('@')[0]}
                    </p>
                    <p className="text-[10px] text-emerald-400 leading-none flex items-center gap-1">
                      <ShieldCheck className="w-2.5 h-2.5 text-emerald-400" />
                      Google Terhubung
                    </p>
                  </div>
                </div>

                <button
                  id="logout-button"
                  onClick={onLogout}
                  title="Keluar Google"
                  className="p-2 text-slate-400 hover:text-rose-400 hover:bg-rose-500/20 rounded-xl transition-colors cursor-pointer border border-transparent hover:border-rose-500/30"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <button
                id="google-signin-btn"
                onClick={onLogin}
                disabled={isLoggingIn}
                className="flex items-center gap-2 px-3.5 py-2 bg-white/10 hover:bg-white/15 border border-white/20 hover:border-white/30 rounded-xl shadow-lg shadow-black/20 text-xs font-semibold text-white transition-all cursor-pointer disabled:opacity-50 backdrop-blur-md"
              >
                <svg className="w-4 h-4" viewBox="0 0 48 48">
                  <path
                    fill="#EA4335"
                    d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"
                  />
                  <path
                    fill="#4285F4"
                    d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"
                  />
                  <path
                    fill="#34A853"
                    d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"
                  />
                </svg>
                <span className="hidden sm:inline">
                  {isLoggingIn ? 'Menghubungkan...' : 'Login Google Drive & Sheet'}
                </span>
                <span className="sm:hidden">Login</span>
              </button>
            )}
          </div>
        </div>

        {/* Mobile Navigation Tabs */}
        <div className="flex md:hidden border-t border-white/10 py-2 overflow-x-auto gap-1">
          <button
            onClick={() => setActiveTab('attendance')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
              activeTab === 'attendance'
                ? 'bg-blue-600 text-white'
                : 'text-slate-300 hover:text-white'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>Presensi</span>
          </button>
          <button
            onClick={() => setActiveTab('summary')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
              activeTab === 'summary'
                ? 'bg-blue-600 text-white'
                : 'text-slate-300 hover:text-white'
            }`}
          >
            <BarChart3 className="w-3.5 h-3.5" />
            <span>Rekap Harian</span>
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
              activeTab === 'history'
                ? 'bg-blue-600 text-white'
                : 'text-slate-300 hover:text-white'
            }`}
          >
            <History className="w-3.5 h-3.5" />
            <span>Riwayat</span>
          </button>
          <button
            onClick={onOpenSheetModal}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
              activeTab === 'sheets'
                ? 'bg-emerald-600 text-white'
                : 'text-slate-300 hover:text-white'
            }`}
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
            <span>Spreadsheet</span>
          </button>
        </div>
      </div>
    </header>
  );
};
