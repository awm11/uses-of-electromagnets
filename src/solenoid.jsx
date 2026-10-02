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

  // Core geometry: a rod running the length of the coil. The front end
  // (left) is square-cornered on the rect itself; the ellipse's centre
  // line sits exactly on that square edge, so only the ellipse's near
  // half pokes out as a rounded nose and its far half is hidden inside
  // the rect. The rear end (right, no ellipse) is the one rounded end.
  // Only the nose (ellipse) end is shortened; the rear keeps its
  // original length.
  // Shifts the whole rod (body, glint and end face) along its axis.
  const coreShift = 4;
  const coreLeft = 11.4 + coreShift; // 10% shorter overhang past the first turn
  const coreTop = -18;
  const coreBottom = 18;
  const coreRearRadius = 18; // half the core height: a full rounded cap
  const coreRearOverhang = 14; // unchanged from the original artwork
  const coreRight = lastTurnX + coreRearOverhang + coreShift;
  const coreNoseRadius = 6; // ellipse rx: how far the nose pokes out

  // A back turn sweeps from the top of the coil, round the back, to the
  // bottom. The last one is the exception: the wire arrives there from
  // the straight rear lead at mid height, so only its lower half exists
  // (that lower half is this curve split at its midpoint).
  const rearTurnPath = (x, isLast) =>
    isLast && count > 1
      ? `M${x - 18},0 C${x - 18},17 ${x - 12},34 ${x},34`
      : `M${x},-34 C${x - 24},-34 ${x - 24},34 ${x},34`;

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
        {/*
         * Iron, not steel: warm grey with a brown/umber cast, a muted
         * (never white) specular band near the top, a deep shadow low
         * down and a little bounced light along the bottom rim — the
         * shading that makes a rod read as a cylinder.
         */}
        <linearGradient
          id="solenoidCoreShade"
          x1="0"
          y1="0"
          x2="0"
          y2="1"
        >
          <stop offset="0" stopColor="#6b6358" />
          <stop offset="0.06" stopColor="#9a9080" />
          <stop offset="0.19" stopColor="#cdc3b1" />
          <stop offset="0.29" stopColor="#b0a594" />
          <stop offset="0.5" stopColor="#8d8375" />
          <stop offset="0.72" stopColor="#6d6456" />
          <stop offset="0.88" stopColor="#574f44" />
          <stop offset="1" stopColor="#756c5e" />
        </linearGradient>

        {/*
         * The flat end face sits on a different plane from the body, so
         * it is shaded flatter and a little darker, with no specular band.
         */}
        <linearGradient
          id="solenoidCoreFaceShade"
          x1="0"
          y1="0"
          x2="0.35"
          y2="1"
        >
          <stop offset="0" stopColor="#a79d8d" />
          <stop offset="0.4" stopColor="#8a8071" />
          <stop offset="0.75" stopColor="#6d6457" />
          <stop offset="1" stopColor="#5b5349" />
        </linearGradient>

        {/*
         * A soft lengthwise glint along the top of the rod. Warm and
         * low-contrast, so it reads as iron rather than polished steel.
         */}
        <linearGradient
          id="solenoidCoreGlint"
          x1="0"
          y1="0"
          x2="1"
          y2="0"
        >
          <stop offset="0" stopColor="#fff6e8" stopOpacity="0" />
          <stop offset="0.14" stopColor="#fff6e8" stopOpacity="0.34" />
          <stop offset="0.62" stopColor="#fff6e8" stopOpacity="0.2" />
          <stop offset="1" stopColor="#fff6e8" stopOpacity="0" />
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
        {turnPositions.map((x, i) => (
          <path
            key={`rear-${x}`}
            className="solenoid-wire-rear"
            d={rearTurnPath(x, i === count - 1)}
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
          {turnPositions.map((x, i) => (
            <path
              key={`rear-flow-${x}`}
              className={currentFlowClass}
              d={rearTurnPath(x, i === count - 1)}
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

          Square corners at the front (left): the ellipse cap below
          is what rounds that end, and its overhang is 10% shorter
          than before. Rounded corners at the rear (right, no
          ellipse), at its original length.
          ===================================================== */}

      <path
        d={`M${coreLeft},${coreTop}
            L${coreRight - coreRearRadius},${coreTop}
            Q${coreRight},${coreTop} ${coreRight},${coreTop + coreRearRadius}
            L${coreRight},${coreBottom - coreRearRadius}
            Q${coreRight},${coreBottom} ${coreRight - coreRearRadius},${coreBottom}
            L${coreLeft},${coreBottom}
            Z`}
        fill="url(#solenoidCoreShade)"
        stroke="#5f564a"
        strokeWidth="2"
      />

      {/* Lengthwise glint along the top of the rod */}
      <rect
        x={coreLeft + 2}
        y="-12.5"
        width={Math.max(0, coreRight - coreLeft - 10)}
        height="3.6"
        rx="1.8"
        fill="url(#solenoidCoreGlint)"
      />

      {/* Flat end face, shaded on its own plane */}
      <ellipse
        cx={coreLeft}
        cy="0"
        rx={coreNoseRadius}
        ry="18"
        fill="url(#solenoidCoreFaceShade)"
        stroke="#5f564a"
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