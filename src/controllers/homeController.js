const HomeService = require('../services/homeService');
const service = new HomeService();

const getHomeDashboard = async (req, res, next) => {
    try {
        const data = await service.getHomeDashboard();
        res.status(200).json(data);
    } catch (error) {
        next(error);
    }
};

module.exports = {
    getHomeDashboard
};