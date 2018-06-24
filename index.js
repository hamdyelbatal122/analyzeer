
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
        secret: json.secret_key
    };
}

async function loadStatics() {
    let fs = require("fs");
    global._static = {};
    fs.readdirSync("./static").forEach(file => {
        global._static[file.replace(/\.[^/.]+$/ , "")] = fs.readFileSync("./static/"+file, {encoding: "utf-8"});
    });
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

async function buildReport(data) {
    return data;
}

async function renderHTML(report) {
    return JSON.stringify(report);
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
            harvestAPI(req.query.code).then(data => {
                return buildReport(data);
            }).then(report => {
                return renderHTML(report);
            }).then(html => {
                res.send(html);
            }).catch(e => {
                res.status(500).send(global._static.internerror);
            });
        } else {
            res.redirect(302, `https://connect.deezer.com/oauth/auth.php?app_id=${global._deezerapp.id}&redirect_uri=https://analyzeer.squared.codebrew.fr&perms=basic_access,listening_history`);
        }
    });

    app.listen(9090);
}

// Helpers

function isModuleAvailable(name) {
    try {
        require.resolve(name);
        return true;
    } catch(e){}
    return false;
}
