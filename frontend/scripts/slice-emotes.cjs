const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

// Read source emojis.png
const srcPath = 'c:/Users/srric/Documents/Pokemoro/assets/emojis.png';
const outDir = 'c:/Users/srric/Documents/Pokemoro/frontend/public/sprites';
const emotesDir = path.join(outDir, 'emotes');

if (!fs.existsSync(emotesDir)) {
  fs.mkdirSync(emotesDir, { recursive: true });
}

// Also copy the original emojis.png to public/sprites/
fs.copyFileSync(srcPath, path.join(outDir, 'emojis.png'));
console.log('Copied emojis.png to public/sprites/emojis.png');

const buf = fs.readFileSync(srcPath);
let offset = 8;
const idatChunks = [];
while (offset < buf.length) {
  const len = buf.readUInt32BE(offset);
  const type = buf.toString('ascii', offset + 4, offset + 8);
  if (type === 'IDAT') idatChunks.push(buf.subarray(offset + 8, offset + 8 + len));
  offset += 12 + len;
}
const deflated = zlib.inflateSync(Buffer.concat(idatChunks));
const srcW = 64;
const srcH = 256;
const bpp = 4;
const stride = srcW * bpp;
const rawImg = Buffer.alloc(srcW * srcH * 4);

function paeth(a, b, c) {
  const p = a + b - c;
  const pa = Math.abs(p - a);
  const pb = Math.abs(p - b);
  const pc = Math.abs(p - c);
  if (pa <= pb && pa <= pc) return a;
  if (pb <= pc) return b;
  return c;
}

let srcPos = 0;
for (let y = 0; y < srcH; y++) {
  const filterType = deflated[srcPos++];
  const dstRow = y * stride;
  const prevDstRow = (y - 1) * stride;

  for (let x = 0; x < stride; x++) {
    const rawByte = deflated[srcPos++];
    const left = x >= bpp ? rawImg[dstRow + x - bpp] : 0;
    const up = y > 0 ? rawImg[prevDstRow + x] : 0;
    const upLeft = (y > 0 && x >= bpp) ? rawImg[prevDstRow + x - bpp] : 0;

    let val = 0;
    switch (filterType) {
      case 0: val = rawByte; break;
      case 1: val = (rawByte + left) & 0xff; break;
      case 2: val = (rawByte + up) & 0xff; break;
      case 3: val = (rawByte + Math.floor((left + up) / 2)) & 0xff; break;
      case 4: val = (rawByte + paeth(left, up, upLeft)) & 0xff; break;
      default: val = rawByte; break;
    }
    rawImg[dstRow + x] = val;
  }
}

// CRC32 table
const crcTable = new Uint32Array(256);
for (let i = 0; i < 256; i++) {
  let c = i;
  for (let k = 0; k < 8; k++) c = (c & 1) ? (0xedb88320 ^ (c >>> 1)) : (c >>> 1);
  crcTable[i] = c;
}
function crc32(buf) {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) c = crcTable[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

// Function to encode an RGBA buffer into a valid PNG
function encodePNG(rgbaBuf, w, h) {
  // 1 filter byte per line (0 = None)
  const lineLen = w * 4;
  const rawData = Buffer.alloc(h * (lineLen + 1));
  for (let y = 0; y < h; y++) {
    rawData[y * (lineLen + 1)] = 0; // Filter None
    rgbaBuf.copy(rawData, y * (lineLen + 1) + 1, y * lineLen, (y + 1) * lineLen);
  }
  const compressed = zlib.deflateSync(rawData);

  // PNG header
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

  // IHDR chunk
  const ihdrData = Buffer.alloc(13);
  ihdrData.writeUInt32BE(w, 0);
  ihdrData.writeUInt32BE(h, 4);
  ihdrData.writeUInt8(8, 8); // bit depth 8
  ihdrData.writeUInt8(6, 9); // RGBA
  ihdrData.writeUInt8(0, 10); // compression
  ihdrData.writeUInt8(0, 11); // filter
  ihdrData.writeUInt8(0, 12); // interlace

  const ihdrChunk = Buffer.alloc(4 + 4 + 13 + 4);
  ihdrChunk.writeUInt32BE(13, 0);
  ihdrChunk.write('IHDR', 4);
  ihdrData.copy(ihdrChunk, 8);
  ihdrChunk.writeUInt32BE(crc32(ihdrChunk.subarray(4, 21)), 21);

  // IDAT chunk
  const idatChunk = Buffer.alloc(4 + 4 + compressed.length + 4);
  idatChunk.writeUInt32BE(compressed.length, 0);
  idatChunk.write('IDAT', 4);
  compressed.copy(idatChunk, 8);
  idatChunk.writeUInt32BE(crc32(idatChunk.subarray(4, 8 + compressed.length)), 8 + compressed.length);

  // IEND chunk
  const iendChunk = Buffer.alloc(4 + 4 + 4);
  iendChunk.writeUInt32BE(0, 0);
  iendChunk.write('IEND', 4);
  iendChunk.writeUInt32BE(crc32(Buffer.from('IEND')), 8);

  return Buffer.concat([signature, ihdrChunk, idatChunk, iendChunk]);
}

// Extract 16x16 tile
function extractTile(col, row) {
  const tile = Buffer.alloc(16 * 16 * 4);
  for (let y = 0; y < 16; y++) {
    const srcY = row * 16 + y;
    for (let x = 0; x < 16; x++) {
      const srcX = col * 16 + x;
      const srcIdx = (srcY * srcW + srcX) * 4;
      const dstIdx = (y * 16 + x) * 4;
      rawImg.copy(tile, dstIdx, srcIdx, srcIdx + 4);
    }
  }
  return tile;
}

// Extract 64x16 strip (all 4 animation frames)
function extractStrip(row) {
  const strip = Buffer.alloc(64 * 16 * 4);
  for (let y = 0; y < 16; y++) {
    const srcY = row * 16 + y;
    const srcIdx = (srcY * srcW) * 4;
    const dstIdx = (y * 64) * 4;
    rawImg.copy(strip, dstIdx, srcIdx, srcIdx + 64 * 4);
  }
  return strip;
}

// Row mappings based on sprite sheet:
const emoteRows = {
  sweat_question: 1,
  question: 2,
  angry: 3,
  awake: 4,
  loving: 5,
  sleep: 6,
  sad: 7,
  happy: 8,
  cross: 9,
  thinking: 10,
  idea: 12,
  play: 13,
  music: 14,
  blush: 15,
};

for (const [name, row] of Object.entries(emoteRows)) {
  // Save full size hero frame 3
  const frame3 = extractTile(3, row);
  const png3 = encodePNG(frame3, 16, 16);
  fs.writeFileSync(path.join(emotesDir, `${name}.png`), png3);

  // Save 4-frame strip
  const strip = extractStrip(row);
  const pngStrip = encodePNG(strip, 64, 16);
  fs.writeFileSync(path.join(emotesDir, `${name}_strip.png`), pngStrip);

  // Also save frame 0, 1, 2, 3 for animated sprite sequences
  for (let c = 0; c < 4; c++) {
    const frame = extractTile(c, row);
    fs.writeFileSync(path.join(emotesDir, `${name}_f${c}.png`), encodePNG(frame, 16, 16));
  }
}

console.log('Successfully extracted all pixel emote sprites into', emotesDir);
