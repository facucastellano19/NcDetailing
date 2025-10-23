const MetricsService = require('../services/metricsService');
const metricsService = new MetricsService();

const getDashboardMetrics = async (req, res, next) => {
  try {
    const result = await metricsService.getDashboardMetrics(req.query);
    res.json(result);
  } catch (error) {
    next(error); // Pass the error to the global error handling middleware
  }
};

module.exports = { getDashboardMetrics };
