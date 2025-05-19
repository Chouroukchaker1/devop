# scripts/data_processor.py
import os
import sys
import time
import json
from datetime import datetime

# Ajouter le chemin du projet au PYTHONPATH
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from utils.logger import setup_logger
from utils.notification import send_notification
from data_extraction import extract_fuel_data
from data_merging import merge_data_sources

logger = setup_logger('data_processor')

def process_data():
    """Fonction principale pour traiter les données"""
    start_time = time.time()
    logger.info("🚀 Début du traitement des données")
    
    try:
        # Étape 1: Extraction des données carburant
        fuel_data = extract_fuel_data()
        logger.info(f"✅ Données carburant extraites: {len(fuel_data)} enregistrements")
        
        # Étape 2: Extraction des données de vol
        flight_data = extract_flight_data()
        logger.info(f"✅ Données de vol extraites: {len(flight_data)} enregistrements")
        
        # Étape 3: Fusion des données
        merged_data = merge_data_sources(fuel_data, flight_data)
        logger.info(f"✅ Données fusionnées: {len(merged_data)} enregistrements")
        
        # Sauvegarder les résultats
        save_results(merged_data)
        
        # Envoyer une notification
        duration = time.time() - start_time
        message = f"Traitement terminé en {duration:.2f} secondes. {len(merged_data)} enregistrements mis à jour."
        send_notification("Data Processing Complete", message)
        
        return {
            "success": True,
            "message": message,
            "duration": duration,
            "records_processed": len(merged_data),
            "timestamp": datetime.now().isoformat()
        }
        
    except Exception as e:
        logger.error(f"❌ Erreur lors du traitement: {str(e)}")
        send_notification("Data Processing Failed", f"Erreur: {str(e)}")
        return {
            "success": False,
            "error": str(e),
            "timestamp": datetime.now().isoformat()
        }

def save_results(data):
    """Sauvegarder les données fusionnées"""
    output_dir = os.path.join(os.path.dirname(__file__), '..', 'output')
    os.makedirs(output_dir, exist_ok=True)
    
    output_file = os.path.join(output_dir, 'merged_data.xlsx')
    data.to_excel(output_file, index=False)
    logger.info(f"📁 Données sauvegardées dans {output_file}")

if __name__ == "__main__":
    result = process_data()
    print(json.dumps(result))