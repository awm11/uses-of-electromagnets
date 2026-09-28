
import React from "react";

export default function Solenoid({
  on = true,
  reverse = false,
  corner = { x: 75, y: 230 },
  orientation = 270,
  mirror = false,
  scale = 0.5,
  turns: turnCount = 20,
}) {
  const mirrorScale = mirror ? -scale : scale;

  // Keep the number of turns within a sensible range.
  // The original artwork used 31 turns.
  const count = Math.max(1, Math.min(31, Math.round(turnCount)));

  // Each turn is spaced 20 SVG units apart.
  const turnPositions = Array.from(
    { length: count },
    (_, i) => 60 + i * 20
  );

  // The final rear return point needs to line up with the last turn.
  const lastTurnX = turnPositions[turnPositions.length - 1];

  // Positions of the two straight leads.
  const rearLeadX = lastTurnX - 5;
  const frontLeadX = 66.5;

  // Apply the reverse class to every animated current path.
  const currentFlowClass = `solenoid-current-flow${
    reverse ? " solenoid-current-flow-reverse" : ""
  }`;

  return (
    <g
      transform={`
        translate(${corner.x} ${corner.y})
        rotate(${orientation})
        scale(${mirrorScale} ${scale})
      `}
      role="img"
      aria-label="Copper solenoid coil around a thin core"
    >
      <defs>
        <linearGradient
          id="solenoidCoreShade"
          x1="0"
          y1="0"
          x2="0"
          y2="1"
        >
          <stop offset="0" stopColor="#bbb9b2" />
          <stop offset="0.48" stopColor="#96948e" />
          <stop offset="1" stopColor="#7b7973" />
        </linearGradient>

        <linearGradient
          id="solenoidCoreFaceShade"
          x1="0"
          y1="0"
          x2="1"
          y2="0"
        >
          <stop offset="0" stopColor="#77756f" />
          <stop offset="0.45" stopColor="#aaa8a1" />
          <stop offset="1" stopColor="#d1cfc8" />
        </linearGradient>

        <linearGradient
          id="solenoidWireShade"
          x1="0"
          y1="0"
          x2="0"
          y2="1"
        >
          <stop offset="0" stopColor="#efaa5a" />
          <stop offset="0.45" stopColor="#c86d27" />
          <stop offset="1" stopColor="#974918" />
        </linearGradient>

        <style>{`
          .solenoid-wire-rear,
          .solenoid-wire-front {
            fill: none;
            stroke-width: 9;
            stroke-linecap: round;
          }

          .solenoid-wire-rear {
            stroke: #a4511b;
          }

          .solenoid-wire-front {
            stroke: #d98332;
          }

          .solenoid-wire-highlight {
            fill: none;
            stroke: rgba(255,205,135,.7);
            stroke-width: 2.3;
            stroke-linecap: round;
          }

          /*
           * 9 + 15 = 24 SVG units per animation cycle.
           * 24 / 0.666667 ≈ 36 SVG units per second.
           */
          .solenoid-current-flow {
            fill: none;
            stroke: #6da0ec;
            stroke-width: 3.5;
            stroke-linecap: round;
            stroke-dasharray: 9 15;
            stroke-dashoffset: 0;
            animation: solenoidDashFlow 0.666667s linear infinite;
            animation-delay: 0.3s;
            pointer-events: none;
          }

          /*
           * Reverse the direction of the animated current.
           * The copper geometry itself is unchanged.
           */
          .solenoid-current-flow-reverse {
            animation-direction: reverse;
          }

          @keyframes solenoidDashFlow {
            from {
              stroke-dashoffset: 0;
            }

            to {
              stroke-dashoffset: -24;
            }
          }
        `}</style>
      </defs>

      {/* =====================================================
          REAR COPPER TURNS
          ===================================================== */}

      <g stroke="url(#solenoidWireShade)">
        {turnPositions.map((x) => (
          <path
            key={`rear-${x}`}
            className="solenoid-wire-rear"
            d={`M${x},-34 C${x - 24},-34 ${x - 24},34 ${x},34`}
          />
        ))}

        {/* Rear return section */}
        {count > 1 && (
          <path
            className="solenoid-wire-rear"
            d={`M${lastTurnX},0 C${lastTurnX - 12},0 ${
              lastTurnX - 12
            },34 ${lastTurnX},34`}
          />
        )}
      </g>

      {/* =====================================================
          REAR TERMINAL / LEAD
          ===================================================== */}

      <path
        className="solenoid-wire-rear"
        d={`M${rearLeadX},-75.5 L${rearLeadX},-5.5`}
      />

      {/* =====================================================
          ANIMATED CURRENT — REAR TURNS + REAR LEAD

          This is BEFORE the core so the core hides the blue
          animation wherever the rear copper passes behind it.
          ===================================================== */}

      {on && (
        <g aria-hidden="true">
          {turnPositions.map((x) => (
            <path
              key={`rear-flow-${x}`}
              className={currentFlowClass}
              d={`M${x},-34 C${x - 24},-34 ${x - 24},34 ${x},34`}
            />
          ))}

          {count > 1 && (
            <path
              className={currentFlowClass}
              d={`M${lastTurnX},0 C${lastTurnX - 12},0 ${
                lastTurnX - 12
              },34 ${lastTurnX},34`}
            />
          )}

          {/* Blue animation on rear straight lead */}
          <path
            className={currentFlowClass}
            d={`M${rearLeadX},-75.5 L${rearLeadX},-5.5`}
          />
        </g>
      )}

      {/* =====================================================
          CORE

          The core is AFTER the rear animation, so it sits
          in front of the rear blue overlay.
          ===================================================== */}

      <rect
        x="6"
        y="-18"
        width={lastTurnX + 8}
        height="36"
        rx="18"
        fill="url(#solenoidCoreShade)"
        stroke="#77756f"
        strokeWidth="2"
      />

      <ellipse
        cx="17"
        cy="0"
        rx="11"
        ry="18"
        fill="url(#solenoidCoreShade)"
        stroke="#77756f"
        strokeWidth="2"
      />

      {/* =====================================================
          FRONT COPPER TURNS
          ===================================================== */}

      <g stroke="url(#solenoidWireShade)">
        {/* First turn */}
        <path
          className="solenoid-wire-front"
          d="M60,34 Q71,20 65,-0.5"
        />

        {/* Remaining turns */}
        {turnPositions.slice(1).map((x) => (
          <path
            key={`front-${x}`}
            className="solenoid-wire-front"
            d={`M${x},34 Q${x + 15},-5 ${x - 18},-34`}
          />
        ))}
      </g>

      {/* =====================================================
          WIRE HIGHLIGHTS

          Highlights are BEFORE the blue animation so the blue
          flow sits visibly on top of them.
          ===================================================== */}

      <g className="wire-highlights">
        <path
          className="solenoid-wire-highlight"
          d="M60,31 Q70,19 65,-0.5 L65,-54.5"
        />

        {turnPositions.slice(1).map((x) => (
          <path
            key={`highlight-${x}`}
            className="solenoid-wire-highlight"
            d={`M${x},31 Q${x + 12},-3 ${x - 15},-31`}
          />
        ))}
      </g>

      {/* =====================================================
          ANIMATED CURRENT — FRONT TURNS

          This is AFTER the highlights and therefore sits on
          top of the copper highlights and the core.
          ===================================================== */}

      {on && (
        <g aria-hidden="true">
          {/* First front turn */}
          <path
            className={currentFlowClass}
            d="M60,34 Q71,20 65,-0.5"
          />

          {/* Remaining front turns */}
          {turnPositions.slice(1).map((x) => (
            <path
              key={`front-flow-${x}`}
              className={currentFlowClass}
              d={`M${x},34 Q${x + 15},-5 ${x - 18},-34`}
            />
          ))}
        </g>
      )}

      {/* =====================================================
          FRONT TERMINAL / LEAD
          ===================================================== */}

      <path
        className="solenoid-wire-front"
        d={`M${frontLeadX},1 L${frontLeadX},-75.5`}
      />

      {/* Front lead highlight comes BEFORE its blue animation */}
      <path
        className="solenoid-wire-highlight"
        d={`M${frontLeadX},-1.5 L${frontLeadX},-73.5`}
      />

      <path
        className="solenoid-wire-highlight"
        d={`M60,31 Q70,19 ${frontLeadX},1 L${frontLeadX},-73.5`}
      />

      {/* Blue animation on front straight lead */}
      {on && (
        <path
          className={currentFlowClass}
          d={`M${frontLeadX},1 L${frontLeadX},-75.5`}
          aria-hidden="true"
        />
      )}
    </g>
  );
}