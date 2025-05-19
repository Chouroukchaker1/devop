import React, { useState } from 'react';
import { Container, Form, Button, Alert, Row, Col, Modal } from 'react-bootstrap';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import './ResetPasswordPopup.css' ;

// Forgot Password Popup Component
const ForgotPasswordPopup = ({ show, onClose, onEmailSubmit }) => {
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const handleForgotPasswordSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setSuccessMessage('');

    try {
      const response = await fetch('http://localhost:3000/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, username }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `HTTP Error: ${response.status}`);
      }

      setSuccessMessage('Un e-mail de réinitialisation a été envoyé !');
      setTimeout(() => {
        onEmailSubmit(email);
        onClose();
      }, 2000);
    } catch (error) {
      console.error('Error:', error);
      setError(error.message || 'Une erreur inattendue est survenue. Veuillez réessayer.');
    }
  };

  return (
    <Modal show={show} onHide={onClose} centered>
      <Modal.Header closeButton>
        <Modal.Title>Réinitialisation du mot de passe</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <Form onSubmit={handleForgotPasswordSubmit}>
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
          <Form.Group className="mb-3">
            <Form.Label>Adresse e-mail</Form.Label>
            <Form.Control
              type="email"
              placeholder="Entrez votre adresse e-mail"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </Form.Group>

          {error && <Alert variant="danger">{error}</Alert>}
          {successMessage && <Alert variant="success">{successMessage}</Alert>}

          <div className="d-grid">
            <Button variant="primary" type="submit">
              Envoyer le lien de réinitialisation
            </Button>
          </div>
        </Form>
      </Modal.Body>
    </Modal>
  );
};

// Reset Code Popup Component
const ResetCodePopup = ({ show, onClose, onCodeSubmit, email }) => {
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const handleResetCodeSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setSuccessMessage('');

    try {
      const response = await fetch('http://localhost:3000/api/auth/verify-reset-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, code }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `HTTP Error: ${response.status}`);
      }

      const data = await response.json();
      setSuccessMessage('Code de réinitialisation vérifié !');
      setTimeout(() => {
        onCodeSubmit(data.resetToken);
        onClose();
      }, 2000);
    } catch (error) {
      console.error('Error:', error);
      setError(error.message || 'Code invalide ou erreur inattendue. Veuillez réessayer.');
    }
  };

  return (
    <Modal show={show} onHide={onClose} centered>
      <Modal.Header closeButton>
        <Modal.Title>Vérification du code de réinitialisation</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <Form onSubmit={handleResetCodeSubmit}>
          <Form.Group className="mb-3">
            <Form.Label>Code de réinitialisation</Form.Label>
            <Form.Control
              type="text"
              placeholder="Entrez le code reçu par e-mail"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              required
            />
          </Form.Group>

          {error && <Alert variant="danger">{error}</Alert>}
          {successMessage && <Alert variant="success">{successMessage}</Alert>}

          <div className="d-grid">
            <Button variant="primary" type="submit">
              Vérifier le code
            </Button>
          </div>
        </Form>
      </Modal.Body>
    </Modal>
  );
};

// New Password Popup Component
const NewPasswordPopup = ({ show, onClose, resetToken }) => {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const handleNewPasswordSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setSuccessMessage('');

    if (newPassword !== confirmPassword) {
      setError('Les mots de passe ne correspondent pas.');
      return;
    }

    try {
      const response = await fetch('http://localhost:3000/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ resetToken, newPassword }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `HTTP Error: ${response.status}`);
      }

      setSuccessMessage('Mot de passe réinitialisé avec succès !');
      setTimeout(() => {
        setNewPassword('');
        setConfirmPassword('');
        onClose();
      }, 2000);
    } catch (error) {
      console.error('Error:', error);
      setError(error.message || 'Une erreur inattendue est survenue. Veuillez réessayer.');
    }
  };

  return (
    <Modal show={show} onHide={onClose} centered>
      <Modal.Header closeButton>
        <Modal.Title>Nouveau mot de passe</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <Form onSubmit={handleNewPasswordSubmit}>
          <Form.Group className="mb-3">
            <Form.Label>Nouveau mot de passe</Form.Label>
            <Form.Control
              type="password"
              placeholder="Entrez votre nouveau mot de passe"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
            />
          </Form.Group>
          <Form.Group className="mb-3">
            <Form.Label>Confirmer le mot de passe</Form.Label>
            <Form.Control
              type="password"
              placeholder="Confirmez votre nouveau mot de passe"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
            />
          </Form.Group>

          {error && <Alert variant="danger">{error}</Alert>}
          {successMessage && <Alert variant="success">{successMessage}</Alert>}

          <div className="d-grid">
            <Button variant="primary" type="submit">
              Réinitialiser le mot de passe
            </Button>
          </div>
        </Form>
      </Modal.Body>
    </Modal>
  );
};

// Verification Code Popup Component
const VerificationCodePopup = ({ show, onClose, onSubmit, userId }) => {
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const handleVerificationSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setSuccessMessage('');

    try {
      const response = await fetch('http://localhost:3000/api/auth/verify-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, code }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `HTTP Error: ${response.status}`);
      }

      const data = await response.json();
      if (data.token && data.role) {
        localStorage.setItem('token', data.token);
        localStorage.setItem('userRole', data.role);
        localStorage.setItem('permissions', JSON.stringify(data.permissions));
        setSuccessMessage('Vérification réussie ! Redirection en cours...');
        setTimeout(() => {
          onSubmit();
          onClose();
        }, 2000);
      } else {
        setError(data.message || 'Code de vérification invalide.');
      }
    } catch (error) {
      console.error('Error:', error);
      setError(error.message || 'Une erreur inattendue est survenue. Veuillez réessayer.');
    }
  };

  return (
    <Modal show={show} onHide={onClose} centered>
      <Modal.Header closeButton>
        <Modal.Title>Vérification du code</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <Form onSubmit={handleVerificationSubmit}>
          <Form.Group className="mb-3">
            <Form.Label>Code de vérification</Form.Label>
            <div className="verification-icon-container">
              <Form.Control
                type="text"
                placeholder="Entrez le code reçu"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                required
              />
              <Button variant="link" type="submit" className="p-0">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="24"
                  height="24"
                  fill="currentColor"
                  className="bi-check-circle"
                  viewBox="0 0 16 16"
                >
                  <path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14zm0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16z" />
                  <path d="M10.97 4.97a.235.235 0 0 0-.02.022L7.477 9.417 5.384 7.323a.75.75 0 0 0-1.06 1.06L6.97 11.03a.75.75 0 0 0 1.079-.02l3.992-4.99a.75.75 0 0 0-1.071-1.05z" />
                </svg>
              </Button>
            </div>
          </Form.Group>

          {error && <Alert variant="danger">{error}</Alert>}
          {successMessage && <Alert variant="success">{successMessage}</Alert>}
        </Form>
      </Modal.Body>
    </Modal>
  );
};

// Main SignInPage Component
const SignInPage = ({ onSignInSuccess }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [serverError, setServerError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [showResetCodePopup, setShowResetCodePopup] = useState(false);
  const [showNewPasswordPopup, setShowNewPasswordPopup] = useState(false);
  const [showVerificationPopup, setShowVerificationPopup] = useState(false);
  const [userId, setUserId] = useState(null);
  const [email, setEmail] = useState('');
  const [resetToken, setResetToken] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (event) => {
    event.preventDefault();
    setServerError('');
    setSuccessMessage('');

    try {
      const response = await fetch('http://localhost:3000/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `HTTP Error: ${response.status}`);
      }

      const data = await response.json();
      console.log('API Response:', data);

      if (data.requiresVerification) {
        setSuccessMessage('Code de vérification envoyé !');
        setUserId(data.userId);
        setShowVerificationPopup(true);
      } else if (data.token && data.role) {
        localStorage.setItem('token', data.token);
        localStorage.setItem('userRole', data.role);
        localStorage.setItem('permissions', JSON.stringify(data.permissions));
        setSuccessMessage('Connexion réussie ! Redirection en cours...');

        if (onSignInSuccess) {
          onSignInSuccess();
        }

        setTimeout(() => {
          navigate('/profile');
        }, 2000);
      } else {
        setServerError(data.message || 'Erreur : réponse inattendue de l\'API.');
      }
    } catch (error) {
      console.error('Error:', error);
      setServerError(error.message || 'Une erreur inattendue est survenue. Veuillez réessayer.');
    }
  };

  const handleEmailSubmit = (submittedEmail) => {
    setEmail(submittedEmail);
    setShowForgotPassword(false);
    setShowResetCodePopup(true);
  };

  const handleCodeSubmit = (token) => {
    setResetToken(token);
    setShowResetCodePopup(false);
    setShowNewPasswordPopup(true);
  };

  const handleVerificationSuccess = () => {
    if (onSignInSuccess) {
      onSignInSuccess();
    }
    navigate('/profile');
  };

  return (
    <div className="signin-container">
      <Container fluid className="signin-layout">
        <Row className="justify-content-center align-items-center min-vh-100">
          <Col xs={12} md={6} lg={4}>
            <motion.div
              className="card-container"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5 }}
            >
              <h2 className="signin-title">Connexion</h2>
              <Form onSubmit={handleSubmit}>
                <Form.Group className="mb-3">
                  <Form.Label>Nom d'utilisateur</Form.Label>
                  <Form.Control
                    type="text"
                    placeholder="Votre nom d'utilisateur"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    required
                  />
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label>Mot de passe</Form.Label>
                  <Form.Control
                    type="password"
                    placeholder="Entrez votre mot de passe"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </Form.Group>

                {serverError && <Alert variant="danger">{serverError}</Alert>}
                {successMessage && <Alert variant="success">{successMessage}</Alert>}

                <div className="d-grid">
                  <Button variant="primary" type="submit">
                    SE CONNECTER
                  </Button>
                </div>

                <p className="text-center mt-3">
                  Vous n'avez pas de compte ? <a href="/signup">Inscrivez-vous</a>
                  <br />
                  <a href="#" onClick={() => setShowForgotPassword(true)}>Mot de passe oublié ?</a>
                </p>
              </Form>
            </motion.div>
          </Col>
        </Row>
      </Container>

      <ForgotPasswordPopup
        show={showForgotPassword}
        onClose={() => setShowForgotPassword(false)}
        onEmailSubmit={handleEmailSubmit}
      />
      <ResetCodePopup
        show={showResetCodePopup}
        onClose={() => setShowResetCodePopup(false)}
        onCodeSubmit={handleCodeSubmit}
        email={email}
      />
      <NewPasswordPopup
        show={showNewPasswordPopup}
        onClose={() => setShowNewPasswordPopup(false)}
        resetToken={resetToken}
      />
      <VerificationCodePopup
        show={showVerificationPopup}
        onClose={() => setShowVerificationPopup(false)}
        onSubmit={handleVerificationSuccess}
        userId={userId}
      />
    </div>
  );
};

export default SignInPage;