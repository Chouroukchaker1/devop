import React, { useState } from 'react';
import { Form, Button, Alert } from 'react-bootstrap';
import { FaTimes } from 'react-icons/fa';
import VerifyCodePopup from './VerifyCodePopup';
import ResetPasswordPopup from './ResetPasswordPopup';
import './ForgotPasswordPopup.css'; // Ajoute ceci pour le style de l’icône close

const ForgotPasswordPopup = ({ show, onClose }) => {
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [searchBy, setSearchBy] = useState('email');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [showVerifyCode, setShowVerifyCode] = useState(false);
  const [showResetPassword, setShowResetPassword] = useState(false);
  const [resetToken, setResetToken] = useState('');
  const [userId, setUserId] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setMessage('');
    setIsLoading(true);

    const searchValue = searchBy === 'email' ? email : username;
    const searchField = searchBy;

    try {
      const response = await fetch('http://localhost:3000/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ [searchField]: searchValue }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || `Erreur HTTP: ${response.status}`);
      }

      if (data.userId) {
        setUserId(data.userId);
      }

      setMessage(data.message || 'Un email avec un code de vérification a été envoyé.');
    } catch (error) {
      console.error('Erreur:', error);
      setError(error.message || 'Une erreur est survenue. Veuillez réessayer.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifySuccess = (token) => {
    console.log("Token reçu de VerifyCodePopup:", token);
    if (!token) {
      setError("Erreur : aucun jeton de réinitialisation reçu.");
      return;
    }
    setShowVerifyCode(false);
    setResetToken(token);
    localStorage.setItem("resetToken", token);
    setShowResetPassword(true);
  };

  if (!show) return null;

  if (showVerifyCode) {
    return (
      <VerifyCodePopup
        show={true}
        email={email}
        username={username}
        userId={userId}
        searchBy={searchBy}
        onClose={() => setShowVerifyCode(false)}
        onVerifySuccess={handleVerifySuccess}
      />
    );
  }

  if (showResetPassword) {
    return (
      <ResetPasswordPopup
        show={true}
        email={email}
        username={username}
        userId={userId}
        token={resetToken}
        onClose={() => {
          setShowResetPassword(false);
          onClose();
        }}
      />
    );
  }

  return (
    <div className="popup-overlay">
      <div className="popup-content">
        <button className="close-button" onClick={onClose}>
          <FaTimes />
        </button>
        <h2>Mot de passe oublié</h2>
        <Form onSubmit={handleSubmit}>
          <Form.Group className="mb-3">
            <Form.Label>Rechercher par</Form.Label>
            <div>
              <Form.Check
                inline
                type="radio"
                label="Email"
                name="searchBy"
                id="searchByEmail"
                checked={searchBy === 'email'}
                onChange={() => setSearchBy('email')}
              />
              <Form.Check
                inline
                type="radio"
                label="Nom d'utilisateur"
                name="searchBy"
                id="searchByUsername"
                checked={searchBy === 'username'}
                onChange={() => setSearchBy('username')}
              />
            </div>
          </Form.Group>

          {searchBy === 'email' ? (
            <Form.Group className="mb-3">
              <Form.Label>Email</Form.Label>
              <Form.Control
                type="email"
                placeholder="Entrez votre email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </Form.Group>
          ) : (
            <Form.Group className="mb-3">
              <Form.Label>Nom d'utilisateur</Form.Label>
              <Form.Control
                type="text"
                placeholder="Entrez votre nom d'utilisateur"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
              />
            </Form.Group>
          )}

          {error && <Alert variant="danger">{error}</Alert>}
          {message && <Alert variant="success">{message}</Alert>}

          <div className="d-grid">
            <Button variant="primary" type="submit" size="sm" disabled={isLoading}>
              {isLoading ? 'Envoi en cours...' : 'Envoyer'}
            </Button>
          </div>

          {message && (
            <div className="d-grid mt-2">
              <Button variant="success" size="sm" onClick={() => setShowVerifyCode(true)}>
                Entrer le code de vérification
              </Button>
            </div>
          )}
        </Form>
      </div>
    </div>
  );
};

export default ForgotPasswordPopup;
