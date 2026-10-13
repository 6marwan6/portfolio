import { describe, expect, it } from "vitest";
import { agentSystem } from "../api/_lib/prompt";
import { buildVoiceGuide, persona, type Persona } from "../src/content/persona";
import { validate } from "../scripts/validate-content";

describe("personality", () => {
  it("builds the voice guide from the dials, beliefs, phrases and examples", () => {
    const g = buildVoiceGuide(persona, "en");
    expect(g).toContain(persona.summary.en);
    expect(g).toContain("polished and professional");
    expect(g).toContain("a light touch of dry humor");
    expect(g).toContain("direct and clear");
    expect(g).toContain("I direct AI deliberately inside an architecture");
    expect(g).toContain("In short:");
    expect(g).toContain("As an AI language model");
    for (const e of persona.examples) {
      expect(g).toContain(e.q.en);
      expect(g).toContain(e.a.en);
    }
  });

  it("changes when the dials change, so tuning the personality really changes the prompt", () => {
    const playful: Persona = { ...persona, tone: { formality: "casual", humor: "playful", directness: "blunt", length: "detailed" }, arabic: { style: "msa", notes: "" } };
    const g = buildVoiceGuide(playful, "en");
    expect(g).toContain("casual and conversational");
    expect(g).toContain("playful, with friendly jokes");
    expect(g).toContain("blunt and to the point");
    expect(g).toContain("clear Modern Standard Arabic");
    expect(g).not.toContain("polished and professional");
  });

  it("reflects Marwan's choices: professional and polished, a light touch of humor, casual Egyptian Arabic", () => {
    expect(persona.tone).toMatchObject({ formality: "professional", humor: "light" });
    expect(persona.arabic.style).toBe("egyptian");
    const g = buildVoiceGuide(persona, "ar");
    expect(g).toContain("natural Egyptian Arabic");
    expect(g).toContain("لسه");
  });

  it("uses the Arabic examples and summary for Arabic", () => {
    const g = buildVoiceGuide(persona, "ar");
    expect(g).toContain(persona.summary.ar);
    expect(g).toContain(persona.examples[0]!.a.ar);
    expect(g).not.toContain(persona.examples[0]!.a.en);
  });

  it("keeps the examples honest: no numbers, no claim of the teammates' AI work, no avoided phrases", () => {
    expect(validate(false).errors).toEqual([]);
    const intelli = persona.examples.find((e) => /IntelliRoom/.test(e.q.en))!;
    expect(intelli.a.en).toMatch(/teammates/i);
    for (const e of persona.examples) for (const bad of persona.phrases.avoid) expect(e.a.en.toLowerCase()).not.toContain(bad.toLowerCase());
  });

  it("is what the agent is told to sound like", () => {
    const en = agentSystem("en");
    expect(en).toContain("VOICE:");
    expect(en).toContain(persona.summary.en);
    expect(agentSystem("ar")).toContain(persona.summary.ar);
    expect(en).toContain("Never show your reasoning");
  });
});
