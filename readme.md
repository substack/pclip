# pclip

polygon clipping where you provide routines to handle the coordinate system

Pretty much all polygon clipping libraries will give you operations in cartesian space, but with
this module you can also perform clipping on for example geodetic (lon,lat) coordinates with edges
along great circle arcs.

Supports multi-polygon inputs with holes, similar to geojson.

clipping based on [greiner-hormann algorithm](https://davis.wpi.edu/~matt/courses/clipping/)

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
console.log('intersect', show(pclip.intersect(A,B,opts)))
console.log('xor', show(pclip.xor(A,B,opts)))
console.log('union', show(pclip.union(A,B,opts)))
console.log('difference', show(pclip.difference(A,B,opts)))

function show(cs) {
  return '[\n' + cs.map(rings => '  ' + JSON.stringify(rings)).join(',\n') + '\n]'
}
```

# api

``` js
var pclip = require('pclip')
```

## pclip(A, B, opts)

Return a new polygon that applies the operation `opts.mode` between A and B.

Each of the polygons `A`, `B`, and the result are an array of 2-item arrays.

You must provide:

* `opts.mode` must be one of: `'union'`, `'difference'`, `'intersect'`, `'xor'`
* `opts.intersect(out, A, B, C, D)` - calculate the intersection between line segments AB and CD,
  storing the result in `out`. `A`, `B`, `C`, `D`, and `out` are 2-element arrays.
* `opts.pointInPolygon(point, polygon)` - return whether `point` (2-item array)
  is inside of `polygon` (array of 2-item arrays)
* `opts.distance(A,B)` - return the distance between points `A` and `B`

and you can optionally provide:

* `opts.get(A,B,C,i)` - map a node index to input polygons `A`, `B`, and set of intersections `C`.
  indexes map to `A`, then `B`, then `C` and indexes in `i` are doubled-up.
  this hook lets you include the internal node index so you can determine if an edge is from the
  original polygon or from the polygon clipping.

### cartesian coordinate options

``` js
{
  intersect: require('intersect-great-circle'),
  pointInPolygon: require('geo-point-in-polygon'),
  distance: require('haversine-distance'),
}
```

### geodetic coordinate options

``` js
{
  intersect: require('line-segment-intersect-2d'),
  pointInPolygon: require('point-in-polygon'),
  distance: require('gl-vec2/distance'),
}
```

## pclip.union(A, B, opts)

alias for `pclip(A, B, Object.assign({ mode: 'union' }, opts))`

## pclip.difference(A, B, opts)

alias for `pclip(A, B, Object.assign({ mode: 'difference' }, opts))`

## pclip.intersect(A, B, opts)

alias for `pclip(A, B, Object.assign({ mode: 'intersect' }, opts))`

## pclip.xor(A, B, opts)

alias for `pclip(A, B, Object.assign({ mode: 'xor' }, opts))`

# install

```
npm install pclip
```

# license

bsd

