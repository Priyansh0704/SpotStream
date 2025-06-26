import User from "../models/User.js"
import FriendRequest from "../models/FriendRequest.js"
export async function getRecommendedUsers(req,res){
    try {
        const currentUserId=req.user.id;
        const currentUser=req.user;
        const RecommendedUsers=await User.find({
            $and:[
                {_id:{$ne:currentUserId}},//not equal to current user
                {$id:{$nin:currentUser.friends}},//not in current user friend list
                {isOnboarded:true}//it has to be onboarded
            ],
        });
        res.status(200).json(recommendedUsers);
    } catch (error) {
        console.error("Error in getRecommendedUsers controller",error.message);
        res.status(500).json({message:"Internal Server Error"});
    }
}

export async function getMyFriends(req,res){
    try {
        const user=await User.findById(req.user.id).select("friends").populate("friends","fullName profiePic nativeLanguage learningLanguage");
        res.status(200).json(user.friends);
    } catch (error) {
        console.error("Error in getMyfriends function",error.message);
        res.status(500).json({message:"Internal Server Error"});
    }
}

export async function sendFriendRequest(req,res){
    try {
        const myId=req.user.id;
        const {id:recipientId}=req.params;//to get id of the friend from the url because we have used :id there thatswhy we write id here if there was idx then in curly braces it would be idx
        //then we also rename it to recipientId
        //prevent sending req to yourself
        if(myId === recipientId){
            return res.status(400).json({message:"You cannot send friend req to urself"});
        }
        //we have to check if recipient really exist
        const recipient=await User.findById(recipientId);
        if(!recipient){
            res.status(400).json({message:"Recipient not found"});
        }
        //if already friends
        if(recipient.friends.includes(myId)){
            return res.status(400).json({message:"You are already friends with this user"});
        }
        //if user already exist
        const existingRequest=await sendFriendRequest.findOne({
            $or:[
                {sender:myId,recipient:recipientId},
                {sender:recipientId,recipient:myId},
            ],
        });
        if(existingRequest){
            return res.status(400).json({message:"Friend request between you and user already exists"});
        }
        const friendRequest=await FriendRequest.create({
            sender:myId,
            recipient:recipientId,
        })

        res.status(201).json(friendRequest);
    } catch (error) {
        console.error("Error in sendFriendRequest controller",error.message);
        res.status(500).json({message:"Internal Server Error"});
    }
}
export async function acceptFriendRequest(req,res){
    try {
        const {id:requestId}=req.params;
        const friendRequest=await FriendRequest.findById(requestId);
        if(!friendRequest){
            return res.status(404).json({message:"friend request not found"});

        }
        //check if the current user is the receipient
        if(friendRequest.recipient.toString()!==req.user.id){
            return res.status(403).json({message:"You are not authorized to accept this friend request"});

        }
        friendRequest.status="accepted";
        await friendRequest.save();

        //add each user to the other's friends array
        //add elements to an array only if they do not already exist
        await User.findByIdAndUpdate(friendRequest.sender,{
            $addToSet:{friends:friendRequest.recipient},
        });
        await User.findByIdAndUpdate(friendRequest.recipient,{
            $addToSet:{friends:friendRequest.sender},
        });
        res.status(200).json({message:"Friend Request accepted"});
    } catch (error) {
        console.log("Error in acceptFriendRequest controller",error.message);
        res.status(500).json({message:"Internal Server Error"});
        
    }
}
//the request i got from other users or the accepted friend request from the other users
export async function getFriendRequest(req,res){
    try {
        const incomingReqs=await FriendRequest.find({
            recipient:req.user.id,
            status:"pending",
        }).populate("sender","fullName profilePic nativeLanguage learningLanguage");
        const acceptedReqs=await FriendRequest.find({
            sender:req.user.id,
            status:"accepted",
        }).populate("recipient","fullName profilePic nativeLanguage learningLanguage");
        res.status(200).json({incomingReqs,acceptedReqs});
    } catch (error) {
        console.log("Error in getPendingFriendRequests controller",error.message);
        res.status(500).json({message:"Internal Server Error"});
    }
}
//the request i send to show on the dashboard
export async function getOutgoingFriendReqs(req,res){
    try {
        const outgoingRequests=await FriendRequest.find({
            sender:req.user.id,
            status:"pending",
        }).populate("recipient","fullName profilePic nativeLanguage learningLanguage");
        res.status(200).json(outgoingRequests);

        
    } catch (error) {
        console.error("Error in getOutGoingFriendReqs controller",error.message);
        res.status(500).json({message:"Internal server Error"});
        
    }
}