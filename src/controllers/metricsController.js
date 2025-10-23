const MetricsService = require('../services/metricsService.js');
const service = new MetricsService();

async function getDashboardMetrics(req, res, next) {
    try {
        const { filter, startDate, endDate } = req.query; // Get filter and date range from query params
        const metrics = await service.getDashboardMetrics({ filter, startDate, endDate });
        res.json(metrics);
    } catch (err) {
        next(err);
    }
}

module.exports = { getDashboardMetrics }
