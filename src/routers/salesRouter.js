const express = require('express');
const { getSalesProducts, postSaleProducts, getSalesServices, postSalesServices, getPaymentMethods, updatePaymentStatus } = require('../controllers/salesController');
const { postSaleProductsSchema, postSaleServicesSchema, updatePaymentStatusSchema } = require('../schemas/salesSchema');
const { validatorHandler } = require('../middlewares/validatorHandler');
const { checkRole } = require('../middlewares/secure');

const salesRouter = express.Router();
salesRouter.use(express.json());

salesRouter.get('/products',
    checkRole(1,2), 
    getSalesProducts
);

salesRouter.post('/products',
    checkRole(1,2),
    validatorHandler(postSaleProductsSchema, 'body'),
    postSaleProducts
);

salesRouter.get('/services',
    checkRole(1,2),
    getSalesServices
);

salesRouter.post('/services',
    checkRole(1,2),
    validatorHandler(postSaleServicesSchema, 'body'),
    postSalesServices
);

salesRouter.get('/payment-methods',
    checkRole(1,2),
    getPaymentMethods
);

salesRouter.patch('/:id/payment-status',
    checkRole(1, 2),
    validatorHandler(updatePaymentStatusSchema, 'body'),
    updatePaymentStatus
);


module.exports = salesRouter;