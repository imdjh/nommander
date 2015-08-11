// rewrite in es6
var foo = require('shelljs/global');
var express = require('express');

var app = express();

app.get('/', function (req, res) {
	if (req.query.t === 'reboot') {
		res.send('rebooting');
		exec('/sbin/reboot');
		
	} else {
		res.send('Bad token!');

	}
});

var server = app.listen(3000);

