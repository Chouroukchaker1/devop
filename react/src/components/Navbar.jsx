import React from 'react';
import { Link } from 'react-router-dom';
import logo from '../assets/logo.png';
import './Navbar.css';
import { FaUserPlus, FaSignInAlt, FaEnvelope } from 'react-icons/fa'; // Nouvelle icône pour "Se connecter"

const Navbar = () => {
  return (
    <nav className="navbar navbar-expand-lg navbar-dark bg-light shadow-sm fixed-top">
      <div className="container-fluid">
        <Link to="/" className="navbar-brand">
          <img
            src={logo}
            alt="CarboneTracker Logo"
            width="100"
            height="100"
            className="d-inline-block align-top"
          />
        </Link>
        <button
          className="navbar-toggler"
          type="button"
          data-bs-toggle="collapse"
          data-bs-target="#navbarNav"
          aria-controls="navbarNav"
          aria-expanded="false"
          aria-label="Toggle navigation"
        >
          <span className="navbar-toggler-icon"></span>
        </button>
        <div className="collapse navbar-collapse" id="navbarNav">
          <ul className="navbar-nav ms-auto">
            <li className="nav-item">
              <Link to="/signin" className="nav-link d-flex align-items-center" title="Se connecter">
                <FaSignInAlt className="me-2" />
                Se connecter 
              </Link>
            </li>
            <li className="nav-item">
              <Link to="/signup" className="nav-link d-flex align-items-center" title="Inscription">
                <FaUserPlus className="me-2" />
                Inscription
              </Link>
            </li>
            <li className="nav-item">
              <Link to="/Contact" className="nav-link d-flex align-items-center" title="Contact Us">
                <FaEnvelope className="me-2" />
                Réclamation
              </Link>
            </li>
          </ul>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
