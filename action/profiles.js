import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { SCORE_AREAS } from "../bin/agentic-score.js";

export const TOOL_EFFECTS = ["read_only", "draft", "external_state"];
export const APPROVAL_REQUIREMENTS = ["none", "external_state"];
export const BLOCKER_POLICIES = ["allow", "fail"];

const REQUIRED_PROFILE_KEYS = [
  "title",
  "minimum_total",
  "minimum_areas",
  "allowed_tool_effects",
  "required_tool_effects",
  "approval_requirement",
  "launch_blocker_policy"
];

const defaultCatalogPath = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../profiles/readiness-profiles.json"
);

function assertExactKeys(object, required, context) {
  const keys = Object.keys(object);
  const missing = required.filter((key) => !keys.includes(key));
  const extra = keys.filter((key) => !required.includes(key));
  if (missing.length > 0) {
    throw new Error(`${context} is missing: ${missing.join(", ")}.`);
  }
  if (extra.length > 0) {
    throw new Error(`${context} has unknown field(s): ${extra.join(", ")}.`);
  }
}

function assertScore(value, context, maximum = 2) {
  if (!Number.isInteger(value) || value < 0 || value > maximum) {
    throw new Error(`${context} must be an integer from 0 to ${maximum}.`);
  }
}

export function validateProfile(profile, name = "selected") {
  if (!profile || typeof profile !== "object" || Array.isArray(profile)) {
    throw new Error(`Profile ${name} must be an object.`);
  }
  assertExactKeys(profile, REQUIRED_PROFILE_KEYS, `Profile ${name}`);
  if (typeof profile.title !== "string" || !profile.title.trim()) {
    throw new Error(`Profile ${name}.title must be a non-empty string.`);
  }
  assertScore(profile.minimum_total, `Profile ${name}.minimum_total`, 20);
  if (
    !profile.minimum_areas ||
    typeof profile.minimum_areas !== "object" ||
    Array.isArray(profile.minimum_areas) ||
    Object.keys(profile.minimum_areas).length === 0
  ) {
    throw new Error(`Profile ${name}.minimum_areas must be a non-empty object.`);
  }
  for (const [area, value] of Object.entries(profile.minimum_areas)) {
    if (!SCORE_AREAS.includes(area)) {
      throw new Error(`Profile ${name} has unknown score area ${area}.`);
    }
    assertScore(value, `Profile ${name}.minimum_areas.${area}`);
  }
  if (
    !Array.isArray(profile.allowed_tool_effects) ||
    profile.allowed_tool_effects.length === 0 ||
    new Set(profile.allowed_tool_effects).size !==
      profile.allowed_tool_effects.length ||
    profile.allowed_tool_effects.some((effect) => !TOOL_EFFECTS.includes(effect))
  ) {
    throw new Error(
      `Profile ${name}.allowed_tool_effects must contain unique known effects.`
    );
  }
  if (
    !Array.isArray(profile.required_tool_effects) ||
    profile.required_tool_effects.length === 0 ||
    new Set(profile.required_tool_effects).size !==
      profile.required_tool_effects.length ||
    profile.required_tool_effects.some(
      (effect) =>
        !TOOL_EFFECTS.includes(effect) ||
        !profile.allowed_tool_effects.includes(effect)
    )
  ) {
    throw new Error(
      `Profile ${name}.required_tool_effects must contain unique allowed effects.`
    );
  }
  if (!APPROVAL_REQUIREMENTS.includes(profile.approval_requirement)) {
    throw new Error(`Profile ${name} has an unknown approval requirement.`);
  }
  if (!BLOCKER_POLICIES.includes(profile.launch_blocker_policy)) {
    throw new Error(`Profile ${name} has an unknown launch blocker policy.`);
  }
  return profile;
}

export function loadProfile(name, catalogPath = defaultCatalogPath) {
  let catalog;
  try {
    catalog = JSON.parse(fs.readFileSync(catalogPath, "utf8"));
  } catch (error) {
    throw new Error(`Could not load readiness profiles: ${error.message}`);
  }
  if (
    !catalog ||
    typeof catalog !== "object" ||
    Array.isArray(catalog) ||
    catalog.version !== 1 ||
    !catalog.profiles ||
    typeof catalog.profiles !== "object" ||
    Array.isArray(catalog.profiles)
  ) {
    throw new Error("Readiness profile catalog is malformed.");
  }
  const profile = catalog.profiles[name];
  if (!profile) {
    throw new Error(`Unknown readiness profile: ${name}.`);
  }
  return validateProfile(profile, name);
}

function validateTools(card) {
  if (!Array.isArray(card.tools)) {
    throw new Error("A readiness profile requires an Agent Card tools array.");
  }
  return card.tools.map((tool, index) => {
    if (!tool || typeof tool !== "object" || Array.isArray(tool)) {
      throw new Error(`tools[${index}] must be an object.`);
    }
    if (!TOOL_EFFECTS.includes(tool.effect)) {
      throw new Error(
        `tools[${index}].effect must be one of ${TOOL_EFFECTS.join(", ")}.`
      );
    }
    if (typeof tool.approval_required !== "boolean") {
      throw new Error(`tools[${index}].approval_required must be boolean.`);
    }
    return tool;
  });
}

export function evaluateProfile(card, result, profileName, profile) {
  if (card.risk_profile && card.risk_profile !== profileName) {
    throw new Error(
      `Agent Card risk_profile ${card.risk_profile} does not match selected profile ${profileName}.`
    );
  }
  const tools = validateTools(card);
  const areaFailures = Object.entries(profile.minimum_areas)
    .filter(([area, minimum]) => card.scorecard[area] < minimum)
    .map(([area, minimum]) => ({
      area,
      actual: card.scorecard[area],
      minimum
    }));
  const effectFailures = tools
    .filter((tool) => !profile.allowed_tool_effects.includes(tool.effect))
    .map((tool) => tool.name || "unnamed tool");
  const approvalFailures =
    profile.approval_requirement === "external_state"
      ? tools
          .filter(
            (tool) =>
              tool.effect === "external_state" && !tool.approval_required
          )
          .map((tool) => tool.name || "unnamed tool")
      : [];
  const toolEffects = new Set(tools.map((tool) => tool.effect));
  const missingEffects = profile.required_tool_effects.filter(
    (effect) => !toolEffects.has(effect)
  );

  return {
    name: profileName,
    title: profile.title,
    minimumTotal: profile.minimum_total,
    totalPassed: result.total >= profile.minimum_total,
    areaFailures,
    effectFailures,
    missingEffects,
    approvalFailures,
    blockerPolicy: profile.launch_blocker_policy,
    passed:
      result.total >= profile.minimum_total &&
      areaFailures.length === 0 &&
      effectFailures.length === 0 &&
      missingEffects.length === 0 &&
      approvalFailures.length === 0
  };
}
