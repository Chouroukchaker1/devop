import React from 'react';

const DownloadFiles = () => {
  const downloadFile = async (fileName) => {
    try {
      const response = await fetch(`http://localhost:3000/api/download/${fileName}`);
      
      if (!response.ok) {
        throw new Error('Erreur lors du téléchargement du fichier');
      }
      
      // Crée un lien de téléchargement pour le fichier
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;  // Nom du fichier téléchargé
      document.body.appendChild(a);
      a.click();
      a.remove();
    } catch (error) {
      console.error("❌ Erreur lors du téléchargement :", error.message);
    }
  };

  return (
    <div>
     
      <div>
        <button onClick={() => downloadFile('all_fuel_data')}>Télécharger all_fuel_data.xlsx</button>
        <button onClick={() => downloadFile('merged-data')}>Télécharger merged_data.xlsx</button>
        <button onClick={() => downloadFile('data-rapport-processed')}>Télécharger dataRaportProcessed.xlsx</button>
      </div>
       
    </div>
  );
};

export default DownloadFiles;
