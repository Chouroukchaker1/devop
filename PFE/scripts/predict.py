import pandas as pd
import numpy as np
import os
import sys
import joblib
import json
import warnings
from openpyxl import load_workbook

# Suppress openpyxl style warnings
warnings.filterwarnings("ignore", category=UserWarning, module="openpyxl.styles.stylesheet")

# Define file paths
FUEL_DATA_PATH = r'C:\Users\lenovo\Desktop\PFE\datax\data\all_fuel_data.xlsx'
AIRPORT_DATA_PATH = r'C:\Users\lenovo\Desktop\PFE\sample_data\Airports.xlsx'
OUTPUT_PATH = r'C:\Users\lenovo\Desktop\PFE\sample_data'
FUEL_MODEL_PATH = os.path.join(OUTPUT_PATH, 'fuel_model.pkl')
CO2_MODEL_PATH = os.path.join(OUTPUT_PATH, 'co2_model.pkl')

# Function to log to stderr
def log(message):
    print(message, file=sys.stderr)

# Check if files exist
for path in [FUEL_DATA_PATH, AIRPORT_DATA_PATH, FUEL_MODEL_PATH, CO2_MODEL_PATH]:
    if not os.path.exists(path):
        log(f"Error: File not found: {path}")
        print(json.dumps({"success": False, "message": f"File not found: {path}"}))
        sys.exit(1)

# Load data
try:
    fuel_df = pd.read_excel(FUEL_DATA_PATH)
except Exception as e:
    log(f"Error loading fuel data: {e}")
    print(json.dumps({"success": False, "message": f"Error loading fuel data: {str(e)}"}))
    sys.exit(1)

try:
    airport_df = pd.read_excel(AIRPORT_DATA_PATH)
except Exception as e:
    log(f"Error loading airport data: {e}")
    airport_df = pd.DataFrame()

# Preprocess fuel data
try:
    fuel_df['Air Distance (NM)'] = pd.to_numeric(fuel_df['Air Distance (NM)'], errors='coerce').fillna(fuel_df['Air Distance (NM)'].median())
    fuel_df['TripFuel'] = pd.to_numeric(fuel_df['TripFuel'], errors='coerce').fillna(fuel_df['TripFuel'].median())
    fuel_df['Carbon Emission (kg)'] = pd.to_numeric(fuel_df['Carbon Emission (kg)'], errors='coerce').fillna(fuel_df['Carbon Emission (kg)'].median())
    fuel_df['Route'] = fuel_df['DepartureAirport'] + ' -> ' + fuel_df['ArrivalAirport']
except Exception as e:
    log(f"Error preprocessing fuel data: {e}")
    print(json.dumps({"success": False, "message": f"Error preprocessing fuel data: {str(e)}"}))
    sys.exit(1)

# Preprocess airport data
airport_mapping_available = False
airport_mapping = {'Airport Name': {}, 'CityName': {}, 'Airport Country': {}}
if not airport_df.empty:
    try:
        required_columns = ['Airport Code', 'Airport Name', 'CityName', 'Airport Country']
        if not all(col in airport_df.columns for col in required_columns):
            missing_cols = [col for col in required_columns if col not in airport_df.columns]
            log(f"Error: Missing columns in airport data: {missing_cols}")
            print(json.dumps({"success": False, "message": f"Missing columns in airport data: {missing_cols}"}))
            sys.exit(1)
        airport_df = airport_df[required_columns].dropna(subset=['Airport Code'])
        airport_mapping = airport_df.set_index('Airport Code')[['Airport Name', 'CityName', 'Airport Country']].to_dict()
        airport_mapping_available = True
        log("Airport mapping successfully created")
    except Exception as e:
        log(f"Error processing airport data: {e}")
        print(json.dumps({"success": False, "message": f"Error processing airport data: {str(e)}"}))
        sys.exit(1)
else:
    log("Warning: Airport data is empty. Routes will lack airport name and country information.")

# Load models
try:
    fuel_model = joblib.load(FUEL_MODEL_PATH)
    co2_model = joblib.load(CO2_MODEL_PATH)
except Exception as e:
    log(f"Error loading models: {e}")
    print(json.dumps({"success": False, "message": f"Error loading models: {str(e)}"}))
    sys.exit(1)

# Prepare features
features = ['Air Distance (NM)']
X = fuel_df[features]
y_fuel = fuel_df['TripFuel']
y_co2 = fuel_df['Carbon Emission (kg)']

# Make predictions
try:
    y_fuel_pred = fuel_model.predict(X).flatten()
    y_co2_pred = co2_model.predict(X).flatten()
except Exception as e:
    log(f"Error making predictions: {e}")
    print(json.dumps({"success": False, "message": f"Error making predictions: {str(e)}"}))
    sys.exit(1)

# Create results DataFrame
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
except Exception as e:
    log(f"Error creating results DataFrame: {e}")
    print(json.dumps({"success": False, "message": f"Error creating results DataFrame: {str(e)}"}))
    sys.exit(1)

# Save results to CSV
try:
    results_df.to_csv(os.path.join(OUTPUT_PATH, 'fuel_co2_predictions_with_routes.csv'), index=False)
    log(f"Results saved to '{os.path.join(OUTPUT_PATH, 'fuel_co2_predictions_with_routes.csv')}'")
except Exception as e:
    log(f"Error saving results: {e}")
    print(json.dumps({"success": False, "message": f"Error saving results: {str(e)}"}))
    sys.exit(1)

# Generate output
try:
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
    log(f"Error generating output: {e}")
    print(json.dumps({"success": False, "message": f"Error generating output: {str(e)}"}))
    sys.exit(1)