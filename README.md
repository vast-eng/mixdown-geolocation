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

$ sudo yum install GeoIP-devel.x86_64


License
=======

__Update the configuration to use the vast license which lives in /usr/local/etc/GeoIP.conf__

```
/usr/local/etc/GeoIP.conf
UserId ####
LicenseKey YOULICENSEKEY
ProductIds 133
Run the following to pull the latest db from maxmind
```

__Update maxmind ip database__

```
~$ /usr/local/bin/geoipupdate
/usr/local/share/GeoIP/GeoIPCity.dat can't be opened, proceeding to download database
Updating /usr/local/share/GeoIP/GeoIPCity.dat
Updated database
```
