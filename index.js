require('shelljs/global');
var express = require('express');
var bodyParser = require('body-parser');
var https = require('https');

var URL_TRUEDICE = 'https://www.random.org/integers/?num=50&min=1&max=6&col=1&base=10&format=plain&rnd=new';
var POOL_TRUEDICE = [];
var SEQDELAY_DICEPOOL = 5000;
var PORT = process.env.NODE_PORT || 8079;
var CHECKID = process.env.CHECKID || console.error("No CHECKID ENV found, Server would be volurable!");
var VERBOSE = process.env.VERBOSE || false;
var NAME = process.env.BOT_NAME || 'True Random Dice';
var AVATOR = process.env.BOT_AVATOR || 'https://www.baidu.com/img/baidu_jgylogo3.gif';  // TODO: no baidu logo
var MSGPREFIX = process.env.BOT_MSGPREFIX || 'I choose ';


var app = express();
app.use(bodyParser.urlencoded({     // to support pubu.im URL-encoded bodies
      extended: true
}));
app.listen(PORT, function () {console.log("Listen on " + PORT)});

// Initlize dice pool
(function refillDicePool () {
	if (! checkDicePool(null)) {  // Fill up dice pool
		console.error("Dice pool is empty.");
		if (VERBOSE) console.log("Async fetching sweety randomness...");
		setTimeout(refillDicePool, SEQDELAY_DICEPOOL);
	}
})();  // Init at startup

app.get('/', function (req, res) {
	if (req.query.t === 'reboot') {
		res.send('rebooting');
		exec('/sbin/reboot');

	} else {
        die(res);
	}
});
app.post('/pubuim', function (req, res) {
    var id = req.body.team_id,
        keyword = req.body.trigger_word;
    if (CHECKID && id !== CHECKID) {
        die(res);
    }
    if (! CHECKID) console.error("Unknown requests from ID: " + id);  // log error without CHECKID ENV on each request
    if (keyword) {
        switch(keyword.toLowerCase()) {
            case 'roll':
                var t = rollDice(res);
                var response = wrappedJSON(t, BOT_NAME, BOT_AVATOR);
                res.json(response);
                break;
            default:
                die(res, keyword);
        }
    }
});

function die(res, msg) {  // die with optional message
    if (! res) console.error("Could not initlized, server blocked from random.org.");
    if (msg) res.send("What's " + msg + "? I don't get it.");
    res.send('Bad token!');
}

function checkDicePool (res) {  // return true if Pool still full
    var that = this;
    if (POOL_TRUEDICE.length < 5) {
        https.get(URL_TRUEDICE, function getTRN_Dice (r) {
            if (r.statusCode == 503) {
                    die(that.res, "Randomness has been ran out!");  // that.res would be null
            }
            r.on('data', function (d) {
                var rndString = d.toString();
                var t = rndString.split('\n');
                t.pop();                                       // remove last \n generated
                POOL_TRUEDICE = POOL_TRUEDICE.concat(t);       // push to dice poll
                if (VERBOSE) console.log("Fresh sweeties right in the pool!");
            });
        }).on('error', function (e) {
              console.error("Cought error: " + e.message + "!");
        });
        return false;
    } else {
		if (VERBOSE) console.log("Dice pool looks good.");
		return true;
	}
}

function rollDice (res) {
    checkDicePool(res);  // refill POOL, keep service consistence
    return POOL_TRUEDICE.shift();
}

function wrappedJSON (msg, botName, botAvatar) {
    return {
				"text": MSGPREFIX + msg + ".",
				"username": botName,
                "icon_url": botAvatar
			}
}

