import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import axios from 'axios'
import ChatConcierge from './components/ChatConcierge'
import BouncingBalls from './components/BouncingBalls'
import MapView from './components/MapView'
import CrowdIntel from './components/CrowdIntel'
import AccessibilityBar from './components/AccessibilityBar'
import TransportAssistant from './components/TransportAssistant'
import SustainabilityAssistant from './components/SustainabilityAssistant'
import OperatorView from './components/OperatorView'
import { API_URL } from "./config"

function App() {
  const [gates, setGates] = useState([])
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 })
  const [highContrast, setHighContrast] = useState(false)
  const [ttsEnabled, setTtsEnabled] = useState(false)
  const [accessibleOnly, setAccessibleOnly] = useState(false)
  const [viewMode, setViewMode] = useState('fan')

  useEffect(() => {
    axios.get(`${API_URL}/api/gates`)
      .then(res => setGates(res.data))
      .catch(err => console.error('Failed to load gates:', err))
  }, [])

  useEffect(() => {
    const handleMouseMove = (e) => setMousePos({ x: e.clientX, y: e.clientY })
    window.addEventListener('mousemove', handleMouseMove)
    return () => window.removeEventListener('mousemove', handleMouseMove)
  }, [])

  const congestionColor = (level) => {
    if (level === 'high') return 'bg-red-500'
    if (level === 'medium') return 'bg-gold'
    if (level === 'low') return 'bg-cyan'
    return 'bg-gray-600'
  }

  const congestionWidth = (level) => {
    if (level === 'high') return '85%'
    if (level === 'medium') return '55%'
    if (level === 'low') return '25%'
    return '5%'
  }

  const containerVariants = { hidden: {}, visible: { transition: { staggerChildren: 0.1 } } }
  const rowVariants = {
    hidden: { opacity: 0, x: -20 },
    visible: { opacity: 1, x: 0, transition: { duration: 0.5, ease: 'easeOut' } }
  }

  return (
    <div className={`min-h-screen bg-pitch text-offwhite relative overflow-hidden ${highContrast ? 'high-contrast' : ''}`}>
      <BouncingBalls />

      <div
        className="pointer-events-none fixed inset-0 z-0 transition-opacity duration-300"
        style={{
          background: `radial-gradient(600px circle at ${mousePos.x}px ${mousePos.y}px, rgba(212,167,44,0.08), transparent 40%)`
        }}
      />

      <motion.header
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="border-b border-gold/20 px-6 py-4 flex items-center justify-between relative z-10"
      >
        <div className="flex items-center gap-3">
          <motion.div
            className="w-3 h-3 rounded-full bg-cyan"
            animate={{ opacity: [1, 0.3, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
          />
          <p className="font-display text-2xl tracking-wide">FANFLOW AI</p>
        </div>

        <div className="flex items-center gap-4">
          <p className="text-xs font-semibold text-offwhite/60 uppercase tracking-widest hidden md:block">
            FIFA World Cup 2026 · MetLife Stadium
          </p>
          <button
            onClick={() => setViewMode(viewMode === 'fan' ? 'operator' : 'fan')}
            aria-label={viewMode === 'fan' ? 'Switch to staff view' : 'Switch to fan view'}
            className="text-xs font-bold px-3 py-1.5 rounded-full border border-gold text-gold hover:bg-gold hover:text-pitch transition-colors whitespace-nowrap"
          >
            {viewMode === 'fan' ? '🎽 Switch to Staff View' : '🏟️ Switch to Fan View'}
          </button>
        </div>
      </motion.header>

      <AccessibilityBar
        highContrast={highContrast}
        setHighContrast={setHighContrast}
        ttsEnabled={ttsEnabled}
        setTtsEnabled={setTtsEnabled}
        accessibleOnly={accessibleOnly}
        setAccessibleOnly={setAccessibleOnly}
      />

      {viewMode === 'fan' ? (
        <main>
          <div className="relative z-10 border-b border-gold/10 bg-turf/20 overflow-hidden py-2">
            <motion.div
              className="whitespace-nowrap text-xs font-semibold text-gold/80 tracking-wider"
              animate={{ x: ['0%', '-50%'] }}
              transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
              aria-hidden="true"
            >
              {"  ⚽ GATE C — HIGH CONGESTION, REDIRECT SUGGESTED    🚌 SHUTTLE 2 DEPARTING IN 6 MIN    ♿ ACCESSIBLE ROUTES ACTIVE AT GATES A, B, D, E    🌱 REUSABLE CUP PROGRAM LIVE NEAR GATE A    ⚽ GATE C — HIGH CONGESTION, REDIRECT SUGGESTED    🚌 SHUTTLE 2 DEPARTING IN 6 MIN    ♿ ACCESSIBLE ROUTES ACTIVE AT GATES A, B, D, E    🌱 REUSABLE CUP PROGRAM LIVE NEAR GATE A  "}
            </motion.div>
          </div>

          <motion.section
            initial={{ y: -100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.7, delay: 0.2 }}
            className="px-6 py-10 text-center border-b border-gold/10 relative z-10"
          >
            <motion.div
              initial={{ rotate: 0, scale: 0 }}
              animate={{ rotate: 360, scale: 1 }}
              transition={{ duration: 1, ease: 'easeOut', delay: 0.1 }}
              className="mx-auto mb-4 text-6xl drop-shadow-[0_0_14px_rgba(212,167,44,0.6)]"
              aria-hidden="true"
            >
              ⚽
            </motion.div>
            <p className="text-gold text-xs font-bold tracking-[0.3em] uppercase mb-2">Matchday Operations</p>
            <h1 className="font-display text-5xl md:text-6xl tracking-wide leading-tight">
              YOUR STADIUM,<br /><span className="text-gold">INTELLIGENTLY GUIDED</span>
            </h1>
            <p className="text-offwhite/60 mt-4 max-w-xl mx-auto text-sm">
              Real-time navigation, crowd intelligence, and multilingual assistance —
              powered by GenAI, built for the world's biggest tournament.
            </p>
          </motion.section>

          <section className="px-6 py-10 max-w-7xl mx-auto relative z-10 space-y-8">

            <div className="grid md:grid-cols-3 gap-8">
              <motion.div
                initial={{ opacity: 0, x: -30 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, delay: 0.3 }}
                whileHover={{ scale: 1.01 }}
                className="bg-turf/30 border border-gold/20 rounded-2xl p-5 backdrop-blur-sm"
              >
                <p className="font-display text-xl tracking-wide mb-4 text-gold">LIVE GATE STATUS</p>
                <motion.div
                  className="space-y-4"
                  variants={containerVariants}
                  initial="hidden"
                  animate={gates.length > 0 ? 'visible' : 'hidden'}
                >
                  {gates.length === 0 && <p className="text-offwhite/40 text-sm">Loading gate data...</p>}
                  {gates.map(gate => (
                    <motion.div key={gate.id} variants={rowVariants} whileHover={{ x: 4 }}>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="font-semibold">{gate.name}</span>
                        <span className="uppercase text-xs text-offwhite/60">{gate.status} · {gate.congestion}</span>
                      </div>
                      <div className="w-full h-2 bg-pitch rounded-full overflow-hidden">
                        <motion.div
                          className={`h-full ${congestionColor(gate.congestion)}`}
                          initial={{ width: 0 }}
                          animate={{ width: congestionWidth(gate.congestion) }}
                          transition={{ duration: 1, ease: 'easeOut', delay: 0.2 }}
                        />
                      </div>
                    </motion.div>
                  ))}
                </motion.div>
              </motion.div>

              <MapView accessibleOnly={accessibleOnly} />
              <CrowdIntel />
            </div>

            <div className="grid md:grid-cols-2 gap-8">
              <TransportAssistant />
              <SustainabilityAssistant />
            </div>

            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="flex justify-center"
            >
              <ChatConcierge ttsEnabled={ttsEnabled} />
            </motion.div>

          </section>
        </main>
      ) : (
        <OperatorView />
      )}

      <footer className="text-center text-offwhite/30 text-xs py-6 border-t border-gold/10 relative z-10">
        FanFlow AI — GenAI Smart Stadium Concept · FIFA World Cup 2026
      </footer>
    </div>
  )
}

export default App