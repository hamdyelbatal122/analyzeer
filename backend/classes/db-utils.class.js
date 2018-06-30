class DbUtils {
    constructor(settings) {
        this._pool = require("mysql2").createPool(settings);
    }
    testDBConnection() {
        return new Promise((resolve, reject) => {
            this._pool.getConnection((err, conn) => {
               if (err) {
                   return reject(err.stack);
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
                if (err) return reject(err);
                conn.query("SELECT * FROM `users` WHERE `id` = ?", [id], (err, results) => {
                    conn.release();
                    if (err) return reject(err);
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
                if (err) return reject(err);
                conn.query("INSERT INTO `users` (`id`, `name`, `email`, `token`, `public`, `emails`) VALUES (?, ?, ?, ?, ?, ?)", [usr.id, usr.name || "Anonymous", (usr.email || null), token, isPublic, 0], (err, result) => {
                    conn.release();
                    if (err) return reject(err);
                    resolve();
                });
            });
        });
    }
    updateUser(usr) {
        return new Promise((resolve, reject) => {
            let isPublic = (usr.public) ? 1 : 0;
            let emails = (usr.emails) ? 1 : 0;
            this._pool.getConnection((err, conn) => {
                if (err) return reject(err);
                conn.query("UPDATE users SET `name` = ?, `email` = ?, `public` = ?, `emails` = ? WHERE `id` = ?", [usr.name, usr.email, isPublic, emails, usr.id], (err, result) => {
                    conn.release();
                    if (err) return reject(err);
                    if (result.changedRows === 1) {
                        resolve();
                    } else {
                        reject("Nothing changed");
                    }
                });
            });
        });
    }
}

module.exports = { DbUtils };
