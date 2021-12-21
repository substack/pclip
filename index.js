// https://davis.wpi.edu/~matt/courses/clipping/

var calcNodes = require('./lib/nodes.js')
var mopts = { mode: 0 }
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
    if (i === start) break
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
  var index = -1
  var nodes = out.nodes
  while ((index = firstNodeOfInterest(nodes, start)) !== start) {
    var n = nodes[index]
    if (mode === 'intersect' && n.loop && !n.inside) {
      n.visited = true
      continue
    }
    if (mode === 'union' && n.loop && n.inside) {
      n.visited = true
      continue
    }
    if (mode === 'difference' && n.loop && !n.inside && index >= out.la) {
      n.visited = true
      continue
    }
    var ring = []
    for (; index >= 0 && !n.visited; index = n.neighbor, n = nodes[index]) {
      var fwd = n.entry
      while (!n.visited) {
        n.visited = true
        ring.push(get(nodes,index))
        index = fwd ? n.next : n.prev
        n = nodes[index]
        if (n.intersect) {
          n.visited = true
          break
        }
      }
    }
    if (ring.length < 3) continue
    for (var i = 0; i < coordinates.length; i++) {
      if (ringInsideRing(pip, ring, coordinates[i][0])) {
        coordinates[i].push(ring)
        break
      }
    }
    if (i === coordinates.length) coordinates.push([ring])
  }
}

function ptEq(a,b,epsilon) {
  if (epsilon === undefined) epsilon = 1e-8
  if (Math.abs(a[0]-b[0]) > epsilon) return false
  if (Math.abs(a[1]-b[1]) > epsilon) return false
  return true
}

function ringInsideRing(pip, r0, r1) {
  // find first point in r0 not equal to any point in r1
  for (var i = 0; i < r0.length; i++) {
    for (var j = 0; j < r1.length; j++) {
      if (ptEq(r0[i],r1[j])) {
        break
      }
    }
    if (j === r1.length) break
  }
  if (i === r0.length) return false // same ring
  return pip(r0[i], r1)
}
