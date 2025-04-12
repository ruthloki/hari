import "./database.js";

import bcrypt from "bcrypt";
import express from "express";
import jwt from "jsonwebtoken";
import qrcode from "qrcode";

import { UserModel } from "./models.js";

export const app = express();

app.use(express.json());

app.post("/api/register", async (req, res) => {
  try{
    const {name,email,password}= req.body ;
    if (!name){
      return res.status(400).send({message:"not found"})
    }
    if (!email){
      return res.status(400).send({message:"email is incorrect"})
    }
    if (!password){
      return res.status(400).send({message:"password is incorrect"})
    }
    const existinguser = await UserModel.findOne({email});
    if (existinguser){
      return res.status(400).send({message:"already register"})
    }
    await UserModel.create({
      name,
      email,
      password: bcrypt.hashSync(password,8),
    });
  res.send({ message:"register successfully"});
  }
  catch(error){
    }
});

app.post("/api/login", async (req, res) => {
   try{
    const {email,password}=req.body;
    if (!email){
      return res.status(400).send({message:"email is requried"})
    }
    if (!password){
      return res.status(400).send({message:"password is requried"})
    }
    const user = await UserModel.findOne({email});
    if (!user){
      return res.status(400).send({message:"register the email"})
    }

    const isPasswordValid = bcrypt.compareSync(password,user.password)
    if(!isPasswordValid){
      return res.status(400).send({message:"invalid paseord"})
    }

    const token = jwt.sign(
      {
        userID:user._id.toString(),
      },
      process.env.JWT_SECRET
    );
        
  res.send({
    name:user.name,
    email:user.email,
    token
  });
  
}
  catch(error){

  }

  
});

app.use("/api", async (req, res, next) => {
  const token = req.headers["authorization"]?.split(" ")[1];

  if (!token) {
    return res.status(400).send({ message: "Token is required!" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    if (!decoded) {
      return res.status(400).send({ message: "Invalid token!" });
    }

    req.userId = decoded.userId;

    next();
  } catch (error) {
    console.error("Failed to verify token", error);
    return res.status(400).send({ message: "Invalid token!", error });
  }
});

app.get("/api/qrcode", async (req, res) => {
  try {
    if (!req.query.text) {
      return res.send({ message: "Text is required!" });
    }

    const imageUrl = await qrcode.toDataURL(req.query.text, {
      scale: 15,
    });

    res.send({ imageUrl });
  } catch (error) {
    console.error("Failed to generate QR", error);
    res.send({ message: "Failed to generate QR!", error });
  }
});