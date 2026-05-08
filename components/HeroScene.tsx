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

import { Suspense, useRef, useMemo, useEffect, useState } from 'react';
import { Canvas, useFrame, useThree, useLoader } from '@react-three/fiber';
import {
  useGLTF,        // Hook to load .gltf/.glb 3D models
  Environment,    // Pre-built lighting environments (city, sunset, etc.)
  ContactShadows, // Soft shadow plane beneath objects
  OrbitControls,  // Camera controls
  useDepthBuffer, // Renders depth buffer of the scene
} from '@react-three/drei';
import * as THREE from 'three';
import { Water2 } from 'three-stdlib';
import { useTranslation } from '@/context/LanguageContext';

// ─── CONSTANTS ──────────────────────────────────────────────────────

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
function CustomWater({ waterNode, depthBuffer }: any) {
  const [normalMap0, normalMap1] = useLoader(THREE.TextureLoader, [
    '/textures/water/Water_1_M_Normal.jpg',
    '/textures/water/Water_2_M_Normal.jpg',
  ]);
  const { size, camera, gl } = useThree();
  const dpr = gl.getPixelRatio();
  const uniformsRef = useRef<any>(null);

  useFrame((state) => {
    if (uniformsRef.current) {
      uniformsRef.current.uTime.value = state.clock.elapsedTime;
    }
  });

  useEffect(() => {
    normalMap0.wrapS = normalMap0.wrapT = THREE.RepeatWrapping;
    normalMap1.wrapS = normalMap1.wrapT = THREE.RepeatWrapping;
  }, [normalMap0, normalMap1]);

  const [water, setWater] = useState<Water2 | null>(null);

  useEffect(() => {
    if (!waterNode || !waterNode.geometry) return;

    // 1. Prepare Geometry
    waterNode.geometry.computeBoundingBox();
    const sizeVec = new THREE.Vector3();
    waterNode.geometry.boundingBox.getSize(sizeVec);
    const centerVec = new THREE.Vector3();
    waterNode.geometry.boundingBox.getCenter(centerVec);

    // Create a high-res plane so we have enough vertices to physically displace!
    const geom = new THREE.PlaneGeometry(sizeVec.x, sizeVec.z, 64, 256);
    // Move it to XZ plane and translate it to perfectly match the original geometry's bounds
    geom.applyMatrix4(new THREE.Matrix4().makeRotationX(-Math.PI / 2));
    geom.translate(centerVec.x, centerVec.y, centerVec.z);

    // Generate world-space planar UVs to guarantee perfect ripples
    waterNode.updateMatrixWorld(true);
    const uvAttribute = geom.attributes.uv;
    const posAttribute = geom.attributes.position;
    if (uvAttribute && posAttribute) {
      const v = new THREE.Vector3();
      for (let i = 0; i < uvAttribute.count; i++) {
        v.fromBufferAttribute(posAttribute, i);
        v.applyMatrix4(waterNode.matrixWorld);
        uvAttribute.setXY(i, v.x * 0.3, v.z * 0.3);
      }
      uvAttribute.needsUpdate = true;
    }

    // Move geometry to XY plane (Reflector requirement)
    geom.applyMatrix4(new THREE.Matrix4().makeRotationX(Math.PI / 2));
    geom.computeBoundingBox();
    geom.computeBoundingSphere();

    // 2. Create Water Instance
    const w = new Water2(geom, {
      color: '#67e8f9',
      scale: 1,
      flowDirection: new THREE.Vector2(0, 1),
      textureWidth: 1024,
      textureHeight: 1024,
      normalMap0,
      normalMap1,
    });

    w.material.depthWrite = false;

    // 3. Custom Shaders
    w.material.onBeforeCompile = (shader) => {
      uniformsRef.current = shader.uniforms;
      shader.uniforms.tDepth = { value: depthBuffer };
      shader.uniforms.cameraNear = { value: camera.near };
      shader.uniforms.cameraFar = { value: camera.far };
      shader.uniforms.uTime = { value: 0 };
      shader.uniforms.screenSize = { value: new THREE.Vector2(size.width * dpr, size.height * dpr) };

      shader.vertexShader = `
        uniform float uTime;
        ${shader.vertexShader}
      `.replace(
        'void main() {',
        `
        void main() {
          vec3 displacedPos = position;
          float wave1 = sin(position.x * 1.0 + uTime * 0.8) * 0.015;
          float wave2 = cos(position.y * 2.0 - uTime * 0.5) * 0.01;
          displacedPos.z += wave1 + wave2;
        `
      ).replace(
        /vec4\( position, 1\.0 \)/g,
        'vec4( displacedPos, 1.0 )'
      );

      shader.fragmentShader = shader.fragmentShader.replace(
        '#include <logdepthbuf_pars_fragment>',
        `
        #include <logdepthbuf_pars_fragment>
        #include <packing>
        uniform sampler2D tDepth;
        uniform float cameraNear;
        uniform float cameraFar;
        uniform vec2 screenSize;
        `
      ).replace(
        'gl_FragColor = vec4( color, 1.0 ) * mix( refractColor, reflectColor, reflectance );',
        `
        vec4 waterBaseColor = vec4( color, 1.0 ) * mix( refractColor, reflectColor, reflectance );
        
        vec2 screenUv = gl_FragCoord.xy / screenSize;
        
        // Safety check for depth texture
        float sceneZ = 1.0;
        #ifdef USE_DEPTH_TEXTURE
          sceneZ = texture2D(tDepth, screenUv).x;
        #endif
        
        float viewZScene = perspectiveDepthToViewZ( sceneZ, cameraNear, cameraFar );
        float viewZWater = perspectiveDepthToViewZ( gl_FragCoord.z, cameraNear, cameraFar );
        float depthDiff = abs(viewZScene - viewZWater);
        float noise = normalColor.r * 2.0 - 1.0;
        float distortedDepth = depthDiff + noise * 0.15;
        float foamThickness = 0.25;
        float foamFactor = 1.0 - smoothstep(0.0, foamThickness, distortedDepth);
        foamFactor = clamp(foamFactor * 0.4, 0.0, 1.0);
        vec3 foamColor = vec3(0.4, 0.8, 0.9);
        gl_FragColor = mix(waterBaseColor, vec4(foamColor, 1.0), foamFactor);
        `
      );

      // Define USE_DEPTH_TEXTURE if depthBuffer is available
      if (depthBuffer) {
        shader.defines = shader.defines || {};
        shader.defines.USE_DEPTH_TEXTURE = '';
      }
    };

    w.rotation.set(-Math.PI / 2, 0, 0);
    w.position.set(0, 0, 0.05);

    setWater(w);

    // Cleanup logic: Critical for preventing memory leaks
    return () => {
      geom.dispose();
      w.material.dispose();
      // Water2 doesn't have a simple dispose, but disposing its resources is usually enough
      setWater(null);
    };
  }, [waterNode, normalMap0, normalMap1, depthBuffer, camera, size, dpr]);

  if (!water) return null;
  return <primitive object={water} />;
}

function RiverModel() {
  const { scene, nodes } = useGLTF('/models/scene.gltf');
  const set = useThree((state) => state.set);

  // Creates an invisible depth snapshot of the entire scene for the water shader.
  // size: 0 forces it to dynamically match the exact physical screen dimensions (fixes pixelation)
  const depthBuffer = useDepthBuffer({ frames: Infinity, size: 0 });

  useEffect(() => {
    if (nodes.Camera) {
      set({ camera: nodes.Camera as THREE.PerspectiveCamera });
    }
    if (nodes.Water_Placeholder) {
      nodes.Water_Placeholder.visible = false;
    }
  }, [nodes, set]);

  const waterNode = nodes.Water_Placeholder as THREE.Mesh;

  if (!nodes || !scene) return null;

  return (
    <>
      <primitive object={scene} />
      {waterNode && (
        <group position={waterNode.position} rotation={waterNode.rotation} scale={waterNode.scale}>
          <CustomWater waterNode={waterNode} depthBuffer={depthBuffer} />
        </group>
      )}
    </>
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
  const { t } = useTranslation();

  // Color/text config for each status level
  const statusConfig = {
    safe: {
      label: t('safe'),
      sublabel: t('safeMessage'),
      color: 'text-emerald-400',
      border: 'border-emerald-500/30',
      dot: 'bg-emerald-400',
    },
    warning: {
      label: t('warning'),
      sublabel: t('warningMessage'),
      color: 'text-amber-400',
      border: 'border-amber-500/30',
      dot: 'bg-amber-400',
    },
    danger: {
      label: t('danger'),
      sublabel: t('dangerMessage'),
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
        gl={{ antialias: true, alpha: true }} // Smooth edges, transparent BG
        dpr={[1, 1.5]}                        // Device pixel ratio (retina)
        style={{ background: 'transparent' }}
      >
        {/* Suspense shows <Loader /> while the GLTF model downloads */}
        <Suspense fallback={<Loader />}>
          <RiverModel />

          {/* <WaterParticles /> */}

          {/* Soft shadow on the "floor" beneath the model */}
          <ContactShadows
            position={[0, -1.5, 0]}
            opacity={0.35}
            scale={20}
            blur={2.5}
            far={5}
          />

          {/* Environment map: provides ambient reflections/lighting from HDRI */}
          <Environment files="/models/EveningEnvironmentHDRI001_1K_HDR.exr" background />

          {/* User controls for the camera: auto-rotate slowly, lock up/down movement */}
          <OrbitControls
            target={[-0.83, 0, 3.3]}
            autoRotate
            autoRotateSpeed={-0.1}
            enableZoom={true}
            minDistance={4}
            maxDistance={13}
            enablePan={false}
            minPolarAngle={Math.PI / 5} // Lock vertical rotation to original camera angle (60 deg)
            maxPolarAngle={Math.PI / 3}
            minAzimuthAngle={Math.PI / 7}
            maxAzimuthAngle={Math.PI / 1.15}
          />
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

          <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-gray-900/70 border border-gray-700/50 backdrop-blur-sm">
            <span className={`w-2 h-2 rounded-full ${cfg.dot} animate-pulse`} />
            <span className="text-xs text-gray-400 uppercase tracking-widest font-medium">
              {t('liveMonitoring')}
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

          <div className="flex flex-wrap justify-center gap-3 mt-2 pointer-events-auto">
            <div className={`px-5 py-2.5 rounded-xl bg-gray-900/70 backdrop-blur-md border ${cfg.border} flex items-center gap-3`}>
              <div className="flex flex-col">
                <span className="text-[10px] uppercase tracking-wider text-gray-500">{t('waterLevel')}</span>
                <span className={`text-xl font-bold ${cfg.color}`}>
                  {(currentLevel || 0).toFixed(2)}m
                </span>
              </div>
            </div>
            <div className={`px-5 py-2.5 rounded-xl bg-gray-900/70 backdrop-blur-md border ${cfg.border} flex items-center gap-3`}>
              <div className="flex flex-col">
                <span className="text-[10px] uppercase tracking-wider text-gray-500">{t('flowRate')}</span>
                <span className={`text-xl font-bold ${cfg.color}`}>
                  {(currentFlow || 0).toFixed(1)} m³/s
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
