const jwt = require('jsonwebtoken');
require('dotenv').config();

module.exports = (req, res, next) => {
    try {
        //Retrieve the token in headers
        const token = req.headers.authorization.split(' ')[1];
        //Decode the retrieved token against the token secret in .env
        const decodedToken = jwt.verify(token, process.env.TOKEN_SECRET);
        const userId = decodedToken.userId;
        if(req.body.userId && req.body.userId !== userId) {
            res.status(403).json({message: 'Unauthorized request'});
        } else {
            next();
        }
    } catch (error) {
        res.status(401).json({error: error | 'Request not authentified'});
    }
};