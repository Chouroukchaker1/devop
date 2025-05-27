import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { Button, Input, notification, Modal, Select } from 'antd';
import { BellOutlined, EditOutlined, DeleteOutlined, PlusOutlined } from '@ant-design/icons';
import './AdminUsers.css';

const notificationTypes = [
  'update',
  'data_missing',
  'alert',
  'warning',
  'success',
  'system',
  'importation_data_refusée',
  'erreur',
  'avertissement_donnée_manquante'
];

const AllowedNotificationManager = ({ userId, onClose }) => {
  const [users, setUsers] = useState([]);
  const [selectedUserId, setSelectedUserId] = useState(userId || '');
  const [selectedTypes, setSelectedTypes] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    axios.get('http://localhost:8082/api/auth/getUsers', {
      headers: {
        Authorization: `Bearer ${localStorage.getItem('token')}`
      }
    })
    .then(res => {
      setUsers(res.data.users || []);
    })
    .catch(err => {
      console.error('Erreur chargement utilisateurs:', err);
      notification.error({
        message: 'Erreur',
        description: 'Impossible de charger les utilisateurs',
      });
    });
  }, []);

  const toggleType = (type) => {
    if (selectedTypes.includes(type)) {
      setSelectedTypes(selectedTypes.filter(t => t !== type));
    } else {
      setSelectedTypes([...selectedTypes, type]);
    }
  };

  const handleSave = async () => {
    if (!selectedUserId || selectedTypes.length === 0) {
      notification.error({
        message: 'Erreur',
        description: 'Sélectionnez un utilisateur et au moins un type.',
      });
      return;
    }

    setLoading(true);
    try {
      await axios.put('http://localhost:8082/api/userSettings/notifications/allowed-types', {
        userId: selectedUserId,
        allowedNotificationTypes: selectedTypes
      }, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      });

      notification.success({
        message: 'Succès',
        description: 'Types autorisés mis à jour avec succès !',
      });
      onClose();
    } catch (error) {
      console.error('Erreur mise à jour :', error);
      notification.error({
        message: 'Erreur',
        description: 'Échec de la mise à jour.',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: '1rem' }}>
      <h3>🎛 Gérer les types de notifications autorisées</h3>

      <label>👤 Utilisateur :</label>
      <Select
        onChange={(value) => setSelectedUserId(value)}
        value={selectedUserId}
        style={{ width: '100%', marginBottom: '1rem' }}
      >
        <Select.Option value="">-- Choisir --</Select.Option>
        {users.map(user => (
          <Select.Option key={user._id} value={user._id}>
            {user.username} ({user.email})
          </Select.Option>
        ))}
      </Select>

      <div style={{ marginTop: '1rem' }}>
        <strong>Types autorisés :</strong>
        {notificationTypes.map(type => (
          <div key={type}>
            <label>
              <input
                type="checkbox"
                checked={selectedTypes.includes(type)}
                onChange={() => toggleType(type)}
              />
              {' '}{type}
            </label>
          </div>
        ))}
      </div>

      <Button onClick={handleSave} disabled={loading} style={{ marginTop: '1rem' }}>
        {loading ? 'Envoi...' : 'Enregistrer'}
      </Button>
    </div>
  );
};

const AdminUsers = () => {
  const [users, setUsers] = useState([]);
  const [userToUpdate, setUserToUpdate] = useState(null);
  const [newUsername, setNewUsername] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newRole, setNewRole] = useState('');
  const [isNotificationModalVisible, setIsNotificationModalVisible] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState(null);
  const [isAddUserModalVisible, setIsAddUserModalVisible] = useState(false);
  const [newUser, setNewUser] = useState({
    username: '',
    email: '',
    password: '',
    role: 'consultant'
  });
  const [addUserLoading, setAddUserLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchUsersAndSettings = async () => {
      try {
        // Fetch users
        const userResponse = await axios.get('http://localhost:8082/api/auth/getUsers', {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`,
          },
        });
        const fetchedUsers = Array.isArray(userResponse.data)
          ? userResponse.data
          : userResponse.data.users || [];

        // Fetch notification settings for each user
        const usersWithSettings = await Promise.all(
          fetchedUsers.map(async (user) => {
            try {
              const settingsResponse = await axios.get(`http://localhost:8082/api/userSettings/notifications/${user._id}`, {
                headers: {
                  Authorization: `Bearer ${localStorage.getItem('token')}`,
                },
              });
              // Ensure allowedNotificationTypes is always an array
              const allowedNotificationTypes = Array.isArray(settingsResponse.data?.settings?.notifications?.allowedTypes)
              ? settingsResponse.data.settings.notifications.allowedTypes
              : [];
            
              return {
                ...user,
                allowedNotificationTypes,
              };
            } catch (error) {
              console.error(`Error fetching settings for user ${user._id}:`, error);
              return { ...user, allowedNotificationTypes: [] };
            }
          })
        );

        setUsers(usersWithSettings);
      } catch (error) {
        console.error('Error fetching users:', error);
        notification.error({
          message: 'Erreur',
          description: 'Impossible de récupérer la liste des utilisateurs',
        });
      }
    };
    fetchUsersAndSettings();
  }, []);

  const handleDelete = async (userId) => {
    try {
      await axios.delete('http://localhost:8082/api/auth/delete-user', {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
        data: { userId },
      });
      setUsers(users.filter(user => user._id !== userId));
      notification.success({
        message: 'Succès',
        description: 'Utilisateur supprimé avec succès',
      });
    } catch (error) {
      console.error('Error deleting user:', error);
      notification.error({
        message: 'Erreur',
        description: 'Impossible de supprimer l\'utilisateur',
      });
    }
  };

  const handleUpdate = (user) => {
    setUserToUpdate(user);
    setNewUsername(user.username);
    setNewEmail(user.email);
    setNewRole(user.role);
  };

  const handleRoleChange = (value) => {
    setNewRole(value);
  };

  const handleUsernameChange = (e) => {
    setNewUsername(e.target.value);
  };

  const handleEmailChange = (e) => {
    setNewEmail(e.target.value);
  };

  const handleSaveUpdate = async () => {
    try {
      await axios.put('http://localhost:8082/api/auth/update-user', {
        userId: userToUpdate._id,
        username: newUsername,
        email: newEmail,
        role: newRole,
      }, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });

      setUsers(users.map(user =>
        user._id === userToUpdate._id
          ? { ...user, username: newUsername, email: newEmail, role: newRole }
          : user
      ));

      await axios.post('http://localhost:8082/api/notifications/send', {
        userId: userToUpdate._id,
        type: 'success',
        message: 'Votre profil a été mis à jour avec succès.',
      }, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });

      notification.success({
        message: 'Succès',
        description: 'Utilisateur mis à jour avec succès et notification envoyée',
      });
      setUserToUpdate(null);
    } catch (error) {
      console.error('Error updating user:', error);
      notification.error({
        message: 'Erreur',
        description: 'Impossible de mettre à jour l\'utilisateur',
      });
    }
  };

  const handleNotificationClick = (user) => {
    setSelectedUserId(user._id);
    setIsNotificationModalVisible(true);
  };

  const handleAddUserChange = (field, value) => {
    setNewUser({ ...newUser, [field]: value });
  };

  const handleAddUser = async () => {
    if (!newUser.username || !newUser.email || !newUser.password || !newUser.role) {
      notification.error({
        message: 'Erreur',
        description: 'Tous les champs sont requis.',
      });
      return;
    }

    setAddUserLoading(true);
    try {
      const response = await axios.post('http://localhost:8082/api/auth/register', {
        username: newUser.username,
        email: newUser.email,
        password: newUser.password,
        role: newUser.role,
      }, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });

      setUsers([...users, {
        _id: response.data.userId,
        username: newUser.username,
        email: newUser.email,
        role: newUser.role,
        allowedNotificationTypes: [], // Ensure new user has empty array
      }]);

      notification.success({
        message: 'Succès',
        description: 'Utilisateur ajouté avec succès',
      });
      setIsAddUserModalVisible(false);
      setNewUser({ username: '', email: '', password: '', role: 'consultant' });
    } catch (error) {
      console.error('Error adding user:', error);
      notification.error({
        message: 'Erreur',
        description: error.response?.data?.message || 'Impossible d\'ajouter l\'utilisateur',
      });
    } finally {
      setAddUserLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/login');
  };

  return (
    <div>
      <div className="admin-users" style={{ padding: '20px' }}>
        <div style={{ marginBottom: '20px' }}>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => setIsAddUserModalVisible(true)}
          >
            Ajouter Utilisateur
          </Button>
        </div>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ backgroundColor: '#f0f2f5' }}>
              <th style={{ padding: '10px', border: '1px solid #ddd' }}>Username</th>
              <th style={{ padding: '10px', border: '1px solid #ddd' }}>Email</th>
              <th style={{ padding: '10px', border: '1px solid #ddd' }}>Role</th>
              <th style={{ padding: '10px', border: '1px solid #ddd' }}>Notifications Autorisées</th>
              <th style={{ padding: '10px', border: '1px solid #ddd' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {Array.isArray(users) && users.map(user => (
              <tr key={user._id}>
                <td style={{ padding: '10px', border: '1px solid #ddd' }}>{user.username}</td>
                <td style={{ padding: '10px', border: '1px solid #ddd' }}>{user.email}</td>
                <td style={{ padding: '10px', border: '1px solid #ddd' }}>{user.role}</td>
                <td style={{ padding: '10px', border: '1px solid #ddd' }}>
                  {Array.isArray(user.allowedNotificationTypes) && user.allowedNotificationTypes.length > 0
                    ? user.allowedNotificationTypes.join(', ')
                    : 'Aucune'}
                </td>
                <td style={{ padding: '10px', border: '1px solid #ddd' }}>
                  <Button 
                    onClick={() => handleUpdate(user)} 
                    style={{ marginRight: '10px' }}
                    icon={<EditOutlined />}
                  >
                    Update
                  </Button>
                  <Button 
                    onClick={() => handleDelete(user._id)} 
                    danger
                    icon={<DeleteOutlined />}
                  >
                    Delete
                  </Button>
                  <BellOutlined
                    style={{ fontSize: '16px', cursor: 'pointer', marginLeft: '10px' }}
                    onClick={() => handleNotificationClick(user)}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {userToUpdate && (
          <div className="update-form" style={{ marginTop: '20px', padding: '20px', border: '1px solid #ddd', borderRadius: '4px' }}>
            <h2>Mettre à jour l'utilisateur</h2>
            <div style={{ marginBottom: '10px' }}>
              <label>Nom d'utilisateur: </label>
              <Input type="text" value={newUsername} onChange={handleUsernameChange} style={{ width: '200px' }} />
            </div>
            <div style={{ marginBottom: '10px' }}>
              <label>Email: </label>
              <Input type="email" value={newEmail} onChange={handleEmailChange} style={{ width: '200px' }} />
            </div>
            <div style={{ marginBottom: '10px' }}>
              <label>Role: </label>
              <Select value={newRole} onChange={handleRoleChange} style={{ width: '200px' }}>
                <Select.Option value="consultant">Consultant</Select.Option>
                <Select.Option value="fueluser">Fueluser</Select.Option>
              </Select>
            </div>
            <Button onClick={handleSaveUpdate} type="primary" style={{ marginRight: '10px' }}>Enregistrer</Button>
            <Button onClick={() => setUserToUpdate(null)}>Annuler</Button>
          </div>
        )}
      </div>

      <Modal
        title="Gérer les notifications"
        open={isNotificationModalVisible}
        onCancel={() => setIsNotificationModalVisible(false)}
        footer={null}
      >
        <AllowedNotificationManager
          userId={selectedUserId}
          onClose={() => setIsNotificationModalVisible(false)}
        />
      </Modal>

      <Modal
        title="Ajouter un nouvel utilisateur"
        open={isAddUserModalVisible}
        onCancel={() => setIsAddUserModalVisible(false)}
        footer={null}
      >
        <div style={{ padding: '1rem' }}>
          <div style={{ marginBottom: '10px' }}>
            <label>Nom d'utilisateur: </label>
            <Input
              type="text"
              value={newUser.username}
              onChange={(e) => handleAddUserChange('username', e.target.value)}
              style={{ width: '100%' }}
            />
          </div>
          <div style={{ marginBottom: '10px' }}>
            <label>Email: </label>
            <Input
              type="email"
              value={newUser.email}
              onChange={(e) => handleAddUserChange('email', e.target.value)}
              style={{ width: '100%' }}
            />
          </div>
          <div style={{ marginBottom: '10px' }}>
            <label>Mot de passe: </label>
            <Input.Password
              value={newUser.password}
              onChange={(e) => handleAddUserChange('password', e.target.value)}
              style={{ width: '100%' }}
            />
          </div>
          <div style={{ marginBottom: '10px' }}>
            <label>Role: </label>
            <Select
              value={newUser.role}
              onChange={(value) => handleAddUserChange('role', value)}
              style={{ width: '100%' }}
            >
              <Select.Option value="consultant">Consultant</Select.Option>
              <Select.Option value="fueluser">Fueluser</Select.Option>
            </Select>
          </div>
          <Button
            type="primary"
            onClick={handleAddUser}
            loading={addUserLoading}
            style={{ marginTop: '10px' }}
          >
            Ajouter
          </Button>
        </div>
      </Modal>
    </div>
  );
};

export default AdminUsers;