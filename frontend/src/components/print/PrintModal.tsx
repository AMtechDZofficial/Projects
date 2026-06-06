import { ReactNode, useRef } from 'react';
import { Printer, X, Download } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  docRef?: string;
}

export default function PrintModal({ isOpen, onClose, title, children, docRef }: Props) {
  const contentRef = useRef<HTMLDivElement>(null);

  if (!isOpen) return null;

  const handlePrint = () => window.print();

  return (
    <div className="fixed inset-0 z-[100] bg-gray-100 overflow-y-auto">
      {/* Barre d'outils — cachée à l'impression */}
      <div className="no-print sticky top-0 z-10 bg-white border-b border-gray-200 shadow-sm px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg text-gray-600">
            <X className="w-5 h-5" />
          </button>
          <div>
            <p className="font-semibold text-gray-800">{title}</p>
            {docRef && <p className="text-xs text-gray-400">Réf: {docRef}</p>}
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs text-gray-400 bg-gray-100 px-3 py-1 rounded-full">Format A4</span>
          <button onClick={handlePrint} className="btn-primary">
            <Printer className="w-4 h-4" /> Imprimer
          </button>
        </div>
      </div>

      {/* Zone de prévisualisation */}
      <div className="no-print flex justify-center py-8 px-4">
        <div
          ref={contentRef}
          className="bg-white shadow-xl"
          style={{ width: '210mm', minHeight: '297mm', padding: '12mm' }}
        >
          {children}
        </div>
      </div>

      {/* Contenu d'impression direct (sans marges de prévisualisation) */}
      <div className="print-only" style={{ display: 'none' }}>
        {children}
      </div>
    </div>
  );
}
