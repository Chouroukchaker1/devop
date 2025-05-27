import React, { useEffect, useState } from "react";
import axios from "axios";
import "./Profile.css";

const Profile = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [editMode, setEditMode] = useState(false);
  const [profileImage, setProfileImage] = useState(null);
  const [updatedUser, setUpdatedUser] = useState({
    username: "",
    email: "",
    profileImage: null,
  });

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) {
          setError("Utilisateur non authentifié.");
          setLoading(false);
          return;
        }

        // Récupérer le profil et l'image en une seule requête
        const profileResponse = await axios.get("http://localhost:8082/api/auth/profile", {
          headers: { Authorization: `Bearer ${token}` },
        });

        const userData = profileResponse.data.user;
        setUser(userData);
        setUpdatedUser({
          username: userData.username,
          email: userData.email,
          profileImage: null,
        });

        // Utiliser l'image de profil directement depuis la réponse du profil
        if (userData.profileImage) {
          const imageUrl = userData.profileImage.startsWith('http') 
            ? userData.profileImage 
            : `http://localhost:8082/uploads/${userData.profileImage}`;
          setProfileImage(imageUrl);
        }
      } catch (err) {
        setError("Impossible de charger le profil.");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, []);

  const handleChange = (e) => {
    setUpdatedUser({ 
      ...updatedUser, 
      [e.target.name]: e.target.value 
    });
  };

  const handleImageChange = (e) => {
    const selectedFile = e.target.files[0];
    setUpdatedUser({ 
      ...updatedUser, 
      profileImage: selectedFile 
    });
    
    // Aperçu de la nouvelle image
    if (selectedFile) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setProfileImage(event.target.result);
      };
      reader.readAsDataURL(selectedFile);
    }
  };

  const handleUpdate = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        setError("Utilisateur non authentifié.");
        return;
      }

      const formData = new FormData();
      formData.append("username", updatedUser.username);
      formData.append("email", updatedUser.email);
      
      if (updatedUser.profileImage) {
        formData.append("profileImage", updatedUser.profileImage);
      }

      const response = await axios.put(
        "http://localhost:8082/api/auth/profile", 
        formData, 
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "multipart/form-data",
          },
        }
      );

      // Mettre à jour l'état avec les nouvelles données
      const updatedUserData = response.data.user;
      setUser(updatedUserData);
      
      // Mettre à jour l'image de profil
      if (updatedUserData.profileImage) {
        const imageUrl = updatedUserData.profileImage.startsWith('http') 
          ? updatedUserData.profileImage 
          : `http://localhost:8082/uploads/${updatedUserData.profileImage}`;
        setProfileImage(imageUrl);
      }

      setEditMode(false);
      setError("");
    } catch (err) {
      const errorMsg = err.response?.data?.message || "Échec de la mise à jour du profil.";
      setError(errorMsg);
      console.error("Erreur de mise à jour:", err);
      
      // Recharger l'image originale en cas d'erreur
      if (user?.profileImage) {
        const originalImageUrl = user.profileImage.startsWith('http') 
          ? user.profileImage 
          : `http://localhost:8082/uploads/${user.profileImage}`;
        setProfileImage(originalImageUrl);
      }
    }
  };

  const getProfileImageUrl = () => {
    if (!user?.profileImage) return "/assets/m.png";
    
    return user.profileImage.startsWith('http')
      ? user.profileImage
      : `http://localhost:8082${user.profileImage}`;
  };
  if (loading) {
    return (
      <div className="profile-loading">
        <div className="spinner"></div>
        <p>Chargement du profil...</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="profile-error">
        <p>{error || "Impossible de charger les données du profil"}</p>
      </div>
    );
  }

  return (
    <div className="profile-container">
      <div className="profile-card">
        {error && <div className="profile-error">{error}</div>}

        <h2 className="profile-title">Mon Profil</h2>

        <div className="profile-image-container">
          <img
            src={getProfileImageUrl()}
            alt="Profile"
            className="profile-image"
            onError={(e) => { 
              e.target.onerror = null; 
              e.target.src = "/assets/m.png"; 
            }}
          />
        </div>

        {editMode ? (
          <div className="profile-edit-form">
            <div className="profile-form-group">
              <label>Nom d'utilisateur</label>
              <input
                type="text"
                name="username"
                value={updatedUser.username}
                onChange={handleChange}
                required
              />
            </div>
            
            <div className="profile-form-group">
              <label>Email</label>
              <input
                type="email"
                name="email"
                value={updatedUser.email}
                onChange={handleChange}
                required
              />
            </div>
            
            <div className="profile-form-group">
              <label>Image de profil</label>
              <input
                type="file"
                name="profileImage"
                accept="image/*"
                onChange={handleImageChange}
              />
              <small>Formats acceptés: JPG, PNG (max 5MB)</small>
            </div>
            
            <div className="profile-form-actions">
              <button 
                className="profile-btn profile-btn-save" 
                onClick={handleUpdate}
                disabled={!updatedUser.username || !updatedUser.email}
              >
                Enregistrer
              </button>
              <button 
                className="profile-btn profile-btn-cancel" 
                onClick={() => {
                  setEditMode(false);
                  setError("");
                  // Réinitialiser l'image si l'édition est annulée
                  if (user.profileImage) {
                    const originalImageUrl = user.profileImage.startsWith('http') 
                      ? user.profileImage 
                      : `http://localhost:8082/uploads/${user.profileImage}`;
                    setProfileImage(originalImageUrl);
                  }
                }}
              >
                Annuler
              </button>
            </div>
          </div>
        ) : (
          <div className="profile-view">
            <div className="profile-info">
              <div className="profile-info-item">
                <span className="profile-label">Nom d'utilisateur:</span>
                <span className="profile-value">{user.username}</span>
              </div>
              <div className="profile-info-item">
                <span className="profile-label">Email:</span>
                <span className="profile-value">{user.email}</span>
              </div>
              <div className="profile-info-item">
                <span className="profile-label">Rôle:</span>
                <span className="profile-value capitalize">{user.role}</span>
              </div>
            </div>
            
            <button 
              className="profile-btn profile-btn-edit" 
              onClick={() => setEditMode(true)}
            >
              Modifier le profil
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Profile;