"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.isAuthenticated = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const isAuthenticated = async (req, res, next) => {
    try {
        const BearorToken = req.headers["authorization"];
        const token = req.headers["authorization"]?.split(" ")[1]; // Get token from cookie or header
        console.log(token);
        if (!token)
            return res
                .status(401)
                .send({ success: false, message: "Please login to access this route" });
        const decodedData = jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET);
        // @ts-ignore
        if (decodedData._id) {
            // @ts-ignore
            req.userId = decodedData._id;
            next();
        }
        else {
            return res.status(403).send({ success: false, message: "Invalid Token" });
        }
    }
    catch (error) {
        console.log(error.message);
        return res
            .status(403)
            .json({ success: false, message: "Login Expired Please login again!" });
    }
};
exports.isAuthenticated = isAuthenticated;
//# sourceMappingURL=auth.js.map