const Follow = require('../models/Follow')

exports.addFollow = (req, res) => {
   let follow = new Follow(req.params.username, req.visitorID)
   follow.create()
   .then( () => {
    req.flash('success', `Successfully followed ${req.params.username}`)
    req.session.save( () => res.redirect(`/profile/${req.params.username}`))
   })
   .catch( (errors) => {
    errors.forEach( error => req.flash("errors", error))
    req.session.save( () => res.redirect('/'))
   })
}