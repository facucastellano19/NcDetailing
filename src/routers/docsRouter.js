const express = require('express');
const swaggerUi = require('swagger-ui-express');
const path = require('path');

const router = express.Router();

// Cargar los archivos JSON
const users = require(path.join(__dirname, '../docs/users.json'));
const employees = require(path.join(__dirname, '../docs/employees.json'));

// Combinar paths y components
const swaggerDocument = {
  openapi: "3.0.3",
  info: users.info, // podés personalizar
  paths: {
    ...users.paths,
    ...employees.paths
  },
  components: {
    schemas: {
      ...users.components.schemas,
      ...employees.components.schemas
    },
    securitySchemes: {
      ...users.components.securitySchemes
    }
  }
};

// Ruta para servir la documentación
router.use('/', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

module.exports = router;
