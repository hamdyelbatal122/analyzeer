import io from "socket.io-client";
import {WOW} from "wowjs";

const socket = io();
const identifier = window.location.search.slice(6) || window.location.pathname.slice(1);

if (window.history.replaceState) {
    window.history.replaceState("", "Analyzeer", window.location.origin);
}

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
    <section id="user" class="wow fadeInLeft">
        <img src="${data.user.picture_medium}" alt="${data.user.name}'s photo'" />
        <h1>${data.user.name} <span>#${data.user.id}</span></h1>
        <h3>On Deezer since ${data.user.inscription_date}</h3>
        <a href="${data.user.link}" target="_blank">View on Deezer</a>
    </section>
    <section id="account" class="wow fadeInDown yellow" data-wow-delay="300ms">
        <h1>Analyzeer account</h1>
    </section>
    <section id="credits" class="wow fadeInRight dark" data-wow-delay="600ms">
        <h1>Credits</h1>
    </section>
    <section id="info1" class="wow fadeInLeft" data-wow-delay="950ms">
        <h1>Info1</h1>
    </section>
    <section id="graph1" class="wow fadeInUp blue" data-wow-delay="800ms">
        <h1>Graph1</h1>
    </section>
    <section id="stat1" class="wow fadeInRight pink" data-wow-delay="1s">
        <h1>Stat1</h1>
    </section>
    <section id="stat2" class="wow fadeInUp pink" data-wow-delay="1200ms">
        <h1>Stat2</h1>
    </section>
    <section id="info2" class="wow fadeInUp" data-wow-delay="1400ms">
        <h1>Info2</h1>
    </section>
    <section id="stat3" class="wow fadeInRight pink" data-wow-delay="1600ms">
        <h1>Stat3</h1>
    </section>
    <section id="info3" class="wow fadeInUp" data-wow-delay="1800ms">
        <h1>Info3</h1>
    </section>
    <section id="graph2" class="wow fadeInUp blue" data-wow-delay="2s">
        <h1>Graph2</h1>
    </section>`;

    new WOW({live:false}).init();
}
