import { useState, useEffect, useRef } from 'react'

// Custom Markdown Component to render solutions and reasoning nicely
function Markdown({ text }) {
  if (!text) return null;

  // Split content by code blocks: ```language ... ```
  const parts = text.split(/(```[\s\S]*?```)/g);

  return (
    <div className="markdown-content select-text font-sans">
      {parts.map((part, index) => {
        if (part.startsWith('```') && part.endsWith('```')) {
          // It's a code block
          const lines = part.split('\n');
          const firstLine = lines[0]; // e.g. ```javascript or ```jsx
          const language = firstLine.replace('```', '').trim() || 'code';
          const code = lines.slice(1, -1).join('\n');

          return (
            <div key={index} className="bg-[#050505] rounded-lg p-4 font-code-block text-[13px] text-on-surface border border-white/10 overflow-x-auto relative group my-4">
              <div className="flex justify-between items-center mb-2 pb-2 border-b border-white/5 select-none">
                <span className="text-xs font-semibold uppercase tracking-wider text-outline">{language}</span>
                <button
                  onClick={() => navigator.clipboard.writeText(code)}
                  className="bg-surface-container hover:bg-surface-container-high text-on-surface-variant hover:text-primary px-2 py-1 rounded transition-all cursor-pointer flex items-center justify-center text-xs gap-1 border border-white/5 active:scale-95"
                  title="Copy code"
                >
                  <span className="material-symbols-outlined text-[14px]">content_copy</span>
                  <span>Copy</span>
                </button>
              </div>
              <pre className="whitespace-pre"><code className={`language-${language}`}>{code}</code></pre>
            </div>
          );
        } else {
          // Standard text with paragraphs, bullet points, headers, inline code, bold text
          return <div key={index} dangerouslySetInnerHTML={{ __html: parseSimpleMarkdown(part) }} />;
        }
      })}
    </div>
  );
}

function parseSimpleMarkdown(md) {
  let html = md;

  // Escape HTML entities to prevent XSS (except for the ones we generate)
  html = html
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

  // Inline code: `code` -> <code>code</code>
  html = html.replace(/`([^`\n]+)`/g, '<code class="bg-white/10 px-1.5 py-0.5 rounded font-code-block text-xs text-secondary-dim font-medium">$1</code>');

  // Bold: **text** -> <strong>text</strong>
  html = html.replace(/\*\*([^*]+)\*\*/g, '<strong class="font-bold text-on-surface">$1</strong>');

  // Headers: ### text -> <h3 class="...">text</h3>
  html = html.replace(/^### (.*$)/gim, '<h3 class="text-sm font-bold text-on-surface mb-2 mt-4">$1</h3>');
  html = html.replace(/^## (.*$)/gim, '<h2 class="text-md font-bold text-on-surface mb-2 mt-4 border-b border-white/5 pb-1">$1</h2>');
  html = html.replace(/^# (.*$)/gim, '<h1 class="text-lg font-bold text-on-surface mb-3 mt-4">$1</h1>');

  // Unordered list items: * text or - text -> <li class="...">text</li>
  const lines = html.split('\n');
  let inList = false;
  const processedLines = lines.map(line => {
    const trimmed = line.trim();
    if (trimmed.startsWith('* ') || trimmed.startsWith('- ')) {
      const content = trimmed.substring(2);
      let listLine = '';
      if (!inList) {
        inList = true;
        listLine = '<ul class="list-disc pl-5 mb-3 text-xs text-on-surface-variant space-y-1">';
      }
      listLine += `<li class="text-xs text-on-surface-variant">${content}</li>`;
      return listLine;
    } else {
      let result = '';
      if (inList) {
        inList = false;
        result = '</ul>';
      }
      if (trimmed.length > 0) {
        result += `<p class="mb-3 text-xs text-on-surface-variant leading-relaxed">${trimmed}</p>`;
      }
      return result;
    }
  });

  if (inList) {
    processedLines.push('</ul>');
  }

  return processedLines.join('\n');
}

export default function App() {
  const [conversations, setConversations] = useState(() => {
    const saved = localStorage.getItem('ai_arena_conversations')
    return saved ? JSON.parse(saved) : []
  })
  
  const [activeId, setActiveId] = useState(() => {
    const saved = localStorage.getItem('ai_arena_active_id')
    return saved || ''
  })

  const [inputValue, setInputValue] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState(null)
  const [isBackendConnected, setIsBackendConnected] = useState(null)
  
  const chatEndRef = useRef(null)

  // Save conversations to localStorage
  useEffect(() => {
    localStorage.setItem('ai_arena_conversations', JSON.stringify(conversations))
  }, [conversations])

  // Save active conversation ID to localStorage
  useEffect(() => {
    if (activeId) {
      localStorage.setItem('ai_arena_active_id', activeId)
    } else {
      localStorage.removeItem('ai_arena_active_id')
    }
  }, [activeId])

  // Auto-scroll to bottom of chat
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [conversations, activeId, isLoading])

  // Check Backend Connection status
  useEffect(() => {
    const checkConnection = async () => {
      try {
        const res = await fetch('http://localhost:3000/')
        if (res.ok || res.status === 404 || res.status === 200) {
          setIsBackendConnected(true)
        } else {
          setIsBackendConnected(false)
        }
      } catch (e) {
        setIsBackendConnected(false)
      }
    }
    
    checkConnection()
    const interval = setInterval(checkConnection, 10000)
    return () => clearInterval(interval)
  }, [])

  const activeConversation = conversations.find(c => c.id === activeId)

  const handleStartNewBattle = () => {
    setActiveId('')
    setError(null)
  }

  const handleDeleteConversation = (id, e) => {
    e.stopPropagation()
    const updated = conversations.filter(c => c.id !== id)
    setConversations(updated)
    if (activeId === id) {
      setActiveId(updated.length > 0 ? updated[0].id : '')
    }
  }

  const handleSend = async (forcedText) => {
    const textToSend = forcedText || inputValue
    if (!textToSend.trim() || isLoading) return

    setInputValue('')
    setIsLoading(true)
    setError(null)

    let currentConversation = activeConversation
    let newConversations = [...conversations]
    
    // Create new conversation if none is active
    if (!currentConversation) {
      const newId = Date.now().toString()
      currentConversation = {
        id: newId,
        title: textToSend.length > 35 ? textToSend.slice(0, 35) + '...' : textToSend,
        messages: []
      }
      newConversations = [currentConversation, ...newConversations]
      setConversations(newConversations)
      setActiveId(newId)
    }

    // Append user message with loading placeholder
    const tempIndex = currentConversation.messages.length
    const updatedMessages = [
      ...currentConversation.messages,
      {
        problem: textToSend,
        solution_1: '',
        solution_2: '',
        judge: null,
        isTemp: true
      }
    ]

    setConversations(prev => prev.map(c => {
      if (c.id === currentConversation.id) {
        return { ...c, messages: updatedMessages }
      }
      return c
    }))

    try {
      const response = await fetch('http://localhost:3000/api/solve', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ problem: textToSend }),
      })

      if (!response.ok) {
        throw new Error('API request failed. Make sure the backend server is running.')
      }

      const data = await response.json()
      
      // Update loading placeholder with actual backend data
      setConversations(prev => prev.map(c => {
        if (c.id === currentConversation.id) {
          const finalMessages = [...c.messages]
          finalMessages[tempIndex] = {
            problem: data.problem || textToSend,
            solution_1: data.solution_1,
            solution_2: data.solution_2,
            judge: data.judge
          }
          return { ...c, messages: finalMessages }
        }
        return c
      }))
    } catch (err) {
      console.error(err)
      setError(err.message || 'Something went wrong')
      // Remove loading placeholder on failure
      setConversations(prev => prev.map(c => {
        if (c.id === currentConversation.id) {
          return { ...c, messages: c.messages.filter((_, idx) => idx !== tempIndex) }
        }
        return c
      }))
    } finally {
      setIsLoading(false)
    }
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  // Calculate winner text and colors based on scores
  const getWinnerInfo = (judge) => {
    if (!judge) return { text: 'Evaluating...', style: 'text-outline border-white/10' }
    const s1 = judge.solution_1_score
    const s2 = judge.solution_2_score
    if (s1 > s2) {
      return { 
        text: 'Model Alpha Wins 👑', 
        style: 'text-transparent bg-clip-text bg-gradient-to-r from-primary to-tertiary border-primary/20 bg-primary/5',
        sub: 'Mistral has the edge'
      }
    } else if (s2 > s1) {
      return { 
        text: 'Model Beta Wins 👑', 
        style: 'text-transparent bg-clip-text bg-gradient-to-r from-secondary to-tertiary border-secondary/20 bg-secondary/5',
        sub: 'Cohere has the edge'
      }
    } else {
      return { 
        text: 'It is a Tie! 🤝', 
        style: 'text-on-surface border-white/10 bg-white/5',
        sub: 'Both models scored equally'
      }
    }
  }

  // Helper to extract winner label for sidebar item
  const getConversationWinnerLabel = (convo) => {
    if (!convo.messages || convo.messages.length === 0) return null
    const latest = convo.messages[convo.messages.length - 1]
    if (!latest.judge) return 'Evaluating...'
    const s1 = latest.judge.solution_1_score
    const s2 = latest.judge.solution_2_score
    if (s1 > s2) return 'Winner: Alpha'
    if (s2 > s1) return 'Winner: Beta'
    return 'Tie'
  }

  const suggestions = [
    "Write a Javascript function for Factorial",
    "Create a React hook for tracking window resize",
    "Optimize a binary search algorithm in JS",
    "Explain CSS Grid vs Flexbox with examples"
  ]

  return (
    <div className="bg-background text-on-surface h-screen overflow-hidden flex font-body-md text-body-md select-none">
      {/* SIDEBAR */}
      <aside className="w-[300px] bg-surface-container-lowest border-r border-white/5 flex flex-col h-full shrink-0">
        <div className="p-gutter border-b border-white/5 flex items-center justify-between">
          <div className="flex items-center gap-2 text-on-surface">
            <span className="material-symbols-outlined text-primary">history</span>
            <span className="font-bold text-sm tracking-wide">Battle History</span>
          </div>
          <span className={`inline-block w-2.5 h-2.5 rounded-full ${isBackendConnected ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]' : 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.6)]'}`} title={isBackendConnected ? "Backend online" : "Backend offline"}></span>
        </div>
        
        <div className="p-gutter">
          <button 
            onClick={handleStartNewBattle}
            className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-primary-container to-secondary-container text-white font-semibold text-sm flex justify-center items-center gap-2 hover:shadow-[0_0_15px_rgba(124,58,237,0.4)] transition-all duration-300 active:scale-98 cursor-pointer select-none"
          >
            <span className="material-symbols-outlined text-sm">add</span>
            New Battle
          </button>
        </div>

        {/* Sidebar History Items */}
        <div className="flex-1 overflow-y-auto px-unit flex flex-col gap-2 pb-gutter">
          {conversations.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-40 text-center px-4">
              <span className="material-symbols-outlined text-outline text-3xl mb-2">chat_bubble_outline</span>
              <p className="text-xs text-outline">No battles fought yet.</p>
            </div>
          ) : (
            conversations.map(convo => {
              const isActive = convo.id === activeId
              const winnerLabel = getConversationWinnerLabel(convo)
              
              return (
                <div 
                  key={convo.id}
                  onClick={() => { setActiveId(convo.id); setError(null); }}
                  className={`p-3.5 rounded-xl transition-all duration-200 cursor-pointer group flex flex-col gap-2 relative ${
                    isActive 
                      ? 'bg-surface-container border border-primary/20 shadow-md' 
                      : 'glass-panel border border-transparent hover:bg-surface-container-low hover:border-white/5'
                  }`}
                >
                  <div className="flex justify-between items-start pr-6">
                    <p className={`text-xs font-medium line-clamp-2 leading-relaxed ${isActive ? 'text-on-surface' : 'text-on-surface-variant group-hover:text-on-surface'}`}>
                      {convo.title}
                    </p>
                  </div>
                  {winnerLabel && (
                    <div className="flex items-center">
                      <span className={`text-[9px] px-2 py-0.5 rounded-full border font-bold uppercase tracking-wider ${
                        winnerLabel === 'Winner: Alpha' 
                          ? 'bg-primary/10 text-primary border-primary/20' 
                          : winnerLabel === 'Winner: Beta' 
                          ? 'bg-secondary/10 text-secondary border-secondary/20' 
                          : winnerLabel === 'Tie'
                          ? 'bg-white/5 text-on-surface-variant border-white/10'
                          : 'bg-white/5 text-outline border-white/5'
                      }`}>
                        {winnerLabel}
                      </span>
                    </div>
                  )}
                  <button 
                    onClick={(e) => handleDeleteConversation(convo.id, e)}
                    className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity hover:text-red-400 p-0.5 rounded cursor-pointer"
                    title="Delete history"
                  >
                    <span className="material-symbols-outlined text-sm">delete</span>
                  </button>
                </div>
              )
            })
          )}
        </div>

        <div className="p-gutter border-t border-white/5 text-center text-xs text-outline font-medium tracking-wide">
          v1.0.0 • AI Battle Arena
        </div>
      </aside>

      {/* MAIN CHAT AREA */}
      <main className="flex-1 flex flex-col relative h-full bg-background select-text">
        {/* HEADER */}
        <header className="bg-surface/40 backdrop-blur-xl border-b border-white/5 flex justify-between items-center w-full px-container-padding h-20 sticky top-0 z-40 shrink-0">
          <div>
            <h1 className="font-extrabold text-lg md:text-xl tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-primary via-secondary to-tertiary">
              AI Battle Arena ⚔️
            </h1>
            <p className="text-xs text-on-surface-variant font-medium mt-0.5">
              Direct battle between Mistral and Cohere, refereed by Gemini
            </p>
          </div>
          
          <div className="flex items-center gap-4 text-on-surface-variant">
            {!isBackendConnected && (
              <span className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 flex items-center gap-1.5 animate-pulse">
                <span className="material-symbols-outlined text-[14px]">warning</span>
                Backend Offline
              </span>
            )}
            <div className="flex gap-2">
              <span className="text-xs font-medium bg-surface-container px-3 py-1.5 rounded-lg border border-white/5 text-on-surface flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-primary"></span> Mistral (Alpha)
              </span>
              <span className="text-xs font-medium bg-surface-container px-3 py-1.5 rounded-lg border border-white/5 text-on-surface flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-secondary"></span> Cohere (Beta)
              </span>
            </div>
          </div>
        </header>

        {/* CHAT THREAD VIEW */}
        <div className="flex-1 overflow-y-auto p-container-padding pb-32">
          {error && (
            <div className="max-w-3xl mx-auto mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 flex items-start gap-3">
              <span className="material-symbols-outlined mt-0.5">error_outline</span>
              <div className="flex-1 text-sm font-medium">
                <p className="font-bold text-red-300">Connection Error</p>
                <p className="mt-1">{error}</p>
              </div>
              <button onClick={() => setError(null)} className="text-xs underline font-bold cursor-pointer">Dismiss</button>
            </div>
          )}

          {!activeConversation || activeConversation.messages.length === 0 ? (
            /* Welcome / Empty State Screen */
            <div className="max-w-4xl mx-auto h-[60vh] flex flex-col justify-center items-center select-none text-center">
              <div className="w-16 h-16 rounded-3xl bg-gradient-to-tr from-primary-container/30 to-secondary-container/30 border border-primary/20 flex items-center justify-center mb-6 glow-accent">
                <span className="material-symbols-outlined text-primary text-3xl">sports_martial_arts</span>
              </div>
              <h2 className="text-2xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-primary to-secondary mb-2">
                Commence AI Code Battle
              </h2>
              <p className="text-sm text-on-surface-variant max-w-md leading-relaxed mb-8">
                Enter your coding question or prompt. Two models will generate code side-by-side, and Gemini will judge the winner based on correctness and style.
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full max-w-2xl px-4">
                {suggestions.map((sug, i) => (
                  <button
                    key={i}
                    onClick={() => handleSend(sug)}
                    className="glass-panel text-left p-4 rounded-xl hover:bg-surface-container-low hover:border-primary/20 transition-all duration-300 text-xs text-on-surface-variant hover:text-on-surface flex justify-between items-center group cursor-pointer"
                  >
                    <span>{sug}</span>
                    <span className="material-symbols-outlined text-sm text-outline group-hover:text-primary transition-colors">arrow_forward</span>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            /* Active Messages List */
            <div className="max-w-7xl mx-auto flex flex-col">
              {activeConversation.messages.map((msg, index) => {
                const isWinner = getWinnerInfo(msg.judge)
                
                return (
                  <div key={index} className="flex flex-col mb-12">
                    {/* User Question */}
                    <div className="flex justify-end mb-6">
                      <div className="glass-panel max-w-2xl p-4 rounded-2xl rounded-tr-sm border-r-2 border-r-primary/50 glow-accent shadow-lg">
                        <div className="flex items-center gap-1.5 mb-1.5 justify-end select-none">
                          <span className="text-xs font-bold text-primary">YOU</span>
                          <span className="material-symbols-outlined text-primary text-[14px]">person</span>
                        </div>
                        <p className="text-sm font-medium text-on-surface text-right leading-relaxed select-text">{msg.problem}</p>
                      </div>
                    </div>

                    {/* Loading State or Solutions Side-by-Side Grid */}
                    {msg.isTemp ? (
                      /* Pulse Loading Indicator */
                      <div className="grid grid-cols-1 xl:grid-cols-3 gap-gutter mt-4">
                        {/* Solution 1 loading */}
                        <div className="glass-panel rounded-xl p-5 h-80 flex flex-col justify-between animate-pulse">
                          <div className="flex items-center gap-2 pb-3 border-b border-white/5">
                            <div className="w-5 h-5 rounded bg-primary/20"></div>
                            <div className="w-24 h-4 bg-primary/20 rounded"></div>
                          </div>
                          <div className="flex-1 py-4 space-y-3">
                            <div className="w-full h-4 bg-white/5 rounded"></div>
                            <div className="w-5/6 h-4 bg-white/5 rounded"></div>
                            <div className="w-4/5 h-20 bg-white/5 rounded-lg"></div>
                          </div>
                          <div className="h-6 w-16 bg-white/5 rounded"></div>
                        </div>
                        
                        {/* Solution 2 loading */}
                        <div className="glass-panel rounded-xl p-5 h-80 flex flex-col justify-between animate-pulse">
                          <div className="flex items-center gap-2 pb-3 border-b border-white/5">
                            <div className="w-5 h-5 rounded bg-secondary/20"></div>
                            <div className="w-24 h-4 bg-secondary/20 rounded"></div>
                          </div>
                          <div className="flex-1 py-4 space-y-3">
                            <div className="w-full h-4 bg-white/5 rounded"></div>
                            <div className="w-5/6 h-4 bg-white/5 rounded"></div>
                            <div className="w-4/5 h-20 bg-white/5 rounded-lg"></div>
                          </div>
                          <div className="h-6 w-16 bg-white/5 rounded"></div>
                        </div>

                        {/* Judge loading */}
                        <div className="glass-panel rounded-xl p-5 h-80 flex flex-col justify-between animate-pulse border-tertiary/10">
                          <div className="flex items-center gap-2 pb-3 border-b border-white/5">
                            <div className="w-5 h-5 rounded bg-tertiary/20"></div>
                            <div className="w-24 h-4 bg-tertiary/20 rounded"></div>
                          </div>
                          <div className="flex-1 py-4 space-y-3 flex flex-col items-center justify-center">
                            <span className="material-symbols-outlined text-tertiary/30 text-3xl animate-spin mb-2">sync</span>
                            <div className="w-32 h-4 bg-tertiary/10 rounded"></div>
                          </div>
                          <div className="h-6 w-full bg-white/5 rounded"></div>
                        </div>
                      </div>
                    ) : (
                      /* Battle Output Display */
                      <div className="grid grid-cols-1 xl:grid-cols-3 gap-gutter mt-4">
                        {/* Card 1: Model Alpha */}
                        <div className="glass-panel rounded-xl flex flex-col h-full shadow-lg border-white/5">
                          <div className="bg-gradient-to-r from-primary-container/10 to-transparent p-4 border-b border-white/5 flex items-center justify-between select-none">
                            <div className="flex items-center gap-2">
                              <span className="material-symbols-outlined text-primary">smart_toy</span>
                              <span className="font-bold text-xs text-primary">Model Alpha</span>
                            </div>
                            <span className="bg-primary/10 text-primary text-[9px] px-2 py-0.5 rounded-full border border-primary/20 uppercase tracking-wider font-bold">
                              Mistral
                            </span>
                          </div>
                          <div className="p-5 flex-1 overflow-hidden select-text">
                            <Markdown text={msg.solution_1} />
                          </div>
                        </div>

                        {/* Card 2: Model Beta */}
                        <div className="glass-panel rounded-xl flex flex-col h-full shadow-lg border-white/5">
                          <div className="bg-gradient-to-r from-secondary-container/10 to-transparent p-4 border-b border-white/5 flex items-center justify-between select-none">
                            <div className="flex items-center gap-2">
                              <span className="material-symbols-outlined text-secondary">smart_toy</span>
                              <span className="font-bold text-xs text-secondary">Model Beta</span>
                            </div>
                            <span className="bg-secondary/10 text-secondary text-[9px] px-2 py-0.5 rounded-full border border-secondary/20 uppercase tracking-wider font-bold">
                              Cohere
                            </span>
                          </div>
                          <div className="p-5 flex-1 overflow-hidden select-text">
                            <Markdown text={msg.solution_2} />
                          </div>
                        </div>

                        {/* Card 3: Judge Verdict */}
                        <div className="glass-panel rounded-xl flex flex-col h-full shadow-lg border-tertiary/10">
                          <div className="bg-gradient-to-r from-tertiary-container/10 to-transparent p-4 border-b border-white/5 flex items-center gap-2 select-none">
                            <span className="material-symbols-outlined text-tertiary">emoji_events</span>
                            <span className="font-bold text-xs text-tertiary">Judge Verdict</span>
                            <span className="ml-auto bg-tertiary/10 text-tertiary text-[9px] px-2 py-0.5 rounded-full border border-tertiary/20 uppercase tracking-wider font-bold">
                              Gemini
                            </span>
                          </div>
                          <div className="p-5 flex flex-col h-full select-text">
                            {/* Score comparison visual */}
                            <div className="flex justify-between items-center mb-5 select-none bg-white/2px p-2.5 rounded-lg border border-white/5">
                              <div className="flex items-center gap-2">
                                <span className="text-xs font-bold text-primary">Alpha:</span>
                                <span className="text-xs bg-primary/10 text-primary border border-primary/20 px-2 py-0.5 rounded-md font-bold">
                                  {msg.judge?.solution_1_score}/10
                                </span>
                              </div>
                              <span className="text-[10px] text-outline font-bold">VS</span>
                              <div className="flex items-center gap-2">
                                <span className="text-xs font-bold text-secondary">Beta:</span>
                                <span className="text-xs bg-secondary/10 text-secondary border border-secondary/20 px-2 py-0.5 rounded-md font-bold">
                                  {msg.judge?.solution_2_score}/10
                                </span>
                              </div>
                            </div>
                            
                            {/* Winner banner */}
                            <div className={`text-center py-4 border rounded-xl mb-5 select-none ${isWinner.style}`}>
                              <span className="text-base font-extrabold block mb-0.5">{isWinner.text}</span>
                              <span className="text-[10px] text-on-surface-variant font-medium tracking-wide uppercase">{isWinner.sub}</span>
                            </div>

                            {/* Detailed reasoning */}
                            <div className="flex-1 space-y-4 overflow-y-auto max-h-[400px] pr-1">
                              <div>
                                <span className="text-[11px] font-bold text-primary select-none flex items-center gap-1 mb-1">
                                  <span className="material-symbols-outlined text-xs">notes</span>
                                  Alpha Assessment
                                </span>
                                <p className="text-xs text-on-surface-variant leading-relaxed">
                                  {msg.judge?.solution_1_reasoning || msg.judge?.solution_1_reasoningn}
                                </p>
                              </div>
                              <div className="border-t border-white/5 pt-3">
                                <span className="text-[11px] font-bold text-secondary select-none flex items-center gap-1 mb-1">
                                  <span className="material-symbols-outlined text-xs">notes</span>
                                  Beta Assessment
                                </span>
                                <p className="text-xs text-on-surface-variant leading-relaxed">
                                  {msg.judge?.solution_2_reasoning || msg.judge?.solution_2_reasoningn}
                                </p>
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

        {/* INPUT PANEL */}
        <div className="absolute bottom-0 left-0 right-0 p-container-padding bg-gradient-to-t from-background via-background/90 to-transparent pt-12 pb-6 z-30 select-none">
          <div className="max-w-4xl mx-auto relative glow-accent">
            <div className="glass-panel rounded-[24px] p-2 flex items-end gap-2 shadow-2xl border-white/5">
              <textarea 
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={handleKeyDown}
                disabled={isLoading}
                rows={1}
                className="w-full bg-transparent border-none text-on-surface placeholder-outline resize-none focus:outline-none focus:ring-0 p-4 text-sm leading-relaxed min-h-[52px] max-h-[160px] scrollbar-none"
                placeholder={isLoading ? "Generating code battle..." : "Challenge the models (e.g. Write a bubble sort function)..."}
              />
              <button 
                onClick={() => handleSend()}
                disabled={!inputValue.trim() || isLoading}
                className={`p-3 rounded-2xl shadow-lg transition-all duration-300 shrink-0 flex items-center justify-center m-1 border border-white/5 select-none ${
                  inputValue.trim() && !isLoading
                    ? 'bg-gradient-to-r from-primary-container to-secondary-container text-white cursor-pointer active:scale-95 hover:shadow-[0_0_12px_rgba(124,58,237,0.3)]'
                    : 'bg-white/5 text-outline cursor-not-allowed'
                }`}
              >
                {isLoading ? (
                  <span className="material-symbols-outlined text-sm animate-spin">sync</span>
                ) : (
                  <span className="material-symbols-outlined text-sm">send</span>
                )}
              </button>
            </div>
            <div className="text-center mt-2.5">
              <span className="text-[10px] text-outline font-label-caps tracking-widest">
                AI Battle Arena can make mistakes. Always verify output.
              </span>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
