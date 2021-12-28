module.exports = function mPointInPolygon(f,p,B,dB) {
  if (dB === 2) {
    return f(p,B)
  } else if (dB === 3) {
    if (!f(p,B[0])) return false
    for (var i = 1; i < B.length; i++) {
      if (f(p,B[i])) return false
    }
    return true
  } else if (dB === 4) {
    for (var i = 0; i < B.length; i++) {
      if (!f(p,B[i][0])) continue
      for (var j = 1; j < B[i].length; j++) {
        if (f(p,B[i][j])) break
      }
      if (j === B[i].length) return true
    }
    return false
  } else {
    throw new Error('unexpected dB='+dB)
  }
}
