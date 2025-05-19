import pyautogui
import time
import os
import logging
import json
import sys

# Configure logging
logging.basicConfig(
    filename='C:/Users/lenovo/Desktop/PFE/refresh_pbix.log',
    level=logging.INFO,
    format='%(asctime)s - %(message)s'
)

def export_png(pbix_path, output_png_path, retries=2):
    attempt = 1
    while attempt <= retries:
        try:
            logging.info(f"Attempt {attempt}: Opening {pbix_path}")
            if not os.path.exists(pbix_path):
                raise FileNotFoundError(f"PBIX file not found: {pbix_path}")
            
            os.startfile(pbix_path)
            time.sleep(30)  # Increased wait for Power BI Desktop to open
            
            logging.info("Refreshing data")
            pyautogui.hotkey('alt', 'h', 'r')  # Refresh
            time.sleep(120)  # Increased wait for refresh to complete
            
            logging.info("Exporting to PNG")
            pyautogui.hotkey('alt', 'f', 'e', 'p')  # File > Export > PNG
            time.sleep(5)
            
            # Ensure the output directory exists
            os.makedirs(os.path.dirname(output_png_path), exist_ok=True)
            
            logging.info(f"Saving PNG to {output_png_path}")
            pyautogui.write(output_png_path)
            pyautogui.press('enter')
            time.sleep(10)
            
            logging.info("Saving PBIX")
            pyautogui.hotkey('ctrl', 's')
            time.sleep(5)
            
            logging.info("Closing Power BI")
            pyautogui.hotkey('alt', 'f4')
            logging.info(f"Successfully exported PNG for {pbix_path}")
            return True
        except Exception as e:
            logging.error(f"Attempt {attempt} failed for {pbix_path}: {str(e)}")
            attempt += 1
            if attempt > retries:
                logging.error(f"Failed to export PNG for {pbix_path}: {str(e)}")
                return False, str(e)
            time.sleep(10)  # Wait before retrying
    return False, "Unknown error"

if __name__ == "__main__":
    try:
        reports_dir = r"C:\Users\lenovo\Desktop\PFE\reports"
        pbix_files = [
            (r"flight_report.pbix", r"flight_report.png"),
            (r"fuel_report.pbix", r"fuel_report.png"),
        ]
        
        results = {}
        for pbix, png in pbix_files:
            pbix_path = os.path.join(reports_dir, pbix)
            png_path = os.path.join(reports_dir, png)
            
            if not os.path.exists(pbix_path):
                logging.error(f"PBIX file not found: {pbix_path}")
                results[pbix] = {"success": False, "message": f"PBIX file not found: {pbix_path}"}
                continue
                
            success, error_message = export_png(pbix_path, png_path)
            results[pbix] = {
                "success": success,
                "output_path": png_path if success else None,
                "error": error_message if not success else None
            }
        
        print(json.dumps({"success": True, "results": results}, indent=2))
    except Exception as e:
        logging.error(f"Script failed: {str(e)}")
        print(json.dumps({"success": False, "error": str(e)}))
        sys.exit(1)