// server.js
// where your node app starts

// init project
var express = require('express');
var expressSession = require('express-session');
var bodyParser = require('body-parser');
var cookieParser = require('cookie-parser');
var request = require('request');
var app = express();
// set up slack passport for oauth
var passport = require('passport');
var SlackStrategy = require('passport-slack').Strategy;

// the process.env values are set in .env
passport.use(new SlackStrategy({
  clientID: process.env.SLACK_CLIENT_ID,
  clientSecret: process.env.SLACK_CLIENT_SECRET,
  callbackURL: 'https://'+process.env.PROJECT_DOMAIN+'.glitch.me/login/slack/return'
},
function(token, tokenSecret, profile, cb) {
  return cb(null, profile);
}));
passport.serializeUser(function(user, done) {
  done(null, user);
});
passport.deserializeUser(function(obj, done) {
  done(null, obj);
});

app.use( bodyParser.json() );       // to support JSON-encoded bodies
app.use(bodyParser.urlencoded({     // to support URL-encoded bodies
  extended: true
})); 
app.use(bodyParser.urlencoded({extended: true}));
app.use(cookieParser());
app.use(express.static('public'));
app.use(expressSession({ secret:'watchingferries', resave: true, saveUninitialized: true, maxAge: (90 * 24 * 3600000) }));
app.use(passport.initialize());
app.use(passport.session());

// we've started you off with Express, 
// but feel free to use whatever libs or frameworks you'd like through `package.json`.

// http://expressjs.com/en/starter/static-files.html
app.use(express.static('public'));

app.get('/logoff',
  function(req, res) {
    res.clearCookie('slack-passport-example');
    res.redirect('/');
  }
);

app.get('/auth/slack', passport.authenticate('slack'));

app.get('/login/slack/return', 
  passport.authenticate('slack', 
    { successRedirect: '/setcookie', failureRedirect: '/' }
  )
);

app.get('/setcookie', requireUser,
  function(req, res) {
    res.cookie('slack-passport-example', new Date());
    res.redirect('/success');
  }
);

function requireUser (req, res, next) {
  if (!req.user) {
    res.redirect('/');
  } else {
    next();
  }
};

app.get('/success', requireLogin,
  function(req, res) {
    if(req.cookies['slack-passport-example']) {
      res.sendFile(__dirname + '/views/success.html');
    } else {
      res.redirect('/');
    }
  }
);

function requireLogin (req, res, next) {
  if (!req.cookies['slack-passport-example']) {
    res.redirect('/');
  } else {
    next();
  }
};

app.post("/", function (req, res) {
  var text = req.body.text;
  var msg = text.match(/disq.us\/p\/.*|#comment-.*/i);
  var msgid;
  if(msg) {
    if (msg.input.indexOf('disq.us/p') > -1) {
        msgid = msg.input.substr(msg.index + 10 ).split(' ')[0]
        msgid = parseInt(msgid, 36)
    } else {
        msgid = msg.input.substr(msg.index + 9)
    }
    console.log(msgid);
    var url = 'https://disqus.com/api/3.0/posts/details.json?api_key=' + process.env.DISQUS_API_KEY + '&post=' + msgid;
    request(url, function (err2, res2, body) {
      if(body) {
        body = JSON.parse(body);
        if (body.response.raw_message) {
          res.json({
            response_type: 'in_channel',
            attachments: [{
              fallback: body.response.raw_message,
              author_name: body.response.author.username,
              author_icon: body.response.author.avatar.small,
              text: body.response.raw_message,
              color: '#2E9FFF',
              footer: 'via Disqus',
              footer_icon: 'https://a.disquscdn.com/dotcom/d-2407bda/img/brand/disqus-social-icon-white-blue.png'
            }]
          });
        }
      }
    });
  };
});

// listen for requests :)
var listener = app.listen(process.env.PORT, function () {
  console.log('Your app is listening on port ' + listener.address().port);
});
