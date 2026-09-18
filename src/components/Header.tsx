import React, { useState } from 'react';
import { CouncilType } from '../types';
import { Language, TRANSLATIONS } from '../data/translations';
import { BologhineLogo } from './BologhineLogo';
import { 
  Building2, 
  Landmark, 
  Plus, 
  FileSpreadsheet, 
  Printer, 
  Languages, 
  RotateCcw,
  CheckCircle2,
  Clock,
  AlertTriangle,
  ListOrdered,
  ShieldCheck,
  Camera,
  Sparkles,
  MoreVertical,
  X,
  LogOut,
  User,
  Shield,
  KeyRound,
  Database,
  Github
} from 'lucide-react';
import { AdminUser } from '../types';

interface HeaderProps {
  currentCouncil: CouncilType | 'ALL';
  onCouncilChange: (council: CouncilType | 'ALL') => void;
  language: Language;
  onLanguageChange: (lang: Language) => void;
  onOpenAddModal: () => void;
  onOpenNumberingManager: () => void;
  onOpenAiScanner?: () => void;
  onOpenDatabaseManager?: () => void;
  onExportCSV: () => void;
  onPrintList: () => void;
  onResetData: () => void;
  adminUser?: AdminUser | null;
  onOpenAdminProfile?: () => void;
  onLogout?: () => void;
  apcCount: number;
  apwCount: number;
  completeCount: number;
  totalCount: number;
}

export const Header: React.FC<HeaderProps> = ({
  currentCouncil,
  onCouncilChange,
  language,
  onLanguageChange,
  onOpenAddModal,
  onOpenNumberingManager,
  onOpenAiScanner,
  onOpenDatabaseManager,
  onExportCSV,
  onPrintList,
  onResetData,
  adminUser,
  onOpenAdminProfile,
  onLogout,
  apcCount,
  apwCount,
  completeCount,
  totalCount,
}) => {
  const t = TRANSLATIONS[language];
  const isAr = language === 'ar';
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="bg-white border-b border-slate-200 shadow-sm sticky top-0 z-30">
      {/* Algerian FLN Party National Ribbon */}
      <div className="h-1.5 w-full bg-gradient-to-r from-emerald-700 via-emerald-600 via-white to-red-600" />

      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-2.5 sm:py-3.5">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 sm:gap-4">
          
          {/* Party Insignia & Kasma Title */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5 sm:gap-3.5 min-w-0">
              {/* Bologhine FLN Official Emblem Logo */}
              <BologhineLogo size="md" withBorder interactive className="shadow-md ring-2 ring-emerald-600/30 sm:w-14 sm:h-14" />

              <div className="min-w-0">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] sm:text-xs font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                    حزب جبهة التحرير الوطني
                  </span>
                  <span className="text-[10px] sm:text-xs text-slate-500 font-medium hidden xs:inline">
                    {t.mouhafadha}
                  </span>
                  <span className="text-[10px] sm:text-xs font-semibold text-emerald-900 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200">
                    {t.kasma}
                  </span>
                </div>
                <h1 className="text-sm sm:text-lg lg:text-xl font-bold text-slate-900 leading-tight truncate mt-0.5">
                  {isAr ? 'منصة المترشح لانتخابات المجالس الشعبية البلدية والولائية 2026 لبلدية بولوغين' : 'Portail des Candidatures • APC & APW 2026 Bologhine'}
                </h1>
                <p className="text-[11px] sm:text-xs text-slate-500 truncate">
                  {isAr ? 'المجلس البلدي بولوغين (APC) • المجلس الولائي (APW)' : 'APC Bologhine • APW Alger (Bab El Oued)'}
                </p>
              </div>
            </div>

            {/* Mobile-Only Top Action Controls */}
            <div className="flex items-center gap-1.5 md:hidden shrink-0">
              <button
                onClick={() => onLanguageChange(isAr ? 'fr' : 'ar')}
                className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold rounded-lg border border-slate-300 text-slate-700 bg-slate-50 active:bg-slate-100"
                title="Changer de langue / تغيير اللغة"
              >
                <Languages className="w-3.5 h-3.5 text-emerald-700" />
                <span>{isAr ? 'FR' : 'عربي'}</span>
              </button>

              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="p-1.5 rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-100 active:bg-slate-200"
                title="Options et actions supplémentaires"
                aria-label="Menu des options"
              >
                {mobileMenuOpen ? <X className="w-5 h-5 text-rose-600" /> : <MoreVertical className="w-5 h-5" />}
              </button>
            </div>
          </div>

          {/* Desktop-Only Action Tools & Language Switcher */}
          <div className="hidden md:flex items-center flex-wrap gap-2 justify-end">
            {/* Quick Language Toggle */}
            <button
              onClick={() => onLanguageChange(isAr ? 'fr' : 'ar')}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-100 transition-colors"
              title="Changer la langue / تغيير اللغة"
            >
              <Languages className="w-3.5 h-3.5 text-emerald-700" />
              <span>{isAr ? 'Français' : 'العربية'}</span>
            </button>

            {/* Admin Numbering & Order Management */}
            <button
              onClick={onOpenNumberingManager}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 transition-colors shadow-2xs cursor-pointer"
              title="Gérer la numérotation officielle des candidats (Réservé à l'administrateur)"
            >
              <ShieldCheck className="w-3.5 h-3.5 text-amber-700" />
              <span>{isAr ? 'ترتيب القائمة (الإدارة)' : 'Numérotation (Admin)'}</span>
            </button>

            {/* AI Document Scanner Assistant */}
            {onOpenAiScanner && (
              <button
                onClick={onOpenAiScanner}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-900 border border-emerald-300 transition-colors shadow-2xs cursor-pointer"
                title="Scanner ou photographier les documents administratifs (Extraction automatique IA)"
              >
                <Camera className="w-3.5 h-3.5 text-emerald-700" />
                <span>{isAr ? 'مسح بالهاتف / تصوير (IA)' : 'Scanner / Photo (IA)'}</span>
              </button>
            )}

            {/* Database Manager & GitHub Sync */}
            {onOpenDatabaseManager && (
              <button
                onClick={onOpenDatabaseManager}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg bg-slate-900 hover:bg-slate-800 text-white border border-slate-700 shadow-2xs transition-all active:scale-95 cursor-pointer"
                title={isAr ? 'قاعدة البيانات والمزامنة مع GitHub (استيراد وتصدير)' : 'Base de données & Synchronisation GitHub (Import/Export)'}
              >
                <Database className="w-3.5 h-3.5 text-emerald-400" />
                <span className="hidden sm:inline">{isAr ? 'قاعدة البيانات / GitHub' : 'Base de Données / GitHub'}</span>
                <span className="sm:hidden">{isAr ? 'قاعدة البيانات' : 'Base'}</span>
              </button>
            )}

            {/* Print Official Candidate List */}
            <button
              onClick={onPrintList}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-100 transition-colors"
              title={t.printList}
            >
              <Printer className="w-3.5 h-3.5 text-slate-600" />
              <span className="hidden sm:inline">{t.printList}</span>
            </button>

            {/* Export CSV / Excel */}
            <button
              onClick={onExportCSV}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-100 transition-colors"
              title={t.exportExcel}
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
              <span className="hidden sm:inline">{t.exportExcel}</span>
            </button>

            {/* Reset to Demo Data */}
            <button
              onClick={onResetData}
              className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
              title={t.resetDemoData}
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>

            {/* Add Candidate Button */}
            <button
              onClick={onOpenAddModal}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white shadow-sm transition-colors cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>{t.addCandidate}</span>
            </button>

            {/* Admin User Session Pill & Logout */}
            {adminUser && (
              <div className="flex items-center gap-1.5 pl-2 ml-1 border-l border-slate-200">
                <button
                  type="button"
                  onClick={onOpenAdminProfile}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-lg bg-emerald-50 hover:bg-emerald-100/80 text-emerald-900 border border-emerald-300 transition-colors shadow-2xs cursor-pointer"
                  title={isAr ? `المشرف: ${adminUser.fullNameAr || adminUser.fullName} (انقر للإعدادات)` : `Session active : ${adminUser.fullName} (Cliquer pour gérer)`}
                >
                  <div className="relative">
                    <div className="w-5 h-5 rounded-full bg-emerald-700 text-white flex items-center justify-center text-[10px] font-bold">
                      {adminUser.username[0]?.toUpperCase()}
                    </div>
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 absolute -bottom-0.5 -right-0.5 ring-1 ring-white" />
                  </div>
                  <span className="font-mono text-emerald-900 text-[11px] max-w-[100px] truncate">
                    {adminUser.username}
                  </span>
                  <span className="text-[9px] bg-emerald-700 text-white px-1 py-0.2 rounded font-black tracking-wide">
                    ADMIN
                  </span>
                </button>

                {onLogout && (
                  <button
                    type="button"
                    onClick={onLogout}
                    className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                    title={isAr ? 'تسجيل الخروج (Déconnexion)' : 'Déconnexion de l\'interface Admin'}
                  >
                    <LogOut className="w-4 h-4" />
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Mobile Dropdown Menu for Secondary Actions */}
        {mobileMenuOpen && (
          <div className="md:hidden mt-2.5 p-3 bg-slate-50 rounded-xl border border-slate-200 shadow-sm space-y-2 animate-in fade-in slide-in-from-top-2 duration-150">
            {/* Mobile Admin Card */}
            {adminUser && (
              <div className="p-2.5 bg-emerald-900 text-white rounded-lg flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-emerald-700 text-white flex items-center justify-center text-xs font-bold ring-1 ring-emerald-400">
                    {adminUser.username[0]?.toUpperCase()}
                  </div>
                  <div>
                    <div className="text-xs font-bold truncate max-w-[170px]">
                      {isAr ? adminUser.fullNameAr || adminUser.fullName : adminUser.fullName}
                    </div>
                    <div className="text-[10px] text-emerald-300 font-mono">
                      @{adminUser.username} • Admin Kasma
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    type="button"
                    onClick={() => {
                      setMobileMenuOpen(false);
                      onOpenAdminProfile?.();
                    }}
                    className="inline-flex items-center gap-1 px-2.5 py-1.5 text-[11px] font-bold bg-emerald-800 hover:bg-emerald-700 rounded-lg border border-emerald-600 text-emerald-100 cursor-pointer shadow-2xs"
                  >
                    <KeyRound className="w-3 h-3 text-amber-300" />
                    <span>{isAr ? 'أمان الحساب' : 'Sécurité'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setMobileMenuOpen(false);
                      onLogout?.();
                    }}
                    className="inline-flex items-center gap-1 px-2 py-1.5 text-[11px] font-bold text-rose-200 bg-rose-950 hover:bg-rose-900 rounded-lg border border-rose-800 cursor-pointer shadow-2xs"
                    title={isAr ? 'تسجيل الخروج' : 'Déconnexion'}
                  >
                    <LogOut className="w-3.5 h-3.5 text-rose-300" />
                    <span className="hidden xs:inline">{isAr ? 'خروج' : 'Sortir'}</span>
                  </button>
                </div>
              </div>
            )}

            <div className="grid grid-cols-2 gap-2 text-xs">
              {onOpenDatabaseManager && (
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    onOpenDatabaseManager();
                  }}
                  className="flex items-center gap-2 p-2.5 rounded-lg bg-slate-900 text-white font-bold active:bg-slate-800 col-span-2 shadow-xs"
                >
                  <Database className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span className="truncate">{isAr ? 'قاعدة البيانات ورفع إلى GitHub' : 'Base de Données & Export GitHub'}</span>
                </button>
              )}

              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  onExportCSV();
                }}
                className="flex items-center gap-2 p-2.5 rounded-lg bg-white border border-slate-200 text-slate-700 font-medium active:bg-slate-100"
              >
                <FileSpreadsheet className="w-4 h-4 text-emerald-600 shrink-0" />
                <span className="truncate">{t.exportExcel}</span>
              </button>

              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  onPrintList();
                }}
                className="flex items-center gap-2 p-2.5 rounded-lg bg-white border border-slate-200 text-slate-700 font-medium active:bg-slate-100"
              >
                <Printer className="w-4 h-4 text-blue-600 shrink-0" />
                <span className="truncate">{t.printList}</span>
              </button>

              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  onOpenNumberingManager();
                }}
                className="flex items-center gap-2 p-2.5 rounded-lg bg-amber-50 border border-amber-300 text-amber-900 font-semibold active:bg-amber-100 col-span-2"
              >
                <ShieldCheck className="w-4 h-4 text-amber-700 shrink-0" />
                <span>{isAr ? 'ترتيب وتصنيف القائمة (لوحة الإدارة)' : 'Gestion du classement officiel (Admin)'}</span>
              </button>

              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  onResetData();
                }}
                className="flex items-center gap-2 p-2 rounded-lg bg-white border border-slate-200 text-slate-500 font-normal active:bg-slate-100 col-span-2 text-[11px]"
              >
                <RotateCcw className="w-3.5 h-3.5 shrink-0" />
                <span>{t.resetDemoData}</span>
              </button>
            </div>
          </div>
        )}

        {/* Council Switch Tabs (APC vs APW vs ALL) - Fully Mobile Responsive */}
        <div className="mt-2.5 sm:mt-3.5 pt-2.5 sm:pt-3 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div className="grid grid-cols-3 sm:flex items-center gap-1 sm:gap-1.5 bg-slate-100 p-1 rounded-xl w-full sm:w-fit">
            <button
              onClick={() => onCouncilChange('ALL')}
              className={`py-2 sm:py-1.5 px-2 sm:px-3 rounded-lg text-xs font-semibold transition-all text-center flex items-center justify-center gap-1 ${
                currentCouncil === 'ALL'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900 active:bg-slate-200'
              }`}
            >
              <span className="truncate">{t.allCouncils}</span>
              <span className="text-[10px] px-1 py-0.2 rounded bg-slate-200/80 font-bold">{totalCount}</span>
            </button>

            <button
              onClick={() => onCouncilChange('APC')}
              className={`py-2 sm:py-1.5 px-2 sm:px-3 rounded-lg text-xs font-semibold transition-all text-center flex items-center justify-center gap-1 ${
                currentCouncil === 'APC'
                  ? 'bg-emerald-700 text-white shadow-sm'
                  : 'text-slate-600 hover:text-emerald-800 active:bg-slate-200'
              }`}
            >
              <Building2 className="w-3.5 h-3.5 shrink-0 hidden xs:inline" />
              <span className="truncate">{t.apcTitle}</span>
              <span className={`px-1 py-0.2 rounded text-[10px] font-bold ${
                currentCouncil === 'APC' ? 'bg-emerald-800 text-emerald-100' : 'bg-slate-200 text-slate-700'
              }`}>
                {apcCount}
              </span>
            </button>

            <button
              onClick={() => onCouncilChange('APW')}
              className={`py-2 sm:py-1.5 px-2 sm:px-3 rounded-lg text-xs font-semibold transition-all text-center flex items-center justify-center gap-1 ${
                currentCouncil === 'APW'
                  ? 'bg-emerald-700 text-white shadow-sm'
                  : 'text-slate-600 hover:text-emerald-800 active:bg-slate-200'
              }`}
            >
              <Landmark className="w-3.5 h-3.5 shrink-0 hidden xs:inline" />
              <span className="truncate">{t.apwTitle}</span>
              <span className={`px-1 py-0.2 rounded text-[10px] font-bold ${
                currentCouncil === 'APW' ? 'bg-emerald-800 text-emerald-100' : 'bg-slate-200 text-slate-700'
              }`}>
                {apwCount}
              </span>
            </button>
          </div>

          {/* Quick Dossier Readiness Summary Pill */}
          <div className="flex items-center justify-between sm:justify-start gap-2 sm:gap-3 text-[11px] sm:text-xs text-slate-500 px-1">
            <span className="flex items-center gap-1 text-emerald-700 font-semibold">
              <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
              <span>{completeCount} / {totalCount} {isAr ? 'ملف جاهز 100%' : 'dossiers complets'}</span>
            </span>
            <span className="text-slate-300">|</span>
            <span className="text-slate-600 font-medium">
              {isAr ? '11 وثيقة إدارية' : '11 pièces par dossier'}
            </span>
          </div>
        </div>
      </div>
    </header>
  );
};
