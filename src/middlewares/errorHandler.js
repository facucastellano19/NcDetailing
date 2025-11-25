function logError(err, req, res, next) {
  console.error(err.stack);
  next(err); // sigue al siguiente middleware
}

function errorHandler(err, req, res, next) {
  console.log("errorHandler activado");
  const statusCode = err.status || 500;
  res.status(statusCode).json({
    mensaje: err.message || "Error interno del servidor"
  });
}

module.exports = { logError, errorHandler };
