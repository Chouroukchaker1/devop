import pandas as pd
import sys
import os
import time
import zipfile
import json

# Forcer l'encodage en UTF-8
sys.stdout.reconfigure(encoding='utf-8')

def is_valid_excel_file(file_path):
    """Vérifie si le fichier est un fichier Excel valide (ZIP archive)."""
    try:
        with zipfile.ZipFile(file_path, 'r') as zip_ref:
            zip_ref.testzip()  # Teste l'intégrité du fichier ZIP
        return True
    except zipfile.BadZipFile:
        return False
    except Exception as e:
        print(f"Erreur lors de la vérification de {file_path}: {str(e)}")
        return False

def normalize_date_format(date_str):
    """Convertit une date en chaîne au format JJ/MM/AAAA pour assurer une comparaison correcte."""
    try:
        if pd.isna(date_str):
            return ""
        date_str = str(date_str).strip()
        if not date_str:
            return ""
        # Formats de date possibles
        for fmt in ['%Y-%m-%d', '%d/%m/%Y', '%Y-%m-%d %H:%M:%S', '%d/%m/%Y %H:%M:%S']:
            try:
                return pd.to_datetime(date_str, format=fmt).strftime('%d/%m/%Y')
            except ValueError:
                continue
        # Si la date est un format Excel (nombre de jours depuis 1899-12-30)
        try:
            return pd.to_datetime(float(date_str), unit='D', origin='1899-12-30').strftime('%d/%m/%Y')
        except ValueError:
            pass
        print(f"Erreur de conversion de date : {date_str}")
        return date_str
    except Exception as e:
        print(f"Erreur de conversion de date : {date_str}, {e}")
        return date_str

def clean_flight_number(flight_id):
    """Extrait les chiffres d'un identifiant de vol pour la normalisation."""
    try:
        if pd.isna(flight_id):
            return ""
        return ''.join(filter(str.isdigit, str(flight_id)))
    except Exception as e:
        print(f"Erreur lors du nettoyage de Flight Number : {flight_id}, {e}")
        return str(flight_id)

def merge_fuel_and_flight_data(fuel_data_path, flight_data_path, output_file):
    try:
        # Normaliser les chemins des fichiers
        fuel_data_path = os.path.normpath(fuel_data_path)
        flight_data_path = os.path.normpath(flight_data_path)
        output_file = os.path.normpath(output_file)

        # Vérifier l'existence des fichiers
        if not os.path.exists(fuel_data_path):
            return json.dumps({
                "success": False,
                "message": f"Fichier {fuel_data_path} introuvable."
            })
        if not os.path.exists(flight_data_path):
            return json.dumps({
                "success": False,
                "message": f"Fichier {flight_data_path} introuvable."
            })

        # Vérifier la validité des fichiers Excel
        if not is_valid_excel_file(fuel_data_path):
            return json.dumps({
                "success": False,
                "message": f"Le fichier {fuel_data_path} n'est pas un fichier Excel valide."
            })
        if not is_valid_excel_file(flight_data_path):
            return json.dumps({
                "success": False,
                "message": f"Le fichier {flight_data_path} n'est pas un fichier Excel valide."
            })

        # Charger les fichiers avec un mécanisme de réessai
        max_retries = 5
        retry_delay = 2  # secondes

        fuel_df = None
        flight_df = None

        # Charger fuel_data_path
        for attempt in range(max_retries):
            try:
                fuel_df = pd.read_excel(fuel_data_path, engine='openpyxl')
                print(f"DEBUG: Fichier {fuel_data_path} lu avec succès.")
                break
            except Exception as e:
                print(f"Tentative {attempt + 1}/{max_retries} - Erreur lors de la lecture de {fuel_data_path}: {str(e)}")
                if attempt == max_retries - 1:
                    return json.dumps({
                        "success": False,
                        "message": f"Erreur lors de la lecture de {fuel_data_path} après {max_retries} tentatives : {str(e)}"
                    })
                time.sleep(retry_delay)

        # Charger flight_data_path
        for attempt in range(max_retries):
            try:
                flight_df = pd.read_excel(flight_data_path, engine='openpyxl')
                print(f"DEBUG: Fichier {flight_data_path} lu avec succès.")
                break
            except Exception as e:
                print(f"Tentative {attempt + 1}/{max_retries} - Erreur lors de la lecture de {flight_data_path}: {str(e)}")
                if attempt == max_retries - 1:
                    return json.dumps({
                        "success": False,
                        "message": f"Erreur lors de la lecture de {flight_data_path} après {max_retries} tentatives : {str(e)}"
                    })
                time.sleep(retry_delay)

        # Afficher un aperçu des données chargées
        print("Données de carburant chargées :")
        print(fuel_df.head())
        print("\nDonnées de vol chargées :")
        print(flight_df.head())

        # Standardiser les noms de colonnes dans flight_df
        flight_df.rename(columns={
            'Flight ID': 'Flight Number',
            'Date of operation (UTC)': 'Date of Flight',
            'Departure Time/ Block-off time (UTC)': 'Time of Departure',
            'Destination Airport ICAO Code': 'ArrivalAirport',
            'Departing Airport ICAO Code': 'DepartureAirport',
            'Arrival Time/ Block-on Time(UTC)': 'Arrival Time/ Block-on Time (UTC)'
        }, inplace=True)

        # Nettoyer et normaliser les données
        for df in [fuel_df, flight_df]:
            if 'Flight Number' in df.columns:
                df['Flight Number'] = df['Flight Number'].apply(clean_flight_number).astype(str)
            if 'Date of Flight' in df.columns:
                df['Date of Flight'] = df['Date of Flight'].apply(normalize_date_format)
            for col in ['Time of Departure', 'ArrivalAirport', 'DepartureAirport']:
                if col in df.columns:
                    df[col] = df[col].astype(str).fillna('')

        # Vérifier l'existence des colonnes nécessaires pour la fusion
        required_columns = ['Flight Number', 'Date of Flight']
        merge_columns = [col for col in required_columns if col in fuel_df.columns and col in flight_df.columns]

        if not merge_columns:
            return json.dumps({
                "success": False,
                "message": "Aucune colonne commune trouvée pour la fusion. Vérifiez les colonnes 'Flight Number' et 'Date of Flight'."
            })

        print(f"Colonnes utilisées pour la fusion : {merge_columns}")

        # Fusionner les données
        merged_df = pd.merge(
            flight_df,
            fuel_df,
            on=merge_columns,
            how='outer',
            suffixes=('_flight', '_fuel')
        )

        # Gérer les colonnes dupliquées
        for col in ['DepartureAirport', 'ArrivalAirport', 'Time of Departure']:
            flight_col = f"{col}_flight"
            fuel_col = f"{col}_fuel"
            if flight_col in merged_df.columns and fuel_col in merged_df.columns:
                merged_df[col] = merged_df[flight_col].combine_first(merged_df[fuel_col])
                merged_df.drop(columns=[flight_col, fuel_col], inplace=True)
            elif flight_col in merged_df.columns:
                merged_df.rename(columns={flight_col: col}, inplace=True)
            elif fuel_col in merged_df.columns:
                merged_df.rename(columns={fuel_col: col}, inplace=True)

        # Ajouter un indicateur d'intégrité des données
        merged_df['CompleteData'] = ~merged_df.isnull().any(axis=1)

        # Définir l'ordre des colonnes souhaité
        ordered_columns = [
            'Date of Flight', 'AC registration', 'Flight Number', 'ICAO Call sign', 'AC Type',
            'Flight type', 'DepartureAirport', 'ArrivalAirport', 'Time of Departure',
            'Arrival Time/ Block-on Time (UTC)', 'TaxiFuel', 'TripFuel', 'Uplift Volume (Litres)',
            'Uplift density', 'ContingencyFuel', 'AlternateFuel', 'FinalReserve',
            'Additional Fuel (tonnes)', 'Discretionary Fuel', 'Extra Fuel',
            'Fuel for other safety rules (tonnes)', 'Reason',
            'Economic tankering category in the flight plan', 'Block Off (tonnes)',
            'Block On (tonnes)', 'BlockFuel', 'Alternate Arrival Airport', 'FOB', 'CompleteData'
        ]

        # Créer la liste des colonnes finales
        final_columns = [col for col in ordered_columns if col in merged_df.columns]
        final_columns.extend([col for col in merged_df.columns if col not in ordered_columns])

        # Réorganiser les colonnes
        merged_df = merged_df[final_columns]

        # Convertir les colonnes numériques en float et arrondir
        numeric_columns = [
            'TaxiFuel', 'TripFuel', 'Uplift Volume (Litres)', 'Uplift density', 'ContingencyFuel',
            'AlternateFuel', 'FinalReserve', 'Additional Fuel (tonnes)', 'Discretionary Fuel',
            'Extra Fuel', 'Fuel for other safety rules (tonnes)', 'Block Off (tonnes)',
            'Block On (tonnes)', 'BlockFuel', 'FOB'
        ]
        for col in numeric_columns:
            if col in merged_df.columns:
                merged_df[col] = pd.to_numeric(merged_df[col], errors='coerce').round(3)

        # Supprimer les lignes où toutes les colonnes (sauf CompleteData) sont NaN
        data_columns = [col for col in merged_df.columns if col != 'CompleteData']
        merged_df = merged_df.dropna(how='all', subset=data_columns)

        # Créer le répertoire de sortie si nécessaire
        os.makedirs(os.path.dirname(output_file), exist_ok=True)

        # Sauvegarder le fichier fusionné
        merged_df.to_excel(output_file, index=False, engine='openpyxl')

        # Afficher les résultats
        print("\n✔️ Fusion terminée avec succès !")
        print(f"📁 Fichier de sortie créé : {output_file}")
        print("\n📊 Statistiques de fusion :")
        print(f"➡️ Nombre total d'enregistrements : {len(merged_df)}")
        print(f"✔️ Enregistrements complets : {merged_df['CompleteData'].sum()}")
        print(f"⚠️ Enregistrements incomplets : {len(merged_df) - merged_df['CompleteData'].sum()}")

        print("\n🔍 Aperçu des données fusionnées :")
        print(merged_df.head())

        return json.dumps({
            "success": True,
            "message": f"Fusion terminée avec succès : {output_file}",
            "stats": {
                "total_records": len(merged_df),
                "complete_records": int(merged_df['CompleteData'].sum()),
                "incomplete_records": len(merged_df) - merged_df['CompleteData'].sum()
            }
        })

    except Exception as e:
        print(f"\n❌ Erreur lors de la fusion : {str(e)}")
        return json.dumps({
            "success": False,
            "message": f"Erreur lors de la fusion : {str(e)}"
        })

if __name__ == "__main__":
    # Chemins des fichiers
    fuel_data_path = fuel_data_path = '/app/datax/data/all_fuel_data.xlsx'
    flight_data_path = '/app/sample_data/dataRaportProcessed.xlsx'
    output_file = '/app/merged_data.xlsx'

    # Exécuter la fusion
    result = merge_fuel_and_flight_data(fuel_data_path, flight_data_path, output_file)

    # Afficher le résultat
    result_dict = json.loads(result)
    print(f"\nRésultat de la fusion:")
    print(f"Statut: {result_dict['success']}")
    print(f"Message: {result_dict['message']}")
    if result_dict.get('stats'):
        print(f"Détails:")
        print(f"- Nombre total d'enregistrements: {result_dict['stats']['total_records']}")
        print(f"- Enregistrements complets: {result_dict['stats']['complete_records']}")
        print(f"- Enregistrements incomplets: {result_dict['stats']['incomplete_records']}")