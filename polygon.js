var calcNodes = require('./lib/nodes.js')

var mopts = { mode: 0 }
var INTERSECT = 0, XOR = 1, UNION = 2, DIFFERENCE = 3
var modes = {
  intersect: INTERSECT,
  xor: XOR,
  union: UNION,
  difference: DIFFERENCE
}

module.exports = clip
module.exports.calcNodes = calcNodes

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

exports.clipNodes = clipNodes
function clipNodes(nodes, A, B, C, opts) {
  var mode = modes[opts.mode]
  var get = opts.get || getPoint
  var la = A.length, lb = B.length
  var coordinates = []
  var rings = []
  var fwd = true
  while (true) {
    var ring = []
    for (var index = 0; index < nodes.length; index++) {
      if (nodes[index].intersect && !nodes[index].visited) break
    }
    if (index >= nodes.length) break
    var start = index
    while (true) {
      if (nodes[index].visited) break
      nodes[index].visited = true
      if (index < la+lb) {
        ring.push(get(A,B,C,index))
      } else {
        ring.push(get(A,B,C,la+lb+Math.floor((index-la-lb)/2)))
      }
      if (nodes[index].intersect) {
        if (mode === INTERSECT) {
          fwd = !nodes[index].entry
        } else if (mode === XOR) {
          fwd = !fwd
        } else if (mode === UNION) {
          fwd = fwd === nodes[index].entry
        } else if (mode === DIFFERENCE) {
          fwd = fwd !== nodes[index].entry
        }
        index = nodes[index].neighbor
      }
      if (fwd) {
        index = nodes[index].next
      } else {
        index = nodes[index].prev
      }
      if (start === index) {
        if (ring.length > 0) {
          rings.push(ring)
          coordinates.push(rings)
          rings = []
          ring = []
        }
        break
      }
    }
    fwd = !fwd
  }
  if (rings.length > 0) coordinates.push(rings)
  return coordinates
}

function getPoint(A,B,C,i) {
  var la = A.length, lb = B.length
  if (i < la) return A[i]
  if (i < la+lb) return B[i-la]
  return C[i-la-lb]
}
function getIndex(A,B,C,i) { return i }
