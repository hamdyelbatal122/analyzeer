class DbUtils {
    constructor(settings) {
        this._pool = require("mysql2").createPool(settings);
    }
    testDBConnection() {
        return new Promise((resolve, reject) => {
            this._pool.getConnection((err, conn) => {
               if (err) {
                   reject(err.stack);
               } else {
                   conn.release();
                   resolve();
               }
            });
        });
    }
    findUser(name) {
        return new Promise((resolve, reject) => {
            this._pool.getConnection((err, conn) => {
                if (err) reject(err);
                conn.query("SELECT * FROM `users` WHERE `name` = ?", [name], (err, results) => {
                    if (err) reject(err);
                    if (results.length === 0) reject("Not found");
                    resolve(results[0]);
                });
            });
        });
    }
}

module.exports = { DbUtils };
