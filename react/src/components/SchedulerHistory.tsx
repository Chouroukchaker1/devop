import React, { useEffect, useState, useRef } from 'react';
import axios from 'axios';
import 'bootstrap/dist/css/bootstrap.min.css';

interface SchedulerEntry {
  _id: string;
  startTime: string;
  endTime?: string;
  status: 'started' | 'completed' | 'failed';
  error?: string;
  details?: {
    scriptsExecuted?: string[];
    notificationsSent?: number;
  };
}

const SchedulerHistory: React.FC = () => {
  const [history, setHistory] = useState<SchedulerEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [limit, setLimit] = useState<number>(10);
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const tableRef = useRef<HTMLDivElement>(null);

  const getAuthToken = () => {
    return localStorage.getItem('token');
  };

  const fetchHistory = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const token = getAuthToken();
      if (!token) {
        setError('Jeton d\'authentification non trouvé. Veuillez vous connecter.');
        return;
      }

      const params = new URLSearchParams();
      if (limit) params.append('limit', limit.toString());
      if (statusFilter) params.append('status', statusFilter);
      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);

      const response = await axios.get('http://localhost:8082/api/scheduler/history', {
        params,
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.data.success) {
        setHistory(response.data.data);
      } else {
        setError(response.data.message || 'Échec de la récupération de l\'historique');
      }
    } catch (err) {
      console.error('Erreur lors de la récupération de l\'historique du planificateur :', err);
      setError(err.response?.data?.message || err.message || 'Échec de la récupération de l\'historique');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, [limit, statusFilter, startDate, endDate]);

  const handleResetFilters = () => {
    setStatusFilter('');
    setLimit(10);
    setStartDate('');
    setEndDate('');
  };

  const scrollUp = () => {
    if (tableRef.current) {
      tableRef.current.scrollBy({ top: -200, behavior: 'smooth' });
    }
  };

  const scrollDown = () => {
    if (tableRef.current) {
      tableRef.current.scrollBy({ top: 200, behavior: 'smooth' });
    }
  };

  return (
    <div className="scheduler-container">
      <div className="header-section">
        <h2 className="main-title">Historique d'exécution du planificateur</h2>
        <div className="header-line"></div>
      </div>

      {/* Section des filtres */}
      <div className="filter-card">
        <h5 className="filter-title">Filtres de recherche</h5>
        <div className="row mb-4">
          <div className="col-md-3 mb-3">
            <label className="filter-label">Statut</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="form-control filter-select"
            >
              <option value="">Tous les statuts</option>
              <option value="started">Démarré</option>
              <option value="completed">Terminé</option>
              <option value="failed">Échoué</option>
            </select>
          </div>

          <div className="col-md-3 mb-3">
            <label className="filter-label">Limite de résultats</label>
            <input
              type="number"
              min="1"
              max="100"
              value={limit}
              onChange={(e) => setLimit(Number(e.target.value))}
              className="form-control filter-input"
            />
          </div>

          <div className="col-md-3 mb-3">
            <label className="filter-label">Date de début</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="form-control filter-input"
            />
          </div>

          <div className="col-md-3 mb-3">
            <label className="filter-label">Date de fin</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="form-control filter-input"
            />
          </div>
        </div>

        <div className="d-flex justify-content-end button-group">
          <button
            onClick={handleResetFilters}
            className="btn btn-outline-secondary reset-btn me-2"
          >
            <i className="bi bi-arrow-counterclockwise me-1"></i> Réinitialiser
          </button>
          <button
            onClick={fetchHistory}
            className="btn apply-btn"
          >
            <i className="bi bi-funnel me-1"></i> Appliquer les filtres
          </button>
        </div>
      </div>

      {/* Contrôles de défilement */}
      <div className="scroll-controls">
        <button className="scroll-btn scroll-up-btn" onClick={scrollUp}>
          <i className="bi bi-arrow-up"></i>
        </button>
        <button className="scroll-btn scroll-down-btn" onClick={scrollDown}>
          <i className="bi bi-arrow-down"></i>
        </button>
      </div>

      {/* Section des résultats */}
      {loading ? (
        <div className="loader-container">
          <div className="spinner-border text-warning" role="status">
            <span className="visually-hidden">Chargement...</span>
          </div>
        </div>
      ) : error ? (
        <div className="alert alert-danger" role="alert">
          <i className="bi bi-exclamation-triangle-fill me-2"></i>{error}
        </div>
      ) : history.length === 0 ? (
        <div className="alert alert-warning" role="alert">
          <i className="bi bi-info-circle-fill me-2"></i>Aucun historique du planificateur trouvé avec les filtres actuels.
        </div>
      ) : (
        <div className="table-responsive result-table" ref={tableRef}>
          <table className="table table-hover">
            <thead>
              <tr>
                <th scope="col">Heure de début</th>
                <th scope="col">Heure de fin</th>
                <th scope="col">Statut</th>
                <th scope="col">Scripts exécutés</th>
                <th scope="col">Notifications</th>
                <th scope="col">Erreur</th>
              </tr>
            </thead>
            <tbody>
              {history.map((entry) => (
                <tr key={entry._id}>
                  <td className="align-middle">{new Date(entry.startTime).toLocaleString()}</td>
                  <td className="align-middle">{entry.endTime ? new Date(entry.endTime).toLocaleString() : '-'}</td>
                  <td className="align-middle">
                    <span
                      className={`status-badge ${
                        entry.status === 'completed'
                          ? 'status-completed'
                          : entry.status === 'failed'
                          ? 'status-failed'
                          : 'status-started'
                      }`}
                    >
                      {entry.status === 'completed' ? 'Terminé' : 
                       entry.status === 'failed' ? 'Échoué' : 'Démarré'}
                    </span>
                  </td>
                  <td className="align-middle">
                    {entry.details?.scriptsExecuted?.join(', ') || '-'}
                  </td>
                  <td className="align-middle">
                    {entry.details?.notificationsSent || '-'}
                  </td>
                  <td className="align-middle error-cell">
                    {entry.error || '-'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <style>{`
        /* Styles généraux */
        .scheduler-container {
          padding: 2rem;
          max-width: 1200px;
          margin: 0 auto;
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
          background-color: #f8f9fa;
          min-height: 100vh;
        }
        
        /* Section d'en-tête */
        .header-section {
          margin-bottom: 2rem;
          position: relative;
        }
        
        .main-title {
          font-size: 2rem;
          font-weight: 600;
          color: rgb(212, 211, 215);
          margin-bottom: 0.5rem;
        }
        
        .header-line {
          height: 4px;
          width: 80px;
          background: linear-gradient(90deg, rgb(10, 12, 184), #ff6b00);
          border-radius: 2px;
          margin-bottom: 1.5rem;
        }
        
        /* Carte des filtres */
        .filter-card {
          background-color: #ffffff;
          border-radius: 8px;
          box-shadow: 0 4px 12px rgb(10, 12, 184);
          padding: 1.5rem;
          margin-bottom: 2rem;
          border-top: 4px solid rgb(37, 17, 162);
        }
        
        .filter-title {
          color: rgb(10, 12, 184);
          font-size: 1.2rem;
          font-weight: 600;
          margin-bottom: 1.2rem;
        }
        
        .filter-label {
          display: block;
          font-weight: 500;
          margin-bottom: 0.5rem;
          color: #555;
        }
        
        .filter-select, .filter-input {
          border: 1px solid #e0e0e0;
          border-radius: 4px;
          padding: 0.5rem;
          transition: border-color 0.2s;
        }
        
        .filter-select:focus, .filter-input:focus {
          border-color: rgb(10, 12, 184);
          box-shadow: 0 0 0 0.2rem rgba(255, 136, 0, 0.2);
        }
        
        .button-group {
          gap: 12px;
        }
        
        .reset-btn {
          border: 1px solid #999;
          color: #666;
          transition: all 0.2s;
        }
        
        .reset-btn:hover {
          background-color: #f0f0f0;
          color: #333;
        }
        
        .apply-btn {
          background-color: rgb(10, 12, 184);
          border: none;
          color: white;
          transition: all 0.2s;
        }
        
        .apply-btn:hover {
          background-color: rgb(10, 12, 184);
          box-shadow: 0 4px 8px rgba(255, 107, 0, 0.2);
        }
        
        /* Chargeur */
        .loader-container {
          display: flex;
          justify-content: center;
          align-items: center;
          height: 200px;
        }
        
        /* Styles du tableau */
        .result-table {
          background-color: #ffffff;
          border-radius: 8px;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
          overflow: hidden;
          max-height: 500px;
          overflow-y: auto;
          position: relative;
        }
        
        .table {
          margin-bottom: 0;
        }
        
        .table thead {
          background-color: #fff2e6;
          position: sticky;
          top: 0;
          z-index: 10;
        }
        
        .table thead th {
          font-weight: 600;
          color: rgb(10, 12, 184);
          border-bottom: 2px solid #ffd0a8;
          padding: 12px 16px;
        }
        
        .table tbody tr:hover {
          background-color: #fff8f2;
        }
        
        .table td {
          padding: 12px 16px;
          vertical-align: middle;
          border-color: #f0f0f0;
        }
        
        /* Badges de statut */
        .status-badge {
          display: inline-block;
          padding: 0.25rem 0.75rem;
          font-size: 0.8rem;
          font-weight: 600;
          border-radius: 50px;
          text-transform: capitalize;
        }
        
        .status-completed {
          background-color: #e6fff2;
          color: #00b35c;
          border: 1px solid #ccf2e0;
        }
        
        .status-failed {
          background-color: #fff0f0;
          color: #e60000;
          border: 1px solid #ffcccc;
        }
        
        .status-started {
          background-color: #fff8e6;
          color: #cc8800;
          border: 1px solid #ffe6b3;
        }
        
        .error-cell {
          max-width: 300px;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
          color: #e60000;
        }
        
        /* Contrôles de défilement */
        .scroll-controls {
          position: fixed;
          right: 30px;
          top: 50%;
          transform: translateY(-50%);
          display: flex;
          flex-direction: column;
          gap: 10px;
          z-index: 100;
        }
        
        .scroll-btn {
          width: 40px;
          height: 40px;
          border-radius: 50%;
          background-color: rgb(10, 12, 184);
          color: white;
          border: none;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
          transition: all 0.2s;
        }
        
        .scroll-btn:hover {
          background-color: rgb(8, 10, 160);
          transform: scale(1.1);
        }
        
        .scroll-btn i {
          font-size: 1.2rem;
        }
      `}</style>
    </div>
  );
};

export default SchedulerHistory;