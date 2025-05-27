module.exports = {
    secret: process.env.JWT_SECRET || 'votre_secret_key_ultra_securise',
    options: {
      expiresIn: '7d'
    }
  };
   