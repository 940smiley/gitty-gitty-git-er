import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './styles.css'; // or './index.css'
import App from './App.jsx';
import { initAPI } from './api.js';


// Initialize API before rendering the app
initAPI();

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>
);
