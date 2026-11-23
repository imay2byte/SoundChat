
"use client";

export default function Receiver({
  onToggle,
  listening = false,
  receivedMessage = "",
  error = "",
  decoding = false,
}) {
  return (
    <section className="endpoint receiver">
      <div className="endpoint-heading">
        <span>02 / DESTINO</span>
        <span className="endpoint-code">RX</span>
      </div>

      <h2>Receptor</h2>

      <p className="endpoint-description">
        Captura las ondas sonoras y reconstruye el mensaje recibido.
      </p>

      <div className="receiver-control">
        <div>
          <span className="control-label">ENTRADA DE AUDIO</span>
          <strong>{listening ? "ACTIVA" : "INACTIVA"}</strong>
        </div>

        <button
          type="button"
          className={`physical-switch ${listening ? "switch-on" : ""}`}
          onClick={onToggle}
          role="switch"
          aria-checked={listening}
          aria-label="Activar o detener el receptor"
        >
          <span />
        </button>
      </div>

      <div className="received-area" aria-live="polite" aria-atomic="true">
        <span className="control-label">MENSAJE RECIBIDO</span>

        {error ? (
          <p className="receiver-error">{error}</p>
        ) : receivedMessage ? (
          <p className="received-text">{receivedMessage}</p>
        ) : decoding ? (
          <p className="received-placeholder">Decodificando señal...</p>
        ) : (
          <p className="received-placeholder">Aquí aparecerá el mensaje...</p>
        )}
      </div>

      <div className="endpoint-footer">
        <span className={`led ${error ? "amber" : listening ? "" : "muted"}`} />
        {error ? "ERROR DE ENTRADA" : listening ? "ESCUCHANDO SEÑAL" : "ESPERANDO ACTIVACIÓN"}
      </div>
    </section>
  );
}
