# pclip

pluggable polygon clipping with multipolygon and hole support

Pretty much all polygon clipping libraries will give you operations in cartesian space, but with
this module you can also perform clipping on for example geodetic (lon,lat) coordinates with edges
along great circle arcs. Or you could clip using robust or rational arithmetic.

clipping based on [greiner-hormann algorithm](https://davis.wpi.edu/~matt/courses/clipping/)

# example

you can have simple single polygons with no holes:

``` js
var pclip = require('pclip')
var opts = require('pclip/geo') // geodetic (lon,lat) coordinates
var A = [[0,0],[5,8],[10,0]]
var B = [[5,4],[10,12],[10,4]]

console.log('intersect', show(pclip.intersect(A,B,opts)))
console.log('exclude', show(pclip.exclude(A,B,opts)))
console.log('union', show(pclip.union(A,B,opts)))
console.log('difference', show(pclip.difference(A,B,opts)))
console.log('divide', show(pclip.divide(A,B,opts)))

function show(cs) {
  return '[\n' + cs.map(rings => '  ' + JSON.stringify(rings)).join(',\n') + '\n]'
}
```

or you can clip multipolygons with holes:

``` js
var pclip = require('pclip')
var opts = require('pclip/xy') // cartesian coordinates
var A = [
  [
    [[-5,-1],[+0,+4],[+1,+1],[+3,+1],[+3,-1],[+0,-1],[+0,-2],[-4,-2]], // first polygon exterior
    [[-3,+0],[-1,+2],[+1,+0]], // hole
  ],
  [[[-4,+3],[-4,+4],[-3,+4]]], // second polygon exterior
]
var B = [
  [
    [[-2,+3],[+1,+3],[+1,+5],[+4,+5],[+4,+2],[+2,+2],[+2,-2],[+0,-3],[-2,-1]], // polygon exterior
    [[-0.5,+0.5],[+1.5,+0.5],[+1,-2]], // first hole
    [[+2,+4],[+3,+4],[+3,+3],[+2,+3]], // second hole
  ],
]

console.log('intersect', show(geoclip.intersect(A,B,opts)))
console.log('exclude', show(geoclip.exclude(A,B,opts)))
console.log('union', show(geoclip.union(A,B,opts)))
console.log('difference', show(geoclip.difference(A,B,opts)))
console.log('divide', show(geoclip.divide(A,B,opts)))

function show(cs) {
  return '[\n' + cs.map(rings => '  ' + JSON.stringify(rings)).join(',\n') + '\n]'
}
```

# api

``` js
var pclip = require('pclip')
var xy = require('pclip/xy') // cartesian coordinate options
var geo = require('pclip/geo') // geodetic (lon,lat) coordinate options
```

## pclip(A, B, opts)

Return a new polygon that applies the operation `opts.mode` between A and B.

Each point in polygons `A` and `B` is a 2-element array `[x,y]`. Similar to geojson,
polygons can have holes and you can specify multiple polygons with holes:

* depth=2 - single polygon: `[[x0,y0],[x1,y1],...]`
* depth=3 - single polygon with holes: `[[[x0,y0],[x1,y1],...],hole0,hole1...]`
* depth=4 - multiple polygons, each with holes: `[polygon0,polygon1,...]`

Each hole is formatted like a single polygon: `[[x0,y0],[x1,y1],...]`.

Polygons and holes may, but are not required to, have a first point equal to their last point.
Everything works the same whether or not there is a duplicate last point.

You must provide:

* `opts.mode` must be one of: `'union'`, `'difference'`, `'intersect'`, `'exclude'`, `'divide'`
* `opts.intersect(out, A, B, C, D)` - calculate the intersection between line segments AB and CD,
  storing the result in `out`. `A`, `B`, `C`, `D`, and `out` are 2-element arrays.
* `opts.pointInPolygon(point, polygon)` - return whether `point` (2-item array)
  is inside of `polygon` (array of 2-item arrays)
* `opts.distance(A,B)` - return the distance between points `A` and `B`

This package provides cartesian coordinate methods as `require('pclip/xy')`
and geodetic coordinate options as `require('pclip/geo')`.

and you can optionally provide:

* `opts.get(nodes,i)` - map the array of nodes and the node inex to the result type.
  by default, this is `nodes[i].point` but you can supply extra information here such as the index
  to determine if for example an edge is from the original polygon or a result of clipping.
* `opts.epsilon` - used internally to know if 2 points are equal. default: `1e-8`

## pclip.union(A, B, opts)

alias for `pclip(A, B, Object.assign({ mode: 'union' }, opts))`

## pclip.difference(A, B, opts)

alias for `pclip(A, B, Object.assign({ mode: 'difference' }, opts))`

## pclip.intersect(A, B, opts)

alias for `pclip(A, B, Object.assign({ mode: 'intersect' }, opts))`

## pclip.exclude(A, B, opts)

alias for `pclip(A, B, Object.assign({ mode: 'exclude' }, opts))`

## pclip.divide(A, B, opts)

alias for `pclip(A, B, Object.assign({ mode: 'divide' }, opts))`

# install

```
npm install pclip
```

# license

bsd

