import React, { useState } from 'react';
import { BologhineLogo } from './BologhineLogo';
import { Language, AuthSession } from '../types';
import { loginAdmin, loginCandidate } from '../utils/authUtils';
import { 
  Lock, 
  User, 
  Eye, 
  EyeOff, 
  ShieldCheck, 
  KeyRound, 
  Languages, 
  AlertCircle,
  Building2,
  Landmark,
  ArrowRight,
  CheckCircle2,
  Sparkles,
  Users,
  Shield,
  FileText
} from 'lucide-react';

interface AdminLoginViewProps {
  language: Language;
  onLanguageChange: (lang: Language) => void;
  onLoginSuccess: (session: AuthSession) => void;
}

export const AdminLoginView: React.FC<AdminLoginViewProps> = ({
  language,
  onLanguageChange,
  onLoginSuccess,
}) => {
  const isAr = language === 'ar';
  const [loginMode, setLoginMode] = useState<'admin' | 'candidate'>('admin');
  
  // Admin form state (confidential credentials - not prefilled)
  const [adminUsername, setAdminUsername] = useState('');
  const [adminPassword, setAdminPassword] = useState('');

  // Candidate form state
  const [candidateIdentifier, setCandidateIdentifier] = useState('');
  const [candidatePassword, setCandidatePassword] = useState('');

  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleAdminLogin = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setErrorMessage(null);
    setIsLoading(true);

    setTimeout(() => {
      const result = loginAdmin(adminUsername, adminPassword, rememberMe);
      setIsLoading(false);

      if (result.success && result.session) {
        onLoginSuccess(result.session);
      } else {
        // Fallback: check if they entered candidate credentials by accident
        const candResult = loginCandidate(adminUsername, adminPassword, rememberMe);
        if (candResult.success && candResult.session) {
          onLoginSuccess(candResult.session);
          return;
        }

        setErrorMessage(
          isAr
            ? (result.error || 'بيانات الدخول غير صحيحة. يرجى التحقق من اسم المستخدم وكلمة المرور.')
            : (result.error || 'Identifiants incorrects. Veuillez vérifier votre nom d\'utilisateur et mot de passe.')
        );
      }
    }, 200);
  };

  const handleCandidateLogin = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setErrorMessage(null);
    setIsLoading(true);

    setTimeout(() => {
      const result = loginCandidate(candidateIdentifier, candidatePassword, rememberMe);
      setIsLoading(false);

      if (result.success && result.session) {
        onLoginSuccess(result.session);
      } else {
        // Fallback: check if they entered admin credentials
        const admResult = loginAdmin(candidateIdentifier, candidatePassword, rememberMe);
        if (admResult.success && admResult.session) {
          onLoginSuccess(admResult.session);
          return;
        }

        setErrorMessage(
          isAr
            ? (result.error || 'لم يتم العثور على ملف المترشح أو كلمة المرور خاطئة. يرجى التأكد من المعطيات.')
            : (result.error || 'Dossier introuvable ou mot de passe erroné. Veuillez vérifier vos accès.')
        );
      }
    }, 200);
  };

  return (
    <div className={`min-h-screen bg-slate-900 text-slate-100 flex flex-col justify-between relative overflow-hidden font-sans selection:bg-emerald-600 selection:text-white ${isAr ? 'font-arabic' : ''}`}>
      {/* Background Decor - Algérie / FLN subtle green ambient glows */}
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-emerald-700/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-red-700/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-4xl h-96 bg-emerald-900/10 rounded-full blur-3xl pointer-events-none" />

      {/* Official Algerian National Ribbon */}
      <div className="h-1.5 w-full bg-gradient-to-r from-emerald-600 via-white to-red-600 shadow-xs relative z-20" />

      {/* Top Bar with Language Switcher */}
      <header className="relative z-10 max-w-6xl mx-auto w-full px-3.5 sm:px-6 py-3 sm:py-4 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping shrink-0" />
          <span className="text-xs font-bold tracking-wide uppercase text-emerald-400 truncate">
            <span className="hidden sm:inline">
              {isAr ? 'منصة المترشح لانتخابات المجالس الشعبية 2026 • قسمة بولوغين' : 'Portail des Candidatures • APC & APW 2026 Bologhine'}
            </span>
            <span className="sm:hidden">
              {isAr ? 'منصة المترشح • انتخابات 2026' : 'Portail Candidat • 2026'}
            </span>
          </span>
        </div>

        <button
          type="button"
          onClick={() => onLanguageChange(isAr ? 'fr' : 'ar')}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-700 bg-slate-800/80 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition-colors cursor-pointer shrink-0"
          title="Changer de langue / تغيير اللغة"
        >
          <Languages className="w-3.5 h-3.5 text-emerald-400" />
          <span>{isAr ? 'Français' : 'العربية'}</span>
        </button>
      </header>

      {/* Main Container Card */}
      <main className="relative z-10 flex-1 flex items-center justify-center p-3 sm:p-6">
        <div className="w-full max-w-md bg-slate-800/90 backdrop-blur-md rounded-2xl border border-slate-700/80 shadow-2xl p-5 sm:p-7 space-y-4 sm:space-y-5">
          
          {/* Official Emblem & Titles */}
          <div className="text-center space-y-2.5">
            <div className="flex justify-center">
              <div className="relative">
                <BologhineLogo size="lg" withBorder interactive className="shadow-xl ring-4 ring-emerald-500/20" />
                <div className={`absolute -bottom-1 -right-1 text-white rounded-full p-1 border-2 border-slate-800 transition-colors ${
                  loginMode === 'candidate' ? 'bg-amber-600' : 'bg-emerald-600'
                }`}>
                  {loginMode === 'candidate' ? (
                    <User className="w-4 h-4" />
                  ) : (
                    <ShieldCheck className="w-4 h-4" />
                  )}
                </div>
              </div>
            </div>

            <div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-950 text-emerald-400 border border-emerald-700/50 mb-1">
                <span>حزب جبهة التحرير الوطني • F.L.N</span>
              </div>
              <h1 className="text-lg sm:text-xl md:text-2xl font-black text-white tracking-tight leading-tight">
                {loginMode === 'candidate' ? (
                  isAr ? 'فضاء المترشح • التحقق والتصحيح' : 'Espace Candidat • Consultation & Rectification'
                ) : (
                  isAr ? 'لوحة إدارة انتخابات قسمة بولوغين' : 'Portail des Candidatures • Bologhine 2026'
                )}
              </h1>
              <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                {isAr 
                  ? 'قسمة بولوغين (ابن الزيري) • محافظة باب الوادي' 
                  : 'Kasma de Bologhine (Ibn Ziri) • Bab El Oued'}
              </p>
            </div>
          </div>

          {/* DUAL PORTAL SWITCHER TABS: ADMIN VS CANDIDATE */}
          <div className="grid grid-cols-2 p-1 bg-slate-900/90 rounded-xl border border-slate-700/70 text-xs font-bold">
            <button
              type="button"
              onClick={() => {
                setLoginMode('admin');
                setErrorMessage(null);
              }}
              className={`flex items-center justify-center gap-1.5 py-2 px-2.5 rounded-lg transition-all cursor-pointer ${
                loginMode === 'admin'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Shield className="w-3.5 h-3.5" />
              <span>{isAr ? 'فضاء الإدارة' : 'Espace Admin'}</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setLoginMode('candidate');
                setErrorMessage(null);
              }}
              className={`flex items-center justify-center gap-1.5 py-2 px-2.5 rounded-lg transition-all cursor-pointer ${
                loginMode === 'candidate'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <User className="w-3.5 h-3.5" />
              <span>{isAr ? 'فضاء المترشح' : 'Espace Candidat'}</span>
            </button>
          </div>

          {/* Error Banner */}
          {errorMessage && (
            <div className="p-3 bg-rose-950/80 border border-rose-700 text-rose-200 rounded-xl text-xs flex items-start gap-2.5 animate-in fade-in slide-in-from-top-1">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              <div className="flex-1">
                <strong className="font-bold block">{isAr ? 'تنبيه المصادقة :' : 'Erreur d\'accès :'}</strong>
                <span>{errorMessage}</span>
              </div>
            </div>
          )}

          {/* MODE 1: ADMIN LOGIN */}
          {loginMode === 'admin' ? (
            <div className="space-y-4">
              {/* Admin Form */}
              <form onSubmit={handleAdminLogin} className="space-y-3.5">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">
                    {isAr ? 'اسم المستخدم (Identifiant)' : 'Nom d\'utilisateur'} <span className="text-emerald-400">*</span>
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                      <User className="w-4 h-4" />
                    </div>
                    <input
                      type="text"
                      required
                      value={adminUsername}
                      onChange={e => setAdminUsername(e.target.value)}
                      placeholder={isAr ? 'اسم المستخدم' : 'Nom d\'utilisateur'}
                      className="w-full pl-9 pr-3 py-2 bg-slate-900/90 text-white rounded-xl border border-slate-700 focus:border-emerald-500 text-xs font-medium"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">
                    {isAr ? 'كلمة المرور' : 'Mot de passe'} <span className="text-emerald-400">*</span>
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                      <Lock className="w-4 h-4" />
                    </div>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={adminPassword}
                      onChange={e => setAdminPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full pl-9 pr-9 py-2 bg-slate-900/90 text-white rounded-xl border border-slate-700 focus:border-emerald-500 text-xs font-medium"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-200 cursor-pointer"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs pt-1">
                  <label className="flex items-center gap-2 cursor-pointer select-none text-slate-300">
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={e => setRememberMe(e.target.checked)}
                      className="rounded border-slate-700 text-emerald-600 focus:ring-emerald-500 bg-slate-900"
                    />
                    <span>{isAr ? 'تذكر الجلسة' : 'Mémoriser la session'}</span>
                  </label>
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer shadow-lg shadow-emerald-900/30"
                >
                  {isLoading ? (
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>
                      <span>{isAr ? 'دخول لوحة إدارة القسمة' : 'Accéder à la Gestion Kasma'}</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>
            </div>
          ) : (
            /* MODE 2: CANDIDATE LOGIN */
            <div className="space-y-4">
              {/* Notice for candidates */}
              <div className="p-3.5 bg-emerald-950/90 border border-emerald-700/70 rounded-xl text-xs space-y-1.5 shadow-xs">
                <div className="flex items-center gap-1.5 text-emerald-300 font-bold">
                  <Lock className="w-4 h-4 text-amber-300 shrink-0" />
                  <span className="text-sm font-bold">{isAr ? 'فضاء خاص بالمترشحين فقط' : 'Espace Sécurisé pour Candidats'}</span>
                </div>
                <p className="text-[11px] text-slate-300 leading-relaxed">
                  {isAr 
                    ? 'تسجيل دخول سري للمترشحين لمعاينة الملف الإداري وتصحيح البيانات. (معرف الدخول: اللقب، رقم الهاتف، أو رقم التعريف الوطني NIN).'
                    : 'Accès sécurisé et individuel pour chaque candidat. Identifiez-vous avec votre Nom, Téléphone ou NIN.'}
                </p>
              </div>

              {/* Candidate Form */}
              <form onSubmit={handleCandidateLogin} className="space-y-3.5 pt-1">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">
                    {isAr ? 'معرف المترشح (اللقب، الهاتف أو NIN)' : 'Identifiant (Nom, Téléphone ou NIN)'} <span className="text-emerald-400">*</span>
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                      <User className="w-4 h-4" />
                    </div>
                    <input
                      type="text"
                      required
                      value={candidateIdentifier}
                      onChange={e => setCandidateIdentifier(e.target.value)}
                      placeholder="Ex: belkacemi ou 0550123456"
                      className="w-full pl-9 pr-3 py-2 bg-slate-900/90 text-white rounded-xl border border-slate-700 focus:border-emerald-500 text-xs font-medium"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">
                    {isAr ? 'كلمة المرور' : 'Mot de passe candidat'} <span className="text-emerald-400">*</span>
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                      <Lock className="w-4 h-4" />
                    </div>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={candidatePassword}
                      onChange={e => setCandidatePassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full pl-9 pr-9 py-2 bg-slate-900/90 text-white rounded-xl border border-slate-700 focus:border-emerald-500 text-xs font-medium"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-200 cursor-pointer"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer shadow-lg shadow-emerald-900/30"
                >
                  {isLoading ? (
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>
                      <span>{isAr ? 'معاينة وتصحيح ملف المترشح' : 'Accéder à mon Dossier'}</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>
            </div>
          )}

          {/* Footer Info inside card */}
          <div className="pt-2 border-t border-slate-700/60 text-center text-[11px] text-slate-400">
            <span>{isAr ? 'النظام الرقمي لقسمة بولوغين 2026' : 'Système Électoral Numérique FLN Bologhine 2026'}</span>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 max-w-6xl mx-auto w-full px-4 py-3 text-center text-xs text-slate-500">
        <p>
          {isAr
            ? 'الجمهورية الجزائرية الديمقراطية الشعبية • جبهة التحرير الوطني • قسمة بولوغين'
            : 'République Algérienne Démocratique et Populaire • Front de Libération Nationale'}
        </p>
      </footer>
    </div>
  );
};
