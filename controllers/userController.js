const User = require('../models/User')
const Post = require('../models/Post')



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

exports.profilePostsScreen = (req, res) => {
    User.findByUsername(req.params.username)
    .then( (user) => {
        Post.findPostsByAuthor(user.id, req.visitorId)
        .then( (posts) => res.render('profile', {user : user, posts: posts}))
        .catch( () => res.render('404'))        
    })
    .catch( () => res.render('404'))
}

exports.home = (req, res) => {
    if(req.session.user){
        res.render('home-dashboard')
    } else {
        res.render('home-guest', {regErrors : req.flash('regErrors')})
    }
    
}