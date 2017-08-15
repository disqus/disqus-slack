var express = require('express');
var bodyParser = require('body-parser');
var request = require('request');
var app = express();
var ua = require('universal-analytics');

var visitor = ua('UA-4667606-5');

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static('public'));

app.get('/auth/slack', function(req, res){
  var data = {form: {
      client_id: process.env.SLACK_CLIENT_ID,
      client_secret: process.env.SLACK_CLIENT_SECRET,
      code: req.query.code
  }};
  request.post('https://slack.com/api/oauth.access', data, function (error, response, body) {
    if (!error && response.statusCode == 200) {
      // You are done.
      // If you want to get team info, you need to get the token here
      var jbody = JSON.parse(body);
      if (jbody.access_token) {
        request.post('https://slack.com/api/team.info?token='+jbody.access_token, null, function (e2, r2, b2) {
          var jb2 = JSON.parse(b2);
          res.redirect('https://' + jb2.team.domain + '.slack.com/apps/manage');
        });
      }
    }
  });
});

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
    var url = 'https://disqus.com/api/3.0/posts/details.json?api_key=' + process.env.DISQUS_API_KEY + '&post=' + msgid;
    request(url, function (err2, res2, body) {
      if(body) {
        body = JSON.parse(body);
        if (body.response.raw_message) {
          visitor.pageview("/").send();
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
