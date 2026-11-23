// Dibuja la onda con ciclos proporcionales a la frecuencia (1200 Hz → 3, 2200 Hz → 5,5).
function Wave({ hz }) {
  const cycles = hz / 400;
  const points = Array.from({ length: 100 }, (_, i) => {
    const y = 30 - Math.sin((i / 99) * cycles * 2 * Math.PI) * 18;
    return `${i * 3},${y.toFixed(2)}`;
  }).join(" ");

  return (
    <svg viewBox="0 0 300 60" className="fsk-wave" aria-hidden="true">
      <polyline
        points={points}
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export default function FskExplainer() {
  return (
    <section className="fsk-section">
      <div className="section-heading">
        <span>02 — PRINCIPIO DE FUNCIONAMIENTO</span>
        <h2>
          Tecnología <em>FSK</em>
        </h2>
        <p>
          La información se representa mediante cambios de frecuencia en una
          onda portadora.
        </p>
      </div>

      <div className="fsk-comparison">
        <article className="frequency-example zero-example">
          <div className="frequency-heading">
            <span className="bit-symbol">●</span>
            <span>BIT 0</span>
          </div>

          <Wave hz={1200} />

          <strong>1200 Hz</strong>
          <small>FRECUENCIA BAJA</small>
        </article>

        <article className="frequency-example one-example">
          <div className="frequency-heading">
            <span className="bit-symbol">■</span>
            <span>BIT 1</span>
          </div>

          <Wave hz={2200} />

          <strong>2200 Hz</strong>
          <small>FRECUENCIA ALTA</small>
        </article>
      </div>

      <div className="example-conversion">
        <div className="conversion-step">
          <span>01 / CARÁCTER</span>
          <strong className="letter-a">A</strong>
        </div>

        <span className="conversion-arrow">→</span>

        <div className="conversion-step">
          <span>02 / BINARIO</span>
          <strong className="binary-example">01000001</strong>
        </div>

        <span className="conversion-arrow">→</span>

        <div className="conversion-step">
          <span>03 / SEÑAL</span>
          <strong className="signal-example">
            1200 · 2200 · 1200 · 1200 · 1200 · 1200 · 1200 · 2200 Hz
          </strong>
        </div>
      </div>
    </section>
  );
}