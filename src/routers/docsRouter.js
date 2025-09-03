const express = require('express');
const swaggerUi = require('swagger-ui-express');
const path = require('path');

const router = express.Router();

// Cargar tu archivo JSON
const swaggerDocument = require(path.join(__dirname, '../docs/swagger.json'));

// Ruta para servir la documentación
router.use('/', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

module.exports = router;
