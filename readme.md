# pclip

pluggable polygon clipping with multipolygon and hole support

Pretty much all polygon clipping libraries will give you operations in cartesian space, but with
this module you can also perform clipping on for example geodetic (lon,lat) coordinates with edges
along great circle arcs.

clipping based on [greiner-hormann algorithm](https://davis.wpi.edu/~matt/courses/clipping/)

# example

``` js
var pclip = require('pclip')
var opts = require('pclip/geo') // geodetic (lon,lat) coordinates
var A = [[0,0],[5,8],[10,0]]
var B = [[5,4],[10,12],[10,4]]

console.log('intersect', show(pclip.intersect(A,B,opts)))
console.log('exclude', show(pclip.exclude(A,B,opts)))
console.log('union', show(pclip.union(A,B,opts)))
console.log('difference', show(pclip.difference(A,B,opts)))

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

Each of the polygons `A`, `B`, and the result are an array of 2-item arrays.

You must provide:

* `opts.mode` must be one of: `'union'`, `'difference'`, `'intersect'`, `'exclude'`
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

## pclip.union(A, B, opts)

alias for `pclip(A, B, Object.assign({ mode: 'union' }, opts))`

## pclip.difference(A, B, opts)

alias for `pclip(A, B, Object.assign({ mode: 'difference' }, opts))`

## pclip.intersect(A, B, opts)

alias for `pclip(A, B, Object.assign({ mode: 'intersect' }, opts))`

## pclip.exclude(A, B, opts)

alias for `pclip(A, B, Object.assign({ mode: 'exclude' }, opts))`

# install

```
npm install pclip
```

# license

bsd

