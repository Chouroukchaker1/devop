# missing_data_checker.py
import pandas as pd
import json
from pathlib import Path

def check_missing_data():
    files = {
        'fuel_data': 'C:/Users/lenovo/Desktop/PFE/datax/data/all_fuel_data.xlsx',
        'flight_data': 'C:/Users/lenovo/Desktop/PFE/sample_data/dataRaportProcessed.xlsx',
        'merged_data': 'C:/Users/lenovo/Desktop/PFE/megred_data.xlsx'
    }
    
    missing_info = {}
    
    for name, file_path in files.items():
        try:
            df = pd.read_excel(file_path)
            missing = {}
            
            # Vérifier les colonnes clés
            required_columns = {
                'fuel_data': ['Date of Flight', 'Flight Number', 'DepartureAirport', 'ArrivalAirport', 'BlockFuel'],
                'flight_data': ['Flight ID', 'Date of operation (UTC)', 'Departure Time/ Block-off time (UTC)'],
                'merged_data': ['Date of Flight', 'Flight Number', 'DepartureAirport', 'ArrivalAirport']
            }
            
            # Vérifier les valeurs manquantes par colonne
            for col in required_columns.get(name, []):
                if col in df.columns:
                    null_rows = df[df[col].isna()].index.tolist()
                    if null_rows:
                        missing[col] = {
                            'count': len(null_rows),
                            'rows': null_rows[:10],  # Limiter à 10 exemples
                            'total_rows': len(df)
                        }
            
            # Vérifier les lignes complètement vides
            empty_rows = df[df.isnull().all(axis=1)].index.tolist()
            if empty_rows:
                missing['empty_rows'] = {
                    'count': len(empty_rows),
                    'rows': empty_rows[:10]
                }
                
            if missing:
                missing_info[name] = missing
                
        except Exception as e:
            missing_info[name] = {'error': str(e)}
    
    return missing_info

def generate_missing_report():
    missing_data = check_missing_data()
    
    if not missing_data:
        return {
            'success': True,
            'message': 'Aucune donnée manquante détectée',
            'details': {}
        }
    
    return {
        'success': False,
        'message': 'Données manquantes détectées',
        'details': missing_data
    }

if __name__ == "__main__":
    report = generate_missing_report()
    print(json.dumps(report, indent=4, ensure_ascii=False))