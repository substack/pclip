var mPointInPolygon = require('./mpip.js')
var getDepth = require('./get-depth.js')
var v0 = [0,0], v1 = [0,0], v2 = [0,0]
var defaultEpsilon = 1e-8

module.exports = function (out, A, B, opts, mode) {
  out.la = out.lb = out.dA = out.dB = 0
  var distance = opts.distance
  var epsilon = opts.epsilon || defaultEpsilon
  if (mode === undefined) mode = opts.mode
  var intersect = opts.intersect
  var pointInPolygon = opts.pointInPolygon

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
        insert(out.nodes, i, P[i], index, lp, nextPolygon, false, ip)
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
          insert(out.nodes, j, P[i][j], index, lp, nextPolygon, i > 0, ip)
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
            insert(out.nodes, k, P[i][j][k], index, lp, nextPolygon, j > 0, ip)
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

  // phase one part two point one: fuse overlapping points
  for (var i = aStart; i < aEnd; i++) {
    for (var j = bStart; j < bEnd; j++) {
      checkFuse(out, i, j, distance, epsilon)
    }
  }

  for (var i = aStart; i < aEnd; i++) {
    var A0 = out.nodes[i]
    var A1 = out.nodes[A0.originalNext]
    for (var j = bStart; j < bEnd; j++) {
      var B0 = out.nodes[j]
      var B1 = out.nodes[B0.originalNext]
      // todo: this calculates the same many distances several times:
      if (collinear(A0.point,B0.point,B1.point,distance,epsilon)) {
        A0.border = j
      }
      if (collinear(A1.point,B0.point,B1.point,distance,epsilon)) {
        A1.border = j
      }
      if (collinear(B0.point,A0.point,A1.point,distance,epsilon)) {
        B0.border = i
      }
      if (collinear(B1.point,A0.point,A1.point,distance,epsilon)) {
        B1.border = i
      }
    }
  }
  for (var i = 0; i < 2; i++) {
    var start = i === 0 ? aStart : bStart
    var end = i === 0 ? aEnd : bEnd
    for (var j = start; j < end; j++) {
      var n = out.nodes[j]
      if (n.border >= 0) {
        var a = out.nodes[n.border]
        var b = out.nodes[a.originalNext]
        cutPoint(out, n, a, b, A, B, opts)
      }
    }
  }

  // phase one part two point two: calculate intersections
  for (var i = aStart; i < aEnd; i++) {
    var A0 = out.nodes[i]
    var A1 = out.nodes[A0.originalNext]
    for (var j = bStart; j < bEnd; j++) {
      var B0 = out.nodes[j]
      var B1 = out.nodes[B0.originalNext]
      if (A0.border === B0.index) continue
      if (A1.border === B0.index) continue
      if (B0.border === A0.index) continue
      if (B1.border === A0.index) continue
      if (!intersect(v0, A0.point, A1.point, B0.point, B1.point)) continue
      cutEdge(out, [v0[0],v0[1]], A0, A1, B0, B1, i, j, A, B, opts)
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

function checkFuse(out, i, j, distance, epsilon) {
  var a1 = out.nodes[i], b1 = out.nodes[j]
  if (a1.neighbor >= 0 || b1.neighbor >= 0) return
  if (!(distance(a1.point, b1.point) < epsilon)) return
  var a0 = out.nodes[a1.prev], a2 = out.nodes[a1.next]
  var b0 = out.nodes[b1.prev], b2 = out.nodes[b1.next]
  if (a0.neighbor < 0 && b0.neighbor < 0 && distance(a0.point, b0.point) < epsilon) {
    fuse(a0, b0, a1.prev, b1.prev)
  } else if (a0.neighbor < 0 && b2.neighbor < 0 && distance(a0.point, b2.point) < epsilon) {
    fuse(a0, b2, a1.prev, b1.next)
  } else if (a2.neighbor < 0 && b0.neighbor < 0 && distance(a2.point, b0.point) < epsilon) {
    fuse(a2, b0, a1.next, b1.prev)
  } else if (a2.neighbor < 0 && b2.neighbor < 0 && distance(a2.point, b2.point) < epsilon) {
    fuse(a2, b2, a1.next, b1.next)
  } else {
    return
  }
  fuse(a1, b1, i, j)
}

function fuse(a, b, i, j) {
  a.intersect = true
  b.intersect = true
  a.neighbor = j
  b.neighbor = i
}

function cutPoint(out, x, a, b, A, B, opts) {
  if (x.neighbor >= 0) return
  var distance = opts.distance
  var epsilon = opts.epsilon || defaultEpsilon
  var lerp = opts.lerp
  var pip = opts.pointInPolygon
  if (x.border >= 0 && out.nodes[x.next].border < 0 && out.nodes[x.prev].border < 0) {
    return
  }
  var n = x
  while (n.border >= 0) {
    n = out.nodes[n.next]
    if (n.index === x.index) break
  }
  var X = n.polygon === 0 ? B : A
  var dX = n.polygon === 0 ? out.dB : out.dA
  if (lerp) {
    lerp(v0, n.point, out.nodes[n.next].point, epsilon)
    var m0 = mPointInPolygon(pip, v0, X, dX)
    if (m0) return
  }

  var alpha = distance(x.point,a.point) / distance(a.point,b.point)
  for (
    var ix = a.index;
    out.nodes[out.nodes[ix].next].intersect && out.nodes[out.nodes[ix].next].alpha < alpha;
    ix=out.nodes[ix].next
  );
  var k = out.nodes.length
  var next = out.nodes[ix].next
  var prev = ix
  out.nodes.push({
    index: k,
    point: [x.point[0],x.point[1]],
    next,
    prev,
    originalNext: -1,
    neighbor: x.index,
    intersect: true,
    entry: false,
    visited: false,
    alpha: alpha,
    nextPolygon: out.nodes[ix].nextPolygon,
    hole: out.nodes[ix].hole,
    inside: false,
    loop: false,
    border: -1,
  })
  out.nodes[next].prev = k
  out.nodes[prev].next = k
  x.intersect = true
  x.neighbor = k
}

function cutEdge(out, point, A0, A1, B0, B1, iStart, jStart, A, B, opts) {
  var distance = opts.distance
  var epsilon = opts.epsilon || defaultEpsilon
  var pip = opts.pointInPolygon
  var dA01 = distance(A0.point,A1.point)
  var dB01 = distance(B0.point,B1.point)
  var da0v = distance(A0.point,point)
  var db0v = distance(B0.point,point)
  var ialpha = da0v / dA01
  var jalpha = db0v / dB01

  var ea = ialpha < epsilon || ialpha > 1-epsilon
  var eb = jalpha < epsilon || jalpha > 1-epsilon
  if (ea || eb) return

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
    index: ia,
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
    border: -1,
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
    border: -1,
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
    while (n.border) {
      index = n.next
      n = nodes[index]
      if (i === index) break
    }
    var inside = !!(mPointInPolygon(f, n.point, B, dB) ^ flip ^ n.hole)
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

function insert(nodes, i, point, la, lb, nextPolygon, hole, polygon) {
  var next = la+(i+1)%lb
  var prev = la+(i+lb-1)%lb
  nodes[la+i] = {
    index: la+i,
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
    border: -1,
    polygon,
  }
}

function collinear(a, b, c, distance, epsilon) {
  var d0 = distance(a,b)
  var d1 = distance(b,c)
  var d2 = distance(a,c)
  if (Math.abs(d1-d0-d2) < epsilon) return true
  return false
}
