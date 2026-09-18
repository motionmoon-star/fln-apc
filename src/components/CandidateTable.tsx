import React, { useState, useMemo } from 'react';
import { Candidate, CouncilType, Gender } from '../types';
import { Language, TRANSLATIONS } from '../data/translations';
import { ADMINISTRATIVE_DOCUMENTS } from '../data/documentsList';
import { calculateAge, getDossierCompliance, isYouth, formatPhoneNumber, getCleanTelUrl } from '../utils/candidateUtils';
import { 
  Search, 
  Filter, 
  CheckCircle, 
  Clock, 
  AlertCircle, 
  Eye, 
  Edit3, 
  Trash2, 
  Printer, 
  Building2, 
  Landmark, 
  Sparkles, 
  GraduationCap, 
  BadgeCheck, 
  Phone, 
  MapPin,
  Check,
  X,
  FileText,
  ShieldCheck,
  Crown,
  Hash,
  Smartphone,
  ChevronDown,
  ChevronUp,
  Table as TableIcon
} from 'lucide-react';

interface CandidateTableProps {
  candidates: Candidate[];
  language: Language;
  currentCouncilFilter: CouncilType | 'ALL';
  onSelectCandidate: (candidate: Candidate) => void;
  onEditCandidate: (candidate: Candidate) => void;
  onDeleteCandidate: (id: string) => void;
  onPrintDossierSlip: (candidate: Candidate) => void;
  onOpenNumberingManager: () => void;
  onAssignRankDirect: (candidateId: string, rank: number | null) => void;
}

export const CandidateTable: React.FC<CandidateTableProps> = ({
  candidates,
  language,
  currentCouncilFilter,
  onSelectCandidate,
  onEditCandidate,
  onDeleteCandidate,
  onPrintDossierSlip,
  onOpenNumberingManager,
  onAssignRankDirect,
}) => {
  const t = TRANSLATIONS[language];
  const isAr = language === 'ar';

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'complet' | 'en_cours' | 'incomplet'>('ALL');
  const [genderFilter, setGenderFilter] = useState<'ALL' | Gender>('ALL');
  const [youthFilter, setYouthFilter] = useState<boolean>(false);
  const [degreeFilter, setDegreeFilter] = useState<boolean>(false);
  
  // Default to phone/card view on mobile screens, customizable
  const [viewMode, setViewMode] = useState<'phone' | 'table'>(() => {
    if (typeof window !== 'undefined' && window.innerWidth < 768) {
      return 'phone';
    }
    return 'phone';
  });

  // Accordion state to expand the 11 pieces breakdown on phone
  const [expandedDocsCandidateId, setExpandedDocsCandidateId] = useState<string | null>(null);

  // Direct quick rank modal state for administrator
  const [quickRankCandidate, setQuickRankCandidate] = useState<Candidate | null>(null);
  const [quickRankValue, setQuickRankValue] = useState<string>('');

  // Filtered & sorted candidates
  const filteredCandidates = useMemo(() => {
    return candidates
      .filter(c => {
        // Council filter
        if (currentCouncilFilter !== 'ALL' && c.council !== currentCouncilFilter) {
          return false;
        }

        // Search text
        if (searchTerm.trim() !== '') {
          const q = searchTerm.toLowerCase();
          const matchFr = `${c.firstNameFr} ${c.lastNameFr}`.toLowerCase().includes(q);
          const matchAr = `${c.firstNameAr} ${c.lastNameAr}`.includes(q);
          const matchProfession = c.profession?.toLowerCase().includes(q);
          const matchNIN = c.nationalIdNumber?.includes(q);
          const matchPhone = c.phoneNumber?.includes(q);
          const matchNeighborhood = c.addressNeighborhood?.toLowerCase().includes(q);
          const matchParty = c.partyMembershipNumber?.toLowerCase().includes(q);

          if (!matchFr && !matchAr && !matchProfession && !matchNIN && !matchPhone && !matchNeighborhood && !matchParty) {
            return false;
          }
        }

        // Dossier status filter
        if (statusFilter !== 'ALL') {
          const comp = getDossierCompliance(c);
          if (statusFilter === 'complet' && !comp.isComplete) return false;
          if (statusFilter === 'en_cours' && (comp.isComplete || comp.conformeCount < 8)) return false;
          if (statusFilter === 'incomplet' && comp.conformeCount >= 8) return false;
        }

        // Gender filter
        if (genderFilter !== 'ALL' && c.gender !== genderFilter) {
          return false;
        }

        // Youth filter (< 35)
        if (youthFilter && !isYouth(c.birthDate)) {
          return false;
        }

        // Degree filter
        if (degreeFilter && !c.isUniversityGraduate) {
          return false;
        }

        return true;
      })
      .sort((a, b) => {
        // Sort by council first if ALL
        if (currentCouncilFilter === 'ALL' && a.council !== b.council) {
          return a.council === 'APC' ? -1 : 1;
        }
        // Candidates with assigned rank come first
        const hasRankA = a.listRank !== null && a.listRank > 0;
        const hasRankB = b.listRank !== null && b.listRank > 0;
        if (hasRankA && !hasRankB) return -1;
        if (!hasRankA && hasRankB) return 1;
        if (hasRankA && hasRankB) {
          return (a.listRank as number) - (b.listRank as number);
        }
        return a.lastNameFr.localeCompare(b.lastNameFr);
      });
  }, [candidates, currentCouncilFilter, searchTerm, statusFilter, genderFilter, youthFilter, degreeFilter]);

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
      
      {/* Search and Filters Toolbar */}
      <div className="p-4 border-b border-slate-200 bg-slate-50/50 space-y-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          
          {/* Search Input */}
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              placeholder={t.searchPlaceholder}
              className="w-full pl-9 pr-4 py-2 text-xs bg-white border border-slate-300 rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:border-transparent transition-all placeholder:text-slate-400"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Quick toggle view & counters */}
          <div className="flex items-center gap-2 text-xs text-slate-600">
            <span className="font-semibold text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-md border border-emerald-200">
              {filteredCandidates.length} {isAr ? 'مترشحين معروضين' : 'candidats affichés'}
            </span>

            <div className="inline-flex rounded-lg border border-slate-200 bg-white p-0.5 shadow-2xs">
              <button
                type="button"
                onClick={() => setViewMode('phone')}
                className={`inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-md transition-colors cursor-pointer ${
                  viewMode === 'phone' ? 'bg-emerald-700 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
                title={isAr ? 'عرض مخصص للهواتف الذكية (9 محاور إدارية مطابقة للجدول)' : 'Affichage optimisé smartphone (9 axes du tableau)'}
              >
                <Smartphone className="w-3.5 h-3.5" />
                <span>{isAr ? 'عرض الهاتف (9 محاور)' : 'Vue Phone (9 axes)'}</span>
              </button>
              <button
                type="button"
                onClick={() => setViewMode('table')}
                className={`inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-md transition-colors cursor-pointer ${
                  viewMode === 'table' ? 'bg-emerald-700 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
                title={isAr ? 'عرض جدول كامل' : 'Grand tableau complet'}
              >
                <TableIcon className="w-3.5 h-3.5" />
                <span>{isAr ? 'جدول كامل' : 'Tableau'}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center flex-wrap gap-2 pt-1 text-xs">
          <span className="text-slate-400 font-medium flex items-center gap-1">
            <Filter className="w-3 h-3" />
            {isAr ? 'تصفية حسب:' : 'Filtrer:'}
          </span>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value as any)}
            className="px-2.5 py-1 rounded-md bg-white border border-slate-300 text-slate-700 font-medium text-xs focus:ring-1 focus:ring-emerald-600 outline-none"
          >
            <option value="ALL">{t.allStatuses}</option>
            <option value="complet">✓ {t.statusComplete}</option>
            <option value="en_cours">⏳ {t.statusPending}</option>
            <option value="incomplet">⚠️ {t.statusIncomplete}</option>
          </select>

          {/* Gender Filter */}
          <select
            value={genderFilter}
            onChange={e => setGenderFilter(e.target.value as any)}
            className="px-2.5 py-1 rounded-md bg-white border border-slate-300 text-slate-700 font-medium text-xs focus:ring-1 focus:ring-emerald-600 outline-none"
          >
            <option value="ALL">{isAr ? 'الكل (رجال ونساء)' : 'Tous genres'}</option>
            <option value="F">{isAr ? 'نساء فقط (المرأة)' : 'Femmes uniquement'}</option>
            <option value="H">{isAr ? 'رجال فقط' : 'Hommes uniquement'}</option>
          </select>

          {/* Quota Jeunes Filter */}
          <button
            onClick={() => setYouthFilter(!youthFilter)}
            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md font-medium text-xs transition-colors border ${
              youthFilter
                ? 'bg-amber-100 text-amber-900 border-amber-300 font-semibold'
                : 'bg-white text-slate-600 border-slate-300 hover:bg-slate-50'
            }`}
          >
            <Sparkles className="w-3 h-3 text-amber-600" />
            <span>{isAr ? 'الشباب (< 35 سنة)' : 'Jeunes (< 35 ans)'}</span>
          </button>

          {/* Universitaires Filter */}
          <button
            onClick={() => setDegreeFilter(!degreeFilter)}
            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md font-medium text-xs transition-colors border ${
              degreeFilter
                ? 'bg-blue-100 text-blue-900 border-blue-300 font-semibold'
                : 'bg-white text-slate-600 border-slate-300 hover:bg-slate-50'
            }`}
          >
            <GraduationCap className="w-3 h-3 text-blue-600" />
            <span>{isAr ? 'إطارات جامعية' : 'Diplômés Univ.'}</span>
          </button>

          {/* Admin Numbering Direct Access Button */}
          <button
            onClick={onOpenNumberingManager}
            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-semibold bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 transition-colors ml-auto shadow-2xs"
            title="Gérer la numérotation officielle des candidats (Réservé à l'administrateur)"
          >
            <ShieldCheck className="w-3.5 h-3.5 text-amber-700" />
            <span>{isAr ? 'ترتيب وتعيين الأرقام (الإدارة)' : 'Ordre & Numérotation (Admin)'}</span>
          </button>

          {/* Clear filters if active */}
          {(statusFilter !== 'ALL' || genderFilter !== 'ALL' || youthFilter || degreeFilter || searchTerm) && (
            <button
              onClick={() => {
                setStatusFilter('ALL');
                setGenderFilter('ALL');
                setYouthFilter(false);
                setDegreeFilter(false);
                setSearchTerm('');
              }}
              className="text-xs text-rose-600 hover:text-rose-700 font-medium underline underline-offset-2 ml-1"
            >
              {isAr ? 'إعادة ضبط' : 'Réinitialiser'}
            </button>
          )}
        </div>
      </div>

      {/* Main Content: Table View or Cards View */}
      {filteredCandidates.length === 0 ? (
        <div className="p-12 text-center">
          <AlertCircle className="w-8 h-8 text-slate-400 mx-auto mb-2" />
          <p className="text-sm font-semibold text-slate-700">
            {isAr ? 'لا يوجد أي مترشح يطابق هذه المعايير' : 'Aucun candidat ne correspond à ces critères'}
          </p>
          <p className="text-xs text-slate-500 mt-1">
            {isAr ? 'يرجى تغيير خيارات البحث أو التصفية' : 'Essayez de modifier vos filtres ou termes de recherche'}
          </p>
        </div>
      ) : viewMode === 'table' ? (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-100/75 border-b border-slate-200 text-slate-600 uppercase text-[10px] tracking-wider font-semibold">
                <th className="py-3 px-3 w-16 text-center">
                  <div className="flex flex-col items-center">
                    <span>{isAr ? 'رقم الإدارة' : 'N° Admin'}</span>
                    <span className="text-[8px] text-amber-700 normal-case font-bold">{isAr ? 'ممنوح' : 'Officiel'}</span>
                  </div>
                </th>
                <th className="py-3 px-3">{isAr ? 'المترشح (الاسم واللقب)' : 'Candidat'}</th>
                <th className="py-3 px-3">{isAr ? 'المجلس' : 'Conseil'}</th>
                <th className="py-3 px-3">{isAr ? 'الحي والاتصال' : 'Quartier & Contact'}</th>
                <th className="py-3 px-3">{isAr ? 'المهنة والمستوى' : 'Profession & Niveau'}</th>
                <th className="py-3 px-3">{isAr ? 'نضال FLN' : 'Militant FLN'}</th>
                <th className="py-3 px-3 text-center">
                  <div className="flex flex-col items-center">
                    <span>{isAr ? 'الوثائق الـ 11' : '11 Pièces'}</span>
                    <span className="text-[9px] text-slate-400 normal-case font-normal">
                      {isAr ? 'مطابقة إدارية' : 'Conformité'}
                    </span>
                  </div>
                </th>
                <th className="py-3 px-3 text-center">{isAr ? 'حالة الملف' : 'Statut'}</th>
                <th className="py-3 px-3 text-right">{isAr ? 'الإجراءات' : 'Actions'}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredCandidates.map(c => {
                const comp = getDossierCompliance(c);
                const age = calculateAge(c.birthDate);
                const youth = isYouth(c.birthDate);
                const hasRank = c.listRank !== null && c.listRank > 0;

                return (
                  <tr 
                    key={c.id} 
                    className="hover:bg-emerald-50/30 transition-colors group cursor-pointer"
                    onClick={() => onSelectCandidate(c)}
                  >
                    {/* Rank (Assigned by Administrator) */}
                    <td className="py-3 px-2 text-center" onClick={e => e.stopPropagation()}>
                      {hasRank ? (
                        <button
                          type="button"
                          onClick={() => {
                            setQuickRankCandidate(c);
                            setQuickRankValue(String(c.listRank));
                          }}
                          className="group/rank inline-flex flex-col items-center justify-center p-1 rounded-lg hover:bg-amber-100/60 transition-all cursor-pointer"
                          title={isAr ? 'الرقم ممنوح من الإدارة - انقر لتعديل الترتيب' : 'Numéro officiel attribué par l\'administrateur - Cliquez pour modifier'}
                        >
                          <span className={`inline-flex items-center justify-center w-7 h-7 rounded-lg text-xs font-extrabold shadow-2xs border transition-all ${
                            c.listRank === 1 
                              ? 'bg-amber-400 text-amber-950 border-amber-500 ring-2 ring-amber-200' 
                              : 'bg-white text-emerald-950 border-emerald-300 group-hover/rank:border-emerald-600'
                          }`}>
                            {c.listRank}
                          </span>
                          <span className="text-[8px] font-bold text-amber-800 mt-0.5 uppercase tracking-tighter">
                            Admin
                          </span>
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => {
                            setQuickRankCandidate(c);
                            setQuickRankValue('');
                          }}
                          className="inline-flex flex-col items-center justify-center px-1.5 py-1 rounded-lg border border-dashed border-amber-400 bg-amber-50/80 hover:bg-amber-100 text-amber-900 transition-colors cursor-pointer"
                          title={isAr ? 'تعيين رقم للمترشح من طرف الإدارة' : 'Attribuer un numéro officiel (Décision Administrateur)'}
                        >
                          <span className="text-[10px] font-bold">+ N°</span>
                          <span className="text-[7px] font-semibold text-amber-700">Admin</span>
                        </button>
                      )}
                    </td>

                    {/* Candidate Name & Bio */}
                    <td className="py-3 px-3">
                      <div className="flex items-center gap-2.5">
                        {c.photoUrl ? (
                          <img
                            src={c.photoUrl}
                            alt=""
                            className="w-8 h-8 rounded-full object-cover border border-emerald-500 shadow-2xs shrink-0"
                          />
                        ) : (
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs flex-shrink-0 ${
                            c.gender === 'F' ? 'bg-rose-100 text-rose-800' : 'bg-emerald-100 text-emerald-800'
                          }`}>
                            {c.firstNameFr.charAt(0)}{c.lastNameFr.charAt(0)}
                          </div>
                        )}
                        <div>
                          <div className="font-bold text-slate-900 flex items-center gap-1.5 flex-wrap">
                            <span>{c.lastNameFr} {c.firstNameFr}</span>
                            <span className="text-slate-400 text-[11px] font-normal">
                              ({c.lastNameAr} {c.firstNameAr})
                            </span>
                            {c.listRank === 1 && (
                              <span className="text-[10px] bg-amber-100 text-amber-800 font-bold px-1.5 py-0.2 rounded border border-amber-300">
                                {isAr ? 'متصدر القائمة' : 'Tête de Liste'}
                              </span>
                            )}
                          </div>
                          <div className="text-[11px] text-slate-500 flex items-center gap-1.5 mt-0.5">
                            <span>{age} {isAr ? 'سنة' : 'ans'}</span>
                            <span>•</span>
                            <span className={c.gender === 'F' ? 'text-rose-600 font-medium' : 'text-slate-600'}>
                              {c.gender === 'F' ? (isAr ? 'أنثى' : 'Femme') : (isAr ? 'ذكر' : 'Homme')}
                            </span>
                            {youth && (
                              <span className="inline-flex items-center gap-0.5 text-[10px] font-semibold text-amber-700 bg-amber-50 px-1 rounded">
                                <Sparkles className="w-2.5 h-2.5" />
                                {isAr ? 'شاب' : 'Jeune'}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Council Badge */}
                    <td className="py-3 px-3">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold ${
                        c.council === 'APC'
                          ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                          : 'bg-indigo-100 text-indigo-800 border border-indigo-200'
                      }`}>
                        {c.council === 'APC' ? <Building2 className="w-3 h-3" /> : <Landmark className="w-3 h-3" />}
                        <span>{c.council} {c.council === 'APC' ? (isAr ? 'بولوغين' : 'Bologhine') : (isAr ? 'الجزائر' : 'Alger')}</span>
                      </span>
                    </td>

                    {/* Neighborhood & Contact */}
                    <td className="py-3 px-3">
                      <div className="flex items-center gap-1 text-slate-700 font-medium text-[11px]">
                        <MapPin className="w-3 h-3 text-slate-400 flex-shrink-0" />
                        <span className="truncate max-w-[140px]">{c.addressNeighborhood || 'بولوغين'}</span>
                      </div>
                      <div className="flex items-center gap-1 text-slate-500 text-[10px] mt-0.5">
                        <Phone className="w-2.5 h-2.5 text-emerald-600 shrink-0" />
                        <a 
                          href={getCleanTelUrl(c.phoneNumber)}
                          onClick={e => e.stopPropagation()}
                          className="font-mono text-[11px] text-emerald-800 hover:text-emerald-950 font-semibold hover:underline"
                          title={isAr ? 'انقر للاتصال المباشر' : 'Appeler directement'}
                        >
                          {formatPhoneNumber(c.phoneNumber)}
                        </a>
                      </div>
                    </td>

                    {/* Profession & Degree */}
                    <td className="py-3 px-3">
                      <div className="font-medium text-slate-800 truncate max-w-[160px]">
                        {c.profession}
                      </div>
                      <div className="text-[10px] text-slate-500 flex items-center gap-1 mt-0.5">
                        {c.isUniversityGraduate && <GraduationCap className="w-3 h-3 text-blue-600" />}
                        <span className="truncate max-w-[150px]">{c.educationLevel}</span>
                      </div>
                    </td>

                    {/* FLN Party Membership */}
                    <td className="py-3 px-3">
                      <div className="font-semibold text-emerald-900 text-[11px] flex items-center gap-1">
                        <BadgeCheck className="w-3.5 h-3.5 text-emerald-700 flex-shrink-0" />
                        <span>{c.partyMembershipNumber}</span>
                      </div>
                      <div className="text-[10px] text-slate-500">
                        {isAr ? `منذ سنة ${c.partyJoinYear}` : `Adhérent ${c.partyJoinYear}`}
                      </div>
                    </td>

                    {/* 11 Document Micro-Matrix */}
                    <td className="py-3 px-3 text-center" onClick={e => e.stopPropagation()}>
                      <div className="flex items-center justify-center gap-1">
                        {ADMINISTRATIVE_DOCUMENTS.map((docDef, idx) => {
                          const doc = c.documents?.[docDef.key];
                          const isDocConforme = doc?.status === 'conforme' || doc?.conforme === true;
                          const isDocNonConforme = doc?.status === 'non_conforme';

                          return (
                            <span
                              key={docDef.key}
                              title={`${idx + 1}. ${docDef.nameFr} (${docDef.nameAr}): ${
                                isDocConforme ? 'Conforme ✓' : isDocNonConforme ? 'Non conforme ✕' : 'En attente ⏳'
                              }`}
                              className={`w-2.5 h-2.5 rounded-full inline-block cursor-help transition-transform hover:scale-125 ${
                                isDocConforme 
                                  ? 'bg-emerald-600' 
                                  : isDocNonConforme
                                  ? 'bg-rose-600 ring-1 ring-rose-300'
                                  : 'bg-amber-400'
                              }`}
                            />
                          );
                        })}
                      </div>
                      <div className="text-[10px] font-bold text-slate-600 mt-1">
                        {comp.conformeCount} / 11 {isAr ? 'وثائق' : 'pièces'}
                      </div>
                    </td>

                    {/* Overall Dossier Status */}
                    <td className="py-3 px-3 text-center">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                        comp.isComplete
                          ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                          : comp.conformeCount >= 8
                          ? 'bg-amber-100 text-amber-800 border border-amber-300'
                          : 'bg-rose-100 text-rose-800 border border-rose-300'
                      }`}>
                        {comp.isComplete ? (
                          <>
                            <CheckCircle className="w-3 h-3 text-emerald-600" />
                            <span>100% {isAr ? 'جاهز' : 'Prêt'}</span>
                          </>
                        ) : (
                          <>
                            <Clock className="w-3 h-3 text-amber-600" />
                            <span>{comp.percentage}%</span>
                          </>
                        )}
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="py-3 px-3 text-right" onClick={e => e.stopPropagation()}>
                      <div className="flex items-center justify-end gap-1">
                        
                        {/* Audit Dossier Details */}
                        <button
                          onClick={() => onSelectCandidate(c)}
                          className="p-1.5 text-slate-600 hover:text-emerald-700 hover:bg-emerald-50 rounded-md transition-colors"
                          title={t.viewDetails}
                        >
                          <Eye className="w-4 h-4" />
                        </button>

                        {/* Print Official Slip for this candidate */}
                        <button
                          onClick={() => onPrintDossierSlip(c)}
                          className="p-1.5 text-slate-600 hover:text-blue-700 hover:bg-blue-50 rounded-md transition-colors"
                          title={t.printOfficialSlip}
                        >
                          <FileText className="w-4 h-4" />
                        </button>

                        {/* Edit Candidate */}
                        <button
                          onClick={() => onEditCandidate(c)}
                          className="p-1.5 text-slate-600 hover:text-amber-700 hover:bg-amber-50 rounded-md transition-colors"
                          title={t.editCandidate}
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>

                        {/* Delete */}
                        <button
                          onClick={() => {
                            if (window.confirm(isAr ? `هل أنت متأكد من حذف المترشح ${c.lastNameFr} ${c.firstNameFr}؟` : `Supprimer le candidat ${c.lastNameFr} ${c.firstNameFr} ?`)) {
                              onDeleteCandidate(c.id);
                            }
                          }}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-md transition-colors"
                          title={t.deleteCandidate}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        /* Phone-Optimized Layout ("Mise en page Phone" with 9 administrative axes) */
        <div className="p-3 sm:p-4 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3.5">
          {filteredCandidates.map(c => {
            const comp = getDossierCompliance(c);
            const age = calculateAge(c.birthDate);
            const youth = isYouth(c.birthDate);
            const isDocsExpanded = expandedDocsCandidateId === c.id;
            const hasRank = c.listRank !== null && c.listRank > 0;

            return (
              <div
                key={c.id}
                id={`candidate-phone-card-${c.id}`}
                className="bg-white rounded-2xl border border-slate-200 hover:border-emerald-500 shadow-xs hover:shadow-md transition-all overflow-hidden flex flex-col justify-between"
              >
                <div>
                  {/* Rubrique Candidat: Mise en page optimisée sans "1. رقم الإدارة (ممنوح)" avec N° à droite */}
                  <div className="p-3.5 bg-gradient-to-b from-slate-50/90 to-white border-b border-slate-100">
                    <div className="flex items-start justify-between gap-2.5">
                      
                      {/* Photo / Avatar & Names with Number on the right (first in RTL) */}
                      <div className="flex items-start gap-2.5 min-w-0">
                        
                        {/* Numéro officiel du candidat à droite (Right side / Start in RTL) */}
                        <div className="shrink-0 flex flex-col items-center">
                          {hasRank ? (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setQuickRankCandidate(c);
                                setQuickRankValue(c.listRank ? String(c.listRank) : '');
                              }}
                              className={`min-w-[42px] h-[48px] px-2 rounded-xl flex flex-col items-center justify-center font-black shadow-xs transition-transform active:scale-95 cursor-pointer border ${
                                c.listRank === 1
                                  ? 'bg-amber-400 text-amber-950 border-amber-500 ring-2 ring-amber-200'
                                  : 'bg-emerald-700 text-white border-emerald-800 hover:bg-emerald-800'
                              }`}
                              title={isAr ? 'الرقم الإداري للمترشح - انقر للتعديل' : 'Numéro officiel du candidat - Cliquer pour modifier'}
                            >
                              {c.listRank === 1 ? (
                                <>
                                  <Crown className="w-3.5 h-3.5 text-amber-950" />
                                  <span className="text-xs font-black font-mono leading-none">01</span>
                                  <span className="text-[7.5px] font-bold leading-tight mt-0.5">{isAr ? 'متصدر' : 'Tête'}</span>
                                </>
                              ) : (
                                <>
                                  <span className="text-[8px] font-bold text-emerald-200 leading-none">N°</span>
                                  <span className="text-sm font-black font-mono leading-tight">{String(c.listRank).padStart(2, '0')}</span>
                                </>
                              )}
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setQuickRankCandidate(c);
                                setQuickRankValue('');
                              }}
                              className="min-w-[42px] h-[48px] px-2 rounded-xl flex flex-col items-center justify-center font-semibold text-slate-400 hover:text-amber-800 bg-slate-100 hover:bg-amber-50 border border-dashed border-slate-300 hover:border-amber-300 transition-colors cursor-pointer shadow-2xs"
                              title={isAr ? 'تعيين رقم للمترشح' : 'Attribuer un numéro'}
                            >
                              <span className="text-xs font-mono font-bold">--</span>
                              <span className="text-[8px] font-bold leading-none mt-0.5">{isAr ? '+رقم' : '+N°'}</span>
                            </button>
                          )}
                        </div>

                        {/* Photo / Avatar */}
                        <div className="relative shrink-0 mt-0.5">
                          {c.photoUrl ? (
                            <img
                              src={c.photoUrl}
                              alt=""
                              className="w-12 h-12 rounded-full object-cover border-2 border-emerald-600 shadow-xs"
                            />
                          ) : (
                            <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-sm shadow-xs border ${
                              c.gender === 'F' 
                                ? 'bg-rose-100 text-rose-800 border-rose-300' 
                                : 'bg-emerald-100 text-emerald-900 border-emerald-300'
                            }`}>
                              {c.firstNameFr.charAt(0)}{c.lastNameFr.charAt(0)}
                            </div>
                          )}
                        </div>

                        {/* Nom & Prénom et Détails */}
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <h4 className="font-bold text-slate-900 text-base leading-tight font-arabic">
                              {c.lastNameAr} {c.firstNameAr}
                            </h4>
                          </div>
                          <p className="text-xs text-slate-600 font-semibold uppercase tracking-wide mt-0.5 truncate">
                            {c.lastNameFr} {c.firstNameFr}
                          </p>

                          <div className="flex items-center gap-1.5 text-[11px] text-slate-500 mt-1 flex-wrap">
                            <span className="font-medium text-slate-700">{age} {isAr ? 'سنة' : 'ans'}</span>
                            <span>•</span>
                            <span className={c.gender === 'F' ? 'text-rose-700 font-semibold' : 'text-slate-600'}>
                              {c.gender === 'F' ? (isAr ? 'أنثى' : 'Femme') : (isAr ? 'ذكر' : 'Homme')}
                            </span>
                            {youth && (
                              <span className="inline-flex items-center gap-0.5 text-[10px] font-bold text-amber-800 bg-amber-100 px-1.5 py-0.2 rounded border border-amber-200">
                                <Sparkles className="w-2.5 h-2.5 text-amber-600" />
                                <span>{isAr ? 'شاب (< 35)' : 'Jeune'}</span>
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* المجلس */}
                      <div className="shrink-0 text-end">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold shadow-2xs ${
                          c.council === 'APC'
                            ? 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                            : 'bg-indigo-100 text-indigo-900 border border-indigo-300'
                        }`}>
                          {c.council === 'APC' ? <Building2 className="w-3.5 h-3.5" /> : <Landmark className="w-3.5 h-3.5" />}
                          <span>{c.council === 'APC' ? (isAr ? 'بلدي APC' : 'APC Bologhine') : (isAr ? 'ولائي APW' : 'APW Alger')}</span>
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Section Body: 4. الحي والاتصال, 5. المهنة والمستوى, 6. نضال FLN */}
                  <div className="p-3.5 space-y-2.5 text-xs divide-y divide-slate-100">
                    
                    {/* 4. الحي والاتصال */}
                    <div className="pt-1 first:pt-0 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <div className="p-1.5 bg-slate-100 text-slate-700 rounded-lg shrink-0">
                          <MapPin className="w-3.5 h-3.5 text-slate-600" />
                        </div>
                        <div className="min-w-0">
                          <span className="text-[10px] font-bold text-slate-400 block uppercase">
                            {isAr ? '4. الحي والاتصال (السكن)' : '4. Quartier & Résidence'}
                          </span>
                          <span className="font-semibold text-slate-800 truncate block">
                            {c.addressNeighborhood || 'بولوغين'}
                          </span>
                        </div>
                      </div>

                      {/* Phone with direct 1-tap call & format */}
                      <div className="flex items-center gap-2 self-start sm:self-auto bg-emerald-50/90 border border-emerald-300/80 px-2.5 py-1.5 rounded-xl">
                        <Phone className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
                        <div className="min-w-0">
                          <span className="text-[9px] font-bold text-emerald-800 block uppercase">
                            {isAr ? 'رقم الهاتف المباشر' : 'Tél direct'}
                          </span>
                          <a
                            href={getCleanTelUrl(c.phoneNumber)}
                            className="font-bold font-mono text-xs text-emerald-950 hover:text-emerald-700 hover:underline inline-flex items-center gap-1"
                            title={isAr ? 'انقر للاتصال المباشر من الهاتف' : 'Appeler directement'}
                          >
                            <span>{formatPhoneNumber(c.phoneNumber)}</span>
                          </a>
                        </div>
                      </div>
                    </div>

                    {/* 5. المهنة والمستوى */}
                    <div className="pt-2.5 flex items-start justify-between gap-2">
                      <div className="flex items-start gap-2 min-w-0">
                        <div className="p-1.5 bg-blue-50 text-blue-700 rounded-lg shrink-0 mt-0.5">
                          <GraduationCap className="w-3.5 h-3.5 text-blue-600" />
                        </div>
                        <div className="min-w-0">
                          <span className="text-[10px] font-bold text-slate-400 block uppercase">
                            {isAr ? '5. المهنة والمستوى' : '5. Profession & Niveau'}
                          </span>
                          <div className="font-bold text-slate-800 text-xs">
                            {c.profession}
                          </div>
                          <div className="text-[11px] text-slate-500 flex items-center gap-1.5 mt-0.5">
                            <span>{c.educationLevel}</span>
                            {c.isUniversityGraduate && (
                              <span className="inline-flex items-center gap-0.5 font-bold text-[10px] text-blue-800 bg-blue-100/80 px-1.5 py-0.2 rounded border border-blue-200">
                                {isAr ? 'إطار جامعي (كوتا 33%)' : 'Diplômé Univ. (Quota 33%)'}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* 6. نضال FLN */}
                    <div className="pt-2.5 flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <div className="p-1.5 bg-emerald-50 text-emerald-700 rounded-lg shrink-0">
                          <BadgeCheck className="w-3.5 h-3.5 text-emerald-700" />
                        </div>
                        <div className="min-w-0">
                          <span className="text-[10px] font-bold text-slate-400 block uppercase">
                            {isAr ? '6. نضال FLN' : '6. Militantisme FLN'}
                          </span>
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-bold font-mono text-emerald-900 text-xs bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                              بطاقة: {c.partyMembershipNumber}
                            </span>
                            <span className="text-[11px] text-slate-500 font-medium">
                              {isAr ? `منخرط منذ ${c.partyJoinYear}` : `Adhérent ${c.partyJoinYear}`}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* 7. الوثائق الـ 11 (مطابقة إدارية) + 8. حالة الملف */}
                    <div className="pt-2.5 space-y-2">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-1.5 min-w-0">
                          <FileText className="w-3.5 h-3.5 text-slate-600 shrink-0" />
                          <span className="text-xs font-bold text-slate-800 truncate">
                            {isAr ? '7. الوثائق الـ 11 (مطابقة إدارية)' : '7. Les 11 Pièces (Conformité)'}
                          </span>
                        </div>

                        {/* 8. حالة الملف */}
                        <div className="flex items-center gap-1 shrink-0">
                          <span className="text-[10px] font-bold text-slate-400 hidden sm:inline uppercase">
                            {isAr ? '8. حالة الملف:' : '8. Statut :'}
                          </span>
                          <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-extrabold ${
                            comp.isComplete
                              ? 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                              : comp.conformeCount >= 8
                              ? 'bg-amber-100 text-amber-900 border border-amber-300'
                              : 'bg-rose-100 text-rose-900 border border-rose-300'
                          }`}>
                            {comp.isComplete ? <CheckCircle className="w-3 h-3 text-emerald-600" /> : <Clock className="w-3 h-3 text-amber-600" />}
                            <span>{comp.conformeCount}/11 ({comp.percentage}%)</span>
                          </span>
                        </div>
                      </div>

                      {/* 8. شريط حالة الملف التقدمي */}
                      <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                        <div 
                          className={`h-full transition-all duration-300 ${
                            comp.isComplete ? 'bg-emerald-600' : comp.conformeCount >= 8 ? 'bg-amber-500' : 'bg-rose-500'
                          }`}
                          style={{ width: `${comp.percentage}%` }}
                        />
                      </div>

                      {/* 11 document micro-matrix with numbers 1 to 11 */}
                      <div className="grid grid-cols-11 gap-1 py-0.5">
                        {ADMINISTRATIVE_DOCUMENTS.map((docDef, idx) => {
                          const doc = c.documents?.[docDef.key];
                          const isDocConforme = doc?.status === 'conforme' || doc?.conforme === true;
                          const isDocNonConforme = doc?.status === 'non_conforme';

                          return (
                            <div
                              key={docDef.key}
                              title={`${idx + 1}. ${docDef.nameAr} (${docDef.nameFr}): ${
                                isDocConforme ? 'مطابق' : isDocNonConforme ? 'غير مطابق' : 'قيد الانتظار'
                              }`}
                              className={`h-6 rounded-md flex items-center justify-center text-[9px] font-bold transition-all shadow-2xs ${
                                isDocConforme
                                  ? 'bg-emerald-600 text-white'
                                  : isDocNonConforme
                                  ? 'bg-rose-600 text-white'
                                  : 'bg-amber-300 text-amber-950 border border-amber-400'
                              }`}
                            >
                              {idx + 1}
                            </div>
                          );
                        })}
                      </div>

                      {/* Expandable detailed 11 docs checklist toggle on mobile */}
                      <button
                        type="button"
                        onClick={() => setExpandedDocsCandidateId(isDocsExpanded ? null : c.id)}
                        className="w-full text-center py-1.5 text-[11px] font-semibold text-emerald-700 hover:text-emerald-800 bg-emerald-50/70 hover:bg-emerald-100/70 rounded-lg transition-colors flex items-center justify-center gap-1 cursor-pointer"
                      >
                        <span>
                          {isDocsExpanded 
                            ? (isAr ? 'إخفاء تفاصيل الـ 11 وثيقة ▲' : 'Masquer le détail des 11 pièces ▲') 
                            : (isAr ? 'عرض تفاصيل حالة الـ 11 وثيقة بالاسم ▼' : 'Afficher le détail des 11 pièces ▼')}
                        </span>
                      </button>

                      {/* Expanded 11 Docs List */}
                      {isDocsExpanded && (
                        <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200 space-y-1.5 animate-in fade-in duration-150">
                          {ADMINISTRATIVE_DOCUMENTS.map((docDef, idx) => {
                            const doc = c.documents?.[docDef.key];
                            const isDocConforme = doc?.status === 'conforme' || doc?.conforme === true;
                            const isDocNonConforme = doc?.status === 'non_conforme';

                            return (
                              <div key={docDef.key} className="flex items-center justify-between text-[11px] py-1 border-b border-slate-200/60 last:border-b-0">
                                <span className="font-medium text-slate-700 flex items-center gap-1.5">
                                  <span className="w-4 h-4 rounded-full bg-slate-200 text-slate-700 font-bold text-[9px] flex items-center justify-center shrink-0">
                                    {idx + 1}
                                  </span>
                                  <span>{isAr ? docDef.nameAr : docDef.nameFr}</span>
                                </span>
                                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                  isDocConforme 
                                    ? 'bg-emerald-100 text-emerald-800' 
                                    : isDocNonConforme 
                                    ? 'bg-rose-100 text-rose-800' 
                                    : 'bg-amber-100 text-amber-800'
                                }`}>
                                  {isDocConforme ? '✓ مطابق' : isDocNonConforme ? '✕ غير مطابق' : '⏳ قيد الانتظار'}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* 9. الإجراءات (Actions Bar: Minimum 44px touch targets) */}
                <div className="p-3 bg-slate-50/90 border-t border-slate-200">
                  <div className="text-[10px] font-bold text-slate-400 uppercase mb-2">
                    {isAr ? '9. الإجراءات الإدارية السريعة:' : '9. Actions administratives :'}
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {/* 1: View / Verify Dossier */}
                    <button
                      type="button"
                      onClick={() => onSelectCandidate(c)}
                      className="py-2.5 px-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-xs transition-all active:scale-95 cursor-pointer min-h-[44px]"
                      title={t.viewDetails}
                    >
                      <Eye className="w-4 h-4" />
                      <span>{isAr ? 'معاينة الملف' : 'Dossier'}</span>
                    </button>

                    {/* 2: Edit Candidate */}
                    <button
                      type="button"
                      onClick={() => onEditCandidate(c)}
                      className="py-2.5 px-2 rounded-xl bg-white hover:bg-slate-100 text-slate-800 border border-slate-300 font-bold text-xs flex items-center justify-center gap-1.5 transition-all active:scale-95 cursor-pointer min-h-[44px]"
                      title={t.editCandidate}
                    >
                      <Edit3 className="w-4 h-4 text-amber-600" />
                      <span>{isAr ? 'تعديل' : 'Modifier'}</span>
                    </button>

                    {/* 3: Print Slip */}
                    <button
                      type="button"
                      onClick={() => onPrintDossierSlip(c)}
                      className="py-2.5 px-2 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-800 border border-blue-200 font-bold text-xs flex items-center justify-center gap-1.5 transition-all active:scale-95 cursor-pointer min-h-[44px]"
                      title={t.printOfficialSlip}
                    >
                      <FileText className="w-4 h-4 text-blue-600" />
                      <span>{isAr ? 'وصل الإيداع' : 'Bordereau'}</span>
                    </button>

                    {/* 4: Direct Rank Admin Button */}
                    <button
                      type="button"
                      onClick={() => {
                        setQuickRankCandidate(c);
                        setQuickRankValue(c.listRank ? String(c.listRank) : '');
                      }}
                      className="py-2.5 px-2 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 font-bold text-xs flex items-center justify-center gap-1.5 transition-all active:scale-95 cursor-pointer min-h-[44px]"
                      title={isAr ? 'تعيين / تعديل رقم الترتيب الرسمي' : 'Numéro Officiel'}
                    >
                      <ShieldCheck className="w-4 h-4 text-amber-700" />
                      <span>{isAr ? 'الترتيب' : 'Rang'}</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Legend & Summary Footer */}
      <div className="p-3 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 text-[11px] text-slate-500">
        <div className="flex items-center gap-3 flex-wrap">
          <span className="font-semibold text-slate-700">{isAr ? 'دليل الوثائق:' : 'Légende :'}:</span>
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-600 inline-block"></span>
            <span>{isAr ? 'مستوفي ومطابق (Conforme)' : 'Conforme & vérifié'}</span>
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-400 inline-block"></span>
            <span>{isAr ? 'قيد الانتظار أو الاستخراج' : 'En attente de délivrance'}</span>
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-600 inline-block"></span>
            <span>{isAr ? 'غير مطابق / منتهي الصلاحية' : 'Non conforme / Expiré'}</span>
          </span>
        </div>

        <div className="text-slate-600 font-medium">
          {isAr ? 'قسمة بولوغين - لجنة الترشيحات والاستمارات' : 'Kasma Bologhine - Commission de Dépôt ANIE'}
        </div>
      </div>

      {/* Quick Admin Rank Assignment Popover Modal */}
      {quickRankCandidate && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-2xs"
          onClick={() => setQuickRankCandidate(null)}
        >
          <div 
            className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-sm p-5 animate-in fade-in zoom-in-95 duration-150"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-900 flex items-center justify-center">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-amber-900">
                    {isAr ? 'صلاحيات الإدارة' : 'Décision Administrateur'}
                  </h3>
                  <p className="text-sm font-bold text-slate-900">
                    {isAr ? 'تعيين رقم المترشح في القائمة' : 'Numérotation Officielle'}
                  </p>
                </div>
              </div>
              <button 
                onClick={() => setQuickRankCandidate(null)}
                className="p-1 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="py-4 space-y-3">
              <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 text-xs">
                <div className="font-bold text-slate-800">
                  {quickRankCandidate.lastNameFr} {quickRankCandidate.firstNameFr}
                </div>
                <div className="text-slate-500 font-arabic text-[11px]">
                  {quickRankCandidate.lastNameAr} {quickRankCandidate.firstNameAr}
                </div>
                <div className="text-slate-500 mt-1 flex items-center gap-1.5">
                  <span className="font-semibold text-emerald-800">
                    {quickRankCandidate.council === 'APC' ? 'APC Bologhine' : 'APW Alger'}
                  </span>
                  <span>•</span>
                  <span>{quickRankCandidate.profession}</span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  {isAr ? 'الرقم الممنوح رسمياً (1 = متصدر القائمة):' : 'Numéro attribué par l\'administrateur (1 = Tête de liste) :'}
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min={1}
                    max={99}
                    value={quickRankValue}
                    onChange={e => setQuickRankValue(e.target.value)}
                    placeholder="Ex: 1, 2, 3..."
                    className="flex-1 px-3 py-2 text-base font-extrabold text-slate-900 bg-white border-2 border-emerald-600/60 rounded-xl focus:border-emerald-600 focus:outline-none text-center"
                    autoFocus
                  />
                </div>
                <p className="text-[10px] text-slate-500 mt-1">
                  {isAr 
                    ? 'هذا الرقم يمنحه أمين القسمة / مسؤول الانتخابات فقط.' 
                    : 'Ce numéro de liste est réservé à l\'administrateur de Kasma.'}
                </p>
              </div>

              {/* Quick Preset Buttons */}
              <div className="space-y-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  {isAr ? 'اختصارات سريعة:' : 'Raccourcis rapides :'}
                </span>
                <div className="flex items-center gap-1.5 flex-wrap">
                  <button
                    type="button"
                    onClick={() => setQuickRankValue('1')}
                    className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-bold bg-amber-100 text-amber-950 border border-amber-300 hover:bg-amber-200"
                  >
                    <Crown className="w-3 h-3 text-amber-700" />
                    <span>N° 1 Tête</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setQuickRankValue('2')}
                    className="px-2 py-1 rounded-md text-xs font-semibold bg-slate-100 text-slate-800 border border-slate-200 hover:bg-slate-200"
                  >
                    N° 2
                  </button>
                  <button
                    type="button"
                    onClick={() => setQuickRankValue('3')}
                    className="px-2 py-1 rounded-md text-xs font-semibold bg-slate-100 text-slate-800 border border-slate-200 hover:bg-slate-200"
                  >
                    N° 3
                  </button>
                  <button
                    type="button"
                    onClick={() => setQuickRankValue('4')}
                    className="px-2 py-1 rounded-md text-xs font-semibold bg-slate-100 text-slate-800 border border-slate-200 hover:bg-slate-200"
                  >
                    N° 4
                  </button>
                  <button
                    type="button"
                    onClick={() => setQuickRankValue('5')}
                    className="px-2 py-1 rounded-md text-xs font-semibold bg-slate-100 text-slate-800 border border-slate-200 hover:bg-slate-200"
                  >
                    N° 5
                  </button>
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
              <button
                type="button"
                onClick={() => {
                  if (onAssignRankDirect) {
                    onAssignRankDirect(quickRankCandidate.id, null);
                  }
                  setQuickRankCandidate(null);
                }}
                className="text-xs text-rose-600 hover:text-rose-700 hover:bg-rose-50 px-2 py-1 rounded-lg transition-colors font-medium"
              >
                {isAr ? 'إلغاء الرقم' : 'Non classé'}
              </button>

              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setQuickRankCandidate(null)}
                  className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  {isAr ? 'إلغاء' : 'Fermer'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const parsed = parseInt(quickRankValue);
                    const finalRank = isNaN(parsed) || parsed <= 0 ? null : parsed;
                    if (onAssignRankDirect) {
                      onAssignRankDirect(quickRankCandidate.id, finalRank);
                    }
                    setQuickRankCandidate(null);
                  }}
                  className="px-3.5 py-1.5 text-xs font-bold text-white bg-emerald-700 hover:bg-emerald-800 rounded-lg shadow-xs cursor-pointer"
                >
                  {isAr ? 'تأكيد الرقم' : 'Attribuer N°'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
