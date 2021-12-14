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
  calcNodes(out, A, B, opts)
  return clipNodes(out, A, B, opts)
}

function firstNodeOfInterest(nodes, start) {
  var i = start, n = nodes[i];
  do {
    i = n.next;
    n = nodes[i];
  } while (i < nodes.length && i !== start && (!n.intersect || (n.intersect && n.visited)));
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

  if (C.length === 0 && (mode === 'xor' || mode === 'difference') && out.dB === 2) {
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
  } else if (C.length === 0 && (mode === 'xor' || mode === 'difference') && out.dB === 3) {
    throw new Error('todo')
  } else if (C.length === 0 && (mode === 'xor' || mode === 'difference') && out.dB === 4) {
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
  var rings = []

  var start = mode === 'union' ? la : 0
  while ((index = firstNodeOfInterest(nodes, start)) !== start) {
    var n = nodes[index]
    var ring = []
    for (; !n.visited; index = n.neighbor, n = nodes[index]) {
      ring.push(get(nodes,index))
      var fwd = n.entry
      while (true) {
        n.visited = true
        index = fwd ? n.next : n.prev
        n = nodes[index]
        if (n.intersect) {
          n.visited = true
          break
        } else {
          ring.push(get(nodes,index))
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
        ring.push(get(nodes,index))
        var fwd = n.entry
        while (true) {
          n.visited = true
          index = fwd ? n.next : n.prev
          n = nodes[index]
          if (n.intersect) {
            n.visited = true
            break
          } else {
            ring.push(get(nodes,index))
          }
        }
      }
      rings.push(ring)
    }
    coordinates.push(rings)
  }
  return coordinates
}

function getPoint(nodes,i) {
  return nodes[i].point
}
