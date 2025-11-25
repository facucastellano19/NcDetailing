const express = require('express');
const cors = require('cors');

// Routers
const usersRouter = require('./routers/usersRouter');
const docsRouter = require('./routers/docsRouter');
const clientsRouter = require('./routers/clientsRouter');
const employeesRouter = require('./routers/employeesRouter');
const servicesRouter = require('./routers/servicesRouter');
const productsRouter = require('./routers/productsRouter');
const salesRouter = require('./routers/salesRouter');
const metricsRouter = require('./routers/metricsRouter');
const homeRouter = require('./routers/homeRouter');
const auditLogRouter = require('./routers/auditLogRouter');

// Middlewares
const { logError, errorHandler } = require('./middlewares/errorHandler');

const app = express();
app.use(express.json());

app.use(cors());

app.use('/api/home', homeRouter);
app.use('/api/metrics', metricsRouter);
app.use('/api/sales', salesRouter);
app.use('/api/services',servicesRouter)
app.use('/api/clients',clientsRouter)
app.use('/api/docs', docsRouter);
app.use('/api/users',usersRouter)
app.use('/api/audit-log', auditLogRouter);
app.use('/api/employees',employeesRouter)
app.use('/api/products',productsRouter);

app.get('/', (req, res) => {
    res.send('Sistema de ventas NcDetailing activo')
})

app.use(logError);
app.use(errorHandler);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Servidor escuchando en el puerto ${PORT}`);
});