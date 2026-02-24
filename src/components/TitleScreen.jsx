import { useState } from 'react'

function HowToPlay({ onClose }) {
  return (
    <div className="htp-overlay" onClick={onClose}>
      <div className="htp-box" onClick={(e) => e.stopPropagation()}>
        <h2 className="htp-title">HOW TO PLAY</h2>

        <section className="htp-section">
          <h3 className="htp-section-title">OBJECTIVE</h3>
          <p className="htp-text">
            Design satellite blueprints, launch constellations, and reach
            <span className="htp-accent"> 95% global coverage</span>. Revenue flows in
            every second based on your coverage — reinvest it to grow faster.
          </p>
        </section>

        <section className="htp-section">
          <h3 className="htp-section-title">DESIGN STUDIO</h3>
          <p className="htp-text">
            Click <span className="htp-accent">+ NEW</span> in the Design Library to open
            the studio. Choose an orbital shell and antenna, give your design a name, then
            save it. You can create as many designs as you like and edit them any time.
          </p>
        </section>

        <section className="htp-section">
          <h3 className="htp-section-title">LAUNCHING</h3>
          <p className="htp-text">
            Each saved design shows <span className="htp-accent">×1 ×10 ×50 ×100</span> launch
            buttons. A button is greyed out if you can't afford that batch. Launch cheap LEO
            satellites early to start earning revenue, then scale up.
          </p>
        </section>

        <section className="htp-section">
          <h3 className="htp-section-title">ORBITAL SHELLS</h3>
          <div className="htp-orbits">
            <div className="htp-orbit-row">
              <span className="htp-dot" style={{ background: '#00ffaa', boxShadow: '0 0 6px #00ffaa' }} />
              <div>
                <p className="htp-orbit-name">LEO 550 km — from $100K/sat</p>
                <p className="htp-orbit-desc">Fastest orbit. Smallest footprint — ideal for dense constellations.</p>
              </div>
            </div>
            <div className="htp-orbit-row">
              <span className="htp-dot" style={{ background: '#44ddff', boxShadow: '0 0 6px #44ddff' }} />
              <div>
                <p className="htp-orbit-name">LEO 1,200 km — from $140K/sat</p>
                <p className="htp-orbit-desc">Slightly higher LEO. Good coverage density at moderate cost.</p>
              </div>
            </div>
            <div className="htp-orbit-row">
              <span className="htp-dot" style={{ background: '#ffaa00', boxShadow: '0 0 6px #ffaa00' }} />
              <div>
                <p className="htp-orbit-name">MEO 8,000 km — from $320K/sat</p>
                <p className="htp-orbit-desc">GPS-like altitude. Wide coverage per satellite, higher cost.</p>
              </div>
            </div>
            <div className="htp-orbit-row">
              <span className="htp-dot" style={{ background: '#ff4488', boxShadow: '0 0 6px #ff4488' }} />
              <div>
                <p className="htp-orbit-name">GEO 35,786 km — from $820K/sat</p>
                <p className="htp-orbit-desc">Geostationary. Massive footprint, high cost. Best paired with Global Beam.</p>
              </div>
            </div>
          </div>
        </section>

        <section className="htp-section">
          <h3 className="htp-section-title">ECONOMY</h3>
          <p className="htp-text">
            Start with <span className="htp-accent">$1,000,000</span>. Earn
            <span className="htp-accent"> $500 per coverage-% per second</span>.
            At 20% coverage that's $10,000/s — enough to launch a cheap LEO satellite
            every 10 seconds. Income compounds as you grow.
          </p>
        </section>

        <section className="htp-section">
          <h3 className="htp-section-title">TIPS</h3>
          <ul className="htp-tips">
            <li>Start with LEO 550 km + Narrow Beam ($100K) to generate early income.</li>
            <li>Coverage stacks with diminishing returns — mix shell types for efficiency.</li>
            <li>A single GEO + Global Beam satellite covers 34% of Earth for $1.08M.</li>
            <li>Drag the globe to inspect your constellation. Scroll to zoom.</li>
          </ul>
        </section>

        <button className="title-btn primary htp-close" onClick={onClose}>GOT IT</button>
      </div>
    </div>
  )
}

export default function TitleScreen({ onNewGame }) {
  const [showHTP, setShowHTP] = useState(false)

  return (
    <div className="title-screen">
      <div className="title-content">
        <p className="title-eyebrow">ORBITAL STRATEGY</p>
        <h1 className="title-heading">CONSTELLATION<br />KING</h1>
        <p className="title-tagline">
          Design custom satellites. Launch constellations.<br />
          Dominate Earth's orbit.
        </p>

        <div className="title-actions">
          <button className="title-btn primary" onClick={onNewGame}>NEW GAME</button>
          <button className="title-btn secondary" onClick={() => setShowHTP(true)}>HOW TO PLAY</button>
        </div>

        <div className="title-legend">
          {[
            { color: '#00ffaa', label: 'LEO 550 km — Low Earth Orbit' },
            { color: '#44ddff', label: 'LEO 1,200 km — Low Earth Orbit' },
            { color: '#ffaa00', label: 'MEO 8,000 km — Medium Earth Orbit' },
            { color: '#ff4488', label: 'GEO 35,786 km — Geostationary' },
          ].map(({ color, label }) => (
            <div key={color} className="legend-row">
              <span className="legend-dot" style={{ background: color, boxShadow: `0 0 6px ${color}` }} />
              <span>{label}</span>
            </div>
          ))}
        </div>
      </div>

      {showHTP && <HowToPlay onClose={() => setShowHTP(false)} />}
    </div>
  )
}
