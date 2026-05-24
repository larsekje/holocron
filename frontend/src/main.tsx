import React from 'react'
import ReactDOM from 'react-dom/client'
import {ChakraProvider, extendTheme} from '@chakra-ui/react'
import App from './App'
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
  root.render(
    <React.StrictMode>
      <ChakraProvider theme={theme}>
        <App/>
      </ChakraProvider>
    </React.StrictMode>,
  )
}
