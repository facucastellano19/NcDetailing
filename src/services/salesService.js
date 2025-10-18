const getConnection = require('../database/mysql');

class SalesService {

    async getSalesProducts(params = {}) {
        let connection;
        try {
            connection = await getConnection();
            const { clientName, startDate, endDate, paymentStatusId } = params;

            let query = `
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
                  AND s.deleted_at IS NULL`;

            const queryParams = [];

            if (clientName) {
                query += ` AND CONCAT(c.first_name, ' ', c.last_name) LIKE ?`;
                queryParams.push(`%${clientName}%`);
            }

            if (startDate) {
                query += ` AND s.created_at >= ?`;
                queryParams.push(startDate);
            }

            if (endDate) {
                query += ` AND s.created_at <= ?`;
                queryParams.push(`${endDate} 23:59:59`); // Include the whole day
            }

            if (paymentStatusId) {
                query += ` AND s.payment_status_id = ?`;
                queryParams.push(paymentStatusId);
            }

            query += ` ORDER BY s.created_at DESC, s.id DESC`;

            const [salesProducts] = await connection.query(query, queryParams);

            const salesMap = new Map();

            salesProducts.forEach(row => {
                if (!salesMap.has(row.sale_id)) {
                    salesMap.set(row.sale_id, {
                        sale_id: row.sale_id,
                        client_name: row.client_name,
                        sale_total: row.sale_total,
                        payment_method: row.payment_method,
                        payment_status: row.payment_status,
                        created_at: row.created_at,
                        products: []
                    });
                }

                salesMap.get(row.sale_id).products.push({
                    product_id: row.product_id,
                    product_name: row.product_name,
                    quantity: row.quantity,
                    price: row.price,
                    subtotal: row.subtotal
                });
            });

            return {
                message: 'Sales products retrieved successfully',
                data: Array.from(salesMap.values())
            };
        } finally {
            if (connection) {
                connection.release(); // Release connection back to the pool
            }
        }
    }

    async postSaleProducts(data) {
        let connection;
        try {
            connection = await getConnection();
            await connection.beginTransaction();

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

            // Validate all products and stock in a single query
            const productIds = data.products.map(p => p.product_id);
            if (productIds.length === 0) {
                const error = new Error('The sale must contain at least one product.');
                error.status = 400;
                throw error;
            }

            const placeholders = productIds.map(() => '?').join(','); // Creates ?,?,?
            const [productRows] = await connection.query(
                `SELECT id, price, stock, name FROM products WHERE id IN (${placeholders}) AND deleted_at IS NULL`,
                productIds
            );

            // Create a map for easy lookup
            const productMap = new Map(productRows.map(p => [p.id, p]));

            let total = 0;
            for (const item of data.products) {
                const product = productMap.get(item.product_id);

                if (!product) {
                    const error = new Error(`Product with ID ${item.product_id} not found or is deleted.`);
                    error.status = 404;
                    throw error;
                }

                if (product.stock < item.quantity) {
                    const error = new Error(`Insufficient stock for product "${product.name}" (ID: ${product.id}). Available: ${product.stock}, Requested: ${item.quantity}.`);
                    error.status = 400;
                    throw error;
                }

                total += product.price * item.quantity;
            }

            // Insert sale into sales table
            const [saleResult] = await connection.query(
                `INSERT INTO sales (client_id, vehicle_id, sale_type_id, payment_status_id, payment_method_id, total, observations, created_by, created_at)
                 VALUES (?, ?, 2, ?, ?, ?, ?, ?, NOW())`,
                [
                    data.client_id,
                    data.vehicle_id || null, // Correctly handles optional vehicle_id
                    data.payment_status_id || 1, // Defaults to 1 ('Pendiente') if not provided
                    data.payment_method_id,
                    total,
                    data.observations || null,
                    data.created_by
                ]
            );
            const saleId = saleResult.insertId;

            // Insert sold products and update stock in a loop
            for (const item of data.products) {
                const product = productMap.get(item.product_id);

                // Insert into sale_products
                await connection.query(
                    `INSERT INTO sale_products (sale_id, product_id, quantity, price, created_by, created_at) VALUES (?, ?, ?, ?, ?, NOW())`,
                    [saleId, item.product_id, item.quantity, product.price, data.created_by]
                );

                // Reduce stock from products table
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
            if (connection) await connection.rollback(); // Rollback transaction on error
            throw err;
        } finally {
            if (connection) {
                connection.release(); // Always release connection
            }
        }
    }
}

module.exports = SalesService;
