"use strict";

/**
 * Normal Messenger message effects ("power ups") only.
 *
 * Avatar effects and music cards are intentionally NOT included here.
 * Style ids 1-4 are the normal effects observed in messageMetadata.p.style.
 * Legacy ids are kept for the HTTP fallback form.
 */

const EFFECTS = [
  {
    styleId: "1",
    styleName: "LOVE",
    name: "love",
    emoji: "❤️",
    verified: true,
    effectType: "MESSAGE_EFFECT",
    tagType: "message_effect",
    legacyId: "369239383222810",
    aliases: ["love", "heart", "1"],
  },
  {
    styleId: "2",
    styleName: "GIFTWRAP",
    name: "gift wrap",
    emoji: "🎁",
    verified: true,
    effectType: "MESSAGE_EFFECT",
    tagType: "message_effect",
    legacyId: null,
    aliases: ["gift", "giftwrap", "gift_wrap", "gift wrap", "2"],
  },
  {
    styleId: "3",
    styleName: "CELEBRATION",
    name: "celebration",
    emoji: "🎉",
    verified: true,
    effectType: "MESSAGE_EFFECT",
    tagType: "message_effect",
    legacyId: "370940413392601",
    aliases: ["celebration", "confetti", "party", "3"],
  },
  {
    styleId: "4",
    styleName: "FIRE",
    name: "fire",
    emoji: "🔥",
    verified: true,
    effectType: "MESSAGE_EFFECT",
    tagType: "message_effect",
    legacyId: "369239433222805",
    aliases: ["fire", "flame", "4"],
  },
];

const byKey = new Map();
for (const effect of EFFECTS) {
  byKey.set(effect.styleId, effect);
  byKey.set(effect.styleName.toLowerCase(), effect);
  byKey.set(effect.name, effect);
  for (const alias of effect.aliases) byKey.set(alias, effect);
  if (effect.legacyId) byKey.set(effect.legacyId, effect);
}

function normalize(input) {
  return String(input == null ? "" : input)
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ");
}

/** resolveEffect("fire") -> canonical effect copy; unknown input -> null. */
function resolveEffect(input) {
  if (input && typeof input === "object") {
    for (const key of [input.styleId, input.styleName, input.name, input.effect_id, input.id]) {
      if (key == null) continue;
      const found = byKey.get(normalize(key)) || byKey.get(String(key));
      if (found) return { ...found };
    }
    return null;
  }

  const value = normalize(input);
  if (!value) return null;

  const direct = byKey.get(value);
  if (direct) return { ...direct };

  // "fire effect", "love power up", etc.
  const cleaned = value
    .replace(/\b(message|power|up|effect|sticker)\b/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  if (!cleaned) return null;
  const found = byKey.get(cleaned);
  return found ? { ...found } : null;
}

function listEffects() {
  return EFFECTS.map(({ aliases, ...effect }) => ({ ...effect }));
}

module.exports = {
  EFFECTS,
  listEffects,
  resolveEffect,
};
