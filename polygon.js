// https://davis.wpi.edu/~matt/courses/clipping/

var intersect = require('intersect-great-circle')
var pointInPolygon = require('geo-point-in-polygon')
var calcNodes = require('./lib/nodes.js')
var INTERSECT = 0, XOR = 1, UNION = 2, DIFFERENCE = 3

exports.intersect = function intersect(A, B) {
  return clip(A, B, INTERSECT)
}
exports.xor = function xor(A, B) {
  return clip(A, B, XOR)
}
exports.union = function union(A, B) {
  return clip(A, B, UNION)
}
exports.difference = function difference(A, B) {
  return clip(A, B, DIFFERENCE)
}

function clip(A, B, mode) {
  var nodes = Array(A.length+B.length)
  var npoints = []
  calcNodes(nodes, npoints, A, B)

  // phase three:
  var results = []
  var fwd = true
  while (true) {
    var current = []
    for (var index = 0; index < nodes.length; index++) {
      if (nodes[index].intersect && !nodes[index].visited) break
    }
    if (index >= nodes.length) break
    var start = index
    while (true) {
      if (nodes[index].visited) break
      nodes[index].visited = true
      current.push(index)
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
        if (current.length > 0) results.push(current)
        break
      }
    }
    fwd = !fwd
  }
  return results
}
