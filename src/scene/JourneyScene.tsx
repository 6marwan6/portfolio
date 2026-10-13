import { useEffect, useRef } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { MathUtils, Vector3 } from "three";
import { chapters } from "./chapters";
import { cameraCurve, targetCurve } from "./path";
import { activeChapterIndex, progressToCurve } from "./progress";
import { Station } from "./stations";
import { ZoomParticles } from "./ZoomParticles";
import { closePose, zoomPhases } from "./zoom";
import { zoomClock } from "./zoomClock";
import { useSite } from "../state/store";

const BG = "#F2F5F8";
const N = chapters.length;

function CameraRig({ progress }: { progress: React.MutableRefObject<number> }) {
  const { camera, pointer } = useThree();
  const smooth = useRef(0);
  const pos = useRef(new Vector3());
  const target = useRef(new Vector3());
  const closePos = useRef(new Vector3());
  const closeTarget = useRef(new Vector3());
  useFrame((_, dt) => {
    smooth.current = MathUtils.damp(smooth.current, progress.current, 4, dt);
    const u = progressToCurve(smooth.current, N);
    cameraCurve.getPoint(u, pos.current);
    targetCurve.getPoint(u, target.current);

    // During the zoom-in, blend from the scroll-driven shot to a close-up in front of the chosen station.
    const zoom = useSite.getState().zoom;
    const push = zoom ? zoomPhases(zoomClock.t).push : 0;
    if (zoom && push > 0) {
      const chapter = chapters.find((c) => c.id === zoom.id);
      if (chapter) {
        const pose = closePose(chapter.position);
        closePos.current.set(...pose.camera);
        closeTarget.current.set(...pose.target);
        pos.current.lerp(closePos.current, push);
        target.current.lerp(closeTarget.current, push);
      }
    }
    // A small pointer parallax keeps the shot alive without distracting from the content (fades out while zooming).
    const par = 1 - push;
    camera.position.set(pos.current.x + pointer.x * 0.3 * par, pos.current.y + pointer.y * 0.15 * par, pos.current.z);
    camera.lookAt(target.current);
  });
  return null;
}

function World({ active }: { active: number }) {
  return (
    <>
      <color attach="background" args={[BG]} />
      <fog attach="fog" args={[BG, 14, 52]} />
      <hemisphereLight args={["#ffffff", "#d3dde8", 1.15]} />
      <directionalLight position={[6, 10, 6]} intensity={1.5} />
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.001, -24]}>
        <planeGeometry args={[160, 160]} />
        <meshStandardMaterial color="#E8EEF4" roughness={1} />
      </mesh>
      {chapters.map((c, i) => (
        <Station key={c.id} chapter={c} active={i === active} />
      ))}
    </>
  );
}

export default function JourneyScene() {
  const progress = useRef(0);
  const active = useSite((s) => s.active);
  const setActive = useSite((s) => s.setActive);

  useEffect(() => {
    const onScroll = () => {
      const el = document.documentElement;
      const max = el.scrollHeight - window.innerHeight;
      const p = max > 0 ? window.scrollY / max : 0;
      progress.current = Math.min(1, Math.max(0, p));
      setActive(activeChapterIndex(progress.current, N));
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, [setActive]);

  return (
    <div className="stage" aria-hidden="true">
      <Canvas dpr={[1, 1.75]} camera={{ fov: 42, near: 0.1, far: 140, position: [2.6, 2.3, 7.5] }} gl={{ antialias: true, powerPreference: "high-performance" }}>
        <World active={active} />
        <CameraRig progress={progress} />
        <ZoomParticles />
      </Canvas>
    </div>
  );
}
