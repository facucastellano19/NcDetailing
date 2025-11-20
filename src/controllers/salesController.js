const salesService = require('../services/salesService');
const service = new salesService();

async function getSalesProducts(req, res, next) {
    try {
        const { clientName, startDate, endDate, paymentStatusId } = req.query;
        const salesProducts = await service.getSalesProducts({ clientName, startDate, endDate, paymentStatusId });
        res.json(salesProducts);
    } catch (error) {
        next(error);
    }
}

async function postSaleProducts(req, res, next) {
    try {
        const data = req.body;
        data.created_by = req.userIdToken;
        const newSaleProducts = await service.postSaleProducts(data);
        res.status(201).json(newSaleProducts);
    } catch (error) {
        next(error);
    }
}

async function getSalesServices(req, res, next) {
    try {
        const { clientName, startDate, endDate, paymentStatusId, serviceStatusId } = req.query;
        const salesServices = await service.getSalesServices({ clientName, startDate, endDate, paymentStatusId, serviceStatusId });
        res.json(salesServices);
    } catch (error) {
        next(error);
    }
}

async function postSalesServices(req, res, next) {
    try {
        const data = req.body;
        data.created_by = req.userIdToken;
        const newSaleServices = await service.postSalesServices(data);
        res.status(201).json(newSaleServices);
    } catch (error) {
        next(error);
    }
}

async function getPaymentMethods(req, res, next) {
    try {
        const paymentMethods = await service.getPaymentMethods();
        res.json(paymentMethods);
    } catch (error) {
        next(error);
    }
}

async function updatePaymentStatus(req, res, next) {
    try {
        const { id } = req.params;
        const { payment_status_id } = req.body;
        const updated_by = req.userIdToken;

        const result = await service.updatePaymentStatus(id, { payment_status_id, updated_by });
        res.json(result);
    } catch (error) {
        next(error);
    }
}

async function updateServiceStatus(req, res, next) {
    try {
        const { id } = req.params;
        const { service_status_id } = req.body;
        const updated_by = req.userIdToken;

        const result = await service.updateServiceStatus(id, { service_status_id, updated_by });
        res.json(result);
    } catch (error) {
        next(error);
    }
}


module.exports = { getSalesProducts, postSaleProducts, getSalesServices, postSalesServices, getPaymentMethods, updatePaymentStatus, updateServiceStatus }