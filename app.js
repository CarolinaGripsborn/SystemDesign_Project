/*jslint node: true */
/* eslint-env node */
'use strict';

// Require express, socket.io, and vue
var express = require('express');
var app = express();
var http = require('http').Server(app);
var https = require('https');
var io = require('socket.io')(http);
var path = require('path');

// Pick arbitrary port for server
var port = 3000;
app.set('port', (process.env.PORT || port));

// Serve static assets from public/
app.use(express.static(path.join(__dirname, 'public/')));
// Serve vue from node_modules as vue/
app.use('/vue', express.static(path.join(__dirname, '/node_modules/vue/dist/')));
// Serve leaflet from node_modules as leaflet/
app.use('/leaflet', express.static(path.join(__dirname, '/node_modules/leaflet/dist/')));
// Serve esri leaflet geocoder from node_modules as esri-leaflet/
app.use('/esri-leaflet', express.static(path.join(__dirname, '/node_modules/esri-leaflet/dist/')));
// Serve esri leaflet geocoder from node_modules as esri-leaflet-geocoder/
app.use('/esri-leaflet-geocoder', express.static(path.join(__dirname, '/node_modules/esri-leaflet-geocoder/dist/')));
// Serve driver_view.html as /driverView
app.get('/driver_view', function (req, res) {
	res.sendFile(path.join(__dirname, 'views/driver_view.html'));
});
// Serve index.html directly as root page
app.get('/', function (req, res) {
	res.sendFile(path.join(__dirname, 'views/customer.html'));
});
// Serve driver.html as /driver
app.get('/driver', function (req, res) {
	res.sendFile(path.join(__dirname, 'views/driver.html'));
});
// Serve dispatcher.html as /dispatcher
app.get('/dispatcher', function (req, res) {
	res.sendFile(path.join(__dirname, 'views/dispatcher.html'));
});
// Serve customer_order.html as /order
app.get('/order', function (req, res) {
	res.sendFile(path.join(__dirname, 'views/customer_order.html'));
});
// Serve customer_checkout.html as /checkout
app.get('/checkout', function (req, res) {
	res.sendFile(path.join(__dirname, 'views/customer_checkout.html'));
});

// Store data in an object to keep the global namespace clean and
// prepare for multiple instances of data if necessary
function Data() {
	this.orders = {};
	this.routes = {};
	this.drivers = {};
	this.baseLatLong = { "lat": 59.84091407485801, "lng": 17.64924108548685 };
	this.currentOrderNumber = 1000;
}


Data.prototype.fetchJson = (address) => {
	const options = {
		hostname: "nominatim.openstreetmap.org",
		path: encodeURI("/search?format=json&q=" + address),
		headers: { "User-Agent" : "Handy Penguin"},
		method: "GET",
	};

	return new Promise((resolve, reject) => {
		https.get(options, (resp) => {
			let data = '';

			// A chunk of data has been recieved.
			resp.on('data', (chunk) => {
				data += chunk;
			});

			// The whole response has been received. Print out the result.
			resp.on('end', () => {
				resolve(data);
			});
		}).on("error", (err) => {
			console.log("ERROR: " + err);
			reject(err);
		});
	});
};


Data.prototype.getOrderNumber = function () {
	this.currentOrderNumber += 1;
	return this.currentOrderNumber;
};

/*
	Adds missing data to an order
*/
Data.prototype.processOrder = async function (order) {
	const fromPromise = data.fetchJson(order.fromText);
	const destPromise = data.fetchJson(order.destText);

	const fromResponse = JSON.parse( await fromPromise );
	const destResponse = JSON.parse( await destPromise );

	order.destLatLong = [destResponse[0]["lat"], destResponse[0]["lon"]];
	order.fromLatLong = [fromResponse[0]["lat"], fromResponse[0]["lon"]];

	console.log("DEST LAT LONG" + order.destLatLong);
	console.log("FROM LAT LONG" + order.fromLatLong);
};

/*
	Adds an order to the queue
*/
Data.prototype.addOrder = function (order) {
	var orderId = this.getOrderNumber();
	//Store the order in an "associative array" with orderId as key
	this.orders[orderId] = order;
	return orderId;
};

/*
	Delete the order when it's considered finished
*/
Data.prototype.orderDropOff = function (orderId) {
	delete this.orders[orderId];
};

/*
	Only needs to know orderId. The rest is up to the client to decide
*/
Data.prototype.updateOrderDetails = function (order) {
	for (var key in order) {
		this.orders[order.orderId][key] = order[key];
	}
};

Data.prototype.getAllOrders = function () {
	return this.orders;
};

Data.prototype.addDriver = function (driver) {
	//Store info about the drivers in an "associative array" with driverId as key
	this.drivers[driver.driverId] = driver;
};

Data.prototype.updateDriverDetails = function (driver) {
	for (var key in driver) {
		this.drivers[driver.driverId][key] = driver[key];
	}
};

Data.prototype.removeDriver = function (driverId) {
	delete this.drivers[driverId];
};

Data.prototype.getAllDrivers = function () {
	return this.drivers;
};

Data.prototype.createRoute = function (route) {
	this.routes[route.id] = route;
}

Data.prototype.getAllRoutes = function() {
	return this.routes;
}

var data = new Data();

/* Temporary test setup */
data.drivers["Stefan"] = {
	"driverId": "Stefan",
	"latLong": {
		"lat": 59.947, "lng": 17.8145
	}
};

data.drivers["Zarah"] = {
	"driverId": "Zarah",
	"latLong": {
		"lat": 59.742, "lng": 17.45
	}
};

data.drivers["Mikael"] = {
	"driverId": "Mikael",
	"latLong": {
		"lat": 59.641, "lng":17.53
	}
};

data.orders[993] = {
	"destText": "Bananhuset",
	"fromText": "Gangstavägen 30",
	"fromLatLong": [59.832, 17.42],
	"destLatLong": [59.594, 17.562],
	"express": true,
	"pickedUp": false,
	"orderDetails": { "pieces": 1, "spaceRequired": 3, "totalGrams": 5600, "driverInstructions": "Beware of the dog"}
};

data.orders[994] = {
	"destText": "Vänstersvängen",
	"fromText": "Högertrafiken 20",
	"fromLatLong": [59.840, 17.64],
	"destLatLong": [59.640, 17.54],
	"express": false,
	"pickedUp": false,
	"delivered": false,
	"orderDetails": { "pieces": 1, "spaceRequired": 3, "totalGrams": 5600, "driverInstructions": "Beware of the dog"}
};

data.orders[995] = {
	"destText": "Ostgränden 14b",
	"fromText": "Briegatan 20",
	"fromLatLong": [59.845, 17.546],
	"destLatLong": [54.842, 17.643],
	"express": false,
	"pickedUp": false,
	"delivered": false,
	"orderDetails": { "pieces": 1, "spaceRequired": 3, "totalGrams": 5600, "driverInstructions": "Beware of the dog"}
};

data.orders[996] = {
	"destText": "Sickagatan 5",
	"fromText": "Polkavägen 6",
	"fromLatLong": [59.746, 17.647],
	"destLatLong": [59.249, 17.345],
	"express": false,
	"pickedUp": false,
	"delivered": false,
	"orderDetails": { "pieces": 1, "spaceRequired": 3, "totalGrams": 5600, "driverInstructions": "Beware of the dog"}
};

data.orders[997] = {
	"destText": "Sickagatan 5",
	"fromText": "Polkavägen 6",
	"fromLatLong": [59.849, 17.65],
	"destLatLong": [59.545, 17.42],
	"express": false,
	"pickedUp": false,
	"delivered": false,
	"orderDetails": { "pieces": 1, "spaceRequired": 3, "totalGrams": 5600, "driverInstructions": "Beware of the dog"}
};

data.orders[998] = {
	"destText": "Sickagatan 5",
	"fromText": "Polkavägen 6",
	"fromLatLong": [59.942, 17.847],
	"destLatLong": [59.645, 17.645],
	"express": false,
	"pickedUp": false,
	"delivered": false,
	"orderDetails": { "pieces": 1, "spaceRequired": 3, "totalGrams": 5600, "driverInstructions": "Beware of the dog"}
};

data.orders[999] = {
	"destText": "Sickagatan 5",
	"fromText": "Polkavägen 6",
	"fromLatLong": [59.641, 17.446],
	"destLatLong": [59.840, 17.56],
	"express": false,
	"pickedUp": false,
	"delivered": false,
	"orderDetails": { "pieces": 1, "spaceRequired": 3, "totalGrams": 5600, "driverInstructions": "Beware of the dog"}
};

data.routes[0] = {
	"driver": "Stefan",
	"orders": ["998", "997"]
};

data.routes[1] = {
	"driver": "Zarah",
	"orders": ["999"]
};


io.on('connection', function (socket) {
	// Send the current lists of orders and drivers when a client connects
	socket.emit('initialize', {
		orders: data.getAllOrders(),
		drivers: data.getAllDrivers(),
		routes: data.getAllRoutes(),
		base: data.baseLatLong });
	// Add a listener for when a connected client emits a "placeOrder" message
	socket.on('placeOrder', async function (order) {
		await data.processOrder(order);
		var orderId = data.addOrder(order);
		order.orderId = orderId;
		console.log("An order was placed:",order);
		// send updated info to all connected clients, note the use of "io" instead of "socket"
		io.emit('orderPlaced', order);
		// send the orderId back to the customer who ordered
		console.log(JSON.stringify(order));
		socket.emit('orderId', orderId);
	});

	socket.on('addDriver', function (driver) {
		data.addDriver(driver);
		console.log("Driver",driver,"is on the job");
		// send updated info to all connected clients, note the use of io instead of socket
		io.emit('driverAdded', driver);
	});
	socket.on('updateDriver', function (driver) {
		console.log("Driver", driver.driverId,"was updated");
		data.updateDriverDetails(driver);
		// send updated info to all connected clients, note the use of io instead of socket
		io.emit('driverUpdated', driver);
	});
	socket.on('moveDriver', function (driver) {
		console.log("Driver", driver.driverId,"moved to",driver.latLong);
		data.updateDriverDetails(driver);
		// send updated info to all connected clients, note the use of io instead of socket
		io.emit('driverMoved', driver);
	});
	socket.on('driverQuit', function (driver) {
		data.removeDriver(driver);
		console.log("Driver",driver,"has left the job");
		// send updated info to all connected clients, note the use of io instead of socket
		io.emit('driverQuit', driver);
	});

	socket.on('orderPickedUp', function(order) {
		console.log("Order",order.orderId,"was picked up");
		data.updateOrderDetails(order);
		io.emit('orderPickedUp', order );
	});
	socket.on('driverAssigned', function(order) {
		// Track assigned driver by adding driverId to the order
		console.log("Order",order.orderId,"was assigned to driver",order.driverId);
		data.updateOrderDetails(order);
		io.emit('currentQueue', { orders: data.getAllOrders() });
	});
	socket.on('orderDroppedOff', function (orderId) {
		console.log("Order",orderId,"was dropped off");
		data.orderDropOff(orderId);
		// send updated info to all connected clients, note the use of io instead of socket
		io.emit('orderDroppedOff', orderId);
	});
	socket.on('addRoute', function(route) {
		console.log("Route", route.id,"was created")
		data.createRoute(route);

		io.emit('routeAdded', route.id);
	})
});

var server = http.listen(app.get('port'), function () {
	console.log('Server listening on port ' + app.get('port'));
});
