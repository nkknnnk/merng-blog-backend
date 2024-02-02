"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
// var bodyParser = require("body-parser");
const dotenv_1 = require("dotenv");
const express_graphql_1 = require("express-graphql");
const handlers_1 = __importDefault(require("./handlers/handlers"));
const cors_1 = __importDefault(require("cors"));
const connection_1 = require("./utils/connection");
const videoDownloader = require("./routes/videoDownloader");
// Dotenv config
(0, dotenv_1.config)();
const app = (0, express_1.default)();
// Middleware
app.use(express_1.default.json());
app.use(express_1.default.urlencoded({ extended: true }));
app.use((0, cors_1.default)());
app.get("/", (req, res) => {
    console.log(req.body.username);
    res.json("Hello World!");
});
app.use("/graphql", (0, express_graphql_1.graphqlHTTP)({ schema: handlers_1.default, graphiql: true }));
app.use("/mediaapi", videoDownloader);
(0, connection_1.connectToDatabase)()
    .then(() => {
    app.listen(process.env.PORT, () => console.log(`Server Open On Port ${process.env.PORT}`));
})
    .catch((err) => console.log(err));
//# sourceMappingURL=app.js.map