
"use client";

import { useEffect, useRef } from "react";

export default function SignalChannel({
  analyser = null,
  listening = false,
  transmitting = false,
}) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    let animationId;

    const draw = () => {
      const width = canvas.clientWidth;
      const height = canvas.clientHeight;
      const dpr = window.devicePixelRatio || 1;

      if (
        canvas.width !== Math.floor(width * dpr) ||
        canvas.height !== Math.floor(height * dpr)
      ) {
        canvas.width = Math.floor(width * dpr);
        canvas.height = Math.floor(height * dpr);
      }

      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, width, height);

      // Retícula de referencia.
      ctx.strokeStyle = "#37302A";
      ctx.lineWidth = 0.6;

      for (let x = 0; x < width; x += 20) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();
      }

      for (let y = 0; y < height; y += 20) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
      }

      // Líneas guía de frecuencia.
      const guides = [
        { y: height * 0.3, label: "2200 Hz", color: "#B9A4EF" },
        { y: height * 0.7, label: "1200 Hz", color: "#85B8E9" },
      ];

      guides.forEach((guide) => {
        ctx.strokeStyle = guide.color + "65";
        ctx.setLineDash([4, 5]);
        ctx.beginPath();
        ctx.moveTo(0, guide.y);
        ctx.lineTo(width, guide.y);
        ctx.stroke();
        ctx.setLineDash([]);

        ctx.fillStyle = guide.color;
        ctx.font = "10px monospace";
        ctx.fillText(guide.label, 8, guide.y - 7);
      });

      const data = analyser
        ? new Uint8Array(analyser.fftSize)
        : null;

      if (analyser && data) {
        analyser.getByteTimeDomainData(data);
      }

      const center = height / 2;
      const active = listening || transmitting;

      ctx.beginPath();
      ctx.lineWidth = 1.7;
      ctx.strokeStyle = "#D8D0C1";

      for (let x = 0; x < width; x++) {
        let value = 128;

        if (data) {
          const index = Math.floor(
            (x / width) * data.length
          );
          value = data[index];
        }

        const amplitude = active
          ? ((value - 128) / 128) * height * 0.38
          : Math.sin(x * 0.025) * 2;

        const y = center + amplitude;

        if (x === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }

      ctx.stroke();
      animationId = requestAnimationFrame(draw);
    };

    draw();

    return () => cancelAnimationFrame(animationId);
  }, [analyser, listening, transmitting]);

  return (
    <div className="signal-instrument">
      <div className="signal-topline">
        <span>CANAL DE TRANSMISIÓN</span>
        <span>{transmitting ? "TX / ACTIVO" : listening ? "RX / ACTIVO" : "EN ESPERA"}</span>
      </div>

      <canvas
        ref={canvasRef}
        className="signal-canvas"
        role="img"
        aria-label="Visualización de la señal sonora y guías de frecuencia de 1200 y 2200 hercios"
      />

      <div className="signal-axis">
        <span>− AMPLITUD</span>
        <span>TIEMPO →</span>
        <span>+ AMPLITUD</span>
      </div>
    </div>
  );
}
