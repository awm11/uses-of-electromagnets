import React, { useEffect, useRef, useState } from "react";
import Solenoid from "./solenoid.jsx";
import magneticFieldLines from "./magneticFieldLines.png";

export function DoorLockPreview() {
  const [switchClosed, setSwitchClosed] = useState(false);
  const [currentOn, setCurrentOn] = useState(false);
  const [boltAttracted, setBoltAttracted] = useState(false);

  useEffect(() => {
    let timers = [];

    const clearTimers = () => {
      timers.forEach((timer) => clearTimeout(timer));
      timers = [];
    };

    const runSequence = () => {
      clearTimers();

      setSwitchClosed(false);
      setCurrentOn(false);
      setBoltAttracted(false);

      const t1 = setTimeout(() => {
        setSwitchClosed(true);
      }, 3000);

      const t2 = setTimeout(() => {
        setCurrentOn(true);
      }, 3500);

      const t3 = setTimeout(() => {
        setBoltAttracted(true);
      }, 4300);

      const t4 = setTimeout(() => {
        setSwitchClosed(false);
        setCurrentOn(false);
        setBoltAttracted(false);
      }, 7300);

      timers = [t1, t2, t3, t4];
    };

    runSequence();

    const interval = setInterval(runSequence, 10300);

    return () => {
      clearTimers();
      clearInterval(interval);
    };
  }, []);

  return (
    <div className="doorLockPreviewOnly">
      <style>{`
        .doorLockPreviewOnly {
          width: 100% !important;
          height: 100% !important;
          transform: none !important;
          display: flex;
          align-items: center;
          justify-content: center;
          overflow: hidden;
        }

        .doorLockPreviewOnly svg {
          display: block;
          width: 100%;
          height: 100%;
          max-width: none;
          max-height: none;
        }

        .door-lock-preview-flow {
          animation: doorLockPreviewDash 2.2s linear infinite;
        }

        @keyframes doorLockPreviewDash {
          to {
            stroke-dashoffset: -36px;
          }
        }
      `}</style>

      <svg
        viewBox="0 0 900 500"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <linearGradient
            id="previewIronBoltGradient"
            x1="0"
            y1="0"
            x2="0"
            y2="1"
          >
            <stop offset="0%" stopColor="#4b5563" />
            <stop offset="18%" stopColor="#9ca3af" />
            <stop offset="42%" stopColor="#d1d5db" />
            <stop offset="58%" stopColor="#9ca3af" />
            <stop offset="82%" stopColor="#6b7280" />
            <stop offset="100%" stopColor="#374151" />
          </linearGradient>

          <linearGradient
            id="previewIronBoltEndGradient"
            x1="0"
            y1="0"
            x2="1"
            y2="0"
          >
            <stop offset="0%" stopColor="#374151" />
            <stop offset="45%" stopColor="#9ca3af" />
            <stop offset="55%" stopColor="#d1d5db" />
            <stop offset="100%" stopColor="#4b5563" />
          </linearGradient>
        </defs>

        {/* Door */}
        <rect
          x="10"
          y="0"
          width="120"
          height="590"
          fill="#b5602f"
        />

        <rect
          x="68"
          y="277"
          width="62"
          height="40"
          fill="#5a2c12"
        />

        {/* Door frame */}
        <rect
          x="150"
          y="0"
          width="34"
          height="300"
          fill="#7a3a1d"
        />

        <rect
          x="150"
          y="318"
          width="34"
          height="300"
          fill="#7a3a1d"
        />

        {/* Spring */}
        <g
          style={{
            transformOrigin: "184px 336px",
            transform: `scaleX(${boltAttracted ? 1.84 : 1})`,
            transition:
              "transform 1.5s cubic-bezier(.34,1.3,.4,1)",
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

        {/* Circuit wire */}
        <path
          d="M583,241 V50 H730"
          fill="none"
          stroke="#111827"
          strokeWidth="4"
        />

        {currentOn && (
          <path
            d="M583,241 V50 H730"
            fill="none"
            stroke="#6b7280"
            strokeWidth="3"
            strokeLinecap="round"
            strokeDasharray="9 15"
            className="door-lock-preview-flow"
          />
        )}

        {/* Battery */}
        <g transform="translate(730,50)">
          <text
            x="-14"
            y="-8"
            fontSize="20"
            fill="#111827"
          >
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

          <text
            x="34"
            y="-8"
            fontSize="14"
            fill="#111827"
          >
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

        {/* Battery to switch */}
        <path
          d="M764,50 H812 V150"
          fill="none"
          stroke="#111827"
          strokeWidth="4"
        />

        {currentOn && (
          <path
            d="M764,50 H812 V150"
            fill="none"
            stroke="#6b7280"
            strokeWidth="3"
            strokeLinecap="round"
            strokeDasharray="9 15"
            className="door-lock-preview-flow"
          />
        )}

        {/* Switch */}
        <circle
          cx="812"
          cy="150"
          r="5"
          fill="#111827"
        />

        <circle
          cx="812"
          cy="200"
          r="5"
          fill="#111827"
        />

        <g
          style={{
            transformOrigin: "812px 150px",
            transform: switchClosed
              ? "rotate(0deg)"
              : "rotate(-31deg)",
            transition: "transform 1.2s ease",
          }}
        >
          <line
            x1="812"
            y1="150"
            x2="812"
            y2="200"
            stroke="#111827"
            strokeWidth="4"
          />
        </g>

        {/* Switch to solenoid */}
        <path
          d="M812,200 V230 H701 V240"
          fill="none"
          stroke="#111827"
          strokeWidth="4"
        />

        {currentOn && (
          <path
            d="M812,200 V230 H701 V240"
            fill="none"
            stroke="#6b7280"
            strokeWidth="3"
            strokeLinecap="round"
            strokeDasharray="9 15"
            className="door-lock-preview-flow"
          />
        )}

        {/* Magnetic field */}
        <image
          href={magneticFieldLines}
          x="490"
          y="205"
          width="315"
          height="185"
          preserveAspectRatio="none"
          style={{
            opacity: currentOn ? 0.45 : 0,
            transition: "opacity 0.1s ease",
            pointerEvents: "none",
          }}
        />

        {/* Solenoid */}
        <Solenoid
          on={currentOn}
          reverse={true}
          corner={{ x: 747.5, y: 295 }}
          orientation={0}
          mirror={true}
          scale={0.7}
          turns={10}
        />

        {/* Solenoid label */}
        <text
          x="620"
          y="380"
          fontSize="18"
          fill="#111827"
        >
          Solenoid
        </text>

        {/* Current indicator */}
        {currentOn && (
          <text
            x="660"
            y="130"
            fontSize="22"
            fill="#d97706"
            fontWeight="600"
          >
            Current flowing!
          </text>
        )}

        {/* Iron bolt */}
        <g
          style={{
            transform: `translateX(${boltAttracted ? 70 : 0}px)`,
            transition:
              "transform 1.5s cubic-bezier(.34,1.3,.4,1)",
          }}
        >
          <rect
            x="70"
            y="280"
            width="465"
            height="34"
            rx="3"
            fill="url(#previewIronBoltGradient)"
            stroke="#374151"
            strokeWidth="1.5"
          />

          <rect
            x="73"
            y="283"
            width="459"
            height="7"
            rx="2"
            fill="#ffffff"
            opacity="0.16"
          />

          <rect
            x="73"
            y="307"
            width="459"
            height="4"
            rx="1"
            fill="#1f2937"
            opacity="0.28"
          />

          <rect
            x="253"
            y="314"
            width="24"
            height="30"
            rx="2"
            fill="url(#previewIronBoltEndGradient)"
            stroke="#374151"
            strokeWidth="1"
          />
        </g>
      </svg>
    </div>
  );
}

export default function DoorLock({ onBack }) {
  const [switchClosed, setSwitchClosed] = useState(false);
  const [currentOn, setCurrentOn] = useState(false);
  const [boltAttracted, setBoltAttracted] = useState(false);
  const [labelsOn, setLabelsOn] = useState(false);
  const [animating, setAnimating] = useState(false);

  const timersRef = useRef([]);

  const clearTimers = () => {
    timersRef.current.forEach((timer) => {
      clearTimeout(timer);
    });

    timersRef.current = [];
  };

  useEffect(() => {
    return () => {
      clearTimers();
    };
  }, []);

  const handleToggle = () => {
    if (animating) return;

    clearTimers();
    setAnimating(true);

    if (!switchClosed) {
      setSwitchClosed(true);

      const currentTimer = setTimeout(() => {
        setCurrentOn(true);
      }, 500);

      const boltTimer = setTimeout(() => {
        setBoltAttracted(true);
      }, 1300);

      const labelTimer = setTimeout(() => {
        setLabelsOn(true);
        setAnimating(false);
        timersRef.current = [];
      }, 2100);

      timersRef.current = [
        currentTimer,
        boltTimer,
        labelTimer,
      ];
    } else {
      setSwitchClosed(false);
      setCurrentOn(false);
      setBoltAttracted(false);

      const labelTimer = setTimeout(() => {
        setLabelsOn(false);
        setAnimating(false);
        timersRef.current = [];
      }, 1500);

      timersRef.current = [labelTimer];
    }
  };

  return (
    <div style={styles.card}>
      {onBack && (
        <div style={styles.simHeaderRow}>
          <button
            style={styles.backButton}
            onClick={onBack}
            disabled={animating}
          >
            ← Back
          </button>
        </div>
      )}

      <header style={styles.header}>
        <div style={styles.eyebrow}>
          ELECTROMAGNETISM • 01
        </div>

        <h1 style={styles.title}>
          Electromagnetic Door Lock
        </h1>

        <p style={styles.subtitle}>
          Close the circuit to energise the electromagnet
          and attract the iron bolt.
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

          <defs>
            <linearGradient
              id="ironBoltGradient"
              x1="0"
              y1="0"
              x2="0"
              y2="1"
            >
              <stop offset="0%" stopColor="#4b5563" />
              <stop offset="18%" stopColor="#9ca3af" />
              <stop offset="42%" stopColor="#d1d5db" />
              <stop offset="58%" stopColor="#9ca3af" />
              <stop offset="82%" stopColor="#6b7280" />
              <stop offset="100%" stopColor="#374151" />
            </linearGradient>

            <linearGradient
              id="ironBoltEndGradient"
              x1="0"
              y1="0"
              x2="1"
              y2="0"
            >
              <stop offset="0%" stopColor="#374151" />
              <stop offset="45%" stopColor="#9ca3af" />
              <stop offset="55%" stopColor="#d1d5db" />
              <stop offset="100%" stopColor="#4b5563" />
            </linearGradient>
          </defs>

          {/* Door */}
          <rect
            x="0"
            y="40"
            width="135"
            height="590"
            fill="#b5602f"
          />

          <rect
            x="68"
            y="277"
            width="67"
            height="40"
            fill="#5a2c12"
          />

          {/* Door frame */}
          <rect
            x="150"
            y="20"
            width="34"
            height="300"
            fill="#7a3a1d"
          />

          <rect
            x="150"
            y="318"
            width="34"
            height="300"
            fill="#7a3a1d"
          />

          <rect
            x="0"
            y="-5"
            width="184"
            height="34"
            fill="#7a3a1d"
          />

          {/* Spring */}
          <g
            style={{
              transformOrigin: "184px 336px",
              transform: `scaleX(${
                boltAttracted ? 1.84 : 1
              })`,
              transition:
                "transform 1.5s cubic-bezier(.34,1.3,.4,1)",
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

          {/* Solenoid */}
          <Solenoid
            on={currentOn}
            reverse={true}
            corner={{ x: 747.5, y: 295 }}
            orientation={0}
            mirror={true}
            scale={0.7}
            turns={10}
          />

          {/* Magnetic field */}
          <image
            href={magneticFieldLines}
            x="490"
            y="205"
            width="315"
            height="185"
            preserveAspectRatio="none"
            style={{
              opacity: currentOn ? 0.45 : 0,
              transition: "opacity 0.1s ease",
              pointerEvents: "none",
            }}
          />

          {/* Iron bolt */}
          <g
            style={{
              transform: `translateX(${
                boltAttracted ? 70 : 0
              }px)`,
              transition:
                "transform 1.5s cubic-bezier(.34,1.3,.4,1)",
            }}
          >
            <rect
              x="70"
              y="280"
              width="425"
              height="34"
              rx="3"
              fill="url(#ironBoltGradient)"
              stroke="#374151"
              strokeWidth="1.5"
            />

            <rect
              x="73"
              y="283"
              width="419"
              height="7"
              rx="2"
              fill="#ffffff"
              opacity="0.16"
            />

            <rect
              x="73"
              y="307"
              width="419"
              height="4"
              rx="1"
              fill="#1f2937"
              opacity="0.28"
            />

            <rect
              x="253"
              y="314"
              width="24"
              height="30"
              rx="2"
              fill="url(#ironBoltEndGradient)"
              stroke="#374151"
              strokeWidth="1"
            />
          </g>

          {/* Circuit: solenoid to battery */}
          <path
            d="M583,241 V50 H730"
            fill="none"
            stroke="#111827"
            strokeWidth="4"
          />

          {currentOn && (
            <path
              d="M583,241 V50 H730"
              fill="none"
              stroke="#6b7280"
              strokeWidth="3"
              strokeLinecap="round"
              strokeDasharray="9 15"
              className="door-lock-flow"
            />
          )}

          {/* Battery */}
          <g transform="translate(730,50)">
            <text
              x="-14"
              y="-8"
              fontSize="20"
              fill="#111827"
            >
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

            <text
              x="34"
              y="-8"
              fontSize="14"
              fill="#111827"
            >
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

          {/* Battery to switch */}
          <path
            d="M764,50 H812 V150"
            fill="none"
            stroke="#111827"
            strokeWidth="4"
          />

          {currentOn && (
            <path
              d="M764,50 H812 V150"
              fill="none"
              stroke="#6b7280"
              strokeWidth="3"
              strokeLinecap="round"
              strokeDasharray="9 15"
              className="door-lock-flow"
            />
          )}

          {/* Switch contacts */}
          <circle
            cx="812"
            cy="150"
            r="5"
            fill="#111827"
          />

          <circle
            cx="812"
            cy="200"
            r="5"
            fill="#111827"
          />

          {/* Switch lever */}
          <g
            style={{
              transformOrigin: "812px 150px",
              transform: switchClosed
                ? "rotate(0deg)"
                : "rotate(-31deg)",
              transition: "transform 1.2s ease",
            }}
          >
            <line
              x1="812"
              y1="150"
              x2="812"
              y2="200"
              stroke="#111827"
              strokeWidth="4"
            />
          </g>

          {/* Switch to solenoid */}
          <path
            d="M812,200 V230 H701 V240"
            fill="none"
            stroke="#111827"
            strokeWidth="4"
          />

          {currentOn && (
            <path
              d="M812,200 V230 H701 V240"
              fill="none"
              stroke="#6b7280"
              strokeWidth="3"
              strokeLinecap="round"
              strokeDasharray="9 15"
              className="door-lock-flow"
            />
          )}

          {/* Permanent labels */}
          <text
            x="30"
            y="220"
            fontSize="18"
            fill="#111827"
          >
            Door
          </text>

          <text
            x="150"
            y="185"
            fontSize="18"
            fill="#111827"
          >
            Door frame
          </text>

          <text
            x="360"
            y="270"
            fontSize="18"
            fill="#111827"
          >
            Iron bolt
          </text>

          <text
            x="620"
            y="380"
            fontSize="18"
            fill="#111827"
          >
            Solenoid
          </text>

          {/* Spring state */}
          <text
            x="220"
            y="400"
            fontSize="15"
            fill="#374151"
          >
            Spring is{" "}
            {boltAttracted ? "stretched" : "relaxed"}
          </text>

          {/* Current indicator */}
          {currentOn && (
            <text
              x="660"
              y="130"
              fontSize="22"
              fill="#d97706"
              fontWeight="600"
            >
              Current flowing!
            </text>
          )}

          {/* Explanation */}
          {currentOn && (
            <text
              x="535"
              y="420"
              fontSize="16"
              fill="#19743b"
              fontWeight="700"
            >
              Electromagnet attracts the iron bolt
            </text>
          )}
        </svg>
      </div>

      {/* Controls */}
      <div style={styles.controls}>
        <button
          style={{
            ...styles.switchBtn,
            opacity: animating ? 0.6 : 1,
            cursor: animating ? "default" : "pointer",
          }}
          onClick={handleToggle}
          aria-pressed={switchClosed}
          disabled={animating}
        >
          <span style={styles.switchVisual}>
            <span
              style={{
                ...styles.switchTrack,
                background: switchClosed
                  ? "#2d9b55"
                  : "#c7cdd4",
              }}
            >
              <span
                style={{
                  ...styles.switchKnob,
                  transform: switchClosed
                    ? "translateX(28px)"
                    : "translateX(0)",
                }}
              />
            </span>

            <span style={styles.switchLabels}>
              <span
                style={{
                  ...styles.switchState,
                  color: switchClosed
                    ? "#2d9b55"
                    : "#667085",
                }}
              >
                {switchClosed ? "CLOSED" : "OPEN"}
              </span>

              <span style={styles.switchAction}>
                {switchClosed
                  ? "Click to open circuit"
                  : "Click to close circuit"}
              </span>
            </span>
          </span>
        </button>

        <div style={styles.status}>
          <span
            style={{
              ...styles.dot,
              ...(labelsOn ? styles.dotOn : {}),
            }}
          />

          {labelsOn
            ? "Electromagnet energised • door unlocked"
            : "Electromagnet de-energised • door locked"}
        </div>
      </div>
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
    animation: doorLockDash 2.2s linear infinite;
  }
`;

const styles = {
  card: {
    width: "100%",
    maxWidth: "960px",
    margin: "0 auto",
    background: "#fff",
    border: "1px solid #d9dee4",
    borderRadius: "18px",
    boxShadow: "0 10px 28px rgba(31, 41, 55, .07)",
    overflow: "hidden",
  },

  simHeaderRow: {
    padding: "16px 20px 0",
  },

  backButton: {
    border: "none",
    background: "transparent",
    color: "#59636f",
    fontSize: "14px",
    fontWeight: 500,
    cursor: "pointer",
    padding: "6px 8px",
    borderRadius: "8px",
  },

  header: {
    padding: "18px 24px 8px",
  },

  eyebrow: {
    marginBottom: "4px",
    color: "#3867a8",
    fontSize: "12px",
    fontWeight: 800,
    letterSpacing: ".12em",
    textTransform: "uppercase",
  },

  title: {
    margin: 0,
    color: "#202020",
    fontSize: "clamp(28px, 4vw, 40px)",
    lineHeight: 1.1,
    letterSpacing: "-.04em",
    fontWeight: 750,
  },

  subtitle: {
    maxWidth: "780px",
    margin: "8px 0 0",
    color: "#59636f",
    fontSize: "14px",
    lineHeight: 1.5,
  },

  stageWrap: {
    padding: "12px",
  },

  svg: {
    display: "block",
    width: "100%",
    height: "auto",
  },

  controls: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: "18px",
    padding: "16px 18px",
    borderTop: "1px solid #e2e6ea",
    background: "#fafbfc",
  },

  switchBtn: {
    display: "flex",
    alignItems: "center",
    border: 0,
    background: "transparent",
    color: "#202020",
    cursor: "pointer",
    padding: "2px 0",
    textAlign: "left",
  },

  switchVisual: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
  },

  switchTrack: {
    position: "relative",
    display: "block",
    width: "58px",
    height: "32px",
    padding: "3px",
    borderRadius: "999px",
    boxShadow:
      "inset 0 1px 3px rgba(15, 23, 42, .20)",
    transition:
      "background 1.2s ease, box-shadow .2s ease",
  },

  switchKnob: {
    display: "block",
    width: "26px",
    height: "26px",
    borderRadius: "50%",
    background: "#ffffff",
    border: "1px solid rgba(15, 23, 42, .08)",
    boxShadow:
      "0 2px 5px rgba(15, 23, 42, .24)",
    transition:
      "transform 1.2s cubic-bezier(.4, 0, .2, 1)",
  },

  switchLabels: {
    display: "flex",
    flexDirection: "column",
    gap: "2px",
  },

  switchState: {
    fontSize: "12px",
    fontWeight: 850,
    letterSpacing: ".1em",
    lineHeight: 1.1,
    transition: "color .3s ease",
  },

  switchAction: {
    color: "#667085",
    fontSize: "12px",
    fontWeight: 500,
    lineHeight: 1.3,
  },

  status: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    color: "#59636f",
    fontSize: "14px",
    textAlign: "right",
  },

  dot: {
    width: "9px",
    height: "9px",
    borderRadius: "50%",
    background: "#a7afb8",
    flex: "0 0 auto",
  },

  dotOn: {
    background: "#2d9b55",
    boxShadow: "0 0 0 4px #dff3e6",
  },
};