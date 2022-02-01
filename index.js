"use strict";
exports.__esModule = true;
var rl = require("readline");
var readline = rl.createInterface({
    input: process.stdin,
    output: process.stdout
});
var loadMenu = function () {
    console.log("1. Download Spotify Playlist");
    readline.question("Please select an option:", function (option) {
        switch (option) {
            case "1":
                console.log("First option selected");
            default:
                console.log("Please select an option:");
        }
    });
};
