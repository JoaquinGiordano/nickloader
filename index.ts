import axios from "axios"
import * as rl from "readline"
import dotenv from "dotenv"
import express, { Response, Request } from "express"
import { execSync } from "child_process"
import fs from "fs"
//@ts-ignore
import opn from "opn"

dotenv.config()

const readline = rl.createInterface({
    input: process.stdin,
    output: process.stdout,
})

let actualToken: string =
    "BQDlk0J1hjGPNOl_wABPMqqcTBBn4aCVfSVuDBUzBmvOc1EfxpLSVM59IwWGZbY1yVCII49q3GxXT-a8JIvYFJanGxXI0wqvIFnXrxXG86i09NuNlVoqyKGlFy7q2RLk8efbwGU7duGO5gGlNM2NqcSqetS99HWBs4R7KvxYn_cLVwP2RQpjAvyArwWKJ06uGR7i8LrmzAJISnbsVmUcB8RU-EvAvCBep-nGqnQFyWxJxC_URIz9dSIFnPNS4QP6xyknVDAgf_ETjHO2O3IS-gM"
let loop = 1
let generalOffset = 10
let startsAt = 0

const loadMenu = () => {
    console.clear()
    console.log(`\x1b[36m
    ███╗  ██╗██╗ █████╗ ██╗  ██╗██╗      █████╗  █████╗ ██████╗ ███████╗██████╗ 
    ████╗ ██║██║██╔══██╗██║ ██╔╝██║     ██╔══██╗██╔══██╗██╔══██╗██╔════╝██╔══██╗
    ██╔██╗██║██║██║  ╚═╝█████═╝ ██║     ██║  ██║███████║██║  ██║█████╗  ██████╔╝
    ██║╚████║██║██║  ██╗██╔═██╗ ██║     ██║  ██║██╔══██║██║  ██║██╔══╝  ██╔══██╗
    ██║ ╚███║██║╚█████╔╝██║ ╚██╗███████╗╚█████╔╝██║  ██║██████╔╝███████╗██║  ██║
    ╚═╝  ╚══╝╚═╝ ╚════╝ ╚═╝  ╚═╝╚══════╝ ╚════╝ ╚═╝  ╚═╝╚═════╝ ╚══════╝╚═╝  ╚═╝
                                   
                    █▀▀▄ █  █   █▀▀ █▀▀█ █▀▀▄ █▀▀█ █▀▀ █▀▀█ █▀▀▄ 
                    █▀▀▄ █▄▄█   ▀▀█ █▄▄█ █  █ █  █ █   █  █ █  █ 
                    ▀▀▀  ▄▄▄█   ▀▀▀ ▀  ▀ ▀▀▀  ▀▀▀▀ ▀▀▀ ▀▀▀▀ ▀  ▀ 
                    \x1b[0m\n`)

    console.log("1. Download Spotify Playlist")
    console.log("2. TEST\n")

    readline.question("Please select an option: ", (option) => {
        switch (option) {
            case "1":
                console.clear()

                readline.question("Enter your playlist ID: ", (playlistId) => {
                    if (!fs.existsSync("./token.key")) {
                        if (!actualToken) {
                            let server = express()

                            server.get(
                                "/login",
                                (req: Request, res: Response) => {
                                    var state = (Math.random() + 1)
                                        .toString(36)
                                        .substring(7)
                                    res.redirect(
                                        `https://accounts.spotify.com/authorize?client_id=${process.env.CLIENT_ID}&redirect_uri=http://localhost:2002/getCode&response_type=code&state=${state}`
                                    )
                                }
                            )
                            server.get(
                                "/getCode",
                                (req: Request, res: Response) => {
                                    //@ts-ignore

                                    axios({
                                        url: "https://accounts.spotify.com/api/token",
                                        method: "POST",
                                        headers: {
                                            "Content-Type":
                                                "application/x-www-form-urlencoded",
                                            Authorization:
                                                "Basic " +
                                                new Buffer(
                                                    process.env.CLIENT_ID +
                                                        ":" +
                                                        process.env
                                                            .CLIENT_SECRET
                                                ).toString("base64"),
                                        },
                                        params: {
                                            code: req.query.code,

                                            grant_type: "client_credentials",
                                        },
                                    }).then((response) => {
                                        //@ts-ignore
                                        actualToken = response.data.access_token
                                        startDownload(
                                            actualToken,
                                            generalOffset,
                                            playlistId
                                        )
                                        res.send(
                                            "<h1>You can go back to the app</h1>"
                                        )
                                    })
                                }
                            )

                            server.listen(2002, () => {
                                console.log("Server Listening...")
                                opn("http://localhost:2002/login")
                            })
                        } else {
                            startDownload(
                                actualToken,
                                generalOffset,
                                playlistId
                            )
                        }
                    } else {
                        const token = fs.readFileSync("./token.key").toString()
                        actualToken = token
                        startDownload(token, generalOffset, playlistId)
                    }
                })
                break
            case "2":
                loadMenu()
                break
            default:
                loadMenu()
                break
        }
    })
}

//@ts-ignore
const startDownload = (token: any, offset: number = 0, playlist: string) => {
    var bar = require("progress-bar").create(process.stdout)

    let count = 0
    axios
        .get(
            `https://api.spotify.com/v1/playlists/${playlist}/tracks?market=ES&scope=playlist-read-public,playlist-read-private&fields=items(added_by.id%2Ctrack(name%2Crelease_date%2Chref%2Cartists(name)))&limit=${
                offset * loop
            }&offset=${offset * (loop - 1) + startsAt}`,
            { headers: { Authorization: `Bearer ${token}` } }
        )
        .then((res) => {
            let items = res.data.items

            //@ts-ignore
            items.forEach((item) => {
                let name = item.track.name.split("-")[0].split("(")[0]

                let artist = item.track.artists[0].name

                if (
                    fs
                        .readdirSync("./Downloads/")
                        .indexOf(`${name} - ${artist}.mp3`) > -1 ||
                    fs
                        .readdirSync("./Downloads/")
                        .indexOf(`${name} - ${artist}.m4a.part`) > -1
                ) {
                    if (count >= items.length) {
                        count = 0
                    } else {
                        count++
                    }

                    bar.update((1 / items.length) * count)
                    return
                }
                console.clear()

                console.log(`${name} - ${artist}.mp3`)

                console.log(
                    `\n\x1b[0m                        Song ${count}/${items.length}\n`
                )

                console.log(`${name}- ${artist} \n`)
                console.log("\x1b[32m\x1b[5m")
                bar.update((1 / items.length) * count)
                console.log("\n\x1b[0m\x1b[2m")
                execSync(
                    `youtube-dl "ytsearch:${name} - ${artist} audio hq" --extract-audio --audio-format mp3 -o "./Downloads/${name} - ${artist}.%(ext)s"`,
                    { stdio: "inherit" }
                )
                count++
            })

            loop++

            console.log("loop:", loop)
            if (items.length > 0) {
                startDownload(actualToken, generalOffset, playlist)
            } else {
                loadMenu()
            }
        })
}

const app = {
    start: () => {
        loadMenu()
    },
}

app.start()
