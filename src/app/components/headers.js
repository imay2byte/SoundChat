import Link from "next/link";

function Logo() {
  return (
    <span className="brand-icon" aria-hidden="true">
      <svg viewBox="0 0 24 24" width="22" height="22" fill="none">
        <defs>
          <linearGradient
            id="logo-wave"
            x1="2"
            y1="12"
            x2="22"
            y2="12"
            gradientUnits="userSpaceOnUse"
          >
            <stop stopColor="#60A5FA" />
            <stop offset="1" stopColor="#A78BFA" />
          </linearGradient>
        </defs>
        <path
          d="M2 14c2.5 0 2.5-5 5-5s2.5 8 5 8 2.5-8 5-8 2.5 5 5 5"
          stroke="url(#logo-wave)"
          strokeWidth="2.4"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </span>
  );
}

export default function Header() {
  return (
    <header className="header">
      <Link className="brand" href="/" aria-label="SoundChat, inicio">
        <Logo />
        <span>SoundChat</span>
      </Link>

      <div className="system-state">
        <span className="led" />
        <span>AUDIO DATA TRANSFER</span>
      </div>

      <span className="version">SISTEMA / 01.0</span>
    </header>
  );
}