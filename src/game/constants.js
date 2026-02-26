export const GLOBE_RADIUS = 2
export const WIN_COVERAGE = 95
export const STARTING_BUDGET = 2_000_000
export const MONTHLY_REVENUE_PER_COVERAGE_PCT = 20_000   // $ per coverage-% per month
export const MAX_RENDERED_SATELLITES = 10_000

export const ORBITAL_SHELLS = {
  LEO_550: {
    key: 'LEO_550',
    label: 'LEO — 550 km',
    altitudeKm: 550,
    altitude3d: 0.35,
    periodMin: 95,
    speed: 1.4,
    baseCost: 80_000,
    color: '#00ffaa',
    desc: 'Very low orbit. Cheapest shell, smallest footprint per satellite.',
  },
  LEO_1200: {
    key: 'LEO_1200',
    label: 'LEO — 1,200 km',
    altitudeKm: 1200,
    altitude3d: 0.55,
    periodMin: 110,
    speed: 1.0,
    baseCost: 120_000,
    color: '#44ddff',
    desc: 'Low orbit. Strong coverage density for large constellations.',
  },
  MEO_8000: {
    key: 'MEO_8000',
    label: 'MEO — 8,000 km',
    altitudeKm: 8000,
    altitude3d: 0.75,
    periodMin: 287,
    speed: 0.65,
    baseCost: 300_000,
    color: '#ffaa00',
    desc: 'GPS-like altitude. Wide coverage per satellite, higher cost.',
  },
  GEO_35786: {
    key: 'GEO_35786',
    label: 'GEO — 35,786 km',
    altitudeKm: 35786,
    altitude3d: 1.5,
    periodMin: 1436,
    speed: 0.18,
    baseCost: 800_000,
    color: '#ff4488',
    desc: 'Geostationary. Maximum footprint per satellite, highest cost.',
  },
}

export const ANTENNAS = {
  NARROW: {
    key: 'NARROW',
    label: 'Narrow Beam',
    coverage: 4,
    cost: 20_000,
    desc: 'Basic spot beam. Minimal footprint, lowest cost.',
  },
  REGIONAL: {
    key: 'REGIONAL',
    label: 'Regional',
    coverage: 12,
    cost: 60_000,
    desc: 'Regional coverage area. Good for dense LEO constellations.',
  },
  WIDE: {
    key: 'WIDE',
    label: 'Wide Area',
    coverage: 22,
    cost: 140_000,
    desc: 'Large footprint. Fewer satellites needed for global coverage.',
  },
  GLOBAL: {
    key: 'GLOBAL',
    label: 'Global Beam',
    coverage: 34,
    cost: 280_000,
    desc: 'Maximum coverage per satellite. Best for GEO deployments.',
  },
}

export function getDesignCost(shellKey, antennaKey) {
  return (ORBITAL_SHELLS[shellKey]?.baseCost ?? 0) + (ANTENNAS[antennaKey]?.cost ?? 0)
}

export function getDesignCoverage(antennaKey) {
  return ANTENNAS[antennaKey]?.coverage ?? 0
}

export function computeCoverage(satellites) {
  if (satellites.length === 0) return 0
  const uncovered = satellites.reduce((rem, sat) => rem * (1 - sat.coverage / 100), 1)
  return Math.min(100, Math.round((1 - uncovered) * 100))
}

// ── Dynamic Events ──────────────────────────────────────────────────────────

// Helper: remove N random satellites from the array
function removeSatellites(satellites, count) {
  const indices = new Set()
  const pool = [...satellites]
  while (indices.size < Math.min(count, pool.length)) {
    indices.add(Math.floor(Math.random() * pool.length))
  }
  return pool.filter((_, i) => !indices.has(i))
}

// Helper: remove satellites from a random populated shell
function shellStorm(satellites, fraction) {
  const shellColors = [...new Set(satellites.map((s) => s.color))]
  if (shellColors.length === 0) return { newSats: satellites, lost: 0, shell: 'N/A' }
  const targetColor = shellColors[Math.floor(Math.random() * shellColors.length)]
  const inShell = satellites.filter((s) => s.color === targetColor)
  const lostCount = Math.max(1, Math.floor(inShell.length * fraction))
  const toRemove = new Set(
    inShell
      .map((_, i) => i)
      .sort(() => Math.random() - 0.5)
      .slice(0, lostCount)
      .map((i) => inShell[i].id)
  )
  const shellLabel = Object.values(ORBITAL_SHELLS).find((sh) => sh.color === targetColor)?.label ?? targetColor
  return {
    newSats: satellites.filter((s) => !toRemove.has(s.id)),
    lost: lostCount,
    shell: shellLabel,
  }
}

export const EVENTS = [
  // ── FINANCIAL ──────────────────────────────────────────────────────────────
  {
    id: 'GOV_CONTRACT',
    category: 'FINANCIAL',
    title: 'GOVERNMENT CONTRACT',
    description:
      'A national space agency has awarded your constellation a multi-year connectivity contract covering remote territories.',
    canOccur: () => true,
    apply: () => ({
      budgetDelta: 500_000,
      effectDesc: '+$500,000 contract payment received',
    }),
  },
  {
    id: 'INVESTOR_ROUND',
    category: 'FINANCIAL',
    title: 'VENTURE CAPITAL INJECTION',
    description:
      'A consortium of infrastructure investors has closed a funding round, betting on your constellation\'s growth trajectory.',
    canOccur: () => true,
    apply: () => ({
      budgetDelta: 1_000_000,
      effectDesc: '+$1,000,000 VC funding secured',
    }),
  },
  {
    id: 'REGULATORY_FINE',
    category: 'FINANCIAL',
    title: 'REGULATORY FINE',
    description:
      'The international spectrum authority has issued a fine citing interference with existing licensed frequencies.',
    canOccur: (gs) => gs.satellites.length > 0,
    apply: () => ({
      budgetDelta: -300_000,
      effectDesc: '-$300,000 spectrum interference fine',
    }),
  },
  {
    id: 'EMERGENCY_LOAN',
    category: 'FINANCIAL',
    title: 'EMERGENCY CREDIT LINE',
    description:
      'Your CFO has secured a short-term credit facility. The interest rate is steep, but it keeps operations running.',
    canOccur: () => true,
    apply: () => ({
      budgetDelta: 800_000,
      effectDesc: '+$800,000 emergency loan (high-interest)',
    }),
  },

  // ── ORBITAL HAZARDS ────────────────────────────────────────────────────────
  {
    id: 'SOLAR_STORM',
    category: 'ORBITAL_HAZARD',
    title: 'SOLAR STORM',
    description:
      'A class-X coronal mass ejection has struck Earth\'s magnetosphere, subjecting your satellites to intense radiation.',
    canOccur: (gs) => gs.satellites.length > 5,
    apply: (gs) => {
      const fraction = 0.08 + Math.random() * 0.07 // 8–15%
      const { newSats, lost, shell } = shellStorm(gs.satellites, fraction)
      return {
        newSatellites: newSats,
        effectDesc: `${lost} satellite${lost !== 1 ? 's' : ''} destroyed in ${shell}`,
      }
    },
  },
  {
    id: 'MICROMETEORITE',
    category: 'ORBITAL_HAZARD',
    title: 'MICROMETEORITE IMPACTS',
    description:
      'A debris stream has passed through several of your orbital planes, causing hull punctures on multiple satellites.',
    canOccur: (gs) => gs.satellites.length > 0,
    apply: (gs) => {
      const lost = Math.min(gs.satellites.length, 1 + Math.floor(Math.random() * 3))
      const newSats = removeSatellites(gs.satellites, lost)
      return {
        newSatellites: newSats,
        effectDesc: `${lost} satellite${lost !== 1 ? 's' : ''} lost to micrometeorite impacts`,
      }
    },
  },
  {
    id: 'DEBRIS_CLOUD',
    category: 'ORBITAL_HAZARD',
    title: 'ORBITAL DEBRIS CLOUD',
    description:
      'A decommissioned rocket body has fragmented, creating a debris field that intersects your constellation.',
    canOccur: (gs) => gs.satellites.length > 10,
    apply: (gs) => {
      const lost = Math.min(gs.satellites.length, 5)
      const newSats = removeSatellites(gs.satellites, lost)
      return {
        newSatellites: newSats,
        effectDesc: `${lost} satellites destroyed by debris cloud`,
      }
    },
  },
  {
    id: 'GEOMAGNETIC_DIST',
    category: 'ORBITAL_HAZARD',
    title: 'GEOMAGNETIC DISTURBANCE',
    description:
      'Elevated geomagnetic activity has thickened the upper atmosphere, increasing atmospheric drag on your LEO fleet.',
    canOccur: () => true,
    apply: () => ({
      newModifiers: [{
        id: 'GEOMAG_INCOME',
        type: 'income_multiplier',
        value: 0.7,
        turnsRemaining: 2,
        desc: 'Geomagnetic drag — income ×0.7',
      }],
      effectDesc: 'Income reduced ×0.7 for 2 months (LEO drag)',
    }),
  },

  // ── MARKET SHIFTS ──────────────────────────────────────────────────────────
  {
    id: 'DEMAND_SURGE',
    category: 'MARKET_SHIFT',
    title: 'CONNECTIVITY DEMAND SURGE',
    description:
      'A global work-from-anywhere movement has driven an unprecedented spike in demand for satellite broadband.',
    canOccur: () => true,
    apply: () => ({
      newModifiers: [{
        id: 'DEMAND_INCOME',
        type: 'income_multiplier',
        value: 1.5,
        turnsRemaining: 3,
        desc: 'Demand surge — income ×1.5',
      }],
      effectDesc: 'Income boosted ×1.5 for 3 months',
    }),
  },
  {
    id: 'MARKET_RECESSION',
    category: 'MARKET_SHIFT',
    title: 'ECONOMIC RECESSION',
    description:
      'A global economic downturn has reduced enterprise and consumer spending on satellite services.',
    canOccur: () => true,
    apply: () => ({
      newModifiers: [{
        id: 'RECESSION_INCOME',
        type: 'income_multiplier',
        value: 0.6,
        turnsRemaining: 3,
        desc: 'Recession — income ×0.6',
      }],
      effectDesc: 'Income reduced ×0.6 for 3 months',
    }),
  },
  {
    id: 'COMPETITOR_LAUNCH',
    category: 'MARKET_SHIFT',
    title: 'COMPETITOR CONSTELLATION LAUNCH',
    description:
      'A rival operator has deployed a new constellation, undercutting your pricing and drawing away enterprise clients.',
    canOccur: () => true,
    apply: () => ({
      newModifiers: [{
        id: 'COMPETITOR_INCOME',
        type: 'income_multiplier',
        value: 0.8,
        turnsRemaining: 2,
        desc: 'Competitor pressure — income ×0.8',
      }],
      effectDesc: 'Income reduced ×0.8 for 2 months (competition)',
    }),
  },
  {
    id: 'EMERGING_MARKETS',
    category: 'MARKET_SHIFT',
    title: 'EMERGING MARKET ADOPTION',
    description:
      'Rapid technology adoption across South and Southeast Asia is creating new high-growth subscriber markets.',
    canOccur: () => true,
    apply: () => ({
      newModifiers: [{
        id: 'EMERGING_INCOME',
        type: 'income_multiplier',
        value: 1.35,
        turnsRemaining: 4,
        desc: 'Emerging markets — income ×1.35',
      }],
      effectDesc: 'Income boosted ×1.35 for 4 months',
    }),
  },

  // ── TECH DISCOVERIES ───────────────────────────────────────────────────────
  {
    id: 'PROPULSION_BREAKTHROUGH',
    category: 'TECH',
    title: 'PROPULSION BREAKTHROUGH',
    description:
      'Your R&D team has validated a new ion thruster design that dramatically reduces orbital insertion fuel costs.',
    canOccur: () => true,
    apply: () => ({
      newModifiers: [{
        id: 'PROP_COST',
        type: 'cost_multiplier',
        value: 0.75,
        turnsRemaining: 3,
        desc: 'Ion thruster tech — launch costs ×0.75',
      }],
      effectDesc: 'Launch costs reduced ×0.75 for 3 months',
    }),
  },
  {
    id: 'ANTENNA_EFFICIENCY',
    category: 'TECH',
    title: 'ANTENNA EFFICIENCY GAIN',
    description:
      'Phased array miniaturization advances have reduced manufacturing costs for all antenna types.',
    canOccur: () => true,
    apply: () => ({
      newModifiers: [{
        id: 'ANT_COST',
        type: 'cost_multiplier',
        value: 0.8,
        turnsRemaining: 3,
        desc: 'Phased array tech — launch costs ×0.8',
      }],
      effectDesc: 'Launch costs reduced ×0.8 for 3 months',
    }),
  },
  {
    id: 'MINIATURIZATION',
    category: 'TECH',
    title: 'CUBESAT MINIATURIZATION',
    description:
      'Advances in cubesat-class hardware have made it possible to pack more capability into smaller, cheaper bus platforms.',
    canOccur: () => true,
    apply: () => ({
      newModifiers: [{
        id: 'MINI_COST',
        type: 'cost_multiplier',
        value: 0.7,
        turnsRemaining: 2,
        desc: 'Miniaturization — launch costs ×0.7',
      }],
      effectDesc: 'Launch costs reduced ×0.7 for 2 months',
    }),
  },
  {
    id: 'MANUFACTURING_SCALE',
    category: 'TECH',
    title: 'MANUFACTURING SCALE',
    description:
      'Your production line has reached a scale that unlocks significant volume discounts on all satellite components.',
    canOccur: () => true,
    apply: () => ({
      newModifiers: [{
        id: 'MFG_COST',
        type: 'cost_multiplier',
        value: 0.85,
        turnsRemaining: 4,
        desc: 'Scale manufacturing — launch costs ×0.85',
      }],
      effectDesc: 'Launch costs reduced ×0.85 for 4 months',
    }),
  },
]
