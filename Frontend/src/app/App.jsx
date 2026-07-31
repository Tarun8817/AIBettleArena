import { useState, useEffect, useRef } from 'react'
import Sidebar from '../components/Sidebar'
import Header from '../components/Header'
import BattleArea from '../components/BattleArea'
import InputPanel from '../components/InputPanel'

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
  const [isSidebarOpen, setIsSidebarOpen] = useState(true)
  
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

  // Derive active conversation object
  const activeConversation = conversations.find(c => c.id === activeId)

  // Create a new empty conversation battle
  const handleStartNewBattle = () => {
    const newConvo = {
      id: Date.now().toString(),
      title: 'New Code Battle',
      messages: []
    }
    setConversations(prev => [newConvo, ...prev])
    setActiveId(newConvo.id)
    setError(null)
  }

  // Delete a battle from history list
  const handleDeleteConversation = (id, event) => {
    event.stopPropagation()
    setConversations(prev => prev.filter(c => c.id !== id))
    if (activeId === id) {
      const remaining = conversations.filter(c => c.id !== id)
      if (remaining.length > 0) {
        setActiveId(remaining[0].id)
      } else {
        setActiveId('')
      }
    }
  }

  // Trigger battle submission
  const handleSend = async (problemText) => {
    if (!problemText.trim()) return

    // Ensure we have an active conversation, create one if not
    let currentConversation = activeConversation
    if (!currentConversation) {
      const newConvo = {
        id: Date.now().toString(),
        title: problemText.trim(),
        messages: []
      }
      setConversations(prev => [newConvo, ...prev])
      setActiveId(newConvo.id)
      currentConversation = newConvo
    }

    // Update conversation title if it was default
    if (currentConversation.title === 'New Code Battle') {
      setConversations(prev => prev.map(c => {
        if (c.id === currentConversation.id) {
          return { ...c, title: problemText.trim() }
        }
        return c
      }))
    }

    // Append user message with loading indicator states
    const tempIndex = currentConversation.messages.length
    const userMessage = {
      problem: problemText.trim(),
      solution_1: '',
      solution_2: '',
      judge: null,
      isTemp: true
    }

    setConversations(prev => prev.map(c => {
      if (c.id === currentConversation.id) {
        return { ...c, messages: [...c.messages, userMessage] }
      }
      return c
    }))

    setInputValue('')
    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch('http://localhost:3000/api/solve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ problem: problemText.trim() })
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || `HTTP error! Status: ${response.status}`)
      }

      const data = await response.json()
      
      // Update loading message block with real results
      setConversations(prev => prev.map(c => {
        if (c.id === currentConversation.id) {
          const updatedMessages = [...c.messages]
          updatedMessages[tempIndex] = {
            problem: problemText.trim(),
            solution_1: data.solution_1 || 'No solution generated.',
            solution_2: data.solution_2 || 'No solution generated.',
            judge: data.judge || null,
            isTemp: false
          }
          return { ...c, messages: updatedMessages }
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

  // Derive Judge Winner colors and text details
  const getWinnerInfo = (judge) => {
    if (!judge) return { text: 'Evaluating...', sub: 'Awaiting score card', style: 'bg-[#171717] border-[#27272a] text-[#a1a1aa]' }
    
    const s1 = judge.solution_1_score
    const s2 = judge.solution_2_score

    if (s1 === 0 && s2 === 0) {
      return {
        text: 'Evaluation Paused',
        sub: 'Gemini Rate Limited or Offline',
        style: 'bg-[#ef4444]/10 border-[#ef4444]/25 text-[#ef4444]'
      }
    }

    if (s1 > s2) {
      return {
        text: 'Model Alpha Wins 👑',
        sub: 'Mistral has the edge',
        style: 'bg-[#6366f1]/10 border-[#6366f1]/25 text-[#818cf8]'
      }
    } else if (s2 > s1) {
      return {
        text: 'Model Beta Wins 👑',
        sub: 'Cohere has the edge',
        style: 'bg-[#818cf8]/10 border-[#818cf8]/25 text-[#818cf8]'
      }
    } else {
      return {
        text: "It's a Tie 🤝",
        sub: 'Both models scored equal',
        style: 'bg-[#27272a]/80 border-[#27272a] text-[#f5f5f5]'
      }
    }
  }

  // Helper to extract winner label for sidebar item
  const getConversationWinnerLabel = (convo) => {
    if (!convo.messages || convo.messages.length === 0) return null
    const latest = convo.messages[convo.messages.length - 1]
    if (latest.isTemp) return 'Evaluating...'
    if (!latest.judge) return 'Evaluating...'
    const s1 = latest.judge.solution_1_score
    const s2 = latest.judge.solution_2_score
    if (s1 === 0 && s2 === 0) return 'Error'
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
    <div className="bg-[#090909] text-[#f5f5f5] h-screen overflow-hidden flex font-sans text-xs select-none">
      {/* SIDEBAR */}
      <Sidebar
        isSidebarOpen={isSidebarOpen}
        conversations={conversations}
        activeId={activeId}
        setActiveId={setActiveId}
        isBackendConnected={isBackendConnected}
        handleStartNewBattle={handleStartNewBattle}
        handleDeleteConversation={handleDeleteConversation}
        getConversationWinnerLabel={getConversationWinnerLabel}
      />

      {/* MAIN CHAT AREA */}
      <main className="flex-1 flex flex-col relative h-full bg-[#090909] overflow-hidden">
        {/* HEADER */}
        <Header
          isSidebarOpen={isSidebarOpen}
          setIsSidebarOpen={setIsSidebarOpen}
          isBackendConnected={isBackendConnected}
        />

        {/* CHAT THREAD VIEW */}
        <BattleArea
          activeConversation={activeConversation}
          isLoading={isLoading}
          suggestions={suggestions}
          handleSend={handleSend}
          getWinnerInfo={getWinnerInfo}
          chatEndRef={chatEndRef}
          error={error}
          setError={setError}
        />

        {/* INPUT PANEL */}
        <InputPanel
          inputValue={inputValue}
          setInputValue={setInputValue}
          isLoading={isLoading}
          handleSend={handleSend}
        />
      </main>
    </div>
  )
}
