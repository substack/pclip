var v0 = [0,0]

module.exports = function (npoints, A, B, opts) {
  var mode = opts.mode
  var intersect = opts.intersect
  var pointInPolygon = opts.pointInPolygon
  var distance = opts.distance
  var nodes = []

  // phase one part one: build node lists
  var index = 0
  var dA = getDepth(A), dB = getDepth(B)
  var aStart = 0, aEnd = 0, bStart = 0, bEnd = 0
  for (var ip = 0; ip < 2; ip++) {
    var P = ip === 0 ? A : B
    var d = ip === 0 ? dA : dB
    if (d === 2) { // single polygon with no holes
      var lp = P.length
      for (var i = 0; i < lp; i++) {
        insert(nodes, i, P[i], index, lp, 0, false)
      }
      index += lp
      if (ip === 0) aEnd = bStart = index
      if (ip === 1) bEnd = index
    } else if (d === 3) { // single polygon with holes
      for (var i = 0; i < P.length; i++) {
        var lp = P[i].length
        for (var j = 0; j < lp; j++) {
          insert(nodes, j, P[i][j], index, lp, 0, i > 0)
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
            insert(nodes, k, P[i][j][k], index, lp, 0, j > 0)
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

  // phase one part two: calculate intersections
  for (var i = 0; i < aEnd-aStart; i++) {
    var A0 = nodes[aStart+i].point, A1 = nodes[aStart+(i+1)%(aEnd-aStart)].point
    var dA01 = distance(A0,A1)
    for (var j = 0; j < bEnd-bStart; j++) {
      var B0 = nodes[bStart+j].point, B1 = nodes[bStart+(j+1)%(bEnd-bStart)].point
      var dB01 = distance(B0,B1)
      if (!intersect(v0, A0, A1, B0, B1)) continue
      var k = nodes.length
      npoints.push([v0[0],v0[1]])
      var ialpha = distance(A0,v0) / dA01
      var jalpha = distance(B0,v0) / dB01
      for (
        var ix = aStart+i;
        nodes[nodes[ix].next].intersect && nodes[nodes[ix].next].alpha < ialpha;
        ix=nodes[ix].next
      );
      for (
        var jx = bStart+j;
        nodes[nodes[jx].next].intersect && nodes[nodes[jx].next].alpha < jalpha;
        jx=nodes[jx].next
      );
      nodes.push({
        index: k,
        point: npoints[npoints.length-1],
        polygon: 'Ax',
        next: nodes[ix].next,
        prev: ix,
        neighbor: k+1,
        intersect: true,
        entry: false,
        visited: false,
        alpha: ialpha,
        nextPolygon: 0,
        hole: false,
      })
      nodes.push({
        index: k+1,
        point: npoints[npoints.length-1],
        polygon: 'Bx',
        next: nodes[jx].next,
        prev: jx,
        neighbor: k,
        intersect: true,
        entry: false,
        visited: false,
        alpha: jalpha,
        nextPolygon: 0,
        hole: false,
      })
      nodes[nodes[ix].next].prev = k
      nodes[ix].next = k
      nodes[nodes[jx].next].prev = k+1
      nodes[jx].next = k+1
    }
  }

  // phase two: calculate entry/exit
  var inside = pointInPolygon(A[0], B)
  if (mode === 'intersect') {
    inside = !inside
  }
  markEntries(nodes, 0, inside)

  inside = pointInPolygon(B[0], A)
  if (mode !== 'union') {
    inside = !inside
  }
  markEntries(nodes, bStart, inside)

  return nodes
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
