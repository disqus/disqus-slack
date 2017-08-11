// server.js
// where your node app starts

// init project
var express = require('express');
var bodyParser = require('body-parser');
var request = require('request');
var app = express();

app.use( bodyParser.json() );       // to support JSON-encoded bodies
app.use(bodyParser.urlencoded({     // to support URL-encoded bodies
  extended: true
})); 

// we've started you off with Express, 
// but feel free to use whatever libs or frameworks you'd like through `package.json`.

// http://expressjs.com/en/starter/static-files.html
app.use(express.static('public'));

// http://expressjs.com/en/starter/basic-routing.html
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
    var url = 'https://disqus.com/api/3.0/posts/details.json?api_key=4z0c9uY13yh3lvTsPInWbtQsJiFhikWkJjDINkms89Awq18eSXfBtWzUnfEFsgwt&post=' + msgid;
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
