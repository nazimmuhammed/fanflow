import { useState, useRef, useEffect } from 'react'
import { motion } from 'framer-motion'
import axios from 'axios'

const LANGUAGES = ['English', 'Spanish', 'French', 'Portuguese', 'Arabic', 'Hindi']

function ChatConcierge({ ttsEnabled }) {
  const [messages, setMessages] = useState([
    { role: 'assistant', text: "Welcome to MetLife Stadium! I'm your FanFlow concierge. Ask me about gates, restrooms, parking, shuttles, or anything else." }
  ])
  const [input, setInput] = useState('')
  const [language, setLanguage] = useState('English')
  const [loading, setLoading] = useState(false)
  const bottomRef = useRef(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const speak = (text) => {
    if (!ttsEnabled) return
    window.speechSynthesis.cancel()
    const utterance = new SpeechSynthesisUtterance(text)
    utterance.rate = 1
    window.speechSynthesis.speak(utterance)
  }

  const sendMessage = async () => {
    if (!input.trim() || loading) return
    const userMessage = { role: 'user', text: input }
    setMessages(prev => [...prev, userMessage])
    setInput('')
    setLoading(true)
    try {
      const res = await axios.post('http://127.0.0.1:8000/api/chat', {
        message: userMessage.text,
        language: language
      })
      setMessages(prev => [...prev, { role: 'assistant', text: res.data.answer }])
      speak(res.data.answer)
    } catch (err) {
      const errorText = "Sorry, I couldn't reach the stadium system. Please check that the backend server is running."
      setMessages(prev => [...prev, { role: 'assistant', text: errorText }])
      speak(errorText)
    } finally {
      setLoading(false)
    }
  }

  const handleKeyDown = (e) => { if (e.key === 'Enter') sendMessage() }

  return (
    <div className="bg-turf/40 border border-gold/30 rounded-2xl flex flex-col h-[600px] w-full max-w-md overflow-hidden shadow-2xl">
      <div className="bg-gold text-pitch px-4 py-3 flex items-center justify-between">
        <div>
          <p className="font-display text-xl tracking-wide leading-none">FANFLOW CONCIERGE</p>
          <p className="text-xs font-semibold opacity-80">
            LIVE · MetLife Stadium {ttsEnabled && '· 🔊 Voice On'}
          </p>
        </div>
        <select
          value={language}
          onChange={(e) => setLanguage(e.target.value)}
          className="bg-pitch text-offwhite text-xs rounded px-2 py-1 border border-pitch/40 outline-none"
        >
          {LANGUAGES.map(lang => <option key={lang} value={lang}>{lang}</option>)}
        </select>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
        {messages.map((msg, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.25 }}
            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[80%] px-3 py-2 rounded-lg text-sm leading-relaxed ${
                msg.role === 'user'
                  ? 'bg-cyan text-pitch font-medium rounded-br-none'
                  : 'bg-pitch/60 text-offwhite border border-gold/20 rounded-bl-none'
              }`}
            >
              {msg.text}
            </div>
          </motion.div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="bg-pitch/60 border border-gold/20 text-offwhite/60 px-3 py-2 rounded-lg text-sm italic">
              typing...
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      <div className="border-t border-gold/20 p-3 flex gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Ask about gates, restrooms, parking..."
          className="flex-1 bg-pitch text-offwhite text-sm rounded-lg px-3 py-2 outline-none border border-gold/20 focus:border-gold placeholder:text-offwhite/40"
        />
        <motion.button
          onClick={sendMessage}
          disabled={loading}
          whileTap={{ scale: 0.8, rotate: -25 }}
          whileHover={{ scale: 1.08 }}
          className="bg-gold text-pitch font-semibold text-sm px-4 py-2 rounded-lg hover:opacity-90 disabled:opacity-50 transition flex items-center gap-1.5"
        >
          <motion.span
            className="text-sm inline-block"
            animate={loading ? { rotate: 360 } : { rotate: 0 }}
            transition={loading ? { duration: 0.6, repeat: Infinity, ease: 'linear' } : { duration: 0.3 }}
          >
            ⚽
          </motion.span>
          Send
        </motion.button>
      </div>
    </div>
  )
}

export default ChatConcierge