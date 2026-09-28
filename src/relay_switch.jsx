import React, { useState } from "react";
import Solenoid from "./solenoid";

const C = {
  ink: "#202020",
  blue: "#2166d1",
  blueLight: "#eaf3ff",
  red: "#d93a32",
  redLight: "#fff0ee",
  copper: "#b86f32",
  metal: "#8f969d",
  metalDark: "#555c63",
  muted: "#59636f",
};

export default function App() {
  const [on, setOn] = useState(false);

  return (
    <main className="page">
      <style>{`
        * { box-sizing: border-box; }

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

function RelayDiagram({ on }) {
  const flow = on
    ? "dashFlow 0.666667s linear infinite"
    : "none";

  return (
    <svg
      viewBox="0 0 1100 600"
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
            animation-delay: ${on ? "0.3s" : "0s"};
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
        width="562"
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
          stroke="#6da0ec"
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
        x="300"
        y="112"
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
          stroke="#ec7770"
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
        <rect
          x="826"
          y="277"
          width="146"
          height="135"
          rx="14"
          fill="#fff"
          stroke="#4b5563"
          strokeWidth="3"
        />

        <rect
          x="853"
          y="307"
          width="91"
          height="73"
          rx="9"
          fill="#e6ebef"
          stroke="#8c969f"
          strokeWidth="2"
        />

        {/* Shower head */}

        <path
          d="M900 307 V270 Q900 244 927 244 H956"
          fill="none"
          stroke="#555c63"
          strokeWidth="9"
          strokeLinecap="round"
        />

        <path
          d="M956 244 Q986 244 986 270"
          fill="none"
          stroke="#555c63"
          strokeWidth="9"
          strokeLinecap="round"
        />

        {/* Falling water */}

        {on && (
          <g className="relay-delayed">
            {[952, 967, 982, 997].map((x, i) => (
              <path
                key={i}
                d={`M${x} ${272 + (i % 2) * 2} v${25 + i * 4}`}
                stroke="#3aa8df"
                strokeWidth="3.5"
                strokeLinecap="round"
              />
            ))}
          </g>
        )}

        {/* Heating element */}

        {on ? (
          <g className="relay-delayed">
            <path
              d="
                M875 326
                C880 316 885 316 890 326
                S900 336 905 326
                S915 316 920 326
                S930 336 935 326
              "
              fill="none"
              stroke="#e87532"
              strokeWidth="5"
              strokeLinecap="round"
            />

            <path
              d="
                M875 326
                C880 316 885 316 890 326
                S900 336 905 326
                S915 316 920 326
                S930 336 935 326
              "
              fill="none"
              stroke="#ffd36a"
              strokeWidth="2"
              strokeLinecap="round"
            />

            <text
              x="898"
              y="360"
              textAnchor="middle"
              fontSize="11"
              fontWeight="800"
              fill="#c85b25"
            >
              HEATING
            </text>
          </g>
        ) : (
          <path
            d="
              M875 326
              C880 316 885 316 890 326
              S900 336 905 326
              S915 316 920 326
              S930 336 935 326
            "
            fill="none"
            stroke="#aeb6bd"
            strokeWidth="4"
            strokeLinecap="round"
            opacity=".65"
          />
        )}
      </g>

      <text
        x="900"
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

      {/* RIGHT FIXED CONTACT ROD */}

      <g>
        <rect
          x="597"
          y="220"
          width="16"
          height="250"
          rx="8"
          fill={C.metal}
          stroke={C.metalDark}
          strokeWidth="2"
        />

        <path
          d="
            M596 220
            A18 18 0 0 0 596 256
            Z
          "
          fill={C.copper}
          stroke={C.metalDark}
          strokeWidth="2"
        />

        <path
          d="M596 222 A16 16 0 0 0 596 254"
          fill="none"
          stroke="#d59658"
          strokeWidth="3"
          strokeLinecap="round"
        />
      </g>

      {/* LEFT MOVING CONTACT ROD */}

      <g
        style={{
          transformOrigin: "535px 470px",
          transform: `rotate(${on ? 4.5 : 0}deg)`,
          transition: "transform .45s ease .15s",
        }}
      >
        <rect
          x="527"
          y="220"
          width="16"
          height="250"
          rx="8"
          fill={C.metal}
          stroke={C.metalDark}
          strokeWidth="2"
        />

        <path
          d="
            M543 220
            A18 18 0 0 1 543 256
            Z
          "
          fill={C.copper}
          stroke={C.metalDark}
          strokeWidth="2"
        />

        <path
          d="M543 222 A16 16 0 0 1 543 254"
          fill="none"
          stroke="#d59658"
          strokeWidth="3"
          strokeLinecap="round"
        />

        <circle
          cx="535"
          cy="470"
          r="11"
          fill={C.metalDark}
          stroke={C.ink}
          strokeWidth="2"
        />

        <circle
          cx="535"
          cy="470"
          r="4"
          fill={C.metal}
        />
      </g>

      {/* iron armature */}

      <g
        style={{
          transformOrigin: "525px 180px",
          transform: `translateX(0px) rotate(${on ? -8 : 3}deg)`,
          transition: "transform .45s ease",
        }}
      >
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
          stroke={C.metalDark}
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        <circle
          cx="505"
          cy="180"
          r="9"
          fill={C.metalDark}
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
          <line
            x1="548"
            y1="238"
            x2="556"
            y2="238"
            stroke="#ffffff"
            strokeWidth="5"
          />

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