/*jslint es5:true, indent: 2 */
/*global Vue, io */
/* exported vm */
'use strict';
var socket = io();

var vm = new Vue({
  el: '#page',
  data: {
    express: null,
    orderId: null,
    map: null,
    fromMarker: null,
    destMarker: null,
    baseMarker: null,
    driverMarkers: {}
  },
  created: function () {
    socket.on('initialize', function (data) {
      // add marker for home base in the map
      this.baseMarker = L.marker(data.base, {icon: this.baseIcon}).addTo(this.map);
      this.baseMarker.bindPopup("This is the dispatch and routing center");
    }.bind(this));
    socket.on('orderId', function (orderId) {
      this.orderId = orderId;
    }.bind(this));

    // These icons are not reactive
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
  }/*,
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
    this.map.on('click', this.handleClick);

    var searchDestControl = L.esri.Geocoding.geosearch({allowMultipleResults: false, zoomToResult: false, placeholder: "Destination"}).addTo(this.map);
    var searchFromControl = L.esri.Geocoding.geosearch({allowMultipleResults: false, zoomToResult: false, placeholder: "From"});
    // listen for the results event and add the result to the map
    searchDestControl.on("results", function(data) {
        this.destMarker = L.marker(data.latlng, {draggable: true}).addTo(this.map);
        this.destMarker.on("drag", this.moveMarker);
        searchFromControl.addTo(this.map);
    }.bind(this));

    // listen for the results event and add the result to the map
    searchFromControl.on("results", function(data) {
        this.fromMarker = L.marker(data.latlng, {icon: this.fromIcon, draggable: true}).addTo(this.map);
        this.fromMarker.on("drag", this.moveMarker);
        this.connectMarkers = L.polyline([this.fromMarker.getLatLng(), this.destMarker.getLatLng()], {color: 'blue'}).addTo(this.map);
    }.bind(this));
  },
  methods: {
    placeOrder: function() {
      socket.emit("placeOrder", { fromLatLong: [this.fromMarker.getLatLng().lat, this.fromMarker.getLatLng().lng],
        destLatLong: [this.destMarker.getLatLng().lat, this.destMarker.getLatLng().lng],
        expressOrAlreadyProcessed: this.express ? true : false,
        orderDetails: { pieces: 1, spaceRequired: 3, totalGrams: 5600,  driverInstructions: "Beware of the dog" }
      });
    },
    getPolylinePoints: function() {
      if (this.express) {
        return [this.fromMarker.getLatLng(), this.destMarker.getLatLng()];
      } else {
        return [this.fromMarker.getLatLng(), this.baseMarker.getLatLng(), this.destMarker.getLatLng()];
      }
    },
    handleClick: function (event) {
      // first click sets pickup location
      if (this.fromMarker === null) {
        this.fromMarker = L.marker(event.latlng, {icon: this.fromIcon, draggable: true}).addTo(this.map);
        this.fromMarker.on("drag", this.moveMarker);
      }
      // second click sets destination
      else if (this.destMarker === null) {
        this.destMarker = L.marker([event.latlng.lat, event.latlng.lng], {draggable: true}).addTo(this.map);
        this.destMarker.on("drag", this.moveMarker);
        this.connectMarkers = L.polyline(this.getPolylinePoints(), {color: 'blue'}).addTo(this.map);
      }
      // subsequent clicks assume moved markers
      else {
        this.moveMarker();
      }
    },
    moveMarker: function (event) {
      this.connectMarkers.setLatLngs(this.getPolylinePoints(), {color: 'blue'});
      socket.emit("moveMarker", { orderId: event.target.orderId,
                                latLong: [event.target.getLatLng().lat, event.target.getLatLng().lng]
                                });

    }

  }*/
});

function deliveryMethodCost(){
  var delMethod = document.getElementById("deliveryMethod").value;
  if (delMethod == "Express (1-2 days)"){
    return 50;
  }
  else{
    return 25;
  }
}

function getOrderInfo(){
    var pickupStreet = document.getElementById("street1").value;
    var pickupHouse = document.getElementById("house1").value;
    var deliveryStreet = document.getElementById("street2").value;
    var deliveryHouse = document.getElementById("house2").value;
    var weight = document.getElementById("weight").value;
    var notes = document.getElementById("notes").value;
    var deliveryMethod = document.getElementById("deliveryMethod").value;
    var deliveryCost = deliveryMethodCost() + 10*weight + " sek";

    var pickupAddr = pickupStreet + " " + pickupHouse;
    var deliveryAddr = deliveryStreet + " " + deliveryHouse;

    var orderInfo = "?pickupaddr=" + pickupAddr + "&deliveryaddr=" + deliveryAddr + "&weight=" + weight + "&notes=" + notes + "&deliverymethod=" + deliveryMethod + "&deliveryCost=" + deliveryCost;
    
    window.location.href = "http://localhost:3000/checkout" + orderInfo;
}


document.addEventListener('DOMContentLoaded', function() {
    var queryString = decodeURIComponent(window.location.search);
    var queries = queryString.split("&");
    var pickupAddr = queries[0].split("=");
    var deliveryAddr = queries[1].split("=");
    var weight = queries[2].split("=");
    var notes = queries[3].split("=");
    var deliveryMethod = queries[4].split("=");
    var deliveryCost = queries[5].split("=");

    document.getElementById("displayPickup").innerHTML = pickupAddr[1];
    document.getElementById("displayDelivery").innerHTML = deliveryAddr[1];
    document.getElementById("displayWeight").innerHTML = weight[1] + "kg";
    document.getElementById("displayNotes").innerHTML = notes[1];
    document.getElementById("displayMethod").innerHTML = deliveryMethod[1];
    document.getElementById("displayCost").innerHTML = deliveryCost[1];
}, false);


function myFunction() {
  var popup = document.getElementById("myPopup");
  popup.classList.toggle("show");
}
