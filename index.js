// https://davis.wpi.edu/~matt/courses/clipping/

var calcNodes = require('./lib/nodes.js')
var mpip = require('./lib/mpip.js')
var getDepth = require('./lib/get-depth.js')
var mopts = {}
var out = { nodes: null, coordinates: null, rings: null, la: 0, lb: 0 }
var defaultEpsilon = 1e-8

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
  out.coordinates = []
  out.rings = []
  if (mode === undefined) mode = opts.mode
  calcNodes(out, A, B, opts, mode)
  if (mode === 'divide') {
    clipNodes(out, A, B, opts, 'difference')
    nestRings(out, opts)
    flipEntry(out.nodes, 0) // emulates re-marking as intersect
    for (var i = 0; i < out.nodes.length; i++) {
      out.nodes[i].visited = false
    }
    out.rings = []
    clipNodes(out, A, B, opts, 'intersect')
    nestRings(out, opts)
  } else {
    clipNodes(out, A, B, opts, mode)
    nestRings(out, opts)
  }
  if (opts.duplicate) {
    var epsilon = opts.epsilon !== undefined ? opts.epsilon : defaultEpsilon
    var distance = opts.distance
    for (var i = 0; i < out.coordinates.length; i++) {
      for (var j = 0; j < out.coordinates[i].length; j++) {
        var cs = out.coordinates[i][j]
        if (distance(cs[0],cs[cs.length-1]) > epsilon) cs.push(cs[0])
      }
    }
  }
  return out.coordinates
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
  if (mode === undefined) mode = opts.mode
  walk(out, 0, mode, opts)
  if (mode === 'exclude') {
    for (var i = 0; i < out.nodes.length; i++) {
      var n = out.nodes[i]
      n.visited = false
      if (n.intersect) n.entry = !n.entry
    }
  }
  walk(out, out.la, mode, opts)
  return out.coordinates
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

function walk(out, start, mode, opts) {
  var rings = []
  var get = opts.get || getPoint
  var epsilon = opts.epsilon || defaultEpsilon
  var distance = opts.distance
  var area = opts.area
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
    var ring = [], prev = null, previ = -1
    for (var i = index; i >= 0 && !n.visited; i = n.neighbor, n = nodes[i]) {
      var fwd = n.entry
      while (!n.visited) {
        n.visited = true
        var ni = fwd ? n.next : n.prev
        var nn = nodes[ni]
        var dup = !(!prev || !(distance(prev.point, n.point) < epsilon))
        var last = nn.intersect && nodes[nn.neighbor].visited
        if (prev && !dup && last && distance(n.point, nn.point) < epsilon) {
          dup = true
        }
        if (!dup) {
          ring.push(get(nodes,i))
        }
        prev = n
        previ = i
        i = ni
        n = nn
        if (n.intersect) {
          n.visited = true
          break
        }
      }
    }
    if (ring.length < 3) continue // if for some reason...
    if (!area || !(Math.abs(area(ring)) < epsilon)) {
      out.rings.push(ring)
    }
  }
}

function nestRings(out, opts) {
  var pip = opts.pointInPolygon
  var epsilon = opts.epsilon || defaultEpsilon
  var distance = opts.distance
  var counts = Array(out.rings.length).fill(0)
  var inside = Array(out.rings.length)
  for (var i = 0; i < out.rings.length; i++) {
    for (var j = 0; j < out.rings.length; j++) {
      if (i === j) continue
      var k = getRingFirst(out.rings[i], out.rings[j], opts)
      if (k < 0 || pip(out.rings[i][k], out.rings[j])) {
        counts[i]++
        if (inside[i] === undefined) {
          inside[i] = [j]
        } else {
          inside[i].push(j)
        }
      }
    }
  }
  var top = {}
  for (var i = 0; i < out.rings.length; i++) {
    if (counts[i]%2 === 0) { // not hole
      top[i] = out.coordinates.length
      out.coordinates.push([out.rings[i]])
    }
  }
  for (var i = 0; i < out.rings.length; i++) {
    if (counts[i]%2 === 1) { // hole
      if (!inside[i]) continue // <-- shouldn't happen but who knows
      var highest = -1, ih = -1
      for (var j = 0; j < inside[i].length; j++) {
        var k = inside[i][j]
        if (counts[k]%2 === 0 && counts[k] > highest) {
          highest = counts[k]
          ih = k
        }
      }
      if (ih >= 0) out.coordinates[top[ih]].push(out.rings[i])
      else out.coordinates.push([out.rings[i]])
    }
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

function getRingFirst(a, b, opts) {
  var epsilon = opts.epsilon || defaultEpsilon
  var distance = opts.distance
  for (var i = 0; i < a.length; i++) {
    for (var j = 0; j < b.length; j++) {
      if (distance(a[i],b[j]) < epsilon) break
    }
    if (j === b.length) return i
  }
  return -1
}
