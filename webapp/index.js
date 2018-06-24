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
    document.body.append(JSON.stringify(data));

    new WOW({live:false}).init();
}
