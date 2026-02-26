import { useState, useCallback, useEffect } from 'react'
import * as THREE from 'three'
import Globe from './components/Globe'
import HUD from './components/HUD'
import TitleScreen from './components/TitleScreen'
import DesignStudio from './components/DesignStudio'
import EventModal from './components/EventModal'
import {
  ORBITAL_SHELLS,
  STARTING_BUDGET,
  MONTHLY_REVENUE_PER_COVERAGE_PCT,
  EVENTS,
  computeCoverage,
} from './game/constants'

const freshState = () => ({
  budget: STARTING_BUDGET,
  designs: [],
  satellites: [],
  coverage: 0,
  incomePerMonth: 0,
  turn: 0,                // 0 = Jan 2025; increments each endTurn
  activeModifiers: [],    // [{ id, type, value, turnsRemaining, desc }]
  eventLog: [],           // [{ turn, title, category, effectDesc }]
})

// Derive a cost multiplier from active modifiers
function getCostMultiplier(activeModifiers) {
  return activeModifiers
    .filter((m) => m.type === 'cost_multiplier')
    .reduce((acc, m) => acc * m.value, 1)
}

// Derive an income multiplier from active modifiers
function getIncomeMultiplier(activeModifiers) {
  return activeModifiers
    .filter((m) => m.type === 'income_multiplier')
    .reduce((acc, m) => acc * m.value, 1)
}

// Pick a random eligible event given the current game state
function pickEvent(gameState) {
  const eligible = EVENTS.filter((e) => e.canOccur(gameState))
  if (eligible.length === 0) return EVENTS[0] // fallback
  return eligible[Math.floor(Math.random() * eligible.length)]
}

export default function App() {
  const [phase, setPhase] = useState('menu')
  const [gameState, setGameState] = useState(freshState)
  const [studioOpen, setStudioOpen] = useState(false)
  const [editingDesign, setEditingDesign] = useState(null)
  const [pendingEvent, setPendingEvent] = useState(null) // event result to show in modal

  // Recompute coverage + income whenever satellites change
  useEffect(() => {
    if (phase !== 'playing') return
    setGameState((prev) => {
      const cov = computeCoverage(prev.satellites)
      const incomePerMonth = Math.floor(cov * MONTHLY_REVENUE_PER_COVERAGE_PCT)
      return { ...prev, coverage: cov, incomePerMonth }
    })
  }, [gameState.satellites, phase])

  const startGame = useCallback(() => {
    setGameState(freshState())
    setPendingEvent(null)
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

      const costMult = getCostMultiplier(prev.activeModifiers)
      const totalCost = Math.floor(design.totalCost * costMult) * quantity
      if (prev.budget < totalCost) return prev

      const shell = ORBITAL_SHELLS[design.shellKey]

      const newSats = Array.from({ length: quantity }, (_, i) => {
        const inclination = Math.random() * Math.PI
        const raan = Math.random() * Math.PI * 2
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
          rotationMatrix: Array.from(m.elements),
        }
      })

      return {
        ...prev,
        budget: prev.budget - totalCost,
        satellites: [...prev.satellites, ...newSats],
      }
    })
  }, [])

  const endTurn = useCallback(() => {
    setGameState((prev) => {
      // 1. Tick modifiers (decrement turns, remove expired)
      const tickedModifiers = prev.activeModifiers
        .map((m) => ({ ...m, turnsRemaining: m.turnsRemaining - 1 }))
        .filter((m) => m.turnsRemaining > 0)

      // 2. Apply monthly income with current income modifier
      const incomeMult = getIncomeMultiplier(tickedModifiers)
      const monthlyIncome = Math.floor(prev.incomePerMonth * incomeMult)

      // 3. Pick and apply event
      const stateForEvent = { ...prev, activeModifiers: tickedModifiers }
      const eventTemplate = pickEvent(stateForEvent)
      const result = eventTemplate.apply(stateForEvent)

      const budgetDelta = result.budgetDelta ?? 0
      const newSatellites = result.newSatellites ?? prev.satellites
      const addedModifiers = result.newModifiers ?? []

      const newModifiers = [...tickedModifiers, ...addedModifiers]
      const newBudget = prev.budget + monthlyIncome + budgetDelta

      // 4. Record event in log
      const logEntry = {
        turn: prev.turn,
        title: eventTemplate.title,
        category: eventTemplate.category,
        effectDesc: result.effectDesc,
      }

      // 5. Build the modal event object
      const modalEvent = {
        title: eventTemplate.title,
        category: eventTemplate.category,
        description: eventTemplate.description,
        effectDesc: result.effectDesc,
        incomeEarned: monthlyIncome,
      }

      // Schedule the modal after state update
      setTimeout(() => setPendingEvent(modalEvent), 0)

      return {
        ...prev,
        budget: newBudget,
        satellites: newSatellites,
        activeModifiers: newModifiers,
        eventLog: [logEntry, ...prev.eventLog],
        turn: prev.turn + 1,
      }
    })
  }, [])

  const dismissEvent = useCallback(() => {
    setPendingEvent(null)
  }, [])

  const costMultiplier = getCostMultiplier(gameState.activeModifiers)

  return (
    <div style={{ width: '100%', height: '100%', position: 'relative' }}>
      <Globe satellites={gameState.satellites} autoRotate={phase === 'menu'} />

      {phase === 'menu' && <TitleScreen onNewGame={startGame} />}

      {phase === 'playing' && (
        <>
          <HUD
            gameState={gameState}
            costMultiplier={costMultiplier}
            onLaunch={launchSatellites}
            onOpenStudio={() => openStudio(null)}
            onEditDesign={openStudio}
            onDeleteDesign={deleteDesign}
            onMainMenu={() => setPhase('menu')}
            onEndTurn={endTurn}
          />
          {studioOpen && (
            <DesignStudio
              initialDesign={editingDesign}
              onSave={saveDesign}
              onClose={closeStudio}
            />
          )}
          {pendingEvent && (
            <EventModal event={pendingEvent} onDismiss={dismissEvent} />
          )}
        </>
      )}
    </div>
  )
}
