const getConnection = require('../database/mysql');

class ProductsService {

    #calculateLowStock(product) {
        return product.stock <= product.min_stock;
    }

    async getProducts(params) {
        const connection = await getConnection();
        let query = `
            SELECT p.id, p.name, p.description, p.price, p.stock, p.min_stock, pc.name as category
            FROM products p
            INNER JOIN product_categories pc ON p.category_id = pc.id
            WHERE p.deleted_at IS NULL
        `;
        const queryParams = [];

        if (params.category_id) {
            query += ` AND p.category_id = ?`;
            queryParams.push(params.category_id);
        }

        if (params.name) {
            query += ` AND p.name LIKE ?`;
            queryParams.push(`%${params.name}%`);
        }

        query += ` ORDER BY p.name`;

        const [products] = await connection.query(query, queryParams);

        // Map products to include lowStock property using private method
        const productsWithStockStatus = products.map(p => ({
            ...p,
            lowStock: this.#calculateLowStock(p)
        }));

        return {
            message: 'Products retrieved successfully',
            data: productsWithStockStatus
        };
    }

    // Get a single product by ID with category and low stock status
    async getProductById(id) {
        const connection = await getConnection();
        const query = `
            SELECT p.id, p.name, p.description, p.price, p.stock, p.min_stock, pc.name as category
            FROM products p
            INNER JOIN product_categories pc ON p.category_id = pc.id
            WHERE p.deleted_at IS NULL AND p.id = ?
        `;
        const [productQueryResult] = await connection.query(query, [id]);
        const product = productQueryResult[0];

        if (!product) {
            const error = new Error('Product not found');
            error.status = 404;
            throw error;
        }

        const productWithStockStatus = {
            ...product,
            lowStock: this.#calculateLowStock(product)
        };

        return {
            message: 'Product retrieved successfully',
            data: productWithStockStatus
        };
    }

    async postProduct(data) {
        const connection = await getConnection();
        await connection.beginTransaction();

        try {
            // Check if product with same name already exists
            const [existingProducts] = await connection.query(
                `SELECT id FROM products WHERE name = ? AND deleted_at IS NULL`,
                [data.name]
            );
            if (existingProducts.length > 0) {
                const error = new Error('Product with this name already exists');
                error.status = 400;
                throw error;
            }

            // Check if category exists
            const [existingCategories] = await connection.query(
                `SELECT id FROM product_categories WHERE id = ? AND deleted_at IS NULL`,
                [data.category_id]
            );
            if (existingCategories.length === 0) {
                const error = new Error('Category not found');
                error.status = 400;
                throw error;
            }

            // Insert new product
            const [result] = await connection.query(
                `INSERT INTO products (name, description, price, stock, min_stock, category_id, created_at, created_by)
                 VALUES (?, ?, ?, ?, ?, ?, NOW(), ?)`,
                [data.name, data.description, data.price, data.stock, data.min_stock, data.category_id, data.created_by]
            );

            await connection.commit();

            return {
                message: 'Product created successfully',
                data: { id: result.insertId, ...data }
            };
        } catch (error) {
            await connection.rollback();
            throw error;
        }
    }

    // Update an existing product
    async putProduct(id, data) {
        const connection = await getConnection();
        await connection.beginTransaction();

        try {
            // Check if product exists
            const [existingProducts] = await connection.query(
                `SELECT * FROM products WHERE deleted_at IS NULL AND id = ?`,
                [id]
            );
            if (!existingProducts[0]) {
                const error = new Error('Product not found');
                error.status = 404;
                throw error;
            }
            const product = existingProducts[0];

            // Check if category exists 
            if (data.category_id) {
                const [existingCategories] = await connection.query(
                    `SELECT id FROM product_categories WHERE id = ? AND deleted_at IS NULL`,
                    [data.category_id]
                );
                if (existingCategories.length === 0) {
                    const error = new Error('Category not found');
                    error.status = 400;
                    throw error;
                }
            }

            // Update product
            await connection.query(
                `UPDATE products
                 SET name = ?, description = ?, price = ?, stock = ?, category_id = ?, updated_by = ?, updated_at = NOW()
                 WHERE id = ?`,
                [
                    data.name ?? product.name,
                    data.description ?? product.description,
                    data.price ?? product.price,
                    data.stock ?? product.stock,
                    data.category_id ?? product.category_id,
                    data.updated_by ?? product.updated_by,
                    id
                ]
            );

            await connection.commit();

            const updatedProduct = {
                id,
                name: data.name ?? product.name,
                description: data.description ?? product.description,
                price: data.price ?? product.price,
                stock: data.stock ?? product.stock,
                category_id: data.category_id ?? product.category_id,
                updated_by: data.updated_by ?? product.updated_by
            };

            return {
                message: 'Product updated successfully',
                data: updatedProduct
            };
        } catch (error) {
            await connection.rollback();
            throw error;
        }
    }

    async updateMinStock(id, min_stock, updated_by) {
        const connection = await getConnection();
        await connection.beginTransaction();

        try {
            // Check if product exists
            const [existingProducts] = await connection.query(
                `SELECT id FROM products WHERE deleted_at IS NULL AND id = ?`,
                [id]
            );
            if (!existingProducts[0]) {
                const error = new Error('Product not found');
                error.status = 404;
                throw error;
            }

            // Update min_stock
            await connection.query(
                `UPDATE products
                 SET min_stock = ?, updated_by = ?, updated_at = NOW()
                 WHERE id = ?`,
                [min_stock, updated_by, id]
            );

            await connection.commit();

            return {
                message: 'Product min_stock updated successfully',
                data: { id, min_stock, updated_by }
            };
        } catch (error) {
            await connection.rollback();
            throw error;
        }
    }

    async deleteProduct(id, data) {
        const connection = await getConnection();
        await connection.beginTransaction();

        try {
            const [existingProducts] = await connection.query(
                `SELECT id, name FROM products WHERE deleted_at IS NULL AND id = ?`,
                [id]
            );
            const product = existingProducts[0];
            if (!product) {
                const error = new Error('Product not found');
                error.status = 404;
                throw error;
            }

            // Soft delete
            await connection.query(
                `UPDATE products SET deleted_by = ?, deleted_at = NOW() WHERE id = ?`,
                [data.deleted_by, id]
            );

            await connection.commit();

            return {
                message: 'Product deleted successfully',
                data: { id, name: product.name }
            };
        } catch (error) {
            await connection.rollback();
            throw error;
        }
    }

    async postCategory(data) {
        const connection = await getConnection();
        await connection.beginTransaction();

        try {
            const [existingCategory] = await connection.query(
                `SELECT id FROM product_categories WHERE name = ? AND deleted_at IS NULL`,
                [data.name]
            );

            if (existingCategory.length > 0) {
                const error = new Error('Category with this name already exists');
                error.status = 400;
                throw error;
            }

            const [result] = await connection.query(
                `INSERT INTO product_categories (name, created_at, created_by)
                 VALUES (?, NOW(), ?)`,
                [data.name, data.created_by]
            );

            await connection.commit();

            return {
                message: 'Category created successfully',
                data: { id: result.insertId, ...data }
            };

        } catch (error) {
            await connection.rollback();
            throw error;
        }
    }

    async getCategories() {
        const connection = await getConnection();
        const [categories] = await connection.query(
            `SELECT id, name FROM product_categories WHERE deleted_at IS NULL ORDER BY name`
        );
        return {
            message: 'Categories retrieved successfully',
            data: categories
        };
    }

}


module.exports = ProductsService;
