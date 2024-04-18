import jwt from "jsonwebtoken";

const isAuthenticated = async (req: any, res: any, next: () => void) => {
  try {
    const BearorToken = req.headers["authorization"];
    const token = req.headers["authorization"]?.split(" ")[1]; // Get token from cookie or header
    console.log(token);
    if (!token)
      return res
        .status(401)
        .send({ success: false, message: "Please login to access this route" });
    const decodedData = jwt.verify(token, process.env.JWT_SECRET!);
    // @ts-ignore
    if (decodedData._id) {
      // @ts-ignore
      req.userId = decodedData._id;
      next();
    } else {
      return res.status(403).send({ success: false, message: "Invalid Token" });
    }
  } catch (error: any) {
    console.log(error.message);
    return res
      .status(403)
      .json({ success: false, message: "Login Expired Please login again!" });
  }
};

export { isAuthenticated };
