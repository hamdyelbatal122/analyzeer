import "babel-polyfill";

import io from "socket.io-client";
import {WOW} from "wowjs";
import Chart from "chart.js";
import copy from "copy-text-to-clipboard";
import durations from "durations";
window.ncopy = copy;

const socket = io();
const identifier = window.location.search.slice(6) || window.location.pathname.slice(1);

if (window.history.replaceState && window.location.pathname === "/") {
    window.history.replaceState("", "Analyzeer", window.location.origin);
}

socket.emit("apiconnect", identifier, res => {
    if (typeof(res.status) === "number") {
        window.analyzeer = res;
        socket.emit("data request", res => {
            if (res === "Error") {
                socket.disconnect();
                window.location.assign("/500");
            } else {
                process(res).then(d => {
                    render(d);
                }).catch(e => {
                    socket.disconnect();
                    window.location.assign("/500");
                });
            }
        });
    } else if (res === "403 UNAUTHORIZED") {
        socket.disconnect();
        window.location.assign("/403");
    } else if (res === "404 NOT FOUND") {
        socket.disconnect();
        window.location.assign("/404");
    } else {
        socket.disconnect();
        window.location.assign("/500");
    }
});

async function process(data) {

    if (window.analyzeer.status === 0) {
        window.registerWindow = null;
        window.register = () => {
            if (window.registerWindow === null || window.registerWindow.closed) {

                let y = window.top.outerHeight / 2 + window.top.screenY - ( 600 / 2);
                let x = window.top.outerWidth / 2 + window.top.screenX - ( 600 / 2);
                window.registerWindow = window.open("/register", "Create an Analyzeer account", `top=${y},left=${x},height=600,width=600,dialog,resizable,scrollbars,status`);

                window.registerWindowTimer = setInterval(() => {
                    if(window.registerWindow.closed) {
                        clearInterval(window.registerWindowTimer);
                        window.location.assign("/");
                    }
                }, 1000);
            } else {
                window.registerWindow.focus();
            }
        };
    }

    switch(data.user.status) {
        case 2:
            data.user.statusString = "Premium+";
            break;
        case 1:
            data.user.statusString = "Premium";
            break;
        default:
            data.user.statusString = "Free";
    }

    // Favorite tracks general stats
    let counter = 0;
    data.tracks.data.forEach(track => {
        counter += track.duration;
    });
    data.tracks.totalDuration = counter;
    data.tracks.totalDurationString = durations.seconds(counter).format();
    data.tracks.averageDuration = Math.round(data.tracks.totalDuration / data.tracks.total);
    data.tracks.averageDurationString = durations.seconds(data.tracks.averageDuration).format();

    // Top artists
    let topArtists = {};
    data.tracks.data.forEach(track => {
        if (!topArtists[track.artist.name]) {
            topArtists[track.artist.name] = {
                name: track.artist.name,
                pic: track.artist.picture_medium,
                tracks: [track]
            };
        } else {
            topArtists[track.artist.name].tracks.push(track);
        }
    });
    let topArtistsArray = [];
    Object.keys(topArtists).forEach(key => {
        topArtistsArray.push(topArtists[key]);
    });
    topArtistsArray.sort((a, b) => { return b.tracks.length - a.tracks.length; });
    data.tracks.topArtists = topArtistsArray.slice(0,10);

    // Charts datasets
    window.charts = {};

    return data;
}

function render(data) {
    window.deezerRawData = data;
    window.root = document.getElementById("app-root");

    document.getElementsByClassName("sk-wave")[0].remove();
    if (window.isRegistered) {
        window.root.setAttribute("class", "connected");
    } else {
        window.root.removeAttribute("class");
    }

    window.root.innerHTML += `
    <section id="user" class="wow fadeInLeft white">
        <img src="${data.user.picture_medium}" alt="${data.user.name}'s photo'" />
        <h1>${data.user.name} <span>#${data.user.id}</span></h1>
        <h3>On Deezer since ${data.user.inscription_date} - From ${data.user.country}!<br/>
            Subscription: ${data.user.statusString}</h3>
        <a class="button" href="${data.user.link}" target="_blank">View on Deezer</a>
    </section>
    <section id="account" class="wow fadeInDown yellow" data-wow-delay="300ms">
        <h1>Analyzeer | ${window.analyzeer.statusString}</h1>
    </section>
    <section id="credits" class="wow fadeInRight dark" data-wow-delay="600ms">
        <h1>Credits</h1>
        <img src="res/deezer.png" alt="Deezer logo"/>
        <p>Made with ♥ by <a href="https://squared.codebrew.fr" target="_blank">Squared</a><br/>
            Using <a href="https://deezer.com/" target="_blank">Deezer</a>'s API<br/>
            Source hosted <a href="https://github.com/GitSquared/analyzeer" target="_blank">on GitHub</a><br/>
            App deployed on <a href="https://zeit.co/now" target="_blank">Now</a>
        </p>
    </section>
    <section id="info1" class="wow fadeInLeft white" data-wow-delay="950ms">
        <h1>${data.tracks.total} Favorite Tracks</h1>
        <p>Your playlist contains <strong>${data.tracks.totalDurationString}</strong> of music.<br/>
        The average song is <strong>${data.tracks.averageDurationString}</strong> long.</p>
    </section>
    <section id="graph1" class="wow fadeInUp blue" data-wow-delay="800ms">
        <h1>Top ${data.tracks.topArtists.length} artists <span>by # of tracks in Favorites</span></h1>
        <canvas id="graph-topArtists">
        </canvas>
    </section>
    <section id="stat1" class="wow fadeInRight pink" data-wow-delay="1s">
        <h1>Stat1</h1>
    </section>
    <section id="stat2" class="wow fadeInUp pink" data-wow-delay="1200ms">
        <h1>Stat2</h1>
    </section>
    <section id="info2" class="wow fadeInUp white" data-wow-delay="1400ms">
        <h1>Info2</h1>
    </section>
    <section id="stat3" class="wow fadeInRight pink" data-wow-delay="1600ms">
        <h1>Stat3</h1>
    </section>
    <section id="info3" class="wow fadeInUp white" data-wow-delay="1800ms">
        <h1>Info3</h1>
    </section>
    <section id="graph2" class="wow fadeInUp blue" data-wow-delay="2s">
        <h1>Graph2</h1>
    </section>`;

    renderAccountSection(data);
    renderCharts(data);

    new WOW({live:false}).init();
}

function renderAccountSection(data) {
    document.getElementById("account").innerHTML = `<h1>Analyzeer | ${window.analyzeer.statusString}</h1>`;
    switch(window.analyzeer.status) {
        case 2:
            document.getElementById("account").setAttribute("class", document.getElementById("account").getAttribute("class")+" connected");
            if (window.analyzeer.public === true) {
                document.getElementById("account").innerHTML += `
                <p>Use this link to share your statistics:   <a class="button" href="/${data.user.id}" target="_blank">${window.location.host}/${data.user.id}</a> | <a href="#" onclick="window.ncopy('${window.location.host}/${data.user.id}');event.target.innerText = 'Copied!'; return false;">Copy</a>
                </p>`;
            } else {
                document.getElementById("account").innerHTML += `
                <p>Your account is private: your statistics cannot be accessed through a public link.</p>`;
            }
            document.getElementById("account").innerHTML += `
            <div>
                <label class="switch-light switch-material" onclick="">
                    <input id="account-switch-type" type="checkbox" ${(window.analyzeer.public ? "checked" : "")} />
                    <strong>Account type</strong><br/>
                    <strong>Private</strong>
                    <span aria-hidden="true">
                        <a></a>
                    </span>
                    <strong>Public</strong>
                </label>
                <label class="switch-light switch-material" onclick="">
                    <input id="account-switch-emails" type="checkbox" ${(window.analyzeer.emails ? "checked" : "")} />
                    <strong>Monthly emails</strong><br/>
                    <strong>Off</strong>
                    <span aria-hidden="true">
                        <a></a>
                    </span>
                    <strong>On</strong>
                </label>
            </div>`;

            let typeCheck = document.getElementById("account-switch-type");
            let mailCheck = document.getElementById("account-switch-emails");
            typeCheck.onchange = () => {
                if (typeCheck.checked) {
                    window.analyzeer.public = true;
                    socket.emit("update user", window.analyzeer, res => {
                        if (res !== "200 OK") {
                            typeCheck.checked = false;
                        } else {
                            renderAccountSection(window.deezerRawData);
                        }
                    });
                } else {
                    window.analyzeer.public = false;
                    socket.emit("update user", window.analyzeer, res => {
                        if (res !== "200 OK") {
                            typeCheck.checked = true;
                        } else {
                            renderAccountSection(window.deezerRawData);
                        }
                    });
                }
            };
            mailCheck.onchange = () => {
                if (mailCheck.checked) {
                    window.analyzeer.emails = true;
                    socket.emit("update user", window.analyzeer, res => {
                        if (res !== "200 OK") {
                            mailCheck.checked = false;
                        } else {
                            renderAccountSection(window.deezerRawData);
                        }
                    });
                } else {
                    window.analyzeer.emails = false;
                    socket.emit("update user", window.analyzeer, res => {
                        if (res !== "200 OK") {
                            mailCheck.checked = true;
                        } else {
                            renderAccountSection(window.deezerRawData);
                        }
                    });
                }
            };
            break;
        case 1:
            document.getElementById("account").innerHTML += `
            <p>You're viewing ${data.user.name}'s Deezer statistics on Analyzeer.<br/>
                Analyzeer is a free tool that gives you an overview of your listening habits and trends. It can even send you a monthly summary email! <a class="button" href="/">Try it today. No registration needed.</a><br/><br/>
                P.S: If you're ${data.user.name}, follow <a href="/">this link</a> to access your settings.
            </p>`;
            break;
        default:
            document.getElementById("account").innerHTML += `
            <p>By creating an Analyzeer account, you can share your statistics with a unique link, track your listening habits over time, and get monthly summary emails. All of these features are optional and can be disabled at all time.<br/><br/>
                <a class="button" href="/register" target="_blank" onclick="window.register();return false;">Register now!</a> It takes just a few seconds.`;
    }
}

function renderCharts(data) {
    window.charts = [];
    const Chart = require("chart.js");

    // Top Artists
    let container = document.getElementById("graph-topArtists");
    if (data.tracks.topArtists.length !== 10) {
        container.innerHTML = `<h1>Sorry, we do not have enough data to display something here.`;
    } else {
        let dataset = {
            labels: [],
            datasets: [{
                label: "# of tracks in Favorites",
                data: [],
                backgroundColor: [
                    "#FEEB15",
                    "#E72D63",
                    "#171717",
                    "#02B5C8",
                    "#171717",
                    "#FEEB15",
                    "#E72D63",
                    "#171717",
                    "#02B5C8",
                    "#E72D63"
                ],
                hoverBackgroundColor: [
                    "#fff",
                    "#fff",
                    "#fff",
                    "#fff",
                    "#fff",
                    "#fff",
                    "#fff",
                    "#fff",
                    "#fff",
                    "#fff"
                ]
            }]
        };
        data.tracks.topArtists.forEach(artist => {
            dataset.labels.push(artist.name);
            dataset.datasets[0].data.push(artist.tracks.length);
        });

        window.charts.push(new Chart(container, {
            type: "pie",
            data: dataset,
            options: {
                cutoutPercentage: 50,
                legend: {
                    position: "right",
                    labels: {
                        fontColor: "#fff",
                        fontStyle: "bold"
                    }
                },
                layout: {
                    padding: {
                        bottom: 40
                    }
                }
            }
        }));
    }

}
