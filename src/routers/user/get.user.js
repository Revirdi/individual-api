const express = require("express");
const router = express.Router();
// const { auth } = require("../../helpers/auth");
const pool = require("../../lib/database");
const { verifyToken } = require("../../lib/token");

const verifyUserController = async (req, res, next) => {
  try {
    const { token } = req.params;

    // verifiedToken = {user_id: 51}
    const veririedToken = verifyToken(token);

    // build a connection
    const connection = pool.promise();
    const sqlUpdateIsVerifiedStatus = `UPDATE user SET ? WHERE user_id = ?`;
    const dataUpdateIsVerifiedStatus = [
      { isVerified: true },
      veririedToken.user_id,
    ];

    const [resUpdateIsVerifiedStatus] = await connection.query(
      sqlUpdateIsVerifiedStatus,
      dataUpdateIsVerifiedStatus
    );

    if (!resUpdateIsVerifiedStatus.affectedRows)
      throw { message: "Failed verification user" };

    res.send("<h1>Verification success</h1>");
  } catch (error) {
    next(error);
  }
};

router.get("/verification/:token", verifyUserController);

module.exports = router;
