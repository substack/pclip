var geoclip = require('../')
var A = [[0,0],[5,8],[10,0]]
var B = [[5,4],[10,12],[10,4]]
var opts = {
  intersect: require('line-segment-intersect-2d'),
  pointInPolygon: require('point-in-polygon'),
  distance: require('gl-vec2/distance'),
}

console.log('intersect', show(geoclip.intersect(A,B,opts)))
console.log('xor', show(geoclip.xor(A,B,opts)))
console.log('union', show(geoclip.union(A,B,opts)))
console.log('difference', show(geoclip.difference(A,B,opts)))

function show(cs) {
  return '[\n' + cs.map(rings => '  ' + JSON.stringify(rings)).join(',\n') + '\n]'
}
