import { WIN_COVERAGE, ORBITAL_SHELLS, ANTENNAS } from '../game/constants'

const LAUNCH_QTYS = [1, 10, 50, 100]

function DesignCard({ design, budget, onLaunch, onEdit, onDelete }) {
  const shell = ORBITAL_SHELLS[design.shellKey]
  const antenna = ANTENNAS[design.antennaKey]

  return (
    <div className="design-card" style={{ '--card-color': shell?.color ?? '#4488ff' }}>
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
        <span>${design.totalCost.toLocaleString()}/sat</span>
        <span>{design.coverage}% cov</span>
      </div>

      <div className="design-card-launch">
        {LAUNCH_QTYS.map((qty) => (
          <button
            key={qty}
            className="launch-qty-btn"
            disabled={budget < design.totalCost * qty}
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
      <div className="orbit-summary-row" style={{ marginTop: 4, borderTop: '1px solid rgba(40,100,200,0.15)', paddingTop: 6 }}>
        <span style={{ color: '#4488aa', fontSize: '0.6rem', letterSpacing: '0.1em' }}>TOTAL</span>
        <span className="orbit-summary-count">{satellites.length.toLocaleString()}</span>
      </div>
    </div>
  )
}

export default function HUD({ gameState, onLaunch, onOpenStudio, onEditDesign, onDeleteDesign, onMainMenu }) {
  const { satellites, budget, coverage, designs, incomePerSecond } = gameState

  const budgetDisplay = budget >= 1_000_000
    ? `$${(budget / 1_000_000).toFixed(2)}M`
    : `$${budget.toLocaleString()}`

  const incomeDisplay = incomePerSecond >= 1000
    ? `+$${(incomePerSecond / 1000).toFixed(1)}K/s`
    : `+$${incomePerSecond}/s`

  return (
    <div className="hud">
      <header className="hud-header">
        <h1 className="hud-title">CONSTELLATION KING</h1>
        <div className="hud-stats">
          <Stat label="BUDGET" value={budgetDisplay} accent="#ffdd44" />
          <Stat label="INCOME/S" value={incomeDisplay} accent="#00ffaa" />
          <Stat label="COVERAGE" value={`${coverage}%`} accent={coverage >= WIN_COVERAGE ? '#00ffaa' : '#a0d4ff'} />
        </div>
      </header>

      <div className="coverage-bar-wrap">
        <div
          className="coverage-bar-fill"
          style={{
            width: `${coverage}%`,
            background: coverage >= WIN_COVERAGE
              ? 'linear-gradient(90deg, #00ffaa, #00dd88)'
              : 'linear-gradient(90deg, #1a5aaa, #00aaff)',
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
                onLaunch={onLaunch}
                onEdit={onEditDesign}
                onDelete={onDeleteDesign}
              />
            ))}
          </div>
        )}

        <OrbitSummary satellites={satellites} />

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
