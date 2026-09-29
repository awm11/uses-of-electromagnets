import React, { useEffect, useRef, useState } from "react";
import Solenoid from "./solenoid";
import magneticFieldLines from "./magneticFieldLines.png";

const C = {
  ink: "#202020",
  blue: "#2166d1",
  blueLight: "#eaf3ff",
  green: "#2d9b55",
  greenLight: "#eaf7ef",
  muted: "#59636f",
  copper: "#b86f32",
  metal: "#8f969d",
  metalDark: "#555c63",
};

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
          overflow: visible;
        }

        .doorLockPreviewOnly > svg {
          display: block;
          width: 100%;
          height: 100%;
          max-width: none;
          max-height: none;
        }

        .door-lock-preview-flow {
          animation: doorLockPreviewDash 0.666667s linear infinite;
        }

        @keyframes doorLockPreviewDash {
          from {
            stroke-dashoffset: 0;
          }

          to {
            stroke-dashoffset: -24px;
          }
        }
      `}</style>

      <svg
        viewBox="0 0 900 500"
        role="img"
        aria-label="Door lock preview"
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

        {/* Main circuit */}
        <path
          d="M583,241 V50 H730"
          fill="none"
          stroke={C.ink}
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
            fill={C.ink}
          >
            +
          </text>

          <line
            x1="0"
            y1="-20"
            x2="0"
            y2="20"
            stroke={C.ink}
            strokeWidth="5"
          />

          <text
            x="34"
            y="-8"
            fontSize="14"
            fill={C.ink}
          >
            –
          </text>

          <line
            x1="34"
            y1="-10"
            x2="34"
            y2="10"
            stroke={C.ink}
            strokeWidth="2.5"
          />
        </g>

        {/* Battery to switch */}
        <path
          d="M764,50 H812 V150"
          fill="none"
          stroke={C.ink}
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
          fill={C.ink}
        />

        <circle
          cx="812"
          cy="200"
          r="5"
          fill={C.ink}
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
            stroke={C.ink}
            strokeWidth="4"
          />
        </g>

        {/* Switch to solenoid */}
        <path
          d="M812,200 V230 H701 V240"
          fill="none"
          stroke={C.ink}
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
            width="425"
            height="34"
            rx="3"
            fill="url(#previewIronBoltGradient)"
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
    <main className="page">
      <style>{`
        * {
          box-sizing: border-box;
        }
        html,
        body,
        #root {
          margin: 0 !important;
          width: 100%;
          min-height: 100%;
          background: #f3f5f7 !important;
        }

        body {
          overflow-x: hidden;
        }


        .page {
          min-height: 100vh;
          padding: 24px;
          background: #f3f5f7;
          color: #202020;
          font-family:
            Inter,
            ui-sans-serif,
            system-ui,
            -apple-system,
            BlinkMacSystemFont,
            "Segoe UI",
            sans-serif;
        }

        .shell {
          max-width: 1160px;
          margin: 0 auto;
        }

        .heading {
          margin-bottom: 18px;
        }

        .eyebrow {
          font-size: 12px;
          font-weight: 800;
          letter-spacing: .12em;
          text-transform: uppercase;
          color: #3867a8;
          margin-bottom: 4px;
        }

        .heading h1 {
          margin: 0;
          font-size: clamp(28px, 4vw, 40px);
          line-height: 1.1;
          letter-spacing: -.04em;
        }

        .intro {
          max-width: 780px;
          margin: 8px 0 0;
          color: ${C.muted};
          line-height: 1.5;
          font-size: 14px;
        }

        .card {
          background: #fff;
          border: 1px solid #d9dee4;
          border-radius: 18px;
          box-shadow: 0 10px 28px rgba(31, 41, 55, .07);
          overflow: hidden;
        }

        .backRow {
          padding: 14px 18px 0;
        }

        .backButton {
          border: 0;
          background: transparent;
          color: ${C.muted};
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          padding: 4px 0;
        }

        .backButton:disabled {
          cursor: default;
          opacity: .55;
        }

        .stage {
          padding: 12px;
        }

        .stage svg {
          display: block;
          width: 100%;
          height: auto;
        }

        .controls {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 18px;
          padding: 14px 18px;
          border-top: 1px solid #e2e6ea;
          background: #fafbfc;
        }

        .switchBtn {
          display: flex;
          align-items: center;
          gap: 11px;
          border: 0;
          background: transparent;
          color: ${C.ink};
          font-weight: 800;
          cursor: pointer;
          padding: 4px 0;
        }

        .switchBtn:disabled {
          cursor: default;
          opacity: .6;
        }

        .toggle {
          width: 54px;
          height: 30px;
          border-radius: 99px;
          padding: 3px;
          background: #c6ccd3;
          transition: .25s ease;
        }

        .toggle.on {
          background: #2d9b55;
        }

        .knob {
          width: 24px;
          height: 24px;
          border-radius: 50%;
          background: #fff;
          box-shadow: 0 1px 4px rgba(0, 0, 0, .25);
          transition: .25s ease;
        }

        .toggle.on .knob {
          transform: translateX(24px);
        }

        .status {
          display: flex;
          align-items: center;
          gap: 8px;
          color: ${C.muted};
          font-size: 14px;
          text-align: right;
        }

        .dot {
          width: 9px;
          height: 9px;
          border-radius: 50%;
          background: #a7afb8;
          flex: 0 0 auto;
        }

        .dot.on {
          background: #2d9b55;
          box-shadow: 0 0 0 4px #dff3e6;
        }

        .lesson {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 14px;
          margin-top: 14px;
        }

        .lessonBox {
          background: #fff;
          border: 1px solid #dfe4e8;
          border-radius: 14px;
          padding: 16px 18px;
        }

        .lessonBox h2 {
          margin: 0 0 7px;
          font-size: 15px;
        }

        .lessonBox p {
          margin: 0;
          color: ${C.muted};
          line-height: 1.5;
          font-size: 14px;
        }

        .onText {
          color: #19743b;
          font-weight: 800;
        }

        .offText {
          color: #9b5d13;
          font-weight: 800;
        }

        @media (max-width: 760px) {
          .page {
            padding: 10px;
          }

          .controls {
            align-items: flex-start;
            flex-direction: column;
          }

          .status {
            text-align: left;
          }

          .lesson {
            grid-template-columns: 1fr;
          }
        }
      `}</style>

      <div className="shell">
        <header className="heading">
          <div className="eyebrow">
            Electromagnetism • 01
          </div>

          <h1>Electromagnetic Door Lock</h1>

          <p className="intro">
            Close the circuit to energise the electromagnet
            and attract the iron bolt, unlocking the door.
          </p>
        </header>

        <section className="card">
          {onBack && (
            <div className="backRow">
              <button
                className="backButton"
                onClick={onBack}
                disabled={animating}
              >
                ← Back
              </button>
            </div>
          )}

          <div className="stage">
            <svg
              viewBox="0 0 900 500"
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

              {/* Main circuit */}
              <path
                d="M583,241 V50 H730"
                fill="none"
                stroke={C.ink}
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
                  fill={C.ink}
                >
                  +
                </text>

                <line
                  x1="0"
                  y1="-20"
                  x2="0"
                  y2="20"
                  stroke={C.ink}
                  strokeWidth="5"
                />

                <text
                  x="34"
                  y="-8"
                  fontSize="14"
                  fill={C.ink}
                >
                  –
                </text>

                <line
                  x1="34"
                  y1="-10"
                  x2="34"
                  y2="10"
                  stroke={C.ink}
                  strokeWidth="2.5"
                />
              </g>

              {/* Battery to switch */}
              <path
                d="M764,50 H812 V150"
                fill="none"
                stroke={C.ink}
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

              {/* Switch */}
              <circle
                cx="812"
                cy="150"
                r="5"
                fill={C.ink}
              />

              <circle
                cx="812"
                cy="200"
                r="5"
                fill={C.ink}
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
                  stroke={C.ink}
                  strokeWidth="4"
                />
              </g>

              {/* Switch to solenoid */}
              <path
                d="M812,200 V230 H701 V240"
                fill="none"
                stroke={C.ink}
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

              {/* Labels */}
              <text
                x="30"
                y="220"
                fontSize="18"
                fill={C.ink}
              >
                Door
              </text>

              <text
                x="150"
                y="185"
                fontSize="18"
                fill={C.ink}
              >
                Door frame
              </text>

              <text
                x="360"
                y="270"
                fontSize="18"
                fill={C.ink}
              >
                Iron bolt
              </text>

              <text
                x="620"
                y="380"
                fontSize="18"
                fill={C.ink}
              >
                Solenoid
              </text>

              {/* Spring state */}
              <text
                x="220"
                y="400"
                fontSize="15"
                fill={C.muted}
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

          <div className="controls">
            <button
              className="switchBtn"
              onClick={handleToggle}
              aria-pressed={switchClosed}
              disabled={animating}
            >
              <span
                className={
                  "toggle " + (switchClosed ? "on" : "")
                }
              >
                <span className="knob" />
              </span>

              {switchClosed
                ? "Switch closed"
                : "Switch open"}
            </button>

            <div className="status">
              <span
                className={
                  "dot " + (labelsOn ? "on" : "")
                }
              />

              {labelsOn
                ? "Electromagnet energised • door unlocked"
                : "Electromagnet de-energised • door locked"}
            </div>
          </div>
        </section>

        <section className="lesson">
          <div className="lessonBox">
            <h2>1. The control circuit</h2>

            <p>
              {currentOn ? (
                <>
                  The switch is closed, so current flows
                  through the coil. The coil becomes an{" "}
                  <span className="onText">
                    electromagnet
                  </span>
                  .
                </>
              ) : (
                <>
                  Open the switch and current stops flowing
                  through the coil. The electromagnet is then{" "}
                  <span className="offText">off</span>.
                </>
              )}
            </p>
          </div>

          <div className="lessonBox">
            <h2>2. The locking mechanism</h2>

            <p>
              {boltAttracted ? (
                <>
                  The electromagnet attracts the iron bolt,
                  stretching the spring and moving the bolt
                  away from the door frame. The door is{" "}
                  <span className="onText">unlocked</span>.
                </>
              ) : (
                <>
                  The spring holds the iron bolt against the
                  door frame, keeping the door{" "}
                  <span className="offText">locked</span>.
                </>
              )}
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}

const keyframes = `
  @keyframes doorLockDash {
    from {
      stroke-dashoffset: 0;
    }

    to {
      stroke-dashoffset: -24px;
    }
  }

  .door-lock-flow {
    stroke-dasharray: 9 15;
    stroke-dashoffset: 0;
    animation: doorLockDash 0.666667s linear infinite;
  }
`;