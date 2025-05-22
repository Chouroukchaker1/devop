import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Table, Button, Spinner } from 'react-bootstrap';

const api = axios.create({
  baseURL: 'http://localhost:8080',
  withCredentials: true,
});

api.interceptors.request.use(config => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

const UserManagement = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchUsers = async () => {
    try {
      const res = await api.get('/api/auth/getUsers');
      setUsers(res.data.users);
    } catch (err) {
      console.error('Erreur lors du chargement des utilisateurs:', err.message);
    } finally {
      setLoading(false);
    }
  };

  const toggleAccount = async (userId, currentStatus) => {
    try {
      await api.patch(`/api/auth/${userId}/activate`, {
        isActive: !currentStatus,
      });
      setUsers(users.map(user =>
        user._id === userId ? { ...user, isActive: !currentStatus } : user
      ));
    } catch (error) {
      console.error('Erreur lors de l’activation/désactivation :', error.message);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  if (loading) return <Spinner animation="border" />;

  return (
    <div className="container mt-4">
      <h3>Gestion des utilisateurs</h3>
      <Table bordered striped hover responsive>
        <thead>
          <tr>
            <th>Nom</th>
            <th>Email</th>
            <th>Rôle</th>
            <th>Statut</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          {users.map(user => (
            <tr key={user._id}>
              <td>{user.username}</td>
              <td>{user.email}</td>
              <td>{user.role}</td>
              <td>{user.isActive ? '✅ Actif' : '❌ Désactivé'}</td>
              <td>
                <Button
                  variant={user.isActive ? 'danger' : 'success'}
                  size="sm"
                  onClick={() => toggleAccount(user._id, user.isActive)}
                >
                  {user.isActive ? 'Désactiver' : 'Activer'}
                </Button>
              </td>
            </tr>
          ))}
        </tbody>
      </Table>
    </div>
  );
};

export default UserManagement;
