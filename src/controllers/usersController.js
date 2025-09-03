const usersService = require('../services/usersService.js');
const service = new usersService();

async function login(req, res, next) {
    try {
        const data = req.body;
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

        const isFirstUser = await service.isFirstUser();

        if (isFirstUser) {
            created_by = 1;
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