import React, { useEffect, useState } from 'react';
import {
  Container, Card, Button, Spinner, Alert, Table
} from 'react-bootstrap';
import axios from 'axios';

const MissingFuelPage = () => {
  const [missingRows, setMissingRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchMissingFuelData = async () => {
      try {
        const res = await axios.get('http://localhost:8082/api/missing-data/missing-fuel');
        if (res.data.success) {
          setMissingRows(res.data.rows);
        } else {
          throw new Error(res.data.message || 'Erreur lors de la récupération.');
        }
      } catch (err) {
        setError(err.response?.data?.message || err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchMissingFuelData();
  }, []);

  return (
    <Container className="mt-5">
      <h2 className="mb-4 text-center">Données Carburant Manquantes</h2>

      {loading ? (
        <Spinner animation="border" />
      ) : error ? (
        <Alert variant="danger">{error}</Alert>
      ) : (
        <Card>
          <Card.Body>
            {missingRows.length === 0 ? (
              <Alert variant="success">Aucune donnée manquante trouvée.</Alert>
            ) : (
              <Table striped bordered hover>
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Flight ID</th>
                    <th>Date</th>
                    <th>Colonnes Manquantes</th>
                  </tr>
                </thead>
                <tbody>
                  {missingRows.map((row, index) => (
                    <tr key={index}>
                      <td>{row.rowIndex + 1}</td>
                      <td>{row.flightId}</td>
                      <td>{row.date}</td>
                      <td>{row.missingColumns.join(', ')}</td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            )}
          </Card.Body>
        </Card>
      )}
    </Container>
  );
};

export default MissingFuelPage;
