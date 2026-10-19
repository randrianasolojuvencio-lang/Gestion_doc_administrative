import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './styles.css';
import Application from './Application.jsx';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <Application />
  </StrictMode>,
);