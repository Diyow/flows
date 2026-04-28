/**
 * HeroScene.tsx — 3D Hero Component
 *
 * This component renders an interactive 3D scene as the hero section
 * of the FloodWatch app. It uses:
 *
 *   - React Three Fiber (@react-three/fiber)  → React wrapper for Three.js
 *   - Drei (@react-three/drei)                → Helper components for R3F
 *   - Three.js (three)                        → The 3D engine under the hood
 *
 * HOW IT WORKS:
 *   <Canvas> creates a WebGL context (like a 3D viewport).
 *   Inside it, you place 3D objects (meshes, lights, cameras) as JSX.
 *   R3F re-renders the scene every frame (~60fps) automatically.
 *
 * STRUCTURE:
 *   HeroScene (main export)
 *     └─ <Canvas>              ← the 3D viewport
 *         ├─ Lights            ← illuminate the scene
 *         ├─ RiverModel        ← your GLTF river model
 *         ├─ WaterParticles    ← floating glowing dots
 *         ├─ GlowRing          ← decorative ring at the base
 *         ├─ OrbitControls     ← slow auto-rotation (no user zoom)
 *         └─ Environment       ← ambient lighting/reflections
 *     └─ HTML overlays         ← status text, readings (positioned via CSS)
 */

'use client'; // Required: Three.js only works in the browser, not on the server

import { Suspense, useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import {
  useGLTF,        // Hook to load .gltf/.glb 3D models
  Environment,    // Pre-built lighting environments (city, sunset, etc.)
  ContactShadows, // Soft shadow plane beneath objects
  Float,          // Makes children gently bob up and down
} from '@react-three/drei';
import * as THREE from 'three';

// ─── CONSTANTS ──────────────────────────────────────────────────────
// Camera position extracted from the GLTF file's embedded camera node.
// This is the exact viewpoint the 3D artist set in Blender.
// Format: { x, y, z } — in Three.js, Y is up, Z is towards you.
const SCENE_CAM = {
  position: [6.54, 6.02, 10.67] as [number, number, number],
  fov: 50, // Field of view in degrees (lower = more telephoto/zoomed in)
};

// ─── RiverModel ─────────────────────────────────────────────────────
/**
 * Loads and renders the GLTF river/channel 3D model.
 *
 * useGLTF('/models/scene.gltf') loads the file and returns:
 *   - scene: the root THREE.Group containing all meshes/materials
 *   - nodes: individual named objects (Camera, Light, Plane, etc.)
 *   - materials: all materials used by the model
 *
 * <primitive object={scene} /> is how you render a pre-built Three.js
 * object inside R3F's JSX tree.
 *
 * TWEAKABLE VALUES:
 *   - scale={1.8}           → make the model bigger/smaller
 *   - position={[0,-0.8,0]} → shift model (x, y, z)
 */
function RiverModel() {
  const { scene } = useGLTF('/models/scene.gltf');

  return (
    <group scale={1.8} position={[0, -0.8, 0]}>
      <primitive object={scene} />
    </group>
  );
}

// ─── WaterParticles ─────────────────────────────────────────────────
/**
 * Creates many small glowing spheres that float around the scene
 * to simulate water droplets / atmosphere.
 *
 * HOW IT WORKS:
 *   Instead of rendering 120 separate <mesh> components (slow),
 *   we use THREE.InstancedMesh — it draws the same geometry many
 *   times in a single draw call, which is much faster.
 *
 *   Each particle has a random position, speed, and phase offset.
 *   Every frame, we update each instance's transform matrix to
 *   make them float around with sine/cosine waves.
 *
 * TWEAKABLE VALUES:
 *   - count={120}           → number of particles (more = denser)
 *   - spread: 14            → how far particles spread (lines 104-106)
 *   - scale: 0.02–0.06      → particle size range
 *   - color="#67e8f9"        → particle color (cyan)
 *   - emissive="#06b6d4"     → glow color
 *   - emissiveIntensity={2}  → glow brightness
 *   - opacity={0.6}          → transparency (0 = invisible, 1 = solid)
 *
 * @param count - How many particles to render (default: 120)
 */
function WaterParticles({ count = 120 }: { count?: number }) {
  const mesh = useRef<THREE.InstancedMesh>(null);

  // Generate random positions/speeds once (useMemo = only on first render)
  const particles = useMemo(() => {
    const temp = [];
    for (let i = 0; i < count; i++) {
      temp.push({
        // Random position in a 14×8×14 box
        position: [
          (Math.random() - 0.5) * 14, // x: -7 to +7
          Math.random() * 8 - 1,       // y: -1 to +7
          (Math.random() - 0.5) * 14, // z: -7 to +7
        ] as [number, number, number],
        speed: 0.2 + Math.random() * 0.5,     // How fast it bobs
        offset: Math.random() * Math.PI * 2,   // Phase offset so they don't all sync
        scale: 0.02 + Math.random() * 0.04,    // Size: 0.02 to 0.06
      });
    }
    return temp;
  }, [count]);

  // Reusable dummy object for calculating transform matrices
  const dummy = useMemo(() => new THREE.Object3D(), []);

  // Runs every frame — updates all particle positions
  useFrame((state) => {
    if (!mesh.current) return;
    const t = state.clock.elapsedTime;

    particles.forEach((p, i) => {
      // Animate Y position with sine wave
      const y = p.position[1] + Math.sin(t * p.speed + p.offset) * 0.5;

      // Set position with subtle X/Z drift
      dummy.position.set(
        p.position[0] + Math.sin(t * 0.3 + p.offset) * 0.3,
        y,
        p.position[2] + Math.cos(t * 0.2 + p.offset) * 0.3
      );

      // Pulse the scale (breathing effect)
      dummy.scale.setScalar(p.scale * (1 + Math.sin(t * 2 + p.offset) * 0.3));

      // Apply the transform to this instance
      dummy.updateMatrix();
      mesh.current!.setMatrixAt(i, dummy.matrix);
    });

    // Tell Three.js the instance data changed
    mesh.current.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh ref={mesh} args={[undefined, undefined, count]}>
      {/* All particles share this geometry (a small sphere) */}
      <sphereGeometry args={[1, 8, 8]} />
      {/* Glowing cyan material */}
      <meshStandardMaterial
        color="#67e8f9"
        emissive="#06b6d4"
        emissiveIntensity={2}
        transparent
        opacity={0.6}
        toneMapped={false} // Allows glow to be brighter than white
      />
    </instancedMesh>
  );
}

// ─── GlowRing ───────────────────────────────────────────────────────
/**
 * A thin glowing torus (donut shape) at the base of the scene.
 * Purely decorative — adds a futuristic/tech feel.
 *
 * TWEAKABLE VALUES:
 *   - args={[5.5, 0.015, 16, 100]} → [radius, tube thickness, radial segments, tubular segments]
 *   - emissiveIntensity={3}        → glow brightness
 *   - opacity={0.4}                → transparency
 *   - rotation speed: 0.1          → how fast it spins (line 178)
 */
function GlowRing() {
  const ref = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (ref.current) {
      // Lay the ring flat (rotate 90° around X axis)
      ref.current.rotation.x = Math.PI / 2;
      // Slowly spin around Z axis
      ref.current.rotation.z = state.clock.elapsedTime * 0.1;
    }
  });

  return (
    <mesh ref={ref} position={[0, -0.5, 0]}>
      <torusGeometry args={[5.5, 0.015, 16, 100]} />
      <meshStandardMaterial
        color="#06b6d4"
        emissive="#06b6d4"
        emissiveIntensity={3}
        transparent
        opacity={0.4}
        toneMapped={false}
      />
    </mesh>
  );
}

// ─── Loader ─────────────────────────────────────────────────────────
/**
 * Shown inside the 3D canvas while the GLTF model is still loading.
 * Just a simple wireframe sphere so the user sees *something* quickly.
 */
function Loader() {
  return (
    <mesh>
      <sphereGeometry args={[0.5, 16, 16]} />
      <meshStandardMaterial color="#06b6d4" wireframe />
    </mesh>
  );
}

// ─── HeroScene (main export) ────────────────────────────────────────
/**
 * The full hero section: a 3D canvas with overlaid HTML status info.
 *
 * PROPS:
 *   - status: 'safe' | 'warning' | 'danger' → determines colors & label
 *   - currentLevel: number                   → water level reading (meters)
 *   - currentFlow: number                    → flow rate reading (m³/s)
 *
 * LAYOUT:
 *   ┌──────────────────────────────────────┐
 *   │  3D Canvas (WebGL)                   │
 *   │        [river model + particles]     │
 *   │                                      │
 *   │     ● LIVE MONITORING                │  ← HTML overlay
 *   │        S A F E                       │     (positioned with CSS)
 *   │   Water levels and flow are normal   │
 *   │   ┌──────────┐ ┌──────────┐         │
 *   │   │ 1.25m    │ │ 64.8 m³/s│         │
 *   │   └──────────┘ └──────────┘         │
 *   └──────────────────────────────────────┘
 */

interface HeroSceneProps {
  status: 'safe' | 'warning' | 'danger';
  currentLevel: number;
  currentFlow: number;
}

export function HeroScene({ status, currentLevel, currentFlow }: HeroSceneProps) {
  // Color/text config for each status level
  const statusConfig = {
    safe: {
      label: 'SAFE',
      sublabel: 'Water levels and flow are normal',
      color: 'text-emerald-400',
      border: 'border-emerald-500/30',
      dot: 'bg-emerald-400',
    },
    warning: {
      label: 'WARNING',
      sublabel: 'Elevated readings detected — Stay alert',
      color: 'text-amber-400',
      border: 'border-amber-500/30',
      dot: 'bg-amber-400',
    },
    danger: {
      label: 'DANGER',
      sublabel: 'Critical conditions — Evacuate immediately!',
      color: 'text-red-400',
      border: 'border-red-500/30',
      dot: 'bg-red-400',
    },
  };

  const cfg = statusConfig[status];

  return (
    <div className="relative w-full h-[520px] md:h-[600px] rounded-2xl overflow-hidden border border-gray-800/60">

      {/* ============================================================
          3D CANVAS — Everything inside <Canvas> is Three.js/WebGL.
          Nothing here is HTML — it's all rendered on a GPU texture.
          ============================================================ */}
      <Canvas
        camera={{
          position: SCENE_CAM.position, // Use the GLTF scene's camera position
          fov: SCENE_CAM.fov,           // Use the GLTF scene's field of view
        }}
        gl={{ antialias: true, alpha: true }} // Smooth edges, transparent BG
        dpr={[1, 1.5]}                        // Device pixel ratio (retina)
        style={{ background: 'transparent' }}
      >
        {/* Background color of the 3D viewport */}
        <color attach="background" args={['#080c14']} />

        {/* Fog: objects further than 40 units fade into the background.
            This hides the hard edges of the scene and adds depth.
            args={[color, near start, far end]} */}
        <fog attach="fog" args={['#080c14', 12, 40]} />

        {/* ── LIGHTING ──
            Without lights, everything is black. We use several lights
            from different angles to create depth and color variation.

            ambientLight     → uniform light everywhere (no shadows)
            directionalLight → like the sun (parallel rays, casts shadows)
            pointLight       → like a light bulb (radiates in all directions)
            spotLight        → like a flashlight (cone of light)
        */}
        <ambientLight intensity={0.8} />
        <directionalLight
          position={[5, 8, 5]}    // Top-right-front
          intensity={2.5}
          color="#e0f2fe"          // Cool white
          castShadow
        />
        <directionalLight
          position={[-3, 5, -2]}  // Top-left-back (fill light)
          intensity={1.2}
          color="#93c5fd"          // Soft blue
        />
        <pointLight position={[-4, 3, -4]} intensity={1.5} color="#67e8f9" />
        <pointLight position={[3, 2, 5]} intensity={1.0} color="#a78bfa" />
        <pointLight position={[0, 1, 0]} intensity={0.8} color="#22d3ee" />
        <spotLight
          position={[0, 10, 0]}   // Directly above
          angle={0.4}             // Cone angle (radians)
          penumbra={1}            // Soft edge (0=hard, 1=soft)
          intensity={1.5}
          color="#06b6d4"
        />

        {/* Suspense shows <Loader /> while the GLTF model downloads */}
        <Suspense fallback={<Loader />}>
          {/* Float makes children gently bob up and down */}
          <Float
            speed={1.5}                        // Bob speed
            rotationIntensity={0.1}            // How much it tilts
            floatIntensity={0.3}               // How far it moves up/down
            floatingRange={[-0.05, 0.05]}      // Y range in units
          >
            <RiverModel />
          </Float>

          <WaterParticles />
          <GlowRing />

          {/* Soft shadow on the "floor" beneath the model */}
          <ContactShadows
            position={[0, -1.5, 0]}
            opacity={0.35}
            scale={20}
            blur={2.5}
            far={5}
          />

          {/* Environment map: provides ambient reflections/lighting.
              Presets: 'city', 'sunset', 'dawn', 'night', 'forest',
              'apartment', 'studio', 'warehouse', 'park', 'lobby' */}
          <Environment preset="city" />
        </Suspense>


      </Canvas>

      {/* ============================================================
          HTML OVERLAYS — These are normal HTML/CSS elements positioned
          on top of the 3D canvas using CSS absolute positioning.
          pointer-events-none makes clicks pass through to the canvas.
          ============================================================ */}

      {/* Gradient fades that blend the 3D scene edges into the page */}
      <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-[#0a0a0f] to-transparent pointer-events-none" />
      <div className="absolute inset-x-0 top-0 h-28 bg-gradient-to-b from-[#0a0a0f]/70 to-transparent pointer-events-none" />
      <div className="absolute inset-y-0 left-0 w-20 bg-gradient-to-r from-[#0a0a0f]/60 to-transparent pointer-events-none" />
      <div className="absolute inset-y-0 right-0 w-20 bg-gradient-to-l from-[#0a0a0f]/60 to-transparent pointer-events-none" />

      {/* Status info positioned at the bottom center of the hero */}
      <div className="absolute inset-0 flex flex-col items-center justify-end pb-10 md:pb-14 pointer-events-none">
        <div className="flex flex-col items-center gap-3 animate-fade-in">

          {/* "Live Monitoring" badge with pulsing dot */}
          <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-gray-900/70 border border-gray-700/50 backdrop-blur-sm">
            <span className={`w-2 h-2 rounded-full ${cfg.dot} animate-pulse`} />
            <span className="text-xs text-gray-400 uppercase tracking-widest font-medium">
              Live Monitoring
            </span>
          </div>

          {/* Big status text (SAFE / WARNING / DANGER) */}
          <h2
            className={`text-5xl md:text-7xl font-black tracking-widest ${cfg.color} drop-shadow-lg`}
            style={{
              textShadow:
                status === 'danger'
                  ? '0 0 40px rgba(239,68,68,0.4)'
                  : status === 'warning'
                    ? '0 0 40px rgba(245,158,11,0.3)'
                    : '0 0 40px rgba(16,185,129,0.3)',
            }}
          >
            {cfg.label}
          </h2>
          <p className="text-gray-400 text-sm md:text-base">{cfg.sublabel}</p>

          {/* Sensor reading pills */}
          <div className="flex flex-wrap justify-center gap-3 mt-2 pointer-events-auto">
            <div className={`px-5 py-2.5 rounded-xl bg-gray-900/70 backdrop-blur-md border ${cfg.border} flex items-center gap-3`}>
              <div className="flex flex-col">
                <span className="text-[10px] uppercase tracking-wider text-gray-500">Water Level</span>
                <span className={`text-xl font-bold ${cfg.color}`}>
                  {currentLevel.toFixed(2)}m
                </span>
              </div>
            </div>
            <div className={`px-5 py-2.5 rounded-xl bg-gray-900/70 backdrop-blur-md border ${cfg.border} flex items-center gap-3`}>
              <div className="flex flex-col">
                <span className="text-[10px] uppercase tracking-wider text-gray-500">Flow Rate</span>
                <span className={`text-xl font-bold ${cfg.color}`}>
                  {currentFlow.toFixed(1)} m³/s
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Red flashing overlay when status is DANGER */}
      {status === 'danger' && (
        <div className="absolute inset-0 rounded-2xl bg-red-500/10 animate-flash pointer-events-none" />
      )}
    </div>
  );
}

// Pre-download the model as soon as this module loads,
// so it's ready before the component mounts.
useGLTF.preload('/models/scene.gltf');
