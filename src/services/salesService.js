const getConnection = require('../database/mysql');

class SalesService {

    async getSalesProducts() {
        const connection = await getConnection();

        const [salesProducts] = await connection.query(`
        SELECT 
            s.id AS sale_id,
            CONCAT(c.first_name, ' ', c.last_name) AS client_name,
            p.id AS product_id,
            p.name AS product_name,
            sp.quantity,
            sp.price,
            sp.subtotal,
            s.total AS sale_total,
            pm.name AS payment_method,
            ps.name AS payment_status,
            s.created_at
        FROM sales s
        JOIN clients c ON s.client_id = c.id
        JOIN sale_products sp ON sp.sale_id = s.id
        JOIN products p ON p.id = sp.product_id
        JOIN payment_methods pm ON s.payment_method_id = pm.id
        JOIN payment_status ps ON s.payment_status_id = ps.id
        WHERE s.sale_type_id = 2
          AND s.deleted_at IS NULL
        ORDER BY s.created_at DESC, s.id DESC
    `);

        return {
            message: 'Sales products retrieved successfully',
            data: salesProducts
        };
    }


    async postSaleProducts(data) {
        const connection = await getConnection();
        await connection.beginTransaction();

        try {
            
            // Validate that the client exists
            const [client] = await connection.query(
                `SELECT id FROM clients WHERE id = ?`,
                [data.client_id]
            );
            if (client.length === 0) {
                const error = new Error('Client not found');
                error.status = 404;
                throw error;
            }

            // Calculate sale total and validate stock
            let total = 0;
            for (const item of data.products) {
                const [productRows] = await connection.query(
                    `SELECT id, price, stock FROM products WHERE id = ? AND deleted_at IS NULL`,
                    [item.product_id]
                );
                if (productRows.length === 0) {
                    const error = new Error(`Product with id ${item.product_id} not found`);
                    error.status = 404;
                    throw error;
                }

                const product = productRows[0];
                if (product.stock < item.quantity) {
                    const error = new Error(`Insufficient stock for product ${product.id}`);
                    error.status = 400;
                    throw error;
                }

                total += product.price * item.quantity;
            }

            // Insert sale into sales table
            const [saleResult] = await connection.query(
                `INSERT INTO sales
                 (client_id, vehicle_id, sale_type_id, service_status_id, payment_status_id, payment_method_id, total, observations, created_by, created_at)
                 VALUES (?, ?, 2, 1, ?, ?, ?, ?, ?, NOW())`,
                [
                    data.client_id,
                    data.vehicle_id || null,
                    data.payment_status_id,
                    data.payment_method_id,
                    total,
                    data.observations || null,
                    data.created_by
                ]
            );
            const saleId = saleResult.insertId;

            // Insert sold products and update stock
            for (const item of data.products) {
                const [productRows] = await connection.query(
                    `SELECT price, stock FROM products WHERE id = ?`,
                    [item.product_id]
                );
                const product = productRows[0];

                await connection.query(
                    `INSERT INTO sale_products (sale_id, product_id, quantity, price, created_by, created_at)
                     VALUES (?, ?, ?, ?, ?, NOW())`,
                    [saleId, item.product_id, item.quantity, product.price, data.created_by]
                );

                // Reduce stock
                await connection.query(
                    `UPDATE products SET stock = stock - ? WHERE id = ?`,
                    [item.quantity, item.product_id]
                );
            }

            await connection.commit();

            return {
                message: 'Sale of products created successfully',
                data: { sale_id: saleId, ...data, total }
            };

        } catch (err) {
            await connection.rollback();
            throw err;
        }
    }
}

module.exports = SalesService;
