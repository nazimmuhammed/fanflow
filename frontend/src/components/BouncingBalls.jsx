import { motion } from 'framer-motion'

const BALLS = [
  { top: '10%', left: '5%',  size: 42, duration: 4.2, delay: 0 },
  { top: '60%', left: '2%',  size: 30, duration: 3.4, delay: 0.6 },
  { top: '25%', left: '90%', size: 36, duration: 3.8, delay: 0.3 },
  { top: '70%', left: '88%', size: 46, duration: 4.6, delay: 1.1 },
  { top: '45%', left: '94%', size: 26, duration: 3.1, delay: 0.9 },
  { top: '85%', left: '15%', size: 32, duration: 3.9, delay: 0.4 },
  { top: '5%',  left: '75%', size: 28, duration: 3.6, delay: 1.4 },
]

function BouncingBalls() {
  return (
    <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
      {BALLS.map((ball, i) => (
        <motion.div
          key={i}
          className="absolute opacity-40"
          style={{ top: ball.top, left: ball.left, fontSize: ball.size }}
          animate={{
            y: [0, -35, 0],
            rotate: [0, 25, -15, 0]
          }}
          transition={{
            duration: ball.duration,
            delay: ball.delay,
            repeat: Infinity,
            ease: 'easeInOut'
          }}
        >
          ⚽
        </motion.div>
      ))}
    </div>
  )
}

export default BouncingBalls