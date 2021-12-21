// https://davis.wpi.edu/~matt/courses/clipping/

var calcNodes = require('./lib/nodes.js')
var mopts = {}
var out = { npoints: [], nodes: [], la: 0, lb: 0 }

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

function clip(A, B, opts, mode) {
  out.npoints = []
  out.nodes = []
  calcNodes(out, A, B, opts, mode)
  return clipNodes(out, A, B, opts, mode)
}

function firstNodeOfInterest(nodes, start) {
  var i = start, pstart = start, n = nodes[i]
  while (true) {
    i = n.next
    n = nodes[i]
    if (n.intersect && !n.visited) break
    if (n.loop && !n.visited) break
    if (i === pstart) {
      i = n.nextPolygon
      pstart = i
      n = nodes[i]
    }
    if (i === start) return -1
  }
  return i
}

function clipNodes(out, A, B, opts, mode) {
  var nodes = out.nodes, C = out.npoints
  var get = opts.get || getPoint
  if (mode === undefined) mode = opts.mode
  var la = out.la, lb = out.lb
  var pip = opts.pointInPolygon
  var coordinates = []
  walk(pip, coordinates, out, 0, get, mode)
  if (mode === 'exclude') {
    for (var i = 0; i < nodes.length; i++) {
      var n = nodes[i]
      n.visited = false
      if (n.intersect) n.entry = !n.entry
    }
  }
  walk(pip, coordinates, out, la, get, mode)
  return coordinates
}

function getPoint(nodes,i) {
  return nodes[i].point
}

function walk(pip, coordinates, out, start, get, mode) {
  var index = start
  var nodes = out.nodes
  while (true) {
    index = firstNodeOfInterest(nodes, index)
    if (index < 0) break
    var n = nodes[index]
    if (mode === 'intersect' && n.loop && !n.inside) {
      visitLoop(nodes, index)
      continue
    }
    if (mode === 'union' && n.loop && n.inside) {
      visitLoop(nodes, index)
      continue
    }
    if (mode === 'difference' && n.loop && !n.inside && index >= out.la) {
      visitLoop(nodes, index)
      continue
    }
    if (mode === 'difference' && n.loop && n.inside && index < out.la) {
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
      if (ringInsideRings(pip, ring, coordinates[i])) {
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

function ptEq(a,b,epsilon) {
  if (epsilon === undefined) epsilon = 1e-8
  if (Math.abs(a[0]-b[0]) > epsilon) return false
  if (Math.abs(a[1]-b[1]) > epsilon) return false
  return true
}

function ringInsideRings(pip, ring, P) {
  // find first point in ring not equal to any point in P
  for (var i = 0; i < ring.length; i++) {
    J: for (var j = 0; j < P.length; j++) {
      for (var k = 0; k < P[j].length; k++) {
        if (ptEq(ring[i],P[j][k])) {
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
