var VastMaxmind = require('vast-maxmind').VastMaxmind,
    cradle = require('cradle'),// CouchDB Library is needed to generate some stats around GeoLocation lookups
    async = require('async');// async was added just for the async.waterfall, if we choose to use callbacks only for the same thing - it can be removed

var GeoIP = function() {};

GeoIP.prototype.attach = function(options) {
    var vmmDefaultDataFile = options.db || '/usr/local/share/GeoIP/GeoIPCity.dat';
    var vmm = new VastMaxmind(vmmDefaultDataFile);

    // instantiate CouchDB client if enabled in config:
    var couchDB = null;
    if (options.couchDBCradle.enabled) {
        couchDB = new(cradle.Connection)(options.host, options.port, options.extraConf).database(options.dbName);

        // check if DB exists, if not - assume as if there is no couchDB enabled in config:
        couchDB.exists(function (err, exists) {
            if (err || !exists) {
                couchDB = null;
            }
        });
    }


    if (options.additional_dbs && options.additional_dbs.length) {
        logger.info('Taking additional MaxMind databases into account:', options.additional_dbs);

        // force it to be array since now we have additional lookup attempts against other
        // .dat (MaxMind DB) files:
        vmm = [vmm];

        // try to instatiate additional lookup dbs:
        var i;

        for (i=0; i < options.additional_dbs.length; i++) {
            try {
                var current_vmm = new VastMaxmind(options.additional_dbs[i]);
                if (current_vmm) {
                    vmm.push(current_vmm);
                    logger.info('Successfully added ' + options.additional_dbs[i] + ' to the list of additional Geo Lookup attempts.');
                }
                else {
                    logger.error('Couldn\'t create VastMaxmind object from the given db file:', options.additional_dbs[i]);

                    // force removal of options.additional_dbs[i] since it doesn't define proper data file:
                    options.additional_dbs.splice(i, 1);
                }
            }
            catch(e) {
                logger.error('While \'new VastMaxmind("' + options.additional_dbs[i] + '")\' was tried to be executed - the following exception was raised (probably due to missing data file):', e.message);

                // force removal of options.additional_dbs[i] since it doesn't define proper data file:
                options.additional_dbs.splice(i, 1);
            }
        }
    }

    var showDebug = options.debug === true || options.debug === 'true' ? true : false;

    this.geoip = {

        // Looks up an IP address.
        lookup: function(ip, callback) {
            var app = options.app;
            var dtStart = (new Date()).valueOf();
            var additionalLookups = false;

            // prepare geo Location Lookup request closure (for multiple requests):
            var geoLocLookup = function(current_vmm) {
                return function(callback) {
                    vmm[current_vmm].location(ip, function(data) {
                        var currentMaxMindDBFile = current_vmm ? options.additional_dbs[current_vmm - 1] : vmmDefaultDataFile;
                        logger.info('Trying to fetch geo location data from the following MaxMind db:', currentMaxMindDBFile);

                        // increase graphite count for lookups_older_dbs_count if metrics enabled.
                        if (current_vmm === 1 && options.logToGraphite && app.plugins.metrics) {
                            app.plugins.metrics.increment('geolocation-lookups_older_dbs_count');
                            additionalLookups = true;
                        }

                        // if this is tha last attempt to get Geo Location - return what we have regardless of whether there's
                        // zip code retrieved:
                        var lastAttempt = vmm[current_vmm] === vmm[vmm.length - 1];
                        var zipCodeDefined = data.zip && data.zip.match(/\d{5}/);

                        // increase graphite count for lookups_failed_count if metrics enabled.
                        if (lastAttempt && !zipCodeDefined && options.logToGraphite && app.plugins.metrics) {
                            app.plugins.metrics.increment('geolocation-lookups_failed_count');
                        }

                        if (lastAttempt || zipCodeDefined) {
                            callback('done', data);
                        }
                        else {
                            callback(null);
                        }
                    });
                };
            };

            // increase graphite count for lookups_total_count if metrics enabled.
            if (options.logToGraphite && app.plugins.metrics) {
                app.plugins.metrics.increment('geolocation-lookups_total_count');
            }

            // generate array of Lookup functions and populate it:
            var geoLocLookupFns = [];
            var i;

            for (i=0; i < vmm.length; i++) {
                geoLocLookupFns.push(geoLocLookup(i));
            }

            // use waterfall to iterate over Lookup functions, stop (by mimic an error) when current lookup
            // returns zip:
            async.waterfall(geoLocLookupFns, function (err, data) {
                if (err === 'done') {
                    // this is actually success, we've (mis)used error object to indicate successfull geo location lookup
                    // before the other MaxMind DBs were contacted (cause err object would stop waterfall)
                    // ... remains here as code comment in case there is a need to log this particular case...
                }

                var lookupTiming = new Date().valueOf() - dtStart;

                // log time to graphite if metrics enabled.
                if (options.logToGraphite && app.plugins.metrics) {
                    app.plugins.metrics.timing('geolocation-lookup-timings-miliseconds', lookupTiming);
                }

                logger.info('Geo Location finished with' + (err === 'done' ? '' : ' all') + ' lookups in a ' + lookupTiming + ' miliseconds with the following result:', data);



                // store lookup results to permanent storage (first prepare arguments for update handler call):
                var updateHandlerParameters = {};
                var zipCodeDefined = data.zip && data.zip.match(/\d{5}/);

                if (zipCodeDefined) {
                    updateHandlerParameters.zip = zipCodeDefined;
                }
                else {
                    updateHandlerParameters.ip = ip;
                }

                if (additionalLookups) {
                    updateHandlerParameters['additional_lookups'] = 'true';
                }

                db.update('_design/update/_update/count/', options.docName, updateHandlerParameters, function(err, doc){
                    if (err) {
                        logger.error('Failed to update lookup counts due to following error:', err);
                    }
                    else {
                        logger.info('CouchDB response for GeoLocation updated lookups count:', doc);
                    }
                });


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