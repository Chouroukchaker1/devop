// TransferDataPage.jsx - Composant principal qui contient les deux onglets pour le transfert de données
import React, { useState } from 'react';
import { Tabs, Tab, Alert, Container, Card } from 'react-bootstrap';
import FlightDataTransfer from './FlightDataTransfer';
 

const TransferDataPage = () => {
  const [key, setKey] = useState('flight');

  return (
    <Container className="mt-4">
      <h2 className="mb-4">Transfert de Données</h2>
      <Card>
        <Card.Body>
          <Tabs
            id="transfer-data-tabs"
            activeKey={key}
            onSelect={(k) => setKey(k)}
            className="mb-3"
          >
            
          </Tabs>
        </Card.Body>
      </Card>
    </Container>
  );
};

export default TransferDataPage;

 