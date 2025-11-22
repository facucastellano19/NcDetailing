const express = require('express')
const { getServices, getServiceById, postService, putService, deleteService, getCategories, postCategory, putCategory, deleteCategory, getCategoryById } = require('../controllers/servicesController');
const { getServiceByIdSchema, postServiceSchema, putServiceSchema, deleteServiceSchema, postCategorySchema } = require('../schemas/servicesSchema');
const {validatorHandler} = require('../middlewares/validatorHandler');
const { checkRole } = require('../middlewares/secure');

const servicesRouter = express.Router()
servicesRouter.use(express.json())

servicesRouter.get('/',
    checkRole(1,2),
    getServices)

// --- Category Routes ---
servicesRouter.get('/categories',
    checkRole(1,2),
    getCategories)

servicesRouter.get('/category/:id',
    checkRole(1,2),
    validatorHandler(getServiceByIdSchema, 'params'), // Reusing schema for ID validation
    getCategoryById
)

servicesRouter.post('/category',
    checkRole(1),
    validatorHandler(postCategorySchema, 'body'),
    postCategory
)

servicesRouter.put('/category/:id',
    checkRole(1),
    validatorHandler(getServiceByIdSchema, 'params'),
    validatorHandler(postCategorySchema, 'body'),
    putCategory
)

servicesRouter.delete('/category/:id',
    checkRole(1),
    validatorHandler(deleteServiceSchema, 'params'),
    deleteCategory
)

// --- Service Routes ---
servicesRouter.get('/:id',
    checkRole(1,2),
    validatorHandler(getServiceByIdSchema, 'params'),
    getServiceById)

servicesRouter.post('/',
    checkRole(1),
    validatorHandler(postServiceSchema, 'body'),
    postService
)

servicesRouter.put('/:id',
    checkRole(1),
    validatorHandler(putServiceSchema, 'body'),
    putService)

servicesRouter.delete('/:id',
    checkRole(1),
    validatorHandler(deleteServiceSchema, 'params'),
    deleteService)


module.exports = servicesRouter