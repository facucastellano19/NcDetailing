function logError(err,req,res,next){
    console.log(err.stack)
    next(err)
}


function errorHandler(err,req,res,next){
    console.log("errorHandler")
    const statusCode = err.status || 500
    res.status(statusCode).send({
        mensaje: err.message,
    })
}

module.exports = { logError, errorHandler }