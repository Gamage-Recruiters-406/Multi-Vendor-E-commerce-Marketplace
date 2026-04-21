import { ArrowRight } from 'lucide-react';
import heroImage from '../../assets/hero-illustration.png';

const HERO_ILLUSTRATION = heroImage;

export default function Hero({ features }) {
  return (
    <div
      className="flex flex-col"
      style={{
        height: '100dvh',
        background:
          'linear-gradient(135deg, #0d6e52 0%, #1A9F73 45%, #22c98e 100%)',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Ambient orbs */}
      <div
        style={{
          position: 'absolute',
          width: 500,
          height: 500,
          borderRadius: '50%',
          background:
            'radial-gradient(circle, rgba(255,255,255,0.15) 0%, transparent 70%)',
          top: -100,
          right: -80,
          pointerEvents: 'none',
        }}
      />
      <div
        style={{
          position: 'absolute',
          width: 260,
          height: 260,
          borderRadius: '50%',
          background:
            'radial-gradient(circle, rgba(250,204,21,0.12) 0%, transparent 70%)',
          bottom: 160,
          left: 40,
          pointerEvents: 'none',
        }}
      />
      <div
        style={{
          position: 'absolute',
          width: 180,
          height: 180,
          borderRadius: '50%',
          background:
            'radial-gradient(circle, rgba(255,255,255,0.08) 0%, transparent 70%)',
          top: '55%',
          left: '55%',
          pointerEvents: 'none',
        }}
      />

      {/* HERO */}
      <section
        className="relative flex flex-1 items-center px-4 pt-10 pb-2 sm:px-6 sm:pt-14 sm:pb-4 md:px-16 lg:px-24"
        style={{ zIndex: 2, minHeight: 0 }}
      >
        <div className="mx-auto max-w-6xl flex flex-col-reverse gap-4 sm:gap-6 md:flex-row md:items-center md:justify-between w-full">
          {/* Left copy */}
          <div className="pb-2 sm:pb-4 md:pb-8 max-w-lg text-center md:text-left">
            <div className="mb-3 sm:mb-5 flex items-center justify-center md:justify-start gap-1">
              <span className="text-3xl sm:text-5xl font-extrabold tracking-tight text-white">
                NE
              </span>
              <span
                className="text-3xl sm:text-5xl font-extrabold tracking-tight text-yellow-400"
                style={{ textShadow: '0 0 32px rgba(250,204,21,0.45)' }}
              >
                XIO
              </span>
            </div>
            <p className="mb-1 sm:mb-2 text-base sm:text-xl font-semibold text-white/90">
              Multi Vendor Platform
            </p>
            <p className="mb-4 sm:mb-7 text-xs sm:text-base text-white/70 leading-relaxed px-2 sm:px-0">
              Bringing you closer to the things you{' '}
              <span className="text-yellow-400 font-semibold italic">
                love
              </span>
              , with convenience, quality, and a touch of inspiration
            </p>

            {/* Mobile: Arrow only button | Desktop: Full text button */}
            <button
              className="inline-flex items-center justify-center gap-2 rounded-full font-semibold text-white transition hover:gap-3 active:scale-95 mx-auto md:mx-0"
              style={{
                background: 'rgba(255,255,255,0.15)',
                border: '1.5px solid rgba(255,255,255,0.35)',
                backdropFilter: 'blur(12px)',
                WebkitBackdropFilter: 'blur(12px)',
                boxShadow:
                  '0 8px 32px rgba(0,0,0,0.12), inset 0 1px 0 rgba(255,255,255,0.25)',
              }}
            >
              {/* Mobile view  */}
              <span className="sm:hidden px-4 py-2 text-sm">
                <ArrowRight size={18} />
              </span>
              {/* Desktop view  */}
              <span className="hidden sm:inline-flex items-center gap-2 px-5 sm:px-7 py-2 sm:py-3.5 text-xs sm:text-sm">
                Get started <ArrowRight size={15} />
              </span>
            </button>
          </div>

          {/* Right: Illustration */}
          <div className="flex justify-center md:justify-end">
            <img
              src={HERO_ILLUSTRATION}
              alt="Platform illustration"
              className="w-40 sm:w-72 md:w-[380px] lg:w-[420px] h-auto object-contain select-none"
              style={{ filter: 'drop-shadow(0 20px 40px rgba(0,0,0,0.2))' }}
            />
          </div>
        </div>
      </section>

      {/* Scroll hint dots  */}
      <div
        className="hidden sm:flex"
        style={{
          position: 'absolute',
          bottom: 'calc(var(--feature-strip-height, 180px) + 16px)',
          left: '50%',
          transform: 'translateX(-50%)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 5,
          zIndex: 3,
          opacity: 0.5,
        }}
      >
        {[0, 200, 400].map((delay) => (
          <div
            key={delay}
            style={{
              width: 6,
              height: 6,
              borderRadius: '50%',
              background: 'rgba(255,255,255,0.9)',
              animation: `bounce 1.6s ${delay}ms infinite`,
            }}
          />
        ))}
      </div>

      {/* FEATURE STRIP */}
      <section
        style={{
          background: 'rgba(0,0,0,0.12)',
          backdropFilter: 'blur(8px)',
          WebkitBackdropFilter: 'blur(8px)',
          borderTop: '1px solid rgba(255,255,255,0.12)',
          position: 'relative',
          zIndex: 2,
        }}
        className="px-4 py-4 sm:px-6 sm:py-8 md:px-16 lg:px-24"
      >
        <div className="mx-auto max-w-6xl grid grid-cols-1 gap-3 sm:gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {features.map((f) => (
            <div
              key={f.title}
              className="rounded-xl sm:rounded-2xl px-3 sm:px-5 py-3 sm:py-5 transition-all duration-200 hover:-translate-y-1"
              style={{
                background: 'rgba(255,255,255,0.09)',
                border: '1px solid rgba(255,255,255,0.18)',
                backdropFilter: 'blur(16px)',
                WebkitBackdropFilter: 'blur(16px)',
                boxShadow:
                  '0 8px 24px rgba(0,0,0,0.1), inset 0 1px 0 rgba(255,255,255,0.22), inset 0 -1px 0 rgba(0,0,0,0.06)',
              }}
            >
              <div className="mb-2 sm:mb-3 flex items-center gap-2">
                {f.icon}
                <span className="text-xs sm:text-sm font-bold text-white">
                  {f.title}
                </span>
              </div>
              <p className="text-[10px] sm:text-xs text-white/60 leading-relaxed">
                {f.desc}
              </p>
            </div>
          ))}
        </div>
      </section>

      <style>{`
        @keyframes bounce {
          0%, 80%, 100% { transform: translateY(0); opacity: 0.3; }
          40%            { transform: translateY(6px); opacity: 1; }
        }
      `}</style>
    </div>
  );
}