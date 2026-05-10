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

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <ChakraProvider theme={theme}>
      <App/>
    </ChakraProvider>
  </React.StrictMode>,
)
