function validatorHandler(schema, property) {
  return async (req, res, next) => {
    try {
      const data = req[property];
      await schema.validateAsync(data, { abortEarly: false }); // validación completa
      next();
    } catch (err) {
      err.status = 400; // Bad Request
      next(err);        // Pasa al middleware global
    }
  };
}

module.exports = { validatorHandler };
