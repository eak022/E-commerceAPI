const bcrypt = require("bcrypt");
const UserModel = require("../models/user");
const salt = bcrypt.genSaltSync(10);
const jwt = require("jsonwebtoken");
require("dotenv").config();
const secret = process.env.SECRET;

exports.sign = async (req, res) => {
  try {
    const { email } = req.body;
    // 1. ตรวจสอบว่าได้ส่ง email มาหรือไม่
    if (!email) {
      return res.status(400).json({ message: "Email is required!" });
    }
    // 2. ค้นหา email ในฐานข้อมูล
    const user = await UserModel.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: "Email is not found!" });
    }
    // 3. สร้าง JWT token
    const token = jwt.sign(
      { email: user.email, role: user.role },
      process.env.SECRET,
      { expiresIn: "1h" }
    );
    const userInfo = { token, email: user.email, role: user.role };
    res.status(200).json({ userInfo });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Internal Server Error", error: error.message });
  }
};

exports.addUser = async (req, res) => {
  const { email } = req.body;
  // 1. ตรวจสอบว่าได้ส่ง email มาหรือไม่
  if (!email) {
    return res.status(400).json({ message: "Email is required!" });
  }

  try {
    // 2. ตรวจสอบว่า email มีอยู่ในระบบแล้วหรือไม่
    const existedUser = await UserModel.findOne({ email });

    if (existedUser) {
      return res.status(409).json({ message: "Email already exists!" });
    }

    // 3. เพิ่มผู้ใช้ใหม่
    const user = new UserModel({ email });
    await user.save();

    res.status(201).json({ message: "User created successfully!", user });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Internal Server Error", error: error.message });
  }
};
exports.getAllUsers = async (req, res) => {
  try {
    const users = await UserModel.find();
    if (!users) {
      return res.status(200).json({ message: "Users not found" });
    }
    res.status(200).json(users);
  } catch (error) {
    res.status(500).json({
      message: "Something error occurred while getting all users",
      error: error.message,
    });
  }
};

exports.updateUser = async (req, res) => {
  const { id } = req.params;
  const { email } = req.body;
  if (!email) {
    return res.status(400).json({ message: "Email is required" });
  }
  try {
    const user = await UserModel.findByIdAndUpdate(
      id,
      { email, role },
      { new: true }
    );
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    res.status(200).json(user);
  } catch (error) {
    res.status(500).json({
      message: "Something error occurred while updating user",
      error: error.message,
    });
  }
};

exports.deleteUser = async (req, res) => {
  const { id } = req.params;
  try {
    const user = await UserModel.findByIdAndDelete(id);
    !user
      ? res.status(404).json({ message: "User not found" })
      : res.status(200).json({ message: "User was deleted successfully" });
  } catch (error) {
    res.status(500).json({
      message: "Something error occurred while deleting user",
      error: error.message,
    });
  }
};

exports.makeUser = async (req, res) => {
  const { email } = req.params;
  try {
    const user = await UserModel.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: "User not found!" });
    }
    user.role = "user";
    await user.save();
    res.status(200).json(user);
  } catch (error) {
    {
      res.status(500).json({
        message: "Something error occurred while changing user role to user",
        error: error.message,
      });
    }
  }
};

exports.makeAdmin = async (req, res) => {
  const { email } = req.params;
  try {
    const user = await UserModel.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: "User not found!" });
    }
    user.role = "admin";
    await user.save();
    res.status(200).json(user);
  } catch (error) {
    {
      res.status(500).json({
        message: "Something error occurred while changing user role to admin",
        error: error.message,
      });
    }
  }
};

exports.getRoleByEmail = async (req, res) => {
  const { email } = req.params;
  try {
    const user = await UserModel.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: "User not found!" });
    }
    res.status(200).json(user.role);
  } catch (error) {
    res.status(500).json({
      message: "Something error occurred while getting user role",
      error: error.message,
    });
  }
};
