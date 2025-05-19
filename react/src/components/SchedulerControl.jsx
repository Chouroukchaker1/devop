import React from 'react';
import { Card, Button, Spin, Alert, Timeline } from 'antd';
import { SyncOutlined, ClockCircleOutlined } from '@ant-design/icons';

const SchedulerControl = ({ isRunning, onTriggerUpdate }) => {
  const lastRuns = [
    { time: '2023-05-01 14:00', status: 'success', description: 'Mise à jour complète' },
    { time: '2023-05-01 10:00', status: 'error', description: 'Erreur script Python' },
    { time: '2023-05-01 06:00', status: 'success', description: 'Mise à jour complète' },
  ];

  return (
    <Card title="Contrôle du Scheduler" bordered={false}>
      <div style={{ marginBottom: 20 }}>
        <Button
          type="primary"
          icon={<SyncOutlined />}
          onClick={onTriggerUpdate}
          loading={isRunning}
          disabled={isRunning}
        >
          {isRunning ? 'Traitement en cours...' : 'Déclencher la mise à jour'}
        </Button>
      </div>

      {isRunning && (
        <Spin tip="Traitement des données..." size="large">
          <Alert
            message="Opération en cours"
            description="Veuillez patienter pendant le traitement des données."
            type="info"
            showIcon
          />
        </Spin>
      )}

      <div style={{ marginTop: 20 }}>
        <h3>Historique des exécutions</h3>
        <Timeline>
          {lastRuns.map((run, index) => (
            <Timeline.Item
              key={index}
              color={run.status === 'success' ? 'green' : 'red'}
              dot={run.status === 'success' ? null : <ClockCircleOutlined />}
            >
              <p>{run.time}</p>
              <p>{run.description}</p>
            </Timeline.Item>
          ))}
        </Timeline>
      </div>
    </Card>
  );
};

export default SchedulerControl;