import React, { useEffect, useState } from "react";
import Solenoid from "./solenoid";

const C = {
  ink: "#202020",
  blue: "#2166d1",
  blueLight: "#eaf3ff",
  red: "#d93a32",
  redLight: "#fff0ee",
  copper: "#c8662a",
  metal: "#8f969d",
  metalDark: "#555c63",
  muted: "#59636f",
};

export default function App({ preview = false }) {
  const [on, setOn] = useState(false);

  /*
   * The home-page card can render only the relay mechanism.
   * It is deliberately separate from the full lesson UI.
   */
  if (preview) {
    return <RelayPreview />;
  }

  return (
    <main className="page">
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

        .page {
          min-height: 100vh;
          padding: 24px;
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

        h1 {
          margin: 0;
          color: ${C.ink};
          font-size: clamp(28px, 4vw, 40px);
          letter-spacing: -.04em;
        }

        .intro {
          max-width: 780px;
          margin: 8px 0 0;
          color: ${C.muted};
          line-height: 1.5;
        }

        .card {
          background: #fff;
          border: 1px solid #d9dee4;
          border-radius: 18px;
          box-shadow: 0 10px 28px rgba(31, 41, 55, .07);
          overflow: hidden;
        }

        .stage {
          padding: 12px;
        }

        svg {
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
          color: ${C.ink};
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
          <div className="eyebrow">Electromagnetism • 02</div>

          <h1>Relay Switch</h1>

          <p className="intro">
            Use a small control current to operate a separate high-current
            circuit. The diagram shows the coil, iron armature, contacts,
            supply and appliance as one clear circuit.
          </p>
        </header>

        <section className="card">
          <div className="stage">
            <RelayDiagram on={on} />
          </div>

          <div className="controls">
            <button
              className="switchBtn"
              onClick={() => setOn(v => !v)}
              aria-pressed={on}
            >
              <span className={"toggle " + (on ? "on" : "")}>
                <span className="knob" />
              </span>

              {on ? "Switch closed" : "Switch open"}
            </button>

            <div className="status">
              <span className={"dot " + (on ? "on" : "")} />

              {on
                ? "Relay energised • high-current circuit ON"
                : "Relay de-energised • high-current circuit OFF"}
            </div>
          </div>
        </section>

        <section className="lesson">
          <div className="lessonBox">
            <h2>1. Low-current control circuit</h2>

            <p>
              {on ? (
                <>
                  The switch is closed, so current flows through the coil.
                  The coil becomes an{" "}
                  <span className="onText">electromagnet</span>.
                </>
              ) : (
                <>
                  Open the switch to stop current in the coil.
                  The electromagnet is then{" "}
                  <span className="offText">off</span>.
                </>
              )}
            </p>
          </div>

          <div className="lessonBox">
            <h2>2. High-current circuit</h2>

            <p>
              {on ? (
                <>
                  The magnetic field attracts the iron armature,
                  closing the contacts and allowing current to reach
                  the electric shower.
                </>
              ) : (
                <>
                  The contacts are separated, so the high-current
                  circuit is broken and the electric shower is
                  isolated.
                </>
              )}
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}

function RelayPreview() {
  const [previewOn, setPreviewOn] = useState(true);

  useEffect(() => {
    const timer = setInterval(() => {
      setPreviewOn((current) => !current);
    }, 2000);

    return () => clearInterval(timer);
  }, []);

  return (
    <div className="relayPreviewOnly">
      <style>{`
        .relayPreviewOnly {
          width: 100% !important;
          height: 100% !important;
          transform: none !important;
          display: flex;
          align-items: center;
          justify-content: center;
          overflow: visible;
        }

        .relayPreviewOnly > svg {
          display: block;
          width: 100%;
          height: 100%;
          max-width: none;
          max-height: none;
        }

        /* Hide preview text, but keep the 240 V label */
        .relayPreviewOnly svg text {
          display: none;
        }

        .relayPreviewOnly svg g[transform="translate(70 0)"] > text {
          display: initial;
        }
      `}</style>

      <RelayDiagram on={previewOn} />
    </div>
  );
}
/* =========================================================
   FULL INTERACTIVE RELAY DIAGRAM
   ========================================================= */

function RelayDiagram({ on }) {
  const flow = on
    ? "dashFlow 0.666667s linear infinite"
    : "none";

  return (
    <svg
      viewBox="0 0 1130 600"
      role="img"
      aria-label="Interactive relay switch diagram"
    >
      <defs>
        <filter
          id="softShadow"
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
          id="blueArrow"
          markerWidth="9"
          markerHeight="9"
          refX="7"
          refY="4.5"
          orient="auto"
        >
          <path d="M0 0 L9 4.5 L0 9 Z" fill={C.blue} />
        </marker>

        <marker
          id="redArrow"
          markerWidth="9"
          markerHeight="9"
          refX="7"
          refY="4.5"
          orient="auto"
        >
          <path d="M0 0 L9 4.5 L0 9 Z" fill={C.red} />
        </marker>

        <style>{`
          @keyframes dashFlow {
            from {
              stroke-dashoffset: 0;
            }

            to {
              stroke-dashoffset: -24;
            }
          }

          @keyframes relayFadeIn {
            from {
              opacity: 0;
            }

            to {
              opacity: 1;
            }
          }

          .flow {
            stroke-dasharray: 9 15;
            stroke-dashoffset: 0;
            animation: ${flow};
            animation-delay: ${on ? "0s" : "0s"};
          }

          .drop {
            stroke-dasharray: 7 11;
            animation: dropFall 0.45s linear infinite;
          }

          .steam {
            transform-box: fill-box;
            transform-origin: center;
            opacity: 0;
            animation: steamRise 3.8s ease-out infinite;
          }

          .heat-pulse {
            animation: heatPulse 1.2s ease-in-out infinite;
          }

          @keyframes dropFall {
            from { stroke-dashoffset: 0; }
            to { stroke-dashoffset: -18; }
          }

          @keyframes steamRise {
            0% { opacity: 0; transform: translate(0, 0) scale(.5); }
            20% { opacity: .6; }
            70% { opacity: .25; }
            100% {
              opacity: 0;
              transform: translate(var(--dx, 0px), -135px) scale(2);
            }
          }

          @keyframes heatPulse {
            0%, 100% { opacity: .6; }
            50% { opacity: 1; }
          }

          .relay-delayed {
            animation: relayFadeIn .25s ease 0.3s both;
          }
        `}</style>
      </defs>

      {/* background panels */}

      <rect
        x="18"
        y="18"
        width="450"
        height="564"
        rx="10"
        fill={C.blueLight}
        stroke="#d5e5f8"
      />

      <rect
        x="520"
        y="18"
        width="592"
        height="564"
        rx="10"
        fill={C.redLight}
        stroke="#f0d7d3"
      />

      <text
        x="45"
        y="56"
        fontSize="21"
        fontWeight="800"
        fill="#244d82"
      >
        LOW CURRENT CIRCUIT
      </text>

      <text
        x="557"
        y="56"
        fontSize="21"
        fontWeight="800"
        fill="#8c302c"
      >
        HIGH CURRENT CIRCUIT
      </text>

      {/* low current circuit */}

      <g
        fill="none"
        stroke={C.blue}
        strokeWidth="5"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M105 154 H150 M235 154 H270 V253.5 H330" />
        <path d="M330 406 H290 V448 H105 V302" />
        <path d="M105 283 V154" />
      </g>

      {on && (
        <path
          d="M105 154 H270 V253.5 H330 M330 406 H290 V448 H105 V303 M105 280 V154"
          fill="none"
          stroke="#c2dbff"
          strokeWidth="3.5"
          className="flow"
          markerEnd="url(#blueArrow)"
        />
      )}

      {/* Battery */}

      <g stroke={C.ink} strokeLinecap="round">
        <line
          x1="87"
          y1="283"
          x2="123"
          y2="283"
          strokeWidth="7"
        />

        <line
          x1="93"
          y1="301"
          x2="117"
          y2="301"
          strokeWidth="4"
        />
      </g>

      <text
        x="45"
        y="320"
        fontSize="14"
        fill={C.muted}
      >
        battery
      </text>

      {/* Control switch */}

      <circle
        cx="155"
        cy="154"
        r="7"
        fill={C.ink}
      />

      <circle
        cx="235"
        cy="154"
        r="7"
        fill={C.ink}
      />

      <line
        x1="155"
        y1="154"
        x2={on ? 235 : 211.6}
        y2={on ? 154 : 104}
        stroke={C.ink}
        strokeWidth="7"
        strokeLinecap="round"
        style={{ transition: "all .35s ease" }}
      />

      <text
        x="195"
        y="186"
        textAnchor="middle"
        fontSize="15"
        fontWeight="700"
        fill={C.ink}
      >
        switch
      </text>

      {/* Solenoid */}

      <Solenoid
        on={on}
        corner={{ x: 400, y: 194 }}
        orientation={270}
        mirror={true}
        scale={0.9}
        turns={10}
        reverse={true}
      />

      {/* HIGH CURRENT CIRCUIT */}

      <g
        fill="none"
        stroke={C.red}
        strokeWidth="5"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M610 470 H675 V116 H930 V284" />
        <path d="M970 284 V568 H555 V500 H535 V470" />
      </g>

      {on && (
        <path
          d="M610 470 H675 V116 H930 V284 H970 V568 H555 V500 H535 V470"
          fill="none"
          stroke="#ffc4be"
          strokeWidth="3.5"
          className="flow"
          markerEnd="url(#redArrow)"
        />
      )}

      {/* 240 V supply */}

      <g
        filter="url(#softShadow)"
        transform="translate(70 0)"
      >
        <rect
          x="710"
          y="83"
          width="115"
          height="58"
          rx="7"
          fill="#ead3eb"
          stroke="#87558c"
          strokeWidth="2"
        />

        <text
          x="767.5"
          y="120"
          textAnchor="middle"
          fontSize="23"
          fontWeight="900"
          fill="#5f2e64"
        >
          240 V
        </text>
      </g>

      <text
        x="786"
        y="160"
        fontSize="13"
        fill={C.muted}
      >
        high-voltage supply
      </text>

      {/* Electric shower */}

      <g
        filter="url(#softShadow)"
        transform="translate(70 0)"
      >
        <defs>
          <radialGradient id="heatGlow" cx="50%" cy="50%" r="60%">
            <stop offset="0%" stopColor="#ff9a4d" stopOpacity=".55" />
            <stop offset="100%" stopColor="#ff5a1f" stopOpacity="0" />
          </radialGradient>

          <linearGradient id="showerBody" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#ffffff" />
            <stop offset="100%" stopColor="#e9eef2" />
          </linearGradient>

          <filter id="glowBlur" x="-30%" y="-80%" width="160%" height="260%">
            <feGaussianBlur stdDeviation="4" />
          </filter>

          <filter id="steamBlur" x="-60%" y="-60%" width="220%" height="220%">
            <feGaussianBlur stdDeviation="5" />
          </filter>
        </defs>

        {/* Unit body */}

        <rect
          x="826"
          y="277"
          width="146"
          height="135"
          rx="14"
          fill="url(#showerBody)"
        />

        {/* Control strip */}

        <path
          d="M826 291 Q826 277 840 277 H958 Q972 277 972 291 V303 H826 Z"
          fill="#cfd6dc"
        />

        <rect
          x="826"
          y="277"
          width="146"
          height="135"
          rx="14"
          fill="none"
          stroke="#4b5563"
          strokeWidth="3"
        />

        <line
          x1="827"
          y1="303"
          x2="971"
          y2="303"
          stroke="#aab3bb"
          strokeWidth="1.5"
        />

        {/* Power lamp */}

        <circle
          cx="845"
          cy="290"
          r="5"
          fill={on ? "#2d9b55" : "#a7afb8"}
          stroke="#4b5563"
          strokeWidth="1.5"
        />

        {on && (
          <circle
            cx="845"
            cy="290"
            r="9"
            fill="#2d9b55"
            opacity=".3"
            filter="url(#glowBlur)"
          />
        )}

        {/* Heating chamber window */}

        <rect
          x="844"
          y="312"
          width="110"
          height="68"
          rx="9"
          fill={on ? "#2a2e35" : "#e6ebef"}
          stroke="#8c969f"
          strokeWidth="2"
          style={{ transition: "fill .5s ease" }}
        />

        {/* Heating element */}

        {on ? (
          <g className="relay-delayed">
            <ellipse
              cx="899"
              cy="343"
              rx="52"
              ry="26"
              fill="url(#heatGlow)"
            />

            <path
              d="M852 343 H860 C865 327 871 327 876 343 S887 359 892 343 S903 327 908 343 S919 359 924 343 S935 327 940 343 H948"
              fill="none"
              stroke="#ff7a2b"
              strokeWidth="9"
              strokeLinecap="round"
              opacity=".6"
              filter="url(#glowBlur)"
              className="heat-pulse"
            />

            <path
              d="M852 343 H860 C865 327 871 327 876 343 S887 359 892 343 S903 327 908 343 S919 359 924 343 S935 327 940 343 H948"
              fill="none"
              stroke="#ff6a2b"
              strokeWidth="5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />

            <path
              d="M852 343 H860 C865 327 871 327 876 343 S887 359 892 343 S903 327 908 343 S919 359 924 343 S935 327 940 343 H948"
              fill="none"
              stroke="#ffe08a"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="heat-pulse"
            />

            <text
              x="899"
              y="374"
              textAnchor="middle"
              fontSize="10"
              fontWeight="800"
              letterSpacing=".08em"
              fill="#ffb27a"
            >
              HEATING
            </text>
          </g>
        ) : (
          <path
            d="M852 343 H860 C865 327 871 327 876 343 S887 359 892 343 S903 327 908 343 S919 359 924 343 S935 327 940 343 H948"
            fill="none"
            stroke="#aeb6bd"
            strokeWidth="5"
            strokeLinecap="round"
            strokeLinejoin="round"
            opacity=".75"
          />
        )}

        {/* Terminal screws */}

        {[836, 962].map((x) => (
          <circle
            key={x}
            cx={x}
            cy="400"
            r="3"
            fill="#9aa3ab"
            stroke="#5b636a"
            strokeWidth="1"
          />
        ))}

        {/* Water pipe and arm */}

        <path
          d="M900 277 V262 Q900 246 916 246 H986 Q1002 246 1002 258"
          fill="none"
          stroke="#3f464d"
          strokeWidth="11"
          strokeLinecap="round"
        />

        <path
          d="M900 277 V262 Q900 246 916 246 H986 Q1002 246 1002 258"
          fill="none"
          stroke="#8f969d"
          strokeWidth="7"
          strokeLinecap="round"
        />

        <path
          d="M904 262 Q904 250 916 250 H986"
          fill="none"
          stroke="#c9ced3"
          strokeWidth="1.8"
          strokeLinecap="round"
          opacity=".8"
        />

        {/* Shower head */}

        <g transform="translate(1002 256)">
          <path
            d="M-7 0 H7 L19 15 H-19 Z"
            fill="#6b737b"
            stroke="#3f464d"
            strokeWidth="2"
            strokeLinejoin="round"
          />

          <ellipse
            cx="0"
            cy="16"
            rx="20"
            ry="4.5"
            fill="#4a5158"
            stroke="#2f353a"
            strokeWidth="1.5"
          />

          {[-12, -6, 0, 6, 12].map((x) => (
            <circle
              key={x}
              cx={x}
              cy="16.5"
              r="1.3"
              fill={on ? "#bfe6fa" : "#8c969f"}
            />
          ))}
      </g>

        {/* Water spray */}

        {on && (
          <g className="relay-delayed">
            {[0, 1, 2, 3, 4].map((i) => (
              <line
                key={i}
                x1={1002 + (i - 2) * 6}
                y1="274"
                x2={1002 + (i - 2) * 11}
                y2="398"
                stroke="#3aa8df"
                strokeWidth="3"
                strokeLinecap="round"
                className="drop"
                style={{ animationDelay: `${i * -0.11}s` }}
              />
            ))}

            {[0, 1, 2, 3].map((i) => (
              <line
                key={"m" + i}
                x1={1002 + (i - 1.5) * 6}
                y1="274"
                x2={1002 + (i - 1.5) * 11}
                y2="398"
                stroke="#8fd2f2"
                strokeWidth="1.8"
                strokeLinecap="round"
                opacity=".8"
                className="drop"
                style={{ animationDelay: `${i * -0.17 - 0.05}s` }}
              />
            ))}
          </g>
        )}

        {/* Rising steam */}

        {on && (
          <g className="relay-delayed" filter="url(#steamBlur)">
            {[
              { x: 986, r: 12, dx: -10, d: 0 },
              { x: 1002, r: 16, dx: 6, d: 0.45 },
              { x: 1018, r: 13, dx: 18, d: 0.9 },
              { x: 994, r: 15, dx: -4, d: 1.35 },
              { x: 1010, r: 11, dx: 12, d: 1.8 },
              { x: 1024, r: 14, dx: 26, d: 2.25 },
              { x: 1000, r: 17, dx: 2, d: 2.7 },
              { x: 980, r: 10, dx: -16, d: 3.15 },
            ].map((p, i) => (
              <circle
                key={i}
                cx={p.x}
                cy="388"
                r={p.r}
                fill="#ffffff"
                stroke="#cfd8df"
                strokeWidth="1"
                className="steam"
                style={{
                  "--dx": `${p.dx}px`,
                  animationDelay: `${p.d}s`,
                }}
              />
            ))}
          </g>
        )}
      </g>

      <text
        x="897"
        y="434"
        fontSize="16"
        fontWeight="800"
        fill={C.ink}
      >
        <tspan x="897" dy="0">
          electric
        </tspan>

        <tspan x="897" dy="19">
          shower
        </tspan>
      </text>

      {/* RELAY MECHANISM */}

      <defs>
        <linearGradient id="rodGrad" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#6c747b" />
          <stop offset="35%" stopColor="#cdd2d7" />
          <stop offset="65%" stopColor="#97a0a7" />
          <stop offset="100%" stopColor="#59616a" />
        </linearGradient>

        <linearGradient id="copperGrad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#f0a06a" />
          <stop offset="45%" stopColor="#c8662a" />
          <stop offset="100%" stopColor="#8a3d12" />
        </linearGradient>

        <radialGradient id="pivotGrad" cx="38%" cy="35%" r="70%">
          <stop offset="0%" stopColor="#d5dade" />
          <stop offset="60%" stopColor="#8f969d" />
          <stop offset="100%" stopColor="#4c535a" />
        </radialGradient>
      </defs>

      {/* RIGHT FIXED CONTACT ROD */}

      <g filter="url(#softShadow)">
        <rect
          x="600"
          y="220"
          width="10"
          height="250"
          rx="5"
          fill="url(#rodGrad)"
          stroke={C.metalDark}
          strokeWidth="2"
        />

        <line
          x1="604"
          y1="232"
          x2="604"
          y2="440"
          stroke="#ffffff"
          strokeWidth="2.5"
          strokeLinecap="round"
          opacity=".5"
        />

        {/* copper contact tip */}

        <path
          d="
            M599 220
            A21 18 0 0 0 599 256
            Z
          "
          fill="url(#copperGrad)"
          stroke={C.metalDark}
          strokeWidth="2"
        />

        <path
          d="M599 222 A19 16 0 0 0 599 254"
          fill="none"
          stroke="#f7b680"
          strokeWidth="3"
          strokeLinecap="round"
        />

      </g>

      {/* LEFT MOVING CONTACT ROD */}

      <g
        filter="url(#softShadow)"
        style={{
          transformOrigin: "535px 470px",
          transform: `rotate(${on ? 4.5 : 0}deg)`,
          transition: "transform .45s ease .15s",
        }}
      >
        <rect
          x="530"
          y="220"
          width="10"
          height="250"
          rx="5"
          fill="url(#rodGrad)"
          stroke={C.metalDark}
          strokeWidth="2"
        />

        <line
          x1="534"
          y1="232"
          x2="534"
          y2="440"
          stroke="#ffffff"
          strokeWidth="2.5"
          strokeLinecap="round"
          opacity=".5"
        />

        {/* copper contact tip */}

        <path
          d="
            M541 220
            A20 18 0 0 1 541 256
            Z
          "
          fill="url(#copperGrad)"
          stroke={C.metalDark}
          strokeWidth="2"
        />

        <path
          d="M541 222 A18 16 0 0 1 541 254"
          fill="none"
          stroke="#f7b680"
          strokeWidth="3"
          strokeLinecap="round"
        />

        {/* pivot */}

        <circle
          cx="535"
          cy="470"
          r="11"
          fill="url(#pivotGrad)"
          stroke={C.ink}
          strokeWidth="2"
        />

        <circle
          cx="535"
          cy="470"
          r="4.5"
          fill={C.metalDark}
          stroke="#2f353a"
          strokeWidth="1.5"
        />

      </g>

      {/* iron armature */}

      <g
        filter="url(#softShadow)"
        style={{
          transformOrigin: "525px 180px",
          transform: `translateX(0px) rotate(${on ? -8 : 3}deg)`,
          transition: "transform .45s ease",
        }}
      >
        <path
          d="M410 180 H505 V330"
          fill="none"
          stroke="#4a5158"
          strokeWidth="25"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        <path
          d="M410 180 H505 V330"
          fill="none"
          stroke={C.metal}
          strokeWidth="21"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        <path
          d="M410 180 H505 V330"
          fill="none"
          stroke="#b9c0c6"
          strokeWidth="12"
          strokeLinecap="round"
          strokeLinejoin="round"
        />


        {/* hinge */}

        <circle
          cx="505"
          cy="180"
          r="12"
          fill="url(#pivotGrad)"
          stroke={C.metalDark}
          strokeWidth="2"
        />

        <circle
          cx="505"
          cy="180"
          r="5"
          fill={C.metalDark}
          stroke="#2f353a"
          strokeWidth="1.5"
        />

      </g>

      <text
        x="410"
        y="158"
        fontSize="14"
        fontWeight="700"
        fill={C.ink}
      >
        iron armature
      </text>

      {/* CONTACT / MOVEMENT INDICATION */}

      {on ? (
        <>
          <circle
            cx="585"
            cy="238"
            r="25"
            fill="none"
            stroke="#2d9b55"
            strokeWidth="3"
            opacity=".75"
          />

          <text
            x="585"
            y="185"
            textAnchor="middle"
            fontSize="13"
            fontWeight="800"
            fill="#19743b"
          >
            contact made
          </text>
        </>
      ) : (
        <>
          <text
            x="590"
            y="185"
            textAnchor="middle"
            fontSize="13"
            fontWeight="700"
            fill={C.muted}
          >
            contacts open
          </text>
        </>
      )}

      {/* EXPLANATORY CAPTIONS */}

      <g fontSize="15" fontWeight="700">
        <text
          x="46"
          y="520"
          fill="#244d82"
        >
          {on
            ? "Current flows → coil magnetises"
            : "Switch open → no coil current"}
        </text>

        <text
          x="592"
          y="520"
          fill="#8c302c"
        >
          {on
            ? "Contacts close → current reaches appliance"
            : "Contacts open → appliance circuit is broken"}
        </text>
      </g>

      <g
        fontSize="12.5"
        fill={C.muted}
      >
        <text
          x="46"
          y="546"
        >
          Small current controls the relay.
        </text>

        <text
          x="592"
          y="546"
        >
          The relay keeps the control and load circuits separate.
        </text>
      </g>
    </svg>
  );
}