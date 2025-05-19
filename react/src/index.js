import React from 'react';
import ReactDOM from 'react-dom/client'; // ✅ Importe "react-dom/client" au lieu de "react-dom"
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import 'bootstrap/dist/css/bootstrap.min.css';

const root = ReactDOM.createRoot(document.getElementById('root')); // ✅ Utilise createRoot()
root.render(
  <BrowserRouter>
    <App />
  </BrowserRouter>
);
