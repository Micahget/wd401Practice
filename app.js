/* eslint-disable  */
const express = require('express')
const app = express()
var csrf = require("tiny-csrf");
const cookieParser = require('cookie-parser')
const { Sessions, UserAccount } = require('./models')
const bodyParser = require('body-parser')

// import authentication middlewares
const passport = require("passport");
const session = require("express-session");
const connectEnsureLogin = require("connect-ensure-login");
const LocalStrategy = require("passport-local").Strategy;

// password hashing
const bycrypt = require('bcrypt')
const saltRounds = 10




app.use(bodyParser.json())
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser('shh! this is a secret'))
app.use(csrf("this_should_be_32_character_long", ["POST", "PUT", "DELETE"]));

// import flash message 
const flash = require("connect-flash");
app.use(flash())




const path = require("path");
const db = require('./models');
app.use(express.static(path.join(__dirname, "public")));

app.set("views", path.join(__dirname, "views")); // this is the path to the views folder.
// set view engine
app.set('view engine', 'ejs')

// here we are setting up sessions
app.use(
    session({
        secret: "my_super_secret_key-2345235234534534534",
        cookie: { maxAge: 24 * 60 * 60 * 1000 }, // 24 hours
    })
);

// here we are setting up passport
app.use(passport.initialize());
app.use(passport.session());

app.use(function (request, response, next) {
    response.locals.messages = request.flash();
    next();
});

// here we are setting up passport local strategy for the user
passport.use('user-local', new LocalStrategy(
    {
        usernameField: "email",
        passwordField: "password",
    }, async (email, password, done) => {
        try {
            const user = await UserAccount.findOne({ where: { email: email } });
            if (!user) {
                return done(null, false, { message: "Incorrect email." });
            }
            // compare the the password with the hashed password
            const result = await bycrypt.compare(password, user.password);
            if (result) {
                return done(null, user);
            } else {
                return done(null, false, { message: "Invalid password" });
            }
        } catch (error) {
            return done(error);
        }
    }
)
);

// here we are setting up passport local strategy for the admin
passport.use('admin-local', new LocalStrategy({
    usernameField: 'email',
    passwordField: 'password'
}, async (email, password, done) => {
    try {
        const user = await UserAccount.findOne({
            where: {
                email: email,
            },
        });

        if (!user) {
            return done(null, false, { message: 'Incorrect email.' });
        }
        if (user.role !== 'admin') {
            return done(null, false, { message: 'You are not authorized to access this page.' });
        }
        // compare the the password with the hashed password
        const match = await bycrypt.compare(password, user.password)
        if (!match) {
            return done(null, false, { message: 'Incorrect password.' });
        }
        return done(null, admin); // here in the done function we are passing the user object wich is the admin user
    } catch (err) {
        return done(err);
    }
}));

// here we are serializing and deserializing the user
passport.serializeUser(function (user, done) {
    console.log("serializeUser", user.id)
    done(null, user.id);
});

passport.deserializeUser(function (id, done) {
    UserAccount.findByPk(id)
        .then((user) => {
            console.log("deserializing user in session ", user.id);
            done(null, user);
        })
        .catch((error) => {
            done(error, null);
        });
});



const adminAccessControl = async (request, response, next) => {
    const user = await UserAccount.findOne({ where: { email: request.user.email } })
    console.log("this is the user", user, "this is the user role", user.role)
    // if the user role is admin or super admin then allow the user to access the page
    if (user.role === 'admin' || user.role === 'superadmin') {
        return next()
    }
    response.redirect('/login')

};

// render the landing page
app.get("/", async (request, response) => {
    response.render("index", {
        title: "Sport Scheduler",
        csrfToken: request.csrfToken(),
    });
});

// Handle CSRF token errors
app.use((error, request, response, next) => {
    if (error && error.code === 'EBADCSRFTOKEN') {
      response.redirect('/error');
    } else {
      next(error);
    }
  });

// render error page
app.get("/error", async (request, response) => {
    response.render("errorPage", {
        title: "Error",
    });
});

// **************SignUp and SignOut******************************
// render the login page
app.get("/signup", function (request, response) {
    response.render("signup", {
        title: "Signup",
        csrfToken: request.csrfToken(),
    });
});

//   render the users page
app.get("/users", function (request, response) {
    response.render("signup", { title: "login", csrfToken: request.csrfToken() });
});
// render the login page
app.get("/login", function (request, response) {
    response.render("login", { title: "Login", csrfToken: request.csrfToken() }); // here the title is located in the login.ejs file
});

// this one is when the user want to signup
app.post("/users", async function (request, response) {
    // hash the password
    const hashedPad = await bycrypt.hash(request.body.password, saltRounds)
    // flash message
    const { firstName, email, password } = request.body;
    if (!firstName || !email || !password) {
        request.flash("error", "Please fill all the fields");
        return response.redirect("/users");
    }
    // check the database if the user already exists
    const user = await UserAccount.findOne({ where: { email } });
    if (user) {
        request.flash("error", "User already exists");
        return response.redirect("/users");
    }
    const adminPassCode = 'admin'
    const superAdminPassCode = 'bosssuperadmin'
    const adminPass = request.body.adminPass
    const role = adminPass === adminPassCode ? 'admin' : adminPass === superAdminPassCode ? 'superadmin' : 'user'
    console.log("First Name", request.body.firstName)
    try {
        const user = await UserAccount.create({
            firstName: request.body.firstName,
            lastName: request.body.lastName,
            email: request.body.email,
            password: hashedPad,
            role: role
        });
        request.login(user, (err) => {
            if (err) {
                console.log(err)
            }
            response.redirect('/scheduler')
        })
        // response.redirect('/scheduler')
    } catch (error) {
        console.log(error)
    }
});

//this one is when the user want to login
app.post('/session', (req, res, next) => {
    passport.authenticate('user-local', { failureFlash: true }, (err, user, info) => {
        if (err) return next(err);
        if (user) {
            req.logIn(user, (err) => {
                if (err) return next(err);
                return res.redirect('/scheduler');
            });
        } else {
            passport.authenticate('admin-local', { failureFlash: true }, (err, admin, info) => {
                if (err) return next(err);
                if (admin) {
                    req.logIn(admin, (err) => {
                        if (err) return next(err);
                        return res.redirect('/scheduler');
                    });
                } else {
                    req.flash('error', 'Invalid email or password');
                    return res.redirect('/login');
                }
            })(req, res, next);
        }
    })(req, res, next);
});


// creating logout route to render the login.ejs file
app.get("/signout", (request, response, next) => {
    request.logout((error) => {
        //logout is a method provided by passport
        if (error) {
            return next(error);
        }
        return response.redirect("/"); // redirect to the landing page
    });
});

//**********************************************End of signup/ login*****************************************************

app.get('/scheduler',
    connectEnsureLogin.ensureLoggedIn(), async (request, response) => {
        // use try catch to catch any errors

        const sessions = await Sessions.getEverySessions()
        const user = request.user
        // console.log(sessions)

        if (request.accepts('html')) {
            response.render('scheduler', {
                title: 'scheduler',
                sessions: sessions,
                user: user,
                csrfToken: request.csrfToken()
            })
        } else {
            response.json({
                sessions: sessions
            })
        }

    })

// render the newSession.ejs file
app.get('/newSession/:sport',
    connectEnsureLogin.ensureLoggedIn(), (request, response) => {
        const sport = request.params.sport
        console.log(sport)
        if (request.accepts('html')) {
            response.render('newSession', {
                title: 'newSession',
                sport: sport,
                csrfToken: request.csrfToken()
            })
        } else {
            // if the request is not html, send a json response
            response.json({
                sport: sport
            })
        }

    })


app.post('/newSession', async (request, response) => {
    const { date, place, playerName, totalPlayers, sport } = request.body
    console.log('thisssssssssssssssss', date, place, playerName, totalPlayers, sport)
    if (!date || !place || !playerName || !totalPlayers) {
        request.flash('error', 'Please fill all the fields')
        return response.redirect('/newSession/' + sport)
    } 
    // add regex for the name to be atleast 3 characters and should contain letters
    const nameRegex = /^[a-zA-Z]{3,}$/;
    if (!nameRegex.test(playerName)) {
        request.flash('error', 'Please enter a valid player name')
        return response.redirect('/newSession/' + sport)
    }
    const count = playerName.split(',')
    // get the user Id of the session creator 
    const userId = request.user.id
    if (count.length > totalPlayers) {
        // this console message will be replaced by a flash message
        request.flash('error', 'you have entered more players than the total players')
        return response.redirect('/newSession/' + sport)
    }
    try {
        await Sessions.addSession({
            date: date,
            place: place,
            playerName: playerName,
            totalPlayers: totalPlayers,
            sport: sport,
            userId: userId
        })
        return response.redirect('/sports/' + sport)
    } catch (error) {

        console.log(error)
    }

})



app.get('/sessionReport', connectEnsureLogin.ensureLoggedIn(), adminAccessControl, async (request, response) => {
        const user = request.user
        const sessions = await Sessions.getAvailableSessions()
        const activeSession = await Sessions.getNumberOfActiveSessions()
        const inactveSession = await Sessions.getNumberOfInactiveSessions()
        const totalUser = await UserAccount.getAllUsers()
        // const famousSport = await Sessions.getFamousSport()
        const futureSessions = await Sessions.getFutureSessions()
        const pastSessions = await Sessions.getPassedSessions()
        const todaySessions = await Sessions.getTodaySessions()
        console.log('this is the user', user.email)

        if (request.accepts('html')) {
            response.render('sessionReport', {
                title: 'Sessions Report',
                sessions: sessions,
                activeSession: activeSession,
                inactveSession: inactveSession,
                user: totalUser,
                // famousSport: famousSport,
                futureSessions: futureSessions,
                pastSessions: pastSessions,
                todaySessions: todaySessions,
                user: user,
                csrfToken: request.csrfToken()

            })
        } else {
            response.json({
                sessions: sessions
            })
        }

    })

    // render the displalyUsers.ejs file
app.get('/displayUsers',connectEnsureLogin.ensureLoggedIn(), adminAccessControl, async (request, response) => {
        const users = await UserAccount.getAllUsers()
        if (request.accepts('html')) {
            response.render('displayUsers', {
                title: 'Users',
                users: users,
                csrfToken: request.csrfToken()
            })
        } else {
            response.json({
                users: users
            })
        }

    })

app.get('/newSport',
    connectEnsureLogin.ensureLoggedIn(), (request, response) => {
        if (request.accepts('html')) {
            response.render('newSport', {
                title: 'newSport',
                csrfToken: request.csrfToken()
            })
        } else {
            // if the request is not html, send a json response
            response.json({
            })
        }
    })


// add new sport to the database
app.post('/newSport', async (request, response) => {
    // here we will add a row of sport to sports table
    const validSports = ["football", "basketball", "cricket", "soccer", "volleyball", "swimming", "boxing", "baseball", "golf", "rugby"];
    const sport = request.body.sport
    if (!validSports.includes(sport)) {
        return response.status(400).redirect('/error')
  }

    try {
        const sport = await Sessions.addSession({
            sport: request.body.sport,
        })
        console.log(sport)
        return response.redirect('/scheduler')
    }
    catch (error) {
        // display error page
        return response.redirect('/error')
    }
})

// render the sport.ejs file with detail of sessions sports/name of sport from the database
app.get('/sports/:sport',
    connectEnsureLogin.ensureLoggedIn(), async (request, response) => {
        const sport = request.params.sport
        const allUsers = await UserAccount.getAllUsers()
        // get active Sessions of the sport
        const activeSession = await Sessions.getActiveSessions(sport)
        const passedSession = await Sessions.getPastSessions(sport)
        const user = request.user
        const userSession = await Sessions.getSessionsByUserId(user.id, sport)
        const inactiveSession = await Sessions.getInactiveSessions(sport)
        console.log('this is the user', user)
        

        if (request.accepts('html')) {
            response.render('sports', {
                title: 'sports',
                sport: sport,
                activeSession: activeSession,
                passedSession: passedSession,
                user: user,
                userSession: userSession,
                inactiveSession: inactiveSession,
                allUsers: allUsers,
                csrfToken: request.csrfToken()
            })
        } else {
            response.json({
                sport: sport,
                activeSession: activeSession,
                passedSession: passedSession,
                User: user,
                userSession: userSession
            })
        }

    })

// lets render sport.ejs file with csrf token
// app.get('/sports',
//     connectEnsureLogin.ensureLoggedIn(), (request, response) => {
//         response.render('sports', { title: 'sports', csrfToken: request.csrfToken() })
//     })


//delete a sport from the database whcih will delete every session which have same sport name
app.delete('/', async (request, response) => {
    const sport = request.body.sport
    console.log(sport)
    try {
        const deleted = await Sessions.deleteSessionsBySport(sport)
        return response.json({ success: true });

    }
    catch (error) {
        console.log(error);
        return response.status(422).json(error);
    }
})

// delete a session from the database by id
app.delete('/sports/:id', async (request, response) => {
    const id = request.params.id

    try {
        const deleted = await Sessions.deleteSessionById(id)
        return response.json({ success: true });
    }
    catch (error) {
        console.log(error);
        return response.status(422).json(error);
    }
})


// when updateSession is called, render the newSession page by its id for the sake of updating
app.get('/updateSession/:sport/:id',
    connectEnsureLogin.ensureLoggedIn(), (request, response) => {
        const id = request.params.id
        const sport = request.params.sport
        if (request.accepts('html')) {
            response.render('updateSession', {
                title: 'updateSession',
                id: id,
                sport: sport,
                csrfToken: request.csrfToken()
            })
        } else {
            // if the request is not html, send a json response
            response.json({
                sport: sport,
                id: id
            })
        }

    })


// update a session from the database by id
app.post('/updateSession/:id', async (request, response) => {
    const { date, place, playerName, totalPlayers } = request.body
    const id = request.params.id
    const sport = request.body.sport

    try {
        const updated = await Sessions.updateSessionById(id, { date, place, playerName, totalPlayers, sport })
        return response.redirect(`/sessionDetail/${id}`)
    }
    catch (error) {
        console.log(error);
        return response.status(422).json(error);
    }
})

// render the sessionDetail.ejs file with detail of sessions sports/name of sport from the database
app.get('/sessionDetail/:id',
    connectEnsureLogin.ensureLoggedIn(), async (request, response) => {
        const id = request.params.id
        const session = await Sessions.getSessionById(id)
        const user = request.user
        const dbUser = await UserAccount.getAllUsers()
        console.log(id)
        if (request.accepts('html')) {
            response.render('sessionDetail', {
                title: 'sessionDetail',
                session: session,
                User: user,
                dbUser: dbUser,
                csrfToken: request.csrfToken()
            })
        } else {
            // if the request is not html, send a json response
            response.json({

            })
        }
    })

// update a session from the database by id 
app.put('/sessionDetail/:id/', async (request, response) => {
    const id = request.params.id
    const name = request.body.playerName
    console.log("updated naem: ", name)
    try {
        const updated = await Sessions.updatePlayerNameById(id, name)
        return response.json({ success: true });
    }
    catch (error) {
        console.log(error);
        return response.status(422).json(error);
    }
})

// update session by id
app.delete('/sessionDetail/:id', async (request, response) => {
    const id = request.params.id
    const reason = request.body.reason
    // const active = request.body.active
    console.log("reason: ", reason)
    try {
        const updated = await Sessions.cancelSessionById(id, reason)
        return response.json(updated);
    }
    catch (error) {
        console.log(error);
        return response.status(422).json(error);
    }
})

// add about page
app.get('/about', (request, response) => {
    response.render('about', { title: 'about' })
})


module.exports = app