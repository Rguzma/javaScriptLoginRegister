
const express = require('express');
const app = express();
app.use( express.urlencoded({extended:true}) );
var bodyParser = require('body-parser');
app.use(bodyParser.urlencoded({ extended: true }));

app.use(express.static(__dirname + "/static"));
app.set('views', __dirname + '/client/views');
app.set('view engine', 'ejs');
const bcrypt = require( 'bcrypt' );
const mongoose = require('mongoose');
mongoose.connect('mongodb://localhost/usersSchema', {useNewUrlParser: true});
const {UserModel} = require ('./models/userModel');
const flash = require('express-flash');
app.use(flash());

var session = require('express-session');
app.use(session({
    secret: 'keyboard cat',
    resave: false,
    saveUninitialized: true,
    cookie: { maxAge: 60000 }
}));



app.get ('/', function(request, response){
	response.render('index');

});

app.get('/dashboard', (request, response) => { 
    console.log("viene el email de la session1: "+request.session.email);
    if (request.session.email === undefined ){
        response.redirect( '/' );
     
    }
    else {
    let email = request.session.email;
    console.log("viene el email de la session2: "+email);
    UserModel.findOne(email)
        .then(data => response.render("dashboard", {user: data}))
            // console.log("esta es la data: "+data)) 
        
        .catch(err => response.json(err));
    }
});

app.post( '/users/addUser', function( request, response ){
    const email = request.body.email;
    const firstName = request.body.firstName;
    const lastName = request.body.lastName;
    const password = request.body.password;
    const birthday= request.body.birthday;
    request.session.firstName = request.body.firstName;
    request.session.lastName = request.body.lastName;
    request.session.email = request.body.email;
    // console.log("datos introducidos: "+email+" "+firstName+" "+lastName+ " "+ password+" "+birthday)
    if(!password || !email || !firstName || !lastName || !birthday){
        request.flash('registration', "todos los espacios son requeridos");
        response.redirect( '/' );
    }
    else if ( firstName.length < 3 || firstName.length > 20){
        request.flash('registration', "first name must habe between 3 and 20 characters");
        response.redirect( '/' );

    }
    else if ( lastName.length < 3 || lastName.length > 20){
        request.flash('registration', "first name must habe between 3 and 20 characters");
        response.redirect( '/' );

    }
    else if ( !email.includes("@")  || !email.includes(".com") > 20){
        request.flash('registration', "email has not the proper format");
        response.redirect( '/' );

    }
    else if ( password.length <8 ){
        request.flash('registration', "email must have at least 8 characters");
        response.redirect( '/' );

    } 
    else if ( birthday.length > 10 ){
        request.flash('registration', "birthday has not the proper format");
        response.redirect( '/' );

    }
    else{
        UserModel
            .findOne(email)
            .then(result => {
                if(result !== null) {
                console.log("en caso de  encontrar cuenta")
                throw new Error( "account already exist");
                // response.redirect( '/' );
                }
            })
            .catch(error => {
                request.flash('registration', error.message )
                response.redirect( '/' );
            });

            console.log("datos introducidos: "+email+" "+firstName+" "+lastName+ " "+ password+" "+birthday);
            
            bcrypt.hash( password, 10 )
            .then( encryptedPassword => {
            const newUser = {
                email,
                firstName,
                lastName,
                password:  encryptedPassword,
                birthday
                }
            
            console.log("en caso de no encontrar");
            console.log("aqui va newUser: "+newUser);
            UserModel.createUser(newUser)
            .then(newway => { 
            console.log("no encontro")
            response.redirect('/dashboard');
            })
            .catch(err => {
            request.flash('registration', "something went wrong")
            response.redirect( '/' );
            });
        });

    };
});


// app.post( '/users/login', function( request, response ){
//     let email = request.body.loginEmail;
//     let password = request.body.loginPassword;

//     UserModel
//         .findOne( email )
//         .then( result => {
//             console.log( "Result", result );
//             if( result === null ){
//                 request.flash( 'login',"That user doesn't exist!" );
//                 response.redirect( '/' );
//             }
//             else{
//             bcrypt.compare( password, result.password )
//                 .then( flag => {
//                     // console.log("aqui comparo los password: "+password+" "+result.password)
//                     if( !flag ){
//                         console.log("cuando la contrase;a no calza");
//                         request.flash('login', "Wrong credentials!" );
//                         response.redirect( '/' );
//                     }
//                     else{
                    
//                     request.session.firstName = result.firstName;
//                     request.session.lastName = result.lastName;
//                     request.session.email = result.email;

//                     response.redirect( '/dashboard' );
//                     }
//                 });
//             };    // .catch( error => {
//                 //     request.flash( 'login', error.message );
//                 //     response.redirect( '/' );
//                 // }); 
//         });
//         // .catch( error => {
//         //     request.flash( 'login', error.message );
//         //     response.redirect( '/' );
//         });
                    

app.post( '/users/login', function( request, response ){
    let email = request.body.loginEmail;
    let password = request.body.loginPassword;

    UserModel
        .findOne( email )
        .then( result => {
            console.log( "Result", result );
            if( result === null ){
                throw new Error( "That user doesn't exist!" );
            }

            bcrypt.compare( password, result.password )
                .then( flag => {
                    if( !flag ){
                        throw new Error( "Wrong credentials!" );
                    }
                    request.session.firstName = result.firstName;
                    request.session.lastName = result.lastName;
                    request.session.email = result.email;

                    response.redirect( '/dashboard' );
                })
                .catch( error => {
                    request.flash( 'login', error.message );
                    response.redirect( '/' );
                }); 
        })
        .catch( error => {
            request.flash( 'login', error.message );
            response.redirect( '/' );
        });
});











app.post( '/logout', function( request, response ){
    request.session.destroy();
    response.redirect( '/' ); 
});



app.listen(8080, function (){//este es el cierre

	console.log("the user server is running in port 8080");
});