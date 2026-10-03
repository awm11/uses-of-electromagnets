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

function BatterySymbol() {
  return (
    <g transform="translate(730,50)" stroke={C.ink} strokeLinecap="round">
      <text x="-14" y="-8" fontSize="20" fill={C.ink} stroke="none">
        +
      </text>
      <line x1="0" y1="-20" x2="0" y2="20" strokeWidth="5" />
      <line x1="9" y1="-10" x2="9" y2="10" strokeWidth="2.5" />
      <line
        x1="11"
        y1="0"
        x2="23"
        y2="0"
        stroke="#202020"
        strokeWidth="1.5"
        strokeDasharray="3 4"
      />
      <line x1="25" y1="-20" x2="25" y2="20" strokeWidth="5" />
      <line x1="34" y1="-10" x2="34" y2="10" strokeWidth="2.5" />
      <text x="42" y="-8" fontSize="14" fill={C.ink} stroke="none">
        −
      </text>
    </g>
  );
}

const DOOR_LOCK_SPRING = {
  anchor: 184,
  center: 330,
  radius: 8,
  turns: 6,
  restingLength: 84,
};

function doorLockSpringGeometry(length) {
  const { anchor, center, radius, turns } = DOOR_LOCK_SPRING;
  const pitch = length / turns;
  const point = (u) => [
    anchor + ((u + Math.PI / 2) / (2 * Math.PI)) * pitch + 2 * Math.cos(u),
    center + radius * Math.sin(u),
  ];
  const segment = (start, end) => {
    let path = "";
    for (let index = 0; index <= 8; index++) {
      const [x, y] = point(start + ((end - start) * index) / 8);
      path += `${index ? "L" : "M"}${x.toFixed(2)},${y.toFixed(2)} `;
    }
    return path;
  };

  let front = "";
  let back = "";
  for (let turn = 0; turn < turns; turn++) {
    const base = 2 * Math.PI * turn;
    front += segment(-Math.PI / 2 + base, Math.PI / 2 + base);
    back += segment(Math.PI / 2 + base, (3 * Math.PI) / 2 + base);
  }
  return { front, back };
}

const DOOR_LOCK_SPRING_REST = doorLockSpringGeometry(
  DOOR_LOCK_SPRING.restingLength
);

function DoorLockSpring({ boltRef }) {
  const pathsRef = useRef({ back: [], front: [] });
  const setPathRef = (layer, index) => (node) => {
    pathsRef.current[layer][index] = node;
  };

  useEffect(() => {
    let frame;
    let lastLength = null;

    const update = () => {
      const bolt = boltRef.current;
      const transform = bolt ? getComputedStyle(bolt).transform : "none";
      const matrix = transform !== "none" ? new DOMMatrix(transform) : null;
      const length = Math.max(
        4,
        DOOR_LOCK_SPRING.restingLength + (matrix ? matrix.m41 : 0)
      );

      if (length !== lastLength) {
        lastLength = length;
        const geometry = doorLockSpringGeometry(length);
        pathsRef.current.back.forEach((path) => path?.setAttribute("d", geometry.back));
        pathsRef.current.front.forEach((path) => path?.setAttribute("d", geometry.front));
      }

      frame = requestAnimationFrame(update);
    };

    update();
    return () => cancelAnimationFrame(frame);
  }, [boltRef]);

  return (
    <g fill="none" strokeLinecap="round" strokeLinejoin="round">
      <path ref={setPathRef("back", 0)} d={DOOR_LOCK_SPRING_REST.back} stroke="#374151" strokeWidth="5" />
      <path ref={setPathRef("back", 1)} d={DOOR_LOCK_SPRING_REST.back} stroke="#6b7280" strokeWidth="3.2" />
      <path ref={setPathRef("front", 0)} d={DOOR_LOCK_SPRING_REST.front} stroke="#374151" strokeWidth="5" />
      <path ref={setPathRef("front", 1)} d={DOOR_LOCK_SPRING_REST.front} stroke="#9ca3af" strokeWidth="3.2" />
      <path ref={setPathRef("front", 2)} d={DOOR_LOCK_SPRING_REST.front} stroke="#f3f4f6" strokeWidth="1" opacity="0.8" transform="translate(0 -0.8)" />
    </g>
  );
}

export function DoorLockPreview() {
  const [switchClosed, setSwitchClosed] = useState(false);
  const [currentOn, setCurrentOn] = useState(false);
  const [boltAttracted, setBoltAttracted] = useState(false);
  const boltRef = useRef(null);

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
            id="previewDoorGradient"
            x1="0"
            y1="0"
            x2="1"
            y2="0.35"
          >
            <stop offset="0%" stopColor="#c47743" />
            <stop offset="48%" stopColor="#b5602f" />
            <stop offset="100%" stopColor="#a6532b" />
          </linearGradient>
          <linearGradient
            id="previewFrameGradient"
            x1="0"
            y1="0"
            x2="1"
            y2="0.2"
          >
            <stop offset="0%" stopColor="#884725" />
            <stop offset="55%" stopColor="#71351c" />
            <stop offset="100%" stopColor="#653018" />
          </linearGradient>
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
          fill="url(#previewDoorGradient)"
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
          fill="url(#previewFrameGradient)"
        />

        <rect
          x="150"
          y="318"
          width="34"
          height="300"
          fill="url(#previewFrameGradient)"
        />

        <rect
          x="0"
          y="-5"
          width="184"
          height="34"
          fill="url(#previewFrameGradient)"
        />

        <DoorLockSpring boltRef={boltRef} />

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

        <BatterySymbol />

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
          ref={boltRef}
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
  const [maximised, setMaximised] = useState(false);
  const cardRef = useRef(null);
  const boltRef = useRef(null);

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

  useEffect(() => {
    const onFullscreenChange = () => {
      if (!document.fullscreenElement) setMaximised(false);
    };
    const onKeyDown = (event) => {
      if (event.key === "Escape") setMaximised(false);
    };

    document.addEventListener("fullscreenchange", onFullscreenChange);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("fullscreenchange", onFullscreenChange);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, []);

  const toggleMaximise = () => {
    if (maximised) {
      setMaximised(false);
      if (document.fullscreenElement && document.exitFullscreen) {
        document.exitFullscreen().catch(() => {});
      }
      return;
    }

    setMaximised(true);
    if (cardRef.current?.requestFullscreen) {
      cardRef.current.requestFullscreen().catch(() => {});
    }
  };

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
          position: relative;
          background: #fff;
          border: 1px solid #d9dee4;
          border-radius: 18px;
          box-shadow: 0 10px 28px rgba(31, 41, 55, .07);
          overflow: hidden;
        }

        .maxBtn {
          position: absolute;
          bottom: 76px;
          right: 12px;
          z-index: 2;
          width: 48px;
          height: 48px;
          display: flex;
          align-items: center;
          justify-content: center;
          border: 1px solid #d9dee4;
          border-radius: 8px;
          background: #fff;
          color: ${C.ink};
          cursor: pointer;
        }

        .maxBtn:hover {
          background: #eef1f5;
        }

        .maxBtn:focus-visible {
          outline: 3px solid rgba(33, 102, 209, .3);
          outline-offset: 2px;
        }

        .door-lock-switch-hit:focus,
        .door-lock-switch-hit:focus-visible {
          outline: none;
        }

        .card.max {
          position: fixed;
          inset: 0;
          z-index: 1000;
          display: flex;
          flex-direction: column;
          border: 0;
          border-radius: 0;
        }

        .card.max .stage {
          flex: 1;
          min-height: 0;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .card.max .stage svg {
          width: 100%;
          height: 100%;
          max-width: none;
          object-fit: contain;
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
          display: flex;
          align-items: center;
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
          display: block;
          flex: 0 0 24px;
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

        <section className={"card" + (maximised ? " max" : "")} ref={cardRef}>
          <button
            className="maxBtn"
            onClick={toggleMaximise}
            aria-label={maximised ? "Exit full screen" : "Maximise the simulation"}
            title={maximised ? "Exit full screen (Esc)" : "Maximise"}
          >
            {maximised ? (
              <svg viewBox="0 0 16 16" width="16" height="16" aria-hidden="true">
                <path d="M6 1v5H1M10 15v-5h5M15 6h-5V1M1 10h5v5" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            ) : (
              <svg viewBox="0 0 16 16" width="16" height="16" aria-hidden="true">
                <path d="M1 6V1h5M15 10v5h-5M10 1h5v5M6 15H1v-5" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            )}
          </button>
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
                  id="doorGradient"
                  x1="0"
                  y1="0"
                  x2="1"
                  y2="0.35"
                >
                  <stop offset="0%" stopColor="#c47743" />
                  <stop offset="48%" stopColor="#b5602f" />
                  <stop offset="100%" stopColor="#a6532b" />
                </linearGradient>
                <linearGradient
                  id="frameGradient"
                  x1="0"
                  y1="0"
                  x2="1"
                  y2="0.2"
                >
                  <stop offset="0%" stopColor="#884725" />
                  <stop offset="55%" stopColor="#71351c" />
                  <stop offset="100%" stopColor="#653018" />
                </linearGradient>
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

                <clipPath id="doorInsetClip">
                  <rect x="68" y="277" width="67" height="40" rx="3" ry="3" />
                </clipPath>
              </defs>

              {/* Door */}
              <rect
                x="0"
                y="40"
                width="135"
                height="590"
                fill="url(#doorGradient)"
              />

              <g clipPath="url(#doorInsetClip)">
                <rect
                  x="66"
                  y="277"
                  width="69"
                  height="40"
                  fill="#5a2c12"
                />
              </g>

              {/* Door frame */}
              <rect
                x="150"
                y="20"
                width="34"
                height="300"
                fill="url(#frameGradient)"
              />

              <rect
                x="150"
                y="318"
                width="34"
                height="300"
                fill="url(#frameGradient)"
              />

              <rect
                x="0"
                y="-5"
                width="184"
                height="34"
                fill="url(#frameGradient)"
              />

              <DoorLockSpring boltRef={boltRef} />

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

              <BatterySymbol />

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

              <g>
                {!switchClosed && !animating && (
                  <circle
                    cx="812"
                    cy="175"
                    r="27"
                    fill="none"
                    stroke="#d97706"
                    strokeWidth="2"
                    className="door-lock-switch-pulse"
                  />
                )}
                <rect
                  x="784"
                  y="145"
                  width="56"
                  height="60"
                  rx="12"
                  fill="transparent"
                  className="door-lock-switch-hit"
                  role="switch"
                  tabIndex={animating ? -1 : 0}
                  aria-checked={switchClosed}
                  aria-label="Door lock circuit switch"
                  aria-disabled={animating}
                  style={{ cursor: animating ? "default" : "pointer" }}
                  onClick={handleToggle}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" || event.key === " ") {
                      event.preventDefault();
                      handleToggle();
                    }
                  }}
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
                  d="M812,150 V230 H701 V240"
                  fill="none"
                  stroke="#ff3b30"
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeDasharray="9 15"
                  className="door-lock-flow"
                />
              )}

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

              {/* Magnetic field overlay: render above the solenoid */}
              <image
                href={magneticFieldLines}
                x="490"
                y="205"
                width="330"
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
                ref={boltRef}
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
                x="10"
                y="20"
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
                  y="116"
                  fontSize="22"
                  fill="#d97706"
                  fontWeight="600"
                  textAnchor="middle"
                >
                  <tspan x="660">Current</tspan>
                  <tspan x="660" dy="1.1em">flowing!</tspan>
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
    stroke: #ff3b30 !important;
    stroke-dasharray: 9 15;
    stroke-dashoffset: 0;
    animation: doorLockDash 0.666667s linear infinite;
  }

  @keyframes doorLockSwitchPulse {
    from { opacity: .95; transform: scale(1); }
    to { opacity: 0; transform: scale(1.8); }
  }

  .door-lock-switch-pulse {
    transform-box: fill-box;
    transform-origin: center;
    animation: doorLockSwitchPulse 1.1s ease-out infinite;
    pointer-events: none;
  }

  @media (prefers-reduced-motion: reduce) {
    .door-lock-switch-pulse { animation: none; opacity: .9; }
  }
`;