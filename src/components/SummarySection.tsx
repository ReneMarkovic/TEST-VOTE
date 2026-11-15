import React, { useMemo, useState } from 'react';
import { Check, Copy, Download, ExternalLink, Printer } from 'lucide-react';
import type { ElectionDataset } from '../types/election';
import {
  DVK_LV2026_URL,
  DVK_SB_REZULTATI_URL,
  OB_SLOVENSKA_BISTRICA_URL,
} from '../data/slovenskaBistricaData';
import { generateSummaryText } from '../utils/electionCalculations';

interface SummarySectionProps {
  dataset: ElectionDataset;
}

export const SummarySection: React.FC<SummarySectionProps> = ({ dataset }) => {
  const [copied, setCopied] = useState(false);

  const summaryText = useMemo(() => generateSummaryText(dataset), [dataset]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(summaryText);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2500);
    } catch {
      // Fallback copy method without alert
      const textarea = document.createElement('textarea');
      textarea.value = summaryText;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2500);
    }
  };

  const handleDownloadJson = () => {
    const blob = new Blob([JSON.stringify(dataset, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `volitve-${dataset.year}-slovenska-bistrica-pragersko-gaj.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <section
      id="povzetek"
      className="bg-white border border-slate-200 rounded-xl p-6 sm:p-8 space-y-6"
    >
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-slate-200 pb-5">
        <div className="space-y-1.5">
          <p className="text-xs font-medium text-slate-500">
            Samodejni povzetek · Občina Slovenska Bistrica in KS Pragersko–Gaj
          </p>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900">
            Pripravljeno poročilo izidov
          </h2>
          <p className="text-sm text-slate-600 max-w-2xl">
            Besedilni povzetek se sproti posodablja ob vsakem vnosu ali uvozu podatkov z DVK in je pripravljen za kopiranje v objavo ali tisk v PDF.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 shrink-0 no-print">
          <button
            type="button"
            onClick={handleCopy}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium text-white bg-[#0F4C81] hover:bg-[#0c3d68] rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5" aria-hidden="true" />
                <span>Kopirano</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" aria-hidden="true" />
                <span>Kopiraj povzetek</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={() => window.print()}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5" aria-hidden="true" />
            <span>Natisni / PDF</span>
          </button>

          <button
            type="button"
            onClick={handleDownloadJson}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" aria-hidden="true" />
            <span>Izvozi JSON</span>
          </button>
        </div>
      </div>

      <pre className="p-5 bg-slate-50 border border-slate-200 rounded-lg text-xs sm:text-sm text-slate-800 whitespace-pre-wrap font-sans leading-relaxed overflow-x-auto">
        {summaryText}
      </pre>

      <div className="pt-2 flex flex-wrap items-center justify-between gap-4 text-xs text-slate-500 no-print">
        <div className="flex flex-wrap items-center gap-4">
          <a
            href={DVK_LV2026_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-[#0F4C81] hover:underline"
          >
            <span>DVK: Udeležba 2026</span>
            <ExternalLink className="w-3 h-3" aria-hidden="true" />
          </a>
          <a
            href={DVK_SB_REZULTATI_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-[#0F4C81] hover:underline"
          >
            <span>DVK: Rezultati Slovenska Bistrica</span>
            <ExternalLink className="w-3 h-3" aria-hidden="true" />
          </a>
          <a
            href={OB_SLOVENSKA_BISTRICA_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-[#0F4C81] hover:underline"
          >
            <span>OVK Občine Slovenska Bistrica</span>
            <ExternalLink className="w-3 h-3" aria-hidden="true" />
          </a>
        </div>
        <span>{dataset.sourceNote}</span>
      </div>
    </section>
  );
};
