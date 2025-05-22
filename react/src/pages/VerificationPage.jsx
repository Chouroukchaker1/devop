import React, { useState } from 'react';
import { Container, Card, Form, Button, Alert } from 'react-bootstrap';
import { useLocation, useNavigate } from 'react-router-dom';
import './Verification.css';

const VerificationPage = () => {
  const [verificationCode, setVerificationCode] = useState('');
  const [serverError, setServerError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const location = useLocation();
  const navigate = useNavigate();
  const userId = location.state?.userId;

  // Fonction pour déterminer la page de redirection en fonction du rôle
  const getRedirectPathByRole = (role) => {
    switch (role) {
      case 'admin':
        return '/flight-list';
      case 'fueluser':
        return '/flight-list';
      case 'consultant':
        return '/fuel-data';
      default:
        return '/'; // Redirection par défaut si le rôle n'est pas reconnu
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setServerError('');
    setSuccessMessage('');

    // Vérifier la présence de l'ID utilisateur
    if (!userId) {
      console.log('ID utilisateur manquant');
      setServerError('ID utilisateur manquant. Veuillez réessayer.');
      return;
    }

    try {
      const response = await fetch('http://localhost:8080/api/auth/verify-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, code: verificationCode }),
      });

      const data = await response.json();
      console.log('Réponse du serveur:', data); // Debug log
      
      // Vérification de la réponse basée sur la présence du token
      if (data.token) {
        // Déterminer le chemin de redirection en fonction du rôle
        const redirectPath = getRedirectPathByRole(data.role);
        
        console.log(`Vérification réussie. Redirection vers ${redirectPath} pour le rôle ${data.role}...`);
        setSuccessMessage(`Votre code a été vérifié avec succès ! Redirection en cours...`);

        // Stocker le token dans le localStorage
        localStorage.setItem('token', data.token);
        
        // Stocker également le rôle
        localStorage.setItem('userRole', data.role);

        // Délai court pour permettre à l'utilisateur de voir le message de succès
        setTimeout(() => {
          navigate(redirectPath, { replace: true });
        }, 1500);
      } else {
        console.log('Erreur lors de la vérification:', data.message);
        setServerError(data.message || 'Erreur lors de la vérification du code.');
      }
    } catch (error) {
      console.error('Erreur:', error);
      setServerError('Une erreur inattendue est survenue. Veuillez réessayer.');
    }
  };

  return (
    <div className="verification-container">
      <Container className="d-flex align-items-center justify-content-center">
        <Card className="card-container">
          <Card.Body>
            <h2>Vérification de Code</h2>
            <Form onSubmit={handleSubmit}>
              <Form.Group className="mb-3">
                <Form.Label>Code de vérification</Form.Label>
                <Form.Control
                  type="text"
                  placeholder="Entrez votre code de vérification"
                  value={verificationCode}
                  onChange={(e) => setVerificationCode(e.target.value)}
                  required
                />
              </Form.Group>

              {serverError && <Alert variant="danger">{serverError}</Alert>}
              {successMessage && <Alert variant="success">{successMessage}</Alert>}

              <div className="d-grid">
                <Button variant="primary" type="submit">
                  VÉRIFIER LE CODE
                </Button>
              </div>

              <p className="text-center mt-3">
                Vous n'avez pas reçu le code ? <a href="/resend-code">Renvoyer le code</a>
              </p>
            </Form>
          </Card.Body>
        </Card>
      </Container>
    </div>
  );
};

export default VerificationPage;