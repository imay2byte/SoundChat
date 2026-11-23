
"use client";

import { useState } from "react";

export default function Transmitter({
  onTransmit,
  transmitting = false,
}) {
  const [message, setMessage] = useState("");

  const handleTransmit = () => {
    if (!message.trim() || transmitting) return;
    onTransmit?.(message.trim());
  };

  return (
    <section className="endpoint transmitter">
      <div className="endpoint-heading">
        <span>01 / ORIGEN</span>
        <span className="endpoint-code">TX</span>
      </div>

      <h2>Emisor</h2>

      <p className="endpoint-description">
        Escribe la información que deseas enviar al otro extremo.
      </p>

      <label htmlFor="message">MENSAJE DE TEXTO</label>

      <textarea
        id="message"
        value={message}
        maxLength={100}
        onChange={(e) => setMessage(e.target.value)}
        placeholder="Escribe aquí..."
        aria-label="Mensaje que se desea transmitir"
      />

      <div className="input-meta">
        <span>CODIFICACIÓN UTF-8</span>
        <span>{message.length} / 100</span>
      </div>

      <button
        className="transmit-action"
        onClick={handleTransmit}
        disabled={!message.trim() || transmitting}
      >
        <span>{transmitting ? "Cargando señal..." : "Transmitir mensaje"}</span>
        <span>↗</span>
      </button>

      <div className="endpoint-footer">
        <span className={transmitting ? "led amber" : "led muted"} />
        {transmitting ? "TRANSMITIENDO" : "LISTO PARA TRANSMITIR"}
      </div>
    </section>
  );
}
