const fs = require('fs');
const path = require('path');
const XLSX = require('xlsx');
const { parse } = require('json2csv');
const axios = require('axios');
const schedule = require('node-schedule');
const puppeteer = require('puppeteer');
const { exec } = require('child_process');
const winston = require('winston');

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({ filename: 'combined.log' }),
  ],
});

let browserInstance = null;
async function getBrowser() {
  if (!browserInstance) {
    browserInstance = await puppeteer.launch({ 
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    logger.info('Puppeteer browser instance created');
  }
  return browserInstance;
}

class PowerBIExportService {
  constructor() {
    this.dataDirectory = process.env.DATA_DIR || path.join(__dirname, 'powerbi-data');
    this.reportsDirectory = path.join(__dirname, 'reports');

    if (!fs.existsSync(this.dataDirectory)) {
      fs.mkdirSync(this.dataDirectory, { recursive: true });
      logger.info('Created powerbi-data directory');
    }
    if (!fs.existsSync(this.reportsDirectory)) {
      fs.mkdirSync(this.reportsDirectory, { recursive: true });
      logger.info('Created reports directory');
    }

    this.scheduleDataUpdates();
  }

  scheduleDataUpdates() {
    schedule.scheduleJob('*/30 * * * *', async () => {
      logger.info('Scheduled data update for Power BI...');
      try {
        await this.updateAllDataSources();
        logger.info('Data and PDFs updated successfully');
      } catch (error) {
        logger.error(`Error during scheduled update: ${error.message}`);
      }
    });
  }

  async refreshPbixFiles() {
    const scriptPath = path.join(__dirname, 'scripts', 'refresh_pbix.py');
    const pythonCommand = process.platform === "win32" ? "py" : "python3";
    
    return new Promise((resolve, reject) => {
      exec(`${pythonCommand} "${scriptPath}"`, (error, stdout, stderr) => {
        if (error) {
          const errMsg = `Error refreshing PBIX files: ${error.message}`;
          logger.error(errMsg);
          reject(new Error(errMsg));
          return;
        }
        if (stderr && stderr.trim() !== '') {
          const errMsg = `Error in Python script: ${stderr}`;
          logger.error(errMsg);
          reject(new Error(errMsg));
          return;
        }
        if (!stdout || stdout.trim() === '') {
          const errMsg = 'Python script produced no output';
          logger.error(errMsg);
          reject(new Error(errMsg));
          return;
        }

        logger.info(`PBIX files refresh output: ${stdout}`);
        try {
          const result = JSON.parse(stdout);
          resolve(result);
        } catch (parseError) {
          logger.error(`Failed to parse Python output as JSON: ${parseError.message}, stdout: ${stdout}`);
          // Fallback: assume partial success if PNGs exist
          const fuelPng = path.join(this.reportsDirectory, 'fuel_report.png');
          const flightPng = path.join(this.reportsDirectory, 'flight_report.png');
          if (fs.existsSync(fuelPng) && fs.existsSync(flightPng)) {
            logger.warn('Using fallback: PNGs exist, assuming success');
            resolve({ success: true, message: 'PNG files exist', results: {} });
          } else {
            reject(new Error(`JSON parse error: ${parseError.message}`));
          }
        }
      });
    });
  }

  async updateAllDataSources() {
    try {
      await Promise.all([
        this.updateFuelData(),
        this.updateFlightData(),
      ]);
      
      await this.refreshPbixFiles();
      
      await Promise.all([
        this.generateReportHtml('fuel'),
        this.generateReportHtml('flight'),
      ]);
      
      await Promise.all([
        this.generatePDF('fuel'),
        this.generatePDF('flight'),
      ]);
      
      return { success: true, message: 'All data and PDFs updated' };
    } catch (error) {
      logger.error(`Error updating data: ${error.message}`);
      throw error;
    }
  }

  async updateFuelData() {
    try {
      const response = await axios.get('http://localhost:3000/api/data/json/fuel', {
        headers: {
          Authorization: `Bearer ${process.env.INTERNAL_API_TOKEN || 'default-token'}`,
        },
      });

      if (!response.data.success) {
        throw new Error('Failed to fetch fuel data');
      }

      const fuelData = response.data.data;
      const transformedData = fuelData.map((fuel) => ({
        FlightNumber: fuel.flightNumber || 'N/A',
        DateOfFlight: fuel.dateOfFlight || 'N/A',
        DepartureAirport: fuel.departureAirport || 'N/A',
        ArrivalAirport: fuel.arrivalAirport || 'N/A',
        TaxiFuel: Number(fuel.taxiFuel) || 0,
        TripFuel: Number(fuel.tripFuel) || 0,
        ContingencyFuel: Number(fuel.contingencyFuel) || 0,
        BlockFuel: Number(fuel.blockFuel) || 0,
        TotalFuel:
          (Number(fuel.taxiFuel) || 0) +
          (Number(fuel.tripFuel) || 0) +
          (Number(fuel.contingencyFuel) || 0),
        FlightDuration: Number(fuel.flightDuration) || 0,
        Distance: Number(fuel.distance) || 0,
        UpdatedAt: new Date().toISOString(),
      }));

      await this.saveDataInFormats('fuel', transformedData);
      logger.info('Fuel data updated');
      return { success: true, message: 'Fuel data updated' };
    } catch (error) {
      logger.error(`Error updating fuel data: ${error.message}`);
      throw error;
    }
  }

  async updateFlightData() {
    try {
      const response = await axios.get('http://localhost:3000/api/data/json/flight', {
        headers: {
          Authorization: `Bearer ${process.env.INTERNAL_API_TOKEN || 'default-token'}`,
        },
      });

      if (!response.data.success) {
        throw new Error('Failed to fetch flight data');
      }

      const flightData = response.data.data;
      const transformedData = flightData.map((flight) => ({
        ...flight,
        UpdatedAt: new Date().toISOString(),
      }));

      await this.saveDataInFormats('flight', transformedData);
      logger.info('Flight data updated');
      return { success: true, message: 'Flight data updated' };
    } catch (error) {
      logger.error(`Error updating flight data: ${error.message}`);
      throw error;
    }
  }

  async saveDataInFormats(dataType, data) {
    try {
      const excelPath = path.join(this.dataDirectory, `${dataType}_data.xlsx`);
      const csvPath = path.join(this.dataDirectory, `${dataType}_data.csv`);
      const jsonPath = path.join(this.dataDirectory, `${dataType}_data.json`);

      const workbook = XLSX.utils.book_new();
      const worksheet = XLSX.utils.json_to_sheet(data);
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Data');
      XLSX.writeFile(workbook, excelPath);

      const csv = parse(data);
      fs.writeFileSync(csvPath, csv, 'utf8');

      fs.writeFileSync(jsonPath, JSON.stringify(data, null, 2), 'utf8');

      logger.info(`Data saved for ${dataType}: Excel, CSV, JSON`);
      return {
        excel: excelPath,
        csv: csvPath,
        json: jsonPath,
      };
    } catch (error) {
      logger.error(`Error saving data for ${dataType}: ${error.message}`);
      throw error;
    }
  }

  async generateReportHtml(dataType) {
    try {
      const imagePath = path.join(this.reportsDirectory, `${dataType}_report.png`);
      
      if (!fs.existsSync(imagePath)) {
        logger.warn(`PNG image for ${dataType} not found at ${imagePath}. HTML generation may not work correctly.`);
      }
      
      // Use relative path for the image in HTML so it works both locally and in the server
      const relativeImagePath = `./${dataType}_report.png`;

      const htmlContent = `
        <!DOCTYPE html>
        <html lang="en">
        <head>
          <meta charset="UTF-8">
          <title>${dataType} Report</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            h1 { color: #333; }
            img { max-width: 100%; border: 1px solid #ddd; }
            .report-container { margin-top: 20px; }
            .timestamp { color: #666; font-size: 12px; margin-top: 10px; }
          </style>
        </head>
        <body>
          <h1>${dataType.toUpperCase()} Report</h1>
          <div class="report-container">
            <img src="${relativeImagePath}" alt="${dataType} Visualization">
          </div>
          <div class="timestamp">Generated on: ${new Date().toISOString()}</div>
        </body>
        </html>
      `;
      
      const htmlPath = path.join(this.reportsDirectory, `${dataType}_report.html`);
      fs.writeFileSync(htmlPath, htmlContent);

      logger.info(`HTML report generated for ${dataType} at ${htmlPath}`);
      return htmlPath;
    } catch (error) {
      logger.error(`Error generating HTML for ${dataType}: ${error.message}`);
      throw error;
    }
  }

  async generatePDF(dataType) {
    try {
      const htmlPath = path.join(this.reportsDirectory, `${dataType}_report.html`);
      if (!fs.existsSync(htmlPath)) {
        await this.generateReportHtml(dataType);
      }

      const browser = await getBrowser();
      const page = await browser.newPage();
      
      // Load the HTML file with file:// protocol
      const fileUrl = `file://${htmlPath.replace(/\\/g, '/')}`;
      logger.info(`Loading HTML from: ${fileUrl}`);
      
      await page.goto(fileUrl, { 
        waitUntil: 'networkidle2',
        timeout: 30000 
      });

      // Wait a moment to ensure images are loaded
      await page.waitForTimeout(2000);

      const pdfPath = path.join(this.dataDirectory, `${dataType}_report.pdf`);
      await page.pdf({
        path: pdfPath,
        format: 'A4',
        printBackground: true,
        preferCSSPageSize: true,
        displayHeaderFooter: true,
        headerTemplate: `<span style="font-size: 10px; margin-left: 20px;">${dataType.toUpperCase()} Report</span>`,
        footerTemplate: `<span style="font-size: 10px; margin-right: 20px;">Page <span class="pageNumber"></span> of <span class="totalPages"></span></span>`,
        margin: { top: '40px', bottom: '40px', left: '20px', right: '20px' },
      });

      await page.close();
      logger.info(`PDF generated for ${dataType} at ${pdfPath}`);
      return { success: true, path: pdfPath };
    } catch (error) {
      logger.error(`Error generating PDF for ${dataType}: ${error.message}`);
      throw error;
    }
  }

  getDataFilePaths(dataType) {
    return {
      excel: path.join(this.dataDirectory, `${dataType}_data.xlsx`),
      csv: path.join(this.dataDirectory, `${dataType}_data.csv`),
      json: path.join(this.dataDirectory, `${dataType}_data.json`),
      pdf: path.join(this.dataDirectory, `${dataType}_report.pdf`),
    };
  }

  hasData(dataType) {
    const excelPath = path.join(this.dataDirectory, `${dataType}_data.xlsx`);
    return fs.existsSync(excelPath);
  }

  async runDataProcessing() {
    try {
      await this.updateAllDataSources();
      return { success: true, message: 'Manual update completed successfully' };
    } catch (error) {
      logger.error(`Error during manual update: ${error.message}`);
      throw error;
    }
  }
}

process.on('SIGINT', async () => {
  if (browserInstance) {
    await browserInstance.close();
    logger.info('Puppeteer browser instance closed');
  }
  process.exit();
});

module.exports = PowerBIExportService;