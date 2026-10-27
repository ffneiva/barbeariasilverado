import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import '../index.css'
import { Painel } from './Painel'

createRoot(document.getElementById('painel')!).render(
  <StrictMode>
    <Painel />
  </StrictMode>,
)
