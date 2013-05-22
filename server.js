var mixdown = require('mixdown-server'),
	serverConfig = new mixdown.Config(require( './server.json')),
	envConfig = null,
	packageJSON = require('./package.json');

serverConfig.config.server.version = packageJSON.version;

// wire up error event listeners before initializing config.
serverConfig.on('error', function(err) {
	console.info(err);
});

// load env config and apply it
try {
	serverConfig.env( require('./server-' + process.env.MIXDOWN_ENV + '.json') );
}
catch (e) {}

var main = mixdown.MainFactory.create({
	packageJSON: packageJSON,
	serverConfig: serverConfig
});

serverConfig.init();

main.start(function(err, main) {

	if (err) {
		if (logger) {
			logger.error('Server did not start');
		}
		else {
			console.log('Server did not start');
		}

		process.exit();
	}
});

// http://nodejs.org/api/http.html#http_http_globalagent
var ga = require("http").globalAgent;
ga.maxSockets = 500;
logger.info('globalAgent.maxSockets: ' + ga.maxSockets);
logger.info('Mixdown Geo Location Server Version: ' + serverConfig.server.version);
