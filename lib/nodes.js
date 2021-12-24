var v0 = [0,0]

module.exports = function (out, A, B, opts, mode) {
  out.la = 0
  out.lb = 0
  out.dA = 0
  out.dB = 0
  var epsilon = opts.epsilon !== undefined ? opts.epsilon : 1e-8
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

  // phase one part two: calculate intersections
  for (var i = aStart; i < aEnd; i++) {
    var nA = out.nodes[i]
    var A0 = nA.point
    var nAn = out.nodes[nA.originalNext]
    var A1 = nAn.point
    var dA01 = distance(A0,A1)
    for (var j = bStart; j < bEnd; j++) {
      var nB = out.nodes[j]
      if (nB.visited) continue
      nB.visited = true
      var B0 = nB.point
      var nBn = out.nodes[nB.originalNext]
      var B1 = nBn.point
      if (!intersect(v0, A0, A1, B0, B1)) continue
      var dB01 = distance(B0,B1)
      cutEdge(out, v0, A0, A1, B0, B1, dA01, dB01, i, j, distance)
    }
    for (var j = bStart; j < bEnd; j++) {
      out.nodes[j].visited = false
    }
  }

  // phase two: calculate entry/exit
  var f = pointInPolygon
  mark(pointInPolygon, out.nodes, A, B, out.dA, out.dB, 0, mode === 'intersect', epsilon, distance)
  mark(pointInPolygon, out.nodes, B, A, out.dB, out.dA, bStart, mode !== 'union', epsilon, distance)

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

function cutEdge(out, v0, A0, A1, B0, B1, dA01, dB01, iStart, jStart, distance) {
  var k = out.nodes.length
  var point = [v0[0],v0[1]]
  var ialpha = distance(A0,v0) / dA01
  var jalpha = distance(B0,v0) / dB01
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
  out.nodes.push({
    point,
    next: out.nodes[ix].next,
    prev: ix,
    originalNext: -1,
    neighbor: k+1,
    intersect: true,
    entry: false,
    visited: false,
    alpha: ialpha,
    nextPolygon: out.nodes[ix].nextPolygon,
    hole: out.nodes[ix].hole,
    inside: false,
    loop: false,
  })
  out.nodes.push({
    point,
    next: out.nodes[jx].next,
    prev: jx,
    originalNext: -1,
    neighbor: k,
    intersect: true,
    entry: false,
    visited: false,
    alpha: jalpha,
    nextPolygon: out.nodes[jx].nextPolygon,
    hole: out.nodes[jx].hole,
    inside: false,
    loop: false,
  })
  out.nodes[out.nodes[ix].next].prev = k
  out.nodes[ix].next = k
  out.nodes[out.nodes[jx].next].prev = k+1
  out.nodes[jx].next = k+1
}

function mark(f, nodes, A, B, dA, dB, start, flip, epsilon, distance) {
  var index = start
  if (dA === 2) {
    var inside = !!(mPointInPolygon(f, A[0], B, dB) ^ flip)
    markEntries(nodes, index, inside)
  } else if (dA === 3) {
    for (var i = 0; i < A.length; i++) {
      var inside = !!(mPointInPolygon(f, A[i][0], B, dB) ^ flip ^ (i > 0))
      markEntries(nodes, index, inside)
      var lp = A[i].length
      if (distance(A[i][0],A[i][A[i].length-1]) <= epsilon) lp--
      index += lp
    }
  } else if (dA === 4) {
    for (var i = 0; i < A.length; i++) {
      for (var j = 0; j < A[i].length; j++) {
        var inside = !!(mPointInPolygon(f, A[i][j][0], B, dB) ^ flip ^ (j > 0))
        markEntries(nodes, index, inside)
        var lp = A[i][j].length
        if (distance(A[i][j][0],A[i][j][A[i][j].length-1]) <= epsilon) lp--
        index += lp
      }
    }
  }
}

function markEntries(nodes, start, inside) {
  var index = start
  do {
    if (nodes[index].intersect) {
      nodes[index].entry = !!(inside ^ nodes[index].hole)
      inside = !inside
    }
    index = nodes[index].next
  } while (index !== start)
}

function getDepth(x) {
  for (var d = 0; Array.isArray(x); d++) { x = x[0] }
  return d
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

function mPointInPolygon(f,p,B,dB) {
  if (dB === 2) {
    return f(p,B)
  } else if (dB === 3) {
    if (!f(p,B[0])) return false
    for (var i = 1; i < B.length; i++) {
      if (f(p,B[i])) return false
    }
    return true
  } else if (dB === 4) {
    for (var i = 0; i < B.length; i++) {
      if (!f(p,B[i][0])) continue
      for (var j = 1; j < B[i].length; j++) {
        if (f(p,B[i][j])) break
      }
      if (j === B[i].length) return true
    }
    return false
  } else {
    throw new Error('unexpected dB='+dB)
  }
}
