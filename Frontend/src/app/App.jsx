import { useState, useEffect, useRef } from 'react'
import Sidebar from '../components/Sidebar'
import Header from '../components/Header'
import BattleArea from '../components/BattleArea'
import InputPanel from '../components/InputPanel'

export default function App() {
  const [conversations, setConversations] = useState([])
  
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

  // Load conversations from MongoDB on mount
  useEffect(() => {
    const fetchConversations = async () => {
      try {
        const res = await fetch('http://localhost:3000/api/battles')
        if (res.ok) {
          const data = await res.json()
          // Map _id to id so we don't break existing components referencing .id
          const normalized = data.map(c => ({ ...c, id: c._id }))
          setConversations(normalized)
        }
      } catch (err) {
        console.error("Failed to load battles from database:", err)
      }
    }
    fetchConversations()
  }, [])

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

  // Create a new empty conversation battle in MongoDB
  const handleStartNewBattle = async () => {
    try {
      const res = await fetch('http://localhost:3000/api/battles', {
        method: 'POST'
      })
      if (res.ok) {
        const data = await res.json()
        const newConvo = { ...data, id: data._id }
        setConversations(prev => [newConvo, ...prev])
        setActiveId(newConvo.id)
        setError(null)
      } else {
        throw new Error("Failed to create battle in database")
      }
    } catch (err) {
      console.error(err)
      setError("Database Error: Could not create new battle session.")
    }
  }

  // Delete a battle from MongoDB and history list
  const handleDeleteConversation = async (id, event) => {
    event.stopPropagation()
    try {
      const res = await fetch(`http://localhost:3000/api/battles/${id}`, {
        method: 'DELETE'
      })
      if (res.ok) {
        setConversations(prev => prev.filter(c => c.id !== id))
        if (activeId === id) {
          const remaining = conversations.filter(c => c.id !== id)
          if (remaining.length > 0) {
            setActiveId(remaining[0].id)
          } else {
            setActiveId('')
          }
        }
      } else {
        throw new Error("Failed to delete battle from database")
      }
    } catch (err) {
      console.error(err)
      setError("Database Error: Could not delete battle session.")
    }
  }

  // Trigger battle submission
  const handleSend = async (problemText) => {
    if (!problemText.trim()) return

    let currentConversation = activeConversation
    let currentId = activeId

    // If there is no active battle, create one first in MongoDB
    if (!currentConversation) {
      try {
        const res = await fetch('http://localhost:3000/api/battles', {
          method: 'POST'
        })
        if (res.ok) {
          const data = await res.json()
          const newConvo = { ...data, id: data._id }
          setConversations(prev => [newConvo, ...prev])
          setActiveId(newConvo.id)
          currentConversation = newConvo
          currentId = newConvo.id
        } else {
          throw new Error("Failed to create battle session")
        }
      } catch (err) {
        console.error(err)
        setError("Database Error: Could not start battle session.")
        return
      }
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
      if (c.id === currentId) {
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
        body: JSON.stringify({ 
          problem: problemText.trim(),
          battleId: currentId 
        })
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || `HTTP error! Status: ${response.status}`)
      }

      const data = await response.json()
      const updatedBattle = { ...data.battle, id: data.battle._id }
      
      // Update conversations list with the saved database record
      setConversations(prev => prev.map(c => {
        if (c.id === updatedBattle.id) {
          return updatedBattle
        }
        return c
      }))
    } catch (err) {
      console.error(err)
      setError(err.message || 'Something went wrong')
      // Remove loading placeholder on failure
      setConversations(prev => prev.map(c => {
        if (c.id === currentId) {
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
