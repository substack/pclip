var geoclip = require('../polygon')
var A = [[0,0],[5,8],[10,0]]
var B = [[5,4],[10,12],[10,4]]
var opts = {
  intersect: require('line-segment-intersect-2d'),
  pointInPolygon: require('point-in-polygon'),
  distance: require('gl-vec2/distance'),
}

console.log('intersect', geoclip.intersect(A,B,opts))
console.log('xor', geoclip.xor(A,B,opts))
console.log('union', geoclip.union(A,B,opts))
console.log('difference', geoclip.difference(A,B,opts))
