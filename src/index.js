const express = require('express');
const app = express();
app.use(express.json());
const usersRouter = require('./routers/usersRouter');
const docsRouter = require('./routers/docsRouter');
const clientsRouter = require('./routers/clientsRouter');
const employeesRouter = require('./routers/employeesRouter');
const { logError, errorHandler } = require('./middlewares/errorHandler');

app.use('/api/clients',clientsRouter)

app.use('/api/docs', docsRouter);

app.use('/api/users',usersRouter)

app.use('/api/employees',employeesRouter)

app.get('/', (req, res) => {
    res.send('Sistema de ventas NcDetailing activo')
})

app.use(logError);
app.use(errorHandler);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Servidor escuchando en el puerto ${PORT}`);
});
