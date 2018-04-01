var exports = module.exports = {};

function errorHandler(err, req, res, next) {
    res.status(500);
    res.send({ 
        status: err.status,
        error: err.message ,
        type: err.type
    });
}

function clientErrorHandler(err, req, res, next) {
    if (req.xhr) {
        res.status(500).send({ error: 'Something failed!' })
    } else {
        next(err)
    }
}

exports.errorHandler = errorHandler;
exports.clientErrorHandler = clientErrorHandler;