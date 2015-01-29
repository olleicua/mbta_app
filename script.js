var displayTime = function(seconds) {
  var s = parseFloat(seconds);
  if (s > 0) {
    return (Math.floor(s / 60).toString() + 'm ' +
            (s % 60).toString() + 's');
  } else {
    return '...';
  }
};
var displayUnixTimeOfArrival = function(time) {
  return displayTime(time - Math.round(Date.now() / 1000));
};

// epochTime is in milliseconds
var formatPredictionRow = function(prediction) {
  var $li = $('<li class="list-group-item">');
  var $route = $('<span class="label label-primary pull-left route">');
  $route.text(prediction.route);
  var $dir = $('<span class="label label-info pull-left direction">');
  $dir.text(prediction.direction);
  var $time = $('<span class="badge pull-right time">');
  $time.attr('data-occurs', prediction.unixTimeOfArrival);
  $time.text(displayUnixTimeOfArrival(prediction.unixTimeOfArrival));
  $li.append('&nbsp;', $route, $dir, $time);
  return $li;
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
          unixTimeOfArrival: Math.round($(this).attr('epochTime') / 1000),
          affectedByLayover: $(this).attr('affectedByLayover')
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
  $('#predictions').find('.loading').css({ display: 'block' });
  $('#predictions').find('.refresh').hide();
  $.ajax({
    type: 'GET',
    url: 'http://webservices.nextbus.com/service/publicXMLFeed' +
      '?command=predictions&a=mbta&stopId=' + stop.id,
    dataType: 'xml',
    success: function(data) {
      $('#predictions').find('.loading').css({ display: 'none' });
      $('#predictions').find('.refresh').show();
      openStop(stop, data);
    },
    error: function() {
      $('#predictions').find('.loading').css({ display: 'none' });
      $('#predictions').find('.refresh').show();
      console.log('An Error occurred');
    }
  });
};

var autoReload = function() {
  if (currentStop) {
    loadStop(currentStop);
  }
  setTimeout(autoReload, 60 * 1000);
};

var currentStop;
var initialLocation;
var boston = { lat: 42.38, lng: -71.1, zoom: 12 };
var browserSupportFlag;
var map;
function setLocation(lat, lng, zoom) {
  map.setCenter(new google.maps.LatLng(lat, lng));
  map.setZoom(zoom);
}

function setLocationToNonGeolocatedDefault() {
  if (window.localStorage.getItem('zoom') &&
      window.localStorage.getItem('lat') &&
      window.localStorage.getItem('lng')) {
    setLocation(
      +window.localStorage.getItem('lat'),
      +window.localStorage.getItem('lng'),
      +window.localStorage.getItem('zoom'));
  } else {
    setLocation(boston.lat, boston.lng, boston.zoom);
  }
}

function initialize() {
  var myOptions = {
    zoom: 12,
    mapTypeId: google.maps.MapTypeId.ROADMAP
  };
  map = new google.maps.Map(document.getElementById("map"), myOptions);
  setLocationToNonGeolocatedDefault();

  // Try W3C Geolocation (Preferred)
  if(navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(function(position) {
      setLocation(position.coords.latitude, position.coords.longitude, 17);
    }, function() {
    }, {
      timeout: 7000
    });
  }

  google.maps.event.addListener(map, 'bounds_changed', function() {
    window.localStorage.setItem('zoom', map.getZoom());
    window.localStorage.setItem('lat', map.getCenter().lat());
    window.localStorage.setItem('lng', map.getCenter().lng());
  });

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
    }).call(this, stops[i]);
  }

  $('#predictions').find('.close').click(function() {
    $('#map').css('width', '100%');
    $('#predictions').hide();
  });

  $('#predictions').find('.refresh').click(function() {
    if (currentStop) {
      loadStop(currentStop);
    }
  });

  autoReload();
}

google.maps.event.addDomListener(window, 'load', initialize);

var countDownTimer;
var countDown = function() {
  $('.time').each(function() {
    var time = $(this).attr('data-occurs');
    $(this).text(displayUnixTimeOfArrival(time));
  });
  countDownTimer = setTimeout(countDown, 1000);
};
countDown();
