import React, { useState } from "react";
import emailjs from 'emailjs-com';
import axios from 'axios';
import './contact.css';

const Contact = () => {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState(null);

  const validateEmail = (email) =>
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  const validatePhone = (phone) =>
    /^\d{8,}$/.test(phone); // au moins 8 chiffres

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setSuccess(false);
    setError(null);

    const form = e.target;
    const name = form.from_name.value.trim();
    const email = form.user_email.value.trim();
    const phone = form.phone.value.trim();
    const subject = form.subject.value.trim();
    const msg = form.message.value.trim();

    if (!email && !phone) {
      setError("Veuillez fournir un email ou un téléphone.");
      setLoading(false);
      return;
    }

    if (email && !validateEmail(email)) {
      setError("L'adresse email est invalide.");
      setLoading(false);
      return;
    }

    if (phone && !validatePhone(phone)) {
      setError("Le numéro de téléphone doit contenir au moins 8 chiffres.");
      setLoading(false);
      return;
    }

    if (!msg) {
      setError("Le message est requis.");
      setLoading(false);
      return;
    }

    try {
      // ✅ Envoi via EmailJS
      const emailjsResult = await emailjs.sendForm(
        'service_8wh1d0h',
        'template_b929n1f',
        form,
        'zy7u-lUayl3BBwv6K'
      );
      console.log('✅ EmailJS envoyé :', emailjsResult.status, emailjsResult.text);

      // ✅ Enregistrement dans le backend
      await axios.post(`${process.env.REACT_APP_API_URL}/contact`, {
        name,
        email,
        phone,
        subject,
        message: msg
      });

      setSuccess(true);
      form.reset();
    } catch (err) {
      if (err.response) {
        console.error("❌ Erreur HTTP:", err.response.status, err.response.data);
      } else if (err.text) {
        console.error("❌ Erreur EmailJS:", err.text);
      } else {
        console.error("❌ Erreur inconnue:", err.message);
      }
      setError("Échec de l'envoi du message, veuillez réessayer.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="contact-container">
      {success && (
        <div className="alert alert-success mt-3" role="alert">
          ✅ Message envoyé avec succès !
        </div>
      )}
      {error && (
        <div className="alert alert-danger mt-3" role="alert">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <input type="text" name="from_name" placeholder="Nom complet" required />
        <input type="hidden" name="to_name" value="Chourouk" readOnly />
        <input type="email" name="user_email" placeholder="Adresse email" />
        <input type="text" name="subject" placeholder="Sujet" />
        <input type="text" name="phone" placeholder="Numéro de téléphone" />
        <textarea name="message" placeholder="Message" required rows={4}></textarea>
        <button type="submit" disabled={loading}>
          {loading ? 'Envoi en cours...' : 'Envoyer le message'}
        </button>
      </form>
    </div>
  );
};

export default Contact;
