import React from 'react';
import { useNavigate } from 'react-router-dom';

const NotFound: React.FC = () => {
  const navigate = useNavigate();

  return (
    <main className="relative w-full min-h-[100svh] bg-black text-white overflow-x-hidden overflow-y-auto selection:bg-transparent">
      {/* Font Injection */}
      <style>{`
        @font-face {
          font-family: "Geist Mono:SemiBold";
          font-style: normal;
          font-weight: 600;
          font-display: swap;
          src: url("https://static.figma.com/font/GeistMono_wght__1") format("woff2");
        }

        .font-geist-mono {
          font-family: "Geist Mono:SemiBold", monospace;
        }

        .text-gradient-404 {
          background-image: linear-gradient(
            247.3282658084845deg,
            rgb(255, 255, 255) 2.5334%,
            rgba(255, 255, 255, 0.4) 93.612%
          );
          -webkit-background-clip: text;
          background-clip: text;
          color: transparent;
          -webkit-text-fill-color: transparent;
        }
      `}</style>

      {/* BACKGROUND VIDEO */}
      <video
        autoPlay
        loop
        muted
        playsInline
        aria-hidden="true"
        className="absolute inset-0 w-full h-full object-cover z-0 opacity-100 pointer-events-none"
        src="https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260801_001207_ec20d138-aa45-4b2b-ab8c-bdc71607f240.mp4"
      />

      {/* HEADER LOGO */}
      <header
        aria-label="LGPSM"
        className="absolute left-1/2 -translate-x-1/2 z-10 flex items-center top-[32px] sm:top-[80px] w-[233px] h-[40px] origin-top scale-75 sm:scale-100"
      >
        {/* Geometric Mark (54px x 40px) */}
        <svg
          aria-hidden="true"
          className="w-[54px] h-[40px] shrink-0 fill-white"
          viewBox="0 0 54 40"
        >
          <rect x="0" y="0" width="10" height="40" />
          <rect x="14" y="0" width="12" height="10" />
          <rect x="14" y="15" width="12" height="10" />
          <rect x="14" y="30" width="12" height="10" />
          <rect x="30" y="0" width="10" height="40" />
          <rect x="44" y="0" width="10" height="40" />
        </svg>

        {/* Logotype (14px spacing) */}
        <svg
          aria-hidden="true"
          className="ml-[14px] h-[40px] w-auto fill-white"
          viewBox="0 0 164.311 100"
        >
          <path d="M12.5 15h16v56h34v14h-50V15zm58 0h48v14h-32v18h28v14h-28v24h-16V15zm56 0h46c10 0 17 6 17 17v12c0 8-5 14-12 16l14 25h-18l-12-23h-19v23h-16V15zm16 14v17h28V29h-28z" />
        </svg>
      </header>

      {/* CENTERED 404 CONTENT */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-10 flex flex-col items-center text-center font-geist-mono w-[min(100%-40px,360px)] sm:w-[483px] gap-[24px] sm:gap-[36px]">
        {/* 404 HEADING */}
        <h1 className="text-gradient-404 font-[600] leading-[1.1] text-center select-none pb-2 sm:pb-4 text-[clamp(140px,52vw,200px)] tracking-[-0.09em] sm:text-[295.751px] sm:tracking-[-24.6459px] h-auto min-h-0">
          404
        </h1>

        {/* DIVIDER */}
        <div
          aria-hidden="true"
          className="h-[1px] bg-white w-full sm:w-[425px] shrink-0"
        />

        {/* MESSAGE */}
        <p className="w-full text-white font-[600] leading-[1.1] text-center text-[clamp(16px,4.5vw,20px)] tracking-[-1.3px] sm:text-[24px] sm:tracking-[-2px]">
          The path may be broken, but the journey isn't. Let's get you back.
        </p>

        {/* GO BACK BUTTON */}
        <button
          onClick={() => navigate(-1)}
          className="px-6 py-2 border border-white text-white font-[600] text-sm sm:text-base tracking-tight hover:bg-white hover:text-black transition-colors duration-200 cursor-pointer"
        >
          Go Back
        </button>
      </div>
    </main>
  );
};

export default NotFound;