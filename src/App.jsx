import { useState, useCallback, useEffect } from 'react'
import * as THREE from 'three'
import Globe from './components/Globe'
import HUD from './components/HUD'
import TitleScreen from './components/TitleScreen'
import DesignStudio from './components/DesignStudio'
import {
  ORBITAL_SHELLS,
  STARTING_BUDGET,
  REVENUE_PER_COVERAGE_PCT,
  computeCoverage,
} from './game/constants'

const freshState = () => ({
  budget: STARTING_BUDGET,
  designs: [],
  satellites: [],
  coverage: 0,
  incomePerSecond: 0,
})

export default function App() {
  const [phase, setPhase] = useState('menu')
  const [gameState, setGameState] = useState(freshState)
  const [studioOpen, setStudioOpen] = useState(false)
  const [editingDesign, setEditingDesign] = useState(null)

  // Revenue ticker — runs every second while playing
  useEffect(() => {
    if (phase !== 'playing') return
    const id = setInterval(() => {
      setGameState((prev) => ({
        ...prev,
        budget: prev.budget + prev.incomePerSecond,
      }))
    }, 1000)
    return () => clearInterval(id)
  }, [phase])

  // Recompute coverage + income whenever satellites change
  useEffect(() => {
    if (phase !== 'playing') return
    const cov = computeCoverage(gameState.satellites)
    const ips = Math.floor(cov * REVENUE_PER_COVERAGE_PCT)
    setGameState((prev) => ({ ...prev, coverage: cov, incomePerSecond: ips }))
  }, [gameState.satellites, phase])

  const startGame = useCallback(() => {
    setGameState(freshState())
    setPhase('playing')
  }, [])

  const openStudio = useCallback((design = null) => {
    setEditingDesign(design)
    setStudioOpen(true)
  }, [])

  const closeStudio = useCallback(() => {
    setStudioOpen(false)
    setEditingDesign(null)
  }, [])

  const saveDesign = useCallback((design) => {
    setGameState((prev) => {
      const exists = prev.designs.some((d) => d.id === design.id)
      const designs = exists
        ? prev.designs.map((d) => (d.id === design.id ? design : d))
        : [...prev.designs, design]
      return { ...prev, designs }
    })
    closeStudio()
  }, [closeStudio])

  const deleteDesign = useCallback((designId) => {
    setGameState((prev) => ({
      ...prev,
      designs: prev.designs.filter((d) => d.id !== designId),
    }))
  }, [])

  const launchSatellites = useCallback((designId, quantity) => {
    setGameState((prev) => {
      const design = prev.designs.find((d) => d.id === designId)
      if (!design) return prev
      const totalCost = design.totalCost * quantity
      if (prev.budget < totalCost) return prev

      const shell = ORBITAL_SHELLS[design.shellKey]

      const newSats = Array.from({ length: quantity }, (_, i) => {
        const inclination = Math.random() * Math.PI
        const raan = Math.random() * Math.PI * 2
        // Precompute orbit-plane rotation matrix (inclination + RAAN never change)
        const m = new THREE.Matrix4()
        m.makeRotationY(raan)
        m.multiply(new THREE.Matrix4().makeRotationZ(inclination))
        return {
          id: `sat_${Date.now()}_${i}`,
          designId,
          inclination,
          raan,
          altitude3d: shell.altitude3d,
          speed: shell.speed,
          color: shell.color,
          coverage: design.coverage,
          rotationMatrix: Array.from(m.elements), // 16-element flat array
        }
      })

      return {
        ...prev,
        budget: prev.budget - totalCost,
        satellites: [...prev.satellites, ...newSats],
      }
    })
  }, [])

  return (
    <div style={{ width: '100%', height: '100%', position: 'relative' }}>
      <Globe satellites={gameState.satellites} autoRotate={phase === 'menu'} />

      {phase === 'menu' && <TitleScreen onNewGame={startGame} />}

      {phase === 'playing' && (
        <>
          <HUD
            gameState={gameState}
            onLaunch={launchSatellites}
            onOpenStudio={() => openStudio(null)}
            onEditDesign={openStudio}
            onDeleteDesign={deleteDesign}
            onMainMenu={() => setPhase('menu')}
          />
          {studioOpen && (
            <DesignStudio
              initialDesign={editingDesign}
              onSave={saveDesign}
              onClose={closeStudio}
            />
          )}
        </>
      )}
    </div>
  )
}
