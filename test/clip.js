var test = require('tape')
var pclip = require('../')

test('two triangles cartesian clip', function (t) {
  var A = [[0,0],[5,8],[10,0]]
  var B = [[5,4],[10,12],[10,4]]
  var opts = {
    intersect: require('line-segment-intersect-2d'),
    pointInPolygon: require('point-in-polygon'),
    distance: require('gl-vec2/distance'),
  }
  t.deepEqual(pclip.intersect(A,B,opts), [
    [ [ [ 6.25, 6 ], [ 7.5, 4 ], [ 5, 4 ] ] ],
  ], 'intersect')
  t.deepEqual(pclip.xor(A,B,opts), [
    [ [ [ 6.25, 6 ], [ 5, 8 ], [ 0, 0 ], [ 10, 0 ], [ 7.5, 4 ], [ 5, 4 ] ] ],
    [ [ [ 6.25, 6 ], [ 10, 12 ], [ 10, 4 ], [ 7.5, 4 ] ] ],
  ], 'xor')
  t.deepEqual(pclip.union(A,B,opts), [
    [ [ [ 6.25, 6 ], [ 10, 12 ], [ 10, 4 ], [ 7.5, 4 ], [ 10, 0 ], [ 0, 0 ], [ 5, 8 ] ] ],
  ], 'union')
  t.deepEqual(pclip.difference(A,B,opts), [
    [ [ [ 6.25, 6 ], [ 5, 8 ], [ 0, 0 ], [ 10, 0 ], [ 7.5, 4 ], [ 5, 4 ] ] ],
  ], 'difference')
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
  var n = 3
  t.deepEqual(round(n,pclip.intersect(A,B,opts)), [
    [ [ [ 6.246, 6.026 ], [ 7.512, 4.004 ], [ 5, 4 ] ] ],
  ], 'intersect')
  t.deepEqual(round(n,pclip.xor(A,B,opts)), [
    [ [ [ 6.246, 6.026 ], [ 5, 8 ], [ 0, 0 ], [ 10, 0 ], [ 7.512, 4.004 ], [ 5, 4 ] ] ],
    [ [ [ 6.246, 6.026 ], [ 10, 12 ], [ 10, 4 ], [ 7.512, 4.004 ] ] ],
  ], 'xor')
  t.deepEqual(round(n,pclip.union(A,B,opts)), [
    [ [ [ 6.246, 6.026 ], [ 10, 12 ], [ 10, 4 ], [ 7.512, 4.004 ], [ 10, 0 ], [ 0, 0 ], [ 5, 8 ] ] ],
  ], 'union')
  t.deepEqual(round(n,pclip.difference(A,B,opts)), [
    [ [ [ 6.246, 6.026 ], [ 5, 8 ], [ 0, 0 ], [ 10, 0 ], [ 7.512, 4.004 ], [ 5, 4 ] ] ],
  ], 'difference')
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
  var n = 3
  t.deepEqual(round(n,pclip.intersect(A,B,opts)), [
    [ [ [ 6.25, 6 ], [ 7.5, 4 ], [ 5, 4 ] ], [ [ 8.889, 1.778 ], [ 10, 0 ], [ 8, 0 ] ] ],
  ], 'intersect')
  t.deepEqual(round(n,pclip.xor(A,B,opts)), [
    [ [ [ 6.25, 6 ], [ 5, 8 ], [ 0, 0 ], [ 8, 0 ], [ 8.889, 1.778 ], [ 7.5, 4 ], [ 5, 4 ] ] ],
    [ [ [ 6.25, 6 ], [ 10, 12 ], [ 15, -2 ], [ 7, -2 ], [ 8, 0 ], [ 10, 0 ],
      [ 8.889, 1.778 ], [ 10, 4 ], [ 7.5, 4 ] ] ],
  ], 'xor')
  t.deepEqual(round(n,pclip.union(A,B,opts)), [
    [
      [ [ 6.25, 6 ], [ 10, 12 ], [ 15, -2 ], [ 7, -2 ], [ 8, 0 ], [ 0, 0 ], [ 5, 8 ] ],
      [ [ 8.889, 1.778 ], [ 10, 4 ], [ 7.5, 4 ] ],
    ],
  ], 'union')
  t.deepEqual(round(n,pclip.difference(A,B,opts)), [
    [ [ [ 6.25, 6 ], [ 5, 8 ], [ 0, 0 ], [ 8, 0 ], [ 8.889, 1.778 ], [ 7.5, 4 ], [ 5, 4 ] ] ],
  ], 'difference')
  t.end()
})

test('cartesian scenario 2 with holes', function (t) {
  var A = [
    [
      [[-5,-1],[+0,+4],[+1,+1],[+3,+1],[+3,-1],[+0,-1],[+0,-2],[-4,-2]],
      [[-3,+0],[-1,+2],[+1,+0]],
    ]
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
  console.log(pclip.union(A,B,opts))
  /*
  var n = 3
  t.deepEqual(round(n,pclip.intersect(A,B,opts)), [
    [ [ [ 6.25, 6 ], [ 7.5, 4 ], [ 5, 4 ] ], [ [ 8.889, 1.778 ], [ 10, 0 ], [ 8, 0 ] ] ],
  ], 'intersect')
  t.deepEqual(round(n,pclip.xor(A,B,opts)), [
    [ [ [ 6.25, 6 ], [ 5, 8 ], [ 0, 0 ], [ 8, 0 ], [ 8.889, 1.778 ], [ 7.5, 4 ], [ 5, 4 ] ] ],
    [ [ [ 6.25, 6 ], [ 10, 12 ], [ 15, -2 ], [ 7, -2 ], [ 8, 0 ], [ 10, 0 ],
      [ 8.889, 1.778 ], [ 10, 4 ], [ 7.5, 4 ] ] ],
  ], 'xor')
  t.deepEqual(round(n,pclip.union(A,B,opts)), [
    [
      [ [ 6.25, 6 ], [ 10, 12 ], [ 15, -2 ], [ 7, -2 ], [ 8, 0 ], [ 0, 0 ], [ 5, 8 ] ],
      [ [ 8.889, 1.778 ], [ 10, 4 ], [ 7.5, 4 ] ],
    ],
  ], 'union')
  t.deepEqual(round(n,pclip.difference(A,B,opts)), [
    [ [ [ 6.25, 6 ], [ 5, 8 ], [ 0, 0 ], [ 8, 0 ], [ 8.889, 1.778 ], [ 7.5, 4 ], [ 5, 4 ] ] ],
  ], 'difference')
  */
  t.end()
})


function round(n,xxxs) {
  return xxxs.map(function (xxs) {
    return xxs.map(function (xs) {
      return xs.map(function (x) {
        return [Number(x[0].toFixed(n)),Number(x[1].toFixed(n))]
      })
    })
  })
}
