import { describe, expect, it } from "vitest";
import { createElement } from "react";
import { renderToString } from "react-dom/server";
import { App } from "../src/App";

describe("plain page smoke test", () => {
  const html = renderToString(createElement(App));

  it("renders every chapter with its status and the IntelliRoom credit split", () => {
    for (const id of ["rootx", "intelliroom", "mari", "shorts-maker"]) expect(html).toContain(`id="${id}"`);
    expect(html).toContain("Teammates built");
    expect(html).toContain("Shared work");
    expect(html).toContain("In progress");
  });

  it("renders the required disclaimers and the illustrative ribbon", () => {
    expect(html).toContain("not affiliated with or endorsed by Riot Games");
    expect(html).toContain("Built on the open-source react-planner");
    expect(html).toContain("Illustrative, sample data");
  });

  it("does not render the unverified portal link, the unconfirmed academy cost, or any phone number", () => {
    expect(html).not.toContain("portal.rootx.solutions");
    expect(html).not.toContain("About 30 per month");
    // Check the visible text only (drawing coordinates in SVG attributes are not phone numbers).
    const text = html.replace(/<[^>]+>/g, " ");
    expect(text).not.toMatch(/\+?\d[\d\s-]{8,}\d/);
  });

  it("renders the teammates with their LinkedIn links", () => {
    expect(html).toContain("Youssef Ossama Sayed");
    expect(html).toContain("https://www.linkedin.com/in/mohamed-sameh77");
  });

  it("renders the animated system graphs with their credit labels and a prompt to select a step", () => {
    expect(html).toContain("gnode");
    expect(html).toContain("Select a step to read about it.");
    expect(html).toContain("Dashed outline: built by teammates");
    expect(html).toContain('data-credit="team"');
  });

  it("starts on the plain page when there is no browser (no WebGL), and offers the 3D journey", () => {
    expect(html).toContain("Open the 3D journey");
  });

  it("shows skill years only for skills over one year", () => {
    expect(html).toContain("Python (3 years)");
    expect(html).not.toMatch(/TypeScript \(\d/);
  });
});
