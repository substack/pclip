var mPointInPolygon = require('./mpip.js')
var getDepth = require('./get-depth.js')
var v0 = [0,0]
var defaultEpsilon = 1e-8

module.exports = function (out, A, B, opts, mode) {
  out.la = out.lb = out.dA = out.dB = 0
  var distance = opts.distance
  var epsilon = opts.epsilon || defaultEpsilon
  if (mode === undefined) mode = opts.mode
  var intersect = opts.intersect
  var pointInPolygon = opts.pointInPolygon
  var distance = opts.distance

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
        insert(out.nodes, i, P[i], index, lp, nextPolygon, false)
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
          insert(out.nodes, j, P[i][j], index, lp, nextPolygon, i > 0)
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
            insert(out.nodes, k, P[i][j][k], index, lp, nextPolygon, j > 0)
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

  // phase one part two point one: weld overlapping points
  for (var i = aStart; i < aEnd; i++) {
    for (var j = bStart; j < bEnd; j++) {
      checkWeld(out, i, j, distance, epsilon)
    }
  }

  // phase one part two point two: calculate intersections
  for (var i = aStart; i < aEnd; i++) {
    var A0 = out.nodes[i]
    var A1 = out.nodes[A0.originalNext]
    if (A0.intersect || A1.intersect) continue
    var dA01 = distance(A0.point,A1.point)
    for (var j = bStart; j < bEnd; j++) {
      var B0 = out.nodes[j]
      var B1 = out.nodes[B0.originalNext]
      if (B0.intersect || B1.intersect) continue
      var dB01 = distance(B0.point,B1.point)
      if (!intersect(v0, A0.point, A1.point, B0.point, B1.point)) continue
      cutEdge(out, v0, A0, A1, B0, B1, dA01, dB01, i, j, A, B, opts)
    }
  }

  // phase two: calculate entry/exit
  mark(pointInPolygon, out.nodes, B, out.dB, 0, mode === 'intersect', opts)
  mark(pointInPolygon, out.nodes, A, out.dA, bStart, mode !== 'union', opts)

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
        ? mPointInPolygon(pointInPolygon,n.point,B,out.dB)
        : mPointInPolygon(pointInPolygon,n.point,A,out.dA)
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

function checkWeld(out, i, j, distance, epsilon) {
  var a1 = out.nodes[i], b1 = out.nodes[j]
  if (a1.neighbor >= 0 || b1.neighbor >= 0) return
  if (!(distance(a1.point, b1.point) < epsilon)) return
  var a0 = out.nodes[a1.prev], a2 = out.nodes[a1.next]
  var b0 = out.nodes[b1.prev], b2 = out.nodes[b1.next]
  if (a0.neighbor < 0 && b0.neighbor < 0 && distance(a0.point, b0.point) < epsilon) {
    weld(a0, b0, a1.prev, b1.prev)
  } else if (a0.neighbor < 0 && b2.neighbor < 0 && distance(a0.point, b2.point) < epsilon) {
    weld(a0, b2, a1.prev, b1.next)
  } else if (a2.neighbor < 0 && b0.neighbor < 0 && distance(a2.point, b0.point) < epsilon) {
    weld(a2, b0, a1.next, b1.prev)
  } else if (a2.neighbor < 0 && b2.neighbor < 0 && distance(a2.point, b2.point) < epsilon) {
    weld(a2, b2, a1.next, b1.next)
  } else {
    return
  }
  weld(a1, b1, i, j)
}

function weld(a, b, i, j) {
  a.intersect = true
  b.intersect = true
  a.neighbor = j
  b.neighbor = i
}

function cutEdge(out, v0, A0, A1, B0, B1, dA01, dB01, iStart, jStart, A, B, opts) {
  var distance = opts.distance
  var lerp = opts.lerp
  var epsilon = opts.epsilon || defaultEpsilon
  var pip = opts.pointInPolygon
  var point = [v0[0],v0[1]]
  var da0v = distance(A0.point,v0)
  var db0v = distance(B0.point,v0)
  var ialpha = da0v / dA01
  var jalpha = db0v / dB01

  var ea = ialpha < epsilon || ialpha > 1-epsilon
  var eb = jalpha < epsilon || jalpha > 1-epsilon
  if (lerp && (ea || eb)) {
    lerp(v0, point, out.nodes[A1.next].point, epsilon)
    var a0 = mPointInPolygon(pip, v0, A, out.dA)
    var a1 = mPointInPolygon(pip, v0, B, out.dB)
    if (a0 !== a1) return
    if (!a0 && !a1) {
      lerp(v0, point, out.nodes[A1.prev].point, epsilon)
      var a2 = mPointInPolygon(pip, v0, A, out.dA)
      var a3 = mPointInPolygon(pip, v0, B, out.dB)
      if (!a2 && !a3) return
    }
  }
  for (
    var ix = iStart;
    out.nodes[out.nodes[ix].next].intersect && out.nodes[out.nodes[ix].next].alpha < ialpha;
    ix=out.nodes[ix].next
  );
  for (
    var jx = jStart;
    out.nodes[out.nodes[jx].next].intersect && out.nodes[out.nodes[jx].next].alpha < jalpha;
    jx=out.nodes[jx].next
  );

  var ia = out.nodes.length
  out.nodes.push({
    point,
    next: out.nodes[ix].next,
    prev: ix,
    originalNext: -1,
    neighbor: -1,
    intersect: true,
    entry: false,
    visited: false,
    alpha: ialpha,
    nextPolygon: out.nodes[ix].nextPolygon,
    hole: out.nodes[ix].hole,
    inside: false,
    loop: false,
  })
  out.nodes[out.nodes[ix].next].prev = ia
  out.nodes[ix].next = ia

  var ib = out.nodes.length
  out.nodes.push({
    point,
    next: out.nodes[jx].next,
    prev: jx,
    originalNext: -1,
    neighbor: -1,
    intersect: true,
    entry: false,
    visited: false,
    alpha: jalpha,
    nextPolygon: out.nodes[jx].nextPolygon,
    hole: out.nodes[jx].hole,
    inside: false,
    loop: false,
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
    var inside = !!(mPointInPolygon(f, n.point, B, dB) ^ flip ^ n.hole)
    markEntries(nodes, index, inside, opts)
    index = n.nextPolygon
  } while (index !== start)
}

function markEntries(nodes, start, inside, opts) {
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

function insert(nodes, i, point, la, lb, nextPolygon, hole) {
  var next = la+(i+1)%lb
  var prev = la+(i+lb-1)%lb
  nodes[la+i] = {
    point,
    next,
    originalNext: next,
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
  }
}
