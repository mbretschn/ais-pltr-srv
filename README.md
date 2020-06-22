# AIS PLTR SRV

AIS PLTR SRV ist a REST/Websocket Backend used by the AIS-PLTR Chartplotter front end.

Visit https://blog.3epnm.de/ for more Details and https://ais.3epnm.de/ for a demo

## About
AIS-PLTR is intended to be the simplest possible AIS chart plotter where ship positions can be displayed. This project covers the backend for AIS-PLTR.

### Provide AIS Data with Rest and via Web Socket
For the AIS PLTR to be functional, a backend service is needed. AIS PLTR SRV is a simple backend for this purpose. The requirements are not particularly high. The only available resources are endpoints for reading shipdata and positions from the database as well as a web socket for streaming updates at runtime.

### Installation
The installation is done by clone the project repository and installing the dependencies.
```
git clone https://github.com/3epnm/ais-pltr
cd ais-pltr
npm install
```
Before the project can be started, the configuration must first be adjusted.

### Configuration
The configuration is done with [node-config-ts](https://www.npmjs.com/package/node-config-ts). A simple but effective configuration manager for typescript based projects. The easiest way to adapt the configuration is to adapt the file default.json from the config directory. In practice, it has proven useful to use a new configuration file depending on the NODE_ENV variable. How this works is explained in the documentation of node-config-ts. Refer to the npm page [node-config-ts](https://www.npmjs.com/package/node-config-ts) to learn all its features.

The configuration file has the following content, which is explained below.
```javascript
{
    "database": {
        "url": "mongodb://127.0.0.1:27017",
        "options": {
            "useNewUrlParser": true,
            "useUnifiedTopology": true
        },
        "dbName": ""
    },
    "http": {
        "port": 4000
    },
    "logger": {
        "level": "warn",
        "filter": 0,
        "filename": ""
    },
    "ssh": {
        "enabled": true,
        "forward": "61126:127.0.0.1:61126",
        "host": "***"
    }
}
```
##### Database section
The configuration of the database is as follows:

|Parameter|Description|
|--|--|
|url|The connection url to the MongoDB instance.|
|options<br><br>|Options to setup the Database Connection.<br>All options of the [native MongoDB Driver](https://mongodb.github.io/node-mongodb-native/3.5/api/) are possible.|
|dbName|The name of the database where to store report data.|

##### Http section
The only configuration which can be done is setting the port number on which the server is started.

|Parameter|Description|
|--|--|
|port|The port number on which the server is listen for requests.|

##### Logger section
Logging is done with winston universal logging library.

|Parameter|Description|
|--|--|
|level<br><br>|The logging levels are named after npm logging levels and allows<br>to configure how verbose the messages are written to a logfile or to stdout.|
|filter<br><br><br>|The filter is a MMSI Number - an identifier every AIS Report has<br>and which is unique to the vessel.<br>Used to log the processing of Reports for a specific vessel.|
|filename<br><br>|The filename where the log file is written to.<br>If empty, the messages are written to stdout.|

The logger uses the winston-daily-rotate-file to archive log files if used in a debug level for a longer period of time. In addition, the logger can also be controlled via the NODE_ENV environment variable. If set to "debug", the log messages also written to stdout, regardless of whether the filename parameter is set or not.

##### SSH section
The following configuration enables an SSH tunnel to be created if required, which is started as a child process.

|Parameter|Description|
|--|--|
|enabled|Whether the function is used or not|
|forward|Which port from the source is forwarded to a port at the destination|
|host|The host of the source|

#### Start the Service
Once the configuration is done, the service can be started with `npm start`

#### REST Endpoints
The REST services serve as a proxy to MongoDB. MongoDB offers an easy way to create queries with a JSON object. This fact makes it possible to develop a REST service that essentially works like a query on a MongoDB collection. Datetime parameters can be written as a ISO date string and are automatically transformed to JavaScript Date Objects for a valid request. Another parameter is limit in order to limit the result set according to the number of objects returned.

#### Ships Endpoint
The `/api/ships` endpoint accepts requests against the ship data collection. Queries are defined using the cgi query parameter.
An additional limit parameter allows the number of documents to be limited.

|Parameter|Description|
|--|--|
|filter<br><br>|A MongoDB Collection Filter, ISO date strings are automatically transformed to JavaScript Date Objects|
|limit<br><br>|The number of documents to be loaded from the collection, if no filter is defined, the limit defaults to 500|

All parameters are optional and the resulting collection is automatically sorted by ship name.

##### Example
`HTTP GET /api/ships?filter={"MMSI":211207080}`

```javascript
[
  {
    "_id": "5ee0cf84532a3962b0f8c94a",
    "AIS": 5,
    "Channel": "A",
    "MMSI": 211207080,
    "TimeStamp": "2020-06-18T17:05:47.158+02:00",
    "Data": {
      "AISversion": 0,
      "PositionType": 0,
      "IMOnumber": 0,
      "CallSign": "DD4794",
      "Name": "ABY/LOU",
      "ShipType": 70,
      "DimA": 75,
      "DimB": 10,
      "DimC": 7,
      "DimD": 3,
      "Draught": 2.8,
      "ETA": "2021-01-21T11:00:00+00:00",
      "Destination": "DEHAM00700CITYX06230"
    },
    "CreatedAt": "2020-06-10T12:18:12.870Z",
    "CreatedBy": "hub-3262",
    "UpdatedAt": "2020-06-10T12:18:12.870Z",
    "UpdatedBy": "hub-3262",
    "Sender": [
      {
        "Name": "hub-3262",
        "TimeStamp": "2020-06-10T12:18:12.870Z"
      }
    ],
    "RAW": [
      "!AIVDM,2,1,6,A,539gmv800000@;O3C80iDEA@F0@DE8p0000000150@A33t0Ht3R0C@UD,0*3C",
      "!AIVDM,2,2,6,A,Qh0000000000000,2*1B"
    ]
  }
]
```

#### Position Endpoints
The `/api/positions` endpoint accepts requests against the positions collection.

|Parameter|Description|
|--|--|
|filter<br><br>|A MongoDB Collection Filter, ISO date strings are automatically transformed to JavaScript Date Objects|
|limit<br><br>|The number of documents to be loaded from the collection, if no filter is defined, the limit defaults to 500|
|options|This parameter accepts a serialized JSON Object.|

The only option awailable is `{ "unique": true }`. If this option is set, the positions are unique by the vessels MMSI. All parameters are optional and the resulting collection is automatically sorted ascending by ais-timestamp.

The `/api/position` endpoint is similar like the /api/positions endpoint. The difference is that only a single and most recent position within the result set is returned.

|Parameter|Description|
|--|--|
|filter<br><br>|A MongoDB Collection Filter, ISO date strings are automatically transformed to JavaScript Date Objects|

##### Example
`HTTP GET /api/position?filter={"MMSI":211207080}`

```javascript
{
  "_id": "5eeb8881d0977465a5453770",
  "AIS": 1,
  "Channel": "B",
  "MMSI": 211207080,
  "TimeStamp": "2020-06-18T17:30:10.000+02:00",
  "Location": {
    "type": "Point",
    "coordinates": [
      9.98226,
      53.48301
    ]
  },
  "Data": {
    "Longitude": 9.98226,
    "Latitude": 53.48301,
    "ROT": -128,
    "SOG": 0.1,
    "COG": 238.2,
    "TrueHeading": 511,
    "NavigationStatus": 0,
    "PositionAccuracy": 1,
    "TimeStampStatus": 10
  },
  "CreatedAt": "2020-06-18T15:30:42.297Z",
  "CreatedBy": "rpi-2673",
  "UpdatedAt": "2020-06-18T15:31:09.000Z",
  "UpdatedBy": "hub-3262",
  "Sender": [
    {
      "Name": "rpi-2673",
      "TimeStamp": "2020-06-18T15:30:42.297Z"
    },
    {
      "Name": "hub-2847",
      "TimeStamp": "2020-06-18T15:30:49.925Z"
    },
    {
      "Name": "hub-3262",
      "TimeStamp": "2020-06-18T15:31:09.000Z"
    }
  ],
  "RAW": [
    "!AIVDM,1,1,,B,139K3b0P01PedOJNVVk9CgvDR@5S,0*4F"
  ]
}
```

#### Websocket
AIS PLTR SRV offers a websocket connection, where ship and position updates are broadcast to the clients. The websocket service is implemented with [socket.io](https://socket.io/).

The server can be controlled with messages. As soon as a connection is established, `subscribe` and `unsubscribe` can be used to inform the service that the client is ready to receive data or that the connection is to be interrupted. Messages are sent to the server using the socket instance method `emit`. If the subscription is successful, the server sends new ship data and positions, which results in a corresponding event.

|Commands|Description|
|--|--|
|subscribe|Informs the server to start sending data.|
|unsubscribe|Informs the server to stop sending data.|

A JSON object with a uuid is used by the server to identify the recipient. See the examples below.

|Events|Description|
|--|--|
|positions|Newly received position data report.|
|ships|Newly received static and voyage data report.|

##### Example
The following example illustrates how this service can be utilized.

```javascript
    const socket = io()

    socket.on('positions', (data: INmeaShipdata) => { 'shipdata object' })
    socket.on('ships', (data: INmeaShipdata) => { 'shipdata object' })

    socket.emit('subscribe', { "uuid": "<<some uuid>>" })
    ...
    socket.emit('unsubscribe', { "uuid": "<<some uuid>>" })
```

### Proxy for Front- and Backend with Nginx
To bring the front end AIS PLTR and the backend AIS PLTR SRV together, it is good practice to use a proxy server, eg. NGINX, to combine multiple services and static data on a single host. A possible NGINX documentation is as follows.

Behind the `/osm` route a redirection to openstreetmap is executed. Returned map tiles are cached to improve the performance and reduce the load to openstreetmap. Behind the `/api` and `/socket.io` route a redirection ais-pltr-srv. From root, the dist folder of the ais-pltr front end is served.

```
http {
    ...
    proxy_cache_path /usr/local/data/nginx
        levels=1:2
        keys_zone=openstreetmap-backend-cache:8m
        max_size=500000m
        inactive=1000d;

    proxy_temp_path /usr/local/data/nginx/tmp;

    map $http_upgrade $connection_upgrade {
        default upgrade;
        '' close;
    }

    upstream openstreetmap_backend {
        server a.tile.openstreetmap.org;
        server b.tile.openstreetmap.org;
        server c.tile.openstreetmap.org;
    }

    upstream ais-pltr-srv {
        server 0.0.0.0:4000;
    }

    server {
        listen 0.0.0.0:80;

        location /osm {
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X_FORWARDED_PROTO http;
            proxy_set_header Host $http_host;
            proxy_cache openstreetmap-backend-cache;
            proxy_cache_valid 200 302 365d;
            proxy_cache_valid 404 1m;
            proxy_redirect off;
            if (!-f $request_filename) {
                rewrite ^/osm(/.*)$ $1 break;
                proxy_pass http://openstreetmap_backend;
                break;
            }
        }

        location /api {
            proxy_pass http://ais-pltr-srv;
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection $connection_upgrade;
            proxy_set_header Host $host;
        }

        location /socket.io {
            proxy_pass http://ais-pltr-srv;
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection $connection_upgrade;
            proxy_set_header Host $host;
        }

        location / {
            index index.html;
            alias /var/www/ais-plrt/dist/;
        }
    }
}
```
