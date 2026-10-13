import { useMemo, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { BufferAttribute, BufferGeometry, Color, Vector3, type Points, type PointsMaterial } from "three";
import { projects } from "../content";
import { chapters } from "./chapters";
import { PARTICLES_PER_NODE, makeParticles, particlePosition } from "./particles";
import { zoomPhases } from "./zoom";
import { zoomClock } from "./zoomClock";
import { useSite } from "../state/store";
import { getLayout } from "../views/layout";
import { graphScreenRect, nodeScreenCenter, placeNodes } from "../views/graphGeometry";

const MAX_POINTS = 480;
const DEPTH = 3.2;

interface Run {
  key: string;
  count: number;
  start: Float32Array;
  delay: Float32Array;
  target: Float32Array | null;
}

/** The station dissolves into points that fly to where the graph nodes will appear (plan section 6.3, step 2). */
export function ZoomParticles() {
  const { camera, size } = useThree();
  const pointsRef = useRef<Points>(null);
  const matRef = useRef<PointsMaterial>(null);
  const run = useRef<Run | null>(null);
  const tmp = useMemo(() => new Vector3(), []);
  const dir = useMemo(() => new Vector3(), []);

  const { geometry, attribute } = useMemo(() => {
    const array = new Float32Array(MAX_POINTS * 3);
    const attr = new BufferAttribute(array, 3);
    const geo = new BufferGeometry();
    geo.setAttribute("position", attr);
    geo.setDrawRange(0, 0);
    return { geometry: geo, attribute: attr };
  }, []);

  useFrame(() => {
    const mat = matRef.current;
    if (!mat) return;
    const z = useSite.getState().zoom;
    if (!z) {
      mat.opacity = 0;
      run.current = null;
      return;
    }
    const chapter = chapters.find((c) => c.id === z.id);
    const project = projects.find((p) => p.id === z.id);
    const view = project?.views.find((v) => v.id === z.view);
    if (!chapter || !project || !view) {
      mat.opacity = 0;
      return;
    }
    const { push, dissolve, ui } = zoomPhases(zoomClock.t);
    const key = `${z.id}/${z.view}`;
    if (!run.current || run.current.key !== key) {
      const count = Math.min(MAX_POINTS, view.nodes.length * PARTICLES_PER_NODE);
      const origin: [number, number, number] = [chapter.position[0], 0, chapter.position[2]];
      const { start, delay } = makeParticles(count, origin, 7);
      run.current = { key, count, start, delay, target: null };
      mat.color = new Color(chapter.accentHex);
    }
    const r = run.current;

    // Targets are computed once the camera has reached the close-up pose, from where the stage will place the graph nodes.
    if (!r.target && push > 0.999) {
      const stage = document.querySelector(".zoom-stage");
      if (stage) {
        const rect = stage.getBoundingClientRect();
        const layout = getLayout(z.id, view);
        const pos = placeNodes(layout, document.documentElement.dir === "rtl");
        const placed = graphScreenRect({ left: rect.left, top: rect.top, width: rect.width }, layout);
        const target = new Float32Array(r.count * 3);
        camera.updateMatrixWorld();
        view.nodes.forEach((n, ni) => {
          const p = pos[n.id];
          if (!p) return;
          const c = nodeScreenCenter(placed, p);
          const ndcX = (c.x / size.width) * 2 - 1;
          const ndcY = 1 - (c.y / size.height) * 2;
          tmp.set(ndcX, ndcY, 0.5).unproject(camera);
          dir.copy(tmp).sub(camera.position).normalize();
          const wx = camera.position.x + dir.x * DEPTH;
          const wy = camera.position.y + dir.y * DEPTH;
          const wz = camera.position.z + dir.z * DEPTH;
          for (let k = 0; k < PARTICLES_PER_NODE; k++) {
            const i = ni * PARTICLES_PER_NODE + k;
            if (i >= r.count) break;
            target[i * 3] = wx + (Math.random() - 0.5) * 0.35;
            target[i * 3 + 1] = wy + (Math.random() - 0.5) * 0.2;
            target[i * 3 + 2] = wz;
          }
        });
        r.target = target;
      }
    }

    if (!r.target) {
      mat.opacity = 0;
      return;
    }
    const arr = attribute.array as Float32Array;
    for (let i = 0; i < r.count; i++) {
      const [x, y, zz] = particlePosition(i, r.start, r.target, r.delay, dissolve);
      arr[i * 3] = x;
      arr[i * 3 + 1] = y;
      arr[i * 3 + 2] = zz;
    }
    attribute.needsUpdate = true;
    geometry.setDrawRange(0, r.count);
    const visible = Math.min(1, dissolve * 4);
    mat.opacity = visible * (1 - ui);
  });

  return (
    <points ref={pointsRef} geometry={geometry} frustumCulled={false}>
      <pointsMaterial ref={matRef} size={0.07} sizeAttenuation transparent opacity={0} depthWrite={false} />
    </points>
  );
}
