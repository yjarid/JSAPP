const postsCollection = require('../db').db().collection("Post")
const ObjectID = require('mongodb').ObjectID
const User = require('./User')


let Post = function(data, authorId) {
    this.data = data,
    this.errors = [],
    this.authorId = authorId
}


Post.prototype.cleanUp = function() {
    if(typeof(this.data.title) != "string") { this.data.title = ""}
    if(typeof(this.data.body) != "string") { this.data.body = ""}

    // git rid of any bogus data

    this.data = {
        title: this.data.title.trim(),
        body: this.data.body.trim(),
        createdDate: new Date(),
        author: ObjectID(this.authorId)
    }
}

Post.prototype.validate = function() {
    if(this.data.title == "") { this.errors.push("must provide a title")}
    if(this.data.body == "") { this.errors.push("must provide a body")}
}

Post.prototype.create = function() {
    return new Promise(  (resole, reject) => {
        this.cleanUp()
        this.validate()

        if(!this.errors.length) {
            postsCollection.insertOne(this.data)
            .then((post) => {
                resole(post.ops[0]._id)
            })          
        } else {
            reject(this.errors)
        }
    })
}

Post.reusablePostQuery =  function(uniqueOperation, visitorId) {
    return new Promise( async (resolve, reject) => {
        let aggOperation = uniqueOperation.concat(
            [
            {$lookup: {from: "User", localField: "author", foreignField: "_id", as: "authorDocument"}},
            {$project: {
                title: 1,
                body: 1,
                createdDate: 1,
                authorId: "$author",
                author: {$arrayElemAt: ["$authorDocument", 0]}
            }}
        ])

        let posts = await postsCollection.aggregate(aggOperation).toArray()

        // clean up author property in each post object
        posts = posts.map( (post) => {
            post.isVisitorOwner = post.authorId.equals(visitorId)
            post.author = {
                username: post.author.username,
                avatar: new User(post.author, true).avatar
            }
            return post
        })

        resolve(posts)
    })
}

Post.findSingleById = (postId, visitorId) => {
    return new Promise(async function(resolve, reject) {
     
        if (typeof(postId) != "string" || !ObjectID.isValid(postId)) {  
          reject()
          return
        }
        
        let posts = await Post.reusablePostQuery([
          {$match: {_id: new ObjectID(postId)}}
        ], visitorId)
    
        if (posts.length) {
          resolve(posts[0])
        } else {
          reject()
        }
      })
    
}


module.exports = Post