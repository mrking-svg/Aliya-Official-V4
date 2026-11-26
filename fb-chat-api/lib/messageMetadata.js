"use strict";

/**
 * Parses the 2025/2026 Messenger `messageMetadata` blob.
 *
 * Two features are encoded inside `messageMetadata.data.data.mm.asBinary`
 * instead of regular attachments:
 *
 *   - message effects / "power ups"  (love, fire, celebration, avatar cry, ...)
 *   - music stickers / music cards   (xma_music_sticker_message_metadata)
 *
 * The blob is a compact thrift-like structure with printable field names, so
 * we decode it without pulling in a protobuf/thrift dependency.
 */

const EFFECTS = {
  LOVE: { id: "1", name: "love", emoji: "❤️", isAvatar: false },
  GIFTTWRAP: { id: "2", name: "gift wrap", emoji: "🎁", isAvatar: false },
  GIFTWRAP: { id: "2", name: "gift wrap", emoji: "🎁", isAvatar: false },
  CELEBRATION: { id: "3", name: "celebration", emoji: "🎉", isAvatar: false },
  FIRE: { id: "4", name: "fire", emoji: "🔥", isAvatar: false },
  AVATAR_LOVE: { id: "1000", name: "avatar love", emoji: "🥰", isAvatar: true },
  AVATAR_ANGER: { id: "1001", name: "avatar anger", emoji: "😠", isAvatar: true },
  AVATAR_ANGRY: { id: "1001", name: "avatar anger", emoji: "😠", isAvatar: true },
  AVATAR_LAUGH: { id: "1002", name: "avatar laugh", emoji: "😂", isAvatar: true },
  AVATAR_CRY: { id: "1003", name: "avatar cry", emoji: "😭", isAvatar: true },
};

function isObject(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function toBuffer(value) {
  if (Buffer.isBuffer(value)) return value;
  if (Array.isArray(value)) {
    return Buffer.from(value.map((byte) => byte & 0xff));
  }
  if (value && value.type === "Buffer" && Array.isArray(value.data)) {
    return Buffer.from(value.data.map((byte) => byte & 0xff));
  }
  if (ArrayBuffer.isView(value)) {
    return Buffer.from(value.buffer, value.byteOffset, value.byteLength);
  }
  return null;
}

/**
 * Collect printable ASCII runs (length >= 3) from the binary blob.
 * Field names and string values are stored as plain ASCII.
 */
function extractStrings(buffer, minLength = 3) {
  const strings = [];
  let current = "";
  for (const byte of buffer) {
    if (byte >= 32 && byte < 127) {
      current += String.fromCharCode(byte);
    } else {
      if (current.length >= minLength) strings.push(current);
      current = "";
    }
  }
  if (current.length >= minLength) strings.push(current);
  return strings;
}

function fieldIndex(strings, field) {
  return strings.findIndex(
    (value) =>
      value === field ||
      value === field + "(" ||
      value === field + "6" ||
      value.startsWith(field + "(") ||
      value.startsWith(field + "6")
  );
}

function valueAfter(strings, field) {
  const index = fieldIndex(strings, field);
  if (index < 0) return null;
  return strings[index + 1] || null;
}

/**
 * Reads `<field><0x28><length><bytes>` or `<field><0x36><0|1>`.
 * The length byte can itself be printable, so string scanning alone is not
 * enough (e.g. song_subtitle's length is "#", which merges with the value).
 */
function readField(buffer, field) {
  const index = buffer.indexOf(Buffer.from(field, "ascii"));
  if (index < 0) return null;

  const cursor = index + field.length;
  const type = buffer[cursor];
  if (type === 0x28) {
    const length = buffer[cursor + 1];
    if (length === undefined) return null;
    return buffer
      .slice(cursor + 2, cursor + 2 + length)
      .toString("utf8");
  }
  if (type === 0x36) {
    return buffer[cursor + 1] === 1;
  }
  return null;
}

function boolAfterField(buffer, field) {
  const needle = Buffer.from(field, "ascii");
  const index = buffer.indexOf(needle);
  if (index < 0) return null;
  // Field header (0x36) comes right after the name, then 0/1.
  const header = buffer[index + needle.length];
  const value = buffer[index + needle.length + 1];
  if (header === undefined || value === undefined) return null;
  return value === 1;
}

function getStyleId(metadata) {
  const style =
    metadata &&
    metadata.data &&
    metadata.data.data &&
    metadata.data.data.p &&
    metadata.data.data.p.asMap &&
    metadata.data.data.p.asMap.data &&
    metadata.data.data.p.asMap.data.style;
  if (!style) return null;
  const value = style.asLong ?? style.asString ?? style.asInt;
  return value != null ? String(value) : null;
}

function parseEffectMetadata(metadata) {
  const raw =
    metadata &&
    metadata.data &&
    metadata.data.data &&
    metadata.data.data.mm &&
    (metadata.data.data.mm.asBinary || metadata.data.data.mm.asString);

  const buffer = toBuffer(raw);
  if (!buffer || !buffer.length) return null;

  if (buffer.indexOf(Buffer.from("power_up", "ascii")) < 0) return null;

  const styleName = readField(buffer, "power_up_style");
  if (!styleName) return null;

  const known = EFFECTS[styleName] || null;
  const styleId = getStyleId(metadata) || (known ? known.id : null);

  return {
    styleName,
    styleId: styleId != null ? String(styleId) : null,
    name: known ? known.name : styleName.toLowerCase().replace(/_/g, " "),
    emoji: known ? known.emoji : null,
    isAvatar: known
      ? known.isAvatar
      : /^AVATAR_/i.test(styleName) || (styleId != null && Number(styleId) >= 1000),
    known: Boolean(known),
  };
}

function parseMusicMetadata(metadata) {
  const raw =
    metadata &&
    metadata.data &&
    metadata.data.data &&
    metadata.data.data.mm &&
    (metadata.data.data.mm.asBinary || metadata.data.data.mm.asString);

  const buffer = toBuffer(raw);
  if (!buffer || !buffer.length) return null;

  if (
    buffer.indexOf(
      Buffer.from("xma_music_sticker_message_metadata", "ascii")
    ) < 0
  ) {
    return null;
  }

  const startTime = readField(buffer, "start_time");
  const explicit = readField(buffer, "is_explicit");

  return {
    songId: readField(buffer, "song_id"),
    startTime:
      startTime != null && startTime !== "" ? Number(startTime) : null,
    title: readField(buffer, "song_title"),
    subtitle: readField(buffer, "song_subtitle"),
    explicit: typeof explicit === "boolean" ? explicit : null,
  };
}

/**
 * parseMessageMetadata(delta.messageMetadata) ->
 *   { effect, music, strings }
 */
function parseMessageMetadata(metadata) {
  if (!isObject(metadata)) {
    return { effect: null, music: null, strings: [] };
  }

  const raw =
    metadata.data &&
    metadata.data.data &&
    metadata.data.data.mm &&
    (metadata.data.data.mm.asBinary || metadata.data.data.mm.asString);
  const buffer = toBuffer(raw);

  return {
    effect: parseEffectMetadata(metadata),
    music: parseMusicMetadata(metadata),
    strings: buffer ? extractStrings(buffer) : [],
  };
}

module.exports = {
  EFFECTS,
  boolAfterField,
  extractStrings,
  parseEffectMetadata,
  parseMessageMetadata,
  parseMusicMetadata,
  toBuffer,
};
