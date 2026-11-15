import React from 'react';

interface HeaderProps {
  onOpenImport: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onOpenImport }) => {
  return (
    <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-sm border-b border-slate-200">
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-8">
        <a
          href="#pregled"
          className="text-base sm:text-lg font-bold tracking-tight text-slate-900 whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0F4C81] rounded-sm"
        >
          Slovenska Bistrica 2026
        </a>

        <nav
          aria-label="Glavna navigacija"
          className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-600"
        >
          <a
            href="#pregled"
            className="hover:text-slate-900 hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0"
          >
            Pregled
          </a>
          <a
            href="#udelezba"
            className="hover:text-slate-900 hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0"
          >
            Udeležba
          </a>
          <a
            href="#zupan-svet"
            className="hover:text-slate-900 hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0"
          >
            Župan in svet
          </a>
          <a
            href="#kandidati-svet"
            className="hover:text-slate-900 hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0"
          >
            Kandidati OS
          </a>
          <a
            href="#pragersko-gaj"
            className="hover:text-slate-900 hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0"
          >
            KS Pragersko–Gaj
          </a>
        </nav>

        <div className="flex items-center shrink-0">
          <button
            type="button"
            onClick={onOpenImport}
            className="px-4 py-2 text-xs sm:text-sm font-medium text-white bg-[#0F4C81] rounded-lg hover:bg-[#0c3d68] transition-colors whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[#0F4C81]"
          >
            Vnos / Uvoz DVK
          </button>
        </div>
      </div>
    </header>
  );
};
