var pclip = require('../polygon')
var A = [[0,0],[5,8],[10,0]]
var B = [[5,4],[10,12],[10,4]]
var opts = {
  intersect: require('intersect-great-circle'),
  pointInPolygon: require('geo-point-in-polygon'),
  distance: require('haversine-distance'),
}
console.log('intersect', pclip.intersect(A,B,opts))
console.log('xor', pclip.xor(A,B,opts))
console.log('union', pclip.union(A,B,opts))
console.log('difference', pclip.difference(A,B,opts))
