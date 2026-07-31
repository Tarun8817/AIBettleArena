import React from 'react'

export default function Header({
  isSidebarOpen,
  setIsSidebarOpen,
  isBackendConnected
}) {
  return (
    <header className="bg-[#090909]/80 backdrop-blur-md border-b border-[#27272a] flex justify-between items-center w-full px-6 h-14 sticky top-0 z-40 shrink-0">
      <div className="flex items-center gap-2">
        <button 
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          className="mr-1 text-[#a1a1aa] hover:text-[#f5f5f5] transition-colors p-1.5 rounded hover:bg-[#171717] cursor-pointer flex items-center justify-center border border-transparent hover:border-[#27272a] active:scale-95"
          title={isSidebarOpen ? "Collapse sidebar" : "Expand sidebar"}
        >
          <span className="material-symbols-outlined text-[16px] select-none">
            {isSidebarOpen ? 'menu_open' : 'menu'}
          </span>
        </button>
        <div>
          <h1 className="font-bold text-xs tracking-tight text-[#f5f5f5] flex items-center gap-1.5 select-none">
            AI Battle Arena <span className="text-[#a1a1aa] text-[10px] font-normal select-none">⚔️</span>
          </h1>
          <p className="text-[9px] text-[#a1a1aa] font-normal select-none">
            Mistral (Alpha) vs Cohere (Beta) • Refereed by Gemini
          </p>
        </div>
      </div>
      
      <div className="flex items-center gap-3">
        {!isBackendConnected && (
          <span className="text-[9px] font-semibold px-2 py-0.5 rounded bg-[#ef4444]/10 border border-[#ef4444]/20 text-[#ef4444] flex items-center gap-1 animate-pulse">
            <span className="material-symbols-outlined text-[11px] select-none">warning</span>
            Offline
          </span>
        )}
        <div className="flex gap-1.5 select-none">
          <span className="text-[9px] font-medium bg-[#171717] px-2 py-0.5 rounded border border-[#27272a] text-[#f5f5f5] flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-[#6366f1]"></span> Mistral
          </span>
          <span className="text-[9px] font-medium bg-[#171717] px-2 py-0.5 rounded border border-[#27272a] text-[#f5f5f5] flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-[#818cf8]"></span> Cohere
          </span>
        </div>
      </div>
    </header>
  )
}
