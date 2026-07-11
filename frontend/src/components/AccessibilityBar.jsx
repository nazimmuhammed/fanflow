import { motion } from 'framer-motion'

function AccessibilityBar({ highContrast, setHighContrast, ttsEnabled, setTtsEnabled, accessibleOnly, setAccessibleOnly }) {
  const ToggleButton = ({ active, onClick, icon, label }) => (
    <motion.button
      onClick={onClick}
      whileTap={{ scale: 0.95 }}
      whileHover={{ scale: 1.03 }}
      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border transition-colors ${
        active
          ? 'bg-gold text-pitch border-gold'
          : 'bg-transparent text-offwhite/70 border-gold/30 hover:border-gold/60'
      }`}
    >
      <span>{icon}</span>
      {label}
    </motion.button>
  )

  return (
    <div className="flex flex-wrap items-center justify-center gap-3 px-6 py-3 border-b border-gold/10 relative z-10">
      <span className="text-xs text-offwhite/40 uppercase tracking-wider mr-1">Accessibility:</span>
      <ToggleButton
        active={highContrast}
        onClick={() => setHighContrast(!highContrast)}
        icon="◐"
        label="High Contrast"
      />
      <ToggleButton
        active={ttsEnabled}
        onClick={() => setTtsEnabled(!ttsEnabled)}
        icon="🔊"
        label="Voice Readout"
      />
      <ToggleButton
        active={accessibleOnly}
        onClick={() => setAccessibleOnly(!accessibleOnly)}
        icon="♿"
        label="Accessible Routes Only"
      />
    </div>
  )
}

export default AccessibilityBar