// middlewares/normalizeCarbonEmission.js

const normalizeCarbonEmission = (req, res, next) => {
    if (req.body["Carbon Emission (kg)"] && !req.body.CarbonEmission) {
      req.body.CarbonEmission = req.body["Carbon Emission (kg)"];
    }
  
    // Traitement en bulk
    if (Array.isArray(req.body.fuels)) {
      req.body.fuels = req.body.fuels.map(fuel => ({
        ...fuel,
        CarbonEmission: fuel.CarbonEmission || fuel["Carbon Emission (kg)"] || 0
      }));
    }
  
    next();
  };
  
  module.exports = normalizeCarbonEmission;
  