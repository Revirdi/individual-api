const express = require("express");
const pool = require("../../lib/database");
const router = express.Router();
const { isFieldEmpties, checkPasswordValidity } = require("../../helper");
const { hash, compare } = require("../../lib/bcryptjs");
const { createToken } = require("../../lib/token");
const { sendMail } = require("../../lib/nodemailer");
const validator = require("email-validator");

const registerUserController = async (req, res, next) => {
  try {
    const { username, email, password } = req.body;

    const emptyFields = isFieldEmpties({ username, email, password });

    // checking empties fields
    if (emptyFields.length) {
      throw {
        code: 400,
        message: `Empty fields : ${emptyFields}`,
        data: { result: emptyFields },
      };
    }

    // checking email validation
    if (!validator.validate(email))
      throw {
        code: 400,
        message: `Please enter a valid email address`,
      };

    const connection = pool.promise();

    // Checking username and email
    const sqlGetUser = `SELECT username, email FROM user WHERE username = ? OR email = ? `;
    const dataGetUser = [username, email];
    const [resGetUser] = await connection.query(sqlGetUser, dataGetUser);

    if (resGetUser.length) {
      const user = resGetUser[0];

      if (user.username == username) {
        throw {
          code: 400,
          message: "Username is already exists",
        };
      } else {
        throw {
          code: 400,
          message: "Email is already exists",
        };
      }
    }

    // password validator with RegExp
    const isPasswordValid = checkPasswordValidity(password);
    if (isPasswordValid)
      throw {
        code: 400,
        message: isPasswordValid,
      };

    // Hashing password
    const encryptedPassword = hash(password);

    // Insert data into databases
    const sqlCreateUser = `INSERT INTO USER SET ?`;
    const dataCreateUser = [
      {
        username,
        email,
        image: "/public/avatar/default-avatar.jpg",
        password: encryptedPassword,
      },
    ];

    const [resCreateUser] = await connection.query(
      sqlCreateUser,
      dataCreateUser
    );

    // create token
    const token = createToken({ user_id: resCreateUser.insertId });

    // sending verification via email
    await sendMail({ email, token });

    res.send({
      status: "Success",
      message: "Success create new user",
      data: {
        result: resCreateUser,
      },
    });
  } catch (error) {
    next(error);
  }
};

const loginUserController = async (req, res, next) => {
  try {
    const { username, password } = req.body;

    const connection = pool.promise();

    // checking database with username or email
    const sqlGetUser = `SELECT user_id, username, password, isVerified FROM user WHERE email = ? OR username = ?`;
    const dataGetUser = [username, username];
    const [resGetUser] = await connection.query(sqlGetUser, dataGetUser);

    if (!resGetUser.length) {
      throw {
        code: 404,
        message: `Can not find account with this username`,
      };
    }

    // if doesn't match, send error
    const user = resGetUser[0];

    // check verified status
    // if (!user.isVerified) {
    //   throw {
    //     code: 403,
    //     message: `You need verify first`,
    //   };
    // }

    // compare password
    const isPasswordMatch = compare(password, user.password);

    if (!isPasswordMatch) {
      throw {
        code: 401,
        message: `Password is incorrect`,
      };
    }

    // generate token
    const token = createToken({
      user_id: user.user_id,
      username: user.username,
    });

    // send response with token
    res.send({
      status: "Success",
      message: "Login Success",
      data: {
        result: {
          user_id: user.user_id,
          username: user.username,
          accessToken: token,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

router.post("/", registerUserController);
router.post("/login", loginUserController);

module.exports = router;
