function validatorHandler(schema, property) {
  return (req, res, next) => {
    const data = req[property];
    const result = schema.validate(data);

    if (result.error) {
      const error = new Error(result.error.details[0].message);
      error.status = 400;
      return next(error); 
    }

    next();
  };
}

module.exports = { validatorHandler }
