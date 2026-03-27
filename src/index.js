import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

// Global reset
const style = document.createElement('style');
style.textContent = `
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: system-ui, -apple-system, sans-serif; background: #F2F4F7; }
  .loading-screen {
    height: 100vh; display: flex; align-items: center; justify-content: center;
    font-size: 14px; color: #4A6070; font-family: system-ui, sans-serif;
  }
  button { font-family: inherit; }
  input, select, textarea { font-family: inherit; }
  a { text-decoration: none; }
`;
document.head.appendChild(style);

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<React.StrictMode><App /></React.StrictMode>);
