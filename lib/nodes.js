var mpip = require('./mpip.js')
var v0 = [0,0], v1 = [0,0]
var defaultEpsilon = 1e-8

module.exports = function (out, A, B, opts, mode) {
  out.la = out.lb = out.dA = out.dB = 0
  var distance = opts.distance
  var epsilon = opts.epsilon || defaultEpsilon
  if (mode === undefined) mode = opts.mode
  var intersect = opts.intersect
  var pip = opts.pointInPolygon
  var lerp = opts.lerp

  // phase one part one: build node lists
  var index = 0
  out.dA = getDepth(A)
  out.dB = getDepth(B)
  var aStart = 0, aEnd = 0, bStart = 0, bEnd = 0
  for (var ip = 0; ip < 2; ip++) {
    var P = ip === 0 ? A : B
    var d = ip === 0 ? out.dA : out.dB
    var polygonStart = index
    if (d === 2) { // single polygon with no holes
      var nextPolygon = index
      var lp = P.length
      if (distance(P[0],P[lp-1]) <= epsilon) lp--
      for (var i = 0; i < lp; i++) {
        insert(out.nodes, i, P[i], index, lp, nextPolygon, false, 0, ip)
      }
      index += lp
      if (ip === 0) aEnd = bStart = index
      if (ip === 1) bEnd = index
    } else if (d === 3) { // single polygon with holes
      for (var i = 0; i < P.length; i++) {
        var lp = P[i].length
        if (distance(P[i][0],P[i][lp-1]) <= epsilon) lp--
        var nextPolygon = i === P.length - 1 ? polygonStart : index + lp
        for (var j = 0; j < lp; j++) {
          insert(out.nodes, j, P[i][j], index, lp, nextPolygon, i > 0, 0, ip)
        }
        index += lp
      }
      if (ip === 0) aEnd = bStart = index
      if (ip === 1) bEnd = index
    } else if (d === 4) { // multi-polygon with holes
      for (var i = 0; i < P.length; i++) {
        for (var j = 0; j < P[i].length; j++) {
          var lp = P[i][j].length
          if (distance(P[i][j][0],P[i][j][lp-1]) <= epsilon) lp--
          var nextPolygon = i === P.length-1 && j === P[i].length-1 ? polygonStart : index + lp
          for (var k = 0; k < lp; k++) {
            insert(out.nodes, k, P[i][j][k], index, lp, nextPolygon, j > 0, i, ip)
          }
          index += lp
        }
      }
      if (ip === 0) aEnd = bStart = index
      if (ip === 1) bEnd = index
    } else {
      throw new Error('unexpected polygon depth: ' + d)
    }
  }
  out.la = aEnd-aStart
  out.lb = bEnd-bStart

  // phase one part two point one: mark points exactly on an edge
  for (var k = 0; k < 2; k++) {
    var xStart = k === 0 ? aStart : bStart
    var xEnd = k === 0 ? aEnd : bEnd
    var yStart = k === 0 ? bStart : aStart
    var yEnd = k === 0 ? bEnd : aEnd
    for (var i = xStart; i < xEnd; i++) {
      var P0 = out.nodes[i]
      var P1 = out.nodes[P0.originalNext]
      var d0 = distance(P0.point,P1.point)
      for (var j = yStart; j < yEnd; j++) {
        var X = out.nodes[j]
        var d1 = distance(P0.point,X.point)
        var d2 = distance(P1.point,X.point)
        if (!(Math.abs(d0-d1-d2) < epsilon)) continue
        if (X.border < 0) {
          X.border = i
          X.border0 = i
        } else if (X.border1 === undefined) {
          X.border1 = i
        }
      }
    }
  }

  // phase one part three
  for (var i = 0; i < 2; i++) {
    var start = i === 0 ? aStart : bStart
    var end = i === 0 ? aEnd : bEnd
    for (var j = start; j < end; j++) {
      var n = out.nodes[j]
      for (var k = 0; k < 1; k++) {
        var border = k === 0 ? n.border : n.border1
        if (!(border >= 0)) continue
        var A0 = n
        var A1 = out.nodes[A0.originalNext]
        var B0 = out.nodes[border]
        var B1 = out.nodes[B0.originalNext]
        cutEdge(out, [n.point[0],n.point[1]], A0, A1, B0, B1, A, B, opts, true)
      }
    }
  }

  // phase one part two point two: calculate intersections
  for (var i = aStart; i < aEnd; i++) {
    var A0 = out.nodes[i]
    var A1 = out.nodes[A0.originalNext]
    for (var j = bStart; j < bEnd; j++) {
      if (A0.border === j) continue
      if (A1.border === j) continue
      var B0 = out.nodes[j]
      var B1 = out.nodes[B0.originalNext]
      if (B0.border === i) continue
      if (B1.border === i) continue
      if (!intersect(v0, A0.point, A1.point, B0.point, B1.point)) continue
      cutEdge(out, [v0[0],v0[1]], A0, A1, B0, B1, A, B, opts, false)
    }
  }

  // phase one part three: cut edges again for borders
  var len = out.nodes.length
  for (var j = bEnd; j < len; j++) {
    var n = out.nodes[j]
    if (!n.intersect) continue
    if (n.alpha > epsilon && n.alpha < 1-epsilon) continue
    var A0 = n
    var A1 = out.nodes[A0.originalNext]
    var A2 = out.nodes[A0.originalPrev]
    if (distance(A0.point,A1.point) < epsilon) {
      //console.log('A1')
      A1 = out.nodes[A1.next]
    }
    if (distance(A0.point,A2.point) < epsilon) {
      //console.log('A2')
      A2 = out.nodes[A2.prev]
    }
    var B0 = out.nodes[A0.neighbor]
    var B1 = out.nodes[B0.originalNext]
    var B2 = out.nodes[B0.originalPrev]
    if (distance(B0.point,B1.point) < epsilon) {
      //console.log('B1')
      B1 = out.nodes[B1.next]
    }
    if (distance(B0.point,B2.point) < epsilon) {
      //console.log('B2')
      B2 = out.nodes[B2.prev]
    }
    var c0 = collinear4(A0.point, A1.point, B1.point, B2.point, opts)
    var c1 = collinear4(A0.point, A2.point, B1.point, B2.point, opts)
    var c2 = collinear3(A0.point, A1.point, A2.point, opts)
    var c3 = collinear3(B0.point, B1.point, B2.point, opts)
    var c4 = collinear4(A0.point, A1.point, B0.point, B1.point, opts)
    var c5 = collinear4(A0.point, A1.point, B0.point, B2.point, opts)
    var c6 = collinear4(A0.point, A2.point, B0.point, B1.point, opts)
    var c7 = collinear4(A0.point, A2.point, B0.point, B2.point, opts)
    console.log(
      A0.point.map(x => x.toFixed(2)).join(','),
      A0.point.join(','), A1.point.join(','), A2.point.join(','),
      ':',
      B0.point.join(','), B1.point.join(','), B2.point.join(','),
      ':',
      [A0.intersect,A1.intersect,A2.intersect].map(x => x ? '1' : '0').join(''),
      [B0.intersect,B1.intersect,B2.intersect].map(x => x ? '1' : '0').join(''),
      [c0,c1,c2,c3,c4,c5,c6,c7].map(x => x ? '1' : '0').join(''),
      [A0.border, A1.border, A2.border, B0.border, B1.border, B2.border]
        .map(x => String(x).padStart(3)).join(' '),
    )
    if (c0 && !c1 && !A1.intersect && !A2.intersect && !B1.intersect && !B2.intersect) {
      console.log('cut1')
      cutEdge(out, [n.point[0],n.point[1]], A0, A1, B0, B1, A, B, opts, true)
    } else if (!c0 && c1 && !A1.intersect && A2.intersect) {
      console.log('cut2')
      cutEdge(out, [n.point[0],n.point[1]], A0, A1, B0, B1, A, B, opts, true)
    } else if (!c0 && !c1 && !c7 && A1.border < 0 && A2.border < 0) {
      var ring0 = getRing(out.nodes, B0.index)
      lerp(v0, A0.point, A1.point, epsilon)
      var m0 = pip(v0, ring0)
      lerp(v0, A0.point, A2.point, epsilon)
      var m1 = pip(v0, ring0)
      console.log(m0,m1, A1.border, A2.border)
      if (m0 !== m1) continue
      console.log('cut3')
      cutEdge(out, [n.point[0],n.point[1]], A2, A1, B2, B1, A, B, opts, true)
    }
  }

  // phase two: calculate entry/exit
  mark(pip, out.nodes, B, out.dB, 0, mode === 'intersect', opts)
  mark(pip, out.nodes, A, out.dA, bStart, mode !== 'union', opts)

  // phase three: set inside for non-intersecting polygons
  for (var i = 0; i < out.la+out.lb; i++) {
    var index = i
    while (true) {
      var n = out.nodes[index]
      if (n.intersect || n.visited) break
      n.visited = true
      if (n.next !== i) {
        index = n.next
        continue
      }
      // full loop with no intersections. rewind setting inside
      var inside = i < out.la
        ? mpip(pip,n.point,B,out.dB)
        : mpip(pip,n.point,A,out.dA)
      n.loop = true
      n.inside = inside
      while (index !== i) {
        index = n.prev
        n = out.nodes[index]
        n.loop = true
        n.inside = inside
      }
      break
    }
  }
  for (var i = 0; i < out.nodes.length; i++) {
    out.nodes[i].visited = false
  }
}

function cutEdge(out, point, A0, A1, B0, B1, A, B, opts, border) {
  var distance = opts.distance
  var epsilon = opts.epsilon || defaultEpsilon
  var lerp = opts.lerp
  var pip = opts.pointInPolygon
  var dA01 = distance(A0.point,A1.point)
  var dB01 = distance(B0.point,B1.point)
  var da0v = distance(A0.point,point)
  var db0v = distance(B0.point,point)
  var ialpha = da0v / dA01
  var jalpha = db0v / dB01
  if (!border && ialpha < epsilon || ialpha > 1-epsilon) return
  if (!border && jalpha < epsilon || jalpha > 1-epsilon) return

  var ix = splitAlpha(out, A0, A1, ialpha, opts)
  var jx = splitAlpha(out, B0, B1, jalpha, opts)

  var ia = out.nodes.length
  out.nodes.push({
    index: ia,
    point,
    next: out.nodes[ix].next,
    prev: ix,
    originalNext: out.nodes[ix].next,
    originalPrev: ix,
    neighbor: -1,
    intersect: true,
    entry: false,
    visited: false,
    alpha: ialpha,
    nextPolygon: out.nodes[ix].nextPolygon,
    hole: out.nodes[ix].hole,
    inside: false,
    loop: false,
    border: -1,
    ring: out.nodes[ix].ring,
    polygon: 0,
  })
  out.nodes[out.nodes[ix].next].prev = ia
  out.nodes[ix].next = ia

  var ib = out.nodes.length
  out.nodes.push({
    index: ib,
    point,
    next: out.nodes[jx].next,
    prev: jx,
    originalNext: out.nodes[jx].next,
    originalPrev: jx,
    neighbor: -1,
    intersect: true,
    entry: false,
    visited: false,
    alpha: jalpha,
    nextPolygon: out.nodes[jx].nextPolygon,
    hole: out.nodes[jx].hole,
    inside: false,
    loop: false,
    border: -1,
    ring: out.nodes[jx].ring,
    polygon: 1,
  })
  out.nodes[out.nodes[jx].next].prev = ib
  out.nodes[jx].next = ib

  out.nodes[ia].neighbor = ib
  out.nodes[ib].neighbor = ia
}

function mark(f, nodes, B, dB, start, flip, opts) {
  var index = start
  do {
    var n = nodes[index]
    var i = index
    while (n.intersect) {
      index = n.next
      n = nodes[index]
      if (i === index) break
    }
    var inside = !!(mpip(f, n.point, B, dB) ^ flip ^ n.hole)
    markEntries(nodes, index, inside, opts, B, dB)
    index = n.nextPolygon
  } while (index !== start)
}

function markEntries(nodes, start, inside, opts, B, dB) {
  var epsilon = opts.epsilon || defaultEpsilon
  var index = start
  do {
    var n = nodes[index]
    if (n.intersect) {
      n.entry = !!(inside ^ n.hole)
      inside = !inside
    }
    index = n.next
  } while (index !== start)
}

function insert(nodes, i, point, la, lb, nextPolygon, hole, ring, polygon) {
  var next = la+(i+1)%lb
  var prev = la+(i+lb-1)%lb
  nodes[la+i] = {
    index: la+i,
    point,
    next,
    originalNext: next,
    originalPrev: prev,
    prev,
    neighbor: -1,
    intersect: false,
    entry: false,
    visited: false,
    alpha: 0,
    hole,
    nextPolygon,
    inside: false,
    loop: false,
    border: -1,
    ring,
    polygon,
  }
}

function getRing(nodes, start) {
  var i = start
  var ring = []
  var n = nodes[i]
  while (true) {
    ring.push(n.point)
    n = nodes[n.next]
    if (n.index === start) break
  }
  return ring
}

function splitAlpha(out, a, b, alpha, opts) {
  var epsilon = opts.epsilon || defaultEpsilon
  var lerp = opts.lerp
  var pip = opts.pointInPolygon
  var n = a
  while (true) {
    var nn = out.nodes[n.next]
    if (!nn.intersect) break
    if (nn.index === b.index) break
    if (nn.index === a.index) break
    if (Math.abs(nn.alpha - alpha) < epsilon) {
      lerp(v0, nn.point, a.point, epsilon)
      var ring = getRing(out.nodes, nn.neighbor)
      var m0 = pip(v0, ring)
      if (!m0) break
    } else if (!(nn.alpha < alpha)) break
    n = nn
  }
  return n.index
}

function getDepth(x) {
  for (var d = 0; Array.isArray(x); d++) { x = x[0] }
  return d
}

function collinear4(A0, A1, B0, B1, opts) {
  var distance = opts.distance
  var epsilon = opts.epsilon || defaultEpsilon
  var d0 = distance(A0,A1)
  var d1 = distance(A0,B0)
  var d2 = distance(A0,B1)
  var d3 = distance(A1,B0)
  var d4 = distance(A1,B1)
  var d5 = distance(B0,B1)
  if (Math.abs(d3-d1-d2-d4) < epsilon) return true
  if (Math.abs(d4-d1-d2-d3) < epsilon) return true
  if (Math.abs(d0-d1-d5-d4) < epsilon) return true
  if (Math.abs(d0-d2-d5-d3) < epsilon) return true
  return false
}

function collinear3(A, B, C, opts) {
  var distance = opts.distance
  var epsilon = opts.epsilon || defaultEpsilon
  var d0 = distance(A,B)
  var d1 = distance(A,C)
  var d2 = distance(B,C)
  if (Math.abs(d0-d1-d2) < epsilon) return true
  if (Math.abs(d1-d0-d2) < epsilon) return true
  if (Math.abs(d2-d0-d1) < epsilon) return true
  return false
}
