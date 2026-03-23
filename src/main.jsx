import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import './seed.js'
import { seedStaircaseData } from './seedStaircase.js'
import { db } from './db/db.js'

const init = async () => {
  const universe = await db.universes.toCollection().first();
  if (universe) {
    const existing = await db.staircase.where({ universeId: universe.id }).first();
    if (!existing) {
      await seedStaircaseData(universe.id);
    }
  }
};
init();

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
