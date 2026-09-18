import React from 'react';
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
  MapPin
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
