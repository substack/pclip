// https://davis.wpi.edu/~matt/courses/clipping/

var calcNodes = require('./lib/nodes.js')
var mpip = require('./lib/mpip.js')
var getDepth = require('./lib/get-depth.js')
var mopts = {}
var out = { nodes: [], la: 0, lb: 0 }

module.exports = clip

module.exports.intersect = function intersect(A, B, opts) {
  if (!opts) opts = mopts
  return clip(A, B, opts, 'intersect')
}
module.exports.exclude = function exclude(A, B, opts) {
  if (!opts) opts = mopts
  return clip(A, B, opts, 'exclude')
}
module.exports.union = function union(A, B, opts) {
  if (!opts) opts = mopts
  return clip(A, B, opts, 'union')
}
module.exports.difference = function difference(A, B, opts) {
  if (!opts) opts = mopts
  return clip(A, B, opts, 'difference')
}
module.exports.divide = function divide(A, B, opts) {
  if (!opts) opts = mopts
  return clip(A, B, opts, 'divide')
}

function clip(A, B, opts, mode) {
  out.nodes = []
  if (mode === undefined) mode = opts.mode
  if (mode === 'exclude') { // flip A and B if first non-shared point in A is inside B
    var dA = getDepth(A), dB = getDepth(B)
    var firstA = null, firstB = null
    var distance = opts.distance, epsilon = opts.epsilon || 1e-8
    if (dB === 2) firstB = B[0]
    if (dB === 3) firstB = B[0][0]
    if (dB === 4) firstB = B[0][0][0]
    if (dA === 2) {
      for (var i = 0; i < A.length; i++) {
        var d = distance(A[i],firstB)
        if (d > epsilon) break
      }
      firstA = A[i%A.length]
    } else if (dA === 3) {
      for (var i = 0; i < A[0].length; i++) {
        var d = distance(A[0][i],firstB)
        if (d > epsilon) break
      }
      firstA = A[0][i%A[0].length]
    } else if (dA === 4) {
      for (var i = 0; i < A[0][0].length; i++) {
        var d = distance(A[0][0][i],firstB)
        if (d > epsilon) break
      }
      firstA = A[0][0][i%A[0][0].length]
    }
    if (mpip(opts.pointInPolygon, firstA, B, dB)) {
      var X = B
      B = A
      A = X
    }
  }
  calcNodes(out, A, B, opts, mode)
  var coordinates
  if (mode === 'divide') {
    coordinates = []
    clipNodes(coordinates, out, A, B, opts, 'difference')
    flipEntry(out.nodes, 0) // emulates re-marking as intersect
    for (var i = 0; i < out.nodes.length; i++) {
      out.nodes[i].visited = false
    }
    clipNodes(coordinates, out, A, B, opts, 'intersect')
  } else {
    coordinates = clipNodes([], out, A, B, opts, mode)
  }
  if (opts.duplicate) {
    var epsilon = opts.epsilon !== undefined ? opts.epsilon : 1e-8
    var distance = opts.distance
    for (var i = 0; i < coordinates.length; i++) {
      for (var j = 0; j < coordinates[i].length; j++) {
        var cs = coordinates[i][j]
        if (distance(cs[0],cs[cs.length-1]) > epsilon) cs.push(cs[0])
      }
    }
  }
  return coordinates
}

function firstNodeOfInterest(nodes, start) {
  var i = start, pstart = start, n = nodes[i]
  do {
    i = n.next
    n = nodes[i]
    if (n.intersect && !n.visited) return i
    if (n.loop && !n.visited) return i
    if (i === pstart) {
      i = n.nextPolygon
      pstart = i
      n = nodes[i]
    }
  } while (i !== start)
  return -1
}

function clipNodes(coordinates, out, A, B, opts, mode) {
  var nodes = out.nodes
  var get = opts.get || getPoint
  var distance = opts.distance
  if (mode === undefined) mode = opts.mode
  var epsilon = opts.epsilon !== undefined ? opts.epsilon : 1e-8
  var la = out.la, lb = out.lb
  var pip = opts.pointInPolygon
  walk(pip, coordinates, out, 0, get, mode, epsilon, distance)
  if (mode === 'exclude') {
    for (var i = 0; i < nodes.length; i++) {
      var n = nodes[i]
      n.visited = false
      if (n.intersect) n.entry = !n.entry
    }
  }
  walk(pip, coordinates, out, la, get, mode, epsilon, distance)
  return coordinates
}

function flipEntry(nodes, start) {
  var i = start, pstart = start, n = nodes[i]
  do {
    if (n.intersect) n.entry = !n.entry
    i = n.next
    n = nodes[i]
    if (i === pstart) {
      i = n.nextPolygon
      pstart = i
      n = nodes[i]
    }
  } while (i !== start)
}

function getPoint(nodes,i) {
  return nodes[i].point
}

function walk(pip, coordinates, out, start, get, mode, epsilon, distance) {
  var index = start
  var nodes = out.nodes
  while (true) {
    index = firstNodeOfInterest(nodes, index)
    if (index < 0) break
    var n = nodes[index]
    if (mode === 'intersect' && n.loop && !n.inside) {
      visitLoop(nodes, index)
      continue
    } else if (mode === 'union' && n.loop && n.inside) {
      visitLoop(nodes, index)
      continue
    } else if (mode === 'difference' && n.loop && !n.inside && index >= out.la) {
      visitLoop(nodes, index)
      continue
    } else if (mode === 'difference' && n.loop && n.inside && index < out.la) {
      visitLoop(nodes, index)
      continue
    }
    var ring = []
    for (var i = index; i >= 0 && !n.visited; i = n.neighbor, n = nodes[i]) {
      var fwd = n.entry
      while (!n.visited) {
        n.visited = true
        ring.push(get(nodes,i))
        i = fwd ? n.next : n.prev
        n = nodes[i]
        if (n.intersect) {
          n.visited = true
          break
        }
      }
    }
    if (ring.length < 3) continue // if for some reason...
    for (var i = 0; i < coordinates.length; i++) {
      if (ringInsideRings(pip, ring, coordinates[i], epsilon, distance)) {
        coordinates[i].push(ring)
        break
      }
    }
    if (i === coordinates.length) coordinates.push([ring])
  }
}

function visitLoop(nodes, index) {
  var i = index
  var n = nodes[i]
  n.visited = true
  do {
    i = n.next
    n = nodes[i]
    n.visited = true
  } while (i !== index)
}

function ringInsideRings(pip, ring, P, epsilon, distance) {
  // find first point in ring not equal to any point in P
  for (var i = 0; i < ring.length; i++) {
    J: for (var j = 0; j < P.length; j++) {
      for (var k = 0; k < P[j].length; k++) {
        if (distance(ring[i],P[j][k]) <= epsilon) {
          break J
        }
      }
    }
    if (j === P.length) break
  }
  if (i === ring.length) return false // same ring
  if (!pip(ring[i], P[0])) return false
  for (var j = 1; j < P.length; j++) {
    if (pip(ring[i],P[j])) return false
  }
  return true
}
