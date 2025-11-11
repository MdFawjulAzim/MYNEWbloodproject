const { TokenDecode } = require("../utility/tokenHelper");

module.exports = (req, res, next) => {
  let token = req.headers["token"];
  if (!token) {
    token = req.cookies["token"];
  }
  const decoded = TokenDecode(token);

  if (decoded === null) {
    return res.status(401).send({ status: "fail", message: "unauthorized" });
  }

  req.user = { id: decoded.user_id, role: decoded.role, sub: decoded.sub };
  // Backward-compatible headers if needed elsewhere
  req.headers.user_id = decoded.user_id;
  req.headers.role = decoded.role;
  next();
};
