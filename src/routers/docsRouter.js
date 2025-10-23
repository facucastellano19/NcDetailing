const express = require('express');
const swaggerUi = require('swagger-ui-express');
const path = require('path');

const router = express.Router();

// Load individual JSON files
const users = require(path.join(__dirname, '../docs/users.json'));
const employees = require(path.join(__dirname, '../docs/employees.json'));
const clients = require(path.join(__dirname, '../docs/clients.json'));
const services = require(path.join(__dirname, '../docs/services.json'));
const products = require(path.join(__dirname, '../docs/products.json'));
const sales = require(path.join(__dirname, '../docs/sales.json'));
const metrics = require(path.join(__dirname, '../docs/metrics.json'));

// Combine them into a single Swagger document
const swaggerDocument = {
  openapi: "3.0.3",
  info: users.info,
  paths: {
    ...users.paths,
    ...employees.paths,
    ...clients.paths,
    ...services.paths,
    ...products.paths,
    ...sales.paths,
    ...metrics.paths
  },
  components: {
    schemas: {
      ...users.components.schemas,
      ...employees.components.schemas,
      ...clients.components.schemas,
      ...services.components.schemas,
      ...products.components.schemas,
      ...sales.components.schemas,
      ...metrics.components.schemas
    },
    securitySchemes: {
      ...users.components.securitySchemes
    }
  }
};

// Route for Swagger UI
router.use('/', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

module.exports = router;
