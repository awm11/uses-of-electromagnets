import React, { useState } from "react";
import DoorLock, { DoorLockPreview } from "./door_lock.jsx";
import RelaySwitch from "./relay_switch.jsx";
import CircuitBreaker, { CircuitBreakerPreview } from "./circuit_breaker.jsx";
import Loudspeaker, { LoudspeakerPreview } from "./loudspeaker.jsx";
import BuyMeCoffeeButton from "./BuyMeCoffee.jsx";

export default function App() {
  const [page, setPage] = useState("home");

  const lessonCount = 4;
  const showCoffeeAsCard = lessonCount % 3 !== 0;

  const openLesson = (lesson) => {
    setPage(lesson);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const backButton = (
    <button className="backButton" onClick={() => setPage("home")}>
      <span>←</span>
      Back to lessons
    </button>
  );

  if (page === "doorlock") {
    return (
      <div className="app">
        {backButton}
        <DoorLock />
      </div>
    );
  }

  if (page === "relay") {
    return (
      <div className="app">
        {backButton}
        <RelaySwitch />
      </div>
    );
  }

  if (page === "circuitbreaker") {
    return (
      <div className="app">
        {backButton}
        <CircuitBreaker />
      </div>
    );
  }

  if (page === "loudspeaker") {
    return (
      <div className="app">
        {backButton}
        <Loudspeaker />
      </div>
    );
  }

  return (
    <div className="app">
      <style>{`
        * {
          box-sizing: border-box;
        }

        body {
          margin: 0;
          background: #f7f8fa;
          color: #172033;
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

        .app {
          min-height: 100vh;
          background: #f7f8fa;
        }

        .loudspeakerIllustration {
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .loudspeakerPreviewOnly {
          display: block;
          width: 100%;
          height: 100%;
        }

        .simpleHeader {
          position: relative;
          background: #ffffff;
          border-bottom: 1px solid #e4e7eb;
          padding: 22px 32px 20px 84px;
        }

        .siteLogo {
          position: absolute;
          top: 16px;
          left: 20px;
          z-index: 10;
          display: flex;
          align-items: center;
          justify-content: center;
          width: 52px;
          height: 52px;
          text-decoration: none;
        }

        .siteLogo img {
          display: block;
          width: 51px;
          height: 51px;
          object-fit: contain;
          transition:
            transform 0.2s ease,
            filter 0.2s ease;
        }

        .siteLogo:hover img {
          transform: scale(1.1) rotate(5deg);
        }

        .siteLogo:focus-visible {
          outline: 3px solid rgba(37, 99, 235, 0.22);
          outline-offset: 4px;
          border-radius: 8px;
        }

        .simpleHeaderInner {
          width: min(1380px, 100%);
          margin: 0 auto;
        }

        .simpleEyebrow {
          margin-bottom: 6px;
          color: #667085;
          font-size: 11px;
          font-weight: 800;
          letter-spacing: 0.12em;
        }

        .simpleHeader h1 {
          margin: 0;
          color: #172033;
          font-size: 34px;
          line-height: 1.1;
          font-weight: 750;
          letter-spacing: -0.025em;
        }

        .simpleHeader p {
          margin: 8px 0 0;
          color: #667085;
          font-size: 14px;
          line-height: 1.5;
        }

        .content {
          width: min(1380px, calc(100% - 40px));
          margin: 0 auto;
          padding: 34px 0 60px;
        }

        .sectionHeading {
          display: flex;
          align-items: baseline;
          justify-content: space-between;
          gap: 30px;
          margin-bottom: 20px;
        }

        .sectionHeading h2 {
          margin: 0;
          color: #172033;
          font-size: 22px;
          line-height: 1.2;
          font-weight: 700;
        }

        .sectionHeading p {
          margin: 0;
          color: #667085;
          font-size: 14px;
        }

        .cards {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 18px;
        }

        .lessonCard {
          position: relative;
          display: flex;
          flex-direction: column;
          min-width: 0;
          min-height: 440px;
          padding: 18px;
          border: 1px solid #dfe3e8;
          border-radius: 14px;
          background: #ffffff;
          color: #172033;
          text-align: left;
          cursor: pointer;
          overflow: hidden;
          box-shadow: 0 2px 6px rgba(15, 23, 42, 0.04);
          transition:
            transform 0.2s ease,
            border-color 0.2s ease,
            box-shadow 0.2s ease;
        }

        .lessonCard:hover {
          transform: scale(1.025);
          border-color: #c8ced7;
          box-shadow: 0 10px 24px rgba(15, 23, 42, 0.10);
        }

        .lessonCard:focus-visible {
          outline: 3px solid rgba(37, 99, 235, 0.22);
          outline-offset: 3px;
        }

        .cardTop {
          position: relative;
          z-index: 2;
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 8px;
        }

        .number {
          color: #98a2b3;
          font-size: 12px;
          font-weight: 700;
          letter-spacing: 0.08em;
        }

        .cardArrow {
          color: #667085;
          font-size: 19px;
          line-height: 1;
        }

        .cardIllustration {
          position: relative;
          height: 220px;
          flex: 0 0 220px;
          margin: 0 -4px 12px;
          border-radius: 10px;
          overflow: hidden;
          background: #f3f5f7;
        }

        .cardContent {
          position: relative;
          z-index: 2;
        }

        .cardTag {
          margin-bottom: 6px;
          color: #667085;
          font-size: 10px;
          font-weight: 800;
          letter-spacing: 0.12em;
        }

        .cardContent h3 {
          margin: 0;
          color: #172033;
          font-size: 20px;
          line-height: 1.2;
          font-weight: 700;
          letter-spacing: -0.015em;
        }

        .cardContent p {
          margin: 8px 0 12px;
          color: #667085;
          font-size: 13px;
          line-height: 1.55;
        }

        .openLesson {
          display: inline-flex;
          align-items: center;
          gap: 7px;
          color: #344054;
          font-size: 13px;
          font-weight: 700;
        }

        .openLesson span {
          font-size: 16px;
          transition: transform 0.18s ease;
        }

        .lessonCard:hover .openLesson span {
          transform: translateX(3px);
        }

        /* Door lock preview */

        .doorLockPreview {
          position: absolute;
          inset: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          overflow: hidden;
          pointer-events: none;
          background: #f1f3f5;
        }

        .doorLockPreview > * {
          width: 100%;
          height: 100%;
        }

        /* Relay preview */

        .relayPreview {
          position: absolute;
          inset: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          overflow: hidden;
          pointer-events: none;
        }

        .relayPreview > * {
          flex: 0 0 auto;
          width: 760px;
          transform: scale(.39);
          transform-origin: center center;
        }

        .relayPreview button {
          pointer-events: none;
        }

        /* Circuit breaker preview */

        .circuitBreakerIllustration {
          display: flex;
          align-items: center;
          justify-content: center;
          background: #f1f3f5;
        }

        .circuitBreakerIllustration > * {
          width: 100%;
          height: 100%;
        }

        /* Loudspeaker */

        .loudspeakerIllustration {
          display: flex;
          align-items: center;
          justify-content: center;
          background: #f1f3f5;
        }

        .loudspeakerPlaceholder {
          color: #98a2b3;
          font-size: 13px;
          font-weight: 600;
        }

        /* Support card */

        .supportCard {
          cursor: default;
        }

        .supportCard:hover {
          transform: scale(1.025);
        }

        .supportCardIllustration {
          display: flex;
          align-items: center;
          justify-content: center;
          background: #f3f5f7;
        }

        .supportCardContent {
          display: flex;
          flex-direction: column;
          align-items: center;
          width: 100%;
          padding: 18px 20px;
          text-align: center;
        }

        .supportCardMainLogoLink {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 82px;
          height: 82px;
          margin-bottom: 18px;
          border-radius: 18px;
          background: #ffffff;
          box-shadow: 0 4px 14px rgba(15, 23, 42, 0.08);
          text-decoration: none;
          transition:
            transform 0.2s ease,
            box-shadow 0.2s ease;
        }

        .supportCardMainLogoLink:hover {
          transform: translateY(-2px);
          box-shadow: 0 7px 18px rgba(15, 23, 42, 0.12);
        }

        .supportCardMainLogo {
          display: block;
          width: 62px;
          height: 62px;
          object-fit: contain;
          transition:
            transform 0.2s ease,
            filter 0.2s ease;
        }

        .supportCardMainLogoLink:hover .supportCardMainLogo {
          transform: scale(1.08) rotate(4deg);
        }

        .supportCardMainLogoLink:focus-visible {
          outline: 3px solid rgba(37, 99, 235, 0.22);
          outline-offset: 3px;
          border-radius: 8px;
        }

        .supportCardContent .cardTag {
          margin-bottom: 6px;
        }

        .supportCardContent h3 {
          margin: 0;
          color: #172033;
          font-size: 20px;
          line-height: 1.2;
          font-weight: 700;
        }

        .supportCardContent p {
          margin: 8px auto 0;
          max-width: 280px;
          color: #667085;
          font-size: 13px;
          line-height: 1.55;
        }

        .supportCardAction {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding-top: 30px;
          padding-bottom: 20px;
          gap: 8px;
        }

        .supportCardActionLabel {
          margin: 0;
          color: #667085;
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 0.06em;
          text-transform: uppercase;
        }

        /*
         * Buy Me a Coffee hover effect.
         * This targets the button/link rendered by BuyMeCoffeeButton.
         */
        .supportCardAction > *:last-child {
          transition:
            transform 0.2s ease,
            filter 0.2s ease;
          transform-origin: center;
        }

        .supportCardAction > *:last-child:hover {
          transform: scale(1.06);
        }

        /* Support */

        .supportSection {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 10px;
          margin-top: 42px;
          padding-top: 24px;
          border-top: 1px solid #e4e7eb;
        }

        .supportText {
          margin: 0;
          color: #667085;
          font-size: 13px;
        }

        .coffee-embed-frame {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 250px;
          height: 60px;
          border-radius: 10px;
          overflow: hidden;
        }

        .coffee-embed {
          display: block;
          width: 250px;
          height: 60px;
          border: 0;
          border-radius: 10px;
          overflow: hidden;
        }

        /* Back button */

        .backButton {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          margin: 18px 24px;
          padding: 9px 13px;
          border: 1px solid #dfe3e8;
          border-radius: 8px;
          background: #ffffff;
          color: #475467;
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
        }

        .backButton:hover {
          background: #f8fafc;
          border-color: #c8ced7;
        }

        .backButton span {
          font-size: 17px;
          line-height: 1;
        }

        /* Responsive */

        @media (max-width: 900px) {
          .cards {
            grid-template-columns: 1fr;
            max-width: 620px;
            margin: 0 auto;
          }

          .lessonCard {
            min-height: 420px;
          }

          .sectionHeading {
            display: block;
          }

          .sectionHeading p {
            margin-top: 5px;
          }
        }

        @media (max-width: 600px) {
          .simpleHeader {
            padding: 18px 20px 18px 70px;
          }

          .simpleHeaderInner {
            width: 100%;
          }

          .simpleHeader h1 {
            font-size: 30px;
          }

          .siteLogo {
            top: 16px;
            left: 18px;
            width: 50px;
            height: 50px;
          }

          .siteLogo img {
            width: 48px;
            height: 48px;
          }

          .content {
            width: min(100% - 28px, 620px);
            padding-top: 26px;
          }

          .cards {
            gap: 14px;
          }

          .lessonCard {
            padding: 14px;
            border-radius: 12px;
          }

          .lessonCard:hover {
            transform: scale(1.015);
          }

          .cardIllustration {
            height: 205px;
            flex-basis: 205px;
          }

          .relayPreview > * {
            transform: scale(.32);
          }
        }
      `}</style>

      <header className="simpleHeader">
        <a
          className="siteLogo"
          href="https://awm11.github.io/"
          aria-label="See other physics simulations"
        >
          <img src="favicon.svg" alt="" />
        </a>

        <div className="simpleHeaderInner">
          <div className="simpleEyebrow">
            PHYSICS • ELECTROMAGNETISM
          </div>

          <h1>Uses of electromagnets</h1>

          <p>
            Explore four everyday applications of electromagnets.
          </p>
        </div>
      </header>

      <main className="content">
        <div className="sectionHeading">
          <h2>Applications</h2>
          <p>Choose a lesson to explore the mechanism.</p>
        </div>

        <div className="cards">
          {/* Door Lock */}

          <button
            className="lessonCard"
            onClick={() => openLesson("doorlock")}
          >
            <div className="cardTop">
              <span className="number">01</span>
              <span className="cardArrow">→</span>
            </div>

            <div className="cardIllustration">
              <div className="doorLockPreview">
                <DoorLockPreview />
              </div>
            </div>

            <div className="cardContent">
              <div className="cardTag">SECURITY</div>

              <h3>Door Lock</h3>

              <p>
                See how an electromagnet can control an electric door lock.
              </p>

              <div className="openLesson">
                Explore lesson
                <span>→</span>
              </div>
            </div>
          </button>

          {/* Relay */}

          <button
            className="lessonCard"
            onClick={() => openLesson("relay")}
          >
            <div className="cardTop">
              <span className="number">02</span>
              <span className="cardArrow">→</span>
            </div>

            <div className="cardIllustration">
              <div className="relayPreview">
                <RelaySwitch preview />
              </div>
            </div>

            <div className="cardContent">
              <div className="cardTag">SWITCHING</div>

              <h3>Relay</h3>

              <p>
                Explore how a small current can use an electromagnet to
                control a separate circuit.
              </p>

              <div className="openLesson">
                Explore lesson
                <span>→</span>
              </div>
            </div>
          </button>

          {/* Circuit Breaker */}

          <button
            className="lessonCard"
            onClick={() => openLesson("circuitbreaker")}
          >
            <div className="cardTop">
              <span className="number">03</span>
              <span className="cardArrow">→</span>
            </div>

            <div className="cardIllustration circuitBreakerIllustration">
              <CircuitBreakerPreview />
            </div>

            <div className="cardContent">
              <div className="cardTag">SAFETY</div>

              <h3>Circuit Breaker</h3>

              <p>
                See how an electromagnet can detect excessive current and
                disconnect a circuit.
              </p>

              <div className="openLesson">
                Explore lesson
                <span>→</span>
              </div>
            </div>
          </button>

          {/* Loudspeaker */}

          <button
            className="lessonCard"
            onClick={() => openLesson("loudspeaker")}
          >
            <div className="cardTop">
              <span className="number">04</span>
              <span className="cardArrow">→</span>
            </div>

            <div className="cardIllustration loudspeakerIllustration">
              <LoudspeakerPreview />
            </div>

            <div className="cardContent">
              <div className="cardTag">SOUND</div>

              <h3>Loudspeaker</h3>

              <p>
                Explore how an electromagnet converts electrical signals
                into vibrations that produce sound.
              </p>

              <div className="openLesson">
                Explore lesson
                <span>→</span>
              </div>
            </div>
          </button>

          {/* Buy Me a Coffee */}

          {showCoffeeAsCard && (
            <div className="lessonCard supportCard">
              <div className="cardTop">
                <span className="number">05</span>
              </div>

              <div className="cardIllustration supportCardIllustration">
                <div className="supportCardContent">
                  <a
                    className="supportCardMainLogoLink"
                    href="https://awm11.github.io/"
                    aria-label="See other physics simulations"
                  >
                    <img
                      className="supportCardMainLogo"
                      src="favicon.svg"
                      alt=""
                    />
                  </a>

                  <div className="cardTag">MORE SIMULATIONS</div>

                  <h3>See other simulations</h3>

                  <p>
                    Click the icon above to explore other interactive
                    physics simulations like this one.
                  </p>
                </div>
              </div>

              <div className="cardContent supportCardAction">
                <p className="supportCardActionLabel">
                  Support the project
                </p>

                <BuyMeCoffeeButton />
              </div>
            </div>
          )}
        </div>

        {!showCoffeeAsCard && (
          <div className="supportSection">
            <p className="supportText">
              Support the project with a coffee
            </p>

            <BuyMeCoffeeButton />
          </div>
        )}
      </main>
    </div>
  );
}