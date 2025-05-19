import pandas as pd
import re
import os

def find_header_row(file_path, expected_columns):
    """
    Cherche dynamiquement la ligne où se trouve le header avec les colonnes attendues.
    """
    for skip in range(10):  # on regarde les 10 premières lignes
        try:
            df = pd.read_excel(file_path, skiprows=skip, nrows=1)
            # Vérifie si toutes les colonnes attendues sont présentes
            if all(col in df.columns for col in expected_columns):
                print(f"Header trouvé à la ligne {skip+1}")
                return skip
        except Exception as e:
            continue
    
    print("Erreur : Impossible de trouver toutes les colonnes attendues dans les 10 premières lignes.")
    return None

def process_flight_data(file_path, output_file):
    file_path = os.path.normpath(file_path)
    output_file = os.path.normpath(output_file)

    if not os.path.exists(file_path):
        print(f"Erreur : Le fichier {file_path} n'existe pas.")
        return {"success": False, "message": f"Le fichier {file_path} n'existe pas."}

    try:
        # Colonnes requises pour identifier le header
        required_columns = [
            'Flight ID',
            'Date of operation (UTC)',
            'Departure Time/ Block-off time (UTC)'  # Note: correspond au nom dans le fichier
        ]
        
        header_row = find_header_row(file_path, required_columns)
        if header_row is None:
            return {"success": False, "message": "Les colonnes requises n'ont pas été trouvées."}

        df = pd.read_excel(file_path, skiprows=header_row)

        print("Colonnes chargées :", list(df.columns))

        # Suppression de la colonne 'Cie' si elle existe
        if 'Cie' in df.columns:
            df = df.drop(columns=['Cie'])
            print("Colonne 'Cie' supprimée")

        # Vérification des colonnes nécessaires
        aircraft_column = 'AC registration'
        
        for col in required_columns:
            if col not in df.columns:
                print(f"Erreur : La colonne '{col}' est manquante.")
                return {"success": False, "message": f"La colonne '{col}' est manquante."}

        if aircraft_column not in df.columns:
            print(f"Attention : La colonne '{aircraft_column}' est manquante.")
            aircraft_column = None

        def filter_numbers_only(flight_id):
            try:
                return ''.join(re.findall(r'\d+', str(flight_id)))
            except Exception as e:
                print(f"Erreur sur Flight ID {flight_id}: {e}")
                return None

        # Formater la colonne Date of operation (UTC) en JJ/MM/AAAA
        df['Date of operation (UTC)'] = pd.to_datetime(df['Date of operation (UTC)'], errors='coerce').dt.strftime('%d/%m/%Y')

        df['Flight ID'] = df['Flight ID'].apply(filter_numbers_only)

        df_cleaned = df.dropna(how='all', subset=required_columns)

        duplicate_columns = ['Flight ID', 'Date of operation (UTC)']
        if aircraft_column:
            duplicate_columns.append(aircraft_column)

        original_count = len(df_cleaned)
        df_cleaned = df_cleaned.drop_duplicates(subset=duplicate_columns, keep='first')
        duplicate_count = original_count - len(df_cleaned)

        os.makedirs(os.path.dirname(output_file), exist_ok=True)

        df_cleaned.to_excel(output_file, index=False)

        print(f"Fichier traité avec succès : {output_file}")
        return {
            "success": True, 
            "message": f"Succès. Doublons enlevés : {duplicate_count}.",
            "data": {
                "original_count": original_count,
                "cleaned_count": len(df_cleaned),
                "duplicates_removed": duplicate_count
            }
        }

    except Exception as e:
        print(f"Erreur pendant le traitement : {str(e)}")
        return {"success": False, "message": f"Erreur : {str(e)}"}

# --- Lancement ---
if __name__ == "__main__":
    input_file = 'C:/Users/lenovo/Desktop/PFE/sample_data/dataRaport.xlsx'
    output_file = 'C:/Users/lenovo/Desktop/PFE/sample_data/dataRaportProcessed.xlsx'

    result = process_flight_data(input_file, output_file)

    print(f"\nRésultat du traitement:")
    print(f"Statut: {result['success']}")
    print(f"Message: {result['message']}")
    if result.get('data'):
        print(f"Détails:")
        print(f"- Nombre initial de vols: {result['data'].get('original_count')}")
        print(f"- Nombre après nettoyage: {result['data'].get('cleaned_count')}")
        print(f"- Doublons supprimés: {result['data'].get('duplicates_removed')}")