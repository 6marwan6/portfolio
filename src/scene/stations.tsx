import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { RoundedBox, useTexture } from "@react-three/drei";
import { CanvasTexture, MathUtils, type Group, type Mesh, type MeshStandardMaterial } from "three";
import type { Chapter } from "./chapters";
import { zoomPhases } from "./zoom";
import { zoomClock } from "./zoomClock";
import { useSite } from "../state/store";

const INK = "#0E1B2B";
const WHITE = "#FFFFFF";

/** A soft circular shadow so stations sit on the floor without real-time shadow maps (cheap and clean). */
let blobTexture: CanvasTexture | null = null;
function getBlobTexture(): CanvasTexture {
  if (blobTexture) return blobTexture;
  const size = 128;
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = size;
  const ctx = canvas.getContext("2d")!;
  const g = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  g.addColorStop(0, "rgba(14,27,43,0.32)");
  g.addColorStop(1, "rgba(14,27,43,0)");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, size, size);
  blobTexture = new CanvasTexture(canvas);
  return blobTexture;
}

function BlobShadow({ radius }: { radius: number }) {
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.012, 0]}>
      <circleGeometry args={[radius, 48]} />
      <meshBasicMaterial map={getBlobTexture()} transparent depthWrite={false} />
    </mesh>
  );
}

function Mat({ color, emissive, intensity = 0, roughness = 0.55, opacity = 1 }: { color: string; emissive?: string; intensity?: number; roughness?: number; opacity?: number }) {
  return <meshStandardMaterial color={color} emissive={emissive ?? color} emissiveIntensity={intensity} roughness={roughness} metalness={0.05} transparent={opacity < 1} opacity={opacity} />;
}

/* ---------- Me: framed portrait and a small desk ---------- */
function MeStation() {
  const tex = useTexture(`${import.meta.env.BASE_URL}media/portrait.jpg`);
  return (
    <group>
      <RoundedBox args={[1.7, 2.6, 0.1]} radius={0.05} position={[0, 1.4, -0.06]}>
        <Mat color={INK} />
      </RoundedBox>
      <mesh position={[0, 1.4, 0]}>
        <planeGeometry args={[1.5, 2.395]} />
        <meshBasicMaterial map={tex} toneMapped={false} />
      </mesh>
      <group position={[-2.6, 0, 0.6]}>
        <mesh position={[0, 0.5, 0]}>
          <boxGeometry args={[2.2, 0.08, 1]} />
          <Mat color={WHITE} />
        </mesh>
        {[-0.95, 0.95].map((x) => (
          <mesh key={x} position={[x, 0.25, 0]}>
            <boxGeometry args={[0.08, 0.5, 0.8]} />
            <Mat color={INK} />
          </mesh>
        ))}
        <mesh position={[0.1, 0.95, -0.15]}>
          <boxGeometry args={[0.95, 0.6, 0.05]} />
          <Mat color={INK} emissive="#9fb4cc" intensity={0.5} />
        </mesh>
        <mesh position={[-0.8, 0.82, 0.1]}>
          <sphereGeometry args={[0.16, 24, 24]} />
          <Mat color="#FFE9B8" emissive="#FFD27A" intensity={0.9} />
        </mesh>
      </group>
      <BlobShadow radius={2.4} />
    </group>
  );
}

/* ---------- RootX: a control console with four screens ---------- */
function RootXStation({ accent }: { accent: string }) {
  return (
    <group>
      <RoundedBox args={[4.6, 0.5, 1.7]} radius={0.08} position={[0, 0.25, 0]}>
        <Mat color={WHITE} />
      </RoundedBox>
      {[-1.65, -0.55, 0.55, 1.65].map((x, i) => (
        <group key={x} position={[x, 1.25, 0]} rotation={[-0.14, 0, 0]}>
          <mesh>
            <boxGeometry args={[1, 0.72, 0.06]} />
            <Mat color={INK} />
          </mesh>
          <mesh position={[0, 0, 0.034]}>
            <planeGeometry args={[0.9, 0.62]} />
            <meshStandardMaterial color={accent} emissive={accent} emissiveIntensity={0.55 + i * 0.1} roughness={0.4} />
          </mesh>
        </group>
      ))}
      <BlobShadow radius={3} />
    </group>
  );
}

/* ---------- IntelliRoom: a small room that turns slowly ---------- */
function IntelliRoomStation({ accent }: { accent: string }) {
  const ref = useRef<Group>(null);
  useFrame((_, dt) => {
    if (ref.current) ref.current.rotation.y += dt * 0.25;
  });
  return (
    <group>
      <group ref={ref} position={[0, 0.1, 0]}>
        <mesh position={[0, 0.04, 0]}>
          <boxGeometry args={[3.2, 0.08, 3.2]} />
          <Mat color={WHITE} />
        </mesh>
        <mesh position={[0, 0.95, -1.56]}>
          <boxGeometry args={[3.2, 1.8, 0.08]} />
          <Mat color={WHITE} opacity={0.88} />
        </mesh>
        <mesh position={[-1.56, 0.95, 0]}>
          <boxGeometry args={[0.08, 1.8, 3.2]} />
          <Mat color={WHITE} opacity={0.88} />
        </mesh>
        <RoundedBox args={[1.3, 0.5, 0.65]} radius={0.08} position={[0.2, 0.33, -1.0]}>
          <Mat color={accent} />
        </RoundedBox>
        <mesh position={[0.1, 0.22, 0.3]}>
          <cylinderGeometry args={[0.45, 0.45, 0.06, 32]} />
          <Mat color={INK} />
        </mesh>
        <mesh position={[-1.05, 0.42, -1.0]}>
          <cylinderGeometry args={[0.04, 0.04, 0.7, 12]} />
          <Mat color={INK} />
        </mesh>
        <mesh position={[-1.05, 0.82, -1.0]}>
          <sphereGeometry args={[0.18, 24, 24]} />
          <Mat color="#FFE9B8" emissive="#FFD27A" intensity={0.9} />
        </mesh>
      </group>
      <BlobShadow radius={2.6} />
    </group>
  );
}

/* ---------- Mari: a team card with attendance buttons and a voice waveform ---------- */
function MariStation({ accent }: { accent: string }) {
  const bars = useRef<(Mesh | null)[]>([]);
  useFrame(({ clock }) => {
    bars.current.forEach((m, i) => {
      if (m) m.scale.y = 0.35 + Math.abs(Math.sin(clock.elapsedTime * 2.6 + i * 0.7)) * 1.3;
    });
  });
  return (
    <group>
      <RoundedBox args={[2.5, 1.6, 0.12]} radius={0.1} position={[-0.6, 1.35, 0]}>
        <Mat color={WHITE} />
      </RoundedBox>
      {[-1.4, -0.6, 0.2].map((x, i) => (
        <mesh key={x} position={[x, 0.85, 0.09]}>
          <sphereGeometry args={[0.17, 24, 24]} />
          <Mat color={i === 0 ? accent : i === 1 ? INK : "#C7D0DB"} emissive={i === 0 ? accent : INK} intensity={i === 0 ? 0.5 : 0} />
        </mesh>
      ))}
      <mesh position={[-1.4, 1.75, 0.09]}>
        <boxGeometry args={[1.1, 0.12, 0.02]} />
        <Mat color={accent} emissive={accent} intensity={0.3} />
      </mesh>
      <mesh position={[-1.1, 1.5, 0.09]}>
        <boxGeometry args={[1.7, 0.08, 0.02]} />
        <Mat color="#C7D0DB" />
      </mesh>
      <group position={[1.5, 1.3, 0]}>
        {Array.from({ length: 9 }, (_, i) => (
          <mesh key={i} ref={(m) => { bars.current[i] = m; }} position={[i * 0.18 - 0.72, 0, 0]}>
            <boxGeometry args={[0.1, 0.6, 0.1]} />
            <Mat color={accent} emissive={accent} intensity={0.35} />
          </mesh>
        ))}
      </group>
      <BlobShadow radius={2.6} />
    </group>
  );
}

/* ---------- Shorts Maker: a timeline with scored clip regions and a moving playhead ---------- */
function ShortsStation({ accent }: { accent: string }) {
  const head = useRef<Mesh>(null);
  const heights = [0.5, 1.1, 0.7, 1.6, 0.9, 1.3, 0.6, 1.0];
  useFrame(({ clock }) => {
    if (head.current) head.current.position.x = Math.sin(clock.elapsedTime * 0.6) * 2.1;
  });
  return (
    <group>
      <RoundedBox args={[5, 0.14, 0.9]} radius={0.04} position={[0, 0.5, 0]}>
        <Mat color={WHITE} />
      </RoundedBox>
      {heights.map((h, i) => (
        <mesh key={i} position={[i * 0.58 - 2.03, 0.57 + h / 2, 0]}>
          <boxGeometry args={[0.46, h, 0.5]} />
          <Mat color={accent} emissive={accent} intensity={0.12 + h * 0.12} opacity={0.55 + h * 0.2} />
        </mesh>
      ))}
      <mesh ref={head} position={[0, 1.35, 0]}>
        <boxGeometry args={[0.04, 2, 0.7]} />
        <Mat color={INK} />
      </mesh>
      <BlobShadow radius={3} />
    </group>
  );
}

/* ---------- Education and achievements: the arrival platform ---------- */
function EducationStation() {
  return (
    <group>
      <mesh position={[0, 0.3, 0]}>
        <cylinderGeometry args={[1.5, 1.7, 0.6, 48]} />
        <Mat color={WHITE} />
      </mesh>
      <RoundedBox args={[2, 1.2, 0.08]} radius={0.04} position={[0, 1.55, 0]} rotation={[-0.12, 0, 0]}>
        <Mat color={INK} />
      </RoundedBox>
      <mesh position={[0, 1.55, 0.05]} rotation={[-0.12, 0, 0]}>
        <planeGeometry args={[1.7, 0.9]} />
        <meshStandardMaterial color="#EAF0F6" roughness={0.6} />
      </mesh>
      {[-0.55, 0.55].map((x, i) => (
        <mesh key={x} position={[x, 0.95 + i * 0.1, 0.9]}>
          <cylinderGeometry args={[0.14, 0.14, 0.7 + i * 0.2, 24]} />
          <Mat color={INK} />
        </mesh>
      ))}
      <BlobShadow radius={2.4} />
    </group>
  );
}

export function Station({ chapter, active }: { chapter: Chapter; active: boolean }) {
  const group = useRef<Group>(null);
  const emphasis = useRef(1);
  useFrame((_, dt) => {
    if (!group.current) return;
    emphasis.current = MathUtils.damp(emphasis.current, active ? 1.05 : 1, 5, dt);
    // While this station is being zoomed into, it dissolves (its scale shrinks to nothing as the points take over).
    const zoom = useSite.getState().zoom;
    const dissolve = zoom && zoom.id === chapter.id ? zoomPhases(zoomClock.t).dissolve : 0;
    group.current.visible = dissolve < 0.999;
    group.current.scale.setScalar(Math.max(0.0001, emphasis.current * (1 - dissolve)));
  });
  const accent = chapter.accentHex;
  return (
    <group position={chapter.position}>
      <group ref={group}>
        {chapter.id === "me" && <MeStation />}
        {chapter.id === "rootx" && <RootXStation accent={accent} />}
        {chapter.id === "intelliroom" && <IntelliRoomStation accent={accent} />}
        {chapter.id === "mari" && <MariStation accent={accent} />}
        {chapter.id === "shorts-maker" && <ShortsStation accent={accent} />}
        {chapter.id === "education" && <EducationStation />}
      </group>
    </group>
  );
}

export type { MeshStandardMaterial };
