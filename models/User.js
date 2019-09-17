const usersCollection = require('../db').db().collection("User")
const validator = require("validator")
const bcrypt = require('bcryptjs')
const md5 = require('md5')


let User = function(data,getAvatar ) {
    this.data = data
    this.errors = []
    if(getAvatar == undefined) {getAvatar = false}
    if(getAvatar) { this.getAvatar()}
}

User.prototype.cleanUp = function() {
    if(typeof(this.data.username) != "string") { this.data.username = ""}
    if(typeof(this.data.email) != "string") { this.data.email = ""}
    if(typeof(this.data.password) != "string") { this.data.password = ""}

    // git rid of any bogus data

    this.data = {
        username: this.data.username.trim().toLowerCase(),
        email: this.data.email.trim().toLowerCase(),
        password: this.data.password
    }
}

User.prototype.validate =  function() {
    if(!this.data.username || this.data.username.length < 3) {this.errors.push("user name should be at least 3 characters ")}
    if(!validator.isAlphanumeric(this.data.username)) {this.errors.push("username shoul only have letters and numbers")}
    if(this.data.username.length > 10) {this.errors.push("password must be no more than 10 character ")}
    if(!validator.isEmail(this.data.email)) {this.errors.push("not valid email ")}
    if(!this.data.password || this.data.password.length < 6) {this.errors.push("password must be atleast 8 character ")}
    if(this.data.password.length > 20) {this.errors.push("password must be no more than 20 character ")}

    return new Promise( async (resolve, reject) => {
        // if validation pass check if email and username are taken
        if(this.data.username.length > 2 && this.data.username.length < 11 &&validator.isAlphanumeric(this.data.username)) {
            let usernameTaken =  await usersCollection.findOne({username : this.data.username})

            if(usernameTaken) { this.errors.push("username already taken")}
        }

        if(validator.isEmail(this.data.email)) {
            let emailTaken =  await usersCollection.findOne({email : this.data.email})

            if(emailTaken) { this.errors.push("email is already taken") }
        }

        resolve()
    } )
}

User.prototype.register = function() {
    return new Promise( async (resolve, reject) => {
        this.cleanUp()
        await this.validate()

        if(!this.errors.length) {
            let salt = bcrypt.genSaltSync(10)
            this.data.password = bcrypt.hashSync(this.data.password, salt)
            await usersCollection.insertOne(this.data)
            this.getAvatar()
            resolve(this.data)
        } else {
            reject(this.errors)
        }
    } )  
}


User.prototype.login = function() {
    return new Promise( (resolve, reject) => {
        this.cleanUp()
        
        let attemptedUser = usersCollection.findOne({username : this.data.username})
        .then( (attemptedUser) => {
            if(attemptedUser && bcrypt.compareSync(this.data.password, attemptedUser.password)) {
                 //thes 2 lignes are for avatar part is for 
                 this.data = attemptedUser
                 this.getAvatar()
                resolve(attemptedUser)
            } else {
                reject("The Login or Password are incorrect")
            }
        })
        .catch( () => {
            reject("try Again later")
        })

     
    } )  
}

User.prototype.getAvatar = function() {
    this.avatar = `https://gravatar.com/avatar/${md5(this.data.email)}?s=128`
}

User.findByUsername = function(username) {
    return new Promise( (resolve, reject) => {
        usersCollection.findOne({username : username})
        .then( (userInfo) => {
            if(userInfo) {
                let user = new User(userInfo, true)
                user = {
                    id : user.data._id,
                    username: user.data.username,
                    avatar: user.avatar
                }
                console.log(user)
                resolve(user)
            } else {
                reject()
            }
        })
        .catch( () => {
            reject()
        })
    })
    
}

module.exports = User