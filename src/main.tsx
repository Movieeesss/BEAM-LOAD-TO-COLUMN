import React from 'react';
import ReactDOM from 'react-dom/client';
import './style.css';
import BeamToColumn from './BeamToColumn';

ReactDOM.createRoot(document.getElementById('app') as HTMLElement).render(
  <React.StrictMode>
    <BeamToColumn />
  </React.StrictMode>,
);