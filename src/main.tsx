import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import { ProgressProvider } from './state/ProgressContext';
import { AudioProvider } from './audio/AudioContext';
import './styles/tokens.css';
import './styles/base.css';
import './styles/layout.css';
import './styles/home.css';
import './styles/reader.css';
import './styles/pages.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <ProgressProvider>
        <AudioProvider>
          <App />
        </AudioProvider>
      </ProgressProvider>
    </BrowserRouter>
  </React.StrictMode>
);
