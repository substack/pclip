// https://davis.wpi.edu/~matt/courses/clipping/

var calcNodes = require('./lib/nodes.js')
var mpip = require('./lib/mpip.js')
var mopts = {}
var out = { nodes: null, coordinates: null, rings: null, la: 0, lb: 0, A: null, B: null }
var defaultEpsilon = 1e-8
var v0 = [0,0]

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
  out.A = A
  out.B = B
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
  var lerp = opts.lerp
  var pip = opts.pointInPolygon
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
      var nprev = nodes[n.prev], nnext = nodes[n.next]
      /*
      if (n.intersect && nnext.intersect && Math.abs(n.alpha - nnext.alpha) < epsilon) {
        console.log('begin0', n.point)
      } else if (n.intersect && nprev.intersect && Math.abs(n.alpha - nprev.alpha) < epsilon) {
        console.log('begin1', n.point)
      }
      if (n.intersect) console.log(n.point)
      */
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
      var nprev = nodes[n.prev], nnext = nodes[n.next]
      var nnb = nnext.neighbor >= 0 ? nodes[nnext.neighbor] : null
      var nnbn = nnb ? nodes[nnb.next] : null
      var nnbp = nnb ? nodes[nnb.prev] : null
      var npb = nprev.neighbor >= 0 ? nodes[nprev.neighbor] : null
      var npbn = npb ? nodes[npb.next] : null
      var npbp = npb ? nodes[npb.prev] : null
      /*
      console.log(
        n.point, n.intersect, n.alpha,
        nprev.point, nprev.intersect, nprev.alpha,
        nnext.point, nnext.intersect, nnext.alpha
      )
      console.log(
        nnb ? nnb.point : null, nnb ? nnb.intersect : null, nnb ? nnb.alpha : null,
        nnbn ? nnbn.point : null, nnbn ? nnbn.intersect : null, nnbn ? nnbn.alpha : null,
        nnbp ? nnbp.point : null, nnbp ? nnbp.intersect : null, nnbp ? nnbp.alpha : null,
        npb ? npb.point : null, npb ? npb.intersect : null, npb ? npb.alpha : null,
        npbn ? npbn.point : null, npbn ? npbn.intersect : null, npbn ? npbn.alpha : null,
        npbp ? npbp.point : null, npbp ? npbp.intersect : null, npbp ? npbp.alpha : null,
      )
      */
      if (n.intersect && nnext.intersect && Math.abs(n.alpha - nnext.alpha) < epsilon) {
        console.log('ONE', n.point)
      } else if (n.intersect && nprev.intersect && Math.abs(n.alpha - nprev.alpha) < epsilon) {
        var nb0 = nodes[n.neighbor]
        var nb1 = nodes[nprev.neighbor]
        console.log('TWO', n.point, nb0.point, nb0.index, nb1.point, nb1.index)
        console.log(n.polygon, n.ring, nprev.polygon, nprev.ring)
        console.log(nb0.polygon, nb0.ring, nb1.polygon, nb1.ring)
        /*
        if (nb0.ring !== nb1.ring) {
          var X0 = nb0.polygon === 0 ? out.A : out.B
          var X1 = nb1.polygon === 0 ? out.A : out.B
          var r0 = X0[nb0.ring][0]
          var r1 = X1[nb1.ring][0]
          lerp(v0, n.point, nprev.point, epsilon)
          console.log('one', n.polygon, n.point, pip(v0, r0), pip(v0, r1),
            v0, JSON.stringify(r0), JSON.stringify(r1),
          )
          if (!pip(v0,r0) && pip(v0,r1)) {
            n = nprev
            i = n.index
          }
        } else {
          console.log('two')
        }
        */
      } else if (npb && npbn && npb.intersect && npbn.intersect && Math.abs(npb.alpha - npbn.alpha) < epsilon) {
        console.log('THREE', npb.point)
      } else if (npb && npbp && npb.intersect && npbp.intersect && Math.abs(npb.alpha - npbp.alpha) < epsilon) {
        console.log('FOUR', npb.point)
      } else if (nnb && nnbn && nnb.intersect && nnbn.intersect && Math.abs(nnb.alpha - nnbn.alpha) < epsilon) {
        console.log('FIVE', nnb.point)
      } else if (nnb && nnbp && nnb.intersect && nnbp.intersect && Math.abs(nnb.alpha - nnbp.alpha) < epsilon) {
        console.log('SIX', nnb.point)
      }

      /*
      if (fwd && n.intersect && nnext.intersect && Math.abs(n.alpha - nnext.alpha) < epsilon) {
        var nb0 = nodes[n.neighbor]
        var nb1 = nodes[nnext.neighbor]
        if (nb0.ring !== nb1.ring) {
          var X0 = nb0.polygon === 0 ? out.A : out.B
          var X1 = nb1.polygon === 0 ? out.A : out.B
          var r0 = X0[nb0.ring][0]
          var r1 = X1[nb1.ring][0]
          lerp(v0, n.point, nprev.point, epsilon)
          console.log('one', n.polygon, n.point, pip(v0, r0), pip(v0, r1),
            v0, JSON.stringify(r0), JSON.stringify(r1),
          )
          if (!pip(v0,r0) && pip(v0,r1)) {
            n = nnext
            i = n.index
          }
        } else {
          console.log('two')
        }
      } else if (n.intersect && nprev.intersect && Math.abs(n.alpha - nprev.alpha) < epsilon) {
        var nb0 = nodes[n.neighbor]
        var nb1 = nodes[nprev.neighbor]
        if (nb0.ring !== nb1.ring) {
          var X0 = nb0.polygon === 0 ? out.A : out.B
          var X1 = nb1.polygon === 0 ? out.A : out.B
          var r0 = X0[nb0.ring][0]
          var r1 = X1[nb1.ring][0]
          lerp(v0, n.point, nnext.point, epsilon)
          console.log('three', n.polygon, n.point, pip(v0, r0), pip(v0, r1),
            v0, JSON.stringify(r0), JSON.stringify(r1),
          )
          if (pip(v0,r0) && pip(v0,r1)) {
            n = nprev
            i = n.index
          }
        } else {
          var X0 = n.polygon === 0 ? out.A : out.B
          var X1 = nprev.polygon === 0 ? out.A : out.B
          console.log(
            n.polygon, n.ring, nprev.polygon, nprev.ring,
            nb0.polygon, nb0.ring, nb1.polygon, nb1.ring,
          )
          var r0 = X0[n.ring][0]
          var r1 = X1[nprev.ring][0]
          lerp(v0, n.point, nnext.point, epsilon)
          console.log('four', n.polygon, n.point, pip(v0, r0), pip(v0, r1),
            v0, JSON.stringify(r0), JSON.stringify(r1),
          )
          if (pip(v0,r0) && pip(v0,r1)) {
            n = nprev
            i = n.index
          }
        }
      }
      */
      /*
      if (false) {
      } else if (Math.abs(n.alpha - nodes[n.prev].alpha) < epsilon) {
        var nb = nodes[n.neighbor]
        var nnb = nodes[nodes[n.prev].neighbor]
        console.log('prev',
          n.point,
          n.polygon, n.ring,
          nb.polygon, nb.ring,
          nnb.polygon, nnb.ring
        )
        for (var nn = nodes[n.next]; !nn.intersect && nn.index !== n.index; nn = nodes[nn.next]);
        for (var np = nodes[nodes[n.prev].prev]; !np.intersect && np.index !== n.index; np = nodes[np.prev]);
        var nnb = nodes[nn.neighbor]
        var npb = nodes[np.neighbor]
        console.log(nnb.polygon, nnb.ring, npb.polygon, npb.ring)
        if (nnb.polygon !== nb.polygon || nnb.ring !== nb.ring) {
          i = n.prev
          n = nodes[i]
        }
      } else if (Math.abs(n.alpha - nodes[n.next].alpha) < epsilon) {
        var nb = nodes[n.neighbor]
        var nnb = nodes[nodes[n.next].neighbor]
        console.log('next',
          n.point,
          n.polygon, n.ring,
          nb.polygon, nb.ring,
          nnb.polygon, nnb.ring
        )
        for (var nn = nodes[nodes[n.next].next]; !nn.intersect && nn.index !== n.index; nn = nodes[nn.next]);
        for (var np = nodes[n.prev]; !np.intersect && np.index !== n.index; np = nodes[np.prev]);
        var nnb = nodes[nn.neighbor]
        var npb = nodes[np.neighbor]
        console.log(nnb.polygon, nnb.ring, npb.polygon, npb.ring)
        if (nnb.polygon !== nb.polygon || nnb.ring !== nb.ring) {
          i = n.next
          n = nodes[i]
        }
      }
      */
    }
    if (ring.length < 3) continue // if for some reason...
    for (var i = 0; i < ring.length; i++) {
      var a = ring[i]
      var b = ring[(i+2)%ring.length]
      if (Math.abs(distance(a,b)) < epsilon) {
        ring.splice(i+1,2)
      }
    }
    if (ring.length < 3) continue // if for some reason...
    out.rings.push(ring)
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
