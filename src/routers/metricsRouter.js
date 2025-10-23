const express = require('express');
const metricsRouter = express.Router();
const {getDashboardMetrics} = require('../controllers/metricsController');
const { checkRole } = require('../middlewares/secure');

metricsRouter.get('/',
    checkRole(1),
    getDashboardMetrics
);

module.exports = metricsRouter;
