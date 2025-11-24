const express = require('express');
const { getAuditLogs } = require('../controllers/auditLogController');
const { checkRole } = require('../middlewares/secure');

const auditLogRouter = express.Router();
auditLogRouter.use(express.json());

auditLogRouter.get('/',
    checkRole(1), // Only admins can access
    getAuditLogs
);

module.exports = auditLogRouter;