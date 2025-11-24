const getConnection = require('../database/mysql');

class AuditLogService {
    /**
     * Logs an action to the audit_log table.
     * @param {object} logData - The data to log.
     * @param {number} logData.userId - The ID of the user performing the action.
     * @param {string} [logData.username] - The username of the user.
     * @param {string} logData.actionType - The type of action (CREATE, UPDATE, DELETE, etc.).
     * @param {string} logData.entityType - The type of entity being affected (e.g., 'product').
     * @param {number} logData.entityId - The ID of the entity.
     * @param {object} [logData.changes] - An object detailing the changes ({ oldValue, newValue }).
     * @param {string} [logData.status='SUCCESS'] - The status of the operation.
     * @param {string} [logData.errorMessage] - The error message if the status is 'FAILURE'.
     * @param {string} [logData.ipAddress] - The IP address of the user.
     */
    async log(logData) {
        let connection;
        try {
            const {
                userId,
                username = null,
                actionType,
                entityType,
                entityId,
                changes = null,
                status = 'SUCCESS',
                errorMessage = null,
                ipAddress = null
            } = logData;

            connection = await getConnection();
            const query = `
                INSERT INTO audit_log (user_id, username, action_type, entity_type, entity_id, changes, status, error_message, ip_address)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            `;
            // Convert changes object to a JSON string for storing
            const changesJson = changes ? JSON.stringify(changes) : null;
            await connection.query(query, [userId, username, actionType, entityType, entityId, changesJson, status, errorMessage, ipAddress]);
        } catch (error) {
            console.error('Failed to write to audit log:', error);
        } finally {
            if (connection) connection.release();
        }
    }
}

module.exports = new AuditLogService();