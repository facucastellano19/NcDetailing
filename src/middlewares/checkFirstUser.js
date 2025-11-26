const UsersService = require('../services/usersService');
const service = new UsersService();

/**
 * Middleware to check if any user exists in the database.
 * If no users exist, it bypasses subsequent authentication middlewares.
 * This allows the very first user to be registered without a token.
 * @param {object} authMiddleware - The actual authentication middleware to run if it's not the first user.
 */
function allowFirstUser(authMiddleware) {
    return async (req, res, next) => {
        const isFirst = await service.isFirstUser();
        if (isFirst) {
            // If it's the first user, skip the auth middleware and proceed to the controller.
            return next();
        }
        // If it's not the first user, execute the regular authentication middleware.
        return authMiddleware(req, res, next);
    };
}

module.exports = allowFirstUser;