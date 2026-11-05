import type { StoryScene } from '../../data/story'

export function StoryBackdrop({ scene, dim = false }: { scene: StoryScene; dim?: boolean }) {
  return (
    <div className="absolute inset-0 overflow-hidden" aria-hidden="true">
      <div
        className="absolute inset-0 transition-opacity duration-700"
        style={{ background: SCENE_BG[scene] }}
      />
      <svg
        viewBox="0 0 1440 900"
        preserveAspectRatio="xMidYMid slice"
        className="absolute inset-0 h-full w-full"
      >
        {scene === 'standup' && <StandupScene />}
        {scene === 'meeting' && <MeetingScene />}
        {scene === 'night' && <NightScene />}
        {scene === 'review' && <ReviewScene />}
        <defs>
          <linearGradient id="vignette" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#05070a" stopOpacity="0.55" />
            <stop offset="0.45" stopColor="#05070a" stopOpacity="0.05" />
            <stop offset="1" stopColor="#05070a" stopOpacity="0.92" />
          </linearGradient>
        </defs>
        <rect width="1440" height="900" fill="url(#vignette)" />
      </svg>
      <div
        className={`absolute inset-0 bg-ink transition-opacity duration-500 ${dim ? 'opacity-45' : 'opacity-0'}`}
      />
      <div className="story-grain absolute inset-0 opacity-[0.16]" />
    </div>
  )
}

const SCENE_BG: Record<StoryScene, string> = {
  standup:
    'linear-gradient(160deg, #0b1a1c 0%, #10252a 32%, #1a2f33 58%, #0b0d10 100%)',
  meeting:
    'linear-gradient(150deg, #1c1710 0%, #2a2015 34%, #17202a 70%, #0b0d10 100%)',
  night:
    'linear-gradient(165deg, #080b18 0%, #0d1330 38%, #1a1230 66%, #0b0d10 100%)',
  review:
    'linear-gradient(155deg, #0a1216 0%, #101d22 30%, #1b1a25 66%, #0b0d10 100%)',
}

function StandupScene() {
  return (
    <>
      <circle cx="1180" cy="150" r="280" fill="#5eead4" opacity="0.08" />
      <rect x="80" y="110" width="640" height="430" rx="8" fill="#0c1b22" stroke="#2a4a52" strokeWidth="2" />
      {[0, 1, 2, 3].map((row) => (
        <rect
          key={row}
          x="104"
          y={140 + row * 96}
          width="590"
          height="62"
          rx="4"
          fill="#123039"
          opacity={0.85 - row * 0.12}
        />
      ))}
      <path d="M80 540 L720 540 L760 900 L40 900 Z" fill="#0a1117" opacity="0.95" />
      <rect x="160" y="600" width="260" height="14" rx="7" fill="#1e3a40" />
      <rect x="180" y="614" width="16" height="140" fill="#101c22" />
      <rect x="386" y="614" width="16" height="140" fill="#101c22" />
      <rect x="240" y="570" width="80" height="30" rx="4" fill="#1a343b" />
      <circle cx="280" cy="562" r="10" fill="#5eead4" opacity="0.4" />
      <path d="M900 620 C940 520 1010 480 1080 480 C1150 480 1200 520 1230 620 L1260 900 L870 900 Z" fill="#0d181c" />
      <rect x="1040" y="300" width="220" height="150" rx="10" fill="#0f2025" stroke="#28505a" />
      <rect x="1060" y="320" width="180" height="110" rx="6" fill="#173840" opacity="0.8" />
      <circle cx="1150" cy="375" r="26" fill="#5eead4" opacity="0.3" />
      <path d="M1060 530 L1240 530" stroke="#1f3a42" strokeWidth="8" />
      <path d="M1100 530 L1100 600 M1200 530 L1200 600" stroke="#1f3a42" strokeWidth="8" />
      <circle cx="200" cy="210" r="3" fill="#a7f3d0" opacity="0.7" />
      <circle cx="980" cy="220" r="2" fill="#a7f3d0" opacity="0.5" />
    </>
  )
}

function MeetingScene() {
  return (
    <>
      <circle cx="300" cy="160" r="260" fill="#fbbf24" opacity="0.07" />
      <rect x="860" y="100" width="470" height="300" rx="8" fill="#101722" stroke="#39414f" strokeWidth="2" />
      <rect x="890" y="130" width="410" height="240" rx="4" fill="#1b2430" opacity="0.8" />
      <path d="M930 310 L1000 230 L1070 280 L1140 190 L1220 250 L1280 200" fill="none" stroke="#fbbf24" strokeOpacity="0.45" strokeWidth="5" />
      <rect x="930" y="150" width="90" height="60" rx="4" fill="#fbbf24" opacity="0.16" />
      <rect x="1040" y="150" width="90" height="60" rx="4" fill="#5eead4" opacity="0.12" />
      <rect x="1150" y="150" width="90" height="60" rx="4" fill="#c4b5fd" opacity="0.12" />
      <ellipse cx="720" cy="790" rx="520" ry="150" fill="#17130d" />
      <ellipse cx="720" cy="760" rx="430" ry="105" fill="#211a11" />
      <path d="M260 760 C300 700 380 680 470 690 L970 690 C1060 680 1140 700 1180 760 Z" fill="#120f0a" />
      {[330, 520, 710, 900, 1090].map((x) => (
        <g key={x}>
          <rect x={x - 34} y="640" width="68" height="16" rx="8" fill="#2a241a" />
          <rect x={x - 6} y="656" width="12" height="80" fill="#1a160f" />
          <ellipse cx={x} cy="742" rx="42" ry="10" fill="#0a0906" />
        </g>
      ))}
      <rect x="620" y="600" width="200" height="12" rx="6" fill="#2b2418" />
      <circle cx="720" cy="592" r="7" fill="#fbbf24" opacity="0.6" />
      <path d="M100 700 L100 380 L360 380 L360 700" fill="none" stroke="#2b3340" strokeWidth="3" opacity="0.5" />
      <path d="M130 420 L330 420 M130 460 L300 460 M130 500 L320 500" stroke="#3c4655" strokeWidth="4" opacity="0.4" />
    </>
  )
}

function ReviewScene() {
  return (
    <>
      <circle cx="1120" cy="150" r="300" fill="#5eead4" opacity="0.07" />
      <circle cx="260" cy="520" r="300" fill="#c4b5fd" opacity="0.05" />
      <rect x="120" y="80" width="780" height="440" rx="12" fill="#0b1116" stroke="#2a3a42" strokeWidth="3" />
      <rect x="140" y="100" width="740" height="400" rx="6" fill="#0f171d" />
      <rect x="140" y="100" width="740" height="34" rx="6" fill="#16232b" />
      <circle cx="162" cy="117" r="5" fill="#f87171" opacity="0.7" />
      <circle cx="180" cy="117" r="5" fill="#fbbf24" opacity="0.7" />
      <circle cx="198" cy="117" r="5" fill="#34d399" opacity="0.7" />
      {Array.from({ length: 11 }).map((_, row) => (
        <g key={row}>
          <rect x="160" y={154 + row * 30} width="22" height="9" rx="2" fill="#33414c" opacity="0.6" />
          <rect
            x="196"
            y={154 + row * 30}
            width={row % 3 === 0 ? 180 : row % 3 === 1 ? 320 : 250}
            height="9"
            rx="3"
            fill={row === 4 || row === 8 ? '#34d399' : row === 6 ? '#f87171' : '#3b4a56'}
            opacity={row === 4 || row === 6 || row === 8 ? 0.55 : 0.4}
          />
          {row === 4 && <rect x="196" y={150 + row * 30} width="510" height="18" fill="#34d399" opacity="0.06" />}
          {row === 6 && <rect x="196" y={150 + row * 30} width="510" height="18" fill="#f87171" opacity="0.06" />}
        </g>
      ))}
      <path d="M80 520 L700 520 L760 900 L20 900 Z" fill="#0a1116" opacity="0.95" />
      <rect x="200" y="570" width="320" height="12" rx="6" fill="#1c2c33" />
      <rect x="240" y="582" width="14" height="180" fill="#101a20" />
      <rect x="470" y="582" width="14" height="180" fill="#101a20" />
      <rect x="250" y="540" width="70" height="34" rx="5" fill="#1a2a31" />
      <ellipse cx="285" cy="532" rx="8" ry="5" fill="#5eead4" opacity="0.35" />
      <path d="M980 620 C1010 540 1070 500 1130 500 C1190 500 1240 540 1270 620 L1300 900 L950 900 Z" fill="#0a1216" />
      <rect x="1020" y="300" width="230" height="150" rx="10" fill="#0d181d" stroke="#2b4750" strokeWidth="2" />
      <rect x="1040" y="320" width="190" height="110" rx="5" fill="#13262c" />
      <path d="M1060 380 L1100 350 L1140 370 L1180 330 L1210 360" fill="none" stroke="#5eead4" strokeOpacity="0.45" strokeWidth="4" />
      <circle cx="340" cy="210" r="3" fill="#99f6e4" opacity="0.6" />
      <circle cx="700" cy="250" r="2" fill="#c4b5fd" opacity="0.5" />
    </>
  )
}

function NightScene() {
  return (
    <>
      <circle cx="1080" cy="80" r="300" fill="#818cf8" opacity="0.1" />
      <circle cx="240" cy="140" r="260" fill="#f472b6" opacity="0.05" />
      <rect x="0" y="420" width="1440" height="480" fill="#070a13" />
      {[
        [60, 300, 120, 120],
        [220, 260, 90, 160],
        [340, 340, 140, 80],
        [520, 240, 70, 180],
        [620, 320, 110, 100],
        [760, 280, 80, 140],
        [880, 350, 130, 70],
        [1040, 250, 90, 170],
        [1160, 330, 150, 90],
        [1340, 290, 70, 130],
      ].map(([x, y, w, h], index) => (
        <g key={index}>
          <rect x={x} y={y} width={w} height={h} fill="#0c1220" stroke="#1c2740" strokeWidth="2" />
          {Array.from({ length: Math.min(12, Math.floor(w / 18)) }).map((_, dot) => (
            <rect
              key={dot}
              x={x + 10 + (dot % 4) * (w / 4.4)}
              y={y + 12 + Math.floor(dot / 4) * (h / 3.2)}
              width="5"
              height="3"
              fill={dot % 3 === 0 ? '#fbbf24' : '#93c5fd'}
              opacity={0.3 + ((index + dot) % 4) * 0.12}
            />
          ))}
        </g>
      ))}
      <path d="M120 900 L120 620 L500 620 L500 900 Z" fill="#0b101b" />
      <rect x="190" y="540" width="250" height="150" rx="8" fill="#0d1524" stroke="#2a3a5c" />
      <rect x="210" y="560" width="210" height="110" rx="4" fill="#13203a" />
      <path d="M230 640 L270 610 L310 630 L350 590 L390 620" fill="none" stroke="#f472b6" strokeOpacity="0.6" strokeWidth="4" />
      <rect x="290" y="690" width="30" height="60" fill="#0a0f19" />
      <ellipse cx="305" cy="755" rx="60" ry="10" fill="#060910" />
      <circle cx="520" cy="470" r="18" fill="#fbbf24" opacity="0.55" />
      <circle cx="520" cy="470" r="44" fill="#fbbf24" opacity="0.08" />
      <rect x="620" y="430" width="160" height="220" rx="12" fill="#0a0e18" stroke="#1e2940" />
      <rect x="640" y="450" width="120" height="180" rx="6" fill="#101a2c" />
      <path d="M660 500 L740 500 M660 530 L720 530 M660 560 L735 560" stroke="#33415f" strokeWidth="5" opacity="0.6" />
      <path d="M960 620 C1000 540 1060 510 1120 510 C1180 510 1220 540 1250 620 L1280 900 L930 900 Z" fill="#080c14" />
      <circle cx="1120" cy="470" r="90" fill="#818cf8" opacity="0.08" />
    </>
  )
}
