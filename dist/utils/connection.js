"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.connectToDatabase = void 0;
const mongoose_1 = require("mongoose");
const connectToDatabase = async () => {
    try {
        await (0, mongoose_1.connect)(`${process.env.MONGO_URI}`);
    }
    catch (error) {
        console.log(error);
        return error;
    }
};
exports.connectToDatabase = connectToDatabase;
//# sourceMappingURL=connection.js.map