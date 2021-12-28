module.exports = function getDepth(x) {
  for (var d = 0; Array.isArray(x); d++) { x = x[0] }
  return d
}
