const servicesService = require('../services/servicesService');
const service = new servicesService();

async function getServices(req, res, next) {
    try {
        const services = await service.getServices();
        res.json(services);
    } catch (error) {
        next(error);
    }
}

async function getServiceById(req, res, next) {
    try {
        const id = req.params.id;
        const service = await service.getServiceById(id);
        res.json(service);
    } catch (error) {
        next(error);
    }
}

async function postService(req, res, next) {
    try {
        const data = req.body;
        data.created_by = req.userIdToken;
        const newService = await service.postService(data);
        res.status(201).json(newService);
    } catch (error) {
        next(error);
    }
}

async function putService(req, res, next) {
    try {
        const id = req.params.id;
        const data = req.body;
        data.updated_by = req.userIdToken;
        const updatedService = await service.putService(id, data);
        res.json(updatedService);
    } catch (error) {
        next(error);
    }
}

async function deleteService(req, res, next) {
    try {
        const id = req.params.id;
        const data = { deleted_by: req.userIdToken}
        result = await service.deleteService(id,data);
        res.status(200).json(result);
    } catch (error) {
        next(error);
    }  
}


async function getCategories(req, res, next) {
    try {
        const categories = await service.getCategories();
        res.json(categories);
    } catch (error) {
        next(error);
    }
}

module.exports = { getServices, getServiceById, postService, putService, deleteService, getCategories }
