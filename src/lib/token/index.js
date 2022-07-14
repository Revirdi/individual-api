const jwt = require("jsonwebtoken");
const SECRET_WORD = "m9c8E8Dxk7WUPeD4MJil";

const createToken = (payload) => jwt.sign(payload, SECRET_WORD);
const verifyToken = (token) => jwt.verify(token, SECRET_WORD);

module.exports = { createToken, verifyToken };
