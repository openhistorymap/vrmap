/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

var tileZoom = 19;
var locationPresets = [
  { title: "Wien Gaudenzdorf",
    latitude: 48.18594,
    longitude: 16.34177,
  },
  { title: "Wien Stockwerk",
    latitude: 48.19207,
    longitude: 16.33610,
  },
  { title: "Wien Stadtpark",
    latitude: 48.20542,
    longitude: 16.37911,
  },
  { title: "New York Plaza",
    latitude: 40.70245,
    longitude: -74.01282,
  },
  { title: "San Francisco Market & Drumm",
    latitude: 37.79375,
    longitude: -122.39587,
  },
  { title: "SJ South Market Park",
    latitude: 37.33226,
    longitude: -121.88968,
  },
  { title: "Vegas Mirage",
    latitude: 36.12167,
    longitude: -115.17204,
  },
  { title: "Köln Dom",
    latitude: 50.94130,
    longitude: 6.95665,
  },
  { title: "Bremen",
    latitude: 53.0758,
    longitude: 8.8072,
  },
  { title: "Graz",
    latitude: 47.07245,
    longitude: 15.44092,
  },
  { title: "London St Giles High St",
    latitude: 51.51556,
    longitude: -0.12681,
  },
  { title: "Moscow",
    latitude: 55.75412,
    longitude: 37.62048,
  },
  { title: "Paris Champ de Mars",
    latitude: 48.85601,
    longitude: 2.29661,
  },
  { title: "Warsaw",
    latitude: 52.23242,
    longitude: 21.00913,
  },
  { title: "Tokio",
    latitude: 35.69091,
    longitude: 139.69481,
  },
]
var centerPos = locationPresets[0];
var map, tiles, items;
var baseTileID, baseTileSize, centerOffset;
var tilesFromCenter = 3;

// Mapnik is the default world-wide OpenStreetMap style.
var tileServer = "https://tilecache.kairo.at/mapnik/";
// Basemap offers hires tiles for Austria.
//var tileServer = "https://tilecache.kairo.at/basemaphires/";
// Standard Overpass API Server
var overpassURL = "https://overpass-api.de/api/interpreter";

window.onload = function() {
  document.querySelector("#introDialogCloseButton").onclick = function(event) {
    event.target.parentElement.parentElement.classList.add("hidden")
  };
  map = document.querySelector("#map");
  tiles = document.querySelector("#tiles");
  items = document.querySelector("#items");
  loadGroundTiles();
  loadTrees();
  loadBuildings();
}

function getTagsForXMLFeature(xmlFeature) {
  var tags = {};
  for (tag of xmlFeature.children) {
    if (tag.nodeName == "tag") {
      tags[tag.attributes['k'].value] = tag.attributes['v'].value;
    }
  }
  return tags;
}

function getBoundingBoxString() {
  var startPos = latlonFromTileID({x: baseTileID.x - tilesFromCenter,
                                   y: baseTileID.y + tilesFromCenter + 1});
  var endPos = latlonFromTileID({x: baseTileID.x + tilesFromCenter + 1,
                                 y: baseTileID.y - tilesFromCenter});
  return startPos.latitude + "," + startPos.longitude + "," +
         endPos.latitude + "," + endPos.longitude;
}

function fetchFromOverpass(opQuery) {
  return new Promise((resolve, reject) => {
    fetch(overpassURL + "?data=" + encodeURIComponent(opQuery))
    .then((response) => {
      if (response.ok) {
        return response.text();
      }
      else {
        throw "HTTP Error " + response.status;
      }
    })
    .then((response) => {
      var parser = new DOMParser();
      var itemData = parser.parseFromString(response, "application/xml");
      var itemJSON = osmtogeojson(itemData);
      resolve(itemJSON);
    })
    .catch((reason) => { reject(reason); });
  });
}
