'use client';

import { Suspense, useMemo } from 'react';
import { Canvas } from '@react-three/fiber';
import {
  OrbitControls,
  Float,
  Environment,
  Lightformer,
  ContactShadows,
} from '@react-three/drei';
import * as THREE from 'three';

const DEPTH = 2.2;        // slice thickness (Z) — short, so the section reads
const GLASS_Z = DEPTH - 0.18;

// Cross-section: chambered PVC base (Y 0..3) with a central glazing groove,
// glass package rising out of the groove.
const GROOVE_X0 = 1.45;
const GROOVE_X1 = 2.55;
const GROOVE_FLOOR = 2.3;
const FRAME_TOP = 3.0;
const GLASS_TOP = 5.0;

function useProfileGeometry() {
  return useMemo(() => {
    const s = new THREE.Shape();
    s.moveTo(0, 0);
    s.lineTo(4, 0);
    s.lineTo(4, FRAME_TOP);
    s.lineTo(GROOVE_X1, FRAME_TOP);
    s.lineTo(GROOVE_X1, GROOVE_FLOOR);
    s.lineTo(GROOVE_X0, GROOVE_FLOOR);
    s.lineTo(GROOVE_X0, FRAME_TOP);
    s.lineTo(0, FRAME_TOP);
    s.lineTo(0, 0);

    // Many small air chambers → realistic multi-chamber section
    const chambers: [number, number, number, number][] = [
      // lower row
      [0.3, 0.4, 1.0, 1.25], [1.15, 0.4, 1.85, 1.25], [2.15, 0.4, 2.85, 1.25], [3.0, 0.4, 3.7, 1.25],
      // upper row
      [0.3, 1.45, 1.0, 2.15], [1.15, 1.45, 1.85, 2.15], [2.15, 1.45, 2.85, 2.15], [3.0, 1.45, 3.7, 2.15],
      // bead chambers either side of the groove
      [0.4, 2.35, 1.1, 2.85], [2.9, 2.35, 3.6, 2.85],
    ];
    for (const [x0, y0, x1, y1] of chambers) {
      const h = new THREE.Path();
      h.moveTo(x0, y0); h.lineTo(x1, y0); h.lineTo(x1, y1); h.lineTo(x0, y1); h.lineTo(x0, y0);
      s.holes.push(h);
    }

    const geo = new THREE.ExtrudeGeometry(s, {
      depth: DEPTH,
      bevelEnabled: true,
      bevelThickness: 0.03,
      bevelSize: 0.03,
      bevelSegments: 1,
      steps: 1,
    });
    return geo;
  }, []);
}

function WindowProfile({ animate, mobile }: { animate: boolean; mobile: boolean }) {
  const geo = useProfileGeometry();
  const panes = [1.68, 2.0, 2.32]; // triple glazing inside the groove

  return (
    <Float
      speed={animate ? 1.0 : 0}
      rotationIntensity={animate ? 0.18 : 0}
      floatIntensity={animate ? 0.4 : 0}
    >
      <group scale={0.3}>
        <group position={[-2, -2.5, -DEPTH / 2]}>
          {/* White PVC body */}
          <mesh geometry={geo} castShadow>
            <meshPhysicalMaterial
              color="#f3f5f8"
              roughness={0.34}
              metalness={0}
              clearcoat={0.7}
              clearcoatRoughness={0.28}
              envMapIntensity={1.0}
            />
          </mesh>

          {/* Triple glazing */}
          {panes.map((x) => (
            <mesh key={x} position={[x, (GROOVE_FLOOR + GLASS_TOP) / 2, DEPTH / 2]}>
              <boxGeometry args={[0.24, GLASS_TOP - GROOVE_FLOOR, GLASS_Z]} />
              {mobile ? (
                <meshPhysicalMaterial
                  color="#b7d4dd"
                  transparent
                  opacity={0.42}
                  roughness={0.05}
                  metalness={0}
                  clearcoat={1}
                  clearcoatRoughness={0.04}
                  reflectivity={0.8}
                  envMapIntensity={1.3}
                  side={THREE.DoubleSide}
                />
              ) : (
                <meshPhysicalMaterial
                  color="#cfe6ec"
                  transmission={0.7}
                  thickness={1.4}
                  ior={1.46}
                  roughness={0.05}
                  metalness={0}
                  clearcoat={1}
                  clearcoatRoughness={0.04}
                  reflectivity={0.85}
                  envMapIntensity={1.6}
                />
              )}
            </mesh>
          ))}

          {/* Warm-edge spacer at the base of the glass unit */}
          <mesh position={[2.0, GROOVE_FLOOR + 0.22, DEPTH / 2]}>
            <boxGeometry args={[0.92, 0.2, GLASS_Z - 0.25]} />
            <meshStandardMaterial color="#566070" roughness={0.4} metalness={0.7} />
          </mesh>
        </group>
      </group>
    </Float>
  );
}

export default function ProfileCanvas({
  animate,
  paused,
  mobile,
}: {
  animate: boolean;
  paused: boolean;
  mobile: boolean;
}) {
  return (
    <div className="w-full h-full cursor-grab active:cursor-grabbing">
      <Canvas
        frameloop={paused ? 'demand' : 'always'}
        dpr={[1, mobile ? 1.5 : 2]}
        shadows
        gl={{ alpha: true, antialias: true, powerPreference: 'high-performance' }}
        camera={{ position: [1.7, 0.55, 3.9], fov: 35 }}
      >
        <Suspense fallback={null}>
          <ambientLight intensity={0.45} />
          <directionalLight position={[4, 7, 5]} intensity={2.0} castShadow shadow-mapSize={[1024, 1024]} />
          <directionalLight position={[-6, 3, 2]} intensity={0.5} color="#cfe0f5" />
          <spotLight position={[-4, 4, -6]} angle={0.7} penumbra={1} intensity={1.4} color="#E8C97A" />

          <WindowProfile animate={animate} mobile={mobile} />

          <ContactShadows
            position={[0, -0.82, 0]}
            opacity={0.4}
            blur={2.6}
            scale={5}
            far={3}
            resolution={mobile ? 256 : 512}
            color="#05070d"
          />

          <Environment resolution={mobile ? 64 : 128}>
            <Lightformer intensity={1.6} position={[0, 4, 3]} scale={[8, 8, 1]} color="#ffffff" />
            <Lightformer intensity={1.0} position={[-5, 1, -2]} scale={[5, 5, 1]} color="#aac4e6" />
            <Lightformer intensity={1.3} position={[5, 2, -2]} scale={[4, 4, 1]} color="#E8C97A" />
            <Lightformer intensity={0.8} position={[0, -3, 2]} scale={[6, 3, 1]} color="#ffffff" />
          </Environment>

          <OrbitControls
            makeDefault
            enableZoom={false}
            enablePan={false}
            autoRotate={animate}
            autoRotateSpeed={1.0}
            enableDamping
            dampingFactor={0.08}
            rotateSpeed={0.9}
            minPolarAngle={Math.PI * 0.36}
            maxPolarAngle={Math.PI * 0.6}
          />
        </Suspense>
      </Canvas>
    </div>
  );
}
