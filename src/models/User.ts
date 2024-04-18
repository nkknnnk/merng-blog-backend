import { Schema, model } from "mongoose";
import bcrypt from "bcrypt";


const userSchema: Schema = new Schema({
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
      default:
        "https://daisyui.com/images/stock/photo-1534528741775-53994a69daeb.jpg",
    },
  },
  password: {
    type: String,
    required: true,
    minLength: 6,
  },
  blogs: [{ type: Schema.Types.ObjectId, ref: "Blog" }],
  comments: [{ type: Schema.Types.ObjectId, ref: "Comment" }],
});
userSchema.pre("save", async function(next) {
  if(!this.isModified("password")) return next();
  this.password = await bcrypt.hash(this.password, 10);
})

export default model("User", userSchema);
