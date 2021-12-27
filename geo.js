module.exports = {
  intersect: require('intersect-great-circle'),
  pointInPolygon: require('geo-point-in-polygon'),
  distance: hdist,
  lerp: require('geolerp'),
}

function hdist(p1, p2) {
  var lon1 = p1[0]/180*Math.PI, lat1 = p1[1]/180*Math.PI
  var lon2 = p2[0]/180*Math.PI, lat2 = p2[1]/180*Math.PI
  var s1 = Math.sin((lat1-lat2)*0.5)
  var s2 = Math.cos(lat1)*Math.cos(lat2)*Math.sin((lon1-lon2)*0.5)
  return 2.0*Math.asin(Math.sqrt(s1*s1+s2*s2))
}
