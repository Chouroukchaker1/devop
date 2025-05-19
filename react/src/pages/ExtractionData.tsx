import React, { useState, useEffect } from "react";
import axios from "axios";
import * as XLSX from "xlsx";

interface FlightData {
  [key: string]: any;
}

interface Stats {
  total_records: number;
  complete_records: number;
  incomplete_records: number;
}

interface PythonScriptResult {
  success: boolean;
  data?: any;
  message?: string;
}

interface ApiResponse {
  success: boolean;
  data: {
    script1: PythonScriptResult;
    script2: PythonScriptResult;
    script3: PythonScriptResult;
  };
  error?: string;
}

const ExtractionData: React.FC = () => {
  const [data, setData] = useState<FlightData[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>("");
  const [stats, setStats] = useState<Stats | null>(null);
  const [columns, setColumns] = useState<string[]>([]);

  const fetchFuelData = async () => {
    setLoading(true);
    setError("");
    setData([]);
    setStats(null);
    setColumns([]);

    try {
      const response = await axios.post<ApiResponse>("http://localhost:3000/api/run-python");

      if (response.data.success) {
        // Le script3 contient les données fusionnées dans son message
        const mergedData = response.data.data.script3;
        
        if (mergedData.success) {
          // Essayons d'extraire les données du message
          const message = mergedData.message || "";
          
          // Vérifions si le message contient des données structurées
          if (message.includes("Aperçu des données fusionnées")) {
            // Essayons d'extraire les données du message
            const dataStart = message.indexOf("Aperçu des données fusionnées");
            const dataSection = message.substring(dataStart);
            
            // Créons un tableau temporaire pour stocker les données
            const tempData: FlightData[] = [];
            
            // Extraction simplifiée (vous devrez peut-être adapter cela)
            const lines = dataSection.split('\n').filter(line => line.trim() !== '');
            
            // Supposons que la première ligne après "Aperçu" est l'en-tête
            const headerLine = lines.find(line => line.includes("[")) || "";
            const dataLines = lines.filter(line => line.includes("0") || line.includes("1") || line.includes("2"));
            
            // Si nous avons des données, mettons à jour l'état
            if (dataLines.length > 0) {
              // Pour cet exemple, nous allons simplement afficher le message brut
              // Dans une application réelle, vous devriez parser correctement les données
              setData([{ rawData: message }]);
              setColumns(["rawData"]);
              
              setStats({
                total_records: dataLines.length,
                complete_records: 0, // À adapter selon vos données
                incomplete_records: dataLines.length
              });
            } else {
              setError("Aucune donnée structurée trouvée dans la réponse");
            }
          } else {
            // Si nous ne pouvons pas extraire de données, affichons le message brut
            setData([{ message: mergedData.message }]);
            setColumns(["message"]);
            
            setStats({
              total_records: 1,
              complete_records: 0,
              incomplete_records: 1
            });
          }
        } else {
          setError(mergedData.message || "Le script de fusion a échoué");
        }
      } else {
        setError(response.data.error || "Erreur lors de l'exécution des scripts");
      }
    } catch (err) {
      let errorMessage = "Erreur de connexion au serveur";
      if (axios.isAxiosError(err)) {
        errorMessage = `Erreur ${err.response?.status || ''}: ${err.message}`;
        if (err.response?.data?.error) {
          errorMessage += ` - ${err.response.data.error}`;
        }
      }
      setError(errorMessage);
      console.error("Erreur détaillée:", err);
    } finally {
      setLoading(false);
    }
  };

  const exportToExcel = () => {
    if (data.length === 0) {
      alert("Aucune donnée à exporter");
      return;
    }

    try {
      const ws = XLSX.utils.json_to_sheet(data);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Données fusionnées");
      XLSX.writeFile(wb, "donnees_fusionnees.xlsx");
    } catch (err) {
      setError("Erreur lors de l'exportation Excel");
      console.error(err);
    }
  };

  return (
    <div style={{ 
      padding: "20px", 
      maxWidth: "1200px", 
      margin: "0 auto",
      fontFamily: "Arial, sans-serif"
    }}>
      <h1 style={{ color: "#333", marginBottom: "20px" }}>Extraction des Données de Carburant et Vol</h1>
      
      <div style={{ marginBottom: "30px" }}>
        <button 
          onClick={fetchFuelData} 
          disabled={loading}
          style={{ 
            padding: "10px 20px",
            backgroundColor: loading ? "#6c757d" : "#007bff",
            color: "white",
            border: "none",
            borderRadius: "4px",
            cursor: "pointer",
            fontSize: "16px",
            fontWeight: "bold",
            transition: "background-color 0.3s"
          }}
        >
          {loading ? (
            <>
              <span style={{ 
                marginRight: "8px",
                display: "inline-block",
                width: "1rem",
                height: "1rem",
                verticalAlign: "text-bottom",
                border: "0.2em solid currentColor",
                borderRightColor: "transparent",
                borderRadius: "50%",
                animation: "spinner-border 0.75s linear infinite"
              }}></span>
              Traitement en cours...
            </>
          ) : "Exécuter la fusion des données"}
        </button>

        {data.length > 0 && (
          <button 
            onClick={exportToExcel}
            style={{
              padding: "10px 20px",
              backgroundColor: "#28a745",
              color: "white",
              border: "none",
              borderRadius: "4px",
              cursor: "pointer",
              marginLeft: "10px",
              fontSize: "16px",
              fontWeight: "bold"
            }}
          >
            Exporter en Excel
          </button>
        )}
      </div>

      {error && (
        <div style={{
          padding: "15px",
          marginBottom: "20px",
          border: "1px solid #f5c6cb",
          borderRadius: "4px",
          color: "#721c24",
          backgroundColor: "#f8d7da"
        }}>
          {error}
        </div>
      )}

      {stats && (
        <div style={{ 
          margin: "20px 0",
          padding: "15px",
          backgroundColor: "#f8f9fa",
          borderRadius: "4px",
          border: "1px solid #dee2e6"
        }}>
          <h3 style={{ marginTop: "0", color: "#495057" }}>Statistiques de fusion</h3>
          <div style={{ display: "flex", gap: "20px", flexWrap: "wrap" }}>
            <div>
              <p style={{ fontWeight: "bold", marginBottom: "5px" }}>Total des enregistrements</p>
              <p style={{ fontSize: "24px", margin: "0", color: "#007bff" }}>{stats.total_records}</p>
            </div>
            <div>
              <p style={{ fontWeight: "bold", marginBottom: "5px" }}>Enregistrements complets</p>
              <p style={{ fontSize: "24px", margin: "0", color: "#28a745" }}>{stats.complete_records}</p>
            </div>
            <div>
              <p style={{ fontWeight: "bold", marginBottom: "5px" }}>Enregistrements incomplets</p>
              <p style={{ fontSize: "24px", margin: "0", color: "#dc3545" }}>
                {stats.incomplete_records}
              </p>
            </div>
          </div>
        </div>
      )}

      {data.length > 0 ? (
        <div style={{ 
          marginTop: "20px",
          boxShadow: "0 0 10px rgba(0,0,0,0.1)",
          borderRadius: "4px",
          overflow: "hidden"
        }}>
          <div style={{ 
            display: "flex", 
            justifyContent: "space-between", 
            alignItems: "center",
            padding: "15px",
            backgroundColor: "#343a40",
            color: "white"
          }}>
            <h2 style={{ margin: "0", fontSize: "20px" }}>Résultats des données fusionnées</h2>
            <small>{data.length} enregistrements trouvés</small>
          </div>

          <div style={{ 
            padding: "20px",
            backgroundColor: "#fff",
            maxHeight: "500px",
            overflow: "auto"
          }}>
            {columns.includes("rawData") ? (
              <pre style={{ 
                whiteSpace: "pre-wrap",
                wordWrap: "break-word",
                fontFamily: "monospace",
                fontSize: "14px"
              }}>
                {data[0].rawData}
              </pre>
            ) : columns.includes("message") ? (
              <pre style={{ 
                whiteSpace: "pre-wrap",
                wordWrap: "break-word",
                fontFamily: "monospace",
                fontSize: "14px"
              }}>
                {data[0].message}
              </pre>
            ) : (
              <div style={{ overflowX: "auto" }}>
                <table style={{ 
                  width: "100%", 
                  borderCollapse: "collapse",
                  fontSize: "14px"
                }}>
                  <thead>
                    <tr style={{ backgroundColor: "#e9ecef", position: "sticky", top: 0 }}>
                      {columns.map((key) => (
                        <th 
                          key={key} 
                          style={{ 
                            padding: "12px 15px", 
                            textAlign: "left",
                            borderBottom: "2px solid #dee2e6",
                            fontWeight: "bold",
                            color: "#495057"
                          }}
                        >
                          {key}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {data.map((flight, index) => (
                      <tr 
                        key={index} 
                        style={{ 
                          backgroundColor: index % 2 === 0 ? "#fff" : "#f8f9fa",
                          borderBottom: "1px solid #dee2e6"
                        }}
                      >
                        {columns.map((key) => (
                          <td 
                            key={`${index}-${key}`} 
                            style={{ 
                              padding: "12px 15px",
                              color: "#212529",
                              whiteSpace: "nowrap"
                            }}
                          >
                            {flight[key] !== null && flight[key] !== undefined 
                              ? flight[key].toString() 
                              : <span style={{ color: "#6c757d" }}>N/A</span>}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      ) : (
        !loading && !error && (
          <div style={{ 
            padding: "20px",
            textAlign: "center",
            color: "#6c757d",
            backgroundColor: "#f8f9fa",
            borderRadius: "4px",
            border: "1px dashed #adb5bd",
            marginTop: "20px"
          }}>
            <p style={{ fontSize: "18px", marginBottom: "10px" }}>Aucune donnée à afficher</p>
            <p>Cliquez sur "Exécuter la fusion des données" pour commencer</p>
          </div>
        )
      )}
    </div>
  );
};

export default ExtractionData;