import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App.jsx';

createRoot(document.getElementById('root')).render(
  React.createElement(StrictMode, null,
    React.createElement(BrowserRouter, null,
      React.createElement(App, null)
    )
  )
);
