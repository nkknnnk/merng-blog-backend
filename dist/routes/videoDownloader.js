"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express = require("express");
const router = express.Router();
const { mediaController, download } = require("../controllers/videoDownloader");
router.post("/download", mediaController);
router.post("/downloader", download);
module.exports = router;
//# sourceMappingURL=videoDownloader.js.map