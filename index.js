
// Startup

if (isModuleAvailable("now-env")) {
    require("now-env");
}
parseSettings().then(startServer);

// Main functions

async function parseSettings() {
    let json = JSON.parse(process.env.APP_SETTINGS);
    global._deezer = {
        appid: json.appid,
        key: json.secret_key
    };
}

async function loadStatics() {
    let fs = require("fs");
    global._static = {};
    fs.readdirSync("./static").forEach(file => {
        global._static[file.replace(/\.[^/.]+$/ , "")] = fs.readFileSync("./static/"+file, {encoding: "utf-8"});
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
            // We got it!
        } else {
            res.redirect(302, `https://connect.deezer.com/oauth/auth.php?app_id=${global._deezer.appid}&redirect_uri=https://analyzeer.squared.codebrew.fr&perms=basic_access,listening_history`);
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
