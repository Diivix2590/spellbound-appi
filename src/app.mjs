import express from 'express';
import session from 'express-session';
import mongoStore from 'connect-mongo'
import logger from 'morgan';
import forceSsl from 'express-force-ssl';
import db from './db';
import user from './models/user';
import authController from './controllers/authController';
import userController from './controllers/userController';
import spellController from './controllers/spellController';

const app = express();

if (process.env.NODE_ENV !== "production") {
    // HTTP request logger middleware for node.js
    app.use(logger('dev'));
}

// Force SSL to be used
app.use(forceSsl);

// Add headers
app.use(function (req, res, next) {
    // Website you wish to allow to connect
    res.setHeader('Access-Control-Allow-Origin', process.env.ALLOW_ORIGIN);

    // Request methods you wish to allow
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');

    // Request headers you wish to allow
    res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type');

    // Set to true if you need the website to include cookies in the requests sent
    // to the API (e.g. in case you use sessions)
    res.setHeader('Access-Control-Allow-Credentials', true);

    // Pass to next layer of middleware
    next();
});

//use sessions for tracking logins
const store = mongoStore(session);
app.use(session({
    secret: process.env.SESSION_SECRET,
    resave: true,
    saveUninitialized: false,
    store: new store({
        mongooseConnection: db
    }),
    cookie: {
        httpOnly: true,
        secure: true,
        // domain: 'spellbound-react.com',
        // path: '/foo/bar',
        // Cookie will expire in 1 hour from when it's generated 
        expires: new Date(Date.now() + 60 * 60 * 1000)
    },
    ephemeral: true
}));

// Auth - validate user if they already have a session
app.use(function (req, res, next) {
    if (req.session && req.session.user) {
        user.findOne({ email: req.session.user.email }).exec(function (error, user) {
            if (error || !user) {
                const err = new Error("Wrong email or password.");
                err.status = 401;
                return next(err);
            }

            if(req.user) {
                req.user = user;
                delete req.user.password; // delete the password from the session
                req.session.user = user;  // refresh the session value
                res.locals.user = user;
            }
        });
    } 

    return next();
});

// Define routes
if (process.env.NODE_ENV === "production") {
    // we only want to serve the static files on production
    app.use('/', express.static(`${__dirname}/public`));
}
app.use('/api/auth', authController);
app.use('/api/users', userController);
app.use('/api/spells', spellController);
// express will serve up index.html if it doesn't recognize the route
app.get('*', (req, res) => {
    res.sendFile(path.resolve(__dirname, 'public', 'index.html'));
});

// error handler
// define as the last app.use callback
app.use(function (err, req, res, next) {
    res.status(err.status || 500);
    res.send(err.message);
});

export default app;
