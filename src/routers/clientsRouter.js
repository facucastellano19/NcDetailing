const express = require('express')
const { getClients, getClientById, postClient, putClient, deleteClient } = require('../controllers/clientsController');
const {getClientByIdSchema, putClientSchema, postClientSchema} = require('../schemas/clientsSchemas');
const {validatorHandler} = require('../middlewares/validatorHandler');
const { checkRole } = require('../middlewares/secure');

const clientsRouter = express.Router()
clientsRouter.use(express.json())

clientsRouter.get('/',
    checkRole(1,2),
    getClients)

clientsRouter.get('/:id',
    checkRole(1,2),
    validatorHandler(getClientByIdSchema, 'params'),    
    getClientById)

clientsRouter.post('/',
    checkRole(1,2),
    validatorHandler(postClientSchema, 'body'),
    postClient
)

clientsRouter.put('/:id',
    checkRole(1,2),
    validatorHandler(getClientByIdSchema, 'params'),
    validatorHandler(putClientSchema, 'body'),
    putClient)


module.exports = clientsRouter