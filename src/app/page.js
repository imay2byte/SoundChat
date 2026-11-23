"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Header from "./components/headers";
import Hero from "./components/hero";
import SignalChannel from "./components/signalchannel";
import Transmitter from "./components/transmitter";
import Receiver from "./components/receiver";
import BitStrip from "./components/bitstrip";
import FskExplainer from "./components/fskexplainer";
import Footer from "./components/footer";
import {
  BIT_MS,
  F0,
  F1,
  HEADER_BITS,
  FskDecoder,
  buildFrame,
  bytesToBits,
} from "./lib/fsk";

const getAudioContext = () => window.AudioContext || window.webkitAudioContext;

export default function Home() {
  const [transmitting, setTransmitting] = useState(false);
  const [listening, setListening] = useState(false);
  const [decoding, setDecoding] = useState(false);
  const [receivedMessage, setReceivedMessage] = useState("");
  const [error, setError] = useState("");
  const [analyser, setAnalyser] = useState(null);
  const [bits, setBits] = useState("");
  const [activeIndex, setActiveIndex] = useState(-1);
  const rx = useRef(null);

  /* ---------- EMISOR ---------- */
  const handleTransmit = useCallback(async (text) => {
    const Ctx = getAudioContext();
    if (!Ctx) {
      setError("Tu navegador no admite la Web Audio API.");
      return;
    }

    const frame = buildFrame(text);
    const ctx = new Ctx();
    await ctx.resume();

    const seconds = BIT_MS / 1000;
    const t0 = ctx.currentTime + 0.2;
    const tEnd = t0 + frame.bits.length * seconds;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const tap = ctx.createAnalyser();
    tap.fftSize = 2048;
    osc.type = "sine";

    // Un salto de frecuencia por bit, sin cortes de fase.
    [...frame.bits].forEach((bit, i) => {
      osc.frequency.setValueAtTime(bit === "1" ? F1 : F0, t0 + i * seconds);
    });

    gain.gain.setValueAtTime(0, ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0.6, t0 + 0.02);
    gain.gain.setValueAtTime(0.6, tEnd);
    gain.gain.linearRampToValueAtTime(0, tEnd + 0.03);

    osc.connect(gain);
    gain.connect(tap);
    tap.connect(ctx.destination);

    setError("");
    setBits(frame.payloadBits);
    setActiveIndex(-1);
    setAnalyser(tap);
    setTransmitting(true);

    let raf;
    const tick = () => {
      const index = Math.floor((ctx.currentTime - t0) / seconds) - HEADER_BITS;
      setActiveIndex(index >= 0 && index < frame.payloadBits.length ? index : -1);
      raf = requestAnimationFrame(tick);
    };
    tick();

    osc.onended = () => {
      cancelAnimationFrame(raf);
      setActiveIndex(-1);
      setTransmitting(false);
      setAnalyser(rx.current?.analyser ?? null);
      ctx.close();
    };

    osc.start(t0);
    osc.stop(tEnd + 0.05);
  }, []);

  /* ---------- RECEPTOR ---------- */
  const stopListening = useCallback(() => {
    const r = rx.current;
    if (!r) return;
    rx.current = null;

    r.proc.onaudioprocess = null;
    r.proc.disconnect();
    r.source.disconnect();
    r.stream.getTracks().forEach((track) => track.stop());
    r.ctx.close();

    setListening(false);
    setDecoding(false);
    setAnalyser((current) => (current === r.analyser ? null : current));
  }, []);

  const startListening = useCallback(async () => {
    setError("");

    if (!navigator.mediaDevices?.getUserMedia) {
      setError("El micrófono solo funciona en localhost o con HTTPS.");
      return;
    }

    try {
      // Sin procesado: la cancelación de ruido borraría los tonos.
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: false,
          noiseSuppression: false,
          autoGainControl: false,
        },
      });

      const Ctx = getAudioContext();
      const ctx = new Ctx();
      await ctx.resume();

      const source = ctx.createMediaStreamSource(stream);
      const tap = ctx.createAnalyser();
      tap.fftSize = 2048;
      const proc = ctx.createScriptProcessor(4096, 1, 1);
      const mute = ctx.createGain();
      mute.gain.value = 0;

      const decoder = new FskDecoder(ctx.sampleRate, {
        onSync: () => {
          setDecoding(true);
          setReceivedMessage("");
          setError("");
          setBits("");
        },
        onByte: (bytes) => {
          const data = Uint8Array.from(bytes);
          setReceivedMessage(new TextDecoder().decode(data, { stream: true }));
          const decoded = bytesToBits(data);
          setBits(decoded);
          setActiveIndex(decoded.length - 1);
        },
        onMessage: (bytes) => {
          setReceivedMessage(new TextDecoder().decode(Uint8Array.from(bytes)));
          setDecoding(false);
          setActiveIndex(-1);
        },
        onError: (message) => {
          setError(message);
          setReceivedMessage("");
          setDecoding(false);
          setActiveIndex(-1);
        },
      });

      proc.onaudioprocess = (event) => {
        decoder.push(new Float32Array(event.inputBuffer.getChannelData(0)));
      };

      source.connect(tap);
      source.connect(proc);
      proc.connect(mute);
      mute.connect(ctx.destination);

      rx.current = { ctx, stream, source, proc, analyser: tap };
      setAnalyser(tap);
      setListening(true);
    } catch (err) {
      setError(
        err?.name === "NotAllowedError"
          ? "Sin permiso para usar el micrófono. Actívalo en el navegador y vuelve a intentarlo."
          : "No se pudo abrir el micrófono. Revisa que haya uno conectado."
      );
    }
  }, []);

  const toggleReceiver = () => (listening ? stopListening() : startListening());

  useEffect(() => stopListening, [stopListening]);

  return (
    <main className="soundchat">
      <Header />

      <Hero />

      <section className="channel-section">
        <div className="channel-heading">
          <span>03 — EL CANAL DE AIRE</span>
          <span>EMISIÓN / RECEPCIÓN</span>
        </div>

        <div className="channel-layout">
          <Transmitter onTransmit={handleTransmit} transmitting={transmitting} />

          <SignalChannel
            analyser={analyser}
            listening={listening}
            transmitting={transmitting}
          />

          <Receiver
            onToggle={toggleReceiver}
            listening={listening}
            receivedMessage={receivedMessage}
            error={error}
            decoding={decoding}
          />
        </div>

        <div className="bits-section">
          <div>
            <span className="bits-title">Trama binaria</span>
            <span className="bits-subtitle">REPRESENTACIÓN DE LOS DATOS</span>
          </div>

          <BitStrip bits={bits} activeIndex={activeIndex} />
        </div>
      </section>

      <FskExplainer />

      <Footer />
    </main>
  );
}