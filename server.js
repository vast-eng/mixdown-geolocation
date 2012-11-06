var _ = require('lodash'),
	opt = require('optimist'),
	util = require('util'),
	packageJSON = require('./package.json'),
	argv = opt
		.alias('h', 'help')
		.alias('?', 'help')
		.describe('help', 'Display help')
		.usage('Starts ' + packageJSON.name + ' for geolocation lookup.\n\nVersion: ' + packageJSON.version + '\nAuthor: ' + packageJSON.author)
		.alias('v', 'version')
		.describe('version', 'Display mixdown server version.')
		.argv,
	mixdown = require('mixdown-server'),
    serverConfig = new mixdown.Config(require("./server.json"));

if(argv.version) {
	console.log(packageJSON.version);
	return;
}

if(argv.help) {
	opt.showHelp();
	return;
}

if (!serverConfig.config.server.logger) {
	console.log('There is no logger declared.  Exiting process.');
	process.exit();
}

// Init logger: Need to move this to external place where is can be injected with 
// alpha, beta, and prod settings
global.logger = mixdown.Logger.create(serverConfig.config.server.logger);

serverConfig.on('error', function(err) {
	console.info(err);
})

serverConfig.init();

(function() {
	// start server.  Sets up server, port, and starts the app.
	var server = new mixdown.Server(serverConfig);

	server.start(function(err) {
		if (err) {
			logger.critical("Could not start server.  Stopping process.", err);
			process.exit();
		}
		else {
			var hmap = [];
			_.each(serverConfig.apps, function(app) { 
				hmap.push({ 
					hostmap: app.config.hostmap,
					id: app.config.id
				});
			});
			logger.info("Server started successfully on port " + serverConfig.server.port + ". " + util.inspect(hmap) );
		}
	});
})();


