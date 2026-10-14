import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { MotionConfig } from 'motion/react'
import './index.css'
import App from './App.tsx'

// `reducedMotion="user"` makes every Motion animation in the app honour the
// operating system's "reduce motion" setting: transform and layout animation is
// dropped and replaced with a plain opacity change, while all functionality is
// preserved. It is the single global switch for the motion system.
createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <MotionConfig reducedMotion="user">
      <App />
    </MotionConfig>
  </StrictMode>,
)
