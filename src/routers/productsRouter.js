const express = require('express')
const { getProducts, getProductById, postProduct, putProduct, deleteProduct, postCategory } = require('../controllers/productsController');
const { getProductByIdSchema, postProductSchema, putProductSchema, deleteProductSchema, postCategorySchema, getProductsSchema } = require('../schemas/productsSchema');
const { validatorHandler } = require('../middlewares/validatorHandler');
const { checkRole } = require('../middlewares/secure');
const { valid } = require('joi');

const productsRouter = express.Router()
productsRouter.use(express.json())

productsRouter.get('/',
    checkRole(1),
    validatorHandler(getProductsSchema, 'query'),
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


productsRouter.post('/category',
    checkRole(1),
    validatorHandler(postCategorySchema, 'body'),
    postCategory
)

module.exports = productsRouter