import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import './index.css';
import { seedDatabase } from './db/seed';

async function initApp() {
  try {
    await seedDatabase();
  } catch (error) {
    console.error('Failed to seed database:', error);
  }

  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <App />
    </StrictMode>,
  );
}

initApp();
