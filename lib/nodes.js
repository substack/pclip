var v0 = [0,0]

module.exports = function (out, A, B, opts) {
  out.nodes.length = 0
  out.npoints.length = 0
  out.la = 0
  out.lb = 0
  out.dA = 0
  out.dB = 0
  var mode = opts.mode
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
    if (d === 2) { // single polygon with no holes
      var lp = P.length
      for (var i = 0; i < lp; i++) {
        insert(out.nodes, i, P[i], index, lp, 0, false)
      }
      index += lp
      if (ip === 0) aEnd = bStart = index
      if (ip === 1) bEnd = index
    } else if (d === 3) { // single polygon with holes
      for (var i = 0; i < P.length; i++) {
        var lp = P[i].length
        for (var j = 0; j < lp; j++) {
          insert(out.nodes, j, P[i][j], index, lp, 0, i > 0)
        }
        index += lp
      }
      if (ip === 0) aEnd = bStart = index
      if (ip === 1) bEnd = index
    } else if (d === 4) { // multi-polygon with holes
      for (var i = 0; i < P.length; i++) {
        for (var j = 0; j < P[i].length; j++) {
          var lp = P[i][j].length
          for (var k = 0; k < lp; k++) {
            insert(out.nodes, k, P[i][j][k], index, lp, 0, j > 0)
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
  for (var i = 0; i < aEnd-aStart; i++) {
    var A0 = out.nodes[aStart+i].point
    var A1 = out.nodes[aStart+(i+1)%(aEnd-aStart)].point
    var dA01 = distance(A0,A1)
    for (var j = 0; j < bEnd-bStart; j++) {
      var B0 = out.nodes[bStart+j].point
      var B1 = out.nodes[bStart+(j+1)%(bEnd-bStart)].point
      var dB01 = distance(B0,B1)
      if (!intersect(v0, A0, A1, B0, B1)) continue
      var k = out.nodes.length
      out.npoints.push([v0[0],v0[1]])
      var ialpha = distance(A0,v0) / dA01
      var jalpha = distance(B0,v0) / dB01
      for (
        var ix = aStart+i;
        out.nodes[out.nodes[ix].next].intersect && out.nodes[out.nodes[ix].next].alpha < ialpha;
        ix=out.nodes[ix].next
      );
      for (
        var jx = bStart+j;
        out.nodes[out.nodes[jx].next].intersect && out.nodes[out.nodes[jx].next].alpha < jalpha;
        jx=out.nodes[jx].next
      );
      out.nodes.push({
        index: k,
        point: out.npoints[out.npoints.length-1],
        polygon: 'Ax',
        next: out.nodes[ix].next,
        prev: ix,
        neighbor: k+1,
        intersect: true,
        entry: false,
        visited: false,
        alpha: ialpha,
        nextPolygon: 0,
        hole: false,
      })
      out.nodes.push({
        index: k+1,
        point: out.npoints[out.npoints.length-1],
        polygon: 'Bx',
        next: out.nodes[jx].next,
        prev: jx,
        neighbor: k,
        intersect: true,
        entry: false,
        visited: false,
        alpha: jalpha,
        nextPolygon: 0,
        hole: false,
      })
      out.nodes[out.nodes[ix].next].prev = k
      out.nodes[ix].next = k
      out.nodes[out.nodes[jx].next].prev = k+1
      out.nodes[jx].next = k+1
    }
  }

  // phase two: calculate entry/exit
  var inside = pointInPolygon(A[0], B)
  if (mode === 'intersect') {
    inside = !inside
  }
  markEntries(out.nodes, 0, inside)

  inside = pointInPolygon(B[0], A)
  if (mode !== 'union') {
    inside = !inside
  }
  markEntries(out.nodes, bStart, inside)
}

function markEntries(nodes, start, inside) {
  var index = start
  do {
    if (nodes[index].intersect) {
      nodes[index].entry = inside
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
  nodes[la+i] = {
    point,
    index: la+i,
    next: la+(i+1)%lb,
    prev: la+(i+lb-1)%lb,
    neighbor: -1,
    intersect: false,
    entry: false,
    visited: false,
    alpha: 0,
    hole,
    nextPolygon,
  }
}
