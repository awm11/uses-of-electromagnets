import React, { useState } from "react";
import DoorLock from "./door_lock.jsx";
import RelaySwitch from "./relay_switch.jsx";
import CircuitBreaker from "./circuit_breaker.jsx";

export default function App() {
  const [page, setPage] = useState("home");

  const openLesson = (lesson) => {
    setPage(lesson);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  if (page === "doorlock") {
    return (
      <div className="app">
        <style>{styles}</style>

        <button className="backButton" onClick={() => setPage("home")}>
          <span>←</span>
          Back to uses of electromagnets
        </button>

        <DoorLock />
      </div>
    );
  }

  if (page === "relay") {
    return (
      <div className="app">
        <style>{styles}</style>

        <button className="backButton" onClick={() => setPage("home")}>
          <span>←</span>
          Back to uses of electromagnets
        </button>

        <RelaySwitch />
      </div>
    );
  }

  if (page === "circuitbreaker") {
    return (
      <div className="app">
        <style>{styles}</style>

        <button className="backButton" onClick={() => setPage("home")}>
          <span>←</span>
          Back to uses of electromagnets
        </button>

        <CircuitBreaker />
      </div>
    );
  }

  return (
    <div className="app">
      <style>{styles}</style>

      <section className="landing">
        {/* HERO */}
        <header className="hero">
          <div className="heroGlow glowOne" />
          <div className="heroGlow glowTwo" />

          <div className="heroInner">
            <div className="eyebrow">
              <span className="eyebrowDot" />
              Physics • Electromagnetism
            </div>

            <h1>
              The hidden force
              <br />
              <span>behind the switch.</span>
            </h1>

            <p className="heroText">
              Discover how electromagnets turn electrical energy into
              controlled motion — powering locks, relays, circuit breakers,
              and countless everyday devices.
            </p>

            <div className="heroMeta">
              <div className="metaItem">
                <span className="metaIcon">⚡</span>
                <div>
                  <strong>3</strong>
                  <span>interactive lessons</span>
                </div>
              </div>

              <div className="metaDivider" />

              <div className="metaItem">
                <span className="metaIcon">◉</span>
                <div>
                  <strong>Hands-on</strong>
                  <span>simulations</span>
                </div>
              </div>
            </div>
          </div>

          {/* Electromagnet illustration */}
          <div className="magnetVisual" aria-hidden="true">
            <div className="field field1" />
            <div className="field field2" />
            <div className="field field3" />

            <div className="coil">
              <div className="coilLine line1" />
              <div className="coilLine line2" />
              <div className="coilLine line3" />
              <div className="coilLine line4" />
              <div className="coilLine line5" />
              <div className="coilLine line6" />
            </div>

            <div className="core">
              <span>N</span>
              <div className="coreCenter" />
              <span>S</span>
            </div>

            <div className="spark spark1">+</div>
            <div className="spark spark2">−</div>
            <div className="spark spark3">+</div>
          </div>
        </header>

        {/* LESSONS */}
        <main className="content">
          <div className="sectionHeading">
            <div>
              <div className="sectionEyebrow">EXPLORE</div>
              <h2>Electromagnets in action</h2>
            </div>

            <p>
              Pick a device to see the electromagnetic principle
              come to life.
            </p>
          </div>

          <div className="cards">
            {/* Door lock */}
            <button
              className="lessonCard doorCard"
              onClick={() => openLesson("doorlock")}
            >
              <div className="cardTop">
                <span className="number">01</span>
                <span className="cardArrow">↗</span>
              </div>

              <div className="cardIllustration doorIllustration">
                <div className="door">
                  <div className="doorHandle" />
                </div>

                <div className="lockBody">
                  <div className="lockShackle" />
                  <div className="lockHole" />
                </div>

                <div className="electricLine lineA" />
                <div className="electricLine lineB" />
              </div>

              <div className="cardContent">
                <div className="cardTag">SECURITY</div>

                <h3>Electromagnetic Door Lock</h3>

                <p>
                  See how an electromagnet creates the force needed
                  to control a door-locking mechanism.
                </p>

                <span className="openLesson">
                  Explore simulation
                  <span>→</span>
                </span>
              </div>
            </button>

            {/* Relay */}
            <button
              className="lessonCard relayCard"
              onClick={() => openLesson("relay")}
            >
              <div className="cardTop">
                <span className="number">02</span>
                <span className="cardArrow">↗</span>
              </div>

              <div className="cardIllustration relayIllustration">
                <div className="relayBox">
                  <div className="relayCoil">
                    <i />
                    <i />
                    <i />
                    <i />
                    <i />
                  </div>

                  <div className="relayArm" />
                  <div className="relayContact" />
                </div>

                <div className="relayPulse pulse1" />
                <div className="relayPulse pulse2" />
              </div>

              <div className="cardContent">
                <div className="cardTag">SWITCHING</div>

                <h3>Relay Switch</h3>

                <p>
                  Learn how a small current can activate an
                  electromagnet and control a separate circuit.
                </p>

                <span className="openLesson">
                  Explore simulation
                  <span>→</span>
                </span>
              </div>
            </button>

            {/* Circuit breaker */}
            <button
              className="lessonCard circuitBreakerCard"
              onClick={() => openLesson("circuitbreaker")}
            >
              <div className="cardTop">
                <span className="number">03</span>
                <span className="cardArrow">↗</span>
              </div>

              <div className="cardIllustration circuitBreakerIllustration">
                <div className="breakerBox">
                  <div className="breakerCoil">
                    <i />
                    <i />
                    <i />
                    <i />
                    <i />
                  </div>

                  <div className="breakerArm" />
                  <div className="breakerContact" />
                  <div className="breakerSpark">⚡</div>
                </div>

                <div className="breakerPulse breakerPulse1" />
                <div className="breakerPulse breakerPulse2" />
              </div>

              <div className="cardContent">
                <div className="cardTag">SAFETY</div>

                <h3>Electromagnetic Circuit Breaker</h3>

                <p>
                  Explore how an electromagnet can detect excessive
                  current and quickly disconnect a circuit for safety.
                </p>

                <span className="openLesson">
                  Explore simulation
                  <span>→</span>
                </span>
              </div>
            </button>
          </div>

          {/* Bottom concept strip */}
          <section className="conceptStrip">
            <div className="conceptIcon">⚡</div>

            <div>
              <span className="conceptLabel">THE CORE IDEA</span>
              <p>
                Electricity → magnetic field → mechanical force
              </p>
            </div>

            <div className="conceptDots">
              <span />
              <span />
              <span />
            </div>
          </section>
        </main>
      </section>
    </div>
  );
}

const styles = `
  * {
    box-sizing: border-box;
  }

  html {
    scroll-behavior: smooth;
  }

  body {
    margin: 0;
    font-family:
      Inter,
      ui-sans-serif,
      system-ui,
      -apple-system,
      BlinkMacSystemFont,
      "Segoe UI",
      sans-serif;
    background: #f5f7fb;
    color: #111827;
  }

  button {
    font: inherit;
  }

  .app {
    min-height: 100vh;
  }

  /* -------------------------
     HERO
  ------------------------- */

  .hero {
    position: relative;
    min-height: 570px;
    overflow: hidden;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 76px 24px 90px;
    background:
      radial-gradient(
        circle at 50% 100%,
        rgba(37, 99, 235, .16),
        transparent 40%
      ),
      linear-gradient(145deg, #07111f 0%, #0b1728 55%, #101d32 100%);
    color: white;
  }

  .hero::before {
    content: "";
    position: absolute;
    inset: 0;
    opacity: .18;
    background-image:
      linear-gradient(rgba(255,255,255,.08) 1px, transparent 1px),
      linear-gradient(90deg, rgba(255,255,255,.08) 1px, transparent 1px);
    background-size: 44px 44px;
    mask-image: linear-gradient(to bottom, black, transparent);
  }

  .heroInner {
    position: relative;
    z-index: 3;
    width: min(780px, 100%);
    text-align: center;
  }

  .heroGlow {
    position: absolute;
    width: 420px;
    height: 420px;
    border-radius: 50%;
    filter: blur(80px);
    pointer-events: none;
  }

  .glowOne {
    left: -160px;
    top: 100px;
    background: rgba(37, 99, 235, .18);
  }

  .glowTwo {
    right: -160px;
    bottom: -100px;
    background: rgba(56, 189, 248, .13);
  }

  .eyebrow {
    display: inline-flex;
    align-items: center;
    gap: 9px;
    padding: 8px 13px;
    border: 1px solid rgba(147, 197, 253, .22);
    border-radius: 999px;
    background: rgba(255,255,255,.06);
    color: #bfdbfe;
    font-size: 11px;
    font-weight: 800;
    letter-spacing: .16em;
    text-transform: uppercase;
    backdrop-filter: blur(10px);
  }

  .eyebrowDot {
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: #60a5fa;
    box-shadow: 0 0 12px #60a5fa;
  }

  .hero h1 {
    margin: 24px 0 0;
    font-size: clamp(46px, 8vw, 82px);
    line-height: .96;
    letter-spacing: -.065em;
    font-weight: 850;
  }

  .hero h1 span {
    color: #7dd3fc;
  }

  .heroText {
    max-width: 650px;
    margin: 25px auto 0;
    color: #a9b7c9;
    font-size: 17px;
    line-height: 1.65;
  }

  .heroMeta {
    display: inline-flex;
    align-items: center;
    gap: 24px;
    margin-top: 34px;
    padding: 11px 17px;
    border: 1px solid rgba(255,255,255,.09);
    border-radius: 18px;
    background: rgba(255,255,255,.045);
    backdrop-filter: blur(12px);
  }

  .metaItem {
    display: flex;
    align-items: center;
    gap: 10px;
    text-align: left;
  }

  .metaIcon {
    display: grid;
    place-items: center;
    width: 32px;
    height: 32px;
    border-radius: 10px;
    background: rgba(96,165,250,.13);
    color: #7dd3fc;
  }

  .metaItem div {
    display: flex;
    flex-direction: column;
    gap: 1px;
  }

  .metaItem strong {
    font-size: 12px;
    color: #f8fafc;
  }

  .metaItem div span {
    color: #8191a5;
    font-size: 10px;
  }

  .metaDivider {
    width: 1px;
    height: 28px;
    background: rgba(255,255,255,.1);
  }

  /* -------------------------
     ELECTROMAGNET VISUAL
  ------------------------- */

  .magnetVisual {
    position: absolute;
    z-index: 1;
    width: 270px;
    height: 270px;
    right: max(4vw, 30px);
    bottom: -65px;
    opacity: .62;
    transform: rotate(-13deg);
  }

  .core {
    position: absolute;
    left: 50%;
    top: 50%;
    width: 160px;
    height: 48px;
    transform: translate(-50%, -50%);
    border-radius: 8px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0 15px;
    background: linear-gradient(90deg, #dc2626, #ef4444 48%, #2563eb 52%, #1d4ed8);
    box-shadow:
      0 0 35px rgba(59,130,246,.28),
      0 12px 30px rgba(0,0,0,.3);
    color: white;
    font-size: 12px;
    font-weight: 900;
  }

  .coreCenter {
    width: 2px;
    height: 100%;
    background: rgba(255,255,255,.2);
  }

  .coil {
    position: absolute;
    left: 50%;
    top: 50%;
    width: 205px;
    height: 92px;
    transform: translate(-50%, -50%);
  }

  .coilLine {
    position: absolute;
    left: 50%;
    top: 50%;
    width: 24px;
    height: 105px;
    transform-origin: center;
    border: 4px solid #60a5fa;
    border-left: 0;
    border-radius: 0 50% 50% 0;
    box-shadow: 0 0 12px rgba(96,165,250,.5);
  }

  .line1 { transform: translate(-105px, -50%) rotate(0deg); }
  .line2 { transform: translate(-75px, -50%) rotate(0deg); }
  .line3 { transform: translate(-45px, -50%) rotate(0deg); }
  .line4 { transform: translate(20px, -50%) rotate(180deg); }
  .line5 { transform: translate(50px, -50%) rotate(180deg); }
  .line6 { transform: translate(80px, -50%) rotate(180deg); }

  .field {
    position: absolute;
    border: 1px solid rgba(96,165,250,.35);
    border-radius: 50%;
    left: 50%;
    top: 50%;
    transform: translate(-50%, -50%);
  }

  .field1 {
    width: 240px;
    height: 150px;
  }

  .field2 {
    width: 290px;
    height: 185px;
  }

  .field3 {
    width: 340px;
    height: 220px;
  }

  .spark {
    position: absolute;
    color: #7dd3fc;
    font-weight: 900;
    animation: float 2.8s ease-in-out infinite;
  }

  .spark1 { top: 18px; left: 42px; }
  .spark2 { top: 52px; right: 22px; animation-delay: .8s; }
  .spark3 { bottom: 12px; left: 88px; animation-delay: 1.4s; }

  @keyframes float {
    0%, 100% { transform: translateY(0); opacity: .55; }
    50% { transform: translateY(-9px); opacity: 1; }
  }

  /* -------------------------
     CONTENT
  ------------------------- */

  .content {
    position: relative;
    width: min(1120px, calc(100% - 40px));
    margin: 0 auto;
    padding: 68px 0 80px;
  }

  .sectionHeading {
    display: flex;
    align-items: end;
    justify-content: space-between;
    gap: 30px;
    margin-bottom: 28px;
  }

  .sectionEyebrow {
    margin-bottom: 8px;
    color: #2563eb;
    font-size: 10px;
    font-weight: 900;
    letter-spacing: .18em;
  }

  .sectionHeading h2 {
    margin: 0;
    font-size: 32px;
    line-height: 1.1;
    letter-spacing: -.045em;
  }

  .sectionHeading > p {
    max-width: 350px;
    margin: 0;
    color: #64748b;
    font-size: 14px;
    line-height: 1.55;
    text-align: right;
  }

  /* -------------------------
     CARDS
  ------------------------- */

  .cards {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 22px;
  }

  .lessonCard {
    position: relative;
    min-height: 500px;
    overflow: hidden;
    padding: 25px;
    border: 1px solid #e2e8f0;
    border-radius: 28px;
    background: white;
    text-align: left;
    cursor: pointer;
    box-shadow:
      0 8px 30px rgba(15,23,42,.055),
      0 2px 5px rgba(15,23,42,.025);
    transition:
      transform .28s ease,
      box-shadow .28s ease,
      border-color .28s ease;
  }

  .lessonCard::after {
    content: "";
    position: absolute;
    inset: 0;
    pointer-events: none;
    opacity: 0;
    background: radial-gradient(
      circle at 50% 0%,
      rgba(59,130,246,.08),
      transparent 45%
    );
    transition: opacity .3s ease;
  }

  .lessonCard:hover {
    transform: translateY(-7px);
    border-color: #bfdbfe;
    box-shadow:
      0 24px 55px rgba(15,23,42,.11),
      0 4px 10px rgba(15,23,42,.04);
  }

  .lessonCard:hover::after {
    opacity: 1;
  }

  .lessonCard:focus-visible {
    outline: 3px solid rgba(37,99,235,.35);
    outline-offset: 4px;
  }

  .cardTop {
    position: relative;
    z-index: 2;
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .number {
    display: grid;
    place-items: center;
    width: 38px;
    height: 38px;
    border-radius: 12px;
    background: #eff6ff;
    color: #2563eb;
    font-size: 12px;
    font-weight: 900;
  }

  .cardArrow {
    display: grid;
    place-items: center;
    width: 38px;
    height: 38px;
    border: 1px solid #e5e7eb;
    border-radius: 50%;
    color: #64748b;
    font-size: 17px;
    transition:
      transform .25s ease,
      background .25s ease,
      color .25s ease;
  }

  .lessonCard:hover .cardArrow {
    transform: translate(2px, -2px);
    background: #eff6ff;
    color: #2563eb;
  }

  .cardIllustration {
    position: relative;
    height: 205px;
    margin: 12px 0 20px;
    border-radius: 20px;
    overflow: hidden;
    background: #f8fafc;
  }

  /* Door illustration */
  .doorIllustration {
    background:
      radial-gradient(circle at 72% 45%, rgba(59,130,246,.12), transparent 35%),
      #f3f7fc;
  }

  .door {
    position: absolute;
    left: 25%;
    top: 18%;
    width: 105px;
    height: 145px;
    border: 5px solid #334155;
    border-radius: 5px;
    background: linear-gradient(135deg, #e2e8f0, #cbd5e1);
    box-shadow: 10px 12px 0 rgba(15,23,42,.06);
  }

  .doorHandle {
    position: absolute;
    right: 13px;
    top: 69px;
    width: 24px;
    height: 8px;
    border-radius: 8px;
    background: #64748b;
  }

  .lockBody {
    position: absolute;
    right: 21%;
    top: 76px;
    width: 55px;
    height: 62px;
    border-radius: 11px;
    background: #172033;
    box-shadow: 0 8px 20px rgba(15,23,42,.22);
  }

  .lockShackle {
    position: absolute;
    left: 14px;
    top: -29px;
    width: 27px;
    height: 37px;
    border: 7px solid #334155;
    border-bottom: 0;
    border-radius: 16px 16px 0 0;
  }

  .lockHole {
    position: absolute;
    left: 22px;
    top: 26px;
    width: 11px;
    height: 15px;
    border-radius: 50%;
    background: #60a5fa;
    box-shadow: 0 0 14px rgba(96,165,250,.8);
  }

  .electricLine {
    position: absolute;
    height: 2px;
    background: #60a5fa;
    box-shadow: 0 0 7px rgba(96,165,250,.6);
  }

  .lineA {
    left: 62%;
    top: 97px;
    width: 55px;
  }

  .lineB {
    left: 67%;
    top: 111px;
    width: 45px;
  }

  /* Relay illustration */
  .relayIllustration {
    display: grid;
    place-items: center;
    background:
      radial-gradient(circle at 50% 50%, rgba(37,99,235,.13), transparent 48%),
      #f4f7fb;
  }

  .relayBox {
    position: relative;
    width: 230px;
    height: 120px;
    border: 2px solid #cbd5e1;
    border-radius: 18px;
    background: white;
    box-shadow: 0 12px 30px rgba(15,23,42,.08);
  }

  .relayCoil {
    position: absolute;
    left: 24px;
    top: 32px;
    display: flex;
    gap: 4px;
  }

  .relayCoil i {
    display: block;
    width: 10px;
    height: 55px;
    border: 3px solid #2563eb;
    border-radius: 50%;
    transform: rotate(8deg);
  }

  .relayArm {
    position: absolute;
    left: 110px;
    top: 46px;
    width: 78px;
    height: 8px;
    border-radius: 10px;
    background: #475569;
    transform: rotate(-10deg);
    transform-origin: left center;
  }

  .relayContact {
    position: absolute;
    right: 22px;
    top: 32px;
    width: 13px;
    height: 50px;
    border-radius: 10px;
    background: #94a3b8;
  }

  .relayPulse {
    position: absolute;
    border-radius: 50%;
    border: 2px solid #60a5fa;
    animation: pulse 2.4s infinite;
  }

  .pulse1 {
    width: 170px;
    height: 170px;
  }

  .pulse2 {
    width: 220px;
    height: 220px;
    animation-delay: .7s;
  }

  /* Circuit breaker illustration */
  .circuitBreakerIllustration {
    display: grid;
    place-items: center;
    background:
      radial-gradient(circle at 50% 50%, rgba(37,99,235,.13), transparent 48%),
      #f4f7fb;
  }

  .breakerBox {
    position: relative;
    width: 230px;
    height: 120px;
    border: 2px solid #cbd5e1;
    border-radius: 18px;
    background: white;
    box-shadow: 0 12px 30px rgba(15,23,42,.08);
  }

  .breakerCoil {
    position: absolute;
    left: 24px;
    top: 32px;
    display: flex;
    gap: 4px;
  }

  .breakerCoil i {
    display: block;
    width: 10px;
    height: 55px;
    border: 3px solid #2563eb;
    border-radius: 50%;
    transform: rotate(8deg);
  }

  .breakerArm {
    position: absolute;
    left: 108px;
    top: 45px;
    width: 82px;
    height: 8px;
    border-radius: 10px;
    background: #475569;
    transform: rotate(-22deg);
    transform-origin: left center;
  }

  .breakerContact {
    position: absolute;
    right: 22px;
    top: 32px;
    width: 13px;
    height: 50px;
    border-radius: 10px;
    background: #94a3b8;
  }

  .breakerSpark {
    position: absolute;
    right: 36px;
    bottom: 13px;
    color: #2563eb;
    font-size: 20px;
    animation: breakerFlash 1.5s ease-in-out infinite;
  }

  .breakerPulse {
    position: absolute;
    border-radius: 50%;
    border: 2px solid #60a5fa;
    animation: pulse 2.4s infinite;
  }

  .breakerPulse1 {
    width: 170px;
    height: 170px;
  }

  .breakerPulse2 {
    width: 220px;
    height: 220px;
    animation-delay: .7s;
  }

  @keyframes breakerFlash {
    0%, 100% {
      opacity: .35;
      transform: scale(.9);
    }

    50% {
      opacity: 1;
      transform: scale(1.08);
    }
  }

  @keyframes pulse {
    0% {
      transform: scale(.7);
      opacity: .7;
    }

    100% {
      transform: scale(1.2);
      opacity: 0;
    }
  }

  .cardContent {
    position: relative;
    z-index: 2;
  }

  .cardTag {
    margin-bottom: 8px;
    color: #2563eb;
    font-size: 9px;
    font-weight: 900;
    letter-spacing: .17em;
  }

  .lessonCard h3 {
    margin: 0;
    max-width: 390px;
    color: #111827;
    font-size: 24px;
    line-height: 1.15;
    letter-spacing: -.035em;
  }

  .lessonCard p {
    max-width: 430px;
    margin: 11px 0 20px;
    color: #64748b;
    font-size: 14px;
    line-height: 1.6;
  }

  .openLesson {
    display: inline-flex;
    align-items: center;
    gap: 9px;
    color: #2563eb;
    font-size: 13px;
    font-weight: 850;
  }

  .openLesson span {
    transition: transform .2s ease;
  }

  .lessonCard:hover .openLesson span {
    transform: translateX(5px);
  }

  /* -------------------------
     CONCEPT STRIP
  ------------------------- */

  .conceptStrip {
    display: flex;
    align-items: center;
    gap: 16px;
    margin-top: 24px;
    padding: 19px 22px;
    border: 1px solid #e2e8f0;
    border-radius: 19px;
    background: rgba(255,255,255,.72);
  }

  .conceptIcon {
    display: grid;
    place-items: center;
    flex: 0 0 auto;
    width: 42px;
    height: 42px;
    border-radius: 13px;
    background: #eff6ff;
    color: #2563eb;
  }

  .conceptLabel {
    display: block;
    margin-bottom: 2px;
    color: #94a3b8;
    font-size: 9px;
    font-weight: 900;
    letter-spacing: .16em;
  }

  .conceptStrip p {
    margin: 0;
    color: #334155;
    font-size: 13px;
    font-weight: 700;
  }

  .conceptDots {
    display: flex;
    gap: 5px;
    margin-left: auto;
  }

  .conceptDots span {
    width: 5px;
    height: 5px;
    border-radius: 50%;
    background: #cbd5e1;
  }

  .conceptDots span:first-child {
    background: #60a5fa;
  }

  /* -------------------------
     BACK BUTTON
  ------------------------- */

  .backButton {
    display: inline-flex;
    align-items: center;
    gap: 9px;
    margin: 20px 24px;
    padding: 10px 15px;
    border: 1px solid #dbe2ea;
    border-radius: 12px;
    background: white;
    color: #334155;
    font-size: 13px;
    font-weight: 700;
    cursor: pointer;
    box-shadow: 0 3px 10px rgba(15,23,42,.04);
    transition:
      background .2s ease,
      transform .2s ease,
      box-shadow .2s ease;
  }

  .backButton span {
    font-size: 18px;
  }

  .backButton:hover {
    background: #f8fafc;
    transform: translateX(-2px);
    box-shadow: 0 5px 14px rgba(15,23,42,.07);
  }

  .backButton:focus-visible {
    outline: 3px solid rgba(37,99,235,.3);
    outline-offset: 3px;
  }

  /* -------------------------
     RESPONSIVE
  ------------------------- */

  @media (max-width: 850px) {
    .magnetVisual {
      opacity: .25;
      right: -80px;
    }

    .sectionHeading {
      align-items: start;
      flex-direction: column;
      gap: 10px;
    }

    .sectionHeading > p {
      max-width: 520px;
      text-align: left;
    }
  }

  @media (max-width: 700px) {
    .hero {
      min-height: auto;
      padding: 55px 20px 60px;
    }

    .hero h1 {
      font-size: clamp(43px, 13vw, 62px);
    }

    .heroText {
      font-size: 15px;
    }

    .heroMeta {
      width: 100%;
      justify-content: center;
      gap: 15px;
    }

    .metaDivider {
      display: none;
    }

    .metaItem:nth-child(3) {
      display: none;
    }

    .content {
      width: min(100% - 28px, 1120px);
      padding: 48px 0 60px;
    }

    .cards {
      grid-template-columns: 1fr;
    }

    .lessonCard {
      min-height: 470px;
    }

    .conceptDots {
      display: none;
    }
  }

  @media (max-width: 430px) {
    .eyebrow {
      font-size: 9px;
    }

    .heroMeta {
      padding: 10px 12px;
    }

    .lessonCard {
      padding: 19px;
      min-height: 450px;
    }

    .cardIllustration {
      height: 180px;
    }

    .lessonCard h3 {
      font-size: 22px;
    }

    .conceptStrip {
      align-items: flex-start;
    }
  }

  @media (prefers-reduced-motion: reduce) {
    *,
    *::before,
    *::after {
      animation-duration: .01ms !important;
      animation-iteration-count: 1 !important;
      scroll-behavior: auto !important;
      transition-duration: .01ms !important;
    }
  }
`;