import React, { useState, useEffect } from 'react';
import { Routes, Route, useNavigate} from 'react-router-dom';
import SignIn from './pages/SignIn';
import SignUp from './pages/SignUp';
import Navbar from './components/Navbar';
import UserNavbar from './components/UserNavbar';
import Footer from './components/Footer';
import Contact from './pages/Contact';
import Dashboard from './pages/Dashboard';
import Datafuel from './pages/datafuel';
import VerificationCode from './pages/VerificationPage';
import ExtractionData from './pages/ExtractionData.tsx';
import FlightList from './components/FlightList';
import FuelList from './components/FuelList';
import FuelFlightData from './components/FuelFlightData';
import 'bootstrap/dist/css/bootstrap.min.css';
import Accueil from './pages/Accueil.jsx';
import Profile from './pages/Profile';
import ExtractionDataa from './components/ExtractionDataa.jsx';
import DownloadFiles from './components/DownloadFiles';  
import AdminUsers from './components/AdminUsers'; 
import MissingDetailsPage from './components/MissingDetailsPage';
import ExtraData from './pages/extra-data.js';
import DataVisualizer from './pages/DataDisplay.jsx';
import AdminManagement from './components/AdminManagement';
import ContactMessages from './pages/ContactMessages';
 
import SettingsPage from './pages/SettingsPage';
import DataViewer from './pages/DataViewer';  
import FuelDataComponent from './pages/datafuel';
import PowerBIReport from './components/PowerBIReport';
import axios from 'axios';
import './App.css'; // S'assurer que ce fichier existe pour les styles du thème
import { NotificationProvider } from './contexts/NotificationContext';
import NotificationSettings from './pages/notificationsettings';
import SchedulerHistory from './components/SchedulerHistory.tsx';
import DataEditComponent from './components/DataEditComponent';
import TransferDataPage from './components/TransferDataPage.jsx';
import FlightDataTransfer from './components/FlightDataTransfer.jsx';
import PowerBIEmbed from './components/PowerBIEmbed.tsx';
import FuelPrediction from './pages/FuelPrediction';
import ProtectedRoute from './components/ProtectedRoute';
import CO2Prediction from './pages/CO2Prediction';
import FlightOptimization from './components/FlightOptimization';
import FuelPredictionApp from './components/FuelPredictionApp.jsx';
import AllowedNotifications from './pages/AllowedNotifications';
import ResetPasswordPopup from './components/ResetPasswordPopup';
import UserSettings from './components/UserSettings.jsx';

 
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

export const ThemeContext = React.createContext();

const App = () => {
  // Initialiser l'état d'authentification en vérifiant le localStorage
  const [isAuthenticated, setIsAuthenticated] = useState(!!localStorage.getItem('token'));
  const navigate = useNavigate();
  
  // État pour gérer le thème
  const [isDarkMode, setIsDarkMode] = useState(localStorage.getItem('darkMode') === 'true');

  // Fonction pour appliquer le thème actuel au document
  const applyTheme = (darkMode) => {
    document.body.classList.toggle('dark-theme', darkMode);
    document.body.classList.toggle('light-theme', !darkMode);
    
    // Mettre à jour la meta balise pour les appareils mobiles
    const metaThemeColor = document.querySelector("meta[name=theme-color]");
    if (metaThemeColor) {
      metaThemeColor.setAttribute("content", darkMode ? "#212529" : "#ffffff");
    }
    
    // Sauvegarder la préférence dans localStorage
    localStorage.setItem('darkMode', darkMode);
  };

  // Appliquer le thème lorsqu'il change
  useEffect(() => {
    applyTheme(isDarkMode);
  }, [isDarkMode]);

  // Fonction pour basculer le thème
  const toggleTheme = () => {
    setIsDarkMode(prev => !prev);
  };

  // Synchroniser le thème entre les pages et avec les paramètres utilisateur
  useEffect(() => {
    // Si l'utilisateur est authentifié, on peut récupérer ses préférences de thème depuis l'API
    if (isAuthenticated) {
      const fetchUserSettings = async () => {
        try {
          const response = await axios.get('/api/user-settings');
          if (response.data.success && response.data.settings?.dataViewer?.darkMode !== undefined) {
            const userPrefersDark = response.data.settings.dataViewer.darkMode;
            setIsDarkMode(userPrefersDark);
          }
        } catch (error) {
          console.error('Erreur lors de la récupération des paramètres de thème:', error);
        }
      };
      
      fetchUserSettings();
    }
    
    // Écouter les changements de thème (par exemple depuis SettingsPage)
    const handleThemeChange = (event) => {
      if (event.detail && typeof event.detail.darkMode === 'boolean') {
        setIsDarkMode(event.detail.darkMode);
      }
    };
    
    window.addEventListener('theme-change', handleThemeChange);
    
    return () => {
      window.removeEventListener('theme-change', handleThemeChange);
    };
  }, [isAuthenticated]);

  // Écouter les changements d'authentification
  useEffect(() => {
    const checkAuth = () => {
      const token = localStorage.getItem('token');
      setIsAuthenticated(!!token);
    };

    // Écouter l'événement personnalisé 'auth-change'
    window.addEventListener('auth-change', checkAuth);
    
    // Écouter les changements de stockage (important pour la synchronisation entre onglets)
    window.addEventListener('storage', checkAuth);
    
    // Vérifier l'authentification au chargement
    checkAuth();

    // Nettoyer les écouteurs d'événements
    return () => {
      window.removeEventListener('auth-change', checkAuth);
      window.removeEventListener('storage', checkAuth);
    };
  }, []);

  // Fonction de déconnexion
  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('userRole');
    localStorage.removeItem('permissions');
    setIsAuthenticated(false);
    window.dispatchEvent(new Event('auth-change'));
    navigate('/');
  };

  // Fonction de connexion à passer au composant SignIn
  const handleSignInSuccess = () => {
    setIsAuthenticated(true);
    window.dispatchEvent(new Event('auth-change'));
  };

  return (
    <NotificationProvider>
      <ThemeContext.Provider value={{ isDarkMode, toggleTheme }}>
        <div className={`app ${isDarkMode ? 'dark-theme' : 'light-theme'}`}>
          {/* Affichage conditionnel des barres de navigation */}
          {!isAuthenticated ? <Navbar /> : <UserNavbar handleLogout={handleLogout} isDarkMode={isDarkMode} toggleTheme={toggleTheme} />}
          <div className="page-container">
            <div className="content"></div>
          <Routes>
            <Route path="/" element={<Accueil />} />
            <Route path="/contact" element={<Contact />} />
            <Route
              path="/signin"
              element={
                <SignIn
                  onSignInSuccess={handleSignInSuccess}
                />
              }
            />
            <Route path="/signup" element={<SignUp />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/datafuel" element={<Datafuel />} />
            <Route path="/verification-code" element={<VerificationCode />} />
            <Route path="/extraction" element={<ExtractionData />} />
            <Route path="/flight-list" element={<FlightList />} />
            <Route path="/fuel-data" element={<FuelList />} />
            <Route path="/fuel-flight-data" element={<FuelFlightData />} />
            <Route path="/extraction-data" element={<ExtractionDataa />} />
            <Route path="/download-files" element={<DownloadFiles />} />
            <Route path="/admin/users" element={<AdminUsers />} />
            <Route path="/missing-details/:id" element={<MissingDetailsPage />} />
            <Route path="/extra-data" element={<ExtraData />} />
            <Route path="/data-visualizer" element={<DataVisualizer />} /> 
            <Route path="/admin/admins" element={<AdminManagement />} />
            <Route path="/admin/contact-messages" element={<ContactMessages />} />
             
            <Route path="/settings" element={<SettingsPage onThemeChange={setIsDarkMode} />} />
            <Route path="/data-viewer" element={<DataViewer />} />
            <Route path="/fuel" element={<FuelDataComponent/>} />
              
            <Route path="/notifications" element={<NotificationSettings />} />
            <Route path="/scheduler-history" element={<SchedulerHistory />} />
            <Route path="/data-edit" element={<DataEditComponent />} />
            <Route path="/transfer-data" element={<TransferDataPage />} />
            <Route path="/transfer" element={<FlightDataTransfer />} />
             {/* Route pour ton embed Power BI */}
+            <Route path="/powerbi" element={<PowerBIEmbed />} />
            <Route path="/fuel-prediction" element={<ProtectedRoute element={<FuelPrediction />} />} />
            <Route path="/co2-prediction" element={<ProtectedRoute element={<CO2Prediction />} />} />
            <Route path="/flight-optimization" element={<FlightOptimization />} />
            <Route path="/App" element={<FuelPredictionApp />} />
            <Route path="/admin/notifications-allowed" element={<AllowedNotifications />} />
            <Route path="/reset-password" element={<ResetPasswordPopup />} />
            <Route path="/user-settings" element={<UserSettings />} />

             




            

          </Routes>
          </div>
          <ToastContainer
  position="top-right"
  autoClose={4000}
  hideProgressBar={false}
  newestOnTop={true}
  closeOnClick
  pauseOnFocusLoss
  draggable
  pauseOnHover
/>

          <Footer />
          
          
          {/* Bouton flottant optionnel pour changer le thème */}
          <button 
            className="theme-toggle-button"
            onClick={toggleTheme}
            title={isDarkMode ? "Passer au mode clair" : "Passer au mode sombre"}
          >
            {isDarkMode ? "☀️" : "🌙"}
          </button>
        </div>
      </ThemeContext.Provider>
    </NotificationProvider>
  );
};

export default App;