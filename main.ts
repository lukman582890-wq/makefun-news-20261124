import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const MAX_BYTES = 1_048_576;
const PNG_SIGNATURE = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
const PNG_IEND = Buffer.from([0x49, 0x45, 0x4e, 0x44, 0xae, 0x42, 0x60, 0x82]);
const SOURCE_PATH = join(import.meta.dirname, "entry.png");
const OUTPUT_DIR = process.env.MAKEFUN_OUTPUT_DIR || "/output";
const DEST_PATH = join(OUTPUT_DIR, "entry.png");

/** Validate PNG or JPEG magic bytes and EOF trailer so corrupt files fail fast. */
function assertValidImage(data: Buffer): void {
  if (data.length === 0 || data.length > MAX_BYTES) {
    throw new Error(
      `Invalid entry.png size: ${data.length} bytes (expected 1..${MAX_BYTES})`
    );
  }

  const isPng =
    data.length >= 16 &&
    data.subarray(0, 8).equals(PNG_SIGNATURE) &&
    data.subarray(data.length - 8).equals(PNG_IEND);

  const isJpeg =
    data.length >= 4 &&
    data[0] === 0xff &&
    data[1] === 0xd8 &&
    data[2] === 0xff &&
    data[data.length - 2] === 0xff &&
    data[data.length - 1] === 0xd9;

  if (!isPng && !isJpeg) {
    throw new Error("Invalid entry.png: unrecognized or truncated PNG/JPEG image");
  }
}

function main(): void {
  const data = readFileSync(SOURCE_PATH);
  assertValidImage(data);

  mkdirSync(OUTPUT_DIR, { recursive: true });
  writeFileSync(DEST_PATH, data, { mode: 0o644 });
}

main();
