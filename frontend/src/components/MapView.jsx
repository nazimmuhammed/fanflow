import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import axios from 'axios'
import { API_URL } from '../config'

function scalePos(loc) {
  return { x: (loc.x / 370) * 320 + 40, y: (loc.y / 370) * 320 + 20 }
}

const congestionFill = (level) => {
  if (level === 'high') return '#ef4444'
  if (level === 'medium') return '#D4A72C'
  if (level === 'low') return '#3FD5C0'
  return '#4b5563'
}

function MapView({ accessibleOnly }) {
  const [gates, setGates] = useState([])
  const [amenities, setAmenities] = useState([])
  const [selectedGate, setSelectedGate] = useState(null)

  useEffect(() => {
    axios.get(`${API_URL}/api/gates`).then(res => setGates(res.data))
axios.get(`${API_URL}/api/amenities`).then(res => setAmenities(res.data))
  }, [])

  const amenitiesForGate = (gateId) => amenities.filter(a => a.gate === gateId)

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className="bg-turf/30 border border-gold/20 rounded-2xl p-5 backdrop-blur-sm"
    >
      <p className="font-display text-xl tracking-wide mb-1 text-gold">STADIUM MAP</p>
      <p className="text-xs text-offwhite/50 mb-4">
        Click a gate to see nearby amenities
        {accessibleOnly && ' · ♿ Showing accessible gates only'}
      </p>

      <div className="flex flex-col md:flex-row gap-6">
        <svg viewBox="0 0 400 400" className="w-full max-w-md mx-auto">
          <ellipse cx="200" cy="200" rx="190" ry="180" fill="none" stroke="#D4A72C" strokeOpacity="0.15" strokeWidth="20" />
          <ellipse cx="200" cy="200" rx="110" ry="70" fill="#1B4D3E" fillOpacity="0.4" stroke="#F5F7F5" strokeOpacity="0.2" strokeWidth="1.5" />
          <line x1="200" y1="130" x2="200" y2="270" stroke="#F5F7F5" strokeOpacity="0.2" strokeWidth="1.5" />
          <circle cx="200" cy="200" r="22" fill="none" stroke="#F5F7F5" strokeOpacity="0.2" strokeWidth="1.5" />

          {gates.map(gate => {
            const pos = scalePos(gate.location)
            const isSelected = selectedGate?.id === gate.id
            const isDimmed = accessibleOnly && !gate.accessible
            return (
              <g key={gate.id} onClick={() => setSelectedGate(gate)} className="cursor-pointer">
                <motion.circle
                  cx={pos.x}
                  cy={pos.y}
                  r={isSelected ? 20 : 16}
                  fill={congestionFill(gate.congestion)}
                  fillOpacity={isDimmed ? 0.15 : (gate.status === 'closed' ? 0.3 : 0.85)}
                  stroke={isSelected ? '#F5F7F5' : (gate.accessible && accessibleOnly ? '#00FFFF' : 'transparent')}
                  strokeWidth={gate.accessible && accessibleOnly ? 3 : 2}
                  animate={gate.congestion === 'high' && !isDimmed ? { scale: [1, 1.15, 1] } : { scale: 1 }}
                  transition={{ duration: 1.2, repeat: gate.congestion === 'high' && !isDimmed ? Infinity : 0 }}
                  whileHover={{ scale: 1.2 }}
                />
                <text
                  x={pos.x}
                  y={pos.y + 5}
                  textAnchor="middle"
                  fontSize="14"
                  fontWeight="bold"
                  fill="#0B1F1A"
                  opacity={isDimmed ? 0.3 : 1}
                  className="pointer-events-none select-none"
                >
                  {gate.id}
                </text>
              </g>
            )
          })}
        </svg>

        <div className="flex-1 min-w-[220px]">
          <AnimatePresence mode="wait">
            {!selectedGate && (
              <motion.p
                key="empty"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="text-offwhite/40 text-sm"
              >
                Select a gate on the map to see details.
              </motion.p>
            )}
            {selectedGate && (
              <motion.div
                key={selectedGate.id}
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                transition={{ duration: 0.3 }}
              >
                <p className="font-display text-lg text-gold">{selectedGate.name}</p>
                <p className="text-xs uppercase text-offwhite/60 mb-3">
                  {selectedGate.status} · {selectedGate.congestion} congestion
                  {selectedGate.accessible && ' · ♿ Accessible'}
                </p>
                <p className="text-xs font-semibold text-offwhite/70 mb-1">Serves sections:</p>
                <p className="text-sm mb-3">{selectedGate.nearestSections.join(', ')}</p>

                <p className="text-xs font-semibold text-offwhite/70 mb-1">Nearby amenities:</p>
                {amenitiesForGate(selectedGate.id).length === 0 && (
                  <p className="text-sm text-offwhite/40">None listed near this gate.</p>
                )}
                <ul className="space-y-1">
                  {amenitiesForGate(selectedGate.id).map((a, i) => (
                    <li key={i} className="text-sm flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-cyan" />
                      {a.type.replace('_', ' ')}
                      {a.accessible && ' ♿'}
                    </li>
                  ))}
                </ul>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </motion.div>
  )
}

export default MapView