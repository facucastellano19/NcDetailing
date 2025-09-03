const getConnection = require('../database/mysql');
const bcrypt = require('bcrypt');
const { sign } = require('../utils/jwt');

class UsersService {

    async login(data) {
        let connection;
        try {
            connection = await getConnection();
            const query = `
                SELECT id, name, role_id, username, password 
                FROM users 
                WHERE username = ? AND deleted_at IS NULL 
                LIMIT 1
            `;

            const [users] = await connection.query(query, [data.username]);

            if (!users[0]) {
                const error = new Error("User not found");
                error.status = 404;
                throw error;
            }

            const { id, name, username, role_id, password } = users[0];
            const isValid = await bcrypt.compare(data.password, password);

            if (!isValid) {
                const error = new Error("Invalid credentials");
                error.status = 401;
                throw error;
            }

            const token = sign({ id, name, username, role_id }, { expiresIn: "1h" });

            return { login: true, token };

        } finally {
            if (connection) {
                connection.release();
            }
        }
    }

    async register(data) {
        let connection;
        try {
            connection = await getConnection();
            const [userExists] = await connection.query(
                "SELECT EXISTS(SELECT 1 FROM users WHERE username = ? AND deleted_at IS NULL) AS exist",
                [data.username]
            );

            if (userExists[0].exist) {
                const error = new Error("Username already taken");
                error.status = 409;
                throw error;
            }

            const hashedPassword = await bcrypt.hash(data.password, 10);

            const query = `
            INSERT INTO users (name, email, username, password, role_id, created_at, created_by)
            VALUES (?, ?, ?, ?, ?, NOW(), ?)
        `;
            const [result] = await connection.query(query, [
                data.name,
                data.email,
                data.username,
                hashedPassword,
                data.role_id,
                data.created_by
            ]);

            return {
                id: result.insertId,
                name: data.name,
                email: data.email,
                username: data.username,
                role_id: data.role_id,
                created_by: data.created_by
            };
        } catch (error) {
            error.status = error.status || 500;
            error.message = "Error registering user: " + error.message;
            throw error;
        } finally {
            if (connection) {
                connection.release();
            }
        }
    }

    async isFirstUser() {
        let connection;
        try {
            connection = await getConnection();
            const [rows] = await connection.query("SELECT COUNT(*) AS count FROM users");
            return rows[0].count === 0;
        } catch (error) {
            console.error("Error checking if is first user:", error);
            return false;
        } finally {
            if (connection) {
                connection.release();
            }
        }
    }
}

module.exports = UsersService;
