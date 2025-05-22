const mongoose = require('mongoose');

const connectDB = async () => {
  try {
     await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/Nouvelair', {

      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log('MongoDB connecté avec succès');
  } catch (error) {
    console.error('Erreur de connexion à MongoDB :', error.message);
    process.exit(1);
  }
};

module.exports = connectDB;