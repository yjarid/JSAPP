const userCollection = require('../db').db().collection("User")
const followCollection = require('../db').db().collection("Follow")
const ObjectID = require('mongodb').ObjectID


let Follow = function(username, visitorID) {
  this.username = username
  this.visitorID = visitorID
  this.errors = []
}

Follow.prototype.cleanUp = function(){
    if(typeof(this.username) != "string") { this.username= ""}
}

Follow.prototype.validate = async function(){
    // followed username must exist in DB 
    let followedAccount = await userCollection.findOne({username: this.username})

    if(followedAccount) {
        this.followedID = followedAccount._id
    } else {
        this.errors.push("you can not find a user that does not exist")
    }
}

Follow.prototype.create = function() {
    return new Promise( async (resolve, reject) => {
        this.cleanUp()
        await this.validate()
        
        if(!this.errors.length) {
            await followCollection.insertOne({followedID : this.followedID, visitorID: new ObjectID(this.visitorID)})
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

module.exports = Follow