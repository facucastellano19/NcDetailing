const usersService = require('../services/usersService.js');
const service = new usersService();

async function login(req, res, next) {
    try {
        const data = req.body;
        data.usernameToken = req.body.username; // Standardize variable for auditing
        data.ipAddress = req.ip;
        const result = await service.login(data);
        res.json(result);
    } catch (err) {
        next(err);
    }
}

async function register(req, res, next) {
    try {
        const data = req.body;
        let created_by = req.userIdToken;
        data.usernameToken = req.usernameToken; 

        const isFirstUser = await service.isFirstUser();

        if (isFirstUser) {
            created_by = 1;
            data.role_id = 1;
        } else if (!created_by) {
            const error = new Error("Missing created_by from token");
            error.status = 400;
            return next(error);
        }

        console.log('created_by:', created_by);

        data.created_by = created_by;
        const result = await service.register(data);
        res.status(201).json(result);

    } catch (err) {
        next(err);
    }
}

module.exports = { login, register }