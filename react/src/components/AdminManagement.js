import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './AdminUsers.css'; // Assuming you want to use the same CSS

const AdminManagement = () => {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    role: 'admin'
  });
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [userToUpdate, setUserToUpdate] = useState(null);
  const [newUsername, setNewUsername] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newRole, setNewRole] = useState('');

  // Fetch users using the working implementation from AdminUsers
  const fetchUsers = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await axios.get('http://localhost:3000/api/auth/getUsers', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });

      // Log for debugging
      console.log('Fetched users:', response.data);

      // Handle different response structures
      const fetchedUsers = Array.isArray(response.data)
        ? response.data
        : response.data.users || [];

      setUsers(fetchedUsers);
    } catch (err) {
      console.error('Error fetching users', err);
      setError(err.response?.data?.message || 'Erreur lors du chargement des utilisateurs');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  // Handle form changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Add a new user
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem('token');
      await axios.post(
        'http://localhost:3000/api/auth/register',
        formData,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setSuccess('Utilisateur créé avec succès');
      setFormData({
        username: '',
        email: '',
        password: '',
        role: 'admin'
      });
      fetchUsers(); // Refresh the list
    } catch (err) {
      console.error('Erreur:', err.response?.data || err.message);
      setError(err.response?.data?.message || 'Erreur lors de la création');
    } finally {
      setLoading(false);
    }
  };

  // Delete a user using the working implementation from AdminUsers
  const handleDelete = async (userId) => {
    if (!window.confirm('Êtes-vous sûr de vouloir supprimer cet utilisateur ?')) return;
    
    setLoading(true);
    setError(null);
    try {
      await axios.delete('http://localhost:3000/api/auth/delete-user', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        data: { userId },
      });
      setSuccess('Utilisateur supprimé avec succès');
      setUsers(users.filter(user => user._id !== userId));
    } catch (err) {
      console.error('Erreur:', err.response?.data || err.message);
      setError(err.response?.data?.message || 'Erreur lors de la suppression');
    } finally {
      setLoading(false);
    }
  };

  // Update user functions from AdminUsers
  const handleUpdate = (user) => {
    setUserToUpdate(user);
    setNewUsername(user.username);
    setNewEmail(user.email);
    setNewRole(user.role);
  };

  const handleRoleChange = (e) => {
    setNewRole(e.target.value);
  };

  const handleUsernameChange = (e) => {
    setNewUsername(e.target.value);
  };

  const handleEmailChange = (e) => {
    setNewEmail(e.target.value);
  };

  const handleSaveUpdate = async () => {
    try {
      await axios.put('http://localhost:3000/api/auth/update-user', {
        userId: userToUpdate._id,
        username: newUsername,
        email: newEmail,
        role: newRole,
      }, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });

      setUsers(users.map(user =>
        user._id === userToUpdate._id
          ? { ...user, username: newUsername, email: newEmail, role: newRole }
          : user
      ));

      setUserToUpdate(null);
      setSuccess('Utilisateur mis à jour avec succès');
    } catch (error) {
      console.error('Error updating user', error);
      setError(error.response?.data?.message || 'Erreur lors de la mise à jour');
    }
  };

  return (
    <div className="container mt-4">
      <h2 className="mb-4">Gestion des Utilisateurs</h2>

      {/* Add user form */}
      <div className="card mb-4">
        <div className="card-body">
          <h5 className="card-title">Ajouter un nouvel utilisateur</h5>
          {success && <div className="alert alert-success">{success}</div>}
          {error && <div className="alert alert-danger">{error}</div>}
          
          <form onSubmit={handleSubmit}>
            <div className="mb-3">
              <label className="form-label">Nom d'utilisateur</label>
              <input
                type="text"
                className="form-control"
                name="username"
                value={formData.username}
                onChange={handleChange}
                required
              />
            </div>
            
            <div className="mb-3">
              <label className="form-label">Email</label>
              <input
                type="email"
                className="form-control"
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
              />
            </div>
            
            <div className="mb-3">
              <label className="form-label">Mot de passe</label>
              <input
                type="password"
                className="form-control"
                name="password"
                value={formData.password}
                onChange={handleChange}
                required
              />
            </div>
            
            <div className="mb-3">
              <label className="form-label">Rôle</label>
              <select
                className="form-select"
                name="role"
                value={formData.role}
                onChange={handleChange}
              >
                <option value="admin">Admin</option>
                <option value="consultant">Consultant</option>
                <option value="fueluser"></option>
              </select>
            </div>
            
            <button 
              type="submit" 
              className="btn btn-primary"
              disabled={loading}
            >
              {loading ? 'En cours...' : 'Créer Utilisateur'}
            </button>
          </form>
        </div>
      </div>

      {/* User list */}
      <div className="card">
        <div className="card-body">
          <h5 className="card-title">Liste des Utilisateurs</h5>
          
          {loading && users.length === 0 ? (
            <div className="text-center">
              <div className="spinner-border" role="status">
                <span className="visually-hidden">Chargement...</span>
              </div>
            </div>
          ) : error ? (
            <div className="alert alert-danger">{error}</div>
          ) : users.length === 0 ? (
            <p>Aucun utilisateur trouvé</p>
          ) : (
            <div className="table-responsive">
              <table className="table table-striped">
                <thead>
                  <tr>
                    <th>Nom</th>
                    <th>Email</th>
                    <th>Rôle</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map(user => (
                    <tr key={user._id}>
                      <td>{user.username}</td>
                      <td>{user.email}</td>
                      <td>
                        <span className={`badge ${
                          user.role === 'admin' ? 'bg-primary' :
                          user.role === 'consultant' ? 'bg-success' :
                          user.role === 'fueluser' ? 'bg-warning text-dark' :
                          'bg-secondary'
                        }`}>
                          {user.role}
                        </span>
                      </td>
                      <td>
                        <button
                          onClick={() => handleUpdate(user)}
                          className="btn btn-primary btn-sm me-2"
                          disabled={loading}
                        >
                          Modifier
                        </button>
                        <button
                          onClick={() => handleDelete(user._id)}
                          className="btn btn-danger btn-sm"
                          disabled={loading}
                        >
                          Supprimer
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Update user modal/form */}
      {userToUpdate && (
        <div className="card mt-4">
          <div className="card-body">
            <h5 className="card-title">Mettre à jour l'utilisateur</h5>
            <div className="mb-3">
              <label className="form-label">Nom d'utilisateur:</label>
              <input
                type="text"
                className="form-control"
                value={newUsername}
                onChange={handleUsernameChange}
              />
            </div>
            <div className="mb-3">
              <label className="form-label">Email:</label>
              <input
                type="email"
                className="form-control"
                value={newEmail}
                onChange={handleEmailChange}
              />
            </div>
            <div className="mb-3">
              <label className="form-label">Role:</label>
              <select 
                className="form-select"
                value={newRole} 
                onChange={handleRoleChange}
              >
                <option value="admin">Admin</option>
                <option value="consultant">Consultant</option>
                <option value="fueluser">fueluser</option>
              </select>
            </div>
            <button 
              onClick={handleSaveUpdate}
              className="btn btn-success me-2"
            >
              Enregistrer
            </button>
            <button 
              onClick={() => setUserToUpdate(null)}
              className="btn btn-secondary"
            >
              Annuler
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminManagement;