import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import { ErrorBoundary } from './components/ErrorBoundary'
import './index.css'

// O JSON-LD não é montado aqui: um plugin do Vite (ver vite.config.ts) o gera a
// partir de src/lib/seo.ts e o grava direto no index.html durante o build, para
// que o dado estruturado chegue no HTML mesmo a crawlers que não executam JS.

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>,
)
