const postsCollection = require('../db').db().collection("Post")
const ObjectID = require('mongodb').ObjectID
const User = require('./User')


let Post = function(data, authorId, postId) {
    this.data = data,
    this.errors = [],
    this.authorId = authorId,
    this.postId = postId
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

Post.prototype.update = function() {
    return new Promise( async (resolve , reject) => {
        this.cleanUp()
        this.validate()

        // grab the author id to ensure it is the one he will update the post
        let post = await postsCollection.findOne({_id: new ObjectID(this.postId)})
        let isPostOwner = post.author.equals(this.authorId)

        if(isPostOwner) {
            if(!this.errors.length) {
                await postsCollection.findOneAndUpdate({_id: new ObjectID(this.postId)}, {$set: {title: this.data.title, body: this.data.body}})
                resolve()
            } else {
                reject(this.errors)
            }
        } else {
            reject(["Not allowed"])
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
            post.authorId = undefined
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

Post.delete = function(postID, visitorID) {
    return new Promise( (resolve, reject) => {
      Post.findSingleById(postID, visitorID)
      .then( (post) => {
          if(post.isVisitorOwner) {
            postsCollection.deleteOne({_id : new ObjectID(postID)})
            .then( () => resolve())
          } else {
              reject()
          }
      })
      .catch( () => reject())
    })
}

Post.findPostsByAuthor = function(authorID) {
        return Post.reusablePostQuery([
            {$match: {author: authorID}},
            {$sort: {createdDate: -1}}
          ])
}

Post.search = function(searchTerm) {
    return new Promise( async (resolve, reject) => {
        if(typeof(searchTerm) == "string"){
            let posts = await Post.reusablePostQuery([
                {$match: {$text: {$search: searchTerm}}},
                {$sort: {score: {$meta: "textScore"}}}
            ])
            resolve(posts)
        } else {
            reject()
        }

    })
}


module.exports = Post