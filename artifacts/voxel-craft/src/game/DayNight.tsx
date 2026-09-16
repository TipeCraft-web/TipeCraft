import { useRef, useEffect } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';

interface Props {
  playerPosRef: React.MutableRefObject<THREE.Vector3>;
  dayTimeRef:   React.MutableRefObject<number>;
}

const DAY_SPEED = 1 / 1200;  // full cycle in 300 seconds (5 minutes)

const SKY_NIGHT   = new THREE.Color(0x060818);
const SKY_DAWN    = new THREE.Color(0xff7744);
const SKY_DAY     = new THREE.Color(0x6ab4f5);
const SKY_DUSK    = new THREE.Color(0xff5533);

const FOG_NIGHT   = new THREE.Color(0x080c20);
const FOG_DAY     = new THREE.Color(0x9dcde8);

function lerp3(a: THREE.Color, b: THREE.Color, t: number, out: THREE.Color) {
  out.r = a.r + (b.r - a.r) * t;
  out.g = a.g + (b.g - a.g) * t;
  out.b = a.b + (b.b - a.b) * t;
}

export default function DayNight({ playerPosRef, dayTimeRef }: Props) {
  const { scene } = useThree();
  const sunRef     = useRef<THREE.DirectionalLight>(null);
  const ambientRef = useRef<THREE.AmbientLight>(null);
  const moonRef    = useRef<THREE.DirectionalLight>(null);
  const skyColor   = useRef(new THREE.Color(0x6ab4f5));
  const fogColor   = useRef(new THREE.Color(0x9dcde8));

  useEffect(() => {
    dayTimeRef.current = 0.5;  // start at noon
  }, [dayTimeRef]);

  useFrame((_, delta) => {
    dayTimeRef.current = (dayTimeRef.current + DAY_SPEED * delta) % 1.0;
    const t = dayTimeRef.current;  // 0=midnight, 0.25=sunrise, 0.5=noon, 0.75=sunset

    // Sun angle: 0=midnight (below), 0.25=sunrise (east), 0.5=noon (top), 0.75=sunset (west)
    const sunAngle = t * Math.PI * 2 - Math.PI / 2; // shifted so noon=top
    const sunH  =  Math.sin(sunAngle);   // -1 to 1
    const sunLat = Math.cos(sunAngle);

    const px = playerPosRef.current.x;
    const pz = playerPosRef.current.z;

    if (sunRef.current) {
      const light = sunRef.current;
      light.position.set(px + sunLat * 80, sunH * 80, pz + 20);
      light.target.position.set(px, 0, pz);
      light.target.updateMatrixWorld();
      const sunIntensity = Math.max(0, sunH);
      light.intensity = sunIntensity * 1.4;
      light.shadow.camera.left   = -70;
      light.shadow.camera.right  =  70;
      light.shadow.camera.top    =  70;
      light.shadow.camera.bottom = -70;
      light.shadow.camera.updateProjectionMatrix();
    }

    if (moonRef.current) {
      const m = moonRef.current;
      m.position.set(px - sunLat * 80, -sunH * 80, pz - 20);
      m.target.position.set(px, 0, pz);
      m.target.updateMatrixWorld();
      const moonIntensity = Math.max(0, -sunH) * 0.18;
      m.intensity = moonIntensity;
    }

    if (ambientRef.current) {
      const base = Math.max(0.06, sunH * 0.55);
      ambientRef.current.intensity = base;
    }

    // Sky color
    if (t < 0.2) {
      // midnight → pre-dawn
      const f = t / 0.2;
      lerp3(SKY_NIGHT, SKY_DAWN, f * f, skyColor.current);
      lerp3(FOG_NIGHT, FOG_DAY,  f * f, fogColor.current);
    } else if (t < 0.3) {
      // dawn → day
      const f = (t - 0.2) / 0.1;
      lerp3(SKY_DAWN, SKY_DAY, f, skyColor.current);
      lerp3(FOG_NIGHT, FOG_DAY, f, fogColor.current);
    } else if (t < 0.7) {
      // full day
      skyColor.current.copy(SKY_DAY);
      fogColor.current.copy(FOG_DAY);
    } else if (t < 0.8) {
      // sunset
      const f = (t - 0.7) / 0.1;
      lerp3(SKY_DAY, SKY_DUSK, f, skyColor.current);
      lerp3(FOG_DAY, FOG_NIGHT, f, fogColor.current);
    } else {
      // dusk → night
      const f = Math.min(1, (t - 0.8) / 0.15);
      lerp3(SKY_DUSK, SKY_NIGHT, f, skyColor.current);
      fogColor.current.copy(FOG_NIGHT);
    }

    scene.background = skyColor.current;
    if (scene.fog && (scene.fog as THREE.Fog).color) {
      (scene.fog as THREE.Fog).color.copy(fogColor.current);
    }
  });

  return (
    <>
      <ambientLight ref={ambientRef} intensity={0.5} />
      {/* Sun */}
      <directionalLight
        ref={sunRef}
        castShadow
        intensity={1.4}
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
        shadow-camera-near={0.5}
        shadow-camera-far={300}
        shadow-bias={-0.0005}
      />
      {/* Moon (softer, cool light) */}
      <directionalLight
        ref={moonRef}
        intensity={0.1}
        color={0xaabbff}
      />
    </>
  );
}
