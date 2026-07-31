import React from 'react'

export default function Sidebar({
  isSidebarOpen,
  conversations,
  activeId,
  setActiveId,
  isBackendConnected,
  handleStartNewBattle,
  handleDeleteConversation,
  getConversationWinnerLabel
}) {
  return (
    <aside className={`${isSidebarOpen ? 'w-[260px]' : 'w-0 border-r-0'} bg-[#111111] border-r border-[#27272a] flex flex-col h-full shrink-0 select-none transition-all duration-300 ease-in-out overflow-hidden`}>
      {/* Sidebar Top Banner */}
      <div className="relative h-28 border-b border-[#27272a] overflow-hidden shrink-0 select-none flex flex-col justify-end p-3.5">
        <img 
          src="/sidebar_illustration.png" 
          alt="AI Clash Banner" 
          className="absolute inset-0 w-full h-full object-cover opacity-25 filter brightness-[0.75] transition-transform duration-700 hover:scale-105 pointer-events-none"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#111111] via-[#111111]/30 to-transparent"></div>
        
        <div className="relative z-10 flex flex-col gap-1">
          <div className="flex items-center justify-between">
            <span className="text-[9px] font-semibold text-[#818cf8] tracking-widest uppercase">Arena Console</span>
            <span 
              className={`inline-block w-2.5 h-2.5 rounded-full transition-all duration-300 ${
                isBackendConnected === true 
                  ? 'bg-[#22c55e] shadow-[0_0_8px_rgba(34,197,94,0.6)] animate-pulse' 
                  : isBackendConnected === false 
                  ? 'bg-[#ef4444] shadow-[0_0_8px_rgba(239,68,68,0.6)]'
                  : 'bg-[#f59e0b]'
              }`} 
              title={isBackendConnected ? "Backend online" : "Backend offline"}
            ></span>
          </div>
          <h2 className="font-bold text-xs tracking-tight text-[#f5f5f5] flex items-center gap-1">
            AI Battle Arena <span className="text-[#a1a1aa] font-normal text-[10px]">⚔️</span>
          </h2>
        </div>
      </div>
      
      {/* New Battle Button */}
      <div className="p-3 pb-2.5">
        <button 
          onClick={handleStartNewBattle}
          className="w-full py-2 px-3 rounded bg-[#6366f1] hover:bg-[#818cf8] text-[#f5f5f5] font-medium text-xs flex justify-center items-center gap-1.5 transition-all active:scale-[0.98] cursor-pointer"
        >
          <span className="material-symbols-outlined text-sm select-none">add</span>
          New Battle
        </button>
      </div>

      {/* Sidebar History Title Header */}
      <div className="px-3 py-1.5 flex items-center gap-1.5 text-[#a1a1aa]/60 font-semibold select-none shrink-0 border-b border-[#27272a]/20">
        <span className="material-symbols-outlined text-[13px] select-none">history</span>
        <span className="text-[9px] tracking-wider uppercase font-semibold">Battle History</span>
      </div>

      {/* Sidebar History Items */}
      <div className="flex-1 overflow-y-auto px-3 flex flex-col gap-1.5 pb-4">
        {conversations.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-40 text-center px-4">
            <span className="material-symbols-outlined text-[#a1a1aa]/30 text-2xl mb-1 select-none">chat_bubble_outline</span>
            <p className="text-[10px] text-[#a1a1aa]/50">No battles fought yet</p>
          </div>
        ) : (
          conversations.map(convo => {
            const isActive = convo.id === activeId
            const winnerLabel = getConversationWinnerLabel(convo)
            
            return (
              <div 
                key={convo.id}
                onClick={() => setActiveId(convo.id)}
                className={`p-2.5 rounded transition-all duration-150 cursor-pointer group flex flex-col gap-1.5 relative border ${
                  isActive 
                    ? 'bg-[#171717] border-[#6366f1]/40' 
                    : 'bg-transparent border-transparent hover:bg-[#171717]/60 hover:border-[#27272a]'
                }`}
              >
                <div className="flex justify-between items-start pr-5">
                  <p className={`text-[11px] font-medium line-clamp-2 leading-relaxed ${isActive ? 'text-[#f5f5f5]' : 'text-[#a1a1aa] group-hover:text-[#f5f5f5]'}`}>
                    {convo.title}
                  </p>
                </div>
                {winnerLabel && (
                  <div className="flex items-center select-none">
                    <span className={`text-[8px] px-1.5 py-0.5 rounded border font-semibold uppercase tracking-wider ${
                      winnerLabel === 'Winner: Alpha' 
                        ? 'bg-[#6366f1]/10 text-[#818cf8] border-[#6366f1]/20' 
                        : winnerLabel === 'Winner: Beta' 
                        ? 'bg-[#818cf8]/10 text-[#818cf8] border-[#818cf8]/20' 
                        : winnerLabel === 'Tie'
                        ? 'bg-[#27272a] text-[#a1a1aa] border-transparent'
                        : 'bg-transparent text-[#a1a1aa] border-[#27272a] animate-pulse'
                    }`}>
                      {winnerLabel}
                    </span>
                  </div>
                )}
                <button 
                  onClick={(e) => handleDeleteConversation(convo.id, e)}
                  className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity hover:text-[#ef4444] text-[#a1a1aa]/60 p-0.5 rounded cursor-pointer"
                  title="Delete history"
                >
                  <span className="material-symbols-outlined text-[13px] select-none">delete</span>
                </button>
              </div>
            )
          })
        )}
      </div>

      {/* Sidebar Illustration/Watermark */}
      <div className="p-3 mt-auto border-t border-[#27272a]/40 select-none relative overflow-hidden flex flex-col gap-2">
        <div className="relative h-20 rounded border border-[#27272a] bg-[#090909]/40 overflow-hidden flex items-center justify-center">
          <img 
            src="/sidebar_illustration.png" 
            alt="AI Clash Illustration" 
            className="absolute inset-0 w-full h-full object-cover opacity-[0.15] pointer-events-none"
          />
          <div className="relative text-center p-2 z-10">
            <p className="text-[10px] font-semibold text-[#f5f5f5] tracking-wider uppercase">AI Battle Arena</p>
            <p className="text-[8px] text-[#a1a1aa] mt-0.5 leading-normal">Where Mistral and Cohere clash, mediated by Gemini Referee.</p>
          </div>
        </div>
      </div>

      <div className="p-3 border-t border-[#27272a] text-center text-[9px] text-[#a1a1aa]/50 font-medium tracking-wide">
        v1.0.0 • AI Battle Arena
      </div>
    </aside>
  )
}
