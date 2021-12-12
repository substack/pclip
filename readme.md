# pclip

polygon and line clipping on configurable geometries

By default you get 2d cartesian space like most other polygon clipping libraries, but you can
specify `intersect`, `pointInPolygon`, and `distance` functions to operate on other spaces, such as
geodetic coordinates with edges as great circle arcs (see first example below).

# example

``` js
var pclip = require('pclip')
var A = [[0,0],[5,8],[10,0]]
var B = [[5,4],[10,12],[10,4]]
var opts = {
  intersect: require('intersect-great-circle'),
  pointInPolygon: require('geo-point-in-polygon'),
  distance: require('haversine-distance'),
}
console.log('intersect', pclip.intersect(A,B,opts))
console.log('xor', pclip.xor(A,B,opts))
console.log('union', pclip.union(A,B,opts))
console.log('difference', pclip.difference(A,B,opts))
```

