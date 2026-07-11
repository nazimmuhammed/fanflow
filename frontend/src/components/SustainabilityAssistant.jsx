import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import axios from 'axios'
import { API_URL } from '../config'

const BIN_STYLES = {
  RECYCLING: { color: '#3FD5C0', emoji: '♻️' },
  COMPOST: { color: '#D4A72C', emoji: '🌱' },
  LANDFILL: { color: '#9ca3af', emoji: '🗑️' }
}

function parseBinResult(text) {
  const bin = Object.keys(BIN_STYLES).find(b => text.toUpperCase().startsWith(b))
  return bin || null
}

function SustainabilityAssistant() {
  const [item, setItem] = useState('')
  const [result, setResult] = useState('')
  const [loading, setLoading] = useState(false)
  const [initiatives, setInitiatives] = useState([])

  useEffect(() => {
    axios.get(`${API_URL}/api/sustainability`)
      .then(res => setInitiatives(res.data.initiatives))
      .catch(err => console.error('Failed to load sustainability info:', err))
  }, [])

  const checkItem = async () => {
    if (!item.trim() || loading) return
    setLoading(true)
    setResult('')
    try {
      const res = await axios.post(`${API_URL}/api/sustainability/sort`, { item })
      setResult(res.data.result)
    } catch (err) {
      setResult("Couldn't check that item. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  const handleKeyDown = (e) => { if (e.key === 'Enter') checkItem() }

  const bin = parseBinResult(result)
  const binStyle = bin ? BIN_STYLES[bin] : null

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className="bg-turf/30 border border-gold/20 rounded-2xl p-5 backdrop-blur-sm"
    >
      <p className="font-display text-xl tracking-wide mb-1 text-gold">SUSTAINABILITY</p>
      <p className="text-xs text-offwhite/50 mb-4">Describe an item to find out which bin it goes in</p>

      <div className="flex gap-2 mb-4">
        <input
          type="text"
          value={item}
          onChange={(e) => setItem(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="e.g. plastic water bottle"
          className="flex-1 bg-pitch text-offwhite text-sm rounded-lg px-3 py-2 outline-none border border-gold/20 focus:border-gold placeholder:text-offwhite/40"
        />
        <motion.button
          onClick={checkItem}
          disabled={loading}
          whileTap={{ scale: 0.9 }}
          whileHover={{ scale: 1.05 }}
          className="bg-gold text-pitch font-semibold text-sm px-4 py-2 rounded-lg disabled:opacity-50"
        >
          Check
        </motion.button>
      </div>

      <AnimatePresence mode="wait">
        {result && (
          <motion.div
            key={result}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="rounded-lg px-4 py-3 mb-4 flex items-center gap-3"
            style={{ backgroundColor: binStyle ? `${binStyle.color}22` : 'rgba(255,255,255,0.05)', border: `1px solid ${binStyle ? binStyle.color : '#666'}` }}
          >
            <span className="text-2xl">{binStyle ? binStyle.emoji : '❓'}</span>
            <p className="text-sm text-offwhite/90">{loading ? 'Checking...' : result}</p>
          </motion.div>
        )}
      </AnimatePresence>

      <p className="text-xs font-semibold text-offwhite/70 mb-2">Green initiatives at this stadium:</p>
      <ul className="space-y-1.5">
        {initiatives.map((init, i) => (
          <motion.li
            key={i}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.1 }}
            className="text-sm flex items-start gap-2"
          >
            <span className="text-cyan mt-0.5">🌿</span>
            <span className="text-offwhite/80">{init}</span>
          </motion.li>
        ))}
      </ul>
    </motion.div>
  )
}

export default SustainabilityAssistant