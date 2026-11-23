"use client";

import { useEffect, useRef } from "react";

export default function BitStrip({ bits = "", activeIndex = -1 }) {
  const stripRef = useRef(null);

  // Mantiene el bit activo visible dentro de la tira.
  useEffect(() => {
    const strip = stripRef.current;
    if (!strip || activeIndex < 0) return;
    const el = strip.children[activeIndex];
    if (!el) return;
    strip.scrollTop = el.offsetTop - strip.clientHeight / 2 + el.clientHeight / 2;
  }, [activeIndex]);

  if (!bits.length) {
    return (
      <div className="bit-strip empty-bits">
        <span>ESPERANDO DATOS BINARIOS</span>
        <span>— — — — — — — —</span>
      </div>
    );
  }

  return (
    <div className="bit-strip" ref={stripRef} aria-label="Secuencia de bits">
      {bits.split("").map((bit, index) => (
        <div
          key={index}
          className={[
            "bit",
            bit === "0" ? "bit-zero" : "bit-one",
            activeIndex === index ? "bit-active" : "",
          ].join(" ")}
          title={`Bit ${bit}`}
        >
          <span className="bit-shape">{bit === "0" ? "●" : "■"}</span>
          <span className="bit-number">{bit}</span>
        </div>
      ))}
    </div>
  );
}