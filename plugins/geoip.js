var VastMaxmind = require('vast-maxmind').VastMaxmind;

var GeoIP = function() {};

GeoIP.prototype.attach = function(options) {
	var vmm = new VastMaxmind(options.db || '/usr/local/share/GeoIP/GeoIPCity.dat');

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
				ip = '127.0.0.1';

			// try X-Forwarded-For first
			if (headers['x-forwarded-for']) {
				var ips = headers['x-forwarded-for'].split(',');
				if (ips.length > 0) {
					ip = ips[0];
				}
			}
			// finally, if there is no proxy then ask the socket.
			else {
				ip = req.client.remoteAddress;
			}

			return ip;			
		}
	};
};

module.exports = GeoIP;