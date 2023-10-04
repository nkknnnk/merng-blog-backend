import {
  GraphQLObjectType,
  GraphQLID,
  GraphQLString,
  GraphQLNonNull,
  GraphQLList,
} from "graphql"; 
import Blog from "../models/Blog";
import Comment from "../models/Comment";
import User from "../models/User";

// @ts-ignore
export const UserType = new GraphQLObjectType({
  name: "UserType",
  fields: () => ({
    id: { type: GraphQLNonNull(GraphQLID) },
    name: { type: GraphQLNonNull(GraphQLString) },
    email: { type: GraphQLNonNull(GraphQLString) },
    password: { type: GraphQLNonNull(GraphQLString) },
    blogs: {
      type: GraphQLList(BlogType),
      async resolve(parent) {
        return await Blog.find({ user: parent.id });
      },
    },
    comments: {
      type: GraphQLList(CommentType),
      async resolve(parent) {
        return await Comment.find({ user: parent.id });
      },
    },
  }),
});
// @ts-ignore
export const BlogType = new GraphQLObjectType({
  name: "Blogtype",
  fields: () => ({
    id: { type: GraphQLNonNull(GraphQLID) },
    title: { type: GraphQLNonNull(GraphQLString) },
    content: { type: GraphQLNonNull(GraphQLString) },
    date: { type: GraphQLNonNull(GraphQLString) },
    user: {
      type: UserType,
      async resolve(parent) {
        return await User.findById(parent.user);
      },
    },
    comments: {
      type: GraphQLList(CommentType),
      async resolve(parent) {
        return await Comment.find({ blog: parent.id });
      },
    },
  }),
});
// @ts-ignore
export const CommentType = new GraphQLObjectType({
  name: "Commenttype",
  fields: () => ({
    id: { type: GraphQLNonNull(GraphQLID) },
    text: { type: GraphQLNonNull(GraphQLString) },
    user: {
      type: UserType,
      async resolve(parent) {
        return await User.findById(parent.user);
      },
    },
    blogs: {
        type: GraphQLList(BlogType),
        async resolve(parent) {
          return await Blog.find(parent.blog);
        },
      },
  }),
});
