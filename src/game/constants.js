export const GLOBE_RADIUS = 2
export const WIN_COVERAGE = 95
export const STARTING_BUDGET = 1_000_000
export const REVENUE_PER_COVERAGE_PCT = 500   // $ per coverage-% per second
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
