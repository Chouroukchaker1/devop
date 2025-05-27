import React, { useState } from 'react';
import { Form, Button, Alert } from 'react-bootstrap';
import './VerifyCodePopup.css';

const VerifyCodePopup = ({ show, onClose, onVerifySuccess, email, username, userId, searchBy }) => {
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setMessage('');
    setIsLoading(true);

    const requestData = {
      code,
      userId,
    };

    if (searchBy === 'email') {
      requestData.email = email;
    } else {
      requestData.username = username;
    }

    try {
      console.log('Envoi de la requête de vérification:', requestData);
      const response = await fetch('http://localhost:8082/api/auth/verify-reset-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestData),
      });

      const data = await response.json();
      console.log('Réponse de vérification:', data);

      if (!response.ok) {
        throw new Error(data.message || `Erreur HTTP: ${response.status}`);
      }

      setMessage('Code vérifié avec succès !');
      setTimeout(() => {
        console.log("Token reçu de l'API:", data.tempToken);
        onVerifySuccess(data.tempToken);
      }, 1000);
    } catch (error) {
      console.error('Erreur:', error);
      setError(error.message || 'Code invalide ou expiré. Veuillez réessayer.');
    } finally {
      setIsLoading(false);
    }
  };

  if (!show) return null;

  return (
    <div className="vcp-overlay">
      <div className="vcp-content">
        <h2>Vérification du code</h2>
        <Form onSubmit={handleSubmit}>
          <Form.Group className="mb-3">
            <Form.Label>Code de vérification</Form.Label>
            <Form.Control
              type="text"
              placeholder="Entrez le code reçu par email"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              required
              autoFocus
            />
            <Form.Text className="text-muted">
              Veuillez vérifier votre boîte de réception et saisir le code à 6 chiffres.
            </Form.Text>
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Text className="text-muted">
              Identification: {searchBy === 'email' ? email : username}
              {userId && ` (ID: ${userId})`}
            </Form.Text>
          </Form.Group>

          {error && <Alert variant="danger">{error}</Alert>}
          {message && <Alert variant="success">{message}</Alert>}

          <div className="d-grid">
            <Button variant="primary" type="submit" disabled={isLoading}>
              {isLoading ? 'Vérification...' : 'Vérifier'}
            </Button>
          </div>

          <div className="d-grid mt-2">
            <Button variant="secondary" onClick={onClose} disabled={isLoading}>
              Retour
            </Button>
          </div>
        </Form>
      </div>
    </div>
  );
};

export default VerifyCodePopup;