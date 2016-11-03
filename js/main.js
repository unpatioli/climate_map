// Create Leaflet map with osm tiles
var mymap = L.map('map', {
  'center': [65, 100],
  'zoom': 2,
  'layers': [
    L.tileLayer('http://{s}.tile.osm.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
    })
  ]
});

function mapColor(val, min_val, max_val)
{
  // Allign to zero
  val -= min_val;
  max_val -= min_val;
  // 0 <= k <= 1
  var k = val / max_val;

  // Cold spectrum (h = [200; 330])
  var color = Math.floor( 200 + 130 * k);

  return color;
}

// Get polygons
$.getJSON('doc/regionsRF.geojson', function(geo_data) {
  // Get climate info
  $.getJSON('doc/clim.json', function(clim_data) {
    var clim = clim_data["climate"];
    var jan_max = _.max(clim, function(item) { return item.jan; }).jan;
    var jan_min = _.min(clim, function(item) { return item.jan; }).jan;
    var min_legend_color = mapColor(jan_min, jan_min, jan_max);
    var max_legend_color = mapColor(jan_max, jan_min, jan_max);
    $("#legend_min").html(jan_min);
    $("#legend_max").html(jan_max);
    $("#gradient").css("background",
      "linear-gradient(to right, hsl(" + min_legend_color + ", 100%, 50%), hsl(" + max_legend_color + ", 100%, 50%))");

    L.geoJSON(geo_data, {
      style: function(feature) {
        // Colors for thematic map
        var color = "#0000ff";
        // Get climate info by ADM3_NAME (Federal district)
        if (feature.properties && feature.properties.ADM3_NAME) {
          var v = _.find(clim, function(item) { return item.name === feature.properties.ADM3_NAME; });
          if (!_.isUndefined(v)) {
            // Change color according to param value
            var k = mapColor(v.jan, jan_min, jan_max);
            color = "hsl(" + k + ", 100%, 50%)";
          }
        }

        return {
          weight: 2,
          color: color
        };
      },

      onEachFeature: function(feature, layer) {
        // Add popups to the map
        if (feature.properties && feature.properties.NAME) {
          var v = _.find(clim, function(item) { return item.name === feature.properties.ADM3_NAME; });
          layer.bindPopup("<p>" + feature.properties.NAME + "</p>" +
                          "<p>Средняя температура января: " + v.jan + "</p>");
        }
      },

      coordsToLatLng: function(coords) {
        // Leaflet hack to properly display data to the East from Antimeridian
        if (coords[0] < 0) {
          coords[0] += 360;
        }
        return new L.LatLng(coords[1], coords[0], true);
      },
    }).addTo(mymap);
  });
});

