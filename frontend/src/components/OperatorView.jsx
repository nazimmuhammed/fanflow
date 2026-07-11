import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import axios from 'axios'

const SEVERITY_STYLES = {
  LOW: '#3FD5C0',
  MEDIUM: '#D4A72C',
  HIGH: '#f97316',
  CRITICAL: '#ef4444'
}

function parseSeverity(text) {
  const match = text.match(/SEVERITY:\s*(LOW|MEDIUM|HIGH|CRITICAL)/i)
  return match ? match[1].toUpperCase() : null
}

function OperatorView() {
  const [gates, setGates] = useState([])
  const [incident, setIncident] = useState('')
  const [triageResult, setTriageResult] = useState('')
  const [loading, setLoading] = useState(false)
  const [log, setLog] = useState([])

  useEffect(() => {
    axios.get('http://127.0.0.1:8000/api/gates').then(res => setGates(res.data))
  }, [])

  const analyzeIncident = async () => {
    if (!incident.trim() || loading) return
    setLoading(true)
    try {
      const res = await axios.post('http://127.0.0.1:8000/api/incident/analyze', { description: incident })
      setTriageResult(res.data.result)
      setLog(prev => [{ text: incident, result: res.data.result, time: new Date().toLocaleTimeString() }, ...prev].slice(0, 5))
      setIncident('')
    } catch (err) {
      setTriageResult('Could not analyze incident. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const severity = triageResult ? parseSeverity(triageResult) : null

  const statusDot = (status) => status === 'open' ? 'bg-cyan' : 'bg-gray-500'

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="max-w-6xl mx-auto px-6 py-8 relative z-10"
    >
      <div className="flex items-center gap-2 mb-6">
        <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse" />
        <p className="font-display text-2xl tracking-wide text-gold">OPERATOR COMMAND VIEW</p>
      </div>

      <div className="grid md:grid-cols-2 gap-6">

        <div className="bg-turf/30 border border-gold/20 rounded-2xl p-5">
          <p className="font-display text-lg text-gold mb-3">GATE OVERVIEW</p>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-offwhite/50 text-xs uppercase border-b border-gold/20">
                  <th className="pb-2">Gate</th>
                  <th className="pb-2">Status</th>
                  <th className="pb-2">Congestion</th>
                  <th className="pb-2">Accessible</th>
                </tr>
              </thead>
              <tbody>
                {gates.map(g => (
                  <tr key={g.id} className="border-b border-gold/10">
                    <td className="py-2 flex items-center gap-2">
                      <span className={`w-1.5 h-1.5 rounded-full ${statusDot(g.status)}`} />
                      {g.name}
                    </td>
                    <td className="py-2 uppercase text-xs text-offwhite/70">{g.status}</td>
                    <td className="py-2 uppercase text-xs" style={{ color: g.congestion === 'high' ? '#ef4444' : g.congestion === 'medium' ? '#D4A72C' : '#3FD5C0' }}>
                      {g.congestion}
                    </td>
                    <td className="py-2 text-xs">{g.accessible ? '♿ Yes' : '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="bg-turf/30 border border-gold/20 rounded-2xl p-5">
          <p className="font-display text-lg text-gold mb-1">INCIDENT TRIAGE</p>
          <p className="text-xs text-offwhite/50 mb-3">Describe a situation for AI-assisted severity classification</p>

          <div className="flex gap-2 mb-4">
            <input
              type="text"
              value={incident}
              onChange={(e) => setIncident(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && analyzeIncident()}
              placeholder="e.g. Spilled drink causing slippery floor near Gate B"
              className="flex-1 bg-pitch text-offwhite text-sm rounded-lg px-3 py-2 outline-none border border-gold/20 focus:border-gold placeholder:text-offwhite/40"
            />
            <motion.button
              onClick={analyzeIncident}
              disabled={loading}
              whileTap={{ scale: 0.9 }}
              className="bg-gold text-pitch font-semibold text-sm px-4 py-2 rounded-lg disabled:opacity-50"
            >
              Analyze
            </motion.button>
          </div>

          <AnimatePresence mode="wait">
            {triageResult && (
              <motion.div
                key={triageResult}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="rounded-lg px-4 py-3 mb-4 text-sm whitespace-pre-line"
                style={{
                  backgroundColor: severity ? `${SEVERITY_STYLES[severity]}22` : 'rgba(255,255,255,0.05)',
                  border: `1px solid ${severity ? SEVERITY_STYLES[severity] : '#666'}`
                }}
              >
                {loading ? 'Analyzing...' : triageResult}
              </motion.div>
            )}
          </AnimatePresence>

          {log.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-offwhite/50 mb-2">Recent log:</p>
              <ul className="space-y-1.5 text-xs text-offwhite/60">
                {log.map((entry, i) => (
                  <li key={i} className="border-l-2 border-gold/30 pl-2">
                    <span className="text-offwhite/40">{entry.time}</span> — {entry.text}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

      </div>
    </motion.div>
  )
}

export default OperatorView