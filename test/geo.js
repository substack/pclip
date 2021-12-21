var test = require('tape')
var peq = require('polygon-eq')
var pclip = require('../')
var geo = {
  intersect: require('intersect-great-circle'),
  pointInPolygon: require('geo-point-in-polygon'),
  distance: require('haversine-distance'),
}

test('two triangles geodetic clip', function (t) {
  var A = [[0,0],[5,8],[10,0]]
  var B = [[5,4],[10,12],[10,4]]
  t.ok(peq(pclip.intersect(A,B,geo), [
    [ [ [ 6.246, 6.026 ], [ 7.512, 4.004 ], [ 5, 4 ] ] ],
  ], 1e-3), 'intersect')
  t.ok(peq(pclip.exclude(A,B,geo), [
    [ [ [ 6.246, 6.026 ], [ 5, 8 ], [ 0, 0 ], [ 10, 0 ], [ 7.512, 4.004 ], [ 5, 4 ] ] ],
    [ [ [ 6.246, 6.026 ], [ 10, 12 ], [ 10, 4 ], [ 7.512, 4.004 ] ] ],
  ], 1e-3), 'exclude')
  t.ok(peq(pclip.union(A,B,geo), [
    [ [ [ 6.246, 6.026 ], [ 10, 12 ], [ 10, 4 ], [ 7.512, 4.004 ], [ 10, 0 ], [ 0, 0 ], [ 5, 8 ] ] ],
  ], 1e-3), 'union')
  t.ok(peq(pclip.difference(A,B,geo), [
    [ [ [ 6.246, 6.026 ], [ 5, 8 ], [ 0, 0 ], [ 10, 0 ], [ 7.512, 4.004 ], [ 5, 4 ] ] ],
  ], 1e-3), 'difference')
  t.end()
})
