var geoclip = require('../')
var opts = require('../xy')
var A = [[0,0],[5,8],[10,0]]
var B = [[5,4],[10,12],[10,4]]

console.log('intersect', show(geoclip.intersect(A,B,opts)))
console.log('exclude', show(geoclip.exclude(A,B,opts)))
console.log('union', show(geoclip.union(A,B,opts)))
console.log('difference', show(geoclip.difference(A,B,opts)))

function show(cs) {
  return '[\n' + cs.map(rings => '  ' + JSON.stringify(rings)).join(',\n') + '\n]'
}
