const userCollection = require('../db').db().collection("User")
const followCollection = require('../db').db().collection("Follow")
const ObjectID = require('mongodb').ObjectID
const User = require('./User')


let Follow = function(username, visitorID) {
  this.username = username
  this.visitorID = visitorID
  this.errors = []
}

Follow.prototype.cleanUp = function(){
    if(typeof(this.username) != "string") { this.username= ""}
}

Follow.prototype.validate =  function(action){
    return new Promise(async (resolve, reject) => {
            // followed username must exist in DB 
    let followedAccount = await userCollection.findOne({username: this.username})

    if(followedAccount) {
        this.followedID = followedAccount._id
    } else {
        this.errors.push("you can not find a user that does not exist")
    }

    let doesFollowExist = await followCollection.findOne({followedID : this.followedID, visitorID: new ObjectID(this.visitorID)})
    
    if(action == "follow" && doesFollowExist ) {
        this.errors.push("You are already following this user")
    }

    if(action == "unFollow" && !doesFollowExist ) {
        this.errors.push("You can not stop following a user you are not following ")
    }

    if(this.followedID.equals(this.visitorID)) { this.errors.push("You can not follow yourself")}

    resolve()
    })
}

Follow.prototype.follow = function() {
    return new Promise( async (resolve, reject) => {
        this.cleanUp()
        await this.validate("follow")
        
        if(!this.errors.length) {
            await followCollection.insertOne({followedID : this.followedID, visitorID: new ObjectID(this.visitorID)})
            resolve()
        } else {
            reject(this.errors)
        }
    })
}

Follow.prototype.unFollow = function() {
    return new Promise( async (resolve, reject) => {
        this.cleanUp()
        await this.validate("unFollow")
        
        if(!this.errors.length) {
            await followCollection.deleteOne({followedID : this.followedID, visitorID: new ObjectID(this.visitorID)})
            resolve()
        } else {
            reject(this.errors)
        }
    })
}

Follow.isVisitorFollowing = async function(followedID, visitorID) {
    let followDoc = await followCollection.findOne({followedID : followedID , visitorID : new ObjectID(visitorID) })
    if(followDoc) { return true } else { return false }
    
}

Follow.getFollowersById = function(profileUserID) {
    return new Promise( (resolve, reject) => {
         followCollection.aggregate([
             {$match: {followedID: profileUserID}},
             {$lookup: {from: "User", localField: "visitorID", foreignField: "_id", as: "userDoc"}},
             {$project: {
                 username: {$arrayElemAt: ["$userDoc.username", 0]},
                 email: {$arrayElemAt: ["$userDoc.email", 0]}
             }}
         ]).toArray()
         .then( (followers) => {
            followers = followers.map( (follower) => {
                // create a user
                let user = new User(follower, true)

                return {
                    username : follower.username,
                    avatar: user.avatar
                }
            })

            resolve(followers)
         })
         .catch( () => reject())
    })
}

Follow.getFollowingById = function(profileUserID) {
    return new Promise( (resolve, reject) => {
         followCollection.aggregate([
             {$match: {visitorID: profileUserID}},
             {$lookup: {from: "User", localField: "followedID", foreignField: "_id", as: "userDoc"}},
             {$project: {
                 username: {$arrayElemAt: ["$userDoc.username", 0]},
                 email: {$arrayElemAt: ["$userDoc.email", 0]}
             }}
         ]).toArray()
         .then( (following) => {
            following = following.map( (following) => {
                // create a user
                let user = new User(following, true)

                return {
                    username : following.username,
                    avatar: user.avatar
                }
            })

            resolve(following)
         })
         .catch( () => reject())
    })
}

Follow.countFollowersById = function(profileUserID) {
    return new Promise( async (resolve, reject) => {
        let followersCount = await followCollection.countDocuments({followedID: profileUserID })
        resolve(followersCount)
    })   
}


Follow.countFollowingById = function(profileUserID) {
    return new Promise( async (resolve, reject) => {
        let followingCount = await followCollection.countDocuments({visitorID: profileUserID })
        resolve(followingCount)
    })   
}
module.exports = Follow