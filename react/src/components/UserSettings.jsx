import React, { useState, useEffect } from 'react';
import axios from 'axios';

const UserSettings = () => {
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [success, setSuccess] = useState(null);
  const [error, setError] = useState(null);

  // Charger les paramètres utilisateur
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const response = await axios.get('/api/user-settings', {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        });
        setSettings(response.data.settings);
        setLoading(false);
      } catch (err) {
        setError('❌ Impossible de charger les paramètres');
        setLoading(false);
      }
    };
    fetchSettings();
  }, []);

  const handleUpdate = async (section, data) => {
    try {
      const res = await axios.put(`/api/user-settings/${section}`, data, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      setSettings(res.data.settings);
      setSuccess(`✅ ${section} mis à jour`);
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(`❌ Erreur lors de la mise à jour de ${section}`);
    }
  };

  const handleToggle = async (section, field, currentValue) => {
    try {
      const res = await axios.patch(`/api/user-settings/${section}/toggle`, {
        [field]: !currentValue
      }, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      setSettings(res.data.settings);
      setSuccess(`✅ ${field} ${!currentValue ? 'activé' : 'désactivé'}`);
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(`❌ Erreur lors du basculement de ${field}`);
    }
  };

  if (loading) return <div className="text-center">Chargement...</div>;
  if (error) return <div className="text-center text-red-500">{error}</div>;

  return (
    <div className="container mx-auto max-w-3xl p-4">
      {success && <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 mb-4 rounded">{success}</div>}

      <h2 className="text-xl font-bold mb-4">Paramètres de notification</h2>
      <div className="bg-white shadow p-4 mb-6 rounded">
        <label className="flex items-center mb-2">
          <input type="checkbox"
            checked={settings.notifications.enable}
            onChange={() => handleToggle('notifications', 'enable', settings.notifications.enable)}
            className="mr-2" />
          Activer les notifications
        </label>

        <label className="block mb-2">Plage silencieuse</label>
        <div className="flex gap-4 mb-2">
          <input
            type="time"
            value={settings.notifications.quietStart}
            onChange={(e) => setSettings(prev => ({
              ...prev,
              notifications: { ...prev.notifications, quietStart: e.target.value }
            }))}
          />
          <input
            type="time"
            value={settings.notifications.quietEnd}
            onChange={(e) => setSettings(prev => ({
              ...prev,
              notifications: { ...prev.notifications, quietEnd: e.target.value }
            }))}
          />
        </div>

        <button
          className="mt-2 bg-blue-500 text-white px-4 py-2 rounded"
          onClick={() => handleUpdate('notifications', { notifications: settings.notifications })}
        >
          Sauvegarder Notifications
        </button>
      </div>

      <h2 className="text-xl font-bold mb-4">Affichage des données</h2>
      <div className="bg-white shadow p-4 mb-6 rounded">
        <label className="block mb-2">Mode sombre</label>
        <input
          type="checkbox"
          checked={settings.dataViewer.darkMode}
          onChange={(e) => setSettings(prev => ({
            ...prev,
            dataViewer: { ...prev.dataViewer, darkMode: e.target.checked }
          }))}
        />

        <button
          className="mt-2 bg-blue-500 text-white px-4 py-2 rounded"
          onClick={() => handleUpdate('data-viewer', { dataViewer: settings.dataViewer })}
        >
          Sauvegarder Affichage
        </button>
      </div>

      <h2 className="text-xl font-bold mb-4">Planificateur</h2>
      <div className="bg-white shadow p-4 rounded">
        <label className="flex items-center mb-2">
          <input type="checkbox"
            checked={settings.schedulerConfig.enabled}
            onChange={() => handleToggle('scheduler', 'enabled', settings.schedulerConfig.enabled)}
            className="mr-2" />
          Activer le scheduler
        </label>
        <button
          className="mt-2 bg-blue-500 text-white px-4 py-2 rounded"
          onClick={() => handleUpdate('', { schedulerConfig: settings.schedulerConfig })}
        >
          Sauvegarder Planificateur
        </button>
      </div>
    </div>
  );
};

export default UserSettings;
