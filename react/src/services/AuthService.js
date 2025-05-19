// src/services/AuthService.js
export default class AuthService {
    static getAuthHeader() {
      const token = localStorage.getItem('token');
      return {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      };
    }
  
    static isAuthenticated() {
      return !!localStorage.getItem('token');
    }
  
    static async refreshToken() {
      try {
        const response = await fetch('http://localhost:3000/api/auth/refresh-token', {
          method: 'POST',
          headers: this.getAuthHeader()
        });
        
        if (response.ok) {
          const data = await response.json();
          if (data.token) {
            localStorage.setItem('token', data.token);
          }
          return data;
        }
        throw new Error('Failed to refresh token');
      } catch (error) {
        throw error;
      }
    }
  }