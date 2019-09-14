const Post = require('../models/Post')

exports.viewCreateScreen = (req, res) => {
   res.render('create-post')
}

exports.create = (req, res) => {
   let post = new Post(req.body, req.visitorId  )
   post.create()
   .then( (postID) => {
        req.flash("success", "new Post created")
         req.session.save( () => res.redirect(`/post/${postID}`))
   })
   .catch( (errors) => {
    errors.forEach( err =>  req.flash("errors", err))
    req.session.save( () => res.redirect(`create-post`))
   })
 }

 exports.viewSingle =  (req, res) => {
      Post.findSingleById(req.params.id)
      .then( post => {
        res.render('single-post-screen' , {post: post})
      })
      .catch( () => {
          req.flash('errors', 'something is not correct')
          req.session.save( () => res.redirect(`/`) )
      })
     
 }