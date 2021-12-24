var pclip = require('../')
var opts = require('../xy')
var A = [
  [
    [[-5,-1],[+0,+4],[+1,+1],[+3,+1],[+3,-1],[+0,-1],[+0,-2],[-4,-2]], // first polygon exterior
    [[-3,+0],[-1,+2],[+1,+0]], // hole
  ],
  [[[-4,+3],[-4,+4],[-3,+4]]], // second polygon exterior
]
var B = [
  [
    [[-2,+3],[+1,+3],[+1,+5],[+4,+5],[+4,+2],[+2,+2],[+2,-2],[+0,-3],[-2,-1]], // polygon exterior
    [[-0.5,+0.5],[+1.5,+0.5],[+1,-2]], // first hole
    [[+2,+4],[+3,+4],[+3,+3],[+2,+3]], // second hole
  ],
]

console.log('intersect', show(geoclip.intersect(A,B,opts)))
console.log('exclude', show(geoclip.exclude(A,B,opts)))
console.log('union', show(geoclip.union(A,B,opts)))
console.log('difference', show(geoclip.difference(A,B,opts)))
console.log('divide', show(geoclip.divide(A,B,opts)))

function show(cs) {
  return '[\n' + cs.map(rings => '  ' + JSON.stringify(rings)).join(',\n') + '\n]'
}
