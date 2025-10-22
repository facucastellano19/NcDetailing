const express = require('express');
const { getSalesProducts, postSaleProducts, getSalesServices, postSalesServices } = require('../controllers/salesController');
const { postSaleProductsSchema, postSaleServicesSchema } = require('../schemas/salesSchema');
const { validatorHandler } = require('../middlewares/validatorHandler');
const { checkRole } = require('../middlewares/secure');

const salesRouter = express.Router();
salesRouter.use(express.json());

salesRouter.get('/products',
    checkRole(1), 
    getSalesProducts
);

salesRouter.post('/products',
    checkRole(1),
    validatorHandler(postSaleProductsSchema, 'body'),
    postSaleProducts
);

salesRouter.get('/services',
    checkRole(1),
    getSalesServices
);

salesRouter.post('/services',
    checkRole(1),
    validatorHandler(postSaleServicesSchema, 'body'),
    postSalesServices
);

module.exports = salesRouter;