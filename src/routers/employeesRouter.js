const express = require('express')
const {register} = require('../controllers/usersController');
const { getEmployees, getEmployeeById, postEmployee, putEmployee, deleteEmployee, restoreEmployee } = require('../controllers/employeesController');
const {registerSchema} = require('../schemas/usersSchema');
const {getEmployeesSchema, getEmployeeByIdSchema, putEmployeeSchema, deleteEmployeeSchema} = require('../schemas/employeesSchema');
const {validatorHandler} = require('../middlewares/validatorHandler');
const { checkRole } = require('../middlewares/secure');

const employeesRouter = express.Router()
employeesRouter.use(express.json())

employeesRouter.get('/',
    checkRole(1),
    validatorHandler(getEmployeesSchema, 'query'),
    getEmployees)

employeesRouter.get('/:id',
    checkRole(1),
    validatorHandler(getEmployeeByIdSchema, 'params'),
    getEmployeeById)

employeesRouter.post('/',
    checkRole(1),
    validatorHandler(registerSchema, 'body'),
    postEmployee
)

employeesRouter.put('/:id',
    checkRole(1),
    validatorHandler(putEmployeeSchema, 'body'),
    putEmployee)

employeesRouter.delete('/:id',
    checkRole(1),
    validatorHandler(deleteEmployeeSchema, 'params'),
    deleteEmployee)

employeesRouter.patch('/:id/restore',
    checkRole(1),
    validatorHandler(getEmployeeByIdSchema, 'params'),
    restoreEmployee
)

module.exports = employeesRouter