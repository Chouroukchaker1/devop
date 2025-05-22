import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Button, Alert, Spinner } from 'react-bootstrap';

const PowerBIDashboard = () => {
  const [embedUrl, setEmbedUrl] = useState(null);
  const [accessToken, setAccessToken] = useState(null);
  const [reportId, setReportId] = useState(null);
  const [workspaceId, setWorkspaceId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchToken = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await axios.get('http://localhost:8080/api/powerbi/token');
      const { accessToken, reportId, workspaceId } = response.data;

      const url = `https://app.powerbi.com/reportEmbed?reportId=${reportId}&groupId=${workspaceId}&autoAuth=true&ctid=${process.env.REACT_APP_TENANT_ID}`;
      setEmbedUrl(url);
      setAccessToken(accessToken);
      setReportId(reportId);
      setWorkspaceId(workspaceId);
    } catch (err) {
      setError('Erreur lors de la récupération du token Power BI. Vérifiez votre configuration Azure.');
      console.error('❌ Erreur token Power BI :', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchToken();
  }, []);

  return (
    <div style={{ height: '100vh', width: '100%', padding: '20px' }}>
      <h2 className="mb-3">📊 Tableau de bord Power BI</h2>

      <Button variant="primary" onClick={fetchToken} disabled={loading}>
        🔄 Rafraîchir le token
      </Button>

      {loading && (
        <div className="mt-4">
          <Spinner animation="border" variant="primary" />
          <p className="mt-2">Chargement du tableau de bord...</p>
        </div>
      )}

      {error && (
        <Alert variant="danger" className="mt-4">
          {error}
        </Alert>
      )}

      {!loading && !error && embedUrl && (
        <iframe
          title="Power BI Dashboard"
          width="100%"
          height="800px"
          src={embedUrl}
          frameBorder="0"
          allowFullScreen
          style={{ marginTop: '20px' }}
        ></iframe>
      )}
    </div>
  );
};

export default PowerBIDashboard;
