import type {
  AvatarAccessory,
  AvatarConfig,
  AvatarEyes,
  AvatarFace,
  StoryCharacter,
  StoryHair,
  StoryMood,
} from '../../data/story'
import { composeAvatar } from '../../data/avatar'

interface Props {
  character: StoryCharacter
  mood?: StoryMood
  active?: boolean
  size?: 'stage' | 'card'
}

export function StoryPortrait({ character, mood = 'neutral', active = true, size = 'stage' }: Props) {
  const config = composeAvatar(character.avatar)
  return (
    <CharacterAvatar
      id={character.id}
      name={character.name}
      roleZh={character.roleZh}
      accent={character.color}
      skin={character.skin}
      hair={character.hair}
      hairColor={character.hairColor}
      config={config}
      mood={mood}
      active={active}
      size={size}
    />
  )
}

interface AvatarProps {
  id: string
  name: string
  roleZh: string
  accent: string
  skin: string
  hair: StoryHair
  hairColor: string
  config: AvatarConfig
  mood: StoryMood
  active: boolean
  size: 'stage' | 'card'
}

export function CharacterAvatar({
  id,
  name,
  roleZh,
  accent,
  skin,
  hair,
  hairColor,
  config,
  mood,
  active,
  size,
}: AvatarProps) {
  const uid = id
  const brow = browPath(mood)
  const mouth = mouthPath(mood)
  const tired = mood === 'tired'

  return (
    <svg
      viewBox="0 0 260 380"
      role="img"
      aria-label={`${name}，${roleZh}`}
      className={size === 'stage' ? 'h-full w-auto max-w-none' : 'h-16 w-12'}
      style={{
        filter: active ? 'none' : 'grayscale(0.35) brightness(0.6)',
        transition: 'filter 220ms ease, opacity 220ms ease',
        overflow: 'visible',
      }}
    >
      <defs>
        <linearGradient id={`body-${uid}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={accent} stopOpacity="0.35" />
          <stop offset="0.55" stopColor={accent} stopOpacity="0.12" />
          <stop offset="1" stopColor="#0b0d10" stopOpacity="0.9" />
        </linearGradient>
        <linearGradient id={`skin-${uid}`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor={skin} />
          <stop offset="1" stopColor={shade(skin, -22)} />
        </linearGradient>
        <linearGradient id={`hair-${uid}`} x1="0" y1="0" x2="0.8" y2="1">
          <stop offset="0" stopColor={shade(hairColor, 18)} />
          <stop offset="1" stopColor={shade(hairColor, -16)} />
        </linearGradient>
        <radialGradient id={`glow-${uid}`} cx="0.5" cy="0.5" r="0.5">
          <stop offset="0" stopColor={accent} stopOpacity="0.4" />
          <stop offset="1" stopColor={accent} stopOpacity="0" />
        </radialGradient>
        <linearGradient id={`shirt-${uid}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#232a35" />
          <stop offset="1" stopColor="#10141b" />
        </linearGradient>
        <filter id={`neon-${uid}`} x="-40%" y="-40%" width="180%" height="180%">
          <feGaussianBlur stdDeviation="2.6" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      <g className={active ? 'story-breathe' : undefined} style={{ transformBox: 'fill-box', transformOrigin: 'bottom center' }}>
        <ellipse cx="130" cy="300" rx="140" ry="96" fill={`url(#glow-${uid})`} opacity="0.95" />
        <ellipse cx="130" cy="360" rx="92" ry="26" fill={accent} opacity="0.08" />

        {/* shoulders + torso */}
        <path
          d={bodyPath(config.face)}
          fill={`url(#body-${uid})`}
        />
        <path d="M52 380 C62 318 92 278 112 266 L130 300 L148 266 C170 278 200 318 210 380 Z" fill={`url(#shirt-${uid})`} />
        <Outfit config={config} accent={accent} skin={skin} />
        <path d="M112 246 L130 300 L148 246 Z" fill={shade(skin, -30)} opacity="0.45" />
        <path
          d="M112 246 C118 266 122 282 130 300 C138 282 142 266 148 246"
          fill="none"
          stroke={accent}
          strokeOpacity="0.5"
          strokeWidth="2.5"
        />

        {/* neck */}
        <path d="M108 210 L108 250 C108 262 118 270 130 270 C142 270 152 262 152 250 L152 210 Z" fill={`url(#skin-${uid})`} />
        <path d="M108 210 L108 232 C116 240 124 244 130 244 C136 244 144 240 152 232 L152 210 Z" fill="#000" opacity="0.14" />

        {/* ears */}
        <ellipse cx="70" cy="158" rx="12" ry="20" fill={shade(skin, -12)} />
        <ellipse cx="190" cy="158" rx="12" ry="20" fill={shade(skin, -12)} />

        {/* head */}
        <path d={facePath(config.face)} fill={`url(#skin-${uid})`} />

        {/* hair */}
        <Hair hair={hair} hairColor={hairColor} uid={uid} />
        <path
          d="M84 100 C102 78 128 70 150 76"
          fill="none"
          stroke={accent}
          strokeOpacity="0.55"
          strokeWidth="2"
          strokeLinecap="round"
          filter={`url(#neon-${uid})`}
        />

        {/* brows */}
        <path d={brow.left} fill="none" stroke={shade(hairColor, -10)} strokeWidth="5" strokeLinecap="round" />
        <path d={brow.right} fill="none" stroke={shade(hairColor, -10)} strokeWidth="5" strokeLinecap="round" />

        {/* eyes */}
        <g className={active ? 'story-eyes' : undefined} style={{ transformBox: 'fill-box', transformOrigin: 'center' }}>
          <Eyes kind={config.eyes} tired={tired} accent={accent} />
        </g>

        {/* nose + mouth */}
        <path d="M128 170 Q132 184 126 190" fill="none" stroke={shade(skin, -40)} strokeOpacity="0.5" strokeWidth="3" strokeLinecap="round" />
        <path d={mouth} fill="none" stroke="#6b2f34" strokeWidth="4" strokeLinecap="round" />

        {/* cyber implant + cheek circuit */}
        <g opacity="0.8">
          <rect x="72" y="146" width="6" height="19" rx="2" fill="#0b0f14" stroke={accent} strokeOpacity="0.8" strokeWidth="1.2" />
          <circle cx="75" cy="151" r="1.4" fill={accent} filter={`url(#neon-${uid})`} />
          <path d="M80 190 L88 190 L92 196 L100 196" fill="none" stroke={accent} strokeOpacity="0.55" strokeWidth="1.4" strokeLinecap="round" />
          <circle cx="100" cy="196" r="1.6" fill={accent} opacity="0.8" />
        </g>

        {/* rim light */}
        <path
          d="M78 142 C80 100 100 76 128 72"
          fill="none"
          stroke={accent}
          strokeOpacity="0.7"
          strokeWidth="3.4"
          strokeLinecap="round"
          filter={`url(#neon-${uid})`}
        />

        {/* neon outfit seam */}
        <path
          d="M92 304 C102 336 106 358 106 380"
          fill="none"
          stroke={accent}
          strokeOpacity="0.32"
          strokeWidth="1.6"
        />
        <path
          d="M168 304 C158 336 154 358 154 380"
          fill="none"
          stroke={accent}
          strokeOpacity="0.32"
          strokeWidth="1.6"
        />

        <Accessory kind={config.accessory} accent={accent} uid={uid} />

        {/* badge */}
        <rect x="168" y="322" width="34" height="46" rx="5" fill="#0f1319" stroke={accent} strokeOpacity="0.55" />
        <rect x="174" y="330" width="22" height="4" rx="2" fill={accent} opacity="0.7" />
        <rect x="174" y="338" width="16" height="3" rx="1.5" fill="#8b929e" opacity="0.7" />
        <rect x="174" y="344" width="19" height="3" rx="1.5" fill="#8b929e" opacity="0.5" />
        <path d="M180 322 L180 314 M190 322 L190 314" stroke="#0f1319" strokeWidth="3" />
      </g>
    </svg>
  )
}

function facePath(face: AvatarFace): string {
  switch (face) {
    case 'round':
      return 'M70 150 C70 96 96 64 130 64 C164 64 190 96 190 150 C190 204 168 238 130 238 C92 238 70 204 70 150 Z'
    case 'square':
      return 'M73 140 C73 96 97 66 130 66 C163 66 187 96 187 140 L185 188 C184 220 161 236 130 236 C99 236 76 220 75 188 Z'
    default:
      return 'M72 146 C72 96 96 66 130 66 C164 66 188 96 188 146 C188 198 166 232 130 232 C94 232 72 198 72 146 Z'
  }
}

function bodyPath(face: AvatarFace): string {
  switch (face) {
    case 'square':
      return 'M20 380 C32 304 76 256 112 244 L148 244 C184 256 228 304 240 380 Z'
    case 'round':
      return 'M26 380 C38 308 80 260 112 248 L148 248 C182 260 224 308 236 380 Z'
    default:
      return 'M24 380 C36 306 78 258 112 246 L148 246 C184 258 226 306 238 380 Z'
  }
}

function Eyes({ kind, tired, accent }: { kind: AvatarEyes; tired: boolean; accent: string }) {
  if (tired) {
    return (
      <>
        <path d="M96 160 Q108 166 120 160" fill="none" stroke="#1f242c" strokeWidth="4" strokeLinecap="round" />
        <path d="M140 160 Q152 166 164 160" fill="none" stroke="#1f242c" strokeWidth="4" strokeLinecap="round" />
        <path d="M98 174 Q108 178 118 174" fill="none" stroke="#7a4b3a" strokeOpacity="0.25" strokeWidth="2" />
        <path d="M142 174 Q152 178 162 174" fill="none" stroke="#7a4b3a" strokeOpacity="0.25" strokeWidth="2" />
      </>
    )
  }
  if (kind === 'sharp') {
    return (
      <>
        <path d="M97 158 Q109 149 121 158 Q109 167 97 158 Z" fill="#1c2027" />
        <path d="M139 158 Q151 149 163 158 Q151 167 139 158 Z" fill="#1c2027" />
        <path d="M97 158 Q109 151 121 158" fill="none" stroke="#0e1116" strokeWidth="2.4" strokeLinecap="round" />
        <path d="M139 158 Q151 151 163 158" fill="none" stroke="#0e1116" strokeWidth="2.4" strokeLinecap="round" />
        <circle cx="111" cy="155" r="1.8" fill="#fff" opacity="0.85" />
        <circle cx="153" cy="155" r="1.8" fill="#fff" opacity="0.85" />
        <circle cx="109" cy="158" r="8.4" fill="none" stroke={accent} strokeWidth="1.1" opacity="0.6" />
        <circle cx="151" cy="158" r="8.4" fill="none" stroke={accent} strokeWidth="1.1" opacity="0.6" />
      </>
    )
  }
  if (kind === 'soft') {
    return (
      <>
        <ellipse cx="108" cy="159" rx="8" ry="10" fill="#1c2027" />
        <ellipse cx="152" cy="159" rx="8" ry="10" fill="#1c2027" />
        <circle cx="110.5" cy="155" r="2.5" fill="#fff" opacity="0.85" />
        <circle cx="154.5" cy="155" r="2.5" fill="#fff" opacity="0.85" />
        <circle cx="108" cy="159" r="8.8" fill="none" stroke={accent} strokeWidth="1.2" opacity="0.55" />
        <circle cx="152" cy="159" r="8.8" fill="none" stroke={accent} strokeWidth="1.2" opacity="0.55" />
        <path d="M99 166 Q108 170 117 166" fill="none" stroke="#1c2027" strokeWidth="1.6" strokeOpacity="0.55" strokeLinecap="round" />
        <path d="M143 166 Q152 170 161 166" fill="none" stroke="#1c2027" strokeWidth="1.6" strokeOpacity="0.55" strokeLinecap="round" />
      </>
    )
  }
  return (
    <>
      <ellipse cx="108" cy="158" rx="7.5" ry="9" fill="#1c2027" />
      <ellipse cx="152" cy="158" rx="7.5" ry="9" fill="#1c2027" />
      <circle cx="110" cy="156" r="2.2" fill="#fff" opacity="0.8" />
      <circle cx="154" cy="156" r="2.2" fill="#fff" opacity="0.8" />
      <circle cx="108" cy="158" r="8.2" fill="none" stroke={accent} strokeWidth="1.1" opacity="0.55" />
      <circle cx="152" cy="158" r="8.2" fill="none" stroke={accent} strokeWidth="1.1" opacity="0.55" />
    </>
  )
}

function Outfit({ config, accent, skin }: { config: AvatarConfig; accent: string; skin: string }) {
  switch (config.outfit) {
    case 'blazer':
      return (
        <>
          <path d="M112 246 L130 300 L148 246 L168 262 L156 380 L104 380 L92 262 Z" fill="#1a1f27" />
          <path d="M112 246 L130 300 L118 380 L96 380 L88 270 Z" fill="#242b36" />
          <path d="M148 246 L130 300 L142 380 L164 380 L172 270 Z" fill="#242b36" />
          <path d="M112 246 L130 290 L148 246 L160 252 L130 312 L100 252 Z" fill={accent} opacity="0.16" />
        </>
      )
    case 'hoodie':
      return (
        <>
          <path d="M92 258 C104 240 116 234 130 234 C144 234 156 240 168 258 C160 276 146 286 130 286 C114 286 100 276 92 258 Z" fill="#1b222c" stroke={accent} strokeOpacity="0.22" strokeWidth="3" />
          <path d="M112 268 L110 322 M148 268 L150 322" stroke="#8b929e" strokeWidth="3" strokeLinecap="round" />
          <circle cx="110" cy="326" r="3.5" fill={accent} opacity="0.7" />
          <circle cx="150" cy="326" r="3.5" fill={accent} opacity="0.7" />
        </>
      )
    case 'tee':
      return (
        <>
          <path d="M112 246 C118 264 122 272 130 278 C138 272 142 264 148 246 C158 250 166 256 172 264 L164 276 C156 270 146 268 130 286 C114 268 104 270 96 276 L88 264 C94 256 102 250 112 246 Z" fill="#222a35" />
          <path d="M130 286 L130 380" stroke={accent} strokeOpacity="0.18" strokeWidth="1.5" />
        </>
      )
    case 'turtleneck':
      return (
        <>
          <path d="M104 232 C112 244 120 250 130 250 C140 250 148 244 156 232 L160 270 C150 280 140 284 130 284 C120 284 110 280 100 270 Z" fill="#202833" stroke={accent} strokeOpacity="0.28" strokeWidth="2" />
          <path d="M98 272 C108 280 118 284 130 284 C142 284 152 280 162 272 L168 380 L92 380 Z" fill="#1a212b" />
        </>
      )
    case 'shirt':
    default:
      return (
        <>
          <path d="M112 246 L130 286 L120 300 L104 268 Z" fill="#e8e4d8" opacity="0.9" />
          <path d="M148 246 L130 286 L140 300 L156 268 Z" fill="#e8e4d8" opacity="0.9" />
          <path d="M128 286 L132 286 L134 334 L130 344 L126 334 Z" fill={accent} opacity="0.8" />
          <path d="M130 246 L130 286" stroke={shade(skin, -40)} strokeOpacity="0.25" strokeWidth="2" />
        </>
      )
  }
}

function Accessory({ kind, accent, uid }: { kind: AvatarAccessory; accent: string; uid: string }) {
  switch (kind) {
    case 'glasses':
      return (
        <>
          <rect x="94" y="146" width="28" height="24" rx="8" fill={accent} fillOpacity="0.08" stroke={accent} strokeWidth="2.2" filter={`url(#neon-${uid})`} />
          <rect x="138" y="146" width="28" height="24" rx="8" fill={accent} fillOpacity="0.08" stroke={accent} strokeWidth="2.2" filter={`url(#neon-${uid})`} />
          <path d="M122 156 L138 156" stroke={accent} strokeWidth="2.2" />
          <path d="M94 154 L82 150 M166 154 L178 150" stroke={accent} strokeWidth="2" strokeOpacity="0.7" />
          <path d="M96 150 L104 148" stroke="#fff" strokeWidth="1.5" strokeOpacity="0.5" />
        </>
      )
    case 'headphones':
      return (
        <>
          <path d="M64 156 C64 86 90 52 130 52 C170 52 196 86 196 156" fill="none" stroke="#313a48" strokeWidth="8" strokeLinecap="round" />
          <path d="M66 150 C66 90 92 58 130 58 C168 58 194 90 194 150" fill="none" stroke={accent} strokeOpacity="0.55" strokeWidth="2" strokeLinecap="round" />
          <rect x="56" y="144" width="20" height="36" rx="9" fill="#222a35" stroke={accent} strokeOpacity="0.8" strokeWidth="2" filter={`url(#neon-${uid})`} />
          <rect x="184" y="144" width="20" height="36" rx="9" fill="#222a35" stroke={accent} strokeOpacity="0.8" strokeWidth="2" filter={`url(#neon-${uid})`} />
          <circle cx="66" cy="162" r="3" fill={accent} opacity="0.8" />
          <circle cx="194" cy="162" r="3" fill={accent} opacity="0.8" />
        </>
      )
    case 'earrings':
      return (
        <>
          <circle cx="68" cy="187" r="3.5" fill={accent} opacity="0.9" filter={`url(#neon-${uid})`} />
          <circle cx="192" cy="187" r="3.5" fill={accent} opacity="0.9" filter={`url(#neon-${uid})`} />
          <path d="M68 187 L68 193 M192 187 L192 193" stroke={accent} strokeWidth="1.5" opacity="0.6" />
        </>
      )
    case 'lanyard':
      return (
        <>
          <path d="M110 252 L158 328 M150 252 L174 318" stroke={accent} strokeOpacity="0.65" strokeWidth="3" />
          <path d="M158 328 L174 318" stroke={accent} strokeOpacity="0.65" strokeWidth="3" />
          <rect x="146" y="306" width="30" height="20" rx="3" fill="#0f1319" stroke={accent} strokeOpacity="0.8" filter={`url(#neon-${uid})`} />
          <rect x="151" y="311" width="20" height="3" rx="1.5" fill={accent} opacity="0.6" />
        </>
      )
    case 'none':
    default:
      return null
  }
}

function Hair({ hair, hairColor, uid }: { hair: StoryHair; hairColor: string; uid: string }) {
  const fill = `url(#hair-${uid})`
  switch (hair) {
    case 'bob':
      return (
        <>
          <path
            d="M64 176 C58 104 88 62 130 62 C174 62 202 102 196 176 L188 214 C186 178 180 128 130 124 C86 120 74 164 72 214 Z"
            fill={fill}
          />
          <path d="M64 160 C62 206 66 238 74 262 L96 252 C88 224 86 188 88 158 Z" fill={fill} opacity="0.92" />
          <path d="M196 160 C198 206 194 238 186 262 L164 252 C172 224 174 188 172 158 Z" fill={fill} opacity="0.92" />
        </>
      )
    case 'bun':
      return (
        <>
          <circle cx="130" cy="52" r="24" fill={fill} />
          <path
            d="M66 172 C60 106 88 64 130 64 C174 64 200 104 194 172 C184 138 166 120 130 120 C94 120 78 138 66 172 Z"
            fill={fill}
          />
          <path d="M66 150 C64 190 68 220 76 244 L94 236 C86 210 84 180 86 154 Z" fill={fill} opacity="0.9" />
          <path d="M194 150 C196 190 192 220 184 244 L166 236 C174 210 176 180 174 154 Z" fill={fill} opacity="0.9" />
        </>
      )
    case 'wave':
      return (
        <>
          <path
            d="M62 184 C52 112 84 60 130 60 C178 60 208 108 198 184 C190 160 184 140 176 128 C160 142 144 148 130 148 C112 148 94 140 80 124 C72 140 66 160 62 184 Z"
            fill={fill}
          />
          <path d="M70 128 C60 160 58 196 64 222 C70 202 74 180 82 160 C76 148 72 138 70 128 Z" fill={fill} />
          <path d="M190 128 C200 160 202 196 196 222 C190 202 186 180 178 160 C184 148 188 138 190 128 Z" fill={fill} />
          <path d="M84 104 C98 84 118 74 138 76" fill="none" stroke={shade(hairColor, 40)} strokeOpacity="0.35" strokeWidth="5" strokeLinecap="round" />
        </>
      )
    case 'side':
      return (
        <>
          <path
            d="M68 170 C64 100 92 64 132 64 C176 64 200 102 194 170 C184 144 166 132 150 132 C126 132 104 118 94 96 C84 116 74 142 68 170 Z"
            fill={fill}
          />
          <path d="M68 158 C64 196 68 224 76 246 L96 238 C88 214 86 184 88 160 Z" fill={fill} opacity="0.9" />
        </>
      )
    case 'short':
    default:
      return (
        <>
          <path
            d="M68 154 C66 104 92 66 130 66 C170 66 194 102 192 154 C182 130 166 116 130 118 C98 120 80 134 68 154 Z"
            fill={fill}
          />
          <path d="M68 148 C64 172 66 190 70 204 C74 188 76 172 82 158 Z" fill={fill} opacity="0.9" />
          <path d="M192 148 C196 172 194 190 190 204 C186 188 184 172 178 158 Z" fill={fill} opacity="0.9" />
          <path d="M92 92 C108 78 130 72 150 76" fill="none" stroke={shade(hairColor, 34)} strokeOpacity="0.35" strokeWidth="5" strokeLinecap="round" />
        </>
      )
  }
}

function browPath(mood: StoryMood) {
  switch (mood) {
    case 'angry':
      return {
        left: 'M95 136 L120 130',
        right: 'M140 130 L165 136',
      }
    case 'worried':
      return {
        left: 'M95 130 L120 136',
        right: 'M140 136 L165 130',
      }
    case 'happy':
      return {
        left: 'M94 132 Q107 126 121 132',
        right: 'M139 132 Q153 126 166 132',
      }
    case 'tired':
      return {
        left: 'M94 136 L120 136',
        right: 'M140 136 L166 136',
      }
    case 'smug':
      return {
        left: 'M94 132 Q107 126 121 132',
        right: 'M140 134 L166 132',
      }
    default:
      return {
        left: 'M94 134 L121 132',
        right: 'M139 132 L166 134',
      }
  }
}

function mouthPath(mood: StoryMood) {
  switch (mood) {
    case 'happy':
      return 'M112 202 Q130 216 148 202'
    case 'angry':
      return 'M112 208 Q130 196 148 208'
    case 'worried':
      return 'M116 206 Q130 200 144 206'
    case 'tired':
      return 'M115 205 L145 205'
    case 'smug':
      return 'M114 204 Q128 210 148 200'
    default:
      return 'M116 204 Q130 209 144 204'
  }
}

function shade(hex: string, amount: number): string {
  const value = hex.replace('#', '')
  if (value.length !== 6) return hex
  const channels = [0, 2, 4].map((start) => {
    const channel = Number.parseInt(value.slice(start, start + 2), 16)
    return Math.max(0, Math.min(255, channel + amount))
  })
  return `#${channels.map((channel) => channel.toString(16).padStart(2, '0')).join('')}`
}
