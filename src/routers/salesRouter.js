const express = require('express');
const { getSalesProducts, postSaleProducts } = require('../controllers/salesController');
//const { postSaleProductsSchema } = require('../schemas/salesSchema');
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
    // validatorHandler(postSaleProductsSchema, 'body'), // Descomenta cuando crees el schema de validación
    postSaleProducts
);

module.exports = salesRouter;