// https://davis.wpi.edu/~matt/courses/clipping/

var calcNodes = require('./lib/nodes.js')
var mopts = { mode: 0 }

module.exports = clip

module.exports.intersect = function intersect(A, B, opts) {
  if (!opts) opts = mopts
  opts.mode = 'intersect'
  return clip(A, B, opts)
}
module.exports.xor = function xor(A, B, opts) {
  if (!opts) opts = mopts
  opts.mode = 'xor'
  return clip(A, B, opts)
}
module.exports.union = function union(A, B, opts) {
  if (!opts) opts = mopts
  opts.mode = 'union'
  return clip(A, B, opts)
}
module.exports.difference = function difference(A, B, opts) {
  if (!opts) opts = mopts
  opts.mode = 'difference'
  return clip(A, B, opts)
}

function clip(A, B, opts) {
  var npoints = (opts && opts.npoints) || []
  var nodes = (opts && opts.nodes) || Array(A.length+B.length)
  calcNodes(nodes, npoints, A, B, opts)
  return clipNodes(nodes, A, B, npoints, opts)
}

function firstNodeOfInterest(nodes, start) {
  var i = start, n = nodes[i];
  do {
    i = n.next;
    n = nodes[i];
  } while (i < nodes.length && i !== start && (!n.intersect || (n.intersect && n.visited)));
  return i
}

function clipNodes(nodes, A, B, C, opts) {
  var get = opts.get || getPoint
  var mode = opts.mode
  var la = A.length, lb = B.length
  var coordinates = []
  var rings = []

  var start = mode === 'union' ? la : 0
  while ((index = firstNodeOfInterest(nodes, start)) !== start) {
    var n = nodes[index]
    var ring = []
    for (; !n.visited; index = n.neighbor, n = nodes[index]) {
      ring.push(get(A,B,C,index))
      var fwd = n.entry
      while (true) {
        n.visited = true
        index = fwd ? n.next : n.prev
        n = nodes[index]
        if (n.intersect) {
          n.visited = true
          break
        } else {
          ring.push(get(A,B,C,index))
        }
      }
    }
    rings.push(ring)
  }
  coordinates.push(rings)

  if (mode === 'xor') {
    for (var i = 0; i < nodes.length; i++) {
      nodes[i].visited = false
      if (nodes[i].intersect) nodes[i].entry = !nodes[i].entry
    }
    rings = []
    while ((index = firstNodeOfInterest(nodes, la)) !== la) {
      var n = nodes[index]
      var ring = []
      for (; !n.visited; index = n.neighbor, n = nodes[index]) {
        ring.push(get(A,B,C,index))
        var fwd = n.entry
        while (true) {
          n.visited = true
          index = fwd ? n.next : n.prev
          n = nodes[index]
          if (n.intersect) {
            n.visited = true
            break
          } else {
            ring.push(get(A,B,C,index))
          }
        }
      }
      rings.push(ring)
    }
    coordinates.push(rings)
  }
  return coordinates
}

function getPoint(A,B,C,i) {
  var la = A.length, lb = B.length
  if (i < la) return A[i]
  if (i < la+lb) return B[i-la]
  return C[Math.floor((i-la-lb)/2)]
}
function getIndex(A,B,C,i) { return i }
