 import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import axios from 'axios'
import { API_URL } from '../config'

const GATES = ['A', 'B', 'C', 'D', 'E']

function TransportAssistant() {
  const [selectedGate, setSelectedGate] = useState('A')
  const [recommendation, setRecommendation] = useState('')
  const [loading, setLoading] = useState(false)

  const getRecommendation = async (gate) => {
    setLoading(true)
    setRecommendation('')
    try {
      const res = await axios.post(`${API_URL}/api/transport/recommend`, { gate })
      setRecommendation(res.data.recommendation)
    } catch (err) {
      setRecommendation("Couldn't reach the transport system. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  const handleGateClick = (gate) => {
    setSelectedGate(gate)
    getRecommendation(gate)
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className="bg-turf/30 border border-gold/20 rounded-2xl p-5 backdrop-blur-sm"
    >
      <p className="font-display text-xl tracking-wide mb-1 text-gold">TRANSPORTATION</p>
      <p className="text-xs text-offwhite/50 mb-4">Select your destination gate for a live travel recommendation</p>

      <div className="flex flex-wrap gap-2 mb-4">
        {GATES.map(gate => (
          <motion.button
            key={gate}
            onClick={() => handleGateClick(gate)}
            whileTap={{ scale: 0.9 }}
            whileHover={{ scale: 1.05 }}
            className={`w-10 h-10 rounded-full text-sm font-bold transition-colors ${
              selectedGate === gate
                ? 'bg-gold text-pitch'
                : 'bg-pitch text-offwhite/70 border border-gold/30 hover:border-gold/60'
            }`}
          >
            {gate}
          </motion.button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={recommendation || 'loading'}
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="bg-pitch/60 border border-gold/30 rounded-lg px-4 py-3 flex items-start gap-2"
        >
          <span className="text-lg">🚌</span>
          <p className="text-sm text-offwhite/90 leading-relaxed">
            {loading ? 'Finding the best route...' : (recommendation || 'Pick a gate above to get a recommendation.')}
          </p>
        </motion.div>
      </AnimatePresence>
    </motion.div>
  )
}

export default TransportAssistant