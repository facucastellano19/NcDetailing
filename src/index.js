const express = require('express');
const app = express();
app.use(express.json());
const usersRouter = require('./routers/usersRouter');
const { logError, errorHandler } = require('./middlewares/errorHandler');

app.use('/api/users',usersRouter)

app.get('/', (req, res) => {
    res.send('Sistema de ventas NcDetailing activo')
})

app.use(logError);
app.use(errorHandler);

const PORT = process.env.PUERTO || 3000;
app.listen(PORT, () => {
    console.log(`Servidor escuchando en el puerto ${PORT}`);
});
