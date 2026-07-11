import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import axios from 'axios'

function CrowdIntel() {
  const [readings, setReadings] = useState([])
  const [alert, setAlert] = useState('')
  const [loadingAlert, setLoadingAlert] = useState(false)

  // Poll live crowd data every 4 seconds - simulates a real sensor feed
  useEffect(() => {
    const fetchLive = () => {
      axios.get('http://127.0.0.1:8000/api/crowd/live')
        .then(res => setReadings(res.data))
        .catch(err => console.error('Failed to fetch live crowd data:', err))
    }
    fetchLive()
    const interval = setInterval(fetchLive, 4000)
    return () => clearInterval(interval)
  }, [])

  // Fetch a fresh GenAI alert every 12 seconds (less frequent - it's an LLM call)
  useEffect(() => {
    const fetchAlert = () => {
      setLoadingAlert(true)
      axios.post('http://127.0.0.1:8000/api/crowd/alert')
        .then(res => setAlert(res.data.alert))
        .catch(err => console.error('Failed to fetch alert:', err))
        .finally(() => setLoadingAlert(false))
    }
    fetchAlert()
    const interval = setInterval(fetchAlert, 12000)
    return () => clearInterval(interval)
  }, [])

  const barColor = (density) => {
    if (density >= 80) return '#ef4444'
    if (density >= 50) return '#D4A72C'
    return '#3FD5C0'
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className="bg-turf/30 border border-gold/20 rounded-2xl p-5 backdrop-blur-sm"
    >
      <div className="flex items-center gap-2 mb-1">
        <motion.div
          className="w-2 h-2 rounded-full bg-red-500"
          animate={{ opacity: [1, 0.3, 1] }}
          transition={{ duration: 1.5, repeat: Infinity }}
        />
        <p className="font-display text-xl tracking-wide text-gold">CROWD INTELLIGENCE</p>
      </div>
      <p className="text-xs text-offwhite/50 mb-4">Live sensor feed · AI-generated operator alerts</p>

      <AnimatePresence mode="wait">
        <motion.div
          key={alert}
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.4 }}
          className="bg-pitch/60 border border-gold/30 rounded-lg px-4 py-3 mb-5 flex items-start gap-2"
        >
          <span className="text-lg">🎙️</span>
          <p className="text-sm text-offwhite/90 leading-relaxed">
            {loadingAlert && !alert ? 'Analyzing crowd conditions...' : alert}
          </p>
        </motion.div>
      </AnimatePresence>

      <div className="space-y-3">
        {readings.map(r => (
          <div key={r.gateId}>
            <div className="flex justify-between text-sm mb-1">
              <span className="font-semibold">Gate {r.gateId}</span>
              <span className="text-xs text-offwhite/60">{r.density}%</span>
            </div>
            <div className="w-full h-2.5 bg-pitch rounded-full overflow-hidden">
              <motion.div
                className="h-full rounded-full"
                animate={{ width: `${r.density}%`, backgroundColor: barColor(r.density) }}
                transition={{ duration: 0.8, ease: 'easeOut' }}
              />
            </div>
          </div>
        ))}
      </div>
    </motion.div>
  )
}

export default CrowdIntel