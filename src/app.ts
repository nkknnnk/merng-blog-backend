import express from "express";
// var bodyParser = require("body-parser");
import { config } from "dotenv";
import { graphqlHTTP } from "express-graphql";
import schema from "./handlers/handlers";
import cors from "cors";
import { connectToDatabase } from "./utils/connection";
const videoDownloader = require("./routes/videoDownloader");

// Dotenv config
config();

const app = express();
// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(cors());
app.get("/", (req: any, res: any) => {
  console.log(req.body.username);
  res.json("Hello World!");
});
app.use("/graphql", graphqlHTTP({ schema, graphiql: true }));
app.use("/mediaapi", videoDownloader);


connectToDatabase()
  .then(() => {
    app.listen(process.env.PORT, () =>
      console.log(`Server Open On Port ${process.env.PORT}`)
    );
  })
  .catch((err) => console.log(err));
