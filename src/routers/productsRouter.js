const express = require('express')
const { getProducts, getProductById, postProduct, putProduct, deleteProduct } = require('../controllers/productsController');
const { getProductByIdSchema, postProductSchema, putProductSchema, deleteProductSchema } = require('../schemas/productsSchema');
const { validatorHandler } = require('../middlewares/validatorHandler');
const { checkRole } = require('../middlewares/secure');
const { valid } = require('joi');

const productsRouter = express.Router()
productsRouter.use(express.json())

productsRouter.get('/',
    checkRole(1),
    getProducts)

productsRouter.get('/:id',
    checkRole(1),
    validatorHandler(getProductByIdSchema, 'params'),
    getProductById)

productsRouter.post('/',
    checkRole(1),
    validatorHandler(postProductSchema, 'body'),
    postProduct
)

productsRouter.put('/:id',
    checkRole(1),
    validatorHandler(putProductSchema, 'body'),
    putProduct)

productsRouter.delete('/:id',
    checkRole(1),
    validatorHandler(deleteProductSchema, 'params'),
    deleteProduct)


module.exports = productsRouter