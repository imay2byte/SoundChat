# SoundChat

Transmite mensajes de texto entre dispositivos usando solo sonido. Sin Wi-Fi, sin Bluetooth, sin cables: el emisor convierte el texto en tonos audibles y el receptor los captura con el micrófono y reconstruye el mensaje.

## Cómo funciona

SoundChat usa **FSK (Frequency Shift Keying)**, una modulación digital que representa cada bit con una frecuencia distinta:

| Bit | Frecuencia |
|-----|-----------|
| 0   | 1200 Hz   |
| 1   | 2200 Hz   |

**Emisor.** El texto se codifica en UTF-8, se arma una trama y se reproduce con la Web Audio API, un tono de 40 ms por bit.

**Trama.**

```
preámbulo (16 bits) | sincronía (8) | longitud (16) | datos | CRC-8 (8)
```

El preámbulo alterna 1 y 0 para que el receptor se sincronice, y el CRC-8 valida que el mensaje llegó completo y sin errores.

**Receptor.** Captura el audio del micrófono, analiza ventanas de señal con el algoritmo de Goertzel para decidir si suena 1200 o 2200 Hz, busca la sincronía y decodifica la trama. El texto aparece carácter a carácter mientras llega.

## Características

- Emisor y receptor en la misma página.
- Mensajes de hasta 100 caracteres con codificación UTF-8, incluidas tildes y emojis.
- Visualización en vivo de la señal de audio y de la trama binaria.
- Verificación de integridad con CRC-8 y mensajes de error claros.
- Interfaz responsive y compatible con `prefers-reduced-motion`.

## Tecnologías

- [Next.js](https://nextjs.org/) (App Router) y React
- Web Audio API (`OscillatorNode`, `AnalyserNode`, `ScriptProcessorNode`)
- CSS puro, con las fuentes Fraunces e IBM Plex Mono

## Estructura

```
src/app/
├── components/
│   ├── headers.js        Cabecera y logo
│   ├── hero.js           Titular principal
│   ├── transmitter.js    Módulo emisor
│   ├── receiver.js       Módulo receptor
│   ├── signalchannel.js  Visualización de la señal
│   ├── bitstrip.js       Tira de bits
│   ├── fskexplainer.js   Explicación de FSK
│   └── footer.js
├── lib/
│   └── fsk.js            Trama, CRC y decodificador FSK
├── globals.css
├── layout.js
└── page.js               Lógica de emisión y recepción
```

## Instalación

Requisitos: Node.js 18 o superior.

```bash
git clone https://github.com/imay2byte/soundchat.git
cd soundchat
npm install
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000).

## Uso

1. Activa el **receptor** con el interruptor y acepta el permiso del micrófono.
2. Escribe un mensaje en el **emisor** y pulsa "Transmitir mensaje".
3. Acerca los dispositivos o deja que el sonido llegue al micrófono. El mensaje aparece en "Mensaje recibido".

Para probar entre dos dispositivos distintos, la página debe servirse por **HTTPS** (por ejemplo, desplegada en Vercel), porque los navegadores solo permiten el micrófono en `localhost` o en conexiones seguras.

## Ajustes

En `src/app/lib/fsk.js`:

| Constante | Valor | Efecto |
|-----------|-------|--------|
| `BIT_MS`  | 40    | Duración de cada bit. Súbela a 60 u 80 si hay eco o ruido; la transmisión será más lenta pero más fiable. |
| `F0`, `F1`| 1200, 2200 | Frecuencias de los bits 0 y 1. |

## Limitaciones

- La velocidad es de unos 25 bits por segundo, así que un mensaje de 100 caracteres tarda alrededor de 35 segundos.
- El ruido ambiente, el eco y los parlantes de baja calidad pueden dañar la señal. Usa un ambiente tranquilo y volumen medio-alto.
- Los auriculares impiden que el micrófono capte el sonido del emisor.
- El receptor usa `ScriptProcessorNode`, que está en desuso. Una mejora futura es migrar a `AudioWorklet`.

## Próximos pasos

- [ ] Migrar el receptor a `AudioWorklet`.
- [ ] Indicador de nivel de señal y de calidad de la recepción.
- [ ] Velocidad de transmisión configurable desde la interfaz.
- [ ] Corrección de errores para recuperar mensajes dañados.

## Contexto académico

Proyecto desarrollado en la Universidad de la Costa (CUC).

## Autor

**Isabella Parra Jessurum** — [GitHub](https://github.com/imay2byte)

## Licencia

Distribuido bajo la licencia MIT. Consulta el archivo `LICENSE` para más información.
