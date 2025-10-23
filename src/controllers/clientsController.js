const clientsService = require('../services/clientsService');
const service = new clientsService();

async function getClients(req, res, next) {
    try {
        const { search } = req.query;
        const clients = await service.getClients(search);
        res.json(clients);
    } catch (error) {
        next(error);
    }
}

async function getClientById(req, res, next) {
    try {
        const id = req.params.id;
        const client = await service.getClientById(id);
        res.json(client);
    } catch (error) {
        next(error);
    }
}

async function getClientVehicles(req, res, next) {
    try{
        const id = req.params.id;
        const vehicles = await service.getClientVehicles(id);
        res.json(vehicles);
    } catch (error) {
        next(error);
    }

}

async function getClientPurchaseHistory(req, res, next) {
    try {
        const { id } = req.params;
        const history = await service.getClientPurchaseHistory(id);
        res.json(history);
    } catch (error) {
        next(error);
    }
}

async function postClient(req, res, next) {
    try {
        const data = req.body;
        data.created_by = req.userIdToken;
        const newClient = await service.postClient(data);
        res.status(201).json(newClient);
    } catch (error) {
        next(error);
    }
}

async function putClient(req, res, next) {
    try {
        const id = req.params.id;
        const data = req.body;
        data.updated_by = req.userIdToken;
        const updatedClient = await service.putClient(id, data);
        res.json(updatedClient);
    } catch (error) {
        next(error);
    }
}



module.exports = { getClients, getClientById, postClient, putClient, getClientVehicles, getClientPurchaseHistory }
