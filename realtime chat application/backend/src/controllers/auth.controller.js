import { upsertStreamUser } from "../lib/stream.js";
import  User  from "../models/User.js";
import jwt from "jsonwebtoken";
export async function signup(req, res) {
  const {email,password,fullName}=req.body;
  try{
    if(!email || !password || !fullName){
      return res.status(400).json({message: "All fields are required"});
    }
    if(password.length<6){
      return res.status(400).json({message:"Password must be at least 6 characters long"});
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if(!emailRegex.test(email)){
      return res.status(400).json({message:"Invalid email format"});
    }
    const existingUser = await User.findOne({email});
    if(existingUser){
      res.status(400).json({message:"email already exists,please use a different email"});
    }
    const idx=Math.floor(Math.random() * 100)+1;//1-100
    const randomAvatar=`https://i.pravatar.cc/${idx}`;
    const newUser=await User.create({
      email,
      password,
      fullName,
      profilepic: randomAvatar,
    });
    try {
      await upsertStreamUser({
      id:newUser._id.toString(),
      name:newUser.fullName,
      image:newUser.profilepic||" ",
    });
    console.log(`Stream user Created for ${newUser.fullName}`);
    } catch (error) {
      console.log("Error creating Stream User",error);
    }
    

    const token=jwt.sign({userId:newUser._id},process.env.JWT_SECRET_KEY,{expiresIn:"7d"});
    res.cookie("jwt",token,{
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days in miliseconds
      httpOnly: true,//prevent XSS attacks
      sameSite:"strict",//prevent CSRF attacks
      secure: process.env.NODE_ENV === "production", //only send cookie over HTTPS in production

    })
    res.status(201).json({success:true,user:newUser});
  }catch(error){
    console.log("error in signup controller:", error);
    res.status(500).json({message:"Internal server error"});
  }
}
export async function login(req, res) {
  try{
    const {email,password}=req.body;
    if(!email||!password){
      return res.status(400).json({message:"All fields are required"});
    }
    const user=await User.findOne({email});
    if(!user)return res.status(401).json({message:"Invalid email or password"});
    const isPasswordCorrect=await user.matchPassword(password);
    if(!isPasswordCorrect)return res.status(401).json({message:"Invalid email or password"});

    const token=jwt.sign({userId:user._id},process.env.JWT_SECRET_KEY,{expiresIn:"7d"});
    res.cookie("jwt",token,{
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days in miliseconds
      httpOnly: true,//prevent XSS attacks
      sameSite:"strict",//prevent CSRF attacks
      secure: process.env.NODE_ENV === "production", //only send cookie over HTTPS in production

      
    });
    res.status(200).json({success:true,user});
  }
  catch (error){
    console.log("There is an error in login controller",error);
    res.status(500).json({message:"Internal error"});
  }
  //const isPasswordCorrect=await User.matchPassword(password);
  
    
}
export function logout(req, res) {
  res.clearCookie("jwt");
  res.status(200).json({success:true,message:"logged out successfully"});
}
export async function onboard(req,res) {
  try {
    const userId=req.user._id;
    const {fullName,bio,nativeLanguage,learningLanguage,location}=req.body;
    if(!fullName || !bio || !nativeLanguage || !learningLanguage || !location){
      return res.status(400).json({
        message:"All fields are required",
        missingFields:[
          !fullName && "fullName",
          !bio && "bio",
          !nativeLanguage && "nativeLanguage",
          !learningLanguage && "learningLanguage",
          !location && "location", 
        ],
      });
    }
    const updatedUser=await User.findByIdAndUpdate(userId,{
      ...req.body,
      isOnboarded:true,
    })
  } catch (error) {
    t
    
  }
   
}