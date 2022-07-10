const mysql2 = require("mysql2");

const pool = mysql2.createPool({
  host: "localhost",
  user: "root",
  database: "cuiters",
  password: "Mysql123",
  decimalNumbers: true,
});

module.exports = pool;
