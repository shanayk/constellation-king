const CATEGORY_META = {
  FINANCIAL:      { label: 'FINANCIAL',      color: '#CCFF00' },
  ORBITAL_HAZARD: { label: 'ORBITAL HAZARD', color: '#FF5533' },
  MARKET_SHIFT:   { label: 'MARKET SHIFT',   color: '#00FFCC' },
  TECH:           { label: 'TECH',           color: '#AA77FF' },
}

export default function EventModal({ event, onDismiss }) {
  if (!event) return null

  const meta = CATEGORY_META[event.category] ?? { label: event.category, color: '#39FF14' }

  return (
    <div className="event-modal-overlay">
      <div className="event-modal-box">
        <span
          className="event-category-tag"
          style={{ color: meta.color, borderColor: meta.color, textShadow: `0 0 8px ${meta.color}88` }}
        >
          {meta.label}
        </span>

        <h2 className="event-modal-title">{event.title}</h2>

        <p className="event-modal-desc">{event.description}</p>

        <div className="event-modal-effect">
          <span className="event-effect-arrow">▸</span>
          <span className="event-effect-text">{event.effectDesc}</span>
        </div>

        <button className="title-btn primary event-modal-ack" onClick={onDismiss}>
          ACKNOWLEDGE
        </button>
      </div>
    </div>
  )
}
