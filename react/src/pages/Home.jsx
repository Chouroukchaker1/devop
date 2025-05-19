import React from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap/dist/js/bootstrap.bundle.min.js";
import "@fortawesome/fontawesome-free/css/all.min.css"; // Import FontAwesome
import "./Home.css";
import logo from '../assets/logo1.png'; // Importation du logo

const Home = () => {
  return (
    <div className="d-flex">
      {/* Barre latérale */}
      <nav className="sidebar">
        {/* Logo en haut de la sidebar */}
        <div className="sidebar-logo-container">
          <img src={logo} alt="Logo" className="sidebar-logo" /> {/* Utilisation de la variable logo */}
        </div>

        {/* Liste des liens */}
        <ul>
          {[ 
            { name: "Profile", icon: "fa-user", path: "/profile" },
            { name: "Sign In", icon: "fa-sign-in-alt", path: "/signin" },
            { name: "Sign Up", icon: "fa-user-plus", path: "/signup" },
            { name: "Notifications", icon: "fa-bell", path: "/notifications" },
            { name: "Tables", icon: "fa-table", path: "/tables" },
            { name: "Calendrier", icon: "fa-calendar-alt", path: "/calendar" }

          ].map((item, index) => (
            <motion.li 
              key={index} 
              initial={{ opacity: 0, x: -30 }} 
              animate={{ opacity: 1, x: 0 }} 
              transition={{ delay: index * 0.2, duration: 0.5 }}
            >
              <Link to={item.path}>
                <i className={`fas ${item.icon} me-2`}></i> {item.name}
              </Link>
            </motion.li>
          ))}
        </ul>
      </nav>

      {/* Contenu principal */}
      <div className="main-content min-h-screen">
        <section className="hero-section">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            {/* Section supprimée */}
          </motion.div>
        </section>
      </div>
    </div>
  );
};

export default Home;
