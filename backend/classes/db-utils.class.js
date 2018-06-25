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
    findUser(id) {
        return new Promise((resolve, reject) => {
            this._pool.getConnection((err, conn) => {
                if (err) reject(err);
                conn.query("SELECT * FROM `users` WHERE `id` = ?", [id], (err, results) => {
                    conn.release();
                    if (err) reject(err);
                    if (results.length === 0) reject("Not found");
                    resolve(results[0]);
                });
            });
        });
    }
    createUser(usr, token, isPublic) {
        isPublic = isPublic ? 1 : 0;
        return new Promise((resolve, reject) => {
            this._pool.getConnection((err, conn) => {
                if (err) reject(err);
                conn.query("INSERT INTO `users` (`id`, `name`, `email`, `token`, `public`) VALUES (?, ?, ?, ?, ?)", [usr.id, usr.name || "Anonymous", (usr.email || null), token, isPublic], (err, result) => {
                    conn.release();
                    if (err) reject(err);
                    resolve();
                });
            });
        });
    }
}

module.exports = { DbUtils };
