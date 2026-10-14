/**
 * ARTI AI — the AI Intelligence Core.
 *
 * A real, code-built Three.js scene: a faceted iridescent core inside three
 * inclined orbital rings, wrapped in a metallic cage, a faint energy shell and
 * a controlled field of motes. Nothing here is an image, a sprite sheet or a
 * CSS gradient — every pixel is rendered from geometry, materials and lights.
 *
 * The scene is *driven by the real application*, not by a timer:
 *   idle       slow drift, dim cyan
 *   listening  (user is composing) — brighter, tighter orbit
 *   processing a request is genuinely in flight — fast orbit, energy shell
 *              expands, motes accelerate
 *   streaming  the reply arrived — bright gold pulse
 *   tool       an agent is executing a tool — amber ring sweep
 *   error      the request actually failed — red, the motion stalls
 *
 * Pointer movement tilts the whole assembly and brightens the key light.
 * Reduced motion stops the idle rotation and the camera drift entirely.
 */
import React, { useEffect, useMemo, useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Float } from '@react-three/drei';
import * as THREE from 'three';
import { usePrefersReducedMotion } from '../../hooks/useMediaQuery';

/** Real AI lifecycle states the core renders. */
export type CoreState = 'idle' | 'listening' | 'processing' | 'streaming' | 'tool' | 'error';

interface StateVisual {
  /** Facet / wireframe emissive colour. */
  core: string;
  /** Ring colour. */
  ring: string;
  /** Energy shell colour. */
  shell: string;
  /** Mote colour. */
  mote: string;
  /** Ring angular speed multiplier. */
  speed: number;
  /** Mote drift multiplier. */
  motes: number;
  /** Shell opacity. */
  shellOpacity: number;
  /** Overall emissive intensity. */
  glow: number;
}

const VISUALS: Record<CoreState, StateVisual> = {
  idle: { core: '#5ec8e6', ring: '#c9a84e', shell: '#2a6f8a', mote: '#8fd8ef', speed: 0.55, motes: 0.7, shellOpacity: 0.1, glow: 0.85 },
  listening: { core: '#7ad6f0', ring: '#e0c069', shell: '#3b8fb0', mote: '#bde9f7', speed: 0.8, motes: 1, shellOpacity: 0.16, glow: 1.15 },
  processing: { core: '#8fe4ff', ring: '#f3df9b', shell: '#57b6d8', mote: '#e6f7ff', speed: 2.1, motes: 2.6, shellOpacity: 0.3, glow: 1.7 },
  streaming: { core: '#ffe9a8', ring: '#ffd979', shell: '#d9b25c', mote: '#fff3cd', speed: 1.3, motes: 1.6, shellOpacity: 0.24, glow: 1.9 },
  tool: { core: '#ffcf87', ring: '#ff9d4d', shell: '#c07a34', mote: '#ffdca8', speed: 1.7, motes: 2, shellOpacity: 0.26, glow: 1.6 },
  error: { core: '#ff8f88', ring: '#c05a55', shell: '#7d3a37', mote: '#ffbdb8', speed: 0.18, motes: 0.3, shellOpacity: 0.12, glow: 1 },
};

/* --------------------------------------------------------------------------
   Core: a faceted icosahedron with an inner solid and an additive wireframe.
   -------------------------------------------------------------------------- */

const Core: React.FC<{
  state: CoreState;
  reduced: boolean;
  hover: React.RefObject<boolean>;
}> = ({ state, reduced, hover }) => {
  const group = useRef<THREE.Group>(null);
  const innerMat = useRef<THREE.MeshStandardMaterial>(null);
  const wireMat = useRef<THREE.MeshBasicMaterial>(null);
  const target = VISUALS[state];
  const coreColor = useMemo(() => new THREE.Color(target.core), [target.core]);
  const ringColor = useMemo(() => new THREE.Color(target.ring), [target.ring]);
  const scratch = useMemo(() => new THREE.Color(), []);

  useFrame((_, delta) => {
    const g = group.current;
    if (!g) return;
    const d = Math.min(delta, 0.05);
    if (!reduced) {
      g.rotation.y += d * 0.22 * target.speed;
      g.rotation.x += d * 0.06 * target.speed;
    }
    const pulse = reduced ? 1 : 1 + Math.sin(performance.now() * 0.0016) * 0.02 * target.speed;
    g.scale.setScalar(pulse);

    // Ease materials toward the current state so transitions are smooth
    // instead of snapping when the real request state changes.
    const lerp = Math.min(1, d * 3.4);
    if (innerMat.current) {
      innerMat.current.color.lerp(scratch.copy(coreColor).multiplyScalar(0.35), lerp);
      innerMat.current.emissive.lerp(coreColor, lerp);
      innerMat.current.emissiveIntensity +=
        (target.glow * (hover.current ? 1.35 : 1) - innerMat.current.emissiveIntensity) * lerp;
    }
    if (wireMat.current) {
      wireMat.current.color.lerp(scratch.copy(coreColor).lerp(ringColor, 0.35), lerp);
      wireMat.current.opacity += ((hover.current ? 0.72 : 0.5) - wireMat.current.opacity) * lerp;
    }
  });

  return (
    <group ref={group}>
      {/* Solid inner core */}
      <mesh>
        <icosahedronGeometry args={[0.62, 1]} />
        <meshStandardMaterial
          ref={innerMat}
          color="#12303c"
          emissive={target.core}
          emissiveIntensity={target.glow}
          roughness={0.22}
          metalness={0.85}
          flatShading
        />
      </mesh>
      {/* Additive wireframe shell — reads as an engineered crystal lattice */}
      <mesh scale={1.09}>
        <icosahedronGeometry args={[0.62, 1]} />
        <meshBasicMaterial
          ref={wireMat}
          color={target.core}
          wireframe
          transparent
          opacity={0.5}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </mesh>
      {/* Facet highlights */}
      <mesh scale={0.44}>
        <octahedronGeometry args={[0.62, 0]} />
        <meshStandardMaterial
          color="#f6fbff"
          emissive={target.core}
          emissiveIntensity={target.glow * 0.6}
          roughness={0.1}
          metalness={0.4}
        />
      </mesh>
    </group>
  );
};

/* --------------------------------------------------------------------------
   Orbital ring: a torus carrying a travelling luminous bead.
   -------------------------------------------------------------------------- */

const OrbitalRing: React.FC<{
  state: CoreState;
  reduced: boolean;
  radius: number;
  tube: number;
  tilt: [number, number, number];
  direction: 1 | -1;
  beadOffset: number;
}> = ({ state, reduced, radius, tube, tilt, direction, beadOffset }) => {
  const ringRef = useRef<THREE.Mesh>(null);
  const beadRef = useRef<THREE.Mesh>(null);
  const beadMat = useRef<THREE.MeshBasicMaterial>(null);
  const ringMat = useRef<THREE.MeshStandardMaterial>(null);
  const target = VISUALS[state];
  const ringColor = useMemo(() => new THREE.Color(target.ring), [target.ring]);
  const moteColor = useMemo(() => new THREE.Color(target.mote), [target.mote]);

  useFrame((_, delta) => {
    const d = Math.min(delta, 0.05);
    if (!reduced && beadRef.current) {
      beadRef.current.rotation.z += d * direction * 0.9 * target.speed;
    }
    if (ringMat.current) {
      const lerp = Math.min(1, d * 3);
      ringMat.current.emissive.lerp(ringColor, lerp);
      ringMat.current.emissiveIntensity += (target.glow * 0.5 - ringMat.current.emissiveIntensity) * lerp;
    }
    if (beadMat.current) {
      const lerp = Math.min(1, d * 3);
      beadMat.current.color.lerp(moteColor, lerp);
      beadMat.current.opacity += (0.6 + target.shellOpacity - beadMat.current.opacity) * lerp;
    }
  });

  return (
    <group rotation={tilt}>
      <mesh ref={ringRef} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[radius, tube, 8, 96]} />
        <meshStandardMaterial
          ref={ringMat}
          color="#1b2534"
          emissive={target.ring}
          emissiveIntensity={target.glow * 0.5}
          metalness={0.95}
          roughness={0.28}
        />
      </mesh>
      {/* Travelling bead — the "active node" of the ring */}
      <mesh ref={beadRef} rotation={[Math.PI / 2, 0, beadOffset]}>
        <mesh position={[radius, 0, 0]}>
          <sphereGeometry args={[tube * 1.5, 16, 16]} />
          <meshBasicMaterial ref={beadMat} color={target.mote} transparent opacity={0.7} blending={THREE.AdditiveBlending} />
        </mesh>
      </mesh>
    </group>
  );
};

/* --------------------------------------------------------------------------
   Metallic cage: segmented arcs reading as a containment structure.
   -------------------------------------------------------------------------- */

const Cage: React.FC<{ state: CoreState; reduced: boolean }> = ({ state, reduced }) => {
  const ref = useRef<THREE.Group>(null);
  const target = VISUALS[state];
  useFrame((_, delta) => {
    const g = ref.current;
    if (!g) return;
    const d = Math.min(delta, 0.05);
    if (!reduced) {
      g.rotation.y -= d * 0.14 * target.speed;
      g.rotation.z += d * 0.05 * target.speed;
    }
  });
  return (
    <group ref={ref}>
      {[0, 1, 2, 3].map((i) => {
        const angle = (i / 4) * Math.PI * 2;
        return (
          <mesh
            key={i}
            position={[Math.cos(angle) * 1.42, Math.sin(angle) * 0.22, Math.sin(angle) * 1.42]}
            rotation={[0, -angle, 0.5]}
          >
            <torusGeometry args={[0.5, 0.014, 6, 48, Math.PI * 0.9]} />
            <meshStandardMaterial
              color="#9fb0c4"
              emissive={target.ring}
              emissiveIntensity={target.glow * 0.18}
              metalness={1}
              roughness={0.34}
            />
          </mesh>
        );
      })}
    </group>
  );
};

/* --------------------------------------------------------------------------
   Energy shell: additive sphere that swells while the AI is actually working.
   -------------------------------------------------------------------------- */

const EnergyShell: React.FC<{ state: CoreState; reduced: boolean }> = ({ state, reduced }) => {
  const ref = useRef<THREE.Mesh>(null);
  const mat = useRef<THREE.MeshBasicMaterial>(null);
  const target = VISUALS[state];
  const shellColor = useMemo(() => new THREE.Color(target.shell), [target.shell]);

  useFrame((_, delta) => {
    const d = Math.min(delta, 0.05);
    const lerp = Math.min(1, d * 2.6);
    if (mat.current) {
      mat.current.color.lerp(shellColor, lerp);
      mat.current.opacity += (target.shellOpacity - mat.current.opacity) * lerp;
    }
    if (ref.current && !reduced) {
      const breathe = 1 + Math.sin(performance.now() * 0.0009) * 0.03;
      ref.current.scale.setScalar(breathe * (1 + target.shellOpacity * 0.5));
      ref.current.rotation.y += d * 0.08;
    }
  });

  return (
    <mesh ref={ref}>
      <sphereGeometry args={[1.05, 48, 48]} />
      <meshBasicMaterial
        ref={mat}
        color={target.shell}
        transparent
        opacity={target.shellOpacity}
        blending={THREE.AdditiveBlending}
        depthWrite={false}
        side={THREE.BackSide}
      />
    </mesh>
  );
};

/* --------------------------------------------------------------------------
   Ambient mote field — a controlled, small cloud, never a particle storm.
   -------------------------------------------------------------------------- */

const Motes: React.FC<{ state: CoreState; reduced: boolean; count: number }> = ({
  state,
  reduced,
  count,
}) => {
  const ref = useRef<THREE.Points>(null);
  const mat = useRef<THREE.PointsMaterial>(null);
  const target = VISUALS[state];
  const moteColor = useMemo(() => new THREE.Color(target.mote), [target.mote]);

  const positions = useMemo(() => {
    const arr = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      // Golden-angle spiral on a spherical shell — even, structured distribution.
      const t = (i + 0.5) / count;
      const phi = Math.acos(1 - 2 * t);
      const theta = Math.PI * (1 + Math.sqrt(5)) * i;
      const r = 1.5 + ((i * 37) % 100) / 100 * 0.85;
      arr[i * 3] = Math.sin(phi) * Math.cos(theta) * r;
      arr[i * 3 + 1] = Math.cos(phi) * r * 0.72;
      arr[i * 3 + 2] = Math.sin(phi) * Math.sin(theta) * r;
    }
    return arr;
  }, [count]);

  useFrame((_, delta) => {
    const d = Math.min(delta, 0.05);
    if (mat.current) {
      const lerp = Math.min(1, d * 2.4);
      mat.current.color.lerp(moteColor, lerp);
      mat.current.opacity += ((reduced ? 0.25 : 0.4 + target.shellOpacity) - mat.current.opacity) * lerp;
    }
    if (ref.current && !reduced) {
      ref.current.rotation.y -= d * 0.06 * target.motes;
      ref.current.rotation.x += d * 0.02 * target.motes;
    }
  });

  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial
        ref={mat}
        size={0.035}
        color={target.mote}
        transparent
        opacity={0.4}
        sizeAttenuation
        blending={THREE.AdditiveBlending}
        depthWrite={false}
      />
    </points>
  );
};

/* --------------------------------------------------------------------------
   Assembly: pointer-reactive rig, lighting and camera drift.
   -------------------------------------------------------------------------- */

const Assembly: React.FC<{
  state: CoreState;
  reduced: boolean;
  lowPower: boolean;
}> = ({ state, reduced, lowPower }) => {
  const rig = useRef<THREE.Group>(null);
  const keyLight = useRef<THREE.PointLight>(null);
  const pointer = useRef({ x: 0, y: 0 });
  const hover = useRef(false);

  // Pointer tracking is done at the window level, not through canvas events, so
  // the canvas can stay `pointer-events: none` and never intercept a click
  // meant for the composer, a button or a message.
  useEffect(() => {
    if (reduced) return;
    const onMove = (e: PointerEvent) => {
      const w = window.innerWidth || 1;
      const h = window.innerHeight || 1;
      pointer.current.x = (e.clientX - w / 2) / (w / 2);
      pointer.current.y = (e.clientY - h / 2) / (h / 2);
      hover.current = true;
    };
    const onLeave = () => {
      hover.current = false;
      pointer.current.x = 0;
      pointer.current.y = 0;
    };
    window.addEventListener('pointermove', onMove, { passive: true });
    window.addEventListener('pointerleave', onLeave);
    window.addEventListener('blur', onLeave);
    return () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerleave', onLeave);
      window.removeEventListener('blur', onLeave);
    };
  }, [reduced]);

  useFrame((rootState, delta) => {
    const d = Math.min(delta, 0.05);
    const g = rig.current;
    if (!g) return;

    if (!reduced) {
      // Ease toward the pointer for a weighty, damped response.
      const tx = pointer.current.x * 0.34;
      const ty = -pointer.current.y * 0.22;
      g.rotation.y += (tx - g.rotation.y) * Math.min(1, d * 2.2);
      g.rotation.x += (ty - g.rotation.x) * Math.min(1, d * 2.2);
      // Slow camera drift so the object reads as genuinely three-dimensional.
      const cam = rootState.camera;
      cam.position.x += (pointer.current.x * 0.55 - cam.position.x) * Math.min(1, d * 0.9);
      cam.position.y += (pointer.current.y * 0.35 - cam.position.y) * Math.min(1, d * 0.9);
      cam.lookAt(0, 0, 0);
    }

    if (keyLight.current) {
      const boost = hover.current ? 1.5 : 1;
      const target = 9 * VISUALS[state].glow * boost;
      keyLight.current.intensity += (target - keyLight.current.intensity) * Math.min(1, d * 2);
    }
  });

  return (
    <>
      <ambientLight intensity={0.35} />
      <hemisphereLight args={['#8fd8ef', '#0a0f1a', 0.35]} />
      <pointLight ref={keyLight} position={[2.4, 2.2, 2.8]} intensity={9} color="#cfeaff" distance={14} />
      <pointLight position={[-2.6, -1.4, -2]} intensity={4} color="#c9a84e" distance={12} />
      <spotLight position={[0, 4, 1.5]} angle={0.6} penumbra={0.8} intensity={6} color="#ffffff" distance={16} />

      <Float
        speed={reduced ? 0 : 1.1}
        rotationIntensity={reduced ? 0 : 0.14}
        floatIntensity={reduced ? 0 : 0.4}
        floatingRange={[-0.05, 0.05]}
      >
        <group ref={rig} scale={lowPower ? 0.92 : 1}>
          <Core state={state} reduced={reduced} hover={hover} />
          <OrbitalRing state={state} reduced={reduced} radius={1.06} tube={0.019} tilt={[0.62, 0.2, 0.1]} direction={1} beadOffset={0} />
          <OrbitalRing state={state} reduced={reduced} radius={1.26} tube={0.015} tilt={[-0.5, 0.9, 0.4]} direction={-1} beadOffset={1.6} />
          <OrbitalRing state={state} reduced={reduced} radius={1.46} tube={0.011} tilt={[0.18, -0.7, 1.1]} direction={1} beadOffset={3.1} />
          {!lowPower && <Cage state={state} reduced={reduced} />}
          <EnergyShell state={state} reduced={reduced} />
          <Motes state={state} reduced={reduced} count={lowPower ? 60 : 160} />
        </group>
      </Float>
    </>
  );
};

/* --------------------------------------------------------------------------
   Exported scene. Owns the canvas, the frame budget and the fallback.
   -------------------------------------------------------------------------- */

export interface AiCoreSceneProps {
  state: CoreState;
  className?: string;
}

const AiCoreScene: React.FC<AiCoreSceneProps> = ({ state, className }) => {
  const reduced = usePrefersReducedMotion();
  // One quality decision, made once: narrow viewports get a lighter scene.
  const lowPower = useMemo(
    () => typeof window !== 'undefined' && window.innerWidth < 900,
    []
  );

  return (
    <div className={`ai-core-scene ${className || ''}`} data-core-state={state}>
      <Canvas
        className="ai-core-canvas"
        dpr={[1, lowPower ? 1.5 : 2]}
        gl={{ antialias: !lowPower, alpha: true, powerPreference: 'high-performance' }}
        camera={{ position: [0, 0, 4.4], fov: 42 }}
        // A static core does not need to be re-rendered 60 times a second.
        frameloop={reduced ? 'demand' : 'always'}
      >
        <Assembly state={state} reduced={reduced} lowPower={lowPower} />
      </Canvas>
    </div>
  );
};

export default AiCoreScene;
