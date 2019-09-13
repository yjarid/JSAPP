const User = require('../models/User')

exports.home = (req, res) => {
    res.render('home-guest')
}

exports.register = (req, res) => {
    let user = new User(req.body)

    user.register()
    .then( () => {
        req.flash("success" , "sucess registration login")
        req.session.save( () => { res.redirect("/") } ) 
    })
    .catch( (regErrors) => {
        regErrors.forEach( (err) => req.flash("regErrors" , err))
        req.session.save( () => { res.redirect("/") } ) 
        
    })
}