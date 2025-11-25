const express = require('express')
const { getServices, getServiceById, postService, putService, deleteService, getCategories, postCategory, putCategory, deleteCategory, getCategoryById, restoreService, restoreCategory } = require('../controllers/servicesController');
const { getServicesSchema, getServiceByIdSchema, postServiceSchema, putServiceSchema, deleteServiceSchema, postCategorySchema } = require('../schemas/servicesSchema');
const {validatorHandler} = require('../middlewares/validatorHandler');
const { checkRole } = require('../middlewares/secure');

const servicesRouter = express.Router()
servicesRouter.use(express.json())

servicesRouter.get('/',
    checkRole(1,2),
    validatorHandler(getServicesSchema, 'query'),
    getServices)

// --- Category Routes ---
servicesRouter.get('/categories',
    checkRole(1,2),
    validatorHandler(getServicesSchema, 'query'), // Re-using schema for status filter
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

servicesRouter.patch('/category/:id/restore',
    checkRole(1),
    validatorHandler(getServiceByIdSchema, 'params'),
    restoreCategory
);

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

servicesRouter.patch('/:id/restore',
    checkRole(1),
    validatorHandler(getServiceByIdSchema, 'params'),
    restoreService
);


module.exports = servicesRouter