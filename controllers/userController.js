const User = require('../models/User')
const Post = require('../models/Post')
const Follow = require('../models/Follow')

exports.profileUserExist = (req, res, next) => {
    User.findByUsername(req.params.username)
    .then( (user) => {
        req.profileUser = user
        next()
    })
    .catch( () => res.render('404'))
 }

exports.sharedProfileData = async (req, res, next) => {
    let isVisitorProfile = false
    let isFollowing = false
    if(req.session.user) {
        isVisitorProfile = req.profileUser.id.equals(req.visitorId)
        isFollowing = await Follow.isVisitorFollowing(req.profileUser.id, req.visitorId)
    }
    req.isFollowing = isFollowing
    req.isVisitorProfile = isVisitorProfile

    // retrieve post, follower and following counts 
    let postCountPromise =  Post.countPostsByAuthor(req.profileUser.id)
    let followerCountPromise =  Follow.countFollowersById(req.profileUser.id)
    let followingCountPromise =  Follow.countFollowingById(req.profileUser.id)

    let [postCount, followerCount, followingCount] = await Promise.all([postCountPromise, followerCountPromise, followingCountPromise ])
    req.postCount = postCount
    req.followerCount = followerCount
    req.followingCount = followingCount

    next()
}

exports.mustBeLoggedIn = (req, res, next) => {
    if(req.session.user) {
        next()
    } else {
        req.flash("errors" , "you must be logged in to perform this action")
        req.session.save( () => { res.redirect("/") } )  
    }

}

exports.register = (req, res) => {
    let user = new User(req.body)

    user.register()
    .then( (data) => {
        req.session.user= {username : data.username, id: data._id, avatar: user.avatar}
        req.flash("success" , "sucess registration login")
        req.session.save( () => { res.redirect("/") } ) 
    })
    .catch( (regErrors) => {
        regErrors.forEach( (err) => req.flash("regErrors" , err))
        req.session.save( () => { res.redirect("/") } ) 
        
    })
}


exports.login = (req, res) => {
    let user = new User(req.body)

    user.login()
    .then( (data) => {
        req.session.user= {username : data.username, id: data._id, avatar: user.avatar}
        req.flash("success" , "sucess registration login")
        req.session.save( () => { res.redirect("/") } ) 
    })
    .catch((error) => {
        req.flash("errors" , error)
        req.session.save( () => { res.redirect("/") } )
    })
}

exports.logout = (req, res) => {
    req.session.destroy( () => {
        res.redirect("/")
    })
}


exports.home = async (req, res) => {
    if(req.session.user){
        // fetch feed of post for current user
        let posts = await Post.getFeed(req.session.user.id)
        res.render('home-dashboard', {posts: posts})
    } else {
        res.render('home-guest', {regErrors : req.flash('regErrors')})
    }
    
}

exports.profilePostsScreen = (req, res) => {
    if(req.profileUser) {
       Post.findPostsByAuthor(req.profileUser.id, req.visitorId)
       .then( (posts) => {

        let postsCount = posts.length ? posts.length : 0

        console.log(postsCount)

           res.render('profile', {
            currentPage: "posts",
            profileUser : req.profileUser, 
            posts: posts,
            visitorId: req.visitorId,
            isFollowing: req.isFollowing,
            isVisitorProfile: req.isVisitorProfile,
            counts: {
                postCount: req.postCount, 
                followerCount: req.followerCount, 
                followingCount: req.followingCount
            }
                           })
                        })
       .catch( () => res.render('404'))        
   } else {
       res.render('404')
   }  
}

exports.profileFollowersScreen = async (req, res) => {
   try {
        let followers = await Follow.getFollowersById(req.profileUser.id)

        let followersCount = followers.length ? followers.length : 0

        res.render('profile-followers', {
        currentPage: "followers",
        followers: followers,
        profileUser : req.profileUser, 
        visitorId: req.visitorId,
        isFollowing: req.isFollowing,
        isVisitorProfile: req.isVisitorProfile,
        counts: {
            postCount: req.postCount, 
            followerCount: req.followerCount, 
            followingCount: req.followingCount
        }
    })
   } catch {
       res.render('404')
   }

}

exports.profileFollowingScreen = async (req, res) => {
    try {
         let following = await Follow.getFollowingById(req.profileUser.id)
         res.render('profile-following', {
         currentPage: "following",
         following: following,
         profileUser : req.profileUser, 
         visitorId: req.visitorId,
         isFollowing: req.isFollowing,
         isVisitorProfile: req.isVisitorProfile,
         counts: {
            postCount: req.postCount, 
            followerCount: req.followerCount, 
            followingCount: req.followingCount
        }
     })
    } catch {
        res.render('404')
    }
 
 }
