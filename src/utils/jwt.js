const jwt = require('jsonwebtoken');

function sign(payload) {

    return jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '1h' });
}

function getToken(auth) {
    if (!auth || !auth.startsWith('Bearer ')) {
        const error = new Error("Unexpected token format");
        error.status = 400;
        throw error;
    }
    return auth.replace('Bearer ', '');
}

function decode(auth) {
    const token = getToken(auth);
    try {
        return jwt.verify(token, process.env.JWT_SECRET);
    } catch (err) {
        const error = new Error("Invalid or expired token");
        error.status = 401;
        throw error;
    }
}

module.exports = { sign, decode };
