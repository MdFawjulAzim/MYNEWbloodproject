const {
  createDonorDetailsService,
  getMyDonorDetailsService,
  getDonorDetailsByIdService,
  updateMyDonorDetailsService,
  softDeleteMyDonorDetailsService,
} = require("../services/donorService");

exports.create = async (req, res) => {
  const result = await createDonorDetailsService(req);
  return res.status(200).json(result);
};

exports.readMe = async (req, res) => {
  const result = await getMyDonorDetailsService(req);
  return res.status(200).json(result);
};

exports.readOne = async (req, res) => {
  const result = await getDonorDetailsByIdService(req);
  return res.status(200).json(result);
};

exports.updateMe = async (req, res) => {
  const result = await updateMyDonorDetailsService(req);
  return res.status(200).json(result);
};

exports.softDeleteMe = async (req, res) => {
  const result = await softDeleteMyDonorDetailsService(req);
  return res.status(200).json(result);
};
