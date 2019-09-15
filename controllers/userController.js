const User = require('../models/User')



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

exports.home = (req, res) => {
    if(req.session.user){
        res.render('home-dashboard')
    } else {
        res.render('home-guest', {regErrors : req.flash('regErrors')})
    }
    
}