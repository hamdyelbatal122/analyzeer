import io from "socket.io-client";
import {WOW} from "wowjs";

const socket = io();
const identifier = window.location.search.slice(6) || window.location.pathname.slice(1);

socket.emit("apiconnect", identifier, res => {
    if (res.startsWith("200")) {
        window.isRegistered = (res === "200 CONNECTED") ? true : false;
        window.isOwner = (res === "200 IDENTIFIED") ? true : false;
        socket.emit("data request", res => {
            if (res === "Error") {
                socket.disconnect();
                window.location.assign("/500");
            } else {
                render(res);
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
    <section id="user" class="wow fadeInUp">
        <img src="${data.user.picture_medium}" alt="${data.user.name}'s photo'" />
        <h1>${data.user.name} <span>#${data.user.id}</span></h1>
        <h3>On Deezer since ${data.user.inscription_date}</h3>
        <a href="${data.user.link}" target="_blank">View on Deezer</a>
    </section>`;

    new WOW({live:false}).init();
}
