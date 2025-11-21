const usersService = require('../services/usersService.js');
const service = new usersService();
const getConnection = require('../database/mysql');
const bcrypt = require('bcrypt')
const auditLogService = require('./auditLogService');

class EmployeesService {

    async getEmployees() {
        let connection;
        try {
            connection = await getConnection();
            const query = `
                SELECT id, name, username, email
                FROM users where deleted_at IS NULL AND role_id = 2`
            const [employees] = await connection.query(query);
            return {
                message: 'Employees retrieved successfully',
                data: employees
            }
        } finally {
            if (connection) connection.release();
        }
    }

    async getEmployeeById(id) {
        let connection;
        try {
            connection = await getConnection();
            const query = `SELECT id, name, username, email
                FROM users where deleted_at IS NULL AND role_id = 2 AND id = ?`

            const [employees] = await connection.query(query, [id]);
            const employee = employees[0]

            if (!employee) {
                const error = new Error('Employee not found');
                error.status = 404;
                throw error;
            }

            return {
                message: 'Employee retrieved successfully',
                data: employee
            };
        } finally {
            if (connection) connection.release();
        }
    }

    async postEmployee(data) {
        const newEmployee = await service.register(data);

        return {
            message: 'Employee created successfully',
            data: newEmployee
        };
    }

    async putEmployee(id, data) {
        let connection;
        let oldEmployeeData = null;
        try {
            connection = await getConnection();
            const queryEmployeExists = `SELECT id, name, username, email, role_id, password
                FROM users where deleted_at IS NULL AND role_id = 2 AND id = ?`

            const [employees] = await connection.query(queryEmployeExists, [id]);

            if (!employees[0]) {
                const error = new Error('Employee not found');
                error.status = 404;
                throw error;
            }

            const employee = employees[0];
            // Clone the employee data for the audit log, but remove the password
            oldEmployeeData = { ...employees[0] };
            delete oldEmployeeData.password;

            const {
                name = employee.name,
                username = employee.username,
                email = employee.email,
                password,
                updated_by = employee.updated_by,
                role_id = employee.role_id
            } = data;

            let finalPassword = password

            if (password && password !== '') {
                finalPassword = await bcrypt.hash(password, 10);
            } else {
                finalPassword = employee.password;
            }

            const query = `UPDATE users SET name = ?, username = ?, email = ?, password = ?, updated_by = ?, updated_at = NOW(), role_id = ? WHERE id = ?`;

            const [result] = await connection.query(query, [name, username, email, finalPassword, updated_by, role_id, id]);

            if (result.affectedRows === 0) {
                const error = new Error('Error while updating employee');
                error.status = 500;
                throw error;
            }

            // Get the full new state of the employee for auditing (excluding password)
            const [newEmployeeDataResult] = await connection.query(
                `SELECT id, name, username, email, role_id, updated_at, updated_by FROM users WHERE id = ?`, 
                [id]
            );
            const newEmployeeData = newEmployeeDataResult[0];

            // Audit Log for success
            await auditLogService.log({
                userId: data.updated_by,
                actionType: 'UPDATE',
                entityType: 'employee',
                entityId: id,
                changes: { oldValue: oldEmployeeData, newValue: newEmployeeData },
                ipAddress: data.ipAddress
            });

            return {
                message: 'Employee updated successfully',
                data: { id, name, username, email }
            };
        } catch (error) {
            // Audit Log for failure
            await auditLogService.log({
                userId: data.updated_by,
                actionType: 'UPDATE',
                entityType: 'employee',
                entityId: id,
                ipAddress: data.ipAddress,
                status: 'FAILURE',
                errorMessage: error.message
            });
            throw error;
        } finally {
            if (connection) connection.release();
        }
    }

    async deleteEmployee(id, data) {
        let connection;
        let oldEmployeeData = null;
        try {
            connection = await getConnection();
            const queryEmployeExists = `SELECT *
                FROM users where deleted_at IS NULL AND role_id = 2 AND id = ?`

            const [employees] = await connection.query(queryEmployeExists, [id]);

            oldEmployeeData = employees[0];
            if (!employees[0]) {
                const error = new Error('Employee not found');
                error.status = 404;
                throw error;
            }

            const queryDelete = `UPDATE users SET deleted_at = NOW(), deleted_by = ? WHERE id = ? AND role_id = 2 AND deleted_at IS NULL`;

            const [result] = await connection.query(queryDelete, [data.deleted_by, id]);

            if (result.affectedRows === 0) {
                const error = new Error('Error while deleting employee');
                error.status = 500;
                throw error;
            }

            // Audit Log for success
            await auditLogService.log({
                userId: data.deleted_by,
                actionType: 'DELETE',
                entityType: 'employee',
                entityId: id,
                ipAddress: data.ipAddress,
                changes: { oldValue: oldEmployeeData }
            });

            return {
                id,
                message: 'Employee deleted successfully',
                deleted_by: data.deleted_by
            }
        } catch (error) {
            // Audit Log for failure
            await auditLogService.log({
                userId: data.deleted_by,
                actionType: 'DELETE',
                entityType: 'employee',
                entityId: id,
                ipAddress: data.ipAddress,
                status: 'FAILURE',
                errorMessage: error.message
            });
            throw error;
        } finally {
            if (connection) connection.release();
        }
    }
}

module.exports = EmployeesService;