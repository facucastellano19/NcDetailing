const getConnection = require('../database/mysql');

class ServicesService {

    async getServices() {
        const connection = await getConnection();
        const query = `
            SELECT 
                s.id, 
                s.name, 
                s.description, 
                s.price, 
                sc.name AS category
            FROM services s
            JOIN service_categories sc ON s.category_id = sc.id
            WHERE s.deleted_at IS NULL
            ORDER BY s.id
        `;
        const [services] = await connection.query(query);
        return {
            message: 'Services retrieved successfully',
            data: services
        };
    }

    async getServiceById(id) {
        const connection = await getConnection();
        const query = `
            SELECT 
                s.id, 
                s.category_id,
                s.name, 
                s.description, 
                s.price, 
                sc.name AS category_name
            FROM services s
            JOIN service_categories sc ON s.category_id = sc.id
            WHERE s.deleted_at IS NULL AND s.id = ?
        `;

        const [services] = await connection.query(query, [id]);
        const service = services[0];

        if (!service) {
            const error = new Error('Service not found');
            error.status = 404;
            throw error;
        }

        return {
            message: 'Service retrieved successfully',
            data: service
        };
    }

    async getCategories() {
        const connection = await getConnection();
        const query = `
            SELECT id, name
            FROM service_categories
            WHERE deleted_at IS NULL
            ORDER BY name
        `;
        const [categories] = await connection.query(query);
        return {
            message: 'Service categories retrieved successfully',
            data: categories
        };
    }

    async postService(data) {
        const connection = await getConnection();
        await connection.beginTransaction();

        try {

            const [existingService] = await connection.query(
                `SELECT id FROM services WHERE name = ? AND deleted_at IS NULL`,
                [data.name]
            );

            if (existingService.length > 0) {
                const error = new Error('Service with this name already exists');
                error.status = 409;
                throw error;
            }

            const [result] = await connection.query(
                `INSERT INTO services 
                 (category_id, name, description, price, created_by, created_at)
                 VALUES (?, ?, ?, ?, ?, NOW())`,
                [data.category_id, data.name, data.description, data.price, data.created_by]
            );

            await connection.commit();

            return {
                message: 'Service created successfully',
                data: { id: result.insertId, ...data }
            };

        } catch (err) {
            await connection.rollback();
            throw err;
        }
    }

    async putService(id, data) {
        const connection = await getConnection();
        await connection.beginTransaction();

        try {
            const [existingService] = await connection.query(
                `SELECT * FROM services WHERE id = ? AND deleted_at IS NULL`,
                [id]
            );

            if (!existingService[0]) {
                const error = new Error('Service not found');
                error.status = 404;
                throw error;
            }

            const service = existingService[0];


            const [conflictService] = await connection.query(
                `SELECT id FROM services WHERE name = ? AND id != ? AND deleted_at IS NULL`,
                [data.name ?? service.name, id]
            );

            if (conflictService.length > 0) {
                const error = new Error('Service with this name already exists');
                error.status = 409;
                throw error;
            }

            const [result] = await connection.query(
                `UPDATE services SET 
                 category_id = ?, 
                 name = ?, 
                 description = ?, 
                 price = ?, 
                 updated_by = ?, 
                 updated_at = NOW()
                 WHERE id = ? AND deleted_at IS NULL`,
                [
                    data.category_id ?? service.category_id,
                    data.name ?? service.name,
                    data.description ?? service.description,
                    data.price ?? service.price,
                    data.updated_by,
                    id
                ]
            );

            if (result.affectedRows === 0) {
                const error = new Error('Error while updating service');
                error.status = 500;
                throw error;
            }

            await connection.commit();

            return {
                message: 'Service updated successfully',
                data: { id, ...data }
            };

        } catch (err) {
            await connection.rollback();
            throw err;
        }
    }

    async deleteService(id, data) {
        const connection = await getConnection();
        await connection.beginTransaction();

        try {
            const [existingService] = await connection.query(
                `SELECT id FROM services WHERE id = ? AND deleted_at IS NULL`,
                [id]
            );

            if (!existingService[0]) {
                const error = new Error('Service not found');
                error.status = 404;
                throw error;
            }

            const [result] = await connection.query(
                `UPDATE services SET deleted_at = NOW(), deleted_by = ? WHERE id = ? AND deleted_at IS NULL`,
                [data.deleted_by, id]
            );

            if (result.affectedRows === 0) {
                const error = new Error('Error while deleting service');
                error.status = 500;
                throw error;
            }

            await connection.commit();

            return {
                id,
                message: 'Service deleted successfully',
                deleted_by: data.deleted_by
            };

        } catch (err) {
            await connection.rollback();
            throw err;
        }
    }
}

module.exports = ServicesService;