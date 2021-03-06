const Follow = require('../models/Follow')

exports.addFollow = (req, res) => {
   let follow = new Follow(req.params.username, req.visitorId)
   console.log(req.visitorID)
   follow.follow()
   .then( () => {
    req.flash('success', `Successfully followed ${req.params.username}`)
    req.session.save( () => res.redirect(`/profile/${req.params.username}`))
   })
   .catch( (errors) => {
    errors.forEach( error => req.flash("errors", error))
    req.session.save( () => res.redirect('/'))
   })
}

exports.unFollow = (req, res) => {
   let follow = new Follow(req.params.username, req.visitorId)
   console.log(req.visitorID)
   follow.unFollow()
   .then( () => {
    req.flash('success', `Successfully unfollowed ${req.params.username}`)
    req.session.save( () => res.redirect(`/profile/${req.params.username}`))
   })
   .catch( (errors) => {
    errors.forEach( error => req.flash("errors", error))
    req.session.save( () => res.redirect('/'))
   })
}