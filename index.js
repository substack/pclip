// https://davis.wpi.edu/~matt/courses/clipping/

var calcNodes = require('./lib/nodes.js')
var mopts = { mode: 0 }
var out = { npoints: [], nodes: [], la: 0, lb: 0 }

module.exports = clip

module.exports.intersect = function intersect(A, B, opts) {
  if (!opts) opts = mopts
  opts.mode = 'intersect'
  return clip(A, B, opts)
}
module.exports.exclude = function exclude(A, B, opts) {
  if (!opts) opts = mopts
  opts.mode = 'exclude'
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
  calcNodes(out, A, B, opts)
  return clipNodes(out, A, B, opts)
}

function firstNodeOfInterest(nodes, start) {
  var i = start, pstart = start, n = nodes[i]
  while (true) {
    if (!(!n.intersect || (n.intersect && n.visited))) {
      break
    }
    i = n.next
    n = nodes[i]
    /*
    if (i === pstart) {
      i = n.nextPolygon
      pstart = i
      n = nodes[i]
    }
    */
    if (i === start) break
  }
  return i
}

function clipNodes(out, A, B, opts) {
  var nodes = out.nodes, C = out.npoints
  var get = opts.get || getPoint
  var mode = opts.mode
  var la = out.la, lb = out.lb
  var pointInPolygon = opts.pointInPolygon

  if (C.length === 0 && mode === 'intersect' && out.dB === 2) {
    if (pointInPolygon(nodes[0].point, B)) { // A inside B
      return [[A]]
    } else if (out.dA === 2) { // B inside A
      return [[B]]
    } else if (out.dA === 3) { // B inside A
      return [B]
    } else if (out.dA === 4) { // B inside A
      return B
    }
  } else if (C.length === 0 && mode === 'intersect' && out.dB === 3) {
    throw new Error('todo')
  } else if (C.length === 0 && mode === 'intersect' && out.dB === 4) {
    throw new Error('todo')
  }

  if (C.length === 0 && (mode === 'exclude' || mode === 'difference') && out.dB === 2) {
    if (pointInPolygon(nodes[0].point, B)) { // A inside B
      return [[B,A]]
    } else if (out.dA === 2) { // B inside A
      return [[A,B]]
    } else if (out.dA === 3) { // B inside A
      return [A.concat(B)]
    } else if (out.dA === 4) { // B inside A
      var r = A.slice()
      r[0] = r[0].concat(B)
      return r
    }
  } else if (C.length === 0 && (mode === 'exclude' || mode === 'difference') && out.dB === 3) {
    throw new Error('todo')
  } else if (C.length === 0 && (mode === 'exclude' || mode === 'difference') && out.dB === 4) {
    throw new Error('todo')
  }

  if (C.length === 0 && mode === 'union' && out.dB === 2) {
    if (pointInPolygon(nodes[0].point, B)) { // A inside B
      return [[B]]
    } else if (out.dA === 2) { // B inside A
      return [[A]]
    } else if (out.dA === 3) { // B inside A
      return [A]
    } else if (out.dA === 4) { // B inside A
      return A
    }
  } else if (C.length === 0 && mode === 'union' && out.dB === 3) {
    throw new Error('todo')
  } else if (C.length === 0 && mode === 'union' && out.dB === 4) {
    throw new Error('todo')
  }

  var coordinates = []
  walk(pointInPolygon, coordinates, nodes, 0, get)
  // unvisited holes:
  for (var i = 0; i < la+lb; i++) {
    var n = nodes[i]
    if (!n.visited && n.hole) {
      var ring = walkHole(nodes, i, get)
      if (!ring) continue
      for (var j = 0; j < coordinates.length; j++) {
        if (pointInPolygon(ring[0], coordinates[j][0])) {
          coordinates[j].push(ring)
          break
        }
      }
    }
  }
  if (mode === 'exclude') {
    for (var i = 0; i < nodes.length; i++) {
      nodes[i].visited = false
      if (nodes[i].intersect) nodes[i].entry = !nodes[i].entry
    }
    walk(pointInPolygon, coordinates, nodes, la, get)
  }
  return coordinates
}

function getPoint(nodes,i) {
  return nodes[i].point
}

function walk(pointInPolygon, coordinates, nodes, start, get) {
  var index = -1
  while ((index = firstNodeOfInterest(nodes, start)) !== start) {
    var n = nodes[index]
    var ring = []
    for (; !n.visited; index = n.neighbor, n = nodes[index]) {
      var fwd = n.entry
      n.visited = true
      while (true) {
        ring.push(get(nodes,index))
        index = fwd ? n.next : n.prev
        n = nodes[index]
        n.visited = true
        if (n.intersect) break
      }
    }
    for (var i = 0; i < coordinates.length; i++) {
      if (pointInPolygon(ring[0], coordinates[i][0])) {
        coordinates[i].push(ring)
        break
      }
    }
    if (i === coordinates.length) coordinates.push([ring])
  }
}

function walkHole(nodes, start, get) {
  var index = start
  var n = nodes[index]
  var ring = null
  for (; !n.visited; index = n.neighbor, n = nodes[index]) {
    var fwd = n.entry
    if (ring === null) ring = []
    n.visited = true
    while (true) {
      ring.push(get(nodes,index))
      index = fwd ? n.next : n.prev
      n = nodes[index]
      n.visited = true
      if (n.intersect) break
      if (index === start) break
    }
    if (index === start) break
  }
  if (ring !== null && ring.length < 3) return null
  return ring
}
