mixdown-geolocation
===================

Geolocation server / service for looking up user locations.

Install
=======

What you will need to get started

Maxmind GeoIP API for C/C++ - http://www.maxmind.com/app/c

__MacOS Homebrew Install__

$ brew install geoip

__CentOS Install__

```
yum install libpcap libpcap-devel gdbm gdbm-devel
yum install libevent libevent-devel
wget http://geolite.maxmind.com/download/geoip/api/c/GeoIP-1.4.8.tar.gz
tar -zxvf GeoIP-1.4.8.tar.gz
cd GeoIP-1.4.8
./configure
make
make install

```


License
=======

__Update the configuration to use your license__

config lives in either /usr/local/etc/GeoIP.conf or /usr/local/Cellar/geoip/1.4.8/etc/GeoIP.conf depending on install.

```
/usr/local/Cellar/geoip/1.4.8/etc/GeoIP.conf
UserId ####
LicenseKey YOULICENSEKEY
ProductIds 133
Run the following to pull the latest db from maxmind
```

__Update maxmind ip database__

```
~$ /usr/local/bin/geoipupdate
/usr/local/Cellar/geoip/1.4.8/share/GeoIP/GeoIPCity.dat can't be opened, proceeding to download database
Updating /usr/local/Cellar/geoip/1.4.8/share/GeoIP/GeoIPCity.dat
Updated database
```

How to set it up on your own server
===================================

Clone the repo, update your server.json.  Start the server.

```
git clone git://github.com/vast-eng/mixdown-geolocation.git
npm install
npm dedupe
vim server.json
node server

```

If the geoip plugin fails to link to the GeoIP.##.so files in CentOS (after build from source), then do this:

```
export LD_LIBRARY_PATH=/usr/local/lib/
```

NOTE: vast-maxmind will fail on npm install if you do not have maxmind 1.4.8 installed.

