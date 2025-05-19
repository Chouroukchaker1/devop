# scripts/utils/logger.py
import logging
import os
from datetime import datetime

def setup_logger(name):
    """Configurer un logger avec écriture dans un fichier"""
    logs_dir = os.path.join(os.path.dirname(__file__), '..', 'logs')
    os.makedirs(logs_dir, exist_ok=True)
    
    log_file = os.path.join(logs_dir, f'{name}_{datetime.now().strftime("%Y%m%d")}.log')
    
    logger = logging.getLogger(name)
    logger.setLevel(logging.INFO)
    
    # Formatter
    formatter = logging.Formatter(
        '%(asctime)s - %(name)s - %(levelname)s - %(message)s'
    )
    
    # Handler fichier
    file_handler = logging.FileHandler(log_file)
    file_handler.setFormatter(formatter)
    
    # Handler console
    console_handler = logging.StreamHandler()
    console_handler.setFormatter(formatter)
    
    logger.addHandler(file_handler)
    logger.addHandler(console_handler)
    
    return logger