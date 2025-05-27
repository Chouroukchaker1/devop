import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Table, Alert, Spinner, Container, Button } from 'react-bootstrap';

const ContactMessages = () => {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchMessages = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const token = localStorage.getItem('token');
      const response = await axios.get('http://localhost:8082/api/contact', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        timeout: 5000
      });

      if (response.data.status !== 'success') {
        throw new Error(response.data.message || 'Invalid response format');
      }

      setMessages(response.data.data.messages);

    } catch (err) {
      const errorMessage = err.response?.data?.message 
        || err.message 
        || 'Erreur de communication avec le serveur';
      
      setError(errorMessage);
      
      if (err.response?.status === 401) {
        localStorage.removeItem('token');
        window.location.href = '/login';
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMessages();
  }, []);

  if (loading) {
    return (
      <Container className="text-center mt-5">
        <Spinner animation="border" role="status">
          <span className="visually-hidden">Chargement...</span>
        </Spinner>
        <p>Chargement des messages...</p>
      </Container>
    );
  }

  if (error) {
    return (
      <Container className="mt-5">
        <Alert variant="danger">
          <Alert.Heading>Erreur</Alert.Heading>
          <p>{error}</p>
          <Button variant="primary" onClick={fetchMessages}>
            Réessayer
          </Button>
        </Alert>
      </Container>
    );
  }

  return (
    <Container className="mt-4">
      <h2 className="mb-4">Messages de Réclamation</h2>
      
      {messages.length === 0 ? (
        <Alert variant="info">Aucun message à afficher</Alert>
      ) : (
        <Table striped bordered hover responsive>
          <thead>
            <tr>
              <th>Nom</th>
              <th>Email</th>
              <th>Téléphone</th>
              <th>Sujet</th>
              <th>Message</th>
              <th>Date</th>
            </tr>
          </thead>
          <tbody>
            {messages.map((message) => (
              <tr key={message._id}>
                <td>{message.name || '-'}</td>
                <td>{message.email || '-'}</td>
                <td>{message.phone || '-'}</td>
                <td>{message.subject || '-'}</td>
                <td>{message.message}</td>
                <td>{new Date(message.createdAt).toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </Table>
      )}
      <Button variant="secondary" onClick={fetchMessages} className="mt-3">
        Rafraîchir
      </Button>
    </Container>
  );
};

export default ContactMessages;