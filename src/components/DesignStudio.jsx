import { useState } from 'react'
import { ORBITAL_SHELLS, ANTENNAS, getDesignCost, getDesignCoverage } from '../game/constants'

export default function DesignStudio({ initialDesign, onSave, onClose }) {
  const [name, setName] = useState(initialDesign?.name ?? '')
  const [shellKey, setShellKey] = useState(initialDesign?.shellKey ?? 'LEO_550')
  const [antennaKey, setAntennaKey] = useState(initialDesign?.antennaKey ?? 'NARROW')

  const shell = ORBITAL_SHELLS[shellKey]
  const antenna = ANTENNAS[antennaKey]
  const totalCost = getDesignCost(shellKey, antennaKey)
  const coverage = getDesignCoverage(antennaKey)

  function handleSave() {
    const trimmed = name.trim()
    if (!trimmed) return
    onSave({
      id: initialDesign?.id ?? `design_${Date.now()}`,
      name: trimmed,
      shellKey,
      antennaKey,
      totalCost,
      coverage,
    })
  }

  return (
    <div className="studio-overlay" onClick={onClose}>
      <div className="studio-modal" onClick={(e) => e.stopPropagation()}>

        <div className="studio-header">
          <h2>{initialDesign ? 'EDIT DESIGN' : 'NEW SATELLITE DESIGN'}</h2>
          <button className="studio-close-btn" onClick={onClose}>×</button>
        </div>

        <div className="studio-body">

          <div className="studio-section">
            <span className="studio-section-label">DESIGNATION</span>
            <input
              className="studio-name-input"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Alpha Fleet"
              maxLength={32}
              spellCheck={false}
              autoFocus
            />
          </div>

          <div className="studio-section">
            <span className="studio-section-label">ORBITAL SHELL</span>
            <div className="studio-option-grid">
              {Object.values(ORBITAL_SHELLS).map((s) => (
                <button
                  key={s.key}
                  className={`studio-option-card ${shellKey === s.key ? 'selected' : ''}`}
                  style={{ '--option-color': s.color }}
                  onClick={() => setShellKey(s.key)}
                >
                  <span className="option-dot" />
                  <span className="option-label">{s.label}</span>
                  <span className="option-meta">
                    {s.periodMin < 60
                      ? `${s.periodMin} min`
                      : `${(s.periodMin / 60).toFixed(1)} hr`} orbit
                  </span>
                  <span className="option-cost">${(s.baseCost / 1000).toFixed(0)}K base</span>
                </button>
              ))}
            </div>
            <p className="studio-shell-desc">{shell.desc}</p>
          </div>

          <div className="studio-section">
            <span className="studio-section-label">ANTENNA TYPE</span>
            <div className="studio-option-grid">
              {Object.values(ANTENNAS).map((a) => (
                <button
                  key={a.key}
                  className={`studio-option-card ${antennaKey === a.key ? 'selected' : ''}`}
                  style={{ '--option-color': '#4488ff' }}
                  onClick={() => setAntennaKey(a.key)}
                >
                  <span className="option-label">{a.label}</span>
                  <span className="option-meta">{a.coverage}% coverage</span>
                  <span className="option-cost">+${(a.cost / 1000).toFixed(0)}K</span>
                </button>
              ))}
            </div>
          </div>

          <div className="studio-summary">
            <div className="summary-row">
              <span>ORBITAL SHELL</span>
              <span>{shell.label}</span>
            </div>
            <div className="summary-row">
              <span>ANTENNA</span>
              <span>{antenna.label}</span>
            </div>
            <div className="summary-row">
              <span>COVERAGE / SAT</span>
              <span>{coverage}%</span>
            </div>
            <div className="summary-row total">
              <span>COST / SAT</span>
              <span>${totalCost.toLocaleString()}</span>
            </div>
          </div>

        </div>

        <div className="studio-footer">
          <button className="title-btn secondary" onClick={onClose}>CANCEL</button>
          <button
            className="title-btn primary"
            onClick={handleSave}
            disabled={!name.trim()}
          >
            SAVE DESIGN
          </button>
        </div>

      </div>
    </div>
  )
}
