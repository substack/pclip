var test = require('tape')
var peq = require('polygon-eq')
var pclip = require('../')

test('two triangles cartesian clip', function (t) {
  var A = [[0,0],[5,8],[10,0]]
  var B = [[5,4],[10,12],[10,4]]
  var opts = {
    intersect: require('line-segment-intersect-2d'),
    pointInPolygon: require('point-in-polygon'),
    distance: require('gl-vec2/distance'),
  }
  t.ok(peq(pclip.intersect(A,B,opts), [
    [ [ [ 6.25, 6 ], [ 7.5, 4 ], [ 5, 4 ] ] ],
  ]), 'intersect')
  t.ok(peq(pclip.exclude(A,B,opts), [
    [ [ [ 6.25, 6 ], [ 5, 8 ], [ 0, 0 ], [ 10, 0 ], [ 7.5, 4 ], [ 5, 4 ] ] ],
    [ [ [ 6.25, 6 ], [ 10, 12 ], [ 10, 4 ], [ 7.5, 4 ] ] ],
  ]), 'exclude')
  t.ok(peq(pclip.union(A,B,opts), [
    [ [ [ 6.25, 6 ], [ 10, 12 ], [ 10, 4 ], [ 7.5, 4 ], [ 10, 0 ], [ 0, 0 ], [ 5, 8 ] ] ],
  ]), 'union')
  t.ok(peq(pclip.difference(A,B,opts), [
    [ [ [ 6.25, 6 ], [ 5, 8 ], [ 0, 0 ], [ 10, 0 ], [ 7.5, 4 ], [ 5, 4 ] ] ],
  ]), 'difference')
  t.end()
})

test('two triangles geodetic clip', function (t) {
  var A = [[0,0],[5,8],[10,0]]
  var B = [[5,4],[10,12],[10,4]]
  var opts = {
    intersect: require('intersect-great-circle'),
    pointInPolygon: require('geo-point-in-polygon'),
    distance: require('haversine-distance'),
  }
  t.ok(peq(pclip.intersect(A,B,opts), [
    [ [ [ 6.246, 6.026 ], [ 7.512, 4.004 ], [ 5, 4 ] ] ],
  ], 1e-3), 'intersect')
  t.ok(peq(pclip.exclude(A,B,opts), [
    [ [ [ 6.246, 6.026 ], [ 5, 8 ], [ 0, 0 ], [ 10, 0 ], [ 7.512, 4.004 ], [ 5, 4 ] ] ],
    [ [ [ 6.246, 6.026 ], [ 10, 12 ], [ 10, 4 ], [ 7.512, 4.004 ] ] ],
  ], 1e-3), 'exclude')
  t.ok(peq(pclip.union(A,B,opts), [
    [ [ [ 6.246, 6.026 ], [ 10, 12 ], [ 10, 4 ], [ 7.512, 4.004 ], [ 10, 0 ], [ 0, 0 ], [ 5, 8 ] ] ],
  ], 1e-3), 'union')
  t.ok(peq(pclip.difference(A,B,opts), [
    [ [ [ 6.246, 6.026 ], [ 5, 8 ], [ 0, 0 ], [ 10, 0 ], [ 7.512, 4.004 ], [ 5, 4 ] ] ],
  ], 1e-3), 'difference')
  t.end()
})

test('one triangle completely inside of another', function (t) {
  var A = [[0,0],[5,8],[10,0]]
  var B = [[1,1],[2,2],[3,1]]
  var opts = {
    intersect: require('line-segment-intersect-2d'),
    pointInPolygon: require('point-in-polygon'),
    distance: require('gl-vec2/distance'),
  }
  t.ok(peq(pclip.intersect(A,B,opts), [
    [[[1,1],[2,2],[3,1]]],
  ]), 'intersect')
  t.ok(peq(pclip.exclude(A,B,opts), [
    [
      [[0,0],[5,8],[10,0]],
      [[1,1],[2,2],[3,1]],
    ],
  ]), 'exclude')
  t.ok(peq(pclip.union(A,B,opts), [
    [[[0,0],[5,8],[10,0]]]
  ]), 'union')
  t.ok(peq(pclip.difference(A,B,opts), [
    [
      [[0,0],[5,8],[10,0]],
      [[1,1],[2,2],[3,1]],
    ],
  ]), 'difference')
  t.end()
})

test('subject triangle with hole, clip triangle with hole not clipped', function (t) {
  var A = [
    [[0,0],[5,8],[10,0]],
    [[1,1],[2,2],[3,1]],
  ]
  var B = [[5,4],[10,12],[10,4]]
  var opts = {
    intersect: require('line-segment-intersect-2d'),
    pointInPolygon: require('point-in-polygon'),
    distance: require('gl-vec2/distance'),
  }
  t.ok(peq(pclip.intersect(A,B,opts), [
    [[[6.25,6],[7.5,4],[5,4]]],
  ]), 'intersect')
  t.ok(peq(pclip.exclude(A,B,opts), [
    [
      [[6.25,6],[5,8],[0,0],[10,0],[7.5,4],[5,4]],
      [[1,1],[2,2],[3,1]],
    ],
    [[[6.25,6],[10,12],[10,4],[7.5,4]]],
  ]), 'exclude')
  t.ok(peq(pclip.union(A,B,opts), [
    [
      [[6.25,6],[10,12],[10,4],[7.5,4],[10,0],[0,0],[5,8]],
      [[1,1],[2,2],[3,1]],
    ],
  ]), 'union')
  t.ok(peq(pclip.difference(A,B,opts), [
    [
      [[6.25,6],[5,8],[0,0],[10,0],[7.5,4],[5,4]],
      [[1,1],[2,2],[3,1]],
    ]
  ]), 'difference')
  t.end()
})

test('cartesian scenario 1', function (t) {
  var A = [
    [0,0],[5,8],[10,0]
  ]
  var B = [
    [5,4],[10,12],[15,-2],[7,-2],[10,4]
  ]
  var opts = {
    intersect: require('line-segment-intersect-2d'),
    pointInPolygon: require('point-in-polygon'),
    distance: require('gl-vec2/distance'),
  }
  t.ok(peq(pclip.intersect(A,B,opts), [
    [ [ [ 6.25, 6 ], [ 7.5, 4 ], [ 5, 4 ] ] ],
    [ [ [ 8.889, 1.778 ], [ 10, 0 ], [ 8, 0 ] ] ],
  ], 1e-3), 'intersect')
  t.ok(peq(pclip.exclude(A,B,opts), [
    [ [ [ 6.25, 6 ], [ 5, 8 ], [ 0, 0 ], [ 8, 0 ], [ 8.889, 1.778 ], [ 7.5, 4 ], [ 5, 4 ] ] ],
    [ [ [ 6.25, 6 ], [ 10, 12 ], [ 15, -2 ], [ 7, -2 ], [ 8, 0 ], [ 10, 0 ],
      [ 8.889, 1.778 ], [ 10, 4 ], [ 7.5, 4 ] ] ],
  ], 1e-3), 'exclude')
  t.ok(peq(pclip.union(A,B,opts), [
    [
      [ [ 6.25, 6 ], [ 10, 12 ], [ 15, -2 ], [ 7, -2 ], [ 8, 0 ], [ 0, 0 ], [ 5, 8 ] ],
      [ [ 8.889, 1.778 ], [ 10, 4 ], [ 7.5, 4 ] ],
    ],
  ], 1e-3), 'union')
  t.ok(peq(pclip.difference(A,B,opts), [
    [ [ [ 6.25, 6 ], [ 5, 8 ], [ 0, 0 ], [ 8, 0 ], [ 8.889, 1.778 ], [ 7.5, 4 ], [ 5, 4 ] ] ],
  ], 1e-3), 'difference')
  t.end()
})

test('cartesian scenario 2 with holes', function (t) {
  var A = [
    [
      [[-5,-1],[+0,+4],[+1,+1],[+3,+1],[+3,-1],[+0,-1],[+0,-2],[-4,-2]],
      [[-3,+0],[-1,+2],[+1,+0]],
    ],
  ]
  var B = [
    [
      [[-2,+3],[+1,+3],[+1,+5],[+4,+5],[+4,+2],[+2,+2],[+2,-2],[+0,-3],[-2,-1]],
      [[-0.5,+0.5],[+1.5,+0.5],[+1,-2]],
      [[+2,+4],[+3,+4],[+3,+3],[+2,+3]],
    ],
  ]
  var opts = {
    intersect: require('line-segment-intersect-2d'),
    pointInPolygon: require('point-in-polygon'),
    distance: require('gl-vec2/distance'),
  }
  t.ok(peq(pclip.intersect(A,B,opts), [
    [[
      [-2,+1],[-2,+2],[-1,+3],[+1/3,+3],[+1,+1],[+2,+1],[+2,-1],[+1.2,-1],
      [+1.5,+0.5],[+0.5,+0.5],[-1,+2],
    ]],
    [[[-2,+0],[-0.2,+0],[+0.4,-1],[+0,-1],[+0,-2],[-1,-2],[-2,-1]]]
  ], 1e-3), 'intersect')
  //console.dir(pclip.exclude(A,B,opts), { depth: 100 })
  /*
  t.ok(peq(pclip.exclude(A,B,opts), [
    [[[-2,+2],[-2,+3],[-1,+3]]],
    [[[-2,+0],[-2,+1],[-1,+2],[+0.5,+0.5],[-0.5,+0.5],[-0.2,+0]]],
    [[[-1,-2],[+0,-2],[+0,-1],[+0.4,-1],[+1,-2],[1.2,-1],[+2,-1],[-2,-2],[+0,-3]]],
    [
      [[+1,+1],[+1/3,+3],[+1,+3],[+1,+5],[+4,+5],[+4,+2],[+2,+2],[+2,+1]],
      [[+2,+3],[+2,+4],[+3,+4],[+3,+3]],
    ]
  ], 1e-3), 'exclude')
  */
  console.dir(pclip.union(A,B,opts), { depth: 100 })
  t.ok(peq(pclip.union(A,B,opts), [
    [
      [
        [-1,+3],[-2,+3],[-2,+2],[-5,-1],[-4,-2],[-1,-2],[+0,-3],[+2,-2],
        [+2,-1],[+3,-1],[+3,+1],[+2,+1],[+2,+2],[+4,+2],[+4,+5],[+1,+5],
        [+1,+3],[+1/3,+3],[+0,+4],
      ],
      [[-3,+0],[-2,+1],[-2,+0]],
      [[-0.5,+0.5],[-0.2,+0],[+1,+0],[+0.5,+0.5]],
      [[+0.4,-1],[+1,-2],[+1.2,-1]],
      [[+2,+3],[+2,+4],[+3,+4],[+3,+3]],
    ]
  ], 1e-3), 'union')
  /*
  t.ok(peq(pclip.difference(A,B,opts), [
    [[[-2,+2],[-5,-1],[-4,-2],[-1,-2],[-2,-1],[-3,+0],[-2,+1]]],
    [[[-1,+3],[+0,+4],[+1/3,+3]]],
    [[[-0.2,+0],[+1,+0],[+0.5,+0.5],[+1.5,+0.5],[+1.2,-1],[+0.4,-1]]],
    [[[+2,+1],[+3,+1],[+3,-1],[+2,-1]]],
  ], 1e-3), 'difference')
  */
  t.end()
})
