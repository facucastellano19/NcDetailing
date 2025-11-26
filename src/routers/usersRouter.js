const express = require('express')
const {login,register} = require('../controllers/usersController');
const {checkRole} = require('../middlewares/secure');
const {loginSchema, registerSchema} = require('../schemas/usersSchema');
const {validatorHandler} = require('../middlewares/validatorHandler');
const allowFirstUser = require('../middlewares/checkFirstUser'); 

const userRouter = express.Router()
userRouter.use(express.json())


userRouter.post(
    '/login',
    validatorHandler(loginSchema, 'body'),
    login)

userRouter.post('/register',
    allowFirstUser(checkRole(1)),
    validatorHandler(registerSchema, 'body'),
    register
)

module.exports = userRouter