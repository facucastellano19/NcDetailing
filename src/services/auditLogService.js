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

    /**
     * Retrieves logs from the audit_log table with filtering options.
     * @param {object} filters - The filtering options.
     * @param {number} [filters.userId] - Filter by user ID.
     * @param {string} [filters.username] - Filter by username (partial match).
     * @param {string} [filters.actionType] - Filter by action type.
     * @param {string} [filters.entityType] - Filter by entity type.
     * @param {string} [filters.startDate] - Start date for filtering (YYYY-MM-DD).
     * @param {string} [filters.endDate] - End date for filtering (YYYY-MM-DD).
     */
    async getLogs(filters = {}) {
        let connection;
        try {
            connection = await getConnection();
            let query = `SELECT id, user_id, username, action_type, entity_type, entity_id, changes, status, error_message, ip_address, created_at FROM audit_log WHERE 1=1`;
            const queryParams = [];

            if (filters.userId) {
                query += ' AND user_id = ?';
                queryParams.push(filters.userId);
            }
            if (filters.username) {
                query += ' AND username LIKE ?';
                queryParams.push(`%${filters.username}%`);
            }
            if (filters.actionType) {
                query += ' AND action_type = ?';
                queryParams.push(filters.actionType);
            }
            if (filters.entityType) {
                query += ' AND entity_type = ?';
                queryParams.push(filters.entityType);
            }
            if (filters.startDate) {
                query += ' AND created_at >= ?';
                queryParams.push(filters.startDate);
            }
            if (filters.endDate) {
                query += ' AND created_at <= ?';
                queryParams.push(`${filters.endDate} 23:59:59`);
            }

            query += ' ORDER BY created_at DESC LIMIT 1000'; // Add a limit to prevent overwhelming responses

            const [logs] = await connection.query(query, queryParams);
            return { message: 'Audit logs retrieved successfully', data: logs };
        } finally {
            if (connection) connection.release();
        }
    }
}

module.exports = new AuditLogService();