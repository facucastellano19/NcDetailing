const express = require('express')
const { getProducts, getProductById, postProduct, putProduct, updateMinStock, deleteProduct, postCategory, getCategories, deleteCategory, putCategory, getCategoryById } = require('../controllers/productsController');
const { getProductByIdSchema, postProductSchema, putProductSchema, deleteProductSchema, postCategorySchema, getProductsSchema, updateMinStockSchema } = require('../schemas/productsSchema');
const { validatorHandler } = require('../middlewares/validatorHandler');
const { checkRole } = require('../middlewares/secure');

const productsRouter = express.Router()
productsRouter.use(express.json())

productsRouter.get('/',
    checkRole(1),
    validatorHandler(getProductsSchema, 'query'),
    getProducts)

productsRouter.put('/category/:id',
    checkRole(1),
    validatorHandler(deleteProductSchema, 'params'), // Reusing schema for ID validation
    validatorHandler(postCategorySchema, 'body'),   // Reusing schema for name validation
    putCategory
)


productsRouter.delete('/category/:id',
    checkRole(1),
    validatorHandler(deleteProductSchema, 'params'),
    deleteCategory
)

productsRouter.get('/categories',
    checkRole(1),
    getCategories
)

productsRouter.get('/category/:id',
    checkRole(1),
    validatorHandler(getProductByIdSchema, 'params'), // Reutilizamos el schema de ID
    getCategoryById
)

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

productsRouter.patch('/:id/min-stock',
    checkRole(1),
    validatorHandler(getProductByIdSchema, 'params'),
    validatorHandler(updateMinStockSchema, 'body'),
    updateMinStock
)

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