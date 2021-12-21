module.exports = function ptEq(a,b,epsilon) {
  if (epsilon === undefined) epsilon = 1e-8
  if (Math.abs(a[0]-b[0]) > epsilon) return false
  if (Math.abs(a[1]-b[1]) > epsilon) return false
  return true
}
