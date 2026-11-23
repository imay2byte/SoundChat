// Protocolo FSK de SoundChat.
// Trama: preámbulo (16 bits) + sincronía (8) + longitud (16) + datos + CRC-8 (8)

export const F0 = 1200; // bit 0
export const F1 = 2200; // bit 1
export const BIT_MS = 40; // duración de cada bit (súbela si hay mucho eco)
export const STEPS = 4; // ventanas de análisis por bit
export const MAX_BYTES = 400;

const PREAMBLE = "10".repeat(8);
const SYNC = "11010011";
const MATCH = "10101010" + SYNC; // patrón que busca el receptor
const SILENCE = 0.006;

export const HEADER_BITS = PREAMBLE.length + SYNC.length + 16;

export function crc8(bytes) {
  let crc = 0;
  for (const byte of bytes) {
    crc ^= byte;
    for (let i = 0; i < 8; i++) {
      crc = crc & 0x80 ? ((crc << 1) ^ 0x07) & 0xff : (crc << 1) & 0xff;
    }
  }
  return crc;
}

const toBits = (n, len) => n.toString(2).padStart(len, "0");

export function bytesToBits(bytes) {
  return Array.from(bytes, (b) => toBits(b, 8)).join("");
}

export function buildFrame(text) {
  const bytes = new TextEncoder().encode(text);
  if (bytes.length === 0 || bytes.length > MAX_BYTES) {
    throw new Error("El mensaje es demasiado largo para transmitirlo.");
  }
  const payloadBits = bytesToBits(bytes);
  const bits =
    PREAMBLE + SYNC + toBits(bytes.length, 16) + payloadBits + toBits(crc8(bytes), 8);
  return { bits, payloadBits };
}

// Amplitud de una frecuencia dentro de una ventana (algoritmo de Goertzel).
function goertzel(buf, start, len, freq, sampleRate) {
  const coeff = 2 * Math.cos((2 * Math.PI * freq) / sampleRate);
  let s1 = 0;
  let s2 = 0;
  for (let n = 0; n < len; n++) {
    const s = buf[start + n] + coeff * s1 - s2;
    s2 = s1;
    s1 = s;
  }
  const power = s1 * s1 + s2 * s2 - coeff * s1 * s2;
  return (Math.sqrt(Math.max(power, 0)) * 2) / len;
}

export class FskDecoder {
  constructor(sampleRate, handlers = {}) {
    this.sr = sampleRate;
    this.h = handlers;
    this.bitLen = Math.round((sampleRate * BIT_MS) / 1000);
    this.step = Math.floor(this.bitLen / STEPS);
    this.buf = new Float32Array(0);
    this.reset();
  }

  reset() {
    this.d = []; // decisión por ventana: 0, 1 o -1 (silencio)
    this.m = []; // margen entre las dos frecuencias
    this.scan = 0;
    this.base = 0;
    this.len = 0;
    this.bytes = [];
    this.silent = 0;
    this.state = "search";
  }

  push(chunk) {
    const merged = new Float32Array(this.buf.length + chunk.length);
    merged.set(this.buf);
    merged.set(chunk, this.buf.length);

    let p = 0;
    while (p + this.bitLen <= merged.length) {
      const a0 = goertzel(merged, p, this.bitLen, F0, this.sr);
      const a1 = goertzel(merged, p, this.bitLen, F1, this.sr);
      if (Math.max(a0, a1) < SILENCE) {
        this.d.push(-1);
        this.silent++;
      } else {
        this.d.push(a1 > a0 ? 1 : 0);
        this.silent = 0;
      }
      this.m.push(Math.abs(a1 - a0));
      p += this.step;
    }

    this.buf = merged.slice(p);
    this.advance();
  }

  advance() {
    if (this.state === "search") this.search();
    if (this.state !== "search" && this.silent > 150) {
      return this.fail("La señal se interrumpió antes de terminar el mensaje.");
    }
    if (this.state === "header") this.readHeader();
    if (this.state === "payload") this.readPayload();
    if (this.state === "crc") this.readCrc();
  }

  matches(i) {
    for (let k = 0; k < MATCH.length; k++) {
      if (this.d[i + k * STEPS] !== Number(MATCH[k])) return false;
    }
    return true;
  }

  score(i) {
    let total = 0;
    for (let k = 0; k < MATCH.length; k++) total += this.m[i + k * STEPS];
    return total;
  }

  search() {
    const span = (MATCH.length - 1) * STEPS;
    let i = this.scan;

    while (i + span + STEPS - 1 < this.d.length) {
      if (this.matches(i)) {
        // Elige la ventana mejor alineada con el inicio real del bit.
        let best = i;
        let bestScore = -1;
        for (let j = i; j < i + STEPS; j++) {
          if (!this.matches(j)) continue;
          const s = this.score(j);
          if (s > bestScore) {
            bestScore = s;
            best = j;
          }
        }
        this.base = best + MATCH.length * STEPS;
        this.state = "header";
        this.h.onSync?.();
        return;
      }
      i++;
    }

    this.scan = i;
    if (i > 300) {
      const drop = i - 100;
      this.d.splice(0, drop);
      this.m.splice(0, drop);
      this.scan -= drop;
    }
  }

  at(k) {
    return this.d[this.base + k * STEPS];
  }

  readByte(offset) {
    let v = 0;
    for (let k = 0; k < 8; k++) v = (v << 1) | (this.at(offset + k) === 1 ? 1 : 0);
    return v;
  }

  readHeader() {
    if (this.at(15) === undefined) return;
    let n = 0;
    for (let k = 0; k < 16; k++) n = (n << 1) | (this.at(k) === 1 ? 1 : 0);
    if (n < 1 || n > MAX_BYTES) {
      return this.fail("No se pudo leer la cabecera del mensaje. Intenta de nuevo.");
    }
    this.len = n;
    this.state = "payload";
  }

  readPayload() {
    while (this.bytes.length < this.len) {
      const offset = 16 + this.bytes.length * 8;
      if (this.at(offset + 7) === undefined) return;
      this.bytes.push(this.readByte(offset));
      this.h.onByte?.(this.bytes);
    }
    this.state = "crc";
  }

  readCrc() {
    const offset = 16 + this.len * 8;
    if (this.at(offset + 7) === undefined) return;
    const received = this.readByte(offset);
    const bytes = this.bytes;
    const ok = received === crc8(bytes);
    this.reset();
    if (ok) this.h.onMessage?.(bytes);
    else {
      this.h.onError?.(
        "El mensaje llegó dañado. Acerca los dispositivos, sube el volumen y reduce el ruido."
      );
    }
  }

  fail(message) {
    this.reset();
    this.h.onError?.(message);
  }
}