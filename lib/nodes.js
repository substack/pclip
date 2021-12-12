// https://davis.wpi.edu/~matt/courses/clipping/
var v0 = [0,0]

module.exports = function (nodes, npoints, A, B, opts) {
  var intersect = opts.intersect
  var pointInPolygon = opts.pointInPolygon
  var distance = opts.distance
  var la = A.length
  var lb = B.length

  // phase one: build node lists
  for (var i = 0; i < la; i++) {
    nodes[i] = {
      index: i,
      point: A[i],
      polygon: 'A',
      next: (i+1)%la,
      prev: (i+la-1)%la,
      neighbor: -1,
      intersect: false,
      entry: false,
      visited: false,
      alpha: 0,
    }
  }
  for (var i = 0; i < lb; i++) {
    nodes[la+i] = {
      index: la+i,
      point: B[i],
      polygon: 'B',
      next: la+(i+1)%lb,
      prev: la+(i+la-1)%lb,
      neighbor: -1,
      intersect: false,
      entry: false,
      visited: false,
      alpha: 0,
    }
  }
  for (var i = 0; i < la; i++) {
    for (var j = 0; j < lb; j++) {
      if (!intersect(v0, A[i], A[(i+1)%la], B[j], B[(j+1)%lb])) continue
      var k = nodes.length
      npoints.push([v0[0],v0[1]])
      var ialpha = distance(A[i],v0) / distance(A[i],A[(i+1)%la])
      var jalpha = distance(B[j],v0) / distance(B[j],B[(j+1)%lb])
      for (
        var ix = i;
        nodes[nodes[ix].next].intersect && nodes[nodes[ix].next].alpha < ialpha;
        ix=nodes[ix].next
      );
      for (
        var jx = la+j;
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
      })
      nodes[nodes[ix].next].prev = k
      nodes[ix].next = k
      nodes[nodes[jx].next].prev = k+1
      nodes[jx].next = k+1
    }
  }

  // phase two: calculate entry/exit
  for (var i = 0; i < 2; i++) {
    var inside = i === 0 ? pointInPolygon(A[0], B) : pointInPolygon(B[0], A)
    var index = i === 0 ? 0 : la
    var start = index
    do {
      if (nodes[index].intersect) {
        nodes[index].entry = !inside
        inside = !inside
      }
      index = nodes[index].next
    } while (index !== start)
  }
  //for (var i = 0; i < nodes.length; i++) {
  //  if (nodes[i].index !== i) throw new Error(`invalid index ${i} != ${nodes[i].index}`)
  //}
}
