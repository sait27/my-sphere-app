// src/main.jsx

import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'
import './styles/animations.css'
import { BrowserRouter } from 'react-router-dom'; // <-- IMPORT THIS

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    {/* This BrowserRouter component enables routing for our entire app */}
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>,
)