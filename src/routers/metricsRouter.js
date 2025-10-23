const express = require('express');
const { getDashboardMetrics } = require('../controllers/metricsController');
const { checkRole } = require('../middlewares/secure');
const { validatorHandler } = require('../middlewares/validatorHandler');
const { getDashboardMetricsSchema } = require('../schemas/metricsSchema');

const router = express.Router();

router.get('/dashboard', 
    checkRole(1, 2), // Allow both admin and employee
    validatorHandler(getDashboardMetricsSchema, 'query'),
    getDashboardMetrics);

module.exports = router;
