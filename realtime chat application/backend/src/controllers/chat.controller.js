import { generateStreamToken } from "../lib/stream.js";

export async function getStreamToken(req,res){
    try {
        const token=generateStreamToken(req.user.id);
        //we gonna use this token to give the access to user with the token to the chat
        res.status(200).json({token});
    } catch (error) {
        console.log("Error in getStreamToken controller",error.message);
        res.status(500).json({message:"Internal Server Error"});
        
    }
}