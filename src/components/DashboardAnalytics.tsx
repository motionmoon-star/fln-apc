import React from 'react';
import { 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  ReferenceLine, 
  Cell, 
  CartesianGrid 
} from 'recharts';
import { Candidate, CampaignStats } from '../types';
import { Language, TRANSLATIONS } from '../data/translations';
import { 
  Users, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  GraduationCap, 
  Sparkles, 
  ShieldAlert, 
  FileCheck, 
  ChevronRight,
  MapPin,
  TrendingUp,
  BarChart3
} from 'lucide-react';
import { ADMINISTRATIVE_DOCUMENTS } from '../data/documentsList';
import { getDossierCompliance } from '../utils/candidateUtils';

interface DashboardAnalyticsProps {
  stats: CampaignStats;
  candidates: Candidate[];
  language: Language;
  onSelectCandidate: (candidate: Candidate) => void;
}

export const DashboardAnalytics: React.FC<DashboardAnalyticsProps> = ({
  stats,
  candidates,
  language,
  onSelectCandidate,
}) => {
  const t = TRANSLATIONS[language];
  const isAr = language === 'ar';

  // Specific calculations for APC and APW completed dossiers vs total candidates
  const apcCandidates = candidates.filter(c => c.council === 'APC');
  const apcTotal = apcCandidates.length;
  const apcCompleted = apcCandidates.filter(c => {
    const comp = getDossierCompliance(c);
    return comp.isComplete || c.dossierStatus === 'complet';
  }).length;
  const apcPercentage = apcTotal > 0 ? Math.round((apcCompleted / apcTotal) * 100) : 0;
  const apcPending = Math.max(0, apcTotal - apcCompleted);

  const apwCandidates = candidates.filter(c => c.council === 'APW');
  const apwTotal = apwCandidates.length;
  const apwCompleted = apwCandidates.filter(c => {
    const comp = getDossierCompliance(c);
    return comp.isComplete || c.dossierStatus === 'complet';
  }).length;
  const apwPercentage = apwTotal > 0 ? Math.round((apwCompleted / apwTotal) * 100) : 0;
  const apwPending = Math.max(0, apwTotal - apwCompleted);

  // Data formatted specifically for Recharts BarChart progress visualization
  const rechartsProgressData = [
    {
      councilKey: 'APC',
      name: isAr ? 'قائمة البلدية (APC)' : 'Liste APC Bologhine',
      shortName: 'APC Bologhine',
      percentage: apcPercentage,
      completed: apcCompleted,
      total: apcTotal,
      pending: apcPending,
      color: '#059669', // Emerald 600
    },
    {
      councilKey: 'APW',
      name: isAr ? 'قائمة الولاية (APW)' : 'Liste APW Alger',
      shortName: 'APW Alger',
      percentage: apwPercentage,
      completed: apwCompleted,
      total: apwTotal,
      pending: apwPending,
      color: '#2563eb', // Blue 600
    },
  ];

  // Custom high-contrast accessible Tooltip for Recharts
  const CustomRechartsTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-slate-900/95 backdrop-blur-sm text-white p-3 rounded-xl shadow-xl text-xs border border-slate-700 min-w-[210px] z-50">
          <div className="flex items-center justify-between gap-2 pb-1.5 mb-1.5 border-b border-slate-800">
            <span className="font-bold text-sm text-white">{data.shortName}</span>
            <span 
              className="px-2 py-0.5 rounded text-[11px] font-extrabold text-white"
              style={{ backgroundColor: data.color }}
            >
              {data.percentage}%
            </span>
          </div>
          <div className="space-y-1 text-slate-300">
            <div className="flex items-center justify-between">
              <span>{isAr ? 'الملفات المكتملة 100%:' : 'Dossiers complets 100% :'}</span>
              <span className="font-bold text-emerald-400">{data.completed} / {data.total}</span>
            </div>
            <div className="flex items-center justify-between">
              <span>{isAr ? 'الملفات قيد الاستكمال:' : 'Dossiers en attente :'}</span>
              <span className="font-medium text-amber-300">{data.pending}</span>
            </div>
            <div className="flex items-center justify-between">
              <span>{isAr ? 'الهدف المطلوب:' : 'Objectif ANIE :'}</span>
              <span className="font-bold text-slate-400">100%</span>
            </div>
          </div>
        </div>
      );
    }
    return null;
  };

  // Identify candidates with critical missing documents (rejection risks)
  const criticalRiskCandidates = candidates.filter(c => {
    const comp = getDossierCompliance(c);
    if (comp.isComplete) return false;
    // Check if missing critical items: B3, tax_clearance, military_status, nationality_certificate
    const docs = c.documents || {};
    return (
      docs.police_record?.status !== 'conforme' ||
      docs.tax_clearance?.status !== 'conforme' ||
      (c.gender === 'H' && docs.military_status?.status !== 'conforme') ||
      docs.nationality_certificate?.status !== 'conforme'
    );
  });

  // Neighborhood representation stats in Bologhine
  const neighborhoodCounts: Record<string, number> = {};
  for (const c of candidates) {
    const n = c.addressNeighborhood || 'Bologhine';
    neighborhoodCounts[n] = (neighborhoodCounts[n] || 0) + 1;
  }

  return (
    <div className="space-y-4">
      {/* Top 4 Metric KPI Cards - 2 cols on mobile, 4 cols on desktop */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3.5">
        
        {/* Metric 1: Dossiers Complets 100% */}
        <div className="bg-white rounded-xl p-3 sm:p-4 border border-slate-200 shadow-xs hover:border-emerald-300 transition-colors flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between gap-1">
              <span className="text-[11px] sm:text-xs font-semibold text-slate-500 uppercase tracking-wider truncate">
                {t.dossiersComplete}
              </span>
              <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0">
                <FileCheck className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              </div>
            </div>
            <div className="mt-2 sm:mt-2.5 flex items-baseline gap-1.5 flex-wrap">
              <span className="text-xl sm:text-2xl font-bold text-slate-900">
                {stats.completedDossiers}
              </span>
              <span className="text-[11px] sm:text-xs text-slate-500 font-medium">
                / {stats.totalCandidates} ({stats.totalCandidates > 0 ? Math.round((stats.completedDossiers / stats.totalCandidates) * 100) : 0}%)
              </span>
            </div>
          </div>
          <div className="mt-2.5">
            {/* Progress bar */}
            <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
              <div 
                className="bg-emerald-600 h-full rounded-full transition-all duration-500"
                style={{ width: `${stats.totalCandidates > 0 ? (stats.completedDossiers / stats.totalCandidates) * 100 : 0}%` }}
              />
            </div>
            <div className="mt-1.5 flex items-center justify-between text-[10px] sm:text-[11px] text-slate-500">
              <span>{stats.pendingDossiers} {isAr ? 'قيد المعالجة' : 'en cours'}</span>
              <span>{stats.incompleteDossiers} {isAr ? 'ناقص' : 'incomplets'}</span>
            </div>
          </div>
        </div>

        {/* Metric 2: Représentation Féminine (Parité légale) */}
        <div className="bg-white rounded-xl p-3 sm:p-4 border border-slate-200 shadow-xs hover:border-rose-300 transition-colors flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between gap-1">
              <span className="text-[11px] sm:text-xs font-semibold text-slate-500 uppercase tracking-wider truncate">
                {t.electoralParity}
              </span>
              <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center shrink-0">
                <Users className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              </div>
            </div>
            <div className="mt-2 sm:mt-2.5 flex items-baseline gap-1.5 flex-wrap">
              <span className="text-xl sm:text-2xl font-bold text-slate-900">
                {stats.womenPercentage}%
              </span>
              <span className="text-[11px] sm:text-xs text-slate-500 font-medium">
                ({stats.womenCount} {isAr ? 'مرشحة' : 'femmes'})
              </span>
            </div>
          </div>
          <div className="mt-2.5">
            <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
              <div 
                className="bg-rose-500 h-full rounded-full transition-all duration-500"
                style={{ width: `${Math.min(100, stats.womenPercentage)}%` }}
              />
            </div>
            <div className="mt-1.5 flex items-center justify-between text-[10px] sm:text-[11px]">
              <span className="text-slate-500">{isAr ? 'القانون:' : 'Cible:'} ≥ 30%</span>
              <span className={`font-semibold ${stats.womenPercentage >= 30 ? 'text-emerald-600' : 'text-amber-600'}`}>
                {stats.womenPercentage >= 30 ? (isAr ? 'مستوفى' : 'Conforme') : (isAr ? 'ناقص' : 'À renforcer')}
              </span>
            </div>
          </div>
        </div>

        {/* Metric 3: Quota Jeunes (< 35 ans) */}
        <div className="bg-white rounded-xl p-3 sm:p-4 border border-slate-200 shadow-xs hover:border-amber-300 transition-colors flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between gap-1">
              <span className="text-[11px] sm:text-xs font-semibold text-slate-500 uppercase tracking-wider truncate">
                {t.youthRatio}
              </span>
              <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
                <Sparkles className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              </div>
            </div>
            <div className="mt-2 sm:mt-2.5 flex items-baseline gap-1.5 flex-wrap">
              <span className="text-xl sm:text-2xl font-bold text-slate-900">
                {stats.youthUnder35Percentage}%
              </span>
              <span className="text-[11px] sm:text-xs text-slate-500 font-medium">
                ({stats.youthUnder35Count} {isAr ? 'شاب' : '< 35 ans'})
              </span>
            </div>
          </div>
          <div className="mt-2.5">
            <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
              <div 
                className="bg-amber-500 h-full rounded-full transition-all duration-500"
                style={{ width: `${Math.min(100, stats.youthUnder35Percentage)}%` }}
              />
            </div>
            <div className="mt-1.5 flex items-center justify-between text-[10px] sm:text-[11px]">
              <span className="text-slate-500">{isAr ? 'القانون:' : 'Seuil:'} ≥ 30%</span>
              <span className={`font-semibold ${stats.youthUnder35Percentage >= 30 ? 'text-emerald-600' : 'text-amber-600'}`}>
                {stats.youthUnder35Percentage >= 30 ? (isAr ? 'ممتاز' : 'Atteint') : (isAr ? 'ناقص' : 'En cours')}
              </span>
            </div>
          </div>
        </div>

        {/* Metric 4: Diplômés Universitaires */}
        <div className="bg-white rounded-xl p-3 sm:p-4 border border-slate-200 shadow-xs hover:border-blue-300 transition-colors flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between gap-1">
              <span className="text-[11px] sm:text-xs font-semibold text-slate-500 uppercase tracking-wider truncate">
                {t.degreeRatio}
              </span>
              <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                <GraduationCap className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              </div>
            </div>
            <div className="mt-2 sm:mt-2.5 flex items-baseline gap-1.5 flex-wrap">
              <span className="text-xl sm:text-2xl font-bold text-slate-900">
                {stats.universityGraduatesPercentage}%
              </span>
              <span className="text-[11px] sm:text-xs text-slate-500 font-medium truncate">
                ({stats.universityGraduatesCount} {isAr ? 'جامعي' : 'diplômés'})
              </span>
            </div>
          </div>
          <div className="mt-2.5">
            <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
              <div 
                className="bg-blue-600 h-full rounded-full transition-all duration-500"
                style={{ width: `${Math.min(100, stats.universityGraduatesPercentage)}%` }}
              />
            </div>
            <div className="mt-1.5 flex items-center justify-between text-[10px] sm:text-[11px]">
              <span className="text-slate-500">{isAr ? 'المطلب:' : 'Cible:'} ≥ 50%</span>
              <span className={`font-semibold ${stats.universityGraduatesPercentage >= 50 ? 'text-emerald-600' : 'text-blue-600'}`}>
                {stats.universityGraduatesPercentage >= 50 ? (isAr ? 'قوي' : 'Atteint') : (isAr ? 'مقبول' : 'Correct')}
              </span>
            </div>
          </div>
        </div>

      </div>

      {/* RECHARTS VISUAL PROGRESS BAR: Completed Dossiers vs Total Candidates for APC & APW */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 mb-3.5">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
              <h3 className="text-sm sm:text-base font-bold text-slate-900 font-arabic flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-emerald-700" />
                <span>
                  {isAr 
                    ? 'نسبة اكتمال الملفات مقابل إجمالي المترشحين (قائمتي APC و APW)' 
                    : 'Barre de Progression de Complétude des Dossiers (Listes APC & APW)'}
                </span>
              </h3>
            </div>
            <p className="text-xs text-slate-500 font-arabic mt-0.5">
              {isAr
                ? 'رسم بياني تفاعلي باستخدام Recharts يوضح نسبة اكتمال ملفات المترشحين القانونية 100% لكل قائمة'
                : 'Visualisation graphique Recharts : Pourcentage de dossiers finalisés (11/11 pièces conformes) par rapport au total des candidats inscrits'}
            </p>
          </div>

          <div className="flex items-center gap-3 text-xs shrink-0 flex-wrap">
            <div className="flex items-center gap-1.5 px-2.5 py-1 bg-emerald-50 border border-emerald-200 rounded-lg">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-600 inline-block" />
              <span className="font-bold text-emerald-900">APC Bologhine ({apcCompleted}/{apcTotal})</span>
            </div>
            <div className="flex items-center gap-1.5 px-2.5 py-1 bg-blue-50 border border-blue-200 rounded-lg">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-600 inline-block" />
              <span className="font-bold text-blue-900">APW Alger ({apwCompleted}/{apwTotal})</span>
            </div>
          </div>
        </div>

        {/* Recharts Horizontal Bar Chart Layout */}
        <div className="w-full h-44 sm:h-48 pt-1">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={rechartsProgressData}
              layout="vertical"
              margin={{ top: 10, right: 35, left: 10, bottom: 5 }}
              barCategoryGap="28%"
            >
              <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
              <XAxis 
                type="number" 
                domain={[0, 100]} 
                unit="%" 
                ticks={[0, 25, 50, 75, 100]}
                tick={{ fontSize: 11, fill: '#64748b' }} 
              />
              <YAxis 
                type="category" 
                dataKey="name" 
                width={140} 
                tick={{ fontSize: 12, fill: '#1e293b', fontWeight: 600 }} 
              />
              <Tooltip content={<CustomRechartsTooltip />} />
              <ReferenceLine 
                x={100} 
                stroke="#10b981" 
                strokeDasharray="4 4" 
                label={{ 
                  value: isAr ? 'الهدف 100%' : 'Objectif 100%', 
                  position: 'top', 
                  fill: '#059669', 
                  fontSize: 10,
                  fontWeight: 700 
                }} 
              />
              <Bar 
                dataKey="percentage" 
                radius={[0, 8, 8, 0]} 
                name={isAr ? 'نسبة الاكتمال' : 'Taux de complétude'}
                isAnimationActive={true}
              >
                {rechartsProgressData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Side-by-side Progress Summary Panels */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-3.5 mt-2 border-t border-slate-100">
          {/* APC Status Card */}
          <div className="bg-emerald-50/70 border border-emerald-200/90 rounded-xl p-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-black text-xs shadow-xs">
                APC
              </div>
              <div>
                <div className="text-xs font-bold text-emerald-950 font-arabic">
                  {isAr ? 'المجلس الشعبي البلدي - بولوغين' : 'Liste APC Bologhine'}
                </div>
                <div className="text-[11px] text-emerald-800 font-arabic mt-0.5">
                  <span className="font-bold">{apcCompleted}</span> {isAr ? 'ملف مكتمل من إجمالي' : 'dossier(s) complet(s) sur'} <span className="font-bold">{apcTotal}</span> {isAr ? 'مترشح' : 'candidat(s)'}
                  {apcPending > 0 && (
                    <span className="text-amber-800 ms-1">
                      ({apcPending} {isAr ? 'في الانتظار' : 'en cours'})
                    </span>
                  )}
                </div>
              </div>
            </div>
            <div className="text-right">
              <span className="text-xl font-black text-emerald-700">{apcPercentage}%</span>
              <div className="text-[10px] text-emerald-800 font-bold uppercase tracking-wider">
                {apcPercentage === 100 ? (isAr ? 'مكتمل 100%' : '100% Validé') : (isAr ? 'قيد الإنجاز' : 'En cours')}
              </div>
            </div>
          </div>

          {/* APW Status Card */}
          <div className="bg-blue-50/70 border border-blue-200/90 rounded-xl p-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center font-black text-xs shadow-xs">
                APW
              </div>
              <div>
                <div className="text-xs font-bold text-blue-950 font-arabic">
                  {isAr ? 'المجلس الشعبي الولائي - الجزائر' : 'Liste APW Alger (Wilaya)'}
                </div>
                <div className="text-[11px] text-blue-800 font-arabic mt-0.5">
                  <span className="font-bold">{apwCompleted}</span> {isAr ? 'ملف مكتمل من إجمالي' : 'dossier(s) complet(s) sur'} <span className="font-bold">{apwTotal}</span> {isAr ? 'مترشح' : 'candidat(s)'}
                  {apwPending > 0 && (
                    <span className="text-amber-800 ms-1">
                      ({apwPending} {isAr ? 'في الانتظار' : 'en cours'})
                    </span>
                  )}
                </div>
              </div>
            </div>
            <div className="text-right">
              <span className="text-xl font-black text-blue-700">{apwPercentage}%</span>
              <div className="text-[10px] text-blue-800 font-bold uppercase tracking-wider">
                {apwTotal === 0 ? (isAr ? 'لا يوجد مترشح' : 'Non démarré') : apwPercentage === 100 ? (isAr ? 'مكتمل 100%' : '100% Validé') : (isAr ? 'قيد الإنجاز' : 'En cours')}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Analysis & Vigilance Alert Bar */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3.5">
        
        {/* Rejection Prevention & Alert Box */}
        <div className="lg:col-span-2 bg-gradient-to-br from-amber-50/70 to-orange-50/50 border border-amber-200 rounded-xl p-4">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-lg bg-amber-500 text-white flex items-center justify-center flex-shrink-0 shadow-xs">
              <ShieldAlert className="w-4.5 h-4.5" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <h3 className="text-sm font-bold text-slate-900">
                  {isAr 
                    ? 'تنبيهات التدقيق والمطابقة لتفادي رفض الملفات لدى السلطة المستقلة (ANIE)' 
                    : 'Cellule de Vigilance ANIE & Risques de Non-Conformité'}
                </h3>
                <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold bg-amber-100 text-amber-800 border border-amber-300">
                  {criticalRiskCandidates.length} {isAr ? 'ملفات بحاجة لتسوية سريعة' : 'dossiers à régulariser'}
                </span>
              </div>
              <p className="mt-1 text-xs text-slate-600 leading-relaxed">
                {isAr
                  ? 'يرجى استيفاء شهادات الضرائب المصفاة (Extrait de rôle fiscal)، صحيفة السوابق العدلية B3 الحديثة، وتبرير الوضعية تجاه الخدمة الوطنية قبل انقضاء آجال الإيداع الرسمية.'
                  : 'Vérifiez impérativement la validité de l\'extrait de rôle (mention Apuré), le B3 judiciaire (< 3 mois), et la situation du service national pour éviter toute irrecevabilité légale.'}
              </p>

              {/* Actionable list of candidates with missing documents */}
              {criticalRiskCandidates.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-2">
                  {criticalRiskCandidates.slice(0, 5).map(c => (
                    <button
                      key={c.id}
                      onClick={() => onSelectCandidate(c)}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white/90 hover:bg-white text-xs font-medium text-slate-800 border border-amber-300/80 shadow-xs transition-colors cursor-pointer"
                    >
                      <AlertCircle className="w-3.5 h-3.5 text-amber-600" />
                      <span>{c.lastNameFr} {c.firstNameFr}</span>
                      <span className="text-[10px] text-amber-700 bg-amber-100 px-1 rounded">
                        {c.council} #{c.listRank}
                      </span>
                      <ChevronRight className="w-3 h-3 text-slate-400" />
                    </button>
                  ))}
                  {criticalRiskCandidates.length > 5 && (
                    <span className="text-xs text-amber-800 font-medium self-center">
                      +{criticalRiskCandidates.length - 5} {isAr ? 'آخرين' : 'autres'}
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Bologhine Neighborhood Coverage Card */}
        <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-emerald-700" />
                {isAr ? 'تغطية أحياء بلدية بولوغين' : 'Couverture des Quartiers'}
              </span>
              <span className="text-[11px] text-slate-500 font-medium">
                {Object.keys(neighborhoodCounts).length} {isAr ? 'أحياء ممثلة' : 'quartiers'}
              </span>
            </div>
            <p className="text-[11px] text-slate-500 mb-2.5">
              {isAr ? 'توزيع المترشحين على القطاعات الحضرية لبولوغين لضمان امتداد شعبي متوازن:' : 'Répartition sur le territoire communal de Bologhine :'}
            </p>
            <div className="space-y-1.5 max-h-24 overflow-y-auto pr-1">
              {Object.entries(neighborhoodCounts).map(([neighborhood, count]) => (
                <div key={neighborhood} className="flex items-center justify-between text-xs py-0.5 border-b border-slate-50">
                  <span className="text-slate-700 truncate max-w-[170px]">{neighborhood}</span>
                  <span className="font-semibold text-emerald-800 bg-emerald-50 px-1.5 py-0.5 rounded text-[11px]">
                    {count} {isAr ? 'مرشح' : 'candidat(s)'}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="pt-2 mt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
            <span>{isAr ? 'قسمة بولوغين - محافظة باب الوادي' : 'Kasma Bologhine FLN'}</span>
            <span className="font-medium text-emerald-700">
              {stats.globalComplianceRate}% {isAr ? 'جاهزية عامة' : 'prêt global'}
            </span>
          </div>
        </div>

      </div>
    </div>
  );
};
