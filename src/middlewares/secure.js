const { decode } = require('../utils/jwt');
const usersService = require('../services/usersService');
const service = new usersService();

function checkRole(...allowedRoles) {
    return async (req, res, next) => {
        try {

            const isFirstUser = await service.isFirstUser();

            if (isFirstUser) {
                return next();
            }

            const authHeader = req.headers.authorization;

            if (!authHeader) {
                const error = new Error("Token missing");
                error.status = 401;
                throw error;
            }

            const data = decode(authHeader);

            if (!allowedRoles.includes(data.role_id)) {
                const error = new Error("Insufficient privileges");
                error.status = 403;
                throw error;
            }

            req.userIdToken = data.id;
            req.role = data.role_id;
            next();

        } catch (err) {
            next(err);
        }
    };
}

module.exports = { checkRole };
