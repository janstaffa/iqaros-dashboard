import React from 'react';
import ReactDOM from 'react-dom/client';
import Modal from 'react-modal';
import App from './App';
import './index.css';

const app = document.getElementById('root') as HTMLElement;
const root = ReactDOM.createRoot(app);
Modal.setAppElement(app);

root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
