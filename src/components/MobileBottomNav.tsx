import React from 'react';
import { Plus, Camera, ShieldCheck, Printer, Scale } from 'lucide-react';
import { Language } from '../data/translations';

interface MobileBottomNavProps {
  language: Language;
  onOpenAddModal: () => void;
  onOpenAiScanner?: () => void;
  onOpenNumberingManager: () => void;
  onPrintList: () => void;
  onOpenLegalGuide: () => void;
}

export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({
  language,
  onOpenAddModal,
  onOpenAiScanner,
  onOpenNumberingManager,
  onPrintList,
  onOpenLegalGuide,
}) => {
  const isAr = language === 'ar';

  return (
    <nav
      id="mobile-bottom-navigation"
      aria-label="Navigation mobile principale"
      className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200 shadow-lg px-2 py-1.5 pb-safe"
    >
      <div className="max-w-md mx-auto grid grid-cols-5 items-center gap-1">
        
        {/* 1. Scanner IA */}
        <button
          onClick={onOpenAiScanner}
          className="flex flex-col items-center justify-center py-1 px-1 rounded-xl text-slate-600 hover:text-emerald-700 active:bg-slate-100 transition-colors"
          title={isAr ? 'مسح بالهاتف / تصوير (IA)' : 'Scanner IA'}
        >
          <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center mb-0.5 border border-emerald-200 shadow-2xs">
            <Camera className="w-4.5 h-4.5" />
          </div>
          <span className="text-[10px] font-semibold tracking-tight text-slate-700 truncate max-w-full">
            {isAr ? 'مسح IA' : 'Scanner'}
          </span>
        </button>

        {/* 2. Numérotation Admin */}
        <button
          onClick={onOpenNumberingManager}
          className="flex flex-col items-center justify-center py-1 px-1 rounded-xl text-slate-600 hover:text-amber-700 active:bg-slate-100 transition-colors"
          title={isAr ? 'ترتيب القائمة الرسمية' : 'Numérotation des candidats'}
        >
          <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-800 flex items-center justify-center mb-0.5 border border-amber-200 shadow-2xs">
            <ShieldCheck className="w-4.5 h-4.5 text-amber-700" />
          </div>
          <span className="text-[10px] font-semibold tracking-tight text-slate-700 truncate max-w-full">
            {isAr ? 'الترتيب' : 'Ordre'}
          </span>
        </button>

        {/* 3. Primary Center Action: Add Candidate */}
        <div className="flex flex-col items-center justify-center -mt-4">
          <button
            onClick={onOpenAddModal}
            className="w-13 h-13 rounded-full bg-gradient-to-tr from-emerald-800 to-emerald-600 text-white flex items-center justify-center shadow-lg shadow-emerald-800/30 border-2 border-white active:scale-95 transition-transform"
            title={isAr ? 'إضافة مترشح جديد' : 'Nouveau Candidat'}
          >
            <Plus className="w-7 h-7 stroke-[2.5]" />
          </button>
          <span className="text-[10px] font-bold text-emerald-900 mt-0.5">
            {isAr ? '+ مترشح' : '+ Candidat'}
          </span>
        </div>

        {/* 4. Imprimer Liste */}
        <button
          onClick={onPrintList}
          className="flex flex-col items-center justify-center py-1 px-1 rounded-xl text-slate-600 hover:text-blue-700 active:bg-slate-100 transition-colors"
          title={isAr ? 'طباعة القائمة الرسمية' : 'Imprimer la liste'}
        >
          <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center mb-0.5 border border-blue-200 shadow-2xs">
            <Printer className="w-4.5 h-4.5 text-blue-700" />
          </div>
          <span className="text-[10px] font-semibold tracking-tight text-slate-700 truncate max-w-full">
            {isAr ? 'طباعة' : 'Imprimer'}
          </span>
        </button>

        {/* 5. Guide ANIE */}
        <button
          onClick={onOpenLegalGuide}
          className="flex flex-col items-center justify-center py-1 px-1 rounded-xl text-slate-600 hover:text-purple-700 active:bg-slate-100 transition-colors"
          title={isAr ? 'شروط وقوانين الترشح ANIE' : 'Conditions Légales ANIE'}
        >
          <div className="w-9 h-9 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center mb-0.5 border border-slate-300 shadow-2xs">
            <Scale className="w-4.5 h-4.5 text-emerald-800" />
          </div>
          <span className="text-[10px] font-semibold tracking-tight text-slate-700 truncate max-w-full">
            {isAr ? 'الشروط' : 'Lois'}
          </span>
        </button>

      </div>
    </nav>
  );
};
