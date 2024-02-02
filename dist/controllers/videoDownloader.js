"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const { JSDOM } = require("jsdom");
const { TiktokDL } = require("@tobyg74/tiktok-api-dl");
const ytdl = require("ytdl-core");
const { ndown, tikdown, ytdown, twitterdown, } = require("nayan-media-downloader");
exports.download = async (req, res) => {
    const url = req.body.video_url;
    console.log(url);
    try {
        if (url.match("facebook.com") || url.match("instagram.com")) {
            let FBURL = await ndown(url);
            console.log("fb&ints: ", FBURL);
            return res.json({ FBURL });
        }
        if (url.match("youtu.be")) {
            let YtURL = await ytdown(url);
            console.log("fb&ints: ", YtURL);
            return res.json({ YtURL });
        }
        if (url.match("twitter.com")) {
            let XURL = await twitterdown(url);
            console.log("fb&ints: ", XURL);
            return res.json({ XURL });
        }
    }
    catch (error) {
        return res.status(500).send({ error: true, msg: error.message });
    }
};
// let TikTokURL = await tikdown("https://vt.tiktok.com/ZSNvs6h6o/")
// console.log("tiktok: ", TikTokURL)
// console.log("YT: ",YtURL)
// console.log("YT: ",XURL)
exports.mediaController = async (req, res) => {
    let url = req.body.video_url;
    console.log("media api");
    try {
        if (url.match("pin.it")) {
            // @ts-ignore
            const longUrl = await expandURL(url);
            const { hostname, pathname } = new URL(longUrl);
            const path = pathname.replace("/sent/", "");
            const finalUrl = `https://${hostname}${path}`;
            const response = await fetch(finalUrl);
            if (!response.ok) {
                throw new Error(`HTTP error ${response.status}`);
            }
            const body = await response.text();
            const video = new JSDOM(body).window.document.getElementsByTagName("video")[0].src;
            const outUrl = video.replace("/hls/", "/720p/").replace(".m3u8", ".mp4");
            console.log(outUrl);
            return res.status(200).send({
                url: outUrl,
            });
        }
        if (url.match("pinterest.com")) {
            const { hostname, pathname } = new URL(url);
            const path = pathname.replace("/sent/", "");
            const finalUrl = `https://${hostname}${path}`;
            //   console.log(finalUrl)
            const response = await fetch(finalUrl);
            if (!response.ok) {
                throw new Error(`HTTP error ${response.status}`);
            }
            const body = await response.text();
            //   console.log(body)
            const video = new JSDOM(body).window.document.getElementsByTagName("video")[0].src;
            const outUrl = video.replace("/hls/", "/720p/").replace(".m3u8", ".mp4");
            console.log(outUrl);
            return res.status(200).send({
                url: outUrl,
            });
        }
        if (url.match("tiktok.com")) {
            TiktokDL(url).then((result) => {
                return res.send(result);
                // console.log(result)
            });
        }
        if (url.match("youtube.com")) {
            const videoID = ytdl.getURLVideoID(url);
            await ytdl.getInfo(videoID).then((info) => {
                const link = info.formats.filter((vl) => vl.itag == 18)[0].url;
                return res.send({ url: link });
            });
        }
        if (url.match("youtu.be")) {
            const videoID = ytdl.getURLVideoID(url);
            await ytdl.getInfo(videoID).then((info) => {
                const link = info.formats.filter((vl) => vl.itag == 18)[0].url;
                return res.send({ url: link });
            });
        }
        if (url.match("facebook.com")) {
            let FBURL = await ndown(url);
            // console.log("fb&ints: ", FBURL);
            if (FBURL.status) {
                return res.json({ status: FBURL.status, url: "", data: FBURL.data });
            }
            return res.json({ url: "", msg: "Something went Wrong please try again!" });
        }
        if (url.match("instagram.com")) {
            let FBURL = await ndown(url);
            // console.log("fb&ints: ", FBURL);
            if (FBURL.status) {
                return res.json({ status: FBURL.status, url: "", data: FBURL.data });
            }
            return res.json({ url: "", msg: "Something went Wrong please try again!" });
        }
        // if (url.match("youtu.be")) {
        //   let YtURL = await ytdown(url);
        //   // console.log("fb&ints: ", YtURL);
        //   if (YtURL.status) {
        //     return res.json({ status: YtURL.status, url: "", data: YtURL.data });
        //   }
        //   return res.json({ url: "", msg: "Something went Wrong please try again!" });
        // }
        if (url.match("twitter.com")) {
            let XURL = await twitterdown(url);
            // console.log("fb&ints: ", XURL);
            if (XURL.status) {
                return res.json({ url: XURL?.data?.HD });
            }
            return res.json({ url: "", msg: "Something went Wrong please try again!" });
        }
    }
    catch (error) {
        console.log(error);
        return res.status(500).send({ error });
    }
};
//# sourceMappingURL=videoDownloader.js.map