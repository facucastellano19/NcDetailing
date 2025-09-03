const express = require('express')
const {login,register,getUsers} = require('../controllers/usersController');
const {checkRole} = require('../middlewares/secure');
const {validatorHandler} = require('../middlewares/validatorHandler');

const userRouter = express.Router()
userRouter.use(express.json())


userRouter.post('/login',login)

userRouter.post('/register',
    checkRole(1)
    ,register
)

module.exports = userRouter