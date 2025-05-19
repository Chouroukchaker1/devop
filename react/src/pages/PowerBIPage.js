import React, { useEffect, useState } from 'react';
import axios from 'axios';
import PowerBIReport from '../components/PowerBIReport';

const PowerBIPage = () => {
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchToken = async () => {
      try {
        const response = await axios.get('/api/powerbi/token');
        setToken(response.data);
        setLoading(false);
      } catch (err) {
        setError(err.message);
        setLoading(false);
      }
    };

    fetchToken();
  }, []);

  if (loading) return <div>Loading Power BI report...</div>;
  if (error) return <div>Error loading report: {error}</div>;

  return (
    <div className="container mt-4 mb-5">
      <div className="row">
        <div className="col-12">
          <div className="card shadow-sm">
            <div className="card-body p-0">
              <PowerBIReport token={token} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PowerBIPage;