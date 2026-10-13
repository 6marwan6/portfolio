import { CatmullRomCurve3, Vector3 } from "three";
import { chapters } from "./chapters";

/** The camera sits to the side of each station and looks at it; the sides alternate to give the path an S shape. */
const side = (i: number) => (i % 2 === 0 ? 1 : -1);

const camPoints = chapters.map((c, i) => new Vector3(c.position[0] + side(i) * 2.6, 2.3, c.position[2] + 7.5));
const targetPoints = chapters.map((c) => new Vector3(c.position[0], 1.25, c.position[2]));

export const cameraCurve = new CatmullRomCurve3(camPoints, false, "centripetal");
export const targetCurve = new CatmullRomCurve3(targetPoints, false, "centripetal");
