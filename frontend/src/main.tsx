import React from 'react'
import ReactDOM from 'react-dom/client'
import {ChakraProvider, extendTheme} from '@chakra-ui/react'
import './index.css'

const theme = extendTheme({
  styles: {
    global: () => ({
      body: {
        bg: "#191A1C",
        // Kill the stray blinking text caret app-wide — it shows up on
        // plain text and clickable surfaces alike (and is amplified by the
        // browser's "caret browsing" mode). caret-color is inherited, so
        // this cascades to everything; real text-entry elements opt back
        // in via the rule below.
        caretColor: 'transparent',
      },
      'input, textarea, [contenteditable="true"]': {
        caretColor: 'auto',
      },
      // Suppress text-selection on anything button-shaped — double-tapping
      // a clickable card was leaving a selection range behind. Custom
      // clickable boxes elsewhere should carry role="button" both for
      // accessibility and to opt into this rule.
      'button, [role="button"]': {
        userSelect: 'none',
        WebkitUserSelect: 'none',
      },
    }),
  },
});

const root = ReactDOM.createRoot(document.getElementById('root') as HTMLElement)

// Player-facing synced view: ?pcview=<roomId> renders a read-only initiative
// view instead of the GM app. Dynamic-import so the heavy GM bundle (and its
// stores / localStorage side effects) never load on a player device.
const pcRoom = new URLSearchParams(window.location.search).get('pcview')

if (pcRoom) {
  import('./player/PlayerView').then(({default: PlayerView}) => {
    root.render(
      <React.StrictMode>
        <ChakraProvider theme={theme}>
          <PlayerView roomId={pcRoom}/>
        </ChakraProvider>
      </React.StrictMode>,
    )
  })
} else {
  void loadDevFixture().then(() => import('./App')).then(({default: App}) => {
    root.render(
      <React.StrictMode>
        <ChakraProvider theme={theme}>
          <App/>
        </ChakraProvider>
      </React.StrictMode>,
    )
  })
}

// Dev only: ?fixture=<name> replaces this origin's saved state with
// scripts/ui/fixtures/<name>.json (e.g. the 2026-07-30 playtest, mid-
// encounter) so manual testing always starts from the same scene. Runs
// before the GM app is imported because the stores hydrate on import.
// Asks first — it wipes whatever is saved for this host:port.
async function loadDevFixture(): Promise<void> {
  if (!import.meta.env.DEV) return
  const url = new URL(window.location.href)
  const name = url.searchParams.get('fixture')
  if (!name) return
  url.searchParams.delete('fixture')
  window.history.replaceState(null, '', url.toString())
  if (!/^[\w-]+$/.test(name)) return
  const res = await fetch(`/scripts/ui/fixtures/${name}.json`)
  if (!res.ok) {
    window.alert(`No fixture "${name}" in scripts/ui/fixtures/.`)
    return
  }
  const seed = (await res.json()) as Record<string, string>
  const ok = window.confirm(
    `Load the "${name}" test state?\n\nThis replaces everything saved for ${window.location.host} ` +
      `(participants, encounter, prep, log).`,
  )
  if (!ok) return
  localStorage.clear()
  for (const [k, v] of Object.entries(seed)) localStorage.setItem(k, v)
}
