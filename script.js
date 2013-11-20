var displayTime = function(seconds) {
  var s = parseFloat(seconds);
  return Math.floor(s / 60).toString() + 'm ' +
    (s % 60).toString() + 's';
};

var formatPredictionRow = function(prediction) {
  return '<li class="list-group-item">&nbsp;' +
    '<span class="label label-primary pull-left">' +
    prediction.route + '</span>' +
    '<span class="label label-info pull-left">' +
    prediction.direction + '</span>&nbsp;' +
    '<span class="badge pull-right">' +
    displayTime(prediction.seconds) + '</span></li>';
};

var parsePredictions = function(xhrResult) {
  var ret = [];
  $(xhrResult).find('predictions').each(function() {
    var route = $(this).attr('routeTitle');
    $(this).find('direction').each(function() {
      var direction = $(this).attr('title');
      $(this).find('prediction').each(function() {
        ret.push({
          route: route,
          direction: direction,
          seconds: $(this).attr('seconds')
        });
      });
    });
  });
  return _.sortBy(ret, function(p) {
    return parseFloat(p.seconds);
  });
};

var openStop = function(stop, xhrResult) {
  var $box = $('#predictions');
  var $head = $box.find('.panel-heading');
  var predictions = parsePredictions(xhrResult);
  var p;
  $head.find('.title').html(stop.title);
  $box.find('.list-group').html('');
  for (var i = 0; i < predictions.length; i++) {
    $box.find('.list-group').append(formatPredictionRow(predictions[i]));
  }
  $('#map').css('width', '70%');
  $box.show();
};

var loadStop = function(stop) {
  $.ajax({
    type: 'GET',
    url: 'http://webservices.nextbus.com/service/publicXMLFeed' +
      '?command=predictions&a=mbta&stopId=' + stop.id,
    dataType: 'xml',
    success: function(data) {
      openStop(stop, data);
    },
    error: function() {
      console.log('An Error occurred')
    }
  });
};

var currentStop;
var initialLocation;
var boston = new google.maps.LatLng(42.38, -71.1);
var browserSupportFlag;

function initialize() {
  var myOptions = {
    zoom: 12,
    mapTypeId: google.maps.MapTypeId.ROADMAP
  };
  var map = new google.maps.Map(document.getElementById("map"), myOptions);

  // Try W3C Geolocation (Preferred)
  if(navigator.geolocation) {
    browserSupportFlag = true;
    navigator.geolocation.getCurrentPosition(function(position) {
      initialLocation = new google.maps.LatLng(position.coords.latitude,position.coords.longitude);
      map.setCenter(initialLocation);
    }, function() {
      handleNoGeolocation(browserSupportFlag);
    });
  }
  // Browser doesn't support Geolocation
  else {
    browserSupportFlag = false;
    handleNoGeolocation(browserSupportFlag);
  }

  function handleNoGeolocation(errorFlag) {
    alert("Geolocation service failed.");
    initialLocation = boston;
    map.setCenter(initialLocation);
  }
  
  for (var i = 0; i < stops.length; i++) {
    (function(stop) {
      var pos =  new google.maps.LatLng(stop.lat, stop.lon);
      var marker = new google.maps.Marker({
        position: pos,
        map: map,
        title: stop.title
      });
      google.maps.event.addListener(marker, 'click', function() {
        currentStop = stop;
        loadStop(stop);
      });
    }).call(this, stops[i])
  }
  
  $('#predictions').find('.close').click(function() {
    $('#map').css('width', '100%');
    $('#predictions').hide();
  })
  
  $('#predictions').find('.refresh').click(function() {
    if (currentStop) {
      loadStop(currentStop);
    }
  })
}

google.maps.event.addDomListener(window, 'load', initialize);
