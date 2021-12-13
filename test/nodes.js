var test = require('tape')
var calcNodes = require('../lib/nodes.js')

test('nodes', function (t) {
  var A = [[0,0],[5,8],[10,0]]
  var B = [[5,4],[10,12],[10,4]]
  var optList = [
    {
      intersect: require('line-segment-intersect-2d'),
      pointInPolygon: require('point-in-polygon'),
      distance: require('gl-vec2/distance'),
    },
    {
      intersect: require('intersect-great-circle'),
      pointInPolygon: require('geo-point-in-polygon'),
      distance: require('haversine-distance'),
    },
  ]
  optList.forEach(function (opts) {
    var npoints = [], nodes = Array(A.length+B.length)
    calcNodes(nodes, npoints, A, B, opts)
    t.deepEqual(fields(nodes[0]), {
      intersect: false,
      entry: false,
      next: 1,
      prev: 2,
      neighbor: -1
    }, 'nodes[0]')
    t.deepEqual(fields(nodes[1]), {
      intersect: false,
      entry: false,
      next: 6,
      prev: 0,
      neighbor: -1
    }, 'nodes[1]')
    t.deepEqual(fields(nodes[2]), {
      intersect: false,
      entry: false,
      next: 0,
      prev: 8,
      neighbor: -1
    }, 'nodes[2]')
    t.deepEqual(fields(nodes[3]), {
      intersect: false,
      entry: false,
      next: 7,
      prev: 9,
      neighbor: -1
    }, 'nodes[3]')
    t.deepEqual(fields(nodes[4]), {
      intersect: false,
      entry: false,
      next: 5,
      prev: 7,
      neighbor: -1
    }, 'nodes[4]')
    t.deepEqual(fields(nodes[5]), {
      intersect: false,
      entry: false,
      next: 9,
      prev: 4,
      neighbor: -1
    }, 'nodes[5]')
    t.deepEqual(fields(nodes[6]), {
      intersect: true,
      entry: false,
      next: 8,
      prev: 1,
      neighbor: 7
    }, 'nodes[6]')
    t.deepEqual(fields(nodes[7]), {
      intersect: true,
      entry: false,
      next: 4,
      prev: 3,
      neighbor: 6
    }, 'nodes[7]')
    t.deepEqual(fields(nodes[8]), {
      intersect: true,
      entry: true,
      next: 2,
      prev: 6,
      neighbor: 9
    }, 'nodes[8]')
    t.deepEqual(fields(nodes[9]), {
      intersect: true,
      entry: true,
      next: 3,
      prev: 5,
      neighbor: 8
    }, 'nodes[9]')
  })
  t.end()
})

function fields(node) {
  return {
    intersect: node.intersect,
    entry: node.entry,
    next: node.next,
    prev: node.prev,
    neighbor: node.neighbor,
  }
}
