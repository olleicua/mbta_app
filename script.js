var displayTime = function(seconds) {
  var s = parseFloat(seconds);
  if (s > 0) {
    return (Math.floor(s / 60).toString() + 'm ' +
            (s % 60).toString() + 's');
  } else {
    return '...';
  }
};

var formatPredictionRow = function(prediction) {
  return '<li class="list-group-item">&nbsp;' +
    '<span class="label label-primary pull-left route">' +
    prediction.route + '</span>' +
    '<span class="label label-info pull-left direction">' +
    prediction.direction + '</span>&nbsp;' +
    '<span class="badge pull-right time">' +
    displayTime(prediction.seconds) + '</span></li>';
};

var tickDown = function(time) {
  var match = /^(\d+)m\s+(\d+)s$/.exec(time);
  if (match) {
    var min = parseInt(match[1]);
    var sec = parseInt(match[2]);
    return displayTime((60 * min) + sec - 1);
  } else {
    return time;
  }
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
  $('#predictions').find('.refresh, .loading').toggle();
  $.ajax({
    type: 'GET',
    url: 'http://webservices.nextbus.com/service/publicXMLFeed' +
      '?command=predictions&a=mbta&stopId=' + stop.id,
    dataType: 'xml',
    success: function(data) {
      $('#predictions').find('.refresh, .loading').toggle();
      openStop(stop, data);
    },
    error: function() {
      $('#predictions').find('.refresh, .loading').toggle();
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
      map.setZoom(17);
    }, function() {
      handleNoGeolocation(browserSupportFlag);
    });
  }
  // Browser doesn't support Geolocation
  else {
    browserSupportFlag = false;
    handleNoGeolocation(browserSupportFlag);
  }

  google.maps.event.addListener(map, 'bounds_changed', function() {
    window.localStorage.setItem('zoom', map.getZoom());
    window.localStorage.setItem('lat', map.getCenter().lat());
    window.localStorage.setItem('lng', map.getCenter().lng());
  });

  function handleNoGeolocation(errorFlag) {
    if (window.localStorage.getItem('zoom') &&
        window.localStorage.getItem('lat') &&
        window.localStorage.getItem('lng')) {
      map.setCenter(new google.maps.LatLng(window.localStorage.getItem('lat'),
                                           window.localStorage.getItem('lng')));
      map.setZoom(window.localStorage.getItem('zoom'));
    } else {
      alert("Geolocation service failed.");
      initialLocation = boston;
      map.setCenter(initialLocation);
    }
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
    var time = $(this).text();
    $(this).text(tickDown(time));
  });
  countDownTimer = setTimeout(countDown, 1000);
};
countDown();