var az0 = [0,0], az1 = [0,0]

module.exports = {
  intersect: require('intersect-great-circle'),
  pointInPolygon: require('geo-point-in-polygon'),
  distance: hdist,
  lerp: require('geolerp'),
  area: geoArea, // deprecated
}

function hdist(p1, p2) {
  var lon1 = p1[0]/180*Math.PI, lat1 = p1[1]/180*Math.PI
  var lon2 = p2[0]/180*Math.PI, lat2 = p2[1]/180*Math.PI
  var s1 = Math.sin((lat1-lat2)*0.5)
  var s2 = Math.cos(lat1)*Math.cos(lat2)*Math.sin((lon1-lon2)*0.5)
  return 2.0*Math.asin(Math.sqrt(s1*s1+s2*s2))
}

function geoArea(p) {
  var s = 0, n = p.length
  for (var i = 0; i < n; i++) {
    az(az0, p[i])
    az(az1, p[(i+1)%n])
    var daz = ((az1[1] - az0[1]) + Math.PI) % (2*Math.PI) - Math.PI
    var colat = az0[0]+(az1[0]-az0[0])/2
    s += (1-Math.cos(colat))*daz
  }
  var area = Math.abs(s)/(4*Math.PI)
  return Math.abs(Math.min(area,1-area)) // area is ratio of total surface area
}

function az(out, p) {
  var lon = p[0]/180*Math.PI, lat = p[1]/180*Math.PI
  var slat = Math.sin(lat)
  var slon = Math.sin(lon)
  var shlon = Math.sin(lon/2)
  var shlat = Math.sin(lat/2)
  var clat = Math.cos(lat)
  var a = shlat*shlat + clat*shlon*shlon
  out[0] = 2*Math.atan2(Math.sqrt(a), Math.sqrt(1-a))
  out[1] = Math.atan2(clat*slon, slat) % (2*Math.PI)
  return out
}
