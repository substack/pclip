var pclip = require('../')
var A = [[0,0],[5,8],[10,0]]
var B = [[5,4],[10,12],[10,4]]
var opts = {
  intersect: require('intersect-great-circle'),
  pointInPolygon: require('geo-point-in-polygon'),
  distance: require('haversine-distance'),
}
console.log('intersect', show(pclip.intersect(A,B,opts)))
console.log('exclude', show(pclip.exclude(A,B,opts)))
console.log('union', show(pclip.union(A,B,opts)))
console.log('difference', show(pclip.difference(A,B,opts)))

function show(cs) {
  return '[\n' + cs.map(rings => '  ' + JSON.stringify(rings)).join(',\n') + '\n]'
}
