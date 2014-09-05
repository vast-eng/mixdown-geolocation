var Router = require('pipeline-router'),
	cradle = require('cradle');

var GeoIpRouter = function() {};

/**
* Attaches an autos router plugin to an application.
*
**/
GeoIpRouter.prototype.attach = function (options) {
	var app = options.app;

	/**
	* Initializes the routes for this application
	*
	**/
	this.router = function() {
	    var router = new Router();

	    router.param('ip', /\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}/);
	    router.param('variousParams', /(.*)/);

		router.on('error', function(err, results) {
            var res = results[0].res;
            app.plugins.error.fail(err, res);
        });

	    router.get('/geoip/:ip', function(req, res) {
	    	app.plugins.geoip.lookup(req.params.ip, function(err, data) {
	    		app.plugins.json(data, res, null, req);
	    	});
	    });

	    router.get('/geoip?:variousParams', function(req, res) {
		    // instantiate CouchDB client if enabled in config:
		    var couchDB = null;
		    var opts = options.app.config.plugins.geoip.options;

			var showStats = req.urlParsed.query && typeof req.urlParsed.query.showStats !== 'undefined' && req.urlParsed.query.showStats === 'true';

			if (showStats) {
			    if (opts.couchDBCradle.enabled && opts.couchDBCradle.dbName && opts.couchDBCradle.docName) {
			        couchDB = new(cradle.Connection)(opts.couchDBCradle.dbUrl, opts.couchDBCradle.dbPort, opts.couchDBCradle.extraConf).database(opts.couchDBCradle.dbName);

			        // check if DB exists, if not - assume as if there is no couchDB enabled in config:
			        couchDB.exists(function (err, exists) {
			            if (err || !exists) {
			                couchDB = null;
			            }
			        });
			    }
			    else {
			        logger.info('Getting counts from CouchDB have been disabled or missing configuration parameters.');
			    }
			}


			if (showStats && couchDB) {
				// get Stats from CouchDB and display it:
                couchDB.get(opts.couchDBCradle.docName, function (err, doc) {
					var percentageFailedInitially = doc.total_count && doc.older_dbs_lookup_count ? parseInt(doc.older_dbs_lookup_count/doc.total_count*100, 10) : doc.total_count;
					var percentageFailed = doc.total_count && doc.failed_lookups_count ? parseInt(doc.failed_lookups_count/doc.total_count*100, 10) : doc.total_count;

					var message = 'Total lookups: ' + doc.total_count;
					message += '\nFailed lookups: ' + doc.failed_lookups_count;
					message += '\nAdditional lookups (against older DBs): ' + doc.older_dbs_lookup_count;
					message += '\nFailed IPs(:count) from initial GeoLocation lookup only:' + JSON.stringify(doc.failed_ip_numbers_after_initial_call);
					message += '\nFailed IPs(:count) including additional lookups:' + JSON.stringify(doc.failed_ip_numbers);
					message += '\nPercent of failed lookups from initial GeoLocation lookup only: ' + percentageFailedInitially + '%';
					message += '\nPercent of all failed lookups (including additional lookups): ' + percentageFailed + '%';
					message += '\n';

	                res.writeHead(200, { 'Content-Type': 'text/plain' });
					res.end(message);
                });

		    }
		    else {
		    	var loc = app.plugins.geoip.parse(req);

		    	app.plugins.geoip.lookup(loc.ip, function(err, data) {
		    		if (loc.debug) {
		    			data.debug = loc;
		    		}
		    		app.plugins.json(data, res, null, req);
		    	});
		    }
	    });

	    return router;
	};


};

module.exports = GeoIpRouter;