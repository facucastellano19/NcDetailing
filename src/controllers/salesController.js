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

module.exports = { getSalesProducts,postSaleProducts }