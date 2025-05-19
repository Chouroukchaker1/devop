import React from 'react';

const PowerBIDashboard = () => {
  return (
    <div style={{ height: '100vh', width: '100%' }}>
      <iframe
        title="Power BI Dashboard"
        width="100%"
        height="100%"
        src="https://app.powerbi.com/reportEmbed?reportId=79dc72d7-5e4c-4bbe-95a9-3e8f11d9f9c0&autoAuth=true&ctid=b7bd4715-4217-48c7-919e-2ea97f592fa7"
        frameBorder="0"
        allowFullScreen={true}
      ></iframe>
    </div>
  );
};

export default PowerBIDashboard;
