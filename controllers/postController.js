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
      Post.findSingleById(req.params.id, req.visitorId)
      .then( post => {   
        res.render('single-post-screen' , {post: post})
      })
      .catch( () => {
          res.render( '404')
      })
     
 }

 exports.viewEditScreen = (req, res) => {
  Post.findSingleById(req.params.id, req.visitorId)
  .then( post => {
    if(post.isVisitorOwner) {
      res.render('edit-post' , {post: post})
    } else {
      req.flash('errors', 'you can not perform this action')
      req.session.save( () => res.redirect('/'))
    }
    
  })
  .catch( () => res.render( '404'))
 }

 exports.edit = (req, res) => {
    let post = new Post(req.body, req.visitorId, req.params.id)
    post.update()
    .then( () => {
      req.flash('success' , 'Post succesfully Updated')
      req.session.save(function() {
        res.redirect(`/post/${req.params.id}/edit`)
      })
    })
    .catch( (mes) => {
      if(mes == "Not allowed") {
        req.flash('errors', "What Are you doning here")
        req.session.save(() => res.redirect(`/`))
      } else {
        mes.forEach(message => req.flash('errors', message))
        req.session.save(() =>  res.redirect(`/`) )
      }
    })
 }

 exports.delete = (req, res) => {
   Post.delete(req.params.id, req.visitorId)
   .then( () => {
    req.flash('success', 'post successfully deleted')
    // req.session.save( () => res.redirect(`/profile/${req.session.user.username}`) )
    req.session.save( () => res.redirect(`/`) )
   })
   .catch( () => {
    req.flash('errors', 'do not have permession')
    req.session.save( () => res.redirect(`/`) )
   })
   
 }

 exports.search = (req, res) => {
   Post.search(req.body.searchTerm)
   .then( posts => res.json(posts))
   .catch( ()=> res.json([]))
 }