var pclip = require('../')
var opts = require('../geo')
var A = [[0,0],[5,8],[10,0]]
var B = [[5,4],[10,12],[10,4]]

console.log('intersect', show(pclip.intersect(A,B,opts)))
console.log('exclude', show(pclip.exclude(A,B,opts)))
console.log('union', show(pclip.union(A,B,opts)))
console.log('difference', show(pclip.difference(A,B,opts)))

function show(cs) {
  return '[\n' + cs.map(rings => '  ' + JSON.stringify(rings)).join(',\n') + '\n]'
}
