
// Startup

if (isModuleAvailable("now-env")) {
    require("now-env");
}
parseSettings().then(startServer);

// Main functions

async function parseSettings() {
    let json = JSON.parse(process.env.APP_SETTINGS);
    global._deezerapp = {
        id: json.appid,
        secret: json.secret_key,
        url: json.url,
        port: json.port
    };
}

async function loadStatics() {
    let fs = require("fs");
    global._static = {
        get app() {
            if (process.env.DEV_MODE === "ACTIVATED") {
                return fs.readFileSync("src/webapp/index.html", {encoding: "utf-8"});
            } else {
                return this._app;
            }
        },
        get appbundle() {
            if (process.env.DEV_MODE === "ACTIVATED") {
                return fs.readFileSync("src/webapp/dist/bundle.js", {encoding: "utf-8"});
            } else {
                return this._appbundle;
            }
        }
    };
    fs.readdirSync("src/static").forEach(file => {
        let name = file.replace(/\.[^/.]+$/ , "");
        global._static["_"+name] = fs.readFileSync("src/static/"+file, {encoding: "utf-8"});

        Object.defineProperty(global._static, name, {
            get: function() {
                if (process.env.DEV_MODE === "ACTIVATED") {
                    return fs.readFileSync("src/static"+file, {encoding: "utf-8"});
                } else {
                    return this["_"+name];
                }
            }
        });
    });
    global._static.app = fs.readFileSync("src/webapp/index.html", {encoding: "utf-8"});
    global._static.appbundle = fs.readFileSync("src/webapp/dist/bundle.js", {encoding: "utf-8"});
}

async function harvestAPI(code) {
    let data = {};
    let api = new DeezerAPIConnection();
    api.connect(global._deezerapp, code).then(() => {
        api.getUserInfo().then(u => {
            data.user = u;
            return api.getFavoriteTracks();
        }).then(t => {
            data.tracks = t;
            return api.getTopTracks();
        }).then(tp => {
            data.top = tp;
            return api.getLastHundred();
        }).then(h => {
            data.history = h;
            return data;
        }).catch(e => {
            throw(e);
        });
    }).catch(e => {
        throw(e);
    });
}

async function startServer() {
    await loadStatics();

    const {DeezerAPIConnection} = require("./classes/deezer-api-wrapper.class.js");
    const express = require("express");
    const app = express();

    app.get("/", (req, res) => {
        if (req.query.error_reason) {
            res.send(global._static.autherror);
        } else if (req.query.code) {
            res.send(global._static.app);
        } else {
            res.redirect(302, `https://connect.deezer.com/oauth/auth.php?app_id=${global._deezerapp.id}&redirect_uri=${global._deezerapp.url}&perms=basic_access,listening_history`);
        }
    });

    app.get("/bundle.js", (req, res) => {
        res.send(global._static.appbundle);
    });

    app.listen(global._deezerapp.port);
}

// Helpers

function isModuleAvailable(name) {
    try {
        require.resolve(name);
        return true;
    } catch(e){}
    return false;
}
