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
    title: 'GOVERNMENT CONTRACT AWARDED',
    description:
      'The Republic of Kazakhstan has selected your constellation to provide connectivity across its vast eastern steppe — 2.7 million square kilometres with zero fibre infrastructure. After a nine-month competitive tender, your coverage numbers beat every incumbent. The first payment just cleared.',
    canOccur: () => true,
    apply: () => ({
      budgetDelta: 500_000,
      effectDesc: '+$500,000 — Kazakhstan rural connectivity contract',
    }),
  },
  {
    id: 'INVESTOR_ROUND',
    category: 'FINANCIAL',
    title: 'SERIES C CLOSES',
    description:
      'After eighteen months of roadshows and three failed term sheets, your Series C has closed at a $4.2B valuation. The lead investor — a Singapore sovereign wealth fund — cited your coverage velocity as "unprecedented in the sector." Your CFO is already planning the next raise.',
    canOccur: () => true,
    apply: () => ({
      budgetDelta: 1_000_000,
      effectDesc: '+$1,000,000 — Series C tranche disbursed',
    }),
  },
  {
    id: 'REGULATORY_FINE',
    category: 'FINANCIAL',
    title: 'ITU SPECTRUM RULING',
    description:
      'The ITU has ruled that two of your LEO orbital planes produce adjacent-channel interference with Ka-band allocations held by ViaSat-7, a legacy GEO operator. Your legal team argued prior coordination. The panel disagreed. The fine arrives with a 14-day payment notice.',
    canOccur: (gs) => gs.satellites.length > 0,
    apply: () => ({
      budgetDelta: -300_000,
      effectDesc: '-$300,000 — ITU spectrum interference penalty',
    }),
  },
  {
    id: 'EMERGENCY_LOAN',
    category: 'FINANCIAL',
    title: 'PRIVATE CREDIT FACILITY',
    description:
      'With a satellite bus delivery due and payroll 48 hours out, your CFO called a contact at a Zurich private credit desk at 11pm on a Friday. The rate is punishing — 14% annualised with a PIK toggle. You sign anyway. The wire arrives by morning.',
    canOccur: () => true,
    apply: () => ({
      budgetDelta: 800_000,
      effectDesc: '+$800,000 — emergency credit facility (14% rate)',
    }),
  },

  // ── ORBITAL HAZARDS ────────────────────────────────────────────────────────
  {
    id: 'SOLAR_STORM',
    category: 'ORBITAL_HAZARD',
    title: 'CLASS-X SOLAR FLARE',
    description:
      'NOAA\'s Space Weather Prediction Center issued a G5 geomagnetic storm warning at 03:17 UTC. By the time your operations team reached their consoles, the first telemetry anomalies were already cascading across the constellation. Power subsystems failed first. Then attitude control. Then silence.',
    canOccur: (gs) => gs.satellites.length > 5,
    apply: (gs) => {
      const fraction = 0.08 + Math.random() * 0.07 // 8–15%
      const { newSats, lost, shell } = shellStorm(gs.satellites, fraction)
      return {
        newSatellites: newSats,
        effectDesc: `${lost} satellite${lost !== 1 ? 's' : ''} lost — ${shell} shell hit hardest`,
      }
    },
  },
  {
    id: 'MICROMETEORITE',
    category: 'ORBITAL_HAZARD',
    title: 'PERSEID DEBRIS STREAM',
    description:
      'The annual Perseid debris stream intersected three of your orbital planes simultaneously — an alignment your trajectory team flagged six weeks ago but rated as low probability. The impacts were fast, sub-millimetre, and lethal to pressurised bus components. No warning. No recovery window.',
    canOccur: (gs) => gs.satellites.length > 0,
    apply: (gs) => {
      const lost = Math.min(gs.satellites.length, 1 + Math.floor(Math.random() * 3))
      const newSats = removeSatellites(gs.satellites, lost)
      return {
        newSatellites: newSats,
        effectDesc: `${lost} satellite${lost !== 1 ? 's' : ''} lost — hull punctures, no recovery`,
      }
    },
  },
  {
    id: 'DEBRIS_CLOUD',
    category: 'ORBITAL_HAZARD',
    title: 'GLONASS UPPER STAGE BREAKUP',
    description:
      'Object 1994-029F — a Soviet-era GLONASS upper stage catalogued as debris for thirty years — finally succumbed to thermal fatigue and residual propellant pressure. The fragmentation generated 340 trackable pieces and thousands of sub-centimetre shrapnel. Your constellation was in the wrong plane at the wrong time.',
    canOccur: (gs) => gs.satellites.length > 10,
    apply: (gs) => {
      const lost = Math.min(gs.satellites.length, 5)
      const newSats = removeSatellites(gs.satellites, lost)
      return {
        newSatellites: newSats,
        effectDesc: `${lost} satellites destroyed — debris field crossing`,
      }
    },
  },
  {
    id: 'GEOMAGNETIC_DIST',
    category: 'ORBITAL_HAZARD',
    title: 'THERMOSPHERE EXPANSION EVENT',
    description:
      'A sustained Kp-8 geomagnetic storm has heated and expanded the thermosphere by an estimated 40% above the 550 km altitude band. Your LEO satellites are experiencing drag forces three times nominal. Propellant reserves are being burned to maintain station-keeping. Revenue suffers while operations scramble.',
    canOccur: () => true,
    apply: () => ({
      newModifiers: [{
        id: 'GEOMAG_INCOME',
        type: 'income_multiplier',
        value: 0.7,
        turnsRemaining: 2,
        desc: 'Thermosphere expansion — income ×0.7',
      }],
      effectDesc: 'Income ×0.7 for 2 months — station-keeping burns draining reserves',
    }),
  },

  // ── MARKET SHIFTS ──────────────────────────────────────────────────────────
  {
    id: 'DEMAND_SURGE',
    category: 'MARKET_SHIFT',
    title: 'UNDERSEA CABLE FAILURES',
    description:
      'Three Pacific undersea cable systems have failed within 60 days — two from fishing trawler damage, one from a seismic event near Tonga. Enterprise clients who relied on them for redundancy are calling your sales team at midnight. The backlog of signed LOIs is longer than your BD team has ever seen.',
    canOccur: () => true,
    apply: () => ({
      newModifiers: [{
        id: 'DEMAND_INCOME',
        type: 'income_multiplier',
        value: 1.5,
        turnsRemaining: 3,
        desc: 'Cable outage demand spike — income ×1.5',
      }],
      effectDesc: 'Income ×1.5 for 3 months — enterprise redundancy contracts flooding in',
    }),
  },
  {
    id: 'MARKET_RECESSION',
    category: 'MARKET_SHIFT',
    title: 'IMF DOWNGRADES GLOBAL OUTLOOK',
    description:
      'The IMF has revised global GDP growth to -1.2% for the year, triggering a wave of enterprise IT budget freezes. Three of your top-ten accounts have requested contract renegotiation. Two are invoking force majeure clauses. Your finance team is modelling which renewals will hold and which are gone.',
    canOccur: () => true,
    apply: () => ({
      newModifiers: [{
        id: 'RECESSION_INCOME',
        type: 'income_multiplier',
        value: 0.6,
        turnsRemaining: 3,
        desc: 'Global recession — income ×0.6',
      }],
      effectDesc: 'Income ×0.6 for 3 months — enterprise spending frozen',
    }),
  },
  {
    id: 'COMPETITOR_LAUNCH',
    category: 'MARKET_SHIFT',
    title: 'ORBITALNET ACTIVATES 400 SATS',
    description:
      'OrbitalNet — backed by a $9B Abu Dhabi sovereign wealth fund — activated 400 LEO satellites overnight and immediately published pricing at 30% below your lowest tier. Three analyst firms published "market reset" notes by 9am. Your enterprise sales pipeline froze. Your board called an emergency session.',
    canOccur: () => true,
    apply: () => ({
      newModifiers: [{
        id: 'COMPETITOR_INCOME',
        type: 'income_multiplier',
        value: 0.8,
        turnsRemaining: 2,
        desc: 'OrbitalNet price war — income ×0.8',
      }],
      effectDesc: 'Income ×0.8 for 2 months — price war with OrbitalNet',
    }),
  },
  {
    id: 'EMERGING_MARKETS',
    category: 'MARKET_SHIFT',
    title: 'AFRICAN TELCO CONSORTIUM DEAL',
    description:
      'A consortium of 14 African and South Asian telecom operators has signed preferred-partner agreements for last-mile satellite backhaul. Combined they reach 340 million potential subscribers across territories with no fixed-line alternative. Your coverage map is suddenly the most valuable real estate in the sector.',
    canOccur: () => true,
    apply: () => ({
      newModifiers: [{
        id: 'EMERGING_INCOME',
        type: 'income_multiplier',
        value: 1.35,
        turnsRemaining: 4,
        desc: 'Emerging market deals — income ×1.35',
      }],
      effectDesc: 'Income ×1.35 for 4 months — 14-nation telco consortium activated',
    }),
  },

  // ── TECH DISCOVERIES ───────────────────────────────────────────────────────
  {
    id: 'PROPULSION_BREAKTHROUGH',
    category: 'TECH',
    title: 'GRIDDED ION THRUSTER VALIDATED',
    description:
      'Your Bangalore propulsion lab has validated a new gridded ion thruster achieving 3,200s specific impulse on a xenon budget 30% smaller than the previous design. The performance envelope blew past simulations on the first firing test. The patent filing is already in. Manufacturing retooling starts next week.',
    canOccur: () => true,
    apply: () => ({
      newModifiers: [{
        id: 'PROP_COST',
        type: 'cost_multiplier',
        value: 0.75,
        turnsRemaining: 3,
        desc: 'Ion thruster breakthrough — launch costs ×0.75',
      }],
      effectDesc: 'Launch costs ×0.75 for 3 months — Bangalore ion thruster in production',
    }),
  },
  {
    id: 'ANTENNA_EFFICIENCY',
    category: 'TECH',
    title: 'SHENZHEN YIELD BREAKTHROUGH',
    description:
      'A process improvement at your phased-array supplier in Shenzhen — six months of yield engineering on the gallium nitride layer deposition — has pushed panel production yield from 67% to 94%. The cost drop flows directly to your per-unit bill of materials. Your procurement team is already renegotiating volume tiers.',
    canOccur: () => true,
    apply: () => ({
      newModifiers: [{
        id: 'ANT_COST',
        type: 'cost_multiplier',
        value: 0.8,
        turnsRemaining: 3,
        desc: 'GaN yield improvement — launch costs ×0.8',
      }],
      effectDesc: 'Launch costs ×0.8 for 3 months — Shenzhen GaN yield breakthrough',
    }),
  },
  {
    id: 'MINIATURIZATION',
    category: 'TECH',
    title: '6U PROCESSOR STACK CERTIFIED',
    description:
      'Your Taiwan hardware team has shrunk the onboard compute and comms stack to a 6U cubesat form factor without sacrificing link budget or radiation tolerance. The key was a custom ASIC that consolidates seven discrete chips into one. A smaller bus means a cheaper rocket slot. Every kilogram counts at these launch rates.',
    canOccur: () => true,
    apply: () => ({
      newModifiers: [{
        id: 'MINI_COST',
        type: 'cost_multiplier',
        value: 0.7,
        turnsRemaining: 2,
        desc: '6U miniaturization — launch costs ×0.7',
      }],
      effectDesc: 'Launch costs ×0.7 for 2 months — 6U ASIC stack in production',
    }),
  },
  {
    id: 'MANUFACTURING_SCALE',
    category: 'TECH',
    title: '40 SATS PER WEEK MILESTONE',
    description:
      'Your Hawthorne assembly line crossed 40 satellites per week this month — a threshold your operations team had targeted for two years. At this volume, every tier-1 component supplier has opened renegotiation talks. Your procurement team has accepted all of them. The savings are immediate and compounding.',
    canOccur: () => true,
    apply: () => ({
      newModifiers: [{
        id: 'MFG_COST',
        type: 'cost_multiplier',
        value: 0.85,
        turnsRemaining: 4,
        desc: 'Volume discounts unlocked — launch costs ×0.85',
      }],
      effectDesc: 'Launch costs ×0.85 for 4 months — volume discounts from all suppliers',
    }),
  },

  // ── FINANCIAL (continued) ──────────────────────────────────────────────────
  {
    id: 'INSURANCE_PAYOUT',
    category: 'FINANCIAL',
    title: 'LLOYD\'S OF LONDON PAYS OUT',
    description:
      'After eight months of loss adjustment, independent technical review, and one very tense mediation in a Lime Street conference room, Lloyd\'s has settled your orbital loss claim. Your broker called it "faster than expected." Anyone who has filed an orbital claim before knows exactly what that means.',
    canOccur: () => true,
    apply: () => ({
      budgetDelta: 600_000,
      effectDesc: '+$600,000 — orbital loss insurance settlement',
    }),
  },
  {
    id: 'SPECTRUM_RIGHTS_SALE',
    category: 'FINANCIAL',
    title: 'SECONDARY SPECTRUM SALE',
    description:
      'A European mobile operator has purchased secondary use rights to your Ka-band allocation over Western Europe during off-peak hours — 02:00 to 06:00 local, Monday through Friday. You weren\'t filling those slots anyway. The lawyers took three weeks to close it. The wire came through in 72 hours.',
    canOccur: () => true,
    apply: () => ({
      budgetDelta: 350_000,
      effectDesc: '+$350,000 — Ka-band secondary spectrum rights sold',
    }),
  },
  {
    id: 'EU_SUBSIDY',
    category: 'FINANCIAL',
    title: 'EU DIGITAL DECADE FUND GRANT',
    description:
      'The European Commission has approved your application under the Digital Decade Rural Connectivity Fund after 14 months of lobbying, three site visits, and a 200-page technical annex. Your Brussels government affairs team flew home business class. They earned it.',
    canOccur: () => true,
    apply: () => ({
      newModifiers: [{
        id: 'EU_INCOME',
        type: 'income_multiplier',
        value: 1.2,
        turnsRemaining: 3,
        desc: 'EU Digital Decade grant — income ×1.2',
      }],
      effectDesc: 'Income ×1.2 for 3 months — EU quarterly grant tranches',
    }),
  },
  {
    id: 'DOD_CONTRACT',
    category: 'FINANCIAL',
    title: 'DoD PWSA CONTRACT AWARDED',
    description:
      'The US Department of Defense has awarded your constellation a classified secure communications contract under the Space Development Agency\'s Proliferated Warfighter Space Architecture programme. The NDA runs 25 years. The payment does not. Your legal team is already drafting the ITAR compliance addendum.',
    canOccur: () => true,
    apply: () => ({
      budgetDelta: 1_500_000,
      effectDesc: '+$1,500,000 — DoD PWSA classified comms contract',
    }),
  },

  // ── ORBITAL HAZARDS (continued) ────────────────────────────────────────────
  {
    id: 'ASAT_TEST',
    category: 'ORBITAL_HAZARD',
    title: 'ASAT TEST DEBRIS FIELD',
    description:
      'The PLA Strategic Support Force has conducted a direct-ascent anti-satellite test at 650 km altitude — their own decommissioned weather satellite, FY-1C class. The intercept generated 1,700 trackable objects and an estimated 35,000 sub-centimetre fragments. Your LEO constellation is directly in the affected band. LeoTrack has flagged 47 high-priority conjunctions in the next 96 hours.',
    canOccur: (gs) => gs.satellites.length > 0,
    apply: (gs) => {
      const lost = Math.min(gs.satellites.length, 2 + Math.floor(Math.random() * 4))
      const newSats = removeSatellites(gs.satellites, lost)
      return {
        newSatellites: newSats,
        effectDesc: `${lost} satellites lost — ASAT debris field crossing`,
      }
    },
  },
  {
    id: 'BATTERY_DEGRADATION',
    category: 'ORBITAL_HAZARD',
    title: 'LITHIUM CELL FAILURES ACROSS FLEET',
    description:
      'Post-eclipse thermal cycling at LEO is destroying battery cells twice as fast as your qualification testing predicted. Affected satellites are entering safe mode during eclipse periods, cutting link availability by roughly 30%. Your bus supplier is pointing at the test spec. Engineering is writing the response. Neither answer helps your customers right now.',
    canOccur: (gs) => gs.satellites.length > 0,
    apply: () => ({
      newModifiers: [{
        id: 'BATTERY_INCOME',
        type: 'income_multiplier',
        value: 0.75,
        turnsRemaining: 2,
        desc: 'Battery cell failures — income ×0.75',
      }],
      effectDesc: 'Income ×0.75 for 2 months — fleet-wide eclipse safe-mode events',
    }),
  },
  {
    id: 'CONJUNCTION_EVENT',
    category: 'ORBITAL_HAZARD',
    title: '27-METRE CONJUNCTION: EMERGENCY BURNS',
    description:
      'LeoTrack issued a red conjunction warning at T-18 hours: a defunct Iridium bus closing at 14 km/s with a predicted miss distance of 27 metres — inside the hard-body radius. You executed emergency avoidance manoeuvres on 12 satellites simultaneously at 03:40 UTC. Every one survived. Propellant margins are now uncomfortably thin. Future batches will need larger reserves.',
    canOccur: (gs) => gs.satellites.length > 0,
    apply: () => ({
      newModifiers: [{
        id: 'CONJUNCTION_COST',
        type: 'cost_multiplier',
        value: 1.15,
        turnsRemaining: 2,
        desc: 'Propellant reserve increase — costs ×1.15',
      }],
      effectDesc: 'Launch costs ×1.15 for 2 months — increased propellant reserves mandated',
    }),
  },
  {
    id: 'FIRMWARE_INCIDENT',
    category: 'ORBITAL_HAZARD',
    title: 'FIRMWARE 4.1.2 ROLLOUT INCIDENT',
    description:
      'A race condition in firmware 4.1.2\'s attitude determination loop caused uncontrolled tumbling in every satellite that received the overnight OTA push. Ground operators spent 72 hours recovering them individually using backup command sequences. Some came back. Your software lead has not slept since Tuesday.',
    canOccur: (gs) => gs.satellites.length > 0,
    apply: (gs) => {
      const lost = Math.min(gs.satellites.length, 1 + Math.floor(Math.random() * 3))
      const newSats = removeSatellites(gs.satellites, lost)
      return {
        newSatellites: newSats,
        effectDesc: `${lost} satellite${lost !== 1 ? 's' : ''} unrecoverable — firmware OTA incident`,
      }
    },
  },

  // ── MARKET SHIFTS (continued) ──────────────────────────────────────────────
  {
    id: 'AVIATION_DEAL',
    category: 'MARKET_SHIFT',
    title: 'APEX AIRWAYS IN-FLIGHT DEAL',
    description:
      'Apex Airways — 340 aircraft, 47 million annual passengers — has signed a 5-year in-flight connectivity agreement across your constellation. Passengers pay per-session; you take 60% of gross. The routes run almost exclusively through the oceanic corridors where your coverage density is highest. Your product team is already scoping the passenger app.',
    canOccur: () => true,
    apply: () => ({
      newModifiers: [{
        id: 'AVIATION_INCOME',
        type: 'income_multiplier',
        value: 1.25,
        turnsRemaining: 4,
        desc: 'Apex Airways deal — income ×1.25',
      }],
      effectDesc: 'Income ×1.25 for 4 months — Apex Airways 340-aircraft fleet activated',
    }),
  },
  {
    id: 'MARITIME_CONTRACT',
    category: 'MARKET_SHIFT',
    title: 'MAERSK FLEET CONNECTIVITY SIGNED',
    description:
      'A.P. Moller-Maersk has signed a preferred-supplier agreement covering their 730-vessel fleet. Throughput requirements per ship are modest, but the geographic spread of their routes demands persistent global coverage — across the Southern Ocean, Arctic transits, and mid-Pacific. Your constellation is one of three that can actually deliver it. You\'re the only one that closed.',
    canOccur: () => true,
    apply: () => ({
      newModifiers: [{
        id: 'MARITIME_INCOME',
        type: 'income_multiplier',
        value: 1.3,
        turnsRemaining: 3,
        desc: 'Maersk fleet deal — income ×1.3',
      }],
      effectDesc: 'Income ×1.3 for 3 months — Maersk 730-vessel fleet signed',
    }),
  },
  {
    id: '5G_COMPETITION',
    category: 'MARKET_SHIFT',
    title: 'ERICSSON 5G RURAL ROLLOUT',
    description:
      'Ericsson has secured contracts to deploy 5G fixed-wireless access across 60 rural markets in Southeast Asia and Latin America — markets where satellite was the only credible broadband alternative. The buildout timeline is 18 months. So is the revenue impact. Your APAC sales team is already reforecasting.',
    canOccur: () => true,
    apply: () => ({
      newModifiers: [{
        id: '5G_INCOME',
        type: 'income_multiplier',
        value: 0.82,
        turnsRemaining: 3,
        desc: '5G rural competition — income ×0.82',
      }],
      effectDesc: 'Income ×0.82 for 3 months — 5G displacing satellite in 60 rural markets',
    }),
  },
  {
    id: 'MEDIA_SPIKE',
    category: 'MARKET_SHIFT',
    title: '60 MINUTES FEATURE DRIVES SIGN-UPS',
    description:
      'A 14-minute CBS 60 Minutes segment — centred on a Chilean fishing village your constellation connected to the outside world for the first time — generated 2.3 million social impressions overnight. Consumer sign-ups tripled in the following 72 hours. B2B inquiry volume is up 40%. Your PR team is fielding calls from six documentary filmmakers. You didn\'t pay for any of it.',
    canOccur: () => true,
    apply: () => ({
      newModifiers: [{
        id: 'MEDIA_INCOME',
        type: 'income_multiplier',
        value: 1.18,
        turnsRemaining: 2,
        desc: 'Media coverage spike — income ×1.18',
      }],
      effectDesc: 'Income ×1.18 for 2 months — viral 60 Minutes segment drives subscriptions',
    }),
  },

  // ── TECH DISCOVERIES (continued) ───────────────────────────────────────────
  {
    id: 'LASER_CROSSLINKS',
    category: 'TECH',
    title: 'OPTICAL ISL TRIAL: 1.2 TBPS',
    description:
      'Your optical inter-satellite link prototype has completed a 90-day field trial at 1.2 Tbps over 4,200 km between two test satellites in the same orbital plane. Eliminating the ground-station relay hop drops end-to-end latency by 38ms. Enterprise customers notice latency. Enterprise customers pay for latency. Your product team has already briefed the top ten accounts.',
    canOccur: () => true,
    apply: () => ({
      newModifiers: [{
        id: 'ISL_INCOME',
        type: 'income_multiplier',
        value: 1.22,
        turnsRemaining: 4,
        desc: 'Optical ISL deployed — income ×1.22',
      }],
      effectDesc: 'Income ×1.22 for 4 months — optical ISL cuts latency by 38ms',
    }),
  },
  {
    id: 'AI_ROUTING',
    category: 'TECH',
    title: 'TRANSFORMER ROUTING ENGINE LIVE',
    description:
      'Your ML team has deployed a transformer-based traffic routing engine across the ground segment. In the first 30 days it reduced inter-beam handover failures by 61% and lifted average throughput utilisation from 54% to 79%. The same hardware. Better software. Your CTO is insufferable about it.',
    canOccur: () => true,
    apply: () => ({
      newModifiers: [{
        id: 'AI_INCOME',
        type: 'income_multiplier',
        value: 1.2,
        turnsRemaining: 3,
        desc: 'AI routing engine — income ×1.2',
      }],
      effectDesc: 'Income ×1.2 for 3 months — utilisation up 25pp with AI routing',
    }),
  },
  {
    id: 'REUSABLE_ROCKET_DEAL',
    category: 'TECH',
    title: 'STARSHIP BLOCK 2 RIDESHARE DEAL',
    description:
      'You\'ve signed a multi-launch agreement for Starship Block 2 rideshare slots at a fixed price per kilogram that would have been laughed out of the room two years ago. Full reusability has permanently reset the launch cost curve. Your payload-to-orbit cost is about to fall off a cliff. Your competitors are still on the old pricing.',
    canOccur: () => true,
    apply: () => ({
      newModifiers: [{
        id: 'STARSHIP_COST',
        type: 'cost_multiplier',
        value: 0.65,
        turnsRemaining: 3,
        desc: 'Starship rideshare deal — launch costs ×0.65',
      }],
      effectDesc: 'Launch costs ×0.65 for 3 months — Starship Block 2 slots locked in',
    }),
  },
  {
    id: 'SDR_CERTIFICATION',
    category: 'TECH',
    title: 'DYNAMIC SPECTRUM REUSE CERTIFIED',
    description:
      'Your software-defined radio payload has passed FCC certification for dynamic spectrum reuse — allocating frequency bands in real time based on traffic demand and adjacent-band occupancy. The regulatory approval took three years and two rounds of rule-making comments. The result is 22% higher spectral efficiency across your entire fleet, with no new hardware required.',
    canOccur: () => true,
    apply: () => ({
      newModifiers: [{
        id: 'SDR_INCOME',
        type: 'income_multiplier',
        value: 1.22,
        turnsRemaining: 3,
        desc: 'SDR dynamic spectrum — income ×1.22',
      }],
      effectDesc: 'Income ×1.22 for 3 months — 22% spectral efficiency gain fleet-wide',
    }),
  },
]
