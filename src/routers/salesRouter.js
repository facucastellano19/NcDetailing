const express = require('express')
const { getSalesProducts, postSaleProducts } = require('../controllers/salesController');
//const {validatorHandler} = require('../middlewares/validatorHandler');
const { checkRole } = require('../middlewares/secure');
const salesRouter = express.Router()

salesRouter.use(express.json())

salesRouter.get('/products',
    checkRole(1, 2),
    getSalesProducts)

salesRouter.post('/products',
    checkRole(1, 2),
    postSaleProducts
)

module.exports = salesRouter