import React, { useState, useRef } from 'react';
import { Candidate, DocumentStatus, DocumentItem, ExtractedDocumentData } from '../types';
import { Language, TRANSLATIONS } from '../data/translations';
import { ADMINISTRATIVE_DOCUMENTS } from '../data/documentsList';
import { getDossierCompliance, calculateAge, isYouth, formatPhoneNumber, getCleanTelUrl } from '../utils/candidateUtils';
import { processAndOptimizeImage, scanDocumentWithAI } from '../utils/documentScanner';
import { 
  processAnyDocumentFile, 
  downloadDocumentFile, 
  downloadOfficialModelWord 
} from '../utils/documentFileHandler';
import { DocumentScanModal } from './DocumentScanModal';
import { 
  X, 
  CheckCircle2, 
  Clock, 
  AlertTriangle, 
  FileText, 
  Printer, 
  ShieldCheck, 
  CheckCheck, 
  Calendar, 
  FileCheck,
  Building2,
  Landmark,
  BadgeCheck,
  User,
  Phone,
  Mail,
  MapPin,
  Sparkles,
  GraduationCap,
  Crown,
  Edit2,
  Save,
  Camera,
  Eye,
  Upload,
  Download,
  FileCode,
  Trash2,
  Copy,
  Check,
  Smartphone
} from 'lucide-react';

interface CandidateModalProps {
  candidate: Candidate | null;
  language: Language;
  onClose: () => void;
  onUpdateCandidate: (updated: Candidate) => void;
  onPrintSlip: (candidate: Candidate) => void;
}

export const CandidateModal: React.FC<CandidateModalProps> = ({
  candidate,
  language,
  onClose,
  onUpdateCandidate,
  onPrintSlip,
}) => {
  if (!candidate) return null;

  const t = TRANSLATIONS[language];
  const isAr = language === 'ar';
  const portraitInputRef = useRef<HTMLInputElement | null>(null);

  const [localCandidate, setLocalCandidate] = useState<Candidate>(candidate);
  const [editingDocKey, setEditingDocKey] = useState<string | null>(null);
  const [inspectingDoc, setInspectingDoc] = useState<DocumentItem | null>(null);
  const [isProcessingDocKey, setIsProcessingDocKey] = useState<string | null>(null);

  // Navigation Tab State for pristine mobile & desktop layout
  const [activeTab, setActiveTab] = useState<'phone' | 'documents' | 'profile' | 'compliance'>('phone');
  const [copiedNIN, setCopiedNIN] = useState(false);

  // Admin Rank editing state
  const [isEditingRank, setIsEditingRank] = useState(false);
  const [newRankInput, setNewRankInput] = useState<string>(
    localCandidate.listRank ? String(localCandidate.listRank) : ''
  );

  const comp = getDossierCompliance(localCandidate);
  const age = calculateAge(localCandidate.birthDate);
  const youth = isYouth(localCandidate.birthDate);

  const handleSaveRank = () => {
    const parsed = parseInt(newRankInput);
    const finalRank = isNaN(parsed) || parsed <= 0 ? null : parsed;
    const updatedCandidate: Candidate = {
      ...localCandidate,
      listRank: finalRank,
      assignedByAdmin: finalRank !== null,
      updatedAt: new Date().toISOString(),
    };
    setLocalCandidate(updatedCandidate);
    onUpdateCandidate(updatedCandidate);
    setIsEditingRank(false);
  };

  const handlePortraitUpload = async (file: File) => {
    try {
      const { dataUrl } = await processAndOptimizeImage(file, 800);
      const updatedCandidate: Candidate = {
        ...localCandidate,
        photoUrl: dataUrl,
        updatedAt: new Date().toISOString(),
      };
      setLocalCandidate(updatedCandidate);
      onUpdateCandidate(updatedCandidate);
    } catch (err) {
      console.error("Erreur photo portrait:", err);
    }
  };

  // Upload or photograph a scan or Word file directly for a document
  const handleUploadScanForDoc = async (docKey: string, file: File) => {
    setIsProcessingDocKey(docKey);
    try {
      const docDef = ADMINISTRATIVE_DOCUMENTS.find(d => d.key === docKey);
      const processed = await processAnyDocumentFile(file);

      // Trigger AI OCR extraction for document metadata
      let extracted: ExtractedDocumentData = {};
      try {
        const hint = `${docDef?.nameFr || ''} (${docDef?.nameAr || ''}) pour dossier électoral FLN Bologhine`;
        extracted = await scanDocumentWithAI(
          processed.fileType === 'word' ? undefined : processed.dataUrl,
          processed.mimeType,
          hint,
          processed.rawText
        );
      } catch (ocrErr) {
        console.warn("OCR failed, continuing with file upload:", ocrErr);
      }

      const existingDoc = localCandidate.documents[docKey];
      const updatedDoc: DocumentItem = {
        id: existingDoc?.id || `${docKey}-${Date.now()}`,
        key: docKey,
        nameFr: existingDoc?.nameFr || docDef?.nameFr || '',
        nameAr: existingDoc?.nameAr || docDef?.nameAr || '',
        status: 'conforme',
        conforme: true,
        issueDate: extracted.issueDate || existingDoc?.issueDate || new Date().toISOString().slice(0, 10),
        referenceNumber: extracted.referenceNumber || existingDoc?.referenceNumber,
        notes: extracted.confidenceNotes || (processed.fileType === 'word' ? 'Document Word (.docx/.doc) joint et conforme' : 'Document numérisé et conforme'),
        fileDataUrl: processed.dataUrl,
        fileName: processed.fileName,
        fileType: processed.fileType,
        fileSize: processed.fileSize,
        scannedAt: new Date().toISOString(),
        extractedData: extracted,
      };

      const updatedDocs = {
        ...localCandidate.documents,
        [docKey]: updatedDoc,
      };

      // Also update candidate NIN or birthDate if extracted and currently missing
      const updatedCandidate: Candidate = {
        ...localCandidate,
        nationalIdNumber: localCandidate.nationalIdNumber || extracted.nationalIdNumber || '',
        birthDate: localCandidate.birthDate || (docKey === 'birth_certificate' ? extracted.birthDate : undefined) || localCandidate.birthDate,
        birthPlace: localCandidate.birthPlace || (docKey === 'birth_certificate' ? extracted.birthPlace : undefined) || localCandidate.birthPlace,
        documents: updatedDocs,
        updatedAt: new Date().toISOString(),
      };

      setLocalCandidate(updatedCandidate);
      onUpdateCandidate(updatedCandidate);
    } catch (err) {
      console.error("Erreur téléchargement document:", err);
    } finally {
      setIsProcessingDocKey(null);
    }
  };

  // Toggle single document conformity
  const handleToggleDocStatus = (docKey: string, newStatus: DocumentStatus) => {
    const isConforme = newStatus === 'conforme';
    const updatedDocs = {
      ...localCandidate.documents,
      [docKey]: {
        ...(localCandidate.documents[docKey] || {
          id: `${docKey}-${Date.now()}`,
          key: docKey,
          nameFr: '',
          nameAr: '',
        }),
        status: newStatus,
        conforme: isConforme,
        issueDate: isConforme ? (localCandidate.documents[docKey]?.issueDate || new Date().toISOString().slice(0, 10)) : localCandidate.documents[docKey]?.issueDate,
        notes: isConforme ? 'Document vérifié et conforme' : newStatus === 'non_conforme' ? 'Document non conforme ou rejeté' : 'En cours de délivrance',
      },
    };

    const updatedCandidate: Candidate = {
      ...localCandidate,
      documents: updatedDocs,
      updatedAt: new Date().toISOString(),
    };

    setLocalCandidate(updatedCandidate);
    onUpdateCandidate(updatedCandidate);
  };

  // Mark all 11 documents as conforme
  const handleMarkAllConforme = () => {
    const updatedDocs = { ...localCandidate.documents };
    for (const docDef of ADMINISTRATIVE_DOCUMENTS) {
      updatedDocs[docDef.key] = {
        ...(updatedDocs[docDef.key] || {
          id: `${docDef.key}-${Date.now()}`,
          key: docDef.key,
          nameFr: docDef.nameFr,
          nameAr: docDef.nameAr,
        }),
        status: 'conforme',
        conforme: true,
        issueDate: updatedDocs[docDef.key]?.issueDate || new Date().toISOString().slice(0, 10),
        notes: 'Document vérifié et conforme par la commission de Kasma',
      };
    }

    const updatedCandidate: Candidate = {
      ...localCandidate,
      documents: updatedDocs,
      dossierStatus: 'complet',
      updatedAt: new Date().toISOString(),
    };

    setLocalCandidate(updatedCandidate);
    onUpdateCandidate(updatedCandidate);
  };

  // When AI scan modal applies data
  const handleModalExtractedData = (extracted: ExtractedDocumentData) => {
    if (!inspectingDoc) return;
    const docKey = inspectingDoc.key;

    const updatedDoc: DocumentItem = {
      ...inspectingDoc,
      issueDate: extracted.issueDate || inspectingDoc.issueDate,
      referenceNumber: extracted.referenceNumber || inspectingDoc.referenceNumber,
      status: 'conforme',
      conforme: true,
      extractedData: extracted,
    };

    const updatedCandidate: Candidate = {
      ...localCandidate,
      lastNameFr: extracted.lastNameFr || localCandidate.lastNameFr,
      firstNameFr: extracted.firstNameFr || localCandidate.firstNameFr,
      lastNameAr: extracted.lastNameAr || localCandidate.lastNameAr,
      firstNameAr: extracted.firstNameAr || localCandidate.firstNameAr,
      nationalIdNumber: extracted.nationalIdNumber || localCandidate.nationalIdNumber,
      birthDate: extracted.birthDate || localCandidate.birthDate,
      birthPlace: extracted.birthPlace || localCandidate.birthPlace,
      profession: extracted.profession || localCandidate.profession,
      documents: {
        ...localCandidate.documents,
        [docKey]: updatedDoc,
      },
      updatedAt: new Date().toISOString(),
    };

    setLocalCandidate(updatedCandidate);
    onUpdateCandidate(updatedCandidate);
  };

  // Update notes or reference for a doc
  const handleSaveDocDetails = (docKey: string, issueDate: string, notes: string, referenceNumber: string) => {
    const current = localCandidate.documents[docKey];
    if (!current) return;

    const updatedDocs = {
      ...localCandidate.documents,
      [docKey]: {
        ...current,
        issueDate,
        notes,
        referenceNumber,
      },
    };

    const updatedCandidate: Candidate = {
      ...localCandidate,
      documents: updatedDocs,
      updatedAt: new Date().toISOString(),
    };

    setLocalCandidate(updatedCandidate);
    onUpdateCandidate(updatedCandidate);
    setEditingDocKey(null);
  };

  const handleCopyNIN = (nin: string) => {
    if (!nin) return;
    try {
      navigator.clipboard.writeText(nin);
      setCopiedNIN(true);
      setTimeout(() => setCopiedNIN(false), 2000);
    } catch (_) {}
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-0 sm:p-4 bg-slate-950/70 backdrop-blur-xs overflow-hidden">
      <div 
        className="bg-white w-full h-[100dvh] sm:h-auto sm:max-h-[92vh] sm:max-w-4xl sm:rounded-2xl shadow-2xl border border-slate-200 flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200"
        onClick={e => e.stopPropagation()}
      >
        {/* Header - Optimized for Phone & Desktop */}
        <div className="p-3 sm:p-4 border-b border-slate-200 bg-slate-50/90 shrink-0">
          <div className="flex items-start justify-between gap-2.5">
            <div className="flex items-start gap-3 min-w-0">
              {/* Candidate Portrait Avatar */}
              <div className="relative group shrink-0 mt-0.5">
                {localCandidate.photoUrl ? (
                  <img
                    src={localCandidate.photoUrl}
                    alt={`${localCandidate.lastNameFr} ${localCandidate.firstNameFr}`}
                    className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl object-cover border-2 border-emerald-600 shadow-xs"
                  />
                ) : (
                  <div className={`w-12 h-12 sm:w-14 sm:h-14 rounded-xl flex items-center justify-center text-base sm:text-lg font-bold shadow-xs ${
                    localCandidate.gender === 'F' ? 'bg-rose-100 text-rose-800' : 'bg-emerald-100 text-emerald-800'
                  }`}>
                    {localCandidate.firstNameFr.charAt(0)}{localCandidate.lastNameFr.charAt(0)}
                  </div>
                )}
                <button
                  type="button"
                  onClick={() => portraitInputRef.current?.click()}
                  className="absolute -bottom-1 -right-1 p-1 rounded-full bg-emerald-700 hover:bg-emerald-800 text-white shadow cursor-pointer transition-transform hover:scale-110"
                  title="Photographier ou changer la photo d'identité"
                >
                  <Camera className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                </button>
                <input
                  ref={portraitInputRef}
                  type="file"
                  accept="image/*"
                  capture="user"
                  onChange={e => {
                    const f = e.target.files?.[0];
                    if (f) handlePortraitUpload(f);
                  }}
                  className="hidden"
                />
              </div>

              {/* Names & Main Badges */}
              <div className="min-w-0">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold ${
                    localCandidate.council === 'APC' ? 'bg-emerald-100 text-emerald-800' : 'bg-indigo-100 text-indigo-800'
                  }`}>
                    {localCandidate.council === 'APC' ? <Building2 className="w-3 h-3" /> : <Landmark className="w-3 h-3" />}
                    <span>{localCandidate.council} {localCandidate.council === 'APC' ? (isAr ? 'بولوغين' : 'Bologhine') : (isAr ? 'الجزائر' : 'Alger')}</span>
                  </span>

                  {/* Official Rank Badge / Quick Edit */}
                  {isEditingRank ? (
                    <div className="flex items-center gap-1 bg-amber-50 px-1.5 py-0.5 rounded-lg border border-amber-300">
                      <input
                        type="number"
                        min={1}
                        max={99}
                        value={newRankInput}
                        onChange={e => setNewRankInput(e.target.value)}
                        placeholder="N°"
                        className="w-11 px-1 py-0.2 text-xs font-bold bg-white border border-amber-400 rounded text-center"
                        autoFocus
                      />
                      <button
                        onClick={handleSaveRank}
                        className="p-1 bg-emerald-700 text-white rounded hover:bg-emerald-800 cursor-pointer"
                        title="Enregistrer"
                      >
                        <Save className="w-3 h-3" />
                      </button>
                      <button
                        onClick={() => setIsEditingRank(false)}
                        className="p-1 text-slate-500 hover:text-slate-700 cursor-pointer"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => {
                        setNewRankInput(localCandidate.listRank ? String(localCandidate.listRank) : '');
                        setIsEditingRank(true);
                      }}
                      className={`inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full border shadow-2xs transition-colors cursor-pointer ${
                        localCandidate.listRank === 1
                          ? 'bg-amber-100 text-amber-950 border-amber-400'
                          : localCandidate.listRank !== null
                          ? 'bg-white text-slate-800 border-slate-300'
                          : 'bg-amber-50 text-amber-800 border-amber-300'
                      }`}
                      title={isAr ? 'انقر لتعديل الترتيب' : 'Cliquer pour modifier le rang'}
                    >
                      {localCandidate.listRank === 1 && <Crown className="w-3 h-3 text-amber-700" />}
                      <span>
                        {localCandidate.listRank !== null
                          ? `N° ${localCandidate.listRank}`
                          : (isAr ? 'بدون رقم' : 'Non classé')}
                      </span>
                      {localCandidate.listRank === 1 && (
                        <span className="text-[10px] text-amber-800 font-extrabold hidden xs:inline">
                          ({isAr ? 'المتصدر' : 'Tête'})
                        </span>
                      )}
                    </button>
                  )}
                </div>

                <h2 className="text-sm sm:text-base font-bold text-slate-900 mt-0.5 leading-snug truncate">
                  {localCandidate.lastNameFr} {localCandidate.firstNameFr}
                  <span className="text-slate-500 font-arabic font-normal text-xs sm:text-sm ml-1.5">
                    ({localCandidate.lastNameAr} {localCandidate.firstNameAr})
                  </span>
                </h2>

                <p className="text-[11px] text-slate-500 flex items-center gap-1.5 flex-wrap">
                  <span>{localCandidate.profession || 'Sans profession'}</span>
                  <span>•</span>
                  <span>{age} {isAr ? 'سنة' : 'ans'}</span>
                  <span>•</span>
                  <span className="flex items-center gap-0.5">
                    <MapPin className="w-2.5 h-2.5 text-emerald-700" />
                    {localCandidate.addressNeighborhood}
                  </span>
                  {localCandidate.phoneNumber && (
                    <>
                      <span>•</span>
                      <a
                        href={getCleanTelUrl(localCandidate.phoneNumber)}
                        className="font-bold text-emerald-800 hover:text-emerald-950 hover:underline inline-flex items-center gap-0.5 font-mono"
                        title={isAr ? 'اتصال مباشر من الهاتف' : 'Appeler directement'}
                      >
                        <Phone className="w-2.5 h-2.5 text-emerald-700" />
                        <span>{formatPhoneNumber(localCandidate.phoneNumber)}</span>
                      </a>
                    </>
                  )}
                </p>
              </div>
            </div>

            {/* Actions: Print Slip & Close Button */}
            <div className="flex items-center gap-1.5 shrink-0">
              <button
                type="button"
                onClick={() => onPrintSlip(localCandidate)}
                className="inline-flex items-center gap-1 px-2 sm:px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 transition-colors cursor-pointer"
                title={t.printOfficialSlip}
              >
                <Printer className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">{t.printOfficialSlip}</span>
              </button>

              <button
                type="button"
                onClick={onClose}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/70 transition-colors cursor-pointer"
                aria-label="Fermer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>

        {/* Tab Navigation Bar (Sticky and Scrollable on Phone) */}
        <div className="flex border-b border-slate-200 bg-slate-100/80 px-2 sm:px-4 shrink-0 overflow-x-auto no-scrollbar gap-1">
          <button
            type="button"
            onClick={() => setActiveTab('phone')}
            className={`flex items-center gap-1.5 py-2.5 px-3 border-b-2 text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
              activeTab === 'phone'
                ? 'border-emerald-700 text-emerald-800 bg-white shadow-2xs rounded-t-lg'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <Smartphone className="w-3.5 h-3.5 text-emerald-700" />
            <span>{isAr ? 'عرض الهاتف (9 محاور)' : 'Mise en page Phone (9 axes)'}</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('documents')}
            className={`flex items-center gap-1.5 py-2.5 px-3 border-b-2 text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
              activeTab === 'documents'
                ? 'border-emerald-700 text-emerald-800 bg-white shadow-2xs rounded-t-lg'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <FileCheck className="w-3.5 h-3.5 text-emerald-700" />
            <span>{isAr ? 'الـ 11 وثيقة الإدارية' : '11 Pièces administratives'}</span>
            <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-black ${
              comp.isComplete ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
            }`}>
              {comp.conformeCount}/11
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('profile')}
            className={`flex items-center gap-1.5 py-2.5 px-3 border-b-2 text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
              activeTab === 'profile'
                ? 'border-emerald-700 text-emerald-800 bg-white shadow-2xs rounded-t-lg'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <User className="w-3.5 h-3.5 text-emerald-700" />
            <span>{isAr ? 'بيانات المترشح والـ NIN' : 'Fiche & Informations'}</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('compliance')}
            className={`flex items-center gap-1.5 py-2.5 px-3 border-b-2 text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
              activeTab === 'compliance'
                ? 'border-emerald-700 text-emerald-800 bg-white shadow-2xs rounded-t-lg'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-700" />
            <span>{isAr ? 'مطابقة ANIE والقوانين' : 'Conformité & Quotas'}</span>
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-3 sm:p-5 space-y-4">

          {/* TAB 0: 8-SECTION PHONE-OPTIMIZED VIEW ("Mise en page Phone") */}
          {activeTab === 'phone' && (
            <div className="space-y-3.5 animate-in fade-in duration-150">
              
              {/* Header banner */}
              <div className="bg-gradient-to-r from-emerald-800 to-emerald-950 rounded-2xl p-3.5 text-white shadow-sm flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 bg-white/10 rounded-xl shrink-0">
                    <Smartphone className="w-5 h-5 text-emerald-300" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold leading-tight">
                      {isAr ? 'عرض ملف المترشح (النموذج الإداري - 9 محاور)' : 'Fiche Dossier Candidat (Mise en page Phone - 9 Axes)'}
                    </h3>
                    <p className="text-[11px] text-emerald-200 mt-0.5">
                      {isAr ? 'مستوفٍ لمعايير الرقمنة والاتصال المباشر لبلدية بولوغين' : 'Optimisé pour consultation sur smartphone et appel direct'}
                    </p>
                  </div>
                </div>
                <span className="text-[11px] font-bold bg-emerald-700/80 text-emerald-100 px-3 py-1 rounded-full border border-emerald-500 shrink-0">
                  {localCandidate.council === 'APC' ? (isAr ? 'مجلس بلدي APC' : 'APC Bologhine') : (isAr ? 'مجلس ولائي APW' : 'APW Alger')}
                </span>
              </div>

              {/* Structured Candidate Card */}
              <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden divide-y divide-slate-100">
                
                {/* Rubrique Candidat: Mise en page épurée sans "1. رقم الإدارة (ممنوح)" avec N° officiel à droite */}
                <div className="p-4 bg-slate-50/70 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    
                    {/* Numéro officiel du candidat à droite (Right side / Start in RTL) */}
                    <div className="shrink-0 flex flex-col items-center">
                      {localCandidate.listRank ? (
                        <div className={`min-w-[44px] h-[50px] px-2 rounded-xl flex flex-col items-center justify-center font-black shadow-xs border ${
                          localCandidate.listRank === 1
                            ? 'bg-amber-400 text-amber-950 border-amber-500 ring-2 ring-amber-200'
                            : 'bg-emerald-700 text-white border-emerald-800'
                        }`}>
                          {localCandidate.listRank === 1 ? (
                            <>
                              <Crown className="w-3.5 h-3.5 text-amber-950" />
                              <span className="text-xs font-black font-mono leading-none">01</span>
                              <span className="text-[7.5px] font-bold leading-tight mt-0.5">{isAr ? 'متصدر' : 'Tête'}</span>
                            </>
                          ) : (
                            <>
                              <span className="text-[8px] font-bold text-emerald-200 leading-none">N°</span>
                              <span className="text-base font-black font-mono leading-tight">{String(localCandidate.listRank).padStart(2, '0')}</span>
                            </>
                          )}
                        </div>
                      ) : (
                        <div className="min-w-[44px] h-[50px] px-2 rounded-xl flex flex-col items-center justify-center font-semibold text-slate-400 bg-slate-100 border border-dashed border-slate-300 shadow-2xs">
                          <span className="text-xs font-mono font-bold">--</span>
                          <span className="text-[8px] font-bold leading-none mt-0.5">{isAr ? 'بدون رقم' : 'Sans N°'}</span>
                        </div>
                      )}
                    </div>

                    {/* Photo / Avatar */}
                    <div className="relative shrink-0">
                      {localCandidate.photoUrl ? (
                        <img
                          src={localCandidate.photoUrl}
                          alt=""
                          className="w-14 h-14 rounded-full object-cover border-2 border-emerald-600 shadow-xs"
                        />
                      ) : (
                        <div className={`w-14 h-14 rounded-full flex items-center justify-center font-bold text-base shadow-xs border ${
                          localCandidate.gender === 'F'
                            ? 'bg-rose-100 text-rose-800 border-rose-300'
                            : 'bg-emerald-100 text-emerald-900 border-emerald-300'
                        }`}>
                          {localCandidate.firstNameFr.charAt(0)}{localCandidate.lastNameFr.charAt(0)}
                        </div>
                      )}
                    </div>

                    {/* Candidate Details */}
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <h3 className="font-bold text-slate-900 text-base sm:text-lg font-arabic leading-tight">
                          {localCandidate.lastNameAr} {localCandidate.firstNameAr}
                        </h3>
                      </div>
                      <p className="text-xs text-slate-600 font-semibold uppercase tracking-wider mt-0.5">
                        {localCandidate.lastNameFr} {localCandidate.firstNameFr}
                      </p>
                      <div className="flex items-center gap-2 text-xs text-slate-500 mt-1 flex-wrap">
                        <span className="font-medium text-slate-700">{age} {isAr ? 'سنة' : 'ans'}</span>
                        <span>•</span>
                        <span>{localCandidate.gender === 'F' ? (isAr ? 'أنثى' : 'Femme') : (isAr ? 'ذكر' : 'Homme')}</span>
                        {youth && (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-800 bg-amber-100 px-1.5 py-0.5 rounded border border-amber-200">
                            <Sparkles className="w-2.5 h-2.5 text-amber-600" />
                            <span>{isAr ? 'شاب (< 35)' : 'Jeune'}</span>
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Actions de rang & المجلس */}
                  <div className="shrink-0 flex items-center gap-2 self-start sm:self-auto flex-wrap">
                    {/* In-place rank modification */}
                    {isEditingRank ? (
                      <div className="flex items-center gap-1.5 bg-white p-1 rounded-lg border border-amber-300 shadow-xs">
                        <input
                          type="number"
                          min="1"
                          max="99"
                          value={newRankInput}
                          onChange={e => setNewRankInput(e.target.value)}
                          placeholder="N°"
                          className="w-14 px-2 py-1 text-xs font-bold border border-slate-300 rounded text-center focus:ring-1 focus:ring-amber-500 outline-none"
                        />
                        <button
                          type="button"
                          onClick={handleSaveRank}
                          className="px-2.5 py-1 bg-emerald-700 hover:bg-emerald-800 text-white rounded text-xs font-bold transition-colors cursor-pointer"
                        >
                          {isAr ? 'حفظ' : 'OK'}
                        </button>
                        <button
                          type="button"
                          onClick={() => setIsEditingRank(false)}
                          className="px-2 py-1 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded text-xs font-bold transition-colors cursor-pointer"
                        >
                          ✕
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => {
                          setNewRankInput(localCandidate.listRank ? String(localCandidate.listRank) : '');
                          setIsEditingRank(true);
                        }}
                        className="px-2.5 py-1.5 rounded-xl text-xs font-bold bg-white hover:bg-amber-100 text-amber-900 border border-amber-300 shadow-2xs transition-all active:scale-95 cursor-pointer flex items-center gap-1"
                        title={isAr ? 'تعيين أو تعديل رقم الترتيب الرسمي للإدارة' : 'Modifier le numéro officiel'}
                      >
                        <ShieldCheck className="w-3.5 h-3.5 text-amber-700" />
                        <span>{localCandidate.listRank ? (isAr ? 'تعديل الرقم' : 'Modifier N°') : (isAr ? '+ تعيين رقم' : '+ N°')}</span>
                      </button>
                    )}

                    {/* المجلس */}
                    <div className="p-2.5 bg-emerald-100/80 text-emerald-950 rounded-xl border border-emerald-300 flex items-center gap-2">
                      {localCandidate.council === 'APC' ? <Building2 className="w-4 h-4 text-emerald-700" /> : <Landmark className="w-4 h-4 text-indigo-700" />}
                      <div>
                        <span className="text-[9px] font-bold text-slate-500 block uppercase">
                          {isAr ? 'المجلس المرشح له' : 'Conseil'}
                        </span>
                        <span className="font-bold text-xs text-emerald-950">
                          {localCandidate.council === 'APC' 
                            ? (isAr ? 'المجلس البلدي (بولوغين)' : 'APC Bologhine') 
                            : (isAr ? 'المجلس الولائي (الجزائر)' : 'APW Alger')}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 4. الحي والاتصال, 5. المهنة والمستوى, 6. نضال FLN */}
                <div className="p-4 grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs bg-white">
                  
                  {/* 4. الحي والاتصال */}
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/90 space-y-2">
                    <div className="flex items-center gap-1.5 font-bold text-slate-800 border-b border-slate-200 pb-1">
                      <MapPin className="w-3.5 h-3.5 text-emerald-600" />
                      <span>{isAr ? '4. الحي والاتصال' : '4. Quartier & Contact'}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 text-[10px] block uppercase font-bold">{isAr ? 'حي الإقامة ببولوغين:' : 'Quartier :'}</span>
                      <span className="font-semibold text-slate-800 text-xs">{localCandidate.addressNeighborhood || 'بولوغين'}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 text-[10px] block uppercase font-bold">{isAr ? 'رقم الهاتف المباشر:' : 'Téléphone direct :'}</span>
                      {localCandidate.phoneNumber ? (
                        <a
                          href={getCleanTelUrl(localCandidate.phoneNumber)}
                          className="mt-0.5 inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-emerald-50 text-emerald-900 border border-emerald-300 font-mono font-bold text-xs hover:bg-emerald-100 transition-colors"
                          title={isAr ? 'انقر للاتصال المباشر من الهاتف' : 'Appeler directement'}
                        >
                          <Phone className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
                          <span>{formatPhoneNumber(localCandidate.phoneNumber)}</span>
                        </a>
                      ) : (
                        <span className="text-slate-400 italic text-[11px]">{isAr ? 'غير مسجل' : 'Non renseigné'}</span>
                      )}
                    </div>
                    {localCandidate.email && (
                      <div>
                        <span className="text-slate-400 text-[10px] block uppercase font-bold">{isAr ? 'البريد الإلكتروني:' : 'E-mail :'}</span>
                        <a href={`mailto:${localCandidate.email}`} className="text-blue-700 hover:underline truncate block text-[11px]">
                          {localCandidate.email}
                        </a>
                      </div>
                    )}
                  </div>

                  {/* 5. المهنة والمستوى */}
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/90 space-y-2">
                    <div className="flex items-center gap-1.5 font-bold text-slate-800 border-b border-slate-200 pb-1">
                      <GraduationCap className="w-3.5 h-3.5 text-blue-600" />
                      <span>{isAr ? '5. المهنة والمستوى' : '5. Profession & Diplôme'}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 text-[10px] block uppercase font-bold">{isAr ? 'المهنة أو الوظيفة:' : 'Profession :'}</span>
                      <span className="font-bold text-slate-800 truncate block text-xs">{localCandidate.profession || 'Sans profession'}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 text-[10px] block uppercase font-bold">{isAr ? 'المستوى الدراسي:' : 'Niveau :'}</span>
                      <span className="font-medium text-slate-700 text-xs">{localCandidate.educationLevel}</span>
                      {localCandidate.isUniversityGraduate && (
                        <span className="mt-1 inline-block text-[10px] font-bold text-blue-900 bg-blue-100 px-1.5 py-0.5 rounded border border-blue-200">
                          {isAr ? 'إطار جامعي (شرط الـ 33%)' : 'Diplômé supérieur (Quota 33%)'}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* 6. نضال FLN */}
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/90 space-y-2">
                    <div className="flex items-center gap-1.5 font-bold text-slate-800 border-b border-slate-200 pb-1">
                      <BadgeCheck className="w-3.5 h-3.5 text-emerald-700" />
                      <span>{isAr ? '6. نضال FLN' : '6. Militantisme FLN'}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400 text-[10px] uppercase font-bold">{isAr ? 'رقم البطاقة:' : 'N° Carte :'}</span>
                      <span className="font-mono font-bold text-emerald-950 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200 text-xs">
                        {localCandidate.partyMembershipNumber}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-400 text-[10px] uppercase font-bold">{isAr ? 'سنة الانخراط:' : 'Adhésion :'}</span>
                      <span className="font-semibold text-slate-800">
                        {isAr ? `منذ ${localCandidate.partyJoinYear}` : `Depuis ${localCandidate.partyJoinYear}`}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 text-[10px] block uppercase font-bold">{isAr ? 'الصفة في القسمة:' : 'Rôle Kasma :'}</span>
                      <span className="text-[11px] text-slate-700 font-medium truncate block">{localCandidate.partyRole}</span>
                    </div>
                  </div>
                </div>

                {/* 7. الوثائق الـ 11 (مطابقة إدارية) + 8. حالة الملف */}
                <div className="p-4 bg-white space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <FileText className="w-4 h-4 text-slate-600" />
                      <span className="font-bold text-xs text-slate-800">
                        {isAr ? '7. الوثائق الـ 11 (مطابقة إدارية)' : '7. Les 11 Pièces Administratives (Conformité)'}
                      </span>
                    </div>

                    {/* 8. حالة الملف */}
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] text-slate-500 font-medium">
                        {isAr ? '8. حالة الملف:' : '8. Statut du dossier :'}
                      </span>
                      <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-extrabold ${
                        comp.isComplete
                          ? 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                          : 'bg-amber-100 text-amber-900 border border-amber-300'
                      }`}>
                        {comp.isComplete ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> : <Clock className="w-3.5 h-3.5 text-amber-600" />}
                        <span>{comp.conformeCount} / 11 ({comp.percentage}%) • {comp.isComplete ? (isAr ? 'جاهز 100%' : 'Complet') : (isAr ? 'قيد الاستكمال' : 'En cours')}</span>
                      </span>
                    </div>
                  </div>

                  {/* 11 Document status pill bar (Responsive with 11 pills) */}
                  <div className="grid grid-cols-6 sm:grid-cols-11 gap-1.5 py-1">
                    {ADMINISTRATIVE_DOCUMENTS.map((docDef, idx) => {
                      const doc = localCandidate.documents?.[docDef.key];
                      const isDocConforme = doc?.status === 'conforme' || doc?.conforme === true;
                      const isDocNonConforme = doc?.status === 'non_conforme';

                      return (
                        <button
                          key={docDef.key}
                          type="button"
                          onClick={() => {
                            setEditingDocKey(docDef.key);
                            setActiveTab('documents');
                          }}
                          title={`${idx + 1}. ${docDef.nameAr} (${docDef.nameFr}): ${
                            isDocConforme ? 'مطابق ومقبول' : isDocNonConforme ? 'غير مطابق' : 'قيد الانتظار'
                          } - انقر للتدقيق`}
                          className={`h-8 rounded-lg flex items-center justify-center text-xs font-extrabold transition-all shadow-2xs cursor-pointer hover:scale-105 active:scale-95 ${
                            isDocConforme
                              ? 'bg-emerald-600 text-white hover:bg-emerald-700'
                              : isDocNonConforme
                              ? 'bg-rose-600 text-white hover:bg-rose-700'
                              : 'bg-amber-300 text-amber-950 border border-amber-400 hover:bg-amber-400'
                          }`}
                        >
                          {idx + 1}
                        </button>
                      );
                    })}
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-slate-500">
                    <span>{isAr ? 'الأرقام 1 إلى 11 تمثل الوثائق الرسمية القانونية • انقر على أي رقم لفتحه' : 'Cliquez sur un numéro pour ouvrir la pièce correspondante'}</span>
                    <button
                      type="button"
                      onClick={() => setActiveTab('documents')}
                      className="text-emerald-700 font-bold hover:underline inline-flex items-center gap-1"
                    >
                      <span>{isAr ? 'عرض وتدقيق كل الوثائق' : 'Examiner les 11 pièces'}</span>
                      <FileCheck className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* 9. الإجراءات */}
                <div className="p-3.5 bg-slate-50 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <span className="text-[11px] font-bold text-slate-600 uppercase">
                    {isAr ? '9. الإجراءات الإدارية المباشرة:' : '9. Actions Administratives :'}
                  </span>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 w-full sm:w-auto">
                    <button
                      type="button"
                      onClick={() => onPrintSlip(localCandidate)}
                      className="py-2.5 px-3 rounded-xl bg-blue-700 hover:bg-blue-800 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-xs transition-all active:scale-95 cursor-pointer min-h-[44px]"
                    >
                      <Printer className="w-4 h-4" />
                      <span>{isAr ? 'طباعة استمارة الإيداع' : 'Imprimer Bordereau'}</span>
                    </button>

                    <button
                      type="button"
                      onClick={handleMarkAllConforme}
                      className="py-2.5 px-3 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-xs transition-all active:scale-95 cursor-pointer min-h-[44px]"
                    >
                      <CheckCheck className="w-4 h-4" />
                      <span>{isAr ? 'مطابقة كافة الـ 11 وثيقة' : 'Valider les 11 pièces'}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setActiveTab('profile')}
                      className="py-2.5 px-3 rounded-xl bg-white hover:bg-slate-100 text-slate-800 border border-slate-300 font-bold text-xs flex items-center justify-center gap-1.5 transition-all active:scale-95 cursor-pointer min-h-[44px]"
                    >
                      <User className="w-4 h-4 text-slate-600" />
                      <span>{isAr ? 'بيانات الهوية والـ NIN' : 'Fiche Détaillée & NIN'}</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 1: 11 PIÈCES ADMINISTRATIVES (MAIN AUDIT) */}
          {activeTab === 'documents' && (
            <div className="space-y-3 animate-in fade-in duration-150">
              
              {/* Quick Compliance Status Banner */}
              <div className="bg-gradient-to-r from-emerald-50/70 to-slate-50 rounded-xl p-3 border border-emerald-200/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-800">
                      {isAr ? 'نسبة اكتمال الملف:' : 'Taux de conformité :'}
                    </span>
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold ${
                      comp.isComplete ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                    }`}>
                      {comp.isComplete ? <CheckCircle2 className="w-3.5 h-3.5" /> : <Clock className="w-3.5 h-3.5" />}
                      <span>{comp.conformeCount} / 11 {isAr ? 'وثائق' : 'pièces'} ({comp.percentage}%)</span>
                    </span>
                  </div>
                  {/* Progress bar */}
                  <div className="w-full bg-slate-200 rounded-full h-2 mt-2 overflow-hidden">
                    <div 
                      className={`h-full transition-all duration-300 rounded-full ${
                        comp.isComplete ? 'bg-emerald-600' : 'bg-amber-500'
                      }`}
                      style={{ width: `${comp.percentage}%` }}
                    />
                  </div>
                </div>

                {!comp.isComplete && (
                  <button
                    type="button"
                    onClick={handleMarkAllConforme}
                    className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-emerald-700 hover:bg-emerald-800 text-white shadow-2xs transition-colors cursor-pointer shrink-0"
                  >
                    <CheckCheck className="w-3.5 h-3.5" />
                    <span>{t.markAllConforme}</span>
                  </button>
                )}
              </div>

              {/* Documents List */}
              <div className="space-y-3">
                {ADMINISTRATIVE_DOCUMENTS.map((docDef, index) => {
                  const userDoc = localCandidate.documents?.[docDef.key];
                  const isConforme = userDoc?.status === 'conforme' || userDoc?.conforme === true;
                  const isNonConforme = userDoc?.status === 'non_conforme';
                  const isPending = !isConforme && !isNonConforme;

                  return (
                    <div
                      key={docDef.key}
                      className={`rounded-xl border transition-all p-3 sm:p-4 ${
                        isConforme 
                          ? 'bg-white border-emerald-200 shadow-2xs ring-1 ring-emerald-500/10' 
                          : isNonConforme
                          ? 'bg-rose-50/40 border-rose-200'
                          : 'bg-amber-50/30 border-amber-200'
                      }`}
                    >
                      {/* Card Header: Doc Number, Names, Status Pill */}
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-start gap-2.5 min-w-0">
                          <span className={`w-6 h-6 sm:w-7 sm:h-7 rounded-lg flex items-center justify-center text-xs font-black shrink-0 mt-0.5 ${
                            isConforme 
                              ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' 
                              : isNonConforme
                              ? 'bg-rose-100 text-rose-800 border border-rose-300'
                              : 'bg-amber-100 text-amber-800 border border-amber-300'
                          }`}>
                            {index + 1}
                          </span>

                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <h4 className="text-xs sm:text-sm font-bold text-slate-900 leading-snug">
                                {docDef.nameFr}
                              </h4>
                              <span className="text-xs text-slate-500 font-arabic font-normal">
                                ({docDef.nameAr})
                              </span>
                              {docDef.criticality === 'critical' && (
                                <span className="text-[10px] font-bold text-rose-700 bg-rose-50 border border-rose-200 px-1.5 py-0.2 rounded">
                                  {isAr ? 'إجباري' : 'Obligatoire'}
                                </span>
                              )}
                            </div>

                            <p className="text-[11px] text-slate-500 mt-0.5 leading-relaxed">
                              {isAr ? docDef.descriptionAr : docDef.descriptionFr}
                            </p>

                            <div className="flex items-center gap-2 mt-1 text-[10px] sm:text-[11px] text-slate-400 flex-wrap">
                              <span>{isAr ? 'الصلاحية:' : 'Validité :'} {isAr ? docDef.validityAr : docDef.validityFr}</span>
                              {userDoc?.issueDate && (
                                <>
                                  <span>•</span>
                                  <span className="text-slate-600 font-semibold">{isAr ? 'تاريخ:' : 'Délivré le :'} {userDoc.issueDate}</span>
                                </>
                              )}
                              {userDoc?.notes && (
                                <>
                                  <span>•</span>
                                  <span className="text-slate-600 italic truncate max-w-[180px] sm:max-w-xs">
                                    "{userDoc.notes}"
                                  </span>
                                </>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Top-Right Status Pill on Mobile */}
                        <div className="shrink-0">
                          {isConforme ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] sm:text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                              <span>{isAr ? 'مطابق' : 'Conforme'}</span>
                            </span>
                          ) : isNonConforme ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] sm:text-xs font-bold bg-rose-100 text-rose-800 border border-rose-300">
                              <AlertTriangle className="w-3 h-3 text-rose-600" />
                              <span>{isAr ? 'مرفوض' : 'Rejeté'}</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] sm:text-xs font-bold bg-amber-100 text-amber-800 border border-amber-300">
                              <Clock className="w-3 h-3 text-amber-600" />
                              <span>{isAr ? 'في الانتظار' : 'En attente'}</span>
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Attached File Banner (If document has scan or Word file attached) */}
                      {userDoc?.fileDataUrl && (
                        <div className="mt-2.5 p-2 rounded-lg bg-emerald-50/80 border border-emerald-200 flex items-center justify-between gap-2 text-xs">
                          <div className="flex items-center gap-2 min-w-0">
                            {userDoc.fileType === 'word' || userDoc.fileName?.endsWith('.doc') || userDoc.fileName?.endsWith('.docx') ? (
                              <span className="px-1.5 py-0.5 rounded bg-blue-700 text-white text-[10px] font-black shrink-0 flex items-center gap-1">
                                <FileCode className="w-3 h-3" /> DOCX
                              </span>
                            ) : userDoc.fileType === 'pdf' || userDoc.fileName?.endsWith('.pdf') ? (
                              <span className="px-1.5 py-0.5 rounded bg-rose-700 text-white text-[10px] font-black shrink-0 flex items-center gap-1">
                                PDF
                              </span>
                            ) : (
                              <img
                                src={userDoc.fileDataUrl}
                                alt="Scan"
                                className="w-7 h-7 rounded object-cover border border-emerald-500 shrink-0 cursor-pointer shadow-2xs"
                                onClick={() => setInspectingDoc(userDoc)}
                              />
                            )}
                            <div className="min-w-0">
                              <p className="text-[11px] font-bold text-slate-800 truncate">
                                {userDoc.fileName || `${docDef.nameFr}.doc`}
                              </p>
                              <span className="text-[10px] text-emerald-700 font-medium block">
                                {isAr ? 'وثيقة مرفقة بالملف' : 'Document joint au dossier'}
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center gap-1 shrink-0">
                            <button
                              type="button"
                              onClick={() => {
                                if (userDoc.fileType === 'word' || userDoc.fileName?.endsWith('.doc') || userDoc.fileName?.endsWith('.docx')) {
                                  downloadDocumentFile(userDoc.fileDataUrl!, userDoc.fileName || `${docDef.key}.doc`);
                                } else {
                                  setInspectingDoc(userDoc);
                                }
                              }}
                              className="px-2 py-1 rounded text-[11px] font-bold text-emerald-800 bg-white hover:bg-emerald-100 border border-emerald-200 flex items-center gap-1 cursor-pointer"
                            >
                              <Eye className="w-3 h-3 text-emerald-700" />
                              <span>{isAr ? 'عرض' : 'Voir'}</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => downloadDocumentFile(userDoc.fileDataUrl!, userDoc.fileName || `${docDef.key}.doc`)}
                              className="p-1 rounded text-slate-600 hover:text-blue-700 hover:bg-white border border-slate-200 cursor-pointer"
                              title="Télécharger"
                            >
                              <Download className="w-3 h-3 text-blue-700" />
                            </button>
                          </div>
                        </div>
                      )}

                      {/* Action Row 1: Word Model / Upload / OCR Scan (3 equal columns) */}
                      <div className="mt-3 pt-2.5 border-t border-slate-100 grid grid-cols-3 gap-1.5">
                        {/* Modèle Word */}
                        <button
                          type="button"
                          onClick={() => {
                            if (userDoc?.fileDataUrl) {
                              downloadDocumentFile(userDoc.fileDataUrl, userDoc.fileName || `${docDef.key}.doc`);
                            } else {
                              downloadOfficialModelWord(docDef.key, docDef.nameFr, docDef.nameAr, localCandidate);
                            }
                          }}
                          className="flex items-center justify-center gap-1 py-1.5 px-1 rounded-lg text-[11px] sm:text-xs font-bold bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-300 transition-colors cursor-pointer text-center"
                          title={userDoc?.fileDataUrl ? "Télécharger le document joint" : "Télécharger le modèle officiel Word (.doc)"}
                        >
                          <Download className="w-3.5 h-3.5 text-blue-700 shrink-0" />
                          <span className="leading-tight truncate">
                            {userDoc?.fileDataUrl ? (isAr ? 'تحميل' : 'Télécharger') : (isAr ? 'نموذج Word' : 'Modèle Word')}
                          </span>
                        </button>

                        {/* Upload Word / PDF / Photo */}
                        <label 
                          className="flex items-center justify-center gap-1 py-1.5 px-1 rounded-lg text-[11px] sm:text-xs font-bold bg-white hover:bg-emerald-50 text-slate-700 hover:text-emerald-800 border border-slate-300 transition-colors cursor-pointer text-center"
                          title="Uploader un fichier Word (.docx, .doc), PDF ou Scan"
                        >
                          <Upload className="w-3.5 h-3.5 text-emerald-800 shrink-0" />
                          <span className="leading-tight truncate">{isAr ? 'رفع ملف' : 'Upload'}</span>
                          <input
                            type="file"
                            accept=".doc,.docx,.txt,.text,.rtf,.pdf,image/*,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain"
                            onChange={e => {
                              const f = e.target.files?.[0];
                              if (f) handleUploadScanForDoc(docDef.key, f);
                              e.target.value = '';
                            }}
                            className="hidden"
                          />
                        </label>

                        {/* Scanner OCR / Camera */}
                        <label 
                          className={`flex items-center justify-center gap-1 py-1.5 px-1 rounded-lg text-[11px] sm:text-xs font-bold bg-emerald-700 text-white hover:bg-emerald-800 transition-colors cursor-pointer text-center ${
                            isProcessingDocKey === docDef.key ? 'opacity-50 pointer-events-none' : ''
                          }`}
                          title="Prendre une photo ou numériser par OCR"
                        >
                          {isProcessingDocKey === docDef.key ? (
                            <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin shrink-0" />
                          ) : (
                            <Camera className="w-3.5 h-3.5 text-amber-300 shrink-0" />
                          )}
                          <span className="leading-tight truncate">{isAr ? 'مسح' : 'Scanner'}</span>
                          <input
                            type="file"
                            accept="image/*"
                            capture="environment"
                            onChange={e => {
                              const f = e.target.files?.[0];
                              if (f) handleUploadScanForDoc(docDef.key, f);
                              e.target.value = '';
                            }}
                            className="hidden"
                          />
                        </label>
                      </div>

                      {/* Action Row 2: Segmented Status Selector (Full-Width 3-Choice Control) */}
                      <div className="mt-2 grid grid-cols-3 gap-1 p-1 bg-slate-100 rounded-xl">
                        <button
                          type="button"
                          onClick={() => handleToggleDocStatus(docDef.key, 'conforme')}
                          className={`flex items-center justify-center gap-1 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                            isConforme
                              ? 'bg-emerald-700 text-white shadow-xs'
                              : 'text-slate-600 hover:text-emerald-700 hover:bg-white/60'
                          }`}
                        >
                          <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                          <span className="truncate">{isAr ? 'مطابق' : 'Conforme'}</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleToggleDocStatus(docDef.key, 'en_attente')}
                          className={`flex items-center justify-center gap-1 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                            isPending
                              ? 'bg-amber-500 text-white shadow-xs'
                              : 'text-slate-600 hover:text-amber-700 hover:bg-white/60'
                          }`}
                        >
                          <Clock className="w-3.5 h-3.5 shrink-0" />
                          <span className="truncate">{isAr ? 'في الانتظار' : 'En attente'}</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleToggleDocStatus(docDef.key, 'non_conforme')}
                          className={`flex items-center justify-center gap-1 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                            isNonConforme
                              ? 'bg-rose-600 text-white shadow-xs'
                              : 'text-slate-600 hover:text-rose-700 hover:bg-white/60'
                          }`}
                        >
                          <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                          <span className="truncate">{isAr ? 'مرفوض' : 'Rejeté'}</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 2: FICHE PERSONNELLE & INFORMATIONS DU CANDIDAT */}
          {activeTab === 'profile' && (
            <div className="space-y-3.5 animate-in fade-in duration-150">
              
              {/* Carte 1: État Civil & NIN */}
              <div className="bg-white rounded-xl p-3.5 sm:p-4 border border-slate-200 shadow-2xs space-y-3">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                  <h3 className="text-xs sm:text-sm font-bold text-slate-900 flex items-center gap-2">
                    <User className="w-4 h-4 text-emerald-700" />
                    <span>{isAr ? 'الحالة المدنية والهوية الوطنية' : 'État Civil & Identité Nationale'}</span>
                  </h3>
                  <span className="text-xs text-slate-500 font-bold">
                    {localCandidate.gender === 'F' ? (isAr ? 'أنثى' : 'Femme') : (isAr ? 'ذكر' : 'Homme')}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div>
                    <span className="text-slate-400 block">{isAr ? 'الاسم واللقب (فرنسية):' : 'Nom & Prénom (Français) :'}</span>
                    <span className="font-bold text-slate-900 text-sm">{localCandidate.lastNameFr} {localCandidate.firstNameFr}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block">{isAr ? 'الاسم واللقب (عربية):' : 'Nom & Prénom (Arabe) :'}</span>
                    <span className="font-bold text-slate-900 text-sm font-arabic">{localCandidate.lastNameAr} {localCandidate.firstNameAr}</span>
                  </div>
                  
                  {/* NIN with Quick Copy */}
                  <div className="sm:col-span-2 bg-slate-50 p-2.5 rounded-lg border border-slate-200 flex items-center justify-between">
                    <div>
                      <span className="text-slate-500 text-[10px] block font-bold">
                        {isAr ? 'الرقم التعريفي الوطني (NIN):' : 'Numéro d\'Identification National (NIN 18 chiffres) :'}
                      </span>
                      <span className="font-mono font-bold text-slate-900 text-xs sm:text-sm tracking-wider">
                        {localCandidate.nationalIdNumber || (isAr ? 'غير مسجل' : 'Non renseigné')}
                      </span>
                    </div>
                    {localCandidate.nationalIdNumber && (
                      <button
                        type="button"
                        onClick={() => handleCopyNIN(localCandidate.nationalIdNumber!)}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-bold bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 cursor-pointer transition-colors"
                      >
                        {copiedNIN ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-slate-500" />}
                        <span>{copiedNIN ? (isAr ? 'تم النسخ' : 'Copié !') : (isAr ? 'نسخ' : 'Copier')}</span>
                      </button>
                    )}
                  </div>

                  <div>
                    <span className="text-slate-400 block">{isAr ? 'تاريخ ومكان الميلاد:' : 'Date & Lieu de naissance :'}</span>
                    <span className="font-semibold text-slate-800">{localCandidate.birthDate} ({localCandidate.birthPlace})</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block">{isAr ? 'العمر وفئة الشباب:' : 'Âge & Quota Jeunesse :'}</span>
                    <span className="font-semibold text-slate-800">
                      {age} {isAr ? 'سنة' : 'ans'}
                      {youth && (
                        <span className="ml-1.5 px-1.5 py-0.2 rounded bg-amber-100 text-amber-900 font-bold text-[10px]">
                          {isAr ? 'فئة الشباب (<40)' : 'Quota Jeune (<40 ans)'}
                        </span>
                      )}
                    </span>
                  </div>
                </div>
              </div>

              {/* Carte 2: Coordonnées & Bologhine */}
              <div className="bg-white rounded-xl p-3.5 sm:p-4 border border-slate-200 shadow-2xs space-y-3">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                  <h3 className="text-xs sm:text-sm font-bold text-slate-900 flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-emerald-700" />
                    <span>{isAr ? 'الإقامة والاتصال' : 'Résidence & Contact'}</span>
                  </h3>
                  <span className="text-xs font-semibold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                    Kasma Bologhine
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div>
                    <span className="text-slate-400 block">{isAr ? 'حي الإقامة ببولوغين:' : 'Quartier à Bologhine :'}</span>
                    <span className="font-bold text-slate-800 text-sm flex items-center gap-1 mt-0.5">
                      <MapPin className="w-3.5 h-3.5 text-emerald-700" />
                      {localCandidate.addressNeighborhood}
                    </span>
                  </div>

                  <div>
                    <span className="text-slate-400 block">{isAr ? 'المهنة أو الوظيفة:' : 'Profession :'}</span>
                    <span className="font-semibold text-slate-800">{localCandidate.profession}</span>
                  </div>

                  {/* Phone */}
                  <div>
                    <span className="text-slate-400 block">{isAr ? 'رقم الهاتف:' : 'Téléphone :'}</span>
                    {localCandidate.phoneNumber ? (
                      <a 
                        href={getCleanTelUrl(localCandidate.phoneNumber)}
                        className="font-bold font-mono text-emerald-800 hover:text-emerald-950 hover:underline flex items-center gap-1.5 text-sm mt-0.5"
                        title={isAr ? 'انقر للاتصال المباشر من الهاتف' : 'Appeler directement'}
                      >
                        <Phone className="w-3.5 h-3.5 text-emerald-700" />
                        <span>{formatPhoneNumber(localCandidate.phoneNumber)}</span>
                      </a>
                    ) : (
                      <span className="text-slate-400 italic">{isAr ? 'غير مسجل' : 'Non renseigné'}</span>
                    )}
                  </div>

                  {/* Email */}
                  <div>
                    <span className="text-slate-400 block">{isAr ? 'البريد الإلكتروني:' : 'E-mail :'}</span>
                    {localCandidate.email ? (
                      <a 
                        href={`mailto:${localCandidate.email}`}
                        className="font-semibold text-blue-700 hover:underline flex items-center gap-1 text-xs mt-0.5 truncate"
                      >
                        <Mail className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                        <span className="truncate">{localCandidate.email}</span>
                      </a>
                    ) : (
                      <span className="text-slate-400 italic">Non renseigné</span>
                    )}
                  </div>
                </div>
              </div>

              {/* Carte 3: Militantisme FLN & Instruction & Armée */}
              <div className="bg-white rounded-xl p-3.5 sm:p-4 border border-slate-200 shadow-2xs space-y-3">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                  <h3 className="text-xs sm:text-sm font-bold text-slate-900 flex items-center gap-2">
                    <BadgeCheck className="w-4 h-4 text-emerald-700" />
                    <span>{isAr ? 'المناضل، التعليم والخدمة الوطنية' : 'Militantisme FLN & Profil'}</span>
                  </h3>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div>
                    <span className="text-slate-400 block">{isAr ? 'بطاقة مناضل جبهة التحرير:' : 'Carte Militant FLN :'}</span>
                    <span className="font-bold text-emerald-800 block mt-0.5">
                      {localCandidate.partyMembershipNumber} (Adhésion {localCandidate.partyJoinYear})
                    </span>
                    <span className="text-[11px] text-slate-500">{localCandidate.partyRole}</span>
                  </div>

                  <div>
                    <span className="text-slate-400 block">{isAr ? 'المستوى الدراسي:' : 'Niveau d\'études & Diplôme :'}</span>
                    <span className="font-bold text-slate-800 flex items-center gap-1 mt-0.5">
                      {localCandidate.isUniversityGraduate && <GraduationCap className="w-4 h-4 text-blue-600" />}
                      {localCandidate.educationLevel}
                    </span>
                    {localCandidate.isUniversityGraduate && (
                      <span className="text-[10px] text-blue-700 font-bold block">
                        {isAr ? 'مستوفٍ لشرط الـ 33% جامعي' : 'Diplômé de l\'enseignement supérieur (Quota 33%)'}
                      </span>
                    )}
                  </div>

                  <div className="sm:col-span-2">
                    <span className="text-slate-400 block">{isAr ? 'الوضعية تجاه الخدمة الوطنية:' : 'Situation Service National :'}</span>
                    <span className="font-semibold text-slate-800 uppercase tracking-wide">
                      {localCandidate.militaryStatus === 'accompli' ? 'Accompli (بطاقة الخدمة الوطنية)' :
                       localCandidate.militaryStatus === 'dispense' ? 'Dispensé (بطاقة الإعفاء)' :
                       localCandidate.militaryStatus === 'sursis' ? 'Sursis légal (تأجيل ساري)' : 'Non concerné'}
                    </span>
                  </div>
                </div>
              </div>

            </div>
          )}

          {/* TAB 3: CONFORMITÉ LÉGALE ANIE & QUOTAS */}
          {activeTab === 'compliance' && (
            <div className="space-y-3.5 animate-in fade-in duration-150">
              
              {/* Synthèse générale */}
              <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-2xs">
                <h3 className="text-xs sm:text-sm font-bold text-slate-900 flex items-center gap-2 mb-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-700" />
                  <span>{isAr ? 'التدقيق القانوني للسلطة المستقلة (ANIE)' : 'Contrôle de Conformité Électorale ANIE'}</span>
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  {isAr 
                    ? 'طبقاً للأمر رقم 21-01 المتضمن القانون العضوي المتعلق بنظام الانتخابات، تخضع ملفات الترشح لبلدية بولوغين وولائية الجزائر للمراقبة الدقيقة قبل إيداع القائمة رسمياً.'
                    : 'Conformément à la Loi Organique n° 21-01 relative au régime électoral, le dossier du candidat doit comporter l\'ensemble des 11 pièces justificatives conformes avant le dépôt officiel de la liste FLN Bologhine.'}
                </p>
              </div>

              {/* Critères essentiels */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold text-slate-900 block">{isAr ? 'الجنسية الجزائرية' : 'Nationalité Algérienne'}</span>
                    <span className="text-[11px] text-slate-500">{isAr ? 'إثبات الجنسية الجزائرية الأصلية' : 'Certificat de nationalité conforme'}</span>
                  </div>
                </div>

                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold text-slate-900 block">{isAr ? 'صحيفة السوابق القضائية' : 'Casier Judiciaire N° 03'}</span>
                    <span className="text-[11px] text-slate-500">{isAr ? 'نظافة السوابق العدلية (أقل من 3 أشهر)' : 'Bulletin N° 03 vierge requis'}</span>
                  </div>
                </div>

                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold text-slate-900 block">{isAr ? 'الخدمة الوطنية' : 'Service National'}</span>
                    <span className="text-[11px] text-slate-500">{isAr ? 'أداء، إعفاء أو تأجيل قانوني' : 'Situation en règle ou non concerné'}</span>
                  </div>
                </div>

                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold text-slate-900 block">{isAr ? 'الوضعية الجبائية' : 'Situation Fiscale'}</span>
                    <span className="text-[11px] text-slate-500">{isAr ? 'شهادة إبراء ضريبي سارية المفعول' : 'Attestation de régularité fiscale'}</span>
                  </div>
                </div>
              </div>

              {/* Action globale */}
              <div className="bg-emerald-50 rounded-xl p-3.5 border border-emerald-200 flex flex-col sm:flex-row items-center justify-between gap-3">
                <div>
                  <span className="font-bold text-emerald-900 text-xs sm:text-sm block">
                    {isAr ? 'طباعة استمارة تدقيق الملف الرسمية' : 'Imprimer le Bordereau Officiel de Dépôt'}
                  </span>
                  <span className="text-[11px] text-emerald-700">
                    {isAr ? 'استمارة رسمية تحمل شعار الحزب وتفاصيل الملف للإيداع' : 'Bordereau officiel FLN Kasma Bologhine certifiant les pièces remises'}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => onPrintSlip(localCandidate)}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-emerald-700 hover:bg-emerald-800 text-white shadow-xs transition-colors cursor-pointer shrink-0"
                >
                  <Printer className="w-4 h-4" />
                  <span>{t.printOfficialSlip}</span>
                </button>
              </div>

            </div>
          )}

        </div>

        {/* Footer - Touch-Friendly Mobile Buttons */}
        <div className="p-3 sm:p-4 border-t border-slate-200 bg-slate-50 shrink-0 flex items-center justify-between gap-2">
          <button
            type="button"
            onClick={() => onPrintSlip(localCandidate)}
            className="inline-flex items-center justify-center gap-1.5 px-3 py-2 sm:py-1.5 rounded-xl text-xs font-bold bg-white border border-slate-300 text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5 text-slate-500" />
            <span className="hidden sm:inline">{isAr ? 'طباعة الاستمارة' : 'Imprimer le Bordereau'}</span>
            <span className="sm:hidden">{isAr ? 'طباعة' : 'Imprimer'}</span>
          </button>

          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 sm:py-1.5 rounded-xl text-xs font-bold bg-slate-800 hover:bg-slate-900 text-white transition-colors cursor-pointer"
          >
            {t.close}
          </button>
        </div>
      </div>

      {/* Document Inspection & OCR Modal */}
      {inspectingDoc && (
        <DocumentScanModal
          document={inspectingDoc}
          candidateName={`${localCandidate.lastNameFr} ${localCandidate.firstNameFr}`}
          onClose={() => setInspectingDoc(null)}
          onApplyExtractedData={handleModalExtractedData}
        />
      )}
    </div>
  );
};
