import React, { useState } from "react";

const C = {
  ink: "#202020",
  blue: "#2166d1",
  blueLight: "#eaf3ff",
  red: "#d93a32",
  redLight: "#fff0ee",
  green: "#2d9b55",
  metal: "#8f969d",
  metalDark: "#555c63",
  muted: "#59636f",
  amber: "#d88924",
};

export default function CircuitBreaker() {
  const [overload, setOverload] = useState(false);
  const [resetting, setResetting] = useState(false);

  const tripped = overload && !resetting;

  const resetBreaker = () => {
    setResetting(true);

    setTimeout(() => {
      setResetting(false);
      setOverload(false);
    }, 450);
  };

  return (
    <main className="breakerPage">
      <style>{`
        * {
          box-sizing: border-box;
        }

        body {
          margin: 0;
          background: #f3f5f7;
          color: ${C.ink};
          font-family:
            Inter,
            ui-sans-serif,
            system-ui,
            -apple-system,
            BlinkMacSystemFont,
            "Segoe UI",
            sans-serif;
        }

        button {
          font: inherit;
        }

        .breakerPage {
          min-height: 100vh;
          padding: 24px;
        }

        .breakerShell {
          max-width: 1160px;
          margin: 0 auto;
        }

        .breakerHeading {
          margin-bottom: 18px;
        }

        .breakerEyebrow {
          font-size: 12px;
          font-weight: 800;
          letter-spacing: .12em;
          text-transform: uppercase;
          color: #3867a8;
          margin-bottom: 4px;
        }

        .breakerHeading h1 {
          margin: 0;
          font-size: clamp(28px, 4vw, 40px);
          letter-spacing: -.04em;
        }

        .breakerIntro {
          max-width: 780px;
          margin: 8px 0 0;
          color: ${C.muted};
          line-height: 1.5;
        }

        .breakerCard {
          background: #fff;
          border: 1px solid #d9dee4;
          border-radius: 18px;
          box-shadow: 0 10px 28px rgba(31, 41, 55, .07);
          overflow: hidden;
        }

        .breakerStage {
          padding: 12px;
        }

        .breakerStage svg {
          display: block;
          width: 100%;
          height: auto;
        }

        .breakerControls {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 18px;
          padding: 14px 18px;
          border-top: 1px solid #e2e6ea;
          background: #fafbfc;
        }

        .controlButtons {
          display: flex;
          align-items: center;
          gap: 10px;
          flex-wrap: wrap;
        }

        .controlButton {
          border: 0;
          border-radius: 9px;
          padding: 9px 15px;
          font-weight: 800;
          cursor: pointer;
          transition: transform .15s ease, opacity .15s ease;
        }

        .controlButton:hover {
          transform: translateY(-1px);
        }

        .overloadButton {
          background: ${C.red};
          color: #fff;
        }

        .resetButton {
          background: #e6eaee;
          color: ${C.ink};
        }

        .controlButton:disabled {
          opacity: .45;
          cursor: default;
          transform: none;
        }

        .breakerStatus {
          display: flex;
          align-items: center;
          gap: 8px;
          color: ${C.muted};
          font-size: 14px;
          text-align: right;
        }

        .statusDot {
          width: 9px;
          height: 9px;
          border-radius: 50%;
          background: #a7afb8;
        }

        .statusDot.on {
          background: ${C.green};
          box-shadow: 0 0 0 4px #dff3e6;
        }

        .statusDot.trip {
          background: ${C.red};
          box-shadow: 0 0 0 4px #fbe0dd;
        }

        .breakerLesson {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 14px;
          margin-top: 14px;
        }

        .breakerLessonBox {
          background: #fff;
          border: 1px solid #dfe4e8;
          border-radius: 14px;
          padding: 16px 18px;
        }

        .breakerLessonBox h2 {
          margin: 0 0 7px;
          font-size: 15px;
        }

        .breakerLessonBox p {
          margin: 0;
          color: ${C.muted};
          line-height: 1.5;
          font-size: 14px;
        }

        .greenText {
          color: #19743b;
          font-weight: 800;
        }

        .redText {
          color: #b52d28;
          font-weight: 800;
        }

        @media (max-width: 760px) {
          .breakerPage {
            padding: 10px;
          }

          .breakerControls {
            align-items: flex-start;
            flex-direction: column;
          }

          .breakerStatus {
            text-align: left;
          }

          .breakerLesson {
            grid-template-columns: 1fr;
          }
        }
      `}</style>

      <div className="breakerShell">
        <header className="breakerHeading">
          <div className="breakerEyebrow">
            Electrical Safety • 03
          </div>

          <h1>Circuit Breaker</h1>

          <p className="breakerIntro">
            A circuit breaker automatically opens a circuit when the
            current becomes too high. Simulate a normal circuit, create
            an overload, and reset the breaker.
          </p>
        </header>

        <section className="breakerCard">
          <div className="breakerStage">
            <BreakerDiagram
              tripped={tripped}
              resetting={resetting}
            />
          </div>

          <div className="breakerControls">
            <div className="controlButtons">
              <button
                className="controlButton overloadButton"
                onClick={() => setOverload(true)}
                disabled={tripped || resetting}
              >
                Create overload
              </button>

              <button
                className="controlButton resetButton"
                onClick={resetBreaker}
                disabled={!tripped || resetting}
              >
                Reset breaker
              </button>
            </div>

            <div className="breakerStatus">
              <span
                className={
                  "statusDot " +
                  (tripped ? "trip" : "on")
                }
              />

              {tripped
                ? "Breaker tripped • circuit OFF"
                : resetting
                  ? "Breaker resetting..."
                  : "Circuit protected • current flowing"}
            </div>
          </div>
        </section>

        <section className="breakerLesson">
          <div className="breakerLessonBox">
            <h2>1. Normal current</h2>

            <p>
              {tripped ? (
                <>
                  The breaker has opened the circuit, so{" "}
                  <span className="redText">
                    current cannot reach the appliance
                  </span>.
                </>
              ) : (
                <>
                  The current is within the safe range, so the breaker
                  stays closed and{" "}
                  <span className="greenText">
                    electricity flows normally
                  </span>.
                </>
              )}
            </p>
          </div>

          <div className="breakerLessonBox">
            <h2>2. Overload protection</h2>

            <p>
              An excessive current causes the breaker mechanism to
              trip. Opening the circuit stops the current and helps
              protect the wiring and appliance.
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}

function BreakerDiagram({ tripped, resetting }) {
  const circuitOn = !tripped;

  return (
    <svg
      viewBox="0 0 1100 600"
      role="img"
      aria-label="Interactive circuit breaker diagram"
    >
      <defs>
        <filter
          id="breakerShadow"
          x="-20%"
          y="-20%"
          width="140%"
          height="140%"
        >
          <feDropShadow
            dx="0"
            dy="3"
            stdDeviation="3"
            floodOpacity=".12"
          />
        </filter>

        <marker
          id="breakerArrow"
          markerWidth="9"
          markerHeight="9"
          refX="7"
          refY="4.5"
          orient="auto"
        >
          <path
            d="M0 0 L9 4.5 L0 9 Z"
            fill={C.blue}
          />
        </marker>

        <style>{`
          @keyframes breakerFlow {
            to {
              stroke-dashoffset: -36;
            }
          }

          @keyframes tripFlash {
            0% {
              opacity: 0;
            }

            35% {
              opacity: 1;
            }

            100% {
              opacity: 0;
            }
          }

          .breakerFlow {
            stroke-dasharray: 9 15;
            animation: breakerFlow 1s linear infinite;
          }

          .tripFlash {
            animation: tripFlash .7s ease;
          }
        `}</style>
      </defs>

      {/* Background panels */}

      <rect
        x="18"
        y="18"
        width="1064"
        height="564"
        rx="12"
        fill="#f8fafb"
        stroke="#d9dee4"
      />

      <text
        x="48"
        y="58"
        fontSize="21"
        fontWeight="800"
        fill="#244d82"
      >
        CIRCUIT BREAKER
      </text>

      <text
        x="48"
        y="84"
        fontSize="14"
        fill={C.muted}
      >
        Automatic protection against excessive current
      </text>

      {/* Main circuit */}

      <g
        fill="none"
        stroke={C.red}
        strokeWidth="6"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M110 310 H310" />

        <path
          d={
            circuitOn
              ? "M390 310 H505"
              : "M390 310 H450"
          }
        />

        <path d="M655 310 H835 V430 H985 V310" />

        <path d="M985 310 V160 H110 V310" />
      </g>

      {/* Animated current */}

      {circuitOn && (
        <path
          d="M110 310 H310 M390 310 H505 M655 310 H835 V430 H985 V310 V160 H110 V310"
          fill="none"
          stroke="#ec7770"
          strokeWidth="3.5"
          className="breakerFlow"
          markerEnd="url(#breakerArrow)"
        />
      )}

      {/* Supply */}

      <g filter="url(#breakerShadow)">
        <rect
          x="70"
          y="120"
          width="130"
          height="80"
          rx="10"
          fill="#ead3eb"
          stroke="#87558c"
          strokeWidth="2"
        />

        <text
          x="135"
          y="153"
          textAnchor="middle"
          fontSize="14"
          fontWeight="800"
          fill="#5f2e64"
        >
          POWER
        </text>

        <text
          x="135"
          y="180"
          textAnchor="middle"
          fontSize="24"
          fontWeight="900"
          fill="#5f2e64"
        >
          230 V
        </text>
      </g>

      {/* Circuit breaker housing */}

      <g filter="url(#breakerShadow)">
        <rect
          x="305"
          y="245"
          width="350"
          height="130"
          rx="16"
          fill="#fff"
          stroke="#59636f"
          strokeWidth="3"
        />

        <rect
          x="328"
          y="268"
          width="304"
          height="84"
          rx="10"
          fill="#eef1f4"
          stroke="#a4abb2"
          strokeWidth="2"
        />
      </g>

      <text
        x="480"
        y="289"
        textAnchor="middle"
        fontSize="14"
        fontWeight="800"
        fill={C.ink}
      >
        CIRCUIT BREAKER
      </text>

      {/* Breaker contacts */}

      <circle
        cx="365"
        cy="330"
        r="9"
        fill={C.metalDark}
      />

      <circle
        cx="475"
        cy="330"
        r="9"
        fill={C.metalDark}
      />

      <line
        x1="365"
        y1="330"
        x2={circuitOn ? 475 : 440}
        y2={circuitOn ? 330 : 300}
        stroke={C.metalDark}
        strokeWidth="10"
        strokeLinecap="round"
        style={{
          transformOrigin: "365px 330px",
          transition: "all .35s ease",
        }}
      />

      {/* Trip mechanism */}

      <g
        style={{
          transformOrigin: "570px 330px",
          transform: tripped
            ? "rotate(-22deg)"
            : "rotate(0deg)",
          transition: "transform .35s ease",
        }}
      >
        <rect
          x="550"
          y="285"
          width="42"
          height="90"
          rx="8"
          fill={tripped ? "#c65a52" : C.metal}
          stroke={C.metalDark}
          strokeWidth="2"
        />

        <rect
          x="559"
          y="296"
          width="24"
          height="48"
          rx="5"
          fill={tripped ? "#f2b4af" : "#d7dce0"}
        />
      </g>

      {/* Breaker labels */}

      <text
        x="365"
        y="415"
        textAnchor="middle"
        fontSize="13"
        fontWeight="700"
        fill={C.muted}
      >
        incoming
      </text>

      <text
        x="585"
        y="415"
        textAnchor="middle"
        fontSize="13"
        fontWeight="700"
        fill={C.muted}
      >
        trip mechanism
      </text>

      {/* Appliance */}

      <g filter="url(#breakerShadow)">
        <rect
          x="820"
          y="255"
          width="170"
          height="150"
          rx="14"
          fill="#fff"
          stroke="#4b5563"
          strokeWidth="3"
        />

        <rect
          x="850"
          y="290"
          width="110"
          height="72"
          rx="9"
          fill="#e6ebef"
          stroke="#8c969f"
          strokeWidth="2"
        />

        <circle
          cx="905"
          cy="326"
          r="20"
          fill={circuitOn ? "#dff3e6" : "#e4e7ea"}
          stroke={circuitOn ? C.green : "#aeb6bd"}
          strokeWidth="3"
        />

        <path
          d="M895 326 L902 333 L916 317"
          fill="none"
          stroke={circuitOn ? C.green : "#8d969e"}
          strokeWidth="4"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </g>

      <text
        x="905"
        y="390"
        textAnchor="middle"
        fontSize="16"
        fontWeight="800"
        fill={C.ink}
      >
        appliance
      </text>

      {/* Overload indicator */}

      {tripped && (
        <g className="tripFlash">
          <circle
            cx="505"
            cy="220"
            r="25"
            fill="none"
            stroke={C.red}
            strokeWidth="4"
          />

          <text
            x="505"
            y="185"
            textAnchor="middle"
            fontSize="14"
            fontWeight="900"
            fill={C.red}
          >
            TRIPPED
          </text>
        </g>
      )}

      {/* Current meter */}

      <g filter="url(#breakerShadow)">
        <rect
          x="735"
          y="110"
          width="210"
          height="82"
          rx="12"
          fill="#fff"
          stroke="#c7cdd3"
          strokeWidth="2"
        />

        <text
          x="755"
          y="138"
          fontSize="12"
          fontWeight="800"
          fill={C.muted}
        >
          CURRENT
        </text>

        <text
          x="755"
          y="171"
          fontSize="27"
          fontWeight="900"
          fill={tripped ? C.red : C.ink}
        >
          {tripped ? "0 A" : overloadValue()}
        </text>
      </g>

      {/* Overload visual */}

      {tripped && (
        <>
          <path
            d="M790 225 C800 212 810 238 820 225"
            fill="none"
            stroke={C.red}
            strokeWidth="3"
            strokeLinecap="round"
          />

          <path
            d="M835 225 C845 212 855 238 865 225"
            fill="none"
            stroke={C.red}
            strokeWidth="3"
            strokeLinecap="round"
          />

          <text
            x="830"
            y="490"
            textAnchor="middle"
            fontSize="16"
            fontWeight="800"
            fill={C.red}
          >
            Excess current detected
          </text>

          <text
            x="830"
            y="516"
            textAnchor="middle"
            fontSize="13"
            fill={C.muted}
          >
            Breaker opens to interrupt the circuit
          </text>
        </>
      )}

      {!tripped && (
        <>
          <text
            x="830"
            y="490"
            textAnchor="middle"
            fontSize="16"
            fontWeight="800"
            fill={C.green}
          >
            Current within safe range
          </text>

          <text
            x="830"
            y="516"
            textAnchor="middle"
            fontSize="13"
            fill={C.muted}
          >
            Breaker remains closed
          </text>
        </>
      )}

      {/* Bottom explanation */}

      <g fontSize="14" fontWeight="700">
        <text
          x="70"
          y="555"
          fill="#244d82"
        >
          {tripped
            ? "Circuit open → current stopped"
            : "Circuit closed → current flows"}
        </text>
      </g>
    </svg>
  );
}

function overloadValue() {
  return "6.2 A";
}