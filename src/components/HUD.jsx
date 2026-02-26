import { WIN_COVERAGE, ORBITAL_SHELLS, ANTENNAS } from '../game/constants'

const LAUNCH_QTYS = [1, 10, 50, 100]

const MONTHS = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC']

function monthLabel(turn) {
  return `${MONTHS[turn % 12]} ${2025 + Math.floor(turn / 12)}`
}

const CATEGORY_COLORS = {
  FINANCIAL:      '#CCFF00',
  ORBITAL_HAZARD: '#FF5533',
  MARKET_SHIFT:   '#00FFCC',
  TECH:           '#AA77FF',
}

function DesignCard({ design, budget, costMultiplier, onLaunch, onEdit, onDelete }) {
  const shell = ORBITAL_SHELLS[design.shellKey]
  const antenna = ANTENNAS[design.antennaKey]
  const effectiveCost = Math.floor(design.totalCost * costMultiplier)
  const discounted = costMultiplier < 0.999

  return (
    <div className="design-card" style={{ '--card-color': shell?.color ?? '#39FF14' }}>
      <div className="design-card-header">
        <span className="design-dot" />
        <span className="design-name" title={design.name}>{design.name}</span>
        <button className="design-edit-btn" onClick={() => onEdit(design)}>EDIT</button>
        <button className="design-delete-btn" onClick={() => onDelete(design.id)}>✕</button>
      </div>

      <div className="design-card-meta">
        <span>{shell?.label ?? design.shellKey}</span>
        <span>{antenna?.label ?? design.antennaKey}</span>
      </div>

      <div className="design-card-stats">
        <span>
          {discounted && (
            <span className="design-base-cost">${design.totalCost.toLocaleString()} </span>
          )}
          ${effectiveCost.toLocaleString()}/sat
        </span>
        <span>{design.coverage}% cov</span>
      </div>

      <div className="design-card-launch">
        {LAUNCH_QTYS.map((qty) => (
          <button
            key={qty}
            className="launch-qty-btn"
            disabled={budget < effectiveCost * qty}
            onClick={() => onLaunch(design.id, qty)}
          >
            ×{qty}
          </button>
        ))}
      </div>
    </div>
  )
}

function OrbitSummary({ satellites }) {
  if (satellites.length === 0) return null
  const counts = {}
  satellites.forEach((s) => {
    counts[s.color] = (counts[s.color] ?? 0) + 1
  })
  const shells = Object.values(ORBITAL_SHELLS).filter((sh) => counts[sh.color] > 0)

  return (
    <div className="orbit-summary">
      <h3 className="orbit-summary-title">IN ORBIT</h3>
      {shells.map((sh) => (
        <div key={sh.key} className="orbit-summary-row">
          <span className="legend-dot" style={{ background: sh.color, boxShadow: `0 0 5px ${sh.color}` }} />
          <span>{sh.label}</span>
          <span className="orbit-summary-count">{(counts[sh.color] ?? 0).toLocaleString()}</span>
        </div>
      ))}
      <div className="orbit-summary-row orbit-summary-total">
        <span>TOTAL</span>
        <span className="orbit-summary-count">{satellites.length.toLocaleString()}</span>
      </div>
    </div>
  )
}

function ModifierList({ modifiers }) {
  if (!modifiers || modifiers.length === 0) return null
  return (
    <div className="modifier-list">
      <h3 className="panel-title">ACTIVE MODIFIERS</h3>
      {modifiers.map((m) => (
        <div key={m.id} className="modifier-item">
          <span className="modifier-desc">{m.desc}</span>
          <span className="modifier-turns">{m.turnsRemaining}mo</span>
        </div>
      ))}
    </div>
  )
}

function EventLog({ log }) {
  if (!log || log.length === 0) return null
  const recent = log.slice(0, 8)
  return (
    <div className="event-log">
      <h3 className="panel-title">EVENT LOG</h3>
      <div className="event-log-list">
        {recent.map((entry, i) => (
          <div key={i} className="event-log-item">
            <div className="event-log-header">
              <span
                className="event-log-category"
                style={{ color: CATEGORY_COLORS[entry.category] ?? '#39FF14' }}
              >
                {entry.category.replace('_', ' ')}
              </span>
              <span className="event-log-month">{monthLabel(entry.turn)}</span>
            </div>
            <span className="event-log-title">{entry.title}</span>
            <span className="event-log-effect">{entry.effectDesc}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

export default function HUD({ gameState, costMultiplier, onLaunch, onOpenStudio, onEditDesign, onDeleteDesign, onMainMenu, onEndTurn }) {
  const { satellites, budget, coverage, designs, incomePerMonth, turn, activeModifiers, eventLog } = gameState

  const budgetDisplay = budget >= 1_000_000
    ? `$${(budget / 1_000_000).toFixed(2)}M`
    : `$${budget.toLocaleString()}`

  const incomeDisplay = incomePerMonth >= 1_000_000
    ? `+$${(incomePerMonth / 1_000_000).toFixed(2)}M`
    : incomePerMonth >= 1000
    ? `+$${(incomePerMonth / 1000).toFixed(1)}K`
    : `+$${incomePerMonth}`

  return (
    <div className="hud">
      <header className="hud-header">
        <h1 className="hud-title">CONSTELLATION KING</h1>
        <div className="hud-stats">
          <Stat label="MONTH"    value={monthLabel(turn)}       accent="#39FF14" />
          <Stat label="BUDGET"   value={budgetDisplay}          accent="#CCFF00" />
          <Stat label="INCOME/MO" value={incomeDisplay}         accent="#39FF14" />
          <Stat label="COVERAGE" value={`${coverage}%`}
            accent={coverage >= WIN_COVERAGE ? '#39FF14' : '#26CC00'} />
        </div>
        <button className="end-turn-btn" onClick={onEndTurn}>END TURN</button>
      </header>

      <div className="coverage-bar-wrap">
        <div
          className="coverage-bar-fill"
          style={{
            width: `${coverage}%`,
            background: coverage >= WIN_COVERAGE
              ? 'linear-gradient(90deg, #39FF14, #7FFF00)'
              : 'linear-gradient(90deg, #0D6600, #39FF14)',
          }}
        />
      </div>

      <aside className="hud-panel">
        <div className="panel-header-row">
          <h2 className="panel-title">DESIGN LIBRARY</h2>
          <button className="panel-new-btn" onClick={onOpenStudio}>+ NEW</button>
        </div>

        {designs.length === 0 ? (
          <p className="panel-empty">No designs yet.<br />Press + NEW to create your first satellite.</p>
        ) : (
          <div className="design-card-list">
            {designs.map((design) => (
              <DesignCard
                key={design.id}
                design={design}
                budget={budget}
                costMultiplier={costMultiplier}
                onLaunch={onLaunch}
                onEdit={onEditDesign}
                onDelete={onDeleteDesign}
              />
            ))}
          </div>
        )}

        <OrbitSummary satellites={satellites} />
        <ModifierList modifiers={activeModifiers} />
        <EventLog log={eventLog} />

        <button className="menu-link-btn" onClick={onMainMenu}>MAIN MENU</button>
      </aside>

      {coverage >= WIN_COVERAGE && (
        <div className="win-overlay">
          <div className="win-box">
            <h2>GLOBAL COVERAGE ACHIEVED</h2>
            <p>
              Your constellation of {satellites.length.toLocaleString()} satellites now
              serves every corner of the Earth.
            </p>
            <p className="win-subtitle">You are the Constellation King.</p>
            <div className="win-actions">
              <button className="title-btn primary" onClick={onMainMenu}>MAIN MENU</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function Stat({ label, value, accent }) {
  return (
    <div className="stat">
      <span className="stat-label">{label}</span>
      <span className="stat-value" style={{ color: accent }}>{value}</span>
    </div>
  )
}
