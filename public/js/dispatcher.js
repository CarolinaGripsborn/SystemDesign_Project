/*jslint es5:true, indent: 2 */
/*global Vue, io */
/* exported vm */
'use strict';
var socket = io();

var vm = new Vue({
    el: '#drivers',
    data: {
        orders: {},
        drivers: {},
        routes: {},
        customerMarkers: {},
        driverMarkers: {},
        baseMarker: null
    },

    created: function () {
        socket.on('initialize', function (data) {
            this.orders = data.orders;
            this.drivers = data.drivers;
            this.routes = data.routes;
            // add marker for home base in the map
            this.baseMarker = L.marker(data.base, {icon: this.baseIcon}).addTo(this.map);
            this.baseMarker.bindPopup("This is the dispatch and routing center");
            // add markers in the map for all orders
            for (var route in data.routes) {
                this.customerMarkers[route] = this.putCustomerMarkers(data.routes[route]);
            }
            // add driver markers in the map for all drivers
            for (var driverId in data.drivers) {
                this.driverMarkers[driverId] = this.putDriverMarker(data.drivers[driverId]);
            }
        }.bind(this));

        socket.on('driverAdded', function (driver) {
            this.$set(this.drivers, driver.driverId, driver);
            this.driverMarkers[driver.driverId] = this.putDriverMarker(driver);
        }.bind(this));
        socket.on('driverUpdated', function (driver) {
            this.drivers[driver.driverId] = driver;
        }.bind(this));
        socket.on('driverMoved', function (driver) {
            this.drivers[driver.driverId].latLong = driver.latLong;
            this.driverMarkers[driver.driverId].setLatLng(driver.latLong);
        }.bind(this));
        socket.on('driverQuit', function (driverId) {
            Vue.delete(this.drivers, driverId);
            this.map.removeLayer(this.driverMarkers[driverId]);
            Vue.delete(this.driverMarkers, driverId);
        }.bind(this));

        socket.on('orderPlaced', function (order) {
            this.$set(this.orders, order.orderId, order);
            this.customerMarkers[order.orderId] = this.putCustomerMarkers(order);
        }.bind(this));
        socket.on('driverAssigned', function (order) {
            this.$set(this.orders, order.orderId, order);
        }.bind(this));
        socket.on('orderPickedUp', function (order) {
            this.$set(this.orders, order.orderId, order);
        }.bind(this));
        socket.on('orderDroppedOff', function (orderId) {
            Vue.delete(this.orders, orderId);
            this.map.removeLayer(this.customerMarkers[orderId].from);
            this.map.removeLayer(this.customerMarkers[orderId].dest);
            this.map.removeLayer(this.customerMarkers[orderId].line);
            Vue.delete(this.customerMarkers, orderId);
        }.bind(this));

        // These icons are not reactive
        this.driverIcon = L.icon({
            iconUrl: "img/driver.png",
            iconSize: [36,20],
            iconAnchor: [18,22],
            popupAnchor: [0,-20]
        });

        this.fromIcon = L.icon({
            iconUrl: "img/box.png",
            iconSize: [42,30],
            iconAnchor: [21,34]
        });

        this.baseIcon = L.icon({
            iconUrl: "img/base.png",
            iconSize: [40,40],
            iconAnchor: [20,20]
        });

    },
    mounted: function () {
        // set up the map
        this.map = L.map('my-map').setView([59.8415,17.648], 13);

        // create the tile layer with correct attribution
        var osmUrl='http://{s}.tile.osm.org/{z}/{x}/{y}.png';
        var osmAttrib='Map data © <a href="http://openstreetmap.org">OpenStreetMap</a> contributors';
        L.tileLayer(osmUrl, {
            attribution: osmAttrib,
            maxZoom: 18
        }).addTo(this.map);
    },
    methods: {
        createPopup: function (orderId, items) {
            var popup = document.createElement('div');
            popup.appendChild(document.createTextNode('Order ' + orderId));
            var list = document.createElement('ul');
            list.classList.add('popup-list');
            for (var i in items) {
                var listItem = document.createElement('li');
                var listItemText = document.createTextNode(i + ": " + items[i]);
                listItem.appendChild(listItemText);
                list.appendChild(listItem);
            }
            popup.appendChild(list);
            return popup;
        },
        getPolylinePoint: function(order) {
            if (order.expressOrAlreadyProcessed) {
                return [order.fromLatLong, order.destLatLong];
            } else {
                return [order.fromLatLong, this.baseMarker.getLatLng(), order.destLatLong];
            }
        },
        putDriverMarker: function (driver) {
            var marker = L.marker(driver.latLong, {icon: this.driverIcon}).addTo(this.map);
            marker.bindPopup("Driver " + driver.driverId);
            marker.driverId = driver.driverId;
            return marker;
        },
        putCustomerMarkers: function (route) {
            let len = route.orders.length;

            for (let i = 1; i < len; i++) {
                let start = this.orders[route.orders[i-1]];
                let end = this.orders[route.orders[i]];
                L.polyline([start.fromLatLong, end.fromLatLong]).addTo(this.map);
            }

            // Put in the first line from driver
            let first = this.orders[route.orders[0]];
            let driver = this.drivers[route.driver];

            L.polyline([driver.latLong, first.fromLatLong]).addTo(this.map);

            //Put in the last line to base
            let last = this.orders[route.orders[route.orders.length - 1]];

            L.polyline([last.fromLatLong, this.baseMarker.getLatLng()]).addTo(this.map);

            /*var fromMarker = L.marker(order.fromLatLong, {icon: this.fromIcon}).addTo(this.map);
            fromMarker.bindPopup(this.createPopup(order.orderId, order.orderDetails));
            fromMarker.orderId = order.orderId;
            var destMarker = L.marker(order.destLatLong).addTo(this.map);
            destMarker.bindPopup(this.createPopup(order.orderId, order.orderDetails));
            destMarker.orderId = order.orderId;
            var connectMarkers = L.polyline(this.getPolylinePoints(order), {color: 'blue'}).addTo(this.map);
            return {from: fromMarker, dest: destMarker, line: connectMarkers};*/
        },
        assignDriver: function (order) {
            socket.emit("driverAssigned", order);
        }
    }
});

$('.nav-side .fab').on('click', function(e) {
    e.preventDefault();
    $(this).parent().toggleClass('nav-open');
});