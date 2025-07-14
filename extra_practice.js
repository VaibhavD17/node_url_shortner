import { createServer } from "http"
import { readFile, writeFile } from "fs/promises"
import path from "path"
import crypto from "crypto"

const PORT = 3001
const DATA_FILE = path.join("data", "links.json")

const serverfile = async (res, filepath, contentType) => {
    try {
        const data = await readFile(filepath)
        res.writeHead(200, { "Content-Type": contentType })
        res.end(data)
    } catch (error) {
        res.writeHead(404, { "Content-Type": "text/plain" })
        res.end("404 page not found.")
    }
}

const loadLinks = async () => {
    try {
        const data = await readFile(DATA_FILE, "utf-8")
        return JSON.parse(data)
    } catch (error) {
        if (error.code === "ENENT") {
            await writeFile(DATA_FILE, JSON.parse({}))
            return {};
        }
    }
}

const saveLinks = async (links) => {
    await writeFile(DATA_FILE, JSON.stringify(links))
}

const server = createServer(async (req, res) => {
    if (req.method === "GET") {
        if (req.url === "/") {
            await serverfile(res, path.join("public", "index.html"), "text/html")
        } else if (req.url === "/style.css") {
            await serverfile(res, path.join("public", "style.css"), "text/css")
        } else if (req.url === "/links") {
            const links = await loadLinks()
            res.writeHead(200, { "Content-Type": "application/json" })
            return res.end(JSON.stringify(links))
        } else {
            const links = await loadLinks()
            const shortCode = req.url.slice(1)

            if (links[shortCode]) {
                res.writeHead(302, { location: links[shortCode] })
                return res.end()
            }

            res.writeHead(404, { "Content-Type": "text/plain" })
            return res.end("Shortened URL is not found.")
        }
    }

    if (req.method === "POST" && req.url === "/shorten") {

        let body = "";
        req.on("data", (chunk) => body += chunk)
        req.on("end", async () => {
            const links = await loadLinks()
            console.log(body);
            const { url, shortCode } = JSON.parse(body)

            if (!url) {
                res.writeHead(404, { "Content-Type": "text/plain" })
                return res.end("URL is requird.")
            }

            const finalShortCode = shortCode || crypto.randomBytes(4).toString("hex")

            if (links[finalShortCode]) {
                res.writeHead(404, { "Content-Type": "text/plain" })
                return res.end("Short code has alredy exists. Please choose onother.")
            }

            links[finalShortCode] = url
            await saveLinks(links)


            res.writeHead(200, { "Content-Type": "application/json" })
            res.end(JSON.stringify({ success: true, shortCode: finalShortCode }))

        })
    }
})

server.listen(PORT, console.log(`http://localhost:${PORT}`))