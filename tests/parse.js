var _ = require('lodash'),
	broadway = require('broadway'),
	app = new broadway.App(),
	GeoIP = require('../index').GeoIP,
	tap = require('tap'),
	test = tap.test,
	gold = '8.8.8.8',
	toilet = '0.0.0.0';

// homebrew location
app.use(new GeoIP(), { db: '/usr/local/Cellar/geoip/1.4.8/share/GeoIP/GeoIPCity.dat' });

var mocks = [
	{
		testname: "No IP headers",
		req: {
			headers: {},
			client: { 
				remoteAddress: gold 
			}
		}
	},
	{
		testname: "empty X-Forwarded-For", 
		req: {
			headers: {
				"x-forwarded-for": ''
			},
			client: { 
				remoteAddress: gold 
			}
		}
	},
	{
		testname: "single X-Forwarded-For", 
		req: {
			headers: {
				"x-forwarded-for": [gold].join(',')
			},
			client: { 
				remoteAddress: toilet 
			}
		}
	},
	{
		testname: "multiple X-Forwarded-For", 
		req: {
			headers: {
				"x-forwarded-for": [gold, toilet].join(',')
			},
			client: { 
				remoteAddress: toilet 
			}
		}
	},
	{
		testname: "multiple X-Forwarded-For with whitespace", 
		req: {
			headers: {
				"x-forwarded-for": [gold, toilet].join(',  ')
			},
			client: { 
				remoteAddress: toilet 
			}
		}
	}
];

_.each(mocks, function(mock) {

	test("Parse " + mock.testname, function(t) {

		var ip = app.geoip.parse(mock.req);
		t.equal(ip, gold, "IP should match " + gold);
		t.end();

	});

});






