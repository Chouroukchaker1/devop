import React, { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, PieChart, Pie, Cell, 
    RadialBarChart, RadialBar, LineChart, Line, AreaChart, Area, ScatterChart, Scatter,
    ResponsiveContainer } from 'recharts';
import { Calendar, TrendingUp, Droplet, AlertTriangle, Map, Clock } from 'lucide-react';
import 'bootstrap/dist/css/bootstrap.min.css';
import './Dashborad.css';
import axios from 'axios';
import jsPDF from 'jspdf'; 
import html2canvas from 'html2canvas';
import FuelDataComponent from './datafuel';

const Dashboard = () => {
    // State declarations
    const [fuelData, setFuelData] = useState([]);
    const [flightData, setFlightData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [flightError, setFlightError] = useState('');
    const [activeChartIndex, setActiveChartIndex] = useState(0);

    // Authentication token from localStorage
    const token = localStorage.getItem('token');

    // Axios configuration
    const axiosConfig = {
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        }
    };

    // Fetch fuel and flight data on component mount
    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                // Fetch fuel data
                const fuelResponse = await axios.get('http://localhost:8080/api/feuldata', axiosConfig);
                if (fuelResponse.data.success) {
                    // Map the fuel API data to match the expected dashboard format
                    const mappedFuelData = fuelResponse.data.data.map(fuel => ({
                        "Flight Number": fuel.flightNumber,
                        "Date of Flight": fuel.dateOfFlight ? new Date(fuel.dateOfFlight).toLocaleDateString('en-GB') : 'N/A',
                        "DepartureAirport": fuel.departureAirport,
                        "ArrivalAirport": fuel.arrivalAirport,
                        "TaxiFuel": Number(fuel.taxiFuel) || 0,
                        "TripFuel": Number(fuel.tripFuel) || 0,
                        "ContingencyFuel": Number(fuel.contingencyFuel) || 0,
                        "BlockFuel": Number(fuel.blockFuel) || 0,
                        "TotalFuel": (Number(fuel.taxiFuel) || 0) + (Number(fuel.tripFuel) || 0) + (Number(fuel.contingencyFuel) || 0),
                        "FlightDuration": Number(fuel.flightDuration) || 0,
                        "Distance": Number(fuel.distance) || 0
                    }));
                    setFuelData(mappedFuelData);

                    // Send fuel data to Power BI
                    try {
                        const powerBiUrl = 'https://app.powerbi.com/reportEmbed?reportId=79dc72d7-5e4c-4bbe-95a9-3e8f11d9f9c0&autoAuth=true&ctid=b7bd4715-4217-48c7-919e-2ea97f592fa7';
                        await axios.post(powerBiUrl, mappedFuelData, {
                            headers: { 'Content-Type': 'application/json' }
                        });
                        console.log('Fuel data sent to Power BI');
                    } catch (powerBiError) {
                        console.error('Power BI fuel error:', powerBiError);
                    }
                } else {
                    setError('Failed to fetch fuel data');
                }

                // Fetch flight data
                const flightResponse = await axios.get('http://localhost:8080/api/flightData', axiosConfig);
                // Ensure flightResponse.data is an array
                let flightDataArray = [];
                if (Array.isArray(flightResponse.data)) {
                    flightDataArray = flightResponse.data;
                } else if (flightResponse.data.success && Array.isArray(flightResponse.data.data)) {
                    flightDataArray = flightResponse.data.data;
                } else {
                    throw new Error('Flight data is not in the expected format');
                }

                const mappedFlightData = flightDataArray.map(flight => ({
                    "Flight ID": flight.flightID,
                    "Date of Operation": flight.dateOfOperationUTC ? new Date(flight.dateOfOperationUTC).toLocaleDateString('en-GB') : 'N/A',
                    "AC Registration": flight.acRegistration,
                    "ICAO Call Sign": flight.icaoCallSign,
                    "AC Type": flight.acType,
                    "Company": flight.company || 'N/A',
                    "Flight Type": flight.flightType,
                    "Departure Airport": flight.departingAirportICAOCode,
                    "Departure Time": flight.departureTimeUTC,
                    "Destination Airport": flight.destinationAirportICAOCode,
                    "Arrival Time": flight.arrivalTimeUTC,
                    "Uplift Volume (Litres)": Number(flight.upliftVolumeLitres) || 0,
                    "Uplift Density": Number(flight.upliftDensity) || 0,
                    "Block On Tonnes": Number(flight.blockOnTonnes) || 0,
                    "Block Off Tonnes": Number(flight.blockOffTonnes) || 0
                }));
                setFlightData(mappedFlightData);

                // Send flight data to Power BI
                try {
                    const powerBiUrl = 'https://api.powerbi.com/beta/b7bd4715-4217-48c7-919e-2ea97f592fa7/datasets/9d42bc72-7fc9-4c6d-a9c6-18a7c75fd75a/rows?experience=power-bi&key=JRx%2BZeQSRnweUik6xxywuzGqwzNdYdXJB5I8S9Eqh9nV9nHT0ZH7IGjAYHLR3nyvYuGuENF6SkzUTu5SDs21BA%3D%3D';
                    await axios.post(powerBiUrl, mappedFlightData, {
                        headers: { 'Content-Type': 'application/json' }
                    });
                    console.log('Flight data sent to Power BI');
                } catch (powerBiError) {
                    console.error('Power BI flight error:', powerBiError);
                }
            } catch (err) {
                console.error('Fetch error:', err.response?.data || err.message);
                if (err.response?.config.url.includes('feuldata')) {
                    setError('Server error: ' + (err.response?.data?.message || err.message));
                } else {
                    setFlightError('Server error: ' + (err.response?.data?.message || err.message));
                }
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    // Function to generate and download PDF report
    const downloadPDFReport = async () => {
        const pdf = new jsPDF('p', 'mm', 'a4');
        const pageWidth = pdf.internal.pageSize.getWidth();
        const pageHeight = pdf.internal.pageSize.getHeight();
        const margin = 10;
        let yPosition = margin;

        // Add title
        pdf.setFontSize(18);
        pdf.text('Fuel et  Flight Dashboard Report', margin, yPosition);
        yPosition += 10;

        // Add timestamp
        pdf.setFontSize(12);
        pdf.text(`Generated on: ${new Date().toLocaleString('en-GB')}`, margin, yPosition);
        yPosition += 10;

        // Capture dashboard screenshot
        const dashboardElement = document.querySelector('.container-fluid');
        if (dashboardElement) {
            try {
                const canvas = await html2canvas(dashboardElement, { scale: 1 });
                const imgData = canvas.toDataURL('image/png');
                const imgProps = pdf.getImageProperties(imgData);
                const imgWidth = pageWidth - 2 * margin;
                const imgHeight = (imgProps.height * imgWidth) / imgProps.width;

                // Check if image fits on current page, add new page if needed
                if (yPosition + imgHeight + margin > pageHeight) {
                    pdf.addPage();
                    yPosition = margin;
                }

                pdf.addImage(imgData, 'PNG', margin, yPosition, imgWidth, imgHeight);
                yPosition += imgHeight + 10;
            } catch (err) {
                console.error('Error capturing dashboard screenshot:', err);
                pdf.text('Error: Could not capture dashboard screenshot.', margin, yPosition);
                yPosition += 10;
            }
        }

        // Add key metrics table
        pdf.setFontSize(14);
        pdf.text('Key Metrics', margin, yPosition);
        yPosition += 8;

        pdf.setFontSize(10);
        const totalFuel = fuelData.reduce((sum, flight) => sum + flight.TotalFuel, 0);
        const totalUplift = flightData.reduce((sum, flight) => sum + flight['Uplift Volume (Litres)'], 0);
        const metricsTable = [
            ['Metric', 'Value', 'Trend'],
            ['Total Distance', `${fuelData.reduce((sum, flight) => sum + flight.Distance, 0).toFixed(0)} km`, '↑'],
            ['Total Duration', `${fuelData.reduce((sum, flight) => sum + flight.FlightDuration, 0).toFixed(1)} h`, '↑'],
            ['Average Fuel', `${(totalFuel / fuelData.length).toFixed(2)} L`, '→'],
            ['Average Uplift', `${(totalUplift / flightData.length).toFixed(2)} L`, '→'],
            ['Average Efficiency', `${(fuelData.reduce((sum, flight) => sum + flight.Distance, 0) / totalFuel).toFixed(2)} km/L`, '↑'],
            ['Total Emissions', `${(totalFuel * 3.16).toFixed(2)} kg CO₂`, '↑']
        ];

        // Simple table rendering
        metricsTable.forEach((row, rowIndex) => {
            row.forEach((cell, cellIndex) => {
                pdf.text(cell, margin + cellIndex * 60, yPosition);
            });
            yPosition += 8;
            if (yPosition + 8 > pageHeight) {
                pdf.addPage();
                yPosition = margin;
            }
        });

        // Add top 5 flights by fuel consumption
        if (yPosition + 30 > pageHeight) {
            pdf.addPage();
            yPosition = margin;
        }
        pdf.setFontSize(14);
        pdf.text('Top 5 Flights by Fuel Consumption', margin, yPosition);
        yPosition += 8;

        const topFlights = fuelData
            .sort((a, b) => b.TotalFuel - a.TotalFuel)
            .slice(0, 5)
            .map(flight => [
                flight['Flight Number'],
                `${flight.TotalFuel.toFixed(2)} L`,
                flight['Date of Flight'],
                `${flight.Distance.toFixed(0)} km`
            ]);

        pdf.setFontSize(10);
        const flightsTable = [['Flight Number', 'Total Fuel', 'Date', 'Distance'], ...topFlights];
        flightsTable.forEach((row, rowIndex) => {
            row.forEach((cell, cellIndex) => {
                pdf.text(cell, margin + cellIndex * 50, yPosition);
            });
            yPosition += 8;
            if (yPosition + 8 > pageHeight) {
                pdf.addPage();
                yPosition = margin;
            }
        });

        // Add top 5 flights by uplift volume
        if (yPosition + 30 > pageHeight) {
            pdf.addPage();
            yPosition = margin;
        }
        pdf.setFontSize(14);
        pdf.text('Top 5 Flights by Uplift Volume', margin, yPosition);
        yPosition += 8;

        const topUpliftFlights = flightData
            .sort((a, b) => b['Uplift Volume (Litres)'] - a['Uplift Volume (Litres)'])
            .slice(0, 5)
            .map(flight => [
                flight['Flight ID'],
                `${flight['Uplift Volume (Litres)'].toFixed(2)} L`,
                flight['Date of Operation'],
                flight['AC Type']
            ]);

        const upliftTable = [['Flight ID', 'Uplift Volume', 'Date', 'AC Type'], ...topUpliftFlights];
        upliftTable.forEach((row, rowIndex) => {
            row.forEach((cell, cellIndex) => {
                pdf.text(cell, margin + cellIndex * 50, yPosition);
            });
            yPosition += 8;
            if (yPosition + 8 > pageHeight) {
                pdf.addPage();
                yPosition = margin;
            }
        });

        // Save the PDF
        pdf.save(`Fuel_Flight_Dashboard_Report_${new Date().toISOString().slice(0, 10)}.pdf`);
    };

    // If loading, show a loading message
    if (loading) {
        return (
            <div className="container-fluid p-4 bg-light text-center">
                <h3>Loading data...</h3>
            </div>
        );
    }

    // If there's an error, show an error message
    if (error || flightError) {
        return (
            <div className="container-fluid p-4 bg-light text-center">
                <h3 className="text-danger">{error || flightError}</h3>
            </div>
        );
    }

    // If no data, show a message
    if (fuelData.length === 0 && flightData.length === 0) {
        return (
            <div className="container-fluid p-4 bg-light text-center">
                <h3>No fuel or flight data available.</h3>
            </div>
        );
    }

    // Calculate totals for fuel data
    const totalTaxiFuel = fuelData.reduce((sum, flight) => sum + flight.TaxiFuel, 0);
    const totalTripFuel = fuelData.reduce((sum, flight) => sum + flight.TripFuel, 0);
    const totalContingencyFuel = fuelData.reduce((sum, flight) => sum + flight.ContingencyFuel, 0);
    const totalFuel = totalTaxiFuel + totalTripFuel + totalContingencyFuel;

    // Calculate totals for flight data
    const totalUplift = flightData.reduce((sum, flight) => sum + flight['Uplift Volume (Litres)'], 0);

    // Data for pie chart (fuel distribution)
    const fuelDistributionData = [
        { name: 'Taxi Fuel', value: totalTaxiFuel },
        { name: 'Trip Fuel', value: totalTripFuel },
        { name: 'Contingency Fuel', value: totalContingencyFuel }
    ];

    // Data for card charts (updated to include flight data metrics)
    const cardChartData = [
        { name: 'Consommation Totale', value: totalFuel, fill: '#0088FE', icon: <Droplet className="h-5 w-5 text-primary" /> },
        { name: 'Émissions CO2', value: totalFuel * 3.16, fill: '#00C49F', icon: <TrendingUp className="h-5 w-5 text-success" /> },
        { name: 'Nombre de Vols', value: flightData.length, fill: '#FFBB28', icon: <Calendar className="h-5 w-5 text-info" /> },
        { name: 'Uplift Total', value: totalUplift, fill: '#FF8042', icon: <AlertTriangle className="h-5 w-5 text-warning" /> }
    ];

    // Data for efficiency chart
    const efficiencyData = fuelData.map(flight => ({
        'Flight Number': flight['Flight Number'],
        'Efficiency': flight.Distance && flight.TotalFuel ? (flight.Distance / flight.TotalFuel).toFixed(2) : 0,
        'Distance': flight.Distance,
        'TotalFuel': flight.TotalFuel
    }));

    // Data for fuel trend chart
    const fuelTrendData = fuelData.map(flight => ({
        'Date': flight['Date of Flight'],
        'TotalFuel': flight.TotalFuel,
        'Flight Number': flight['Flight Number'],
    }));

    // Data for uplift trend chart
    const upliftTrendData = flightData.map(flight => ({
        'Date': flight['Date of Operation'],
        'UpliftVolume': flight['Uplift Volume (Litres)'],
        'Flight ID': flight['Flight ID'],
    }));

    const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

    const chartTypes = ["bar", "area", "line"];
    const chartTitles = ["Consommation par Type", "Tendance de Consommation", "Comparaison par Vol"];

    return (
        <div className="container-fluid p-4 bg-light">
            <h1 className="fw-bold mb-4">Fuel & Flight Dashboard</h1>
            <div className="d-flex justify-content-end mb-3">
                <a href="/powerbi" className="btn btn-sm btn-outline-warning d-flex align-items-center" style={{ gap: '5px' }}>
                    <img
                        src="https://upload.wikimedia.org/wikipedia/commons/c/cf/New_Power_BI_Logo.svg"
                        alt="Power BI"
                        style={{ width: '20px', height: '20px' }}
                    />
                    Accéder à Power BI
                </a>
            </div>

            {/* Première rangée: Métriques principales */}
            <div className="row mb-4">
                {/* Cards Metrics Section */}
                <div className="col-md-4">
                    <div className="card shadow-sm mb-4">
                        <div className="card-header bg-white border-bottom-0 d-flex justify-content-between align-items-center">
                            <h3 className="card-title h5 text-secondary">Métriques</h3>
                            <div className="badge bg-info">Mise à jour</div>
                        </div>
                        <div className="card-body">
                            <div className="row row-cols-2 g-3">
                                {cardChartData.map((item, index) => (
                                    <div key={index} className="col">
                                        <div className="d-flex justify-content-between align-items-center mb-2">
                                            <h6 className="mb-0 small text-muted">{item.name}</h6>
                                            {item.icon}
                                        </div>
                                        <div className="d-flex justify-content-center">
                                            <RadialBarChart 
                                                width={120} 
                                                height={120} 
                                                cx={60} 
                                                cy={60} 
                                                innerRadius={30} 
                                                outerRadius={50} 
                                                barSize={10} 
                                                data={[item]}
                                                startAngle={180} 
                                                endAngle={-180}
                                            >
                                                <RadialBar
                                                    minAngle={15}
                                                    background
                                                    clockWise
                                                    dataKey="value"
                                                />
                                                <text
                                                    x={60}
                                                    y={60}
                                                    textAnchor="middle"
                                                    dominantBaseline="middle"
                                                    className="small fw-medium"
                                                >
                                                    {item.name === 'Consommation Totale' ? `${item.value.toFixed(1)} L` :
                                                    item.name === 'Émissions CO2' ? `${item.value.toFixed(1)} kg` :
                                                    item.name === 'Uplift Total' ? `${item.value.toFixed(1)} L` :
                                                    item.value}
                                                </text>
                                            </RadialBarChart>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Distribution du Carburant */}
                <div className="col-md-4">
                    <div className="card shadow-sm h-100">
                        <div className="card-header bg-white border-bottom-0">
                            <h3 className="card-title h5 text-secondary">Distribution du Carburant</h3>
                        </div>
                        <div className="card-body d-flex justify-content-center align

-items-center">
                            <PieChart width={300} height={300}>
                                <Pie
                                    data={fuelDistributionData}
                                    cx={150}
                                    cy={150}
                                    innerRadius={50}
                                    outerRadius={90}
                                    fill="#8884d8"
                                    dataKey="value"
                                    label={({name, value}) => `${name}: ${value.toFixed(1)}`}
                                >
                                    {fuelDistributionData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip formatter={(value) => value.toFixed(2)} />
                                <Legend />
                            </PieChart>
                        </div>
                    </div>
                </div>

                {/* Consommation par Vol */}
                <div className="col-md-4">
                    <div className="card shadow-sm h-100">
                        <div className="card-header bg-white border-bottom-0">
                            <h3 className="card-title h5 text-secondary">Consommation par Vol</h3>
                        </div>
                        <div className="card-body d-flex justify-content-center align-items-center">
                            <BarChart width={300} height={300} data={fuelData} margin={{top: 20, right: 10, left: 10, bottom: 30}}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="Flight Number" />
                                <YAxis />
                                <Tooltip />
                                <Legend wrapperStyle={{bottom: -10}} />
                                <Bar dataKey="TaxiFuel" fill="#0088FE" name="Taxi Fuel" />
                                <Bar dataKey="TripFuel" fill="#00C49F" name="Trip Fuel" />
                                <Bar dataKey="ContingencyFuel" fill="#FFBB28" name="Contingency Fuel" />
                            </BarChart>
                        </div>
                    </div>
                </div>
            </div>

            {/* Deuxième rangée: Graphiques d'analyse avancée */}
            <div className="row mb-4">
                {/* Graphique d'efficacité - Distance vs Consommation */}
                <div className="col-md-6">
                    <div className="card shadow-sm h-100">
                        <div className="card-header bg-white border-bottom-0 d-flex justify-content-between align-items-center">
                            <h3 className="card-title h5 text-secondary">Efficacité (Distance/Carburant)</h3>
                            <div className="badge bg-success">Analyse</div>
                        </div>
                        <div className="card-body">
                            <ResponsiveContainer width="100%" height={350}>
                                <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                                    <CartesianGrid />
                                    <XAxis type="number" dataKey="Distance" name="Distance (km)" />
                                    <YAxis type="number" dataKey="TotalFuel" name="Carburant (L)" />
                                    <Tooltip cursor={{ strokeDasharray: '3 3' }} formatter={(value) => value.toFixed(2)} />
                                    <Legend />
                                    <Scatter name="Vols" data={fuelData} fill="#8884d8">
                                        {fuelData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                        ))}
                                    </Scatter>
                                </ScatterChart>
                            </ResponsiveContainer>
                            <div className="text-center mt-2">
                                <p className="small text-muted">Chaque point représente un vol. La relation entre distance et consommation est visualisée.</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Graphique de tendance de consommation */}
                <div className="col-md-6">
                    <div className="card shadow-sm h-100">
                        <div className="card-header bg-white border-bottom-0 d-flex justify-content-between align-items-center">
                            <h3 className="card-title h5 text-secondary">Tendance de Consommation et Uplift</h3>
                            <div className="btn-group btn-group-sm">
                                {chartTypes.map((type, index) => (
                                    <button
                                        key={type}
                                        className={`btn ${activeChartIndex === index ? 'btn-primary' : 'btn-outline-primary'}`}
                                        onClick={() => setActiveChartIndex(index)}
                                    >
                                        {chartTitles[index]}
                                    </button>
                                ))}
                            </div>
                        </div>
                        <div className="card-body">
                            <ResponsiveContainer width="100%" height={350}>
                                {activeChartIndex === 0 ? (
                                    <BarChart data={fuelTrendData.concat(upliftTrendData)} margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                                        <CartesianGrid strokeDasharray="3 3" />
                                        <XAxis dataKey={fuelTrendData.length ? "Flight Number" : "Flight ID"} />
                                        <YAxis />
                                        <Tooltip formatter={(value) => value.toFixed(2)} />
                                        <Legend />
                                        <Bar dataKey="TotalFuel" fill="#8884d8" name="Consommation Totale" />
                                        <Bar dataKey="UpliftVolume" fill="#FF8042" name="Uplift Volume" />
                                    </BarChart>
                                ) : activeChartIndex === 1 ? (
                                    <AreaChart data={fuelTrendData.concat(upliftTrendData)} margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                                        <CartesianGrid strokeDasharray="3 3" />
                                        <XAxis dataKey="Date" />
                                        <YAxis />
                                        <Tooltip formatter={(value) => value.toFixed(2)} />
                                        <Legend />
                                        <Area type="monotone" dataKey="TotalFuel" fill="#8884d8" stroke="#8884d8" name="Consommation Totale" />
                                        <Area type="monotone" dataKey="UpliftVolume" fill="#FF8042" stroke="#FF8042" name="Uplift Volume" />
                                    </AreaChart>
                                ) : (
                                    <LineChart data={fuelTrendData.concat(upliftTrendData)} margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                                        <CartesianGrid strokeDasharray="3 3" />
                                        <XAxis dataKey={fuelTrendData.length ? "Flight Number" : "Flight ID"} />
                                        <YAxis />
                                        <Tooltip formatter={(value) => value.toFixed(2)} />
                                        <Legend />
                                        <Line type="monotone" dataKey="TotalFuel" stroke="#8884d8" name="Consommation Totale" />
                                        <Line type="monotone" dataKey="UpliftVolume" stroke="#FF8042" name="Uplift Volume" />
                                    </LineChart>
                                )}
                            </ResponsiveContainer>
                        </div>
                    </div>
                </div>
            </div>

            {/* Troisième rangée: Analyse complémentaire */}
            <div className="row">
                {/* Facteurs d'efficacité */}
                <div className="col-md-4">
                    <div className="card shadow-sm h-100">
                        <div className="card-header bg-white border-bottom-0">
                            <h3 className="card-title h5 text-secondary">Efficacité des Vols</h3>
                        </div>
                        <div className="card-body">
                            <ResponsiveContainer width="100%"respectively height={300}>
                                <BarChart data={efficiencyData} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis type="number" />
                                    <YAxis dataKey="Flight Number" type="category" />
                                    <Tooltip formatter={(value) => value} />
                                    <Legend />
                                    <Bar dataKey="Efficiency" fill="#82ca9d" name="Efficacité (km/L)" />
                                </BarChart>
                            </ResponsiveContainer>
                            <div className="text-center mt-2">
                                <p className="small text-muted">Comparaison de l'efficacité entre les différents vols (distance parcourue par litre de carburant)</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Rapport distance / durée */}
                <div className="col-md-4">
                    <div className="card shadow-sm h-100">
                        <div className="card-header bg-white border-bottom-0 d-flex justify-content-between align-items-center">
                            <h3 className="card-title h5 text-secondary">Rapport Distance/Durée</h3>
                            <Clock className="h-5 w-5 text-primary" />
                        </div>
                        <div className="card-body">
                            <ResponsiveContainer width="100%" height={300}>
                                <LineChart data={fuelData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis dataKey="Flight Number" />
                                    <YAxis yAxisId="left" orientation="left" stroke="#8884d8" />
                                    <YAxis yAxisId="right" orientation="right" stroke="#82ca9d" />
                                    <Tooltip formatter={(value) => value.toFixed(2)} />
                                    <Legend />
                                    <Line yAxisId="left" type="monotone" dataKey="Distance" stroke="#8884d8" name="Distance (km)" />
                                    <Line yAxisId="right" type="monotone" dataKey="FlightDuration" stroke="#82ca9d" name="Durée (h)" />
                                </LineChart>
                            </ResponsiveContainer>
                            <div className="text-center mt-2">
                                <p className="small text-muted">Comparaison entre la distance parcourue et la durée de vol pour chaque trajet</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Statistiques globales */}
                <div className="col-md-4">
                    <div className="card shadow-sm h-100">
                        <div className="card-header bg-white border-bottom-0 d-flex justify-content-between align-items-center">
                            <h3 className="card-title h5 text-secondary">Récapitulatif</h3>
                            <Map className="h-5 w-5 text-info" />
                        </div>
                        <div className="card-body">
                            <div className="table-responsive">
                                <table className="table table-sm table-hover">
                                    <thead>
                                        <tr>
                                            <th>Métrique</th>
                                            <th>Valeur</th>
                                            <th>Tendance</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        <tr>
                                            <td>Distance totale</td>
                                            <td>{fuelData.reduce((sum, flight) => sum + flight.Distance, 0).toFixed(0)} km</td>
                                            <td><span className="text-success">↑</span></td>
                                        </tr>
                                        <tr>
                                            <td>Durée totale</td>
                                            <td>{fuelData.reduce((sum, flight) => sum + flight.FlightDuration, 0).toFixed(1)} h</td>
                                            <td><span className="text-success">↑</span></td>
                                        </tr>
                                        <tr>
                                            <td>Carburant moyen</td>
                                            <td>{(totalFuel / fuelData.length).toFixed(2)} L</td>
                                            <td><span className="text-warning">→</span></td>
                                        </tr>
                                        <tr>
                                            <td>Uplift moyen</td>
                                            <td>{(totalUplift / flightData.length).toFixed(2)} L</td>
                                            <td><span className="text-warning">→</span></td>
                                        </tr>
                                        <tr>
                                            <td>Efficacité moyenne</td>
                                            <td>
                                                {(fuelData.reduce((sum, flight) => sum + flight.Distance, 0) / totalFuel).toFixed(2)} km/L
                                            </td>
                                            <td><span className="text-success">↑</span></td>
                                        </tr>
                                        <tr>
                                            <td>Émissions totales</td>
                                            <td>{(totalFuel * 3.16).toFixed(2)} kg CO₂</td>
                                            <td><span className="text-danger">↑</span></td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>
                            <div className="text-center mt-2">
                                <button className="btn btn-sm btn-outline-primary" onClick={downloadPDFReport}>
                                    Télécharger le rapport
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Nouvelle section pour FuelDataComponent */}
            <div className="row mt-4">
                <div className="col-12">
                    <div className="card shadow-sm">
                        <div className="card-header bg-white border-bottom-0 d-flex justify-content-between align-items-center">
                            <h3 className="card-title h5 text-secondary">Visualisation des Données de Consommation de Carburant et de Vol</h3>
                            <div className="badge bg-primary">Détaillé</div>
                        </div>
                        <div className="card-body">
                            <FuelDataComponent flightData={fuelData} flightDetails={flightData} />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;