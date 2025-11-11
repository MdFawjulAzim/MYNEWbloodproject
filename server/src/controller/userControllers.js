// RegisterUser
const {
  registrationServices,
  loginServices,
} = require("../services/userService");

// user registration
exports.register = async (req, res) => {
  const result = await registrationServices(req);
  if (result.status === "success" && result.token) {
    const cookieOptions = {
      expires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      httpOnly: false,
    };
    res.cookie("token", result.token, cookieOptions);
  }
  return res.status(200).json(result);
};

// user login (email or phone + password)
exports.login = async (req, res) => {
  const result = await loginServices(req);
  if (result.status === "success") {
    const cookieOptions = {
      expires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      httpOnly: false,
    };
    res.cookie("token", result.token, cookieOptions);
  }
  return res.status(200).json(result);
};

exports.logout = async (req, res) => {
  const cookieOptions = {
    expires: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
    httpOnly: false,
  };
  res.cookie("token", "", cookieOptions);
  return res
    .status(200)
    .json({ status: "success", message: "User logged out successfully." });
};
