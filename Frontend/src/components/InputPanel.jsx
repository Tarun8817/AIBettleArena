import React from 'react'

export default function InputPanel({
  inputValue,
  setInputValue,
  isLoading,
  handleSend
}) {
  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      if (inputValue.trim() && !isLoading) {
        handleSend(inputValue.trim())
      }
    }
  }

  const handleSubmit = () => {
    if (inputValue.trim() && !isLoading) {
      handleSend(inputValue.trim())
    }
  }

  return (
    <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-[#090909] via-[#090909]/95 to-transparent pt-6 pb-3.5 z-30 select-none">
      <div className="max-w-2xl mx-auto relative">
        <textarea
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={isLoading}
          placeholder={isLoading ? "Battle in progress, evaluating code..." : "Ask a coding question to start the battle..."}
          rows={2}
          className="w-full bg-[#171717] border border-[#27272a] focus:border-[#6366f1]/50 rounded-lg py-3 pl-4 pr-12 text-[#f5f5f5] placeholder-[#a1a1aa]/50 text-xs focus:outline-none transition-all resize-none shadow-sm disabled:opacity-60 disabled:cursor-not-allowed select-text leading-relaxed"
        />
        <button
          onClick={handleSubmit}
          disabled={!inputValue.trim() || isLoading}
          className="absolute right-3.5 bottom-3.5 bg-[#6366f1] hover:bg-[#818cf8] text-white p-1.5 rounded transition-all active:scale-[0.9] disabled:opacity-30 disabled:hover:bg-[#6366f1] disabled:scale-100 disabled:cursor-not-allowed select-none cursor-pointer flex items-center justify-center shadow-md shadow-[#6366f1]/10"
          title="Start Battle"
        >
          {isLoading ? (
            <span className="material-symbols-outlined text-sm animate-spin">sync</span>
          ) : (
            <span className="material-symbols-outlined text-sm">send</span>
          )}
        </button>
      </div>
    </div>
  )
}
