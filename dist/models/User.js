"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = require("mongoose");
const bcrypt_1 = __importDefault(require("bcrypt"));
const userSchema = new mongoose_1.Schema({
    name: {
        type: String,
        required: true,
    },
    email: {
        type: String,
        required: true,
        unique: true,
    },
    username: { type: String, unique: true, required: true },
    avatar: {
        public_id: { type: String, default: "public_id" },
        url: {
            type: String,
            default: "https://daisyui.com/images/stock/photo-1534528741775-53994a69daeb.jpg",
        },
    },
    password: {
        type: String,
        required: true,
        minLength: 6,
    },
    blogs: [{ type: mongoose_1.Schema.Types.ObjectId, ref: "Blog" }],
    comments: [{ type: mongoose_1.Schema.Types.ObjectId, ref: "Comment" }],
});
userSchema.pre("save", async function (next) {
    if (!this.isModified("password"))
        return next();
    this.password = await bcrypt_1.default.hash(this.password, 10);
});
exports.default = (0, mongoose_1.model)("User", userSchema);
//# sourceMappingURL=User.js.map