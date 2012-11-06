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
