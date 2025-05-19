import React from "react";
import "./Footer.css"; 
import { FaPhone, FaEnvelope } from "react-icons/fa"; // Importation des icônes

const Footer = () => {
  return (
    <footer className="footer">
      <p>&copy; {new Date().getFullYear()} Nouvelair. All rights reserved.</p>

      {/* Section contact alignée à droite */}
      <div className="contact-info">
        <span><FaPhone /> +216 70 02 09 20</span>
        <a href="mailto:customer.callcenter@nouvelair.com?subject=Demande d'information" className="email-link">
          <FaEnvelope /> customer.callcenter@nouvelair.com
        </a>
        
      </div>
      
    </footer>
  );
};

export default Footer;
