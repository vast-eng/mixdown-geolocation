var _ = require('lodash'),
	broadway = require('broadway'),
	app = new broadway.App(),
	GeoIP = require('../index').GeoIP,
	tap = require('tap'),
	test = tap.test;

// homebrew location
app.use(new GeoIP(), { db: '/usr/local/Cellar/geoip/1.4.8/share/GeoIP/GeoIPCity.dat' });

var ops = [
	{"ip":"8.8.8.8","ipnum":134744072,"country":"US","state":"CA","city":"Mountain View","zip":"94043","latitude":37.4192008972168,"longitude":-122.05740356445312,"areacode":650}, 
	{"ip":"208.67.222.222","ipnum":3494108894,"country":"US","state":"CA","city":"San Francisco","zip":"94107","latitude":37.76969909667969,"longitude":-122.39330291748047,"areacode":415}, 
	{"ip":"12.249.215.38","ipnum":217700134,"country":"US","state":"TX","city":"Austin","zip":"N/A","latitude":30.267200469970703,"longitude":-97.74310302734375,"areacode":512}
];

_.each(ops, function(op) {

	test("Lookup" + op.ip, function(t) {

		app.geoip.lookup(op.ip, function(err, data) {
			t.notOk(err, 'Should not be an error');
			t.deepEqual(data, op, "Output should match")
			t.end();
		});
	});

});






