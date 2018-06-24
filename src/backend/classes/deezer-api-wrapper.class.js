class DeezerAPIConnection {
    constructor() {
        this._req = require("request-promise-native");
    }
    connect(app, code) {
        return new Promise((resolve, reject) => {
            this._req({
                uri: "https://connect.deezer.com/oauth/access_token.php",
                qs: {
                    app_id: app.id,
                    secret: app.secret,
                    code,
                    output: "json"
                },
                json: true
            }).then(res => {
                this.oauthCode = res.access_token;
                resolve(this);
            }).catch(e => {
                reject(e);
            });
        });
    }
    getUserInfo() {
        return new Promise((resolve, reject) => {
            this._req({
                uri: "https://api.deezer.com/user/me",
                qs: {
                    access_token: this.oauthCode
                },
                json: true
            }).then(res => {
                this.user = res;
                resolve(this.user);
            }).catch(e => {
                reject(e);
            });
        });
    }
    getFavoriteTracks() {
        return new Promise((resolve, reject) => {
            this._req({
                uri: "https://api.deezer.com/user/me/tracks",
                qs: {
                    access_token: this.oauthCode,
                    limit: 1000
                },
                json: true
            }).then(res => {
                resolve(res);
            }).catch(e => {
                reject(e);
            });
        });
    }
    getTopTracks() {
        return new Promise((resolve, reject) => {
            this._req({
                uri: "https://api.deezer.com/user/me/charts/tracks",
                qs: {
                    access_token: this.oauthCode,
                    limit: 100
                },
                json: true
            }).then(res => {
                resolve(res);
            }).catch(e => {
                reject(e);
            });
        });
    }
    getLastHundred() {
        return new Promise((resolve, reject) => {
            this._req({
                uri: "https://api.deezer.com/user/me/history",
                qs: {
                    access_token: this.oauthCode,
                    limit: 100
                },
                json: true
            }).then(res => {
                resolve(res);
            }).catch(e => {
                reject(e);
            });
        });
    }
}

module.exports = { DeezerAPIConnection };