import React, { useState } from "react";
import emailjs from 'emailjs-com';
import axios from 'axios';
import './contact.css';

const Contact = () => {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setSuccess(false);
    setError(null);

    const form = e.target;
    const name = form.user_name.value.trim();
    const email = form.user_email.value.trim();
    const phone = form.phone.value.trim();
    const subject = form.subject.value.trim();
    const msg = form.message.value.trim();

    if ((!email && !phone) || !msg) {
      setError('Veuillez fournir soit un email soit un numéro de téléphone, et un message.');
      setLoading(false);
      return;
    }

    try {
      // 1. Envoi via EmailJS pour le feedback utilisateur
      await emailjs.sendForm('service_8wh1d0h', 'template_b929n1f', form, 'zy7u-lUayl3BBwv6K');
      
      // 2. Stockage dans le backend pour l'administration
      await axios.post('http://localhost:3000/api/contact', {
        name: name,
        email: email,
        phone: phone,
        subject: subject,
        message: msg
      });
      
      // Les deux opérations ont réussi
      setSuccess(true);
      form.reset();
    } catch (err) {
      console.error('Erreur lors de l\'envoi du message:', err);
      setError('Échec de l\'envoi du message, veuillez réessayer.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="contact-container">
      {success && (
        <div className="alert alert-success">
          Message envoyé avec succès !
        </div>
      )}
      
      {error && (
        <div className="alert alert-danger">
          {error}
        </div>
      )}
      
      <form onSubmit={handleSubmit}>
        <input type="text" name="user_name" placeholder="Nom complet" required />
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