import React, { useState, useEffect } from 'react';
import { Table, Button, Spin, Alert, Tabs, Card, notification } from 'antd';
import { DownloadOutlined, SyncOutlined } from '@ant-design/icons';
import axios from 'axios';
import './ExtraData.css'; // Create this CSS file for custom styles

const { TabPane } = Tabs;

const ExtraDataPage = () => {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState({
    flight: [],
    fuel: [],
    megred: []
  });
  const [activeTab, setActiveTab] = useState('flight');
  const [error, setError] = useState(null);
  const [downloadStatus, setDownloadStatus] = useState({
    fuel: false,
    merged: false
  });

  // Fetch all data from the backend
  const fetchAllData = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await axios.get('/api/all-data');
      setData(response.data.data);
      notification.success({
        message: 'Data Loaded',
        description: 'All data has been successfully loaded from the server.'
      });
    } catch (err) {
      console.error('Error fetching data:', err);
      setError(err.response?.data?.message || 'Failed to load data');
      notification.error({
        message: 'Error',
        description: 'Failed to load data from the server.'
      });
    } finally {
      setLoading(false);
    }
  };

  // Update data by running Python scripts
  const updateData = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await axios.post('/api/update-data');
      notification.success({
        message: 'Update Started',
        description: 'Data update process has been initiated successfully.'
      });
      // Refresh data after update
      setTimeout(fetchAllData, 10000); // Wait 10 seconds before refreshing
    } catch (err) {
      console.error('Error updating data:', err);
      setError(err.response?.data?.message || 'Failed to update data');
      notification.error({
        message: 'Error',
        description: 'Failed to initiate data update process.'
      });
    } finally {
      setLoading(false);
    }
  };

  // Download Excel files
  const downloadFile = async (type) => {
    setDownloadStatus(prev => ({ ...prev, [type]: true }));
    try {
      let endpoint, filename;
      if (type === 'fuel') {
        endpoint = '/api/download/extracted-fuel-data';
        filename = 'extracted_fuel_data.xlsx';
      } else {
        endpoint = '/api/download/merged-data';
        filename = 'merged_data.xlsx';
      }

      const response = await axios.get(endpoint, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);

      notification.success({
        message: 'Download Successful',
        description: `${filename} has been downloaded successfully.`
      });
    } catch (err) {
      console.error(`Error downloading ${type} data:`, err);
      notification.error({
        message: 'Download Failed',
        description: `Failed to download ${type} data.`
      });
    } finally {
      setDownloadStatus(prev => ({ ...prev, [type]: false }));
    }
  };

  // Initial data load
  useEffect(() => {
    fetchAllData();
  }, []);

  // Column configurations for each table
  const columns = {
    flight: [
      { title: 'Flight ID', dataIndex: 'flight_id', key: 'flight_id' },
      { title: 'Departure', dataIndex: 'departure', key: 'departure' },
      { title: 'Arrival', dataIndex: 'arrival', key: 'arrival' },
      { title: 'Date', dataIndex: 'date', key: 'date' },
      { title: 'Aircraft', dataIndex: 'aircraft', key: 'aircraft' },
    ],
    fuel: [
      { title: 'Transaction ID', dataIndex: 'transaction_id', key: 'transaction_id' },
      { title: 'Date', dataIndex: 'date', key: 'date' },
      { title: 'Aircraft', dataIndex: 'aircraft', key: 'aircraft' },
      { title: 'Fuel Quantity', dataIndex: 'fuel_quantity', key: 'fuel_quantity' },
      { title: 'Fuel Type', dataIndex: 'fuel_type', key: 'fuel_type' },
    ],
    megred: [
      { title: 'Flight ID', dataIndex: 'flight_id', key: 'flight_id' },
      { title: 'Departure', dataIndex: 'departure', key: 'departure' },
      { title: 'Arrival', dataIndex: 'arrival', key: 'arrival' },
      { title: 'Date', dataIndex: 'date', key: 'date' },
      { title: 'Fuel Used', dataIndex: 'fuel_used', key: 'fuel_used' },
      { title: 'Efficiency', dataIndex: 'efficiency', key: 'efficiency' },
    ]
  };

  return (
    <div className="extra-data-container">
      <h1>Flight and Fuel Data Management</h1>
      
      <div className="action-buttons">
        <Button
          type="primary"
          icon={<SyncOutlined />}
          onClick={updateData}
          loading={loading}
          style={{ marginRight: 16 }}
        >
          Update All Data
        </Button>
        
        <Button
          type="default"
          icon={<DownloadOutlined />}
          onClick={() => downloadFile('fuel')}
          loading={downloadStatus.fuel}
          style={{ marginRight: 16 }}
        >
          Download Fuel Data
        </Button>
        
        <Button
          type="default"
          icon={<DownloadOutlined />}
          onClick={() => downloadFile('merged')}
          loading={downloadStatus.merged}
        >
          Download Merged Data
        </Button>
      </div>

      {error && (
        <Alert
          message="Error"
          description={error}
          type="error"
          showIcon
          closable
          onClose={() => setError(null)}
          style={{ marginBottom: 24 }}
        />
      )}

      <Card loading={loading} style={{ marginTop: 16 }}>
        <Tabs activeKey={activeTab} onChange={setActiveTab}>
          <TabPane tab="Flight Data" key="flight">
            <Table
              columns={columns.flight}
              dataSource={data.flight}
              rowKey="flight_id"
              scroll={{ x: true }}
              pagination={{ pageSize: 10 }}
            />
          </TabPane>
          <TabPane tab="Fuel Data" key="fuel">
            <Table
              columns={columns.fuel}
              dataSource={data.fuel}
              rowKey="transaction_id"
              scroll={{ x: true }}
              pagination={{ pageSize: 10 }}
            />
          </TabPane>
          <TabPane tab="Merged Data" key="megred">
            <Table
              columns={columns.megred}
              dataSource={data.megred}
              rowKey="flight_id"
              scroll={{ x: true }}
              pagination={{ pageSize: 10 }}
            />
          </TabPane>
        </Tabs>
      </Card>

      <div className="data-info">
        <p>Last updated: {new Date().toLocaleString()}</p>
        <p>Total records: 
          Flight: {data.flight.length} | 
          Fuel: {data.fuel.length} | 
          Merged: {data.megred.length}
        </p>
      </div>
    </div>
  );
};

export default ExtraDataPage;