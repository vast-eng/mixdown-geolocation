var VastMaxmind = require('vast-maxmind').VastMaxmind;

var GeoIP = function() {};

GeoIP.prototype.attach = function(options) {
	var vmm = new VastMaxmind(options.db || '/usr/local/share/GeoIP/GeoIPCity.dat'),
		showDebug = options.debug === true || options.debug === 'true' ? true : false;

	this.geoip = {

		// Looks up an IP address.
		lookup: function(ip, callback) {
			vmm.location(ip, function(data) {
				callback(null, data);
			});
		},

		// Parses an IP from a req object
		parse: function(req) {
			var headers = req.headers,
				method = null,
				ip = '127.0.0.1';


			if (headers['x-cluster-client-ip']) {
				ip = headers['x-cluster-client-ip'];
				method = { source: 'header', prop: 'x-cluster-client-ip' };
			}

			// try X-Forwarded-For next
			else if (headers['x-forwarded-for']) {
				var ips = headers['x-forwarded-for'].split(',');

				if (ips.length > 0) {
					ip = ips[0];
				}

				method = { source: 'header', prop: 'x-forwarded-for' };
			}
			// finally, if there is no proxy then ask the socket.
			else {
				ip = req.client.remoteAddress;
				method = { source: 'socket', prop: 'client.remoteAddress' };
			}

			var ret = { ip: ip };

			if (showDebug) {
				ret.debug = {
	    			headers: headers,
	    			remoteAddress: req.client.remoteAddress,
	    			method: method
	    		};
			}

			return ret;
		}
	};
};

module.exports = GeoIP;