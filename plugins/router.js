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

	    router.timeout = 3000;
	    
	    
	    router.get('/geoip/:ip', function(req, res) {
	    	app.plugins.geoip.lookup(req.params.ip, function(err, data) {
	    		app.plugins.json(data, res);
	    	});
	    });

	    router.get('/geoip', function(req, res) {
	    	var ip = app.plugins.geoip.parse(req);

	    	app.plugins.geoip.lookup(ip, function(err, data) {
	    		app.plugins.json(data, res);
	    	});
	    });

	    return router;
	};


};

module.exports = GeoIpRouter;