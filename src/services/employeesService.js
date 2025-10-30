const usersService = require('../services/usersService.js');
const service = new usersService();
const getConnection = require('../database/mysql');
const bcrypt = require('bcrypt')

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
        try {
            connection = await getConnection();
            const queryEmployeExists = `SELECT id, name, username, email, password,role_id
                FROM users where deleted_at IS NULL AND role_id = 2 AND id = ?`

            const [employees] = await connection.query(queryEmployeExists, [id]);

            if (!employees[0]) {
                const error = new Error('Employee not found');
                error.status = 404;
                throw error;
            }

            const employee = employees[0];

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

            return {
                message: 'Employee updated successfully',
                data: { id, name, username, email }
            };
        } finally {
            if (connection) connection.release();
        }
    }

    async deleteEmployee(id, data) {
        let connection;
        try {
            connection = await getConnection();
            const queryEmployeExists = `SELECT id
                FROM users where deleted_at IS NULL AND role_id = 2 AND id = ?`

            const [employees] = await connection.query(queryEmployeExists, [id]);

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

            return {
                id,
                message: 'Employee deleted successfully',
                deleted_by: data.deleted_by
            }
        } finally {
            if (connection) connection.release();
        }
    }
}

module.exports = EmployeesService;