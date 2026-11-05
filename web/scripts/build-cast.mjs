#!/usr/bin/env node
/**
 * Assemble the fixed cast from avatar parts.
 *
 * The runtime renderer lives in src/components/story/StoryPortrait.tsx.
 * This script is the build-time half of the same system: it validates every
 * fixed look, prints the cast table, and publishes a manifest the app can use
 * for galleries or future export.
 */
import { mkdir, writeFile } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { STORY_ARCS, STORY_CHARACTERS, STORY_EPISODES } from '../src/data/story.ts'
import { AVATAR_PARTS, avatarSignature, composeAvatar } from '../src/data/avatar.ts'

const here = dirname(fileURLToPath(import.meta.url))
const root = resolve(here, '..')
const output = resolve(root, 'public/cast/manifest.json')
const checkOnly = process.argv.includes('--check')

const characters = Object.values(STORY_CHARACTERS)
const seen = new Map()

for (const character of characters) {
  const look = composeAvatar(character.avatar)
  for (const [part, values] of Object.entries(AVATAR_PARTS)) {
    if (!values.includes(look[part])) {
      throw new Error(`${character.id}: unknown ${part} "${look[part]}"`)
    }
  }
  const signature = avatarSignature(look)
  if (seen.has(signature)) {
    throw new Error(`${character.id} reuses the exact look of ${seen.get(signature)}: ${signature}`)
  }
  seen.set(signature, character.id)
}

for (const episode of STORY_EPISODES) {
  if (episode.characters.length === 0) throw new Error(`${episode.id}: no cast`)
  for (const character of episode.characters) {
    if (!STORY_CHARACTERS[character.id]) throw new Error(`${episode.id}: unknown cast member ${character.id}`)
  }
}

console.log('\nCast report')
console.log('─'.repeat(72))
console.log('id       name      face    eyes   outfit       accessory    accent')
for (const character of characters) {
  const look = composeAvatar(character.avatar)
  console.log(
    `${character.id.padEnd(9)}${character.name.padEnd(10)}${look.face.padEnd(8)}${look.eyes.padEnd(7)}${look.outfit.padEnd(13)}${look.accessory.padEnd(13)}${character.color}`,
  )
}
console.log(`\n${characters.length} fixed characters · ${STORY_EPISODES.length} episodes · ${STORY_ARCS.length} arc(s)`)

if (!checkOnly) {
  await mkdir(dirname(output), { recursive: true })
  await writeFile(
    output,
    JSON.stringify(
      {
        version: 1,
        generatedAt: new Date().toISOString(),
        parts: AVATAR_PARTS,
        characters: characters.map((character) => ({
          id: character.id,
          name: character.name,
          roleZh: character.roleZh,
          color: character.color,
          avatar: composeAvatar(character.avatar),
        })),
        arcs: STORY_ARCS.map((arc) => ({ id: arc.id, titleZh: arc.titleZh, episodeIds: arc.episodeIds })),
      },
      null,
      2,
    ),
    'utf8',
  )
  console.log(`Wrote ${output}`)
}
