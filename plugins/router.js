var Router = require('pipeline-router');

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

	    router.on('error', function(err) {
	    	app.plugins.error.fail(err, res);
	    });
	    
	    router.get('/geoip/:ip', function(req, res) {
	    	app.plugins.geoip.lookup(req.params.ip, function(err, data) {
	    		app.plugins.json(data, res, null, req);
	    	});
	    });

	    router.get('/geoip', function(req, res) {
	    	var loc = app.plugins.geoip.parse(req);

	    	app.plugins.geoip.lookup(loc.ip, function(err, data) {
	    		if (loc.debug) {
	    			data.debug = loc;
	    		}
	    		app.plugins.json(data, res, null, req);
	    	});
	    });

	    return router;
	};


};

module.exports = GeoIpRouter;