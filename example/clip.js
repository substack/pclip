var geoclip = require('../polygon')
//var A = [[-90,30],[-140,45],[-110,65]]
//var B = [[-170,70],[-100,70],[-120,40]]
var A = [[0,0],[5,8],[10,0]]
var B = [[5,4],[10,12],[10,4]]

console.log('intersect', geoclip.intersect(A,B))
console.log('xor', geoclip.xor(A,B))
console.log('union', geoclip.union(A,B))
console.log('difference', geoclip.difference(A,B))
