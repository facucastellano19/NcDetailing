const auditLogService = require('../services/auditLogService');

async function getAuditLogs(req, res, next) {
    try {
        // Pass all query parameters to the service for filtering
        const logs = await auditLogService.getLogs(req.query);
        res.json(logs);
    } catch (error) {
        next(error);
    }
}

module.exports = {
    getAuditLogs
};