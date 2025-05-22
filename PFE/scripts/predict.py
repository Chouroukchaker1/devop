import pandas as pd
import numpy as np
import os
import sys
import joblib
import json
import warnings
from openpyxl import load_workbook

warnings.filterwarnings("ignore", category=UserWarning, module="openpyxl.styles.stylesheet")

# === Paths
FUEL_DATA_PATH = '/app/datax/data/all_fuel_data.xlsx'
AIRPORT_DATA_PATH = '/app/sample_data/Airports.xlsx'
OUTPUT_PATH = '/app/sample_data'
FUEL_MODEL_PATH = os.path.join(OUTPUT_PATH, 'fuel_model.pkl')
CO2_MODEL_PATH = os.path.join(OUTPUT_PATH, 'co2_model.pkl')

def log(message):
    print(message, file=sys.stderr)

# === Vérification des fichiers requis
for path in [FUEL_DATA_PATH, AIRPORT_DATA_PATH, FUEL_MODEL_PATH, CO2_MODEL_PATH]:
    if not os.path.exists(path):
        log(f"❌ Fichier introuvable : {path}")
        print(json.dumps({"success": False, "message": f"File not found: {path}"}))
        sys.exit(1)

# === Lecture des données carburant
try:
    fuel_df = pd.read_excel(FUEL_DATA_PATH)
except Exception as e:
    log(f"❌ Erreur chargement fuel data: {e}")
    print(json.dumps({"success": False, "message": str(e)}))
    sys.exit(1)

# === Lecture des données aéroports avec gestion des erreurs
try:
    airport_df = pd.read_excel(AIRPORT_DATA_PATH, engine='openpyxl')
except Exception as e:
    log(f"⚠️ Erreur lecture airport data: {e}")
    airport_df = pd.DataFrame()

# === Prétraitement des données carburant
try:
    fuel_df['Air Distance (NM)'] = pd.to_numeric(fuel_df['Air Distance (NM)'], errors='coerce').fillna(fuel_df['Air Distance (NM)'].median())
    fuel_df['TripFuel'] = pd.to_numeric(fuel_df['TripFuel'], errors='coerce').fillna(fuel_df['TripFuel'].median())
    fuel_df['Carbon Emission (kg)'] = pd.to_numeric(fuel_df['Carbon Emission (kg)'], errors='coerce').fillna(fuel_df['Carbon Emission (kg)'].median())
    fuel_df['Route'] = fuel_df['DepartureAirport'] + ' -> ' + fuel_df['ArrivalAirport']
except Exception as e:
    log(f"❌ Erreur preprocessing fuel data: {e}")
    print(json.dumps({"success": False, "message": str(e)}))
    sys.exit(1)

# === Mapping des aéroports
airport_mapping_available = False
airport_mapping = {'Airport Name': {}, 'CityName': {}, 'Airport Country': {}}

if not airport_df.empty:
    try:
        required_columns = ['Airport Code', 'Airport Name', 'CityName', 'Airport Country']
        if not all(col in airport_df.columns for col in required_columns):
            missing = [col for col in required_columns if col not in airport_df.columns]
            log(f"❌ Colonnes manquantes dans airport.xlsx : {missing}")
            print(json.dumps({"success": False, "message": f"Missing columns: {missing}"}))
            sys.exit(1)
        airport_df = airport_df[required_columns].dropna(subset=['Airport Code'])
        airport_mapping = airport_df.set_index('Airport Code')[['Airport Name', 'CityName', 'Airport Country']].to_dict()
        airport_mapping_available = True
        log("✅ Mapping des aéroports créé avec succès")
    except Exception as e:
        log(f"❌ Erreur mapping aéroports: {e}")
        print(json.dumps({"success": False, "message": str(e)}))
        sys.exit(1)
else:
    log("⚠️ Données aéroports vides ou corrompues. Les pays seront manquants.")

# === Chargement des modèles
try:
    fuel_model = joblib.load(FUEL_MODEL_PATH)
    co2_model = joblib.load(CO2_MODEL_PATH)
except Exception as e:
    log(f"❌ Erreur chargement modèles : {e}")
    print(json.dumps({"success": False, "message": str(e)}))
    sys.exit(1)

# === Prédictions
try:
    X = fuel_df[['Air Distance (NM)']]
    y_fuel = fuel_df['TripFuel']
    y_co2 = fuel_df['Carbon Emission (kg)']
    y_fuel_pred = fuel_model.predict(X).flatten()
    y_co2_pred = co2_model.predict(X).flatten()
except Exception as e:
    log(f"❌ Erreur prédiction : {e}")
    print(json.dumps({"success": False, "message": str(e)}))
    sys.exit(1)

# === Construction du DataFrame résultat
try:
    results_df = pd.DataFrame({
        'Route': fuel_df['Route'],
        'Departure Airport': fuel_df['DepartureAirport'],
        'Arrival Airport': fuel_df['ArrivalAirport'],
        'Air Distance (NM)': fuel_df['Air Distance (NM)'],
        'Actual Fuel (tonnes)': y_fuel,
        'Predicted Fuel (tonnes)': y_fuel_pred,
        'Fuel Error (tonnes)': np.abs(y_fuel - y_fuel_pred),
        'Actual CO2 (kg)': y_co2,
        'Predicted CO2 (kg)': y_co2_pred,
        'CO2 Error (kg)': np.abs(y_co2 - y_co2_pred)
    })

    if airport_mapping_available:
        results_df['Departure Airport Name'] = results_df['Departure Airport'].map(airport_mapping['Airport Name']).fillna('Unknown')
        results_df['Arrival Airport Name'] = results_df['Arrival Airport'].map(airport_mapping['Airport Name']).fillna('Unknown')
        results_df['Departure Country'] = results_df['Departure Airport'].map(airport_mapping['Airport Country']).fillna('Unknown')
        results_df['Arrival Country'] = results_df['Arrival Airport'].map(airport_mapping['Airport Country']).fillna('Unknown')
        log("✅ Pays et noms d’aéroports ajoutés")
except Exception as e:
    log(f"❌ Erreur création DataFrame final : {e}")
    print(json.dumps({"success": False, "message": str(e)}))
    sys.exit(1)

# === Export CSV
try:
    results_df.to_csv(os.path.join(OUTPUT_PATH, 'fuel_co2_predictions_with_routes.csv'), index=False)
    log("✅ Résultats exportés avec succès")
except Exception as e:
    log(f"❌ Erreur export CSV : {e}")
    print(json.dumps({"success": False, "message": str(e)}))
    sys.exit(1)

# === Génération sortie JSON
try:
    # Colonnes forcées pour éviter les erreurs si le mapping échoue
    for col in ['Departure Country', 'Arrival Country', 'Departure Airport Name', 'Arrival Airport Name']:
        if col not in results_df.columns:
            results_df[col] = 'Unknown'

    columns_to_keep = [
        'Route', 'Departure Airport', 'Departure Airport Name', 'Departure Country',
        'Arrival Airport', 'Arrival Airport Name', 'Arrival Country',
        'Air Distance (NM)',
        'Actual Fuel (tonnes)', 'Predicted Fuel (tonnes)', 'Fuel Error (tonnes)',
        'Actual CO2 (kg)', 'Predicted CO2 (kg)', 'CO2 Error (kg)'
    ]
    results_df = results_df[columns_to_keep]

    predicted_fuel = round(results_df['Predicted Fuel (tonnes)'].mean(), 2)
    predicted_co2 = round(results_df['Predicted CO2 (kg)'].mean(), 2)
    table_data = results_df.replace({np.nan: None}).to_dict(orient="records")

    print(json.dumps({
        "success": True,
        "predicted_fuel": predicted_fuel,
        "predicted_co2": predicted_co2,
        "table": table_data
    }))
except Exception as e:
    log(f"❌ Erreur génération JSON : {e}")
    print(json.dumps({"success": False, "message": str(e)}))
    sys.exit(1)
