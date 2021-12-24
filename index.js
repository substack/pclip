// https://davis.wpi.edu/~matt/courses/clipping/

var calcNodes = require('./lib/nodes.js')
var ptEq = require('./lib/pteq.js')
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
module.exports.divide = function divide(A, B, opts) {
  if (!opts) opts = mopts
  return clip(A, B, opts, 'divide')
}

function clip(A, B, opts, mode) {
  out.npoints = []
  out.nodes = []
  if (mode === undefined) mode = opts.mode
  calcNodes(out, A, B, opts, mode)
  if (mode === 'divide') {
    var a = clipNodes(out, A, B, opts, 'difference')
    flipEntry(out.nodes, 0) // emulates re-marking as intersect
    for (var i = 0; i < out.nodes.length; i++) {
      out.nodes[i].visited = false
    }
    var b = clipNodes(out, A, B, opts, 'intersect')
    return a.concat(b)
  } else {
    return clipNodes(out, A, B, opts, mode)
  }
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

function clipNodes(out, A, B, opts, mode) {
  var nodes = out.nodes, C = out.npoints
  var get = opts.get || getPoint
  if (mode === undefined) mode = opts.mode
  var epsilon = opts.epsilon !== undefined ? opts.epsilon : 1e-8
  var la = out.la, lb = out.lb
  var pip = opts.pointInPolygon
  var coordinates = [], holeQueue = []
  walk(pip, coordinates, holeQueue, out, 0, get, mode, epsilon)
  if (mode === 'divide') {
    for (var i = 0; i < nodes.length; i++) {
      nodes[i].visited = false
    }
    flipEntry(nodes, 0) // emulates re-marking as intersect
  } else if (mode === 'exclude') {
    for (var i = 0; i < nodes.length; i++) {
      var n = nodes[i]
      n.visited = false
      if (n.intersect) n.entry = !n.entry
    }
  }
  walk(pip, coordinates, holeQueue, out, la, get, mode, epsilon)
  if (holeQueue.length > 0) {
    for (var i = 0; i < holeQueue.length; i++) {
      insertRing(pip, coordinates, holeQueue[i], epsilon)
    }
  }
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

function walk(pip, coordinates, holeQueue, out, start, get, mode, epsilon) {
  var index = start
  var nodes = out.nodes
  while (true) {
    index = firstNodeOfInterest(nodes, index)
    if (index < 0) break
    var n = nodes[index]
    if (mode === 'divide' && n.inside && n.loop && n.hole) {
    } else if (mode === 'divide' && n.loop && !n.inside && index >= out.la) {
      visitLoop(nodes, index)
      continue
    } else if (mode === 'divide' && n.loop && n.inside && index < out.la) {
      visitLoop(nodes, index)
      continue
    } else if (mode === 'intersect' && n.loop && !n.inside) {
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
    var isHole = mode === 'divide' && n.loop && n.inside && n.hole
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
    if (!insertRing(pip, coordinates, ring, epsilon)) {
      if (isHole) holeQueue.push(ring)
      else coordinates.push([ring])
    }
  }
}

function insertRing(pip, coordinates, ring, epsilon) {
  for (var i = 0; i < coordinates.length; i++) {
    if (ringInsideRings(pip, ring, coordinates[i], epsilon)) {
      coordinates[i].push(ring)
      return true
    }
  }
  return false
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

function ringInsideRings(pip, ring, P, epsilon) {
  // find first point in ring not equal to any point in P
  for (var i = 0; i < ring.length; i++) {
    J: for (var j = 0; j < P.length; j++) {
      for (var k = 0; k < P[j].length; k++) {
        if (ptEq(ring[i],P[j][k],epsilon)) {
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
