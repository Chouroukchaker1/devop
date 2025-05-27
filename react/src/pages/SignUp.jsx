import React, { useState } from 'react';
import { Container, Row, Col, Card, Form, Button } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import './SignUp.css';

const SignUpPage = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState(''); // No default value to match validation
  const [profileImage, setProfileImage] = useState(null);
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState('');

  const navigate = useNavigate();

  // Validation du formulaire
  const validateForm = () => {
    const newErrors = {};
    if (!name.trim()) newErrors.name = "Le nom est requis.";
    if (!email.trim()) newErrors.email = "L'email est requis.";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) newErrors.email = "Format d'email invalide.";
    if (!password) newErrors.password = "Le mot de passe est requis.";
    else if (password.length < 6) newErrors.password = "Le mot de passe doit contenir au moins 6 caractères.";
    if (!role) newErrors.role = "Veuillez sélectionner un rôle.";
    if (profileImage && profileImage.size > 5 * 1024 * 1024) newErrors.profileImage = "L'image ne doit pas dépasser 5 Mo.";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Gestion de l'upload d'image
  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setProfileImage(file);
    }
  };

  // Gestion de la sélection du rôle
  const handleRoleChange = (selectedRole) => {
    setRole(selectedRole);
  };

  // Soumission du formulaire
  const handleSubmit = async (event) => {
    event.preventDefault();
    setServerError('');

    if (!validateForm()) return;

    const formData = new FormData();
    formData.append('username', name.replace(/\s+/g, '').toLowerCase());
    formData.append('name', name);
    formData.append('email', email);
    formData.append('password', password);
    formData.append('role', role);
    if (profileImage) formData.append('profileImage', profileImage);

    try {
      const response = await fetch("http://localhost:8082/api/auth/register", {
        method: "POST",
        headers: { "Accept": "application/json" },
        body: formData,
      });
      const data = await response.json();

      if (data.token && data.role) {
        localStorage.setItem('authToken', data.token);
        localStorage.setItem('userRole', data.role);
        localStorage.setItem('permissions', JSON.stringify(data.permissions));
        navigate('/signin');
      } else {
        setServerError(data.message || "Erreur lors de l'inscription.");
      }
    } catch (error) {
      console.error("Erreur :", error);
      setServerError("Une erreur inattendue est survenue. Veuillez réessayer.");
    }
  };

  return (
    <Container fluid className="signin-layout">
      <Row className="justify-content-center align-items-center min-vh-100">
        <Col xs={12} md={6} lg={5}>
          <Card className="card-container">
            <Card.Body>
              <h2 className="signin-title">Inscription</h2>
              <Form onSubmit={handleSubmit}>
                {/* Champ Nom */}
                <Form.Group className="mb-3">
                  <Form.Label className="form-label">Nom</Form.Label>
                  <Form.Control
                    type="text"
                    placeholder="Votre Nom"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    isInvalid={!!errors.name}
                    required
                  />
                  <Form.Control.Feedback type="invalid">{errors.name}</Form.Control.Feedback>
                </Form.Group>
  
                {/* Champ Email */}
                <Form.Group className="mb-3">
                  <Form.Label className="form-label">Email</Form.Label>
                  <Form.Control
                    type="email"
                    placeholder="example@gmail.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    isInvalid={!!errors.email}
                    required
                  />
                  <Form.Control.Feedback type="invalid">{errors.email}</Form.Control.Feedback>
                </Form.Group>
  
                {/* Champ Mot de passe */}
                <Form.Group className="mb-3">
                  <Form.Label className="form-label">Mot de passe</Form.Label>
                  <Form.Control
                    type="password"
                    placeholder="Entrez votre mot de passe"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    isInvalid={!!errors.password}
                    required
                  />
                  <Form.Control.Feedback type="invalid">{errors.password}</Form.Control.Feedback>
                </Form.Group>
  
                {/* Sélection du Rôle */}
                <Form.Group className="mb-3">
                  <Form.Label className="form-label">Vous êtes?</Form.Label>
                  <div>
                    <Form.Check
                      type="radio"
                      label="Consultant"
                      name="role"
                      id="consultant"
                      value="consultant"
                      checked={role === 'consultant'}
                      onChange={() => handleRoleChange('consultant')}
                      className="mb-2"
                    />
                    <Form.Check
                      type="radio"
                      label="Fueluser"
                      name="role"
                      id="fueluser"
                      value="fueluser"
                      checked={role === 'fueluser'}
                      onChange={() => handleRoleChange('fueluser')}
                    />
                  </div>
                  {errors.role && (
                    <div className="text-danger" style={{ fontSize: '0.875rem' }}>
                      {errors.role}
                    </div>
                  )}
                </Form.Group>
  
                {/* Upload Image */}
                <Form.Group className="mb-3">
                  <Form.Label className="form-label">Image de profil</Form.Label>
                  <Form.Control
                    type="file"
                    onChange={handleImageChange}
                    isInvalid={!!errors.profileImage}
                  />
                  <Form.Control.Feedback type="invalid">{errors.profileImage}</Form.Control.Feedback>
                </Form.Group>
  
                {/* Server Error */}
                {serverError && <div className="text-danger mb-3">{serverError}</div>}
  
                {/* Submit Button */}
                <div className="d-grid">
                  <Button variant="primary" type="submit">
                    S'INSCRIRE
                  </Button>
                </div>
  
                <p className="text-center mt-3">
                  Vous avez déjà un compte ? <a href="/signin">Se connecter</a>
                </p>
              </Form>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
  
};

export default SignUpPage;