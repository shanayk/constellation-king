import { useRef, useEffect, useState, useMemo } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { OrbitControls, Stars } from '@react-three/drei'
import * as THREE from 'three'
import { feature } from 'topojson-client'
import { GLOBE_RADIUS, MAX_RENDERED_SATELLITES } from '../game/constants'

// ── World map (country borders) ────────────────────────────────────────────

const LINE_RADIUS = GLOBE_RADIUS + 0.01

function latLonToVec3(lat, lon, r) {
  const phi = (90 - lat) * (Math.PI / 180)
  const theta = (lon + 180) * (Math.PI / 180)
  return new THREE.Vector3(
    -r * Math.sin(phi) * Math.cos(theta),
    r * Math.cos(phi),
    r * Math.sin(phi) * Math.sin(theta)
  )
}

let _worldGeo = null
let _worldGeoPromise = null

function getWorldGeo() {
  if (_worldGeo) return Promise.resolve(_worldGeo)
  if (!_worldGeoPromise) {
    _worldGeoPromise = fetch('https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json')
      .then((r) => r.json())
      .then((topology) => {
        const countries = feature(topology, topology.objects.countries)
        const points = []

        const processRing = (ring) => {
          for (let i = 0; i < ring.length - 1; i++) {
            points.push(latLonToVec3(ring[i][1], ring[i][0], LINE_RADIUS))
            points.push(latLonToVec3(ring[i + 1][1], ring[i + 1][0], LINE_RADIUS))
          }
          points.push(latLonToVec3(ring[ring.length - 1][1], ring[ring.length - 1][0], LINE_RADIUS))
          points.push(latLonToVec3(ring[0][1], ring[0][0], LINE_RADIUS))
        }

        countries.features.forEach((f) => {
          if (!f.geometry) return
          if (f.geometry.type === 'Polygon') {
            f.geometry.coordinates.forEach(processRing)
          } else if (f.geometry.type === 'MultiPolygon') {
            f.geometry.coordinates.forEach((poly) => poly.forEach(processRing))
          }
        })

        _worldGeo = new THREE.BufferGeometry().setFromPoints(points)
        return _worldGeo
      })
  }
  return _worldGeoPromise
}

function WorldCountries() {
  const [lineGeo, setLineGeo] = useState(() => _worldGeo)

  const lineMat = useMemo(() => {
    const mat = new THREE.LineBasicMaterial({ color: '#39FF14', transparent: true, opacity: 0.7 })
    mat.onBeforeCompile = (shader) => {
      shader.vertexShader = shader.vertexShader.replace(
        '#include <project_vertex>',
        `#include <project_vertex>
        gl_Position.z -= 0.001 * gl_Position.w;`
      )
    }
    return mat
  }, [])

  useEffect(() => {
    if (lineGeo) return
    getWorldGeo().then(setLineGeo)
  }, [])

  if (!lineGeo) return null
  return <lineSegments geometry={lineGeo} material={lineMat} />
}

// ── Globe base ──────────────────────────────────────────────────────────────

function EarthGlobe() {
  return (
    <group>
      <mesh>
        <sphereGeometry args={[GLOBE_RADIUS - 0.01, 36, 18]} />
        <meshBasicMaterial color="#000a00" />
      </mesh>
      <WorldCountries />
      <mesh>
        <sphereGeometry args={[GLOBE_RADIUS + 0.04, 32, 16]} />
        <meshBasicMaterial color="#003300" transparent opacity={0.1} side={2} />
      </mesh>
    </group>
  )
}

// ── Orbital shell rings ─────────────────────────────────────────────────────

function OrbitalShell({ radius, color }) {
  return (
    <mesh rotation={[Math.PI / 2, 0, 0]}>
      <torusGeometry args={[radius, 0.003, 2, 128]} />
      <meshBasicMaterial color={color} transparent opacity={0.12} />
    </mesh>
  )
}

// ── Satellite cloud (instanced) ─────────────────────────────────────────────

function SatelliteCloud({ satellites }) {
  const meshRef = useRef()
  // Map from satellite id → current orbital angle (mutated each frame)
  const anglesRef = useRef(new Map())
  const prevCountRef = useRef(0)

  // Reusable objects — allocated once to avoid GC pressure in useFrame
  const dummy = useRef(new THREE.Object3D())
  const orbitMatrix = useRef(new THREE.Matrix4())
  const tmpColor = useRef(new THREE.Color())

  const visible = satellites.length <= MAX_RENDERED_SATELLITES
    ? satellites
    : satellites.slice(-MAX_RENDERED_SATELLITES)

  const count = visible.length

  // When new satellites arrive, assign random starting angles and set instance colors
  useEffect(() => {
    if (!meshRef.current || count === 0) return

    for (let i = prevCountRef.current; i < count; i++) {
      const sat = visible[i]
      if (!anglesRef.current.has(sat.id)) {
        anglesRef.current.set(sat.id, Math.random() * Math.PI * 2)
      }
      tmpColor.current.set(sat.color)
      meshRef.current.setColorAt(i, tmpColor.current)
    }

    if (meshRef.current.instanceColor) {
      meshRef.current.instanceColor.needsUpdate = true
    }

    meshRef.current.count = count
    prevCountRef.current = count
  }, [count])

  useFrame((_, delta) => {
    if (!meshRef.current || count === 0) return

    for (let i = 0; i < count; i++) {
      const sat = visible[i]
      const prev = anglesRef.current.get(sat.id) ?? 0
      const angle = prev + delta * sat.speed
      anglesRef.current.set(sat.id, angle)

      const r = GLOBE_RADIUS + sat.altitude3d
      dummy.current.position.set(r * Math.cos(angle), 0, r * Math.sin(angle))
      dummy.current.updateMatrix()

      // Apply precomputed orbit-plane rotation (inclination + RAAN, fixed per satellite)
      orbitMatrix.current.fromArray(sat.rotationMatrix)
      orbitMatrix.current.multiply(dummy.current.matrix)
      meshRef.current.setMatrixAt(i, orbitMatrix.current)
    }

    meshRef.current.instanceMatrix.needsUpdate = true
  })

  return (
    <instancedMesh ref={meshRef} args={[null, null, MAX_RENDERED_SATELLITES]}>
      <sphereGeometry args={[0.03, 5, 5]} />
      <meshBasicMaterial />
    </instancedMesh>
  )
}

// ── Globe export ────────────────────────────────────────────────────────────

export default function Globe({ satellites, autoRotate = false }) {
  return (
    <Canvas
      camera={{ position: [0, 2.5, 6.5], fov: 42 }}
      style={{ position: 'absolute', inset: 0, background: 'transparent' }}
    >
      <ambientLight intensity={0.15} color="#39FF14" />
      <pointLight position={[8, 8, 8]} intensity={1.0} color="#aaffaa" />
      <pointLight position={[-8, -4, -8]} intensity={0.3} color="#00ff44" />

      <Stars radius={100} depth={50} count={4000} factor={3} saturation={0} fade />

      <EarthGlobe />

      <OrbitalShell radius={GLOBE_RADIUS + 0.35} color="#00ffaa" />
      <OrbitalShell radius={GLOBE_RADIUS + 0.55} color="#44ddff" />
      <OrbitalShell radius={GLOBE_RADIUS + 0.75} color="#ffaa00" />
      <OrbitalShell radius={GLOBE_RADIUS + 1.5}  color="#ff4488" />

      {satellites.length > 0 && <SatelliteCloud satellites={satellites} />}

      <OrbitControls
        enablePan={false}
        minDistance={3.5}
        maxDistance={14}
        autoRotate={autoRotate}
        autoRotateSpeed={0.5}
      />
    </Canvas>
  )
}
