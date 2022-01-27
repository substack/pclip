var test = require('tape')
var peq = require('polygon-eq')
var pclip = require('../')
var xy = require('../xy')

test('two triangles cartesian clip', function (t) {
  var A = [[0,0],[5,8],[10,0]]
  var B = [[5,4],[10,12],[10,4]]
  t.ok(peq(pclip.intersect(A,B,xy), [
    [[[6.25,6],[7.5,4],[5,4]]],
  ]), 'intersect')
  t.ok(peq(pclip.exclude(A,B,xy), [
    [[[6.25,6],[5,8],[0,0],[10,0],[7.5,4],[5,4]]],
    [[[6.25,6],[10,12],[10,4],[7.5,4]]],
  ]), 'exclude')
  t.ok(peq(pclip.union(A,B,xy), [
    [[[6.25,6],[10,12],[10,4],[7.5,4],[10,0],[0,0],[5,8]]],
  ]), 'union')
  t.ok(peq(pclip.difference(A,B,xy), [
    [[[6.25,6],[5,8],[0,0],[10,0],[7.5,4],[5,4]]],
  ]), 'difference')
  t.ok(peq(pclip.divide(A,B,xy), [
    [[[6.25,6],[5,8],[0,0],[10,0],[7.5,4],[5,4]]],
    [[[6.25,6],[7.5,4],[5,4]]],
  ], 1e-3), 'divide')
  t.ok(peq(pclip.divide(B,A,xy), [
    [[[6.25,6],[10,12],[10,4],[7.5,4]]],
    [[[6.25,6],[7.5,4],[5,4]]],
  ], 1e-3), 'swapped divide')
  t.end()
})

test('one triangle completely inside of another', function (t) {
  var A = [[0,0],[5,8],[10,0]]
  var B = [[1,1],[2,2],[3,1]]
  t.ok(peq(pclip.intersect(A,B,xy), [
    [[[1,1],[2,2],[3,1]]],
  ]), 'intersect')
  t.ok(peq(pclip.exclude(A,B,xy), [
    [
      [[0,0],[5,8],[10,0]],
      [[1,1],[2,2],[3,1]],
    ],
  ]), 'exclude')
  t.ok(peq(pclip.union(A,B,xy), [
    [[[0,0],[5,8],[10,0]]]
  ]), 'union')
  t.ok(peq(pclip.difference(A,B,xy), [
    [
      [[0,0],[5,8],[10,0]],
      [[1,1],[2,2],[3,1]],
    ],
  ]), 'difference')
  t.ok(peq(pclip.divide(A,B,xy), [
    [
      [[0,0],[5,8],[10,0]],
      [[1,1],[2,2],[3,1]],
    ],
    [[[1,1],[2,2],[3,1]]],
  ], 1e-3), 'divide')
  t.end()
})

test('one triangle completely inside of another, swapped', function (t) {
  var A = [[1,1],[2,2],[3,1]]
  var B = [[0,0],[5,8],[10,0]]
  t.ok(peq(pclip.intersect(A,B,xy), [
    [[[1,1],[2,2],[3,1]]],
  ]), 'intersect')
  t.ok(peq(pclip.exclude(A,B,xy), [
    [
      [[0,0],[5,8],[10,0]],
      [[1,1],[2,2],[3,1]],
    ],
  ]), 'exclude')
  t.ok(peq(pclip.union(A,B,xy), [
    [[[0,0],[5,8],[10,0]]]
  ]), 'union')
  t.ok(peq(pclip.difference(A,B,xy), [], 1e-3), 'difference')
  t.ok(peq(pclip.divide(A,B,xy), [
    [[[1,1],[2,2],[3,1]]],
  ], 1e-3), 'divide')
  t.end()
})

test('subject triangle with hole, clip triangle with hole not clipped', function (t) {
  var A = [
    [[0,0],[5,8],[10,0]],
    [[1,1],[2,2],[3,1]],
  ]
  var B = [[5,4],[10,12],[10,4]]
  t.ok(peq(pclip.intersect(A,B,xy), [
    [[[6.25,6],[7.5,4],[5,4]]],
  ]), 'intersect')
  t.ok(peq(pclip.exclude(A,B,xy), [
    [
      [[6.25,6],[5,8],[0,0],[10,0],[7.5,4],[5,4]],
      [[1,1],[2,2],[3,1]],
    ],
    [[[6.25,6],[10,12],[10,4],[7.5,4]]],
  ]), 'exclude')
  t.ok(peq(pclip.union(A,B,xy), [
    [
      [[6.25,6],[10,12],[10,4],[7.5,4],[10,0],[0,0],[5,8]],
      [[1,1],[2,2],[3,1]],
    ],
  ]), 'union')
  t.ok(peq(pclip.difference(A,B,xy), [
    [
      [[6.25,6],[5,8],[0,0],[10,0],[7.5,4],[5,4]],
      [[1,1],[2,2],[3,1]],
    ]
  ]), 'difference')
  t.ok(peq(pclip.divide(A,B,xy), [
    [
      [[6.25,6],[5,8],[0,0],[10,0],[7.5,4],[5,4]],
      [[1,1],[2,2],[3,1]],
    ],
    [[[6.25,6],[7.5,4],[5,4]]],
  ]), 'divide')
  t.end()
})

test('simple cartesian polygons', function (t) {
  var A = [
    [0,0],[5,8],[10,0]
  ]
  var B = [
    [5,4],[10,12],[15,-2],[7,-2],[10,4]
  ]
  t.ok(peq(pclip.intersect(A,B,xy), [
    [[[6.25,6],[7.5,4],[5,4]]],
    [[[8.889,1.778],[10,0],[8,0]]],
  ], 1e-3), 'intersect')
  t.ok(peq(pclip.exclude(A,B,xy), [
    [[[6.25,6],[5,8],[0,0],[8,0],[8.889,1.778],[7.5,4],[5,4]]],
    [[[6.25,6],[10,12],[15,-2],[7,-2],[8,0],[10,0],
    [8.889,1.778],[10,4],[7.5,4]]],
  ], 1e-3), 'exclude')
  t.ok(peq(pclip.union(A,B,xy), [
    [
      [[6.25,6],[10,12],[15,-2],[7,-2],[8,0],[0,0],[5,8]],
      [[8.889,1.778],[10,4],[7.5,4]],
    ],
  ], 1e-3), 'union')
  t.ok(peq(pclip.difference(A,B,xy), [
    [[[6.25,6],[5,8],[0,0],[8,0],[8.889,1.778],[7.5,4],[5,4]]],
  ], 1e-3), 'difference')
  t.ok(peq(pclip.divide(A,B,xy), [
    [[[6.25,6],[5,8],[0,0],[8,0],[8.889,1.778],[7.5,4],[5,4]]],
    [[[6.25,6],[7.5,4],[5,4]]],
    [[[8.889,1.778],[10,0],[8,0]]],
  ], 1e-3), 'divide')
  t.ok(peq(pclip.divide(B,A,xy), [
    [[[6.25,6],[7.5,4],[5,4]]],
    [[[8.889,1.778],[10,0],[8,0]]],
    [[[6.25,6],[10,12],[15,-2],[7,-2],[8,0],[10,0],[8.889,1.778],[10,4],[7.5,4]]],
  ], 1e-3), 'swapped divide')
  t.end()
})

test('cartesian polygons with holes', function (t) {
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
  t.ok(peq(pclip.intersect(A,B,xy), [
    [[
      [-2,+1],[-2,+2],[-1,+3],[+1/3,+3],[+1,+1],[+2,+1],[+2,-1],[+1.2,-1],
      [+1.5,+0.5],[+0.5,+0.5],[-1,+2],
    ]],
    [[[-2,+0],[-0.2,+0],[+0.4,-1],[+0,-1],[+0,-2],[-1,-2],[-2,-1]]]
  ], 1e-3), 'intersect')
  t.ok(peq(pclip.exclude(A,B,xy), [
    [[[-2,2],[-5,-1],[-4,-2],[-1,-2],[-2,-1],[-2,0],[-3,0],[-2,1]]],
    [[[-1,3],[0,4],[1/3,3]]],
    [[[-1,3],[-2,3],[-2,2]]],
    [[[2,1],[3,1],[3,-1],[2,-1]]],
    [[[2,-1],[2,-2],[0,-3],[-1,-2],[0,-2],[0,-1],[0.4,-1],[1,-2],[1.2,-1]]],
    [[[1.2,-1],[0.4,-1],[-0.2,0],[1,0],[0.5,0.5],[1.5,0.5]]],
    [
      [[1/3,3],[1,3],[1,5],[4,5],[4,2],[2,2],[2,1],[1,1]],
      [[2,3],[2,4],[3,4],[3,3]],
    ],
    [[[-2,0],[-2,1],[-1,2],[0.5,0.5],[-0.5,0.5],[-0.2,0]]]
  ], 1e-3), 'exclude')
  t.ok(peq(pclip.union(A,B,xy), [
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
  t.ok(peq(pclip.difference(A,B,xy), [
    [[[-2,+2],[-5,-1],[-4,-2],[-1,-2],[-2,-1],[-2,+0],[-3,+0],[-2,+1]]],
    [[[-1,+3],[+0,+4],[+1/3,+3]]],
    [[[-0.2,+0],[+1,+0],[+0.5,+0.5],[+1.5,+0.5],[+1.2,-1],[+0.4,-1]]],
    [[[+2,+1],[+3,+1],[+3,-1],[+2,-1]]],
  ], 1e-3), 'difference')
  t.ok(peq(pclip.divide(A,B,xy), [
    [[[-2,+2],[-5,-1],[-4,-2],[-1,-2],[-2,-1],[-2,+0],[-3,+0],[-2,+1]]],
    [[[-1,+3],[+0,+4],[+1/3,+3]]],
    [[[-0.2,+0],[+1,+0],[+0.5,+0.5],[+1.5,+0.5],[+1.2,-1],[+0.4,-1]]],
    [[[+2,+1],[+3,+1],[+3,-1],[+2,-1]]],
    [[[-2,+1],[-2,+2],[-1,+3],[+1/3,+3],[+1,+1],[+2,+1],[+2,-1],[+1.2,-1],
      [+1.5,+0.5],[+0.5,+0.5],[-1,+2]]],
    [[[-2,+0],[-0.2,+0],[+0.4,-1],[+0,-1],[+0,-2],[-1,-2],[-2,-1]]]
  ], 1e-3), 'divide')
  t.ok(peq(pclip.divide(B,A,xy), [
    [[
      [-2,+1],[-2,+2],[-1,+3],[+1/3,+3],[+1,+1],[+2,+1],[+2,-1],[+1.2,-1],
      [+1.5,+0.5],[+0.5,+0.5],[-1,+2],
    ]],
    [[[-2,+0],[-0.2,+0],[+0.4,-1],[+0,-1],[+0,-2],[-1,-2],[-2,-1]]],
    [[[-1,3],[-2,3],[-2,2]]],
    [[[2,-1],[2,-2],[0,-3],[-1,-2],[0,-2],[0,-1],[0.4,-1],[1,-2],[1.2,-1]]],
    [
      [[1/3,3],[1,3],[1,5],[4,5],[4,2],[2,2],[2,1],[1,1]],
      [[2,3],[2,4],[3,4],[3,3]],
    ],
    [[[-2,0],[-2,1],[-1,2],[0.5,0.5],[-0.5,0.5],[-0.2,0]]],
  ], 1e-3), 'swapped divide')
  t.end()
})

test('2 triangles in subject, 1 triangle in clip', function (t) {
  var A = [
    [[[0,2],[3,2],[1,4]]],
    [[[3,-2],[6,4],[9,-2]]]
  ]
  var B = [[0,0],[3,4],[6,0]]
  t.ok(peq(pclip.intersect(A,B,xy), [
    [[[1.5,2],[3,2],[15/7,20/7]]],
    [[[4,0],[4.8,1.6],[6,0]]],
  ], 1e-3), 'intersect')
  t.ok(peq(pclip.exclude(A,B,xy), [
    [[[0,0],[1.5,2],[3,2],[15/7,20/7],[3,4],[4.8,1.6],[4,0]]],
    [[[0,2],[1.5,2],[15/7,20/7],[1,4]]],
    [[[3,-2],[4,0],[6,0],[4.8,1.6],[6,4],[9,-2]]],
  ], 1e-3), 'exclude')
  t.ok(peq(pclip.union(A,B,xy), [
    [
      [0,2],[1,4],[15/7,20/7],[3,4],[4.8,1.6],[6,4],[9,-2],[3,-2],
      [4,0],[0,0],[1.5,2]
    ]
  ], 1e-3), 'union')
  t.ok(peq(pclip.difference(A,B,xy), [
    [[[0,2],[1,4],[15/7,20/7],[1.5,2]]],
    [[[3,-2],[4,0],[6,0],[4.8,1.6],[6,4],[9,-2]]],
  ], 1e-3), 'difference')
  t.ok(peq(pclip.divide(A,B,xy), [
    [[[0,2],[1,4],[15/7,20/7],[1.5,2]]],
    [[[3,-2],[4,0],[6,0],[4.8,1.6],[6,4],[9,-2]]],
    [[[1.5,2],[3,2],[15/7,20/7]]],
    [[[4,0],[4.8,1.6],[6,0]]],
  ], 1e-3), 'divide')
  t.ok(peq(pclip.divide(B,A,xy), [
    [[[1.5,2],[3,2],[15/7,20/7]]],
    [[[4,0],[4.8,1.6],[6,0]]],
    [[[0,0],[1.5,2],[3,2],[15/7,20/7],[3,4],[4.8,1.6],[4,0]]],
  ], 1e-3), 'swapped divide')
  t.end()
})

test('1 triangle in subject, 2 triangles in clip', function (t) {
  var A = [[0,0],[3,4],[6,0]]
  var B = [
    [[[0,2],[3,2],[1,4]]],
    [[[3,-2],[6,4],[9,-2]]]
  ]
  t.ok(peq(pclip.intersect(A,B,xy), [
    [[[1.5,2],[3,2],[15/7,20/7]]],
    [[[4,0],[4.8,1.6],[6,0]]],
  ], 1e-3), 'intersect')
  t.ok(peq(pclip.exclude(A,B,xy), [
    [[[0,0],[1.5,2],[3,2],[15/7,20/7],[3,4],[4.8,1.6],[4,0]]],
    [[[0,2],[1.5,2],[15/7,20/7],[1,4]]],
    [[[3,-2],[4,0],[6,0],[4.8,1.6],[6,4],[9,-2]]],
  ], 1e-3), 'exclude')
  t.ok(peq(pclip.union(A,B,xy), [
    [
      [0,2],[1,4],[15/7,20/7],[3,4],[4.8,1.6],[6,4],[9,-2],[3,-2],
      [4,0],[0,0],[1.5,2]
    ]
  ], 1e-3), 'union')
  t.ok(peq(pclip.difference(A,B,xy), [
    [[[0,0],[1.5,2],[3,2],[15/7,20/7],[3,4],[4.8,1.6],[4,0]]],
  ], 1e-3), 'difference')
  t.ok(peq(pclip.divide(A,B,xy), [
    [[[0,0],[1.5,2],[3,2],[15/7,20/7],[3,4],[4.8,1.6],[4,0]]],
    [[[1.5,2],[3,2],[15/7,20/7]]],
    [[[4,0],[4.8,1.6],[6,0]]],
  ], 1e-3), 'divide')
  t.ok(peq(pclip.divide(B,A,xy), [
    [[[1.5,2],[3,2],[15/7,20/7]]],
    [[[4,0],[4.8,1.6],[6,0]]],
    [[[0,2],[1.5,2],[15/7,20/7],[1,4]]],
    [[[3,-2],[4,0],[6,0],[4.8,1.6],[6,4],[9,-2]]],
  ], 1e-3), 'swapped divide')
  t.end()
})

test('2 triangles in subject, 2 triangles in clip', function (t) {
  var A = [
    [[[-4,+0],[-2,+3],[+0,+0]]],
    [[[+0,+3],[+2,+3],[+1,+1]]],
  ]
  var B = [
    [[[-1,-1],[+0,+1],[+1,-1]]],
    [[[-2,+2],[+2,+2],[+0,+5]]],
  ]
  t.ok(peq(pclip.intersect(A,B,xy), [
    [[[-2,+2],[-5/3,+2.5],[-4/3,+2]]],
    [[[+0,+0],[-2/7,+3/7],[-0.5,+0]]],
    [[[+0,+3],[+0.5,+2],[+1.5,+2],[+12/7,+17/7],[+4/3,+3]]],
  ], 1e-3), 'intersect')
  t.ok(peq(pclip.exclude(A,B,xy), [
    [[[-4,+0],[-2,+3],[-5/3,+2.5],[-2,+2],[-4/3,+2],[-2/7,3/7],[-0.5,+0]]],
    [[[+0.5,+2],[+1,+1],[+1.5,+2]]],
    [[[+4/3,+3],[+2,+3],[+12/7,+17/7]]],
    [[[-0.5,+0],[-1,-1],[+1,-1],[+0,+1],[-2/7,+3/7],[+0,+0]]],
    [[[-5/3,+2.5],[+0,+5],[+4/3,+3],[+0,+3],[+0.5,+2],[-4/3,+2]]],
    [[[+1.5,+2],[+2,+2],[+12/7,+17/7]]],
  ], 1e-3), 'exclude')
  t.ok(peq(pclip.union(A,B,xy), [
    [[
      [-4,+0],[-2,+3],[-5/3,+2.5],[+0,+5],[+4/3,+3],[+2,+3],[+12/7,+17/7],
      [+2,+2],[+1.5,+2],[+1,+1],[+0.5,+2],[-4/3,+2],[-2/7,+3/7],[+0,+1],
      [+1,-1],[-1,-1],[-0.5,+0]
    ]]
  ], 1e-3), 'union')
  t.ok(peq(pclip.difference(A,B,xy), [
    [[[-4,+0],[-2,+3],[-5/3,+2.5],[-2,+2],[-4/3,+2],[-2/7,3/7],[-0.5,+0]]],
    [[[+0.5,+2],[+1,+1],[+1.5,+2]]],
    [[[+4/3,+3],[+2,+3],[+12/7,+17/7]]],
  ], 1e-3), 'difference')
  t.ok(peq(pclip.divide(A,B,xy), [
    [[[-4,+0],[-2,+3],[-5/3,+2.5],[-2,+2],[-4/3,+2],[-2/7,3/7],[-0.5,+0]]],
    [[[+0.5,+2],[+1,+1],[+1.5,+2]]],
    [[[+4/3,+3],[+2,+3],[+12/7,+17/7]]],
    [[[-2,+2],[-5/3,+2.5],[-4/3,+2]]],
    [[[+0,+0],[-2/7,+3/7],[-0.5,+0]]],
    [[[+0,+3],[+0.5,+2],[+1.5,+2],[+12/7,+17/7],[+4/3,+3]]],
  ], 1e-3), 'divide')
  t.ok(peq(pclip.divide(B,A,xy), [
    [[[-2,+2],[-5/3,+2.5],[-4/3,+2]]],
    [[[+0,+0],[-2/7,+3/7],[-0.5,+0]]],
    [[[+0,+3],[+0.5,+2],[+1.5,+2],[+12/7,+17/7],[+4/3,+3]]],
    [[[-0.5,+0],[-1,-1],[+1,-1],[+0,+1],[-2/7,+3/7],[+0,+0]]],
    [[[-5/3,+2.5],[+0,+5],[+4/3,+3],[+0,+3],[+0.5,+2],[-4/3,+2]]],
    [[[+1.5,+2],[+2,+2],[+12/7,+17/7]]],
  ], 1e-3), 'swapped divide')
  t.end()
})

test('4 triangles in subject, 4 triangles in clip with half non-intersecting triangles', function (t) {
  var A = [
    [[[-4,+0],[-2,+3],[+0,+0]]],
    [[[+0,+3],[+2,+3],[+1,+1]]],
    [[[+10,+0],[+11,+1],[+12,+0]]],
    [[[+0,+10],[+1,+10],[+0,+11]]],
  ]
  var B = [
    [[[-1,-1],[+0,+1],[+1,-1]]],
    [[[-2,+2],[+2,+2],[+0,+5]]],
    [[[-10,+5],[-9,+6],[-8,+5]]],
    [[[-1,-10],[+0,-9],[+1,-10]]],
  ]
  t.ok(peq(pclip.intersect(A,B,xy), [
    [[[-2,+2],[-5/3,+2.5],[-4/3,+2]]],
    [[[+0,+0],[-2/7,+3/7],[-0.5,+0]]],
    [[[+0,+3],[+0.5,+2],[+1.5,+2],[+12/7,+17/7],[+4/3,+3]]],
  ], 1e-3), 'intersect')
  t.ok(peq(pclip.exclude(A,B,xy), [
    [[[-4,+0],[-2,+3],[-5/3,+2.5],[-2,+2],[-4/3,+2],[-2/7,3/7],[-0.5,+0]]],
    [[[+0.5,+2],[+1,+1],[+1.5,+2]]],
    [[[+4/3,+3],[+2,+3],[+12/7,+17/7]]],
    [[[-0.5,+0],[-1,-1],[+1,-1],[+0,+1],[-2/7,+3/7],[+0,+0]]],
    [[[-5/3,+2.5],[+0,+5],[+4/3,+3],[+0,+3],[+0.5,+2],[-4/3,+2]]],
    [[[+1.5,+2],[+2,+2],[+12/7,+17/7]]],
    [[[+10,+0],[+11,+1],[+12,+0]]],
    [[[+0,+10],[+1,+10],[+0,+11]]],
    [[[-10,+5],[-9,+6],[-8,+5]]],
    [[[-1,-10],[+0,-9],[+1,-10]]],
  ], 1e-3), 'exclude')
  t.ok(peq(pclip.union(A,B,xy), [
    [[
      [-4,+0],[-2,+3],[-5/3,+2.5],[+0,+5],[+4/3,+3],[+2,+3],[+12/7,+17/7],
      [+2,+2],[+1.5,+2],[+1,+1],[+0.5,+2],[-4/3,+2],[-2/7,+3/7],[+0,+1],
      [+1,-1],[-1,-1],[-0.5,+0]
    ]],
    [[[+10,+0],[+11,+1],[+12,+0]]],
    [[[+0,+10],[+1,+10],[+0,+11]]],
    [[[-10,+5],[-9,+6],[-8,+5]]],
    [[[-1,-10],[+0,-9],[+1,-10]]],
  ], 1e-3), 'union')
  t.ok(peq(pclip.difference(A,B,xy), [
    [[[-4,+0],[-2,+3],[-5/3,+2.5],[-2,+2],[-4/3,+2],[-2/7,3/7],[-0.5,+0]]],
    [[[+0.5,+2],[+1,+1],[+1.5,+2]]],
    [[[+4/3,+3],[+2,+3],[+12/7,+17/7]]],
    [[[+10,+0],[+11,+1],[+12,+0]]],
    [[[+0,+10],[+1,+10],[+0,+11]]],
  ], 1e-3), 'difference')
  t.ok(peq(pclip.divide(A,B,xy), [
    [[[-4,+0],[-2,+3],[-5/3,+2.5],[-2,+2],[-4/3,+2],[-2/7,3/7],[-0.5,+0]]],
    [[[+0.5,+2],[+1,+1],[+1.5,+2]]],
    [[[+4/3,+3],[+2,+3],[+12/7,+17/7]]],
    [[[+10,+0],[+11,+1],[+12,+0]]],
    [[[+0,+10],[+1,+10],[+0,+11]]],
    [[[-2,+2],[-5/3,+2.5],[-4/3,+2]]],
    [[[+0,+0],[-2/7,+3/7],[-0.5,+0]]],
    [[[+0,+3],[+0.5,+2],[+1.5,+2],[+12/7,+17/7],[+4/3,+3]]],
  ], 1e-3), 'divide')
  t.ok(peq(pclip.divide(B,A,xy), [
    [[[-2,+2],[-5/3,+2.5],[-4/3,+2]]],
    [[[+0,+0],[-2/7,+3/7],[-0.5,+0]]],
    [[[+0,+3],[+0.5,+2],[+1.5,+2],[+12/7,+17/7],[+4/3,+3]]],
    [[[-0.5,+0],[-1,-1],[+1,-1],[+0,+1],[-2/7,+3/7],[+0,+0]]],
    [[[-5/3,+2.5],[+0,+5],[+4/3,+3],[+0,+3],[+0.5,+2],[-4/3,+2]]],
    [[[+1.5,+2],[+2,+2],[+12/7,+17/7]]],
    [[[-10,+5],[-9,+6],[-8,+5]]],
    [[[-1,-10],[+0,-9],[+1,-10]]],
  ], 1e-3), 'swapped divide')
  t.end()
})

test('multiple polygons with holes', function (t) {
  var A = [
    [[[-4,-3],[+4,-3],[+3,-5]]],
    [
      [[-4,+1],[-3,+4],[+3,+5],[+4,+2],[+2,-2]],
      [[-3,+2],[-2,+4],[-1,+2]],
      [[+0,+0],[+0,+1],[+1,+1],[+1,+0]],
      [[+2,+0],[+2,-1],[+1,-1]],
      [[+0,+2],[+0,+3],[+2,+3],[+3,+1]],
    ],
  ]
  var B = [
    [
      [[-4,-4],[-2,-2],[+0,+4],[+5,+4],[+5,+0],[+2,-4]],
      [[-1,-1],[+4,-0.5],[+3,-2]],
      [[+4,+0],[+2,+1],[+3,+3],[+4.5,+3]],
    ],
    [
      [[-4,+0],[-3,+1],[-2,+1],[-2,-1],[-3,-2],[-5,-2]],
      [[-4,-1],[-2.5,+0.5],[-2.5,-1]],
    ],
  ]
  t.ok(peq(pclip.intersect(A,B,xy), [
    [[[-10/3,+2/3],[-3,+1],[-2,+1],[-2,+0],[-2.5,+0.25],[-2.5,+0.5],[-8/3,+1/3]]],
    [
      [
        [-10/7,-2/7],[+0,+4],[+10/3,+4],[+11/3,+3],[+3,+3],[+2.5,+2],[+2,+3],
        [+0,+3],[+0,+2],[+15/7,+9/7],[+2,+1],[+3.2,+0.4],[+51/19,-12/19],
        [+2,-0.7],[+2,+0],[+11/9,-7/9],[-1/6,-11/12],
      ],
      [[+0,+0],[+0,+1],[+1,+1],[+1,+0]],
    ],
    [[[+1,-1.5],[19/9,-16/9],[+2,-2]]],
    [[[-29/9,-29/9],[-3,-3],[+2.75,-3],[+2,-4],[-0.5,-4]]],
  ], 1e-3), 'intersect')
  t.ok(peq(pclip.union(A,B,xy), [
    [
      [-3,-3],[-4,-3],[-29/9,-29/9],[-4,-4],[-0.5,-4],[+3,-5],[+4,-3],[+2.75,-3],
      [+5,0],[+5,+4],[+10/3,+4],[+3,+5],[-3,+4],[-4,+1],[-10/3,+2/3],[-4,+0],[-5,-2],
      [-3,-2],[-2,-1],[-2,+0],[-10/7,-2/7],[-2,-2]
    ],
    [[+11/3,+3],[+4,+2],[+3.2,+0.4],[+4,+0],[+4.5,+3]],
    [[+51/19,-12/19],[+19/9,-16/9],[+3,-2],[+4,-0.5]],
    [[+1,-1.5],[-1/6,-11/12],[-1,-1]],
    [[-2.5,+0.25],[-8/3,+1/3],[-4,-1],[-2.5,-1]],
    [[-3,+2],[-1,+2],[-2,+4]],
    [[+15/7,+9/7],[+2.5,+2],[+3,+1]],
    [[+2,-0.7],[+11/9,-7/9],[+1,-1],[+2,-1]],
  ], 1e-3), 'union')
  t.ok(peq(pclip.exclude(A,B,xy), [
    [[[-3,-3],[-4,-3],[-29/9,-29/9]]],
    [[[2.75,-3],[4,-3],[3,-5],[-0.5,-4],[2,-4]]],
    [
      [[10/3,4],[3,5],[-3,4],[-4,1],[-10/3,2/3],[-3,1],[-2,1],[-2,0],[-10/7,-2/7],[0,4]],
      [[-2,4],[-3,2],[-1,2]]
    ],
    [[[11/3,3],[4,2],[3.2,0.4],[2,1],[15/7,9/7],[3,1],[2.5,2],[3,3]]],
    [[[51/19,-12/19],[19/9,-16/9],[1,-1.5],[-2/12,-11/12],[11/9,-7/9],[1,-1],[2,-1],[2,-0.7]]],
    [[[-2.5,0.25],[-8/3,1/3],[-2.5,0.5]]],
    [[[0,1],[0,0],[1,0],[1,1]]],
    [[[-29/9,-29/9],[-4,-4],[-0.5,-4]]],
    [[[-3,-3],[-2,-2],[-10/7,-2/7],[-2/12,-11/12],[-1,-1],[1,-1.5],[2,-2],
      [19/9,-16/9],[3,-2],[4,-0.5],[51/19,-12/19],[3.2,0.4],[4,0],[4.5,3],
      [11/3,3],[10/3,4],[5,4],[5,0],[2.75,-3]
    ]],
    [[[11/9,-7/9],[2,-0.7],[2,0]]],
    [[[15/7,9/7],[2.5,2],[2,3],[0,3],[0,2]]],
    [[[-10/3,2/3],[-4,0],[-5,-2],[-3,-2],[-2,-1],[-2,0],[-2.5,0.25],[-2.5,-1],[-4,-1],[-8/3,1/3]]],
  ], 1e-3), 'exclude')
  t.ok(peq(pclip.difference(A,B,xy), [
    [[[-3,-3],[-4,-3],[-29/9,-29/9]]],
    [[[2.75,-3],[4,-3],[3,-5],[-0.5,-4],[2,-4]]],
    [
      [[10/3,4],[3,5],[-3,4],[-4,1],[-10/3,2/3],[-3,1],[-2,1],[-2,0],[-10/7,-2/7],[0,4]],
      [[-2,4],[-3,2],[-1,2]]
    ],
    [[[11/3,3],[4,2],[3.2,0.4],[2,1],[15/7,9/7],[3,1],[2.5,2],[3,3]]],
    [[[51/19,-12/19],[19/9,-16/9],[1,-1.5],[-1/6,-11/12],[11/9,-7/9],[1,-1],[2,-1],[2,-0.7]]],
    [[[-2.5,0.25],[-8/3,1/3],[-2.5,0.5]]],
  ], 1e-3), 'difference')
  t.ok(peq(pclip.divide(A,B,xy), [
    [[[-3,-3],[-4,-3],[-29/9,-29/9]]],
    [[[2.75,-3],[4,-3],[3,-5],[-0.5,-4],[2,-4]]],
    [
      [[10/3,4],[3,5],[-3,4],[-4,1],[-10/3,2/3],[-3,1],[-2,1],[-2,0],[-10/7,-2/7],[0,4]],
      [[-2,4],[-3,2],[-1,2]]
    ],
    [[[11/3,3],[4,2],[3.2,0.4],[2,1],[15/7,9/7],[3,1],[2.5,2],[3,3]]],
    [[[51/19,-12/19],[19/9,-16/9],[1,-1.5],[-1/6,-11/12],[11/9,-7/9],[1,-1],[2,-1],[2,-0.7]]],
    [[[-2.5,0.25],[-8/3,1/3],[-2.5,0.5]]],
    // ---
    [[[-10/3,+2/3],[-3,+1],[-2,+1],[-2,+0],[-2.5,+0.25],[-2.5,+0.5],[-8/3,+1/3]]],
    [
      [
        [-10/7,-2/7],[+0,+4],[+10/3,+4],[+11/3,+3],[+3,+3],[+2.5,+2],[+2,+3],
        [+0,+3],[+0,+2],[+15/7,+9/7],[+2,+1],[+3.2,+0.4],[+51/19,-12/19],
        [+2,-0.7],[+2,+0],[+11/9,-7/9],[-1/6,-11/12],
      ],
      [[+0,+0],[+0,+1],[+1,+1],[+1,+0]],
    ],
    [[[+1,-1.5],[19/9,-16/9],[+2,-2]]],
    [[[-29/9,-29/9],[-3,-3],[+2.75,-3],[+2,-4],[-0.5,-4]]],
  ], 1e-3), 'divide')
  t.end()
})

test('inside loops', function (t) {
  var A = [
    [
      [[-5,-5],[-5,+5],[+5,+5],[+5,-5]],
      [[-3,+4],[+4,+4],[+4,-4]],
    ],
    [[[+2,+2],[+1,+2],[+2,+1]]],
  ]
  var B = [
    [
      [[-4,+4],[-4,-4],[+3,-4]],
      [[-3,+1],[-3,-3],[+1,-3]],
    ],
    [[[-2,-1],[-2,-2],[-1,-2]]],
    [
      [[-1,+3],[+3,+3],[+3,-2]],
      [[+0,+2.5],[+2.5,+2.5],[+2.5,-0.5]],
    ],
  ]
  t.ok(peq(pclip.union(A,B,xy), [
    [
      [[-5,-5],[-5,+5],[+5,+5],[+5,-5]],
      [[-3,+4],[+4,+4],[+4,-4]],
    ],
    [
      [[-1,+3],[+3,+3],[+3,-2]],
      [[+0,+2.5],[+2.5,+2.5],[+2.5,-0.5]],
    ],
    [[[+2,+2],[+1,+2],[+2,+1]]],
  ], 1e-3), 'union')
  t.ok(peq(pclip.exclude(A,B,xy), [
    [
      [[-5,-5],[-5,+5],[+5,+5],[+5,-5]],
      [[-3,+4],[+4,+4],[+4,-4]],
      [[-4,+4],[-4,-4],[+3,-4]],
    ],
    [[[+2,+2],[+1,+2],[+2,+1]]],
    [
      [[-3,+1],[-3,-3],[+1,-3]],
      [[-2,-1],[-2,-2],[-1,-2]],
    ],
    [
      [[-1,+3],[+3,+3],[+3,-2]],
      [[+0,+2.5],[+2.5,+2.5],[+2.5,-0.5]],
    ],
  ], 1e-3), 'exclude')
  t.ok(peq(pclip.intersect(A,B,xy), [
    [
      [[-4,+4],[-4,-4],[+3,-4]],
      [[-3,+1],[-3,-3],[+1,-3]],
    ],
    [[[-2,-1],[-2,-2],[-1,-2]]],
  ], 1e-3), 'intersect')
  t.ok(peq(pclip.difference(A,B,xy), [
    [
      [[-5,-5],[-5,+5],[+5,+5],[+5,-5]],
      [[-3,+4],[+4,+4],[+4,-4]],
      [[-4,+4],[-4,-4],[+3,-4]],
    ],
    [[[+2,+2],[+1,+2],[+2,+1]]],
    [
      [[-3,+1],[-3,-3],[+1,-3]],
      [[-2,-1],[-2,-2],[-1,-2]],
    ],
  ], 1e-3), 'difference')
  t.ok(peq(pclip.divide(A,B,xy), [
    [
      [[-5,-5],[-5,+5],[+5,+5],[+5,-5]],
      [[-3,+4],[+4,+4],[+4,-4]],
      [[-4,+4],[-4,-4],[+3,-4]],
    ],
    [[[+2,+2],[+1,+2],[+2,+1]]],
    [
      [[-3,+1],[-3,-3],[+1,-3]],
      [[-2,-1],[-2,-2],[-1,-2]],
    ],
    [
      [[-4,+4],[-4,-4],[+3,-4]],
      [[-3,+1],[-3,-3],[+1,-3]],
    ],
    [[[-2,-1],[-2,-2],[-1,-2]]],
  ], 1e-3), 'divide')
  t.ok(peq(pclip.divide(B,A,xy), [
    [
      [[-4,+4],[-4,-4],[+3,-4]],
      [[-3,+1],[-3,-3],[+1,-3]],
    ],
    [[[-2,-1],[-2,-2],[-1,-2]]],
    [
      [[-1,+3],[+3,+3],[+3,-2]],
      [[+0,+2.5],[+2.5,+2.5],[+2.5,-0.5]],
    ],
  ], 1e-3), 'swapped divide')
  t.end()
})

test('ignore first=last depth=2', function (t) {
  var A = [[0,0],[5,8],[10,0],[0,0]]
  var B = [[5,4],[10,12],[10,4],[5,4]]
  t.ok(peq(pclip.intersect(A,B,xy), [
    [[[6.25,6],[7.5,4],[5,4]]],
  ]), 'intersect')
  t.ok(peq(pclip.exclude(A,B,xy), [
    [[[6.25,6],[5,8],[0,0],[10,0],[7.5,4],[5,4]]],
    [[[6.25,6],[10,12],[10,4],[7.5,4]]],
  ]), 'exclude')
  t.ok(peq(pclip.union(A,B,xy), [
    [[[6.25,6],[10,12],[10,4],[7.5,4],[10,0],[0,0],[5,8]]],
  ]), 'union')
  t.ok(peq(pclip.difference(A,B,xy), [
    [[[6.25,6],[5,8],[0,0],[10,0],[7.5,4],[5,4]]],
  ]), 'difference')
  t.ok(peq(pclip.divide(A,B,xy), [
    [[[6.25,6],[5,8],[0,0],[10,0],[7.5,4],[5,4]]],
    [[[6.25,6],[7.5,4],[5,4]]],
  ]), 'divide')
  t.ok(peq(pclip.divide(B,A,xy), [
    [[[6.25,6],[7.5,4],[5,4]]],
    [[[6.25,6],[10,12],[10,4],[7.5,4]]],
  ]), 'swapped divide')
  t.end()
})

test('ignore first=last depth=3', function (t) {
  var A = [
    [[0,0],[5,8],[10,0],[0,0]],
    [[1,1],[2,2],[3,1],[1,1]],
  ]
  var B = [[[5,4],[10,12],[10,4],[5,4]]]
  t.ok(peq(pclip.intersect(A,B,xy), [
    [[[6.25,6],[7.5,4],[5,4]]],
  ]), 'intersect')
  t.ok(peq(pclip.exclude(A,B,xy), [
    [
      [[6.25,6],[5,8],[0,0],[10,0],[7.5,4],[5,4]],
      [[1,1],[2,2],[3,1]],
    ],
    [[[6.25,6],[10,12],[10,4],[7.5,4]]],
  ]), 'exclude')
  t.ok(peq(pclip.union(A,B,xy), [
    [
      [[6.25,6],[10,12],[10,4],[7.5,4],[10,0],[0,0],[5,8]],
      [[1,1],[2,2],[3,1]],
    ],
  ]), 'union')
  t.ok(peq(pclip.difference(A,B,xy), [
    [
      [[6.25,6],[5,8],[0,0],[10,0],[7.5,4],[5,4]],
      [[1,1],[2,2],[3,1]],
    ]
  ]), 'difference')
  t.ok(peq(pclip.divide(A,B,xy), [
    [
      [[6.25,6],[5,8],[0,0],[10,0],[7.5,4],[5,4]],
      [[1,1],[2,2],[3,1]],
    ],
    [[[6.25,6],[7.5,4],[5,4]]],
  ]), 'divide')
  t.ok(peq(pclip.divide(B,A,xy), [
    [[[6.25,6],[7.5,4],[5,4]]],
    [[[6.25,6],[10,12],[10,4],[7.5,4]]],
  ]), 'swapped divide')
  t.end()
})

test('ignore first=last depth=4', function (t) {
  var A = [
    [
      [[-5,-1],[+0,+4],[+1,+1],[+3,+1],[+3,-1],[+0,-1],[+0,-2],[-4,-2],[-5,-1]],
      [[-3,+0],[-1,+2],[+1,+0],[-3,+0]],
    ],
  ]
  var B = [
    [
      [[-2,+3],[+1,+3],[+1,+5],[+4,+5],[+4,+2],[+2,+2],[+2,-2],[+0,-3],[-2,-1],[-2,+3]],
      [[-0.5,+0.5],[+1.5,+0.5],[+1,-2],[-0.5,+0.5]],
      [[+2,+4],[+3,+4],[+3,+3],[+2,+3],[+2,+4]],
    ],
  ]
  t.ok(peq(pclip.intersect(A,B,xy), [
    [[
      [-2,+1],[-2,+2],[-1,+3],[+1/3,+3],[+1,+1],[+2,+1],[+2,-1],[+1.2,-1],
      [+1.5,+0.5],[+0.5,+0.5],[-1,+2],
    ]],
    [[[-2,+0],[-0.2,+0],[+0.4,-1],[+0,-1],[+0,-2],[-1,-2],[-2,-1]]],
  ], 1e-3), 'intersect')
  t.ok(peq(pclip.exclude(A,B,xy), [
    [[[-2,2],[-5,-1],[-4,-2],[-1,-2],[-2,-1],[-2,0],[-3,0],[-2,1]]],
    [[[-1,3],[0,4],[1/3,3]]],
    [[[-1,3],[-2,3],[-2,2]]],
    [[[2,1],[3,1],[3,-1],[2,-1]]],
    [[[2,-1],[2,-2],[0,-3],[-1,-2],[0,-2],[0,-1],[0.4,-1],[1,-2],[1.2,-1]]],
    [[[1.2,-1],[0.4,-1],[-0.2,0],[1,0],[0.5,0.5],[1.5,0.5]]],
    [
      [[1/3,3],[1,3],[1,5],[4,5],[4,2],[2,2],[2,1],[1,1]],
      [[2,3],[2,4],[3,4],[3,3]],
    ],
    [[[-2,0],[-2,1],[-1,2],[0.5,0.5],[-0.5,0.5],[-0.2,0]]]
  ], 1e-3), 'exclude')
  t.ok(peq(pclip.union(A,B,xy), [
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
  t.ok(peq(pclip.difference(A,B,xy), [
    [[[-2,+2],[-5,-1],[-4,-2],[-1,-2],[-2,-1],[-2,+0],[-3,+0],[-2,+1]]],
    [[[-1,+3],[+0,+4],[+1/3,+3]]],
    [[[-0.2,+0],[+1,+0],[+0.5,+0.5],[+1.5,+0.5],[+1.2,-1],[+0.4,-1]]],
    [[[+2,+1],[+3,+1],[+3,-1],[+2,-1]]],
  ], 1e-3), 'difference')
  t.ok(peq(pclip.divide(A,B,xy), [
    [[[-2,+2],[-5,-1],[-4,-2],[-1,-2],[-2,-1],[-2,+0],[-3,+0],[-2,+1]]],
    [[[-1,+3],[+0,+4],[+1/3,+3]]],
    [[[-0.2,+0],[+1,+0],[+0.5,+0.5],[+1.5,+0.5],[+1.2,-1],[+0.4,-1]]],
    [[[+2,+1],[+3,+1],[+3,-1],[+2,-1]]],
    [[
      [-2,+1],[-2,+2],[-1,+3],[+1/3,+3],[+1,+1],[+2,+1],[+2,-1],[+1.2,-1],
      [+1.5,+0.5],[+0.5,+0.5],[-1,+2],
    ]],
    [[[-2,+0],[-0.2,+0],[+0.4,-1],[+0,-1],[+0,-2],[-1,-2],[-2,-1]]],
  ], 1e-3), 'divide')
  t.ok(peq(pclip.divide(B,A,xy), [
    [[
      [-2,+1],[-2,+2],[-1,+3],[+1/3,+3],[+1,+1],[+2,+1],[+2,-1],[+1.2,-1],
      [+1.5,+0.5],[+0.5,+0.5],[-1,+2],
    ]],
    [[[-2,+0],[-0.2,+0],[+0.4,-1],[+0,-1],[+0,-2],[-1,-2],[-2,-1]]],
    [[[-1,3],[-2,3],[-2,2]]],
    [[[2,-1],[2,-2],[0,-3],[-1,-2],[0,-2],[0,-1],[0.4,-1],[1,-2],[1.2,-1]]],
    [
      [[1/3,3],[1,3],[1,5],[4,5],[4,2],[2,2],[2,1],[1,1]],
      [[2,3],[2,4],[3,4],[3,3]],
    ],
    [[[-2,0],[-2,1],[-1,2],[0.5,0.5],[-0.5,0.5],[-0.2,0]]]
  ], 1e-3), 'swapped divide')
  t.end()
})

test('duplicate last=first point', function (t) {
  var A = [[0,0],[5,8],[10,0]]
  var B = [[5,4],[10,12],[10,4]]
  var opts = Object.assign({ duplicate: true }, xy)
  var ri = pclip.intersect(A,B,opts)
  t.ok(peq(ri,[[[[6.25,6],[7.5,4],[5,4]]]], 1e-3), 'intersect')
  t.deepEqual(ri[0][0][0], ri[0][0][ri[0][0].length-1], 'intersect first=last')
  var re = pclip.exclude(A,B,opts)
  t.ok(peq(re, [
    [[[6.25,6],[5,8],[0,0],[10,0],[7.5,4],[5,4]]],
    [[[6.25,6],[10,12],[10,4],[7.5,4]]],
  ], 1e-3), 'exclude')
  t.deepEqual(re[0][0][0], re[0][0][re[0][0].length-1], 'exclude first=last')
  var ru = pclip.union(A,B,opts)
  t.ok(peq(ru, [
    [[[6.25,6],[10,12],[10,4],[7.5,4],[10,0],[0,0],[5,8]]],
  ]), 'union')
  t.deepEqual(ru[0][0][0], ru[0][0][ru[0][0].length-1], 'union first=last')
  var rd = pclip.difference(A,B,opts)
  t.ok(peq(rd, [
    [[[6.25,6],[5,8],[0,0],[10,0],[7.5,4],[5,4]]],
  ]), 'difference')
  t.deepEqual(rd[0][0][0], rd[0][0][rd[0][0].length-1], 'difference first=last')
  var rdv = pclip.divide(A,B,opts)
  t.ok(peq(rdv, [
    [[[6.25,6],[5,8],[0,0],[10,0],[7.5,4],[5,4]]],
    [[[6.25,6],[7.5,4],[5,4]]],
  ], 1e-3), 'divide')
  t.deepEqual(rdv[0][0][0], rdv[0][0][rdv[0][0].length-1], 'divide first=last')
  var srdv = pclip.divide(B,A,opts)
  t.ok(peq(srdv, [
    [[[6.25,6],[10,12],[10,4],[7.5,4]]],
    [[[6.25,6],[7.5,4],[5,4]]],
  ], 1e-3), 'swapped divide first=last')
  t.deepEqual(srdv[0][0][0], srdv[0][0][srdv[0][0].length-1], 'swapped divide first=last')
  t.end()
})

test('point intersects edge', function (t) {
  var A = [[115,96], [140,206], [120,210], [125,250], [80,300]]
  var B = [[111,228], [129,192], [309,282]]
  t.ok(
    peq(pclip.intersect(A,B,xy), [
      [[[137.82051282051282,196.4102564102564],[140,206],[120,210],
        [122.6470588235294,231.1764705882353],[111,228],[129,192]]],
    ], 1e-3)
    || peq(pclip.intersect(A,B,xy), [
      [[[137.82051282051282,196.4102564102564],[140,206],[120,210],
        [122.6470588235294,231.1764705882353],[111,228],[120,210],[129,192]]],
    ], 1e-3),
    'intersect'
  )
  t.ok(
    peq(pclip.exclude(A,B,xy), [
      [[[137.82051282051282,196.4102564102564],[115,96],[80,300],[125,250],
        [122.6470588235294,231.1764705882353],[111,228],[129,192]]],
      [[[137.82051282051282,196.4102564102564],[309,282],
        [122.6470588235294,231.1764705882353],[120,210],[140,206]]]
    ], 1e-3)
    || peq(pclip.exclude(A,B,xy), [
      [[[137.82051282051282,196.4102564102564],[115,96],[80,300],[125,250],
        [122.6470588235294,231.1764705882353],[111,228],[120,210],[129,192]]],
      [[[137.82051282051282,196.4102564102564],[309,282],
        [122.6470588235294,231.1764705882353],[120,210],[140,206]]]
    ], 1e-3),
    'exclude'
  )
  t.ok(peq(pclip.union(A,B,xy), [
    [[[137.82051282051282,196.4102564102564],[115,96],[80,300],[125,250],
      [122.6470588235294,231.1764705882353],[309,282]]],
  ], 1e-3), 'union')
  t.ok(
    peq(pclip.difference(A,B,xy), [
      [[[137.82051282051282,196.4102564102564],[115,96],[80,300],[125,250],
        [122.6470588235294,231.1764705882353],[111,228],[129,192]]]
    ], 1e-3)
    || peq(pclip.difference(A,B,xy), [
      [[[137.82051282051282,196.4102564102564],[115,96],[80,300],[125,250],
        [122.6470588235294,231.1764705882353],[111,228],[120,210],[129,192]]]
    ], 1e-3),
    'difference'
  )
  t.ok(
    peq(pclip.divide(A,B,xy), [
      [[[137.82051282051282,196.4102564102564],[115,96],[80,300],[125,250],
        [122.6470588235294,231.1764705882353],[111,228],[129,192]]],
      [[[137.82051282051282,196.4102564102564],[140,206],[120,210],
        [122.6470588235294,231.1764705882353],[111,228],[129,192]]],
    ], 1e-3)
    || peq(pclip.divide(A,B,xy), [
      [[[137.82051282051282,196.4102564102564],[115,96],[80,300],[125,250],
        [122.6470588235294,231.1764705882353],[111,228],[120,210],[129,192]]],
      [[[137.82051282051282,196.4102564102564],[140,206],[120,210],
        [122.6470588235294,231.1764705882353],[111,228],[120,210],[129,192]]],
    ], 1e-3),
    'divide'
  )
  t.ok(
    peq(pclip.divide(B,A,xy), [
      [[[137.82051282051282,196.4102564102564],[140,206],[120,210],
        [122.6470588235294,231.1764705882353],[111,228],[129,192]]],
      [[[137.82051282051282,196.4102564102564],[309,282],
        [122.6470588235294,231.1764705882353],[120,210],[140,206]]]
    ], 1e-3)
    || peq(pclip.divide(B,A,xy), [
      [[[137.82051282051282,196.4102564102564],[140,206],[120,210],
        [122.6470588235294,231.1764705882353],[111,228],[120,210],[129,192]]],
      [[[137.82051282051282,196.4102564102564],[309,282],
        [122.6470588235294,231.1764705882353],[120,210],[140,206]]]
    ], 1e-3),
    'swapped divide'
  )
  t.end()
})

test('point shared between polygons', function (t) {
  var A = [[500,200],[225,70],[225,330]]
  var B = [[500,200],[200,373],[200,27]]
  t.ok(peq(pclip.union(A,B,xy), [
    [[[200,373],[200,27],[500,200],[200,373]]]
  ], 1e-3), 'union')
  t.ok(peq(pclip.intersect(A,B,xy), [
    [[[225,330],[225,70],[500,200],[225,330]]],
  ], 1e-3), 'intersect')
  t.ok(peq(pclip.difference(A,B,xy), [], 1e-3), 'difference')
  t.ok(peq(pclip.exclude(A,B,xy), [[
    [[200,373],[200,27],[500,200]],
    [[500,200],[225,70],[225,330]],
  ]], 1e-3), 'exclude')
  t.end()
})

test('2 boxes with shared edge', function (t) {
  var A = [[0,0],[5,0],[5,2],[0,2]]
  var B = [[0,2],[5,2],[5,4],[0,4]]
  t.ok(peq(pclip.intersect(A,B,xy), [], 1e-3), 'intersect')
  t.ok(peq(pclip.intersect(B,A,xy), [], 1e-3), 'flipped intersect')
  t.ok(
    peq(pclip.exclude(A,B,xy), [ // this one is ok
      [[[5,2],[5,0],[0,0],[0,2]]],
      [[[5,2],[5,4],[0,4],[0,2]]],
    ], 1e-3)
    || peq(pclip.union(A,B,xy), [ // this one is better
      [[[0,0],[5,0],[5,2],[5,4],[0,4],[0,2]]],
    ], 1e-3),
    'exclude'
  )
  t.ok(peq(pclip.union(A,B,xy), [
    [[[0,0],[5,0],[5,2],[5,4],[0,4],[0,2]]],
  ], 1e-3), 'union')
  t.ok(peq(pclip.difference(A,B,xy), [
    [[0,0],[5,0],[5,2],[0,2]],
  ], 1e-3), 'difference')
  t.ok(peq(pclip.divide(A,B,xy), [
    [[0,0],[5,0],[5,2],[0,2]],
  ], 1e-3), 'divide')
  t.ok(peq(pclip.divide(B,A,xy), [
    [[0,2],[5,2],[5,4],[0,4]],
  ], 1e-3), 'swapped divide')
  t.end()
})

test('box inside box with shared corner', function (t) {
  var A = [[0,0],[0,5],[5,5],[5,0]]
  var B = [[0,0],[0,2],[2,2],[2,0]]
  t.ok(peq(pclip.intersect(A,B,xy), [
    [[[0,0],[2,0],[2,2],[0,2]]],
  ], 1e-3), 'intersect')
  t.ok(peq(pclip.exclude(A,B,xy), [
    [[[0,5],[5,5],[5,0],[2,0],[2,2],[0,2]]],
  ], 1e-3), 'exclude')
  t.ok(
    peq(pclip.union(A,B,xy), [[[[0,0],[0,5],[5,5],[5,0]]]], 1e-3)
    || peq(pclip.union(A,B,xy), [[[[0,0],[0,2],[0,5],[5,5],[5,0],[2,0]]]], 1e-3),
    'union'
  )
  t.ok(peq(pclip.difference(A,B,xy), [
    [[[0,2],[0,5],[5,5],[5,0],[2,0],[2,2]]]
  ], 1e-3), 'difference')
  t.end()
})

test('box inside box with shared corner and hole', function (t) {
  var A = [[0,0],[0,2],[2,2],[2,0]]
  var B = [[[0,0],[0,5],[5,5],[5,0]],[[1,1],[1,1.5],[1.5,1.5],[1.5,1]]]
  t.ok(peq(pclip.intersect(A,B,xy), [
    [
      [[0,2],[0,0],[2,0],[2,2]],
      [[1,1.5],[1,1],[1.5,1],[1.5,1.5]],
    ],
  ], 1e-3), 'intersect')
  t.ok(peq(pclip.exclude(A,B,xy), [
    [[[0,5],[5,5],[5,0],[2,0],[2,2],[0,2]]],
    [[[1,1.5],[1,1],[1.5,1],[1.5,1.5]]],
  ], 1e-3), 'exclude')
  t.ok(
    peq(pclip.union(A,B,xy), [[[[0,0],[0,5],[5,5],[5,0]]]], 1e-3)
    || peq(pclip.union(A,B,xy), [[[[0,0],[0,2],[0,5],[5,5],[5,0],[2,0]]]], 1e-3),
    'union'
  )
  t.ok(peq(pclip.difference(A,B,xy), [
    [[[1,1.5],[1,1],[1.5,1],[1.5,1.5]]],
  ], 1e-3), 'difference')
  t.end()
})

test('shared edge clipping polygon 1', function (t) {
  var A = [[0,0],[5,8],[10,0]]
  var B = [[[[0,5],[6,5],[6,15]]],[[[10,5],[6,5],[6,15]]]]
  t.ok(peq(pclip.intersect(A,B,xy), [
    [[[3.125,5],[5,8],[6,6.4],[6,5]]],
    [[[6,6.4],[6.875,5],[6,5]]],
  ], 1e-3), 'intersect')
  t.ok(peq(pclip.exclude(A,B,xy), [
    [[[3.125,5],[0,0],[10,0],[6.875,5],[6,5],[6,6.4],[6,5]]],
    [[[6.875,5],[10,5],[6,15],[6,6.4]]],
    [[[3.125,5],[0,5],[6,15],[6,6.4],[5,8]]],
  ], 1e-3), 'exclude')
  t.ok(peq(pclip.union(A,B,xy), [
    [[[3.125,5],[0,0],[10,0],[6.875,5],[10,5],[6,15],[6,6.4],[6,15],[0,5]]]
  ], 1e-3), 'union')
  t.ok(peq(pclip.difference(A,B,xy), [
    [[[3.125,5],[0,0],[10,0],[6.875,5],[6,5],[6,6.4],[6,5]]]
  ], 1e-3), 'difference')
  t.end()
})

test('shared edge clipping polygon 2', function (t) {
  var A = [[0,0],[5,8],[10,0]]
  var B = [[[[10,5],[6,5],[6,15]]],[[[0,5],[6,5],[6,15]]]]
  t.ok(peq(pclip.intersect(A,B,xy), [
    [[[3.125,5],[5,8],[6,6.4],[6,5]]],
    [[[6,6.4],[6.875,5],[6,5]]],
  ], 1e-3), 'intersect')
  t.ok(peq(pclip.exclude(A,B,xy), [
    [[[3.125,5],[0,0],[10,0],[6.875,5],[6,5],[6,6.4],[6,5]]],
    [[[6.875,5],[10,5],[6,15],[6,6.4]]],
    [[[3.125,5],[0,5],[6,15],[6,6.4],[5,8]]],
  ], 1e-3), 'exclude')
  t.ok(peq(pclip.union(A,B,xy), [
    [[[3.125,5],[0,0],[10,0],[6.875,5],[10,5],[6,15],[6,6.4],[6,15],[0,5]]]
  ], 1e-3), 'union')
  t.ok(peq(pclip.difference(A,B,xy), [
    [[[3.125,5],[0,0],[10,0],[6.875,5],[6,5],[6,6.4],[6,5]]]
  ], 1e-3), 'difference')
  t.end()
})

test('zero-area ear', function (t) {
  var A = [[[-141,-116],[-111,-75],[-60,-45],[10,-116]]]
  var B = [[[-111,-125],[-65,-110],[-50,-80],[-31,-135],[-65,-110]]]
  t.ok(peq(pclip.intersect(A,B,xy), [
    [[[-37.5636,-116],[-56.84,-116],[-65,-110],[-83.4,-116],[-65,-110],[-50,-80]]]
  ], 1e-3), 'intersect')
  t.ok(peq(pclip.exclude(A,B,xy), [
    [[[-37.5636,-116],[10,-116],[-60,-45],[-111,-75],[-141,-116],[-83.4,-116],[-65,-110],[-50,-80]]],
    [[[-56.84,-116],[-83.4,-116],[-65,-110]]],[[[-37.5636,-116],[-31,-135],[-56.84,-116]]]
  ], 1e-3), 'exclude')
  t.ok(peq(pclip.union(A,B,xy), [
    [[[-37.5636,-116],[10,-116],[-60,-45],[-111,-75],[-141,-116],
      [-83.4,-116],[-111,-125],[-83.4,-116],[-56.84,-116],[-31,-135]]]
  ], 1e-3), 'union')
  t.ok(peq(pclip.difference(A,B,xy), [
    [[[-37.5636,-116],[10,-116],[-60,-45],[-111,-75],[-141,-116],[-83.4,-116],
      [-65,-110],[-50,-80]]],[[[-56.84,-116],[-83.4,-116],[-65,-110]]]
  ], 1e-3), 'difference')
  t.end()
})

test('2 boxes with edge inside edge', function (t) {
  var A = [[0,0],[0,5],[5,5],[5,0]]
  var B = [[0,1],[-1,1],[-1,2],[0,2]]
  t.ok(peq(pclip.intersect(A,B,xy), [], 1e-3), 'intersect')
  t.ok(
    peq(pclip.exclude(A,B,xy), [ // ok
      [[[0,1],[0,0],[5,0],[5,5],[0,5],[0,2]]],
      [[[0,2],[-1,2],[-1,1],[0,1]]]
    ], 1e-3)
    || peq(pclip.exclude(A,B,xy), [ // best
      [[[0,1],[0,0],[5,0],[5,5],[0,5],[0,2],[-1,2],[-1,1]]]
    ], 1e-3),
    'exclude'
  )
  t.ok(peq(pclip.union(A,B,xy), [
    [[[0,1],[0,0],[5,0],[5,5],[0,5],[0,2],[-1,2],[-1,1]]]
  ], 1e-3), 'union')
  t.ok(peq(pclip.difference(A,B,xy), [
    [[[0,1],[0,0],[5,0],[5,5],[0,5],[0,2]]]
  ], 1e-3), 'difference')
  t.end()
})

test('triangle cuts box on triangle vertex', function (t) {
  var A = [[180,-32],[90,-58],[270,-58]]
  var B = [[[-180,90],[-180,-90],[180,-90],[180,90]]]
  t.ok(peq(pclip.intersect(A,B,xy), [
    [[[180,-58],[90,-58],[180,-32]]],
  ], 1e-3), 'intersect')
  t.ok(peq(pclip.exclude(A,B,xy), [ // ok
    [[[180,-58],[270,-58],[180,-32]]],
    [[[180,-58],[180,-90],[-180,-90],[-180,90],[180,90],[180,-32],[90,-58]]],
  ], 1e-3), 'exclude')
  t.ok(peq(pclip.union(A,B,xy), [
    [[[180,-58],[270,-58],[180,-32],[180,90],[-180,90],[-180,-90],[180,-90]]],
  ], 1e-3), 'union')
  t.ok(peq(pclip.difference(A,B,xy), [
    [[[180,-58],[270,-58],[180,-32]]],
  ], 1e-3), 'difference')
  t.ok(peq(pclip.divide(A,B,xy), [
    [[[180,-58],[270,-58],[180,-32]]],
    [[[180,-58],[90,-58],[180,-32]]],
  ], 1e-3), 'divide')
  t.end()
})

test('pentagon on top right corner', function (t) {
  var A = [[90,58],[180,32],[270,58],[270,90],[90,90]]
  var B = [[-180,-90],[-180,90],[180,90],[180,-90]]
  t.ok(peq(pclip.intersect(A,B,xy), [
    [[[90,58],[180,32],[180,90],[90,90],[90,58]]],
  ], 1e-3), 'intersect')
  t.ok(peq(pclip.exclude(A,B,xy), [ // ok
    [[[-180,-90],[180,-90],[180,32],[90,58],[90,90],[-180,90],[-180,-90]]],
    [[[180,32],[270,58],[270,90],[180,90],[180,32]]],
  ], 1e-3), 'exclude')
  t.ok(peq(pclip.union(A,B,xy), [
    [[[-180,-90],[180,-90],[180,32],[270,58],[270,90],[-180,90],[-180,-90]]],
  ], 1e-3), 'union')
  t.ok(peq(pclip.difference(A,B,xy), [
    [[[180,32],[270,58],[270,90],[180,90],[180,32]]],
  ], 1e-3), 'difference')
  t.end()
})
