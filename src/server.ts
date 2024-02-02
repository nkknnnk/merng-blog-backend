const app = require("./app")
import { connectToDatabase } from "./utils/connection";


connectToDatabase()
  .then(() => {
    app.listen(process.env.PORT, () =>
      console.log(`Server Open On Port ${process.env.PORT}`)
    );
  })
  .catch((err) => console.log(err));