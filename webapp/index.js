import io from "socket.io-client";
import {WOW} from "wowjs";

const socket = io();
const code = window.location.search.slice(6);

socket.emit("apiconnect", code, res => {
    if (res === "200 OK") {
        socket.emit("data request", res => {
            if (res === "Error") {
                socket.disconnect();
                window.location.assign("/500");
            } else {
                render(res);
            }
        });
    } else {
        socket.disconnect();
        window.location.assign("/500")
    }
});

function render(data) {
    window.deezerRawData = data;
    window.root = document.getElementById("app-root");

    document.getElementsByClassName("sk-wave")[0].remove();
    window.root.removeAttribute("class");
    window.root.innerHTML += `
    <section id="user" class="wow fadeInUp">
        <img src="${data.user.picture_medium}" alt="${data.user.name}'s photo'" />
        <h1>${data.user.name} <span>#${data.user.id}</span></h1>
        <h3>On Deezer since ${data.user.inscription_date}</h3>
        <a href="${data.user.link}" target="_blank">View on Deezer</a>
    </section>`;

    new WOW({live:false}).init();
}
