import pandas as pd
import requests

API_URL = 'http://localhost:3000/api/feuldata/update-by-flight'
TOKEN = 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY3ZGZlZmU2OWIzOGVhYTVkY2NhMzI5NCIsInJvbGUiOiJhZG1pbiIsInVzZXJuYW1lIjoiYWRtaW4iLCJpYXQiOjE3NDYxMDk1NTEsImV4cCI6MTc0NjE5NTk1MX0.K7zBXSwMHEuQsFc_MlKe58Royn2287qnvdmYrN-nie8'  # Remplace par un token JWT valide
HEADERS = {
    'Content-Type': 'application/json',
    'Authorization': f'Bearer {TOKEN}'
}
INPUT_FILE = 'C:/Users/lenovo/Desktop/PFE/imported_data.csv'

# Lire le fichier CSV
df = pd.read_csv(INPUT_FILE)

# Convertir les données en JSON
data = df.to_dict(orient='records')

# Mettre à jour MongoDB via l'API
for record in data:
    response = requests.post(API_URL, headers=HEADERS, json=record)
    if response.status_code == 200:
        print(f"Données mises à jour pour flightNumber: {record['flightNumber']}")
    else:
        print(f"Erreur pour flightNumber: {record['flightNumber']}, {response.text}")

print("Mise à jour terminée.")