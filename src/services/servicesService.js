const getConnection = require('../database/mysql');

class ServicesService {

    async getServices(name, category) {
        let connection;
        try {
            connection = await getConnection();
            let query = `
                SELECT
                    s.id,
                    s.name,
                    s.description,
                    s.price,
                    sc.name AS category
                FROM services s
                JOIN service_categories sc ON s.category_id = sc.id
                WHERE s.deleted_at IS NULL
            `;
            const params = [];

            if (name) {
                query += ` AND s.name LIKE ?`;
                params.push(`%${name}%`);
            }

            if (category) {
                query += ` AND sc.name LIKE ?`;
                params.push(`%${category}%`);
            }

            query += ` ORDER BY s.id`;

            const [services] = await connection.query(query, params);
            return {
                message: 'Services retrieved successfully',
                data: services
            };
        } finally {
            if (connection) connection.release();
        }
    }

    async getServiceById(id) {
        let connection;
        try {
            connection = await getConnection();
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
        } finally {
            if (connection) connection.release();
        }
    }

    async getCategories() {
        let connection;
        try {
            connection = await getConnection();
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
        } finally {
            if (connection) connection.release();
        }
    }

    async postService(data) {
        let connection;
        try {
            connection = await getConnection();
            await connection.beginTransaction();

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
        } finally {
            if (connection) connection.release();
        }
    }

    async postCategory(data) {
        let connection;
        try {
            connection = await getConnection();
            await connection.beginTransaction();
    
            // 1. Check if a category with this name exists (active or soft-deleted)
            const [existingCategory] = await connection.query(
                `SELECT id, deleted_at FROM service_categories WHERE name = ?`,
                [data.name]
            );
    
            if (existingCategory.length > 0) {
                const category = existingCategory[0];
                if (category.deleted_at === null) {
                    // 2. Category is active, throw conflict error
                    const error = new Error('Category with this name already exists');
                    error.status = 409;
                    throw error;
                } else {
                    // 2a. Category is soft-deleted, so we "undelete" it
                    await connection.query(
                        `UPDATE service_categories 
                         SET deleted_at = NULL, deleted_by = NULL, updated_at = NOW(), updated_by = ? 
                         WHERE id = ?`,
                        [data.created_by, category.id]
                    );
                    await connection.commit();
                    return {
                        message: 'Category restored successfully',
                        data: { id: category.id, ...data }
                    };
                }
            }
    
            // 2b. Category does not exist, create a new one
            const [insertResult] = await connection.query(
                `INSERT INTO service_categories (name, created_at, created_by)
                 VALUES (?, NOW(), ?)`,
                [data.name, data.created_by]
            );
    
            await connection.commit();
            return {
                message: 'Category created successfully',
                data: { id: insertResult.insertId, ...data }
            };
        } catch (err) {
            await connection.rollback();
            throw err;
        } finally {
            if (connection) connection.release();
        }
    }

    async putCategory(id, data) {
        let connection;
        try {
            connection = await getConnection();
            await connection.beginTransaction();

            const [existingCategory] = await connection.query(
                `SELECT id FROM service_categories WHERE id = ? AND deleted_at IS NULL`,
                [id]
            );
            if (existingCategory.length === 0) {
                const error = new Error('Category not found');
                error.status = 404;
                throw error;
            }

            const [conflictCategory] = await connection.query(
                `SELECT id FROM service_categories WHERE name = ? AND id != ? AND deleted_at IS NULL`,
                [data.name, id]
            );
            if (conflictCategory.length > 0) {
                const error = new Error('Another category with this name already exists.');
                error.status = 409;
                throw error;
            }

            await connection.query(
                `UPDATE service_categories SET name = ?, updated_at = NOW(), updated_by = ? WHERE id = ?`,
                [data.name, data.updated_by, id]
            );

            await connection.commit();
            return { message: 'Category updated successfully', data: { id, ...data } };
        } catch (error) {
            await connection.rollback();
            throw error;
        } finally {
            if (connection) connection.release();
        }
    }

    async deleteCategory(id, data) {
        let connection;
        try {
            connection = await getConnection();
            await connection.beginTransaction();

            const [existingCategory] = await connection.query(
                `SELECT id FROM service_categories WHERE id = ? AND deleted_at IS NULL`,
                [id]
            );
            if (existingCategory.length === 0) {
                const error = new Error('Category not found');
                error.status = 404;
                throw error;
            }

            const [servicesUsingCategory] = await connection.query(
                `SELECT id FROM services WHERE category_id = ? AND deleted_at IS NULL`,
                [id]
            );
            if (servicesUsingCategory.length > 0) {
                const error = new Error('Cannot delete category because it is being used by one or more services.');
                error.status = 409;
                throw error;
            }

            await connection.query(
                `UPDATE service_categories SET deleted_at = NOW(), deleted_by = ? WHERE id = ?`,
                [data.deleted_by, id]
            );

            await connection.commit();
            return { message: 'Category deleted successfully' };
        } catch (error) {
            await connection.rollback();
            throw error;
        } finally {
            if (connection) connection.release();
        }
    }

    async putService(id, data) {
        let connection;
        try {
            connection = await getConnection();
            await connection.beginTransaction();

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
        } finally {
            if (connection) connection.release();
        }
    }

    async deleteService(id, data) {
        let connection;
        try {
            connection = await getConnection();
            await connection.beginTransaction();

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
        } finally {
            if (connection) connection.release();
        }
    }

    async getCategoryById(id) {
        let connection;
        try {
            connection = await getConnection();
            const query = `
                SELECT id, name 
                FROM service_categories 
                WHERE deleted_at IS NULL AND id = ?
            `;
            const [categoryResult] = await connection.query(query, [id]);
            const category = categoryResult[0];

            if (!category) {
                const error = new Error('Category not found');
                error.status = 404;
                throw error;
            }

            return { message: 'Category retrieved successfully', data: category };
        } finally {
            if (connection) connection.release();
        }
    }
}

module.exports = ServicesService;