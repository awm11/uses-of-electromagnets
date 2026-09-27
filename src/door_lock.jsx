import React, { useState } from "react";

// Electromagnetic door-lock geometry
const LOOP_CENTERS = [655, 694, 733, 772];
const LOOP_RX = 21;
const LOOP_RY = 62;
const COIL_Y = 297;
const LEFT_TERMINAL = 623;
const RIGHT_TERMINAL = 793;

function loopSegment(cx, dir) {
  const a = cx - dir * LOOP_RX * 0.2;
  const b = cx + dir * LOOP_RX * 0.2;
  return `L${a},${COIL_Y} A${LOOP_RX},${LOOP_RY} 0 1 1 ${b},${COIL_Y} `;
}

const COIL_PATH =
  `M${LEFT_TERMINAL},${COIL_Y} ` +
  LOOP_CENTERS.map((cx) => loopSegment(cx, 1)).join("") +
  `L${RIGHT_TERMINAL},${COIL_Y}`;

// Magnetic field lines
const FIELD_CENTER_X = (LEFT_TERMINAL + RIGHT_TERMINAL) / 2;
const FIELD_OFFSETS = [-58, -36, -14, 14, 36, 58];
const FIELD_SPREAD = 2.5;

function quadPoint(p0, p1, p2, t) {
  const mt = 1 - t;
  return {
    x: mt * mt * p0.x + 2 * mt * t * p1.x + t * t * p2.x,
    y: mt * mt * p0.y + 2 * mt * t * p1.y + t * t * p2.y,
  };
}

function quadTangentAngle(p0, p1, p2, t) {
  const mt = 1 - t;
  const dx =
    2 * mt * (p1.x - p0.x) +
    2 * t * (p2.x - p1.x);
  const dy =
    2 * mt * (p1.y - p0.y) +
    2 * t * (p2.y - p1.y);
  return (Math.atan2(dy, dx) * 180) / Math.PI;
}

function buildFieldLine(offset) {
  const p0 = { x: RIGHT_TERMINAL, y: COIL_Y + offset };
  const p1 = {
    x: FIELD_CENTER_X,
    y: COIL_Y + offset * FIELD_SPREAD,
  };
  const p2 = { x: LEFT_TERMINAL, y: COIL_Y + offset };

  const d = `M${p0.x},${p0.y} Q${p1.x},${p1.y} ${p2.x},${p2.y}`;

  const arrows = [0.15, 0.85].map((t) => ({
    ...quadPoint(p0, p1, p2, t),
    angle: quadTangentAngle(p0, p1, p2, t),
  }));

  return { d, arrows };
}

const FIELD_LINES = FIELD_OFFSETS.map(buildFieldLine);

export default function DoorLock({ onBack }) {
  const [isOn, setIsOn] = useState(false);

  return (
    <div style={styles.card}>
      {onBack && (
        <div style={styles.simHeaderRow}>
          <button style={styles.backButton} onClick={onBack}>
            ← Back
          </button>
        </div>
      )}

      <header style={styles.header}>
        <h1 style={styles.title}>Electromagnetic Door Lock</h1>
        <p style={styles.subtitle}>
          Flip the switch to close the circuit and watch the electromagnet pull
          the iron bolt.
        </p>
      </header>

      <div style={styles.stageWrap}>
        <svg
          viewBox="0 0 900 500"
          style={styles.svg}
          role="img"
          aria-label="Interactive electromagnetic door lock diagram"
        >
          <style>{keyframes}</style>

          {/* Door */}
          <rect x="10" y="230" width="120" height="190" fill="#b5602f" />
          <rect x="68" y="277" width="64" height="40" fill="#5a2c12" />

          {/* Door frame */}
          <rect x="150" y="195" width="34" height="81" fill="#7a3a1d" />
          <rect x="150" y="318" width="34" height="97" fill="#7a3a1d" />

          {/* Iron bolt */}
          <g
            style={{
              transform: `translateX(${isOn ? 70 : 0}px)`,
              transition: "transform 0.7s cubic-bezier(.34,1.3,.4,1)",
            }}
          >
            <rect
              x="70"
              y="280"
              width="530"
              height="34"
              rx="3"
              fill={isOn ? "#94a3b8" : "#8a8f98"}
              stroke="#4b5563"
              strokeWidth="1.5"
            />
            <rect
              x="253"
              y="314"
              width="24"
              height="30"
              fill="#6b7280"
            />
          </g>

          {/* Spring */}
          <g
            style={{
              transformOrigin: "184px 336px",
              transform: `scaleX(${isOn ? 1.84 : 1})`,
              transition: "transform 0.7s cubic-bezier(.34,1.3,.4,1)",
            }}
          >
            <path
              d="M184,336 q7,-16 14,0 t14,0 t14,0 t14,0 t14,0 t14,0"
              fill="none"
              stroke="#333"
              strokeWidth="5"
              strokeLinecap="round"
            />
          </g>

          {/* Magnetic field */}
          <g
            style={{
              opacity: isOn ? 1 : 0,
              transition: "opacity 0.5s ease",
            }}
          >
            {FIELD_LINES.map((line, i) => (
              <g key={i}>
                <path
                  d={line.d}
                  fill="none"
                  stroke="#9aa5b1"
                  strokeWidth="1.5"
                  strokeDasharray="1 7"
                  strokeLinecap="round"
                />

                {line.arrows.map((a, j) => (
                  <polygon
                    key={j}
                    points="-5,-4 5,0 -5,4"
                    fill="#9aa5b1"
                    transform={`translate(${a.x},${a.y}) rotate(${a.angle})`}
                  />
                ))}
              </g>
            ))}
          </g>

          {/* Electromagnet coil */}
          <path
            d={COIL_PATH}
            fill="none"
            stroke="#111827"
            strokeWidth="6"
            strokeLinecap="round"
          />

          {isOn && (
            <path
              d={COIL_PATH}
              fill="none"
              stroke="#6b7280"
              strokeWidth="3.5"
              strokeLinecap="round"
              strokeDasharray="9 15"
              className="door-lock-flow"
            />
          )}

          {/* Circuit: left coil terminal -> battery */}
          <path
            d="M623,297 V70 H770"
            fill="none"
            stroke="#111827"
            strokeWidth="4"
          />

          {isOn && (
            <path
              d="M623,297 V70 H770"
              fill="none"
              stroke="#6b7280"
              strokeWidth="3"
              strokeLinecap="round"
              strokeDasharray="9 15"
              className="door-lock-flow"
            />
          )}

          {/* Battery */}
          <g transform="translate(770,50)">
            <text x="-14" y="-8" fontSize="20" fill="#111827">
              +
            </text>
            <line
              x1="0"
              y1="-20"
              x2="0"
              y2="20"
              stroke="#111827"
              strokeWidth="5"
            />

            <text x="34" y="-8" fontSize="14" fill="#111827">
              –
            </text>
            <line
              x1="34"
              y1="-10"
              x2="34"
              y2="10"
              stroke="#111827"
              strokeWidth="2.5"
            />
          </g>

          {/* Battery -> switch */}
          <path
            d="M804,70 H852"
            fill="none"
            stroke="#111827"
            strokeWidth="4"
          />

          {isOn && (
            <path
              d="M804,70 H852"
              fill="none"
              stroke="#6b7280"
              strokeWidth="3"
              strokeLinecap="round"
              strokeDasharray="9 15"
              className="door-lock-flow"
            />
          )}

          <path
            d="M852,70 V190"
            fill="none"
            stroke="#111827"
            strokeWidth="4"
          />

          {isOn && (
            <path
              d="M852,70 V190"
              fill="none"
              stroke="#6b7280"
              strokeWidth="3"
              strokeLinecap="round"
              strokeDasharray="9 15"
              className="door-lock-flow"
            />
          )}

          {/* Switch */}
          <circle cx="852" cy="190" r="5" fill="#111827" />
          <circle cx="852" cy="240" r="5" fill="#111827" />

          <line
            x1="852"
            y1="190"
            x2={isOn ? 852 : 882}
            y2={isOn ? 240 : 220}
            stroke="#111827"
            strokeWidth="4"
            style={{ transition: "all 0.4s ease" }}
          />

          {/* Switch -> right coil terminal */}
          <path
            d="M852,240 V297 H793"
            fill="none"
            stroke="#111827"
            strokeWidth="4"
          />

          {isOn && (
            <path
              d="M852,240 V297 H793"
              fill="none"
              stroke="#6b7280"
              strokeWidth="3"
              strokeLinecap="round"
              strokeDasharray="9 15"
              className="door-lock-flow"
            />
          )}

          {/* Labels */}
          <text x="30" y="220" fontSize="18" fill="#111827">
            Door
          </text>

          <text x="150" y="185" fontSize="18" fill="#111827">
            Door frame
          </text>

          <text x="360" y="270" fontSize="18" fill="#111827">
            Iron bolt
          </text>

          <text x="660" y="380" fontSize="18" fill="#111827">
            Coil
          </text>

          <text x="220" y="400" fontSize="15" fill="#374151">
            Spring is {isOn ? "stretched" : "relaxed"}
          </text>

          {isOn && (
            <text
              x="700"
              y="130"
              fontSize="22"
              fill="#d97706"
              fontWeight="600"
            >
              Current flowing!
            </text>
          )}
        </svg>
      </div>

      <div style={styles.controls}>
        <button
          onClick={() => setIsOn((v) => !v)}
          style={{
            ...styles.switchButton,
            background: isOn ? "#111827" : "#e5e7eb",
            color: isOn ? "#fff" : "#111827",
          }}
        >
          {isOn ? "Open switch" : "Close switch"}
        </button>

        <div style={styles.statusRow}>
          <StatusPill
            label="Circuit"
            value={isOn ? "Closed" : "Open"}
            on={isOn}
          />

          <StatusPill
            label="Door"
            value={isOn ? "Unlocked" : "Locked"}
            on={isOn}
          />
        </div>
      </div>
    </div>
  );
}

function StatusPill({ label, value, on }) {
  return (
    <div style={styles.pill}>
      <span style={styles.pillLabel}>{label}</span>

      <span
        style={{
          ...styles.pillValue,
          color: on ? "#d97706" : "#374151",
        }}
      >
        {value}
      </span>
    </div>
  );
}

const keyframes = `
  @keyframes doorLockDash {
    to {
      stroke-dashoffset: -36px;
    }
  }

  .door-lock-flow {
    animation: doorLockDash 1s linear infinite;
  }
`;

const styles = {
  card: {
    width: "100%",
    maxWidth: "960px",
    margin: "0 auto",
    background: "#ffffff",
    borderRadius: "16px",
    border: "1px solid #e5e7eb",
    boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
    overflow: "hidden",
  },

  simHeaderRow: {
    padding: "16px 20px 0",
  },

  backButton: {
    border: "none",
    background: "transparent",
    color: "#6b7280",
    fontSize: "14px",
    fontWeight: 500,
    cursor: "pointer",
    padding: "6px 8px",
    borderRadius: "8px",
  },

  header: {
    padding: "12px 32px 8px",
  },

  title: {
    margin: 0,
    fontSize: "24px",
    fontWeight: 600,
    color: "#111827",
  },

  subtitle: {
    margin: "6px 0 0",
    fontSize: "14px",
    color: "#6b7280",
    maxWidth: "540px",
  },

  stageWrap: {
    padding: "8px 16px",
  },

  svg: {
    width: "100%",
    height: "auto",
    display: "block",
  },

  controls: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    flexWrap: "wrap",
    gap: "16px",
    padding: "20px 32px 28px",
    borderTop: "1px solid #f0f0ef",
  },

  switchButton: {
    border: "none",
    borderRadius: "999px",
    padding: "12px 24px",
    fontSize: "14px",
    fontWeight: 600,
    cursor: "pointer",
    transition: "background 0.3s ease, color 0.3s ease",
  },

  statusRow: {
    display: "flex",
    gap: "20px",
  },

  pill: {
    display: "flex",
    flexDirection: "column",
    minWidth: "84px",
  },

  pillLabel: {
    fontSize: "11px",
    color: "#9ca3af",
    textTransform: "uppercase",
    letterSpacing: "0.04em",
  },

  pillValue: {
    fontSize: "15px",
    fontWeight: 600,
  },
};