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
                connection.release(); 
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
                    null, // A product sale never has a vehicle_id
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
            if (connection) await connection.rollback(); 
            throw err;
        } finally {
            if (connection) {
                connection.release(); 
            }
        }
    }

    async getSalesServices(params = {}) {
        let connection;
        try {
            connection = await getConnection();
            const { clientName, startDate, endDate, paymentStatusId } = params;

            let query = `
            SELECT 
                s.id AS sale_id,
                CONCAT(c.first_name, ' ', c.last_name) AS client_name,
                sv.id AS service_id,
                sv.name AS service_name,
                ss.price,
                s.total AS sale_total,
                pm.name AS payment_method,
                ps.name AS payment_status,
                s.created_at
            FROM sales s
            JOIN clients c ON s.client_id = c.id
            JOIN sale_services ss ON ss.sale_id = s.id
            JOIN services sv ON sv.id = ss.service_id
            JOIN payment_methods pm ON s.payment_method_id = pm.id
            JOIN payment_status ps ON s.payment_status_id = ps.id
            WHERE s.sale_type_id = 1
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
                queryParams.push(`${endDate} 23:59:59`);
            }

            if (paymentStatusId) {
                query += ` AND s.payment_status_id = ?`;
                queryParams.push(paymentStatusId);
            }

            query += ` ORDER BY s.created_at DESC, s.id DESC`;

            const [salesServices] = await connection.query(query, queryParams);

            const salesMap = new Map();

            salesServices.forEach(row => {
                if (!salesMap.has(row.sale_id)) {
                    salesMap.set(row.sale_id, {
                        sale_id: row.sale_id,
                        client_name: row.client_name,
                        sale_total: row.sale_total,
                        payment_method: row.payment_method,
                        payment_status: row.payment_status,
                        created_at: row.created_at,
                        services: []
                    });
                }

                salesMap.get(row.sale_id).services.push({
                    service_id: row.service_id,
                    service_name: row.service_name,
                    price: row.price
                });
            });

            return {
                message: 'Sales services retrieved successfully',
                data: Array.from(salesMap.values())
            };
        } finally {
            if (connection) connection.release();
        }
    }

    async postSalesServices(data) {
        let connection;
        try {
            connection = await getConnection();
            await connection.beginTransaction();

            const {
                client_id,
                vehicle_id,
                payment_method_id,
                payment_status_id,
                observations,
                services,
                created_by
            } = data;

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

            // Validate vehicle_id exists for the client
            const [vehicles] = await connection.query(
                `SELECT id FROM vehicles WHERE id = ? AND client_id = ? AND deleted_at IS NULL`,
                [vehicle_id, client_id]
            );

            if (vehicles.length === 0) {
                const error = new Error('Selected vehicle is not valid for this client.');
                error.status = 400;
                throw error;
            }

            // Validate all services exist and get their real prices from DB
            const serviceIds = services.map(s => s.service_id);
            if (serviceIds.length === 0) {
                const error = new Error('The sale must contain at least one service.');
                error.status = 400;
                throw error;
            }

            const placeholders = serviceIds.map(() => '?').join(',');
            const [serviceRows] = await connection.query(
                `SELECT id, price FROM services WHERE id IN (${placeholders}) AND deleted_at IS NULL`,
                serviceIds
            );

            // Check if any service was not found
            if (serviceRows.length !== serviceIds.length) {
                const error = new Error('One or more services were not found or are deleted.');
                error.status = 404;
                throw error;
            }

            // Create a map of real prices and calculate the total
            const servicePriceMap = new Map(serviceRows.map(s => [s.id, parseFloat(s.price)]));
            let total = 0;
            for (const { service_id } of services) {
                total += servicePriceMap.get(service_id);
            }

            // Insert the main sale record with the correct total
            const [saleResult] = await connection.query(
                `INSERT INTO sales (
                client_id, vehicle_id, sale_type_id, 
                service_status_id, payment_status_id,
                payment_method_id, total, observations, created_at, created_by) 
                VALUES (?, ?, 1, 1, ?, ?, ?, ?, NOW(), ?)`,
                [
                    client_id,
                    vehicle_id,
                    payment_status_id || 1, // Default to 'Pendiente'
                    payment_method_id,
                    total,
                    observations || null,
                    created_by || null
                ]
            );

            const saleId = saleResult.insertId;

            // Insert each service into the sale_services table using the real price
            for (const { service_id } of services) {
                const realPrice = servicePriceMap.get(service_id);
                await connection.query(
                    `INSERT INTO sale_services (sale_id, service_id, price, created_at, created_by)
                 VALUES (?, ?, ?, NOW(), ?)`,
                    [saleId, service_id, realPrice, created_by || null]
                );
            }

            await connection.commit();

            return {
                message: "Sale with services created successfully",
                data: { sale_id: saleId, total, ...data }
            };

        } catch (error) {
            if (connection) await connection.rollback();
            throw error;
        } finally {
            if (connection) connection.release();
        }
    }

    async getPaymentMethods() {
        let connection
        try {
            connection = await getConnection();
            const [methods] = await connection.query(
                `SELECT id, name FROM payment_methods`
            );
            return {
                message: 'Payment methods retrieved successfully',
                data: methods
            };
        } catch (error) {
            throw error;
        } finally {
            if (connection) connection.release();
        }

    }
}

module.exports = SalesService;
