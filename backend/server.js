
// Startup

if (isModuleAvailable("now-env")) {
    require("now-env");
}
parseSettings().then(startServer);

// Main functions

async function parseSettings() {
    let json = JSON.parse(process.env.APP_SETTINGS.replace(/\n/g, "\\n"));
    global._deezerapp = {
        id: json.appid,
        secret: json.secret_key
    };
    global._settings = json;
}

async function loadStatics() {
    let fs = require("fs");
    global._static = {
        get app() {
            if (process.env.DEV_MODE === "ACTIVATED") {
                return fs.readFileSync("./webapp/index.html", {encoding:"utf-8"});
            } else {
                return this._app;
            }
        },
        get appbundle() {
            if (process.env.DEV_MODE === "ACTIVATED") {
                return fs.readFileSync("./webapp/dist/bundle.js", {encoding:"utf-8"});
            } else {
                return this._appbundle;
            }
        }
    };
    fs.readdirSync("./static").forEach(file => {
        let encoding;
        switch(file.split('.').pop()) {
            case "html":
            case "js":
            case "css":
                encoding = "utf-8";
                break;
            default:
                encoding = null;
        }

        let name = file.replace(/\.[^/.]+$/ , "");
        if (file === name) return false; // Prevent trying to read directories
        global._static["_"+name] = fs.readFileSync("./static/"+file, {encoding});

        Object.defineProperty(global._static, name, {
            get: function() {
                if (process.env.DEV_MODE === "ACTIVATED") {
                    return fs.readFileSync("./static/"+file, {encoding});
                } else {
                    return this["_"+name];
                }
            }
        });
    });
    global._static._app = fs.readFileSync("./webapp/index.html", {encoding:"utf-8"});
    global._static._appbundle = fs.readFileSync("./webapp/dist/bundle.js", {encoding:"utf-8"});

    global._static.res = {};
    fs.readdirSync("./static/res").forEach(file => {
        let encoding;
        switch(file.split('.').pop()) {
            case "html":
            case "js":
            case "css":
                encoding = "utf-8";
                break;
            default:
                encoding = null;
        }

        let name = file.replace(/\.[^/.]+$/ , "");
        if (file === name) return false; // Prevent trying to read directories
        global._static.res["_"+name] = fs.readFileSync("./static/res/"+file, {encoding});

        Object.defineProperty(global._static.res, name, {
            get: function() {
                if (process.env.DEV_MODE === "ACTIVATED") {
                    return fs.readFileSync("./static/res/"+file, {encoding});
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
    const {DbUtils} = require("./classes/db-utils.class.js");
    const db = new DbUtils(global._settings.db);

    await db.testDBConnection().catch(e => {console.log(e);process.abort()});
    console.log(`Connected to ${global._settings.db.database} database at ${global._settings.db.host}`);

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
            res.redirect(302, `https://connect.deezer.com/oauth/auth.php?app_id=${global._deezerapp.id}&redirect_uri=${global._settings.url}&perms=basic_access,listening_history`);
        }
    });
    app.get("/register(/:conf?)", (req, res) => {
        if (process.env.DEV_MODE === "ACTIVATED") {
            res.status(418).send("Register endpoint not accessible in dev mode.");
            return false;
        }
        if (req.query.error_reason) {
            res.send(global._static.autherror);
        } else if (req.query.code && (req.params.conf === "public" || req.params.conf === "private")) {
            let api = new DeezerAPIConnection();
            api.getOauthToken(global._deezerapp, req.query.code).then(() => {
                api.getUserInfo().then(u => {
                    let isPublic = req.params.conf === "public" ? true : false;
                    db.createUser(u, api.oauthCode, isPublic).then(() => {
                        res.status(201).send(global._static.registersuccess);
                    }).catch(e => {
                        res.redirect(302, "/500");
                    });
                }).catch(() => {
                    res.redirect(302, "/500");
                });
            }).catch(() => {
                res.send(global._static.autherror);
            });
        } else {
            let conf = "/private";
            if (req.params.conf === "public") {
                conf = "/public";
            }
            res.redirect(302, `https://connect.deezer.com/oauth/auth.php?app_id=${global._deezerapp.id}&redirect_uri=${global._settings.url}/register${conf}&perms=basic_access,email,offline_access,listening_history`);
        }
    });

    app.get("/app/bundle.js", (req, res) => {
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
    app.get("/403", (req, res) => {
        res.send(global._static.privateerror);
    });
    app.get("/404", (req, res) => {
        res.send(global._static.notfounderror);
    });

    app.get("/:user", (req, res) => {
        if (req.query.code) {
            res.redirect(302, `/?code=${req.query.code}`);
        } else {
            res.send(global._static.app);
        }
    });

    io.on("connection", socket => {
        let api = new DeezerAPIConnection();
        socket.once("apiconnect", (identifier, res) => {
            db.findUser(identifier).then(u => {
                if (u.public === 1) {
                    api.setOauthToken(u.token);
                    res({
                        status: 1,
                        statusString: "Viewing public page",
                        id: u.id,
                        name: u.name,
                        public: (u.public === 1) ? true : false
                    });
                } else {
                    res("403 UNAUTHORIZED");
                }
            }).catch(e => {
                if (e === "Not found") {
                    if (process.env.DEV_MODE === "ACTIVATED") {
                        res({
                            status: 2,
                            statusString: "Connected",
                            id: 1234567,
                            name: "DevMode",
                            public: true,
                            emails: false
                        });
                        return true;
                    }
                    api.getOauthToken(global._deezerapp, identifier).then(() => {
                        api.getUserInfo().then(du => {
                            db.findUser(du.id).then(u => {
                                if (du.name !== u.name || du.email !== u.email) {
                                    db.updateUser({
                                        id: du.id,
                                        name: du.name,
                                        email: du.email || u.email
                                    }).catch(e => {
                                        // Fail silently
                                    });
                                }
                                res({
                                    status: 2,
                                    statusString: "Connected",
                                    id: u.id,
                                    name: du.name,
                                    email: du.email || u.email,
                                    public: (u.public === 1) ? true : false,
                                    emails: (u.emails === 1) ? true : false
                                });
                            }).catch(e => {
                                res({
                                    status: 0,
                                    statusString: "Not linked"
                                });
                            });
                        }).catch(e => {
                            res(e);
                        });
                    }).catch(e => {
                        res("404 NOT FOUND");
                    });
                } else {
                    res(e);
                }
            });
        });
        socket.on("data request", res => {
            harvestAPI(api).then(data => {
                res(data);
            }).catch(e => {
                res("Error");
            });
        });
        socket.on("update user", (usr, res) => {
            db.updateUser(usr).then(() => {
                res("200 OK");
            }).catch(e => {
                if (e === "Nothing changed") {
                    res("400 NO UPDATE");
                } else {
                    res(e);
                }
            });
        });
    });

    http.listen(global._settings.port, () => {
        console.log(`Listening @ ${global._settings.url}:${global._settings.port}`);
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
