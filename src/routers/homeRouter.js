const express = require('express');
const { getHomeDashboard } = require('../controllers/homeController');
const { checkRole } = require('../middlewares/secure');

const homeRouter = express.Router();
homeRouter.get('/', checkRole(1, 2), getHomeDashboard);

module.exports = homeRouter;
