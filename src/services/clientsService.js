const getConnection = require('../database/mysql');
const auditLogService = require('./auditLogService');

class ClientsService {

    async getClients(search) {
        let connection;
        try {
            connection = await getConnection();
            let query = `
                SELECT 
                    c.id, c.first_name, c.last_name, c.email, c.phone,
                    v.id AS vehicle_id, v.brand, v.model, v.year, v.color, v.license_plate
                FROM clients c
                LEFT JOIN vehicles v ON c.id = v.client_id AND v.deleted_at IS NULL
            `;
            const queryParams = [];

            if (search) {
                const searchTerm = `%${search}%`;
                query += `
                    WHERE c.first_name LIKE ?
                       OR c.last_name LIKE ?
                       OR c.email LIKE ?
                       OR c.phone LIKE ?
                       OR v.brand LIKE ?
                       OR v.model LIKE ?
                       OR v.license_plate LIKE ?
                `;
                queryParams.push(
                    searchTerm, searchTerm, searchTerm, searchTerm,
                    searchTerm, searchTerm, searchTerm
                );
            }

            query += ` ORDER BY c.id`;

            const [rows] = await connection.query(query, queryParams);

            // Process rows to group vehicles by client
            const clientsMap = new Map();

            rows.forEach(row => {
                if (!clientsMap.has(row.id)) {
                    clientsMap.set(row.id, {
                        id: row.id,
                        first_name: row.first_name,
                        last_name: row.last_name,
                        email: row.email,
                        phone: row.phone,
                        vehicles: []
                    });
                }

                if (row.vehicle_id) { // Only add vehicle if it exists (not NULL from LEFT JOIN)
                    clientsMap.get(row.id).vehicles.push({
                        id: row.vehicle_id,
                        brand: row.brand,
                        model: row.model,
                        year: row.year,
                        color: row.color,
                        license_plate: row.license_plate
                    });
                }
            });

            const clients = Array.from(clientsMap.values());

            return {
                message: 'Clients retrieved successfully',
                data: clients
            };
        } finally {
            if (connection) connection.release();
        }
    }

    async getClientVehicles(id) {
        let connection;
        try {
            connection = await getConnection();

            const [client] = await connection.query(
                `SELECT id, first_name, last_name FROM clients WHERE id = ?`,
                [id]
            );

            if (!client[0]) {
                const error = new Error('Client not found');
                error.status = 404;
                throw error;
            }

            const [vehicles] = await connection.query(
                `SELECT id, brand, model, year, color, license_plate 
                 FROM vehicles 
                 WHERE client_id = ? AND deleted_at IS NULL`,
                [id]
            );

            return {
                message: 'Vehicles retrieved successfully',
                data: vehicles
            };
        } finally {
            if (connection) connection.release();
        }
    }

    async getClientById(id) {
        let connection;
        try {
            connection = await getConnection();
            const query = `SELECT id, first_name, last_name, email, phone
                FROM clients WHERE id = ?`

            const [clients] = await connection.query(query, [id]);
            const client = clients[0]

            if (!client) {
                const error = new Error('Client not found');
                error.status = 404;
                throw error;
            }

            return {
                message: 'Client retrieved successfully',
                data: client
            };
        } finally {
            if (connection) connection.release();
        }
    }

    async postClient(data) {
        let connection;
        try {
            connection = await getConnection();
            await connection.beginTransaction(); // Start transaction

            // Verify unique email and phone
            const [clients] = await connection.query(
                `SELECT id FROM clients WHERE email = ? OR phone = ?`,
                [data.email, data.phone]
            );

            if (clients[0]) {
                const error = new Error('Client with this email or phone already exists');
                error.status = 409;
                throw error;
            }

            // Insert client
            const [result] = await connection.query(
                `INSERT INTO clients 
             (first_name, last_name, email, phone, created_by, created_at)
             VALUES (?, ?, ?, ?, ?, NOW())`,
                [data.first_name, data.last_name, data.email, data.phone, data.created_by]
            );

            const newCustomerId = result.insertId;

            // Handle vehicles if provided
            if (data.vehicles && data.vehicles.length > 0) {
                // Check for license plate conflicts
                const conflictPlates = [];
                for (let vehicle of data.vehicles) {
                    const [existingVehicle] = await connection.query(
                        `SELECT id FROM vehicles WHERE license_plate = ? AND deleted_at IS NULL`,
                        [vehicle.license_plate]
                    );
                    if (existingVehicle[0]) {
                        conflictPlates.push(vehicle.license_plate);
                    }
                }

                if (conflictPlates.length > 0) {
                    const error = new Error(
                        `Vehicles with license plates already assigned: ${conflictPlates.join(', ')}`
                    );
                    error.status = 409;
                    throw error;
                }

                // Insert vehicles if no conflicts
                for (let vehicle of data.vehicles) {
                    await connection.query(
                        `INSERT INTO vehicles 
                     (client_id, brand, model, year, color, license_plate, created_by, created_at)
                     VALUES (?, ?, ?, ?, ?, ?, ?, NOW())`,
                        [
                            newCustomerId,
                            vehicle.brand,
                            vehicle.model,
                            vehicle.year,
                            vehicle.color,
                            vehicle.license_plate,
                            data.created_by
                        ]
                    );
                }
            }

            await connection.commit();

            // Get the full new state of the client and their vehicles for auditing
            const [newClientDataResult] = await connection.query(`SELECT * FROM clients WHERE id = ?`, [newCustomerId]);
            const [newVehicles] = await connection.query(`SELECT * FROM vehicles WHERE client_id = ?`, [newCustomerId]);
            const newState = {
                client: newClientDataResult[0],
                vehicles: newVehicles
            };

            // Audit Log
            await auditLogService.log({
                userId: data.created_by,
                username: data.usernameToken,
                actionType: 'CREATE',
                entityType: 'client',
                entityId: newCustomerId,
                changes: { newValue: newState },
                ipAddress: data.ipAddress
            });

            return {
                message: 'Client created successfully',
                data: { id: newCustomerId, ...data }
            };

        } catch (err) {
            await connection.rollback();
            // Audit Log for failure
            await auditLogService.log({
                userId: data.created_by,
                username: data.usernameToken,
                actionType: 'CREATE',
                entityType: 'client',
                ipAddress: data.ipAddress,
                status: 'FAILURE',
                errorMessage: err.message
            });
            throw err; // Re-throw the error so the controller can catch it
        } finally {
            if (connection) connection.release();
        }
    }


    async putClient(id, data) {
        let connection;
        let oldState = null; // This will hold both client and vehicle data
        try {
            connection = await getConnection();

            const [queryClientExists] = await connection.query(
                `SELECT * FROM clients WHERE id = ?`,
                [id]
            );
            if (!queryClientExists[0]) {
                const error = new Error('Client not found');
                error.status = 404;
                throw error;
            }
            const oldClientData = queryClientExists[0];

            const [oldVehicles] = await connection.query(
                `SELECT * FROM vehicles WHERE client_id = ? AND deleted_at IS NULL`,
                [id]
            );

            oldState = { client: oldClientData, vehicles: oldVehicles };

            await connection.beginTransaction();

            // Verify unique email and phone
            const [checkUnique] = await connection.query(
                `SELECT id FROM clients 
             WHERE id != ? AND (email = ? OR phone = ?)`,
                [id, data.email, data.phone]
            );
            if (checkUnique[0]) {
                const error = new Error('Another client with this email or phone already exists');
                error.status = 409;
                throw error;
            }

            const client = queryClientExists[0];

            // Update client info
            await connection.query(
                `UPDATE clients 
             SET first_name = ?, last_name = ?, email = ?, phone = ?, updated_by = ?, updated_at = NOW()
             WHERE id = ?`,
                [
                    data.first_name ?? client.first_name,
                    data.last_name ?? client.last_name,
                    data.email ?? client.email,
                    data.phone ?? client.phone,
                    data.updated_by,
                    id
                ]
            );

            // Handle associated vehicles if provided
            if (data.vehicles && data.vehicles.length > 0) {
                const conflictPlates = [];

                // Check for license plate conflicts
                for (let vehicle of data.vehicles) {
                    if (!vehicle.deleted) {
                        const [existingVehicle] = await connection.query(
                            `SELECT id FROM vehicles WHERE license_plate = ? AND id != ? AND deleted_at IS NULL`,
                            [vehicle.license_plate, vehicle.id || 0]
                        );
                        if (existingVehicle[0]) {
                            conflictPlates.push(vehicle.license_plate);
                        }
                    }
                }

                if (conflictPlates.length > 0) {
                    const error = new Error(
                        `Vehicles with license plates already assigned: ${conflictPlates.join(', ')}`
                    );
                    error.status = 409;
                    throw error;
                }

                // Insert, update, or soft delete vehicles
                for (let vehicle of data.vehicles) {
                    if (vehicle.id) {
                        if (vehicle.deleted) {
                            await connection.query(
                                `UPDATE vehicles SET deleted_at = NOW(), deleted_by = ? WHERE id = ?`,
                                [data.updated_by, vehicle.id]
                            );
                        } else {
                            const [existing] = await connection.query(
                                `SELECT * FROM vehicles WHERE id = ?`,
                                [vehicle.id]
                            );
                            const oldVehicle = existing[0];

                            await connection.query(
                                `UPDATE vehicles 
                             SET brand = ?, model = ?, year = ?, color = ?, license_plate = ?, updated_by = ?, updated_at = NOW()
                             WHERE id = ?`,
                                [
                                    vehicle.brand ?? oldVehicle.brand,
                                    vehicle.model ?? oldVehicle.model,
                                    vehicle.year ?? oldVehicle.year,
                                    vehicle.color ?? oldVehicle.color,
                                    vehicle.license_plate ?? oldVehicle.license_plate,
                                    data.updated_by,
                                    vehicle.id
                                ]
                            );
                        }
                    } else {
                        await connection.query(
                            `INSERT INTO vehicles 
                         (client_id, brand, model, year, color, license_plate, created_by, created_at)
                         VALUES (?, ?, ?, ?, ?, ?, ?, NOW())`,
                            [
                                id,
                                vehicle.brand,
                                vehicle.model,
                                vehicle.year,
                                vehicle.color,
                                vehicle.license_plate,
                                data.updated_by
                            ]
                        );
                    }
                }
            }

            // Confirm transaction
            await connection.commit();

            const [newClientDataResult] = await connection.query(`SELECT * FROM clients WHERE id = ?`, [id]);
            const newClientData = newClientDataResult[0];

            const [newVehicles] = await connection.query(
                `SELECT * FROM vehicles WHERE client_id = ? AND deleted_at IS NULL`,
                [id]
            );

            const newState = { client: newClientData, vehicles: newVehicles };

            // Audit Log for success
            await auditLogService.log({
                userId: data.updated_by,
                username: data.usernameToken,
                actionType: 'UPDATE',
                entityType: 'client',
                entityId: id,
                changes: { oldValue: oldState, newValue: newState },
                ipAddress: data.ipAddress
            });

            return {
                message: 'Client updated successfully',
                data: { id, ...data }
            };

        } catch (err) {
            await connection.rollback();
            // Audit Log for failure
            await auditLogService.log({
                userId: data.updated_by,
                username: data.usernameToken,
                actionType: 'UPDATE',
                entityType: 'client',
                entityId: id,
                ipAddress: data.ipAddress,
                status: 'FAILURE',
                errorMessage: err.message
            });
            throw err;
        } finally {
            if (connection) connection.release();
        }
    }

    async getClientPurchaseHistory(clientId) {
        const connection = await getConnection();
        try {
            // Check if client exists
            const [clientExists] = await connection.query(
                `SELECT id FROM clients WHERE id = ?`,
                [clientId]
            );

            if (clientExists.length === 0) {
                const error = new Error('Client not found');
                error.status = 404;
                throw error;
            }

            // Get Service Sales History
            const [serviceSalesRows] = await connection.query(`
                SELECT 
                    s.id AS sale_id,
                    s.created_at,
                    s.total AS sale_total,
                    sv.name AS service_name,
                    ss.price AS service_price,
                    CONCAT(v.brand, ' ', v.model, ' (', v.license_plate, ')') AS vehicle_info
                FROM sales s
                JOIN sale_services ss ON s.id = ss.sale_id
                JOIN services sv ON ss.service_id = sv.id
                JOIN vehicles v ON s.vehicle_id = v.id
                WHERE s.client_id = ? AND s.sale_type_id = 1 AND s.deleted_at IS NULL
                ORDER BY s.created_at DESC;
            `, [clientId]);

            const servicesHistoryMap = new Map();
            serviceSalesRows.forEach(row => {
                if (!servicesHistoryMap.has(row.sale_id)) {
                    servicesHistoryMap.set(row.sale_id, {
                        sale_id: row.sale_id,
                        created_at: row.created_at,
                        sale_total: row.sale_total,
                        vehicle_info: row.vehicle_info,
                        services: []
                    });
                }
                servicesHistoryMap.get(row.sale_id).services.push({ name: row.service_name, price: row.service_price });
            });

            // Get Product Sales History
            const [productSalesRows] = await connection.query(`
                SELECT 
                    s.id AS sale_id,
                    s.created_at,
                    s.total AS sale_total,
                    p.name AS product_name,
                    sp.quantity,
                    sp.price AS unit_price,
                    sp.subtotal
                FROM sales s
                JOIN sale_products sp ON s.id = sp.sale_id
                JOIN products p ON sp.product_id = p.id
                WHERE s.client_id = ? AND s.sale_type_id = 2 AND s.deleted_at IS NULL
                ORDER BY s.created_at DESC;
            `, [clientId]);

            const productsHistoryMap = new Map();
            productSalesRows.forEach(row => {
                if (!productsHistoryMap.has(row.sale_id)) {
                    productsHistoryMap.set(row.sale_id, { sale_id: row.sale_id, created_at: row.created_at, sale_total: row.sale_total, products: [] });
                }
                productsHistoryMap.get(row.sale_id).products.push({ name: row.product_name, quantity: row.quantity, unit_price: row.unit_price, subtotal: row.subtotal });
            });

            return {
                message: 'Client purchase history retrieved successfully',
                data: {
                    servicesHistory: Array.from(servicesHistoryMap.values()),
                    productsHistory: Array.from(productsHistoryMap.values())
                }
            };
        } finally {
            if (connection) connection.release();
        }
    }
}


module.exports = ClientsService;