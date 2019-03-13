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
  methods: {
      placeOrder: function() {
          var from = document.getElementById("displayPickup").innerHTML;
          var dest = document.getElementById("displayDelivery").innerHTML;
          var express = false;
          if(document.getElementById("displayMethod").innerHTML == "express (1-2 days)"){
              express = true;
          }
          var weight = document.getElementById("displayWeight").innerHTML;
          var notes = document.getElementById("displayNotes").innerHTML;

          console.log("Hej!");

          socket.emit("placeOrder", { fromText: from, destText: dest, express: express, pickedUp: false, delivered: false, orderDetails: { "weight": weight, "notes": notes}
      });
    }
  }
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
    var express = false;
    if(deliveryMethod == "express (1-2 days)"){
        express = true;
    }

    var pickupAddr = pickupStreet + " " + pickupHouse;
    var deliveryAddr = deliveryStreet + " " + deliveryHouse;

    var orderInfo = "?pickupaddr=" + pickupAddr + "&deliveryaddr=" + deliveryAddr + "&weight=" + weight + "&notes=" + notes + "&deliverymethod=" + deliveryMethod + "&deliveryCost=" + deliveryCost;
    
    window.location.href = "/checkout" + orderInfo;
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

function displayThankYou(){
  var thanks = "Thank you for your order! 😁" ;
  document.getElementById("displayThanks").innerHTML= thanks;
}
