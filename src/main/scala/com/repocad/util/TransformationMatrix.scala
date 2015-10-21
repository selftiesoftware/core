package com.repocad.util

//FROM https://github.com/epistemex/transformation-matrix-js/blob/master/src/matrix.js

/*!
Transformation Matrix v1.9.2
(c) Epistemex 2014-2015
www.epistemex.com
By Ken Fyrstenberg
Contributions by leeoniya.
License: MIT, header required.
*/

/**
 * 2D transformation matrix object initialized with identity matrix.
 *
 * The matrix can synchronize a canvas context by supplying the context
 * as an argument, or later apply current absolute transform to an
 *existing context.
 *
 * All values are handled as doubles.
*/

case class TransformationMatrix(a : Double,b : Double,c : Double,d : Double,e : Double,f : Double) {
//case class TransformationMatrix(t : AffineTransform) {

  /*
  def Matrix(context) = {

    var me = this
    me._t = me.transform

    me.a = me.d = 1
    me.b = me.c = me.e = me.f = 0

    me.context = context

    // reset canvas transformations (if any) to enable 100% sync.
    if (context) context.setTransform(1, 0, 0, 1, 0, 0)
  }
  */

  /**
   * Concatenates transforms of this matrix onto the given child matrix and
   * returns a new matrix. This instance is used on left side.
   *
   * @param cm - child matrix to apply concatenation to
   * @return Matrix
   */
  def concat (cm : TransformationMatrix) = {
    this.transform(cm.a, cm.b, cm.c, cm.d, cm.e, cm.f)
  }

  /**
   * Flips the horizontal values.
   */
  def flipX() = {
    this.transform(-1, 0, 0, 1, 0, 0)
  }

  /**
   * Flips the vertical values.
   */
  def flipY() = {
    this.transform(1, 0, 0, -1, 0, 0)
  }

  /**
   * Reflects incoming (velocity) vector on the normal which will be the
   * current transformed x axis. Call when a trigger condition is met.
   *
   * NOTE: BETA, simple implementation
   *
   * @param {number} x - vector end point for x (start = 0)
   * @param {number} y - vector end point for y (start = 0)
   * @returns {{x: number, y: number}}
   */
  /*
  def reflectVector(x : Double, y : Double) {

    var v = this.applyToPoint(0, 1)
    d = 2 * (v.x * x + v.y * y)

    x -= d * v.x
    y -= d * v.y

    return {x:x, y:y}
  }

  */
  /**
   * Rotates current matrix accumulative by angle.
   * @param {angle} - angle in radians
   */
  def rotate(angle : Double) {
    val cos = math.cos(angle)
    val sin = math.sin(angle)
    this.transform(cos, sin, -sin, cos, 0, 0)
  }

  /*
  /**
   * Converts a vector given as x and y to angle, and
   * rotates (accumulative).
   * @param x
   * @param y
   * @returns {*}
   */
  rotateFromVector: function(x, y) {
    return this.rotate(Math.atan2(y, x))
  },

  /**
   * Helper method to make a rotation based on an angle in degrees.
   * @param {number} angle - angle in degrees
   */
  rotateDeg: function(angle) {
    return this.rotate(angle * Math.PI / 180)
  },

  /**
   * Scales current matrix uniformly and accumulative.
   * @param {number} f - scale factor for both x and y (1 does nothing)
   */
  scaleU: function(f) {
    return this._t(f, 0, 0, f, 0, 0)
  },
  */

  def scale = math.sqrt(a * a + b * b)

  /**
   * Scales current matrix equally in both axes.
   * @param scale Scale factor for both y and x axis (1 does nothing)
   * @return A new matrix with the scale
   */
  def scale(scale : Double) = {
    transform(scale, 0, 0, scale, 0, 0)
  }
  /*
  /**
   * Scales current matrix on x axis accumulative.
   * @param {number} sx - scale factor x (1 does nothing)
   */
  scaleX: function(sx) {
    return this._t(sx, 0, 0, 1, 0, 0)
  },

  /**
   * Scales current matrix on y axis accumulative.
   * @param {number} sy - scale factor y (1 does nothing)
   */
  scaleY: function(sy) {
    return this._t(1, 0, 0, sy, 0, 0)
  },

  /**
   * Apply shear to the current matrix accumulative.
   * @param {number} sx - amount of shear for x
   * @param {number} sy - amount of shear for y
   */
  shear: function(sx, sy) {
    return this._t(1, sy, sx, 1, 0, 0)
  },

  /**
   * Apply shear for x to the current matrix accumulative.
   * @param {number} sx - amount of shear for x
   */
  shearX: function(sx) {
    return this._t(1, 0, sx, 1, 0, 0)
  },

  /**
   * Apply shear for y to the current matrix accumulative.
   * @param {number} sy - amount of shear for y
   */
  shearY: function(sy) {
    return this._t(1, sy, 0, 1, 0, 0)
  },

  /**
   * Apply skew to the current matrix accumulative.
   * @param {number} ax - angle of skew for x
   * @param {number} ay - angle of skew for y
   */
  skew: function(ax, ay) {
    return this.shear(Math.tan(ax), Math.tan(ay))
  },

  /**
   * Apply skew for x to the current matrix accumulative.
   * @param {number} ax - angle of skew for x
   */
  skewX: function(ax) {
    return this.shearX(Math.tan(ax))
  },

  /**
   * Apply skew for y to the current matrix accumulative.
   * @param {number} ay - angle of skew for y
   */
  skewY: function(ay) {
    return this.shearY(Math.tan(ay))


  /**
   * Set current matrix to new absolute matrix.
   * @param {number} a - scale x
   * @param {number} b - shear y
   * @param {number} c - shear x
   * @param {number} d - scale y
   * @param {number} e - translate x
   * @param {number} f - translate y
   */
  setTransform: function(a, b, c, d, e, f) {
    var me = this
    me.a = a
    me.b = b
    me.c = c
    me.d = d
    me.e = e
    me.f = f
    return me._x()
  },

*/

  def translation = Vector2D(e, f)

  /**
   * Translate current matrix accumulative.
   * @param tx - translation for x
   * @param ty - translation for y
   */
  def translate(tx : Double, ty : Double) = {
    transform(1, 0, 0, 1, tx, ty)
  }

  /*

  /**
   * Translate current matrix on x axis accumulative.
   * @param {number} tx - translation for x
   */
  translateX: function(tx) {
    return this._t(1, 0, 0, 1, tx, 0)
  },

  /**
   * Translate current matrix on y axis accumulative.
   * @param {number} ty - translation for y
   */
  translateY: function(ty) {
    return this._t(1, 0, 0, 1, 0, ty)
  },

  */

  /**
   * Multiplies current matrix with new matrix values.
   * @param a2 - scale x
   * @param b2 - shear y
   * @param c2 - shear x
   * @param d2 - scale y
   * @param e2 - translate x
   * @param f2 - translate y
   */
  def transform(a2 : Double, b2  : Double, c2 : Double, d2 : Double, e2 : Double, f2 : Double) = {
    /* matrix order (canvas compatible):
    * ace
    * bdf
    * 001
    */
    val newA = a * a2 + c * b2
    val newB = b * a2 + d * b2
    val newC = a * c2 + c * d2
    val newD = b * c2 + d * d2
    val newE = a * e2 + c * f2 + e
    val newF = b * e2 + d * f2 + f
    TransformationMatrix(newA, newB, newC, newD, newE, newF)
  }

  /*
  /**
   * Divide this matrix on input matrix which must be invertible.
   * @param {Matrix} m - matrix to divide on (divisor)
   * @returns {Matrix}
   */
  divide: function(m) {

    if (!m.isInvertible())
      throw "Input matrix is not invertible"

    var im = m.inverse()

    return this._t(im.a, im.b, im.c, im.d, im.e, im.f)
  },

  /**
   * Divide current matrix on scalar value != 0.
   * @param {number} d - divisor (can not be 0)
   * @returns {Matrix}
   */
  divideScalar: function(d) {

    var me = this
    me.a /= d
    me.b /= d
    me.c /= d
    me.d /= d
    me.e /= d
    me.f /= d

    return me._x()
  },
*/
  /**
   * Get an inverse matrix of current matrix. The method returns a new
   * matrix with values you need to use to get to an identity matrix.
   * Context from parent matrix is not applied to the returned matrix.
   * Thanks to <a href="http://phrogz.net/tmp/canvas_zoom_to_cursor.html">Gavin Kistner</a>
   * @return An inverted transformation matrix
   */
  def inverse = {
    val dt = a * d - b * c	// determinant(), skip DRY here...

    val newA = d / dt
    val newB = -b / dt
    val newC = -c / dt
    val newD = a / dt
    val newE = (c * f - d * e) / dt
    val newF = -(a * f - b * e) / dt

    new TransformationMatrix(newA, newB, newC, newD, newE, newF)
  }
/*
  /**
   * Interpolate this matrix with another and produce a new matrix.
   * t is a value in the range [0.0, 1.0] where 0 is this instance and
   * 1 is equal to the second matrix. The t value is not constrained.
   *
   * Context from parent matrix is not applied to the returned matrix.
   *
   * @param {Matrix} m2 - the matrix to interpolate with.
   * @param {number} t - interpolation [0.0, 1.0]
   * @param {CanvasRenderingContext2D} [context] - optional context to affect
   * @returns {Matrix} - new instance with the interpolated result
   */
  interpolate: function(m2, t, context) {

    var me = this,
    m = context ? new Matrix(context) : new Matrix()

    m.a = me.a + (m2.a - me.a) * t
    m.b = me.b + (m2.b - me.b) * t
    m.c = me.c + (m2.c - me.c) * t
    m.d = me.d + (m2.d - me.d) * t
    m.e = me.e + (m2.e - me.e) * t
    m.f = me.f + (m2.f - me.f) * t

    return m._x()
  },

  /**
   * Decompose the current matrix into simple transforms using either
   * QR (default) or LU decomposition. Code adapted from
   * http://www.maths-informatique-jeux.com/blog/frederic/?post/2013/12/01/Decomposition-of-2D-transform-matrices
   *
   * The result must be applied in the following order to reproduce the current matrix:
   *
   *     QR: translate -> rotate -> scale -> skewX
   *     LU: translate -> skewY  -> scale -> skewX
   *
   * @param {boolean} [useLU=false] - set to true to use LU rather than QR algorithm
   * @returns {*} - an object containing current decomposed values (rotate, skew, scale, translate)
   */
  decompose: function(useLU) {

    var me = this,
    a = me.a,
    b = me.b,
    c = me.c,
    d = me.d,
    acos = Math.acos,
    atan = Math.atan,
    sqrt = Math.sqrt,
    pi = Math.PI,

    translate = {x: me.e, y: me.f},
    rotation  = 0,
    scale     = {x: 1, y: 1},
    skew      = {x: 0, y: 0},

    determ = a * d - b * c	// determinant(), skip DRY here...

    if (useLU) {
      if (a) {
        skew = {x:atan(c/a), y:atan(b/a)}
        scale = {x:a, y:determ/a}
      }
      else if (b) {
        rotation = pi * 0.5
        scale = {x:b, y:determ/b}
        skew.x = atan(d/b)
      }
      else { // a = b = 0
        scale = {x:c, y:d}
        skew.x = pi * 0.25
      }
    }
    else {
      // Apply the QR-like decomposition.
      if (a || b) {
        var r = sqrt(a*a + b*b)
        rotation = b > 0 ? acos(a/r) : -acos(a/r)
        scale = {x:r, y:determ/r}
        skew.x = atan((a*c + b*d) / (r*r))
      }
      else if (c || d) {
        var s = sqrt(c*c + d*d)
        rotation = pi * 0.5 - (d > 0 ? acos(-c/s) : -acos(c/s))
        scale = {x:determ/s, y:s}
        skew.y = atan((a*c + b*d) / (s*s))
      }
      else { // a = b = c = d = 0
        scale = {x:0, y:0}		// = invalid matrix
      }
    }

    return {
      scale    : scale,
      translate: translate,
      rotation : rotation,
      skew     : skew
    }
  },

  /**
   * Returns the determinant of the current matrix.
   * @returns {number}
   */
  determinant : function() {
    return this.a * this.d - this.b * this.c
  },
  */
  /**
   * Apply current matrix to x and y point.
   * Returns a point object.
   *
   * @param x - value for x
   * @param y - value for y
   * @return A new transformed Vector2D
   */
  def applyToPoint(x : Double, y : Double) = {
    Vector2D(x * a + y * c + e, x * b + y * d + f)
  }

  /*

  /**
   * Apply current matrix to array with point objects or point pairs.
   * Returns a new array with points in the same format as the input array.
   *
   * A point object is an object literal:
   *
   * {x: x, y: y}
   *
   * so an array would contain either:
   *
   * [{x: x1, y: y1}, {x: x2, y: y2}, ... {x: xn, y: yn}]
   *
   * or
   * [x1, y1, x2, y2, ... xn, yn]
   *
   * @param {Array} points - array with point objects or pairs
   * @returns {Array} A new array with transformed points
   */
  applyToArray: function(points) {

    var i = 0, p, l,
    mxPoints = []

    if (typeof points[0] === 'number') {

      l = points.length

      while(i < l) {
        p = this.applyToPoint(points[i++], points[i++])
        mxPoints.push(p.x, p.y)
      }
    }
    else {
      for( p = points[i] i++) {
        mxPoints.push(this.applyToPoint(p.x, p.y))
      }
    }

    return mxPoints
  },

  /**
   * Apply current matrix to a typed array with point pairs. Although
   * the input array may be an ordinary array, this method is intended
   * for more performant use where typed arrays are used. The returned
   * array is regardless always returned as a Float32Array.
   *
   * @param {*} points - (typed) array with point pairs
   * @param {boolean} [use64=false] - use Float64Array instead of Float32Array
   * @returns {*} A new typed array with transformed points
   */
  applyToTypedArray: function(points, use64) {

    var i = 0, p,
    l = points.length,
    mxPoints = use64 ? new Float64Array(l) : new Float32Array(l)

    while(i < l) {
      p = this.applyToPoint(points[i], points[i+1])
      mxPoints[i++] = p.x
      mxPoints[i++] = p.y
    }

    return mxPoints
  },

  /**
   * Apply to any canvas 2D context object. This does not affect the
   * context that optionally was referenced in constructor unless it is
   * the same context.
   * @param {CanvasRenderingContext2D} context
   */
  applyToContext: function(context) {
    var me = this
    context.setTransform(me.a, me.b, me.c, me.d, me.e, me.f)
    return me
  },

  /**
   * Returns true if matrix is an identity matrix (no transforms applied).
   * @returns {boolean} True if identity (not transformed)
   */
  isIdentity: function() {
    var me = this
    return (me._q(me.a, 1) &&
      me._q(me.b, 0) &&
      me._q(me.c, 0) &&
      me._q(me.d, 1) &&
      me._q(me.e, 0) &&
      me._q(me.f, 0))
  },

  /**
   * Returns true if matrix is invertible
   * @returns {boolean}
   */
  isInvertible: function() {
    return !this._q(this.determinant(), 0)
  },

  /**
   * Test if matrix is valid.
   */
  isValid : function() {
    return !this._q(this.a * this.d, 0)
  },
*/

}

object TransformationMatrix {
  def apply() = new TransformationMatrix(1, 0, 0, 1, 0, 10)
}