
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
                return fs.readFileSync("./webapp/index.html", {encoding: "utf-8"});
            } else {
                return this._app;
            }
        },
        get appbundle() {
            if (process.env.DEV_MODE === "ACTIVATED") {
                return fs.readFileSync("./webapp/dist/bundle.js", {encoding: "utf-8"});
            } else {
                return this._appbundle;
            }
        }
    };
    fs.readdirSync("./static").forEach(file => {
        let name = file.replace(/\.[^/.]+$/ , "");
        if (file === name) return false; // Prevent trying to read directories
        global._static["_"+name] = fs.readFileSync("./static/"+file, {encoding: "utf-8"});

        Object.defineProperty(global._static, name, {
            get: function() {
                if (process.env.DEV_MODE === "ACTIVATED") {
                    return fs.readFileSync("./static/"+file, {encoding: "utf-8"});
                } else {
                    return this["_"+name];
                }
            }
        });
    });
    global._static._app = fs.readFileSync("./webapp/index.html", {encoding: "utf-8"});
    global._static._appbundle = fs.readFileSync("./webapp/dist/bundle.js", {encoding: "utf-8"});

    global._static.res = {};
    fs.readdirSync("./static/res").forEach(file => {
        let name = file.replace(/\.[^/.]+$/ , "");
        if (file === name) return false; // Prevent trying to read directories
        global._static.res["_"+name] = fs.readFileSync("./static/res/"+file, {encoding: "utf-8"});

        Object.defineProperty(global._static.res, name, {
            get: function() {
                if (process.env.DEV_MODE === "ACTIVATED") {
                    return fs.readFileSync("./static/res/"+file, {encoding: "utf-8"});
                } else {
                    return this["_"+name];
                }
            }
        });
    });
}

async function harvestAPI(api) {
    if (process.env.DEV_MODE === "ACTIVATED") {
        return JSON.parse(require("fs").readFileSync("./sample/data.json", {encoding:"utf-8"}));
    } else {
        return data = {
            user: await api.getUserInfo(),
            tracks: await api.getFavoriteTracks(),
            top: await api.getTopTracks(),
            history: await api.getLastHundred()
        };
    }
}

async function startServer() {
    await loadStatics();

    const {DeezerAPIConnection} = require("./classes/deezer-api-wrapper.class.js");
    const app = require("express")();
    const http = require("http").Server(app);
    const io = require("socket.io")(http);

    app.get("/", (req, res) => {
        if (req.query.error_reason) {
            res.send(global._static.autherror);
        } else if (req.query.code || process.env.DEV_MODE === "ACTIVATED") {
            res.send(global._static.app);
        } else {
            res.redirect(302, `https://connect.deezer.com/oauth/auth.php?app_id=${global._deezerapp.id}&redirect_uri=${global._deezerapp.url}&perms=basic_access,listening_history,offline_access`);
        }
    });

    app.get("/bundle.js", (req, res) => {
        res.send(global._static.appbundle);
    });
    app.get("/res/:file", (req, res ) => {
        let resource = global._static.res[req.params.file.replace(/\.[^/.]+$/ , "")];
        let type = req.params.file.split('.').pop();
        if (resource) {
            res.type(type).send(resource);
        } else {
            res.status(404).send("Not Found");
        }
    });
    app.get("/500", (req, res) => {
        res.send(global._static.internerror);
    });

    io.on("connection", socket => {
        let api = new DeezerAPIConnection();
        socket.once("apiconnect", (code, res) => {
            if (process.env.DEV_MODE === "ACTIVATED") {
                res("200 OK");
            } else {
                api.connect(global._deezerapp, code).then(() => {
                    res("200 OK");
                }).catch(e => {
                    res(e);
                });
            }
        });
        socket.on("data request", res => {
            harvestAPI(api).then(data => {
                res(data);
            }).catch(e => {
                res("Error");
            });
        });
    });

    http.listen(global._deezerapp.port, () => {
        console.log(`Listening @ ${global._deezerapp.url}:${global._deezerapp.port}`);
    });
}

// Helpers

function isModuleAvailable(name) {
    try {
        require.resolve(name);
        return true;
    } catch(e){}
    return false;
}
