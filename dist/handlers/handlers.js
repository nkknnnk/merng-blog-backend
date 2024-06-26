"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const graphql_1 = require("graphql");
const schema_1 = require("../schema/schema");
const User_1 = __importDefault(require("../models/User"));
const Blog_1 = __importDefault(require("../models/Blog"));
const Comment_1 = __importDefault(require("../models/Comment"));
const mongoose_1 = require("mongoose");
const bcryptjs_1 = require("bcryptjs");
const RootQuery = new graphql_1.GraphQLObjectType({
    name: "RootQuery",
    fields: {
        // get all user
        users: {
            type: (0, graphql_1.GraphQLList)(schema_1.UserType),
            async resolve() {
                return await User_1.default.find();
            },
        },
        //get user by id
        user: {
            type: schema_1.UserType,
            args: {
                id: { type: (0, graphql_1.GraphQLNonNull)(graphql_1.GraphQLID) },
            },
            async resolve(parent, { id }) {
                return User_1.default.findById(id).populate("blogs");
            },
        },
        // get all Blog
        blogs: {
            type: (0, graphql_1.GraphQLList)(schema_1.BlogType),
            async resolve() {
                return await Blog_1.default.find();
            },
        },
        // get blog by id
        blog: {
            type: schema_1.BlogType,
            args: {
                id: { type: (0, graphql_1.GraphQLNonNull)(graphql_1.GraphQLID) },
            },
            async resolve(parent, { id }) {
                return Blog_1.default.findById(id).populate("user comments");
            },
        },
        // get all comments
        comments: {
            type: (0, graphql_1.GraphQLList)(schema_1.CommentType),
            async resolve() {
                return await Comment_1.default.find();
            },
        },
    },
});
const mutations = new graphql_1.GraphQLObjectType({
    name: "mutations",
    fields: {
        // user signup
        signup: {
            type: schema_1.UserType,
            args: {
                name: { type: (0, graphql_1.GraphQLNonNull)(graphql_1.GraphQLString) },
                // username: { type: GraphQLNonNull(GraphQLString) },
                email: { type: (0, graphql_1.GraphQLNonNull)(graphql_1.GraphQLString) },
                password: { type: (0, graphql_1.GraphQLNonNull)(graphql_1.GraphQLString) },
            },
            async resolve(parent, { name, email, password }) {
                let existingUser;
                try {
                    existingUser = await User_1.default.findOne({ email });
                    if (existingUser)
                        return new Error("User Already Exists");
                    const encryptedPassword = (0, bcryptjs_1.hashSync)(password);
                    const user = new User_1.default({ name, email, password: encryptedPassword });
                    return await user.save();
                }
                catch (error) {
                    return new Error("User SignUp Faild. try Again");
                }
            },
        },
        login: {
            type: schema_1.UserType,
            args: {
                email: { type: (0, graphql_1.GraphQLNonNull)(graphql_1.GraphQLString) },
                password: { type: (0, graphql_1.GraphQLNonNull)(graphql_1.GraphQLString) },
            },
            async resolve(parent, { email, password }) {
                let existingUser;
                try {
                    // @ts-ignore
                    existingUser = await User_1.default.findOne({ email });
                    if (!existingUser)
                        return new Error("No User Registered With This Email");
                    const decryptedPassword = (0, bcryptjs_1.compareSync)(password, 
                    // @ts-ignore
                    existingUser.password);
                    if (!decryptedPassword)
                        return new Error("Incorrect Password");
                    return existingUser;
                }
                catch (error) {
                    // @ts-ignore
                    return new Error("User Login Faild. try Again", error);
                }
            },
        },
        // create blog
        addBlog: {
            type: schema_1.BlogType,
            args: {
                title: { type: (0, graphql_1.GraphQLNonNull)(graphql_1.GraphQLString) },
                content: { type: (0, graphql_1.GraphQLNonNull)(graphql_1.GraphQLString) },
                date: { type: (0, graphql_1.GraphQLNonNull)(graphql_1.GraphQLString) },
                user: { type: (0, graphql_1.GraphQLNonNull)(graphql_1.GraphQLID) },
            },
            async resolve(parent, { title, content, date, user }) {
                const session = await (0, mongoose_1.startSession)();
                try {
                    session.startTransaction();
                    const blog = new Blog_1.default({ title, content, date, user });
                    // Check if the user exists
                    const existingUser = await User_1.default.findById(user);
                    if (!existingUser) {
                        throw new Error("User Not Found! Exiting");
                    }
                    // Push the new blog to the user's blogs array
                    existingUser.blogs.push(blog);
                    console.log({ existingUser });
                    // Save both the user and the blog within the same session
                    await existingUser.save({ session });
                    await blog.save({ session });
                    // Commit the transaction
                    await session.commitTransaction();
                    // End the session
                    session.endSession();
                    return blog;
                }
                catch (error) {
                    // Rollback the transaction in case of error
                    console.log(error.message);
                    await session.abortTransaction();
                    // End the session
                    session.endSession();
                    // Throw the error
                    throw error;
                }
            },
        },
        // update blog
        updateBlog: {
            type: schema_1.BlogType,
            args: {
                id: { type: (0, graphql_1.GraphQLNonNull)(graphql_1.GraphQLID) },
                title: { type: (0, graphql_1.GraphQLNonNull)(graphql_1.GraphQLString) },
                content: { type: (0, graphql_1.GraphQLNonNull)(graphql_1.GraphQLString) },
            },
            async resolve(parent, { id, title, content }) {
                let existingBlog;
                try {
                    // @ts-ignore
                    existingBlog = await Blog_1.default.findById(id);
                    if (!existingBlog)
                        return new Error("Blog does not exist");
                    return await Blog_1.default.findByIdAndUpdate(id, { title, content }, { new: true });
                }
                catch (error) {
                    // @ts-ignore
                    return new Error(error);
                }
            },
        },
        // delete blog
        deleteBlog: {
            type: schema_1.BlogType,
            args: {
                id: { type: (0, graphql_1.GraphQLNonNull)(graphql_1.GraphQLID) },
            },
            async resolve(parent, { id }) {
                let existingBlog;
                const session = await (0, mongoose_1.startSession)();
                try {
                    session.startTransaction({ session });
                    // @ts-ignore
                    existingBlog = await Blog_1.default.findById(id).populate("user");
                    const FetchedBlog = await Blog_1.default.findById(id);
                    // @ts-ignore
                    const existingUser = existingBlog.user;
                    if (!existingUser)
                        return new Error("No user linked to this blog");
                    if (!existingBlog)
                        return new Error("Blog does not exist");
                    existingUser.blogs.pull(existingBlog);
                    await existingUser.save({ session });
                    const deletedBlog = await Blog_1.default.deleteOne({ _id: id });
                    return FetchedBlog;
                }
                catch (error) {
                    // @ts-ignore
                    return new Error(error);
                }
                finally {
                    session.commitTransaction();
                }
            },
        },
        //add comment
        addCommentToBlog: {
            type: schema_1.CommentType,
            args: {
                blog: { type: (0, graphql_1.GraphQLNonNull)(graphql_1.GraphQLID) },
                user: { type: (0, graphql_1.GraphQLNonNull)(graphql_1.GraphQLID) },
                text: { type: (0, graphql_1.GraphQLNonNull)(graphql_1.GraphQLString) },
                date: { type: (0, graphql_1.GraphQLNonNull)(graphql_1.GraphQLString) },
            },
            async resolve(parent, { user, blog, text, date }) {
                const session = await (0, mongoose_1.startSession)();
                let comment;
                try {
                    session.startTransaction({ session });
                    const existingUser = await User_1.default.findById(user);
                    const existingBlog = await Blog_1.default.findById(blog);
                    if (!existingBlog || !existingUser)
                        return new Error("User Or Blog Does Not exist");
                    comment = new Comment_1.default({
                        text,
                        date,
                        blog,
                        user,
                    });
                    existingUser.comments.push(comment);
                    existingBlog.comments.push(comment);
                    await existingUser.save({ session });
                    await existingBlog.save({ session });
                    return await comment.save({ session });
                }
                catch (error) {
                    // @ts-ignore
                    return new Error(error);
                }
                finally {
                    session.commitTransaction();
                }
            },
        },
        // delete the comment from blog
        deleteComment: {
            type: schema_1.CommentType,
            args: {
                id: { type: (0, graphql_1.GraphQLNonNull)(graphql_1.GraphQLID) },
            },
            async resolve(parent, { id }) {
                let comment;
                const session = await (0, mongoose_1.startSession)();
                try {
                    session.startTransaction({ session });
                    // @ts-ignore
                    comment = await Comment_1.default.findById(id);
                    if (!comment)
                        return new Error("Comment not found");
                    // @ts-ignore
                    const existingUser = await User_1.default.findById(comment.user);
                    if (!existingUser)
                        return new Error("User Not Found");
                    // @ts-ignore
                    const existingBlog = await Blog_1.default.findById(comment.blog);
                    if (!existingBlog)
                        return new Error("Blog Not Found");
                    existingBlog.comments.pull(comment);
                    existingUser.comments.pull(comment);
                    await existingUser.save({ session });
                    await existingBlog.save({ session });
                    return await Comment_1.default.findByIdAndDelete(id);
                }
                catch (error) {
                    // @ts-ignore
                    return new Error(error);
                }
                finally {
                    session.commitTransaction();
                }
            },
        },
    },
});
exports.default = new graphql_1.GraphQLSchema({ query: RootQuery, mutation: mutations });
//# sourceMappingURL=handlers.js.map