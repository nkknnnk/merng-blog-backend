"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const app = require("./app");
const connection_1 = require("./utils/connection");
(0, connection_1.connectToDatabase)()
    .then(() => {
    app.listen(process.env.PORT, () => console.log(`Server Open On Port ${process.env.PORT}`));
})
    .catch((err) => console.log(err));
//# sourceMappingURL=server.js.map