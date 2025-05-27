import React, { useState, useEffect } from 'react';
import axios from 'axios';

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

const AllowedNotificationManager = () => {
  const [users, setUsers] = useState([]);
  const [selectedUserId, setSelectedUserId] = useState('');
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
      alert("Sélectionnez un utilisateur et au moins un type.");
      return;
    }

    setLoading(true);
    try {
      await axios.put('http://localhost:8082/api/user-settings/notifications/allowed-types', {
        userId: selectedUserId,
        allowedNotificationTypes: selectedTypes
      }, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      });

      alert("Types autorisés mis à jour avec succès !");
    } catch (error) {
      console.error('Erreur mise à jour :', error);
      alert("Échec de la mise à jour.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: '1rem' }}>
      <h3>🎛 Gérer les types de notifications autorisées</h3>

      <label>👤 Utilisateur :</label>
      <select onChange={(e) => setSelectedUserId(e.target.value)} value={selectedUserId}>
        <option value="">-- Choisir --</option>
        {users.map(user => (
          <option key={user._id} value={user._id}>{user.username} ({user.email})</option>
        ))}
      </select>

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

      <button onClick={handleSave} disabled={loading} style={{ marginTop: '1rem' }}>
        {loading ? "Envoi..." : "Enregistrer"}
      </button>
    </div>
  );
};

export default AllowedNotificationManager;
