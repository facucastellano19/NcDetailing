const getConnection = require('../database/mysql');

class ClientsService {

    async getClients() {
        const connection = await getConnection();
        const query = `
            SELECT id, first_name, last_name, email, phone
            FROM clients`
        const [clients] = await connection.query(query);
        return {
            message: 'Clients retrieved successfully',
            data: clients
        }
    }

    async getClientById(id) {
        const connection = await getConnection();
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
    }

    async postClient(data) {
        const connection = await getConnection();
        await connection.beginTransaction(); // Start transaction

        try {
            // Verificar si ya existe cliente con mismo email o teléfono
            const [clients] = await connection.query(
                `SELECT id FROM clients WHERE email = ? OR phone = ?`,
                [data.email, data.phone]
            );

            if (clients[0]) {
                const error = new Error('Client with this email or phone already exists');
                error.status = 409;
                throw error;
            }

            // Insertar cliente
            const [result] = await connection.query(
                `INSERT INTO clients 
             (first_name, last_name, email, phone, created_by, created_at)
             VALUES (?, ?, ?, ?, ?, NOW())`,
                [data.first_name, data.last_name, data.email, data.phone, data.created_by]
            );

            const newCustomerId = result.insertId;

            // Manejar vehículos asociados si se proporcionan
            if (data.vehicles && data.vehicles.length > 0) {
                // Primero revisar todas las patentes para conflictos
                const conflictPlates = [];
                for (let vehicle of data.vehicles) {
                    const [existingVehicle] = await connection.query(
                        `SELECT id FROM vehicles WHERE license_plate = ?`,
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

                // Insertar vehículos si no hay conflictos
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

            // Confirmar transacción
            await connection.commit();

            return {
                message: 'Client created successfully',
                data: { id: newCustomerId, ...data }
            };

        } catch (err) {
            await connection.rollback(); // Rollback si hay error
            throw err;
        }
    }


    async putClient(id, data) {
        const connection = await getConnection();
        await connection.beginTransaction(); // start transaction

        try {
            // Verify if client exists
            const [queryClientExists] = await connection.query(
                `SELECT * FROM clients WHERE id = ?`,
                [id]
            );
            if (!queryClientExists[0]) {
                const error = new Error('Client not found');
                error.status = 404;
                throw error;
            }

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
                    if (!vehicle.deleted) { // solo los que no se eliminan
                        const [existingVehicle] = await connection.query(
                            `SELECT id FROM vehicles WHERE license_plate = ? AND id != ?`,
                            [vehicle.license_plate, vehicle.id || 0] // id 0 para nuevos vehículos
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

            return {
                message: 'Client updated successfully',
                data: { id, ...data }
            };

        } catch (err) {
            await connection.rollback();
            throw err;
        }
    }


}

module.exports = ClientsService;