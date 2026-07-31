import React from 'react'
import Markdown from './Markdown'

export default function BattleArea({
  activeConversation,
  isLoading,
  suggestions,
  handleSend,
  getWinnerInfo,
  chatEndRef,
  error,
  setError
}) {
  return (
    <div className="flex-1 overflow-y-auto p-6 pb-28">
      {error && (
        <div className="max-w-2xl mx-auto mb-5 p-3 rounded bg-[#ef4444]/10 border border-[#ef4444]/20 text-[#ef4444] flex items-start gap-2.5 select-text">
          <span className="material-symbols-outlined text-sm mt-0.5 select-none">error_outline</span>
          <div className="flex-1 text-[11px]">
            <p className="font-semibold text-[#ef4444]">Connection Error</p>
            <p className="mt-0.5 text-[#a1a1aa]">{error}</p>
          </div>
          <button onClick={() => setError(null)} className="text-[10px] underline font-semibold cursor-pointer">Dismiss</button>
        </div>
      )}

      {!activeConversation || activeConversation.messages.length === 0 ? (
        /* Welcome / Empty State Screen */
        <div className="max-w-xl mx-auto h-[70vh] flex flex-col justify-center items-center text-center select-none">
          <div className="w-10 h-10 rounded-xl bg-[#6366f1]/10 border border-[#6366f1]/20 flex items-center justify-center mb-4 glow-accent select-none">
            <span className="material-symbols-outlined text-[#6366f1] text-lg select-none">sports_martial_arts</span>
          </div>
          <h2 className="text-sm font-semibold tracking-tight text-[#f5f5f5] mb-1 select-none">
            AI Battle Arena
          </h2>
          <p className="text-[11px] text-[#a1a1aa] max-w-xs leading-relaxed mb-6 select-none">
            Enter your coding question or prompt. Two models will generate code side-by-side, and Gemini will judge the winner based on correctness and style.
          </p>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 w-full">
            {suggestions.map((sug, i) => (
              <button
                key={i}
                onClick={() => handleSend(sug)}
                className="p-3 bg-[#171717] border border-[#27272a] rounded text-left text-[11px] text-[#a1a1aa] hover:text-[#f5f5f5] hover:border-[#6366f1]/40 transition-all duration-150 flex justify-between items-center group cursor-pointer"
              >
                <span className="line-clamp-1 pr-2">{sug}</span>
                <span className="material-symbols-outlined text-xs text-[#a1a1aa]/60 group-hover:text-[#6366f1] transition-colors shrink-0 select-none">arrow_forward</span>
              </button>
            ))}
          </div>
        </div>
      ) : (
        /* Active Messages List */
        <div className="max-w-6xl mx-auto flex flex-col">
          {activeConversation.messages.map((msg, index) => {
            const isWinner = getWinnerInfo(msg.judge)
            
            return (
              <div key={index} className="flex flex-col mb-8">
                {/* User Question */}
                <div className="flex justify-end mb-3">
                  <div className="bg-[#171717] max-w-xl p-3.5 rounded border border-[#27272a] shadow-sm select-text">
                    <div className="flex items-center gap-1 mb-1 justify-end select-none text-[9px] text-[#6366f1] font-semibold uppercase tracking-wider">
                      <span>YOU</span>
                      <span className="material-symbols-outlined text-[11px] select-none">person</span>
                    </div>
                    <p className="text-xs font-normal text-[#f5f5f5] text-right leading-relaxed select-text">{msg.problem}</p>
                  </div>
                </div>

                {/* Loading State or Solutions Side-by-Side Grid */}
                {msg.isTemp ? (
                  /* Pulse Loading Indicator */
                  <div className="flex flex-col gap-4 mt-2">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Solution 1 loading */}
                      <div className="bg-[#171717] border border-[#27272a] rounded p-4 h-60 flex flex-col justify-between animate-pulse select-none">
                        <div className="flex items-center gap-1.5 pb-2 border-b border-[#27272a]">
                          <div className="w-3.5 h-3.5 rounded bg-[#6366f1]/20"></div>
                          <div className="w-16 h-3 bg-white/5 rounded"></div>
                        </div>
                        <div className="flex-1 py-3 space-y-2">
                          <div className="w-full h-3 bg-white/5 rounded"></div>
                          <div className="w-5/6 h-3 bg-white/5 rounded"></div>
                          <div className="w-4/5 h-10 bg-white/5 rounded"></div>
                        </div>
                        <div className="h-3.5 w-10 bg-white/5 rounded"></div>
                      </div>
                      
                      {/* Solution 2 loading */}
                      <div className="bg-[#171717] border border-[#27272a] rounded p-4 h-60 flex flex-col justify-between animate-pulse select-none">
                        <div className="flex items-center gap-1.5 pb-2 border-b border-[#27272a]">
                          <div className="w-3.5 h-3.5 rounded bg-[#818cf8]/20"></div>
                          <div className="w-16 h-3 bg-white/5 rounded"></div>
                        </div>
                        <div className="flex-1 py-3 space-y-2">
                          <div className="w-full h-3 bg-white/5 rounded"></div>
                          <div className="w-5/6 h-3 bg-white/5 rounded"></div>
                          <div className="w-4/5 h-10 bg-white/5 rounded"></div>
                        </div>
                        <div className="h-3.5 w-10 bg-white/5 rounded"></div>
                      </div>
                    </div>

                    {/* Judge loading */}
                    <div className="bg-[#171717] border border-[#27272a]/60 rounded p-4 h-24 flex items-center justify-center animate-pulse select-none">
                      <span className="material-symbols-outlined text-[#f59e0b]/30 text-xl animate-spin mr-2">sync</span>
                      <div className="w-44 h-3 bg-[#f59e0b]/15 rounded"></div>
                    </div>
                  </div>
                ) : (
                  /* Battle Output Display */
                  <div className="flex flex-col gap-4 mt-2 select-text">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Card 1: Model Alpha */}
                      <div className="bg-[#171717] border border-[#27272a] rounded flex flex-col h-full shadow-sm overflow-hidden select-text">
                        <div className="bg-[#1f1f1f] p-2.5 border-b border-[#27272a] flex items-center justify-between select-none">
                          <div className="flex items-center gap-1">
                            <span className="material-symbols-outlined text-[#6366f1] text-[13px] select-none">smart_toy</span>
                            <span className="font-semibold text-[11px] text-[#f5f5f5]">Model Alpha</span>
                          </div>
                          <span className="bg-[#6366f1]/10 text-[#818cf8] text-[8px] px-1.5 py-0.5 rounded border border-[#6366f1]/20 uppercase tracking-wider font-bold">
                            Mistral
                          </span>
                        </div>
                        <div className="p-3.5 flex-1 overflow-auto select-text text-[11px] leading-relaxed">
                          <Markdown text={msg.solution_1} />
                        </div>
                      </div>

                      {/* Card 2: Model Beta */}
                      <div className="bg-[#171717] border border-[#27272a] rounded flex flex-col h-full shadow-sm overflow-hidden select-text">
                        <div className="bg-[#1f1f1f] p-2.5 border-b border-[#27272a] flex items-center justify-between select-none">
                          <div className="flex items-center gap-1">
                            <span className="material-symbols-outlined text-[#818cf8] text-[13px] select-none">smart_toy</span>
                            <span className="font-semibold text-[11px] text-[#f5f5f5]">Model Beta</span>
                          </div>
                          <span className="bg-[#818cf8]/10 text-[#818cf8] text-[8px] px-1.5 py-0.5 rounded border border-[#818cf8]/20 uppercase tracking-wider font-bold">
                            Cohere
                          </span>
                        </div>
                        <div className="p-3.5 flex-1 overflow-auto select-text text-[11px] leading-relaxed">
                          <Markdown text={msg.solution_2} />
                        </div>
                      </div>
                    </div>

                    {/* Full Width Card 3: Judge Verdict */}
                    <div className="bg-[#171717] border border-[#27272a] rounded flex flex-col shadow-sm overflow-hidden select-text">
                      <div className="bg-[#1f1f1f] p-2.5 border-b border-[#27272a] flex items-center gap-1 select-none">
                        <span className="material-symbols-outlined text-[#f59e0b] text-[13px] select-none">emoji_events</span>
                        <span className="font-semibold text-[11px] text-[#f5f5f5]">Judge Verdict</span>
                        <span className="ml-auto bg-[#f59e0b]/10 text-[#f59e0b] text-[8px] px-1.5 py-0.5 rounded border border-[#f59e0b]/20 uppercase tracking-wider font-bold">
                          Gemini
                        </span>
                      </div>
                      
                      <div className="p-3.5 flex flex-col md:flex-row gap-4 text-[11px]">
                        {/* Left Column: Visual Scores & Banner */}
                        <div className="flex flex-col gap-2.5 md:w-[240px] shrink-0">
                          {/* Score comparison visual progress bars */}
                          <div className="space-y-2 select-none bg-[#111111]/60 p-2.5 rounded border border-[#27272a]/60">
                            {/* Alpha Score Row */}
                            <div className="space-y-1">
                              <div className="flex justify-between items-center text-[10px]">
                                <span className="font-semibold text-[#818cf8] flex items-center gap-1.5">
                                  <span className="w-1.5 h-1.5 rounded-full bg-[#6366f1]"></span>
                                  Model Alpha (Mistral)
                                </span>
                                <span className="font-bold text-[#f5f5f5]">{msg.judge?.solution_1_score}/10</span>
                              </div>
                              <div className="w-full bg-[#27272a] h-1.5 rounded-full overflow-hidden">
                                <div 
                                  className="bg-[#6366f1] h-full rounded-full transition-all duration-500" 
                                  style={{ width: `${(msg.judge?.solution_1_score || 0) * 10}%` }}
                                />
                              </div>
                            </div>
                            
                            {/* Beta Score Row */}
                            <div className="space-y-1">
                              <div className="flex justify-between items-center text-[10px]">
                                <span className="font-semibold text-[#818cf8] flex items-center gap-1.5">
                                  <span className="w-1.5 h-1.5 rounded-full bg-[#818cf8]"></span>
                                  Model Beta (Cohere)
                                </span>
                                <span className="font-bold text-[#f5f5f5]">{msg.judge?.solution_2_score}/10</span>
                              </div>
                              <div className="w-full bg-[#27272a] h-1.5 rounded-full overflow-hidden">
                                <div 
                                  className="bg-[#818cf8] h-full rounded-full transition-all duration-500" 
                                  style={{ width: `${(msg.judge?.solution_2_score || 0) * 10}%` }}
                                />
                              </div>
                            </div>
                          </div>
                          
                          {/* Winner banner */}
                          <div className={`text-center py-2.5 border rounded flex flex-col justify-center items-center select-none ${isWinner.style}`}>
                            <span className="text-[11px] font-bold">{isWinner.text}</span>
                            <span className="text-[8px] text-[#a1a1aa] uppercase tracking-wider mt-0.5">{isWinner.sub}</span>
                          </div>
                        </div>

                        {/* Right Column: Detailed reasoning side by side */}
                        <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4 border-t md:border-t-0 md:border-l border-[#27272a]/30 pt-3.5 md:pt-0 md:pl-4">
                          <div>
                            <span className="text-[9px] font-semibold text-[#6366f1] select-none flex items-center gap-1 mb-1.5">
                              <span className="material-symbols-outlined text-[9px] select-none">notes</span>
                              Alpha Assessment
                            </span>
                            <div className="text-[10px] text-[#a1a1aa] leading-relaxed select-text">
                              <Markdown text={msg.judge?.solution_1_reasoning || msg.judge?.solution_1_reasoningn} />
                            </div>
                          </div>
                          
                          <div className="border-t md:border-t-0 border-[#27272a]/30 pt-3 md:pt-0">
                            <span className="text-[9px] font-semibold text-[#818cf8] select-none flex items-center gap-1 mb-1.5">
                              <span className="material-symbols-outlined text-[9px] select-none">notes</span>
                              Beta Assessment
                            </span>
                            <div className="text-[10px] text-[#a1a1aa] leading-relaxed select-text">
                              <Markdown text={msg.judge?.solution_2_reasoning || msg.judge?.solution_2_reasoningn} />
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )
          })}
          <div ref={chatEndRef} />
        </div>
      )}
    </div>
  )
}
