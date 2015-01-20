'use strict';
/* Scala.js runtime support
 * Copyright 2013 LAMP/EPFL
 * Author: Sébastien Doeraene
 */

/* ---------------------------------- *
 * The top-level Scala.js environment *
 * ---------------------------------- */

var ScalaJS = {
  // Fields
  g: (typeof global === "object" && global && global["Object"] === Object) ? global : this, // Global scope
  e: (typeof __ScalaJSEnv === "object" && __ScalaJSEnv &&
      typeof __ScalaJSEnv["exportsNamespace"] === "object" &&
      __ScalaJSEnv["exportsNamespace"]) ? __ScalaJSEnv["exportsNamespace"] : // Where to send exports
      ((typeof global === "object" && global && global["Object"] === Object) ? global : this),
  d: {},         // Data for types
  c: {},         // Scala.js constructors
  h: {},         // Inheritable constructors (without initialization code)
  i: {},         // Implementation class modules
  n: {},         // Module instances
  m: {},         // Module accessors
  is: {},        // isInstanceOf methods
  as: {},        // asInstanceOf methods
  isArrayOf: {}, // isInstanceOfArrayOf methods
  asArrayOf: {}, // asInstanceOfArrayOf methods

  // Core mechanism

  makeIsArrayOfPrimitive: function(primitiveData) {
    return function(obj, depth) {
      return !!(obj && obj.$classData &&
        (obj.$classData.arrayDepth === depth) &&
        (obj.$classData.arrayBase === primitiveData));
    }
  },

  makeAsArrayOfPrimitive: function(isInstanceOfFunction, arrayEncodedName) {
    return function(obj, depth) {
      if (isInstanceOfFunction(obj, depth) || (obj === null))
        return obj;
      else
        ScalaJS.throwArrayCastException(obj, arrayEncodedName, depth);
    }
  },

  /** Encode a property name for runtime manipulation
   *  Usage:
   *    env.propertyName({someProp:0})
   *  Returns:
   *    "someProp"
   *  Useful when the property is renamed by a global optimizer (like Closure)
   *  but we must still get hold of a string of that name for runtime
   * reflection.
   */
  propertyName: function(obj) {
    var result;
    for (var prop in obj)
      result = prop;
    return result;
  },

  // Runtime functions

  isScalaJSObject: function(obj) {
    return !!(obj && obj.$classData);
  },

  throwClassCastException: function(instance, classFullName) {
    throw new ScalaJS.c.jl_ClassCastException().init___T(
      instance + " is not an instance of " + classFullName);
  },

  throwArrayCastException: function(instance, classArrayEncodedName, depth) {
    for (; depth; --depth)
      classArrayEncodedName = "[" + classArrayEncodedName;
    ScalaJS.throwClassCastException(instance, classArrayEncodedName);
  },

  wrapJavaScriptException: function(exception) {
    if (ScalaJS.isScalaJSObject(exception))
      return exception;
    else
      return new ScalaJS.c.sjs_js_JavaScriptException()
        .init___sjs_js_Any(exception);
  },

  unwrapJavaScriptException: function(exception) {
    if (ScalaJS.is.sjs_js_JavaScriptException(exception))
      return exception.exception__sjs_js_Any();
    else
      return exception;
  },

  makeNativeArrayWrapper: function(arrayClassData, nativeArray) {
    return new arrayClassData.constr(nativeArray);
  },

  newArrayObject: function(arrayClassData, lengths) {
    return ScalaJS.newArrayObjectInternal(arrayClassData, lengths, 0);
  },

  newArrayObjectInternal: function(arrayClassData, lengths, lengthIndex) {
    var result = new arrayClassData.constr(lengths[lengthIndex]);

    if (lengthIndex < lengths.length-1) {
      var subArrayClassData = arrayClassData.componentData;
      var subLengthIndex = lengthIndex+1;
      var underlying = result.u;
      for (var i = 0; i < underlying.length; i++) {
        underlying[i] = ScalaJS.newArrayObjectInternal(
          subArrayClassData, lengths, subLengthIndex);
      }
    }

    return result;
  },

  cloneObject: function(obj) {
    function Clone(from) {
      for (var field in from)
        if (from["hasOwnProperty"](field))
          this[field] = from[field];
    }
    Clone.prototype = ScalaJS.g["Object"]["getPrototypeOf"](obj);
    return new Clone(obj);
  },

  applyMethodWithVarargs: function(instance, methodName, argArray) {
    // Note: cannot be inlined because `instance` would be evaluated twice
    return instance[methodName].apply(instance, argArray);
  },

  newInstanceWithVarargs: function(constructor, argArray) {
    // Not really "possible" in JavaScript, so we emulate what it would be
    function c() {};
    c.prototype = constructor.prototype;
    var instance = new c;
    var result = constructor.apply(instance, argArray);
    switch (typeof result) {
      case "undefined":
      case "number":
      case "boolean":
      case "string":
        return instance;
      default:
        if (result === null)
          return instance;
        else
          return result;
    }
  },

  checkNonNull: function(obj) {
    return obj !== null ? obj : ScalaJS.throwNullPointerException();
  },

  throwNullPointerException: function() {
    throw new ScalaJS.c.jl_NullPointerException().init___();
  },

  anyEqEq: function(lhs, rhs) {
    if (ScalaJS.isScalaJSObject(lhs) || typeof lhs === "number") {
      return ScalaJS.m.sr_BoxesRunTime().equals__O__O__Z(lhs, rhs);
    } else {
      return lhs === rhs;
    }
  },

  anyRefEqEq: function(lhs, rhs) {
    if (lhs === null)
      return rhs === null;
    else
      return ScalaJS.objectEquals(lhs, rhs);
  },

  objectToString: function(instance) {
    if (instance === void 0)
      return "undefined";
    else
      return instance.toString();
  },

  objectGetClass: function(instance) {
    switch (typeof instance) {
      case "string":
        return ScalaJS.d.T.getClassOf();
      case "number":
        if (ScalaJS.isInt(instance))
          return ScalaJS.d.jl_Integer.getClassOf();
        else
          return ScalaJS.d.jl_Double.getClassOf();
      case "boolean":
        return ScalaJS.d.jl_Boolean.getClassOf();
      case "undefined":
        return ScalaJS.d.sr_BoxedUnit.getClassOf();
      default:
        if (instance === null)
          ScalaJS.throwNullPointerException();
        else if (ScalaJS.is.sjsr_RuntimeLong(instance))
          return ScalaJS.d.jl_Long.getClassOf();
        else if (ScalaJS.isScalaJSObject(instance))
          return instance.$classData.getClassOf();
        else
          return null; // Exception?
    }
  },

  objectClone: function(instance) {
    if (ScalaJS.isScalaJSObject(instance) || (instance === null))
      return instance.clone__O();
    else
      throw new ScalaJS.c.jl_CloneNotSupportedException().init___();
  },

  objectNotify: function(instance) {
    // final and no-op in java.lang.Object
    if (instance === null)
      instance.notify__V();
  },

  objectNotifyAll: function(instance) {
    // final and no-op in java.lang.Object
    if (instance === null)
      instance.notifyAll__V();
  },

  objectFinalize: function(instance) {
    if (ScalaJS.isScalaJSObject(instance) || (instance === null))
      instance.finalize__V();
    // else no-op
  },

  objectEquals: function(instance, rhs) {
    if (ScalaJS.isScalaJSObject(instance) || (instance === null))
      return instance.equals__O__Z(rhs);
    else if (typeof instance === "number")
      return typeof rhs === "number" && ScalaJS.numberEquals(instance, rhs);
    else
      return instance === rhs;
  },

  numberEquals: function(lhs, rhs) {
    return (
      lhs === rhs // 0.0 === -0.0 to prioritize the Int case over the Double case
    ) || (
      // are they both NaN?
      (lhs !== lhs) && (rhs !== rhs)
    );
  },

  objectHashCode: function(instance) {
    switch (typeof instance) {
      case "string":
        // calculate hash of String as specified by JavaDoc
        var n = ScalaJS.uI(instance["length"]);
        var res = 0;
        var mul = 1; // holds pow(31, n-i-1)
        // multiplications with `mul` do never overflow the 52 bits of precision:
        // - we truncate `mul` to 32 bits on each operation
        // - 31 has 5 significant bits only
        // - s[i] has 16 significant bits max
        // 32 + max(5, 16) = 48 < 52 => no overflow
        for (var i = n-1; i >= 0; --i) {
          var cc = ScalaJS.uI(instance["charCodeAt"](i)) & 0xffff;
          // calculate s[i] * pow(31, n-i-1)
          res = res + (cc * mul | 0) | 0
          // update mul for next iteration
          mul = mul * 31 | 0
        }
        return res;
      case "number":
        return instance | 0;
      case "boolean":
        return instance ? 1231 : 1237;
      case "undefined":
        return 0;
      default:
        if (ScalaJS.isScalaJSObject(instance) || instance === null)
          return instance.hashCode__I();
        else
          return 42; // TODO?
    }
  },

  comparableCompareTo: function(instance, rhs) {
    switch (typeof instance) {
      case "string":
        ScalaJS.as.T(rhs);
        return instance === rhs ? 0 : (instance < rhs ? -1 : 1);
      case "number":
        ScalaJS.as.jl_Number(rhs);
        return ScalaJS.numberEquals(instance, rhs) ? 0 : (instance < rhs ? -1 : 1);
      case "boolean":
        ScalaJS.asBoolean(rhs);
        return instance - rhs; // yes, this gives the right result
      default:
        return instance.compareTo__O__I(rhs);
    }
  },

  charSequenceLength: function(instance) {
    if (typeof(instance) === "string")
      return ScalaJS.uI(instance["length"]);
    else
      return instance.length__I();
  },

  charSequenceCharAt: function(instance, index) {
    if (typeof(instance) === "string")
      return ScalaJS.uI(instance["charCodeAt"](index)) & 0xffff;
    else
      return instance.charAt__I__C(index);
  },

  charSequenceSubSequence: function(instance, start, end) {
    if (typeof(instance) === "string")
      return ScalaJS.as.T(instance["substring"](start, end));
    else
      return instance.subSequence__I__I__jl_CharSequence(start, end);
  },

  booleanBooleanValue: function(instance) {
    if (typeof instance === "boolean") return instance;
    else                               return instance.booleanValue__Z();
  },

  numberByteValue: function(instance) {
    if (typeof instance === "number") return (instance << 24) >> 24;
    else                              return instance.byteValue__B();
  },
  numberShortValue: function(instance) {
    if (typeof instance === "number") return (instance << 16) >> 16;
    else                              return instance.shortValue__S();
  },
  numberIntValue: function(instance) {
    if (typeof instance === "number") return instance | 0;
    else                              return instance.intValue__I();
  },
  numberLongValue: function(instance) {
    if (typeof instance === "number")
      return ScalaJS.m.sjsr_RuntimeLongImpl().fromDouble__D__sjsr_RuntimeLong(instance);
    else
      return instance.longValue__J();
  },
  numberFloatValue: function(instance) {
    if (typeof instance === "number") return instance;
    else                              return instance.floatValue__F();
  },
  numberDoubleValue: function(instance) {
    if (typeof instance === "number") return instance;
    else                              return instance.doubleValue__D();
  },

  isNaN: function(instance) {
    return instance !== instance;
  },

  isInfinite: function(instance) {
    return !ScalaJS.g["isFinite"](instance) && !ScalaJS.isNaN(instance);
  },

  propertiesOf: function(obj) {
    var result = new Array();
    for (var prop in obj)
      result["push"](prop.toString());
    return result;
  },

  systemArraycopy: function(src, srcPos, dest, destPos, length) {
    var srcu = src.u;
    var destu = dest.u;
    if (srcu !== destu || destPos < srcPos || srcPos + length < destPos) {
      for (var i = 0; i < length; i++)
        destu[destPos+i] = srcu[srcPos+i];
    } else {
      for (var i = length-1; i >= 0; i--)
        destu[destPos+i] = srcu[srcPos+i];
    }
  },

  systemIdentityHashCode: function(obj) {
    // TODO Do something smarter than this
    return 42;
  },

  environmentInfo: function() {
    if (typeof __ScalaJSEnv !== "undefined")
      return __ScalaJSEnv;
    else
      return void 0;
  },

  // is/as for hijacked boxed classes (the non-trivial ones)

  isByte: function(v) {
    return (v << 24 >> 24) === v;
  },

  isShort: function(v) {
    return (v << 16 >> 16) === v;
  },

  isInt: function(v) {
    return (v | 0) === v;
  },

  asUnit: function(v) {
    if (v === void 0)
      return v;
    else
      ScalaJS.throwClassCastException(v, "scala.runtime.BoxedUnit");
  },

  asBoolean: function(v) {
    if (typeof v === "boolean" || v === null)
      return v;
    else
      ScalaJS.throwClassCastException(v, "java.lang.Boolean");
  },

  asByte: function(v) {
    if (ScalaJS.isByte(v) || v === null)
      return v;
    else
      ScalaJS.throwClassCastException(v, "java.lang.Byte");
  },

  asShort: function(v) {
    if (ScalaJS.isShort(v) || v === null)
      return v;
    else
      ScalaJS.throwClassCastException(v, "java.lang.Short");
  },

  asInt: function(v) {
    if (ScalaJS.isInt(v) || v === null)
      return v;
    else
      ScalaJS.throwClassCastException(v, "java.lang.Integer");
  },

  asFloat: function(v) {
    if (typeof v === "number" || v === null)
      return v;
    else
      ScalaJS.throwClassCastException(v, "java.lang.Float");
  },

  asDouble: function(v) {
    if (typeof v === "number" || v === null)
      return v;
    else
      ScalaJS.throwClassCastException(v, "java.lang.Double");
  },

  // Boxes

  bC: function(value) {
    return new ScalaJS.c.jl_Character().init___C(value);
  },

  // Unboxes

  uZ: function(value) {
    return !!ScalaJS.asBoolean(value);
  },
  uC: function(value) {
    return null === value ? 0 : ScalaJS.as.jl_Character(value).value$1;
  },
  uB: function(value) {
    return ScalaJS.asByte(value) | 0;
  },
  uS: function(value) {
    return ScalaJS.asShort(value) | 0;
  },
  uI: function(value) {
    return ScalaJS.asInt(value) | 0;
  },
  uJ: function(value) {
    return null === value ? ScalaJS.m.sjsr_RuntimeLongImpl().Zero$1
                          : ScalaJS.as.sjsr_RuntimeLong(value);
  },
  uF: function(value) {
    return +ScalaJS.asFloat(value);
  },
  uD: function(value) {
    return +ScalaJS.asDouble(value);
  },

  // TypeArray conversions

  byteArray2TypedArray: function(value) { return new Int8Array(value.u); },
  shortArray2TypedArray: function(value) { return new Int16Array(value.u); },
  charArray2TypedArray: function(value) { return new Uint16Array(value.u); },
  intArray2TypedArray: function(value) { return new Int32Array(value.u); },
  floatArray2TypedArray: function(value) { return new Float32Array(value.u); },
  doubleArray2TypedArray: function(value) { return new Float64Array(value.u); },

  typedArray2ByteArray: function(value) {
    var arrayClassData = ScalaJS.d.B.getArrayOf();
    return new arrayClassData.constr(new Int8Array(value));
  },
  typedArray2ShortArray: function(value) {
    var arrayClassData = ScalaJS.d.S.getArrayOf();
    return new arrayClassData.constr(new Int16Array(value));
  },
  typedArray2CharArray: function(value) {
    var arrayClassData = ScalaJS.d.C.getArrayOf();
    return new arrayClassData.constr(new Uint16Array(value));
  },
  typedArray2IntArray: function(value) {
    var arrayClassData = ScalaJS.d.I.getArrayOf();
    return new arrayClassData.constr(new Int32Array(value));
  },
  typedArray2FloatArray: function(value) {
    var arrayClassData = ScalaJS.d.F.getArrayOf();
    return new arrayClassData.constr(new Float32Array(value));
  },
  typedArray2DoubleArray: function(value) {
    var arrayClassData = ScalaJS.d.D.getArrayOf();
    return new arrayClassData.constr(new Float64Array(value));
  }
}

/* We have to force a non-elidable *read* of ScalaJS.e, otherwise Closure will
 * eliminate it altogether, along with all the exports, which is ... er ...
 * plain wrong.
 */
this["__ScalaJSExportsNamespace"] = ScalaJS.e;

// Type data constructors

/** @constructor */
ScalaJS.PrimitiveTypeData = function(zero, arrayEncodedName, displayName) {
  // Runtime support
  this.constr = undefined;
  this.parentData = undefined;
  this.ancestors = {};
  this.componentData = null;
  this.zero = zero;
  this.arrayEncodedName = arrayEncodedName;
  this._classOf = undefined;
  this._arrayOf = undefined;
  this.isArrayOf = function(obj, depth) { return false; };

  // java.lang.Class support
  this["name"] = displayName;
  this["isPrimitive"] = true;
  this["isInterface"] = false;
  this["isArrayClass"] = false;
  this["isInstance"] = function(obj) { return false; };
};

/** @constructor */
ScalaJS.ClassTypeData = function(internalNameObj, isInterface, fullName,
                                 parentData, ancestors, isInstance, isArrayOf) {
  var internalName = ScalaJS.propertyName(internalNameObj);

  isInstance = isInstance || function(obj) {
    return !!(obj && obj.$classData && obj.$classData.ancestors[internalName]);
  };

  isArrayOf = isArrayOf || function(obj, depth) {
    return !!(obj && obj.$classData && (obj.$classData.arrayDepth === depth)
      && obj.$classData.arrayBase.ancestors[internalName])
  };

  // Runtime support
  this.constr = undefined;
  this.parentData = parentData;
  this.ancestors = ancestors;
  this.componentData = null;
  this.zero = null;
  this.arrayEncodedName = "L"+fullName+";";
  this._classOf = undefined;
  this._arrayOf = undefined;
  this.isArrayOf = isArrayOf;

  // java.lang.Class support
  this["name"] = fullName;
  this["isPrimitive"] = false;
  this["isInterface"] = isInterface;
  this["isArrayClass"] = false;
  this["isInstance"] = isInstance;
};

/** @constructor */
ScalaJS.ArrayTypeData = function(componentData) {
  // The constructor

  var componentZero = componentData.zero;

  // The zero for the Long runtime representation
  // is a special case here, since the class has not
  // been defined yet, when this file is read
  if (componentZero == "longZero")
    componentZero = ScalaJS.m.sjsr_RuntimeLongImpl().Zero$1;

  /** @constructor */
  var ArrayClass = function(arg) {
    if (typeof(arg) === "number") {
      // arg is the length of the array
      this.u = new Array(arg);
      for (var i = 0; i < arg; i++)
        this.u[i] = componentZero;
    } else {
      // arg is a native array that we wrap
      this.u = arg;
    }
  }
  ArrayClass.prototype = new ScalaJS.h.O;
  ArrayClass.prototype.constructor = ArrayClass;
  ArrayClass.prototype.$classData = this;

  ArrayClass.prototype.clone__O = function() {
    if (this.u instanceof Array)
      return new ArrayClass(this.u["slice"](0));
    else
      // The underlying Array is a TypedArray
      return new ArrayClass(this.u.constructor(this.u));
  };

  // Don't generate reflective call proxies. The compiler special cases
  // reflective calls to methods on scala.Array

  // The data

  var encodedName = "[" + componentData.arrayEncodedName;
  var componentBase = componentData.arrayBase || componentData;
  var componentDepth = componentData.arrayDepth || 0;
  var arrayDepth = componentDepth + 1;

  var isInstance = function(obj) {
    return componentBase.isArrayOf(obj, arrayDepth);
  }

  // Runtime support
  this.constr = ArrayClass;
  this.parentData = ScalaJS.d.O;
  this.ancestors = {O: 1};
  this.componentData = componentData;
  this.arrayBase = componentBase;
  this.arrayDepth = arrayDepth;
  this.zero = null;
  this.arrayEncodedName = encodedName;
  this._classOf = undefined;
  this._arrayOf = undefined;
  this.isArrayOf = undefined;

  // java.lang.Class support
  this["name"] = encodedName;
  this["isPrimitive"] = false;
  this["isInterface"] = false;
  this["isArrayClass"] = true;
  this["isInstance"] = isInstance;
};

ScalaJS.ClassTypeData.prototype.getClassOf = function() {
  if (!this._classOf)
    this._classOf = new ScalaJS.c.jl_Class().init___jl_ScalaJSClassData(this);
  return this._classOf;
};

ScalaJS.ClassTypeData.prototype.getArrayOf = function() {
  if (!this._arrayOf)
    this._arrayOf = new ScalaJS.ArrayTypeData(this);
  return this._arrayOf;
};

// java.lang.Class support

ScalaJS.ClassTypeData.prototype["getFakeInstance"] = function() {
  if (this === ScalaJS.d.T)
    return "some string";
  else if (this === ScalaJS.d.jl_Boolean)
    return false;
  else if (this === ScalaJS.d.jl_Byte ||
           this === ScalaJS.d.jl_Short ||
           this === ScalaJS.d.jl_Integer ||
           this === ScalaJS.d.jl_Float ||
           this === ScalaJS.d.jl_Double)
    return 0;
  else if (this === ScalaJS.d.jl_Long)
    return ScalaJS.m.sjsr_RuntimeLongImpl().Zero$1;
  else if (this === ScalaJS.d.sr_BoxedUnit)
    return void 0;
  else
    return {$classData: this};
};

ScalaJS.ClassTypeData.prototype["getSuperclass"] = function() {
  return this.parentData ? this.parentData.getClassOf() : null;
};

ScalaJS.ClassTypeData.prototype["getComponentType"] = function() {
  return this.componentData ? this.componentData.getClassOf() : null;
};

ScalaJS.ClassTypeData.prototype["newArrayOfThisClass"] = function(lengths) {
  var arrayClassData = this;
  for (var i = 0; i < lengths.length; i++)
    arrayClassData = arrayClassData.getArrayOf();
  return ScalaJS.newArrayObject(arrayClassData, lengths);
};

ScalaJS.PrimitiveTypeData.prototype = ScalaJS.ClassTypeData.prototype;
ScalaJS.ArrayTypeData.prototype = ScalaJS.ClassTypeData.prototype;

// Create primitive types

ScalaJS.d.V = new ScalaJS.PrimitiveTypeData(undefined, "V", "void");
ScalaJS.d.Z = new ScalaJS.PrimitiveTypeData(false, "Z", "boolean");
ScalaJS.d.C = new ScalaJS.PrimitiveTypeData(0, "C", "char");
ScalaJS.d.B = new ScalaJS.PrimitiveTypeData(0, "B", "byte");
ScalaJS.d.S = new ScalaJS.PrimitiveTypeData(0, "S", "short");
ScalaJS.d.I = new ScalaJS.PrimitiveTypeData(0, "I", "int");
ScalaJS.d.J = new ScalaJS.PrimitiveTypeData("longZero", "J", "long");
ScalaJS.d.F = new ScalaJS.PrimitiveTypeData(0.0, "F", "float");
ScalaJS.d.D = new ScalaJS.PrimitiveTypeData(0.0, "D", "double");

// Instance tests for array of primitives

ScalaJS.isArrayOf.Z = ScalaJS.makeIsArrayOfPrimitive(ScalaJS.d.Z);
ScalaJS.asArrayOf.Z = ScalaJS.makeAsArrayOfPrimitive(ScalaJS.isArrayOf.Z, "Z");
ScalaJS.d.Z.isArrayOf = ScalaJS.isArrayOf.Z;

ScalaJS.isArrayOf.C = ScalaJS.makeIsArrayOfPrimitive(ScalaJS.d.C);
ScalaJS.asArrayOf.C = ScalaJS.makeAsArrayOfPrimitive(ScalaJS.isArrayOf.C, "C");
ScalaJS.d.C.isArrayOf = ScalaJS.isArrayOf.C;

ScalaJS.isArrayOf.B = ScalaJS.makeIsArrayOfPrimitive(ScalaJS.d.B);
ScalaJS.asArrayOf.B = ScalaJS.makeAsArrayOfPrimitive(ScalaJS.isArrayOf.B, "B");
ScalaJS.d.B.isArrayOf = ScalaJS.isArrayOf.B;

ScalaJS.isArrayOf.S = ScalaJS.makeIsArrayOfPrimitive(ScalaJS.d.S);
ScalaJS.asArrayOf.S = ScalaJS.makeAsArrayOfPrimitive(ScalaJS.isArrayOf.S, "S");
ScalaJS.d.S.isArrayOf = ScalaJS.isArrayOf.S;

ScalaJS.isArrayOf.I = ScalaJS.makeIsArrayOfPrimitive(ScalaJS.d.I);
ScalaJS.asArrayOf.I = ScalaJS.makeAsArrayOfPrimitive(ScalaJS.isArrayOf.I, "I");
ScalaJS.d.I.isArrayOf = ScalaJS.isArrayOf.I;

ScalaJS.isArrayOf.J = ScalaJS.makeIsArrayOfPrimitive(ScalaJS.d.J);
ScalaJS.asArrayOf.J = ScalaJS.makeAsArrayOfPrimitive(ScalaJS.isArrayOf.J, "J");
ScalaJS.d.J.isArrayOf = ScalaJS.isArrayOf.J;

ScalaJS.isArrayOf.F = ScalaJS.makeIsArrayOfPrimitive(ScalaJS.d.F);
ScalaJS.asArrayOf.F = ScalaJS.makeAsArrayOfPrimitive(ScalaJS.isArrayOf.F, "F");
ScalaJS.d.F.isArrayOf = ScalaJS.isArrayOf.F;

ScalaJS.isArrayOf.D = ScalaJS.makeIsArrayOfPrimitive(ScalaJS.d.D);
ScalaJS.asArrayOf.D = ScalaJS.makeAsArrayOfPrimitive(ScalaJS.isArrayOf.D, "D");
ScalaJS.d.D.isArrayOf = ScalaJS.isArrayOf.D;

// Polyfills

ScalaJS.imul = ScalaJS.g["Math"]["imul"] || (function(a, b) {
  // See https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Math/imul
  var ah = (a >>> 16) & 0xffff;
  var al = a & 0xffff;
  var bh = (b >>> 16) & 0xffff;
  var bl = b & 0xffff;
  // the shift by 0 fixes the sign on the high part
  // the final |0 converts the unsigned value into a signed value
  return ((al * bl) + (((ah * bl + al * bh) << 16) >>> 0) | 0);
});
/** @constructor */
ScalaJS.c.O = (function() {
  /*<skip>*/
});
/** @constructor */
ScalaJS.h.O = (function() {
  /*<skip>*/
});
ScalaJS.h.O.prototype = ScalaJS.c.O.prototype;
ScalaJS.c.O.prototype.init___ = (function() {
  return this
});
ScalaJS.c.O.prototype.equals__O__Z = (function(that) {
  return (this === that)
});
ScalaJS.c.O.prototype.toString__T = (function() {
  var jsx$1 = ScalaJS.objectGetClass(this).getName__T();
  var i = this.hashCode__I();
  return ((jsx$1 + "@") + ScalaJS.as.T((i >>> 0)["toString"](16)))
});
ScalaJS.c.O.prototype.hashCode__I = (function() {
  return ScalaJS.systemIdentityHashCode(this)
});
ScalaJS.c.O.prototype["toString"] = (function() {
  return this.toString__T()
});
ScalaJS.is.O = (function(obj) {
  return (obj !== null)
});
ScalaJS.as.O = (function(obj) {
  return obj
});
ScalaJS.isArrayOf.O = (function(obj, depth) {
  var data = (obj && obj.$classData);
  if ((!data)) {
    return false
  } else {
    var arrayDepth = (data.arrayDepth || 0);
    return ((arrayDepth < depth) ? false : ((arrayDepth > depth) ? true : (!data.arrayBase["isPrimitive"])))
  }
});
ScalaJS.asArrayOf.O = (function(obj, depth) {
  return ((ScalaJS.isArrayOf.O(obj, depth) || (obj === null)) ? obj : ScalaJS.throwArrayCastException(obj, "Ljava.lang.Object;", depth))
});
ScalaJS.d.O = new ScalaJS.ClassTypeData({
  O: 0
}, false, "java.lang.Object", null, {
  O: 1
}, ScalaJS.is.O, ScalaJS.isArrayOf.O);
ScalaJS.c.O.prototype.$classData = ScalaJS.d.O;
ScalaJS.i.jl_JSConsoleBasedPrintStream$class__$init$__jl_JSConsoleBasedPrintStream__V = (function($$this) {
  $$this.java$lang$JSConsoleBasedPrintStream$$flushed$und$eq__Z__V(true);
  $$this.java$lang$JSConsoleBasedPrintStream$$buffer$und$eq__T__V("");
  $$this.java$lang$JSConsoleBasedPrintStream$$undsetter$und$java$lang$JSConsoleBasedPrintStream$$lineContEnd$und$eq__T__V("\u21a9");
  $$this.java$lang$JSConsoleBasedPrintStream$$undsetter$und$java$lang$JSConsoleBasedPrintStream$$lineContStart$und$eq__T__V("\u21aa")
});
ScalaJS.i.jl_JSConsoleBasedPrintStream$class__flush__jl_JSConsoleBasedPrintStream__V = (function($$this) {
  if ((!$$this.java$lang$JSConsoleBasedPrintStream$$flushed__Z())) {
    $$this.doWriteLine__T__V((("" + $$this.java$lang$JSConsoleBasedPrintStream$$buffer__T()) + $$this.java$lang$JSConsoleBasedPrintStream$$lineContEnd__T()));
    $$this.java$lang$JSConsoleBasedPrintStream$$buffer$und$eq__T__V($$this.java$lang$JSConsoleBasedPrintStream$$lineContStart__T());
    $$this.java$lang$JSConsoleBasedPrintStream$$flushed$und$eq__Z__V(true)
  }
});
ScalaJS.i.jl_JSConsoleBasedPrintStream$class__print__jl_JSConsoleBasedPrintStream__T__V = (function($$this, s) {
  var rest = ((s === null) ? "null" : s);
  while ((!ScalaJS.i.sjsr_RuntimeString$class__isEmpty__sjsr_RuntimeString__Z(rest))) {
    var nlPos = ScalaJS.i.sjsr_RuntimeString$class__indexOf__sjsr_RuntimeString__T__I(rest, "\n");
    if ((nlPos < 0)) {
      $$this.java$lang$JSConsoleBasedPrintStream$$buffer$und$eq__T__V((("" + $$this.java$lang$JSConsoleBasedPrintStream$$buffer__T()) + rest));
      $$this.java$lang$JSConsoleBasedPrintStream$$flushed$und$eq__Z__V(false);
      rest = ""
    } else {
      $$this.doWriteLine__T__V((("" + $$this.java$lang$JSConsoleBasedPrintStream$$buffer__T()) + ScalaJS.i.sjsr_RuntimeString$class__substring__sjsr_RuntimeString__I__I__T(rest, 0, nlPos)));
      $$this.java$lang$JSConsoleBasedPrintStream$$buffer$und$eq__T__V("");
      $$this.java$lang$JSConsoleBasedPrintStream$$flushed$und$eq__Z__V(true);
      rest = ScalaJS.i.sjsr_RuntimeString$class__substring__sjsr_RuntimeString__I__T(rest, ((nlPos + 1) | 0))
    }
  }
});
ScalaJS.i.s_Product2$class__productElement__s_Product2__I__O = (function($$this, n) {
  switch (n) {
    case 0:
      {
        return $$this.$$und1$f;
        break
      };
    case 1:
      {
        return $$this.$$und2$f;
        break
      };
    default:
      throw new ScalaJS.c.jl_IndexOutOfBoundsException().init___T(ScalaJS.objectToString(n));
  }
});
ScalaJS.i.s_Proxy$class__toString__s_Proxy__T = (function($$this) {
  return ("" + $$this.self$1)
});
ScalaJS.i.s_Proxy$class__equals__s_Proxy__O__Z = (function($$this, that) {
  return ((null !== that) && (((that === $$this) || (that === $$this.self$1)) || ScalaJS.objectEquals(that, $$this.self$1)))
});
ScalaJS.i.s_Proxy$class__hashCode__s_Proxy__I = (function($$this) {
  return ScalaJS.objectHashCode($$this.self$1)
});
ScalaJS.i.s_concurrent_Future$class__map__s_concurrent_Future__F1__s_concurrent_ExecutionContext__s_concurrent_Future = (function($$this, f, executor) {
  var p = new ScalaJS.c.s_concurrent_impl_Promise$DefaultPromise().init___();
  $$this.onComplete__F1__s_concurrent_ExecutionContext__V(new ScalaJS.c.sjsr_AnonFunction1().init___sjs_js_Function1((function($$this$1, p$1, f$1) {
    return (function(v$2) {
      var v = ScalaJS.as.s_util_Try(v$2);
      var result = v.map__F1__s_util_Try(f$1);
      return ScalaJS.i.s_concurrent_Promise$class__complete__s_concurrent_Promise__s_util_Try__s_concurrent_Promise(p$1, result)
    })
  })($$this, p, f)), executor);
  return p
});
ScalaJS.i.s_concurrent_Promise$class__failure__s_concurrent_Promise__jl_Throwable__s_concurrent_Promise = (function($$this, cause) {
  var result = new ScalaJS.c.s_util_Failure().init___jl_Throwable(cause);
  return ScalaJS.i.s_concurrent_Promise$class__complete__s_concurrent_Promise__s_util_Try__s_concurrent_Promise($$this, result)
});
ScalaJS.i.s_concurrent_Promise$class__complete__s_concurrent_Promise__s_util_Try__s_concurrent_Promise = (function($$this, result) {
  if ($$this.tryComplete__s_util_Try__Z(result)) {
    return $$this
  } else {
    throw new ScalaJS.c.jl_IllegalStateException().init___T("Promise already completed.")
  }
});
ScalaJS.i.s_concurrent_Promise$class__success__s_concurrent_Promise__O__s_concurrent_Promise = (function($$this, value) {
  var result = new ScalaJS.c.s_util_Success().init___O(value);
  return ScalaJS.i.s_concurrent_Promise$class__complete__s_concurrent_Promise__s_util_Try__s_concurrent_Promise($$this, result)
});
ScalaJS.i.s_reflect_ClassTag$class__equals__s_reflect_ClassTag__O__Z = (function($$this, x) {
  return (ScalaJS.is.s_reflect_ClassTag(x) && ScalaJS.anyRefEqEq($$this.runtimeClass__jl_Class(), ScalaJS.as.s_reflect_ClassTag(x).runtimeClass__jl_Class()))
});
ScalaJS.i.s_reflect_ClassTag$class__prettyprint$1__s_reflect_ClassTag__jl_Class__T = (function($$this, clazz) {
  return (clazz.isArray__Z() ? new ScalaJS.c.s_StringContext().init___sc_Seq(new ScalaJS.c.sjs_js_WrappedArray().init___sjs_js_Array(["Array[", "]"])).s__sc_Seq__T(new ScalaJS.c.sjs_js_WrappedArray().init___sjs_js_Array([ScalaJS.i.s_reflect_ClassTag$class__prettyprint$1__s_reflect_ClassTag__jl_Class__T($$this, ScalaJS.m.sr_ScalaRunTime().arrayElementClass__O__jl_Class(clazz))])) : clazz.getName__T())
});
ScalaJS.i.s_reflect_ClassTag$class__newArray__s_reflect_ClassTag__I__O = (function($$this, len) {
  var x1 = $$this.runtimeClass__jl_Class();
  return (ScalaJS.anyRefEqEq(ScalaJS.d.B.getClassOf(), x1) ? ScalaJS.newArrayObject(ScalaJS.d.B.getArrayOf(), [len]) : (ScalaJS.anyRefEqEq(ScalaJS.d.S.getClassOf(), x1) ? ScalaJS.newArrayObject(ScalaJS.d.S.getArrayOf(), [len]) : (ScalaJS.anyRefEqEq(ScalaJS.d.C.getClassOf(), x1) ? ScalaJS.newArrayObject(ScalaJS.d.C.getArrayOf(), [len]) : (ScalaJS.anyRefEqEq(ScalaJS.d.I.getClassOf(), x1) ? ScalaJS.newArrayObject(ScalaJS.d.I.getArrayOf(), [len]) : (ScalaJS.anyRefEqEq(ScalaJS.d.J.getClassOf(), x1) ? ScalaJS.newArrayObject(ScalaJS.d.J.getArrayOf(), [len]) : (ScalaJS.anyRefEqEq(ScalaJS.d.F.getClassOf(), x1) ? ScalaJS.newArrayObject(ScalaJS.d.F.getArrayOf(), [len]) : (ScalaJS.anyRefEqEq(ScalaJS.d.D.getClassOf(), x1) ? ScalaJS.newArrayObject(ScalaJS.d.D.getArrayOf(), [len]) : (ScalaJS.anyRefEqEq(ScalaJS.d.Z.getClassOf(), x1) ? ScalaJS.newArrayObject(ScalaJS.d.Z.getArrayOf(), [len]) : (ScalaJS.anyRefEqEq(ScalaJS.d.V.getClassOf(), x1) ? ScalaJS.newArrayObject(ScalaJS.d.sr_BoxedUnit.getArrayOf(), [len]) : ScalaJS.m.jl_reflect_Array().newInstance__jl_Class__I__O($$this.runtimeClass__jl_Class(), len))))))))))
});
ScalaJS.i.s_util_control_NoStackTrace$class__fillInStackTrace__s_util_control_NoStackTrace__jl_Throwable = (function($$this) {
  var this$1 = ScalaJS.m.s_util_control_NoStackTrace();
  if (this$1.$$undnoSuppression$1) {
    return $$this.scala$util$control$NoStackTrace$$super$fillInStackTrace__jl_Throwable()
  } else {
    return ScalaJS.as.jl_Throwable($$this)
  }
});
ScalaJS.i.sc_GenMapLike$class__equals__sc_GenMapLike__O__Z = (function($$this, that) {
  if (ScalaJS.is.sc_GenMap(that)) {
    var x2 = ScalaJS.as.sc_GenMap(that);
    return (($$this === x2) || (($$this.size__I() === x2.size__I()) && ScalaJS.i.sc_GenMapLike$class__liftedTree1$1__sc_GenMapLike__sc_GenMap__Z($$this, x2)))
  } else {
    return false
  }
});
ScalaJS.i.sc_GenMapLike$class__liftedTree1$1__sc_GenMapLike__sc_GenMap__Z = (function($$this, x2$1) {
  try {
    var this$1 = $$this.iterator__sc_Iterator();
    var res = true;
    while ((res && this$1.hasNext__Z())) {
      var x0$1$2 = this$1.next__O();
      var x0$1 = ScalaJS.as.T2(x0$1$2);
      if ((x0$1 !== null)) {
        var k = x0$1.$$und1$f;
        var v = x0$1.$$und2$f;
        var x1$2 = x2$1.get__O__s_Option(k);
        matchEnd6: {
          if (ScalaJS.is.s_Some(x1$2)) {
            var x2 = ScalaJS.as.s_Some(x1$2);
            var p3 = x2.x$2;
            if (ScalaJS.anyEqEq(v, p3)) {
              res = true;
              break matchEnd6
            }
          };
          res = false;
          break matchEnd6
        }
      } else {
        throw new ScalaJS.c.s_MatchError().init___O(x0$1)
      }
    };
    return res
  } catch (ex) {
    if (ScalaJS.is.jl_ClassCastException(ex)) {
      var this$3 = ScalaJS.m.s_Console();
      var this$4 = this$3.outVar$2;
      ScalaJS.as.Ljava_io_PrintStream(this$4.tl$1.get__O()).println__O__V("class cast ");
      return false
    } else {
      throw ex
    }
  }
});
ScalaJS.i.sc_GenSeqLike$class__equals__sc_GenSeqLike__O__Z = (function($$this, that) {
  if (ScalaJS.is.sc_GenSeq(that)) {
    var x2 = ScalaJS.as.sc_GenSeq(that);
    return $$this.sameElements__sc_GenIterable__Z(x2)
  } else {
    return false
  }
});
ScalaJS.i.sc_GenSetLike$class__liftedTree1$1__sc_GenSetLike__sc_GenSet__Z = (function($$this, x2$1) {
  try {
    return $$this.subsetOf__sc_GenSet__Z(x2$1)
  } catch (ex) {
    if (ScalaJS.is.jl_ClassCastException(ex)) {
      return false
    } else {
      throw ex
    }
  }
});
ScalaJS.i.sc_GenSetLike$class__equals__sc_GenSetLike__O__Z = (function($$this, that) {
  if (ScalaJS.is.sc_GenSet(that)) {
    var x2 = ScalaJS.as.sc_GenSet(that);
    return (($$this === x2) || (($$this.size__I() === x2.size__I()) && ScalaJS.i.sc_GenSetLike$class__liftedTree1$1__sc_GenSetLike__sc_GenSet__Z($$this, x2)))
  } else {
    return false
  }
});
ScalaJS.i.sc_IndexedSeqLike$class__toBuffer__sc_IndexedSeqLike__scm_Buffer = (function($$this) {
  var result = new ScalaJS.c.scm_ArrayBuffer().init___I($$this.size__I());
  var xs = $$this.seq__sc_TraversableOnce();
  result.$$plus$plus$eq__sc_TraversableOnce__scm_ArrayBuffer(xs);
  return result
});
ScalaJS.i.sc_IndexedSeqOptimized$class__exists__sc_IndexedSeqOptimized__F1__Z = (function($$this, p) {
  return (ScalaJS.i.sc_IndexedSeqOptimized$class__prefixLengthImpl__sc_IndexedSeqOptimized__F1__Z__I($$this, p, false) !== $$this.length__I())
});
ScalaJS.i.sc_IndexedSeqOptimized$class__lengthCompare__sc_IndexedSeqOptimized__I__I = (function($$this, len) {
  return (($$this.length__I() - len) | 0)
});
ScalaJS.i.sc_IndexedSeqOptimized$class__sameElements__sc_IndexedSeqOptimized__sc_GenIterable__Z = (function($$this, that) {
  if (ScalaJS.is.sc_IndexedSeq(that)) {
    var x2 = ScalaJS.as.sc_IndexedSeq(that);
    var len = $$this.length__I();
    if ((len === x2.length__I())) {
      var i = 0;
      while (((i < len) && ScalaJS.anyEqEq($$this.apply__I__O(i), x2.apply__I__O(i)))) {
        i = ((i + 1) | 0)
      };
      return (i === len)
    } else {
      return false
    }
  } else {
    return ScalaJS.i.sc_IterableLike$class__sameElements__sc_IterableLike__sc_GenIterable__Z($$this, that)
  }
});
ScalaJS.i.sc_IndexedSeqOptimized$class__prefixLengthImpl__sc_IndexedSeqOptimized__F1__Z__I = (function($$this, p, expectTrue) {
  var i = 0;
  while (((i < $$this.length__I()) && (ScalaJS.uZ(p.apply__O__O($$this.apply__I__O(i))) === expectTrue))) {
    i = ((i + 1) | 0)
  };
  return i
});
ScalaJS.i.sc_IndexedSeqOptimized$class__foreach__sc_IndexedSeqOptimized__F1__V = (function($$this, f) {
  var i = 0;
  var len = $$this.length__I();
  while ((i < len)) {
    f.apply__O__O($$this.apply__I__O(i));
    i = ((i + 1) | 0)
  }
});
ScalaJS.i.sc_IndexedSeqOptimized$class__reverse__sc_IndexedSeqOptimized__O = (function($$this) {
  var b = $$this.newBuilder__scm_Builder();
  b.sizeHint__I__V($$this.length__I());
  var i = $$this.length__I();
  while ((0 < i)) {
    i = ((i - 1) | 0);
    b.$$plus$eq__O__scm_Builder($$this.apply__I__O(i))
  };
  return b.result__O()
});
ScalaJS.i.sc_IndexedSeqOptimized$class__copyToArray__sc_IndexedSeqOptimized__O__I__I__V = (function($$this, xs, start, len) {
  var i = 0;
  var j = start;
  var $$this$1 = $$this.length__I();
  var $$this$2 = (($$this$1 < len) ? $$this$1 : len);
  var that = ((ScalaJS.m.sr_ScalaRunTime().array$undlength__O__I(xs) - start) | 0);
  var end = (($$this$2 < that) ? $$this$2 : that);
  while ((i < end)) {
    ScalaJS.m.sr_ScalaRunTime().array$undupdate__O__I__O__V(xs, j, $$this.apply__I__O(i));
    i = ((i + 1) | 0);
    j = ((j + 1) | 0)
  }
});
ScalaJS.i.sc_IndexedSeqOptimized$class__foldl__sc_IndexedSeqOptimized__I__I__O__F2__O = (function($$this, start, end, z, op) {
  _foldl: while (true) {
    if ((start === end)) {
      return z
    } else {
      var temp$start = ((start + 1) | 0);
      var temp$z = op.apply__O__O__O(z, $$this.apply__I__O(start));
      start = temp$start;
      z = temp$z;
      continue _foldl
    }
  }
});
ScalaJS.i.sc_IndexedSeqOptimized$class__isEmpty__sc_IndexedSeqOptimized__Z = (function($$this) {
  return ($$this.length__I() === 0)
});
ScalaJS.i.sc_IterableLike$class__take__sc_IterableLike__I__O = (function($$this, n) {
  var b = $$this.newBuilder__scm_Builder();
  if ((n <= 0)) {
    return b.result__O()
  } else {
    b.sizeHintBounded__I__sc_TraversableLike__V(n, $$this);
    var i = 0;
    var it = $$this.iterator__sc_Iterator();
    while (((i < n) && it.hasNext__Z())) {
      b.$$plus$eq__O__scm_Builder(it.next__O());
      i = ((i + 1) | 0)
    };
    return b.result__O()
  }
});
ScalaJS.i.sc_IterableLike$class__sameElements__sc_IterableLike__sc_GenIterable__Z = (function($$this, that) {
  var these = $$this.iterator__sc_Iterator();
  var those = that.iterator__sc_Iterator();
  while ((these.hasNext__Z() && those.hasNext__Z())) {
    if ((!ScalaJS.anyEqEq(these.next__O(), those.next__O()))) {
      return false
    }
  };
  return ((!these.hasNext__Z()) && (!those.hasNext__Z()))
});
ScalaJS.i.sc_IterableLike$class__copyToArray__sc_IterableLike__O__I__I__V = (function($$this, xs, start, len) {
  var i = start;
  var $$this$1 = ((start + len) | 0);
  var that = ScalaJS.m.sr_ScalaRunTime().array$undlength__O__I(xs);
  var end = (($$this$1 < that) ? $$this$1 : that);
  var it = $$this.iterator__sc_Iterator();
  while (((i < end) && it.hasNext__Z())) {
    ScalaJS.m.sr_ScalaRunTime().array$undupdate__O__I__O__V(xs, i, it.next__O());
    i = ((i + 1) | 0)
  }
});
ScalaJS.i.sc_Iterator$class__foreach__sc_Iterator__F1__V = (function($$this, f) {
  while ($$this.hasNext__Z()) {
    f.apply__O__O($$this.next__O())
  }
});
ScalaJS.i.sc_Iterator$class__exists__sc_Iterator__F1__Z = (function($$this, p) {
  var res = false;
  while (((!res) && $$this.hasNext__Z())) {
    res = ScalaJS.uZ(p.apply__O__O($$this.next__O()))
  };
  return res
});
ScalaJS.i.sc_Iterator$class__copyToArray__sc_Iterator__O__I__I__V = (function($$this, xs, start, len) {
  var requirement = ((start >= 0) && ((start < ScalaJS.m.sr_ScalaRunTime().array$undlength__O__I(xs)) || (ScalaJS.m.sr_ScalaRunTime().array$undlength__O__I(xs) === 0)));
  if ((!requirement)) {
    throw new ScalaJS.c.jl_IllegalArgumentException().init___T(("requirement failed: " + new ScalaJS.c.s_StringContext().init___sc_Seq(new ScalaJS.c.sjs_js_WrappedArray().init___sjs_js_Array(["start ", " out of range ", ""])).s__sc_Seq__T(new ScalaJS.c.sjs_js_WrappedArray().init___sjs_js_Array([start, ScalaJS.m.sr_ScalaRunTime().array$undlength__O__I(xs)]))))
  };
  var i = start;
  var y = ((ScalaJS.m.sr_ScalaRunTime().array$undlength__O__I(xs) - start) | 0);
  var end = ((start + ((len < y) ? len : y)) | 0);
  while (((i < end) && $$this.hasNext__Z())) {
    ScalaJS.m.sr_ScalaRunTime().array$undupdate__O__I__O__V(xs, i, $$this.next__O());
    i = ((i + 1) | 0)
  }
});
ScalaJS.i.sc_Iterator$class__isEmpty__sc_Iterator__Z = (function($$this) {
  return (!$$this.hasNext__Z())
});
ScalaJS.i.sc_Iterator$class__toStream__sc_Iterator__sci_Stream = (function($$this) {
  if ($$this.hasNext__Z()) {
    var hd = $$this.next__O();
    var tl = new ScalaJS.c.sjsr_AnonFunction0().init___sjs_js_Function0((function($$this$1) {
      return (function() {
        return $$this$1.toStream__sci_Stream()
      })
    })($$this));
    return new ScalaJS.c.sci_Stream$Cons().init___O__F0(hd, tl)
  } else {
    return (ScalaJS.m.sci_Stream(), ScalaJS.m.sci_Stream$Empty())
  }
});
ScalaJS.i.sc_Iterator$class__toString__sc_Iterator__T = (function($$this) {
  return (($$this.hasNext__Z() ? "non-empty" : "empty") + " iterator")
});
ScalaJS.i.sc_Iterator$class__forall__sc_Iterator__F1__Z = (function($$this, p) {
  var res = true;
  while ((res && $$this.hasNext__Z())) {
    res = ScalaJS.uZ(p.apply__O__O($$this.next__O()))
  };
  return res
});
ScalaJS.i.sc_LinearSeqOptimized$class__lengthCompare__sc_LinearSeqOptimized__I__I = (function($$this, len) {
  return ((len < 0) ? 1 : ScalaJS.i.sc_LinearSeqOptimized$class__loop$1__sc_LinearSeqOptimized__I__sc_LinearSeqOptimized__I__I($$this, 0, $$this, len))
});
ScalaJS.i.sc_LinearSeqOptimized$class__apply__sc_LinearSeqOptimized__I__O = (function($$this, n) {
  var rest = $$this.drop__I__sc_LinearSeqOptimized(n);
  if (((n < 0) || rest.isEmpty__Z())) {
    throw new ScalaJS.c.jl_IndexOutOfBoundsException().init___T(("" + n))
  };
  return rest.head__O()
});
ScalaJS.i.sc_LinearSeqOptimized$class__drop__sc_LinearSeqOptimized__I__sc_LinearSeqOptimized = (function($$this, n) {
  var these = $$this;
  var count = n;
  while (((!these.isEmpty__Z()) && (count > 0))) {
    these = ScalaJS.as.sc_LinearSeqOptimized(these.tail__O());
    count = ((count - 1) | 0)
  };
  return these
});
ScalaJS.i.sc_LinearSeqOptimized$class__sameElements__sc_LinearSeqOptimized__sc_GenIterable__Z = (function($$this, that) {
  if (ScalaJS.is.sc_LinearSeq(that)) {
    var x2 = ScalaJS.as.sc_LinearSeq(that);
    var these = $$this;
    var those = x2;
    while ((((!these.isEmpty__Z()) && (!those.isEmpty__Z())) && ScalaJS.anyEqEq(these.head__O(), those.head__O()))) {
      these = ScalaJS.as.sc_LinearSeqOptimized(these.tail__O());
      those = ScalaJS.as.sc_LinearSeq(those.tail__O())
    };
    return (these.isEmpty__Z() && those.isEmpty__Z())
  } else {
    return ScalaJS.i.sc_IterableLike$class__sameElements__sc_IterableLike__sc_GenIterable__Z($$this, that)
  }
});
ScalaJS.i.sc_LinearSeqOptimized$class__loop$1__sc_LinearSeqOptimized__I__sc_LinearSeqOptimized__I__I = (function($$this, i, xs, len$1) {
  _loop: while (true) {
    if ((i === len$1)) {
      return (xs.isEmpty__Z() ? 0 : 1)
    } else if (xs.isEmpty__Z()) {
      return (-1)
    } else {
      var temp$i = ((i + 1) | 0);
      var temp$xs = ScalaJS.as.sc_LinearSeqOptimized(xs.tail__O());
      i = temp$i;
      xs = temp$xs;
      continue _loop
    }
  }
});
ScalaJS.i.sc_LinearSeqOptimized$class__foreach__sc_LinearSeqOptimized__F1__V = (function($$this, f) {
  var these = $$this;
  while ((!these.isEmpty__Z())) {
    f.apply__O__O(these.head__O());
    these = ScalaJS.as.sc_LinearSeqOptimized(these.tail__O())
  }
});
ScalaJS.i.sc_LinearSeqOptimized$class__foldLeft__sc_LinearSeqOptimized__O__F2__O = (function($$this, z, f) {
  var acc = z;
  var these = $$this;
  while ((!these.isEmpty__Z())) {
    acc = f.apply__O__O__O(acc, these.head__O());
    these = ScalaJS.as.sc_LinearSeqOptimized(these.tail__O())
  };
  return acc
});
ScalaJS.i.sc_LinearSeqOptimized$class__last__sc_LinearSeqOptimized__O = (function($$this) {
  if ($$this.isEmpty__Z()) {
    throw new ScalaJS.c.ju_NoSuchElementException().init___()
  };
  var these = $$this;
  var nx = ScalaJS.as.sc_LinearSeqOptimized(these.tail__O());
  while ((!nx.isEmpty__Z())) {
    these = nx;
    nx = ScalaJS.as.sc_LinearSeqOptimized(nx.tail__O())
  };
  return these.head__O()
});
ScalaJS.i.sc_LinearSeqOptimized$class__length__sc_LinearSeqOptimized__I = (function($$this) {
  var these = $$this;
  var len = 0;
  while ((!these.isEmpty__Z())) {
    len = ((len + 1) | 0);
    these = ScalaJS.as.sc_LinearSeqOptimized(these.tail__O())
  };
  return len
});
ScalaJS.i.sc_LinearSeqOptimized$class__exists__sc_LinearSeqOptimized__F1__Z = (function($$this, p) {
  var these = $$this;
  while ((!these.isEmpty__Z())) {
    if (ScalaJS.uZ(p.apply__O__O(these.head__O()))) {
      return true
    };
    these = ScalaJS.as.sc_LinearSeqOptimized(these.tail__O())
  };
  return false
});
ScalaJS.i.sc_MapLike$class__apply__sc_MapLike__O__O = (function($$this, key) {
  var x1 = $$this.get__O__s_Option(key);
  if (ScalaJS.anyRefEqEq(ScalaJS.m.s_None(), x1)) {
    return ScalaJS.i.sc_MapLike$class__default__sc_MapLike__O__O($$this, key)
  } else if (ScalaJS.is.s_Some(x1)) {
    var x2 = ScalaJS.as.s_Some(x1);
    var value = x2.x$2;
    return value
  } else {
    throw new ScalaJS.c.s_MatchError().init___O(x1)
  }
});
ScalaJS.i.sc_MapLike$class__default__sc_MapLike__O__O = (function($$this, key) {
  throw new ScalaJS.c.ju_NoSuchElementException().init___T(("key not found: " + key))
});
ScalaJS.i.sc_MapLike$class__filterNot__sc_MapLike__F1__sc_Map = (function($$this, p) {
  var elem = ScalaJS.as.sc_Map($$this);
  var res = new ScalaJS.c.sr_ObjectRef().init___O(elem);
  $$this.foreach__F1__V(new ScalaJS.c.sjsr_AnonFunction1().init___sjs_js_Function1((function($$this$1, res$1, p$1) {
    return (function(kv$2) {
      var kv = ScalaJS.as.T2(kv$2);
      if (ScalaJS.uZ(p$1.apply__O__O(kv))) {
        res$1.elem$1 = ScalaJS.as.sc_Map(res$1.elem$1).$$minus__O__sc_Map(kv.$$und1$f)
      }
    })
  })($$this, res, p)));
  return ScalaJS.as.sc_Map(res.elem$1)
});
ScalaJS.i.sc_MapLike$class__addString__sc_MapLike__scm_StringBuilder__T__T__T__scm_StringBuilder = (function($$this, b, start, sep, end) {
  var this$2 = $$this.iterator__sc_Iterator();
  var f = new ScalaJS.c.sjsr_AnonFunction1().init___sjs_js_Function1((function($$this$1) {
    return (function(x0$1$2) {
      var x0$1 = ScalaJS.as.T2(x0$1$2);
      if ((x0$1 !== null)) {
        var k = x0$1.$$und1$f;
        var v = x0$1.$$und2$f;
        return (("" + ScalaJS.m.s_Predef$any2stringadd().$$plus$extension__O__T__T(k, " -> ")) + v)
      } else {
        throw new ScalaJS.c.s_MatchError().init___O(x0$1)
      }
    })
  })($$this));
  var this$3 = new ScalaJS.c.sc_Iterator$$anon$11().init___sc_Iterator__F1(this$2, f);
  return ScalaJS.i.sc_TraversableOnce$class__addString__sc_TraversableOnce__scm_StringBuilder__T__T__T__scm_StringBuilder(this$3, b, start, sep, end)
});
ScalaJS.i.sc_MapLike$class__isEmpty__sc_MapLike__Z = (function($$this) {
  return ($$this.size__I() === 0)
});
ScalaJS.i.sc_MapLike$class__toBuffer__sc_MapLike__scm_Buffer = (function($$this) {
  var result = new ScalaJS.c.scm_ArrayBuffer().init___I($$this.size__I());
  var xs = $$this.seq__sc_TraversableOnce();
  result.$$plus$plus$eq__sc_TraversableOnce__scm_ArrayBuffer(xs);
  return result
});
ScalaJS.i.sc_MapLike$class__contains__sc_MapLike__O__Z = (function($$this, key) {
  return $$this.get__O__s_Option(key).isDefined__Z()
});
ScalaJS.i.sc_SeqLike$class__reverseIterator__sc_SeqLike__sc_Iterator = (function($$this) {
  return $$this.toCollection__O__sc_Seq($$this.reverse__O()).iterator__sc_Iterator()
});
ScalaJS.i.sc_SeqLike$class__isEmpty__sc_SeqLike__Z = (function($$this) {
  return ($$this.lengthCompare__I__I(0) === 0)
});
ScalaJS.i.sc_SeqLike$class__reverse__sc_SeqLike__O = (function($$this) {
  var elem = ScalaJS.m.sci_Nil();
  var xs = new ScalaJS.c.sr_ObjectRef().init___O(elem);
  $$this.foreach__F1__V(new ScalaJS.c.sjsr_AnonFunction1().init___sjs_js_Function1((function($$this$1, xs$1) {
    return (function(x$2) {
      var this$2 = ScalaJS.as.sci_List(xs$1.elem$1);
      xs$1.elem$1 = new ScalaJS.c.sci_$colon$colon().init___O__sci_List(x$2, this$2)
    })
  })($$this, xs)));
  var b = $$this.newBuilder__scm_Builder();
  ScalaJS.i.scm_Builder$class__sizeHint__scm_Builder__sc_TraversableLike__V(b, $$this);
  var this$3 = ScalaJS.as.sci_List(xs.elem$1);
  var these = this$3;
  while ((!these.isEmpty__Z())) {
    var x$4 = these.head__O();
    b.$$plus$eq__O__scm_Builder(x$4);
    these = ScalaJS.as.sci_List(these.tail__O())
  };
  return b.result__O()
});
ScalaJS.i.sc_SeqLike$class__lengthCompare__sc_SeqLike__I__I = (function($$this, len) {
  if ((len < 0)) {
    return 1
  } else {
    var i = 0;
    var it = $$this.iterator__sc_Iterator();
    while (it.hasNext__Z()) {
      if ((i === len)) {
        return (it.hasNext__Z() ? 1 : 0)
      };
      it.next__O();
      i = ((i + 1) | 0)
    };
    return ((i - len) | 0)
  }
});
ScalaJS.i.sc_SeqLike$class__$colon$plus__sc_SeqLike__O__scg_CanBuildFrom__O = (function($$this, elem, bf) {
  var b = bf.apply__O__scm_Builder($$this.repr__O());
  b.$$plus$plus$eq__sc_TraversableOnce__scg_Growable($$this.thisCollection__sc_Seq());
  b.$$plus$eq__O__scm_Builder(elem);
  return b.result__O()
});
ScalaJS.i.sc_SetLike$class__toBuffer__sc_SetLike__scm_Buffer = (function($$this) {
  var result = new ScalaJS.c.scm_ArrayBuffer().init___I($$this.size__I());
  var xs = $$this.seq__sc_TraversableOnce();
  result.$$plus$plus$eq__sc_TraversableOnce__scm_ArrayBuffer(xs);
  return result
});
ScalaJS.i.sc_SetLike$class__isEmpty__sc_SetLike__Z = (function($$this) {
  return ($$this.size__I() === 0)
});
ScalaJS.i.sc_SetLike$class__$plus$plus__sc_SetLike__sc_GenTraversableOnce__sc_Set = (function($$this, elems) {
  var x$1 = ScalaJS.as.sc_Set($$this);
  return ScalaJS.as.sc_Set(elems.seq__sc_TraversableOnce().$$div$colon__O__F2__O(x$1, new ScalaJS.c.sjsr_AnonFunction2().init___sjs_js_Function2((function($$this$1) {
    return (function(x$2$2, x$3$2) {
      var x$2 = ScalaJS.as.sc_Set(x$2$2);
      return x$2.$$plus__O__sc_Set(x$3$2)
    })
  })($$this))))
});
ScalaJS.i.sc_TraversableLike$class__flatMap__sc_TraversableLike__F1__scg_CanBuildFrom__O = (function($$this, f, bf) {
  var b = bf.apply__O__scm_Builder($$this.repr__O());
  $$this.foreach__F1__V(new ScalaJS.c.sjsr_AnonFunction1().init___sjs_js_Function1((function($$this$1, b$1, f$1) {
    return (function(x$2) {
      return ScalaJS.as.scm_Builder(b$1.$$plus$plus$eq__sc_TraversableOnce__scg_Growable(ScalaJS.as.sc_GenTraversableOnce(f$1.apply__O__O(x$2)).seq__sc_TraversableOnce()))
    })
  })($$this, b, f)));
  return b.result__O()
});
ScalaJS.i.sc_TraversableLike$class__to__sc_TraversableLike__scg_CanBuildFrom__O = (function($$this, cbf) {
  var b = cbf.apply__scm_Builder();
  ScalaJS.i.scm_Builder$class__sizeHint__scm_Builder__sc_TraversableLike__V(b, $$this);
  b.$$plus$plus$eq__sc_TraversableOnce__scg_Growable($$this.thisCollection__sc_Traversable());
  return b.result__O()
});
ScalaJS.i.sc_TraversableLike$class__filterImpl__sc_TraversableLike__F1__Z__O = (function($$this, p, isFlipped) {
  var b = $$this.newBuilder__scm_Builder();
  $$this.foreach__F1__V(new ScalaJS.c.sjsr_AnonFunction1().init___sjs_js_Function1((function($$this$1, p$1, isFlipped$1, b$1) {
    return (function(x$2) {
      return ((ScalaJS.uZ(p$1.apply__O__O(x$2)) !== isFlipped$1) ? b$1.$$plus$eq__O__scm_Builder(x$2) : (void 0))
    })
  })($$this, p, isFlipped, b)));
  return b.result__O()
});
ScalaJS.i.sc_TraversableLike$class__stringPrefix__sc_TraversableLike__T = (function($$this) {
  var string = ScalaJS.objectGetClass($$this.repr__O()).getName__T();
  var idx1 = ScalaJS.i.sjsr_RuntimeString$class__lastIndexOf__sjsr_RuntimeString__I__I(string, 46);
  if ((idx1 !== (-1))) {
    string = ScalaJS.i.sjsr_RuntimeString$class__substring__sjsr_RuntimeString__I__T(string, ((idx1 + 1) | 0))
  };
  var idx2 = ScalaJS.i.sjsr_RuntimeString$class__indexOf__sjsr_RuntimeString__I__I(string, 36);
  if ((idx2 !== (-1))) {
    string = ScalaJS.i.sjsr_RuntimeString$class__substring__sjsr_RuntimeString__I__I__T(string, 0, idx2)
  };
  return string
});
ScalaJS.i.sc_TraversableLike$class__builder$1__sc_TraversableLike__scg_CanBuildFrom__scm_Builder = (function($$this, bf$1) {
  var b = bf$1.apply__O__scm_Builder($$this.repr__O());
  ScalaJS.i.scm_Builder$class__sizeHint__scm_Builder__sc_TraversableLike__V(b, $$this);
  return b
});
ScalaJS.i.sc_TraversableLike$class__$plus$plus__sc_TraversableLike__sc_GenTraversableOnce__scg_CanBuildFrom__O = (function($$this, that, bf) {
  var b = bf.apply__O__scm_Builder($$this.repr__O());
  if (ScalaJS.is.sc_IndexedSeqLike(that)) {
    var delta = that.seq__sc_TraversableOnce().size__I();
    ScalaJS.i.scm_Builder$class__sizeHint__scm_Builder__sc_TraversableLike__I__V(b, $$this, delta)
  };
  b.$$plus$plus$eq__sc_TraversableOnce__scg_Growable($$this.thisCollection__sc_Traversable());
  b.$$plus$plus$eq__sc_TraversableOnce__scg_Growable(that.seq__sc_TraversableOnce());
  return b.result__O()
});
ScalaJS.i.sc_TraversableLike$class__toString__sc_TraversableLike__T = (function($$this) {
  return $$this.mkString__T__T__T__T(($$this.stringPrefix__T() + "("), ", ", ")")
});
ScalaJS.i.sc_TraversableLike$class__map__sc_TraversableLike__F1__scg_CanBuildFrom__O = (function($$this, f, bf) {
  var b = ScalaJS.i.sc_TraversableLike$class__builder$1__sc_TraversableLike__scg_CanBuildFrom__scm_Builder($$this, bf);
  $$this.foreach__F1__V(new ScalaJS.c.sjsr_AnonFunction1().init___sjs_js_Function1((function($$this$1, b$1, f$1) {
    return (function(x$2) {
      return b$1.$$plus$eq__O__scm_Builder(f$1.apply__O__O(x$2))
    })
  })($$this, b, f)));
  return b.result__O()
});
ScalaJS.i.sc_TraversableOnce$class__toArray__sc_TraversableOnce__s_reflect_ClassTag__O = (function($$this, evidence$1) {
  if ($$this.isTraversableAgain__Z()) {
    var result = evidence$1.newArray__I__O($$this.size__I());
    $$this.copyToArray__O__I__V(result, 0);
    return result
  } else {
    return $$this.toBuffer__scm_Buffer().toArray__s_reflect_ClassTag__O(evidence$1)
  }
});
ScalaJS.i.sc_TraversableOnce$class__mkString__sc_TraversableOnce__T__T__T__T = (function($$this, start, sep, end) {
  var this$1 = $$this.addString__scm_StringBuilder__T__T__T__scm_StringBuilder(new ScalaJS.c.scm_StringBuilder().init___(), start, sep, end);
  var this$2 = this$1.underlying$5;
  return this$2.content$1
});
ScalaJS.i.sc_TraversableOnce$class__size__sc_TraversableOnce__I = (function($$this) {
  var result = new ScalaJS.c.sr_IntRef().init___I(0);
  $$this.foreach__F1__V(new ScalaJS.c.sjsr_AnonFunction1().init___sjs_js_Function1((function($$this$1, result$1) {
    return (function(x$2) {
      result$1.elem$1 = ((result$1.elem$1 + 1) | 0)
    })
  })($$this, result)));
  return result.elem$1
});
ScalaJS.i.sc_TraversableOnce$class__copyToArray__sc_TraversableOnce__O__I__V = (function($$this, xs, start) {
  $$this.copyToArray__O__I__I__V(xs, start, ((ScalaJS.m.sr_ScalaRunTime().array$undlength__O__I(xs) - start) | 0))
});
ScalaJS.i.sc_TraversableOnce$class__to__sc_TraversableOnce__scg_CanBuildFrom__O = (function($$this, cbf) {
  var b = cbf.apply__scm_Builder();
  b.$$plus$plus$eq__sc_TraversableOnce__scg_Growable($$this.seq__sc_TraversableOnce());
  return b.result__O()
});
ScalaJS.i.sc_TraversableOnce$class__foldLeft__sc_TraversableOnce__O__F2__O = (function($$this, z, op) {
  var result = new ScalaJS.c.sr_ObjectRef().init___O(z);
  $$this.foreach__F1__V(new ScalaJS.c.sjsr_AnonFunction1().init___sjs_js_Function1((function($$this$1, result$1, op$1) {
    return (function(x$2) {
      result$1.elem$1 = op$1.apply__O__O__O(result$1.elem$1, x$2)
    })
  })($$this, result, op)));
  return result.elem$1
});
ScalaJS.i.sc_TraversableOnce$class__nonEmpty__sc_TraversableOnce__Z = (function($$this) {
  return (!$$this.isEmpty__Z())
});
ScalaJS.i.sc_TraversableOnce$class__addString__sc_TraversableOnce__scm_StringBuilder__T__T__T__scm_StringBuilder = (function($$this, b, start, sep, end) {
  var first = new ScalaJS.c.sr_BooleanRef().init___Z(true);
  b.append__T__scm_StringBuilder(start);
  $$this.foreach__F1__V(new ScalaJS.c.sjsr_AnonFunction1().init___sjs_js_Function1((function($$this$1, first$1, b$1, sep$1) {
    return (function(x$2) {
      if (first$1.elem$1) {
        b$1.append__O__scm_StringBuilder(x$2);
        first$1.elem$1 = false;
        return (void 0)
      } else {
        return (b$1.append__T__scm_StringBuilder(sep$1), b$1.append__O__scm_StringBuilder(x$2))
      }
    })
  })($$this, first, b, sep)));
  b.append__T__scm_StringBuilder(end);
  return b
});
ScalaJS.i.scg_Growable$class__$plus$plus$eq__scg_Growable__sc_TraversableOnce__scg_Growable = (function($$this, xs) {
  if (ScalaJS.is.sc_LinearSeq(xs)) {
    var x2 = ScalaJS.as.sc_LinearSeq(xs);
    ScalaJS.i.scg_Growable$class__loop$1__scg_Growable__sc_LinearSeq__V($$this, x2)
  } else {
    xs.foreach__F1__V(new ScalaJS.c.sjsr_AnonFunction1().init___sjs_js_Function1((function($$this$1) {
      return (function(elem$2) {
        return $$this$1.$$plus$eq__O__scg_Growable(elem$2)
      })
    })($$this)))
  };
  return $$this
});
ScalaJS.i.scg_Growable$class__loop$1__scg_Growable__sc_LinearSeq__V = (function($$this, xs) {
  x: {
    _loop: while (true) {
      var this$1 = xs;
      if (ScalaJS.i.sc_TraversableOnce$class__nonEmpty__sc_TraversableOnce__Z(this$1)) {
        $$this.$$plus$eq__O__scg_Growable(xs.head__O());
        xs = ScalaJS.as.sc_LinearSeq(xs.tail__O());
        continue _loop
      };
      break x
    }
  }
});
ScalaJS.i.sci_MapLike$class__$plus__sci_MapLike__T2__T2__sc_Seq__sci_Map = (function($$this, elem1, elem2, elems) {
  return $$this.$$plus__T2__sci_Map(elem1).$$plus__T2__sci_Map(elem2).$$plus$plus__sc_GenTraversableOnce__sci_Map(elems)
});
ScalaJS.i.sci_MapLike$class__$plus$plus__sci_MapLike__sc_GenTraversableOnce__sci_Map = (function($$this, xs) {
  var x$1 = ScalaJS.as.sci_Map($$this);
  return ScalaJS.as.sci_Map(xs.seq__sc_TraversableOnce().$$div$colon__O__F2__O(x$1, new ScalaJS.c.sjsr_AnonFunction2().init___sjs_js_Function2((function($$this$1) {
    return (function(x$2$2, x$3$2) {
      var x$2 = ScalaJS.as.sci_Map(x$2$2);
      var x$3 = ScalaJS.as.T2(x$3$2);
      return x$2.$$plus__T2__sci_Map(x$3)
    })
  })($$this))))
});
ScalaJS.i.sci_StringLike$class__unwrapArg__sci_StringLike__O__O = (function($$this, arg) {
  if (ScalaJS.is.s_math_ScalaNumber(arg)) {
    var x2 = ScalaJS.as.s_math_ScalaNumber(arg);
    return x2.underlying__O()
  } else {
    return arg
  }
});
ScalaJS.i.sci_StringLike$class__format__sci_StringLike__sc_Seq__T = (function($$this, args) {
  var jsx$3 = ScalaJS.m.sjsr_RuntimeString();
  var jsx$2 = $$this.toString__T();
  var jsx$1 = new ScalaJS.c.sjsr_AnonFunction1().init___sjs_js_Function1((function($$this$1) {
    return (function(arg$2) {
      return ScalaJS.i.sci_StringLike$class__unwrapArg__sci_StringLike__O__O($$this$1, arg$2)
    })
  })($$this));
  var this$1 = ScalaJS.m.sc_Seq();
  return jsx$3.format__T__AO__T(jsx$2, ScalaJS.asArrayOf.O(ScalaJS.as.sc_TraversableOnce(args.map__F1__scg_CanBuildFrom__O(jsx$1, this$1.ReusableCBFInstance$2)).toArray__s_reflect_ClassTag__O(ScalaJS.m.s_reflect_ClassTag().AnyRef$1), 1))
});
ScalaJS.i.sci_VectorPointer$class__gotoFreshPosWritable0__sci_VectorPointer__I__I__I__V = (function($$this, oldIndex, newIndex, xor) {
  if ((xor >= 32)) {
    if ((xor < 1024)) {
      if (($$this.depth__I() === 1)) {
        $$this.display1$und$eq__AO__V(ScalaJS.newArrayObject(ScalaJS.d.O.getArrayOf(), [32]));
        $$this.display1__AO().u[((oldIndex >> 5) & 31)] = $$this.display0__AO();
        $$this.depth$und$eq__I__V((($$this.depth__I() + 1) | 0))
      };
      $$this.display0$und$eq__AO__V(ScalaJS.newArrayObject(ScalaJS.d.O.getArrayOf(), [32]))
    } else if ((xor < 32768)) {
      if (($$this.depth__I() === 2)) {
        $$this.display2$und$eq__AO__V(ScalaJS.newArrayObject(ScalaJS.d.O.getArrayOf(), [32]));
        $$this.display2__AO().u[((oldIndex >> 10) & 31)] = $$this.display1__AO();
        $$this.depth$und$eq__I__V((($$this.depth__I() + 1) | 0))
      };
      $$this.display1$und$eq__AO__V(ScalaJS.asArrayOf.O($$this.display2__AO().u[((newIndex >> 10) & 31)], 1));
      if (($$this.display1__AO() === null)) {
        $$this.display1$und$eq__AO__V(ScalaJS.newArrayObject(ScalaJS.d.O.getArrayOf(), [32]))
      };
      $$this.display0$und$eq__AO__V(ScalaJS.newArrayObject(ScalaJS.d.O.getArrayOf(), [32]))
    } else if ((xor < 1048576)) {
      if (($$this.depth__I() === 3)) {
        $$this.display3$und$eq__AO__V(ScalaJS.newArrayObject(ScalaJS.d.O.getArrayOf(), [32]));
        $$this.display3__AO().u[((oldIndex >> 15) & 31)] = $$this.display2__AO();
        $$this.display2$und$eq__AO__V(ScalaJS.newArrayObject(ScalaJS.d.O.getArrayOf(), [32]));
        $$this.display1$und$eq__AO__V(ScalaJS.newArrayObject(ScalaJS.d.O.getArrayOf(), [32]));
        $$this.depth$und$eq__I__V((($$this.depth__I() + 1) | 0))
      };
      $$this.display2$und$eq__AO__V(ScalaJS.asArrayOf.O($$this.display3__AO().u[((newIndex >> 15) & 31)], 1));
      if (($$this.display2__AO() === null)) {
        $$this.display2$und$eq__AO__V(ScalaJS.newArrayObject(ScalaJS.d.O.getArrayOf(), [32]))
      };
      $$this.display1$und$eq__AO__V(ScalaJS.asArrayOf.O($$this.display2__AO().u[((newIndex >> 10) & 31)], 1));
      if (($$this.display1__AO() === null)) {
        $$this.display1$und$eq__AO__V(ScalaJS.newArrayObject(ScalaJS.d.O.getArrayOf(), [32]))
      };
      $$this.display0$und$eq__AO__V(ScalaJS.newArrayObject(ScalaJS.d.O.getArrayOf(), [32]))
    } else if ((xor < 33554432)) {
      if (($$this.depth__I() === 4)) {
        $$this.display4$und$eq__AO__V(ScalaJS.newArrayObject(ScalaJS.d.O.getArrayOf(), [32]));
        $$this.display4__AO().u[((oldIndex >> 20) & 31)] = $$this.display3__AO();
        $$this.display3$und$eq__AO__V(ScalaJS.newArrayObject(ScalaJS.d.O.getArrayOf(), [32]));
        $$this.display2$und$eq__AO__V(ScalaJS.newArrayObject(ScalaJS.d.O.getArrayOf(), [32]));
        $$this.display1$und$eq__AO__V(ScalaJS.newArrayObject(ScalaJS.d.O.getArrayOf(), [32]));
        $$this.depth$und$eq__I__V((($$this.depth__I() + 1) | 0))
      };
      $$this.display3$und$eq__AO__V(ScalaJS.asArrayOf.O($$this.display4__AO().u[((newIndex >> 20) & 31)], 1));
      if (($$this.display3__AO() === null)) {
        $$this.display3$und$eq__AO__V(ScalaJS.newArrayObject(ScalaJS.d.O.getArrayOf(), [32]))
      };
      $$this.display2$und$eq__AO__V(ScalaJS.asArrayOf.O($$this.display3__AO().u[((newIndex >> 15) & 31)], 1));
      if (($$this.display2__AO() === null)) {
        $$this.display2$und$eq__AO__V(ScalaJS.newArrayObject(ScalaJS.d.O.getArrayOf(), [32]))
      };
      $$this.display1$und$eq__AO__V(ScalaJS.asArrayOf.O($$this.display2__AO().u[((newIndex >> 10) & 31)], 1));
      if (($$this.display1__AO() === null)) {
        $$this.display1$und$eq__AO__V(ScalaJS.newArrayObject(ScalaJS.d.O.getArrayOf(), [32]))
      };
      $$this.display0$und$eq__AO__V(ScalaJS.newArrayObject(ScalaJS.d.O.getArrayOf(), [32]))
    } else if ((xor < 1073741824)) {
      if (($$this.depth__I() === 5)) {
        $$this.display5$und$eq__AO__V(ScalaJS.newArrayObject(ScalaJS.d.O.getArrayOf(), [32]));
        $$this.display5__AO().u[((oldIndex >> 25) & 31)] = $$this.display4__AO();
        $$this.display4$und$eq__AO__V(ScalaJS.newArrayObject(ScalaJS.d.O.getArrayOf(), [32]));
        $$this.display3$und$eq__AO__V(ScalaJS.newArrayObject(ScalaJS.d.O.getArrayOf(), [32]));
        $$this.display2$und$eq__AO__V(ScalaJS.newArrayObject(ScalaJS.d.O.getArrayOf(), [32]));
        $$this.display1$und$eq__AO__V(ScalaJS.newArrayObject(ScalaJS.d.O.getArrayOf(), [32]));
        $$this.depth$und$eq__I__V((($$this.depth__I() + 1) | 0))
      };
      $$this.display4$und$eq__AO__V(ScalaJS.asArrayOf.O($$this.display5__AO().u[((newIndex >> 20) & 31)], 1));
      if (($$this.display4__AO() === null)) {
        $$this.display4$und$eq__AO__V(ScalaJS.newArrayObject(ScalaJS.d.O.getArrayOf(), [32]))
      };
      $$this.display3$und$eq__AO__V(ScalaJS.asArrayOf.O($$this.display4__AO().u[((newIndex >> 20) & 31)], 1));
      if (($$this.display3__AO() === null)) {
        $$this.display3$und$eq__AO__V(ScalaJS.newArrayObject(ScalaJS.d.O.getArrayOf(), [32]))
      };
      $$this.display2$und$eq__AO__V(ScalaJS.asArrayOf.O($$this.display3__AO().u[((newIndex >> 15) & 31)], 1));
      if (($$this.display2__AO() === null)) {
        $$this.display2$und$eq__AO__V(ScalaJS.newArrayObject(ScalaJS.d.O.getArrayOf(), [32]))
      };
      $$this.display1$und$eq__AO__V(ScalaJS.asArrayOf.O($$this.display2__AO().u[((newIndex >> 10) & 31)], 1));
      if (($$this.display1__AO() === null)) {
        $$this.display1$und$eq__AO__V(ScalaJS.newArrayObject(ScalaJS.d.O.getArrayOf(), [32]))
      };
      $$this.display0$und$eq__AO__V(ScalaJS.newArrayObject(ScalaJS.d.O.getArrayOf(), [32]))
    } else {
      throw new ScalaJS.c.jl_IllegalArgumentException().init___()
    }
  }
});
ScalaJS.i.sci_VectorPointer$class__gotoPos__sci_VectorPointer__I__I__V = (function($$this, index, xor) {
  if ((xor >= 32)) {
    if ((xor < 1024)) {
      $$this.display0$und$eq__AO__V(ScalaJS.asArrayOf.O($$this.display1__AO().u[((index >> 5) & 31)], 1))
    } else if ((xor < 32768)) {
      $$this.display1$und$eq__AO__V(ScalaJS.asArrayOf.O($$this.display2__AO().u[((index >> 10) & 31)], 1));
      $$this.display0$und$eq__AO__V(ScalaJS.asArrayOf.O($$this.display1__AO().u[((index >> 5) & 31)], 1))
    } else if ((xor < 1048576)) {
      $$this.display2$und$eq__AO__V(ScalaJS.asArrayOf.O($$this.display3__AO().u[((index >> 15) & 31)], 1));
      $$this.display1$und$eq__AO__V(ScalaJS.asArrayOf.O($$this.display2__AO().u[((index >> 10) & 31)], 1));
      $$this.display0$und$eq__AO__V(ScalaJS.asArrayOf.O($$this.display1__AO().u[((index >> 5) & 31)], 1))
    } else if ((xor < 33554432)) {
      $$this.display3$und$eq__AO__V(ScalaJS.asArrayOf.O($$this.display4__AO().u[((index >> 20) & 31)], 1));
      $$this.display2$und$eq__AO__V(ScalaJS.asArrayOf.O($$this.display3__AO().u[((index >> 15) & 31)], 1));
      $$this.display1$und$eq__AO__V(ScalaJS.asArrayOf.O($$this.display2__AO().u[((index >> 10) & 31)], 1));
      $$this.display0$und$eq__AO__V(ScalaJS.asArrayOf.O($$this.display1__AO().u[((index >> 5) & 31)], 1))
    } else if ((xor < 1073741824)) {
      $$this.display4$und$eq__AO__V(ScalaJS.asArrayOf.O($$this.display5__AO().u[((index >> 25) & 31)], 1));
      $$this.display3$und$eq__AO__V(ScalaJS.asArrayOf.O($$this.display4__AO().u[((index >> 20) & 31)], 1));
      $$this.display2$und$eq__AO__V(ScalaJS.asArrayOf.O($$this.display3__AO().u[((index >> 15) & 31)], 1));
      $$this.display1$und$eq__AO__V(ScalaJS.asArrayOf.O($$this.display2__AO().u[((index >> 10) & 31)], 1));
      $$this.display0$und$eq__AO__V(ScalaJS.asArrayOf.O($$this.display1__AO().u[((index >> 5) & 31)], 1))
    } else {
      throw new ScalaJS.c.jl_IllegalArgumentException().init___()
    }
  }
});
ScalaJS.i.sci_VectorPointer$class__stabilize__sci_VectorPointer__I__V = (function($$this, index) {
  var x1 = (($$this.depth__I() - 1) | 0);
  switch (x1) {
    case 5:
      {
        var a = $$this.display5__AO();
        $$this.display5$und$eq__AO__V(ScalaJS.i.sci_VectorPointer$class__copyOf__sci_VectorPointer__AO__AO($$this, a));
        var a$1 = $$this.display4__AO();
        $$this.display4$und$eq__AO__V(ScalaJS.i.sci_VectorPointer$class__copyOf__sci_VectorPointer__AO__AO($$this, a$1));
        var a$2 = $$this.display3__AO();
        $$this.display3$und$eq__AO__V(ScalaJS.i.sci_VectorPointer$class__copyOf__sci_VectorPointer__AO__AO($$this, a$2));
        var a$3 = $$this.display2__AO();
        $$this.display2$und$eq__AO__V(ScalaJS.i.sci_VectorPointer$class__copyOf__sci_VectorPointer__AO__AO($$this, a$3));
        var a$4 = $$this.display1__AO();
        $$this.display1$und$eq__AO__V(ScalaJS.i.sci_VectorPointer$class__copyOf__sci_VectorPointer__AO__AO($$this, a$4));
        $$this.display5__AO().u[((index >> 25) & 31)] = $$this.display4__AO();
        $$this.display4__AO().u[((index >> 20) & 31)] = $$this.display3__AO();
        $$this.display3__AO().u[((index >> 15) & 31)] = $$this.display2__AO();
        $$this.display2__AO().u[((index >> 10) & 31)] = $$this.display1__AO();
        $$this.display1__AO().u[((index >> 5) & 31)] = $$this.display0__AO();
        break
      };
    case 4:
      {
        var a$5 = $$this.display4__AO();
        $$this.display4$und$eq__AO__V(ScalaJS.i.sci_VectorPointer$class__copyOf__sci_VectorPointer__AO__AO($$this, a$5));
        var a$6 = $$this.display3__AO();
        $$this.display3$und$eq__AO__V(ScalaJS.i.sci_VectorPointer$class__copyOf__sci_VectorPointer__AO__AO($$this, a$6));
        var a$7 = $$this.display2__AO();
        $$this.display2$und$eq__AO__V(ScalaJS.i.sci_VectorPointer$class__copyOf__sci_VectorPointer__AO__AO($$this, a$7));
        var a$8 = $$this.display1__AO();
        $$this.display1$und$eq__AO__V(ScalaJS.i.sci_VectorPointer$class__copyOf__sci_VectorPointer__AO__AO($$this, a$8));
        $$this.display4__AO().u[((index >> 20) & 31)] = $$this.display3__AO();
        $$this.display3__AO().u[((index >> 15) & 31)] = $$this.display2__AO();
        $$this.display2__AO().u[((index >> 10) & 31)] = $$this.display1__AO();
        $$this.display1__AO().u[((index >> 5) & 31)] = $$this.display0__AO();
        break
      };
    case 3:
      {
        var a$9 = $$this.display3__AO();
        $$this.display3$und$eq__AO__V(ScalaJS.i.sci_VectorPointer$class__copyOf__sci_VectorPointer__AO__AO($$this, a$9));
        var a$10 = $$this.display2__AO();
        $$this.display2$und$eq__AO__V(ScalaJS.i.sci_VectorPointer$class__copyOf__sci_VectorPointer__AO__AO($$this, a$10));
        var a$11 = $$this.display1__AO();
        $$this.display1$und$eq__AO__V(ScalaJS.i.sci_VectorPointer$class__copyOf__sci_VectorPointer__AO__AO($$this, a$11));
        $$this.display3__AO().u[((index >> 15) & 31)] = $$this.display2__AO();
        $$this.display2__AO().u[((index >> 10) & 31)] = $$this.display1__AO();
        $$this.display1__AO().u[((index >> 5) & 31)] = $$this.display0__AO();
        break
      };
    case 2:
      {
        var a$12 = $$this.display2__AO();
        $$this.display2$und$eq__AO__V(ScalaJS.i.sci_VectorPointer$class__copyOf__sci_VectorPointer__AO__AO($$this, a$12));
        var a$13 = $$this.display1__AO();
        $$this.display1$und$eq__AO__V(ScalaJS.i.sci_VectorPointer$class__copyOf__sci_VectorPointer__AO__AO($$this, a$13));
        $$this.display2__AO().u[((index >> 10) & 31)] = $$this.display1__AO();
        $$this.display1__AO().u[((index >> 5) & 31)] = $$this.display0__AO();
        break
      };
    case 1:
      {
        var a$14 = $$this.display1__AO();
        $$this.display1$und$eq__AO__V(ScalaJS.i.sci_VectorPointer$class__copyOf__sci_VectorPointer__AO__AO($$this, a$14));
        $$this.display1__AO().u[((index >> 5) & 31)] = $$this.display0__AO();
        break
      };
    case 0:
      break;
    default:
      throw new ScalaJS.c.s_MatchError().init___O(x1);
  }
});
ScalaJS.i.sci_VectorPointer$class__gotoFreshPosWritable1__sci_VectorPointer__I__I__I__V = (function($$this, oldIndex, newIndex, xor) {
  ScalaJS.i.sci_VectorPointer$class__stabilize__sci_VectorPointer__I__V($$this, oldIndex);
  ScalaJS.i.sci_VectorPointer$class__gotoFreshPosWritable0__sci_VectorPointer__I__I__I__V($$this, oldIndex, newIndex, xor)
});
ScalaJS.i.sci_VectorPointer$class__getElem__sci_VectorPointer__I__I__O = (function($$this, index, xor) {
  if ((xor < 32)) {
    return $$this.display0__AO().u[(index & 31)]
  } else if ((xor < 1024)) {
    return ScalaJS.asArrayOf.O($$this.display1__AO().u[((index >> 5) & 31)], 1).u[(index & 31)]
  } else if ((xor < 32768)) {
    return ScalaJS.asArrayOf.O(ScalaJS.asArrayOf.O($$this.display2__AO().u[((index >> 10) & 31)], 1).u[((index >> 5) & 31)], 1).u[(index & 31)]
  } else if ((xor < 1048576)) {
    return ScalaJS.asArrayOf.O(ScalaJS.asArrayOf.O(ScalaJS.asArrayOf.O($$this.display3__AO().u[((index >> 15) & 31)], 1).u[((index >> 10) & 31)], 1).u[((index >> 5) & 31)], 1).u[(index & 31)]
  } else if ((xor < 33554432)) {
    return ScalaJS.asArrayOf.O(ScalaJS.asArrayOf.O(ScalaJS.asArrayOf.O(ScalaJS.asArrayOf.O($$this.display4__AO().u[((index >> 20) & 31)], 1).u[((index >> 15) & 31)], 1).u[((index >> 10) & 31)], 1).u[((index >> 5) & 31)], 1).u[(index & 31)]
  } else if ((xor < 1073741824)) {
    return ScalaJS.asArrayOf.O(ScalaJS.asArrayOf.O(ScalaJS.asArrayOf.O(ScalaJS.asArrayOf.O(ScalaJS.asArrayOf.O($$this.display5__AO().u[((index >> 25) & 31)], 1).u[((index >> 20) & 31)], 1).u[((index >> 15) & 31)], 1).u[((index >> 10) & 31)], 1).u[((index >> 5) & 31)], 1).u[(index & 31)]
  } else {
    throw new ScalaJS.c.jl_IllegalArgumentException().init___()
  }
});
ScalaJS.i.sci_VectorPointer$class__gotoNextBlockStart__sci_VectorPointer__I__I__V = (function($$this, index, xor) {
  if ((xor < 1024)) {
    $$this.display0$und$eq__AO__V(ScalaJS.asArrayOf.O($$this.display1__AO().u[((index >> 5) & 31)], 1))
  } else if ((xor < 32768)) {
    $$this.display1$und$eq__AO__V(ScalaJS.asArrayOf.O($$this.display2__AO().u[((index >> 10) & 31)], 1));
    $$this.display0$und$eq__AO__V(ScalaJS.asArrayOf.O($$this.display1__AO().u[0], 1))
  } else if ((xor < 1048576)) {
    $$this.display2$und$eq__AO__V(ScalaJS.asArrayOf.O($$this.display3__AO().u[((index >> 15) & 31)], 1));
    $$this.display1$und$eq__AO__V(ScalaJS.asArrayOf.O($$this.display2__AO().u[0], 1));
    $$this.display0$und$eq__AO__V(ScalaJS.asArrayOf.O($$this.display1__AO().u[0], 1))
  } else if ((xor < 33554432)) {
    $$this.display3$und$eq__AO__V(ScalaJS.asArrayOf.O($$this.display4__AO().u[((index >> 20) & 31)], 1));
    $$this.display2$und$eq__AO__V(ScalaJS.asArrayOf.O($$this.display3__AO().u[0], 1));
    $$this.display1$und$eq__AO__V(ScalaJS.asArrayOf.O($$this.display2__AO().u[0], 1));
    $$this.display0$und$eq__AO__V(ScalaJS.asArrayOf.O($$this.display1__AO().u[0], 1))
  } else if ((xor < 1073741824)) {
    $$this.display4$und$eq__AO__V(ScalaJS.asArrayOf.O($$this.display5__AO().u[((index >> 25) & 31)], 1));
    $$this.display3$und$eq__AO__V(ScalaJS.asArrayOf.O($$this.display4__AO().u[0], 1));
    $$this.display2$und$eq__AO__V(ScalaJS.asArrayOf.O($$this.display3__AO().u[0], 1));
    $$this.display1$und$eq__AO__V(ScalaJS.asArrayOf.O($$this.display2__AO().u[0], 1));
    $$this.display0$und$eq__AO__V(ScalaJS.asArrayOf.O($$this.display1__AO().u[0], 1))
  } else {
    throw new ScalaJS.c.jl_IllegalArgumentException().init___()
  }
});
ScalaJS.i.sci_VectorPointer$class__copyOf__sci_VectorPointer__AO__AO = (function($$this, a) {
  if ((a === null)) {
    var this$2 = ScalaJS.m.s_Console();
    var this$3 = this$2.outVar$2;
    ScalaJS.as.Ljava_io_PrintStream(this$3.tl$1.get__O()).println__O__V("NULL")
  };
  var b = ScalaJS.newArrayObject(ScalaJS.d.O.getArrayOf(), [a.u["length"]]);
  var length = a.u["length"];
  ScalaJS.systemArraycopy(a, 0, b, 0, length);
  return b
});
ScalaJS.i.sci_VectorPointer$class__gotoPosWritable0__sci_VectorPointer__I__I__V = (function($$this, newIndex, xor) {
  var x1 = (($$this.depth__I() - 1) | 0);
  switch (x1) {
    case 5:
      {
        var a = $$this.display5__AO();
        $$this.display5$und$eq__AO__V(ScalaJS.i.sci_VectorPointer$class__copyOf__sci_VectorPointer__AO__AO($$this, a));
        var array = $$this.display5__AO();
        var index = ((newIndex >> 25) & 31);
        $$this.display4$und$eq__AO__V(ScalaJS.i.sci_VectorPointer$class__nullSlotAndCopy__sci_VectorPointer__AO__I__AO($$this, array, index));
        var array$1 = $$this.display4__AO();
        var index$1 = ((newIndex >> 20) & 31);
        $$this.display3$und$eq__AO__V(ScalaJS.i.sci_VectorPointer$class__nullSlotAndCopy__sci_VectorPointer__AO__I__AO($$this, array$1, index$1));
        var array$2 = $$this.display3__AO();
        var index$2 = ((newIndex >> 15) & 31);
        $$this.display2$und$eq__AO__V(ScalaJS.i.sci_VectorPointer$class__nullSlotAndCopy__sci_VectorPointer__AO__I__AO($$this, array$2, index$2));
        var array$3 = $$this.display2__AO();
        var index$3 = ((newIndex >> 10) & 31);
        $$this.display1$und$eq__AO__V(ScalaJS.i.sci_VectorPointer$class__nullSlotAndCopy__sci_VectorPointer__AO__I__AO($$this, array$3, index$3));
        var array$4 = $$this.display1__AO();
        var index$4 = ((newIndex >> 5) & 31);
        $$this.display0$und$eq__AO__V(ScalaJS.i.sci_VectorPointer$class__nullSlotAndCopy__sci_VectorPointer__AO__I__AO($$this, array$4, index$4));
        break
      };
    case 4:
      {
        var a$1 = $$this.display4__AO();
        $$this.display4$und$eq__AO__V(ScalaJS.i.sci_VectorPointer$class__copyOf__sci_VectorPointer__AO__AO($$this, a$1));
        var array$5 = $$this.display4__AO();
        var index$5 = ((newIndex >> 20) & 31);
        $$this.display3$und$eq__AO__V(ScalaJS.i.sci_VectorPointer$class__nullSlotAndCopy__sci_VectorPointer__AO__I__AO($$this, array$5, index$5));
        var array$6 = $$this.display3__AO();
        var index$6 = ((newIndex >> 15) & 31);
        $$this.display2$und$eq__AO__V(ScalaJS.i.sci_VectorPointer$class__nullSlotAndCopy__sci_VectorPointer__AO__I__AO($$this, array$6, index$6));
        var array$7 = $$this.display2__AO();
        var index$7 = ((newIndex >> 10) & 31);
        $$this.display1$und$eq__AO__V(ScalaJS.i.sci_VectorPointer$class__nullSlotAndCopy__sci_VectorPointer__AO__I__AO($$this, array$7, index$7));
        var array$8 = $$this.display1__AO();
        var index$8 = ((newIndex >> 5) & 31);
        $$this.display0$und$eq__AO__V(ScalaJS.i.sci_VectorPointer$class__nullSlotAndCopy__sci_VectorPointer__AO__I__AO($$this, array$8, index$8));
        break
      };
    case 3:
      {
        var a$2 = $$this.display3__AO();
        $$this.display3$und$eq__AO__V(ScalaJS.i.sci_VectorPointer$class__copyOf__sci_VectorPointer__AO__AO($$this, a$2));
        var array$9 = $$this.display3__AO();
        var index$9 = ((newIndex >> 15) & 31);
        $$this.display2$und$eq__AO__V(ScalaJS.i.sci_VectorPointer$class__nullSlotAndCopy__sci_VectorPointer__AO__I__AO($$this, array$9, index$9));
        var array$10 = $$this.display2__AO();
        var index$10 = ((newIndex >> 10) & 31);
        $$this.display1$und$eq__AO__V(ScalaJS.i.sci_VectorPointer$class__nullSlotAndCopy__sci_VectorPointer__AO__I__AO($$this, array$10, index$10));
        var array$11 = $$this.display1__AO();
        var index$11 = ((newIndex >> 5) & 31);
        $$this.display0$und$eq__AO__V(ScalaJS.i.sci_VectorPointer$class__nullSlotAndCopy__sci_VectorPointer__AO__I__AO($$this, array$11, index$11));
        break
      };
    case 2:
      {
        var a$3 = $$this.display2__AO();
        $$this.display2$und$eq__AO__V(ScalaJS.i.sci_VectorPointer$class__copyOf__sci_VectorPointer__AO__AO($$this, a$3));
        var array$12 = $$this.display2__AO();
        var index$12 = ((newIndex >> 10) & 31);
        $$this.display1$und$eq__AO__V(ScalaJS.i.sci_VectorPointer$class__nullSlotAndCopy__sci_VectorPointer__AO__I__AO($$this, array$12, index$12));
        var array$13 = $$this.display1__AO();
        var index$13 = ((newIndex >> 5) & 31);
        $$this.display0$und$eq__AO__V(ScalaJS.i.sci_VectorPointer$class__nullSlotAndCopy__sci_VectorPointer__AO__I__AO($$this, array$13, index$13));
        break
      };
    case 1:
      {
        var a$4 = $$this.display1__AO();
        $$this.display1$und$eq__AO__V(ScalaJS.i.sci_VectorPointer$class__copyOf__sci_VectorPointer__AO__AO($$this, a$4));
        var array$14 = $$this.display1__AO();
        var index$14 = ((newIndex >> 5) & 31);
        $$this.display0$und$eq__AO__V(ScalaJS.i.sci_VectorPointer$class__nullSlotAndCopy__sci_VectorPointer__AO__I__AO($$this, array$14, index$14));
        break
      };
    case 0:
      {
        var a$5 = $$this.display0__AO();
        $$this.display0$und$eq__AO__V(ScalaJS.i.sci_VectorPointer$class__copyOf__sci_VectorPointer__AO__AO($$this, a$5));
        break
      };
    default:
      throw new ScalaJS.c.s_MatchError().init___O(x1);
  }
});
ScalaJS.i.sci_VectorPointer$class__gotoNextBlockStartWritable__sci_VectorPointer__I__I__V = (function($$this, index, xor) {
  if ((xor < 1024)) {
    if (($$this.depth__I() === 1)) {
      $$this.display1$und$eq__AO__V(ScalaJS.newArrayObject(ScalaJS.d.O.getArrayOf(), [32]));
      $$this.display1__AO().u[0] = $$this.display0__AO();
      $$this.depth$und$eq__I__V((($$this.depth__I() + 1) | 0))
    };
    $$this.display0$und$eq__AO__V(ScalaJS.newArrayObject(ScalaJS.d.O.getArrayOf(), [32]));
    $$this.display1__AO().u[((index >> 5) & 31)] = $$this.display0__AO()
  } else if ((xor < 32768)) {
    if (($$this.depth__I() === 2)) {
      $$this.display2$und$eq__AO__V(ScalaJS.newArrayObject(ScalaJS.d.O.getArrayOf(), [32]));
      $$this.display2__AO().u[0] = $$this.display1__AO();
      $$this.depth$und$eq__I__V((($$this.depth__I() + 1) | 0))
    };
    $$this.display0$und$eq__AO__V(ScalaJS.newArrayObject(ScalaJS.d.O.getArrayOf(), [32]));
    $$this.display1$und$eq__AO__V(ScalaJS.newArrayObject(ScalaJS.d.O.getArrayOf(), [32]));
    $$this.display1__AO().u[((index >> 5) & 31)] = $$this.display0__AO();
    $$this.display2__AO().u[((index >> 10) & 31)] = $$this.display1__AO()
  } else if ((xor < 1048576)) {
    if (($$this.depth__I() === 3)) {
      $$this.display3$und$eq__AO__V(ScalaJS.newArrayObject(ScalaJS.d.O.getArrayOf(), [32]));
      $$this.display3__AO().u[0] = $$this.display2__AO();
      $$this.depth$und$eq__I__V((($$this.depth__I() + 1) | 0))
    };
    $$this.display0$und$eq__AO__V(ScalaJS.newArrayObject(ScalaJS.d.O.getArrayOf(), [32]));
    $$this.display1$und$eq__AO__V(ScalaJS.newArrayObject(ScalaJS.d.O.getArrayOf(), [32]));
    $$this.display2$und$eq__AO__V(ScalaJS.newArrayObject(ScalaJS.d.O.getArrayOf(), [32]));
    $$this.display1__AO().u[((index >> 5) & 31)] = $$this.display0__AO();
    $$this.display2__AO().u[((index >> 10) & 31)] = $$this.display1__AO();
    $$this.display3__AO().u[((index >> 15) & 31)] = $$this.display2__AO()
  } else if ((xor < 33554432)) {
    if (($$this.depth__I() === 4)) {
      $$this.display4$und$eq__AO__V(ScalaJS.newArrayObject(ScalaJS.d.O.getArrayOf(), [32]));
      $$this.display4__AO().u[0] = $$this.display3__AO();
      $$this.depth$und$eq__I__V((($$this.depth__I() + 1) | 0))
    };
    $$this.display0$und$eq__AO__V(ScalaJS.newArrayObject(ScalaJS.d.O.getArrayOf(), [32]));
    $$this.display1$und$eq__AO__V(ScalaJS.newArrayObject(ScalaJS.d.O.getArrayOf(), [32]));
    $$this.display2$und$eq__AO__V(ScalaJS.newArrayObject(ScalaJS.d.O.getArrayOf(), [32]));
    $$this.display3$und$eq__AO__V(ScalaJS.newArrayObject(ScalaJS.d.O.getArrayOf(), [32]));
    $$this.display1__AO().u[((index >> 5) & 31)] = $$this.display0__AO();
    $$this.display2__AO().u[((index >> 10) & 31)] = $$this.display1__AO();
    $$this.display3__AO().u[((index >> 15) & 31)] = $$this.display2__AO();
    $$this.display4__AO().u[((index >> 20) & 31)] = $$this.display3__AO()
  } else if ((xor < 1073741824)) {
    if (($$this.depth__I() === 5)) {
      $$this.display5$und$eq__AO__V(ScalaJS.newArrayObject(ScalaJS.d.O.getArrayOf(), [32]));
      $$this.display5__AO().u[0] = $$this.display4__AO();
      $$this.depth$und$eq__I__V((($$this.depth__I() + 1) | 0))
    };
    $$this.display0$und$eq__AO__V(ScalaJS.newArrayObject(ScalaJS.d.O.getArrayOf(), [32]));
    $$this.display1$und$eq__AO__V(ScalaJS.newArrayObject(ScalaJS.d.O.getArrayOf(), [32]));
    $$this.display2$und$eq__AO__V(ScalaJS.newArrayObject(ScalaJS.d.O.getArrayOf(), [32]));
    $$this.display3$und$eq__AO__V(ScalaJS.newArrayObject(ScalaJS.d.O.getArrayOf(), [32]));
    $$this.display4$und$eq__AO__V(ScalaJS.newArrayObject(ScalaJS.d.O.getArrayOf(), [32]));
    $$this.display1__AO().u[((index >> 5) & 31)] = $$this.display0__AO();
    $$this.display2__AO().u[((index >> 10) & 31)] = $$this.display1__AO();
    $$this.display3__AO().u[((index >> 15) & 31)] = $$this.display2__AO();
    $$this.display4__AO().u[((index >> 20) & 31)] = $$this.display3__AO();
    $$this.display5__AO().u[((index >> 25) & 31)] = $$this.display4__AO()
  } else {
    throw new ScalaJS.c.jl_IllegalArgumentException().init___()
  }
});
ScalaJS.i.sci_VectorPointer$class__initFrom__sci_VectorPointer__sci_VectorPointer__I__V = (function($$this, that, depth) {
  $$this.depth$und$eq__I__V(depth);
  var x1 = ((depth - 1) | 0);
  switch (x1) {
    case (-1):
      break;
    case 0:
      {
        $$this.display0$und$eq__AO__V(that.display0__AO());
        break
      };
    case 1:
      {
        $$this.display1$und$eq__AO__V(that.display1__AO());
        $$this.display0$und$eq__AO__V(that.display0__AO());
        break
      };
    case 2:
      {
        $$this.display2$und$eq__AO__V(that.display2__AO());
        $$this.display1$und$eq__AO__V(that.display1__AO());
        $$this.display0$und$eq__AO__V(that.display0__AO());
        break
      };
    case 3:
      {
        $$this.display3$und$eq__AO__V(that.display3__AO());
        $$this.display2$und$eq__AO__V(that.display2__AO());
        $$this.display1$und$eq__AO__V(that.display1__AO());
        $$this.display0$und$eq__AO__V(that.display0__AO());
        break
      };
    case 4:
      {
        $$this.display4$und$eq__AO__V(that.display4__AO());
        $$this.display3$und$eq__AO__V(that.display3__AO());
        $$this.display2$und$eq__AO__V(that.display2__AO());
        $$this.display1$und$eq__AO__V(that.display1__AO());
        $$this.display0$und$eq__AO__V(that.display0__AO());
        break
      };
    case 5:
      {
        $$this.display5$und$eq__AO__V(that.display5__AO());
        $$this.display4$und$eq__AO__V(that.display4__AO());
        $$this.display3$und$eq__AO__V(that.display3__AO());
        $$this.display2$und$eq__AO__V(that.display2__AO());
        $$this.display1$und$eq__AO__V(that.display1__AO());
        $$this.display0$und$eq__AO__V(that.display0__AO());
        break
      };
    default:
      throw new ScalaJS.c.s_MatchError().init___O(x1);
  }
});
ScalaJS.i.sci_VectorPointer$class__nullSlotAndCopy__sci_VectorPointer__AO__I__AO = (function($$this, array, index) {
  var x = array.u[index];
  array.u[index] = null;
  var a = ScalaJS.asArrayOf.O(x, 1);
  return ScalaJS.i.sci_VectorPointer$class__copyOf__sci_VectorPointer__AO__AO($$this, a)
});
ScalaJS.i.sci_VectorPointer$class__gotoPosWritable1__sci_VectorPointer__I__I__I__V = (function($$this, oldIndex, newIndex, xor) {
  if ((xor < 32)) {
    var a = $$this.display0__AO();
    $$this.display0$und$eq__AO__V(ScalaJS.i.sci_VectorPointer$class__copyOf__sci_VectorPointer__AO__AO($$this, a))
  } else if ((xor < 1024)) {
    var a$1 = $$this.display1__AO();
    $$this.display1$und$eq__AO__V(ScalaJS.i.sci_VectorPointer$class__copyOf__sci_VectorPointer__AO__AO($$this, a$1));
    $$this.display1__AO().u[((oldIndex >> 5) & 31)] = $$this.display0__AO();
    var array = $$this.display1__AO();
    var index = ((newIndex >> 5) & 31);
    $$this.display0$und$eq__AO__V(ScalaJS.i.sci_VectorPointer$class__nullSlotAndCopy__sci_VectorPointer__AO__I__AO($$this, array, index))
  } else if ((xor < 32768)) {
    var a$2 = $$this.display1__AO();
    $$this.display1$und$eq__AO__V(ScalaJS.i.sci_VectorPointer$class__copyOf__sci_VectorPointer__AO__AO($$this, a$2));
    var a$3 = $$this.display2__AO();
    $$this.display2$und$eq__AO__V(ScalaJS.i.sci_VectorPointer$class__copyOf__sci_VectorPointer__AO__AO($$this, a$3));
    $$this.display1__AO().u[((oldIndex >> 5) & 31)] = $$this.display0__AO();
    $$this.display2__AO().u[((oldIndex >> 10) & 31)] = $$this.display1__AO();
    var array$1 = $$this.display2__AO();
    var index$1 = ((newIndex >> 10) & 31);
    $$this.display1$und$eq__AO__V(ScalaJS.i.sci_VectorPointer$class__nullSlotAndCopy__sci_VectorPointer__AO__I__AO($$this, array$1, index$1));
    var array$2 = $$this.display1__AO();
    var index$2 = ((newIndex >> 5) & 31);
    $$this.display0$und$eq__AO__V(ScalaJS.i.sci_VectorPointer$class__nullSlotAndCopy__sci_VectorPointer__AO__I__AO($$this, array$2, index$2))
  } else if ((xor < 1048576)) {
    var a$4 = $$this.display1__AO();
    $$this.display1$und$eq__AO__V(ScalaJS.i.sci_VectorPointer$class__copyOf__sci_VectorPointer__AO__AO($$this, a$4));
    var a$5 = $$this.display2__AO();
    $$this.display2$und$eq__AO__V(ScalaJS.i.sci_VectorPointer$class__copyOf__sci_VectorPointer__AO__AO($$this, a$5));
    var a$6 = $$this.display3__AO();
    $$this.display3$und$eq__AO__V(ScalaJS.i.sci_VectorPointer$class__copyOf__sci_VectorPointer__AO__AO($$this, a$6));
    $$this.display1__AO().u[((oldIndex >> 5) & 31)] = $$this.display0__AO();
    $$this.display2__AO().u[((oldIndex >> 10) & 31)] = $$this.display1__AO();
    $$this.display3__AO().u[((oldIndex >> 15) & 31)] = $$this.display2__AO();
    var array$3 = $$this.display3__AO();
    var index$3 = ((newIndex >> 15) & 31);
    $$this.display2$und$eq__AO__V(ScalaJS.i.sci_VectorPointer$class__nullSlotAndCopy__sci_VectorPointer__AO__I__AO($$this, array$3, index$3));
    var array$4 = $$this.display2__AO();
    var index$4 = ((newIndex >> 10) & 31);
    $$this.display1$und$eq__AO__V(ScalaJS.i.sci_VectorPointer$class__nullSlotAndCopy__sci_VectorPointer__AO__I__AO($$this, array$4, index$4));
    var array$5 = $$this.display1__AO();
    var index$5 = ((newIndex >> 5) & 31);
    $$this.display0$und$eq__AO__V(ScalaJS.i.sci_VectorPointer$class__nullSlotAndCopy__sci_VectorPointer__AO__I__AO($$this, array$5, index$5))
  } else if ((xor < 33554432)) {
    var a$7 = $$this.display1__AO();
    $$this.display1$und$eq__AO__V(ScalaJS.i.sci_VectorPointer$class__copyOf__sci_VectorPointer__AO__AO($$this, a$7));
    var a$8 = $$this.display2__AO();
    $$this.display2$und$eq__AO__V(ScalaJS.i.sci_VectorPointer$class__copyOf__sci_VectorPointer__AO__AO($$this, a$8));
    var a$9 = $$this.display3__AO();
    $$this.display3$und$eq__AO__V(ScalaJS.i.sci_VectorPointer$class__copyOf__sci_VectorPointer__AO__AO($$this, a$9));
    var a$10 = $$this.display4__AO();
    $$this.display4$und$eq__AO__V(ScalaJS.i.sci_VectorPointer$class__copyOf__sci_VectorPointer__AO__AO($$this, a$10));
    $$this.display1__AO().u[((oldIndex >> 5) & 31)] = $$this.display0__AO();
    $$this.display2__AO().u[((oldIndex >> 10) & 31)] = $$this.display1__AO();
    $$this.display3__AO().u[((oldIndex >> 15) & 31)] = $$this.display2__AO();
    $$this.display4__AO().u[((oldIndex >> 20) & 31)] = $$this.display3__AO();
    var array$6 = $$this.display4__AO();
    var index$6 = ((newIndex >> 20) & 31);
    $$this.display3$und$eq__AO__V(ScalaJS.i.sci_VectorPointer$class__nullSlotAndCopy__sci_VectorPointer__AO__I__AO($$this, array$6, index$6));
    var array$7 = $$this.display3__AO();
    var index$7 = ((newIndex >> 15) & 31);
    $$this.display2$und$eq__AO__V(ScalaJS.i.sci_VectorPointer$class__nullSlotAndCopy__sci_VectorPointer__AO__I__AO($$this, array$7, index$7));
    var array$8 = $$this.display2__AO();
    var index$8 = ((newIndex >> 10) & 31);
    $$this.display1$und$eq__AO__V(ScalaJS.i.sci_VectorPointer$class__nullSlotAndCopy__sci_VectorPointer__AO__I__AO($$this, array$8, index$8));
    var array$9 = $$this.display1__AO();
    var index$9 = ((newIndex >> 5) & 31);
    $$this.display0$und$eq__AO__V(ScalaJS.i.sci_VectorPointer$class__nullSlotAndCopy__sci_VectorPointer__AO__I__AO($$this, array$9, index$9))
  } else if ((xor < 1073741824)) {
    var a$11 = $$this.display1__AO();
    $$this.display1$und$eq__AO__V(ScalaJS.i.sci_VectorPointer$class__copyOf__sci_VectorPointer__AO__AO($$this, a$11));
    var a$12 = $$this.display2__AO();
    $$this.display2$und$eq__AO__V(ScalaJS.i.sci_VectorPointer$class__copyOf__sci_VectorPointer__AO__AO($$this, a$12));
    var a$13 = $$this.display3__AO();
    $$this.display3$und$eq__AO__V(ScalaJS.i.sci_VectorPointer$class__copyOf__sci_VectorPointer__AO__AO($$this, a$13));
    var a$14 = $$this.display4__AO();
    $$this.display4$und$eq__AO__V(ScalaJS.i.sci_VectorPointer$class__copyOf__sci_VectorPointer__AO__AO($$this, a$14));
    var a$15 = $$this.display5__AO();
    $$this.display5$und$eq__AO__V(ScalaJS.i.sci_VectorPointer$class__copyOf__sci_VectorPointer__AO__AO($$this, a$15));
    $$this.display1__AO().u[((oldIndex >> 5) & 31)] = $$this.display0__AO();
    $$this.display2__AO().u[((oldIndex >> 10) & 31)] = $$this.display1__AO();
    $$this.display3__AO().u[((oldIndex >> 15) & 31)] = $$this.display2__AO();
    $$this.display4__AO().u[((oldIndex >> 20) & 31)] = $$this.display3__AO();
    $$this.display5__AO().u[((oldIndex >> 25) & 31)] = $$this.display4__AO();
    var array$10 = $$this.display5__AO();
    var index$10 = ((newIndex >> 25) & 31);
    $$this.display4$und$eq__AO__V(ScalaJS.i.sci_VectorPointer$class__nullSlotAndCopy__sci_VectorPointer__AO__I__AO($$this, array$10, index$10));
    var array$11 = $$this.display4__AO();
    var index$11 = ((newIndex >> 20) & 31);
    $$this.display3$und$eq__AO__V(ScalaJS.i.sci_VectorPointer$class__nullSlotAndCopy__sci_VectorPointer__AO__I__AO($$this, array$11, index$11));
    var array$12 = $$this.display3__AO();
    var index$12 = ((newIndex >> 15) & 31);
    $$this.display2$und$eq__AO__V(ScalaJS.i.sci_VectorPointer$class__nullSlotAndCopy__sci_VectorPointer__AO__I__AO($$this, array$12, index$12));
    var array$13 = $$this.display2__AO();
    var index$13 = ((newIndex >> 10) & 31);
    $$this.display1$und$eq__AO__V(ScalaJS.i.sci_VectorPointer$class__nullSlotAndCopy__sci_VectorPointer__AO__I__AO($$this, array$13, index$13));
    var array$14 = $$this.display1__AO();
    var index$14 = ((newIndex >> 5) & 31);
    $$this.display0$und$eq__AO__V(ScalaJS.i.sci_VectorPointer$class__nullSlotAndCopy__sci_VectorPointer__AO__I__AO($$this, array$14, index$14))
  } else {
    throw new ScalaJS.c.jl_IllegalArgumentException().init___()
  }
});
ScalaJS.i.sci_VectorPointer$class__copyRange__sci_VectorPointer__AO__I__I__AO = (function($$this, array, oldLeft, newLeft) {
  var elems = ScalaJS.newArrayObject(ScalaJS.d.O.getArrayOf(), [32]);
  var length = ((32 - ((newLeft > oldLeft) ? newLeft : oldLeft)) | 0);
  ScalaJS.systemArraycopy(array, oldLeft, elems, newLeft, length);
  return elems
});
ScalaJS.i.sci_VectorPointer$class__debug__sci_VectorPointer__V = (function($$this) {
  return (void 0)
});
ScalaJS.i.scm_ArrayOps$class__toArray__scm_ArrayOps__s_reflect_ClassTag__O = (function($$this, evidence$1) {
  var thatElementClass = ScalaJS.m.sr_ScalaRunTime().arrayElementClass__O__jl_Class(evidence$1);
  return ((ScalaJS.i.scm_ArrayOps$class__elementClass__scm_ArrayOps__jl_Class($$this) === thatElementClass) ? $$this.repr__O() : ScalaJS.i.sc_TraversableOnce$class__toArray__sc_TraversableOnce__s_reflect_ClassTag__O($$this, evidence$1))
});
ScalaJS.i.scm_ArrayOps$class__elementClass__scm_ArrayOps__jl_Class = (function($$this) {
  return ScalaJS.m.sr_ScalaRunTime().arrayElementClass__O__jl_Class(ScalaJS.objectGetClass($$this.repr__O()))
});
ScalaJS.i.scm_ArrayOps$class__copyToArray__scm_ArrayOps__O__I__I__V = (function($$this, xs, start, len) {
  var y = ScalaJS.m.sr_ScalaRunTime().array$undlength__O__I($$this.repr__O());
  var l = ((len < y) ? len : y);
  if ((((ScalaJS.m.sr_ScalaRunTime().array$undlength__O__I(xs) - start) | 0) < l)) {
    var $$this$1 = ((ScalaJS.m.sr_ScalaRunTime().array$undlength__O__I(xs) - start) | 0);
    l = (($$this$1 > 0) ? $$this$1 : 0)
  };
  ScalaJS.m.s_Array().copy__O__I__O__I__I__V($$this.repr__O(), 0, xs, start, l)
});
ScalaJS.i.scm_Builder$class__sizeHint__scm_Builder__sc_TraversableLike__V = (function($$this, coll) {
  if (ScalaJS.is.sc_IndexedSeqLike(coll)) {
    $$this.sizeHint__I__V(coll.size__I())
  }
});
ScalaJS.i.scm_Builder$class__sizeHintBounded__scm_Builder__I__sc_TraversableLike__V = (function($$this, size, boundingColl) {
  if (ScalaJS.is.sc_IndexedSeqLike(boundingColl)) {
    var that = boundingColl.size__I();
    $$this.sizeHint__I__V(((size < that) ? size : that))
  }
});
ScalaJS.i.scm_Builder$class__sizeHint__scm_Builder__sc_TraversableLike__I__V = (function($$this, coll, delta) {
  if (ScalaJS.is.sc_IndexedSeqLike(coll)) {
    $$this.sizeHint__I__V(((coll.size__I() + delta) | 0))
  }
});
ScalaJS.i.scm_FlatHashTable$HashUtils$class__entryToElem__scm_FlatHashTable$HashUtils__O__O = (function($$this, entry) {
  return ((entry === ScalaJS.m.scm_FlatHashTable$NullSentinel()) ? null : entry)
});
ScalaJS.i.scm_FlatHashTable$HashUtils$class__elemToEntry__scm_FlatHashTable$HashUtils__O__O = (function($$this, elem) {
  return ((null === elem) ? ScalaJS.m.scm_FlatHashTable$NullSentinel() : elem)
});
ScalaJS.i.scm_FlatHashTable$HashUtils$class__improve__scm_FlatHashTable$HashUtils__I__I__I = (function($$this, hcode, seed) {
  var improved = ScalaJS.m.s_util_hashing_package().byteswap32__I__I(hcode);
  var rotation = (seed % 32);
  var rotated = (((improved >>> rotation) | 0) | (improved << ((32 - rotation) | 0)));
  return rotated
});
ScalaJS.i.scm_FlatHashTable$class__nnSizeMapReset__scm_FlatHashTable__I__V = (function($$this, tableLength) {
  if (($$this.sizemap$5 !== null)) {
    var nsize = ScalaJS.i.scm_FlatHashTable$class__calcSizeMapSize__scm_FlatHashTable__I__I($$this, tableLength);
    if (($$this.sizemap$5.u["length"] !== nsize)) {
      $$this.sizemap$5 = ScalaJS.newArrayObject(ScalaJS.d.I.getArrayOf(), [nsize])
    } else {
      ScalaJS.m.ju_Arrays().fill__AI__I__V($$this.sizemap$5, 0)
    }
  }
});
ScalaJS.i.scm_FlatHashTable$class__index__scm_FlatHashTable__I__I = (function($$this, hcode) {
  var seed = $$this.seedvalue$5;
  var improved = ScalaJS.i.scm_FlatHashTable$HashUtils$class__improve__scm_FlatHashTable$HashUtils__I__I__I($$this, hcode, seed);
  var ones = (($$this.table$5.u["length"] - 1) | 0);
  return (((improved >>> ((32 - ScalaJS.m.jl_Integer().bitCount__I__I(ones)) | 0)) | 0) & ones)
});
ScalaJS.i.scm_FlatHashTable$class__containsElem__scm_FlatHashTable__O__Z = (function($$this, elem) {
  return (null !== ScalaJS.i.scm_FlatHashTable$class__findElemImpl__scm_FlatHashTable__O__O($$this, elem))
});
ScalaJS.i.scm_FlatHashTable$class__$init$__scm_FlatHashTable__V = (function($$this) {
  $$this.$$undloadFactor$5 = 450;
  $$this.table$5 = ScalaJS.newArrayObject(ScalaJS.d.O.getArrayOf(), [ScalaJS.i.scm_FlatHashTable$class__capacity__scm_FlatHashTable__I__I($$this, 32)]);
  $$this.tableSize$5 = 0;
  $$this.threshold$5 = ScalaJS.m.scm_FlatHashTable().newThreshold__I__I__I($$this.$$undloadFactor$5, ScalaJS.i.scm_FlatHashTable$class__capacity__scm_FlatHashTable__I__I($$this, 32));
  $$this.sizemap$5 = null;
  $$this.seedvalue$5 = ScalaJS.i.scm_FlatHashTable$class__tableSizeSeed__scm_FlatHashTable__I($$this)
});
ScalaJS.i.scm_FlatHashTable$class__initWithContents__scm_FlatHashTable__scm_FlatHashTable$Contents__V = (function($$this, c) {
  if ((c !== null)) {
    $$this.$$undloadFactor$5 = c.loadFactor__I();
    $$this.table$5 = c.table__AO();
    $$this.tableSize$5 = c.tableSize__I();
    $$this.threshold$5 = c.threshold__I();
    $$this.seedvalue$5 = c.seedvalue__I();
    $$this.sizemap$5 = c.sizemap__AI()
  }
});
ScalaJS.i.scm_FlatHashTable$class__addEntry__scm_FlatHashTable__O__Z = (function($$this, newEntry) {
  var hcode = ScalaJS.objectHashCode(newEntry);
  var h = ScalaJS.i.scm_FlatHashTable$class__index__scm_FlatHashTable__I__I($$this, hcode);
  var curEntry = $$this.table$5.u[h];
  while ((null !== curEntry)) {
    if (ScalaJS.anyEqEq(curEntry, newEntry)) {
      return false
    };
    h = (((h + 1) | 0) % $$this.table$5.u["length"]);
    curEntry = $$this.table$5.u[h]
  };
  $$this.table$5.u[h] = newEntry;
  $$this.tableSize$5 = (($$this.tableSize$5 + 1) | 0);
  var h$1 = h;
  ScalaJS.i.scm_FlatHashTable$class__nnSizeMapAdd__scm_FlatHashTable__I__V($$this, h$1);
  if (($$this.tableSize$5 >= $$this.threshold$5)) {
    ScalaJS.i.scm_FlatHashTable$class__growTable__scm_FlatHashTable__V($$this)
  };
  return true
});
ScalaJS.i.scm_FlatHashTable$class__tableSizeSeed__scm_FlatHashTable__I = (function($$this) {
  return ScalaJS.m.jl_Integer().bitCount__I__I((($$this.table$5.u["length"] - 1) | 0))
});
ScalaJS.i.scm_FlatHashTable$class__addElem__scm_FlatHashTable__O__Z = (function($$this, elem) {
  var newEntry = ScalaJS.i.scm_FlatHashTable$HashUtils$class__elemToEntry__scm_FlatHashTable$HashUtils__O__O($$this, elem);
  return ScalaJS.i.scm_FlatHashTable$class__addEntry__scm_FlatHashTable__O__Z($$this, newEntry)
});
ScalaJS.i.scm_FlatHashTable$class__capacity__scm_FlatHashTable__I__I = (function($$this, expectedSize) {
  return ((expectedSize === 0) ? 1 : ScalaJS.m.scm_HashTable().powerOfTwo__I__I(expectedSize))
});
ScalaJS.i.scm_FlatHashTable$class__nnSizeMapAdd__scm_FlatHashTable__I__V = (function($$this, h) {
  if (($$this.sizemap$5 !== null)) {
    var p = (h >> 5);
    var ev$1 = $$this.sizemap$5;
    ev$1.u[p] = ((ev$1.u[p] + 1) | 0)
  }
});
ScalaJS.i.scm_FlatHashTable$class__findElemImpl__scm_FlatHashTable__O__O = (function($$this, elem) {
  var searchEntry = ScalaJS.i.scm_FlatHashTable$HashUtils$class__elemToEntry__scm_FlatHashTable$HashUtils__O__O($$this, elem);
  var hcode = ScalaJS.objectHashCode(searchEntry);
  var h = ScalaJS.i.scm_FlatHashTable$class__index__scm_FlatHashTable__I__I($$this, hcode);
  var curEntry = $$this.table$5.u[h];
  while (((null !== curEntry) && (!ScalaJS.anyEqEq(curEntry, searchEntry)))) {
    h = (((h + 1) | 0) % $$this.table$5.u["length"]);
    curEntry = $$this.table$5.u[h]
  };
  return curEntry
});
ScalaJS.i.scm_FlatHashTable$class__growTable__scm_FlatHashTable__V = (function($$this) {
  var oldtable = $$this.table$5;
  $$this.table$5 = ScalaJS.newArrayObject(ScalaJS.d.O.getArrayOf(), [ScalaJS.imul($$this.table$5.u["length"], 2)]);
  $$this.tableSize$5 = 0;
  var tableLength = $$this.table$5.u["length"];
  ScalaJS.i.scm_FlatHashTable$class__nnSizeMapReset__scm_FlatHashTable__I__V($$this, tableLength);
  $$this.seedvalue$5 = ScalaJS.i.scm_FlatHashTable$class__tableSizeSeed__scm_FlatHashTable__I($$this);
  $$this.threshold$5 = ScalaJS.m.scm_FlatHashTable().newThreshold__I__I__I($$this.$$undloadFactor$5, $$this.table$5.u["length"]);
  var i = 0;
  while ((i < oldtable.u["length"])) {
    var entry = oldtable.u[i];
    if ((null !== entry)) {
      ScalaJS.i.scm_FlatHashTable$class__addEntry__scm_FlatHashTable__O__Z($$this, entry)
    };
    i = ((i + 1) | 0)
  }
});
ScalaJS.i.scm_FlatHashTable$class__calcSizeMapSize__scm_FlatHashTable__I__I = (function($$this, tableLength) {
  return (((tableLength >> 5) + 1) | 0)
});
ScalaJS.i.scm_LinkedListLike$class__isEmpty__scm_LinkedListLike__Z = (function($$this) {
  return ($$this.next$5 === $$this)
});
ScalaJS.i.scm_LinkedListLike$class__length0__scm_LinkedListLike__scm_Seq__I__I = (function($$this, elem, acc) {
  _length0: while (true) {
    var this$1 = ScalaJS.as.scm_LinkedListLike(elem);
    if (ScalaJS.i.scm_LinkedListLike$class__isEmpty__scm_LinkedListLike__Z(this$1)) {
      return acc
    } else {
      var temp$elem = ScalaJS.as.scm_LinkedListLike(elem).next$5;
      var temp$acc = ((acc + 1) | 0);
      elem = temp$elem;
      acc = temp$acc;
      continue _length0
    }
  }
});
ScalaJS.i.scm_LinkedListLike$class__foreach__scm_LinkedListLike__F1__V = (function($$this, f) {
  var these = $$this;
  while (true) {
    var this$1 = these;
    if (ScalaJS.i.sc_TraversableOnce$class__nonEmpty__sc_TraversableOnce__Z(this$1)) {
      f.apply__O__O(these.elem$5);
      these = ScalaJS.as.scm_LinkedListLike(these.next$5)
    } else {
      break
    }
  }
});
ScalaJS.i.scm_LinkedListLike$class__drop__scm_LinkedListLike__I__scm_Seq = (function($$this, n) {
  var i = 0;
  var these = ScalaJS.as.scm_Seq($$this);
  while (true) {
    if ((i < n)) {
      var this$1 = ScalaJS.as.scm_LinkedListLike(these);
      var jsx$1 = (!ScalaJS.i.scm_LinkedListLike$class__isEmpty__scm_LinkedListLike__Z(this$1))
    } else {
      var jsx$1 = false
    };
    if (jsx$1) {
      these = ScalaJS.as.scm_LinkedListLike(these).next$5;
      i = ((i + 1) | 0)
    } else {
      break
    }
  };
  return these
});
ScalaJS.i.scm_LinkedListLike$class__tail__scm_LinkedListLike__scm_Seq = (function($$this) {
  var requirement = ScalaJS.i.sc_TraversableOnce$class__nonEmpty__sc_TraversableOnce__Z($$this);
  if ((!requirement)) {
    throw new ScalaJS.c.jl_IllegalArgumentException().init___T(("requirement failed: " + "tail of empty list"))
  };
  return $$this.next$5
});
ScalaJS.i.scm_LinkedListLike$class__head__scm_LinkedListLike__O = (function($$this) {
  if (ScalaJS.i.scm_LinkedListLike$class__isEmpty__scm_LinkedListLike__Z($$this)) {
    throw new ScalaJS.c.ju_NoSuchElementException().init___()
  } else {
    return $$this.elem$5
  }
});
ScalaJS.i.scm_LinkedListLike$class__apply__scm_LinkedListLike__I__O = (function($$this, n) {
  var loc = ScalaJS.i.scm_LinkedListLike$class__drop__scm_LinkedListLike__I__scm_Seq($$this, n);
  if (loc.nonEmpty__Z()) {
    return ScalaJS.as.scm_LinkedListLike(loc).elem$5
  } else {
    throw new ScalaJS.c.jl_IndexOutOfBoundsException().init___T(ScalaJS.objectToString(n))
  }
});
ScalaJS.i.scm_ResizableArray$class__apply__scm_ResizableArray__I__O = (function($$this, idx) {
  if ((idx >= $$this.size0$6)) {
    throw new ScalaJS.c.jl_IndexOutOfBoundsException().init___T(ScalaJS.objectToString(idx))
  };
  return $$this.array$6.u[idx]
});
ScalaJS.i.scm_ResizableArray$class__ensureSize__scm_ResizableArray__I__V = (function($$this, n) {
  var value = $$this.array$6.u["length"];
  var arrayLength = new ScalaJS.c.sjsr_RuntimeLong().init___I(value);
  if (new ScalaJS.c.sjsr_RuntimeLong().init___I(n).$$greater__sjsr_RuntimeLong__Z(arrayLength)) {
    var newSize = arrayLength.$$times__sjsr_RuntimeLong__sjsr_RuntimeLong(new ScalaJS.c.sjsr_RuntimeLong().init___I(2));
    while (new ScalaJS.c.sjsr_RuntimeLong().init___I(n).$$greater__sjsr_RuntimeLong__Z(newSize)) {
      newSize = newSize.$$times__sjsr_RuntimeLong__sjsr_RuntimeLong(new ScalaJS.c.sjsr_RuntimeLong().init___I(2))
    };
    if (newSize.$$greater__sjsr_RuntimeLong__Z(new ScalaJS.c.sjsr_RuntimeLong().init___I(2147483647))) {
      newSize = new ScalaJS.c.sjsr_RuntimeLong().init___I__I__I(4194303, 511, 0)
    };
    var newArray = ScalaJS.newArrayObject(ScalaJS.d.O.getArrayOf(), [newSize.toInt__I()]);
    var src = $$this.array$6;
    var length = $$this.size0$6;
    ScalaJS.systemArraycopy(src, 0, newArray, 0, length);
    $$this.array$6 = newArray
  }
});
ScalaJS.i.scm_ResizableArray$class__$init$__scm_ResizableArray__V = (function($$this) {
  var x = $$this.initialSize$6;
  $$this.array$6 = ScalaJS.newArrayObject(ScalaJS.d.O.getArrayOf(), [((x > 1) ? x : 1)]);
  $$this.size0$6 = 0
});
ScalaJS.i.scm_ResizableArray$class__foreach__scm_ResizableArray__F1__V = (function($$this, f) {
  var i = 0;
  var top = $$this.size0$6;
  while ((i < top)) {
    f.apply__O__O($$this.array$6.u[i]);
    i = ((i + 1) | 0)
  }
});
ScalaJS.i.scm_ResizableArray$class__copyToArray__scm_ResizableArray__O__I__I__V = (function($$this, xs, start, len) {
  var that = ((ScalaJS.m.sr_ScalaRunTime().array$undlength__O__I(xs) - start) | 0);
  var $$this$1 = ((len < that) ? len : that);
  var that$1 = $$this.size0$6;
  var len1 = (($$this$1 < that$1) ? $$this$1 : that$1);
  ScalaJS.m.s_Array().copy__O__I__O__I__I__V($$this.array$6, 0, xs, start, len1)
});
ScalaJS.i.sjsr_RuntimeString$class__indexOf__sjsr_RuntimeString__T__I = (function($$this, str) {
  return (ScalaJS.uD($$this["indexOf"](str)) | 0)
});
ScalaJS.i.sjsr_RuntimeString$class__indexOf__sjsr_RuntimeString__I__I__I = (function($$this, ch, fromIndex) {
  return ScalaJS.i.sjsr_RuntimeString$class__indexOf__sjsr_RuntimeString__T__I__I(ScalaJS.as.T($$this), ScalaJS.m.sjsr_RuntimeString().scala$scalajs$runtime$RuntimeString$$fromCodePoint__I__T(ch), fromIndex)
});
ScalaJS.i.sjsr_RuntimeString$class__charAt__sjsr_RuntimeString__I__C = (function($$this, index) {
  return (ScalaJS.uI($$this["charCodeAt"](index)) & 65535)
});
ScalaJS.i.sjsr_RuntimeString$class__toUpperCase__sjsr_RuntimeString__T = (function($$this) {
  return ScalaJS.as.T($$this["toUpperCase"]())
});
ScalaJS.i.sjsr_RuntimeString$class__lastIndexOf__sjsr_RuntimeString__I__I = (function($$this, ch) {
  return ScalaJS.i.sjsr_RuntimeString$class__lastIndexOf__sjsr_RuntimeString__T__I(ScalaJS.as.T($$this), ScalaJS.m.sjsr_RuntimeString().scala$scalajs$runtime$RuntimeString$$fromCodePoint__I__T(ch))
});
ScalaJS.i.sjsr_RuntimeString$class__indexOf__sjsr_RuntimeString__I__I = (function($$this, ch) {
  return ScalaJS.i.sjsr_RuntimeString$class__indexOf__sjsr_RuntimeString__T__I(ScalaJS.as.T($$this), ScalaJS.m.sjsr_RuntimeString().scala$scalajs$runtime$RuntimeString$$fromCodePoint__I__T(ch))
});
ScalaJS.i.sjsr_RuntimeString$class__toCharArray__sjsr_RuntimeString__AC = (function($$this) {
  var length = (ScalaJS.uD($$this["length"]) | 0);
  var result = ScalaJS.newArrayObject(ScalaJS.d.C.getArrayOf(), [length]);
  var i = 0;
  while ((i < length)) {
    result.u[i] = ScalaJS.i.sjsr_RuntimeString$class__charAt__sjsr_RuntimeString__I__C(ScalaJS.as.T($$this), i);
    i = ((i + 1) | 0)
  };
  return result
});
ScalaJS.i.sjsr_RuntimeString$class__substring__sjsr_RuntimeString__I__I__T = (function($$this, beginIndex, endIndex) {
  return ScalaJS.as.T($$this["substring"](beginIndex, endIndex))
});
ScalaJS.i.sjsr_RuntimeString$class__length__sjsr_RuntimeString__I = (function($$this) {
  return (ScalaJS.uD($$this["length"]) | 0)
});
ScalaJS.i.sjsr_RuntimeString$class__indexOf__sjsr_RuntimeString__T__I__I = (function($$this, str, fromIndex) {
  return (ScalaJS.uD($$this["indexOf"](str, fromIndex)) | 0)
});
ScalaJS.i.sjsr_RuntimeString$class__substring__sjsr_RuntimeString__I__T = (function($$this, beginIndex) {
  return ScalaJS.as.T($$this["substring"](beginIndex))
});
ScalaJS.i.sjsr_RuntimeString$class__isEmpty__sjsr_RuntimeString__Z = (function($$this) {
  return ((ScalaJS.uD($$this["length"]) | 0) === 0)
});
ScalaJS.i.sjsr_RuntimeString$class__lastIndexOf__sjsr_RuntimeString__T__I = (function($$this, str) {
  return (ScalaJS.uD($$this["lastIndexOf"](str)) | 0)
});
ScalaJS.i.sjsr_RuntimeString$class__replace__sjsr_RuntimeString__jl_CharSequence__jl_CharSequence__T = (function($$this, target, replacement) {
  return ScalaJS.as.T($$this["split"](ScalaJS.objectToString(target))["join"](ScalaJS.objectToString(replacement)))
});
ScalaJS.is.F0 = (function(obj) {
  return (!(!((obj && obj.$classData) && obj.$classData.ancestors.F0)))
});
ScalaJS.as.F0 = (function(obj) {
  return ((ScalaJS.is.F0(obj) || (obj === null)) ? obj : ScalaJS.throwClassCastException(obj, "scala.Function0"))
});
ScalaJS.isArrayOf.F0 = (function(obj, depth) {
  return (!(!(((obj && obj.$classData) && (obj.$classData.arrayDepth === depth)) && obj.$classData.arrayBase.ancestors.F0)))
});
ScalaJS.asArrayOf.F0 = (function(obj, depth) {
  return ((ScalaJS.isArrayOf.F0(obj, depth) || (obj === null)) ? obj : ScalaJS.throwArrayCastException(obj, "Lscala.Function0;", depth))
});
ScalaJS.d.F0 = new ScalaJS.ClassTypeData({
  F0: 0
}, true, "scala.Function0", (void 0), {
  F0: 1,
  O: 1
});
ScalaJS.is.F1 = (function(obj) {
  return (!(!((obj && obj.$classData) && obj.$classData.ancestors.F1)))
});
ScalaJS.as.F1 = (function(obj) {
  return ((ScalaJS.is.F1(obj) || (obj === null)) ? obj : ScalaJS.throwClassCastException(obj, "scala.Function1"))
});
ScalaJS.isArrayOf.F1 = (function(obj, depth) {
  return (!(!(((obj && obj.$classData) && (obj.$classData.arrayDepth === depth)) && obj.$classData.arrayBase.ancestors.F1)))
});
ScalaJS.asArrayOf.F1 = (function(obj, depth) {
  return ((ScalaJS.isArrayOf.F1(obj, depth) || (obj === null)) ? obj : ScalaJS.throwArrayCastException(obj, "Lscala.Function1;", depth))
});
ScalaJS.d.F1 = new ScalaJS.ClassTypeData({
  F1: 0
}, true, "scala.Function1", (void 0), {
  F1: 1,
  O: 1
});
ScalaJS.is.F2 = (function(obj) {
  return (!(!((obj && obj.$classData) && obj.$classData.ancestors.F2)))
});
ScalaJS.as.F2 = (function(obj) {
  return ((ScalaJS.is.F2(obj) || (obj === null)) ? obj : ScalaJS.throwClassCastException(obj, "scala.Function2"))
});
ScalaJS.isArrayOf.F2 = (function(obj, depth) {
  return (!(!(((obj && obj.$classData) && (obj.$classData.arrayDepth === depth)) && obj.$classData.arrayBase.ancestors.F2)))
});
ScalaJS.asArrayOf.F2 = (function(obj, depth) {
  return ((ScalaJS.isArrayOf.F2(obj, depth) || (obj === null)) ? obj : ScalaJS.throwArrayCastException(obj, "Lscala.Function2;", depth))
});
ScalaJS.d.F2 = new ScalaJS.ClassTypeData({
  F2: 0
}, true, "scala.Function2", (void 0), {
  F2: 1,
  O: 1
});
/** @constructor */
ScalaJS.c.Lcom_repocad_web_Ajax$ = (function() {
  ScalaJS.c.O.call(this)
});
ScalaJS.c.Lcom_repocad_web_Ajax$.prototype = new ScalaJS.h.O();
ScalaJS.c.Lcom_repocad_web_Ajax$.prototype.constructor = ScalaJS.c.Lcom_repocad_web_Ajax$;
/** @constructor */
ScalaJS.h.Lcom_repocad_web_Ajax$ = (function() {
  /*<skip>*/
});
ScalaJS.h.Lcom_repocad_web_Ajax$.prototype = ScalaJS.c.Lcom_repocad_web_Ajax$.prototype;
ScalaJS.c.Lcom_repocad_web_Ajax$.prototype.get__T__Lcom_repocad_web_Response = (function(url) {
  return this.ajax__p1__T__T__T__sci_Map__Lcom_repocad_web_Response("GET", url, "", ScalaJS.as.sci_Map(ScalaJS.m.s_Predef().Map$2.apply__sc_Seq__sc_GenMap(ScalaJS.m.sci_Nil())))
});
ScalaJS.c.Lcom_repocad_web_Ajax$.prototype.ajax__p1__T__T__T__sci_Map__Lcom_repocad_web_Response = (function(method, url, data, headers) {
  try {
    var xhr = new ScalaJS.g["XMLHttpRequest"]();
    xhr["open"](method, url, false);
    headers.foreach__F1__V(new ScalaJS.c.sjsr_AnonFunction1().init___sjs_js_Function1((function(xhr$1) {
      return (function(t$2) {
        var t = ScalaJS.as.T2(t$2);
        xhr$1["setRequestHeader"](ScalaJS.as.T(t.$$und1$f), ScalaJS.as.T(t.$$und2$f))
      })
    })(xhr)));
    xhr["send"](data);
    return ScalaJS.m.Lcom_repocad_web_Response().apply__Lorg_scalajs_dom_XMLHttpRequest__Lcom_repocad_web_Response(xhr)
  } catch (ex) {
    ex = ScalaJS.wrapJavaScriptException(ex);
    if (ScalaJS.is.jl_Throwable(ex)) {
      return new ScalaJS.c.Lcom_repocad_web_Response().init___I__I__T(0, 0, "")
    } else {
      throw ScalaJS.unwrapJavaScriptException(ex)
    }
  }
});
ScalaJS.c.Lcom_repocad_web_Ajax$.prototype.post__T__T__Lcom_repocad_web_Response = (function(url, data) {
  var jsx$1 = ScalaJS.m.s_Predef().Map$2;
  var y = ScalaJS.objectToString(ScalaJS.i.sjsr_RuntimeString$class__length__sjsr_RuntimeString__I(data));
  return this.ajax__p1__T__T__T__sci_Map__Lcom_repocad_web_Response("POST", url, data, ScalaJS.as.sci_Map(jsx$1.apply__sc_Seq__sc_GenMap(new ScalaJS.c.sjs_js_WrappedArray().init___sjs_js_Array([new ScalaJS.c.T2().init___O__O("Content-length", y)]))))
});
ScalaJS.is.Lcom_repocad_web_Ajax$ = (function(obj) {
  return (!(!((obj && obj.$classData) && obj.$classData.ancestors.Lcom_repocad_web_Ajax$)))
});
ScalaJS.as.Lcom_repocad_web_Ajax$ = (function(obj) {
  return ((ScalaJS.is.Lcom_repocad_web_Ajax$(obj) || (obj === null)) ? obj : ScalaJS.throwClassCastException(obj, "com.repocad.web.Ajax$"))
});
ScalaJS.isArrayOf.Lcom_repocad_web_Ajax$ = (function(obj, depth) {
  return (!(!(((obj && obj.$classData) && (obj.$classData.arrayDepth === depth)) && obj.$classData.arrayBase.ancestors.Lcom_repocad_web_Ajax$)))
});
ScalaJS.asArrayOf.Lcom_repocad_web_Ajax$ = (function(obj, depth) {
  return ((ScalaJS.isArrayOf.Lcom_repocad_web_Ajax$(obj, depth) || (obj === null)) ? obj : ScalaJS.throwArrayCastException(obj, "Lcom.repocad.web.Ajax$;", depth))
});
ScalaJS.d.Lcom_repocad_web_Ajax$ = new ScalaJS.ClassTypeData({
  Lcom_repocad_web_Ajax$: 0
}, false, "com.repocad.web.Ajax$", ScalaJS.d.O, {
  Lcom_repocad_web_Ajax$: 1,
  O: 1
});
ScalaJS.c.Lcom_repocad_web_Ajax$.prototype.$classData = ScalaJS.d.Lcom_repocad_web_Ajax$;
ScalaJS.n.Lcom_repocad_web_Ajax = (void 0);
ScalaJS.m.Lcom_repocad_web_Ajax = (function() {
  if ((!ScalaJS.n.Lcom_repocad_web_Ajax)) {
    ScalaJS.n.Lcom_repocad_web_Ajax = new ScalaJS.c.Lcom_repocad_web_Ajax$().init___()
  };
  return ScalaJS.n.Lcom_repocad_web_Ajax
});
/** @constructor */
ScalaJS.c.Lcom_repocad_web_CanvasView = (function() {
  ScalaJS.c.O.call(this);
  this.canvas$1 = null;
  this.context$1 = null;
  this.landscape$1 = false
});
ScalaJS.c.Lcom_repocad_web_CanvasView.prototype = new ScalaJS.h.O();
ScalaJS.c.Lcom_repocad_web_CanvasView.prototype.constructor = ScalaJS.c.Lcom_repocad_web_CanvasView;
/** @constructor */
ScalaJS.h.Lcom_repocad_web_CanvasView = (function() {
  /*<skip>*/
});
ScalaJS.h.Lcom_repocad_web_CanvasView.prototype = ScalaJS.c.Lcom_repocad_web_CanvasView.prototype;
ScalaJS.c.Lcom_repocad_web_CanvasView.prototype.init__V = (function() {
  this.context$1["translate"](((ScalaJS.uI(this.canvas$1["width"]) / 2) | 0), ((ScalaJS.uI(this.canvas$1["height"]) / 2) | 0));
  this.drawPaper__V()
});
ScalaJS.c.Lcom_repocad_web_CanvasView.prototype.line__D__D__D__D__V = (function(x1, y1, x2, y2) {
  this.context$1["beginPath"]();
  this.context$1["moveTo"](x1, (-y1));
  this.context$1["lineTo"](x2, (-y2));
  this.context$1["stroke"]();
  this.context$1["lineWidth"] = (0.2 * ScalaJS.m.Lcom_repocad_web_package().paperScale$1);
  this.context$1["closePath"]()
});
ScalaJS.c.Lcom_repocad_web_CanvasView.prototype.circle__D__D__D__V = (function(x, y, r) {
  this.context$1["beginPath"]();
  this.context$1["arc"](x, (-y), r, 0.0, 6.283185307179586);
  this.context$1["lineWidth"] = (0.2 * ScalaJS.m.Lcom_repocad_web_package().paperScale$1);
  this.context$1["stroke"]();
  this.context$1["closePath"]()
});
ScalaJS.c.Lcom_repocad_web_CanvasView.prototype.arc__D__D__D__D__D__V = (function(x, y, r, sAngle, eAngle) {
  this.context$1["beginPath"]();
  this.context$1["arc"](x, (-y), r, sAngle, eAngle);
  this.context$1["stroke"]();
  this.context$1["lineWidth"] = (0.2 * ScalaJS.m.Lcom_repocad_web_package().paperScale$1);
  this.context$1["closePath"]()
});
ScalaJS.c.Lcom_repocad_web_CanvasView.prototype.text__D__D__D__O__V = (function(x, y, h, t) {
  var correctedH = (h / 1.5);
  var myFont = (ScalaJS.objectToString(correctedH) + "px Arial");
  this.context$1["font"] = myFont;
  this.context$1["fillStyle"] = "black";
  this.context$1["fillText"](ScalaJS.objectToString(t), x, (-y))
});
ScalaJS.c.Lcom_repocad_web_CanvasView.prototype.drawPaper__V = (function() {
  this.context$1["fillStyle"] = "white";
  this.landscape$1 = ScalaJS.m.Lcom_repocad_web_Paper().scaleAndRotation__Z();
  if (this.landscape$1) {
    var jsx$1 = ScalaJS.m.Lcom_repocad_web_package().drawingCenter$1.x$1;
    var this$1 = ScalaJS.m.Lcom_repocad_web_package().paperSize$1;
    var x = (jsx$1 - ((ScalaJS.uD(ScalaJS.i.sc_LinearSeqOptimized$class__apply__sc_LinearSeqOptimized__I__O(this$1, 1)) * ScalaJS.m.Lcom_repocad_web_package().paperScale$1) / 2));
    var jsx$2 = ScalaJS.m.Lcom_repocad_web_package().drawingCenter$1.y$1;
    var this$2 = ScalaJS.m.Lcom_repocad_web_package().paperSize$1;
    var y = ((-jsx$2) - ((ScalaJS.uD(ScalaJS.i.sc_LinearSeqOptimized$class__apply__sc_LinearSeqOptimized__I__O(this$2, 0)) * ScalaJS.m.Lcom_repocad_web_package().paperScale$1) / 2));
    var this$3 = ScalaJS.m.Lcom_repocad_web_package().paperSize$1;
    var jsx$4 = ScalaJS.i.sc_LinearSeqOptimized$class__apply__sc_LinearSeqOptimized__I__O(this$3, 1);
    var jsx$3 = ScalaJS.m.Lcom_repocad_web_package().paperScale$1;
    var this$4 = ScalaJS.m.Lcom_repocad_web_package().paperSize$1;
    this.context$1["fillRect"](x, y, (ScalaJS.uD(jsx$4) * jsx$3), (ScalaJS.uD(ScalaJS.i.sc_LinearSeqOptimized$class__apply__sc_LinearSeqOptimized__I__O(this$4, 0)) * ScalaJS.m.Lcom_repocad_web_package().paperScale$1))
  } else {
    var jsx$5 = ScalaJS.m.Lcom_repocad_web_package().drawingCenter$1.x$1;
    var this$5 = ScalaJS.m.Lcom_repocad_web_package().paperSize$1;
    var x$2 = (jsx$5 - ((ScalaJS.uD(ScalaJS.i.sc_LinearSeqOptimized$class__apply__sc_LinearSeqOptimized__I__O(this$5, 0)) * ScalaJS.m.Lcom_repocad_web_package().paperScale$1) / 2));
    var jsx$6 = ScalaJS.m.Lcom_repocad_web_package().drawingCenter$1.y$1;
    var this$6 = ScalaJS.m.Lcom_repocad_web_package().paperSize$1;
    var y$2 = ((-jsx$6) - ((ScalaJS.uD(ScalaJS.i.sc_LinearSeqOptimized$class__apply__sc_LinearSeqOptimized__I__O(this$6, 1)) * ScalaJS.m.Lcom_repocad_web_package().paperScale$1) / 2));
    var this$7 = ScalaJS.m.Lcom_repocad_web_package().paperSize$1;
    var jsx$8 = ScalaJS.i.sc_LinearSeqOptimized$class__apply__sc_LinearSeqOptimized__I__O(this$7, 0);
    var jsx$7 = ScalaJS.m.Lcom_repocad_web_package().paperScale$1;
    var this$8 = ScalaJS.m.Lcom_repocad_web_package().paperSize$1;
    this.context$1["fillRect"](x$2, y$2, (ScalaJS.uD(jsx$8) * jsx$7), (ScalaJS.uD(ScalaJS.i.sc_LinearSeqOptimized$class__apply__sc_LinearSeqOptimized__I__O(this$8, 1)) * ScalaJS.m.Lcom_repocad_web_package().paperScale$1))
  }
});
ScalaJS.c.Lcom_repocad_web_CanvasView.prototype.windowCenter__Lcom_repocad_web_Vector2D = (function() {
  return new ScalaJS.c.Lcom_repocad_web_Vector2D().init___D__D(((ScalaJS.uD(this.canvas$1["getBoundingClientRect"]()["right"]) + ScalaJS.uD(this.canvas$1["getBoundingClientRect"]()["left"])) * 0.5), ((ScalaJS.uD(this.canvas$1["getBoundingClientRect"]()["bottom"]) + ScalaJS.uD(this.canvas$1["getBoundingClientRect"]()["top"])) * 0.5))
});
ScalaJS.c.Lcom_repocad_web_CanvasView.prototype.bezierCurve__D__D__D__D__D__D__D__D__V = (function(x1, y1, x2, y2, x3, y3, x4, y4) {
  this.context$1["beginPath"]();
  this.context$1["moveTo"](x1, (-y1));
  this.context$1["bezierCurveTo"](x2, (-y2), x3, (-y3), x4, (-y4));
  this.context$1["stroke"]();
  this.context$1["lineWidth"] = (0.2 * ScalaJS.m.Lcom_repocad_web_package().paperScale$1)
});
ScalaJS.c.Lcom_repocad_web_CanvasView.prototype.init___Lorg_scalajs_dom_HTMLCanvasElement = (function(canvas) {
  this.canvas$1 = canvas;
  this.context$1 = canvas["getContext"]("2d");
  this.landscape$1 = false;
  return this
});
ScalaJS.c.Lcom_repocad_web_CanvasView.prototype.translate__D__D__V = (function(x, y) {
  this.context$1["translate"](x, y)
});
ScalaJS.c.Lcom_repocad_web_CanvasView.prototype.clear__V = (function() {
  this.context$1["save"]();
  this.context$1["setTransform"](1.0, 0.0, 0.0, 1.0, 0.0, 0.0);
  this.context$1["fillStyle"] = "AliceBlue";
  this.context$1["fillRect"](0.0, 0.0, ScalaJS.uI(this.canvas$1["width"]), ScalaJS.uI(this.canvas$1["height"]));
  this.context$1["restore"]();
  this.drawPaper__V()
});
ScalaJS.c.Lcom_repocad_web_CanvasView.prototype.zoom__D__D__D__V = (function(level, pointX, pointY) {
  var delta = (1 + (level * 0.15));
  var mousePoint = new ScalaJS.c.Lcom_repocad_web_Vector2D().init___D__D((pointX - this.windowCenter__Lcom_repocad_web_Vector2D().x$1), (pointY - this.windowCenter__Lcom_repocad_web_Vector2D().y$1));
  this.context$1["translate"](mousePoint.x$1, mousePoint.y$1);
  this.context$1["scale"](delta, delta);
  this.context$1["translate"]((-mousePoint.x$1), (-mousePoint.y$1))
});
ScalaJS.is.Lcom_repocad_web_CanvasView = (function(obj) {
  return (!(!((obj && obj.$classData) && obj.$classData.ancestors.Lcom_repocad_web_CanvasView)))
});
ScalaJS.as.Lcom_repocad_web_CanvasView = (function(obj) {
  return ((ScalaJS.is.Lcom_repocad_web_CanvasView(obj) || (obj === null)) ? obj : ScalaJS.throwClassCastException(obj, "com.repocad.web.CanvasView"))
});
ScalaJS.isArrayOf.Lcom_repocad_web_CanvasView = (function(obj, depth) {
  return (!(!(((obj && obj.$classData) && (obj.$classData.arrayDepth === depth)) && obj.$classData.arrayBase.ancestors.Lcom_repocad_web_CanvasView)))
});
ScalaJS.asArrayOf.Lcom_repocad_web_CanvasView = (function(obj, depth) {
  return ((ScalaJS.isArrayOf.Lcom_repocad_web_CanvasView(obj, depth) || (obj === null)) ? obj : ScalaJS.throwArrayCastException(obj, "Lcom.repocad.web.CanvasView;", depth))
});
ScalaJS.d.Lcom_repocad_web_CanvasView = new ScalaJS.ClassTypeData({
  Lcom_repocad_web_CanvasView: 0
}, false, "com.repocad.web.CanvasView", ScalaJS.d.O, {
  Lcom_repocad_web_CanvasView: 1,
  Lcom_repocad_web_Printer: 1,
  O: 1
});
ScalaJS.c.Lcom_repocad_web_CanvasView.prototype.$classData = ScalaJS.d.Lcom_repocad_web_CanvasView;
/** @constructor */
ScalaJS.c.Lcom_repocad_web_Drawing = (function() {
  ScalaJS.c.O.call(this);
  this.name$1 = null;
  this.content$1 = null
});
ScalaJS.c.Lcom_repocad_web_Drawing.prototype = new ScalaJS.h.O();
ScalaJS.c.Lcom_repocad_web_Drawing.prototype.constructor = ScalaJS.c.Lcom_repocad_web_Drawing;
/** @constructor */
ScalaJS.h.Lcom_repocad_web_Drawing = (function() {
  /*<skip>*/
});
ScalaJS.h.Lcom_repocad_web_Drawing.prototype = ScalaJS.c.Lcom_repocad_web_Drawing.prototype;
ScalaJS.c.Lcom_repocad_web_Drawing.prototype.init___T__T = (function(name, content) {
  this.name$1 = name;
  this.content$1 = content;
  return this
});
ScalaJS.c.Lcom_repocad_web_Drawing.prototype.save__Lcom_repocad_web_Response = (function() {
  var urlName = ScalaJS.g["encodeURI"](this.name$1);
  return ScalaJS.m.Lcom_repocad_web_Ajax().post__T__T__Lcom_repocad_web_Response(("http://repocad.com:20004/post/" + urlName), this.content$1)
});
ScalaJS.c.Lcom_repocad_web_Drawing.prototype.productPrefix__T = (function() {
  return "Drawing"
});
ScalaJS.c.Lcom_repocad_web_Drawing.prototype.productArity__I = (function() {
  return 2
});
ScalaJS.c.Lcom_repocad_web_Drawing.prototype.equals__O__Z = (function(x$1) {
  if ((this === x$1)) {
    return true
  } else if (ScalaJS.is.Lcom_repocad_web_Drawing(x$1)) {
    var Drawing$1 = ScalaJS.as.Lcom_repocad_web_Drawing(x$1);
    return (ScalaJS.anyRefEqEq(this.name$1, Drawing$1.name$1) && ScalaJS.anyRefEqEq(this.content$1, Drawing$1.content$1))
  } else {
    return false
  }
});
ScalaJS.c.Lcom_repocad_web_Drawing.prototype.productElement__I__O = (function(x$1) {
  switch (x$1) {
    case 0:
      {
        return this.name$1;
        break
      };
    case 1:
      {
        return this.content$1;
        break
      };
    default:
      throw new ScalaJS.c.jl_IndexOutOfBoundsException().init___T(ScalaJS.objectToString(x$1));
  }
});
ScalaJS.c.Lcom_repocad_web_Drawing.prototype.toString__T = (function() {
  return ScalaJS.m.sr_ScalaRunTime().$$undtoString__s_Product__T(this)
});
ScalaJS.c.Lcom_repocad_web_Drawing.prototype.hashCode__I = (function() {
  var this$2 = ScalaJS.m.s_util_hashing_MurmurHash3();
  return this$2.productHash__s_Product__I__I(this, (-889275714))
});
ScalaJS.c.Lcom_repocad_web_Drawing.prototype.productIterator__sc_Iterator = (function() {
  return new ScalaJS.c.sr_ScalaRunTime$$anon$1().init___s_Product(this)
});
ScalaJS.is.Lcom_repocad_web_Drawing = (function(obj) {
  return (!(!((obj && obj.$classData) && obj.$classData.ancestors.Lcom_repocad_web_Drawing)))
});
ScalaJS.as.Lcom_repocad_web_Drawing = (function(obj) {
  return ((ScalaJS.is.Lcom_repocad_web_Drawing(obj) || (obj === null)) ? obj : ScalaJS.throwClassCastException(obj, "com.repocad.web.Drawing"))
});
ScalaJS.isArrayOf.Lcom_repocad_web_Drawing = (function(obj, depth) {
  return (!(!(((obj && obj.$classData) && (obj.$classData.arrayDepth === depth)) && obj.$classData.arrayBase.ancestors.Lcom_repocad_web_Drawing)))
});
ScalaJS.asArrayOf.Lcom_repocad_web_Drawing = (function(obj, depth) {
  return ((ScalaJS.isArrayOf.Lcom_repocad_web_Drawing(obj, depth) || (obj === null)) ? obj : ScalaJS.throwArrayCastException(obj, "Lcom.repocad.web.Drawing;", depth))
});
ScalaJS.d.Lcom_repocad_web_Drawing = new ScalaJS.ClassTypeData({
  Lcom_repocad_web_Drawing: 0
}, false, "com.repocad.web.Drawing", ScalaJS.d.O, {
  Lcom_repocad_web_Drawing: 1,
  s_Serializable: 1,
  Ljava_io_Serializable: 1,
  s_Product: 1,
  s_Equals: 1,
  O: 1
});
ScalaJS.c.Lcom_repocad_web_Drawing.prototype.$classData = ScalaJS.d.Lcom_repocad_web_Drawing;
/** @constructor */
ScalaJS.c.Lcom_repocad_web_Drawing$ = (function() {
  ScalaJS.c.O.call(this);
  this.com$repocad$web$Drawing$$listener$1 = null
});
ScalaJS.c.Lcom_repocad_web_Drawing$.prototype = new ScalaJS.h.O();
ScalaJS.c.Lcom_repocad_web_Drawing$.prototype.constructor = ScalaJS.c.Lcom_repocad_web_Drawing$;
/** @constructor */
ScalaJS.h.Lcom_repocad_web_Drawing$ = (function() {
  /*<skip>*/
});
ScalaJS.h.Lcom_repocad_web_Drawing$.prototype = ScalaJS.c.Lcom_repocad_web_Drawing$.prototype;
ScalaJS.c.Lcom_repocad_web_Drawing$.prototype.init___ = (function() {
  ScalaJS.n.Lcom_repocad_web_Drawing = this;
  this.com$repocad$web$Drawing$$listener$1 = new ScalaJS.c.sjsr_AnonFunction0().init___sjs_js_Function0((function() {
    return (void 0)
  }));
  ScalaJS.g["setInterval"]((function() {
    return ScalaJS.m.Lcom_repocad_web_Drawing().com$repocad$web$Drawing$$listener$1.apply__O()
  }), 100);
  return this
});
ScalaJS.c.Lcom_repocad_web_Drawing$.prototype.setHashListener__F1__V = (function(fn) {
  var elem = ScalaJS.as.T(ScalaJS.g["window"]["location"]["hash"]);
  var oldLocation = new ScalaJS.c.sr_ObjectRef().init___O(elem);
  this.com$repocad$web$Drawing$$listener$1 = new ScalaJS.c.sjsr_AnonFunction0().init___sjs_js_Function0((function(fn$1, oldLocation$1) {
    return (function() {
      var newLocation = ScalaJS.as.T(ScalaJS.g["window"]["location"]["hash"]);
      if ((!ScalaJS.anyRefEqEq(newLocation, ScalaJS.as.T(oldLocation$1.elem$1)))) {
        oldLocation$1.elem$1 = newLocation;
        ScalaJS.asUnit(fn$1.apply__O__O(ScalaJS.i.sjsr_RuntimeString$class__substring__sjsr_RuntimeString__I__T(newLocation, 1)));
        return (void 0)
      } else {
        return (void 0)
      }
    })
  })(fn, oldLocation))
});
ScalaJS.c.Lcom_repocad_web_Drawing$.prototype.get__T__s_util_Either = (function(name) {
  var x1 = ScalaJS.m.Lcom_repocad_web_Ajax().get__T__Lcom_repocad_web_Response(("http://repocad.com:20004/get/" + name));
  if ((x1 !== null)) {
    var p2 = x1.status$1;
    if ((404 === p2)) {
      ScalaJS.m.s_package().Right$1;
      var b = new ScalaJS.c.Lcom_repocad_web_Drawing().init___T__T(name, "");
      return new ScalaJS.c.s_util_Right().init___O(b)
    }
  };
  if ((x1 !== null)) {
    var response = x1.response$1;
    ScalaJS.m.s_package().Right$1;
    var b$1 = new ScalaJS.c.Lcom_repocad_web_Drawing().init___T__T(name, response);
    return new ScalaJS.c.s_util_Right().init___O(b$1)
  };
  throw new ScalaJS.c.s_MatchError().init___O(x1)
});
ScalaJS.c.Lcom_repocad_web_Drawing$.prototype.apply__Lcom_repocad_web_Drawing = (function() {
  var hash = ScalaJS.i.sjsr_RuntimeString$class__replace__sjsr_RuntimeString__jl_CharSequence__jl_CharSequence__T(ScalaJS.as.T(ScalaJS.g["window"]["location"]["hash"]), "#", "");
  var jsx$2 = ScalaJS.m.s_util_Either$MergeableEither();
  var this$1 = (ScalaJS.i.sjsr_RuntimeString$class__isEmpty__sjsr_RuntimeString__Z(hash) ? ScalaJS.m.Lcom_repocad_web_Drawing().get__T__s_util_Either("default") : ScalaJS.m.Lcom_repocad_web_Drawing().get__T__s_util_Either(hash));
  var this$2 = new ScalaJS.c.s_util_Either$LeftProjection().init___s_util_Either(this$1);
  var x1 = this$2.e$1;
  if (ScalaJS.is.s_util_Left(x1)) {
    var x2 = ScalaJS.as.s_util_Left(x1);
    var a = x2.a$2;
    var jsx$1 = new ScalaJS.c.s_util_Left().init___O((ScalaJS.as.T(a), new ScalaJS.c.Lcom_repocad_web_Drawing().init___T__T(ScalaJS.i.sjsr_RuntimeString$class__substring__sjsr_RuntimeString__I__T(ScalaJS.objectToString(ScalaJS.uD(ScalaJS.g["Math"]["random"]())), 7), "line 0 0 100 100")))
  } else if (ScalaJS.is.s_util_Right(x1)) {
    var x3 = ScalaJS.as.s_util_Right(x1);
    var b = x3.b$2;
    var jsx$1 = new ScalaJS.c.s_util_Right().init___O(b)
  } else {
    var jsx$1;
    throw new ScalaJS.c.s_MatchError().init___O(x1)
  };
  return ScalaJS.as.Lcom_repocad_web_Drawing(jsx$2.merge$extension__s_util_Either__O(jsx$1))
});
ScalaJS.is.Lcom_repocad_web_Drawing$ = (function(obj) {
  return (!(!((obj && obj.$classData) && obj.$classData.ancestors.Lcom_repocad_web_Drawing$)))
});
ScalaJS.as.Lcom_repocad_web_Drawing$ = (function(obj) {
  return ((ScalaJS.is.Lcom_repocad_web_Drawing$(obj) || (obj === null)) ? obj : ScalaJS.throwClassCastException(obj, "com.repocad.web.Drawing$"))
});
ScalaJS.isArrayOf.Lcom_repocad_web_Drawing$ = (function(obj, depth) {
  return (!(!(((obj && obj.$classData) && (obj.$classData.arrayDepth === depth)) && obj.$classData.arrayBase.ancestors.Lcom_repocad_web_Drawing$)))
});
ScalaJS.asArrayOf.Lcom_repocad_web_Drawing$ = (function(obj, depth) {
  return ((ScalaJS.isArrayOf.Lcom_repocad_web_Drawing$(obj, depth) || (obj === null)) ? obj : ScalaJS.throwArrayCastException(obj, "Lcom.repocad.web.Drawing$;", depth))
});
ScalaJS.d.Lcom_repocad_web_Drawing$ = new ScalaJS.ClassTypeData({
  Lcom_repocad_web_Drawing$: 0
}, false, "com.repocad.web.Drawing$", ScalaJS.d.O, {
  Lcom_repocad_web_Drawing$: 1,
  s_Serializable: 1,
  Ljava_io_Serializable: 1,
  O: 1
});
ScalaJS.c.Lcom_repocad_web_Drawing$.prototype.$classData = ScalaJS.d.Lcom_repocad_web_Drawing$;
ScalaJS.n.Lcom_repocad_web_Drawing = (void 0);
ScalaJS.m.Lcom_repocad_web_Drawing = (function() {
  if ((!ScalaJS.n.Lcom_repocad_web_Drawing)) {
    ScalaJS.n.Lcom_repocad_web_Drawing = new ScalaJS.c.Lcom_repocad_web_Drawing$().init___()
  };
  return ScalaJS.n.Lcom_repocad_web_Drawing
});
/** @constructor */
ScalaJS.c.Lcom_repocad_web_Paper$ = (function() {
  ScalaJS.c.O.call(this)
});
ScalaJS.c.Lcom_repocad_web_Paper$.prototype = new ScalaJS.h.O();
ScalaJS.c.Lcom_repocad_web_Paper$.prototype.constructor = ScalaJS.c.Lcom_repocad_web_Paper$;
/** @constructor */
ScalaJS.h.Lcom_repocad_web_Paper$ = (function() {
  /*<skip>*/
});
ScalaJS.h.Lcom_repocad_web_Paper$.prototype = ScalaJS.c.Lcom_repocad_web_Paper$.prototype;
ScalaJS.c.Lcom_repocad_web_Paper$.prototype.scaleAndRotation__Z = (function() {
  var this$1 = ScalaJS.m.Lcom_repocad_web_evaluating_Evaluator().minX$1;
  var xMin = ScalaJS.uD((this$1.isEmpty__Z() ? (-105.0) : this$1.get__O()));
  var this$2 = ScalaJS.m.Lcom_repocad_web_evaluating_Evaluator().maxX$1;
  var xMax = ScalaJS.uD((this$2.isEmpty__Z() ? 105.0 : this$2.get__O()));
  var this$3 = ScalaJS.m.Lcom_repocad_web_evaluating_Evaluator().minY$1;
  var yMin = ScalaJS.uD((this$3.isEmpty__Z() ? (-147.0) : this$3.get__O()));
  var this$4 = ScalaJS.m.Lcom_repocad_web_evaluating_Evaluator().maxY$1;
  var yMax = ScalaJS.uD((this$4.isEmpty__Z() ? 147.0 : this$4.get__O()));
  var landscape = false;
  var scale = ScalaJS.m.Lcom_repocad_web_package().paperScale$1;
  var bottomRight = new ScalaJS.c.Lcom_repocad_web_Vector2D().init___D__D(xMax, yMin);
  var topLeft = new ScalaJS.c.Lcom_repocad_web_Vector2D().init___D__D(xMin, yMax);
  var size = bottomRight.$$minus__Lcom_repocad_web_Vector2D__Lcom_repocad_web_Vector2D(topLeft).abs__Lcom_repocad_web_Vector2D();
  var this$5 = ScalaJS.m.Lcom_repocad_web_package().paperSize$1;
  var shortSide = ScalaJS.uD(ScalaJS.i.sc_LinearSeqOptimized$class__apply__sc_LinearSeqOptimized__I__O(this$5, 0));
  var this$6 = ScalaJS.m.Lcom_repocad_web_package().paperSize$1;
  var longSide = ScalaJS.uD(ScalaJS.i.sc_LinearSeqOptimized$class__apply__sc_LinearSeqOptimized__I__O(this$6, 1));
  ScalaJS.m.Lcom_repocad_web_package().drawingCenter$1;
  scale = 1.0;
  ScalaJS.m.sci_List();
  var xs = new ScalaJS.c.sjs_js_WrappedArray().init___sjs_js_Array([2.0, 2.5, 2.0]);
  var this$8 = ScalaJS.m.sci_List();
  var cbf = this$8.ReusableCBFInstance$2;
  var list = ScalaJS.as.sci_List(ScalaJS.i.sc_TraversableLike$class__to__sc_TraversableLike__scg_CanBuildFrom__O(xs, cbf));
  var take = 0;
  while (true) {
    var jsx$2 = shortSide;
    var x = size.x$1;
    var y = size.y$1;
    if ((jsx$2 < ((x < y) ? x : y))) {
      var jsx$1 = true
    } else {
      var jsx$3 = longSide;
      var x$1 = size.x$1;
      var y$1 = size.y$1;
      var jsx$1 = (jsx$3 < ((x$1 > y$1) ? x$1 : y$1))
    };
    if (jsx$1) {
      var n = take;
      var factor = ScalaJS.uD(ScalaJS.i.sc_LinearSeqOptimized$class__apply__sc_LinearSeqOptimized__I__O(list, n));
      shortSide = (shortSide * factor);
      longSide = (longSide * factor);
      take = ((take < 2) ? ((take + 1) | 0) : 0);
      scale = (scale * factor);
      ScalaJS.m.Lcom_repocad_web_package().paperScale$1 = scale
    } else {
      break
    }
  };
  if ((size.x$1 >= size.y$1)) {
    landscape = true
  };
  return landscape
});
ScalaJS.is.Lcom_repocad_web_Paper$ = (function(obj) {
  return (!(!((obj && obj.$classData) && obj.$classData.ancestors.Lcom_repocad_web_Paper$)))
});
ScalaJS.as.Lcom_repocad_web_Paper$ = (function(obj) {
  return ((ScalaJS.is.Lcom_repocad_web_Paper$(obj) || (obj === null)) ? obj : ScalaJS.throwClassCastException(obj, "com.repocad.web.Paper$"))
});
ScalaJS.isArrayOf.Lcom_repocad_web_Paper$ = (function(obj, depth) {
  return (!(!(((obj && obj.$classData) && (obj.$classData.arrayDepth === depth)) && obj.$classData.arrayBase.ancestors.Lcom_repocad_web_Paper$)))
});
ScalaJS.asArrayOf.Lcom_repocad_web_Paper$ = (function(obj, depth) {
  return ((ScalaJS.isArrayOf.Lcom_repocad_web_Paper$(obj, depth) || (obj === null)) ? obj : ScalaJS.throwArrayCastException(obj, "Lcom.repocad.web.Paper$;", depth))
});
ScalaJS.d.Lcom_repocad_web_Paper$ = new ScalaJS.ClassTypeData({
  Lcom_repocad_web_Paper$: 0
}, false, "com.repocad.web.Paper$", ScalaJS.d.O, {
  Lcom_repocad_web_Paper$: 1,
  O: 1
});
ScalaJS.c.Lcom_repocad_web_Paper$.prototype.$classData = ScalaJS.d.Lcom_repocad_web_Paper$;
ScalaJS.n.Lcom_repocad_web_Paper = (void 0);
ScalaJS.m.Lcom_repocad_web_Paper = (function() {
  if ((!ScalaJS.n.Lcom_repocad_web_Paper)) {
    ScalaJS.n.Lcom_repocad_web_Paper = new ScalaJS.c.Lcom_repocad_web_Paper$().init___()
  };
  return ScalaJS.n.Lcom_repocad_web_Paper
});
/** @constructor */
ScalaJS.c.Lcom_repocad_web_PdfPrinter = (function() {
  ScalaJS.c.O.call(this);
  this.landscape$1 = false;
  this.orientation$1 = null;
  this.document$1 = null;
  this.offsetX$1 = 0.0;
  this.offsetY$1 = 0.0;
  this.scaledCenter$1 = null
});
ScalaJS.c.Lcom_repocad_web_PdfPrinter.prototype = new ScalaJS.h.O();
ScalaJS.c.Lcom_repocad_web_PdfPrinter.prototype.constructor = ScalaJS.c.Lcom_repocad_web_PdfPrinter;
/** @constructor */
ScalaJS.h.Lcom_repocad_web_PdfPrinter = (function() {
  /*<skip>*/
});
ScalaJS.h.Lcom_repocad_web_PdfPrinter.prototype = ScalaJS.c.Lcom_repocad_web_PdfPrinter.prototype;
ScalaJS.c.Lcom_repocad_web_PdfPrinter.prototype.line__D__D__D__D__V = (function(x1, y1, x2, y2) {
  var v1 = this.com$repocad$web$PdfPrinter$$transform__Lcom_repocad_web_Vector2D__Lcom_repocad_web_Vector2D(new ScalaJS.c.Lcom_repocad_web_Vector2D().init___D__D((x1 / ScalaJS.m.Lcom_repocad_web_package().paperScale$1), (y1 / ScalaJS.m.Lcom_repocad_web_package().paperScale$1)));
  var v2 = this.com$repocad$web$PdfPrinter$$transform__Lcom_repocad_web_Vector2D__Lcom_repocad_web_Vector2D(new ScalaJS.c.Lcom_repocad_web_Vector2D().init___D__D((x2 / ScalaJS.m.Lcom_repocad_web_package().paperScale$1), (y2 / ScalaJS.m.Lcom_repocad_web_package().paperScale$1)));
  this.document$1["setLineWidth"](0.02);
  this.document$1["line"](v1.x$1, v1.y$1, v2.x$1, v2.y$1)
});
ScalaJS.c.Lcom_repocad_web_PdfPrinter.prototype.circle__D__D__D__V = (function(x, y, r) {
  var v = this.com$repocad$web$PdfPrinter$$transform__Lcom_repocad_web_Vector2D__Lcom_repocad_web_Vector2D(new ScalaJS.c.Lcom_repocad_web_Vector2D().init___D__D(x, y));
  this.document$1["circle"](v.x$1, v.y$1, r)
});
ScalaJS.c.Lcom_repocad_web_PdfPrinter.prototype.com$repocad$web$PdfPrinter$$transform__Lcom_repocad_web_Vector2D__Lcom_repocad_web_Vector2D = (function(v) {
  if ((!this.landscape$1)) {
    var jsx$2 = new ScalaJS.c.Lcom_repocad_web_Vector2D().init___D__D(v.x$1, (-v.y$1)).$$minus__Lcom_repocad_web_Vector2D__Lcom_repocad_web_Vector2D(this.scaledCenter$1);
    var this$1 = ScalaJS.m.Lcom_repocad_web_package().paperSize$1;
    var jsx$1 = ScalaJS.i.sc_LinearSeqOptimized$class__apply__sc_LinearSeqOptimized__I__O(this$1, 0);
    var this$2 = ScalaJS.m.Lcom_repocad_web_package().paperSize$1;
    var a = jsx$2.$$plus__Lcom_repocad_web_Vector2D__Lcom_repocad_web_Vector2D(new ScalaJS.c.Lcom_repocad_web_Vector2D().init___D__D((ScalaJS.uD(jsx$1) / 2), (ScalaJS.uD(ScalaJS.i.sc_LinearSeqOptimized$class__apply__sc_LinearSeqOptimized__I__O(this$2, 1)) / 2)));
    return a
  } else {
    var jsx$4 = new ScalaJS.c.Lcom_repocad_web_Vector2D().init___D__D(v.x$1, (-v.y$1)).$$minus__Lcom_repocad_web_Vector2D__Lcom_repocad_web_Vector2D(this.scaledCenter$1);
    var this$3 = ScalaJS.m.Lcom_repocad_web_package().paperSize$1;
    var jsx$3 = ScalaJS.i.sc_LinearSeqOptimized$class__apply__sc_LinearSeqOptimized__I__O(this$3, 1);
    var this$4 = ScalaJS.m.Lcom_repocad_web_package().paperSize$1;
    var b = jsx$4.$$plus__Lcom_repocad_web_Vector2D__Lcom_repocad_web_Vector2D(new ScalaJS.c.Lcom_repocad_web_Vector2D().init___D__D((ScalaJS.uD(jsx$3) / 2), (ScalaJS.uD(ScalaJS.i.sc_LinearSeqOptimized$class__apply__sc_LinearSeqOptimized__I__O(this$4, 0)) / 2)));
    return b
  }
});
ScalaJS.c.Lcom_repocad_web_PdfPrinter.prototype.arc__D__D__D__D__D__V = (function(x, y, r, sAngle, eAngle) {
  var this$1 = ScalaJS.m.Lcom_repocad_web_SplineToArc2D();
  var splines = this$1.createArc$1__p1__D__D__D__D__D__D__sci_List(r, sAngle, eAngle, x, y, r);
  var these = splines;
  while ((!these.isEmpty__Z())) {
    var spline$2 = these.head__O();
    var spline = ScalaJS.as.sci_List(spline$2);
    var x1 = ScalaJS.uD(ScalaJS.i.sc_LinearSeqOptimized$class__apply__sc_LinearSeqOptimized__I__O(spline, 0));
    var y1 = ScalaJS.uD(ScalaJS.i.sc_LinearSeqOptimized$class__apply__sc_LinearSeqOptimized__I__O(spline, 1));
    var x2 = ScalaJS.uD(ScalaJS.i.sc_LinearSeqOptimized$class__apply__sc_LinearSeqOptimized__I__O(spline, 2));
    var y2 = ScalaJS.uD(ScalaJS.i.sc_LinearSeqOptimized$class__apply__sc_LinearSeqOptimized__I__O(spline, 3));
    var x3 = ScalaJS.uD(ScalaJS.i.sc_LinearSeqOptimized$class__apply__sc_LinearSeqOptimized__I__O(spline, 4));
    var y3 = ScalaJS.uD(ScalaJS.i.sc_LinearSeqOptimized$class__apply__sc_LinearSeqOptimized__I__O(spline, 5));
    var x4 = ScalaJS.uD(ScalaJS.i.sc_LinearSeqOptimized$class__apply__sc_LinearSeqOptimized__I__O(spline, 6));
    var y4 = ScalaJS.uD(ScalaJS.i.sc_LinearSeqOptimized$class__apply__sc_LinearSeqOptimized__I__O(spline, 7));
    var v1 = this.com$repocad$web$PdfPrinter$$transform__Lcom_repocad_web_Vector2D__Lcom_repocad_web_Vector2D(new ScalaJS.c.Lcom_repocad_web_Vector2D().init___D__D((x1 / ScalaJS.m.Lcom_repocad_web_package().paperScale$1), (y1 / ScalaJS.m.Lcom_repocad_web_package().paperScale$1)));
    var v2 = this.com$repocad$web$PdfPrinter$$transform__Lcom_repocad_web_Vector2D__Lcom_repocad_web_Vector2D(new ScalaJS.c.Lcom_repocad_web_Vector2D().init___D__D((x2 / ScalaJS.m.Lcom_repocad_web_package().paperScale$1), (y2 / ScalaJS.m.Lcom_repocad_web_package().paperScale$1)));
    var v3 = this.com$repocad$web$PdfPrinter$$transform__Lcom_repocad_web_Vector2D__Lcom_repocad_web_Vector2D(new ScalaJS.c.Lcom_repocad_web_Vector2D().init___D__D((x3 / ScalaJS.m.Lcom_repocad_web_package().paperScale$1), (y3 / ScalaJS.m.Lcom_repocad_web_package().paperScale$1)));
    var v4 = this.com$repocad$web$PdfPrinter$$transform__Lcom_repocad_web_Vector2D__Lcom_repocad_web_Vector2D(new ScalaJS.c.Lcom_repocad_web_Vector2D().init___D__D((x4 / ScalaJS.m.Lcom_repocad_web_package().paperScale$1), (y4 / ScalaJS.m.Lcom_repocad_web_package().paperScale$1)));
    var xS = v1.x$1;
    var yS = v1.y$1;
    var aX = (v2.x$1 - xS);
    var aY = (v2.y$1 - yS);
    var bX = (v3.x$1 - xS);
    var bY = (v3.y$1 - yS);
    var cX = (v4.x$1 - xS);
    var cY = (v4.y$1 - yS);
    var arr = ScalaJS.m.s_Array().apply__D__sc_Seq__AD(aX, new ScalaJS.c.sjs_js_WrappedArray().init___sjs_js_Array([aY, bX, bY, cX, cY]));
    var $$this = ScalaJS.m.s_Predef().genericArrayOps__O__scm_ArrayOps(arr);
    var result = [];
    var i = 0;
    var len = $$this.length__I();
    while ((i < len)) {
      var x$2 = $$this.apply__I__O(i);
      ScalaJS.uI(result["push"](x$2));
      i = ((i + 1) | 0)
    };
    var arr$1 = ScalaJS.m.s_Array().apply__I__sc_Seq__AI(1, new ScalaJS.c.sjs_js_WrappedArray().init___sjs_js_Array([1]));
    var $$this$1 = ScalaJS.m.s_Predef().genericArrayOps__O__scm_ArrayOps(arr$1);
    var result$1 = [];
    var i$1 = 0;
    var len$1 = $$this$1.length__I();
    while ((i$1 < len$1)) {
      var x$2$1 = $$this$1.apply__I__O(i$1);
      ScalaJS.uI(result$1["push"](x$2$1));
      i$1 = ((i$1 + 1) | 0)
    };
    var arr$2 = ScalaJS.m.s_Array().apply__sc_Seq__s_reflect_ClassTag__O(new ScalaJS.c.sjs_js_WrappedArray().init___sjs_js_Array([result]), ScalaJS.m.s_reflect_ClassTag().apply__jl_Class__s_reflect_ClassTag(ScalaJS.d.sjs_js_Array.getClassOf()));
    var $$this$2 = ScalaJS.m.s_Predef().genericArrayOps__O__scm_ArrayOps(arr$2);
    var result$2 = [];
    var i$2 = 0;
    var len$2 = $$this$2.length__I();
    while ((i$2 < len$2)) {
      var x$2$2 = $$this$2.apply__I__O(i$2);
      ScalaJS.uI(result$2["push"](x$2$2));
      i$2 = ((i$2 + 1) | 0)
    };
    this.document$1["lines"](result$2, v1.x$1, v1.y$1, result$1);
    these = ScalaJS.as.sci_List(these.tail__O())
  }
});
ScalaJS.c.Lcom_repocad_web_PdfPrinter.prototype.text__D__D__D__O__V = (function(x, y, h, t) {
  var v = this.com$repocad$web$PdfPrinter$$transform__Lcom_repocad_web_Vector2D__Lcom_repocad_web_Vector2D(new ScalaJS.c.Lcom_repocad_web_Vector2D().init___D__D(x, y));
  this.document$1["setFontSize"]((h * 1.8));
  this.document$1["text"]((v.x$1 / ScalaJS.m.Lcom_repocad_web_package().paperScale$1), (v.y$1 / ScalaJS.m.Lcom_repocad_web_package().paperScale$1), ScalaJS.objectToString(t))
});
ScalaJS.c.Lcom_repocad_web_PdfPrinter.prototype.save__T__V = (function(name) {
  this.document$1["save"](name)
});
ScalaJS.c.Lcom_repocad_web_PdfPrinter.prototype.bezierCurve__D__D__D__D__D__D__D__D__V = (function(x1, y1, x2, y2, x3, y3, x4, y4) {
  var v1 = this.com$repocad$web$PdfPrinter$$transform__Lcom_repocad_web_Vector2D__Lcom_repocad_web_Vector2D(new ScalaJS.c.Lcom_repocad_web_Vector2D().init___D__D((x1 / ScalaJS.m.Lcom_repocad_web_package().paperScale$1), (y1 / ScalaJS.m.Lcom_repocad_web_package().paperScale$1)));
  var v2 = this.com$repocad$web$PdfPrinter$$transform__Lcom_repocad_web_Vector2D__Lcom_repocad_web_Vector2D(new ScalaJS.c.Lcom_repocad_web_Vector2D().init___D__D((x2 / ScalaJS.m.Lcom_repocad_web_package().paperScale$1), (y2 / ScalaJS.m.Lcom_repocad_web_package().paperScale$1)));
  var v3 = this.com$repocad$web$PdfPrinter$$transform__Lcom_repocad_web_Vector2D__Lcom_repocad_web_Vector2D(new ScalaJS.c.Lcom_repocad_web_Vector2D().init___D__D((x3 / ScalaJS.m.Lcom_repocad_web_package().paperScale$1), (y3 / ScalaJS.m.Lcom_repocad_web_package().paperScale$1)));
  var v4 = this.com$repocad$web$PdfPrinter$$transform__Lcom_repocad_web_Vector2D__Lcom_repocad_web_Vector2D(new ScalaJS.c.Lcom_repocad_web_Vector2D().init___D__D((x4 / ScalaJS.m.Lcom_repocad_web_package().paperScale$1), (y4 / ScalaJS.m.Lcom_repocad_web_package().paperScale$1)));
  var x = v1.x$1;
  var y = v1.y$1;
  var arr = ScalaJS.m.s_Array().apply__D__sc_Seq__AD((v2.x$1 - x), new ScalaJS.c.sjs_js_WrappedArray().init___sjs_js_Array([(v2.y$1 - y), (v3.x$1 - x), (v3.y$1 - y), (v4.x$1 - x), (v4.y$1 - y)]));
  var $$this = ScalaJS.m.s_Predef().genericArrayOps__O__scm_ArrayOps(arr);
  var result = [];
  var i = 0;
  var len = $$this.length__I();
  while ((i < len)) {
    var x$2 = $$this.apply__I__O(i);
    ScalaJS.uI(result["push"](x$2));
    i = ((i + 1) | 0)
  };
  var arr$1 = ScalaJS.m.s_Array().apply__I__sc_Seq__AI(1, new ScalaJS.c.sjs_js_WrappedArray().init___sjs_js_Array([1]));
  var $$this$1 = ScalaJS.m.s_Predef().genericArrayOps__O__scm_ArrayOps(arr$1);
  var result$1 = [];
  var i$1 = 0;
  var len$1 = $$this$1.length__I();
  while ((i$1 < len$1)) {
    var x$2$1 = $$this$1.apply__I__O(i$1);
    ScalaJS.uI(result$1["push"](x$2$1));
    i$1 = ((i$1 + 1) | 0)
  };
  var arr$2 = ScalaJS.m.s_Array().apply__sc_Seq__s_reflect_ClassTag__O(new ScalaJS.c.sjs_js_WrappedArray().init___sjs_js_Array([result]), ScalaJS.m.s_reflect_ClassTag().apply__jl_Class__s_reflect_ClassTag(ScalaJS.d.sjs_js_Array.getClassOf()));
  var $$this$2 = ScalaJS.m.s_Predef().genericArrayOps__O__scm_ArrayOps(arr$2);
  var result$2 = [];
  var i$2 = 0;
  var len$2 = $$this$2.length__I();
  while ((i$2 < len$2)) {
    var x$2$2 = $$this$2.apply__I__O(i$2);
    ScalaJS.uI(result$2["push"](x$2$2));
    i$2 = ((i$2 + 1) | 0)
  };
  this.document$1["lines"](result$2, v1.x$1, v1.y$1, result$1)
});
ScalaJS.c.Lcom_repocad_web_PdfPrinter.prototype.init___Z = (function(landscape) {
  this.landscape$1 = landscape;
  this.orientation$1 = "landscape";
  if ((!landscape)) {
    this.orientation$1 = "portrait"
  };
  this.document$1 = ScalaJS.g["jsPDF"](this.orientation$1.toString());
  this.offsetX$1 = ScalaJS.m.Lcom_repocad_web_package().drawingCenter$1.x$1;
  this.offsetY$1 = ScalaJS.m.Lcom_repocad_web_package().drawingCenter$1.y$1;
  this.scaledCenter$1 = new ScalaJS.c.Lcom_repocad_web_Vector2D().init___D__D((ScalaJS.m.Lcom_repocad_web_package().drawingCenter$1.x$1 / ScalaJS.m.Lcom_repocad_web_package().paperScale$1), ((-ScalaJS.m.Lcom_repocad_web_package().drawingCenter$1.y$1) / ScalaJS.m.Lcom_repocad_web_package().paperScale$1));
  return this
});
ScalaJS.is.Lcom_repocad_web_PdfPrinter = (function(obj) {
  return (!(!((obj && obj.$classData) && obj.$classData.ancestors.Lcom_repocad_web_PdfPrinter)))
});
ScalaJS.as.Lcom_repocad_web_PdfPrinter = (function(obj) {
  return ((ScalaJS.is.Lcom_repocad_web_PdfPrinter(obj) || (obj === null)) ? obj : ScalaJS.throwClassCastException(obj, "com.repocad.web.PdfPrinter"))
});
ScalaJS.isArrayOf.Lcom_repocad_web_PdfPrinter = (function(obj, depth) {
  return (!(!(((obj && obj.$classData) && (obj.$classData.arrayDepth === depth)) && obj.$classData.arrayBase.ancestors.Lcom_repocad_web_PdfPrinter)))
});
ScalaJS.asArrayOf.Lcom_repocad_web_PdfPrinter = (function(obj, depth) {
  return ((ScalaJS.isArrayOf.Lcom_repocad_web_PdfPrinter(obj, depth) || (obj === null)) ? obj : ScalaJS.throwArrayCastException(obj, "Lcom.repocad.web.PdfPrinter;", depth))
});
ScalaJS.d.Lcom_repocad_web_PdfPrinter = new ScalaJS.ClassTypeData({
  Lcom_repocad_web_PdfPrinter: 0
}, false, "com.repocad.web.PdfPrinter", ScalaJS.d.O, {
  Lcom_repocad_web_PdfPrinter: 1,
  Lcom_repocad_web_Printer: 1,
  O: 1
});
ScalaJS.c.Lcom_repocad_web_PdfPrinter.prototype.$classData = ScalaJS.d.Lcom_repocad_web_PdfPrinter;
/** @constructor */
ScalaJS.c.Lcom_repocad_web_Repocad = (function() {
  ScalaJS.c.O.call(this);
  this.com$repocad$web$Repocad$$input$f = null;
  this.debug$1 = null;
  this.view$1 = null;
  this.drawing$1 = null;
  this.mousePosition$1 = null;
  this.mouseDown$1 = false;
  this.lastAst$1 = null;
  this.lastValue$1 = null;
  this.landscape$1 = false;
  this.center$1 = null;
  this.mouseExit$1 = null
});
ScalaJS.c.Lcom_repocad_web_Repocad.prototype = new ScalaJS.h.O();
ScalaJS.c.Lcom_repocad_web_Repocad.prototype.constructor = ScalaJS.c.Lcom_repocad_web_Repocad;
/** @constructor */
ScalaJS.h.Lcom_repocad_web_Repocad = (function() {
  /*<skip>*/
});
ScalaJS.h.Lcom_repocad_web_Repocad.prototype = ScalaJS.c.Lcom_repocad_web_Repocad.prototype;
ScalaJS.c.Lcom_repocad_web_Repocad.prototype.init__V = (function() {
  this.run__V();
  this.eval__Lcom_repocad_web_parsing_Expr__V(this.lastAst$1);
  this.view$1.init__V();
  var listener = new ScalaJS.c.Lcom_repocad_web_Repocad$$anonfun$5().init___Lcom_repocad_web_Repocad(this);
  this.loadDrawing__Lcom_repocad_web_Drawing__V(this.drawing$1);
  ScalaJS.m.Lcom_repocad_web_Drawing().setHashListener__F1__V(listener)
});
ScalaJS.c.Lcom_repocad_web_Repocad.prototype.init___Lorg_scalajs_dom_HTMLCanvasElement__Lorg_scalajs_dom_HTMLTextAreaElement__Lorg_scalajs_dom_HTMLDivElement = (function(canvas, input, debug) {
  this.com$repocad$web$Repocad$$input$f = input;
  this.debug$1 = debug;
  this.view$1 = new ScalaJS.c.Lcom_repocad_web_CanvasView().init___Lorg_scalajs_dom_HTMLCanvasElement(canvas);
  this.drawing$1 = ScalaJS.m.Lcom_repocad_web_Drawing().apply__Lcom_repocad_web_Drawing();
  this.mousePosition$1 = new ScalaJS.c.Lcom_repocad_web_Vector2D().init___D__D(0.0, 0.0);
  this.mouseDown$1 = false;
  this.lastAst$1 = ScalaJS.m.Lcom_repocad_web_parsing_UnitExpr();
  this.lastValue$1 = "";
  this.landscape$1 = this.view$1.landscape$1;
  this.center$1 = this.view$1.windowCenter__Lcom_repocad_web_Vector2D();
  this.mouseExit$1 = new ScalaJS.c.sjsr_AnonFunction1().init___sjs_js_Function1((function(arg$outer) {
    return (function(e$2) {
      arg$outer.mouseDown$1 = false
    })
  })(this));
  input["onkeyup"] = (function(arg$outer$1) {
    return (function(e$2$1) {
      if ((!ScalaJS.anyRefEqEq(arg$outer$1.drawing$1.content$1, ScalaJS.as.T(arg$outer$1.com$repocad$web$Repocad$$input$f["value"])))) {
        var qual$1 = arg$outer$1.drawing$1;
        var x$1 = ScalaJS.as.T(arg$outer$1.com$repocad$web$Repocad$$input$f["value"]);
        var x$2 = qual$1.name$1;
        arg$outer$1.drawing$1 = new ScalaJS.c.Lcom_repocad_web_Drawing().init___T__T(x$2, x$1);
        arg$outer$1.run__V()
      }
    })
  })(this);
  canvas["onmousedown"] = (function(arg$outer$2) {
    return (function(e$2$2) {
      var e$3 = e$2$2;
      arg$outer$2.mouseDown$1 = true;
      arg$outer$2.mousePosition$1 = new ScalaJS.c.Lcom_repocad_web_Vector2D().init___D__D(ScalaJS.uI(e$3["clientX"]), ScalaJS.uI(e$3["clientY"]))
    })
  })(this);
  canvas["onmousemove"] = (function(arg$outer$3) {
    return (function(e$2$3) {
      var e$4 = e$2$3;
      if (arg$outer$3.mouseDown$1) {
        var newPosition = new ScalaJS.c.Lcom_repocad_web_Vector2D().init___D__D(ScalaJS.uI(e$4["clientX"]), ScalaJS.uI(e$4["clientY"]));
        arg$outer$3.view$1.translate__D__D__V(newPosition.$$minus__Lcom_repocad_web_Vector2D__Lcom_repocad_web_Vector2D(arg$outer$3.mousePosition$1).x$1, newPosition.$$minus__Lcom_repocad_web_Vector2D__Lcom_repocad_web_Vector2D(arg$outer$3.mousePosition$1).y$1);
        arg$outer$3.mousePosition$1 = newPosition;
        arg$outer$3.eval__Lcom_repocad_web_parsing_Expr__V(arg$outer$3.lastAst$1)
      }
    })
  })(this);
  canvas["onmouseleave"] = (function(f) {
    return (function(arg1) {
      return f.apply__O__O(arg1)
    })
  })(this.mouseExit$1);
  canvas["onmouseup"] = (function(f$1) {
    return (function(arg1$1) {
      return f$1.apply__O__O(arg1$1)
    })
  })(this.mouseExit$1);
  return this
});
ScalaJS.c.Lcom_repocad_web_Repocad.prototype.run__V = (function() {
  var tokens = ScalaJS.m.Lcom_repocad_web_lexing_Lexer().lex__T__Lcom_repocad_web_lexing_LiveStream(this.drawing$1.content$1);
  var this$1 = ScalaJS.m.Lcom_repocad_web_parsing_Parser().parse__Lcom_repocad_web_lexing_LiveStream__s_util_Either(tokens);
  if (ScalaJS.is.s_util_Left(this$1)) {
    var x2 = ScalaJS.as.s_util_Left(this$1);
    var a = x2.a$2;
    var left = ScalaJS.as.T(a);
    this.displayError__T__V(("Error while compiling code: " + left))
  } else if (ScalaJS.is.s_util_Right(this$1)) {
    var x3 = ScalaJS.as.s_util_Right(this$1);
    var b = x3.b$2;
    var right = ScalaJS.as.Lcom_repocad_web_parsing_Expr(b);
    this.eval__Lcom_repocad_web_parsing_Expr__V(right)
  } else {
    throw new ScalaJS.c.s_MatchError().init___O(this$1)
  }
});
ScalaJS.c.Lcom_repocad_web_Repocad.prototype.zoom__D__Lorg_scalajs_dom_MouseEvent__V = (function(level, e) {
  this.view$1.zoom__D__D__D__V(level, ScalaJS.uI(e["clientX"]), ScalaJS.uI(e["clientY"]));
  this.eval__Lcom_repocad_web_parsing_Expr__V(this.lastAst$1)
});
ScalaJS.c.Lcom_repocad_web_Repocad.prototype.$$js$exported$meth$init__O = (function() {
  return (this.init__V(), (void 0))
});
ScalaJS.c.Lcom_repocad_web_Repocad.prototype.$$js$exported$meth$zoom__D__Lorg_scalajs_dom_MouseEvent__O = (function(level, e) {
  return (this.zoom__D__Lorg_scalajs_dom_MouseEvent__V(level, e), (void 0))
});
ScalaJS.c.Lcom_repocad_web_Repocad.prototype.save__V = (function() {
  var this$1 = this.drawing$1.save__Lcom_repocad_web_Response();
  this.displaySuccess__T__V(ScalaJS.m.sr_ScalaRunTime().$$undtoString__s_Product__T(this$1))
});
ScalaJS.c.Lcom_repocad_web_Repocad.prototype.eval__Lcom_repocad_web_parsing_Expr__V = (function(expr) {
  this.lastAst$1 = expr;
  this.view$1.clear__V();
  ScalaJS.m.Lcom_repocad_web_evaluating_Evaluator().resetBoundingBox__V();
  var this$1 = ScalaJS.m.Lcom_repocad_web_evaluating_Evaluator().eval__Lcom_repocad_web_parsing_Expr__sci_Map__Lcom_repocad_web_Printer__s_util_Either(expr, ScalaJS.as.sci_Map(ScalaJS.m.s_Predef().Map$2.apply__sc_Seq__sc_GenMap(ScalaJS.m.sci_Nil())), this.view$1);
  if (ScalaJS.is.s_util_Left(this$1)) {
    var x2 = ScalaJS.as.s_util_Left(this$1);
    var a = x2.a$2;
    var error = ScalaJS.as.T(a);
    this.displayError__T__V(new ScalaJS.c.s_StringContext().init___sc_Seq(new ScalaJS.c.sjs_js_WrappedArray().init___sjs_js_Array(["Failure during evaluation: ", ""])).s__sc_Seq__T(new ScalaJS.c.sjs_js_WrappedArray().init___sjs_js_Array([error])))
  } else if (ScalaJS.is.s_util_Right(this$1)) {
    var x3 = ScalaJS.as.s_util_Right(this$1);
    var b = x3.b$2;
    ScalaJS.as.T2(b);
    this.displaySuccess__T__V("")
  } else {
    throw new ScalaJS.c.s_MatchError().init___O(this$1)
  }
});
ScalaJS.c.Lcom_repocad_web_Repocad.prototype.$$js$exported$meth$printPdf__T__O = (function(name) {
  return (this.printPdf__T__V(name), (void 0))
});
ScalaJS.c.Lcom_repocad_web_Repocad.prototype.loadDrawing__Lcom_repocad_web_Drawing__V = (function(drawing) {
  this.drawing$1 = drawing;
  this.com$repocad$web$Repocad$$input$f["value"] = drawing.content$1;
  ScalaJS.g["window"]["location"]["hash"] = drawing.name$1;
  this.run__V()
});
ScalaJS.c.Lcom_repocad_web_Repocad.prototype.printPdf__T__V = (function(name) {
  var printer = new ScalaJS.c.Lcom_repocad_web_PdfPrinter().init___Z(this.landscape$1);
  ScalaJS.m.Lcom_repocad_web_evaluating_Evaluator().eval__Lcom_repocad_web_parsing_Expr__sci_Map__Lcom_repocad_web_Printer__s_util_Either(this.lastAst$1, ScalaJS.as.sci_Map(ScalaJS.m.s_Predef().Map$2.apply__sc_Seq__sc_GenMap(ScalaJS.m.sci_Nil())), printer);
  printer.save__T__V(name)
});
ScalaJS.c.Lcom_repocad_web_Repocad.prototype.displayError__T__V = (function(error) {
  this.debug$1["innerHTML"] = error
});
ScalaJS.c.Lcom_repocad_web_Repocad.prototype.$$js$exported$meth$save__O = (function() {
  return (this.save__V(), (void 0))
});
ScalaJS.c.Lcom_repocad_web_Repocad.prototype.displaySuccess__T__V = (function(success) {
  this.debug$1["innerHTML"] = success
});
ScalaJS.c.Lcom_repocad_web_Repocad.prototype.$$js$exported$meth$run__O = (function() {
  return (this.run__V(), (void 0))
});
ScalaJS.c.Lcom_repocad_web_Repocad.prototype["zoom"] = (function(arg$1, arg$2) {
  if ((arg$1 === null)) {
    throw "Found null, expected Double"
  } else {
    arg$1 = ScalaJS.uD(arg$1)
  };
  arg$2 = arg$2;
  return this.$$js$exported$meth$zoom__D__Lorg_scalajs_dom_MouseEvent__O(arg$1, arg$2)
});
ScalaJS.c.Lcom_repocad_web_Repocad.prototype["init"] = (function() {
  return this.$$js$exported$meth$init__O()
});
ScalaJS.c.Lcom_repocad_web_Repocad.prototype["run"] = (function() {
  return this.$$js$exported$meth$run__O()
});
ScalaJS.c.Lcom_repocad_web_Repocad.prototype["save"] = (function() {
  return this.$$js$exported$meth$save__O()
});
ScalaJS.c.Lcom_repocad_web_Repocad.prototype["printPdf"] = (function(arg$1) {
  arg$1 = ScalaJS.as.T(arg$1);
  return this.$$js$exported$meth$printPdf__T__O(arg$1)
});
ScalaJS.is.Lcom_repocad_web_Repocad = (function(obj) {
  return (!(!((obj && obj.$classData) && obj.$classData.ancestors.Lcom_repocad_web_Repocad)))
});
ScalaJS.as.Lcom_repocad_web_Repocad = (function(obj) {
  return ((ScalaJS.is.Lcom_repocad_web_Repocad(obj) || (obj === null)) ? obj : ScalaJS.throwClassCastException(obj, "com.repocad.web.Repocad"))
});
ScalaJS.isArrayOf.Lcom_repocad_web_Repocad = (function(obj, depth) {
  return (!(!(((obj && obj.$classData) && (obj.$classData.arrayDepth === depth)) && obj.$classData.arrayBase.ancestors.Lcom_repocad_web_Repocad)))
});
ScalaJS.asArrayOf.Lcom_repocad_web_Repocad = (function(obj, depth) {
  return ((ScalaJS.isArrayOf.Lcom_repocad_web_Repocad(obj, depth) || (obj === null)) ? obj : ScalaJS.throwArrayCastException(obj, "Lcom.repocad.web.Repocad;", depth))
});
ScalaJS.d.Lcom_repocad_web_Repocad = new ScalaJS.ClassTypeData({
  Lcom_repocad_web_Repocad: 0
}, false, "com.repocad.web.Repocad", ScalaJS.d.O, {
  Lcom_repocad_web_Repocad: 1,
  O: 1
});
ScalaJS.c.Lcom_repocad_web_Repocad.prototype.$classData = ScalaJS.d.Lcom_repocad_web_Repocad;
/** @constructor */
ScalaJS.e["Repocad"] = (function(arg$1, arg$2, arg$3) {
  ScalaJS.c.Lcom_repocad_web_Repocad.call(this);
  arg$1 = arg$1;
  arg$2 = arg$2;
  arg$3 = arg$3;
  this.init___Lorg_scalajs_dom_HTMLCanvasElement__Lorg_scalajs_dom_HTMLTextAreaElement__Lorg_scalajs_dom_HTMLDivElement(arg$1, arg$2, arg$3)
});
ScalaJS.e["Repocad"].prototype = ScalaJS.c.Lcom_repocad_web_Repocad.prototype;
/** @constructor */
ScalaJS.c.Lcom_repocad_web_Response = (function() {
  ScalaJS.c.O.call(this);
  this.status$1 = 0;
  this.state$1 = 0;
  this.response$1 = null
});
ScalaJS.c.Lcom_repocad_web_Response.prototype = new ScalaJS.h.O();
ScalaJS.c.Lcom_repocad_web_Response.prototype.constructor = ScalaJS.c.Lcom_repocad_web_Response;
/** @constructor */
ScalaJS.h.Lcom_repocad_web_Response = (function() {
  /*<skip>*/
});
ScalaJS.h.Lcom_repocad_web_Response.prototype = ScalaJS.c.Lcom_repocad_web_Response.prototype;
ScalaJS.c.Lcom_repocad_web_Response.prototype.productPrefix__T = (function() {
  return "Response"
});
ScalaJS.c.Lcom_repocad_web_Response.prototype.productArity__I = (function() {
  return 3
});
ScalaJS.c.Lcom_repocad_web_Response.prototype.equals__O__Z = (function(x$1) {
  if ((this === x$1)) {
    return true
  } else if (ScalaJS.is.Lcom_repocad_web_Response(x$1)) {
    var Response$1 = ScalaJS.as.Lcom_repocad_web_Response(x$1);
    return (((this.status$1 === Response$1.status$1) && (this.state$1 === Response$1.state$1)) && ScalaJS.anyRefEqEq(this.response$1, Response$1.response$1))
  } else {
    return false
  }
});
ScalaJS.c.Lcom_repocad_web_Response.prototype.productElement__I__O = (function(x$1) {
  switch (x$1) {
    case 0:
      {
        return this.status$1;
        break
      };
    case 1:
      {
        return this.state$1;
        break
      };
    case 2:
      {
        return this.response$1;
        break
      };
    default:
      throw new ScalaJS.c.jl_IndexOutOfBoundsException().init___T(ScalaJS.objectToString(x$1));
  }
});
ScalaJS.c.Lcom_repocad_web_Response.prototype.toString__T = (function() {
  return ScalaJS.m.sr_ScalaRunTime().$$undtoString__s_Product__T(this)
});
ScalaJS.c.Lcom_repocad_web_Response.prototype.init___I__I__T = (function(status, state, response) {
  this.status$1 = status;
  this.state$1 = state;
  this.response$1 = response;
  return this
});
ScalaJS.c.Lcom_repocad_web_Response.prototype.hashCode__I = (function() {
  var acc = (-889275714);
  acc = ScalaJS.m.sr_Statics().mix__I__I__I(acc, this.status$1);
  acc = ScalaJS.m.sr_Statics().mix__I__I__I(acc, this.state$1);
  acc = ScalaJS.m.sr_Statics().mix__I__I__I(acc, ScalaJS.m.sr_Statics().anyHash__O__I(this.response$1));
  return ScalaJS.m.sr_Statics().finalizeHash__I__I__I(acc, 3)
});
ScalaJS.c.Lcom_repocad_web_Response.prototype.productIterator__sc_Iterator = (function() {
  return new ScalaJS.c.sr_ScalaRunTime$$anon$1().init___s_Product(this)
});
ScalaJS.is.Lcom_repocad_web_Response = (function(obj) {
  return (!(!((obj && obj.$classData) && obj.$classData.ancestors.Lcom_repocad_web_Response)))
});
ScalaJS.as.Lcom_repocad_web_Response = (function(obj) {
  return ((ScalaJS.is.Lcom_repocad_web_Response(obj) || (obj === null)) ? obj : ScalaJS.throwClassCastException(obj, "com.repocad.web.Response"))
});
ScalaJS.isArrayOf.Lcom_repocad_web_Response = (function(obj, depth) {
  return (!(!(((obj && obj.$classData) && (obj.$classData.arrayDepth === depth)) && obj.$classData.arrayBase.ancestors.Lcom_repocad_web_Response)))
});
ScalaJS.asArrayOf.Lcom_repocad_web_Response = (function(obj, depth) {
  return ((ScalaJS.isArrayOf.Lcom_repocad_web_Response(obj, depth) || (obj === null)) ? obj : ScalaJS.throwArrayCastException(obj, "Lcom.repocad.web.Response;", depth))
});
ScalaJS.d.Lcom_repocad_web_Response = new ScalaJS.ClassTypeData({
  Lcom_repocad_web_Response: 0
}, false, "com.repocad.web.Response", ScalaJS.d.O, {
  Lcom_repocad_web_Response: 1,
  s_Serializable: 1,
  Ljava_io_Serializable: 1,
  s_Product: 1,
  s_Equals: 1,
  O: 1
});
ScalaJS.c.Lcom_repocad_web_Response.prototype.$classData = ScalaJS.d.Lcom_repocad_web_Response;
/** @constructor */
ScalaJS.c.Lcom_repocad_web_Response$ = (function() {
  ScalaJS.c.O.call(this)
});
ScalaJS.c.Lcom_repocad_web_Response$.prototype = new ScalaJS.h.O();
ScalaJS.c.Lcom_repocad_web_Response$.prototype.constructor = ScalaJS.c.Lcom_repocad_web_Response$;
/** @constructor */
ScalaJS.h.Lcom_repocad_web_Response$ = (function() {
  /*<skip>*/
});
ScalaJS.h.Lcom_repocad_web_Response$.prototype = ScalaJS.c.Lcom_repocad_web_Response$.prototype;
ScalaJS.c.Lcom_repocad_web_Response$.prototype.apply__Lorg_scalajs_dom_XMLHttpRequest__Lcom_repocad_web_Response = (function(xhr) {
  return new ScalaJS.c.Lcom_repocad_web_Response().init___I__I__T(ScalaJS.uI(xhr["status"]), ScalaJS.uI(xhr["readyState"]), ScalaJS.as.T(xhr["responseText"]))
});
ScalaJS.is.Lcom_repocad_web_Response$ = (function(obj) {
  return (!(!((obj && obj.$classData) && obj.$classData.ancestors.Lcom_repocad_web_Response$)))
});
ScalaJS.as.Lcom_repocad_web_Response$ = (function(obj) {
  return ((ScalaJS.is.Lcom_repocad_web_Response$(obj) || (obj === null)) ? obj : ScalaJS.throwClassCastException(obj, "com.repocad.web.Response$"))
});
ScalaJS.isArrayOf.Lcom_repocad_web_Response$ = (function(obj, depth) {
  return (!(!(((obj && obj.$classData) && (obj.$classData.arrayDepth === depth)) && obj.$classData.arrayBase.ancestors.Lcom_repocad_web_Response$)))
});
ScalaJS.asArrayOf.Lcom_repocad_web_Response$ = (function(obj, depth) {
  return ((ScalaJS.isArrayOf.Lcom_repocad_web_Response$(obj, depth) || (obj === null)) ? obj : ScalaJS.throwArrayCastException(obj, "Lcom.repocad.web.Response$;", depth))
});
ScalaJS.d.Lcom_repocad_web_Response$ = new ScalaJS.ClassTypeData({
  Lcom_repocad_web_Response$: 0
}, false, "com.repocad.web.Response$", ScalaJS.d.O, {
  Lcom_repocad_web_Response$: 1,
  s_Serializable: 1,
  Ljava_io_Serializable: 1,
  O: 1
});
ScalaJS.c.Lcom_repocad_web_Response$.prototype.$classData = ScalaJS.d.Lcom_repocad_web_Response$;
ScalaJS.n.Lcom_repocad_web_Response = (void 0);
ScalaJS.m.Lcom_repocad_web_Response = (function() {
  if ((!ScalaJS.n.Lcom_repocad_web_Response)) {
    ScalaJS.n.Lcom_repocad_web_Response = new ScalaJS.c.Lcom_repocad_web_Response$().init___()
  };
  return ScalaJS.n.Lcom_repocad_web_Response
});
/** @constructor */
ScalaJS.c.Lcom_repocad_web_SplineToArc2D$ = (function() {
  ScalaJS.c.O.call(this)
});
ScalaJS.c.Lcom_repocad_web_SplineToArc2D$.prototype = new ScalaJS.h.O();
ScalaJS.c.Lcom_repocad_web_SplineToArc2D$.prototype.constructor = ScalaJS.c.Lcom_repocad_web_SplineToArc2D$;
/** @constructor */
ScalaJS.h.Lcom_repocad_web_SplineToArc2D$ = (function() {
  /*<skip>*/
});
ScalaJS.h.Lcom_repocad_web_SplineToArc2D$.prototype = ScalaJS.c.Lcom_repocad_web_SplineToArc2D$.prototype;
ScalaJS.c.Lcom_repocad_web_SplineToArc2D$.prototype.createArc$1__p1__D__D__D__D__D__D__sci_List = (function(radius, startAngle, endAngle, cX$1, cY$1, radius$1) {
  var elem = ScalaJS.m.sci_Nil();
  var elem$1 = null;
  elem$1 = elem;
  var startA = (startAngle % 6.28);
  var endA = (endAngle % 6.28);
  ScalaJS.asArrayOf.D(ScalaJS.m.s_Array().apply__sc_Seq__s_reflect_ClassTag__O(ScalaJS.m.sci_Nil(), ScalaJS.m.s_reflect_ClassTag().Double$1), 1);
  var sgn = ((startA < endA) ? 1.0 : (-1.0));
  var elem$1$1 = 0.0;
  elem$1$1 = startAngle;
  var x = (endAngle - startAngle);
  var y = ((x < 0) ? (-x) : x);
  var elem$2 = ((6.28 < y) ? 6.28 : y);
  var elem$1$2 = 0.0;
  elem$1$2 = elem$2;
  var segments = ((elem$1$2 % 3.14) | 0);
  var end = ((segments + 1) | 0);
  var this$11 = new ScalaJS.c.sci_Range$Inclusive().init___I__I__I(0, end, 1);
  this$11.scala$collection$immutable$Range$$validateMaxLength__V();
  var isCommonCase = ((this$11.start$4 !== (-2147483648)) || (this$11.end$4 !== (-2147483648)));
  var i = this$11.start$4;
  var count = 0;
  var terminal = this$11.terminalElement$4;
  var step = this$11.step$4;
  while ((isCommonCase ? (i !== terminal) : (count < this$11.numRangeElements$4))) {
    var i$2 = i;
    if ((elem$1$2 > ScalaJS.m.Lcom_repocad_web_package().epsilon$1)) {
      var jsx$1 = elem$1$1;
      var x$1 = elem$1$2;
      var a2 = (jsx$1 + (sgn * ((x$1 < 1.57) ? x$1 : 1.57)));
      var smallArc = ScalaJS.m.Lcom_repocad_web_SplineToArc2D().com$repocad$web$SplineToArc2D$$createSmallArc$1__D__D__D__D__D__sci_List(elem$1$1, a2, cX$1, cY$1, radius$1);
      var this$15 = ScalaJS.as.sci_List(elem$1);
      var this$14 = ScalaJS.m.sci_List();
      var bf = this$14.ReusableCBFInstance$2;
      elem$1 = ScalaJS.as.sci_List(ScalaJS.i.sc_SeqLike$class__$colon$plus__sc_SeqLike__O__scg_CanBuildFrom__O(this$15, smallArc, bf));
      var jsx$2 = elem$1$2;
      var x$2 = (a2 - elem$1$1);
      elem$1$2 = (jsx$2 - ((x$2 < 0) ? (-x$2) : x$2));
      elem$1$1 = a2
    };
    count = ((count + 1) | 0);
    i = ((i + step) | 0)
  };
  return ScalaJS.as.sci_List(elem$1)
});
ScalaJS.c.Lcom_repocad_web_SplineToArc2D$.prototype.com$repocad$web$SplineToArc2D$$createSmallArc$1__D__D__D__D__D__sci_List = (function(startA, endA, cX$1, cY$1, radius$1) {
  var span = (endA - startA);
  var x = (span / 2.0);
  var x0 = ScalaJS.uD(ScalaJS.g["Math"]["cos"](x));
  var x$1 = (span / 2.0);
  var y0 = ScalaJS.uD(ScalaJS.g["Math"]["sin"](x$1));
  var y3 = (-y0);
  var x1 = ((4.0 - x0) / 3.0);
  var y1 = (((1.0 - x0) * (3.0 - x0)) / (3.0 * y0));
  var y2 = (-y1);
  var bezAng = (startA + (span / 2.0));
  var cBezAng = ScalaJS.uD(ScalaJS.g["Math"]["cos"](bezAng));
  var sBezAng = ScalaJS.uD(ScalaJS.g["Math"]["sin"](bezAng));
  var rx0 = ((cBezAng * x0) - (sBezAng * y0));
  var ry0 = ((sBezAng * x0) + (cBezAng * y0));
  var rx1 = ((cBezAng * x1) - (sBezAng * y1));
  var ry1 = ((sBezAng * x1) + (cBezAng * y1));
  var rx2 = ((cBezAng * x1) - (sBezAng * y2));
  var ry2 = ((sBezAng * x1) + (cBezAng * y2));
  var rx3 = ((cBezAng * x0) - (sBezAng * y3));
  var ry3 = ((sBezAng * x0) + (cBezAng * y3));
  var px0 = (radius$1 * rx0);
  var py0 = (radius$1 * (-ry0));
  var px1 = (radius$1 * rx1);
  var py1 = (radius$1 * (-ry1));
  var px2 = (radius$1 * rx2);
  var py2 = (radius$1 * (-ry2));
  var px3 = (radius$1 * rx3);
  var py3 = (radius$1 * (-ry3));
  ScalaJS.m.sci_List();
  var xs = new ScalaJS.c.sjs_js_WrappedArray().init___sjs_js_Array([(px0 + cX$1), (py0 + cY$1), (px1 + cX$1), (py1 + cY$1), (px2 + cX$1), (py2 + cY$1), (px3 + cX$1), (py3 + cY$1)]);
  var this$10 = ScalaJS.m.sci_List();
  var cbf = this$10.ReusableCBFInstance$2;
  var l = ScalaJS.as.sci_List(ScalaJS.i.sc_TraversableLike$class__to__sc_TraversableLike__scg_CanBuildFrom__O(xs, cbf));
  return l
});
ScalaJS.is.Lcom_repocad_web_SplineToArc2D$ = (function(obj) {
  return (!(!((obj && obj.$classData) && obj.$classData.ancestors.Lcom_repocad_web_SplineToArc2D$)))
});
ScalaJS.as.Lcom_repocad_web_SplineToArc2D$ = (function(obj) {
  return ((ScalaJS.is.Lcom_repocad_web_SplineToArc2D$(obj) || (obj === null)) ? obj : ScalaJS.throwClassCastException(obj, "com.repocad.web.SplineToArc2D$"))
});
ScalaJS.isArrayOf.Lcom_repocad_web_SplineToArc2D$ = (function(obj, depth) {
  return (!(!(((obj && obj.$classData) && (obj.$classData.arrayDepth === depth)) && obj.$classData.arrayBase.ancestors.Lcom_repocad_web_SplineToArc2D$)))
});
ScalaJS.asArrayOf.Lcom_repocad_web_SplineToArc2D$ = (function(obj, depth) {
  return ((ScalaJS.isArrayOf.Lcom_repocad_web_SplineToArc2D$(obj, depth) || (obj === null)) ? obj : ScalaJS.throwArrayCastException(obj, "Lcom.repocad.web.SplineToArc2D$;", depth))
});
ScalaJS.d.Lcom_repocad_web_SplineToArc2D$ = new ScalaJS.ClassTypeData({
  Lcom_repocad_web_SplineToArc2D$: 0
}, false, "com.repocad.web.SplineToArc2D$", ScalaJS.d.O, {
  Lcom_repocad_web_SplineToArc2D$: 1,
  O: 1
});
ScalaJS.c.Lcom_repocad_web_SplineToArc2D$.prototype.$classData = ScalaJS.d.Lcom_repocad_web_SplineToArc2D$;
ScalaJS.n.Lcom_repocad_web_SplineToArc2D = (void 0);
ScalaJS.m.Lcom_repocad_web_SplineToArc2D = (function() {
  if ((!ScalaJS.n.Lcom_repocad_web_SplineToArc2D)) {
    ScalaJS.n.Lcom_repocad_web_SplineToArc2D = new ScalaJS.c.Lcom_repocad_web_SplineToArc2D$().init___()
  };
  return ScalaJS.n.Lcom_repocad_web_SplineToArc2D
});
/** @constructor */
ScalaJS.c.Lcom_repocad_web_Vector2D = (function() {
  ScalaJS.c.O.call(this);
  this.x$1 = 0.0;
  this.y$1 = 0.0
});
ScalaJS.c.Lcom_repocad_web_Vector2D.prototype = new ScalaJS.h.O();
ScalaJS.c.Lcom_repocad_web_Vector2D.prototype.constructor = ScalaJS.c.Lcom_repocad_web_Vector2D;
/** @constructor */
ScalaJS.h.Lcom_repocad_web_Vector2D = (function() {
  /*<skip>*/
});
ScalaJS.h.Lcom_repocad_web_Vector2D.prototype = ScalaJS.c.Lcom_repocad_web_Vector2D.prototype;
ScalaJS.c.Lcom_repocad_web_Vector2D.prototype.productPrefix__T = (function() {
  return "Vector2D"
});
ScalaJS.c.Lcom_repocad_web_Vector2D.prototype.productArity__I = (function() {
  return 2
});
ScalaJS.c.Lcom_repocad_web_Vector2D.prototype.equals__O__Z = (function(obj) {
  if (ScalaJS.is.Lcom_repocad_web_Vector2D(obj)) {
    var x2 = ScalaJS.as.Lcom_repocad_web_Vector2D(obj);
    var x = (this.x$1 - x2.x$1);
    if ((((x < 0) ? (-x) : x) < ScalaJS.m.Lcom_repocad_web_package().epsilon$1)) {
      var x$1 = (this.y$1 - x2.y$1);
      return (((x$1 < 0) ? (-x$1) : x$1) < ScalaJS.m.Lcom_repocad_web_package().epsilon$1)
    } else {
      return false
    }
  } else {
    return false
  }
});
ScalaJS.c.Lcom_repocad_web_Vector2D.prototype.productElement__I__O = (function(x$1) {
  switch (x$1) {
    case 0:
      {
        return this.x$1;
        break
      };
    case 1:
      {
        return this.y$1;
        break
      };
    default:
      throw new ScalaJS.c.jl_IndexOutOfBoundsException().init___T(ScalaJS.objectToString(x$1));
  }
});
ScalaJS.c.Lcom_repocad_web_Vector2D.prototype.$$plus__Lcom_repocad_web_Vector2D__Lcom_repocad_web_Vector2D = (function(other) {
  return new ScalaJS.c.Lcom_repocad_web_Vector2D().init___D__D((this.x$1 + other.x$1), (this.y$1 + other.y$1))
});
ScalaJS.c.Lcom_repocad_web_Vector2D.prototype.toString__T = (function() {
  return ScalaJS.m.sr_ScalaRunTime().$$undtoString__s_Product__T(this)
});
ScalaJS.c.Lcom_repocad_web_Vector2D.prototype.abs__Lcom_repocad_web_Vector2D = (function() {
  var x = this.x$1;
  var x$1 = this.y$1;
  return new ScalaJS.c.Lcom_repocad_web_Vector2D().init___D__D(((x < 0) ? (-x) : x), ((x$1 < 0) ? (-x$1) : x$1))
});
ScalaJS.c.Lcom_repocad_web_Vector2D.prototype.init___D__D = (function(x, y) {
  this.x$1 = x;
  this.y$1 = y;
  return this
});
ScalaJS.c.Lcom_repocad_web_Vector2D.prototype.$$minus__Lcom_repocad_web_Vector2D__Lcom_repocad_web_Vector2D = (function(other) {
  return new ScalaJS.c.Lcom_repocad_web_Vector2D().init___D__D((this.x$1 - other.x$1), (this.y$1 - other.y$1))
});
ScalaJS.c.Lcom_repocad_web_Vector2D.prototype.hashCode__I = (function() {
  var acc = (-889275714);
  acc = ScalaJS.m.sr_Statics().mix__I__I__I(acc, ScalaJS.m.sr_Statics().doubleHash__D__I(this.x$1));
  acc = ScalaJS.m.sr_Statics().mix__I__I__I(acc, ScalaJS.m.sr_Statics().doubleHash__D__I(this.y$1));
  return ScalaJS.m.sr_Statics().finalizeHash__I__I__I(acc, 2)
});
ScalaJS.c.Lcom_repocad_web_Vector2D.prototype.productIterator__sc_Iterator = (function() {
  return new ScalaJS.c.sr_ScalaRunTime$$anon$1().init___s_Product(this)
});
ScalaJS.is.Lcom_repocad_web_Vector2D = (function(obj) {
  return (!(!((obj && obj.$classData) && obj.$classData.ancestors.Lcom_repocad_web_Vector2D)))
});
ScalaJS.as.Lcom_repocad_web_Vector2D = (function(obj) {
  return ((ScalaJS.is.Lcom_repocad_web_Vector2D(obj) || (obj === null)) ? obj : ScalaJS.throwClassCastException(obj, "com.repocad.web.Vector2D"))
});
ScalaJS.isArrayOf.Lcom_repocad_web_Vector2D = (function(obj, depth) {
  return (!(!(((obj && obj.$classData) && (obj.$classData.arrayDepth === depth)) && obj.$classData.arrayBase.ancestors.Lcom_repocad_web_Vector2D)))
});
ScalaJS.asArrayOf.Lcom_repocad_web_Vector2D = (function(obj, depth) {
  return ((ScalaJS.isArrayOf.Lcom_repocad_web_Vector2D(obj, depth) || (obj === null)) ? obj : ScalaJS.throwArrayCastException(obj, "Lcom.repocad.web.Vector2D;", depth))
});
ScalaJS.d.Lcom_repocad_web_Vector2D = new ScalaJS.ClassTypeData({
  Lcom_repocad_web_Vector2D: 0
}, false, "com.repocad.web.Vector2D", ScalaJS.d.O, {
  Lcom_repocad_web_Vector2D: 1,
  s_Serializable: 1,
  Ljava_io_Serializable: 1,
  s_Product: 1,
  s_Equals: 1,
  Lcom_repocad_web_Vector: 1,
  O: 1
});
ScalaJS.c.Lcom_repocad_web_Vector2D.prototype.$classData = ScalaJS.d.Lcom_repocad_web_Vector2D;
/** @constructor */
ScalaJS.c.Lcom_repocad_web_evaluating_Evaluator$ = (function() {
  ScalaJS.c.O.call(this);
  this.minX$1 = null;
  this.maxX$1 = null;
  this.minY$1 = null;
  this.maxY$1 = null;
  this.com$repocad$web$evaluating$Evaluator$$scriptCache$1 = null
});
ScalaJS.c.Lcom_repocad_web_evaluating_Evaluator$.prototype = new ScalaJS.h.O();
ScalaJS.c.Lcom_repocad_web_evaluating_Evaluator$.prototype.constructor = ScalaJS.c.Lcom_repocad_web_evaluating_Evaluator$;
/** @constructor */
ScalaJS.h.Lcom_repocad_web_evaluating_Evaluator$ = (function() {
  /*<skip>*/
});
ScalaJS.h.Lcom_repocad_web_evaluating_Evaluator$.prototype = ScalaJS.c.Lcom_repocad_web_evaluating_Evaluator$.prototype;
ScalaJS.c.Lcom_repocad_web_evaluating_Evaluator$.prototype.init___ = (function() {
  ScalaJS.n.Lcom_repocad_web_evaluating_Evaluator = this;
  this.minX$1 = ScalaJS.m.s_None();
  this.maxX$1 = ScalaJS.m.s_None();
  this.minY$1 = ScalaJS.m.s_None();
  this.maxY$1 = ScalaJS.m.s_None();
  this.com$repocad$web$evaluating$Evaluator$$scriptCache$1 = ScalaJS.as.sci_Map(ScalaJS.m.s_Predef().Map$2.apply__sc_Seq__sc_GenMap(ScalaJS.m.sci_Nil()));
  return this
});
ScalaJS.c.Lcom_repocad_web_evaluating_Evaluator$.prototype.com$repocad$web$evaluating$Evaluator$$foldRecursive$1__sc_Iterator__sci_Map__Lcom_repocad_web_Printer__s_util_Either = (function(it, foldEnv, printer$1) {
  var this$1 = this.eval__Lcom_repocad_web_parsing_Expr__sci_Map__Lcom_repocad_web_Printer__s_util_Either(ScalaJS.as.Lcom_repocad_web_parsing_Expr(it.next__O()), foldEnv, printer$1);
  if (ScalaJS.is.s_util_Left(this$1)) {
    var x2 = ScalaJS.as.s_util_Left(this$1);
    var a = x2.a$2;
    var error = ScalaJS.as.T(a);
    ScalaJS.m.s_package().Left$1;
    var jsx$1 = new ScalaJS.c.s_util_Left().init___O(error)
  } else if (ScalaJS.is.s_util_Right(this$1)) {
    var x3 = ScalaJS.as.s_util_Right(this$1);
    var b = x3.b$2;
    var t = ScalaJS.as.T2(b);
    if (it.hasNext__Z()) {
      var jsx$1 = ScalaJS.m.Lcom_repocad_web_evaluating_Evaluator().com$repocad$web$evaluating$Evaluator$$foldRecursive$1__sc_Iterator__sci_Map__Lcom_repocad_web_Printer__s_util_Either(it, ScalaJS.as.sci_Map(t.$$und1$f), printer$1)
    } else {
      ScalaJS.m.s_package().Right$1;
      var $$this = t.$$und1$f;
      var y = t.$$und2$f;
      var b$1 = new ScalaJS.c.T2().init___O__O($$this, y);
      var jsx$1 = new ScalaJS.c.s_util_Right().init___O(b$1)
    }
  } else {
    var jsx$1;
    throw new ScalaJS.c.s_MatchError().init___O(this$1)
  };
  return ScalaJS.as.s_util_Either(jsx$1)
});
ScalaJS.c.Lcom_repocad_web_evaluating_Evaluator$.prototype.eval__Lcom_repocad_web_parsing_Expr__sci_Map__Lcom_repocad_web_Printer__s_util_Either = (function(expr, env, printer) {
  try {
    var rc22 = false;
    var x13 = null;
    if (ScalaJS.is.Lcom_repocad_web_parsing_ArcExpr(expr)) {
      var x2 = ScalaJS.as.Lcom_repocad_web_parsing_ArcExpr(expr);
      var centerX = x2.centerX$1;
      var centerY = x2.centerY$1;
      var radius = x2.radius$1;
      var sAngle = x2.sAngle$1;
      var eAngle = x2.eAngle$1;
      var this$1 = this.getValue__Lcom_repocad_web_parsing_Expr__sci_Map__Lcom_repocad_web_Printer__s_util_Either(centerX, env, printer);
      return new ScalaJS.c.s_util_Either$RightProjection().init___s_util_Either(this$1).flatMap__F1__s_util_Either(new ScalaJS.c.Lcom_repocad_web_evaluating_Evaluator$$anonfun$eval$1().init___sci_Map__Lcom_repocad_web_Printer__Lcom_repocad_web_parsing_Expr__Lcom_repocad_web_parsing_Expr__Lcom_repocad_web_parsing_Expr__Lcom_repocad_web_parsing_Expr(env, printer, centerY, radius, sAngle, eAngle))
    };
    if (ScalaJS.is.Lcom_repocad_web_parsing_BezierExpr(expr)) {
      var x3 = ScalaJS.as.Lcom_repocad_web_parsing_BezierExpr(expr);
      var sx1 = x3.x1$1;
      var sy1 = x3.y1$1;
      var sx2 = x3.x2$1;
      var sy2 = x3.y2$1;
      var sx3 = x3.x3$1;
      var sy3 = x3.y3$1;
      var sx4 = x3.x4$1;
      var sy4 = x3.y4$1;
      var this$2 = this.getValue__Lcom_repocad_web_parsing_Expr__sci_Map__Lcom_repocad_web_Printer__s_util_Either(sx1, env, printer);
      return new ScalaJS.c.s_util_Either$RightProjection().init___s_util_Either(this$2).flatMap__F1__s_util_Either(new ScalaJS.c.Lcom_repocad_web_evaluating_Evaluator$$anonfun$eval$2().init___sci_Map__Lcom_repocad_web_Printer__Lcom_repocad_web_parsing_Expr__Lcom_repocad_web_parsing_Expr__Lcom_repocad_web_parsing_Expr__Lcom_repocad_web_parsing_Expr__Lcom_repocad_web_parsing_Expr__Lcom_repocad_web_parsing_Expr__Lcom_repocad_web_parsing_Expr(env, printer, sy1, sx2, sy2, sx3, sy3, sx4, sy4))
    };
    if (ScalaJS.is.Lcom_repocad_web_parsing_CircleExpr(expr)) {
      var x4 = ScalaJS.as.Lcom_repocad_web_parsing_CircleExpr(expr);
      var centerX$2 = x4.centerX$1;
      var centerY$2 = x4.centerY$1;
      var radius$2 = x4.radius$1;
      var this$3 = this.getValue__Lcom_repocad_web_parsing_Expr__sci_Map__Lcom_repocad_web_Printer__s_util_Either(centerX$2, env, printer);
      return new ScalaJS.c.s_util_Either$RightProjection().init___s_util_Either(this$3).flatMap__F1__s_util_Either(new ScalaJS.c.Lcom_repocad_web_evaluating_Evaluator$$anonfun$eval$3().init___sci_Map__Lcom_repocad_web_Printer__Lcom_repocad_web_parsing_Expr__Lcom_repocad_web_parsing_Expr(env, printer, centerY$2, radius$2))
    };
    if (ScalaJS.is.Lcom_repocad_web_parsing_FunctionExpr(expr)) {
      var x5 = ScalaJS.as.Lcom_repocad_web_parsing_FunctionExpr(expr);
      var name = x5.name$1;
      var params = x5.params$1;
      var body = x5.body$1;
      var x1$2 = params.size__I();
      switch (x1$2) {
        case 0:
          {
            var function$2 = new ScalaJS.c.sjsr_AnonFunction0().init___sjs_js_Function0((function(env$1, printer$1, body$1) {
              return (function() {
                return ScalaJS.m.Lcom_repocad_web_evaluating_Evaluator().eval__Lcom_repocad_web_parsing_Expr__sci_Map__Lcom_repocad_web_Printer__s_util_Either(body$1, env$1, printer$1)
              })
            })(env, printer, body));
            break
          };
        case 1:
          {
            var function$2 = new ScalaJS.c.sjsr_AnonFunction1().init___sjs_js_Function1((function(env$1$1, printer$1$1, params$1, body$1$1) {
              return (function(a$2) {
                var jsx$1 = ScalaJS.m.Lcom_repocad_web_evaluating_Evaluator();
                var $$this = params$1.apply__I__O(0);
                return jsx$1.eval__Lcom_repocad_web_parsing_Expr__sci_Map__Lcom_repocad_web_Printer__s_util_Either(body$1$1, env$1$1.$$plus__T2__sci_Map(new ScalaJS.c.T2().init___O__O($$this, a$2)), printer$1$1)
              })
            })(env, printer, params, body));
            break
          };
        case 2:
          {
            var function$2 = new ScalaJS.c.sjsr_AnonFunction2().init___sjs_js_Function2((function(env$1$2, printer$1$2, params$1$1, body$1$2) {
              return (function(a$2$1, b$2) {
                var jsx$3 = ScalaJS.m.Lcom_repocad_web_evaluating_Evaluator();
                var $$this$1 = params$1$1.apply__I__O(0);
                var jsx$2 = new ScalaJS.c.T2().init___O__O($$this$1, a$2$1);
                var $$this$2 = params$1$1.apply__I__O(1);
                return jsx$3.eval__Lcom_repocad_web_parsing_Expr__sci_Map__Lcom_repocad_web_Printer__s_util_Either(body$1$2, env$1$2.$$plus__T2__T2__sc_Seq__sci_Map(jsx$2, new ScalaJS.c.T2().init___O__O($$this$2, b$2), new ScalaJS.c.sjs_js_WrappedArray().init___sjs_js_Array([])), printer$1$2)
              })
            })(env, printer, params, body));
            break
          };
        case 3:
          {
            var function$2 = new ScalaJS.c.sjsr_AnonFunction3().init___sjs_js_Function3((function(env$1$3, printer$1$3, params$1$2, body$1$3) {
              return (function(a$2$2, b$2$1, c$2) {
                var jsx$6 = ScalaJS.m.Lcom_repocad_web_evaluating_Evaluator();
                var $$this$3 = params$1$2.apply__I__O(0);
                var jsx$5 = new ScalaJS.c.T2().init___O__O($$this$3, a$2$2);
                var $$this$4 = params$1$2.apply__I__O(1);
                var jsx$4 = new ScalaJS.c.T2().init___O__O($$this$4, b$2$1);
                var $$this$5 = params$1$2.apply__I__O(2);
                return jsx$6.eval__Lcom_repocad_web_parsing_Expr__sci_Map__Lcom_repocad_web_Printer__s_util_Either(body$1$3, env$1$3.$$plus__T2__T2__sc_Seq__sci_Map(jsx$5, jsx$4, new ScalaJS.c.sjs_js_WrappedArray().init___sjs_js_Array([new ScalaJS.c.T2().init___O__O($$this$5, c$2)])), printer$1$3)
              })
            })(env, printer, params, body));
            break
          };
        case 4:
          {
            var function$2 = new ScalaJS.c.sjsr_AnonFunction4().init___sjs_js_Function4((function(env$1$4, printer$1$4, params$1$3, body$1$4) {
              return (function(a$2$3, b$2$2, c$2$1, d$2) {
                var jsx$10 = ScalaJS.m.Lcom_repocad_web_evaluating_Evaluator();
                var $$this$6 = params$1$3.apply__I__O(0);
                var jsx$9 = new ScalaJS.c.T2().init___O__O($$this$6, a$2$3);
                var $$this$7 = params$1$3.apply__I__O(1);
                var jsx$8 = new ScalaJS.c.T2().init___O__O($$this$7, b$2$2);
                var $$this$8 = params$1$3.apply__I__O(2);
                var jsx$7 = new ScalaJS.c.T2().init___O__O($$this$8, c$2$1);
                var $$this$9 = params$1$3.apply__I__O(3);
                return jsx$10.eval__Lcom_repocad_web_parsing_Expr__sci_Map__Lcom_repocad_web_Printer__s_util_Either(body$1$4, env$1$4.$$plus__T2__T2__sc_Seq__sci_Map(jsx$9, jsx$8, new ScalaJS.c.sjs_js_WrappedArray().init___sjs_js_Array([jsx$7, new ScalaJS.c.T2().init___O__O($$this$9, d$2)])), printer$1$4)
              })
            })(env, printer, params, body));
            break
          };
        default:
          {
            ScalaJS.m.s_package().Left$1;
            var a = ("Unsupported number of arguments: " + x1$2);
            var function$2 = new ScalaJS.c.s_util_Left().init___O(a)
          };
      };
      ScalaJS.m.s_package().Right$1;
      var b = new ScalaJS.c.T2().init___O__O(env.$$plus__T2__sci_Map(new ScalaJS.c.T2().init___O__O(name, function$2)), function$2);
      return new ScalaJS.c.s_util_Right().init___O(b)
    };
    if (ScalaJS.is.Lcom_repocad_web_parsing_LineExpr(expr)) {
      var x6 = ScalaJS.as.Lcom_repocad_web_parsing_LineExpr(expr);
      var e1 = x6.e1$1;
      var e2 = x6.e2$1;
      var e3 = x6.e3$1;
      var e4 = x6.e4$1;
      var this$28 = this.getValue__Lcom_repocad_web_parsing_Expr__sci_Map__Lcom_repocad_web_Printer__s_util_Either(e1, env, printer);
      return new ScalaJS.c.s_util_Either$RightProjection().init___s_util_Either(this$28).flatMap__F1__s_util_Either(new ScalaJS.c.Lcom_repocad_web_evaluating_Evaluator$$anonfun$eval$4().init___sci_Map__Lcom_repocad_web_Printer__Lcom_repocad_web_parsing_Expr__Lcom_repocad_web_parsing_Expr__Lcom_repocad_web_parsing_Expr(env, printer, e2, e3, e4))
    };
    if (ScalaJS.is.Lcom_repocad_web_parsing_TextExpr(expr)) {
      var x7 = ScalaJS.as.Lcom_repocad_web_parsing_TextExpr(expr);
      var centerX$3 = x7.centerX$1;
      var centerY$3 = x7.centerY$1;
      var height = x7.size$1;
      var text = x7.t$1;
      var this$29 = this.getValue__Lcom_repocad_web_parsing_Expr__sci_Map__Lcom_repocad_web_Printer__s_util_Either(centerX$3, env, printer);
      return new ScalaJS.c.s_util_Either$RightProjection().init___s_util_Either(this$29).flatMap__F1__s_util_Either(new ScalaJS.c.Lcom_repocad_web_evaluating_Evaluator$$anonfun$eval$5().init___sci_Map__Lcom_repocad_web_Printer__Lcom_repocad_web_parsing_Expr__Lcom_repocad_web_parsing_Expr__Lcom_repocad_web_parsing_Expr(env, printer, centerY$3, height, text))
    };
    if (ScalaJS.is.Lcom_repocad_web_parsing_ConstantExpr(expr)) {
      var x8 = ScalaJS.as.Lcom_repocad_web_parsing_ConstantExpr(expr);
      var value = x8.value$1;
      ScalaJS.m.s_package().Right$1;
      var b$1 = new ScalaJS.c.T2().init___O__O(env, value);
      return new ScalaJS.c.s_util_Right().init___O(b$1)
    };
    if (ScalaJS.is.Lcom_repocad_web_parsing_CompExpr(expr)) {
      var x9 = ScalaJS.as.Lcom_repocad_web_parsing_CompExpr(expr);
      var e1$2 = x9.e1$1;
      var e2$2 = x9.e2$1;
      var op = x9.op$1;
      return ScalaJS.as.s_util_Either(this.eval__Lcom_repocad_web_parsing_Expr__sci_Map__Lcom_repocad_web_Printer__s_util_Either(e1$2, env, printer).fold__F1__F1__O(new ScalaJS.c.sjsr_AnonFunction1().init___sjs_js_Function1((function(e$2) {
        var e = ScalaJS.as.T(e$2);
        ScalaJS.m.s_package().Left$1;
        return new ScalaJS.c.s_util_Left().init___O(e)
      })), new ScalaJS.c.Lcom_repocad_web_evaluating_Evaluator$$anonfun$eval$7().init___sci_Map__Lcom_repocad_web_Printer__Lcom_repocad_web_parsing_Expr__T(env, printer, e2$2, op)))
    };
    if (ScalaJS.is.Lcom_repocad_web_parsing_OpExpr(expr)) {
      var x10 = ScalaJS.as.Lcom_repocad_web_parsing_OpExpr(expr);
      var e1$3 = x10.e1$1;
      var e2$3 = x10.e2$1;
      var op$2 = x10.op$1;
      var this$34 = this.eval__Lcom_repocad_web_parsing_Expr__sci_Map__Lcom_repocad_web_Printer__s_util_Either(e1$3, env, printer);
      return new ScalaJS.c.s_util_Either$RightProjection().init___s_util_Either(this$34).flatMap__F1__s_util_Either(new ScalaJS.c.Lcom_repocad_web_evaluating_Evaluator$$anonfun$eval$8().init___sci_Map__Lcom_repocad_web_Printer__Lcom_repocad_web_parsing_Expr__T(env, printer, e2$3, op$2))
    };
    if (ScalaJS.is.Lcom_repocad_web_parsing_ImportExpr(expr)) {
      var x11 = ScalaJS.as.Lcom_repocad_web_parsing_ImportExpr(expr);
      var name$2 = x11.name$1;
      var this$36 = ScalaJS.m.Lorg_scalajs_dom_extensions_Ajax();
      var url = ("http://siigna.com:20004/get/" + name$2.name$1);
      var headers = ScalaJS.m.sci_Nil();
      var this$38 = this$36.apply__T__T__T__I__sc_Seq__Z__s_concurrent_Future("GET", url, "", 0, headers, false);
      var f = new ScalaJS.c.sjsr_AnonFunction1().init___sjs_js_Function1((function(env$1$5, printer$1$5, name$1) {
        return (function(xhr$2) {
          var xhr = xhr$2;
          var x1 = ScalaJS.m.Lcom_repocad_web_parsing_Parser().parse__Lcom_repocad_web_lexing_LiveStream__s_util_Either(ScalaJS.m.Lcom_repocad_web_lexing_Lexer().lex__T__Lcom_repocad_web_lexing_LiveStream(ScalaJS.as.T(xhr["responseText"])));
          if (ScalaJS.is.s_util_Right(x1)) {
            var x2$1 = ScalaJS.as.s_util_Right(x1);
            var e$1 = ScalaJS.as.Lcom_repocad_web_parsing_Expr(x2$1.b$2);
            return ScalaJS.m.Lcom_repocad_web_evaluating_Evaluator().eval__Lcom_repocad_web_parsing_Expr__sci_Map__Lcom_repocad_web_Printer__s_util_Either(e$1, env$1$5, printer$1$5)
          } else if (ScalaJS.is.s_util_Left(x1)) {
            var x3$1 = ScalaJS.as.s_util_Left(x1);
            var error = ScalaJS.as.T(x3$1.a$2);
            ScalaJS.m.s_package().Left$1;
            var a$1 = new ScalaJS.c.s_StringContext().init___sc_Seq(new ScalaJS.c.sjs_js_WrappedArray().init___sjs_js_Array(["Script ", " failed to compile with error: ", ""])).s__sc_Seq__T(new ScalaJS.c.sjs_js_WrappedArray().init___sjs_js_Array([name$1, error]));
            return new ScalaJS.c.s_util_Left().init___O(a$1)
          } else {
            throw new ScalaJS.c.s_MatchError().init___O(x1)
          }
        })
      })(env, printer, name$2));
      var executor = ScalaJS.m.sjs_concurrent_JSExecutionContext$Implicits().runNow$1;
      var request = ScalaJS.i.s_concurrent_Future$class__map__s_concurrent_Future__F1__s_concurrent_ExecutionContext__s_concurrent_Future(this$38, f, executor);
      request.onComplete__F1__s_concurrent_ExecutionContext__V(new ScalaJS.c.Lcom_repocad_web_evaluating_Evaluator$$anonfun$eval$9().init___(), ScalaJS.m.sjs_concurrent_JSExecutionContext$Implicits().runNow$1);
      ScalaJS.m.s_package().Right$1;
      var y = ScalaJS.m.s_Unit();
      var b$3 = new ScalaJS.c.T2().init___O__O(env, y);
      return new ScalaJS.c.s_util_Right().init___O(b$3)
    };
    if (ScalaJS.is.Lcom_repocad_web_parsing_RangeExpr(expr)) {
      var x12 = ScalaJS.as.Lcom_repocad_web_parsing_RangeExpr(expr);
      var name$3 = x12.name$1;
      var from = x12.from$1;
      var to = x12.to$1;
      var this$42 = env.get__O__s_Option(name$3);
      if (this$42.isEmpty__Z()) {
        var this$46 = ScalaJS.m.s_None()
      } else {
        var x0$1$2 = this$42.get__O();
        if (ScalaJS.isInt(x0$1$2)) {
          var x2$2 = ScalaJS.uI(x0$1$2);
          ScalaJS.m.s_package().Right$1;
          var b$4 = (x2$2 + 1.0);
          var jsx$11 = new ScalaJS.c.s_util_Right().init___O(b$4)
        } else if ((typeof(x0$1$2) === "number")) {
          var x3$2 = ScalaJS.uD(x0$1$2);
          ScalaJS.m.s_package().Right$1;
          var b$5 = (x3$2 + 1);
          var jsx$11 = new ScalaJS.c.s_util_Right().init___O(b$5)
        } else {
          ScalaJS.m.s_package().Left$1;
          var a$3 = new ScalaJS.c.s_StringContext().init___sc_Seq(new ScalaJS.c.sjs_js_WrappedArray().init___sjs_js_Array(["Cannot parse ", " to int"])).s__sc_Seq__T(new ScalaJS.c.sjs_js_WrappedArray().init___sjs_js_Array([x0$1$2]));
          var jsx$11 = new ScalaJS.c.s_util_Left().init___O(a$3)
        };
        var this$46 = new ScalaJS.c.s_Some().init___O(jsx$11)
      };
      var fromOption = ScalaJS.as.s_util_Either((this$46.isEmpty__Z() ? ScalaJS.m.Lcom_repocad_web_evaluating_Evaluator().getValue__Lcom_repocad_web_parsing_Expr__sci_Map__Lcom_repocad_web_Printer__s_util_Either(from, env, printer) : this$46.get__O()));
      var toOption = this.getValue__Lcom_repocad_web_parsing_Expr__sci_Map__Lcom_repocad_web_Printer__s_util_Either(to, env, printer);
      return new ScalaJS.c.s_util_Either$RightProjection().init___s_util_Either(fromOption).flatMap__F1__s_util_Either(new ScalaJS.c.Lcom_repocad_web_evaluating_Evaluator$$anonfun$eval$10().init___sci_Map__T__s_util_Either(env, name$3, toOption))
    };
    if (ScalaJS.is.Lcom_repocad_web_parsing_RefExpr(expr)) {
      rc22 = true;
      x13 = ScalaJS.as.Lcom_repocad_web_parsing_RefExpr(expr);
      if (((x13.params$1 !== null) && (x13.params$1.lengthCompare__I__I(1) === 0))) {
        var name$4 = x13.name$1;
        var params$2 = ScalaJS.as.sc_Seq(x13.params$1.apply__I__O(0));
        var x = env.get__O__s_Option(name$4);
        var this$48 = (x.isEmpty__Z() ? ScalaJS.m.Lcom_repocad_web_evaluating_Evaluator().com$repocad$web$evaluating$Evaluator$$scriptCache$1.get__O__s_Option(name$4) : x);
        var ifEmpty = new ScalaJS.c.sjsr_AnonFunction0().init___sjs_js_Function0((function(name$3$1) {
          return (function() {
            ScalaJS.m.s_package().Left$1;
            var a$4 = new ScalaJS.c.s_StringContext().init___sc_Seq(new ScalaJS.c.sjs_js_WrappedArray().init___sjs_js_Array(["Failed to find function '", "'. Please check if it has been declared."])).s__sc_Seq__T(new ScalaJS.c.sjs_js_WrappedArray().init___sjs_js_Array([name$3$1]));
            return new ScalaJS.c.s_util_Left().init___O(a$4)
          })
        })(name$4));
        var f$1 = new ScalaJS.c.Lcom_repocad_web_evaluating_Evaluator$$anonfun$eval$13().init___sci_Map__Lcom_repocad_web_Printer__sc_Seq(env, printer, params$2);
        if (this$48.isEmpty__Z()) {
          var jsx$12 = ifEmpty.apply__O()
        } else {
          var v1 = this$48.get__O();
          var jsx$12 = f$1.apply__O__s_util_Either(v1)
        };
        return ScalaJS.as.s_util_Either(jsx$12)
      }
    };
    if (rc22) {
      if (((x13.params$1 !== null) && (x13.params$1.lengthCompare__I__I(0) === 0))) {
        var name$5 = x13.name$1;
        var this$49 = env.get__O__s_Option(name$5);
        if (this$49.isEmpty__Z()) {
          ScalaJS.m.s_package().Left$1;
          var a$5 = new ScalaJS.c.s_StringContext().init___sc_Seq(new ScalaJS.c.sjs_js_WrappedArray().init___sjs_js_Array(["Failed to find function '", "'. Please check if it has been declared."])).s__sc_Seq__T(new ScalaJS.c.sjs_js_WrappedArray().init___sjs_js_Array([name$5]));
          var jsx$13 = new ScalaJS.c.s_util_Left().init___O(a$5)
        } else {
          var x$2 = this$49.get__O();
          ScalaJS.m.s_package().Right$1;
          var b$6 = new ScalaJS.c.T2().init___O__O(env, x$2);
          var jsx$13 = new ScalaJS.c.s_util_Right().init___O(b$6)
        };
        return ScalaJS.as.s_util_Either(jsx$13)
      }
    };
    if (ScalaJS.is.Lcom_repocad_web_parsing_SeqExpr(expr)) {
      var x17 = ScalaJS.as.Lcom_repocad_web_parsing_SeqExpr(expr);
      return this.com$repocad$web$evaluating$Evaluator$$foldRecursive$1__sc_Iterator__sci_Map__Lcom_repocad_web_Printer__s_util_Either(x17.expr$1.iterator__sc_Iterator(), env, printer)
    };
    if (ScalaJS.anyRefEqEq(ScalaJS.m.Lcom_repocad_web_parsing_UnitExpr(), expr)) {
      ScalaJS.m.s_package().Right$1;
      var y$1 = ScalaJS.m.s_Unit();
      var b$7 = new ScalaJS.c.T2().init___O__O(env, y$1);
      return new ScalaJS.c.s_util_Right().init___O(b$7)
    };
    if (ScalaJS.is.Lcom_repocad_web_parsing_ValExpr(expr)) {
      var x15 = ScalaJS.as.Lcom_repocad_web_parsing_ValExpr(expr);
      var name$6 = x15.name$1;
      var value$2 = x15.value$1;
      var this$57 = this.eval__Lcom_repocad_web_parsing_Expr__sci_Map__Lcom_repocad_web_Printer__s_util_Either(value$2, env, printer);
      if (ScalaJS.is.s_util_Left(this$57)) {
        var x2$3 = ScalaJS.as.s_util_Left(this$57);
        var a$6 = x2$3.a$2;
        var x$1 = ScalaJS.as.T(a$6);
        ScalaJS.m.s_package().Left$1;
        var jsx$14 = new ScalaJS.c.s_util_Left().init___O(x$1)
      } else if (ScalaJS.is.s_util_Right(this$57)) {
        var x3$3 = ScalaJS.as.s_util_Right(this$57);
        var b$8 = x3$3.b$2;
        var value$1 = ScalaJS.as.T2(b$8);
        ScalaJS.m.s_package().Right$1;
        var y$2 = value$1.$$und2$f;
        var $$this$10 = env.$$plus__T2__sci_Map(new ScalaJS.c.T2().init___O__O(name$6, y$2));
        var y$3 = value$1.$$und2$f;
        var b$9 = new ScalaJS.c.T2().init___O__O($$this$10, y$3);
        var jsx$14 = new ScalaJS.c.s_util_Right().init___O(b$9)
      } else {
        var jsx$14;
        throw new ScalaJS.c.s_MatchError().init___O(this$57)
      };
      return ScalaJS.as.s_util_Either(jsx$14)
    };
    if (ScalaJS.is.Lcom_repocad_web_parsing_LoopExpr(expr)) {
      var x16 = ScalaJS.as.Lcom_repocad_web_parsing_LoopExpr(expr);
      var condition = x16.condition$1;
      var body$2 = x16.body$1;
      if ((condition !== null)) {
        if ((body$2 !== null)) {
          var loopEnv = new ScalaJS.c.sr_ObjectRef().init___O(env);
          var elem = ScalaJS.m.s_Unit();
          var lastResult = new ScalaJS.c.sr_ObjectRef().init___O(elem);
          var elem$1 = ScalaJS.m.s_None();
          var elem$1$1 = null;
          elem$1$1 = elem$1;
          while (true) {
            if (ScalaJS.as.s_Option(elem$1$1).isEmpty__Z()) {
              var this$67 = this.eval__Lcom_repocad_web_parsing_Expr__sci_Map__Lcom_repocad_web_Printer__s_util_Either(condition, ScalaJS.as.sci_Map(loopEnv.elem$1), printer);
              if (ScalaJS.is.s_util_Left(this$67)) {
                var x2$4 = ScalaJS.as.s_util_Left(this$67);
                var a$7 = x2$4.a$2;
                var error$1 = ScalaJS.as.T(a$7);
                elem$1$1 = new ScalaJS.c.s_Some().init___O(error$1);
                var jsx$15 = false
              } else if (ScalaJS.is.s_util_Right(this$67)) {
                var x3$4 = ScalaJS.as.s_util_Right(this$67);
                var b$10 = x3$4.b$2;
                var v = ScalaJS.as.T2(b$10);
                loopEnv.elem$1 = ScalaJS.as.sci_Map(v.$$und1$f);
                var jsx$15 = ScalaJS.uZ(v.$$und2$f)
              } else {
                var jsx$15;
                throw new ScalaJS.c.s_MatchError().init___O(this$67)
              }
            } else {
              var jsx$15 = false
            };
            if (jsx$15) {
              var this$68 = this.eval__Lcom_repocad_web_parsing_Expr__sci_Map__Lcom_repocad_web_Printer__s_util_Either(body$2, ScalaJS.as.sci_Map(loopEnv.elem$1), printer);
              if (ScalaJS.is.s_util_Left(this$68)) {
                var x2$5 = ScalaJS.as.s_util_Left(this$68);
                var a$8 = x2$5.a$2;
                var s = ScalaJS.as.T(a$8);
                elem$1$1 = new ScalaJS.c.s_Some().init___O(s)
              } else if (ScalaJS.is.s_util_Right(this$68)) {
                var x3$5 = ScalaJS.as.s_util_Right(this$68);
                var b$11 = x3$5.b$2;
                var x$3 = ScalaJS.as.T2(b$11);
                lastResult.elem$1 = x$3.$$und2$f;
                loopEnv.elem$1 = ScalaJS.as.sci_Map(x$3.$$und1$f)
              } else {
                throw new ScalaJS.c.s_MatchError().init___O(this$68)
              }
            } else {
              break
            }
          };
          var this$69 = ScalaJS.as.s_Option(elem$1$1);
          if (this$69.isEmpty__Z()) {
            var this$71 = ScalaJS.m.s_None()
          } else {
            var x$2$2 = this$69.get__O();
            var x$2$1 = ScalaJS.as.T(x$2$2);
            ScalaJS.m.s_package().Left$1;
            var this$71 = new ScalaJS.c.s_Some().init___O(new ScalaJS.c.s_util_Left().init___O(x$2$1))
          };
          var default$2 = new ScalaJS.c.Lcom_repocad_web_evaluating_Evaluator$$anonfun$eval$21().init___sci_Map__sr_ObjectRef__sr_ObjectRef(env, loopEnv, lastResult);
          return ScalaJS.as.s_util_Either((this$71.isEmpty__Z() ? default$2.apply__s_util_Right() : this$71.get__O()))
        }
      }
    };
    ScalaJS.m.s_package().Left$1;
    var a$9 = new ScalaJS.c.s_StringContext().init___sc_Seq(new ScalaJS.c.sjs_js_WrappedArray().init___sjs_js_Array(["Unknown expression ", ""])).s__sc_Seq__T(new ScalaJS.c.sjs_js_WrappedArray().init___sjs_js_Array([expr]));
    return new ScalaJS.c.s_util_Left().init___O(a$9)
  } catch (ex) {
    ex = ScalaJS.wrapJavaScriptException(ex);
    if (ScalaJS.is.jl_Exception(ex)) {
      var e$3 = ex;
      ScalaJS.m.s_package().Left$1;
      var a$10 = new ScalaJS.c.s_StringContext().init___sc_Seq(new ScalaJS.c.sjs_js_WrappedArray().init___sjs_js_Array(["Failure when evaluating script: ", ""])).s__sc_Seq__T(new ScalaJS.c.sjs_js_WrappedArray().init___sjs_js_Array([e$3.getMessage__T()]));
      return new ScalaJS.c.s_util_Left().init___O(a$10)
    } else {
      throw ScalaJS.unwrapJavaScriptException(ex)
    }
  }
});
ScalaJS.c.Lcom_repocad_web_evaluating_Evaluator$.prototype.getValue__Lcom_repocad_web_parsing_Expr__sci_Map__Lcom_repocad_web_Printer__s_util_Either = (function(expr, env, printer) {
  var rc10 = false;
  var x2 = null;
  var x1 = this.eval__Lcom_repocad_web_parsing_Expr__sci_Map__Lcom_repocad_web_Printer__s_util_Either(expr, env, printer);
  if (ScalaJS.is.s_util_Right(x1)) {
    rc10 = true;
    x2 = ScalaJS.as.s_util_Right(x1);
    var p3 = ScalaJS.as.T2(x2.b$2);
    if ((p3 !== null)) {
      var t = p3.$$und2$f;
      if (ScalaJS.isInt(t)) {
        ScalaJS.m.s_package().Right$1;
        var b = ScalaJS.uI(t);
        return new ScalaJS.c.s_util_Right().init___O(b)
      }
    }
  };
  if (rc10) {
    var p6 = ScalaJS.as.T2(x2.b$2);
    if ((p6 !== null)) {
      var t$2 = p6.$$und2$f;
      if ((t$2 !== null)) {
        return (ScalaJS.m.s_package().Right$1, new ScalaJS.c.s_util_Right().init___O(t$2))
      }
    }
  };
  ScalaJS.m.s_package().Left$1;
  var a = new ScalaJS.c.s_StringContext().init___sc_Seq(new ScalaJS.c.sjs_js_WrappedArray().init___sjs_js_Array(["Failed to read value from ", ", failed with: ", ""])).s__sc_Seq__T(new ScalaJS.c.sjs_js_WrappedArray().init___sjs_js_Array([expr, x1]));
  return new ScalaJS.c.s_util_Left().init___O(a)
});
ScalaJS.c.Lcom_repocad_web_evaluating_Evaluator$.prototype.resetBoundingBox__V = (function() {
  this.maxX$1 = ScalaJS.m.s_None();
  this.minX$1 = ScalaJS.m.s_None();
  this.maxY$1 = ScalaJS.m.s_None();
  this.minY$1 = ScalaJS.m.s_None()
});
ScalaJS.c.Lcom_repocad_web_evaluating_Evaluator$.prototype.updateBoundingBox__D__D__Lcom_repocad_web_Vector2D = (function(x, y) {
  if ((((this.minX$1.isDefined__Z() && this.maxX$1.isDefined__Z()) && this.minY$1.isDefined__Z()) && this.maxY$1.isDefined__Z())) {
    if ((x >= ScalaJS.uD(this.maxX$1.get__O()))) {
      this.maxX$1 = new ScalaJS.c.s_Some().init___O(x)
    };
    if ((x <= ScalaJS.uD(this.minX$1.get__O()))) {
      this.minX$1 = new ScalaJS.c.s_Some().init___O(x)
    };
    if ((y >= ScalaJS.uD(this.maxY$1.get__O()))) {
      this.maxY$1 = new ScalaJS.c.s_Some().init___O(y)
    };
    if ((y <= ScalaJS.uD(this.minY$1.get__O()))) {
      this.minY$1 = new ScalaJS.c.s_Some().init___O(y)
    }
  } else {
    this.maxX$1 = new ScalaJS.c.s_Some().init___O((x + 1));
    this.minX$1 = new ScalaJS.c.s_Some().init___O((x - 1));
    this.maxY$1 = new ScalaJS.c.s_Some().init___O((y + 1));
    this.minY$1 = new ScalaJS.c.s_Some().init___O((y - 1))
  };
  var cX = (ScalaJS.uD(this.minX$1.get__O()) + ((ScalaJS.uD(this.maxX$1.get__O()) - ScalaJS.uD(this.minX$1.get__O())) / 2));
  var cY = (ScalaJS.uD(this.minY$1.get__O()) + ((ScalaJS.uD(this.maxY$1.get__O()) - ScalaJS.uD(this.minY$1.get__O())) / 2));
  return new ScalaJS.c.Lcom_repocad_web_Vector2D().init___D__D(cX, cY)
});
ScalaJS.is.Lcom_repocad_web_evaluating_Evaluator$ = (function(obj) {
  return (!(!((obj && obj.$classData) && obj.$classData.ancestors.Lcom_repocad_web_evaluating_Evaluator$)))
});
ScalaJS.as.Lcom_repocad_web_evaluating_Evaluator$ = (function(obj) {
  return ((ScalaJS.is.Lcom_repocad_web_evaluating_Evaluator$(obj) || (obj === null)) ? obj : ScalaJS.throwClassCastException(obj, "com.repocad.web.evaluating.Evaluator$"))
});
ScalaJS.isArrayOf.Lcom_repocad_web_evaluating_Evaluator$ = (function(obj, depth) {
  return (!(!(((obj && obj.$classData) && (obj.$classData.arrayDepth === depth)) && obj.$classData.arrayBase.ancestors.Lcom_repocad_web_evaluating_Evaluator$)))
});
ScalaJS.asArrayOf.Lcom_repocad_web_evaluating_Evaluator$ = (function(obj, depth) {
  return ((ScalaJS.isArrayOf.Lcom_repocad_web_evaluating_Evaluator$(obj, depth) || (obj === null)) ? obj : ScalaJS.throwArrayCastException(obj, "Lcom.repocad.web.evaluating.Evaluator$;", depth))
});
ScalaJS.d.Lcom_repocad_web_evaluating_Evaluator$ = new ScalaJS.ClassTypeData({
  Lcom_repocad_web_evaluating_Evaluator$: 0
}, false, "com.repocad.web.evaluating.Evaluator$", ScalaJS.d.O, {
  Lcom_repocad_web_evaluating_Evaluator$: 1,
  O: 1
});
ScalaJS.c.Lcom_repocad_web_evaluating_Evaluator$.prototype.$classData = ScalaJS.d.Lcom_repocad_web_evaluating_Evaluator$;
ScalaJS.n.Lcom_repocad_web_evaluating_Evaluator = (void 0);
ScalaJS.m.Lcom_repocad_web_evaluating_Evaluator = (function() {
  if ((!ScalaJS.n.Lcom_repocad_web_evaluating_Evaluator)) {
    ScalaJS.n.Lcom_repocad_web_evaluating_Evaluator = new ScalaJS.c.Lcom_repocad_web_evaluating_Evaluator$().init___()
  };
  return ScalaJS.n.Lcom_repocad_web_evaluating_Evaluator
});
/** @constructor */
ScalaJS.c.Lcom_repocad_web_lexing_$colon$tilde$colon$ = (function() {
  ScalaJS.c.O.call(this)
});
ScalaJS.c.Lcom_repocad_web_lexing_$colon$tilde$colon$.prototype = new ScalaJS.h.O();
ScalaJS.c.Lcom_repocad_web_lexing_$colon$tilde$colon$.prototype.constructor = ScalaJS.c.Lcom_repocad_web_lexing_$colon$tilde$colon$;
/** @constructor */
ScalaJS.h.Lcom_repocad_web_lexing_$colon$tilde$colon$ = (function() {
  /*<skip>*/
});
ScalaJS.h.Lcom_repocad_web_lexing_$colon$tilde$colon$.prototype = ScalaJS.c.Lcom_repocad_web_lexing_$colon$tilde$colon$.prototype;
ScalaJS.c.Lcom_repocad_web_lexing_$colon$tilde$colon$.prototype.unapply__Lcom_repocad_web_lexing_LiveStream__s_Option = (function(stream) {
  if (stream.isPlugged__Z()) {
    return ScalaJS.m.s_None()
  } else {
    var $$this = stream.head__O();
    var y = stream.tail__Lcom_repocad_web_lexing_LiveStream();
    return new ScalaJS.c.s_Some().init___O(new ScalaJS.c.T2().init___O__O($$this, y))
  }
});
ScalaJS.is.Lcom_repocad_web_lexing_$colon$tilde$colon$ = (function(obj) {
  return (!(!((obj && obj.$classData) && obj.$classData.ancestors.Lcom_repocad_web_lexing_$colon$tilde$colon$)))
});
ScalaJS.as.Lcom_repocad_web_lexing_$colon$tilde$colon$ = (function(obj) {
  return ((ScalaJS.is.Lcom_repocad_web_lexing_$colon$tilde$colon$(obj) || (obj === null)) ? obj : ScalaJS.throwClassCastException(obj, "com.repocad.web.lexing.$colon$tilde$colon$"))
});
ScalaJS.isArrayOf.Lcom_repocad_web_lexing_$colon$tilde$colon$ = (function(obj, depth) {
  return (!(!(((obj && obj.$classData) && (obj.$classData.arrayDepth === depth)) && obj.$classData.arrayBase.ancestors.Lcom_repocad_web_lexing_$colon$tilde$colon$)))
});
ScalaJS.asArrayOf.Lcom_repocad_web_lexing_$colon$tilde$colon$ = (function(obj, depth) {
  return ((ScalaJS.isArrayOf.Lcom_repocad_web_lexing_$colon$tilde$colon$(obj, depth) || (obj === null)) ? obj : ScalaJS.throwArrayCastException(obj, "Lcom.repocad.web.lexing.$colon$tilde$colon$;", depth))
});
ScalaJS.d.Lcom_repocad_web_lexing_$colon$tilde$colon$ = new ScalaJS.ClassTypeData({
  Lcom_repocad_web_lexing_$colon$tilde$colon$: 0
}, false, "com.repocad.web.lexing.$colon$tilde$colon$", ScalaJS.d.O, {
  Lcom_repocad_web_lexing_$colon$tilde$colon$: 1,
  O: 1
});
ScalaJS.c.Lcom_repocad_web_lexing_$colon$tilde$colon$.prototype.$classData = ScalaJS.d.Lcom_repocad_web_lexing_$colon$tilde$colon$;
ScalaJS.n.Lcom_repocad_web_lexing_$colon$tilde$colon = (void 0);
ScalaJS.m.Lcom_repocad_web_lexing_$colon$tilde$colon = (function() {
  if ((!ScalaJS.n.Lcom_repocad_web_lexing_$colon$tilde$colon)) {
    ScalaJS.n.Lcom_repocad_web_lexing_$colon$tilde$colon = new ScalaJS.c.Lcom_repocad_web_lexing_$colon$tilde$colon$().init___()
  };
  return ScalaJS.n.Lcom_repocad_web_lexing_$colon$tilde$colon
});
/** @constructor */
ScalaJS.c.Lcom_repocad_web_lexing_CharRangeSet = (function() {
  ScalaJS.c.O.call(this);
  this.com$repocad$web$lexing$CharRangeSet$$start$f = 0;
  this.com$repocad$web$lexing$CharRangeSet$$end$f = 0
});
ScalaJS.c.Lcom_repocad_web_lexing_CharRangeSet.prototype = new ScalaJS.h.O();
ScalaJS.c.Lcom_repocad_web_lexing_CharRangeSet.prototype.constructor = ScalaJS.c.Lcom_repocad_web_lexing_CharRangeSet;
/** @constructor */
ScalaJS.h.Lcom_repocad_web_lexing_CharRangeSet = (function() {
  /*<skip>*/
});
ScalaJS.h.Lcom_repocad_web_lexing_CharRangeSet.prototype = ScalaJS.c.Lcom_repocad_web_lexing_CharRangeSet.prototype;
ScalaJS.c.Lcom_repocad_web_lexing_CharRangeSet.prototype.copyToArray__O__I__V = (function(xs, start) {
  ScalaJS.i.sc_TraversableOnce$class__copyToArray__sc_TraversableOnce__O__I__V(this, xs, start)
});
ScalaJS.c.Lcom_repocad_web_lexing_CharRangeSet.prototype.seq__sc_TraversableOnce = (function() {
  return this
});
ScalaJS.c.Lcom_repocad_web_lexing_CharRangeSet.prototype.apply__O__O = (function(v1) {
  return this.contains__C__Z(ScalaJS.uC(v1))
});
ScalaJS.c.Lcom_repocad_web_lexing_CharRangeSet.prototype.isEmpty__Z = (function() {
  return ScalaJS.i.sc_SetLike$class__isEmpty__sc_SetLike__Z(this)
});
ScalaJS.c.Lcom_repocad_web_lexing_CharRangeSet.prototype.toList__sci_List = (function() {
  var this$1 = ScalaJS.m.sci_List();
  var cbf = this$1.ReusableCBFInstance$2;
  return ScalaJS.as.sci_List(ScalaJS.i.sc_TraversableLike$class__to__sc_TraversableLike__scg_CanBuildFrom__O(this, cbf))
});
ScalaJS.c.Lcom_repocad_web_lexing_CharRangeSet.prototype.thisCollection__sc_Traversable = (function() {
  return this
});
ScalaJS.c.Lcom_repocad_web_lexing_CharRangeSet.prototype.equals__O__Z = (function(that) {
  return ScalaJS.i.sc_GenSetLike$class__equals__sc_GenSetLike__O__Z(this, that)
});
ScalaJS.c.Lcom_repocad_web_lexing_CharRangeSet.prototype.mkString__T__T__T__T = (function(start, sep, end) {
  return ScalaJS.i.sc_TraversableOnce$class__mkString__sc_TraversableOnce__T__T__T__T(this, start, sep, end)
});
ScalaJS.c.Lcom_repocad_web_lexing_CharRangeSet.prototype.companion__scg_GenericCompanion = (function() {
  return ScalaJS.m.sci_Set()
});
ScalaJS.c.Lcom_repocad_web_lexing_CharRangeSet.prototype.toString__T = (function() {
  return ScalaJS.i.sc_TraversableLike$class__toString__sc_TraversableLike__T(this)
});
ScalaJS.c.Lcom_repocad_web_lexing_CharRangeSet.prototype.foreach__F1__V = (function(f) {
  var this$1 = new ScalaJS.c.Lcom_repocad_web_lexing_CharRangeSet$$anon$1().init___Lcom_repocad_web_lexing_CharRangeSet(this);
  ScalaJS.i.sc_Iterator$class__foreach__sc_Iterator__F1__V(this$1, f)
});
ScalaJS.c.Lcom_repocad_web_lexing_CharRangeSet.prototype.subsetOf__sc_GenSet__Z = (function(that) {
  var this$1 = new ScalaJS.c.Lcom_repocad_web_lexing_CharRangeSet$$anon$1().init___Lcom_repocad_web_lexing_CharRangeSet(this);
  return ScalaJS.i.sc_Iterator$class__forall__sc_Iterator__F1__Z(this$1, that)
});
ScalaJS.c.Lcom_repocad_web_lexing_CharRangeSet.prototype.init___C__C = (function(start, end) {
  this.com$repocad$web$lexing$CharRangeSet$$start$f = start;
  this.com$repocad$web$lexing$CharRangeSet$$end$f = end;
  return this
});
ScalaJS.c.Lcom_repocad_web_lexing_CharRangeSet.prototype.filter__F1__O = (function(p) {
  return ScalaJS.i.sc_TraversableLike$class__filterImpl__sc_TraversableLike__F1__Z__O(this, p, false)
});
ScalaJS.c.Lcom_repocad_web_lexing_CharRangeSet.prototype.toBuffer__scm_Buffer = (function() {
  return ScalaJS.i.sc_SetLike$class__toBuffer__sc_SetLike__scm_Buffer(this)
});
ScalaJS.c.Lcom_repocad_web_lexing_CharRangeSet.prototype.size__I = (function() {
  return ((this.com$repocad$web$lexing$CharRangeSet$$end$f - this.com$repocad$web$lexing$CharRangeSet$$start$f) | 0)
});
ScalaJS.c.Lcom_repocad_web_lexing_CharRangeSet.prototype.iterator__sc_Iterator = (function() {
  return new ScalaJS.c.Lcom_repocad_web_lexing_CharRangeSet$$anon$1().init___Lcom_repocad_web_lexing_CharRangeSet(this)
});
ScalaJS.c.Lcom_repocad_web_lexing_CharRangeSet.prototype.$$plus__C__sci_Set = (function(c) {
  throw ScalaJS.unwrapJavaScriptException(new ScalaJS.c.jl_Exception().init___T("Can't add to a CharRangeSet!"))
});
ScalaJS.c.Lcom_repocad_web_lexing_CharRangeSet.prototype.toStream__sci_Stream = (function() {
  var this$1 = new ScalaJS.c.Lcom_repocad_web_lexing_CharRangeSet$$anon$1().init___Lcom_repocad_web_lexing_CharRangeSet(this);
  return ScalaJS.i.sc_Iterator$class__toStream__sc_Iterator__sci_Stream(this$1)
});
ScalaJS.c.Lcom_repocad_web_lexing_CharRangeSet.prototype.contains__O__Z = (function(elem) {
  return this.contains__C__Z(ScalaJS.uC(elem))
});
ScalaJS.c.Lcom_repocad_web_lexing_CharRangeSet.prototype.addString__scm_StringBuilder__T__T__T__scm_StringBuilder = (function(b, start, sep, end) {
  return ScalaJS.i.sc_TraversableOnce$class__addString__sc_TraversableOnce__scm_StringBuilder__T__T__T__scm_StringBuilder(this, b, start, sep, end)
});
ScalaJS.c.Lcom_repocad_web_lexing_CharRangeSet.prototype.repr__O = (function() {
  return this
});
ScalaJS.c.Lcom_repocad_web_lexing_CharRangeSet.prototype.$$div$colon__O__F2__O = (function(z, op) {
  return ScalaJS.i.sc_TraversableOnce$class__foldLeft__sc_TraversableOnce__O__F2__O(this, z, op)
});
ScalaJS.c.Lcom_repocad_web_lexing_CharRangeSet.prototype.copyToArray__O__I__I__V = (function(xs, start, len) {
  ScalaJS.i.sc_IterableLike$class__copyToArray__sc_IterableLike__O__I__I__V(this, xs, start, len)
});
ScalaJS.c.Lcom_repocad_web_lexing_CharRangeSet.prototype.isTraversableAgain__Z = (function() {
  return true
});
ScalaJS.c.Lcom_repocad_web_lexing_CharRangeSet.prototype.hashCode__I = (function() {
  var this$1 = ScalaJS.m.s_util_hashing_MurmurHash3();
  return this$1.unorderedHash__sc_TraversableOnce__I__I(this, this$1.setSeed$2)
});
ScalaJS.c.Lcom_repocad_web_lexing_CharRangeSet.prototype.toArray__s_reflect_ClassTag__O = (function(evidence$1) {
  return ScalaJS.i.sc_TraversableOnce$class__toArray__sc_TraversableOnce__s_reflect_ClassTag__O(this, evidence$1)
});
ScalaJS.c.Lcom_repocad_web_lexing_CharRangeSet.prototype.contains__C__Z = (function(c) {
  return ((this.com$repocad$web$lexing$CharRangeSet$$start$f <= c) && (c <= this.com$repocad$web$lexing$CharRangeSet$$end$f))
});
ScalaJS.c.Lcom_repocad_web_lexing_CharRangeSet.prototype.$$plus__O__sc_Set = (function(elem) {
  return this.$$plus__C__sci_Set(ScalaJS.uC(elem))
});
ScalaJS.c.Lcom_repocad_web_lexing_CharRangeSet.prototype.$$plus$plus__sc_GenTraversableOnce__sc_Set = (function(elems) {
  return ScalaJS.i.sc_SetLike$class__$plus$plus__sc_SetLike__sc_GenTraversableOnce__sc_Set(this, elems)
});
ScalaJS.c.Lcom_repocad_web_lexing_CharRangeSet.prototype.newBuilder__scm_Builder = (function() {
  return new ScalaJS.c.scm_SetBuilder().init___sc_Set(ScalaJS.m.sci_Set$EmptySet())
});
ScalaJS.c.Lcom_repocad_web_lexing_CharRangeSet.prototype.stringPrefix__T = (function() {
  return "Set"
});
ScalaJS.is.Lcom_repocad_web_lexing_CharRangeSet = (function(obj) {
  return (!(!((obj && obj.$classData) && obj.$classData.ancestors.Lcom_repocad_web_lexing_CharRangeSet)))
});
ScalaJS.as.Lcom_repocad_web_lexing_CharRangeSet = (function(obj) {
  return ((ScalaJS.is.Lcom_repocad_web_lexing_CharRangeSet(obj) || (obj === null)) ? obj : ScalaJS.throwClassCastException(obj, "com.repocad.web.lexing.CharRangeSet"))
});
ScalaJS.isArrayOf.Lcom_repocad_web_lexing_CharRangeSet = (function(obj, depth) {
  return (!(!(((obj && obj.$classData) && (obj.$classData.arrayDepth === depth)) && obj.$classData.arrayBase.ancestors.Lcom_repocad_web_lexing_CharRangeSet)))
});
ScalaJS.asArrayOf.Lcom_repocad_web_lexing_CharRangeSet = (function(obj, depth) {
  return ((ScalaJS.isArrayOf.Lcom_repocad_web_lexing_CharRangeSet(obj, depth) || (obj === null)) ? obj : ScalaJS.throwArrayCastException(obj, "Lcom.repocad.web.lexing.CharRangeSet;", depth))
});
ScalaJS.d.Lcom_repocad_web_lexing_CharRangeSet = new ScalaJS.ClassTypeData({
  Lcom_repocad_web_lexing_CharRangeSet: 0
}, false, "com.repocad.web.lexing.CharRangeSet", ScalaJS.d.O, {
  Lcom_repocad_web_lexing_CharRangeSet: 1,
  sci_Set: 1,
  sc_Set: 1,
  sc_SetLike: 1,
  scg_Subtractable: 1,
  sc_GenSet: 1,
  scg_GenericSetTemplate: 1,
  sc_GenSetLike: 1,
  F1: 1,
  sci_Iterable: 1,
  sc_Iterable: 1,
  sc_IterableLike: 1,
  s_Equals: 1,
  sc_GenIterable: 1,
  sc_GenIterableLike: 1,
  sci_Traversable: 1,
  s_Immutable: 1,
  sc_Traversable: 1,
  sc_GenTraversable: 1,
  scg_GenericTraversableTemplate: 1,
  sc_TraversableLike: 1,
  sc_GenTraversableLike: 1,
  sc_Parallelizable: 1,
  sc_TraversableOnce: 1,
  sc_GenTraversableOnce: 1,
  scg_FilterMonadic: 1,
  scg_HasNewBuilder: 1,
  O: 1
});
ScalaJS.c.Lcom_repocad_web_lexing_CharRangeSet.prototype.$classData = ScalaJS.d.Lcom_repocad_web_lexing_CharRangeSet;
/** @constructor */
ScalaJS.c.Lcom_repocad_web_lexing_CharRangeSet$$anon$1 = (function() {
  ScalaJS.c.O.call(this);
  this.current$1 = 0;
  this.last$1 = 0
});
ScalaJS.c.Lcom_repocad_web_lexing_CharRangeSet$$anon$1.prototype = new ScalaJS.h.O();
ScalaJS.c.Lcom_repocad_web_lexing_CharRangeSet$$anon$1.prototype.constructor = ScalaJS.c.Lcom_repocad_web_lexing_CharRangeSet$$anon$1;
/** @constructor */
ScalaJS.h.Lcom_repocad_web_lexing_CharRangeSet$$anon$1 = (function() {
  /*<skip>*/
});
ScalaJS.h.Lcom_repocad_web_lexing_CharRangeSet$$anon$1.prototype = ScalaJS.c.Lcom_repocad_web_lexing_CharRangeSet$$anon$1.prototype;
ScalaJS.c.Lcom_repocad_web_lexing_CharRangeSet$$anon$1.prototype.next__O = (function() {
  return ScalaJS.bC(this.next__C())
});
ScalaJS.c.Lcom_repocad_web_lexing_CharRangeSet$$anon$1.prototype.seq__sc_TraversableOnce = (function() {
  return this
});
ScalaJS.c.Lcom_repocad_web_lexing_CharRangeSet$$anon$1.prototype.copyToArray__O__I__V = (function(xs, start) {
  ScalaJS.i.sc_TraversableOnce$class__copyToArray__sc_TraversableOnce__O__I__V(this, xs, start)
});
ScalaJS.c.Lcom_repocad_web_lexing_CharRangeSet$$anon$1.prototype.isEmpty__Z = (function() {
  return ScalaJS.i.sc_Iterator$class__isEmpty__sc_Iterator__Z(this)
});
ScalaJS.c.Lcom_repocad_web_lexing_CharRangeSet$$anon$1.prototype.toList__sci_List = (function() {
  var this$1 = ScalaJS.m.sci_List();
  var cbf = this$1.ReusableCBFInstance$2;
  return ScalaJS.as.sci_List(ScalaJS.i.sc_TraversableOnce$class__to__sc_TraversableOnce__scg_CanBuildFrom__O(this, cbf))
});
ScalaJS.c.Lcom_repocad_web_lexing_CharRangeSet$$anon$1.prototype.next__C = (function() {
  if (this.hasNext__Z()) {
    var ret = this.current$1;
    this.current$1 = ((this.current$1 + 1) | 0);
    return (ret & 65535)
  } else {
    throw new ScalaJS.c.ju_NoSuchElementException().init___()
  }
});
ScalaJS.c.Lcom_repocad_web_lexing_CharRangeSet$$anon$1.prototype.init___Lcom_repocad_web_lexing_CharRangeSet = (function($$outer) {
  this.current$1 = $$outer.com$repocad$web$lexing$CharRangeSet$$start$f;
  this.last$1 = $$outer.com$repocad$web$lexing$CharRangeSet$$end$f;
  return this
});
ScalaJS.c.Lcom_repocad_web_lexing_CharRangeSet$$anon$1.prototype.toString__T = (function() {
  return ScalaJS.i.sc_Iterator$class__toString__sc_Iterator__T(this)
});
ScalaJS.c.Lcom_repocad_web_lexing_CharRangeSet$$anon$1.prototype.foreach__F1__V = (function(f) {
  ScalaJS.i.sc_Iterator$class__foreach__sc_Iterator__F1__V(this, f)
});
ScalaJS.c.Lcom_repocad_web_lexing_CharRangeSet$$anon$1.prototype.size__I = (function() {
  return ScalaJS.i.sc_TraversableOnce$class__size__sc_TraversableOnce__I(this)
});
ScalaJS.c.Lcom_repocad_web_lexing_CharRangeSet$$anon$1.prototype.toBuffer__scm_Buffer = (function() {
  var this$1 = ScalaJS.m.scm_ArrayBuffer();
  var cbf = this$1.ReusableCBFInstance$2;
  return ScalaJS.as.scm_Buffer(ScalaJS.i.sc_TraversableOnce$class__to__sc_TraversableOnce__scg_CanBuildFrom__O(this, cbf))
});
ScalaJS.c.Lcom_repocad_web_lexing_CharRangeSet$$anon$1.prototype.hasNext__Z = (function() {
  return (this.current$1 <= this.last$1)
});
ScalaJS.c.Lcom_repocad_web_lexing_CharRangeSet$$anon$1.prototype.toStream__sci_Stream = (function() {
  return ScalaJS.i.sc_Iterator$class__toStream__sc_Iterator__sci_Stream(this)
});
ScalaJS.c.Lcom_repocad_web_lexing_CharRangeSet$$anon$1.prototype.addString__scm_StringBuilder__T__T__T__scm_StringBuilder = (function(b, start, sep, end) {
  return ScalaJS.i.sc_TraversableOnce$class__addString__sc_TraversableOnce__scm_StringBuilder__T__T__T__scm_StringBuilder(this, b, start, sep, end)
});
ScalaJS.c.Lcom_repocad_web_lexing_CharRangeSet$$anon$1.prototype.$$div$colon__O__F2__O = (function(z, op) {
  return ScalaJS.i.sc_TraversableOnce$class__foldLeft__sc_TraversableOnce__O__F2__O(this, z, op)
});
ScalaJS.c.Lcom_repocad_web_lexing_CharRangeSet$$anon$1.prototype.copyToArray__O__I__I__V = (function(xs, start, len) {
  ScalaJS.i.sc_Iterator$class__copyToArray__sc_Iterator__O__I__I__V(this, xs, start, len)
});
ScalaJS.c.Lcom_repocad_web_lexing_CharRangeSet$$anon$1.prototype.isTraversableAgain__Z = (function() {
  return false
});
ScalaJS.c.Lcom_repocad_web_lexing_CharRangeSet$$anon$1.prototype.toArray__s_reflect_ClassTag__O = (function(evidence$1) {
  return ScalaJS.i.sc_TraversableOnce$class__toArray__sc_TraversableOnce__s_reflect_ClassTag__O(this, evidence$1)
});
ScalaJS.is.Lcom_repocad_web_lexing_CharRangeSet$$anon$1 = (function(obj) {
  return (!(!((obj && obj.$classData) && obj.$classData.ancestors.Lcom_repocad_web_lexing_CharRangeSet$$anon$1)))
});
ScalaJS.as.Lcom_repocad_web_lexing_CharRangeSet$$anon$1 = (function(obj) {
  return ((ScalaJS.is.Lcom_repocad_web_lexing_CharRangeSet$$anon$1(obj) || (obj === null)) ? obj : ScalaJS.throwClassCastException(obj, "com.repocad.web.lexing.CharRangeSet$$anon$1"))
});
ScalaJS.isArrayOf.Lcom_repocad_web_lexing_CharRangeSet$$anon$1 = (function(obj, depth) {
  return (!(!(((obj && obj.$classData) && (obj.$classData.arrayDepth === depth)) && obj.$classData.arrayBase.ancestors.Lcom_repocad_web_lexing_CharRangeSet$$anon$1)))
});
ScalaJS.asArrayOf.Lcom_repocad_web_lexing_CharRangeSet$$anon$1 = (function(obj, depth) {
  return ((ScalaJS.isArrayOf.Lcom_repocad_web_lexing_CharRangeSet$$anon$1(obj, depth) || (obj === null)) ? obj : ScalaJS.throwArrayCastException(obj, "Lcom.repocad.web.lexing.CharRangeSet$$anon$1;", depth))
});
ScalaJS.d.Lcom_repocad_web_lexing_CharRangeSet$$anon$1 = new ScalaJS.ClassTypeData({
  Lcom_repocad_web_lexing_CharRangeSet$$anon$1: 0
}, false, "com.repocad.web.lexing.CharRangeSet$$anon$1", ScalaJS.d.O, {
  Lcom_repocad_web_lexing_CharRangeSet$$anon$1: 1,
  sc_Iterator: 1,
  sc_TraversableOnce: 1,
  sc_GenTraversableOnce: 1,
  O: 1
});
ScalaJS.c.Lcom_repocad_web_lexing_CharRangeSet$$anon$1.prototype.$classData = ScalaJS.d.Lcom_repocad_web_lexing_CharRangeSet$$anon$1;
/** @constructor */
ScalaJS.c.Lcom_repocad_web_lexing_CharToken = (function() {
  ScalaJS.c.O.call(this);
  this.c$1 = 0;
  this.tag$1 = null;
  this.hashCode$1 = 0;
  this.toString$1 = null;
  this.class$1 = null;
  this.bitmap$0$1 = 0
});
ScalaJS.c.Lcom_repocad_web_lexing_CharToken.prototype = new ScalaJS.h.O();
ScalaJS.c.Lcom_repocad_web_lexing_CharToken.prototype.constructor = ScalaJS.c.Lcom_repocad_web_lexing_CharToken;
/** @constructor */
ScalaJS.h.Lcom_repocad_web_lexing_CharToken = (function() {
  /*<skip>*/
});
ScalaJS.h.Lcom_repocad_web_lexing_CharToken.prototype = ScalaJS.c.Lcom_repocad_web_lexing_CharToken.prototype;
ScalaJS.c.Lcom_repocad_web_lexing_CharToken.prototype.productPrefix__T = (function() {
  return "CharToken"
});
ScalaJS.c.Lcom_repocad_web_lexing_CharToken.prototype.tag__O = (function() {
  return this.tag$1
});
ScalaJS.c.Lcom_repocad_web_lexing_CharToken.prototype.productArity__I = (function() {
  return 1
});
ScalaJS.c.Lcom_repocad_web_lexing_CharToken.prototype.equals__O__Z = (function(x$1) {
  if ((this === x$1)) {
    return true
  } else if (ScalaJS.is.Lcom_repocad_web_lexing_CharToken(x$1)) {
    var CharToken$1 = ScalaJS.as.Lcom_repocad_web_lexing_CharToken(x$1);
    return (this.c$1 === CharToken$1.c$1)
  } else {
    return false
  }
});
ScalaJS.c.Lcom_repocad_web_lexing_CharToken.prototype.productElement__I__O = (function(x$1) {
  switch (x$1) {
    case 0:
      {
        return ScalaJS.bC(this.c$1);
        break
      };
    default:
      throw new ScalaJS.c.jl_IndexOutOfBoundsException().init___T(ScalaJS.objectToString(x$1));
  }
});
ScalaJS.c.Lcom_repocad_web_lexing_CharToken.prototype.hashCode$lzycompute__p1__I = (function() {
  if (((this.bitmap$0$1 & 1) === 0)) {
    this.hashCode$1 = ScalaJS.objectHashCode(ScalaJS.bC(this.c$1));
    this.bitmap$0$1 = (this.bitmap$0$1 | 1)
  };
  return this.hashCode$1
});
ScalaJS.c.Lcom_repocad_web_lexing_CharToken.prototype.toString__T = (function() {
  return (((this.bitmap$0$1 & 2) === 0) ? this.toString$lzycompute__p1__T() : this.toString$1)
});
ScalaJS.c.Lcom_repocad_web_lexing_CharToken.prototype.init___C = (function(c) {
  this.c$1 = c;
  this.tag$1 = "Char";
  return this
});
ScalaJS.c.Lcom_repocad_web_lexing_CharToken.prototype.toString$lzycompute__p1__T = (function() {
  if (((this.bitmap$0$1 & 2) === 0)) {
    this.toString$1 = (("'" + ScalaJS.bC(this.c$1)) + "'");
    this.bitmap$0$1 = (this.bitmap$0$1 | 2)
  };
  return this.toString$1
});
ScalaJS.c.Lcom_repocad_web_lexing_CharToken.prototype.hashCode__I = (function() {
  return (((this.bitmap$0$1 & 1) === 0) ? this.hashCode$lzycompute__p1__I() : this.hashCode$1)
});
ScalaJS.c.Lcom_repocad_web_lexing_CharToken.prototype.productIterator__sc_Iterator = (function() {
  return new ScalaJS.c.sr_ScalaRunTime$$anon$1().init___s_Product(this)
});
ScalaJS.is.Lcom_repocad_web_lexing_CharToken = (function(obj) {
  return (!(!((obj && obj.$classData) && obj.$classData.ancestors.Lcom_repocad_web_lexing_CharToken)))
});
ScalaJS.as.Lcom_repocad_web_lexing_CharToken = (function(obj) {
  return ((ScalaJS.is.Lcom_repocad_web_lexing_CharToken(obj) || (obj === null)) ? obj : ScalaJS.throwClassCastException(obj, "com.repocad.web.lexing.CharToken"))
});
ScalaJS.isArrayOf.Lcom_repocad_web_lexing_CharToken = (function(obj, depth) {
  return (!(!(((obj && obj.$classData) && (obj.$classData.arrayDepth === depth)) && obj.$classData.arrayBase.ancestors.Lcom_repocad_web_lexing_CharToken)))
});
ScalaJS.asArrayOf.Lcom_repocad_web_lexing_CharToken = (function(obj, depth) {
  return ((ScalaJS.isArrayOf.Lcom_repocad_web_lexing_CharToken(obj, depth) || (obj === null)) ? obj : ScalaJS.throwArrayCastException(obj, "Lcom.repocad.web.lexing.CharToken;", depth))
});
ScalaJS.d.Lcom_repocad_web_lexing_CharToken = new ScalaJS.ClassTypeData({
  Lcom_repocad_web_lexing_CharToken: 0
}, false, "com.repocad.web.lexing.CharToken", ScalaJS.d.O, {
  Lcom_repocad_web_lexing_CharToken: 1,
  s_Serializable: 1,
  Ljava_io_Serializable: 1,
  s_Product: 1,
  s_Equals: 1,
  Lcom_repocad_web_lexing_Token: 1,
  s_math_Ordered: 1,
  jl_Comparable: 1,
  O: 1
});
ScalaJS.c.Lcom_repocad_web_lexing_CharToken.prototype.$classData = ScalaJS.d.Lcom_repocad_web_lexing_CharToken;
/** @constructor */
ScalaJS.c.Lcom_repocad_web_lexing_DoubleToken = (function() {
  ScalaJS.c.O.call(this);
  this.d$1 = 0.0;
  this.tag$1 = null;
  this.hashCode$1 = 0;
  this.toString$1 = null;
  this.class$1 = null;
  this.bitmap$0$1 = 0
});
ScalaJS.c.Lcom_repocad_web_lexing_DoubleToken.prototype = new ScalaJS.h.O();
ScalaJS.c.Lcom_repocad_web_lexing_DoubleToken.prototype.constructor = ScalaJS.c.Lcom_repocad_web_lexing_DoubleToken;
/** @constructor */
ScalaJS.h.Lcom_repocad_web_lexing_DoubleToken = (function() {
  /*<skip>*/
});
ScalaJS.h.Lcom_repocad_web_lexing_DoubleToken.prototype = ScalaJS.c.Lcom_repocad_web_lexing_DoubleToken.prototype;
ScalaJS.c.Lcom_repocad_web_lexing_DoubleToken.prototype.productPrefix__T = (function() {
  return "DoubleToken"
});
ScalaJS.c.Lcom_repocad_web_lexing_DoubleToken.prototype.tag__O = (function() {
  return this.tag$1
});
ScalaJS.c.Lcom_repocad_web_lexing_DoubleToken.prototype.productArity__I = (function() {
  return 1
});
ScalaJS.c.Lcom_repocad_web_lexing_DoubleToken.prototype.equals__O__Z = (function(x$1) {
  if ((this === x$1)) {
    return true
  } else if (ScalaJS.is.Lcom_repocad_web_lexing_DoubleToken(x$1)) {
    var DoubleToken$1 = ScalaJS.as.Lcom_repocad_web_lexing_DoubleToken(x$1);
    return (this.d$1 === DoubleToken$1.d$1)
  } else {
    return false
  }
});
ScalaJS.c.Lcom_repocad_web_lexing_DoubleToken.prototype.init___D = (function(d) {
  this.d$1 = d;
  this.tag$1 = "Double";
  return this
});
ScalaJS.c.Lcom_repocad_web_lexing_DoubleToken.prototype.productElement__I__O = (function(x$1) {
  switch (x$1) {
    case 0:
      {
        return this.d$1;
        break
      };
    default:
      throw new ScalaJS.c.jl_IndexOutOfBoundsException().init___T(ScalaJS.objectToString(x$1));
  }
});
ScalaJS.c.Lcom_repocad_web_lexing_DoubleToken.prototype.hashCode$lzycompute__p1__I = (function() {
  if (((this.bitmap$0$1 & 1) === 0)) {
    this.hashCode$1 = ScalaJS.objectHashCode(this.d$1);
    this.bitmap$0$1 = (this.bitmap$0$1 | 1)
  };
  return this.hashCode$1
});
ScalaJS.c.Lcom_repocad_web_lexing_DoubleToken.prototype.toString__T = (function() {
  return (((this.bitmap$0$1 & 2) === 0) ? this.toString$lzycompute__p1__T() : this.toString$1)
});
ScalaJS.c.Lcom_repocad_web_lexing_DoubleToken.prototype.toString$lzycompute__p1__T = (function() {
  if (((this.bitmap$0$1 & 2) === 0)) {
    this.toString$1 = ScalaJS.objectToString(this.d$1);
    this.bitmap$0$1 = (this.bitmap$0$1 | 2)
  };
  return this.toString$1
});
ScalaJS.c.Lcom_repocad_web_lexing_DoubleToken.prototype.hashCode__I = (function() {
  return (((this.bitmap$0$1 & 1) === 0) ? this.hashCode$lzycompute__p1__I() : this.hashCode$1)
});
ScalaJS.c.Lcom_repocad_web_lexing_DoubleToken.prototype.productIterator__sc_Iterator = (function() {
  return new ScalaJS.c.sr_ScalaRunTime$$anon$1().init___s_Product(this)
});
ScalaJS.is.Lcom_repocad_web_lexing_DoubleToken = (function(obj) {
  return (!(!((obj && obj.$classData) && obj.$classData.ancestors.Lcom_repocad_web_lexing_DoubleToken)))
});
ScalaJS.as.Lcom_repocad_web_lexing_DoubleToken = (function(obj) {
  return ((ScalaJS.is.Lcom_repocad_web_lexing_DoubleToken(obj) || (obj === null)) ? obj : ScalaJS.throwClassCastException(obj, "com.repocad.web.lexing.DoubleToken"))
});
ScalaJS.isArrayOf.Lcom_repocad_web_lexing_DoubleToken = (function(obj, depth) {
  return (!(!(((obj && obj.$classData) && (obj.$classData.arrayDepth === depth)) && obj.$classData.arrayBase.ancestors.Lcom_repocad_web_lexing_DoubleToken)))
});
ScalaJS.asArrayOf.Lcom_repocad_web_lexing_DoubleToken = (function(obj, depth) {
  return ((ScalaJS.isArrayOf.Lcom_repocad_web_lexing_DoubleToken(obj, depth) || (obj === null)) ? obj : ScalaJS.throwArrayCastException(obj, "Lcom.repocad.web.lexing.DoubleToken;", depth))
});
ScalaJS.d.Lcom_repocad_web_lexing_DoubleToken = new ScalaJS.ClassTypeData({
  Lcom_repocad_web_lexing_DoubleToken: 0
}, false, "com.repocad.web.lexing.DoubleToken", ScalaJS.d.O, {
  Lcom_repocad_web_lexing_DoubleToken: 1,
  s_Serializable: 1,
  Ljava_io_Serializable: 1,
  s_Product: 1,
  s_Equals: 1,
  Lcom_repocad_web_lexing_Token: 1,
  s_math_Ordered: 1,
  jl_Comparable: 1,
  O: 1
});
ScalaJS.c.Lcom_repocad_web_lexing_DoubleToken.prototype.$classData = ScalaJS.d.Lcom_repocad_web_lexing_DoubleToken;
/** @constructor */
ScalaJS.c.Lcom_repocad_web_lexing_IntToken = (function() {
  ScalaJS.c.O.call(this);
  this.n$1 = 0;
  this.tag$1 = null;
  this.hashCode$1 = 0;
  this.toString$1 = null;
  this.class$1 = null;
  this.bitmap$0$1 = 0
});
ScalaJS.c.Lcom_repocad_web_lexing_IntToken.prototype = new ScalaJS.h.O();
ScalaJS.c.Lcom_repocad_web_lexing_IntToken.prototype.constructor = ScalaJS.c.Lcom_repocad_web_lexing_IntToken;
/** @constructor */
ScalaJS.h.Lcom_repocad_web_lexing_IntToken = (function() {
  /*<skip>*/
});
ScalaJS.h.Lcom_repocad_web_lexing_IntToken.prototype = ScalaJS.c.Lcom_repocad_web_lexing_IntToken.prototype;
ScalaJS.c.Lcom_repocad_web_lexing_IntToken.prototype.productPrefix__T = (function() {
  return "IntToken"
});
ScalaJS.c.Lcom_repocad_web_lexing_IntToken.prototype.tag__O = (function() {
  return this.tag$1
});
ScalaJS.c.Lcom_repocad_web_lexing_IntToken.prototype.productArity__I = (function() {
  return 1
});
ScalaJS.c.Lcom_repocad_web_lexing_IntToken.prototype.equals__O__Z = (function(x$1) {
  if ((this === x$1)) {
    return true
  } else if (ScalaJS.is.Lcom_repocad_web_lexing_IntToken(x$1)) {
    var IntToken$1 = ScalaJS.as.Lcom_repocad_web_lexing_IntToken(x$1);
    return (this.n$1 === IntToken$1.n$1)
  } else {
    return false
  }
});
ScalaJS.c.Lcom_repocad_web_lexing_IntToken.prototype.productElement__I__O = (function(x$1) {
  switch (x$1) {
    case 0:
      {
        return this.n$1;
        break
      };
    default:
      throw new ScalaJS.c.jl_IndexOutOfBoundsException().init___T(ScalaJS.objectToString(x$1));
  }
});
ScalaJS.c.Lcom_repocad_web_lexing_IntToken.prototype.hashCode$lzycompute__p1__I = (function() {
  if (((this.bitmap$0$1 & 1) === 0)) {
    this.hashCode$1 = ScalaJS.objectHashCode(this.n$1);
    this.bitmap$0$1 = (this.bitmap$0$1 | 1)
  };
  return this.hashCode$1
});
ScalaJS.c.Lcom_repocad_web_lexing_IntToken.prototype.toString__T = (function() {
  return (((this.bitmap$0$1 & 2) === 0) ? this.toString$lzycompute__p1__T() : this.toString$1)
});
ScalaJS.c.Lcom_repocad_web_lexing_IntToken.prototype.init___I = (function(n) {
  this.n$1 = n;
  this.tag$1 = "Int";
  return this
});
ScalaJS.c.Lcom_repocad_web_lexing_IntToken.prototype.toString$lzycompute__p1__T = (function() {
  if (((this.bitmap$0$1 & 2) === 0)) {
    this.toString$1 = ScalaJS.objectToString(this.n$1);
    this.bitmap$0$1 = (this.bitmap$0$1 | 2)
  };
  return this.toString$1
});
ScalaJS.c.Lcom_repocad_web_lexing_IntToken.prototype.hashCode__I = (function() {
  return (((this.bitmap$0$1 & 1) === 0) ? this.hashCode$lzycompute__p1__I() : this.hashCode$1)
});
ScalaJS.c.Lcom_repocad_web_lexing_IntToken.prototype.productIterator__sc_Iterator = (function() {
  return new ScalaJS.c.sr_ScalaRunTime$$anon$1().init___s_Product(this)
});
ScalaJS.is.Lcom_repocad_web_lexing_IntToken = (function(obj) {
  return (!(!((obj && obj.$classData) && obj.$classData.ancestors.Lcom_repocad_web_lexing_IntToken)))
});
ScalaJS.as.Lcom_repocad_web_lexing_IntToken = (function(obj) {
  return ((ScalaJS.is.Lcom_repocad_web_lexing_IntToken(obj) || (obj === null)) ? obj : ScalaJS.throwClassCastException(obj, "com.repocad.web.lexing.IntToken"))
});
ScalaJS.isArrayOf.Lcom_repocad_web_lexing_IntToken = (function(obj, depth) {
  return (!(!(((obj && obj.$classData) && (obj.$classData.arrayDepth === depth)) && obj.$classData.arrayBase.ancestors.Lcom_repocad_web_lexing_IntToken)))
});
ScalaJS.asArrayOf.Lcom_repocad_web_lexing_IntToken = (function(obj, depth) {
  return ((ScalaJS.isArrayOf.Lcom_repocad_web_lexing_IntToken(obj, depth) || (obj === null)) ? obj : ScalaJS.throwArrayCastException(obj, "Lcom.repocad.web.lexing.IntToken;", depth))
});
ScalaJS.d.Lcom_repocad_web_lexing_IntToken = new ScalaJS.ClassTypeData({
  Lcom_repocad_web_lexing_IntToken: 0
}, false, "com.repocad.web.lexing.IntToken", ScalaJS.d.O, {
  Lcom_repocad_web_lexing_IntToken: 1,
  s_Serializable: 1,
  Ljava_io_Serializable: 1,
  s_Product: 1,
  s_Equals: 1,
  Lcom_repocad_web_lexing_Token: 1,
  s_math_Ordered: 1,
  jl_Comparable: 1,
  O: 1
});
ScalaJS.c.Lcom_repocad_web_lexing_IntToken.prototype.$classData = ScalaJS.d.Lcom_repocad_web_lexing_IntToken;
/** @constructor */
ScalaJS.c.Lcom_repocad_web_lexing_Lexer$ = (function() {
  ScalaJS.c.O.call(this)
});
ScalaJS.c.Lcom_repocad_web_lexing_Lexer$.prototype = new ScalaJS.h.O();
ScalaJS.c.Lcom_repocad_web_lexing_Lexer$.prototype.constructor = ScalaJS.c.Lcom_repocad_web_lexing_Lexer$;
/** @constructor */
ScalaJS.h.Lcom_repocad_web_lexing_Lexer$ = (function() {
  /*<skip>*/
});
ScalaJS.h.Lcom_repocad_web_lexing_Lexer$.prototype = ScalaJS.c.Lcom_repocad_web_lexing_Lexer$.prototype;
ScalaJS.c.Lcom_repocad_web_lexing_Lexer$.prototype.lex__T__Lcom_repocad_web_lexing_LiveStream = (function(code) {
  var stream = ScalaJS.m.Lcom_repocad_web_lexing_LiveStream().apply__T__Lcom_repocad_web_lexing_LiveStream(code);
  var lexer = new ScalaJS.c.Lcom_repocad_web_lexing_Lexer().init___();
  lexer.lex__Lcom_repocad_web_lexing_LiveStream__V(stream);
  return lexer.$$undoutput$1
});
ScalaJS.is.Lcom_repocad_web_lexing_Lexer$ = (function(obj) {
  return (!(!((obj && obj.$classData) && obj.$classData.ancestors.Lcom_repocad_web_lexing_Lexer$)))
});
ScalaJS.as.Lcom_repocad_web_lexing_Lexer$ = (function(obj) {
  return ((ScalaJS.is.Lcom_repocad_web_lexing_Lexer$(obj) || (obj === null)) ? obj : ScalaJS.throwClassCastException(obj, "com.repocad.web.lexing.Lexer$"))
});
ScalaJS.isArrayOf.Lcom_repocad_web_lexing_Lexer$ = (function(obj, depth) {
  return (!(!(((obj && obj.$classData) && (obj.$classData.arrayDepth === depth)) && obj.$classData.arrayBase.ancestors.Lcom_repocad_web_lexing_Lexer$)))
});
ScalaJS.asArrayOf.Lcom_repocad_web_lexing_Lexer$ = (function(obj, depth) {
  return ((ScalaJS.isArrayOf.Lcom_repocad_web_lexing_Lexer$(obj, depth) || (obj === null)) ? obj : ScalaJS.throwArrayCastException(obj, "Lcom.repocad.web.lexing.Lexer$;", depth))
});
ScalaJS.d.Lcom_repocad_web_lexing_Lexer$ = new ScalaJS.ClassTypeData({
  Lcom_repocad_web_lexing_Lexer$: 0
}, false, "com.repocad.web.lexing.Lexer$", ScalaJS.d.O, {
  Lcom_repocad_web_lexing_Lexer$: 1,
  O: 1
});
ScalaJS.c.Lcom_repocad_web_lexing_Lexer$.prototype.$classData = ScalaJS.d.Lcom_repocad_web_lexing_Lexer$;
ScalaJS.n.Lcom_repocad_web_lexing_Lexer = (void 0);
ScalaJS.m.Lcom_repocad_web_lexing_Lexer = (function() {
  if ((!ScalaJS.n.Lcom_repocad_web_lexing_Lexer)) {
    ScalaJS.n.Lcom_repocad_web_lexing_Lexer = new ScalaJS.c.Lcom_repocad_web_lexing_Lexer$().init___()
  };
  return ScalaJS.n.Lcom_repocad_web_lexing_Lexer
});
/** @constructor */
ScalaJS.c.Lcom_repocad_web_lexing_LiveStream = (function() {
  ScalaJS.c.O.call(this);
  this.source$1 = null;
  this.headCache$1 = null;
  this.tailCache$1 = null
});
ScalaJS.c.Lcom_repocad_web_lexing_LiveStream.prototype = new ScalaJS.h.O();
ScalaJS.c.Lcom_repocad_web_lexing_LiveStream.prototype.constructor = ScalaJS.c.Lcom_repocad_web_lexing_LiveStream;
/** @constructor */
ScalaJS.h.Lcom_repocad_web_lexing_LiveStream = (function() {
  /*<skip>*/
});
ScalaJS.h.Lcom_repocad_web_lexing_LiveStream.prototype = ScalaJS.c.Lcom_repocad_web_lexing_LiveStream.prototype;
ScalaJS.c.Lcom_repocad_web_lexing_LiveStream.prototype.head__O = (function() {
  var x1 = this.headCache$1;
  if (ScalaJS.is.s_Some(x1)) {
    var x2 = ScalaJS.as.s_Some(x1);
    var a = x2.x$2;
    return a
  } else if (ScalaJS.anyRefEqEq(ScalaJS.m.s_None(), x1)) {
    if (this.isPlugged__Z()) {
      throw new ScalaJS.c.jl_IllegalStateException().init___T("Can't pull a plugged head!")
    };
    var this$1 = this.source$1;
    this.headCache$1 = new ScalaJS.c.s_Some().init___O(this$1.queue$1.dequeue__O());
    return this.headCache$1.get__O()
  } else {
    throw new ScalaJS.c.s_MatchError().init___O(x1)
  }
});
ScalaJS.c.Lcom_repocad_web_lexing_LiveStream.prototype.isEmpty__Z = (function() {
  if (this.isPlugged__Z()) {
    var this$1 = this.source$1;
    return this$1.$$undisTerminated$1
  } else {
    return false
  }
});
ScalaJS.c.Lcom_repocad_web_lexing_LiveStream.prototype.toString__T = (function() {
  return (this.isEmpty__Z() ? "LiveNil()" : (this.isPlugged__Z() ? "LivePlug()" : (("" + ScalaJS.m.s_Predef$any2stringadd().$$plus$extension__O__T__T(this.head__O(), " :~: ")) + this.tail__Lcom_repocad_web_lexing_LiveStream())))
});
ScalaJS.c.Lcom_repocad_web_lexing_LiveStream.prototype.init___Lcom_repocad_web_lexing_LiveStreamSource = (function(source) {
  this.source$1 = source;
  this.headCache$1 = ScalaJS.m.s_None();
  this.tailCache$1 = ScalaJS.m.s_None();
  return this
});
ScalaJS.c.Lcom_repocad_web_lexing_LiveStream.prototype.isPlugged__Z = (function() {
  if (this.headCache$1.isEmpty__Z()) {
    var this$1 = this.source$1;
    var this$2 = this$1.queue$1;
    return (!ScalaJS.i.sc_TraversableOnce$class__nonEmpty__sc_TraversableOnce__Z(this$2))
  } else {
    return false
  }
});
ScalaJS.c.Lcom_repocad_web_lexing_LiveStream.prototype.tail__Lcom_repocad_web_lexing_LiveStream = (function() {
  if (this.isPlugged__Z()) {
    throw ScalaJS.unwrapJavaScriptException(new ScalaJS.c.jl_Exception().init___T("Can't pull a plugged tail!"))
  };
  var x1 = this.tailCache$1;
  if (ScalaJS.is.s_Some(x1)) {
    var x2 = ScalaJS.as.s_Some(x1);
    var as = ScalaJS.as.Lcom_repocad_web_lexing_LiveStream(x2.x$2);
    return as
  } else if (ScalaJS.anyRefEqEq(ScalaJS.m.s_None(), x1)) {
    this.head__O();
    this.tailCache$1 = new ScalaJS.c.s_Some().init___O(new ScalaJS.c.Lcom_repocad_web_lexing_LiveStream().init___Lcom_repocad_web_lexing_LiveStreamSource(this.source$1));
    return ScalaJS.as.Lcom_repocad_web_lexing_LiveStream(this.tailCache$1.get__O())
  } else {
    throw new ScalaJS.c.s_MatchError().init___O(x1)
  }
});
ScalaJS.is.Lcom_repocad_web_lexing_LiveStream = (function(obj) {
  return (!(!((obj && obj.$classData) && obj.$classData.ancestors.Lcom_repocad_web_lexing_LiveStream)))
});
ScalaJS.as.Lcom_repocad_web_lexing_LiveStream = (function(obj) {
  return ((ScalaJS.is.Lcom_repocad_web_lexing_LiveStream(obj) || (obj === null)) ? obj : ScalaJS.throwClassCastException(obj, "com.repocad.web.lexing.LiveStream"))
});
ScalaJS.isArrayOf.Lcom_repocad_web_lexing_LiveStream = (function(obj, depth) {
  return (!(!(((obj && obj.$classData) && (obj.$classData.arrayDepth === depth)) && obj.$classData.arrayBase.ancestors.Lcom_repocad_web_lexing_LiveStream)))
});
ScalaJS.asArrayOf.Lcom_repocad_web_lexing_LiveStream = (function(obj, depth) {
  return ((ScalaJS.isArrayOf.Lcom_repocad_web_lexing_LiveStream(obj, depth) || (obj === null)) ? obj : ScalaJS.throwArrayCastException(obj, "Lcom.repocad.web.lexing.LiveStream;", depth))
});
ScalaJS.d.Lcom_repocad_web_lexing_LiveStream = new ScalaJS.ClassTypeData({
  Lcom_repocad_web_lexing_LiveStream: 0
}, false, "com.repocad.web.lexing.LiveStream", ScalaJS.d.O, {
  Lcom_repocad_web_lexing_LiveStream: 1,
  O: 1
});
ScalaJS.c.Lcom_repocad_web_lexing_LiveStream.prototype.$classData = ScalaJS.d.Lcom_repocad_web_lexing_LiveStream;
/** @constructor */
ScalaJS.c.Lcom_repocad_web_lexing_LiveStream$ = (function() {
  ScalaJS.c.O.call(this)
});
ScalaJS.c.Lcom_repocad_web_lexing_LiveStream$.prototype = new ScalaJS.h.O();
ScalaJS.c.Lcom_repocad_web_lexing_LiveStream$.prototype.constructor = ScalaJS.c.Lcom_repocad_web_lexing_LiveStream$;
/** @constructor */
ScalaJS.h.Lcom_repocad_web_lexing_LiveStream$ = (function() {
  /*<skip>*/
});
ScalaJS.h.Lcom_repocad_web_lexing_LiveStream$.prototype = ScalaJS.c.Lcom_repocad_web_lexing_LiveStream$.prototype;
ScalaJS.c.Lcom_repocad_web_lexing_LiveStream$.prototype.apply__sc_Iterable__Lcom_repocad_web_lexing_LiveStream = (function(it) {
  var source = new ScalaJS.c.Lcom_repocad_web_lexing_LiveStreamSource().init___();
  source.$$plus$plus$eq__sc_Iterable__V(it);
  return new ScalaJS.c.Lcom_repocad_web_lexing_LiveStream().init___Lcom_repocad_web_lexing_LiveStreamSource(source)
});
ScalaJS.c.Lcom_repocad_web_lexing_LiveStream$.prototype.apply__T__Lcom_repocad_web_lexing_LiveStream = (function(string) {
  var source = new ScalaJS.c.Lcom_repocad_web_lexing_LiveStreamSource().init___();
  source.$$plus$plus$eq__sc_Iterable__V(ScalaJS.m.s_Predef().wrapString__T__sci_WrappedString(string));
  source.terminate__V();
  return new ScalaJS.c.Lcom_repocad_web_lexing_LiveStream().init___Lcom_repocad_web_lexing_LiveStreamSource(source)
});
ScalaJS.is.Lcom_repocad_web_lexing_LiveStream$ = (function(obj) {
  return (!(!((obj && obj.$classData) && obj.$classData.ancestors.Lcom_repocad_web_lexing_LiveStream$)))
});
ScalaJS.as.Lcom_repocad_web_lexing_LiveStream$ = (function(obj) {
  return ((ScalaJS.is.Lcom_repocad_web_lexing_LiveStream$(obj) || (obj === null)) ? obj : ScalaJS.throwClassCastException(obj, "com.repocad.web.lexing.LiveStream$"))
});
ScalaJS.isArrayOf.Lcom_repocad_web_lexing_LiveStream$ = (function(obj, depth) {
  return (!(!(((obj && obj.$classData) && (obj.$classData.arrayDepth === depth)) && obj.$classData.arrayBase.ancestors.Lcom_repocad_web_lexing_LiveStream$)))
});
ScalaJS.asArrayOf.Lcom_repocad_web_lexing_LiveStream$ = (function(obj, depth) {
  return ((ScalaJS.isArrayOf.Lcom_repocad_web_lexing_LiveStream$(obj, depth) || (obj === null)) ? obj : ScalaJS.throwArrayCastException(obj, "Lcom.repocad.web.lexing.LiveStream$;", depth))
});
ScalaJS.d.Lcom_repocad_web_lexing_LiveStream$ = new ScalaJS.ClassTypeData({
  Lcom_repocad_web_lexing_LiveStream$: 0
}, false, "com.repocad.web.lexing.LiveStream$", ScalaJS.d.O, {
  Lcom_repocad_web_lexing_LiveStream$: 1,
  O: 1
});
ScalaJS.c.Lcom_repocad_web_lexing_LiveStream$.prototype.$classData = ScalaJS.d.Lcom_repocad_web_lexing_LiveStream$;
ScalaJS.n.Lcom_repocad_web_lexing_LiveStream = (void 0);
ScalaJS.m.Lcom_repocad_web_lexing_LiveStream = (function() {
  if ((!ScalaJS.n.Lcom_repocad_web_lexing_LiveStream)) {
    ScalaJS.n.Lcom_repocad_web_lexing_LiveStream = new ScalaJS.c.Lcom_repocad_web_lexing_LiveStream$().init___()
  };
  return ScalaJS.n.Lcom_repocad_web_lexing_LiveStream
});
/** @constructor */
ScalaJS.c.Lcom_repocad_web_lexing_LiveStreamSource = (function() {
  ScalaJS.c.O.call(this);
  this.queue$1 = null;
  this.$$undisTerminated$1 = false;
  this.listeners$1 = null
});
ScalaJS.c.Lcom_repocad_web_lexing_LiveStreamSource.prototype = new ScalaJS.h.O();
ScalaJS.c.Lcom_repocad_web_lexing_LiveStreamSource.prototype.constructor = ScalaJS.c.Lcom_repocad_web_lexing_LiveStreamSource;
/** @constructor */
ScalaJS.h.Lcom_repocad_web_lexing_LiveStreamSource = (function() {
  /*<skip>*/
});
ScalaJS.h.Lcom_repocad_web_lexing_LiveStreamSource.prototype = ScalaJS.c.Lcom_repocad_web_lexing_LiveStreamSource.prototype;
ScalaJS.c.Lcom_repocad_web_lexing_LiveStreamSource.prototype.init___ = (function() {
  this.queue$1 = new ScalaJS.c.scm_Queue().init___();
  this.$$undisTerminated$1 = false;
  this.listeners$1 = ScalaJS.m.sci_Nil();
  return this
});
ScalaJS.c.Lcom_repocad_web_lexing_LiveStreamSource.prototype.terminate__V = (function() {
  this.$$undisTerminated$1 = true;
  var this$1 = this.listeners$1;
  var these = this$1;
  while ((!these.isEmpty__Z())) {
    var l$2 = these.head__O();
    var l = ScalaJS.as.F1(l$2);
    l.apply__O__O(ScalaJS.m.sci_Nil());
    these = ScalaJS.as.sci_List(these.tail__O())
  }
});
ScalaJS.c.Lcom_repocad_web_lexing_LiveStreamSource.prototype.$$plus$eq__O__V = (function(a) {
  this.queue$1.$$plus$eq__O__scm_MutableList(a);
  var this$1 = this.listeners$1;
  var these = this$1;
  while ((!these.isEmpty__Z())) {
    var l$2 = these.head__O();
    var l = ScalaJS.as.F1(l$2);
    ScalaJS.m.sci_List();
    var xs = new ScalaJS.c.sjs_js_WrappedArray().init___sjs_js_Array([a]);
    var this$3 = ScalaJS.m.sci_List();
    var cbf = this$3.ReusableCBFInstance$2;
    l.apply__O__O(ScalaJS.as.sci_List(ScalaJS.i.sc_TraversableLike$class__to__sc_TraversableLike__scg_CanBuildFrom__O(xs, cbf)));
    these = ScalaJS.as.sci_List(these.tail__O())
  }
});
ScalaJS.c.Lcom_repocad_web_lexing_LiveStreamSource.prototype.$$plus$plus$eq__sc_Iterable__V = (function(seq) {
  var this$1 = this.queue$1;
  ScalaJS.i.scg_Growable$class__$plus$plus$eq__scg_Growable__sc_TraversableOnce__scg_Growable(this$1, seq);
  var list = seq.toList__sci_List();
  var this$2 = this.listeners$1;
  var these = this$2;
  while ((!these.isEmpty__Z())) {
    var l$2 = these.head__O();
    var l = ScalaJS.as.F1(l$2);
    l.apply__O__O(list);
    these = ScalaJS.as.sci_List(these.tail__O())
  }
});
ScalaJS.c.Lcom_repocad_web_lexing_LiveStreamSource.prototype.addListener__F1__V = (function(listener) {
  var this$1 = this.listeners$1;
  this.listeners$1 = new ScalaJS.c.sci_$colon$colon().init___O__sci_List(listener, this$1)
});
ScalaJS.is.Lcom_repocad_web_lexing_LiveStreamSource = (function(obj) {
  return (!(!((obj && obj.$classData) && obj.$classData.ancestors.Lcom_repocad_web_lexing_LiveStreamSource)))
});
ScalaJS.as.Lcom_repocad_web_lexing_LiveStreamSource = (function(obj) {
  return ((ScalaJS.is.Lcom_repocad_web_lexing_LiveStreamSource(obj) || (obj === null)) ? obj : ScalaJS.throwClassCastException(obj, "com.repocad.web.lexing.LiveStreamSource"))
});
ScalaJS.isArrayOf.Lcom_repocad_web_lexing_LiveStreamSource = (function(obj, depth) {
  return (!(!(((obj && obj.$classData) && (obj.$classData.arrayDepth === depth)) && obj.$classData.arrayBase.ancestors.Lcom_repocad_web_lexing_LiveStreamSource)))
});
ScalaJS.asArrayOf.Lcom_repocad_web_lexing_LiveStreamSource = (function(obj, depth) {
  return ((ScalaJS.isArrayOf.Lcom_repocad_web_lexing_LiveStreamSource(obj, depth) || (obj === null)) ? obj : ScalaJS.throwArrayCastException(obj, "Lcom.repocad.web.lexing.LiveStreamSource;", depth))
});
ScalaJS.d.Lcom_repocad_web_lexing_LiveStreamSource = new ScalaJS.ClassTypeData({
  Lcom_repocad_web_lexing_LiveStreamSource: 0
}, false, "com.repocad.web.lexing.LiveStreamSource", ScalaJS.d.O, {
  Lcom_repocad_web_lexing_LiveStreamSource: 1,
  O: 1
});
ScalaJS.c.Lcom_repocad_web_lexing_LiveStreamSource.prototype.$classData = ScalaJS.d.Lcom_repocad_web_lexing_LiveStreamSource;
/** @constructor */
ScalaJS.c.Lcom_repocad_web_lexing_NonblockingLexer = (function() {
  ScalaJS.c.O.call(this);
  this.outputSource$1 = null;
  this.$$undoutput$1 = null;
  this.lastAcceptingState$1 = null;
  this.lastAcceptingInput$1 = null;
  this.currentState$1 = null;
  this.com$repocad$web$lexing$NonblockingLexer$$currentInput$1 = null;
  this.RejectLexerState$module$1 = null
});
ScalaJS.c.Lcom_repocad_web_lexing_NonblockingLexer.prototype = new ScalaJS.h.O();
ScalaJS.c.Lcom_repocad_web_lexing_NonblockingLexer.prototype.constructor = ScalaJS.c.Lcom_repocad_web_lexing_NonblockingLexer;
/** @constructor */
ScalaJS.h.Lcom_repocad_web_lexing_NonblockingLexer = (function() {
  /*<skip>*/
});
ScalaJS.h.Lcom_repocad_web_lexing_NonblockingLexer.prototype = ScalaJS.c.Lcom_repocad_web_lexing_NonblockingLexer.prototype;
ScalaJS.c.Lcom_repocad_web_lexing_NonblockingLexer.prototype.init___ = (function() {
  this.outputSource$1 = null;
  this.$$undoutput$1 = null;
  this.lastAcceptingState$1 = null;
  this.lastAcceptingInput$1 = null;
  this.currentState$1 = null;
  this.com$repocad$web$lexing$NonblockingLexer$$currentInput$1 = null;
  return this
});
ScalaJS.c.Lcom_repocad_web_lexing_NonblockingLexer.prototype.workStep__p1__Z = (function() {
  if (this.currentState$1.mustAccept__Z()) {
    this.currentState$1 = this.currentState$1.fire__Lcom_repocad_web_lexing_NonblockingLexer$LexerState();
    this.lastAcceptingState$1 = this.RejectLexerState__Lcom_repocad_web_lexing_NonblockingLexer$RejectLexerState$();
    this.lastAcceptingInput$1 = null;
    return true
  };
  if (this.currentState$1.isAccept__Z()) {
    this.lastAcceptingState$1 = this.currentState$1;
    this.lastAcceptingInput$1 = this.com$repocad$web$lexing$NonblockingLexer$$currentInput$1
  } else if (this.currentState$1.isReject__Z()) {
    this.currentState$1 = this.lastAcceptingState$1.fire__Lcom_repocad_web_lexing_NonblockingLexer$LexerState();
    this.com$repocad$web$lexing$NonblockingLexer$$currentInput$1 = this.lastAcceptingInput$1;
    this.lastAcceptingState$1 = this.RejectLexerState__Lcom_repocad_web_lexing_NonblockingLexer$RejectLexerState$();
    this.lastAcceptingInput$1 = null;
    return true
  };
  if (this.com$repocad$web$lexing$NonblockingLexer$$currentInput$1.isEmpty__Z()) {
    var terminalState = this.currentState$1.terminate__Lcom_repocad_web_lexing_NonblockingLexer$LexerState();
    if (terminalState.isAccept__Z()) {
      terminalState.fire__Lcom_repocad_web_lexing_NonblockingLexer$LexerState();
      return false
    } else {
      this.currentState$1 = this.lastAcceptingState$1.fire__Lcom_repocad_web_lexing_NonblockingLexer$LexerState();
      this.com$repocad$web$lexing$NonblockingLexer$$currentInput$1 = this.lastAcceptingInput$1;
      this.lastAcceptingState$1 = this.RejectLexerState__Lcom_repocad_web_lexing_NonblockingLexer$RejectLexerState$();
      this.lastAcceptingInput$1 = null;
      return true
    }
  };
  if ((!this.com$repocad$web$lexing$NonblockingLexer$$currentInput$1.isPlugged__Z())) {
    var c = ScalaJS.uC(this.com$repocad$web$lexing$NonblockingLexer$$currentInput$1.head__O());
    this.currentState$1 = this.currentState$1.next__C__Lcom_repocad_web_lexing_NonblockingLexer$LexerState(c);
    this.com$repocad$web$lexing$NonblockingLexer$$currentInput$1 = this.com$repocad$web$lexing$NonblockingLexer$$currentInput$1.tail__Lcom_repocad_web_lexing_LiveStream()
  };
  if ((((!this.com$repocad$web$lexing$NonblockingLexer$$currentInput$1.isPlugged__Z()) || this.com$repocad$web$lexing$NonblockingLexer$$currentInput$1.isEmpty__Z()) || this.currentState$1.isReject__Z())) {
    return true
  };
  if (this.currentState$1.mustAccept__Z()) {
    this.currentState$1 = this.currentState$1.fire__Lcom_repocad_web_lexing_NonblockingLexer$LexerState();
    this.lastAcceptingState$1 = this.RejectLexerState__Lcom_repocad_web_lexing_NonblockingLexer$RejectLexerState$();
    this.lastAcceptingInput$1 = null;
    return true
  };
  return false
});
ScalaJS.c.Lcom_repocad_web_lexing_NonblockingLexer.prototype.com$repocad$web$lexing$NonblockingLexer$$work__V = (function() {
  while (this.workStep__p1__Z()) {
    /*<skip>*/
  }
});
ScalaJS.c.Lcom_repocad_web_lexing_NonblockingLexer.prototype.RejectLexerState__Lcom_repocad_web_lexing_NonblockingLexer$RejectLexerState$ = (function() {
  return ((this.RejectLexerState$module$1 === null) ? this.RejectLexerState$lzycompute__p1__Lcom_repocad_web_lexing_NonblockingLexer$RejectLexerState$() : this.RejectLexerState$module$1)
});
ScalaJS.c.Lcom_repocad_web_lexing_NonblockingLexer.prototype.lex__Lcom_repocad_web_lexing_LiveStream__V = (function(input) {
  this.currentState$1 = this.MAIN$2;
  this.com$repocad$web$lexing$NonblockingLexer$$currentInput$1 = input;
  this.outputSource$1 = new ScalaJS.c.Lcom_repocad_web_lexing_LiveStreamSource().init___();
  this.$$undoutput$1 = new ScalaJS.c.Lcom_repocad_web_lexing_LiveStream().init___Lcom_repocad_web_lexing_LiveStreamSource(this.outputSource$1);
  input.source$1.addListener__F1__V(new ScalaJS.c.sjsr_AnonFunction1().init___sjs_js_Function1((function(arg$outer) {
    return (function(chars$2) {
      return (ScalaJS.as.sci_List(chars$2), arg$outer.com$repocad$web$lexing$NonblockingLexer$$work__V(), (void 0))
    })
  })(this)));
  this.com$repocad$web$lexing$NonblockingLexer$$work__V()
});
ScalaJS.c.Lcom_repocad_web_lexing_NonblockingLexer.prototype.RejectLexerState$lzycompute__p1__Lcom_repocad_web_lexing_NonblockingLexer$RejectLexerState$ = (function() {
  if ((this.RejectLexerState$module$1 === null)) {
    this.RejectLexerState$module$1 = new ScalaJS.c.Lcom_repocad_web_lexing_NonblockingLexer$RejectLexerState$().init___Lcom_repocad_web_lexing_NonblockingLexer(this)
  };
  return this.RejectLexerState$module$1
});
ScalaJS.is.Lcom_repocad_web_lexing_NonblockingLexer = (function(obj) {
  return (!(!((obj && obj.$classData) && obj.$classData.ancestors.Lcom_repocad_web_lexing_NonblockingLexer)))
});
ScalaJS.as.Lcom_repocad_web_lexing_NonblockingLexer = (function(obj) {
  return ((ScalaJS.is.Lcom_repocad_web_lexing_NonblockingLexer(obj) || (obj === null)) ? obj : ScalaJS.throwClassCastException(obj, "com.repocad.web.lexing.NonblockingLexer"))
});
ScalaJS.isArrayOf.Lcom_repocad_web_lexing_NonblockingLexer = (function(obj, depth) {
  return (!(!(((obj && obj.$classData) && (obj.$classData.arrayDepth === depth)) && obj.$classData.arrayBase.ancestors.Lcom_repocad_web_lexing_NonblockingLexer)))
});
ScalaJS.asArrayOf.Lcom_repocad_web_lexing_NonblockingLexer = (function(obj, depth) {
  return ((ScalaJS.isArrayOf.Lcom_repocad_web_lexing_NonblockingLexer(obj, depth) || (obj === null)) ? obj : ScalaJS.throwArrayCastException(obj, "Lcom.repocad.web.lexing.NonblockingLexer;", depth))
});
ScalaJS.d.Lcom_repocad_web_lexing_NonblockingLexer = new ScalaJS.ClassTypeData({
  Lcom_repocad_web_lexing_NonblockingLexer: 0
}, false, "com.repocad.web.lexing.NonblockingLexer", ScalaJS.d.O, {
  Lcom_repocad_web_lexing_NonblockingLexer: 1,
  O: 1
});
ScalaJS.c.Lcom_repocad_web_lexing_NonblockingLexer.prototype.$classData = ScalaJS.d.Lcom_repocad_web_lexing_NonblockingLexer;
/** @constructor */
ScalaJS.c.Lcom_repocad_web_lexing_NonblockingLexer$LexerRule = (function() {
  ScalaJS.c.O.call(this);
  this.regex$1 = null;
  this.action$1 = null;
  this.$$outer$f = null
});
ScalaJS.c.Lcom_repocad_web_lexing_NonblockingLexer$LexerRule.prototype = new ScalaJS.h.O();
ScalaJS.c.Lcom_repocad_web_lexing_NonblockingLexer$LexerRule.prototype.constructor = ScalaJS.c.Lcom_repocad_web_lexing_NonblockingLexer$LexerRule;
/** @constructor */
ScalaJS.h.Lcom_repocad_web_lexing_NonblockingLexer$LexerRule = (function() {
  /*<skip>*/
});
ScalaJS.h.Lcom_repocad_web_lexing_NonblockingLexer$LexerRule.prototype = ScalaJS.c.Lcom_repocad_web_lexing_NonblockingLexer$LexerRule.prototype;
ScalaJS.c.Lcom_repocad_web_lexing_NonblockingLexer$LexerRule.prototype.init___Lcom_repocad_web_lexing_NonblockingLexer__Lcom_repocad_web_lexing_RegularLanguage__F1 = (function($$outer, regex, action) {
  this.regex$1 = regex;
  this.action$1 = action;
  if (($$outer === null)) {
    throw ScalaJS.unwrapJavaScriptException(null)
  } else {
    this.$$outer$f = $$outer
  };
  return this
});
ScalaJS.c.Lcom_repocad_web_lexing_NonblockingLexer$LexerRule.prototype.deriveEND__Lcom_repocad_web_lexing_NonblockingLexer$LexerRule = (function() {
  return new ScalaJS.c.Lcom_repocad_web_lexing_NonblockingLexer$LexerRule().init___Lcom_repocad_web_lexing_NonblockingLexer__Lcom_repocad_web_lexing_RegularLanguage__F1(this.$$outer$f, this.regex$1.deriveEND__Lcom_repocad_web_lexing_RegularLanguage(), this.action$1)
});
ScalaJS.c.Lcom_repocad_web_lexing_NonblockingLexer$LexerRule.prototype.toString__T = (function() {
  return ScalaJS.objectToString(this.regex$1)
});
ScalaJS.c.Lcom_repocad_web_lexing_NonblockingLexer$LexerRule.prototype.accepts__Z = (function() {
  return this.regex$1.acceptsEmptyString__Z()
});
ScalaJS.c.Lcom_repocad_web_lexing_NonblockingLexer$LexerRule.prototype.fire__sci_List__Lcom_repocad_web_lexing_NonblockingLexer$LexerState = (function(chars) {
  return ScalaJS.as.Lcom_repocad_web_lexing_NonblockingLexer$LexerState(this.action$1.apply__O__O(chars))
});
ScalaJS.c.Lcom_repocad_web_lexing_NonblockingLexer$LexerRule.prototype.mustAccept__Z = (function() {
  return this.regex$1.isEmptyString__Z()
});
ScalaJS.c.Lcom_repocad_web_lexing_NonblockingLexer$LexerRule.prototype.derive__C__Lcom_repocad_web_lexing_NonblockingLexer$LexerRule = (function(c) {
  return new ScalaJS.c.Lcom_repocad_web_lexing_NonblockingLexer$LexerRule().init___Lcom_repocad_web_lexing_NonblockingLexer__Lcom_repocad_web_lexing_RegularLanguage__F1(this.$$outer$f, this.regex$1.derive__C__Lcom_repocad_web_lexing_RegularLanguage(c), this.action$1)
});
ScalaJS.c.Lcom_repocad_web_lexing_NonblockingLexer$LexerRule.prototype.rejects__Z = (function() {
  return this.regex$1.rejectsAll__Z()
});
ScalaJS.is.Lcom_repocad_web_lexing_NonblockingLexer$LexerRule = (function(obj) {
  return (!(!((obj && obj.$classData) && obj.$classData.ancestors.Lcom_repocad_web_lexing_NonblockingLexer$LexerRule)))
});
ScalaJS.as.Lcom_repocad_web_lexing_NonblockingLexer$LexerRule = (function(obj) {
  return ((ScalaJS.is.Lcom_repocad_web_lexing_NonblockingLexer$LexerRule(obj) || (obj === null)) ? obj : ScalaJS.throwClassCastException(obj, "com.repocad.web.lexing.NonblockingLexer$LexerRule"))
});
ScalaJS.isArrayOf.Lcom_repocad_web_lexing_NonblockingLexer$LexerRule = (function(obj, depth) {
  return (!(!(((obj && obj.$classData) && (obj.$classData.arrayDepth === depth)) && obj.$classData.arrayBase.ancestors.Lcom_repocad_web_lexing_NonblockingLexer$LexerRule)))
});
ScalaJS.asArrayOf.Lcom_repocad_web_lexing_NonblockingLexer$LexerRule = (function(obj, depth) {
  return ((ScalaJS.isArrayOf.Lcom_repocad_web_lexing_NonblockingLexer$LexerRule(obj, depth) || (obj === null)) ? obj : ScalaJS.throwArrayCastException(obj, "Lcom.repocad.web.lexing.NonblockingLexer$LexerRule;", depth))
});
ScalaJS.d.Lcom_repocad_web_lexing_NonblockingLexer$LexerRule = new ScalaJS.ClassTypeData({
  Lcom_repocad_web_lexing_NonblockingLexer$LexerRule: 0
}, false, "com.repocad.web.lexing.NonblockingLexer$LexerRule", ScalaJS.d.O, {
  Lcom_repocad_web_lexing_NonblockingLexer$LexerRule: 1,
  O: 1
});
ScalaJS.c.Lcom_repocad_web_lexing_NonblockingLexer$LexerRule.prototype.$classData = ScalaJS.d.Lcom_repocad_web_lexing_NonblockingLexer$LexerRule;
/** @constructor */
ScalaJS.c.Lcom_repocad_web_lexing_NonblockingLexer$LexerState = (function() {
  ScalaJS.c.O.call(this);
  this.isAccept$1 = false;
  this.isReject$1 = false;
  this.$$outer$f = null;
  this.bitmap$0$1 = 0
});
ScalaJS.c.Lcom_repocad_web_lexing_NonblockingLexer$LexerState.prototype = new ScalaJS.h.O();
ScalaJS.c.Lcom_repocad_web_lexing_NonblockingLexer$LexerState.prototype.constructor = ScalaJS.c.Lcom_repocad_web_lexing_NonblockingLexer$LexerState;
/** @constructor */
ScalaJS.h.Lcom_repocad_web_lexing_NonblockingLexer$LexerState = (function() {
  /*<skip>*/
});
ScalaJS.h.Lcom_repocad_web_lexing_NonblockingLexer$LexerState.prototype = ScalaJS.c.Lcom_repocad_web_lexing_NonblockingLexer$LexerState.prototype;
ScalaJS.c.Lcom_repocad_web_lexing_NonblockingLexer$LexerState.prototype.terminate__Lcom_repocad_web_lexing_NonblockingLexer$LexerState = (function() {
  var jsx$3 = this.chars__sci_List();
  var jsx$2 = this.rules__sci_List();
  var jsx$1 = new ScalaJS.c.sjsr_AnonFunction1().init___sjs_js_Function1((function(x$4$2) {
    var x$4 = ScalaJS.as.Lcom_repocad_web_lexing_NonblockingLexer$LexerRule(x$4$2);
    return x$4.deriveEND__Lcom_repocad_web_lexing_NonblockingLexer$LexerRule()
  }));
  var this$1 = ScalaJS.m.sci_List();
  return new ScalaJS.c.Lcom_repocad_web_lexing_NonblockingLexer$MinorLexerState().init___Lcom_repocad_web_lexing_NonblockingLexer__sci_List__sci_List(this.$$outer$f, jsx$3, ScalaJS.as.sci_List(ScalaJS.as.sc_TraversableLike(jsx$2.map__F1__scg_CanBuildFrom__O(jsx$1, this$1.ReusableCBFInstance$2)).filter__F1__O(new ScalaJS.c.sjsr_AnonFunction1().init___sjs_js_Function1((function(x$5$2) {
    var x$5 = ScalaJS.as.Lcom_repocad_web_lexing_NonblockingLexer$LexerRule(x$5$2);
    return (!x$5.rejects__Z())
  })))))
});
ScalaJS.c.Lcom_repocad_web_lexing_NonblockingLexer$LexerState.prototype.next__C__Lcom_repocad_web_lexing_NonblockingLexer$LexerState = (function(c) {
  var this$1 = this.chars__sci_List();
  var x = ScalaJS.bC(c);
  var jsx$3 = new ScalaJS.c.sci_$colon$colon().init___O__sci_List(x, this$1);
  var jsx$2 = this.rules__sci_List();
  var jsx$1 = new ScalaJS.c.sjsr_AnonFunction1().init___sjs_js_Function1((function(c$1) {
    return (function(x$7$2) {
      var x$7 = ScalaJS.as.Lcom_repocad_web_lexing_NonblockingLexer$LexerRule(x$7$2);
      return x$7.derive__C__Lcom_repocad_web_lexing_NonblockingLexer$LexerRule(c$1)
    })
  })(c));
  var this$2 = ScalaJS.m.sci_List();
  return new ScalaJS.c.Lcom_repocad_web_lexing_NonblockingLexer$MinorLexerState().init___Lcom_repocad_web_lexing_NonblockingLexer__sci_List__sci_List(this.$$outer$f, jsx$3, ScalaJS.as.sci_List(ScalaJS.as.sc_TraversableLike(jsx$2.map__F1__scg_CanBuildFrom__O(jsx$1, this$2.ReusableCBFInstance$2)).filter__F1__O(new ScalaJS.c.sjsr_AnonFunction1().init___sjs_js_Function1((function(x$8$2) {
    var x$8 = ScalaJS.as.Lcom_repocad_web_lexing_NonblockingLexer$LexerRule(x$8$2);
    return (!x$8.rejects__Z())
  })))))
});
ScalaJS.c.Lcom_repocad_web_lexing_NonblockingLexer$LexerState.prototype.isReject__Z = (function() {
  return (((this.bitmap$0$1 & 2) === 0) ? this.isReject$lzycompute__p1__Z() : this.isReject$1)
});
ScalaJS.c.Lcom_repocad_web_lexing_NonblockingLexer$LexerState.prototype.init___Lcom_repocad_web_lexing_NonblockingLexer = (function($$outer) {
  if (($$outer === null)) {
    throw ScalaJS.unwrapJavaScriptException(null)
  } else {
    this.$$outer$f = $$outer
  };
  return this
});
ScalaJS.c.Lcom_repocad_web_lexing_NonblockingLexer$LexerState.prototype.isAccept$lzycompute__p1__Z = (function() {
  if (((this.bitmap$0$1 & 1) === 0)) {
    var this$1 = this.rules__sci_List();
    inlinereturn$1: {
      var these = this$1;
      while ((!these.isEmpty__Z())) {
        var x$1$2 = these.head__O();
        var x$1 = ScalaJS.as.Lcom_repocad_web_lexing_NonblockingLexer$LexerRule(x$1$2);
        if (x$1.accepts__Z()) {
          var jsx$1 = true;
          break inlinereturn$1
        };
        these = ScalaJS.as.sc_LinearSeqOptimized(these.tail__O())
      };
      var jsx$1 = false
    };
    this.isAccept$1 = jsx$1;
    this.bitmap$0$1 = (this.bitmap$0$1 | 1)
  };
  return this.isAccept$1
});
ScalaJS.c.Lcom_repocad_web_lexing_NonblockingLexer$LexerState.prototype.fire__Lcom_repocad_web_lexing_NonblockingLexer$LexerState = (function() {
  var this$1 = this.rules__sci_List();
  var b = (ScalaJS.m.sci_List(), new ScalaJS.c.scm_ListBuffer().init___());
  var these = this$1;
  while ((!these.isEmpty__Z())) {
    var x$2 = these.head__O();
    var x$3 = ScalaJS.as.Lcom_repocad_web_lexing_NonblockingLexer$LexerRule(x$2);
    if (x$3.accepts__Z()) {
      b.$$plus$eq__O__scm_ListBuffer(x$2)
    };
    these = ScalaJS.as.sci_List(these.tail__O())
  };
  var accepting = b.toList__sci_List();
  return ScalaJS.as.Lcom_repocad_web_lexing_NonblockingLexer$LexerRule(ScalaJS.i.sc_LinearSeqOptimized$class__last__sc_LinearSeqOptimized__O(accepting)).fire__sci_List__Lcom_repocad_web_lexing_NonblockingLexer$LexerState(this.chars__sci_List().reverse__sci_List())
});
ScalaJS.c.Lcom_repocad_web_lexing_NonblockingLexer$LexerState.prototype.mustAccept__Z = (function() {
  var nonLocalReturnKey1 = new ScalaJS.c.O().init___();
  try {
    var elem$1 = false;
    elem$1 = false;
    var this$2 = this.rules__sci_List();
    var these = this$2;
    while ((!these.isEmpty__Z())) {
      var r$2 = these.head__O();
      var r = ScalaJS.as.Lcom_repocad_web_lexing_NonblockingLexer$LexerRule(r$2);
      if ((r.mustAccept__Z() && (!elem$1))) {
        elem$1 = true
      } else if ((!r.rejects__Z())) {
        throw new ScalaJS.c.sr_NonLocalReturnControl$mcZ$sp().init___O__Z(nonLocalReturnKey1, false)
      };
      these = ScalaJS.as.sci_List(these.tail__O())
    };
    return elem$1
  } catch (ex) {
    if (ScalaJS.is.sr_NonLocalReturnControl(ex)) {
      var ex$2 = ex;
      if ((ex$2.key$2 === nonLocalReturnKey1)) {
        return ex$2.value$mcZ$sp$f
      } else {
        throw ex$2
      }
    } else {
      throw ex
    }
  }
});
ScalaJS.c.Lcom_repocad_web_lexing_NonblockingLexer$LexerState.prototype.isAccept__Z = (function() {
  return (((this.bitmap$0$1 & 1) === 0) ? this.isAccept$lzycompute__p1__Z() : this.isAccept$1)
});
ScalaJS.c.Lcom_repocad_web_lexing_NonblockingLexer$LexerState.prototype.isReject$lzycompute__p1__Z = (function() {
  if (((this.bitmap$0$1 & 2) === 0)) {
    var this$1 = this.rules__sci_List();
    inlinereturn$1: {
      var these = this$1;
      while ((!these.isEmpty__Z())) {
        var x$2$2 = these.head__O();
        var x$2 = ScalaJS.as.Lcom_repocad_web_lexing_NonblockingLexer$LexerRule(x$2$2);
        if ((!x$2.rejects__Z())) {
          var jsx$1 = false;
          break inlinereturn$1
        };
        these = ScalaJS.as.sc_LinearSeqOptimized(these.tail__O())
      };
      var jsx$1 = true
    };
    this.isReject$1 = jsx$1;
    this.bitmap$0$1 = (this.bitmap$0$1 | 2)
  };
  return this.isReject$1
});
ScalaJS.is.Lcom_repocad_web_lexing_NonblockingLexer$LexerState = (function(obj) {
  return (!(!((obj && obj.$classData) && obj.$classData.ancestors.Lcom_repocad_web_lexing_NonblockingLexer$LexerState)))
});
ScalaJS.as.Lcom_repocad_web_lexing_NonblockingLexer$LexerState = (function(obj) {
  return ((ScalaJS.is.Lcom_repocad_web_lexing_NonblockingLexer$LexerState(obj) || (obj === null)) ? obj : ScalaJS.throwClassCastException(obj, "com.repocad.web.lexing.NonblockingLexer$LexerState"))
});
ScalaJS.isArrayOf.Lcom_repocad_web_lexing_NonblockingLexer$LexerState = (function(obj, depth) {
  return (!(!(((obj && obj.$classData) && (obj.$classData.arrayDepth === depth)) && obj.$classData.arrayBase.ancestors.Lcom_repocad_web_lexing_NonblockingLexer$LexerState)))
});
ScalaJS.asArrayOf.Lcom_repocad_web_lexing_NonblockingLexer$LexerState = (function(obj, depth) {
  return ((ScalaJS.isArrayOf.Lcom_repocad_web_lexing_NonblockingLexer$LexerState(obj, depth) || (obj === null)) ? obj : ScalaJS.throwArrayCastException(obj, "Lcom.repocad.web.lexing.NonblockingLexer$LexerState;", depth))
});
ScalaJS.d.Lcom_repocad_web_lexing_NonblockingLexer$LexerState = new ScalaJS.ClassTypeData({
  Lcom_repocad_web_lexing_NonblockingLexer$LexerState: 0
}, false, "com.repocad.web.lexing.NonblockingLexer$LexerState", ScalaJS.d.O, {
  Lcom_repocad_web_lexing_NonblockingLexer$LexerState: 1,
  O: 1
});
ScalaJS.c.Lcom_repocad_web_lexing_NonblockingLexer$LexerState.prototype.$classData = ScalaJS.d.Lcom_repocad_web_lexing_NonblockingLexer$LexerState;
/** @constructor */
ScalaJS.c.Lcom_repocad_web_lexing_NonblockingLexer$MajorLexerState$$anon$3 = (function() {
  ScalaJS.c.O.call(this);
  this.$$outer$1 = null;
  this.regex$2$1 = null;
  this.that$1$f = null
});
ScalaJS.c.Lcom_repocad_web_lexing_NonblockingLexer$MajorLexerState$$anon$3.prototype = new ScalaJS.h.O();
ScalaJS.c.Lcom_repocad_web_lexing_NonblockingLexer$MajorLexerState$$anon$3.prototype.constructor = ScalaJS.c.Lcom_repocad_web_lexing_NonblockingLexer$MajorLexerState$$anon$3;
/** @constructor */
ScalaJS.h.Lcom_repocad_web_lexing_NonblockingLexer$MajorLexerState$$anon$3 = (function() {
  /*<skip>*/
});
ScalaJS.h.Lcom_repocad_web_lexing_NonblockingLexer$MajorLexerState$$anon$3.prototype = ScalaJS.c.Lcom_repocad_web_lexing_NonblockingLexer$MajorLexerState$$anon$3.prototype;
ScalaJS.c.Lcom_repocad_web_lexing_NonblockingLexer$MajorLexerState$$anon$3.prototype.over__F1__V = (function(action) {
  var x$10 = new ScalaJS.c.Lcom_repocad_web_lexing_NonblockingLexer$LexerRule().init___Lcom_repocad_web_lexing_NonblockingLexer__Lcom_repocad_web_lexing_RegularLanguage__F1(this.$$outer$1.$$outer$f, this.regex$2$1, new ScalaJS.c.sjsr_AnonFunction1().init___sjs_js_Function1((function(arg$outer, action$2) {
    return (function(chars$2) {
      var chars = ScalaJS.as.sci_List(chars$2);
      action$2.apply__O__O(chars);
      return arg$outer.that$1$f
    })
  })(this, action)));
  var this$1 = this.$$outer$1.com$repocad$web$lexing$NonblockingLexer$MajorLexerState$$$undrules$2;
  this.$$outer$1.com$repocad$web$lexing$NonblockingLexer$MajorLexerState$$$undrules$2 = new ScalaJS.c.sci_$colon$colon().init___O__sci_List(x$10, this$1)
});
ScalaJS.c.Lcom_repocad_web_lexing_NonblockingLexer$MajorLexerState$$anon$3.prototype.init___Lcom_repocad_web_lexing_NonblockingLexer$MajorLexerState__Lcom_repocad_web_lexing_RegularLanguage__Lcom_repocad_web_lexing_NonblockingLexer$LexerState = (function($$outer, regex$2, that$1) {
  if (($$outer === null)) {
    throw ScalaJS.unwrapJavaScriptException(null)
  } else {
    this.$$outer$1 = $$outer
  };
  this.regex$2$1 = regex$2;
  this.that$1$f = that$1;
  return this
});
ScalaJS.c.Lcom_repocad_web_lexing_NonblockingLexer$MajorLexerState$$anon$3.prototype.apply__F0__V = (function(action) {
  var x$9 = new ScalaJS.c.Lcom_repocad_web_lexing_NonblockingLexer$LexerRule().init___Lcom_repocad_web_lexing_NonblockingLexer__Lcom_repocad_web_lexing_RegularLanguage__F1(this.$$outer$1.$$outer$f, this.regex$2$1, new ScalaJS.c.sjsr_AnonFunction1().init___sjs_js_Function1((function(arg$outer, action$1) {
    return (function(chars$2) {
      return (ScalaJS.as.sci_List(chars$2), action$1.apply__O(), arg$outer.that$1$f)
    })
  })(this, action)));
  var this$1 = this.$$outer$1.com$repocad$web$lexing$NonblockingLexer$MajorLexerState$$$undrules$2;
  this.$$outer$1.com$repocad$web$lexing$NonblockingLexer$MajorLexerState$$$undrules$2 = new ScalaJS.c.sci_$colon$colon().init___O__sci_List(x$9, this$1)
});
ScalaJS.is.Lcom_repocad_web_lexing_NonblockingLexer$MajorLexerState$$anon$3 = (function(obj) {
  return (!(!((obj && obj.$classData) && obj.$classData.ancestors.Lcom_repocad_web_lexing_NonblockingLexer$MajorLexerState$$anon$3)))
});
ScalaJS.as.Lcom_repocad_web_lexing_NonblockingLexer$MajorLexerState$$anon$3 = (function(obj) {
  return ((ScalaJS.is.Lcom_repocad_web_lexing_NonblockingLexer$MajorLexerState$$anon$3(obj) || (obj === null)) ? obj : ScalaJS.throwClassCastException(obj, "com.repocad.web.lexing.NonblockingLexer$MajorLexerState$$anon$3"))
});
ScalaJS.isArrayOf.Lcom_repocad_web_lexing_NonblockingLexer$MajorLexerState$$anon$3 = (function(obj, depth) {
  return (!(!(((obj && obj.$classData) && (obj.$classData.arrayDepth === depth)) && obj.$classData.arrayBase.ancestors.Lcom_repocad_web_lexing_NonblockingLexer$MajorLexerState$$anon$3)))
});
ScalaJS.asArrayOf.Lcom_repocad_web_lexing_NonblockingLexer$MajorLexerState$$anon$3 = (function(obj, depth) {
  return ((ScalaJS.isArrayOf.Lcom_repocad_web_lexing_NonblockingLexer$MajorLexerState$$anon$3(obj, depth) || (obj === null)) ? obj : ScalaJS.throwArrayCastException(obj, "Lcom.repocad.web.lexing.NonblockingLexer$MajorLexerState$$anon$3;", depth))
});
ScalaJS.d.Lcom_repocad_web_lexing_NonblockingLexer$MajorLexerState$$anon$3 = new ScalaJS.ClassTypeData({
  Lcom_repocad_web_lexing_NonblockingLexer$MajorLexerState$$anon$3: 0
}, false, "com.repocad.web.lexing.NonblockingLexer$MajorLexerState$$anon$3", ScalaJS.d.O, {
  Lcom_repocad_web_lexing_NonblockingLexer$MajorLexerState$$anon$3: 1,
  Lcom_repocad_web_lexing_NonblockingLexer$MajorLexerState$Matchable: 1,
  O: 1
});
ScalaJS.c.Lcom_repocad_web_lexing_NonblockingLexer$MajorLexerState$$anon$3.prototype.$classData = ScalaJS.d.Lcom_repocad_web_lexing_NonblockingLexer$MajorLexerState$$anon$3;
/** @constructor */
ScalaJS.c.Lcom_repocad_web_lexing_NonblockingLexer$MajorLexerState$$anon$4 = (function() {
  ScalaJS.c.O.call(this);
  this.$$outer$1 = null;
  this.regex$1$1 = null
});
ScalaJS.c.Lcom_repocad_web_lexing_NonblockingLexer$MajorLexerState$$anon$4.prototype = new ScalaJS.h.O();
ScalaJS.c.Lcom_repocad_web_lexing_NonblockingLexer$MajorLexerState$$anon$4.prototype.constructor = ScalaJS.c.Lcom_repocad_web_lexing_NonblockingLexer$MajorLexerState$$anon$4;
/** @constructor */
ScalaJS.h.Lcom_repocad_web_lexing_NonblockingLexer$MajorLexerState$$anon$4 = (function() {
  /*<skip>*/
});
ScalaJS.h.Lcom_repocad_web_lexing_NonblockingLexer$MajorLexerState$$anon$4.prototype = ScalaJS.c.Lcom_repocad_web_lexing_NonblockingLexer$MajorLexerState$$anon$4.prototype;
ScalaJS.c.Lcom_repocad_web_lexing_NonblockingLexer$MajorLexerState$$anon$4.prototype.over__F1__V = (function(action) {
  var x$11 = new ScalaJS.c.Lcom_repocad_web_lexing_NonblockingLexer$LexerRule().init___Lcom_repocad_web_lexing_NonblockingLexer__Lcom_repocad_web_lexing_RegularLanguage__F1(this.$$outer$1.$$outer$f, this.regex$1$1, action);
  var this$1 = this.$$outer$1.com$repocad$web$lexing$NonblockingLexer$MajorLexerState$$$undrules$2;
  this.$$outer$1.com$repocad$web$lexing$NonblockingLexer$MajorLexerState$$$undrules$2 = new ScalaJS.c.sci_$colon$colon().init___O__sci_List(x$11, this$1)
});
ScalaJS.c.Lcom_repocad_web_lexing_NonblockingLexer$MajorLexerState$$anon$4.prototype.to__F0__V = (function(action) {
  var x$13 = new ScalaJS.c.Lcom_repocad_web_lexing_NonblockingLexer$LexerRule().init___Lcom_repocad_web_lexing_NonblockingLexer__Lcom_repocad_web_lexing_RegularLanguage__F1(this.$$outer$1.$$outer$f, this.regex$1$1, new ScalaJS.c.sjsr_AnonFunction1().init___sjs_js_Function1((function(action$3) {
    return (function(x$12$2) {
      return (ScalaJS.as.sci_List(x$12$2), ScalaJS.as.Lcom_repocad_web_lexing_NonblockingLexer$LexerState(action$3.apply__O()))
    })
  })(action)));
  var this$1 = this.$$outer$1.com$repocad$web$lexing$NonblockingLexer$MajorLexerState$$$undrules$2;
  this.$$outer$1.com$repocad$web$lexing$NonblockingLexer$MajorLexerState$$$undrules$2 = new ScalaJS.c.sci_$colon$colon().init___O__sci_List(x$13, this$1)
});
ScalaJS.c.Lcom_repocad_web_lexing_NonblockingLexer$MajorLexerState$$anon$4.prototype.init___Lcom_repocad_web_lexing_NonblockingLexer$MajorLexerState__Lcom_repocad_web_lexing_RegularLanguage = (function($$outer, regex$1) {
  if (($$outer === null)) {
    throw ScalaJS.unwrapJavaScriptException(null)
  } else {
    this.$$outer$1 = $$outer
  };
  this.regex$1$1 = regex$1;
  return this
});
ScalaJS.is.Lcom_repocad_web_lexing_NonblockingLexer$MajorLexerState$$anon$4 = (function(obj) {
  return (!(!((obj && obj.$classData) && obj.$classData.ancestors.Lcom_repocad_web_lexing_NonblockingLexer$MajorLexerState$$anon$4)))
});
ScalaJS.as.Lcom_repocad_web_lexing_NonblockingLexer$MajorLexerState$$anon$4 = (function(obj) {
  return ((ScalaJS.is.Lcom_repocad_web_lexing_NonblockingLexer$MajorLexerState$$anon$4(obj) || (obj === null)) ? obj : ScalaJS.throwClassCastException(obj, "com.repocad.web.lexing.NonblockingLexer$MajorLexerState$$anon$4"))
});
ScalaJS.isArrayOf.Lcom_repocad_web_lexing_NonblockingLexer$MajorLexerState$$anon$4 = (function(obj, depth) {
  return (!(!(((obj && obj.$classData) && (obj.$classData.arrayDepth === depth)) && obj.$classData.arrayBase.ancestors.Lcom_repocad_web_lexing_NonblockingLexer$MajorLexerState$$anon$4)))
});
ScalaJS.asArrayOf.Lcom_repocad_web_lexing_NonblockingLexer$MajorLexerState$$anon$4 = (function(obj, depth) {
  return ((ScalaJS.isArrayOf.Lcom_repocad_web_lexing_NonblockingLexer$MajorLexerState$$anon$4(obj, depth) || (obj === null)) ? obj : ScalaJS.throwArrayCastException(obj, "Lcom.repocad.web.lexing.NonblockingLexer$MajorLexerState$$anon$4;", depth))
});
ScalaJS.d.Lcom_repocad_web_lexing_NonblockingLexer$MajorLexerState$$anon$4 = new ScalaJS.ClassTypeData({
  Lcom_repocad_web_lexing_NonblockingLexer$MajorLexerState$$anon$4: 0
}, false, "com.repocad.web.lexing.NonblockingLexer$MajorLexerState$$anon$4", ScalaJS.d.O, {
  Lcom_repocad_web_lexing_NonblockingLexer$MajorLexerState$$anon$4: 1,
  Lcom_repocad_web_lexing_NonblockingLexer$MajorLexerState$Switchable: 1,
  O: 1
});
ScalaJS.c.Lcom_repocad_web_lexing_NonblockingLexer$MajorLexerState$$anon$4.prototype.$classData = ScalaJS.d.Lcom_repocad_web_lexing_NonblockingLexer$MajorLexerState$$anon$4;
/** @constructor */
ScalaJS.c.Lcom_repocad_web_lexing_PunctToken = (function() {
  ScalaJS.c.O.call(this);
  this.s$1 = null;
  this.tag$1 = null;
  this.hashCode$1 = 0;
  this.toString$1 = null;
  this.class$1 = null;
  this.bitmap$0$1 = 0
});
ScalaJS.c.Lcom_repocad_web_lexing_PunctToken.prototype = new ScalaJS.h.O();
ScalaJS.c.Lcom_repocad_web_lexing_PunctToken.prototype.constructor = ScalaJS.c.Lcom_repocad_web_lexing_PunctToken;
/** @constructor */
ScalaJS.h.Lcom_repocad_web_lexing_PunctToken = (function() {
  /*<skip>*/
});
ScalaJS.h.Lcom_repocad_web_lexing_PunctToken.prototype = ScalaJS.c.Lcom_repocad_web_lexing_PunctToken.prototype;
ScalaJS.c.Lcom_repocad_web_lexing_PunctToken.prototype.productPrefix__T = (function() {
  return "PunctToken"
});
ScalaJS.c.Lcom_repocad_web_lexing_PunctToken.prototype.tag__O = (function() {
  return this.tag$1
});
ScalaJS.c.Lcom_repocad_web_lexing_PunctToken.prototype.productArity__I = (function() {
  return 1
});
ScalaJS.c.Lcom_repocad_web_lexing_PunctToken.prototype.equals__O__Z = (function(x$1) {
  if ((this === x$1)) {
    return true
  } else if (ScalaJS.is.Lcom_repocad_web_lexing_PunctToken(x$1)) {
    var PunctToken$1 = ScalaJS.as.Lcom_repocad_web_lexing_PunctToken(x$1);
    return ScalaJS.anyRefEqEq(this.s$1, PunctToken$1.s$1)
  } else {
    return false
  }
});
ScalaJS.c.Lcom_repocad_web_lexing_PunctToken.prototype.productElement__I__O = (function(x$1) {
  switch (x$1) {
    case 0:
      {
        return this.s$1;
        break
      };
    default:
      throw new ScalaJS.c.jl_IndexOutOfBoundsException().init___T(ScalaJS.objectToString(x$1));
  }
});
ScalaJS.c.Lcom_repocad_web_lexing_PunctToken.prototype.hashCode$lzycompute__p1__I = (function() {
  if (((this.bitmap$0$1 & 1) === 0)) {
    this.hashCode$1 = ScalaJS.objectHashCode(this.s$1);
    this.bitmap$0$1 = (this.bitmap$0$1 | 1)
  };
  return this.hashCode$1
});
ScalaJS.c.Lcom_repocad_web_lexing_PunctToken.prototype.toString__T = (function() {
  return (((this.bitmap$0$1 & 2) === 0) ? this.toString$lzycompute__p1__T() : this.toString$1)
});
ScalaJS.c.Lcom_repocad_web_lexing_PunctToken.prototype.init___T = (function(s) {
  this.s$1 = s;
  this.tag$1 = s;
  return this
});
ScalaJS.c.Lcom_repocad_web_lexing_PunctToken.prototype.toString$lzycompute__p1__T = (function() {
  if (((this.bitmap$0$1 & 2) === 0)) {
    this.toString$1 = (("[" + this.s$1) + "]");
    this.bitmap$0$1 = (this.bitmap$0$1 | 2)
  };
  return this.toString$1
});
ScalaJS.c.Lcom_repocad_web_lexing_PunctToken.prototype.hashCode__I = (function() {
  return (((this.bitmap$0$1 & 1) === 0) ? this.hashCode$lzycompute__p1__I() : this.hashCode$1)
});
ScalaJS.c.Lcom_repocad_web_lexing_PunctToken.prototype.productIterator__sc_Iterator = (function() {
  return new ScalaJS.c.sr_ScalaRunTime$$anon$1().init___s_Product(this)
});
ScalaJS.is.Lcom_repocad_web_lexing_PunctToken = (function(obj) {
  return (!(!((obj && obj.$classData) && obj.$classData.ancestors.Lcom_repocad_web_lexing_PunctToken)))
});
ScalaJS.as.Lcom_repocad_web_lexing_PunctToken = (function(obj) {
  return ((ScalaJS.is.Lcom_repocad_web_lexing_PunctToken(obj) || (obj === null)) ? obj : ScalaJS.throwClassCastException(obj, "com.repocad.web.lexing.PunctToken"))
});
ScalaJS.isArrayOf.Lcom_repocad_web_lexing_PunctToken = (function(obj, depth) {
  return (!(!(((obj && obj.$classData) && (obj.$classData.arrayDepth === depth)) && obj.$classData.arrayBase.ancestors.Lcom_repocad_web_lexing_PunctToken)))
});
ScalaJS.asArrayOf.Lcom_repocad_web_lexing_PunctToken = (function(obj, depth) {
  return ((ScalaJS.isArrayOf.Lcom_repocad_web_lexing_PunctToken(obj, depth) || (obj === null)) ? obj : ScalaJS.throwArrayCastException(obj, "Lcom.repocad.web.lexing.PunctToken;", depth))
});
ScalaJS.d.Lcom_repocad_web_lexing_PunctToken = new ScalaJS.ClassTypeData({
  Lcom_repocad_web_lexing_PunctToken: 0
}, false, "com.repocad.web.lexing.PunctToken", ScalaJS.d.O, {
  Lcom_repocad_web_lexing_PunctToken: 1,
  s_Serializable: 1,
  Ljava_io_Serializable: 1,
  s_Product: 1,
  s_Equals: 1,
  Lcom_repocad_web_lexing_Token: 1,
  s_math_Ordered: 1,
  jl_Comparable: 1,
  O: 1
});
ScalaJS.c.Lcom_repocad_web_lexing_PunctToken.prototype.$classData = ScalaJS.d.Lcom_repocad_web_lexing_PunctToken;
/** @constructor */
ScalaJS.c.Lcom_repocad_web_lexing_RegularLanguage = (function() {
  ScalaJS.c.O.call(this)
});
ScalaJS.c.Lcom_repocad_web_lexing_RegularLanguage.prototype = new ScalaJS.h.O();
ScalaJS.c.Lcom_repocad_web_lexing_RegularLanguage.prototype.constructor = ScalaJS.c.Lcom_repocad_web_lexing_RegularLanguage;
/** @constructor */
ScalaJS.h.Lcom_repocad_web_lexing_RegularLanguage = (function() {
  /*<skip>*/
});
ScalaJS.h.Lcom_repocad_web_lexing_RegularLanguage.prototype = ScalaJS.c.Lcom_repocad_web_lexing_RegularLanguage.prototype;
ScalaJS.c.Lcom_repocad_web_lexing_RegularLanguage.prototype.$$times__Lcom_repocad_web_lexing_RegularLanguage = (function() {
  return (this.isEmptyString__Z() ? this : (this.rejectsAll__Z() ? ScalaJS.m.Lcom_repocad_web_lexing_Epsilon() : new ScalaJS.c.Lcom_repocad_web_lexing_Star().init___Lcom_repocad_web_lexing_RegularLanguage(this)))
});
ScalaJS.c.Lcom_repocad_web_lexing_RegularLanguage.prototype.$$tilde__Lcom_repocad_web_lexing_RegularLanguage__Lcom_repocad_web_lexing_RegularLanguage = (function(suffix) {
  return (this.isEmptyString__Z() ? suffix : (suffix.isEmptyString__Z() ? this : (this.rejectsAll__Z() ? ScalaJS.m.Lcom_repocad_web_lexing_EmptySet() : (suffix.rejectsAll__Z() ? ScalaJS.m.Lcom_repocad_web_lexing_EmptySet() : new ScalaJS.c.Lcom_repocad_web_lexing_Catenation().init___Lcom_repocad_web_lexing_RegularLanguage__Lcom_repocad_web_lexing_RegularLanguage(this, suffix)))))
});
ScalaJS.c.Lcom_repocad_web_lexing_RegularLanguage.prototype.mustBeSubsumedBy__Lcom_repocad_web_lexing_RegularLanguage__Z = (function(re2) {
  if (ScalaJS.is.Lcom_repocad_web_lexing_Character(this)) {
    var x4 = ScalaJS.as.Lcom_repocad_web_lexing_Character(this);
    var c1 = x4.c$2;
    if (ScalaJS.is.Lcom_repocad_web_lexing_Character(re2)) {
      var x5 = ScalaJS.as.Lcom_repocad_web_lexing_Character(re2);
      var c2 = x5.c$2;
      return (c1 === c2)
    }
  };
  if (ScalaJS.is.Lcom_repocad_web_lexing_Character(this)) {
    if (ScalaJS.anyRefEqEq(ScalaJS.m.Lcom_repocad_web_lexing_AnyChar(), re2)) {
      return true
    }
  };
  return false
});
ScalaJS.c.Lcom_repocad_web_lexing_RegularLanguage.prototype.$$qmark__Lcom_repocad_web_lexing_RegularLanguage = (function() {
  return (this.isEmptyString__Z() ? this : (this.rejectsAll__Z() ? ScalaJS.m.Lcom_repocad_web_lexing_Epsilon() : ScalaJS.m.Lcom_repocad_web_lexing_Epsilon().$$bar$bar__Lcom_repocad_web_lexing_RegularLanguage__Lcom_repocad_web_lexing_RegularLanguage(this)))
});
ScalaJS.c.Lcom_repocad_web_lexing_RegularLanguage.prototype.deriveEND__Lcom_repocad_web_lexing_RegularLanguage = (function() {
  return ScalaJS.m.Lcom_repocad_web_lexing_EmptySet()
});
ScalaJS.c.Lcom_repocad_web_lexing_RegularLanguage.prototype.$$bar$bar__Lcom_repocad_web_lexing_RegularLanguage__Lcom_repocad_web_lexing_RegularLanguage = (function(choice2) {
  return (this.rejectsAll__Z() ? choice2 : (choice2.rejectsAll__Z() ? this : (this.mustBeSubsumedBy__Lcom_repocad_web_lexing_RegularLanguage__Z(choice2) ? choice2 : (choice2.mustBeSubsumedBy__Lcom_repocad_web_lexing_RegularLanguage__Z(this) ? this : new ScalaJS.c.Lcom_repocad_web_lexing_Union().init___Lcom_repocad_web_lexing_RegularLanguage__Lcom_repocad_web_lexing_RegularLanguage(this, choice2)))))
});
ScalaJS.c.Lcom_repocad_web_lexing_RegularLanguage.prototype.$$plus__Lcom_repocad_web_lexing_RegularLanguage = (function() {
  return (this.isEmptyString__Z() ? this : (this.rejectsAll__Z() ? ScalaJS.m.Lcom_repocad_web_lexing_EmptySet() : this.$$tilde__Lcom_repocad_web_lexing_RegularLanguage__Lcom_repocad_web_lexing_RegularLanguage(new ScalaJS.c.Lcom_repocad_web_lexing_Star().init___Lcom_repocad_web_lexing_RegularLanguage(this))))
});
ScalaJS.is.Lcom_repocad_web_lexing_RegularLanguage = (function(obj) {
  return (!(!((obj && obj.$classData) && obj.$classData.ancestors.Lcom_repocad_web_lexing_RegularLanguage)))
});
ScalaJS.as.Lcom_repocad_web_lexing_RegularLanguage = (function(obj) {
  return ((ScalaJS.is.Lcom_repocad_web_lexing_RegularLanguage(obj) || (obj === null)) ? obj : ScalaJS.throwClassCastException(obj, "com.repocad.web.lexing.RegularLanguage"))
});
ScalaJS.isArrayOf.Lcom_repocad_web_lexing_RegularLanguage = (function(obj, depth) {
  return (!(!(((obj && obj.$classData) && (obj.$classData.arrayDepth === depth)) && obj.$classData.arrayBase.ancestors.Lcom_repocad_web_lexing_RegularLanguage)))
});
ScalaJS.asArrayOf.Lcom_repocad_web_lexing_RegularLanguage = (function(obj, depth) {
  return ((ScalaJS.isArrayOf.Lcom_repocad_web_lexing_RegularLanguage(obj, depth) || (obj === null)) ? obj : ScalaJS.throwArrayCastException(obj, "Lcom.repocad.web.lexing.RegularLanguage;", depth))
});
ScalaJS.d.Lcom_repocad_web_lexing_RegularLanguage = new ScalaJS.ClassTypeData({
  Lcom_repocad_web_lexing_RegularLanguage: 0
}, false, "com.repocad.web.lexing.RegularLanguage", ScalaJS.d.O, {
  Lcom_repocad_web_lexing_RegularLanguage: 1,
  O: 1
});
ScalaJS.c.Lcom_repocad_web_lexing_RegularLanguage.prototype.$classData = ScalaJS.d.Lcom_repocad_web_lexing_RegularLanguage;
/** @constructor */
ScalaJS.c.Lcom_repocad_web_lexing_RegularLanguageImplicits$ = (function() {
  ScalaJS.c.O.call(this)
});
ScalaJS.c.Lcom_repocad_web_lexing_RegularLanguageImplicits$.prototype = new ScalaJS.h.O();
ScalaJS.c.Lcom_repocad_web_lexing_RegularLanguageImplicits$.prototype.constructor = ScalaJS.c.Lcom_repocad_web_lexing_RegularLanguageImplicits$;
/** @constructor */
ScalaJS.h.Lcom_repocad_web_lexing_RegularLanguageImplicits$ = (function() {
  /*<skip>*/
});
ScalaJS.h.Lcom_repocad_web_lexing_RegularLanguageImplicits$.prototype = ScalaJS.c.Lcom_repocad_web_lexing_RegularLanguageImplicits$.prototype;
ScalaJS.c.Lcom_repocad_web_lexing_RegularLanguageImplicits$.prototype.oneOf__T__Lcom_repocad_web_lexing_CharSet = (function(s) {
  return new ScalaJS.c.Lcom_repocad_web_lexing_CharSet().init___sci_Set(ScalaJS.as.sci_Set(ScalaJS.as.sc_SetLike(ScalaJS.m.s_Predef().Set$2.apply__sc_Seq__sc_GenTraversable(ScalaJS.m.sci_Nil())).$$plus$plus__sc_GenTraversableOnce__sc_Set(new ScalaJS.c.sci_StringOps().init___T(s))))
});
ScalaJS.c.Lcom_repocad_web_lexing_RegularLanguageImplicits$.prototype.stringToRegEx__T__Lcom_repocad_web_lexing_RegularLanguage = (function(s) {
  if ((ScalaJS.i.sjsr_RuntimeString$class__length__sjsr_RuntimeString__I(s) === 1)) {
    return new ScalaJS.c.Lcom_repocad_web_lexing_Character().init___C(ScalaJS.i.sjsr_RuntimeString$class__charAt__sjsr_RuntimeString__I__C(s, 0))
  } else if ((ScalaJS.i.sjsr_RuntimeString$class__length__sjsr_RuntimeString__I(s) > 0)) {
    var c = ScalaJS.i.sjsr_RuntimeString$class__charAt__sjsr_RuntimeString__I__C(s, 0);
    return new ScalaJS.c.Lcom_repocad_web_lexing_Catenation().init___Lcom_repocad_web_lexing_RegularLanguage__Lcom_repocad_web_lexing_RegularLanguage(new ScalaJS.c.Lcom_repocad_web_lexing_Character().init___C(c), this.stringToRegEx__T__Lcom_repocad_web_lexing_RegularLanguage(ScalaJS.i.sjsr_RuntimeString$class__substring__sjsr_RuntimeString__I__T(s, 1)))
  } else {
    return ScalaJS.m.Lcom_repocad_web_lexing_Epsilon()
  }
});
ScalaJS.is.Lcom_repocad_web_lexing_RegularLanguageImplicits$ = (function(obj) {
  return (!(!((obj && obj.$classData) && obj.$classData.ancestors.Lcom_repocad_web_lexing_RegularLanguageImplicits$)))
});
ScalaJS.as.Lcom_repocad_web_lexing_RegularLanguageImplicits$ = (function(obj) {
  return ((ScalaJS.is.Lcom_repocad_web_lexing_RegularLanguageImplicits$(obj) || (obj === null)) ? obj : ScalaJS.throwClassCastException(obj, "com.repocad.web.lexing.RegularLanguageImplicits$"))
});
ScalaJS.isArrayOf.Lcom_repocad_web_lexing_RegularLanguageImplicits$ = (function(obj, depth) {
  return (!(!(((obj && obj.$classData) && (obj.$classData.arrayDepth === depth)) && obj.$classData.arrayBase.ancestors.Lcom_repocad_web_lexing_RegularLanguageImplicits$)))
});
ScalaJS.asArrayOf.Lcom_repocad_web_lexing_RegularLanguageImplicits$ = (function(obj, depth) {
  return ((ScalaJS.isArrayOf.Lcom_repocad_web_lexing_RegularLanguageImplicits$(obj, depth) || (obj === null)) ? obj : ScalaJS.throwArrayCastException(obj, "Lcom.repocad.web.lexing.RegularLanguageImplicits$;", depth))
});
ScalaJS.d.Lcom_repocad_web_lexing_RegularLanguageImplicits$ = new ScalaJS.ClassTypeData({
  Lcom_repocad_web_lexing_RegularLanguageImplicits$: 0
}, false, "com.repocad.web.lexing.RegularLanguageImplicits$", ScalaJS.d.O, {
  Lcom_repocad_web_lexing_RegularLanguageImplicits$: 1,
  O: 1
});
ScalaJS.c.Lcom_repocad_web_lexing_RegularLanguageImplicits$.prototype.$classData = ScalaJS.d.Lcom_repocad_web_lexing_RegularLanguageImplicits$;
ScalaJS.n.Lcom_repocad_web_lexing_RegularLanguageImplicits = (void 0);
ScalaJS.m.Lcom_repocad_web_lexing_RegularLanguageImplicits = (function() {
  if ((!ScalaJS.n.Lcom_repocad_web_lexing_RegularLanguageImplicits)) {
    ScalaJS.n.Lcom_repocad_web_lexing_RegularLanguageImplicits = new ScalaJS.c.Lcom_repocad_web_lexing_RegularLanguageImplicits$().init___()
  };
  return ScalaJS.n.Lcom_repocad_web_lexing_RegularLanguageImplicits
});
/** @constructor */
ScalaJS.c.Lcom_repocad_web_lexing_RegularLanguageImplicits$$anon$2 = (function() {
  ScalaJS.c.O.call(this);
  this.start$1$1 = 0
});
ScalaJS.c.Lcom_repocad_web_lexing_RegularLanguageImplicits$$anon$2.prototype = new ScalaJS.h.O();
ScalaJS.c.Lcom_repocad_web_lexing_RegularLanguageImplicits$$anon$2.prototype.constructor = ScalaJS.c.Lcom_repocad_web_lexing_RegularLanguageImplicits$$anon$2;
/** @constructor */
ScalaJS.h.Lcom_repocad_web_lexing_RegularLanguageImplicits$$anon$2 = (function() {
  /*<skip>*/
});
ScalaJS.h.Lcom_repocad_web_lexing_RegularLanguageImplicits$$anon$2.prototype = ScalaJS.c.Lcom_repocad_web_lexing_RegularLanguageImplicits$$anon$2.prototype;
ScalaJS.c.Lcom_repocad_web_lexing_RegularLanguageImplicits$$anon$2.prototype.thru__C__Lcom_repocad_web_lexing_RegularLanguage = (function(end) {
  return new ScalaJS.c.Lcom_repocad_web_lexing_CharSet().init___sci_Set(new ScalaJS.c.Lcom_repocad_web_lexing_CharRangeSet().init___C__C(this.start$1$1, end))
});
ScalaJS.c.Lcom_repocad_web_lexing_RegularLanguageImplicits$$anon$2.prototype.init___C = (function(start$1) {
  this.start$1$1 = start$1;
  return this
});
ScalaJS.is.Lcom_repocad_web_lexing_RegularLanguageImplicits$$anon$2 = (function(obj) {
  return (!(!((obj && obj.$classData) && obj.$classData.ancestors.Lcom_repocad_web_lexing_RegularLanguageImplicits$$anon$2)))
});
ScalaJS.as.Lcom_repocad_web_lexing_RegularLanguageImplicits$$anon$2 = (function(obj) {
  return ((ScalaJS.is.Lcom_repocad_web_lexing_RegularLanguageImplicits$$anon$2(obj) || (obj === null)) ? obj : ScalaJS.throwClassCastException(obj, "com.repocad.web.lexing.RegularLanguageImplicits$$anon$2"))
});
ScalaJS.isArrayOf.Lcom_repocad_web_lexing_RegularLanguageImplicits$$anon$2 = (function(obj, depth) {
  return (!(!(((obj && obj.$classData) && (obj.$classData.arrayDepth === depth)) && obj.$classData.arrayBase.ancestors.Lcom_repocad_web_lexing_RegularLanguageImplicits$$anon$2)))
});
ScalaJS.asArrayOf.Lcom_repocad_web_lexing_RegularLanguageImplicits$$anon$2 = (function(obj, depth) {
  return ((ScalaJS.isArrayOf.Lcom_repocad_web_lexing_RegularLanguageImplicits$$anon$2(obj, depth) || (obj === null)) ? obj : ScalaJS.throwArrayCastException(obj, "Lcom.repocad.web.lexing.RegularLanguageImplicits$$anon$2;", depth))
});
ScalaJS.d.Lcom_repocad_web_lexing_RegularLanguageImplicits$$anon$2 = new ScalaJS.ClassTypeData({
  Lcom_repocad_web_lexing_RegularLanguageImplicits$$anon$2: 0
}, false, "com.repocad.web.lexing.RegularLanguageImplicits$$anon$2", ScalaJS.d.O, {
  Lcom_repocad_web_lexing_RegularLanguageImplicits$$anon$2: 1,
  Lcom_repocad_web_lexing_RegularLanguageImplicits$CharRangeable: 1,
  O: 1
});
ScalaJS.c.Lcom_repocad_web_lexing_RegularLanguageImplicits$$anon$2.prototype.$classData = ScalaJS.d.Lcom_repocad_web_lexing_RegularLanguageImplicits$$anon$2;
/** @constructor */
ScalaJS.c.Lcom_repocad_web_lexing_StringToken = (function() {
  ScalaJS.c.O.call(this);
  this.s$1 = null;
  this.tag$1 = null;
  this.hashCode$1 = 0;
  this.toString$1 = null;
  this.class$1 = null;
  this.bitmap$0$1 = 0
});
ScalaJS.c.Lcom_repocad_web_lexing_StringToken.prototype = new ScalaJS.h.O();
ScalaJS.c.Lcom_repocad_web_lexing_StringToken.prototype.constructor = ScalaJS.c.Lcom_repocad_web_lexing_StringToken;
/** @constructor */
ScalaJS.h.Lcom_repocad_web_lexing_StringToken = (function() {
  /*<skip>*/
});
ScalaJS.h.Lcom_repocad_web_lexing_StringToken.prototype = ScalaJS.c.Lcom_repocad_web_lexing_StringToken.prototype;
ScalaJS.c.Lcom_repocad_web_lexing_StringToken.prototype.productPrefix__T = (function() {
  return "StringToken"
});
ScalaJS.c.Lcom_repocad_web_lexing_StringToken.prototype.tag__O = (function() {
  return this.tag$1
});
ScalaJS.c.Lcom_repocad_web_lexing_StringToken.prototype.productArity__I = (function() {
  return 1
});
ScalaJS.c.Lcom_repocad_web_lexing_StringToken.prototype.equals__O__Z = (function(x$1) {
  if ((this === x$1)) {
    return true
  } else if (ScalaJS.is.Lcom_repocad_web_lexing_StringToken(x$1)) {
    var StringToken$1 = ScalaJS.as.Lcom_repocad_web_lexing_StringToken(x$1);
    return ScalaJS.anyRefEqEq(this.s$1, StringToken$1.s$1)
  } else {
    return false
  }
});
ScalaJS.c.Lcom_repocad_web_lexing_StringToken.prototype.productElement__I__O = (function(x$1) {
  switch (x$1) {
    case 0:
      {
        return this.s$1;
        break
      };
    default:
      throw new ScalaJS.c.jl_IndexOutOfBoundsException().init___T(ScalaJS.objectToString(x$1));
  }
});
ScalaJS.c.Lcom_repocad_web_lexing_StringToken.prototype.hashCode$lzycompute__p1__I = (function() {
  if (((this.bitmap$0$1 & 1) === 0)) {
    this.hashCode$1 = ScalaJS.objectHashCode(this.s$1);
    this.bitmap$0$1 = (this.bitmap$0$1 | 1)
  };
  return this.hashCode$1
});
ScalaJS.c.Lcom_repocad_web_lexing_StringToken.prototype.toString__T = (function() {
  return (((this.bitmap$0$1 & 2) === 0) ? this.toString$lzycompute__p1__T() : this.toString$1)
});
ScalaJS.c.Lcom_repocad_web_lexing_StringToken.prototype.init___T = (function(s) {
  this.s$1 = s;
  this.tag$1 = "String";
  return this
});
ScalaJS.c.Lcom_repocad_web_lexing_StringToken.prototype.toString$lzycompute__p1__T = (function() {
  if (((this.bitmap$0$1 & 2) === 0)) {
    this.toString$1 = (("\"" + this.s$1) + "\"");
    this.bitmap$0$1 = (this.bitmap$0$1 | 2)
  };
  return this.toString$1
});
ScalaJS.c.Lcom_repocad_web_lexing_StringToken.prototype.hashCode__I = (function() {
  return (((this.bitmap$0$1 & 1) === 0) ? this.hashCode$lzycompute__p1__I() : this.hashCode$1)
});
ScalaJS.c.Lcom_repocad_web_lexing_StringToken.prototype.productIterator__sc_Iterator = (function() {
  return new ScalaJS.c.sr_ScalaRunTime$$anon$1().init___s_Product(this)
});
ScalaJS.is.Lcom_repocad_web_lexing_StringToken = (function(obj) {
  return (!(!((obj && obj.$classData) && obj.$classData.ancestors.Lcom_repocad_web_lexing_StringToken)))
});
ScalaJS.as.Lcom_repocad_web_lexing_StringToken = (function(obj) {
  return ((ScalaJS.is.Lcom_repocad_web_lexing_StringToken(obj) || (obj === null)) ? obj : ScalaJS.throwClassCastException(obj, "com.repocad.web.lexing.StringToken"))
});
ScalaJS.isArrayOf.Lcom_repocad_web_lexing_StringToken = (function(obj, depth) {
  return (!(!(((obj && obj.$classData) && (obj.$classData.arrayDepth === depth)) && obj.$classData.arrayBase.ancestors.Lcom_repocad_web_lexing_StringToken)))
});
ScalaJS.asArrayOf.Lcom_repocad_web_lexing_StringToken = (function(obj, depth) {
  return ((ScalaJS.isArrayOf.Lcom_repocad_web_lexing_StringToken(obj, depth) || (obj === null)) ? obj : ScalaJS.throwArrayCastException(obj, "Lcom.repocad.web.lexing.StringToken;", depth))
});
ScalaJS.d.Lcom_repocad_web_lexing_StringToken = new ScalaJS.ClassTypeData({
  Lcom_repocad_web_lexing_StringToken: 0
}, false, "com.repocad.web.lexing.StringToken", ScalaJS.d.O, {
  Lcom_repocad_web_lexing_StringToken: 1,
  s_Serializable: 1,
  Ljava_io_Serializable: 1,
  s_Product: 1,
  s_Equals: 1,
  Lcom_repocad_web_lexing_Token: 1,
  s_math_Ordered: 1,
  jl_Comparable: 1,
  O: 1
});
ScalaJS.c.Lcom_repocad_web_lexing_StringToken.prototype.$classData = ScalaJS.d.Lcom_repocad_web_lexing_StringToken;
/** @constructor */
ScalaJS.c.Lcom_repocad_web_lexing_SymbolToken = (function() {
  ScalaJS.c.O.call(this);
  this.s$1 = null;
  this.tag$1 = null;
  this.hashCode$1 = 0;
  this.toString$1 = null;
  this.class$1 = null;
  this.bitmap$0$1 = 0
});
ScalaJS.c.Lcom_repocad_web_lexing_SymbolToken.prototype = new ScalaJS.h.O();
ScalaJS.c.Lcom_repocad_web_lexing_SymbolToken.prototype.constructor = ScalaJS.c.Lcom_repocad_web_lexing_SymbolToken;
/** @constructor */
ScalaJS.h.Lcom_repocad_web_lexing_SymbolToken = (function() {
  /*<skip>*/
});
ScalaJS.h.Lcom_repocad_web_lexing_SymbolToken.prototype = ScalaJS.c.Lcom_repocad_web_lexing_SymbolToken.prototype;
ScalaJS.c.Lcom_repocad_web_lexing_SymbolToken.prototype.productPrefix__T = (function() {
  return "SymbolToken"
});
ScalaJS.c.Lcom_repocad_web_lexing_SymbolToken.prototype.tag__O = (function() {
  return this.tag$1
});
ScalaJS.c.Lcom_repocad_web_lexing_SymbolToken.prototype.productArity__I = (function() {
  return 1
});
ScalaJS.c.Lcom_repocad_web_lexing_SymbolToken.prototype.equals__O__Z = (function(x$1) {
  if ((this === x$1)) {
    return true
  } else if (ScalaJS.is.Lcom_repocad_web_lexing_SymbolToken(x$1)) {
    var SymbolToken$1 = ScalaJS.as.Lcom_repocad_web_lexing_SymbolToken(x$1);
    return ScalaJS.anyRefEqEq(this.s$1, SymbolToken$1.s$1)
  } else {
    return false
  }
});
ScalaJS.c.Lcom_repocad_web_lexing_SymbolToken.prototype.productElement__I__O = (function(x$1) {
  switch (x$1) {
    case 0:
      {
        return this.s$1;
        break
      };
    default:
      throw new ScalaJS.c.jl_IndexOutOfBoundsException().init___T(ScalaJS.objectToString(x$1));
  }
});
ScalaJS.c.Lcom_repocad_web_lexing_SymbolToken.prototype.hashCode$lzycompute__p1__I = (function() {
  if (((this.bitmap$0$1 & 1) === 0)) {
    this.hashCode$1 = ScalaJS.objectHashCode(this.s$1);
    this.bitmap$0$1 = (this.bitmap$0$1 | 1)
  };
  return this.hashCode$1
});
ScalaJS.c.Lcom_repocad_web_lexing_SymbolToken.prototype.toString__T = (function() {
  return (((this.bitmap$0$1 & 2) === 0) ? this.toString$lzycompute__p1__T() : this.toString$1)
});
ScalaJS.c.Lcom_repocad_web_lexing_SymbolToken.prototype.init___T = (function(s) {
  this.s$1 = s;
  this.tag$1 = "Symbol";
  return this
});
ScalaJS.c.Lcom_repocad_web_lexing_SymbolToken.prototype.toString$lzycompute__p1__T = (function() {
  if (((this.bitmap$0$1 & 2) === 0)) {
    this.toString$1 = ("'" + this.s$1);
    this.bitmap$0$1 = (this.bitmap$0$1 | 2)
  };
  return this.toString$1
});
ScalaJS.c.Lcom_repocad_web_lexing_SymbolToken.prototype.hashCode__I = (function() {
  return (((this.bitmap$0$1 & 1) === 0) ? this.hashCode$lzycompute__p1__I() : this.hashCode$1)
});
ScalaJS.c.Lcom_repocad_web_lexing_SymbolToken.prototype.productIterator__sc_Iterator = (function() {
  return new ScalaJS.c.sr_ScalaRunTime$$anon$1().init___s_Product(this)
});
ScalaJS.is.Lcom_repocad_web_lexing_SymbolToken = (function(obj) {
  return (!(!((obj && obj.$classData) && obj.$classData.ancestors.Lcom_repocad_web_lexing_SymbolToken)))
});
ScalaJS.as.Lcom_repocad_web_lexing_SymbolToken = (function(obj) {
  return ((ScalaJS.is.Lcom_repocad_web_lexing_SymbolToken(obj) || (obj === null)) ? obj : ScalaJS.throwClassCastException(obj, "com.repocad.web.lexing.SymbolToken"))
});
ScalaJS.isArrayOf.Lcom_repocad_web_lexing_SymbolToken = (function(obj, depth) {
  return (!(!(((obj && obj.$classData) && (obj.$classData.arrayDepth === depth)) && obj.$classData.arrayBase.ancestors.Lcom_repocad_web_lexing_SymbolToken)))
});
ScalaJS.asArrayOf.Lcom_repocad_web_lexing_SymbolToken = (function(obj, depth) {
  return ((ScalaJS.isArrayOf.Lcom_repocad_web_lexing_SymbolToken(obj, depth) || (obj === null)) ? obj : ScalaJS.throwArrayCastException(obj, "Lcom.repocad.web.lexing.SymbolToken;", depth))
});
ScalaJS.d.Lcom_repocad_web_lexing_SymbolToken = new ScalaJS.ClassTypeData({
  Lcom_repocad_web_lexing_SymbolToken: 0
}, false, "com.repocad.web.lexing.SymbolToken", ScalaJS.d.O, {
  Lcom_repocad_web_lexing_SymbolToken: 1,
  s_Serializable: 1,
  Ljava_io_Serializable: 1,
  s_Product: 1,
  s_Equals: 1,
  Lcom_repocad_web_lexing_Token: 1,
  s_math_Ordered: 1,
  jl_Comparable: 1,
  O: 1
});
ScalaJS.c.Lcom_repocad_web_lexing_SymbolToken.prototype.$classData = ScalaJS.d.Lcom_repocad_web_lexing_SymbolToken;
ScalaJS.is.Lcom_repocad_web_lexing_Token = (function(obj) {
  return (!(!((obj && obj.$classData) && obj.$classData.ancestors.Lcom_repocad_web_lexing_Token)))
});
ScalaJS.as.Lcom_repocad_web_lexing_Token = (function(obj) {
  return ((ScalaJS.is.Lcom_repocad_web_lexing_Token(obj) || (obj === null)) ? obj : ScalaJS.throwClassCastException(obj, "com.repocad.web.lexing.Token"))
});
ScalaJS.isArrayOf.Lcom_repocad_web_lexing_Token = (function(obj, depth) {
  return (!(!(((obj && obj.$classData) && (obj.$classData.arrayDepth === depth)) && obj.$classData.arrayBase.ancestors.Lcom_repocad_web_lexing_Token)))
});
ScalaJS.asArrayOf.Lcom_repocad_web_lexing_Token = (function(obj, depth) {
  return ((ScalaJS.isArrayOf.Lcom_repocad_web_lexing_Token(obj, depth) || (obj === null)) ? obj : ScalaJS.throwArrayCastException(obj, "Lcom.repocad.web.lexing.Token;", depth))
});
ScalaJS.d.Lcom_repocad_web_lexing_Token = new ScalaJS.ClassTypeData({
  Lcom_repocad_web_lexing_Token: 0
}, true, "com.repocad.web.lexing.Token", (void 0), {
  Lcom_repocad_web_lexing_Token: 1,
  s_math_Ordered: 1,
  jl_Comparable: 1,
  O: 1
});
/** @constructor */
ScalaJS.c.Lcom_repocad_web_package$ = (function() {
  ScalaJS.c.O.call(this);
  this.epsilon$1 = 0.0;
  this.paperScale$1 = 0.0;
  this.drawingCenter$1 = null;
  this.paperSize$1 = null
});
ScalaJS.c.Lcom_repocad_web_package$.prototype = new ScalaJS.h.O();
ScalaJS.c.Lcom_repocad_web_package$.prototype.constructor = ScalaJS.c.Lcom_repocad_web_package$;
/** @constructor */
ScalaJS.h.Lcom_repocad_web_package$ = (function() {
  /*<skip>*/
});
ScalaJS.h.Lcom_repocad_web_package$.prototype = ScalaJS.c.Lcom_repocad_web_package$.prototype;
ScalaJS.c.Lcom_repocad_web_package$.prototype.init___ = (function() {
  ScalaJS.n.Lcom_repocad_web_package = this;
  this.epsilon$1 = 1.0E-5;
  this.paperScale$1 = 1.0;
  this.drawingCenter$1 = new ScalaJS.c.Lcom_repocad_web_Vector2D().init___D__D(105.0, 147.0);
  ScalaJS.m.sci_List();
  var xs = new ScalaJS.c.sjs_js_WrappedArray().init___sjs_js_Array([210.0, 297.0]);
  var this$2 = ScalaJS.m.sci_List();
  var cbf = this$2.ReusableCBFInstance$2;
  this.paperSize$1 = ScalaJS.as.sci_List(ScalaJS.i.sc_TraversableLike$class__to__sc_TraversableLike__scg_CanBuildFrom__O(xs, cbf));
  return this
});
ScalaJS.is.Lcom_repocad_web_package$ = (function(obj) {
  return (!(!((obj && obj.$classData) && obj.$classData.ancestors.Lcom_repocad_web_package$)))
});
ScalaJS.as.Lcom_repocad_web_package$ = (function(obj) {
  return ((ScalaJS.is.Lcom_repocad_web_package$(obj) || (obj === null)) ? obj : ScalaJS.throwClassCastException(obj, "com.repocad.web.package$"))
});
ScalaJS.isArrayOf.Lcom_repocad_web_package$ = (function(obj, depth) {
  return (!(!(((obj && obj.$classData) && (obj.$classData.arrayDepth === depth)) && obj.$classData.arrayBase.ancestors.Lcom_repocad_web_package$)))
});
ScalaJS.asArrayOf.Lcom_repocad_web_package$ = (function(obj, depth) {
  return ((ScalaJS.isArrayOf.Lcom_repocad_web_package$(obj, depth) || (obj === null)) ? obj : ScalaJS.throwArrayCastException(obj, "Lcom.repocad.web.package$;", depth))
});
ScalaJS.d.Lcom_repocad_web_package$ = new ScalaJS.ClassTypeData({
  Lcom_repocad_web_package$: 0
}, false, "com.repocad.web.package$", ScalaJS.d.O, {
  Lcom_repocad_web_package$: 1,
  O: 1
});
ScalaJS.c.Lcom_repocad_web_package$.prototype.$classData = ScalaJS.d.Lcom_repocad_web_package$;
ScalaJS.n.Lcom_repocad_web_package = (void 0);
ScalaJS.m.Lcom_repocad_web_package = (function() {
  if ((!ScalaJS.n.Lcom_repocad_web_package)) {
    ScalaJS.n.Lcom_repocad_web_package = new ScalaJS.c.Lcom_repocad_web_package$().init___()
  };
  return ScalaJS.n.Lcom_repocad_web_package
});
/** @constructor */
ScalaJS.c.Lcom_repocad_web_parsing_ArcExpr = (function() {
  ScalaJS.c.O.call(this);
  this.centerX$1 = null;
  this.centerY$1 = null;
  this.radius$1 = null;
  this.sAngle$1 = null;
  this.eAngle$1 = null
});
ScalaJS.c.Lcom_repocad_web_parsing_ArcExpr.prototype = new ScalaJS.h.O();
ScalaJS.c.Lcom_repocad_web_parsing_ArcExpr.prototype.constructor = ScalaJS.c.Lcom_repocad_web_parsing_ArcExpr;
/** @constructor */
ScalaJS.h.Lcom_repocad_web_parsing_ArcExpr = (function() {
  /*<skip>*/
});
ScalaJS.h.Lcom_repocad_web_parsing_ArcExpr.prototype = ScalaJS.c.Lcom_repocad_web_parsing_ArcExpr.prototype;
ScalaJS.c.Lcom_repocad_web_parsing_ArcExpr.prototype.productPrefix__T = (function() {
  return "ArcExpr"
});
ScalaJS.c.Lcom_repocad_web_parsing_ArcExpr.prototype.productArity__I = (function() {
  return 5
});
ScalaJS.c.Lcom_repocad_web_parsing_ArcExpr.prototype.equals__O__Z = (function(x$1) {
  if ((this === x$1)) {
    return true
  } else if (ScalaJS.is.Lcom_repocad_web_parsing_ArcExpr(x$1)) {
    var ArcExpr$1 = ScalaJS.as.Lcom_repocad_web_parsing_ArcExpr(x$1);
    return ((((ScalaJS.anyRefEqEq(this.centerX$1, ArcExpr$1.centerX$1) && ScalaJS.anyRefEqEq(this.centerY$1, ArcExpr$1.centerY$1)) && ScalaJS.anyRefEqEq(this.radius$1, ArcExpr$1.radius$1)) && ScalaJS.anyRefEqEq(this.sAngle$1, ArcExpr$1.sAngle$1)) && ScalaJS.anyRefEqEq(this.eAngle$1, ArcExpr$1.eAngle$1))
  } else {
    return false
  }
});
ScalaJS.c.Lcom_repocad_web_parsing_ArcExpr.prototype.productElement__I__O = (function(x$1) {
  switch (x$1) {
    case 0:
      {
        return this.centerX$1;
        break
      };
    case 1:
      {
        return this.centerY$1;
        break
      };
    case 2:
      {
        return this.radius$1;
        break
      };
    case 3:
      {
        return this.sAngle$1;
        break
      };
    case 4:
      {
        return this.eAngle$1;
        break
      };
    default:
      throw new ScalaJS.c.jl_IndexOutOfBoundsException().init___T(ScalaJS.objectToString(x$1));
  }
});
ScalaJS.c.Lcom_repocad_web_parsing_ArcExpr.prototype.toString__T = (function() {
  return ScalaJS.m.sr_ScalaRunTime().$$undtoString__s_Product__T(this)
});
ScalaJS.c.Lcom_repocad_web_parsing_ArcExpr.prototype.init___Lcom_repocad_web_parsing_Expr__Lcom_repocad_web_parsing_Expr__Lcom_repocad_web_parsing_Expr__Lcom_repocad_web_parsing_Expr__Lcom_repocad_web_parsing_Expr = (function(centerX, centerY, radius, sAngle, eAngle) {
  this.centerX$1 = centerX;
  this.centerY$1 = centerY;
  this.radius$1 = radius;
  this.sAngle$1 = sAngle;
  this.eAngle$1 = eAngle;
  return this
});
ScalaJS.c.Lcom_repocad_web_parsing_ArcExpr.prototype.hashCode__I = (function() {
  var this$2 = ScalaJS.m.s_util_hashing_MurmurHash3();
  return this$2.productHash__s_Product__I__I(this, (-889275714))
});
ScalaJS.c.Lcom_repocad_web_parsing_ArcExpr.prototype.productIterator__sc_Iterator = (function() {
  return new ScalaJS.c.sr_ScalaRunTime$$anon$1().init___s_Product(this)
});
ScalaJS.is.Lcom_repocad_web_parsing_ArcExpr = (function(obj) {
  return (!(!((obj && obj.$classData) && obj.$classData.ancestors.Lcom_repocad_web_parsing_ArcExpr)))
});
ScalaJS.as.Lcom_repocad_web_parsing_ArcExpr = (function(obj) {
  return ((ScalaJS.is.Lcom_repocad_web_parsing_ArcExpr(obj) || (obj === null)) ? obj : ScalaJS.throwClassCastException(obj, "com.repocad.web.parsing.ArcExpr"))
});
ScalaJS.isArrayOf.Lcom_repocad_web_parsing_ArcExpr = (function(obj, depth) {
  return (!(!(((obj && obj.$classData) && (obj.$classData.arrayDepth === depth)) && obj.$classData.arrayBase.ancestors.Lcom_repocad_web_parsing_ArcExpr)))
});
ScalaJS.asArrayOf.Lcom_repocad_web_parsing_ArcExpr = (function(obj, depth) {
  return ((ScalaJS.isArrayOf.Lcom_repocad_web_parsing_ArcExpr(obj, depth) || (obj === null)) ? obj : ScalaJS.throwArrayCastException(obj, "Lcom.repocad.web.parsing.ArcExpr;", depth))
});
ScalaJS.d.Lcom_repocad_web_parsing_ArcExpr = new ScalaJS.ClassTypeData({
  Lcom_repocad_web_parsing_ArcExpr: 0
}, false, "com.repocad.web.parsing.ArcExpr", ScalaJS.d.O, {
  Lcom_repocad_web_parsing_ArcExpr: 1,
  s_Serializable: 1,
  Ljava_io_Serializable: 1,
  s_Product: 1,
  s_Equals: 1,
  Lcom_repocad_web_parsing_Expr: 1,
  O: 1
});
ScalaJS.c.Lcom_repocad_web_parsing_ArcExpr.prototype.$classData = ScalaJS.d.Lcom_repocad_web_parsing_ArcExpr;
/** @constructor */
ScalaJS.c.Lcom_repocad_web_parsing_BezierExpr = (function() {
  ScalaJS.c.O.call(this);
  this.x1$1 = null;
  this.y1$1 = null;
  this.x2$1 = null;
  this.y2$1 = null;
  this.x3$1 = null;
  this.y3$1 = null;
  this.x4$1 = null;
  this.y4$1 = null
});
ScalaJS.c.Lcom_repocad_web_parsing_BezierExpr.prototype = new ScalaJS.h.O();
ScalaJS.c.Lcom_repocad_web_parsing_BezierExpr.prototype.constructor = ScalaJS.c.Lcom_repocad_web_parsing_BezierExpr;
/** @constructor */
ScalaJS.h.Lcom_repocad_web_parsing_BezierExpr = (function() {
  /*<skip>*/
});
ScalaJS.h.Lcom_repocad_web_parsing_BezierExpr.prototype = ScalaJS.c.Lcom_repocad_web_parsing_BezierExpr.prototype;
ScalaJS.c.Lcom_repocad_web_parsing_BezierExpr.prototype.productPrefix__T = (function() {
  return "BezierExpr"
});
ScalaJS.c.Lcom_repocad_web_parsing_BezierExpr.prototype.productArity__I = (function() {
  return 8
});
ScalaJS.c.Lcom_repocad_web_parsing_BezierExpr.prototype.equals__O__Z = (function(x$1) {
  if ((this === x$1)) {
    return true
  } else if (ScalaJS.is.Lcom_repocad_web_parsing_BezierExpr(x$1)) {
    var BezierExpr$1 = ScalaJS.as.Lcom_repocad_web_parsing_BezierExpr(x$1);
    return (((((((ScalaJS.anyRefEqEq(this.x1$1, BezierExpr$1.x1$1) && ScalaJS.anyRefEqEq(this.y1$1, BezierExpr$1.y1$1)) && ScalaJS.anyRefEqEq(this.x2$1, BezierExpr$1.x2$1)) && ScalaJS.anyRefEqEq(this.y2$1, BezierExpr$1.y2$1)) && ScalaJS.anyRefEqEq(this.x3$1, BezierExpr$1.x3$1)) && ScalaJS.anyRefEqEq(this.y3$1, BezierExpr$1.y3$1)) && ScalaJS.anyRefEqEq(this.x4$1, BezierExpr$1.x4$1)) && ScalaJS.anyRefEqEq(this.y4$1, BezierExpr$1.y4$1))
  } else {
    return false
  }
});
ScalaJS.c.Lcom_repocad_web_parsing_BezierExpr.prototype.init___Lcom_repocad_web_parsing_Expr__Lcom_repocad_web_parsing_Expr__Lcom_repocad_web_parsing_Expr__Lcom_repocad_web_parsing_Expr__Lcom_repocad_web_parsing_Expr__Lcom_repocad_web_parsing_Expr__Lcom_repocad_web_parsing_Expr__Lcom_repocad_web_parsing_Expr = (function(x1, y1, x2, y2, x3, y3, x4, y4) {
  this.x1$1 = x1;
  this.y1$1 = y1;
  this.x2$1 = x2;
  this.y2$1 = y2;
  this.x3$1 = x3;
  this.y3$1 = y3;
  this.x4$1 = x4;
  this.y4$1 = y4;
  return this
});
ScalaJS.c.Lcom_repocad_web_parsing_BezierExpr.prototype.productElement__I__O = (function(x$1) {
  switch (x$1) {
    case 0:
      {
        return this.x1$1;
        break
      };
    case 1:
      {
        return this.y1$1;
        break
      };
    case 2:
      {
        return this.x2$1;
        break
      };
    case 3:
      {
        return this.y2$1;
        break
      };
    case 4:
      {
        return this.x3$1;
        break
      };
    case 5:
      {
        return this.y3$1;
        break
      };
    case 6:
      {
        return this.x4$1;
        break
      };
    case 7:
      {
        return this.y4$1;
        break
      };
    default:
      throw new ScalaJS.c.jl_IndexOutOfBoundsException().init___T(ScalaJS.objectToString(x$1));
  }
});
ScalaJS.c.Lcom_repocad_web_parsing_BezierExpr.prototype.toString__T = (function() {
  return ScalaJS.m.sr_ScalaRunTime().$$undtoString__s_Product__T(this)
});
ScalaJS.c.Lcom_repocad_web_parsing_BezierExpr.prototype.hashCode__I = (function() {
  var this$2 = ScalaJS.m.s_util_hashing_MurmurHash3();
  return this$2.productHash__s_Product__I__I(this, (-889275714))
});
ScalaJS.c.Lcom_repocad_web_parsing_BezierExpr.prototype.productIterator__sc_Iterator = (function() {
  return new ScalaJS.c.sr_ScalaRunTime$$anon$1().init___s_Product(this)
});
ScalaJS.is.Lcom_repocad_web_parsing_BezierExpr = (function(obj) {
  return (!(!((obj && obj.$classData) && obj.$classData.ancestors.Lcom_repocad_web_parsing_BezierExpr)))
});
ScalaJS.as.Lcom_repocad_web_parsing_BezierExpr = (function(obj) {
  return ((ScalaJS.is.Lcom_repocad_web_parsing_BezierExpr(obj) || (obj === null)) ? obj : ScalaJS.throwClassCastException(obj, "com.repocad.web.parsing.BezierExpr"))
});
ScalaJS.isArrayOf.Lcom_repocad_web_parsing_BezierExpr = (function(obj, depth) {
  return (!(!(((obj && obj.$classData) && (obj.$classData.arrayDepth === depth)) && obj.$classData.arrayBase.ancestors.Lcom_repocad_web_parsing_BezierExpr)))
});
ScalaJS.asArrayOf.Lcom_repocad_web_parsing_BezierExpr = (function(obj, depth) {
  return ((ScalaJS.isArrayOf.Lcom_repocad_web_parsing_BezierExpr(obj, depth) || (obj === null)) ? obj : ScalaJS.throwArrayCastException(obj, "Lcom.repocad.web.parsing.BezierExpr;", depth))
});
ScalaJS.d.Lcom_repocad_web_parsing_BezierExpr = new ScalaJS.ClassTypeData({
  Lcom_repocad_web_parsing_BezierExpr: 0
}, false, "com.repocad.web.parsing.BezierExpr", ScalaJS.d.O, {
  Lcom_repocad_web_parsing_BezierExpr: 1,
  s_Serializable: 1,
  Ljava_io_Serializable: 1,
  s_Product: 1,
  s_Equals: 1,
  Lcom_repocad_web_parsing_Expr: 1,
  O: 1
});
ScalaJS.c.Lcom_repocad_web_parsing_BezierExpr.prototype.$classData = ScalaJS.d.Lcom_repocad_web_parsing_BezierExpr;
/** @constructor */
ScalaJS.c.Lcom_repocad_web_parsing_CircleExpr = (function() {
  ScalaJS.c.O.call(this);
  this.centerX$1 = null;
  this.centerY$1 = null;
  this.radius$1 = null
});
ScalaJS.c.Lcom_repocad_web_parsing_CircleExpr.prototype = new ScalaJS.h.O();
ScalaJS.c.Lcom_repocad_web_parsing_CircleExpr.prototype.constructor = ScalaJS.c.Lcom_repocad_web_parsing_CircleExpr;
/** @constructor */
ScalaJS.h.Lcom_repocad_web_parsing_CircleExpr = (function() {
  /*<skip>*/
});
ScalaJS.h.Lcom_repocad_web_parsing_CircleExpr.prototype = ScalaJS.c.Lcom_repocad_web_parsing_CircleExpr.prototype;
ScalaJS.c.Lcom_repocad_web_parsing_CircleExpr.prototype.productPrefix__T = (function() {
  return "CircleExpr"
});
ScalaJS.c.Lcom_repocad_web_parsing_CircleExpr.prototype.init___Lcom_repocad_web_parsing_Expr__Lcom_repocad_web_parsing_Expr__Lcom_repocad_web_parsing_Expr = (function(centerX, centerY, radius) {
  this.centerX$1 = centerX;
  this.centerY$1 = centerY;
  this.radius$1 = radius;
  return this
});
ScalaJS.c.Lcom_repocad_web_parsing_CircleExpr.prototype.productArity__I = (function() {
  return 3
});
ScalaJS.c.Lcom_repocad_web_parsing_CircleExpr.prototype.equals__O__Z = (function(x$1) {
  if ((this === x$1)) {
    return true
  } else if (ScalaJS.is.Lcom_repocad_web_parsing_CircleExpr(x$1)) {
    var CircleExpr$1 = ScalaJS.as.Lcom_repocad_web_parsing_CircleExpr(x$1);
    return ((ScalaJS.anyRefEqEq(this.centerX$1, CircleExpr$1.centerX$1) && ScalaJS.anyRefEqEq(this.centerY$1, CircleExpr$1.centerY$1)) && ScalaJS.anyRefEqEq(this.radius$1, CircleExpr$1.radius$1))
  } else {
    return false
  }
});
ScalaJS.c.Lcom_repocad_web_parsing_CircleExpr.prototype.productElement__I__O = (function(x$1) {
  switch (x$1) {
    case 0:
      {
        return this.centerX$1;
        break
      };
    case 1:
      {
        return this.centerY$1;
        break
      };
    case 2:
      {
        return this.radius$1;
        break
      };
    default:
      throw new ScalaJS.c.jl_IndexOutOfBoundsException().init___T(ScalaJS.objectToString(x$1));
  }
});
ScalaJS.c.Lcom_repocad_web_parsing_CircleExpr.prototype.toString__T = (function() {
  return ScalaJS.m.sr_ScalaRunTime().$$undtoString__s_Product__T(this)
});
ScalaJS.c.Lcom_repocad_web_parsing_CircleExpr.prototype.hashCode__I = (function() {
  var this$2 = ScalaJS.m.s_util_hashing_MurmurHash3();
  return this$2.productHash__s_Product__I__I(this, (-889275714))
});
ScalaJS.c.Lcom_repocad_web_parsing_CircleExpr.prototype.productIterator__sc_Iterator = (function() {
  return new ScalaJS.c.sr_ScalaRunTime$$anon$1().init___s_Product(this)
});
ScalaJS.is.Lcom_repocad_web_parsing_CircleExpr = (function(obj) {
  return (!(!((obj && obj.$classData) && obj.$classData.ancestors.Lcom_repocad_web_parsing_CircleExpr)))
});
ScalaJS.as.Lcom_repocad_web_parsing_CircleExpr = (function(obj) {
  return ((ScalaJS.is.Lcom_repocad_web_parsing_CircleExpr(obj) || (obj === null)) ? obj : ScalaJS.throwClassCastException(obj, "com.repocad.web.parsing.CircleExpr"))
});
ScalaJS.isArrayOf.Lcom_repocad_web_parsing_CircleExpr = (function(obj, depth) {
  return (!(!(((obj && obj.$classData) && (obj.$classData.arrayDepth === depth)) && obj.$classData.arrayBase.ancestors.Lcom_repocad_web_parsing_CircleExpr)))
});
ScalaJS.asArrayOf.Lcom_repocad_web_parsing_CircleExpr = (function(obj, depth) {
  return ((ScalaJS.isArrayOf.Lcom_repocad_web_parsing_CircleExpr(obj, depth) || (obj === null)) ? obj : ScalaJS.throwArrayCastException(obj, "Lcom.repocad.web.parsing.CircleExpr;", depth))
});
ScalaJS.d.Lcom_repocad_web_parsing_CircleExpr = new ScalaJS.ClassTypeData({
  Lcom_repocad_web_parsing_CircleExpr: 0
}, false, "com.repocad.web.parsing.CircleExpr", ScalaJS.d.O, {
  Lcom_repocad_web_parsing_CircleExpr: 1,
  s_Serializable: 1,
  Ljava_io_Serializable: 1,
  s_Product: 1,
  s_Equals: 1,
  Lcom_repocad_web_parsing_Expr: 1,
  O: 1
});
ScalaJS.c.Lcom_repocad_web_parsing_CircleExpr.prototype.$classData = ScalaJS.d.Lcom_repocad_web_parsing_CircleExpr;
/** @constructor */
ScalaJS.c.Lcom_repocad_web_parsing_CompExpr = (function() {
  ScalaJS.c.O.call(this);
  this.e1$1 = null;
  this.e2$1 = null;
  this.op$1 = null
});
ScalaJS.c.Lcom_repocad_web_parsing_CompExpr.prototype = new ScalaJS.h.O();
ScalaJS.c.Lcom_repocad_web_parsing_CompExpr.prototype.constructor = ScalaJS.c.Lcom_repocad_web_parsing_CompExpr;
/** @constructor */
ScalaJS.h.Lcom_repocad_web_parsing_CompExpr = (function() {
  /*<skip>*/
});
ScalaJS.h.Lcom_repocad_web_parsing_CompExpr.prototype = ScalaJS.c.Lcom_repocad_web_parsing_CompExpr.prototype;
ScalaJS.c.Lcom_repocad_web_parsing_CompExpr.prototype.productPrefix__T = (function() {
  return "CompExpr"
});
ScalaJS.c.Lcom_repocad_web_parsing_CompExpr.prototype.productArity__I = (function() {
  return 3
});
ScalaJS.c.Lcom_repocad_web_parsing_CompExpr.prototype.equals__O__Z = (function(x$1) {
  if ((this === x$1)) {
    return true
  } else if (ScalaJS.is.Lcom_repocad_web_parsing_CompExpr(x$1)) {
    var CompExpr$1 = ScalaJS.as.Lcom_repocad_web_parsing_CompExpr(x$1);
    return ((ScalaJS.anyRefEqEq(this.e1$1, CompExpr$1.e1$1) && ScalaJS.anyRefEqEq(this.e2$1, CompExpr$1.e2$1)) && ScalaJS.anyRefEqEq(this.op$1, CompExpr$1.op$1))
  } else {
    return false
  }
});
ScalaJS.c.Lcom_repocad_web_parsing_CompExpr.prototype.productElement__I__O = (function(x$1) {
  switch (x$1) {
    case 0:
      {
        return this.e1$1;
        break
      };
    case 1:
      {
        return this.e2$1;
        break
      };
    case 2:
      {
        return this.op$1;
        break
      };
    default:
      throw new ScalaJS.c.jl_IndexOutOfBoundsException().init___T(ScalaJS.objectToString(x$1));
  }
});
ScalaJS.c.Lcom_repocad_web_parsing_CompExpr.prototype.toString__T = (function() {
  return ScalaJS.m.sr_ScalaRunTime().$$undtoString__s_Product__T(this)
});
ScalaJS.c.Lcom_repocad_web_parsing_CompExpr.prototype.init___Lcom_repocad_web_parsing_Expr__Lcom_repocad_web_parsing_Expr__T = (function(e1, e2, op) {
  this.e1$1 = e1;
  this.e2$1 = e2;
  this.op$1 = op;
  return this
});
ScalaJS.c.Lcom_repocad_web_parsing_CompExpr.prototype.hashCode__I = (function() {
  var this$2 = ScalaJS.m.s_util_hashing_MurmurHash3();
  return this$2.productHash__s_Product__I__I(this, (-889275714))
});
ScalaJS.c.Lcom_repocad_web_parsing_CompExpr.prototype.productIterator__sc_Iterator = (function() {
  return new ScalaJS.c.sr_ScalaRunTime$$anon$1().init___s_Product(this)
});
ScalaJS.is.Lcom_repocad_web_parsing_CompExpr = (function(obj) {
  return (!(!((obj && obj.$classData) && obj.$classData.ancestors.Lcom_repocad_web_parsing_CompExpr)))
});
ScalaJS.as.Lcom_repocad_web_parsing_CompExpr = (function(obj) {
  return ((ScalaJS.is.Lcom_repocad_web_parsing_CompExpr(obj) || (obj === null)) ? obj : ScalaJS.throwClassCastException(obj, "com.repocad.web.parsing.CompExpr"))
});
ScalaJS.isArrayOf.Lcom_repocad_web_parsing_CompExpr = (function(obj, depth) {
  return (!(!(((obj && obj.$classData) && (obj.$classData.arrayDepth === depth)) && obj.$classData.arrayBase.ancestors.Lcom_repocad_web_parsing_CompExpr)))
});
ScalaJS.asArrayOf.Lcom_repocad_web_parsing_CompExpr = (function(obj, depth) {
  return ((ScalaJS.isArrayOf.Lcom_repocad_web_parsing_CompExpr(obj, depth) || (obj === null)) ? obj : ScalaJS.throwArrayCastException(obj, "Lcom.repocad.web.parsing.CompExpr;", depth))
});
ScalaJS.d.Lcom_repocad_web_parsing_CompExpr = new ScalaJS.ClassTypeData({
  Lcom_repocad_web_parsing_CompExpr: 0
}, false, "com.repocad.web.parsing.CompExpr", ScalaJS.d.O, {
  Lcom_repocad_web_parsing_CompExpr: 1,
  s_Serializable: 1,
  Ljava_io_Serializable: 1,
  s_Product: 1,
  s_Equals: 1,
  Lcom_repocad_web_parsing_Expr: 1,
  O: 1
});
ScalaJS.c.Lcom_repocad_web_parsing_CompExpr.prototype.$classData = ScalaJS.d.Lcom_repocad_web_parsing_CompExpr;
/** @constructor */
ScalaJS.c.Lcom_repocad_web_parsing_ConstantExpr = (function() {
  ScalaJS.c.O.call(this);
  this.value$1 = null
});
ScalaJS.c.Lcom_repocad_web_parsing_ConstantExpr.prototype = new ScalaJS.h.O();
ScalaJS.c.Lcom_repocad_web_parsing_ConstantExpr.prototype.constructor = ScalaJS.c.Lcom_repocad_web_parsing_ConstantExpr;
/** @constructor */
ScalaJS.h.Lcom_repocad_web_parsing_ConstantExpr = (function() {
  /*<skip>*/
});
ScalaJS.h.Lcom_repocad_web_parsing_ConstantExpr.prototype = ScalaJS.c.Lcom_repocad_web_parsing_ConstantExpr.prototype;
ScalaJS.c.Lcom_repocad_web_parsing_ConstantExpr.prototype.productPrefix__T = (function() {
  return "ConstantExpr"
});
ScalaJS.c.Lcom_repocad_web_parsing_ConstantExpr.prototype.productArity__I = (function() {
  return 1
});
ScalaJS.c.Lcom_repocad_web_parsing_ConstantExpr.prototype.equals__O__Z = (function(x$1) {
  if ((this === x$1)) {
    return true
  } else if (ScalaJS.is.Lcom_repocad_web_parsing_ConstantExpr(x$1)) {
    var ConstantExpr$1 = ScalaJS.as.Lcom_repocad_web_parsing_ConstantExpr(x$1);
    return ScalaJS.anyEqEq(this.value$1, ConstantExpr$1.value$1)
  } else {
    return false
  }
});
ScalaJS.c.Lcom_repocad_web_parsing_ConstantExpr.prototype.productElement__I__O = (function(x$1) {
  switch (x$1) {
    case 0:
      {
        return this.value$1;
        break
      };
    default:
      throw new ScalaJS.c.jl_IndexOutOfBoundsException().init___T(ScalaJS.objectToString(x$1));
  }
});
ScalaJS.c.Lcom_repocad_web_parsing_ConstantExpr.prototype.toString__T = (function() {
  return ScalaJS.m.sr_ScalaRunTime().$$undtoString__s_Product__T(this)
});
ScalaJS.c.Lcom_repocad_web_parsing_ConstantExpr.prototype.init___O = (function(value) {
  this.value$1 = value;
  return this
});
ScalaJS.c.Lcom_repocad_web_parsing_ConstantExpr.prototype.hashCode__I = (function() {
  var this$2 = ScalaJS.m.s_util_hashing_MurmurHash3();
  return this$2.productHash__s_Product__I__I(this, (-889275714))
});
ScalaJS.c.Lcom_repocad_web_parsing_ConstantExpr.prototype.productIterator__sc_Iterator = (function() {
  return new ScalaJS.c.sr_ScalaRunTime$$anon$1().init___s_Product(this)
});
ScalaJS.is.Lcom_repocad_web_parsing_ConstantExpr = (function(obj) {
  return (!(!((obj && obj.$classData) && obj.$classData.ancestors.Lcom_repocad_web_parsing_ConstantExpr)))
});
ScalaJS.as.Lcom_repocad_web_parsing_ConstantExpr = (function(obj) {
  return ((ScalaJS.is.Lcom_repocad_web_parsing_ConstantExpr(obj) || (obj === null)) ? obj : ScalaJS.throwClassCastException(obj, "com.repocad.web.parsing.ConstantExpr"))
});
ScalaJS.isArrayOf.Lcom_repocad_web_parsing_ConstantExpr = (function(obj, depth) {
  return (!(!(((obj && obj.$classData) && (obj.$classData.arrayDepth === depth)) && obj.$classData.arrayBase.ancestors.Lcom_repocad_web_parsing_ConstantExpr)))
});
ScalaJS.asArrayOf.Lcom_repocad_web_parsing_ConstantExpr = (function(obj, depth) {
  return ((ScalaJS.isArrayOf.Lcom_repocad_web_parsing_ConstantExpr(obj, depth) || (obj === null)) ? obj : ScalaJS.throwArrayCastException(obj, "Lcom.repocad.web.parsing.ConstantExpr;", depth))
});
ScalaJS.d.Lcom_repocad_web_parsing_ConstantExpr = new ScalaJS.ClassTypeData({
  Lcom_repocad_web_parsing_ConstantExpr: 0
}, false, "com.repocad.web.parsing.ConstantExpr", ScalaJS.d.O, {
  Lcom_repocad_web_parsing_ConstantExpr: 1,
  s_Serializable: 1,
  Ljava_io_Serializable: 1,
  s_Product: 1,
  s_Equals: 1,
  Lcom_repocad_web_parsing_ValueExpr: 1,
  Lcom_repocad_web_parsing_Expr: 1,
  O: 1
});
ScalaJS.c.Lcom_repocad_web_parsing_ConstantExpr.prototype.$classData = ScalaJS.d.Lcom_repocad_web_parsing_ConstantExpr;
ScalaJS.is.Lcom_repocad_web_parsing_Expr = (function(obj) {
  return (!(!((obj && obj.$classData) && obj.$classData.ancestors.Lcom_repocad_web_parsing_Expr)))
});
ScalaJS.as.Lcom_repocad_web_parsing_Expr = (function(obj) {
  return ((ScalaJS.is.Lcom_repocad_web_parsing_Expr(obj) || (obj === null)) ? obj : ScalaJS.throwClassCastException(obj, "com.repocad.web.parsing.Expr"))
});
ScalaJS.isArrayOf.Lcom_repocad_web_parsing_Expr = (function(obj, depth) {
  return (!(!(((obj && obj.$classData) && (obj.$classData.arrayDepth === depth)) && obj.$classData.arrayBase.ancestors.Lcom_repocad_web_parsing_Expr)))
});
ScalaJS.asArrayOf.Lcom_repocad_web_parsing_Expr = (function(obj, depth) {
  return ((ScalaJS.isArrayOf.Lcom_repocad_web_parsing_Expr(obj, depth) || (obj === null)) ? obj : ScalaJS.throwArrayCastException(obj, "Lcom.repocad.web.parsing.Expr;", depth))
});
ScalaJS.d.Lcom_repocad_web_parsing_Expr = new ScalaJS.ClassTypeData({
  Lcom_repocad_web_parsing_Expr: 0
}, true, "com.repocad.web.parsing.Expr", (void 0), {
  Lcom_repocad_web_parsing_Expr: 1,
  O: 1
});
/** @constructor */
ScalaJS.c.Lcom_repocad_web_parsing_FunctionExpr = (function() {
  ScalaJS.c.O.call(this);
  this.name$1 = null;
  this.params$1 = null;
  this.body$1 = null
});
ScalaJS.c.Lcom_repocad_web_parsing_FunctionExpr.prototype = new ScalaJS.h.O();
ScalaJS.c.Lcom_repocad_web_parsing_FunctionExpr.prototype.constructor = ScalaJS.c.Lcom_repocad_web_parsing_FunctionExpr;
/** @constructor */
ScalaJS.h.Lcom_repocad_web_parsing_FunctionExpr = (function() {
  /*<skip>*/
});
ScalaJS.h.Lcom_repocad_web_parsing_FunctionExpr.prototype = ScalaJS.c.Lcom_repocad_web_parsing_FunctionExpr.prototype;
ScalaJS.c.Lcom_repocad_web_parsing_FunctionExpr.prototype.productPrefix__T = (function() {
  return "FunctionExpr"
});
ScalaJS.c.Lcom_repocad_web_parsing_FunctionExpr.prototype.productArity__I = (function() {
  return 3
});
ScalaJS.c.Lcom_repocad_web_parsing_FunctionExpr.prototype.equals__O__Z = (function(x$1) {
  if ((this === x$1)) {
    return true
  } else if (ScalaJS.is.Lcom_repocad_web_parsing_FunctionExpr(x$1)) {
    var FunctionExpr$1 = ScalaJS.as.Lcom_repocad_web_parsing_FunctionExpr(x$1);
    return ((ScalaJS.anyRefEqEq(this.name$1, FunctionExpr$1.name$1) && ScalaJS.anyRefEqEq(this.params$1, FunctionExpr$1.params$1)) && ScalaJS.anyRefEqEq(this.body$1, FunctionExpr$1.body$1))
  } else {
    return false
  }
});
ScalaJS.c.Lcom_repocad_web_parsing_FunctionExpr.prototype.productElement__I__O = (function(x$1) {
  switch (x$1) {
    case 0:
      {
        return this.name$1;
        break
      };
    case 1:
      {
        return this.params$1;
        break
      };
    case 2:
      {
        return this.body$1;
        break
      };
    default:
      throw new ScalaJS.c.jl_IndexOutOfBoundsException().init___T(ScalaJS.objectToString(x$1));
  }
});
ScalaJS.c.Lcom_repocad_web_parsing_FunctionExpr.prototype.toString__T = (function() {
  return ScalaJS.m.sr_ScalaRunTime().$$undtoString__s_Product__T(this)
});
ScalaJS.c.Lcom_repocad_web_parsing_FunctionExpr.prototype.hashCode__I = (function() {
  var this$2 = ScalaJS.m.s_util_hashing_MurmurHash3();
  return this$2.productHash__s_Product__I__I(this, (-889275714))
});
ScalaJS.c.Lcom_repocad_web_parsing_FunctionExpr.prototype.productIterator__sc_Iterator = (function() {
  return new ScalaJS.c.sr_ScalaRunTime$$anon$1().init___s_Product(this)
});
ScalaJS.c.Lcom_repocad_web_parsing_FunctionExpr.prototype.init___T__sc_Seq__Lcom_repocad_web_parsing_Expr = (function(name, params, body) {
  this.name$1 = name;
  this.params$1 = params;
  this.body$1 = body;
  return this
});
ScalaJS.is.Lcom_repocad_web_parsing_FunctionExpr = (function(obj) {
  return (!(!((obj && obj.$classData) && obj.$classData.ancestors.Lcom_repocad_web_parsing_FunctionExpr)))
});
ScalaJS.as.Lcom_repocad_web_parsing_FunctionExpr = (function(obj) {
  return ((ScalaJS.is.Lcom_repocad_web_parsing_FunctionExpr(obj) || (obj === null)) ? obj : ScalaJS.throwClassCastException(obj, "com.repocad.web.parsing.FunctionExpr"))
});
ScalaJS.isArrayOf.Lcom_repocad_web_parsing_FunctionExpr = (function(obj, depth) {
  return (!(!(((obj && obj.$classData) && (obj.$classData.arrayDepth === depth)) && obj.$classData.arrayBase.ancestors.Lcom_repocad_web_parsing_FunctionExpr)))
});
ScalaJS.asArrayOf.Lcom_repocad_web_parsing_FunctionExpr = (function(obj, depth) {
  return ((ScalaJS.isArrayOf.Lcom_repocad_web_parsing_FunctionExpr(obj, depth) || (obj === null)) ? obj : ScalaJS.throwArrayCastException(obj, "Lcom.repocad.web.parsing.FunctionExpr;", depth))
});
ScalaJS.d.Lcom_repocad_web_parsing_FunctionExpr = new ScalaJS.ClassTypeData({
  Lcom_repocad_web_parsing_FunctionExpr: 0
}, false, "com.repocad.web.parsing.FunctionExpr", ScalaJS.d.O, {
  Lcom_repocad_web_parsing_FunctionExpr: 1,
  s_Serializable: 1,
  Ljava_io_Serializable: 1,
  s_Product: 1,
  s_Equals: 1,
  Lcom_repocad_web_parsing_Expr: 1,
  O: 1
});
ScalaJS.c.Lcom_repocad_web_parsing_FunctionExpr.prototype.$classData = ScalaJS.d.Lcom_repocad_web_parsing_FunctionExpr;
/** @constructor */
ScalaJS.c.Lcom_repocad_web_parsing_ImportExpr = (function() {
  ScalaJS.c.O.call(this);
  this.name$1 = null
});
ScalaJS.c.Lcom_repocad_web_parsing_ImportExpr.prototype = new ScalaJS.h.O();
ScalaJS.c.Lcom_repocad_web_parsing_ImportExpr.prototype.constructor = ScalaJS.c.Lcom_repocad_web_parsing_ImportExpr;
/** @constructor */
ScalaJS.h.Lcom_repocad_web_parsing_ImportExpr = (function() {
  /*<skip>*/
});
ScalaJS.h.Lcom_repocad_web_parsing_ImportExpr.prototype = ScalaJS.c.Lcom_repocad_web_parsing_ImportExpr.prototype;
ScalaJS.c.Lcom_repocad_web_parsing_ImportExpr.prototype.productPrefix__T = (function() {
  return "ImportExpr"
});
ScalaJS.c.Lcom_repocad_web_parsing_ImportExpr.prototype.productArity__I = (function() {
  return 1
});
ScalaJS.c.Lcom_repocad_web_parsing_ImportExpr.prototype.equals__O__Z = (function(x$1) {
  if ((this === x$1)) {
    return true
  } else if (ScalaJS.is.Lcom_repocad_web_parsing_ImportExpr(x$1)) {
    var ImportExpr$1 = ScalaJS.as.Lcom_repocad_web_parsing_ImportExpr(x$1);
    return ScalaJS.anyRefEqEq(this.name$1, ImportExpr$1.name$1)
  } else {
    return false
  }
});
ScalaJS.c.Lcom_repocad_web_parsing_ImportExpr.prototype.productElement__I__O = (function(x$1) {
  switch (x$1) {
    case 0:
      {
        return this.name$1;
        break
      };
    default:
      throw new ScalaJS.c.jl_IndexOutOfBoundsException().init___T(ScalaJS.objectToString(x$1));
  }
});
ScalaJS.c.Lcom_repocad_web_parsing_ImportExpr.prototype.toString__T = (function() {
  return ScalaJS.m.sr_ScalaRunTime().$$undtoString__s_Product__T(this)
});
ScalaJS.c.Lcom_repocad_web_parsing_ImportExpr.prototype.hashCode__I = (function() {
  var this$2 = ScalaJS.m.s_util_hashing_MurmurHash3();
  return this$2.productHash__s_Product__I__I(this, (-889275714))
});
ScalaJS.c.Lcom_repocad_web_parsing_ImportExpr.prototype.productIterator__sc_Iterator = (function() {
  return new ScalaJS.c.sr_ScalaRunTime$$anon$1().init___s_Product(this)
});
ScalaJS.c.Lcom_repocad_web_parsing_ImportExpr.prototype.init___Lcom_repocad_web_parsing_RefExpr = (function(name) {
  this.name$1 = name;
  return this
});
ScalaJS.is.Lcom_repocad_web_parsing_ImportExpr = (function(obj) {
  return (!(!((obj && obj.$classData) && obj.$classData.ancestors.Lcom_repocad_web_parsing_ImportExpr)))
});
ScalaJS.as.Lcom_repocad_web_parsing_ImportExpr = (function(obj) {
  return ((ScalaJS.is.Lcom_repocad_web_parsing_ImportExpr(obj) || (obj === null)) ? obj : ScalaJS.throwClassCastException(obj, "com.repocad.web.parsing.ImportExpr"))
});
ScalaJS.isArrayOf.Lcom_repocad_web_parsing_ImportExpr = (function(obj, depth) {
  return (!(!(((obj && obj.$classData) && (obj.$classData.arrayDepth === depth)) && obj.$classData.arrayBase.ancestors.Lcom_repocad_web_parsing_ImportExpr)))
});
ScalaJS.asArrayOf.Lcom_repocad_web_parsing_ImportExpr = (function(obj, depth) {
  return ((ScalaJS.isArrayOf.Lcom_repocad_web_parsing_ImportExpr(obj, depth) || (obj === null)) ? obj : ScalaJS.throwArrayCastException(obj, "Lcom.repocad.web.parsing.ImportExpr;", depth))
});
ScalaJS.d.Lcom_repocad_web_parsing_ImportExpr = new ScalaJS.ClassTypeData({
  Lcom_repocad_web_parsing_ImportExpr: 0
}, false, "com.repocad.web.parsing.ImportExpr", ScalaJS.d.O, {
  Lcom_repocad_web_parsing_ImportExpr: 1,
  s_Serializable: 1,
  Ljava_io_Serializable: 1,
  s_Product: 1,
  s_Equals: 1,
  Lcom_repocad_web_parsing_Expr: 1,
  O: 1
});
ScalaJS.c.Lcom_repocad_web_parsing_ImportExpr.prototype.$classData = ScalaJS.d.Lcom_repocad_web_parsing_ImportExpr;
/** @constructor */
ScalaJS.c.Lcom_repocad_web_parsing_LineExpr = (function() {
  ScalaJS.c.O.call(this);
  this.e1$1 = null;
  this.e2$1 = null;
  this.e3$1 = null;
  this.e4$1 = null
});
ScalaJS.c.Lcom_repocad_web_parsing_LineExpr.prototype = new ScalaJS.h.O();
ScalaJS.c.Lcom_repocad_web_parsing_LineExpr.prototype.constructor = ScalaJS.c.Lcom_repocad_web_parsing_LineExpr;
/** @constructor */
ScalaJS.h.Lcom_repocad_web_parsing_LineExpr = (function() {
  /*<skip>*/
});
ScalaJS.h.Lcom_repocad_web_parsing_LineExpr.prototype = ScalaJS.c.Lcom_repocad_web_parsing_LineExpr.prototype;
ScalaJS.c.Lcom_repocad_web_parsing_LineExpr.prototype.productPrefix__T = (function() {
  return "LineExpr"
});
ScalaJS.c.Lcom_repocad_web_parsing_LineExpr.prototype.productArity__I = (function() {
  return 4
});
ScalaJS.c.Lcom_repocad_web_parsing_LineExpr.prototype.equals__O__Z = (function(x$1) {
  if ((this === x$1)) {
    return true
  } else if (ScalaJS.is.Lcom_repocad_web_parsing_LineExpr(x$1)) {
    var LineExpr$1 = ScalaJS.as.Lcom_repocad_web_parsing_LineExpr(x$1);
    return (((ScalaJS.anyRefEqEq(this.e1$1, LineExpr$1.e1$1) && ScalaJS.anyRefEqEq(this.e2$1, LineExpr$1.e2$1)) && ScalaJS.anyRefEqEq(this.e3$1, LineExpr$1.e3$1)) && ScalaJS.anyRefEqEq(this.e4$1, LineExpr$1.e4$1))
  } else {
    return false
  }
});
ScalaJS.c.Lcom_repocad_web_parsing_LineExpr.prototype.productElement__I__O = (function(x$1) {
  switch (x$1) {
    case 0:
      {
        return this.e1$1;
        break
      };
    case 1:
      {
        return this.e2$1;
        break
      };
    case 2:
      {
        return this.e3$1;
        break
      };
    case 3:
      {
        return this.e4$1;
        break
      };
    default:
      throw new ScalaJS.c.jl_IndexOutOfBoundsException().init___T(ScalaJS.objectToString(x$1));
  }
});
ScalaJS.c.Lcom_repocad_web_parsing_LineExpr.prototype.toString__T = (function() {
  return ScalaJS.m.sr_ScalaRunTime().$$undtoString__s_Product__T(this)
});
ScalaJS.c.Lcom_repocad_web_parsing_LineExpr.prototype.hashCode__I = (function() {
  var this$2 = ScalaJS.m.s_util_hashing_MurmurHash3();
  return this$2.productHash__s_Product__I__I(this, (-889275714))
});
ScalaJS.c.Lcom_repocad_web_parsing_LineExpr.prototype.productIterator__sc_Iterator = (function() {
  return new ScalaJS.c.sr_ScalaRunTime$$anon$1().init___s_Product(this)
});
ScalaJS.c.Lcom_repocad_web_parsing_LineExpr.prototype.init___Lcom_repocad_web_parsing_Expr__Lcom_repocad_web_parsing_Expr__Lcom_repocad_web_parsing_Expr__Lcom_repocad_web_parsing_Expr = (function(e1, e2, e3, e4) {
  this.e1$1 = e1;
  this.e2$1 = e2;
  this.e3$1 = e3;
  this.e4$1 = e4;
  return this
});
ScalaJS.is.Lcom_repocad_web_parsing_LineExpr = (function(obj) {
  return (!(!((obj && obj.$classData) && obj.$classData.ancestors.Lcom_repocad_web_parsing_LineExpr)))
});
ScalaJS.as.Lcom_repocad_web_parsing_LineExpr = (function(obj) {
  return ((ScalaJS.is.Lcom_repocad_web_parsing_LineExpr(obj) || (obj === null)) ? obj : ScalaJS.throwClassCastException(obj, "com.repocad.web.parsing.LineExpr"))
});
ScalaJS.isArrayOf.Lcom_repocad_web_parsing_LineExpr = (function(obj, depth) {
  return (!(!(((obj && obj.$classData) && (obj.$classData.arrayDepth === depth)) && obj.$classData.arrayBase.ancestors.Lcom_repocad_web_parsing_LineExpr)))
});
ScalaJS.asArrayOf.Lcom_repocad_web_parsing_LineExpr = (function(obj, depth) {
  return ((ScalaJS.isArrayOf.Lcom_repocad_web_parsing_LineExpr(obj, depth) || (obj === null)) ? obj : ScalaJS.throwArrayCastException(obj, "Lcom.repocad.web.parsing.LineExpr;", depth))
});
ScalaJS.d.Lcom_repocad_web_parsing_LineExpr = new ScalaJS.ClassTypeData({
  Lcom_repocad_web_parsing_LineExpr: 0
}, false, "com.repocad.web.parsing.LineExpr", ScalaJS.d.O, {
  Lcom_repocad_web_parsing_LineExpr: 1,
  s_Serializable: 1,
  Ljava_io_Serializable: 1,
  s_Product: 1,
  s_Equals: 1,
  Lcom_repocad_web_parsing_Expr: 1,
  O: 1
});
ScalaJS.c.Lcom_repocad_web_parsing_LineExpr.prototype.$classData = ScalaJS.d.Lcom_repocad_web_parsing_LineExpr;
/** @constructor */
ScalaJS.c.Lcom_repocad_web_parsing_LoopExpr = (function() {
  ScalaJS.c.O.call(this);
  this.condition$1 = null;
  this.body$1 = null
});
ScalaJS.c.Lcom_repocad_web_parsing_LoopExpr.prototype = new ScalaJS.h.O();
ScalaJS.c.Lcom_repocad_web_parsing_LoopExpr.prototype.constructor = ScalaJS.c.Lcom_repocad_web_parsing_LoopExpr;
/** @constructor */
ScalaJS.h.Lcom_repocad_web_parsing_LoopExpr = (function() {
  /*<skip>*/
});
ScalaJS.h.Lcom_repocad_web_parsing_LoopExpr.prototype = ScalaJS.c.Lcom_repocad_web_parsing_LoopExpr.prototype;
ScalaJS.c.Lcom_repocad_web_parsing_LoopExpr.prototype.productPrefix__T = (function() {
  return "LoopExpr"
});
ScalaJS.c.Lcom_repocad_web_parsing_LoopExpr.prototype.productArity__I = (function() {
  return 2
});
ScalaJS.c.Lcom_repocad_web_parsing_LoopExpr.prototype.init___Lcom_repocad_web_parsing_Expr__Lcom_repocad_web_parsing_Expr = (function(condition, body) {
  this.condition$1 = condition;
  this.body$1 = body;
  return this
});
ScalaJS.c.Lcom_repocad_web_parsing_LoopExpr.prototype.equals__O__Z = (function(x$1) {
  if ((this === x$1)) {
    return true
  } else if (ScalaJS.is.Lcom_repocad_web_parsing_LoopExpr(x$1)) {
    var LoopExpr$1 = ScalaJS.as.Lcom_repocad_web_parsing_LoopExpr(x$1);
    return (ScalaJS.anyRefEqEq(this.condition$1, LoopExpr$1.condition$1) && ScalaJS.anyRefEqEq(this.body$1, LoopExpr$1.body$1))
  } else {
    return false
  }
});
ScalaJS.c.Lcom_repocad_web_parsing_LoopExpr.prototype.productElement__I__O = (function(x$1) {
  switch (x$1) {
    case 0:
      {
        return this.condition$1;
        break
      };
    case 1:
      {
        return this.body$1;
        break
      };
    default:
      throw new ScalaJS.c.jl_IndexOutOfBoundsException().init___T(ScalaJS.objectToString(x$1));
  }
});
ScalaJS.c.Lcom_repocad_web_parsing_LoopExpr.prototype.toString__T = (function() {
  return ScalaJS.m.sr_ScalaRunTime().$$undtoString__s_Product__T(this)
});
ScalaJS.c.Lcom_repocad_web_parsing_LoopExpr.prototype.hashCode__I = (function() {
  var this$2 = ScalaJS.m.s_util_hashing_MurmurHash3();
  return this$2.productHash__s_Product__I__I(this, (-889275714))
});
ScalaJS.c.Lcom_repocad_web_parsing_LoopExpr.prototype.productIterator__sc_Iterator = (function() {
  return new ScalaJS.c.sr_ScalaRunTime$$anon$1().init___s_Product(this)
});
ScalaJS.is.Lcom_repocad_web_parsing_LoopExpr = (function(obj) {
  return (!(!((obj && obj.$classData) && obj.$classData.ancestors.Lcom_repocad_web_parsing_LoopExpr)))
});
ScalaJS.as.Lcom_repocad_web_parsing_LoopExpr = (function(obj) {
  return ((ScalaJS.is.Lcom_repocad_web_parsing_LoopExpr(obj) || (obj === null)) ? obj : ScalaJS.throwClassCastException(obj, "com.repocad.web.parsing.LoopExpr"))
});
ScalaJS.isArrayOf.Lcom_repocad_web_parsing_LoopExpr = (function(obj, depth) {
  return (!(!(((obj && obj.$classData) && (obj.$classData.arrayDepth === depth)) && obj.$classData.arrayBase.ancestors.Lcom_repocad_web_parsing_LoopExpr)))
});
ScalaJS.asArrayOf.Lcom_repocad_web_parsing_LoopExpr = (function(obj, depth) {
  return ((ScalaJS.isArrayOf.Lcom_repocad_web_parsing_LoopExpr(obj, depth) || (obj === null)) ? obj : ScalaJS.throwArrayCastException(obj, "Lcom.repocad.web.parsing.LoopExpr;", depth))
});
ScalaJS.d.Lcom_repocad_web_parsing_LoopExpr = new ScalaJS.ClassTypeData({
  Lcom_repocad_web_parsing_LoopExpr: 0
}, false, "com.repocad.web.parsing.LoopExpr", ScalaJS.d.O, {
  Lcom_repocad_web_parsing_LoopExpr: 1,
  s_Serializable: 1,
  Ljava_io_Serializable: 1,
  s_Product: 1,
  s_Equals: 1,
  Lcom_repocad_web_parsing_Expr: 1,
  O: 1
});
ScalaJS.c.Lcom_repocad_web_parsing_LoopExpr.prototype.$classData = ScalaJS.d.Lcom_repocad_web_parsing_LoopExpr;
/** @constructor */
ScalaJS.c.Lcom_repocad_web_parsing_OpExpr = (function() {
  ScalaJS.c.O.call(this);
  this.e1$1 = null;
  this.e2$1 = null;
  this.op$1 = null
});
ScalaJS.c.Lcom_repocad_web_parsing_OpExpr.prototype = new ScalaJS.h.O();
ScalaJS.c.Lcom_repocad_web_parsing_OpExpr.prototype.constructor = ScalaJS.c.Lcom_repocad_web_parsing_OpExpr;
/** @constructor */
ScalaJS.h.Lcom_repocad_web_parsing_OpExpr = (function() {
  /*<skip>*/
});
ScalaJS.h.Lcom_repocad_web_parsing_OpExpr.prototype = ScalaJS.c.Lcom_repocad_web_parsing_OpExpr.prototype;
ScalaJS.c.Lcom_repocad_web_parsing_OpExpr.prototype.productPrefix__T = (function() {
  return "OpExpr"
});
ScalaJS.c.Lcom_repocad_web_parsing_OpExpr.prototype.productArity__I = (function() {
  return 3
});
ScalaJS.c.Lcom_repocad_web_parsing_OpExpr.prototype.equals__O__Z = (function(x$1) {
  if ((this === x$1)) {
    return true
  } else if (ScalaJS.is.Lcom_repocad_web_parsing_OpExpr(x$1)) {
    var OpExpr$1 = ScalaJS.as.Lcom_repocad_web_parsing_OpExpr(x$1);
    return ((ScalaJS.anyRefEqEq(this.e1$1, OpExpr$1.e1$1) && ScalaJS.anyRefEqEq(this.e2$1, OpExpr$1.e2$1)) && ScalaJS.anyRefEqEq(this.op$1, OpExpr$1.op$1))
  } else {
    return false
  }
});
ScalaJS.c.Lcom_repocad_web_parsing_OpExpr.prototype.productElement__I__O = (function(x$1) {
  switch (x$1) {
    case 0:
      {
        return this.e1$1;
        break
      };
    case 1:
      {
        return this.e2$1;
        break
      };
    case 2:
      {
        return this.op$1;
        break
      };
    default:
      throw new ScalaJS.c.jl_IndexOutOfBoundsException().init___T(ScalaJS.objectToString(x$1));
  }
});
ScalaJS.c.Lcom_repocad_web_parsing_OpExpr.prototype.toString__T = (function() {
  return ScalaJS.m.sr_ScalaRunTime().$$undtoString__s_Product__T(this)
});
ScalaJS.c.Lcom_repocad_web_parsing_OpExpr.prototype.init___Lcom_repocad_web_parsing_Expr__Lcom_repocad_web_parsing_Expr__T = (function(e1, e2, op) {
  this.e1$1 = e1;
  this.e2$1 = e2;
  this.op$1 = op;
  return this
});
ScalaJS.c.Lcom_repocad_web_parsing_OpExpr.prototype.hashCode__I = (function() {
  var this$2 = ScalaJS.m.s_util_hashing_MurmurHash3();
  return this$2.productHash__s_Product__I__I(this, (-889275714))
});
ScalaJS.c.Lcom_repocad_web_parsing_OpExpr.prototype.productIterator__sc_Iterator = (function() {
  return new ScalaJS.c.sr_ScalaRunTime$$anon$1().init___s_Product(this)
});
ScalaJS.is.Lcom_repocad_web_parsing_OpExpr = (function(obj) {
  return (!(!((obj && obj.$classData) && obj.$classData.ancestors.Lcom_repocad_web_parsing_OpExpr)))
});
ScalaJS.as.Lcom_repocad_web_parsing_OpExpr = (function(obj) {
  return ((ScalaJS.is.Lcom_repocad_web_parsing_OpExpr(obj) || (obj === null)) ? obj : ScalaJS.throwClassCastException(obj, "com.repocad.web.parsing.OpExpr"))
});
ScalaJS.isArrayOf.Lcom_repocad_web_parsing_OpExpr = (function(obj, depth) {
  return (!(!(((obj && obj.$classData) && (obj.$classData.arrayDepth === depth)) && obj.$classData.arrayBase.ancestors.Lcom_repocad_web_parsing_OpExpr)))
});
ScalaJS.asArrayOf.Lcom_repocad_web_parsing_OpExpr = (function(obj, depth) {
  return ((ScalaJS.isArrayOf.Lcom_repocad_web_parsing_OpExpr(obj, depth) || (obj === null)) ? obj : ScalaJS.throwArrayCastException(obj, "Lcom.repocad.web.parsing.OpExpr;", depth))
});
ScalaJS.d.Lcom_repocad_web_parsing_OpExpr = new ScalaJS.ClassTypeData({
  Lcom_repocad_web_parsing_OpExpr: 0
}, false, "com.repocad.web.parsing.OpExpr", ScalaJS.d.O, {
  Lcom_repocad_web_parsing_OpExpr: 1,
  s_Serializable: 1,
  Ljava_io_Serializable: 1,
  s_Product: 1,
  s_Equals: 1,
  Lcom_repocad_web_parsing_Expr: 1,
  O: 1
});
ScalaJS.c.Lcom_repocad_web_parsing_OpExpr.prototype.$classData = ScalaJS.d.Lcom_repocad_web_parsing_OpExpr;
/** @constructor */
ScalaJS.c.Lcom_repocad_web_parsing_Parser$ = (function() {
  ScalaJS.c.O.call(this)
});
ScalaJS.c.Lcom_repocad_web_parsing_Parser$.prototype = new ScalaJS.h.O();
ScalaJS.c.Lcom_repocad_web_parsing_Parser$.prototype.constructor = ScalaJS.c.Lcom_repocad_web_parsing_Parser$;
/** @constructor */
ScalaJS.h.Lcom_repocad_web_parsing_Parser$ = (function() {
  /*<skip>*/
});
ScalaJS.h.Lcom_repocad_web_parsing_Parser$.prototype = ScalaJS.c.Lcom_repocad_web_parsing_Parser$.prototype;
ScalaJS.c.Lcom_repocad_web_parsing_Parser$.prototype.seqSuccess$2__p1__sr_ObjectRef__F2 = (function(seqTail$2) {
  return new ScalaJS.c.sjsr_AnonFunction2().init___sjs_js_Function2((function(seqTail$2$1) {
    return (function(e$2, s$2) {
      var e = ScalaJS.as.Lcom_repocad_web_parsing_Expr(e$2);
      var s = ScalaJS.as.Lcom_repocad_web_lexing_LiveStream(s$2);
      seqTail$2$1.elem$1 = s;
      ScalaJS.m.s_package().Right$1;
      return new ScalaJS.c.s_util_Right().init___O(e)
    })
  })(seqTail$2))
});
ScalaJS.c.Lcom_repocad_web_parsing_Parser$.prototype.seqSuccess$1__p1__sr_ObjectRef__F2 = (function(seqTail$1) {
  return new ScalaJS.c.sjsr_AnonFunction2().init___sjs_js_Function2((function(seqTail$1$1) {
    return (function(e$2, s$2) {
      var e = ScalaJS.as.Lcom_repocad_web_parsing_Expr(e$2);
      var s = ScalaJS.as.Lcom_repocad_web_lexing_LiveStream(s$2);
      seqTail$1$1.elem$1 = s;
      ScalaJS.m.s_package().Right$1;
      return new ScalaJS.c.s_util_Right().init___O(e)
    })
  })(seqTail$1))
});
ScalaJS.c.Lcom_repocad_web_parsing_Parser$.prototype.parseTripleOp__Lcom_repocad_web_lexing_Token__Lcom_repocad_web_lexing_LiveStream__T__F4__F1__s_util_Either = (function(startToken, tail, comp, success, failure) {
  return this.parse__Lcom_repocad_web_lexing_LiveStream__F2__F1__s_util_Either(ScalaJS.m.Lcom_repocad_web_lexing_LiveStream().apply__sc_Iterable__Lcom_repocad_web_lexing_LiveStream(ScalaJS.as.sc_Iterable(ScalaJS.m.s_package().Iterable$1.apply__sc_Seq__sc_GenTraversable(new ScalaJS.c.sjs_js_WrappedArray().init___sjs_js_Array([startToken])))), new ScalaJS.c.Lcom_repocad_web_parsing_Parser$$anonfun$parseTripleOp$1().init___Lcom_repocad_web_lexing_LiveStream__T__F4__F1(tail, comp, success, failure), failure)
});
ScalaJS.c.Lcom_repocad_web_parsing_Parser$.prototype.seqFailure$1__p1__sr_ObjectRef__F1 = (function(seqFail$1) {
  return new ScalaJS.c.sjsr_AnonFunction1().init___sjs_js_Function1((function(seqFail$1$1) {
    return (function(s$2) {
      var s = ScalaJS.as.T(s$2);
      seqFail$1$1.elem$1 = new ScalaJS.c.s_Some().init___O(s);
      ScalaJS.m.s_package().Left$1;
      return new ScalaJS.c.s_util_Left().init___O(s)
    })
  })(seqFail$1))
});
ScalaJS.c.Lcom_repocad_web_parsing_Parser$.prototype.parse__Lcom_repocad_web_lexing_LiveStream__F2__F1__s_util_Either = (function(tokens, success, failure) {
  _parse: while (true) {
    var x1 = tokens;
    var o160 = ScalaJS.m.Lcom_repocad_web_lexing_$colon$tilde$colon().unapply__Lcom_repocad_web_lexing_LiveStream__s_Option(x1);
    if ((!o160.isEmpty__Z())) {
      var p3 = ScalaJS.as.Lcom_repocad_web_lexing_Token(ScalaJS.as.T2(o160.get__O()).$$und1$f);
      var p4 = ScalaJS.as.Lcom_repocad_web_lexing_LiveStream(ScalaJS.as.T2(o160.get__O()).$$und2$f);
      if (ScalaJS.is.Lcom_repocad_web_lexing_SymbolToken(p3)) {
        var x5 = ScalaJS.as.Lcom_repocad_web_lexing_SymbolToken(p3);
        var p6 = x5.s$1;
        if (ScalaJS.anyRefEqEq("import", p6)) {
          var o159 = ScalaJS.m.Lcom_repocad_web_lexing_$colon$tilde$colon().unapply__Lcom_repocad_web_lexing_LiveStream__s_Option(p4);
          if ((!o159.isEmpty__Z())) {
            var p8 = ScalaJS.as.Lcom_repocad_web_lexing_Token(ScalaJS.as.T2(o159.get__O()).$$und1$f);
            var tail = ScalaJS.as.Lcom_repocad_web_lexing_LiveStream(ScalaJS.as.T2(o159.get__O()).$$und2$f);
            if (ScalaJS.is.Lcom_repocad_web_lexing_SymbolToken(p8)) {
              var x9 = ScalaJS.as.Lcom_repocad_web_lexing_SymbolToken(p8);
              var library = x9.s$1;
              return ScalaJS.as.s_util_Either(success.apply__O__O__O(new ScalaJS.c.Lcom_repocad_web_parsing_ImportExpr().init___Lcom_repocad_web_parsing_RefExpr(new ScalaJS.c.Lcom_repocad_web_parsing_RefExpr().init___T__sc_Seq(library, new ScalaJS.c.sjs_js_WrappedArray().init___sjs_js_Array([]))), tail))
            }
          }
        }
      }
    };
    var o162 = ScalaJS.m.Lcom_repocad_web_lexing_$colon$tilde$colon().unapply__Lcom_repocad_web_lexing_LiveStream__s_Option(x1);
    if ((!o162.isEmpty__Z())) {
      var p11 = ScalaJS.as.Lcom_repocad_web_lexing_Token(ScalaJS.as.T2(o162.get__O()).$$und1$f);
      var tail$2 = ScalaJS.as.Lcom_repocad_web_lexing_LiveStream(ScalaJS.as.T2(o162.get__O()).$$und2$f);
      if (ScalaJS.is.Lcom_repocad_web_lexing_SymbolToken(p11)) {
        var x12 = ScalaJS.as.Lcom_repocad_web_lexing_SymbolToken(p11);
        var p13 = x12.s$1;
        if (ScalaJS.anyRefEqEq("arc", p13)) {
          var temp$success = new ScalaJS.c.Lcom_repocad_web_parsing_Parser$$anonfun$parse$2().init___F2__F1(success, failure);
          tokens = tail$2;
          success = temp$success;
          continue _parse
        }
      }
    };
    var o164 = ScalaJS.m.Lcom_repocad_web_lexing_$colon$tilde$colon().unapply__Lcom_repocad_web_lexing_LiveStream__s_Option(x1);
    if ((!o164.isEmpty__Z())) {
      var p15 = ScalaJS.as.Lcom_repocad_web_lexing_Token(ScalaJS.as.T2(o164.get__O()).$$und1$f);
      var tail$3 = ScalaJS.as.Lcom_repocad_web_lexing_LiveStream(ScalaJS.as.T2(o164.get__O()).$$und2$f);
      if (ScalaJS.is.Lcom_repocad_web_lexing_SymbolToken(p15)) {
        var x16 = ScalaJS.as.Lcom_repocad_web_lexing_SymbolToken(p15);
        var p17 = x16.s$1;
        if (ScalaJS.anyRefEqEq("bezierCurve", p17)) {
          var temp$success$2 = new ScalaJS.c.Lcom_repocad_web_parsing_Parser$$anonfun$parse$3().init___F2__F1(success, failure);
          tokens = tail$3;
          success = temp$success$2;
          continue _parse
        }
      }
    };
    var o166 = ScalaJS.m.Lcom_repocad_web_lexing_$colon$tilde$colon().unapply__Lcom_repocad_web_lexing_LiveStream__s_Option(x1);
    if ((!o166.isEmpty__Z())) {
      var p19 = ScalaJS.as.Lcom_repocad_web_lexing_Token(ScalaJS.as.T2(o166.get__O()).$$und1$f);
      var tail$4 = ScalaJS.as.Lcom_repocad_web_lexing_LiveStream(ScalaJS.as.T2(o166.get__O()).$$und2$f);
      if (ScalaJS.is.Lcom_repocad_web_lexing_SymbolToken(p19)) {
        var x20 = ScalaJS.as.Lcom_repocad_web_lexing_SymbolToken(p19);
        var p21 = x20.s$1;
        if (ScalaJS.anyRefEqEq("circle", p21)) {
          var temp$success$3 = new ScalaJS.c.Lcom_repocad_web_parsing_Parser$$anonfun$parse$4().init___F2__F1(success, failure);
          tokens = tail$4;
          success = temp$success$3;
          continue _parse
        }
      }
    };
    var o168 = ScalaJS.m.Lcom_repocad_web_lexing_$colon$tilde$colon().unapply__Lcom_repocad_web_lexing_LiveStream__s_Option(x1);
    if ((!o168.isEmpty__Z())) {
      var p23 = ScalaJS.as.Lcom_repocad_web_lexing_Token(ScalaJS.as.T2(o168.get__O()).$$und1$f);
      var tail$5 = ScalaJS.as.Lcom_repocad_web_lexing_LiveStream(ScalaJS.as.T2(o168.get__O()).$$und2$f);
      if (ScalaJS.is.Lcom_repocad_web_lexing_SymbolToken(p23)) {
        var x24 = ScalaJS.as.Lcom_repocad_web_lexing_SymbolToken(p23);
        var p25 = x24.s$1;
        if (ScalaJS.anyRefEqEq("line", p25)) {
          var temp$success$4 = new ScalaJS.c.Lcom_repocad_web_parsing_Parser$$anonfun$parse$5().init___F2__F1(success, failure);
          tokens = tail$5;
          success = temp$success$4;
          continue _parse
        }
      }
    };
    var o170 = ScalaJS.m.Lcom_repocad_web_lexing_$colon$tilde$colon().unapply__Lcom_repocad_web_lexing_LiveStream__s_Option(x1);
    if ((!o170.isEmpty__Z())) {
      var p27 = ScalaJS.as.Lcom_repocad_web_lexing_Token(ScalaJS.as.T2(o170.get__O()).$$und1$f);
      var tail$6 = ScalaJS.as.Lcom_repocad_web_lexing_LiveStream(ScalaJS.as.T2(o170.get__O()).$$und2$f);
      if (ScalaJS.is.Lcom_repocad_web_lexing_SymbolToken(p27)) {
        var x28 = ScalaJS.as.Lcom_repocad_web_lexing_SymbolToken(p27);
        var p29 = x28.s$1;
        if (ScalaJS.anyRefEqEq("text", p29)) {
          var temp$success$5 = new ScalaJS.c.Lcom_repocad_web_parsing_Parser$$anonfun$parse$6().init___F2__F1(success, failure);
          tokens = tail$6;
          success = temp$success$5;
          continue _parse
        }
      }
    };
    var o172 = ScalaJS.m.Lcom_repocad_web_lexing_$colon$tilde$colon().unapply__Lcom_repocad_web_lexing_LiveStream__s_Option(x1);
    if ((!o172.isEmpty__Z())) {
      var p31 = ScalaJS.as.Lcom_repocad_web_lexing_Token(ScalaJS.as.T2(o172.get__O()).$$und1$f);
      var tail$7 = ScalaJS.as.Lcom_repocad_web_lexing_LiveStream(ScalaJS.as.T2(o172.get__O()).$$und2$f);
      if (ScalaJS.is.Lcom_repocad_web_lexing_SymbolToken(p31)) {
        var x32 = ScalaJS.as.Lcom_repocad_web_lexing_SymbolToken(p31);
        var p33 = x32.s$1;
        if (ScalaJS.anyRefEqEq("while", p33)) {
          var temp$success$6 = new ScalaJS.c.Lcom_repocad_web_parsing_Parser$$anonfun$parse$7().init___F2__F1(success, failure);
          tokens = tail$7;
          success = temp$success$6;
          continue _parse
        }
      }
    };
    var o174 = ScalaJS.m.Lcom_repocad_web_lexing_$colon$tilde$colon().unapply__Lcom_repocad_web_lexing_LiveStream__s_Option(x1);
    if ((!o174.isEmpty__Z())) {
      var p35 = ScalaJS.as.Lcom_repocad_web_lexing_Token(ScalaJS.as.T2(o174.get__O()).$$und1$f);
      var tail$8 = ScalaJS.as.Lcom_repocad_web_lexing_LiveStream(ScalaJS.as.T2(o174.get__O()).$$und2$f);
      if (ScalaJS.is.Lcom_repocad_web_lexing_SymbolToken(p35)) {
        var x36 = ScalaJS.as.Lcom_repocad_web_lexing_SymbolToken(p35);
        var p37 = x36.s$1;
        if (ScalaJS.anyRefEqEq("for", p37)) {
          var temp$success$7 = new ScalaJS.c.Lcom_repocad_web_parsing_Parser$$anonfun$parse$8().init___F2__F1(success, failure);
          tokens = tail$8;
          success = temp$success$7;
          continue _parse
        }
      }
    };
    var o177 = ScalaJS.m.Lcom_repocad_web_lexing_$colon$tilde$colon().unapply__Lcom_repocad_web_lexing_LiveStream__s_Option(x1);
    if ((!o177.isEmpty__Z())) {
      var p39 = ScalaJS.as.Lcom_repocad_web_lexing_Token(ScalaJS.as.T2(o177.get__O()).$$und1$f);
      var p40 = ScalaJS.as.Lcom_repocad_web_lexing_LiveStream(ScalaJS.as.T2(o177.get__O()).$$und2$f);
      if (ScalaJS.is.Lcom_repocad_web_lexing_SymbolToken(p39)) {
        var x41 = ScalaJS.as.Lcom_repocad_web_lexing_SymbolToken(p39);
        var name = x41.s$1;
        var o176 = ScalaJS.m.Lcom_repocad_web_lexing_$colon$tilde$colon().unapply__Lcom_repocad_web_lexing_LiveStream__s_Option(p40);
        if ((!o176.isEmpty__Z())) {
          var p43 = ScalaJS.as.Lcom_repocad_web_lexing_Token(ScalaJS.as.T2(o176.get__O()).$$und1$f);
          var tail$9 = ScalaJS.as.Lcom_repocad_web_lexing_LiveStream(ScalaJS.as.T2(o176.get__O()).$$und2$f);
          if (ScalaJS.is.Lcom_repocad_web_lexing_SymbolToken(p43)) {
            var x44 = ScalaJS.as.Lcom_repocad_web_lexing_SymbolToken(p43);
            var p45 = x44.s$1;
            if (ScalaJS.anyRefEqEq("=", p45)) {
              var temp$success$8 = new ScalaJS.c.sjsr_AnonFunction2().init___sjs_js_Function2((function(success$1, name$1) {
                return (function(e$2, stream$2) {
                  var e = ScalaJS.as.Lcom_repocad_web_parsing_Expr(e$2);
                  var stream = ScalaJS.as.Lcom_repocad_web_lexing_LiveStream(stream$2);
                  return ScalaJS.as.s_util_Either(success$1.apply__O__O__O(new ScalaJS.c.Lcom_repocad_web_parsing_ValExpr().init___T__Lcom_repocad_web_parsing_Expr(name$1, e), stream))
                })
              })(success, name));
              tokens = tail$9;
              success = temp$success$8;
              continue _parse
            }
          }
        }
      }
    };
    var o180 = ScalaJS.m.Lcom_repocad_web_lexing_$colon$tilde$colon().unapply__Lcom_repocad_web_lexing_LiveStream__s_Option(x1);
    if ((!o180.isEmpty__Z())) {
      var p47 = ScalaJS.as.Lcom_repocad_web_lexing_Token(ScalaJS.as.T2(o180.get__O()).$$und1$f);
      var p48 = ScalaJS.as.Lcom_repocad_web_lexing_LiveStream(ScalaJS.as.T2(o180.get__O()).$$und2$f);
      if (ScalaJS.is.Lcom_repocad_web_lexing_SymbolToken(p47)) {
        var x49 = ScalaJS.as.Lcom_repocad_web_lexing_SymbolToken(p47);
        var name$2 = x49.s$1;
        var o179 = ScalaJS.m.Lcom_repocad_web_lexing_$colon$tilde$colon().unapply__Lcom_repocad_web_lexing_LiveStream__s_Option(p48);
        if ((!o179.isEmpty__Z())) {
          var p51 = ScalaJS.as.Lcom_repocad_web_lexing_Token(ScalaJS.as.T2(o179.get__O()).$$und1$f);
          var tail$10 = ScalaJS.as.Lcom_repocad_web_lexing_LiveStream(ScalaJS.as.T2(o179.get__O()).$$und2$f);
          if (ScalaJS.is.Lcom_repocad_web_lexing_SymbolToken(p51)) {
            var x52 = ScalaJS.as.Lcom_repocad_web_lexing_SymbolToken(p51);
            var p53 = x52.s$1;
            if (ScalaJS.anyRefEqEq("<-", p53)) {
              var temp$success$9 = new ScalaJS.c.Lcom_repocad_web_parsing_Parser$$anonfun$parse$10().init___F2__F1__T(success, failure, name$2);
              tokens = tail$10;
              success = temp$success$9;
              continue _parse
            }
          }
        }
      }
    };
    var o183 = ScalaJS.m.Lcom_repocad_web_lexing_$colon$tilde$colon().unapply__Lcom_repocad_web_lexing_LiveStream__s_Option(x1);
    if ((!o183.isEmpty__Z())) {
      var start = ScalaJS.as.Lcom_repocad_web_lexing_Token(ScalaJS.as.T2(o183.get__O()).$$und1$f);
      var p55 = ScalaJS.as.Lcom_repocad_web_lexing_LiveStream(ScalaJS.as.T2(o183.get__O()).$$und2$f);
      if ((start !== null)) {
        var o182 = ScalaJS.m.Lcom_repocad_web_lexing_$colon$tilde$colon().unapply__Lcom_repocad_web_lexing_LiveStream__s_Option(p55);
        if ((!o182.isEmpty__Z())) {
          var p57 = ScalaJS.as.Lcom_repocad_web_lexing_Token(ScalaJS.as.T2(o182.get__O()).$$und1$f);
          var tail$11 = ScalaJS.as.Lcom_repocad_web_lexing_LiveStream(ScalaJS.as.T2(o182.get__O()).$$und2$f);
          if (ScalaJS.is.Lcom_repocad_web_lexing_SymbolToken(p57)) {
            var x58 = ScalaJS.as.Lcom_repocad_web_lexing_SymbolToken(p57);
            var p59 = x58.s$1;
            if (ScalaJS.anyRefEqEq(">", p59)) {
              return this.parseTripleOp__Lcom_repocad_web_lexing_Token__Lcom_repocad_web_lexing_LiveStream__T__F4__F1__s_util_Either(start, tail$11, ">", new ScalaJS.c.sjsr_AnonFunction4().init___sjs_js_Function4((function(success$1$1) {
                return (function(e1$2, e2$2, op$2, stream$2$1) {
                  var e1 = ScalaJS.as.Lcom_repocad_web_parsing_Expr(e1$2);
                  var e2 = ScalaJS.as.Lcom_repocad_web_parsing_Expr(e2$2);
                  var op = ScalaJS.as.T(op$2);
                  var stream$1 = ScalaJS.as.Lcom_repocad_web_lexing_LiveStream(stream$2$1);
                  return ScalaJS.as.s_util_Either(success$1$1.apply__O__O__O(new ScalaJS.c.Lcom_repocad_web_parsing_CompExpr().init___Lcom_repocad_web_parsing_Expr__Lcom_repocad_web_parsing_Expr__T(e1, e2, op), stream$1))
                })
              })(success)), failure)
            }
          }
        }
      }
    };
    var o186 = ScalaJS.m.Lcom_repocad_web_lexing_$colon$tilde$colon().unapply__Lcom_repocad_web_lexing_LiveStream__s_Option(x1);
    if ((!o186.isEmpty__Z())) {
      var start$2 = ScalaJS.as.Lcom_repocad_web_lexing_Token(ScalaJS.as.T2(o186.get__O()).$$und1$f);
      var p61 = ScalaJS.as.Lcom_repocad_web_lexing_LiveStream(ScalaJS.as.T2(o186.get__O()).$$und2$f);
      if ((start$2 !== null)) {
        var o185 = ScalaJS.m.Lcom_repocad_web_lexing_$colon$tilde$colon().unapply__Lcom_repocad_web_lexing_LiveStream__s_Option(p61);
        if ((!o185.isEmpty__Z())) {
          var p63 = ScalaJS.as.Lcom_repocad_web_lexing_Token(ScalaJS.as.T2(o185.get__O()).$$und1$f);
          var tail$12 = ScalaJS.as.Lcom_repocad_web_lexing_LiveStream(ScalaJS.as.T2(o185.get__O()).$$und2$f);
          if (ScalaJS.is.Lcom_repocad_web_lexing_SymbolToken(p63)) {
            var x64 = ScalaJS.as.Lcom_repocad_web_lexing_SymbolToken(p63);
            var p65 = x64.s$1;
            if (ScalaJS.anyRefEqEq("<", p65)) {
              return this.parseTripleOp__Lcom_repocad_web_lexing_Token__Lcom_repocad_web_lexing_LiveStream__T__F4__F1__s_util_Either(start$2, tail$12, "<", new ScalaJS.c.sjsr_AnonFunction4().init___sjs_js_Function4((function(success$1$2) {
                return (function(e1$2$1, e2$2$1, op$2$1, stream$2$2) {
                  var e1$1 = ScalaJS.as.Lcom_repocad_web_parsing_Expr(e1$2$1);
                  var e2$1 = ScalaJS.as.Lcom_repocad_web_parsing_Expr(e2$2$1);
                  var op$1 = ScalaJS.as.T(op$2$1);
                  var stream$3 = ScalaJS.as.Lcom_repocad_web_lexing_LiveStream(stream$2$2);
                  return ScalaJS.as.s_util_Either(success$1$2.apply__O__O__O(new ScalaJS.c.Lcom_repocad_web_parsing_CompExpr().init___Lcom_repocad_web_parsing_Expr__Lcom_repocad_web_parsing_Expr__T(e1$1, e2$1, op$1), stream$3))
                })
              })(success)), failure)
            }
          }
        }
      }
    };
    var o189 = ScalaJS.m.Lcom_repocad_web_lexing_$colon$tilde$colon().unapply__Lcom_repocad_web_lexing_LiveStream__s_Option(x1);
    if ((!o189.isEmpty__Z())) {
      var start$3 = ScalaJS.as.Lcom_repocad_web_lexing_Token(ScalaJS.as.T2(o189.get__O()).$$und1$f);
      var p67 = ScalaJS.as.Lcom_repocad_web_lexing_LiveStream(ScalaJS.as.T2(o189.get__O()).$$und2$f);
      if ((start$3 !== null)) {
        var o188 = ScalaJS.m.Lcom_repocad_web_lexing_$colon$tilde$colon().unapply__Lcom_repocad_web_lexing_LiveStream__s_Option(p67);
        if ((!o188.isEmpty__Z())) {
          var p69 = ScalaJS.as.Lcom_repocad_web_lexing_Token(ScalaJS.as.T2(o188.get__O()).$$und1$f);
          var tail$13 = ScalaJS.as.Lcom_repocad_web_lexing_LiveStream(ScalaJS.as.T2(o188.get__O()).$$und2$f);
          if (ScalaJS.is.Lcom_repocad_web_lexing_SymbolToken(p69)) {
            var x70 = ScalaJS.as.Lcom_repocad_web_lexing_SymbolToken(p69);
            var p71 = x70.s$1;
            if (ScalaJS.anyRefEqEq("+", p71)) {
              return this.parseTripleOp__Lcom_repocad_web_lexing_Token__Lcom_repocad_web_lexing_LiveStream__T__F4__F1__s_util_Either(start$3, tail$13, "+", new ScalaJS.c.sjsr_AnonFunction4().init___sjs_js_Function4((function(success$1$3) {
                return (function(e1$2$2, e2$2$2, op$2$2, stream$2$3) {
                  var e1$3 = ScalaJS.as.Lcom_repocad_web_parsing_Expr(e1$2$2);
                  var e2$3 = ScalaJS.as.Lcom_repocad_web_parsing_Expr(e2$2$2);
                  var op$3 = ScalaJS.as.T(op$2$2);
                  var stream$4 = ScalaJS.as.Lcom_repocad_web_lexing_LiveStream(stream$2$3);
                  return ScalaJS.as.s_util_Either(success$1$3.apply__O__O__O(new ScalaJS.c.Lcom_repocad_web_parsing_OpExpr().init___Lcom_repocad_web_parsing_Expr__Lcom_repocad_web_parsing_Expr__T(e1$3, e2$3, op$3), stream$4))
                })
              })(success)), failure)
            }
          }
        }
      }
    };
    var o192 = ScalaJS.m.Lcom_repocad_web_lexing_$colon$tilde$colon().unapply__Lcom_repocad_web_lexing_LiveStream__s_Option(x1);
    if ((!o192.isEmpty__Z())) {
      var start$4 = ScalaJS.as.Lcom_repocad_web_lexing_Token(ScalaJS.as.T2(o192.get__O()).$$und1$f);
      var p73 = ScalaJS.as.Lcom_repocad_web_lexing_LiveStream(ScalaJS.as.T2(o192.get__O()).$$und2$f);
      if ((start$4 !== null)) {
        var o191 = ScalaJS.m.Lcom_repocad_web_lexing_$colon$tilde$colon().unapply__Lcom_repocad_web_lexing_LiveStream__s_Option(p73);
        if ((!o191.isEmpty__Z())) {
          var p75 = ScalaJS.as.Lcom_repocad_web_lexing_Token(ScalaJS.as.T2(o191.get__O()).$$und1$f);
          var tail$14 = ScalaJS.as.Lcom_repocad_web_lexing_LiveStream(ScalaJS.as.T2(o191.get__O()).$$und2$f);
          if (ScalaJS.is.Lcom_repocad_web_lexing_SymbolToken(p75)) {
            var x76 = ScalaJS.as.Lcom_repocad_web_lexing_SymbolToken(p75);
            var p77 = x76.s$1;
            if (ScalaJS.anyRefEqEq("-", p77)) {
              return this.parseTripleOp__Lcom_repocad_web_lexing_Token__Lcom_repocad_web_lexing_LiveStream__T__F4__F1__s_util_Either(start$4, tail$14, "-", new ScalaJS.c.sjsr_AnonFunction4().init___sjs_js_Function4((function(success$1$4) {
                return (function(e1$2$3, e2$2$3, op$2$3, stream$2$4) {
                  var e1$4 = ScalaJS.as.Lcom_repocad_web_parsing_Expr(e1$2$3);
                  var e2$4 = ScalaJS.as.Lcom_repocad_web_parsing_Expr(e2$2$3);
                  var op$4 = ScalaJS.as.T(op$2$3);
                  var stream$5 = ScalaJS.as.Lcom_repocad_web_lexing_LiveStream(stream$2$4);
                  return ScalaJS.as.s_util_Either(success$1$4.apply__O__O__O(new ScalaJS.c.Lcom_repocad_web_parsing_OpExpr().init___Lcom_repocad_web_parsing_Expr__Lcom_repocad_web_parsing_Expr__T(e1$4, e2$4, op$4), stream$5))
                })
              })(success)), failure)
            }
          }
        }
      }
    };
    var o195 = ScalaJS.m.Lcom_repocad_web_lexing_$colon$tilde$colon().unapply__Lcom_repocad_web_lexing_LiveStream__s_Option(x1);
    if ((!o195.isEmpty__Z())) {
      var start$5 = ScalaJS.as.Lcom_repocad_web_lexing_Token(ScalaJS.as.T2(o195.get__O()).$$und1$f);
      var p79 = ScalaJS.as.Lcom_repocad_web_lexing_LiveStream(ScalaJS.as.T2(o195.get__O()).$$und2$f);
      if ((start$5 !== null)) {
        var o194 = ScalaJS.m.Lcom_repocad_web_lexing_$colon$tilde$colon().unapply__Lcom_repocad_web_lexing_LiveStream__s_Option(p79);
        if ((!o194.isEmpty__Z())) {
          var p81 = ScalaJS.as.Lcom_repocad_web_lexing_Token(ScalaJS.as.T2(o194.get__O()).$$und1$f);
          var tail$15 = ScalaJS.as.Lcom_repocad_web_lexing_LiveStream(ScalaJS.as.T2(o194.get__O()).$$und2$f);
          if (ScalaJS.is.Lcom_repocad_web_lexing_SymbolToken(p81)) {
            var x82 = ScalaJS.as.Lcom_repocad_web_lexing_SymbolToken(p81);
            var p83 = x82.s$1;
            if (ScalaJS.anyRefEqEq("*", p83)) {
              return this.parseTripleOp__Lcom_repocad_web_lexing_Token__Lcom_repocad_web_lexing_LiveStream__T__F4__F1__s_util_Either(start$5, tail$15, "*", new ScalaJS.c.sjsr_AnonFunction4().init___sjs_js_Function4((function(success$1$5) {
                return (function(e1$2$4, e2$2$4, op$2$4, stream$2$5) {
                  var e1$5 = ScalaJS.as.Lcom_repocad_web_parsing_Expr(e1$2$4);
                  var e2$5 = ScalaJS.as.Lcom_repocad_web_parsing_Expr(e2$2$4);
                  var op$5 = ScalaJS.as.T(op$2$4);
                  var stream$6 = ScalaJS.as.Lcom_repocad_web_lexing_LiveStream(stream$2$5);
                  return ScalaJS.as.s_util_Either(success$1$5.apply__O__O__O(new ScalaJS.c.Lcom_repocad_web_parsing_OpExpr().init___Lcom_repocad_web_parsing_Expr__Lcom_repocad_web_parsing_Expr__T(e1$5, e2$5, op$5), stream$6))
                })
              })(success)), failure)
            }
          }
        }
      }
    };
    var o198 = ScalaJS.m.Lcom_repocad_web_lexing_$colon$tilde$colon().unapply__Lcom_repocad_web_lexing_LiveStream__s_Option(x1);
    if ((!o198.isEmpty__Z())) {
      var start$6 = ScalaJS.as.Lcom_repocad_web_lexing_Token(ScalaJS.as.T2(o198.get__O()).$$und1$f);
      var p85 = ScalaJS.as.Lcom_repocad_web_lexing_LiveStream(ScalaJS.as.T2(o198.get__O()).$$und2$f);
      if ((start$6 !== null)) {
        var o197 = ScalaJS.m.Lcom_repocad_web_lexing_$colon$tilde$colon().unapply__Lcom_repocad_web_lexing_LiveStream__s_Option(p85);
        if ((!o197.isEmpty__Z())) {
          var p87 = ScalaJS.as.Lcom_repocad_web_lexing_Token(ScalaJS.as.T2(o197.get__O()).$$und1$f);
          var tail$16 = ScalaJS.as.Lcom_repocad_web_lexing_LiveStream(ScalaJS.as.T2(o197.get__O()).$$und2$f);
          if (ScalaJS.is.Lcom_repocad_web_lexing_SymbolToken(p87)) {
            var x88 = ScalaJS.as.Lcom_repocad_web_lexing_SymbolToken(p87);
            var p89 = x88.s$1;
            if (ScalaJS.anyRefEqEq("/", p89)) {
              return this.parseTripleOp__Lcom_repocad_web_lexing_Token__Lcom_repocad_web_lexing_LiveStream__T__F4__F1__s_util_Either(start$6, tail$16, "/", new ScalaJS.c.sjsr_AnonFunction4().init___sjs_js_Function4((function(success$1$6) {
                return (function(e1$2$5, e2$2$5, op$2$5, stream$2$6) {
                  var e1$6 = ScalaJS.as.Lcom_repocad_web_parsing_Expr(e1$2$5);
                  var e2$6 = ScalaJS.as.Lcom_repocad_web_parsing_Expr(e2$2$5);
                  var op$6 = ScalaJS.as.T(op$2$5);
                  var stream$7 = ScalaJS.as.Lcom_repocad_web_lexing_LiveStream(stream$2$6);
                  return ScalaJS.as.s_util_Either(success$1$6.apply__O__O__O(new ScalaJS.c.Lcom_repocad_web_parsing_OpExpr().init___Lcom_repocad_web_parsing_Expr__Lcom_repocad_web_parsing_Expr__T(e1$6, e2$6, op$6), stream$7))
                })
              })(success)), failure)
            }
          }
        }
      }
    };
    var o202 = ScalaJS.m.Lcom_repocad_web_lexing_$colon$tilde$colon().unapply__Lcom_repocad_web_lexing_LiveStream__s_Option(x1);
    if ((!o202.isEmpty__Z())) {
      var p91 = ScalaJS.as.Lcom_repocad_web_lexing_Token(ScalaJS.as.T2(o202.get__O()).$$und1$f);
      var p92 = ScalaJS.as.Lcom_repocad_web_lexing_LiveStream(ScalaJS.as.T2(o202.get__O()).$$und2$f);
      if (ScalaJS.is.Lcom_repocad_web_lexing_SymbolToken(p91)) {
        var x93 = ScalaJS.as.Lcom_repocad_web_lexing_SymbolToken(p91);
        var p94 = x93.s$1;
        if (ScalaJS.anyRefEqEq("function", p94)) {
          var o201 = ScalaJS.m.Lcom_repocad_web_lexing_$colon$tilde$colon().unapply__Lcom_repocad_web_lexing_LiveStream__s_Option(p92);
          if ((!o201.isEmpty__Z())) {
            var p96 = ScalaJS.as.Lcom_repocad_web_lexing_Token(ScalaJS.as.T2(o201.get__O()).$$und1$f);
            var p97 = ScalaJS.as.Lcom_repocad_web_lexing_LiveStream(ScalaJS.as.T2(o201.get__O()).$$und2$f);
            if (ScalaJS.is.Lcom_repocad_web_lexing_SymbolToken(p96)) {
              var x98 = ScalaJS.as.Lcom_repocad_web_lexing_SymbolToken(p96);
              var name$3 = x98.s$1;
              var o200 = ScalaJS.m.Lcom_repocad_web_lexing_$colon$tilde$colon().unapply__Lcom_repocad_web_lexing_LiveStream__s_Option(p97);
              if ((!o200.isEmpty__Z())) {
                var p100 = ScalaJS.as.Lcom_repocad_web_lexing_Token(ScalaJS.as.T2(o200.get__O()).$$und1$f);
                var tail$17 = ScalaJS.as.Lcom_repocad_web_lexing_LiveStream(ScalaJS.as.T2(o200.get__O()).$$und2$f);
                if (ScalaJS.is.Lcom_repocad_web_lexing_PunctToken(p100)) {
                  var x101 = ScalaJS.as.Lcom_repocad_web_lexing_PunctToken(p100);
                  var p102 = x101.s$1;
                  if (ScalaJS.anyRefEqEq("(", p102)) {
                    return this.parseUntil__Lcom_repocad_web_lexing_LiveStream__Lcom_repocad_web_lexing_Token__F2__F1__s_util_Either(tail$17, new ScalaJS.c.Lcom_repocad_web_lexing_PunctToken().init___T(")"), new ScalaJS.c.Lcom_repocad_web_parsing_Parser$$anonfun$parse$17().init___F2__F1__T(success, failure, name$3), failure)
                  }
                }
              }
            }
          }
        }
      }
    };
    var o204 = ScalaJS.m.Lcom_repocad_web_lexing_$colon$tilde$colon().unapply__Lcom_repocad_web_lexing_LiveStream__s_Option(x1);
    if ((!o204.isEmpty__Z())) {
      var p104 = ScalaJS.as.Lcom_repocad_web_lexing_Token(ScalaJS.as.T2(o204.get__O()).$$und1$f);
      var tail$18 = ScalaJS.as.Lcom_repocad_web_lexing_LiveStream(ScalaJS.as.T2(o204.get__O()).$$und2$f);
      if (ScalaJS.is.Lcom_repocad_web_lexing_IntToken(p104)) {
        var x105 = ScalaJS.as.Lcom_repocad_web_lexing_IntToken(p104);
        var value = x105.n$1;
        return ScalaJS.as.s_util_Either(success.apply__O__O__O(new ScalaJS.c.Lcom_repocad_web_parsing_ConstantExpr().init___O(value), tail$18))
      }
    };
    var o206 = ScalaJS.m.Lcom_repocad_web_lexing_$colon$tilde$colon().unapply__Lcom_repocad_web_lexing_LiveStream__s_Option(x1);
    if ((!o206.isEmpty__Z())) {
      var p107 = ScalaJS.as.Lcom_repocad_web_lexing_Token(ScalaJS.as.T2(o206.get__O()).$$und1$f);
      var tail$19 = ScalaJS.as.Lcom_repocad_web_lexing_LiveStream(ScalaJS.as.T2(o206.get__O()).$$und2$f);
      if (ScalaJS.is.Lcom_repocad_web_lexing_DoubleToken(p107)) {
        var x108 = ScalaJS.as.Lcom_repocad_web_lexing_DoubleToken(p107);
        var value$2 = x108.d$1;
        return ScalaJS.as.s_util_Either(success.apply__O__O__O(new ScalaJS.c.Lcom_repocad_web_parsing_ConstantExpr().init___O(value$2), tail$19))
      }
    };
    var o208 = ScalaJS.m.Lcom_repocad_web_lexing_$colon$tilde$colon().unapply__Lcom_repocad_web_lexing_LiveStream__s_Option(x1);
    if ((!o208.isEmpty__Z())) {
      var p110 = ScalaJS.as.Lcom_repocad_web_lexing_Token(ScalaJS.as.T2(o208.get__O()).$$und1$f);
      var tail$20 = ScalaJS.as.Lcom_repocad_web_lexing_LiveStream(ScalaJS.as.T2(o208.get__O()).$$und2$f);
      if (ScalaJS.is.Lcom_repocad_web_lexing_StringToken(p110)) {
        var x111 = ScalaJS.as.Lcom_repocad_web_lexing_StringToken(p110);
        var value$3 = x111.s$1;
        if ((value$3 !== null)) {
          return ScalaJS.as.s_util_Either(success.apply__O__O__O(new ScalaJS.c.Lcom_repocad_web_parsing_ConstantExpr().init___O(value$3), tail$20))
        }
      }
    };
    var o210 = ScalaJS.m.Lcom_repocad_web_lexing_$colon$tilde$colon().unapply__Lcom_repocad_web_lexing_LiveStream__s_Option(x1);
    if ((!o210.isEmpty__Z())) {
      var p113 = ScalaJS.as.Lcom_repocad_web_lexing_Token(ScalaJS.as.T2(o210.get__O()).$$und1$f);
      var tail$21 = ScalaJS.as.Lcom_repocad_web_lexing_LiveStream(ScalaJS.as.T2(o210.get__O()).$$und2$f);
      if (ScalaJS.is.Lcom_repocad_web_lexing_PunctToken(p113)) {
        var x114 = ScalaJS.as.Lcom_repocad_web_lexing_PunctToken(p113);
        var p115 = x114.s$1;
        if (ScalaJS.anyRefEqEq("{", p115)) {
          return this.parseUntil__Lcom_repocad_web_lexing_LiveStream__Lcom_repocad_web_lexing_Token__F2__F1__s_util_Either(tail$21, new ScalaJS.c.Lcom_repocad_web_lexing_PunctToken().init___T("}"), success, failure)
        }
      }
    };
    var o212 = ScalaJS.m.Lcom_repocad_web_lexing_$colon$tilde$colon().unapply__Lcom_repocad_web_lexing_LiveStream__s_Option(x1);
    if ((!o212.isEmpty__Z())) {
      var p117 = ScalaJS.as.Lcom_repocad_web_lexing_Token(ScalaJS.as.T2(o212.get__O()).$$und1$f);
      var tail$22 = ScalaJS.as.Lcom_repocad_web_lexing_LiveStream(ScalaJS.as.T2(o212.get__O()).$$und2$f);
      if (ScalaJS.is.Lcom_repocad_web_lexing_PunctToken(p117)) {
        var x118 = ScalaJS.as.Lcom_repocad_web_lexing_PunctToken(p117);
        var p119 = x118.s$1;
        if (ScalaJS.anyRefEqEq("(", p119)) {
          return this.parseUntil__Lcom_repocad_web_lexing_LiveStream__Lcom_repocad_web_lexing_Token__F2__F1__s_util_Either(tail$22, new ScalaJS.c.Lcom_repocad_web_lexing_PunctToken().init___T(")"), success, failure)
        }
      }
    };
    var o214 = ScalaJS.m.Lcom_repocad_web_lexing_$colon$tilde$colon().unapply__Lcom_repocad_web_lexing_LiveStream__s_Option(x1);
    if ((!o214.isEmpty__Z())) {
      var p121 = ScalaJS.as.Lcom_repocad_web_lexing_Token(ScalaJS.as.T2(o214.get__O()).$$und1$f);
      var tail$23 = ScalaJS.as.Lcom_repocad_web_lexing_LiveStream(ScalaJS.as.T2(o214.get__O()).$$und2$f);
      if (ScalaJS.is.Lcom_repocad_web_lexing_SymbolToken(p121)) {
        var x122 = ScalaJS.as.Lcom_repocad_web_lexing_SymbolToken(p121);
        var name$4 = x122.s$1;
        if ((((!tail$23.isEmpty__Z()) && (!tail$23.isPlugged__Z())) && ScalaJS.objectEquals(ScalaJS.as.Lcom_repocad_web_lexing_Token(tail$23.head__O()).tag__O(), "("))) {
          var temp$success$10 = new ScalaJS.c.sjsr_AnonFunction2().init___sjs_js_Function2((function(success$1$7, failure$1, name$4$1) {
            return (function(params$2, paramsTail$2) {
              var params = ScalaJS.as.Lcom_repocad_web_parsing_Expr(params$2);
              var paramsTail = ScalaJS.as.Lcom_repocad_web_lexing_LiveStream(paramsTail$2);
              if (ScalaJS.is.Lcom_repocad_web_parsing_SeqExpr(params)) {
                var x2 = ScalaJS.as.Lcom_repocad_web_parsing_SeqExpr(params);
                var xs = x2.expr$1;
                return ScalaJS.as.s_util_Either(success$1$7.apply__O__O__O(new ScalaJS.c.Lcom_repocad_web_parsing_RefExpr().init___T__sc_Seq(name$4$1, new ScalaJS.c.sjs_js_WrappedArray().init___sjs_js_Array([xs])), paramsTail))
              } else {
                return ScalaJS.as.s_util_Either(failure$1.apply__O__O(("Failed to parse ref call: Expected parameters, got " + params)))
              }
            })
          })(success, failure, name$4));
          tokens = tail$23;
          success = temp$success$10;
          continue _parse
        }
      }
    };
    var o216 = ScalaJS.m.Lcom_repocad_web_lexing_$colon$tilde$colon().unapply__Lcom_repocad_web_lexing_LiveStream__s_Option(x1);
    if ((!o216.isEmpty__Z())) {
      var p124 = ScalaJS.as.Lcom_repocad_web_lexing_Token(ScalaJS.as.T2(o216.get__O()).$$und1$f);
      var tail$24 = ScalaJS.as.Lcom_repocad_web_lexing_LiveStream(ScalaJS.as.T2(o216.get__O()).$$und2$f);
      if (ScalaJS.is.Lcom_repocad_web_lexing_SymbolToken(p124)) {
        var x125 = ScalaJS.as.Lcom_repocad_web_lexing_SymbolToken(p124);
        var name$5 = x125.s$1;
        return ScalaJS.as.s_util_Either(success.apply__O__O__O(new ScalaJS.c.Lcom_repocad_web_parsing_RefExpr().init___T__sc_Seq(name$5, new ScalaJS.c.sjs_js_WrappedArray().init___sjs_js_Array([])), tail$24))
      }
    };
    return ScalaJS.as.s_util_Either(failure.apply__O__O(new ScalaJS.c.s_StringContext().init___sc_Seq(new ScalaJS.c.sjs_js_WrappedArray().init___sjs_js_Array(["Unrecognised token pattern ", ""])).s__sc_Seq__T(new ScalaJS.c.sjs_js_WrappedArray().init___sjs_js_Array([x1]))))
  }
});
ScalaJS.c.Lcom_repocad_web_parsing_Parser$.prototype.parseUntil__Lcom_repocad_web_lexing_LiveStream__Lcom_repocad_web_lexing_Token__F2__F1__s_util_Either = (function(tokens, token, success, failure) {
  var elem = ScalaJS.as.sc_Seq(ScalaJS.m.sc_Seq().apply__sc_Seq__sc_GenTraversable(ScalaJS.m.sci_Nil()));
  var elem$1 = null;
  elem$1 = elem;
  var elem$2 = ScalaJS.m.s_None();
  var elem$1$1 = null;
  elem$1$1 = elem$2;
  var seqTail = new ScalaJS.c.sr_ObjectRef().init___O(tokens);
  while (((ScalaJS.as.s_Option(elem$1$1).isEmpty__Z() && (!ScalaJS.as.Lcom_repocad_web_lexing_LiveStream(seqTail.elem$1).isPlugged__Z())) && (!ScalaJS.objectEquals(ScalaJS.objectToString(ScalaJS.as.Lcom_repocad_web_lexing_LiveStream(seqTail.elem$1).head__O()), ScalaJS.objectToString(token))))) {
    var x1 = this.parse__Lcom_repocad_web_lexing_LiveStream__F2__F1__s_util_Either(ScalaJS.as.Lcom_repocad_web_lexing_LiveStream(seqTail.elem$1), this.seqSuccess$2__p1__sr_ObjectRef__F2(seqTail), failure);
    if (ScalaJS.is.s_util_Left(x1)) {
      var x2 = ScalaJS.as.s_util_Left(x1);
      var s = ScalaJS.as.T(x2.a$2);
      elem$1$1 = new ScalaJS.c.s_Some().init___O(s)
    } else if (ScalaJS.is.s_util_Right(x1)) {
      var x3 = ScalaJS.as.s_util_Right(x1);
      var e = ScalaJS.as.Lcom_repocad_web_parsing_Expr(x3.b$2);
      if ((!ScalaJS.anyRefEqEq(ScalaJS.as.sc_Seq(elem$1), ScalaJS.m.Lcom_repocad_web_parsing_UnitExpr()))) {
        var jsx$1 = elem$1;
        var this$4 = ScalaJS.m.sc_Seq();
        elem$1 = ScalaJS.as.sc_Seq(ScalaJS.as.sc_Seq(jsx$1).$$colon$plus__O__scg_CanBuildFrom__O(e, this$4.ReusableCBFInstance$2))
      }
    } else {
      throw new ScalaJS.c.s_MatchError().init___O(x1)
    }
  };
  var this$5 = ScalaJS.as.s_Option(elem$1$1);
  var this$6 = (this$5.isEmpty__Z() ? ScalaJS.m.s_None() : new ScalaJS.c.s_Some().init___O(failure.apply__O__O(this$5.get__O())));
  return ScalaJS.as.s_util_Either((this$6.isEmpty__Z() ? ScalaJS.as.s_util_Either(success.apply__O__O__O(new ScalaJS.c.Lcom_repocad_web_parsing_SeqExpr().init___sc_Seq(ScalaJS.as.sc_Seq(elem$1)), (ScalaJS.as.Lcom_repocad_web_lexing_LiveStream(seqTail.elem$1).isPlugged__Z() ? ScalaJS.as.Lcom_repocad_web_lexing_LiveStream(seqTail.elem$1) : ScalaJS.as.Lcom_repocad_web_lexing_LiveStream(seqTail.elem$1).tail__Lcom_repocad_web_lexing_LiveStream()))) : this$6.get__O()))
});
ScalaJS.c.Lcom_repocad_web_parsing_Parser$.prototype.parse__Lcom_repocad_web_lexing_LiveStream__s_util_Either = (function(tokens) {
  try {
    var elem = ScalaJS.as.sc_Seq(ScalaJS.m.sc_Seq().apply__sc_Seq__sc_GenTraversable(ScalaJS.m.sci_Nil()));
    var elem$1 = null;
    elem$1 = elem;
    var elem$2 = ScalaJS.m.s_None();
    var seqFail = new ScalaJS.c.sr_ObjectRef().init___O(elem$2);
    var seqTail = new ScalaJS.c.sr_ObjectRef().init___O(tokens);
    while ((ScalaJS.as.s_Option(seqFail.elem$1).isEmpty__Z() && (!ScalaJS.as.Lcom_repocad_web_lexing_LiveStream(seqTail.elem$1).isPlugged__Z()))) {
      var x1 = this.parse__Lcom_repocad_web_lexing_LiveStream__F2__F1__s_util_Either(ScalaJS.as.Lcom_repocad_web_lexing_LiveStream(seqTail.elem$1), this.seqSuccess$1__p1__sr_ObjectRef__F2(seqTail), this.seqFailure$1__p1__sr_ObjectRef__F1(seqFail));
      if (ScalaJS.is.s_util_Left(x1)) {
        var x2 = ScalaJS.as.s_util_Left(x1);
        var s = ScalaJS.as.T(x2.a$2);
        seqFail.elem$1 = new ScalaJS.c.s_Some().init___O(s)
      } else if (ScalaJS.is.s_util_Right(x1)) {
        var x3 = ScalaJS.as.s_util_Right(x1);
        var e = ScalaJS.as.Lcom_repocad_web_parsing_Expr(x3.b$2);
        if ((!ScalaJS.anyRefEqEq(ScalaJS.as.sc_Seq(elem$1), ScalaJS.m.Lcom_repocad_web_parsing_UnitExpr()))) {
          var jsx$1 = elem$1;
          var this$4 = ScalaJS.m.sc_Seq();
          elem$1 = ScalaJS.as.sc_Seq(ScalaJS.as.sc_Seq(jsx$1).$$colon$plus__O__scg_CanBuildFrom__O(e, this$4.ReusableCBFInstance$2))
        }
      } else {
        throw new ScalaJS.c.s_MatchError().init___O(x1)
      }
    };
    var this$5 = ScalaJS.as.s_Option(seqFail.elem$1);
    var f = this.seqFailure$1__p1__sr_ObjectRef__F1(seqFail);
    var this$6 = (this$5.isEmpty__Z() ? ScalaJS.m.s_None() : new ScalaJS.c.s_Some().init___O(f.apply__O__O(this$5.get__O())));
    if (this$6.isEmpty__Z()) {
      ScalaJS.m.s_package().Right$1;
      var b = new ScalaJS.c.Lcom_repocad_web_parsing_SeqExpr().init___sc_Seq(ScalaJS.as.sc_Seq(elem$1));
      var jsx$2 = new ScalaJS.c.s_util_Right().init___O(b)
    } else {
      var jsx$2 = this$6.get__O()
    };
    return ScalaJS.as.s_util_Either(jsx$2)
  } catch (ex) {
    ex = ScalaJS.wrapJavaScriptException(ex);
    if (ScalaJS.is.jl_InternalError(ex)) {
      return (ScalaJS.m.s_package().Left$1, new ScalaJS.c.s_util_Left().init___O("Script too large (sorry - we're working on it!)"))
    } else if (ScalaJS.is.jl_Exception(ex)) {
      var e$2 = ex;
      ScalaJS.m.s_package().Left$1;
      var a = e$2.getMessage__T();
      return new ScalaJS.c.s_util_Left().init___O(a)
    } else {
      throw ScalaJS.unwrapJavaScriptException(ex)
    }
  }
});
ScalaJS.is.Lcom_repocad_web_parsing_Parser$ = (function(obj) {
  return (!(!((obj && obj.$classData) && obj.$classData.ancestors.Lcom_repocad_web_parsing_Parser$)))
});
ScalaJS.as.Lcom_repocad_web_parsing_Parser$ = (function(obj) {
  return ((ScalaJS.is.Lcom_repocad_web_parsing_Parser$(obj) || (obj === null)) ? obj : ScalaJS.throwClassCastException(obj, "com.repocad.web.parsing.Parser$"))
});
ScalaJS.isArrayOf.Lcom_repocad_web_parsing_Parser$ = (function(obj, depth) {
  return (!(!(((obj && obj.$classData) && (obj.$classData.arrayDepth === depth)) && obj.$classData.arrayBase.ancestors.Lcom_repocad_web_parsing_Parser$)))
});
ScalaJS.asArrayOf.Lcom_repocad_web_parsing_Parser$ = (function(obj, depth) {
  return ((ScalaJS.isArrayOf.Lcom_repocad_web_parsing_Parser$(obj, depth) || (obj === null)) ? obj : ScalaJS.throwArrayCastException(obj, "Lcom.repocad.web.parsing.Parser$;", depth))
});
ScalaJS.d.Lcom_repocad_web_parsing_Parser$ = new ScalaJS.ClassTypeData({
  Lcom_repocad_web_parsing_Parser$: 0
}, false, "com.repocad.web.parsing.Parser$", ScalaJS.d.O, {
  Lcom_repocad_web_parsing_Parser$: 1,
  O: 1
});
ScalaJS.c.Lcom_repocad_web_parsing_Parser$.prototype.$classData = ScalaJS.d.Lcom_repocad_web_parsing_Parser$;
ScalaJS.n.Lcom_repocad_web_parsing_Parser = (void 0);
ScalaJS.m.Lcom_repocad_web_parsing_Parser = (function() {
  if ((!ScalaJS.n.Lcom_repocad_web_parsing_Parser)) {
    ScalaJS.n.Lcom_repocad_web_parsing_Parser = new ScalaJS.c.Lcom_repocad_web_parsing_Parser$().init___()
  };
  return ScalaJS.n.Lcom_repocad_web_parsing_Parser
});
/** @constructor */
ScalaJS.c.Lcom_repocad_web_parsing_RangeExpr = (function() {
  ScalaJS.c.O.call(this);
  this.name$1 = null;
  this.from$1 = null;
  this.to$1 = null
});
ScalaJS.c.Lcom_repocad_web_parsing_RangeExpr.prototype = new ScalaJS.h.O();
ScalaJS.c.Lcom_repocad_web_parsing_RangeExpr.prototype.constructor = ScalaJS.c.Lcom_repocad_web_parsing_RangeExpr;
/** @constructor */
ScalaJS.h.Lcom_repocad_web_parsing_RangeExpr = (function() {
  /*<skip>*/
});
ScalaJS.h.Lcom_repocad_web_parsing_RangeExpr.prototype = ScalaJS.c.Lcom_repocad_web_parsing_RangeExpr.prototype;
ScalaJS.c.Lcom_repocad_web_parsing_RangeExpr.prototype.productPrefix__T = (function() {
  return "RangeExpr"
});
ScalaJS.c.Lcom_repocad_web_parsing_RangeExpr.prototype.init___T__Lcom_repocad_web_parsing_Expr__Lcom_repocad_web_parsing_Expr = (function(name, from, to) {
  this.name$1 = name;
  this.from$1 = from;
  this.to$1 = to;
  return this
});
ScalaJS.c.Lcom_repocad_web_parsing_RangeExpr.prototype.productArity__I = (function() {
  return 3
});
ScalaJS.c.Lcom_repocad_web_parsing_RangeExpr.prototype.equals__O__Z = (function(x$1) {
  if ((this === x$1)) {
    return true
  } else if (ScalaJS.is.Lcom_repocad_web_parsing_RangeExpr(x$1)) {
    var RangeExpr$1 = ScalaJS.as.Lcom_repocad_web_parsing_RangeExpr(x$1);
    return ((ScalaJS.anyRefEqEq(this.name$1, RangeExpr$1.name$1) && ScalaJS.anyRefEqEq(this.from$1, RangeExpr$1.from$1)) && ScalaJS.anyRefEqEq(this.to$1, RangeExpr$1.to$1))
  } else {
    return false
  }
});
ScalaJS.c.Lcom_repocad_web_parsing_RangeExpr.prototype.productElement__I__O = (function(x$1) {
  switch (x$1) {
    case 0:
      {
        return this.name$1;
        break
      };
    case 1:
      {
        return this.from$1;
        break
      };
    case 2:
      {
        return this.to$1;
        break
      };
    default:
      throw new ScalaJS.c.jl_IndexOutOfBoundsException().init___T(ScalaJS.objectToString(x$1));
  }
});
ScalaJS.c.Lcom_repocad_web_parsing_RangeExpr.prototype.toString__T = (function() {
  return ScalaJS.m.sr_ScalaRunTime().$$undtoString__s_Product__T(this)
});
ScalaJS.c.Lcom_repocad_web_parsing_RangeExpr.prototype.hashCode__I = (function() {
  var this$2 = ScalaJS.m.s_util_hashing_MurmurHash3();
  return this$2.productHash__s_Product__I__I(this, (-889275714))
});
ScalaJS.c.Lcom_repocad_web_parsing_RangeExpr.prototype.productIterator__sc_Iterator = (function() {
  return new ScalaJS.c.sr_ScalaRunTime$$anon$1().init___s_Product(this)
});
ScalaJS.is.Lcom_repocad_web_parsing_RangeExpr = (function(obj) {
  return (!(!((obj && obj.$classData) && obj.$classData.ancestors.Lcom_repocad_web_parsing_RangeExpr)))
});
ScalaJS.as.Lcom_repocad_web_parsing_RangeExpr = (function(obj) {
  return ((ScalaJS.is.Lcom_repocad_web_parsing_RangeExpr(obj) || (obj === null)) ? obj : ScalaJS.throwClassCastException(obj, "com.repocad.web.parsing.RangeExpr"))
});
ScalaJS.isArrayOf.Lcom_repocad_web_parsing_RangeExpr = (function(obj, depth) {
  return (!(!(((obj && obj.$classData) && (obj.$classData.arrayDepth === depth)) && obj.$classData.arrayBase.ancestors.Lcom_repocad_web_parsing_RangeExpr)))
});
ScalaJS.asArrayOf.Lcom_repocad_web_parsing_RangeExpr = (function(obj, depth) {
  return ((ScalaJS.isArrayOf.Lcom_repocad_web_parsing_RangeExpr(obj, depth) || (obj === null)) ? obj : ScalaJS.throwArrayCastException(obj, "Lcom.repocad.web.parsing.RangeExpr;", depth))
});
ScalaJS.d.Lcom_repocad_web_parsing_RangeExpr = new ScalaJS.ClassTypeData({
  Lcom_repocad_web_parsing_RangeExpr: 0
}, false, "com.repocad.web.parsing.RangeExpr", ScalaJS.d.O, {
  Lcom_repocad_web_parsing_RangeExpr: 1,
  s_Serializable: 1,
  Ljava_io_Serializable: 1,
  s_Product: 1,
  s_Equals: 1,
  Lcom_repocad_web_parsing_ValueExpr: 1,
  Lcom_repocad_web_parsing_Expr: 1,
  O: 1
});
ScalaJS.c.Lcom_repocad_web_parsing_RangeExpr.prototype.$classData = ScalaJS.d.Lcom_repocad_web_parsing_RangeExpr;
/** @constructor */
ScalaJS.c.Lcom_repocad_web_parsing_RefExpr = (function() {
  ScalaJS.c.O.call(this);
  this.name$1 = null;
  this.params$1 = null
});
ScalaJS.c.Lcom_repocad_web_parsing_RefExpr.prototype = new ScalaJS.h.O();
ScalaJS.c.Lcom_repocad_web_parsing_RefExpr.prototype.constructor = ScalaJS.c.Lcom_repocad_web_parsing_RefExpr;
/** @constructor */
ScalaJS.h.Lcom_repocad_web_parsing_RefExpr = (function() {
  /*<skip>*/
});
ScalaJS.h.Lcom_repocad_web_parsing_RefExpr.prototype = ScalaJS.c.Lcom_repocad_web_parsing_RefExpr.prototype;
ScalaJS.c.Lcom_repocad_web_parsing_RefExpr.prototype.init___T__sc_Seq = (function(name, params) {
  this.name$1 = name;
  this.params$1 = params;
  return this
});
ScalaJS.c.Lcom_repocad_web_parsing_RefExpr.prototype.productPrefix__T = (function() {
  return "RefExpr"
});
ScalaJS.c.Lcom_repocad_web_parsing_RefExpr.prototype.productArity__I = (function() {
  return 2
});
ScalaJS.c.Lcom_repocad_web_parsing_RefExpr.prototype.equals__O__Z = (function(x$1) {
  if ((this === x$1)) {
    return true
  } else if (ScalaJS.is.Lcom_repocad_web_parsing_RefExpr(x$1)) {
    var RefExpr$1 = ScalaJS.as.Lcom_repocad_web_parsing_RefExpr(x$1);
    return (ScalaJS.anyRefEqEq(this.name$1, RefExpr$1.name$1) && ScalaJS.anyRefEqEq(this.params$1, RefExpr$1.params$1))
  } else {
    return false
  }
});
ScalaJS.c.Lcom_repocad_web_parsing_RefExpr.prototype.productElement__I__O = (function(x$1) {
  switch (x$1) {
    case 0:
      {
        return this.name$1;
        break
      };
    case 1:
      {
        return this.params$1;
        break
      };
    default:
      throw new ScalaJS.c.jl_IndexOutOfBoundsException().init___T(ScalaJS.objectToString(x$1));
  }
});
ScalaJS.c.Lcom_repocad_web_parsing_RefExpr.prototype.toString__T = (function() {
  return ScalaJS.m.sr_ScalaRunTime().$$undtoString__s_Product__T(this)
});
ScalaJS.c.Lcom_repocad_web_parsing_RefExpr.prototype.hashCode__I = (function() {
  var this$2 = ScalaJS.m.s_util_hashing_MurmurHash3();
  return this$2.productHash__s_Product__I__I(this, (-889275714))
});
ScalaJS.c.Lcom_repocad_web_parsing_RefExpr.prototype.productIterator__sc_Iterator = (function() {
  return new ScalaJS.c.sr_ScalaRunTime$$anon$1().init___s_Product(this)
});
ScalaJS.is.Lcom_repocad_web_parsing_RefExpr = (function(obj) {
  return (!(!((obj && obj.$classData) && obj.$classData.ancestors.Lcom_repocad_web_parsing_RefExpr)))
});
ScalaJS.as.Lcom_repocad_web_parsing_RefExpr = (function(obj) {
  return ((ScalaJS.is.Lcom_repocad_web_parsing_RefExpr(obj) || (obj === null)) ? obj : ScalaJS.throwClassCastException(obj, "com.repocad.web.parsing.RefExpr"))
});
ScalaJS.isArrayOf.Lcom_repocad_web_parsing_RefExpr = (function(obj, depth) {
  return (!(!(((obj && obj.$classData) && (obj.$classData.arrayDepth === depth)) && obj.$classData.arrayBase.ancestors.Lcom_repocad_web_parsing_RefExpr)))
});
ScalaJS.asArrayOf.Lcom_repocad_web_parsing_RefExpr = (function(obj, depth) {
  return ((ScalaJS.isArrayOf.Lcom_repocad_web_parsing_RefExpr(obj, depth) || (obj === null)) ? obj : ScalaJS.throwArrayCastException(obj, "Lcom.repocad.web.parsing.RefExpr;", depth))
});
ScalaJS.d.Lcom_repocad_web_parsing_RefExpr = new ScalaJS.ClassTypeData({
  Lcom_repocad_web_parsing_RefExpr: 0
}, false, "com.repocad.web.parsing.RefExpr", ScalaJS.d.O, {
  Lcom_repocad_web_parsing_RefExpr: 1,
  s_Serializable: 1,
  Ljava_io_Serializable: 1,
  s_Product: 1,
  s_Equals: 1,
  Lcom_repocad_web_parsing_ValueExpr: 1,
  Lcom_repocad_web_parsing_Expr: 1,
  O: 1
});
ScalaJS.c.Lcom_repocad_web_parsing_RefExpr.prototype.$classData = ScalaJS.d.Lcom_repocad_web_parsing_RefExpr;
/** @constructor */
ScalaJS.c.Lcom_repocad_web_parsing_SeqExpr = (function() {
  ScalaJS.c.O.call(this);
  this.expr$1 = null
});
ScalaJS.c.Lcom_repocad_web_parsing_SeqExpr.prototype = new ScalaJS.h.O();
ScalaJS.c.Lcom_repocad_web_parsing_SeqExpr.prototype.constructor = ScalaJS.c.Lcom_repocad_web_parsing_SeqExpr;
/** @constructor */
ScalaJS.h.Lcom_repocad_web_parsing_SeqExpr = (function() {
  /*<skip>*/
});
ScalaJS.h.Lcom_repocad_web_parsing_SeqExpr.prototype = ScalaJS.c.Lcom_repocad_web_parsing_SeqExpr.prototype;
ScalaJS.c.Lcom_repocad_web_parsing_SeqExpr.prototype.productPrefix__T = (function() {
  return "SeqExpr"
});
ScalaJS.c.Lcom_repocad_web_parsing_SeqExpr.prototype.productArity__I = (function() {
  return 1
});
ScalaJS.c.Lcom_repocad_web_parsing_SeqExpr.prototype.equals__O__Z = (function(x$1) {
  if ((this === x$1)) {
    return true
  } else if (ScalaJS.is.Lcom_repocad_web_parsing_SeqExpr(x$1)) {
    var SeqExpr$1 = ScalaJS.as.Lcom_repocad_web_parsing_SeqExpr(x$1);
    return ScalaJS.anyRefEqEq(this.expr$1, SeqExpr$1.expr$1)
  } else {
    return false
  }
});
ScalaJS.c.Lcom_repocad_web_parsing_SeqExpr.prototype.productElement__I__O = (function(x$1) {
  switch (x$1) {
    case 0:
      {
        return this.expr$1;
        break
      };
    default:
      throw new ScalaJS.c.jl_IndexOutOfBoundsException().init___T(ScalaJS.objectToString(x$1));
  }
});
ScalaJS.c.Lcom_repocad_web_parsing_SeqExpr.prototype.toString__T = (function() {
  return ScalaJS.m.sr_ScalaRunTime().$$undtoString__s_Product__T(this)
});
ScalaJS.c.Lcom_repocad_web_parsing_SeqExpr.prototype.init___sc_Seq = (function(expr) {
  this.expr$1 = expr;
  return this
});
ScalaJS.c.Lcom_repocad_web_parsing_SeqExpr.prototype.hashCode__I = (function() {
  var this$2 = ScalaJS.m.s_util_hashing_MurmurHash3();
  return this$2.productHash__s_Product__I__I(this, (-889275714))
});
ScalaJS.c.Lcom_repocad_web_parsing_SeqExpr.prototype.productIterator__sc_Iterator = (function() {
  return new ScalaJS.c.sr_ScalaRunTime$$anon$1().init___s_Product(this)
});
ScalaJS.is.Lcom_repocad_web_parsing_SeqExpr = (function(obj) {
  return (!(!((obj && obj.$classData) && obj.$classData.ancestors.Lcom_repocad_web_parsing_SeqExpr)))
});
ScalaJS.as.Lcom_repocad_web_parsing_SeqExpr = (function(obj) {
  return ((ScalaJS.is.Lcom_repocad_web_parsing_SeqExpr(obj) || (obj === null)) ? obj : ScalaJS.throwClassCastException(obj, "com.repocad.web.parsing.SeqExpr"))
});
ScalaJS.isArrayOf.Lcom_repocad_web_parsing_SeqExpr = (function(obj, depth) {
  return (!(!(((obj && obj.$classData) && (obj.$classData.arrayDepth === depth)) && obj.$classData.arrayBase.ancestors.Lcom_repocad_web_parsing_SeqExpr)))
});
ScalaJS.asArrayOf.Lcom_repocad_web_parsing_SeqExpr = (function(obj, depth) {
  return ((ScalaJS.isArrayOf.Lcom_repocad_web_parsing_SeqExpr(obj, depth) || (obj === null)) ? obj : ScalaJS.throwArrayCastException(obj, "Lcom.repocad.web.parsing.SeqExpr;", depth))
});
ScalaJS.d.Lcom_repocad_web_parsing_SeqExpr = new ScalaJS.ClassTypeData({
  Lcom_repocad_web_parsing_SeqExpr: 0
}, false, "com.repocad.web.parsing.SeqExpr", ScalaJS.d.O, {
  Lcom_repocad_web_parsing_SeqExpr: 1,
  s_Serializable: 1,
  Ljava_io_Serializable: 1,
  s_Product: 1,
  s_Equals: 1,
  Lcom_repocad_web_parsing_Expr: 1,
  O: 1
});
ScalaJS.c.Lcom_repocad_web_parsing_SeqExpr.prototype.$classData = ScalaJS.d.Lcom_repocad_web_parsing_SeqExpr;
/** @constructor */
ScalaJS.c.Lcom_repocad_web_parsing_TextExpr = (function() {
  ScalaJS.c.O.call(this);
  this.centerX$1 = null;
  this.centerY$1 = null;
  this.size$1 = null;
  this.t$1 = null
});
ScalaJS.c.Lcom_repocad_web_parsing_TextExpr.prototype = new ScalaJS.h.O();
ScalaJS.c.Lcom_repocad_web_parsing_TextExpr.prototype.constructor = ScalaJS.c.Lcom_repocad_web_parsing_TextExpr;
/** @constructor */
ScalaJS.h.Lcom_repocad_web_parsing_TextExpr = (function() {
  /*<skip>*/
});
ScalaJS.h.Lcom_repocad_web_parsing_TextExpr.prototype = ScalaJS.c.Lcom_repocad_web_parsing_TextExpr.prototype;
ScalaJS.c.Lcom_repocad_web_parsing_TextExpr.prototype.productPrefix__T = (function() {
  return "TextExpr"
});
ScalaJS.c.Lcom_repocad_web_parsing_TextExpr.prototype.productArity__I = (function() {
  return 4
});
ScalaJS.c.Lcom_repocad_web_parsing_TextExpr.prototype.equals__O__Z = (function(x$1) {
  if ((this === x$1)) {
    return true
  } else if (ScalaJS.is.Lcom_repocad_web_parsing_TextExpr(x$1)) {
    var TextExpr$1 = ScalaJS.as.Lcom_repocad_web_parsing_TextExpr(x$1);
    return (((ScalaJS.anyRefEqEq(this.centerX$1, TextExpr$1.centerX$1) && ScalaJS.anyRefEqEq(this.centerY$1, TextExpr$1.centerY$1)) && ScalaJS.anyRefEqEq(this.size$1, TextExpr$1.size$1)) && ScalaJS.anyRefEqEq(this.t$1, TextExpr$1.t$1))
  } else {
    return false
  }
});
ScalaJS.c.Lcom_repocad_web_parsing_TextExpr.prototype.productElement__I__O = (function(x$1) {
  switch (x$1) {
    case 0:
      {
        return this.centerX$1;
        break
      };
    case 1:
      {
        return this.centerY$1;
        break
      };
    case 2:
      {
        return this.size$1;
        break
      };
    case 3:
      {
        return this.t$1;
        break
      };
    default:
      throw new ScalaJS.c.jl_IndexOutOfBoundsException().init___T(ScalaJS.objectToString(x$1));
  }
});
ScalaJS.c.Lcom_repocad_web_parsing_TextExpr.prototype.toString__T = (function() {
  return ScalaJS.m.sr_ScalaRunTime().$$undtoString__s_Product__T(this)
});
ScalaJS.c.Lcom_repocad_web_parsing_TextExpr.prototype.hashCode__I = (function() {
  var this$2 = ScalaJS.m.s_util_hashing_MurmurHash3();
  return this$2.productHash__s_Product__I__I(this, (-889275714))
});
ScalaJS.c.Lcom_repocad_web_parsing_TextExpr.prototype.productIterator__sc_Iterator = (function() {
  return new ScalaJS.c.sr_ScalaRunTime$$anon$1().init___s_Product(this)
});
ScalaJS.c.Lcom_repocad_web_parsing_TextExpr.prototype.init___Lcom_repocad_web_parsing_Expr__Lcom_repocad_web_parsing_Expr__Lcom_repocad_web_parsing_Expr__Lcom_repocad_web_parsing_Expr = (function(centerX, centerY, size, t) {
  this.centerX$1 = centerX;
  this.centerY$1 = centerY;
  this.size$1 = size;
  this.t$1 = t;
  return this
});
ScalaJS.is.Lcom_repocad_web_parsing_TextExpr = (function(obj) {
  return (!(!((obj && obj.$classData) && obj.$classData.ancestors.Lcom_repocad_web_parsing_TextExpr)))
});
ScalaJS.as.Lcom_repocad_web_parsing_TextExpr = (function(obj) {
  return ((ScalaJS.is.Lcom_repocad_web_parsing_TextExpr(obj) || (obj === null)) ? obj : ScalaJS.throwClassCastException(obj, "com.repocad.web.parsing.TextExpr"))
});
ScalaJS.isArrayOf.Lcom_repocad_web_parsing_TextExpr = (function(obj, depth) {
  return (!(!(((obj && obj.$classData) && (obj.$classData.arrayDepth === depth)) && obj.$classData.arrayBase.ancestors.Lcom_repocad_web_parsing_TextExpr)))
});
ScalaJS.asArrayOf.Lcom_repocad_web_parsing_TextExpr = (function(obj, depth) {
  return ((ScalaJS.isArrayOf.Lcom_repocad_web_parsing_TextExpr(obj, depth) || (obj === null)) ? obj : ScalaJS.throwArrayCastException(obj, "Lcom.repocad.web.parsing.TextExpr;", depth))
});
ScalaJS.d.Lcom_repocad_web_parsing_TextExpr = new ScalaJS.ClassTypeData({
  Lcom_repocad_web_parsing_TextExpr: 0
}, false, "com.repocad.web.parsing.TextExpr", ScalaJS.d.O, {
  Lcom_repocad_web_parsing_TextExpr: 1,
  s_Serializable: 1,
  Ljava_io_Serializable: 1,
  s_Product: 1,
  s_Equals: 1,
  Lcom_repocad_web_parsing_Expr: 1,
  O: 1
});
ScalaJS.c.Lcom_repocad_web_parsing_TextExpr.prototype.$classData = ScalaJS.d.Lcom_repocad_web_parsing_TextExpr;
/** @constructor */
ScalaJS.c.Lcom_repocad_web_parsing_UnitExpr$ = (function() {
  ScalaJS.c.O.call(this)
});
ScalaJS.c.Lcom_repocad_web_parsing_UnitExpr$.prototype = new ScalaJS.h.O();
ScalaJS.c.Lcom_repocad_web_parsing_UnitExpr$.prototype.constructor = ScalaJS.c.Lcom_repocad_web_parsing_UnitExpr$;
/** @constructor */
ScalaJS.h.Lcom_repocad_web_parsing_UnitExpr$ = (function() {
  /*<skip>*/
});
ScalaJS.h.Lcom_repocad_web_parsing_UnitExpr$.prototype = ScalaJS.c.Lcom_repocad_web_parsing_UnitExpr$.prototype;
ScalaJS.c.Lcom_repocad_web_parsing_UnitExpr$.prototype.init___ = (function() {
  ScalaJS.n.Lcom_repocad_web_parsing_UnitExpr = this;
  return this
});
ScalaJS.c.Lcom_repocad_web_parsing_UnitExpr$.prototype.productPrefix__T = (function() {
  return "UnitExpr"
});
ScalaJS.c.Lcom_repocad_web_parsing_UnitExpr$.prototype.productArity__I = (function() {
  return 0
});
ScalaJS.c.Lcom_repocad_web_parsing_UnitExpr$.prototype.productElement__I__O = (function(x$1) {
  matchEnd3: {
    throw new ScalaJS.c.jl_IndexOutOfBoundsException().init___T(ScalaJS.objectToString(x$1))
  }
});
ScalaJS.c.Lcom_repocad_web_parsing_UnitExpr$.prototype.toString__T = (function() {
  return "UnitExpr"
});
ScalaJS.c.Lcom_repocad_web_parsing_UnitExpr$.prototype.hashCode__I = (function() {
  return (-228456007)
});
ScalaJS.c.Lcom_repocad_web_parsing_UnitExpr$.prototype.productIterator__sc_Iterator = (function() {
  return new ScalaJS.c.sr_ScalaRunTime$$anon$1().init___s_Product(this)
});
ScalaJS.is.Lcom_repocad_web_parsing_UnitExpr$ = (function(obj) {
  return (!(!((obj && obj.$classData) && obj.$classData.ancestors.Lcom_repocad_web_parsing_UnitExpr$)))
});
ScalaJS.as.Lcom_repocad_web_parsing_UnitExpr$ = (function(obj) {
  return ((ScalaJS.is.Lcom_repocad_web_parsing_UnitExpr$(obj) || (obj === null)) ? obj : ScalaJS.throwClassCastException(obj, "com.repocad.web.parsing.UnitExpr$"))
});
ScalaJS.isArrayOf.Lcom_repocad_web_parsing_UnitExpr$ = (function(obj, depth) {
  return (!(!(((obj && obj.$classData) && (obj.$classData.arrayDepth === depth)) && obj.$classData.arrayBase.ancestors.Lcom_repocad_web_parsing_UnitExpr$)))
});
ScalaJS.asArrayOf.Lcom_repocad_web_parsing_UnitExpr$ = (function(obj, depth) {
  return ((ScalaJS.isArrayOf.Lcom_repocad_web_parsing_UnitExpr$(obj, depth) || (obj === null)) ? obj : ScalaJS.throwArrayCastException(obj, "Lcom.repocad.web.parsing.UnitExpr$;", depth))
});
ScalaJS.d.Lcom_repocad_web_parsing_UnitExpr$ = new ScalaJS.ClassTypeData({
  Lcom_repocad_web_parsing_UnitExpr$: 0
}, false, "com.repocad.web.parsing.UnitExpr$", ScalaJS.d.O, {
  Lcom_repocad_web_parsing_UnitExpr$: 1,
  s_Serializable: 1,
  Ljava_io_Serializable: 1,
  s_Product: 1,
  s_Equals: 1,
  Lcom_repocad_web_parsing_Expr: 1,
  O: 1
});
ScalaJS.c.Lcom_repocad_web_parsing_UnitExpr$.prototype.$classData = ScalaJS.d.Lcom_repocad_web_parsing_UnitExpr$;
ScalaJS.n.Lcom_repocad_web_parsing_UnitExpr = (void 0);
ScalaJS.m.Lcom_repocad_web_parsing_UnitExpr = (function() {
  if ((!ScalaJS.n.Lcom_repocad_web_parsing_UnitExpr)) {
    ScalaJS.n.Lcom_repocad_web_parsing_UnitExpr = new ScalaJS.c.Lcom_repocad_web_parsing_UnitExpr$().init___()
  };
  return ScalaJS.n.Lcom_repocad_web_parsing_UnitExpr
});
/** @constructor */
ScalaJS.c.Lcom_repocad_web_parsing_ValExpr = (function() {
  ScalaJS.c.O.call(this);
  this.name$1 = null;
  this.value$1 = null
});
ScalaJS.c.Lcom_repocad_web_parsing_ValExpr.prototype = new ScalaJS.h.O();
ScalaJS.c.Lcom_repocad_web_parsing_ValExpr.prototype.constructor = ScalaJS.c.Lcom_repocad_web_parsing_ValExpr;
/** @constructor */
ScalaJS.h.Lcom_repocad_web_parsing_ValExpr = (function() {
  /*<skip>*/
});
ScalaJS.h.Lcom_repocad_web_parsing_ValExpr.prototype = ScalaJS.c.Lcom_repocad_web_parsing_ValExpr.prototype;
ScalaJS.c.Lcom_repocad_web_parsing_ValExpr.prototype.productPrefix__T = (function() {
  return "ValExpr"
});
ScalaJS.c.Lcom_repocad_web_parsing_ValExpr.prototype.productArity__I = (function() {
  return 2
});
ScalaJS.c.Lcom_repocad_web_parsing_ValExpr.prototype.equals__O__Z = (function(x$1) {
  if ((this === x$1)) {
    return true
  } else if (ScalaJS.is.Lcom_repocad_web_parsing_ValExpr(x$1)) {
    var ValExpr$1 = ScalaJS.as.Lcom_repocad_web_parsing_ValExpr(x$1);
    return (ScalaJS.anyRefEqEq(this.name$1, ValExpr$1.name$1) && ScalaJS.anyRefEqEq(this.value$1, ValExpr$1.value$1))
  } else {
    return false
  }
});
ScalaJS.c.Lcom_repocad_web_parsing_ValExpr.prototype.productElement__I__O = (function(x$1) {
  switch (x$1) {
    case 0:
      {
        return this.name$1;
        break
      };
    case 1:
      {
        return this.value$1;
        break
      };
    default:
      throw new ScalaJS.c.jl_IndexOutOfBoundsException().init___T(ScalaJS.objectToString(x$1));
  }
});
ScalaJS.c.Lcom_repocad_web_parsing_ValExpr.prototype.toString__T = (function() {
  return ScalaJS.m.sr_ScalaRunTime().$$undtoString__s_Product__T(this)
});
ScalaJS.c.Lcom_repocad_web_parsing_ValExpr.prototype.init___T__Lcom_repocad_web_parsing_Expr = (function(name, value) {
  this.name$1 = name;
  this.value$1 = value;
  return this
});
ScalaJS.c.Lcom_repocad_web_parsing_ValExpr.prototype.hashCode__I = (function() {
  var this$2 = ScalaJS.m.s_util_hashing_MurmurHash3();
  return this$2.productHash__s_Product__I__I(this, (-889275714))
});
ScalaJS.c.Lcom_repocad_web_parsing_ValExpr.prototype.productIterator__sc_Iterator = (function() {
  return new ScalaJS.c.sr_ScalaRunTime$$anon$1().init___s_Product(this)
});
ScalaJS.is.Lcom_repocad_web_parsing_ValExpr = (function(obj) {
  return (!(!((obj && obj.$classData) && obj.$classData.ancestors.Lcom_repocad_web_parsing_ValExpr)))
});
ScalaJS.as.Lcom_repocad_web_parsing_ValExpr = (function(obj) {
  return ((ScalaJS.is.Lcom_repocad_web_parsing_ValExpr(obj) || (obj === null)) ? obj : ScalaJS.throwClassCastException(obj, "com.repocad.web.parsing.ValExpr"))
});
ScalaJS.isArrayOf.Lcom_repocad_web_parsing_ValExpr = (function(obj, depth) {
  return (!(!(((obj && obj.$classData) && (obj.$classData.arrayDepth === depth)) && obj.$classData.arrayBase.ancestors.Lcom_repocad_web_parsing_ValExpr)))
});
ScalaJS.asArrayOf.Lcom_repocad_web_parsing_ValExpr = (function(obj, depth) {
  return ((ScalaJS.isArrayOf.Lcom_repocad_web_parsing_ValExpr(obj, depth) || (obj === null)) ? obj : ScalaJS.throwArrayCastException(obj, "Lcom.repocad.web.parsing.ValExpr;", depth))
});
ScalaJS.d.Lcom_repocad_web_parsing_ValExpr = new ScalaJS.ClassTypeData({
  Lcom_repocad_web_parsing_ValExpr: 0
}, false, "com.repocad.web.parsing.ValExpr", ScalaJS.d.O, {
  Lcom_repocad_web_parsing_ValExpr: 1,
  s_Serializable: 1,
  Ljava_io_Serializable: 1,
  s_Product: 1,
  s_Equals: 1,
  Lcom_repocad_web_parsing_ValueExpr: 1,
  Lcom_repocad_web_parsing_Expr: 1,
  O: 1
});
ScalaJS.c.Lcom_repocad_web_parsing_ValExpr.prototype.$classData = ScalaJS.d.Lcom_repocad_web_parsing_ValExpr;
ScalaJS.is.Ljava_io_Closeable = (function(obj) {
  return (!(!((obj && obj.$classData) && obj.$classData.ancestors.Ljava_io_Closeable)))
});
ScalaJS.as.Ljava_io_Closeable = (function(obj) {
  return ((ScalaJS.is.Ljava_io_Closeable(obj) || (obj === null)) ? obj : ScalaJS.throwClassCastException(obj, "java.io.Closeable"))
});
ScalaJS.isArrayOf.Ljava_io_Closeable = (function(obj, depth) {
  return (!(!(((obj && obj.$classData) && (obj.$classData.arrayDepth === depth)) && obj.$classData.arrayBase.ancestors.Ljava_io_Closeable)))
});
ScalaJS.asArrayOf.Ljava_io_Closeable = (function(obj, depth) {
  return ((ScalaJS.isArrayOf.Ljava_io_Closeable(obj, depth) || (obj === null)) ? obj : ScalaJS.throwArrayCastException(obj, "Ljava.io.Closeable;", depth))
});
ScalaJS.d.Ljava_io_Closeable = new ScalaJS.ClassTypeData({
  Ljava_io_Closeable: 0
}, true, "java.io.Closeable", (void 0), {
  Ljava_io_Closeable: 1,
  O: 1
});
/** @constructor */
ScalaJS.c.Ljava_io_OutputStream = (function() {
  ScalaJS.c.O.call(this)
});
ScalaJS.c.Ljava_io_OutputStream.prototype = new ScalaJS.h.O();
ScalaJS.c.Ljava_io_OutputStream.prototype.constructor = ScalaJS.c.Ljava_io_OutputStream;
/** @constructor */
ScalaJS.h.Ljava_io_OutputStream = (function() {
  /*<skip>*/
});
ScalaJS.h.Ljava_io_OutputStream.prototype = ScalaJS.c.Ljava_io_OutputStream.prototype;
ScalaJS.c.Ljava_io_OutputStream.prototype.close__V = (function() {
  /*<skip>*/
});
ScalaJS.is.Ljava_io_OutputStream = (function(obj) {
  return (!(!((obj && obj.$classData) && obj.$classData.ancestors.Ljava_io_OutputStream)))
});
ScalaJS.as.Ljava_io_OutputStream = (function(obj) {
  return ((ScalaJS.is.Ljava_io_OutputStream(obj) || (obj === null)) ? obj : ScalaJS.throwClassCastException(obj, "java.io.OutputStream"))
});
ScalaJS.isArrayOf.Ljava_io_OutputStream = (function(obj, depth) {
  return (!(!(((obj && obj.$classData) && (obj.$classData.arrayDepth === depth)) && obj.$classData.arrayBase.ancestors.Ljava_io_OutputStream)))
});
ScalaJS.asArrayOf.Ljava_io_OutputStream = (function(obj, depth) {
  return ((ScalaJS.isArrayOf.Ljava_io_OutputStream(obj, depth) || (obj === null)) ? obj : ScalaJS.throwArrayCastException(obj, "Ljava.io.OutputStream;", depth))
});
ScalaJS.d.Ljava_io_OutputStream = new ScalaJS.ClassTypeData({
  Ljava_io_OutputStream: 0
}, false, "java.io.OutputStream", ScalaJS.d.O, {
  Ljava_io_OutputStream: 1,
  Ljava_io_Flushable: 1,
  Ljava_io_Closeable: 1,
  O: 1
});
ScalaJS.c.Ljava_io_OutputStream.prototype.$classData = ScalaJS.d.Ljava_io_OutputStream;
/** @constructor */
ScalaJS.c.Lorg_scalajs_dom_extensions_Ajax$ = (function() {
  ScalaJS.c.O.call(this)
});
ScalaJS.c.Lorg_scalajs_dom_extensions_Ajax$.prototype = new ScalaJS.h.O();
ScalaJS.c.Lorg_scalajs_dom_extensions_Ajax$.prototype.constructor = ScalaJS.c.Lorg_scalajs_dom_extensions_Ajax$;
/** @constructor */
ScalaJS.h.Lorg_scalajs_dom_extensions_Ajax$ = (function() {
  /*<skip>*/
});
ScalaJS.h.Lorg_scalajs_dom_extensions_Ajax$.prototype = ScalaJS.c.Lorg_scalajs_dom_extensions_Ajax$.prototype;
ScalaJS.c.Lorg_scalajs_dom_extensions_Ajax$.prototype.apply__T__T__T__I__sc_Seq__Z__s_concurrent_Future = (function(method, url, data, timeout, headers, withCredentials) {
  var req = new ScalaJS.g["XMLHttpRequest"]();
  var promise = new ScalaJS.c.s_concurrent_impl_Promise$DefaultPromise().init___();
  req["onreadystatechange"] = (function(req$1, promise$1) {
    return (function(e$2) {
      if ((ScalaJS.uI(req$1["readyState"]) === 4)) {
        if (((200 <= ScalaJS.uI(req$1["status"])) && (ScalaJS.uI(req$1["status"]) < 300))) {
          return ScalaJS.i.s_concurrent_Promise$class__success__s_concurrent_Promise__O__s_concurrent_Promise(promise$1, req$1)
        } else {
          var cause = new ScalaJS.c.Lorg_scalajs_dom_extensions_AjaxException().init___Lorg_scalajs_dom_XMLHttpRequest(req$1);
          return ScalaJS.i.s_concurrent_Promise$class__failure__s_concurrent_Promise__jl_Throwable__s_concurrent_Promise(promise$1, cause)
        }
      } else {
        return (void 0)
      }
    })
  })(req, promise);
  req["open"](method, url);
  req["withCredentials"] = withCredentials;
  headers.foreach__F1__V(new ScalaJS.c.sjsr_AnonFunction1().init___sjs_js_Function1((function(req$1$1) {
    return (function(x$2) {
      var x = ScalaJS.as.T2(x$2);
      req$1$1["setRequestHeader"](ScalaJS.as.T(x.$$und1$f), ScalaJS.as.T(x.$$und2$f))
    })
  })(req)));
  req["send"](data);
  return promise
});
ScalaJS.is.Lorg_scalajs_dom_extensions_Ajax$ = (function(obj) {
  return (!(!((obj && obj.$classData) && obj.$classData.ancestors.Lorg_scalajs_dom_extensions_Ajax$)))
});
ScalaJS.as.Lorg_scalajs_dom_extensions_Ajax$ = (function(obj) {
  return ((ScalaJS.is.Lorg_scalajs_dom_extensions_Ajax$(obj) || (obj === null)) ? obj : ScalaJS.throwClassCastException(obj, "org.scalajs.dom.extensions.Ajax$"))
});
ScalaJS.isArrayOf.Lorg_scalajs_dom_extensions_Ajax$ = (function(obj, depth) {
  return (!(!(((obj && obj.$classData) && (obj.$classData.arrayDepth === depth)) && obj.$classData.arrayBase.ancestors.Lorg_scalajs_dom_extensions_Ajax$)))
});
ScalaJS.asArrayOf.Lorg_scalajs_dom_extensions_Ajax$ = (function(obj, depth) {
  return ((ScalaJS.isArrayOf.Lorg_scalajs_dom_extensions_Ajax$(obj, depth) || (obj === null)) ? obj : ScalaJS.throwArrayCastException(obj, "Lorg.scalajs.dom.extensions.Ajax$;", depth))
});
ScalaJS.d.Lorg_scalajs_dom_extensions_Ajax$ = new ScalaJS.ClassTypeData({
  Lorg_scalajs_dom_extensions_Ajax$: 0
}, false, "org.scalajs.dom.extensions.Ajax$", ScalaJS.d.O, {
  Lorg_scalajs_dom_extensions_Ajax$: 1,
  O: 1
});
ScalaJS.c.Lorg_scalajs_dom_extensions_Ajax$.prototype.$classData = ScalaJS.d.Lorg_scalajs_dom_extensions_Ajax$;
ScalaJS.n.Lorg_scalajs_dom_extensions_Ajax = (void 0);
ScalaJS.m.Lorg_scalajs_dom_extensions_Ajax = (function() {
  if ((!ScalaJS.n.Lorg_scalajs_dom_extensions_Ajax)) {
    ScalaJS.n.Lorg_scalajs_dom_extensions_Ajax = new ScalaJS.c.Lorg_scalajs_dom_extensions_Ajax$().init___()
  };
  return ScalaJS.n.Lorg_scalajs_dom_extensions_Ajax
});
ScalaJS.is.T = (function(obj) {
  return (typeof(obj) === "string")
});
ScalaJS.as.T = (function(obj) {
  return ((ScalaJS.is.T(obj) || (obj === null)) ? obj : ScalaJS.throwClassCastException(obj, "java.lang.String"))
});
ScalaJS.isArrayOf.T = (function(obj, depth) {
  return (!(!(((obj && obj.$classData) && (obj.$classData.arrayDepth === depth)) && obj.$classData.arrayBase.ancestors.T)))
});
ScalaJS.asArrayOf.T = (function(obj, depth) {
  return ((ScalaJS.isArrayOf.T(obj, depth) || (obj === null)) ? obj : ScalaJS.throwArrayCastException(obj, "Ljava.lang.String;", depth))
});
ScalaJS.d.T = new ScalaJS.ClassTypeData({
  T: 0
}, false, "java.lang.String", ScalaJS.d.O, {
  T: 1,
  Ljava_io_Serializable: 1,
  jl_CharSequence: 1,
  jl_Comparable: 1,
  O: 1
}, ScalaJS.is.T);
/** @constructor */
ScalaJS.c.T2 = (function() {
  ScalaJS.c.O.call(this);
  this.$$und1$f = null;
  this.$$und2$f = null
});
ScalaJS.c.T2.prototype = new ScalaJS.h.O();
ScalaJS.c.T2.prototype.constructor = ScalaJS.c.T2;
/** @constructor */
ScalaJS.h.T2 = (function() {
  /*<skip>*/
});
ScalaJS.h.T2.prototype = ScalaJS.c.T2.prototype;
ScalaJS.c.T2.prototype.productPrefix__T = (function() {
  return "Tuple2"
});
ScalaJS.c.T2.prototype.productArity__I = (function() {
  return 2
});
ScalaJS.c.T2.prototype.equals__O__Z = (function(x$1) {
  if ((this === x$1)) {
    return true
  } else if (ScalaJS.is.T2(x$1)) {
    var Tuple2$1 = ScalaJS.as.T2(x$1);
    return (ScalaJS.anyEqEq(this.$$und1$f, Tuple2$1.$$und1$f) && ScalaJS.anyEqEq(this.$$und2$f, Tuple2$1.$$und2$f))
  } else {
    return false
  }
});
ScalaJS.c.T2.prototype.init___O__O = (function(_1, _2) {
  this.$$und1$f = _1;
  this.$$und2$f = _2;
  return this
});
ScalaJS.c.T2.prototype.productElement__I__O = (function(n) {
  return ScalaJS.i.s_Product2$class__productElement__s_Product2__I__O(this, n)
});
ScalaJS.c.T2.prototype.toString__T = (function() {
  return (((("(" + this.$$und1$f) + ",") + this.$$und2$f) + ")")
});
ScalaJS.c.T2.prototype.hashCode__I = (function() {
  var this$2 = ScalaJS.m.s_util_hashing_MurmurHash3();
  return this$2.productHash__s_Product__I__I(this, (-889275714))
});
ScalaJS.c.T2.prototype.productIterator__sc_Iterator = (function() {
  return new ScalaJS.c.sr_ScalaRunTime$$anon$1().init___s_Product(this)
});
ScalaJS.is.T2 = (function(obj) {
  return (!(!((obj && obj.$classData) && obj.$classData.ancestors.T2)))
});
ScalaJS.as.T2 = (function(obj) {
  return ((ScalaJS.is.T2(obj) || (obj === null)) ? obj : ScalaJS.throwClassCastException(obj, "scala.Tuple2"))
});
ScalaJS.isArrayOf.T2 = (function(obj, depth) {
  return (!(!(((obj && obj.$classData) && (obj.$classData.arrayDepth === depth)) && obj.$classData.arrayBase.ancestors.T2)))
});
ScalaJS.asArrayOf.T2 = (function(obj, depth) {
  return ((ScalaJS.isArrayOf.T2(obj, depth) || (obj === null)) ? obj : ScalaJS.throwArrayCastException(obj, "Lscala.Tuple2;", depth))
});
ScalaJS.d.T2 = new ScalaJS.ClassTypeData({
  T2: 0
}, false, "scala.Tuple2", ScalaJS.d.O, {
  T2: 1,
  s_Serializable: 1,
  Ljava_io_Serializable: 1,
  s_Product2: 1,
  s_Product: 1,
  s_Equals: 1,
  O: 1
});
ScalaJS.c.T2.prototype.$classData = ScalaJS.d.T2;
ScalaJS.isArrayOf.jl_Boolean = (function(obj, depth) {
  return (!(!(((obj && obj.$classData) && (obj.$classData.arrayDepth === depth)) && obj.$classData.arrayBase.ancestors.jl_Boolean)))
});
ScalaJS.asArrayOf.jl_Boolean = (function(obj, depth) {
  return ((ScalaJS.isArrayOf.jl_Boolean(obj, depth) || (obj === null)) ? obj : ScalaJS.throwArrayCastException(obj, "Ljava.lang.Boolean;", depth))
});
ScalaJS.d.jl_Boolean = new ScalaJS.ClassTypeData({
  jl_Boolean: 0
}, false, "java.lang.Boolean", (void 0), {
  jl_Boolean: 1,
  jl_Comparable: 1,
  O: 1
}, (function(x) {
  return (typeof(x) === "boolean")
}));
ScalaJS.is.jl_CharSequence = (function(obj) {
  return (!(!(((obj && obj.$classData) && obj.$classData.ancestors.jl_CharSequence) || (typeof(obj) === "string"))))
});
ScalaJS.as.jl_CharSequence = (function(obj) {
  return ((ScalaJS.is.jl_CharSequence(obj) || (obj === null)) ? obj : ScalaJS.throwClassCastException(obj, "java.lang.CharSequence"))
});
ScalaJS.isArrayOf.jl_CharSequence = (function(obj, depth) {
  return (!(!(((obj && obj.$classData) && (obj.$classData.arrayDepth === depth)) && obj.$classData.arrayBase.ancestors.jl_CharSequence)))
});
ScalaJS.asArrayOf.jl_CharSequence = (function(obj, depth) {
  return ((ScalaJS.isArrayOf.jl_CharSequence(obj, depth) || (obj === null)) ? obj : ScalaJS.throwArrayCastException(obj, "Ljava.lang.CharSequence;", depth))
});
ScalaJS.d.jl_CharSequence = new ScalaJS.ClassTypeData({
  jl_CharSequence: 0
}, true, "java.lang.CharSequence", (void 0), {
  jl_CharSequence: 1,
  O: 1
}, ScalaJS.is.jl_CharSequence);
/** @constructor */
ScalaJS.c.jl_Character = (function() {
  ScalaJS.c.O.call(this);
  this.value$1 = 0
});
ScalaJS.c.jl_Character.prototype = new ScalaJS.h.O();
ScalaJS.c.jl_Character.prototype.constructor = ScalaJS.c.jl_Character;
/** @constructor */
ScalaJS.h.jl_Character = (function() {
  /*<skip>*/
});
ScalaJS.h.jl_Character.prototype = ScalaJS.c.jl_Character.prototype;
ScalaJS.c.jl_Character.prototype.equals__O__Z = (function(that) {
  if (ScalaJS.is.jl_Character(that)) {
    var this$1 = ScalaJS.as.jl_Character(that);
    return (this.value$1 === this$1.value$1)
  } else {
    return false
  }
});
ScalaJS.c.jl_Character.prototype.toString__T = (function() {
  var c = this.value$1;
  return ScalaJS.as.T(ScalaJS.g["String"]["fromCharCode"](c))
});
ScalaJS.c.jl_Character.prototype.init___C = (function(value) {
  this.value$1 = value;
  return this
});
ScalaJS.c.jl_Character.prototype.hashCode__I = (function() {
  return this.value$1
});
ScalaJS.is.jl_Character = (function(obj) {
  return (!(!((obj && obj.$classData) && obj.$classData.ancestors.jl_Character)))
});
ScalaJS.as.jl_Character = (function(obj) {
  return ((ScalaJS.is.jl_Character(obj) || (obj === null)) ? obj : ScalaJS.throwClassCastException(obj, "java.lang.Character"))
});
ScalaJS.isArrayOf.jl_Character = (function(obj, depth) {
  return (!(!(((obj && obj.$classData) && (obj.$classData.arrayDepth === depth)) && obj.$classData.arrayBase.ancestors.jl_Character)))
});
ScalaJS.asArrayOf.jl_Character = (function(obj, depth) {
  return ((ScalaJS.isArrayOf.jl_Character(obj, depth) || (obj === null)) ? obj : ScalaJS.throwArrayCastException(obj, "Ljava.lang.Character;", depth))
});
ScalaJS.d.jl_Character = new ScalaJS.ClassTypeData({
  jl_Character: 0
}, false, "java.lang.Character", ScalaJS.d.O, {
  jl_Character: 1,
  jl_Comparable: 1,
  O: 1
});
ScalaJS.c.jl_Character.prototype.$classData = ScalaJS.d.jl_Character;
/** @constructor */
ScalaJS.c.jl_Character$ = (function() {
  ScalaJS.c.O.call(this);
  this.TYPE$1 = null;
  this.MIN$undVALUE$1 = 0;
  this.MAX$undVALUE$1 = 0;
  this.SIZE$1 = 0;
  this.LOWERCASE$undLETTER$1 = 0;
  this.UPPERCASE$undLETTER$1 = 0;
  this.OTHER$undLETTER$1 = 0;
  this.TITLECASE$undLETTER$1 = 0;
  this.LETTER$undNUMBER$1 = 0;
  this.COMBINING$undSPACING$undMARK$1 = 0;
  this.ENCLOSING$undMARK$1 = 0;
  this.NON$undSPACING$undMARK$1 = 0;
  this.MODIFIER$undLETTER$1 = 0;
  this.DECIMAL$undDIGIT$undNUMBER$1 = 0;
  this.SURROGATE$1 = 0;
  this.MIN$undRADIX$1 = 0;
  this.MAX$undRADIX$1 = 0;
  this.MIN$undHIGH$undSURROGATE$1 = 0;
  this.MAX$undHIGH$undSURROGATE$1 = 0;
  this.MIN$undLOW$undSURROGATE$1 = 0;
  this.MAX$undLOW$undSURROGATE$1 = 0;
  this.MIN$undSURROGATE$1 = 0;
  this.MAX$undSURROGATE$1 = 0;
  this.MIN$undCODE$undPOINT$1 = 0;
  this.MAX$undCODE$undPOINT$1 = 0;
  this.MIN$undSUPPLEMENTARY$undCODE$undPOINT$1 = 0;
  this.HighSurrogateMask$1 = 0;
  this.HighSurrogateID$1 = 0;
  this.LowSurrogateMask$1 = 0;
  this.LowSurrogateID$1 = 0;
  this.SurrogateUsefulPartMask$1 = 0;
  this.reUnicodeIdentStart$1 = null;
  this.reUnicodeIdentPartExcl$1 = null;
  this.reIdentIgnorable$1 = null;
  this.bitmap$0$1 = 0
});
ScalaJS.c.jl_Character$.prototype = new ScalaJS.h.O();
ScalaJS.c.jl_Character$.prototype.constructor = ScalaJS.c.jl_Character$;
/** @constructor */
ScalaJS.h.jl_Character$ = (function() {
  /*<skip>*/
});
ScalaJS.h.jl_Character$.prototype = ScalaJS.c.jl_Character$.prototype;
ScalaJS.c.jl_Character$.prototype.init___ = (function() {
  ScalaJS.n.jl_Character = this;
  this.LOWERCASE$undLETTER$1 = 0;
  this.UPPERCASE$undLETTER$1 = 0;
  this.OTHER$undLETTER$1 = 0;
  this.TITLECASE$undLETTER$1 = 0;
  this.LETTER$undNUMBER$1 = 0;
  this.COMBINING$undSPACING$undMARK$1 = 0;
  this.ENCLOSING$undMARK$1 = 0;
  this.NON$undSPACING$undMARK$1 = 0;
  this.MODIFIER$undLETTER$1 = 0;
  this.DECIMAL$undDIGIT$undNUMBER$1 = 0;
  this.SURROGATE$1 = 0;
  return this
});
ScalaJS.c.jl_Character$.prototype.digit__C__I__I = (function(c, radix) {
  return (((radix > 36) || (radix < 2)) ? (-1) : ((((c >= 48) && (c <= 57)) && (((c - 48) | 0) < radix)) ? ((c - 48) | 0) : ((((c >= 65) && (c <= 90)) && (((c - 65) | 0) < ((radix - 10) | 0))) ? ((((c - 65) | 0) + 10) | 0) : ((((c >= 97) && (c <= 122)) && (((c - 97) | 0) < ((radix - 10) | 0))) ? ((((c - 97) | 0) + 10) | 0) : ((((c >= 65313) && (c <= 65338)) && (((c - 65313) | 0) < ((radix - 10) | 0))) ? ((((c - 65313) | 0) + 10) | 0) : ((((c >= 65345) && (c <= 65370)) && (((c - 65345) | 0) < ((radix - 10) | 0))) ? ((((c - 65313) | 0) + 10) | 0) : (-1)))))))
});
ScalaJS.c.jl_Character$.prototype.isUpperCase__C__Z = (function(c) {
  return (this.toUpperCase__C__C(c) === c)
});
ScalaJS.c.jl_Character$.prototype.toUpperCase__C__C = (function(c) {
  var $$this = ScalaJS.i.sjsr_RuntimeString$class__toUpperCase__sjsr_RuntimeString__T(ScalaJS.objectToString(ScalaJS.bC(c)));
  return ScalaJS.i.sjsr_RuntimeString$class__charAt__sjsr_RuntimeString__I__C($$this, 0)
});
ScalaJS.is.jl_Character$ = (function(obj) {
  return (!(!((obj && obj.$classData) && obj.$classData.ancestors.jl_Character$)))
});
ScalaJS.as.jl_Character$ = (function(obj) {
  return ((ScalaJS.is.jl_Character$(obj) || (obj === null)) ? obj : ScalaJS.throwClassCastException(obj, "java.lang.Character$"))
});
ScalaJS.isArrayOf.jl_Character$ = (function(obj, depth) {
  return (!(!(((obj && obj.$classData) && (obj.$classData.arrayDepth === depth)) && obj.$classData.arrayBase.ancestors.jl_Character$)))
});
ScalaJS.asArrayOf.jl_Character$ = (function(obj, depth) {
  return ((ScalaJS.isArrayOf.jl_Character$(obj, depth) || (obj === null)) ? obj : ScalaJS.throwArrayCastException(obj, "Ljava.lang.Character$;", depth))
});
ScalaJS.d.jl_Character$ = new ScalaJS.ClassTypeData({
  jl_Character$: 0
}, false, "java.lang.Character$", ScalaJS.d.O, {
  jl_Character$: 1,
  O: 1
});
ScalaJS.c.jl_Character$.prototype.$classData = ScalaJS.d.jl_Character$;
ScalaJS.n.jl_Character = (void 0);
ScalaJS.m.jl_Character = (function() {
  if ((!ScalaJS.n.jl_Character)) {
    ScalaJS.n.jl_Character = new ScalaJS.c.jl_Character$().init___()
  };
  return ScalaJS.n.jl_Character
});
/** @constructor */
ScalaJS.c.jl_Class = (function() {
  ScalaJS.c.O.call(this);
  this.data$1 = null
});
ScalaJS.c.jl_Class.prototype = new ScalaJS.h.O();
ScalaJS.c.jl_Class.prototype.constructor = ScalaJS.c.jl_Class;
/** @constructor */
ScalaJS.h.jl_Class = (function() {
  /*<skip>*/
});
ScalaJS.h.jl_Class.prototype = ScalaJS.c.jl_Class.prototype;
ScalaJS.c.jl_Class.prototype.getName__T = (function() {
  return ScalaJS.as.T(this.data$1["name"])
});
ScalaJS.c.jl_Class.prototype.getComponentType__jl_Class = (function() {
  return ScalaJS.as.jl_Class(this.data$1["getComponentType"]())
});
ScalaJS.c.jl_Class.prototype.isPrimitive__Z = (function() {
  return ScalaJS.uZ(this.data$1["isPrimitive"])
});
ScalaJS.c.jl_Class.prototype.toString__T = (function() {
  return ((this.isInterface__Z() ? "interface " : (this.isPrimitive__Z() ? "" : "class ")) + this.getName__T())
});
ScalaJS.c.jl_Class.prototype.isAssignableFrom__jl_Class__Z = (function(that) {
  return ((this.isPrimitive__Z() || that.isPrimitive__Z()) ? ((this === that) || ((this === ScalaJS.d.S.getClassOf()) ? (that === ScalaJS.d.B.getClassOf()) : ((this === ScalaJS.d.I.getClassOf()) ? ((that === ScalaJS.d.B.getClassOf()) || (that === ScalaJS.d.S.getClassOf())) : ((this === ScalaJS.d.F.getClassOf()) ? (((that === ScalaJS.d.B.getClassOf()) || (that === ScalaJS.d.S.getClassOf())) || (that === ScalaJS.d.I.getClassOf())) : ((this === ScalaJS.d.D.getClassOf()) && ((((that === ScalaJS.d.B.getClassOf()) || (that === ScalaJS.d.S.getClassOf())) || (that === ScalaJS.d.I.getClassOf())) || (that === ScalaJS.d.F.getClassOf()))))))) : this.isInstance__O__Z(that.getFakeInstance__p1__O()))
});
ScalaJS.c.jl_Class.prototype.isInstance__O__Z = (function(obj) {
  return ScalaJS.uZ(this.data$1["isInstance"](obj))
});
ScalaJS.c.jl_Class.prototype.init___jl_ScalaJSClassData = (function(data) {
  this.data$1 = data;
  return this
});
ScalaJS.c.jl_Class.prototype.getFakeInstance__p1__O = (function() {
  return this.data$1["getFakeInstance"]()
});
ScalaJS.c.jl_Class.prototype.newArrayOfThisClass__sjs_js_Array__O = (function(dimensions) {
  return this.data$1["newArrayOfThisClass"](dimensions)
});
ScalaJS.c.jl_Class.prototype.isArray__Z = (function() {
  return ScalaJS.uZ(this.data$1["isArrayClass"])
});
ScalaJS.c.jl_Class.prototype.isInterface__Z = (function() {
  return ScalaJS.uZ(this.data$1["isInterface"])
});
ScalaJS.is.jl_Class = (function(obj) {
  return (!(!((obj && obj.$classData) && obj.$classData.ancestors.jl_Class)))
});
ScalaJS.as.jl_Class = (function(obj) {
  return ((ScalaJS.is.jl_Class(obj) || (obj === null)) ? obj : ScalaJS.throwClassCastException(obj, "java.lang.Class"))
});
ScalaJS.isArrayOf.jl_Class = (function(obj, depth) {
  return (!(!(((obj && obj.$classData) && (obj.$classData.arrayDepth === depth)) && obj.$classData.arrayBase.ancestors.jl_Class)))
});
ScalaJS.asArrayOf.jl_Class = (function(obj, depth) {
  return ((ScalaJS.isArrayOf.jl_Class(obj, depth) || (obj === null)) ? obj : ScalaJS.throwArrayCastException(obj, "Ljava.lang.Class;", depth))
});
ScalaJS.d.jl_Class = new ScalaJS.ClassTypeData({
  jl_Class: 0
}, false, "java.lang.Class", ScalaJS.d.O, {
  jl_Class: 1,
  O: 1
});
ScalaJS.c.jl_Class.prototype.$classData = ScalaJS.d.jl_Class;
/** @constructor */
ScalaJS.c.jl_Float$ = (function() {
  ScalaJS.c.O.call(this);
  this.TYPE$1 = null;
  this.POSITIVE$undINFINITY$1 = 0.0;
  this.NEGATIVE$undINFINITY$1 = 0.0;
  this.NaN$1 = 0.0;
  this.MAX$undVALUE$1 = 0.0;
  this.MIN$undVALUE$1 = 0.0;
  this.MAX$undEXPONENT$1 = 0;
  this.MIN$undEXPONENT$1 = 0;
  this.SIZE$1 = 0;
  this.floatStrPat$1 = null;
  this.bitmap$0$1 = false
});
ScalaJS.c.jl_Float$.prototype = new ScalaJS.h.O();
ScalaJS.c.jl_Float$.prototype.constructor = ScalaJS.c.jl_Float$;
/** @constructor */
ScalaJS.h.jl_Float$ = (function() {
  /*<skip>*/
});
ScalaJS.h.jl_Float$.prototype = ScalaJS.c.jl_Float$.prototype;
ScalaJS.c.jl_Float$.prototype.floatStrPat__p1__sjs_js_RegExp = (function() {
  return ((!this.bitmap$0$1) ? this.floatStrPat$lzycompute__p1__sjs_js_RegExp() : this.floatStrPat$1)
});
ScalaJS.c.jl_Float$.prototype.floatStrPat$lzycompute__p1__sjs_js_RegExp = (function() {
  if ((!this.bitmap$0$1)) {
    this.floatStrPat$1 = new ScalaJS.g["RegExp"]("^[\\x00-\\x20]*[+-]?(NaN|Infinity|(\\d+\\.?\\d*|\\.\\d+)([eE][+-]?\\d+)?)[fFdD]?[\\x00-\\x20]*$");
    this.bitmap$0$1 = true
  };
  return this.floatStrPat$1
});
ScalaJS.c.jl_Float$.prototype.parseFloat__T__F = (function(s) {
  if (ScalaJS.uZ(this.floatStrPat__p1__sjs_js_RegExp()["test"](s))) {
    return ScalaJS.uD(ScalaJS.g["parseFloat"](s))
  } else {
    throw new ScalaJS.c.jl_NumberFormatException().init___T(new ScalaJS.c.s_StringContext().init___sc_Seq(new ScalaJS.c.sjs_js_WrappedArray().init___sjs_js_Array(["For input string: \"", "\""])).s__sc_Seq__T(new ScalaJS.c.sjs_js_WrappedArray().init___sjs_js_Array([s])))
  }
});
ScalaJS.is.jl_Float$ = (function(obj) {
  return (!(!((obj && obj.$classData) && obj.$classData.ancestors.jl_Float$)))
});
ScalaJS.as.jl_Float$ = (function(obj) {
  return ((ScalaJS.is.jl_Float$(obj) || (obj === null)) ? obj : ScalaJS.throwClassCastException(obj, "java.lang.Float$"))
});
ScalaJS.isArrayOf.jl_Float$ = (function(obj, depth) {
  return (!(!(((obj && obj.$classData) && (obj.$classData.arrayDepth === depth)) && obj.$classData.arrayBase.ancestors.jl_Float$)))
});
ScalaJS.asArrayOf.jl_Float$ = (function(obj, depth) {
  return ((ScalaJS.isArrayOf.jl_Float$(obj, depth) || (obj === null)) ? obj : ScalaJS.throwArrayCastException(obj, "Ljava.lang.Float$;", depth))
});
ScalaJS.d.jl_Float$ = new ScalaJS.ClassTypeData({
  jl_Float$: 0
}, false, "java.lang.Float$", ScalaJS.d.O, {
  jl_Float$: 1,
  O: 1
});
ScalaJS.c.jl_Float$.prototype.$classData = ScalaJS.d.jl_Float$;
ScalaJS.n.jl_Float = (void 0);
ScalaJS.m.jl_Float = (function() {
  if ((!ScalaJS.n.jl_Float)) {
    ScalaJS.n.jl_Float = new ScalaJS.c.jl_Float$().init___()
  };
  return ScalaJS.n.jl_Float
});
/** @constructor */
ScalaJS.c.jl_Integer$ = (function() {
  ScalaJS.c.O.call(this);
  this.TYPE$1 = null;
  this.MIN$undVALUE$1 = 0;
  this.MAX$undVALUE$1 = 0;
  this.SIZE$1 = 0
});
ScalaJS.c.jl_Integer$.prototype = new ScalaJS.h.O();
ScalaJS.c.jl_Integer$.prototype.constructor = ScalaJS.c.jl_Integer$;
/** @constructor */
ScalaJS.h.jl_Integer$ = (function() {
  /*<skip>*/
});
ScalaJS.h.jl_Integer$.prototype = ScalaJS.c.jl_Integer$.prototype;
ScalaJS.c.jl_Integer$.prototype.fail$1__p1__T__sr_Nothing$ = (function(s$1) {
  throw new ScalaJS.c.jl_NumberFormatException().init___T(new ScalaJS.c.s_StringContext().init___sc_Seq(new ScalaJS.c.sjs_js_WrappedArray().init___sjs_js_Array(["For input string: \"", "\""])).s__sc_Seq__T(new ScalaJS.c.sjs_js_WrappedArray().init___sjs_js_Array([s$1])))
});
ScalaJS.c.jl_Integer$.prototype.parseInt__T__I__I = (function(s, radix) {
  if ((s === null)) {
    var jsx$1 = true
  } else {
    var this$2 = new ScalaJS.c.sci_StringOps().init___T(s);
    var $$this = this$2.repr$1;
    var jsx$1 = (ScalaJS.i.sjsr_RuntimeString$class__length__sjsr_RuntimeString__I($$this) === 0)
  };
  if (((jsx$1 || (radix < 2)) || (radix > 36))) {
    this.fail$1__p1__T__sr_Nothing$(s)
  } else {
    var i = (((ScalaJS.i.sjsr_RuntimeString$class__charAt__sjsr_RuntimeString__I__C(s, 0) === 45) || (ScalaJS.i.sjsr_RuntimeString$class__charAt__sjsr_RuntimeString__I__C(s, 0) === 43)) ? 1 : 0);
    var this$9 = new ScalaJS.c.sci_StringOps().init___T(s);
    var $$this$1 = this$9.repr$1;
    if ((ScalaJS.i.sjsr_RuntimeString$class__length__sjsr_RuntimeString__I($$this$1) <= i)) {
      this.fail$1__p1__T__sr_Nothing$(s)
    } else {
      while (true) {
        var jsx$2 = i;
        var this$12 = new ScalaJS.c.sci_StringOps().init___T(s);
        var $$this$2 = this$12.repr$1;
        if ((jsx$2 < ScalaJS.i.sjsr_RuntimeString$class__length__sjsr_RuntimeString__I($$this$2))) {
          var jsx$3 = ScalaJS.m.jl_Character();
          var index = i;
          if ((jsx$3.digit__C__I__I(ScalaJS.i.sjsr_RuntimeString$class__charAt__sjsr_RuntimeString__I__C(s, index), radix) < 0)) {
            this.fail$1__p1__T__sr_Nothing$(s)
          };
          i = ((i + 1) | 0)
        } else {
          break
        }
      };
      var res = ScalaJS.uD(ScalaJS.g["parseInt"](s, radix));
      return (((ScalaJS.uZ(ScalaJS.g["isNaN"](res)) || (res > 2147483647)) || (res < (-2147483648))) ? this.fail$1__p1__T__sr_Nothing$(s) : (res | 0))
    }
  }
});
ScalaJS.c.jl_Integer$.prototype.rotateLeft__I__I__I = (function(i, distance) {
  return ((i << distance) | ((i >>> ((32 - distance) | 0)) | 0))
});
ScalaJS.c.jl_Integer$.prototype.numberOfLeadingZeros__I__I = (function(i) {
  var x = i;
  x = (x | ((x >>> 1) | 0));
  x = (x | ((x >>> 2) | 0));
  x = (x | ((x >>> 4) | 0));
  x = (x | ((x >>> 8) | 0));
  x = (x | ((x >>> 16) | 0));
  return ((32 - this.bitCount__I__I(x)) | 0)
});
ScalaJS.c.jl_Integer$.prototype.reverseBytes__I__I = (function(i) {
  var byte3 = ((i >>> 24) | 0);
  var byte2 = (((i >>> 8) | 0) & 65280);
  var byte1 = ((i << 8) & 16711680);
  var byte0 = (i << 24);
  return (((byte0 | byte1) | byte2) | byte3)
});
ScalaJS.c.jl_Integer$.prototype.bitCount__I__I = (function(i) {
  var t1 = ((i - ((i >> 1) & 1431655765)) | 0);
  var t2 = (((t1 & 858993459) + ((t1 >> 2) & 858993459)) | 0);
  return (ScalaJS.imul((((t2 + (t2 >> 4)) | 0) & 252645135), 16843009) >> 24)
});
ScalaJS.c.jl_Integer$.prototype.numberOfTrailingZeros__I__I = (function(i) {
  return this.bitCount__I__I((((i & ((-i) | 0)) - 1) | 0))
});
ScalaJS.is.jl_Integer$ = (function(obj) {
  return (!(!((obj && obj.$classData) && obj.$classData.ancestors.jl_Integer$)))
});
ScalaJS.as.jl_Integer$ = (function(obj) {
  return ((ScalaJS.is.jl_Integer$(obj) || (obj === null)) ? obj : ScalaJS.throwClassCastException(obj, "java.lang.Integer$"))
});
ScalaJS.isArrayOf.jl_Integer$ = (function(obj, depth) {
  return (!(!(((obj && obj.$classData) && (obj.$classData.arrayDepth === depth)) && obj.$classData.arrayBase.ancestors.jl_Integer$)))
});
ScalaJS.asArrayOf.jl_Integer$ = (function(obj, depth) {
  return ((ScalaJS.isArrayOf.jl_Integer$(obj, depth) || (obj === null)) ? obj : ScalaJS.throwArrayCastException(obj, "Ljava.lang.Integer$;", depth))
});
ScalaJS.d.jl_Integer$ = new ScalaJS.ClassTypeData({
  jl_Integer$: 0
}, false, "java.lang.Integer$", ScalaJS.d.O, {
  jl_Integer$: 1,
  O: 1
});
ScalaJS.c.jl_Integer$.prototype.$classData = ScalaJS.d.jl_Integer$;
ScalaJS.n.jl_Integer = (void 0);
ScalaJS.m.jl_Integer = (function() {
  if ((!ScalaJS.n.jl_Integer)) {
    ScalaJS.n.jl_Integer = new ScalaJS.c.jl_Integer$().init___()
  };
  return ScalaJS.n.jl_Integer
});
/** @constructor */
ScalaJS.c.jl_Number = (function() {
  ScalaJS.c.O.call(this)
});
ScalaJS.c.jl_Number.prototype = new ScalaJS.h.O();
ScalaJS.c.jl_Number.prototype.constructor = ScalaJS.c.jl_Number;
/** @constructor */
ScalaJS.h.jl_Number = (function() {
  /*<skip>*/
});
ScalaJS.h.jl_Number.prototype = ScalaJS.c.jl_Number.prototype;
ScalaJS.is.jl_Number = (function(obj) {
  return (!(!(((obj && obj.$classData) && obj.$classData.ancestors.jl_Number) || (typeof(obj) === "number"))))
});
ScalaJS.as.jl_Number = (function(obj) {
  return ((ScalaJS.is.jl_Number(obj) || (obj === null)) ? obj : ScalaJS.throwClassCastException(obj, "java.lang.Number"))
});
ScalaJS.isArrayOf.jl_Number = (function(obj, depth) {
  return (!(!(((obj && obj.$classData) && (obj.$classData.arrayDepth === depth)) && obj.$classData.arrayBase.ancestors.jl_Number)))
});
ScalaJS.asArrayOf.jl_Number = (function(obj, depth) {
  return ((ScalaJS.isArrayOf.jl_Number(obj, depth) || (obj === null)) ? obj : ScalaJS.throwArrayCastException(obj, "Ljava.lang.Number;", depth))
});
ScalaJS.d.jl_Number = new ScalaJS.ClassTypeData({
  jl_Number: 0
}, false, "java.lang.Number", ScalaJS.d.O, {
  jl_Number: 1,
  O: 1
}, ScalaJS.is.jl_Number);
ScalaJS.c.jl_Number.prototype.$classData = ScalaJS.d.jl_Number;
/** @constructor */
ScalaJS.c.jl_StringBuilder = (function() {
  ScalaJS.c.O.call(this);
  this.content$1 = null
});
ScalaJS.c.jl_StringBuilder.prototype = new ScalaJS.h.O();
ScalaJS.c.jl_StringBuilder.prototype.constructor = ScalaJS.c.jl_StringBuilder;
/** @constructor */
ScalaJS.h.jl_StringBuilder = (function() {
  /*<skip>*/
});
ScalaJS.h.jl_StringBuilder.prototype = ScalaJS.c.jl_StringBuilder.prototype;
ScalaJS.c.jl_StringBuilder.prototype.init___ = (function() {
  return (ScalaJS.c.jl_StringBuilder.prototype.init___T.call(this, ""), this)
});
ScalaJS.c.jl_StringBuilder.prototype.append__T__jl_StringBuilder = (function(s) {
  this.content$1 = (("" + this.content$1) + ((s === null) ? "null" : s));
  return this
});
ScalaJS.c.jl_StringBuilder.prototype.subSequence__I__I__jl_CharSequence = (function(start, end) {
  return ScalaJS.i.sjsr_RuntimeString$class__substring__sjsr_RuntimeString__I__I__T(this.content$1, start, end)
});
ScalaJS.c.jl_StringBuilder.prototype.toString__T = (function() {
  return this.content$1
});
ScalaJS.c.jl_StringBuilder.prototype.init___jl_CharSequence = (function(csq) {
  return (ScalaJS.c.jl_StringBuilder.prototype.init___T.call(this, ScalaJS.objectToString(csq)), this)
});
ScalaJS.c.jl_StringBuilder.prototype.append__jl_CharSequence__jl_Appendable = (function(csq) {
  return this.append__O__jl_StringBuilder(csq)
});
ScalaJS.c.jl_StringBuilder.prototype.append__O__jl_StringBuilder = (function(obj) {
  return ((obj === null) ? this.append__T__jl_StringBuilder(null) : this.append__T__jl_StringBuilder(ScalaJS.objectToString(obj)))
});
ScalaJS.c.jl_StringBuilder.prototype.init___I = (function(initialCapacity) {
  return (ScalaJS.c.jl_StringBuilder.prototype.init___T.call(this, ""), this)
});
ScalaJS.c.jl_StringBuilder.prototype.append__jl_CharSequence__I__I__jl_StringBuilder = (function(csq, start, end) {
  return ((csq === null) ? this.append__jl_CharSequence__I__I__jl_StringBuilder("null", start, end) : this.append__T__jl_StringBuilder(ScalaJS.objectToString(ScalaJS.charSequenceSubSequence(csq, start, end))))
});
ScalaJS.c.jl_StringBuilder.prototype.append__C__jl_StringBuilder = (function(c) {
  return this.append__T__jl_StringBuilder(ScalaJS.objectToString(ScalaJS.bC(c)))
});
ScalaJS.c.jl_StringBuilder.prototype.init___T = (function(content) {
  this.content$1 = content;
  return this
});
ScalaJS.c.jl_StringBuilder.prototype.append__C__jl_Appendable = (function(c) {
  return this.append__C__jl_StringBuilder(c)
});
ScalaJS.c.jl_StringBuilder.prototype.reverse__jl_StringBuilder = (function() {
  var original = this.content$1;
  var result = "";
  var i = 0;
  while ((i < ScalaJS.i.sjsr_RuntimeString$class__length__sjsr_RuntimeString__I(original))) {
    var c = ScalaJS.i.sjsr_RuntimeString$class__charAt__sjsr_RuntimeString__I__C(original, i);
    if ((((c & 64512) === 55296) && (((i + 1) | 0) < ScalaJS.i.sjsr_RuntimeString$class__length__sjsr_RuntimeString__I(original)))) {
      var c2 = ScalaJS.i.sjsr_RuntimeString$class__charAt__sjsr_RuntimeString__I__C(original, ((i + 1) | 0));
      if (((c2 & 64512) === 56320)) {
        result = ((("" + ScalaJS.objectToString(ScalaJS.bC(c))) + ScalaJS.objectToString(ScalaJS.bC(c2))) + result);
        i = ((i + 2) | 0)
      } else {
        result = (("" + ScalaJS.objectToString(ScalaJS.bC(c))) + result);
        i = ((i + 1) | 0)
      }
    } else {
      result = (("" + ScalaJS.objectToString(ScalaJS.bC(c))) + result);
      i = ((i + 1) | 0)
    }
  };
  this.content$1 = result;
  return this
});
ScalaJS.is.jl_StringBuilder = (function(obj) {
  return (!(!((obj && obj.$classData) && obj.$classData.ancestors.jl_StringBuilder)))
});
ScalaJS.as.jl_StringBuilder = (function(obj) {
  return ((ScalaJS.is.jl_StringBuilder(obj) || (obj === null)) ? obj : ScalaJS.throwClassCastException(obj, "java.lang.StringBuilder"))
});
ScalaJS.isArrayOf.jl_StringBuilder = (function(obj, depth) {
  return (!(!(((obj && obj.$classData) && (obj.$classData.arrayDepth === depth)) && obj.$classData.arrayBase.ancestors.jl_StringBuilder)))
});
ScalaJS.asArrayOf.jl_StringBuilder = (function(obj, depth) {
  return ((ScalaJS.isArrayOf.jl_StringBuilder(obj, depth) || (obj === null)) ? obj : ScalaJS.throwArrayCastException(obj, "Ljava.lang.StringBuilder;", depth))
});
ScalaJS.d.jl_StringBuilder = new ScalaJS.ClassTypeData({
  jl_StringBuilder: 0
}, false, "java.lang.StringBuilder", ScalaJS.d.O, {
  jl_StringBuilder: 1,
  Ljava_io_Serializable: 1,
  jl_Appendable: 1,
  jl_CharSequence: 1,
  O: 1
});
ScalaJS.c.jl_StringBuilder.prototype.$classData = ScalaJS.d.jl_StringBuilder;
/** @constructor */
ScalaJS.c.jl_System$ = (function() {
  ScalaJS.c.O.call(this);
  this.out$1 = null;
  this.err$1 = null;
  this.in$1 = null;
  this.getHighPrecisionTime$1 = null
});
ScalaJS.c.jl_System$.prototype = new ScalaJS.h.O();
ScalaJS.c.jl_System$.prototype.constructor = ScalaJS.c.jl_System$;
/** @constructor */
ScalaJS.h.jl_System$ = (function() {
  /*<skip>*/
});
ScalaJS.h.jl_System$.prototype = ScalaJS.c.jl_System$.prototype;
ScalaJS.c.jl_System$.prototype.init___ = (function() {
  ScalaJS.n.jl_System = this;
  this.out$1 = ScalaJS.m.jl_StandardOutPrintStream();
  this.err$1 = ScalaJS.m.jl_StandardErrPrintStream();
  this.in$1 = null;
  this.getHighPrecisionTime$1 = ((!ScalaJS.uZ((!ScalaJS.g["performance"]))) ? ((!ScalaJS.uZ((!ScalaJS.g["performance"]["now"]))) ? (function(this$2) {
    return (function() {
      return ScalaJS.uD(ScalaJS.g["performance"]["now"]())
    })
  })(this) : ((!ScalaJS.uZ((!ScalaJS.g["performance"]["webkitNow"]))) ? (function(this$3) {
    return (function() {
      return ScalaJS.uD(ScalaJS.g["performance"]["webkitNow"]())
    })
  })(this) : (function(this$4) {
    return (function() {
      return ScalaJS.uD(new ScalaJS.g["Date"]()["getTime"]())
    })
  })(this))) : (function(this$5) {
    return (function() {
      return ScalaJS.uD(new ScalaJS.g["Date"]()["getTime"]())
    })
  })(this));
  return this
});
ScalaJS.c.jl_System$.prototype.identityHashCode__O__I = (function(x) {
  return ScalaJS.systemIdentityHashCode(x)
});
ScalaJS.is.jl_System$ = (function(obj) {
  return (!(!((obj && obj.$classData) && obj.$classData.ancestors.jl_System$)))
});
ScalaJS.as.jl_System$ = (function(obj) {
  return ((ScalaJS.is.jl_System$(obj) || (obj === null)) ? obj : ScalaJS.throwClassCastException(obj, "java.lang.System$"))
});
ScalaJS.isArrayOf.jl_System$ = (function(obj, depth) {
  return (!(!(((obj && obj.$classData) && (obj.$classData.arrayDepth === depth)) && obj.$classData.arrayBase.ancestors.jl_System$)))
});
ScalaJS.asArrayOf.jl_System$ = (function(obj, depth) {
  return ((ScalaJS.isArrayOf.jl_System$(obj, depth) || (obj === null)) ? obj : ScalaJS.throwArrayCastException(obj, "Ljava.lang.System$;", depth))
});
ScalaJS.d.jl_System$ = new ScalaJS.ClassTypeData({
  jl_System$: 0
}, false, "java.lang.System$", ScalaJS.d.O, {
  jl_System$: 1,
  O: 1
});
ScalaJS.c.jl_System$.prototype.$classData = ScalaJS.d.jl_System$;
ScalaJS.n.jl_System = (void 0);
ScalaJS.m.jl_System = (function() {
  if ((!ScalaJS.n.jl_System)) {
    ScalaJS.n.jl_System = new ScalaJS.c.jl_System$().init___()
  };
  return ScalaJS.n.jl_System
});
/** @constructor */
ScalaJS.c.jl_ThreadLocal = (function() {
  ScalaJS.c.O.call(this);
  this.hasValue$1 = false;
  this.i$1 = null;
  this.v$1 = null;
  this.m$1 = null
});
ScalaJS.c.jl_ThreadLocal.prototype = new ScalaJS.h.O();
ScalaJS.c.jl_ThreadLocal.prototype.constructor = ScalaJS.c.jl_ThreadLocal;
/** @constructor */
ScalaJS.h.jl_ThreadLocal = (function() {
  /*<skip>*/
});
ScalaJS.h.jl_ThreadLocal.prototype = ScalaJS.c.jl_ThreadLocal.prototype;
ScalaJS.c.jl_ThreadLocal.prototype.init___ = (function() {
  this.hasValue$1 = false;
  this.m$1 = new ScalaJS.c.jl_ThreadLocal$ThreadLocalMap().init___();
  return this
});
ScalaJS.c.jl_ThreadLocal.prototype.get__O = (function() {
  if ((!this.hasValue$1)) {
    this.set__O__V(this.initialValue__O())
  };
  return this.v$1
});
ScalaJS.c.jl_ThreadLocal.prototype.set__O__V = (function(o) {
  this.v$1 = o;
  this.hasValue$1 = true
});
ScalaJS.is.jl_ThreadLocal = (function(obj) {
  return (!(!((obj && obj.$classData) && obj.$classData.ancestors.jl_ThreadLocal)))
});
ScalaJS.as.jl_ThreadLocal = (function(obj) {
  return ((ScalaJS.is.jl_ThreadLocal(obj) || (obj === null)) ? obj : ScalaJS.throwClassCastException(obj, "java.lang.ThreadLocal"))
});
ScalaJS.isArrayOf.jl_ThreadLocal = (function(obj, depth) {
  return (!(!(((obj && obj.$classData) && (obj.$classData.arrayDepth === depth)) && obj.$classData.arrayBase.ancestors.jl_ThreadLocal)))
});
ScalaJS.asArrayOf.jl_ThreadLocal = (function(obj, depth) {
  return ((ScalaJS.isArrayOf.jl_ThreadLocal(obj, depth) || (obj === null)) ? obj : ScalaJS.throwArrayCastException(obj, "Ljava.lang.ThreadLocal;", depth))
});
ScalaJS.d.jl_ThreadLocal = new ScalaJS.ClassTypeData({
  jl_ThreadLocal: 0
}, false, "java.lang.ThreadLocal", ScalaJS.d.O, {
  jl_ThreadLocal: 1,
  O: 1
});
ScalaJS.c.jl_ThreadLocal.prototype.$classData = ScalaJS.d.jl_ThreadLocal;
/** @constructor */
ScalaJS.c.jl_ThreadLocal$ThreadLocalMap = (function() {
  ScalaJS.c.O.call(this)
});
ScalaJS.c.jl_ThreadLocal$ThreadLocalMap.prototype = new ScalaJS.h.O();
ScalaJS.c.jl_ThreadLocal$ThreadLocalMap.prototype.constructor = ScalaJS.c.jl_ThreadLocal$ThreadLocalMap;
/** @constructor */
ScalaJS.h.jl_ThreadLocal$ThreadLocalMap = (function() {
  /*<skip>*/
});
ScalaJS.h.jl_ThreadLocal$ThreadLocalMap.prototype = ScalaJS.c.jl_ThreadLocal$ThreadLocalMap.prototype;
ScalaJS.is.jl_ThreadLocal$ThreadLocalMap = (function(obj) {
  return (!(!((obj && obj.$classData) && obj.$classData.ancestors.jl_ThreadLocal$ThreadLocalMap)))
});
ScalaJS.as.jl_ThreadLocal$ThreadLocalMap = (function(obj) {
  return ((ScalaJS.is.jl_ThreadLocal$ThreadLocalMap(obj) || (obj === null)) ? obj : ScalaJS.throwClassCastException(obj, "java.lang.ThreadLocal$ThreadLocalMap"))
});
ScalaJS.isArrayOf.jl_ThreadLocal$ThreadLocalMap = (function(obj, depth) {
  return (!(!(((obj && obj.$classData) && (obj.$classData.arrayDepth === depth)) && obj.$classData.arrayBase.ancestors.jl_ThreadLocal$ThreadLocalMap)))
});
ScalaJS.asArrayOf.jl_ThreadLocal$ThreadLocalMap = (function(obj, depth) {
  return ((ScalaJS.isArrayOf.jl_ThreadLocal$ThreadLocalMap(obj, depth) || (obj === null)) ? obj : ScalaJS.throwArrayCastException(obj, "Ljava.lang.ThreadLocal$ThreadLocalMap;", depth))
});
ScalaJS.d.jl_ThreadLocal$ThreadLocalMap = new ScalaJS.ClassTypeData({
  jl_ThreadLocal$ThreadLocalMap: 0
}, false, "java.lang.ThreadLocal$ThreadLocalMap", ScalaJS.d.O, {
  jl_ThreadLocal$ThreadLocalMap: 1,
  O: 1
});
ScalaJS.c.jl_ThreadLocal$ThreadLocalMap.prototype.$classData = ScalaJS.d.jl_ThreadLocal$ThreadLocalMap;
/** @constructor */
ScalaJS.c.jl_Throwable = (function() {
  ScalaJS.c.O.call(this);
  this.s$1 = null;
  this.e$1 = null;
  this.stackTrace$1 = null
});
ScalaJS.c.jl_Throwable.prototype = new ScalaJS.h.O();
ScalaJS.c.jl_Throwable.prototype.constructor = ScalaJS.c.jl_Throwable;
/** @constructor */
ScalaJS.h.jl_Throwable = (function() {
  /*<skip>*/
});
ScalaJS.h.jl_Throwable.prototype = ScalaJS.c.jl_Throwable.prototype;
ScalaJS.c.jl_Throwable.prototype.init___ = (function() {
  return (ScalaJS.c.jl_Throwable.prototype.init___T__jl_Throwable.call(this, null, null), this)
});
ScalaJS.c.jl_Throwable.prototype.fillInStackTrace__jl_Throwable = (function() {
  var this$1 = ScalaJS.m.sjsr_StackTrace();
  this$1.captureState__jl_Throwable__sjs_js_Any__V(this, this$1.createException__p1__sjs_js_Any());
  return this
});
ScalaJS.c.jl_Throwable.prototype.getMessage__T = (function() {
  return this.s$1
});
ScalaJS.c.jl_Throwable.prototype.toString__T = (function() {
  var className = ScalaJS.objectGetClass(this).getName__T();
  var message = this.getMessage__T();
  return ((message === null) ? className : ((className + ": ") + message))
});
ScalaJS.c.jl_Throwable.prototype.init___T__jl_Throwable = (function(s, e) {
  this.s$1 = s;
  this.e$1 = e;
  this.fillInStackTrace__jl_Throwable();
  return this
});
ScalaJS.is.jl_Throwable = (function(obj) {
  return (!(!((obj && obj.$classData) && obj.$classData.ancestors.jl_Throwable)))
});
ScalaJS.as.jl_Throwable = (function(obj) {
  return ((ScalaJS.is.jl_Throwable(obj) || (obj === null)) ? obj : ScalaJS.throwClassCastException(obj, "java.lang.Throwable"))
});
ScalaJS.isArrayOf.jl_Throwable = (function(obj, depth) {
  return (!(!(((obj && obj.$classData) && (obj.$classData.arrayDepth === depth)) && obj.$classData.arrayBase.ancestors.jl_Throwable)))
});
ScalaJS.asArrayOf.jl_Throwable = (function(obj, depth) {
  return ((ScalaJS.isArrayOf.jl_Throwable(obj, depth) || (obj === null)) ? obj : ScalaJS.throwArrayCastException(obj, "Ljava.lang.Throwable;", depth))
});
ScalaJS.d.jl_Throwable = new ScalaJS.ClassTypeData({
  jl_Throwable: 0
}, false, "java.lang.Throwable", ScalaJS.d.O, {
  jl_Throwable: 1,
  Ljava_io_Serializable: 1,
  O: 1
});
ScalaJS.c.jl_Throwable.prototype.$classData = ScalaJS.d.jl_Throwable;
/** @constructor */
ScalaJS.c.jl_reflect_Array$ = (function() {
  ScalaJS.c.O.call(this)
});
ScalaJS.c.jl_reflect_Array$.prototype = new ScalaJS.h.O();
ScalaJS.c.jl_reflect_Array$.prototype.constructor = ScalaJS.c.jl_reflect_Array$;
/** @constructor */
ScalaJS.h.jl_reflect_Array$ = (function() {
  /*<skip>*/
});
ScalaJS.h.jl_reflect_Array$.prototype = ScalaJS.c.jl_reflect_Array$.prototype;
ScalaJS.c.jl_reflect_Array$.prototype.newInstance__jl_Class__I__O = (function(componentType, length) {
  return componentType.newArrayOfThisClass__sjs_js_Array__O([length])
});
ScalaJS.is.jl_reflect_Array$ = (function(obj) {
  return (!(!((obj && obj.$classData) && obj.$classData.ancestors.jl_reflect_Array$)))
});
ScalaJS.as.jl_reflect_Array$ = (function(obj) {
  return ((ScalaJS.is.jl_reflect_Array$(obj) || (obj === null)) ? obj : ScalaJS.throwClassCastException(obj, "java.lang.reflect.Array$"))
});
ScalaJS.isArrayOf.jl_reflect_Array$ = (function(obj, depth) {
  return (!(!(((obj && obj.$classData) && (obj.$classData.arrayDepth === depth)) && obj.$classData.arrayBase.ancestors.jl_reflect_Array$)))
});
ScalaJS.asArrayOf.jl_reflect_Array$ = (function(obj, depth) {
  return ((ScalaJS.isArrayOf.jl_reflect_Array$(obj, depth) || (obj === null)) ? obj : ScalaJS.throwArrayCastException(obj, "Ljava.lang.reflect.Array$;", depth))
});
ScalaJS.d.jl_reflect_Array$ = new ScalaJS.ClassTypeData({
  jl_reflect_Array$: 0
}, false, "java.lang.reflect.Array$", ScalaJS.d.O, {
  jl_reflect_Array$: 1,
  O: 1
});
ScalaJS.c.jl_reflect_Array$.prototype.$classData = ScalaJS.d.jl_reflect_Array$;
ScalaJS.n.jl_reflect_Array = (void 0);
ScalaJS.m.jl_reflect_Array = (function() {
  if ((!ScalaJS.n.jl_reflect_Array)) {
    ScalaJS.n.jl_reflect_Array = new ScalaJS.c.jl_reflect_Array$().init___()
  };
  return ScalaJS.n.jl_reflect_Array
});
/** @constructor */
ScalaJS.c.ju_Arrays$ = (function() {
  ScalaJS.c.O.call(this)
});
ScalaJS.c.ju_Arrays$.prototype = new ScalaJS.h.O();
ScalaJS.c.ju_Arrays$.prototype.constructor = ScalaJS.c.ju_Arrays$;
/** @constructor */
ScalaJS.h.ju_Arrays$ = (function() {
  /*<skip>*/
});
ScalaJS.h.ju_Arrays$.prototype = ScalaJS.c.ju_Arrays$.prototype;
ScalaJS.c.ju_Arrays$.prototype.fill__AI__I__V = (function(a, value) {
  var i = 0;
  while ((i < a.u["length"])) {
    a.u[i] = value;
    i = ((i + 1) | 0)
  }
});
ScalaJS.is.ju_Arrays$ = (function(obj) {
  return (!(!((obj && obj.$classData) && obj.$classData.ancestors.ju_Arrays$)))
});
ScalaJS.as.ju_Arrays$ = (function(obj) {
  return ((ScalaJS.is.ju_Arrays$(obj) || (obj === null)) ? obj : ScalaJS.throwClassCastException(obj, "java.util.Arrays$"))
});
ScalaJS.isArrayOf.ju_Arrays$ = (function(obj, depth) {
  return (!(!(((obj && obj.$classData) && (obj.$classData.arrayDepth === depth)) && obj.$classData.arrayBase.ancestors.ju_Arrays$)))
});
ScalaJS.asArrayOf.ju_Arrays$ = (function(obj, depth) {
  return ((ScalaJS.isArrayOf.ju_Arrays$(obj, depth) || (obj === null)) ? obj : ScalaJS.throwArrayCastException(obj, "Ljava.util.Arrays$;", depth))
});
ScalaJS.d.ju_Arrays$ = new ScalaJS.ClassTypeData({
  ju_Arrays$: 0
}, false, "java.util.Arrays$", ScalaJS.d.O, {
  ju_Arrays$: 1,
  O: 1
});
ScalaJS.c.ju_Arrays$.prototype.$classData = ScalaJS.d.ju_Arrays$;
ScalaJS.n.ju_Arrays = (void 0);
ScalaJS.m.ju_Arrays = (function() {
  if ((!ScalaJS.n.ju_Arrays)) {
    ScalaJS.n.ju_Arrays = new ScalaJS.c.ju_Arrays$().init___()
  };
  return ScalaJS.n.ju_Arrays
});
ScalaJS.is.ju_Formattable = (function(obj) {
  return (!(!((obj && obj.$classData) && obj.$classData.ancestors.ju_Formattable)))
});
ScalaJS.as.ju_Formattable = (function(obj) {
  return ((ScalaJS.is.ju_Formattable(obj) || (obj === null)) ? obj : ScalaJS.throwClassCastException(obj, "java.util.Formattable"))
});
ScalaJS.isArrayOf.ju_Formattable = (function(obj, depth) {
  return (!(!(((obj && obj.$classData) && (obj.$classData.arrayDepth === depth)) && obj.$classData.arrayBase.ancestors.ju_Formattable)))
});
ScalaJS.asArrayOf.ju_Formattable = (function(obj, depth) {
  return ((ScalaJS.isArrayOf.ju_Formattable(obj, depth) || (obj === null)) ? obj : ScalaJS.throwArrayCastException(obj, "Ljava.util.Formattable;", depth))
});
ScalaJS.d.ju_Formattable = new ScalaJS.ClassTypeData({
  ju_Formattable: 0
}, true, "java.util.Formattable", (void 0), {
  ju_Formattable: 1,
  O: 1
});
/** @constructor */
ScalaJS.c.ju_Formatter = (function() {
  ScalaJS.c.O.call(this);
  this.dest$1 = null;
  this.closed$1 = false
});
ScalaJS.c.ju_Formatter.prototype = new ScalaJS.h.O();
ScalaJS.c.ju_Formatter.prototype.constructor = ScalaJS.c.ju_Formatter;
/** @constructor */
ScalaJS.h.ju_Formatter = (function() {
  /*<skip>*/
});
ScalaJS.h.ju_Formatter.prototype = ScalaJS.c.ju_Formatter.prototype;
ScalaJS.c.ju_Formatter.prototype.init___ = (function() {
  return (ScalaJS.c.ju_Formatter.prototype.init___jl_Appendable.call(this, new ScalaJS.c.jl_StringBuilder().init___()), this)
});
ScalaJS.c.ju_Formatter.prototype.pad$1__p1__T__T__jl_Boolean__T__I__C__jl_Appendable = (function(argStr, prefix, preventZero, flags$1, width$1, conversion$1) {
  var prePadLen = ((ScalaJS.i.sjsr_RuntimeString$class__length__sjsr_RuntimeString__I(argStr) + ScalaJS.i.sjsr_RuntimeString$class__length__sjsr_RuntimeString__I(prefix)) | 0);
  if ((width$1 <= prePadLen)) {
    var padStr = (("" + prefix) + argStr)
  } else {
    var padRight = this.hasFlag$1__p1__T__T__Z("-", flags$1);
    var padZero = (this.hasFlag$1__p1__T__T__Z("0", flags$1) && (!ScalaJS.m.s_Predef().Boolean2boolean__jl_Boolean__Z(preventZero)));
    var padLength = ((width$1 - prePadLen) | 0);
    var padChar = (padZero ? "0" : " ");
    var padding = this.strRepeat$1__p1__T__I__T(padChar, padLength);
    if ((padZero && padRight)) {
      var padStr;
      throw new ScalaJS.c.ju_IllegalFormatFlagsException().init___T(flags$1)
    } else {
      var padStr = (padRight ? ((("" + prefix) + argStr) + padding) : (padZero ? ((("" + prefix) + padding) + argStr) : ((("" + padding) + prefix) + argStr)))
    }
  };
  var casedStr = (ScalaJS.m.jl_Character().isUpperCase__C__Z(conversion$1) ? ScalaJS.i.sjsr_RuntimeString$class__toUpperCase__sjsr_RuntimeString__T(padStr) : padStr);
  return this.dest$1.append__jl_CharSequence__jl_Appendable(casedStr)
});
ScalaJS.c.ju_Formatter.prototype.toString__T = (function() {
  return ScalaJS.objectToString(this.out__jl_Appendable())
});
ScalaJS.c.ju_Formatter.prototype.init___jl_Appendable = (function(dest) {
  this.dest$1 = dest;
  this.closed$1 = false;
  return this
});
ScalaJS.c.ju_Formatter.prototype.padCaptureSign$1__p1__T__T__T__I__C__jl_Appendable = (function(argStr, prefix, flags$1, width$1, conversion$1) {
  var firstChar = ScalaJS.i.sjsr_RuntimeString$class__charAt__sjsr_RuntimeString__I__C(argStr, 0);
  return (((firstChar === 43) || (firstChar === 45)) ? this.pad$1__p1__T__T__jl_Boolean__T__I__C__jl_Appendable(ScalaJS.i.sjsr_RuntimeString$class__substring__sjsr_RuntimeString__I__T(argStr, 1), (("" + ScalaJS.bC(firstChar)) + prefix), false, flags$1, width$1, conversion$1) : this.pad$1__p1__T__T__jl_Boolean__T__I__C__jl_Appendable(argStr, prefix, false, flags$1, width$1, conversion$1))
});
ScalaJS.c.ju_Formatter.prototype.hasFlag$1__p1__T__T__Z = (function(flag, flags$1) {
  return (ScalaJS.i.sjsr_RuntimeString$class__indexOf__sjsr_RuntimeString__T__I(flags$1, flag) >= 0)
});
ScalaJS.c.ju_Formatter.prototype.out__jl_Appendable = (function() {
  return (this.closed$1 ? this.java$util$Formatter$$throwClosedException__sr_Nothing$() : this.dest$1)
});
ScalaJS.c.ju_Formatter.prototype.format__T__AO__ju_Formatter = (function(format_in, args) {
  if (this.closed$1) {
    this.java$util$Formatter$$throwClosedException__sr_Nothing$()
  } else {
    var fmt = format_in;
    var lastImplicitIndex = 0;
    var lastIndex = 0;
    while ((!ScalaJS.i.sjsr_RuntimeString$class__isEmpty__sjsr_RuntimeString__Z(fmt))) {
      var x1 = fmt;
      matchEnd9: {
        var o12 = ScalaJS.m.ju_Formatter().java$util$Formatter$$RegularChunk$1.unapply__T__s_Option(x1);
        if ((!o12.isEmpty__Z())) {
          var matchResult = o12.get__O();
          var jsx$2 = fmt;
          var $$this = matchResult[0];
          if (($$this === (void 0))) {
            var jsx$1;
            throw new ScalaJS.c.ju_NoSuchElementException().init___T("undefined.get")
          } else {
            var jsx$1 = $$this
          };
          fmt = ScalaJS.i.sjsr_RuntimeString$class__substring__sjsr_RuntimeString__I__T(jsx$2, ScalaJS.i.sjsr_RuntimeString$class__length__sjsr_RuntimeString__I(ScalaJS.as.T(jsx$1)));
          var $$this$1 = matchResult[0];
          if (($$this$1 === (void 0))) {
            var jsx$3;
            throw new ScalaJS.c.ju_NoSuchElementException().init___T("undefined.get")
          } else {
            var jsx$3 = $$this$1
          };
          this.dest$1.append__jl_CharSequence__jl_Appendable(ScalaJS.as.jl_CharSequence(jsx$3));
          break matchEnd9
        };
        var o14 = ScalaJS.m.ju_Formatter().java$util$Formatter$$DoublePercent$1.unapply__T__s_Option(x1);
        if ((!o14.isEmpty__Z())) {
          fmt = ScalaJS.i.sjsr_RuntimeString$class__substring__sjsr_RuntimeString__I__T(fmt, 2);
          this.dest$1.append__C__jl_Appendable(37);
          break matchEnd9
        };
        var o16 = ScalaJS.m.ju_Formatter().java$util$Formatter$$EOLChunk$1.unapply__T__s_Option(x1);
        if ((!o16.isEmpty__Z())) {
          fmt = ScalaJS.i.sjsr_RuntimeString$class__substring__sjsr_RuntimeString__I__T(fmt, 2);
          this.dest$1.append__C__jl_Appendable(10);
          break matchEnd9
        };
        var o18 = ScalaJS.m.ju_Formatter().java$util$Formatter$$FormattedChunk$1.unapply__T__s_Option(x1);
        if ((!o18.isEmpty__Z())) {
          var matchResult$2 = o18.get__O();
          var jsx$5 = fmt;
          var $$this$2 = matchResult$2[0];
          if (($$this$2 === (void 0))) {
            var jsx$4;
            throw new ScalaJS.c.ju_NoSuchElementException().init___T("undefined.get")
          } else {
            var jsx$4 = $$this$2
          };
          fmt = ScalaJS.i.sjsr_RuntimeString$class__substring__sjsr_RuntimeString__I__T(jsx$5, ScalaJS.i.sjsr_RuntimeString$class__length__sjsr_RuntimeString__I(ScalaJS.as.T(jsx$4)));
          var $$this$3 = matchResult$2[2];
          if (($$this$3 === (void 0))) {
            var jsx$6;
            throw new ScalaJS.c.ju_NoSuchElementException().init___T("undefined.get")
          } else {
            var jsx$6 = $$this$3
          };
          var flags = ScalaJS.as.T(jsx$6);
          var $$this$4 = matchResult$2[1];
          var indexStr = ScalaJS.as.T((($$this$4 === (void 0)) ? "" : $$this$4));
          if ((!ScalaJS.i.sjsr_RuntimeString$class__isEmpty__sjsr_RuntimeString__Z(indexStr))) {
            var this$11 = ScalaJS.m.jl_Integer();
            var index = this$11.parseInt__T__I__I(indexStr, 10)
          } else if (this.hasFlag$1__p1__T__T__Z("<", flags)) {
            var index = lastIndex
          } else {
            lastImplicitIndex = ((lastImplicitIndex + 1) | 0);
            var index = lastImplicitIndex
          };
          lastIndex = index;
          if (((index <= 0) || (index > args.u["length"]))) {
            var $$this$5 = matchResult$2[5];
            if (($$this$5 === (void 0))) {
              var jsx$7;
              throw new ScalaJS.c.ju_NoSuchElementException().init___T("undefined.get")
            } else {
              var jsx$7 = $$this$5
            };
            throw new ScalaJS.c.ju_MissingFormatArgumentException().init___T(ScalaJS.as.T(jsx$7))
          };
          var arg = args.u[((index - 1) | 0)];
          var $$this$6 = matchResult$2[3];
          var widthStr = ScalaJS.as.T((($$this$6 === (void 0)) ? "" : $$this$6));
          var hasWidth = (!ScalaJS.i.sjsr_RuntimeString$class__isEmpty__sjsr_RuntimeString__Z(widthStr));
          if (hasWidth) {
            var this$16 = ScalaJS.m.jl_Integer();
            var width = this$16.parseInt__T__I__I(widthStr, 10)
          } else {
            var width = 0
          };
          var $$this$7 = matchResult$2[4];
          var precisionStr = ScalaJS.as.T((($$this$7 === (void 0)) ? "" : $$this$7));
          var hasPrecision = (!ScalaJS.i.sjsr_RuntimeString$class__isEmpty__sjsr_RuntimeString__Z(precisionStr));
          if (hasPrecision) {
            var this$19 = ScalaJS.m.jl_Integer();
            var precision = this$19.parseInt__T__I__I(precisionStr, 10)
          } else {
            var precision = 0
          };
          var $$this$8 = matchResult$2[5];
          if (($$this$8 === (void 0))) {
            var jsx$8;
            throw new ScalaJS.c.ju_NoSuchElementException().init___T("undefined.get")
          } else {
            var jsx$8 = $$this$8
          };
          var conversion = ScalaJS.i.sjsr_RuntimeString$class__charAt__sjsr_RuntimeString__I__C(ScalaJS.as.T(jsx$8), 0);
          switch (conversion) {
            case 98:
              /*<skip>*/;
            case 66:
              {
                if ((null === arg)) {
                  var jsx$9 = "false"
                } else if ((typeof(arg) === "boolean")) {
                  var x3 = ScalaJS.asBoolean(arg);
                  var jsx$9 = ScalaJS.m.sjsr_RuntimeString().valueOf__O__T(x3)
                } else {
                  var jsx$9 = "true"
                };
                this.pad$1__p1__T__T__jl_Boolean__T__I__C__jl_Appendable(jsx$9, "", false, flags, width, conversion);
                break
              };
            case 104:
              /*<skip>*/;
            case 72:
              {
                if ((arg === null)) {
                  var jsx$10 = "null"
                } else {
                  var i = ScalaJS.objectHashCode(arg);
                  var jsx$10 = ScalaJS.as.T((i >>> 0)["toString"](16))
                };
                this.pad$1__p1__T__T__jl_Boolean__T__I__C__jl_Appendable(jsx$10, "", false, flags, width, conversion);
                break
              };
            case 115:
              /*<skip>*/;
            case 83:
              {
                matchEnd6: {
                  if ((null === arg)) {
                    if ((!this.hasFlag$1__p1__T__T__Z("#", flags))) {
                      this.pad$1__p1__T__T__jl_Boolean__T__I__C__jl_Appendable("null", "", false, flags, width, conversion);
                      break matchEnd6
                    }
                  };
                  if (ScalaJS.is.ju_Formattable(arg)) {
                    var x3$2 = ScalaJS.as.ju_Formattable(arg);
                    var flags$2 = (((this.hasFlag$1__p1__T__T__Z("-", flags) ? 1 : 0) | (this.hasFlag$1__p1__T__T__Z("#", flags) ? 4 : 0)) | (ScalaJS.m.jl_Character().isUpperCase__C__Z(conversion) ? 2 : 0));
                    x3$2.formatTo__ju_Formatter__I__I__I__V(this, flags$2, (hasWidth ? width : (-1)), (hasPrecision ? precision : (-1)));
                    ScalaJS.m.s_None();
                    break matchEnd6
                  };
                  if ((arg !== null)) {
                    if ((!this.hasFlag$1__p1__T__T__Z("#", flags))) {
                      this.pad$1__p1__T__T__jl_Boolean__T__I__C__jl_Appendable(ScalaJS.objectToString(arg), "", false, flags, width, conversion);
                      break matchEnd6
                    }
                  };
                  throw new ScalaJS.c.ju_FormatFlagsConversionMismatchException().init___T__C("#", 115)
                };
                break
              };
            case 99:
              /*<skip>*/;
            case 67:
              {
                this.pad$1__p1__T__T__jl_Boolean__T__I__C__jl_Appendable(ScalaJS.as.T(ScalaJS.g["String"]["fromCharCode"](this.intArg$1__p1__O__I(arg))), "", false, flags, width, conversion);
                break
              };
            case 100:
              {
                this.with$und$plus$1__p1__T__Z__T__I__C__jl_Appendable(ScalaJS.objectToString(this.numberArg$1__p1__O__D(arg)), false, flags, width, conversion);
                break
              };
            case 111:
              {
                if (ScalaJS.isInt(arg)) {
                  var x2 = ScalaJS.asInt(arg);
                  var i$1 = ScalaJS.m.s_Predef().Integer2int__jl_Integer__I(x2);
                  var str = ScalaJS.as.T((i$1 >>> 0)["toString"](8))
                } else if (ScalaJS.is.sjsr_RuntimeLong(arg)) {
                  var x3$3 = ScalaJS.as.sjsr_RuntimeLong(arg);
                  var l = ScalaJS.m.s_Predef().Long2long__jl_Long__J(x3$3);
                  var str = l.toOctalString__T()
                } else if ((typeof(arg) === "number")) {
                  var x4$2 = arg;
                  var str = ScalaJS.objectToString(x4$2["toString"](8.0))
                } else {
                  var str;
                  throw new ScalaJS.c.s_MatchError().init___O(arg)
                };
                this.padCaptureSign$1__p1__T__T__T__I__C__jl_Appendable(str, (this.hasFlag$1__p1__T__T__Z("#", flags) ? "0" : ""), flags, width, conversion);
                break
              };
            case 120:
              /*<skip>*/;
            case 88:
              {
                if (ScalaJS.isInt(arg)) {
                  var x2$2 = ScalaJS.asInt(arg);
                  var i$2 = ScalaJS.m.s_Predef().Integer2int__jl_Integer__I(x2$2);
                  var str$2 = ScalaJS.as.T((i$2 >>> 0)["toString"](16))
                } else if (ScalaJS.is.sjsr_RuntimeLong(arg)) {
                  var x3$4 = ScalaJS.as.sjsr_RuntimeLong(arg);
                  var l$1 = ScalaJS.m.s_Predef().Long2long__jl_Long__J(x3$4);
                  var str$2 = l$1.toHexString__T()
                } else if ((typeof(arg) === "number")) {
                  var x4$3 = arg;
                  var str$2 = ScalaJS.objectToString(x4$3["toString"](16.0))
                } else {
                  var str$2;
                  throw new ScalaJS.c.s_MatchError().init___O(arg)
                };
                this.padCaptureSign$1__p1__T__T__T__I__C__jl_Appendable(str$2, (this.hasFlag$1__p1__T__T__Z("#", flags) ? "0x" : ""), flags, width, conversion);
                break
              };
            case 101:
              /*<skip>*/;
            case 69:
              {
                this.sciNotation$1__p1__I__T__O__I__C__jl_Appendable((hasPrecision ? precision : 6), flags, arg, width, conversion);
                break
              };
            case 103:
              /*<skip>*/;
            case 71:
              {
                var m = ScalaJS.uD(ScalaJS.g["Math"]["abs"](this.numberArg$1__p1__O__D(arg)));
                var p = ((!hasPrecision) ? 6 : ((precision === 0) ? 1 : precision));
                if (((m >= 1.0E-4) && (m < ScalaJS.uD(ScalaJS.g["Math"]["pow"](10.0, p))))) {
                  var sig = ScalaJS.uD(ScalaJS.g["Math"]["ceil"]((ScalaJS.uD(ScalaJS.g["Math"]["log"](m)) / ScalaJS.uD(ScalaJS.g["Math"]["LN10"]))));
                  this.with$und$plus$1__p1__T__Z__T__I__C__jl_Appendable(ScalaJS.as.T(this.numberArg$1__p1__O__D(arg)["toFixed"](ScalaJS.uD(ScalaJS.g["Math"]["max"]((p - sig), 0.0)))), false, flags, width, conversion)
                } else {
                  this.sciNotation$1__p1__I__T__O__I__C__jl_Appendable(((p - 1) | 0), flags, arg, width, conversion)
                };
                break
              };
            case 102:
              {
                this.with$und$plus$1__p1__T__Z__T__I__C__jl_Appendable((hasPrecision ? ScalaJS.as.T(this.numberArg$1__p1__O__D(arg)["toFixed"](precision)) : ScalaJS.as.T(this.numberArg$1__p1__O__D(arg)["toFixed"](6.0))), (!ScalaJS.uZ(ScalaJS.g["isFinite"](this.numberArg$1__p1__O__D(arg)))), flags, width, conversion);
                break
              };
            default:
              throw new ScalaJS.c.s_MatchError().init___O(ScalaJS.bC(conversion));
          };
          break matchEnd9
        };
        throw new ScalaJS.c.s_MatchError().init___O(x1)
      }
    };
    return this
  }
});
ScalaJS.c.ju_Formatter.prototype.strRepeat$1__p1__T__I__T = (function(s, times) {
  var result = "";
  var i = times;
  while ((i > 0)) {
    result = (("" + result) + s);
    i = ((i - 1) | 0)
  };
  return result
});
ScalaJS.c.ju_Formatter.prototype.sciNotation$1__p1__I__T__O__I__C__jl_Appendable = (function(precision, flags$1, arg$1, width$1, conversion$1) {
  var exp = this.numberArg$1__p1__O__D(arg$1)["toExponential"](precision);
  return this.with$und$plus$1__p1__T__Z__T__I__C__jl_Appendable((("e" === exp["charAt"]((exp["length"] - 3.0))) ? ScalaJS.as.T(((exp["substring"](0.0, (exp["length"] - 1.0)) + "0") + exp["charAt"]((exp["length"] - 1.0)))) : ScalaJS.as.T(exp)), (!ScalaJS.uZ(ScalaJS.g["isFinite"](this.numberArg$1__p1__O__D(arg$1)))), flags$1, width$1, conversion$1)
});
ScalaJS.c.ju_Formatter.prototype.intArg$1__p1__O__I = (function(arg$1) {
  if (ScalaJS.isInt(arg$1)) {
    var x2 = ScalaJS.uI(arg$1);
    return x2
  } else if (ScalaJS.is.jl_Character(arg$1)) {
    var x3 = ScalaJS.uC(arg$1);
    return x3
  } else {
    throw new ScalaJS.c.s_MatchError().init___O(arg$1)
  }
});
ScalaJS.c.ju_Formatter.prototype.java$util$Formatter$$throwClosedException__sr_Nothing$ = (function() {
  throw new ScalaJS.c.ju_FormatterClosedException().init___()
});
ScalaJS.c.ju_Formatter.prototype.close__V = (function() {
  if ((!this.closed$1)) {
    var x1 = this.dest$1;
    if (ScalaJS.is.Ljava_io_Closeable(x1)) {
      ScalaJS.as.Ljava_io_Closeable(x1).close__V()
    }
  };
  this.closed$1 = true
});
ScalaJS.c.ju_Formatter.prototype.with$und$plus$1__p1__T__Z__T__I__C__jl_Appendable = (function(s, preventZero, flags$1, width$1, conversion$1) {
  return ((ScalaJS.i.sjsr_RuntimeString$class__charAt__sjsr_RuntimeString__I__C(s, 0) !== 45) ? (this.hasFlag$1__p1__T__T__Z("+", flags$1) ? this.pad$1__p1__T__T__jl_Boolean__T__I__C__jl_Appendable(s, "+", preventZero, flags$1, width$1, conversion$1) : (this.hasFlag$1__p1__T__T__Z(" ", flags$1) ? this.pad$1__p1__T__T__jl_Boolean__T__I__C__jl_Appendable(s, " ", preventZero, flags$1, width$1, conversion$1) : this.pad$1__p1__T__T__jl_Boolean__T__I__C__jl_Appendable(s, "", preventZero, flags$1, width$1, conversion$1))) : (this.hasFlag$1__p1__T__T__Z("(", flags$1) ? this.pad$1__p1__T__T__jl_Boolean__T__I__C__jl_Appendable((ScalaJS.i.sjsr_RuntimeString$class__substring__sjsr_RuntimeString__I__T(s, 1) + ")"), "(", preventZero, flags$1, width$1, conversion$1) : this.pad$1__p1__T__T__jl_Boolean__T__I__C__jl_Appendable(ScalaJS.i.sjsr_RuntimeString$class__substring__sjsr_RuntimeString__I__T(s, 1), "-", preventZero, flags$1, width$1, conversion$1)))
});
ScalaJS.c.ju_Formatter.prototype.numberArg$1__p1__O__D = (function(arg$1) {
  if (ScalaJS.is.jl_Number(arg$1)) {
    var x2 = ScalaJS.as.jl_Number(arg$1);
    return ScalaJS.numberDoubleValue(x2)
  } else if (ScalaJS.is.jl_Character(arg$1)) {
    var x3 = ScalaJS.uC(arg$1);
    return x3
  } else {
    throw new ScalaJS.c.s_MatchError().init___O(arg$1)
  }
});
ScalaJS.is.ju_Formatter = (function(obj) {
  return (!(!((obj && obj.$classData) && obj.$classData.ancestors.ju_Formatter)))
});
ScalaJS.as.ju_Formatter = (function(obj) {
  return ((ScalaJS.is.ju_Formatter(obj) || (obj === null)) ? obj : ScalaJS.throwClassCastException(obj, "java.util.Formatter"))
});
ScalaJS.isArrayOf.ju_Formatter = (function(obj, depth) {
  return (!(!(((obj && obj.$classData) && (obj.$classData.arrayDepth === depth)) && obj.$classData.arrayBase.ancestors.ju_Formatter)))
});
ScalaJS.asArrayOf.ju_Formatter = (function(obj, depth) {
  return ((ScalaJS.isArrayOf.ju_Formatter(obj, depth) || (obj === null)) ? obj : ScalaJS.throwArrayCastException(obj, "Ljava.util.Formatter;", depth))
});
ScalaJS.d.ju_Formatter = new ScalaJS.ClassTypeData({
  ju_Formatter: 0
}, false, "java.util.Formatter", ScalaJS.d.O, {
  ju_Formatter: 1,
  Ljava_io_Flushable: 1,
  Ljava_io_Closeable: 1,
  O: 1
});
ScalaJS.c.ju_Formatter.prototype.$classData = ScalaJS.d.ju_Formatter;
/** @constructor */
ScalaJS.c.ju_Formatter$ = (function() {
  ScalaJS.c.O.call(this);
  this.java$util$Formatter$$RegularChunk$1 = null;
  this.java$util$Formatter$$DoublePercent$1 = null;
  this.java$util$Formatter$$EOLChunk$1 = null;
  this.java$util$Formatter$$FormattedChunk$1 = null
});
ScalaJS.c.ju_Formatter$.prototype = new ScalaJS.h.O();
ScalaJS.c.ju_Formatter$.prototype.constructor = ScalaJS.c.ju_Formatter$;
/** @constructor */
ScalaJS.h.ju_Formatter$ = (function() {
  /*<skip>*/
});
ScalaJS.h.ju_Formatter$.prototype = ScalaJS.c.ju_Formatter$.prototype;
ScalaJS.c.ju_Formatter$.prototype.init___ = (function() {
  ScalaJS.n.ju_Formatter = this;
  this.java$util$Formatter$$RegularChunk$1 = new ScalaJS.c.ju_Formatter$RegExpExtractor().init___sjs_js_RegExp(new ScalaJS.g["RegExp"]("^[^\\x25]+"));
  this.java$util$Formatter$$DoublePercent$1 = new ScalaJS.c.ju_Formatter$RegExpExtractor().init___sjs_js_RegExp(new ScalaJS.g["RegExp"]("^\\x25{2}"));
  this.java$util$Formatter$$EOLChunk$1 = new ScalaJS.c.ju_Formatter$RegExpExtractor().init___sjs_js_RegExp(new ScalaJS.g["RegExp"]("^\\x25n"));
  this.java$util$Formatter$$FormattedChunk$1 = new ScalaJS.c.ju_Formatter$RegExpExtractor().init___sjs_js_RegExp(new ScalaJS.g["RegExp"]("^\\x25(?:([1-9]\\d*)\\$)?([-#+ 0,\\(<]*)(\\d*)(?:\\.(\\d+))?([A-Za-z])"));
  return this
});
ScalaJS.is.ju_Formatter$ = (function(obj) {
  return (!(!((obj && obj.$classData) && obj.$classData.ancestors.ju_Formatter$)))
});
ScalaJS.as.ju_Formatter$ = (function(obj) {
  return ((ScalaJS.is.ju_Formatter$(obj) || (obj === null)) ? obj : ScalaJS.throwClassCastException(obj, "java.util.Formatter$"))
});
ScalaJS.isArrayOf.ju_Formatter$ = (function(obj, depth) {
  return (!(!(((obj && obj.$classData) && (obj.$classData.arrayDepth === depth)) && obj.$classData.arrayBase.ancestors.ju_Formatter$)))
});
ScalaJS.asArrayOf.ju_Formatter$ = (function(obj, depth) {
  return ((ScalaJS.isArrayOf.ju_Formatter$(obj, depth) || (obj === null)) ? obj : ScalaJS.throwArrayCastException(obj, "Ljava.util.Formatter$;", depth))
});
ScalaJS.d.ju_Formatter$ = new ScalaJS.ClassTypeData({
  ju_Formatter$: 0
}, false, "java.util.Formatter$", ScalaJS.d.O, {
  ju_Formatter$: 1,
  O: 1
});
ScalaJS.c.ju_Formatter$.prototype.$classData = ScalaJS.d.ju_Formatter$;
ScalaJS.n.ju_Formatter = (void 0);
ScalaJS.m.ju_Formatter = (function() {
  if ((!ScalaJS.n.ju_Formatter)) {
    ScalaJS.n.ju_Formatter = new ScalaJS.c.ju_Formatter$().init___()
  };
  return ScalaJS.n.ju_Formatter
});
/** @constructor */
ScalaJS.c.ju_Formatter$RegExpExtractor = (function() {
  ScalaJS.c.O.call(this);
  this.regexp$1 = null
});
ScalaJS.c.ju_Formatter$RegExpExtractor.prototype = new ScalaJS.h.O();
ScalaJS.c.ju_Formatter$RegExpExtractor.prototype.constructor = ScalaJS.c.ju_Formatter$RegExpExtractor;
/** @constructor */
ScalaJS.h.ju_Formatter$RegExpExtractor = (function() {
  /*<skip>*/
});
ScalaJS.h.ju_Formatter$RegExpExtractor.prototype = ScalaJS.c.ju_Formatter$RegExpExtractor.prototype;
ScalaJS.c.ju_Formatter$RegExpExtractor.prototype.unapply__T__s_Option = (function(str) {
  return ScalaJS.m.s_Option().apply__O__s_Option(this.regexp$1["exec"](str))
});
ScalaJS.c.ju_Formatter$RegExpExtractor.prototype.init___sjs_js_RegExp = (function(regexp) {
  this.regexp$1 = regexp;
  return this
});
ScalaJS.is.ju_Formatter$RegExpExtractor = (function(obj) {
  return (!(!((obj && obj.$classData) && obj.$classData.ancestors.ju_Formatter$RegExpExtractor)))
});
ScalaJS.as.ju_Formatter$RegExpExtractor = (function(obj) {
  return ((ScalaJS.is.ju_Formatter$RegExpExtractor(obj) || (obj === null)) ? obj : ScalaJS.throwClassCastException(obj, "java.util.Formatter$RegExpExtractor"))
});
ScalaJS.isArrayOf.ju_Formatter$RegExpExtractor = (function(obj, depth) {
  return (!(!(((obj && obj.$classData) && (obj.$classData.arrayDepth === depth)) && obj.$classData.arrayBase.ancestors.ju_Formatter$RegExpExtractor)))
});
ScalaJS.asArrayOf.ju_Formatter$RegExpExtractor = (function(obj, depth) {
  return ((ScalaJS.isArrayOf.ju_Formatter$RegExpExtractor(obj, depth) || (obj === null)) ? obj : ScalaJS.throwArrayCastException(obj, "Ljava.util.Formatter$RegExpExtractor;", depth))
});
ScalaJS.d.ju_Formatter$RegExpExtractor = new ScalaJS.ClassTypeData({
  ju_Formatter$RegExpExtractor: 0
}, false, "java.util.Formatter$RegExpExtractor", ScalaJS.d.O, {
  ju_Formatter$RegExpExtractor: 1,
  O: 1
});
ScalaJS.c.ju_Formatter$RegExpExtractor.prototype.$classData = ScalaJS.d.ju_Formatter$RegExpExtractor;
/** @constructor */
ScalaJS.c.s_DeprecatedConsole = (function() {
  ScalaJS.c.O.call(this)
});
ScalaJS.c.s_DeprecatedConsole.prototype = new ScalaJS.h.O();
ScalaJS.c.s_DeprecatedConsole.prototype.constructor = ScalaJS.c.s_DeprecatedConsole;
/** @constructor */
ScalaJS.h.s_DeprecatedConsole = (function() {
  /*<skip>*/
});
ScalaJS.h.s_DeprecatedConsole.prototype = ScalaJS.c.s_DeprecatedConsole.prototype;
ScalaJS.is.s_DeprecatedConsole = (function(obj) {
  return (!(!((obj && obj.$classData) && obj.$classData.ancestors.s_DeprecatedConsole)))
});
ScalaJS.as.s_DeprecatedConsole = (function(obj) {
  return ((ScalaJS.is.s_DeprecatedConsole(obj) || (obj === null)) ? obj : ScalaJS.throwClassCastException(obj, "scala.DeprecatedConsole"))
});
ScalaJS.isArrayOf.s_DeprecatedConsole = (function(obj, depth) {
  return (!(!(((obj && obj.$classData) && (obj.$classData.arrayDepth === depth)) && obj.$classData.arrayBase.ancestors.s_DeprecatedConsole)))
});
ScalaJS.asArrayOf.s_DeprecatedConsole = (function(obj, depth) {
  return ((ScalaJS.isArrayOf.s_DeprecatedConsole(obj, depth) || (obj === null)) ? obj : ScalaJS.throwArrayCastException(obj, "Lscala.DeprecatedConsole;", depth))
});
ScalaJS.d.s_DeprecatedConsole = new ScalaJS.ClassTypeData({
  s_DeprecatedConsole: 0
}, false, "scala.DeprecatedConsole", ScalaJS.d.O, {
  s_DeprecatedConsole: 1,
  O: 1
});
ScalaJS.c.s_DeprecatedConsole.prototype.$classData = ScalaJS.d.s_DeprecatedConsole;
/** @constructor */
ScalaJS.c.s_FallbackArrayBuilding = (function() {
  ScalaJS.c.O.call(this)
});
ScalaJS.c.s_FallbackArrayBuilding.prototype = new ScalaJS.h.O();
ScalaJS.c.s_FallbackArrayBuilding.prototype.constructor = ScalaJS.c.s_FallbackArrayBuilding;
/** @constructor */
ScalaJS.h.s_FallbackArrayBuilding = (function() {
  /*<skip>*/
});
ScalaJS.h.s_FallbackArrayBuilding.prototype = ScalaJS.c.s_FallbackArrayBuilding.prototype;
ScalaJS.is.s_FallbackArrayBuilding = (function(obj) {
  return (!(!((obj && obj.$classData) && obj.$classData.ancestors.s_FallbackArrayBuilding)))
});
ScalaJS.as.s_FallbackArrayBuilding = (function(obj) {
  return ((ScalaJS.is.s_FallbackArrayBuilding(obj) || (obj === null)) ? obj : ScalaJS.throwClassCastException(obj, "scala.FallbackArrayBuilding"))
});
ScalaJS.isArrayOf.s_FallbackArrayBuilding = (function(obj, depth) {
  return (!(!(((obj && obj.$classData) && (obj.$classData.arrayDepth === depth)) && obj.$classData.arrayBase.ancestors.s_FallbackArrayBuilding)))
});
ScalaJS.asArrayOf.s_FallbackArrayBuilding = (function(obj, depth) {
  return ((ScalaJS.isArrayOf.s_FallbackArrayBuilding(obj, depth) || (obj === null)) ? obj : ScalaJS.throwArrayCastException(obj, "Lscala.FallbackArrayBuilding;", depth))
});
ScalaJS.d.s_FallbackArrayBuilding = new ScalaJS.ClassTypeData({
  s_FallbackArrayBuilding: 0
}, false, "scala.FallbackArrayBuilding", ScalaJS.d.O, {
  s_FallbackArrayBuilding: 1,
  O: 1
});
ScalaJS.c.s_FallbackArrayBuilding.prototype.$classData = ScalaJS.d.s_FallbackArrayBuilding;
/** @constructor */
ScalaJS.c.s_LowPriorityImplicits = (function() {
  ScalaJS.c.O.call(this)
});
ScalaJS.c.s_LowPriorityImplicits.prototype = new ScalaJS.h.O();
ScalaJS.c.s_LowPriorityImplicits.prototype.constructor = ScalaJS.c.s_LowPriorityImplicits;
/** @constructor */
ScalaJS.h.s_LowPriorityImplicits = (function() {
  /*<skip>*/
});
ScalaJS.h.s_LowPriorityImplicits.prototype = ScalaJS.c.s_LowPriorityImplicits.prototype;
ScalaJS.c.s_LowPriorityImplicits.prototype.wrapString__T__sci_WrappedString = (function(s) {
  return ((s !== null) ? new ScalaJS.c.sci_WrappedString().init___T(s) : null)
});
ScalaJS.is.s_LowPriorityImplicits = (function(obj) {
  return (!(!((obj && obj.$classData) && obj.$classData.ancestors.s_LowPriorityImplicits)))
});
ScalaJS.as.s_LowPriorityImplicits = (function(obj) {
  return ((ScalaJS.is.s_LowPriorityImplicits(obj) || (obj === null)) ? obj : ScalaJS.throwClassCastException(obj, "scala.LowPriorityImplicits"))
});
ScalaJS.isArrayOf.s_LowPriorityImplicits = (function(obj, depth) {
  return (!(!(((obj && obj.$classData) && (obj.$classData.arrayDepth === depth)) && obj.$classData.arrayBase.ancestors.s_LowPriorityImplicits)))
});
ScalaJS.asArrayOf.s_LowPriorityImplicits = (function(obj, depth) {
  return ((ScalaJS.isArrayOf.s_LowPriorityImplicits(obj, depth) || (obj === null)) ? obj : ScalaJS.throwArrayCastException(obj, "Lscala.LowPriorityImplicits;", depth))
});
ScalaJS.d.s_LowPriorityImplicits = new ScalaJS.ClassTypeData({
  s_LowPriorityImplicits: 0
}, false, "scala.LowPriorityImplicits", ScalaJS.d.O, {
  s_LowPriorityImplicits: 1,
  O: 1
});
ScalaJS.c.s_LowPriorityImplicits.prototype.$classData = ScalaJS.d.s_LowPriorityImplicits;
/** @constructor */
ScalaJS.c.s_Option = (function() {
  ScalaJS.c.O.call(this)
});
ScalaJS.c.s_Option.prototype = new ScalaJS.h.O();
ScalaJS.c.s_Option.prototype.constructor = ScalaJS.c.s_Option;
/** @constructor */
ScalaJS.h.s_Option = (function() {
  /*<skip>*/
});
ScalaJS.h.s_Option.prototype = ScalaJS.c.s_Option.prototype;
ScalaJS.c.s_Option.prototype.init___ = (function() {
  return this
});
ScalaJS.c.s_Option.prototype.isDefined__Z = (function() {
  return (!this.isEmpty__Z())
});
ScalaJS.is.s_Option = (function(obj) {
  return (!(!((obj && obj.$classData) && obj.$classData.ancestors.s_Option)))
});
ScalaJS.as.s_Option = (function(obj) {
  return ((ScalaJS.is.s_Option(obj) || (obj === null)) ? obj : ScalaJS.throwClassCastException(obj, "scala.Option"))
});
ScalaJS.isArrayOf.s_Option = (function(obj, depth) {
  return (!(!(((obj && obj.$classData) && (obj.$classData.arrayDepth === depth)) && obj.$classData.arrayBase.ancestors.s_Option)))
});
ScalaJS.asArrayOf.s_Option = (function(obj, depth) {
  return ((ScalaJS.isArrayOf.s_Option(obj, depth) || (obj === null)) ? obj : ScalaJS.throwArrayCastException(obj, "Lscala.Option;", depth))
});
ScalaJS.d.s_Option = new ScalaJS.ClassTypeData({
  s_Option: 0
}, false, "scala.Option", ScalaJS.d.O, {
  s_Option: 1,
  s_Serializable: 1,
  Ljava_io_Serializable: 1,
  s_Product: 1,
  s_Equals: 1,
  O: 1
});
ScalaJS.c.s_Option.prototype.$classData = ScalaJS.d.s_Option;
/** @constructor */
ScalaJS.c.s_Option$ = (function() {
  ScalaJS.c.O.call(this)
});
ScalaJS.c.s_Option$.prototype = new ScalaJS.h.O();
ScalaJS.c.s_Option$.prototype.constructor = ScalaJS.c.s_Option$;
/** @constructor */
ScalaJS.h.s_Option$ = (function() {
  /*<skip>*/
});
ScalaJS.h.s_Option$.prototype = ScalaJS.c.s_Option$.prototype;
ScalaJS.c.s_Option$.prototype.apply__O__s_Option = (function(x) {
  return ((x === null) ? ScalaJS.m.s_None() : new ScalaJS.c.s_Some().init___O(x))
});
ScalaJS.is.s_Option$ = (function(obj) {
  return (!(!((obj && obj.$classData) && obj.$classData.ancestors.s_Option$)))
});
ScalaJS.as.s_Option$ = (function(obj) {
  return ((ScalaJS.is.s_Option$(obj) || (obj === null)) ? obj : ScalaJS.throwClassCastException(obj, "scala.Option$"))
});
ScalaJS.isArrayOf.s_Option$ = (function(obj, depth) {
  return (!(!(((obj && obj.$classData) && (obj.$classData.arrayDepth === depth)) && obj.$classData.arrayBase.ancestors.s_Option$)))
});
ScalaJS.asArrayOf.s_Option$ = (function(obj, depth) {
  return ((ScalaJS.isArrayOf.s_Option$(obj, depth) || (obj === null)) ? obj : ScalaJS.throwArrayCastException(obj, "Lscala.Option$;", depth))
});
ScalaJS.d.s_Option$ = new ScalaJS.ClassTypeData({
  s_Option$: 0
}, false, "scala.Option$", ScalaJS.d.O, {
  s_Option$: 1,
  s_Serializable: 1,
  Ljava_io_Serializable: 1,
  O: 1
});
ScalaJS.c.s_Option$.prototype.$classData = ScalaJS.d.s_Option$;
ScalaJS.n.s_Option = (void 0);
ScalaJS.m.s_Option = (function() {
  if ((!ScalaJS.n.s_Option)) {
    ScalaJS.n.s_Option = new ScalaJS.c.s_Option$().init___()
  };
  return ScalaJS.n.s_Option
});
/** @constructor */
ScalaJS.c.s_Predef$$anon$3 = (function() {
  ScalaJS.c.O.call(this)
});
ScalaJS.c.s_Predef$$anon$3.prototype = new ScalaJS.h.O();
ScalaJS.c.s_Predef$$anon$3.prototype.constructor = ScalaJS.c.s_Predef$$anon$3;
/** @constructor */
ScalaJS.h.s_Predef$$anon$3 = (function() {
  /*<skip>*/
});
ScalaJS.h.s_Predef$$anon$3.prototype = ScalaJS.c.s_Predef$$anon$3.prototype;
ScalaJS.c.s_Predef$$anon$3.prototype.apply__scm_Builder = (function() {
  return new ScalaJS.c.scm_StringBuilder().init___()
});
ScalaJS.c.s_Predef$$anon$3.prototype.apply__O__scm_Builder = (function(from) {
  return (ScalaJS.as.T(from), new ScalaJS.c.scm_StringBuilder().init___())
});
ScalaJS.is.s_Predef$$anon$3 = (function(obj) {
  return (!(!((obj && obj.$classData) && obj.$classData.ancestors.s_Predef$$anon$3)))
});
ScalaJS.as.s_Predef$$anon$3 = (function(obj) {
  return ((ScalaJS.is.s_Predef$$anon$3(obj) || (obj === null)) ? obj : ScalaJS.throwClassCastException(obj, "scala.Predef$$anon$3"))
});
ScalaJS.isArrayOf.s_Predef$$anon$3 = (function(obj, depth) {
  return (!(!(((obj && obj.$classData) && (obj.$classData.arrayDepth === depth)) && obj.$classData.arrayBase.ancestors.s_Predef$$anon$3)))
});
ScalaJS.asArrayOf.s_Predef$$anon$3 = (function(obj, depth) {
  return ((ScalaJS.isArrayOf.s_Predef$$anon$3(obj, depth) || (obj === null)) ? obj : ScalaJS.throwArrayCastException(obj, "Lscala.Predef$$anon$3;", depth))
});
ScalaJS.d.s_Predef$$anon$3 = new ScalaJS.ClassTypeData({
  s_Predef$$anon$3: 0
}, false, "scala.Predef$$anon$3", ScalaJS.d.O, {
  s_Predef$$anon$3: 1,
  scg_CanBuildFrom: 1,
  O: 1
});
ScalaJS.c.s_Predef$$anon$3.prototype.$classData = ScalaJS.d.s_Predef$$anon$3;
/** @constructor */
ScalaJS.c.s_Predef$$eq$colon$eq = (function() {
  ScalaJS.c.O.call(this)
});
ScalaJS.c.s_Predef$$eq$colon$eq.prototype = new ScalaJS.h.O();
ScalaJS.c.s_Predef$$eq$colon$eq.prototype.constructor = ScalaJS.c.s_Predef$$eq$colon$eq;
/** @constructor */
ScalaJS.h.s_Predef$$eq$colon$eq = (function() {
  /*<skip>*/
});
ScalaJS.h.s_Predef$$eq$colon$eq.prototype = ScalaJS.c.s_Predef$$eq$colon$eq.prototype;
ScalaJS.c.s_Predef$$eq$colon$eq.prototype.init___ = (function() {
  return this
});
ScalaJS.c.s_Predef$$eq$colon$eq.prototype.toString__T = (function() {
  return "<function1>"
});
ScalaJS.is.s_Predef$$eq$colon$eq = (function(obj) {
  return (!(!((obj && obj.$classData) && obj.$classData.ancestors.s_Predef$$eq$colon$eq)))
});
ScalaJS.as.s_Predef$$eq$colon$eq = (function(obj) {
  return ((ScalaJS.is.s_Predef$$eq$colon$eq(obj) || (obj === null)) ? obj : ScalaJS.throwClassCastException(obj, "scala.Predef$$eq$colon$eq"))
});
ScalaJS.isArrayOf.s_Predef$$eq$colon$eq = (function(obj, depth) {
  return (!(!(((obj && obj.$classData) && (obj.$classData.arrayDepth === depth)) && obj.$classData.arrayBase.ancestors.s_Predef$$eq$colon$eq)))
});
ScalaJS.asArrayOf.s_Predef$$eq$colon$eq = (function(obj, depth) {
  return ((ScalaJS.isArrayOf.s_Predef$$eq$colon$eq(obj, depth) || (obj === null)) ? obj : ScalaJS.throwArrayCastException(obj, "Lscala.Predef$$eq$colon$eq;", depth))
});
ScalaJS.d.s_Predef$$eq$colon$eq = new ScalaJS.ClassTypeData({
  s_Predef$$eq$colon$eq: 0
}, false, "scala.Predef$$eq$colon$eq", ScalaJS.d.O, {
  s_Predef$$eq$colon$eq: 1,
  s_Serializable: 1,
  Ljava_io_Serializable: 1,
  F1: 1,
  O: 1
});
ScalaJS.c.s_Predef$$eq$colon$eq.prototype.$classData = ScalaJS.d.s_Predef$$eq$colon$eq;
/** @constructor */
ScalaJS.c.s_Predef$$less$colon$less = (function() {
  ScalaJS.c.O.call(this)
});
ScalaJS.c.s_Predef$$less$colon$less.prototype = new ScalaJS.h.O();
ScalaJS.c.s_Predef$$less$colon$less.prototype.constructor = ScalaJS.c.s_Predef$$less$colon$less;
/** @constructor */
ScalaJS.h.s_Predef$$less$colon$less = (function() {
  /*<skip>*/
});
ScalaJS.h.s_Predef$$less$colon$less.prototype = ScalaJS.c.s_Predef$$less$colon$less.prototype;
ScalaJS.c.s_Predef$$less$colon$less.prototype.init___ = (function() {
  return this
});
ScalaJS.c.s_Predef$$less$colon$less.prototype.toString__T = (function() {
  return "<function1>"
});
ScalaJS.is.s_Predef$$less$colon$less = (function(obj) {
  return (!(!((obj && obj.$classData) && obj.$classData.ancestors.s_Predef$$less$colon$less)))
});
ScalaJS.as.s_Predef$$less$colon$less = (function(obj) {
  return ((ScalaJS.is.s_Predef$$less$colon$less(obj) || (obj === null)) ? obj : ScalaJS.throwClassCastException(obj, "scala.Predef$$less$colon$less"))
});
ScalaJS.isArrayOf.s_Predef$$less$colon$less = (function(obj, depth) {
  return (!(!(((obj && obj.$classData) && (obj.$classData.arrayDepth === depth)) && obj.$classData.arrayBase.ancestors.s_Predef$$less$colon$less)))
});
ScalaJS.asArrayOf.s_Predef$$less$colon$less = (function(obj, depth) {
  return ((ScalaJS.isArrayOf.s_Predef$$less$colon$less(obj, depth) || (obj === null)) ? obj : ScalaJS.throwArrayCastException(obj, "Lscala.Predef$$less$colon$less;", depth))
});
ScalaJS.d.s_Predef$$less$colon$less = new ScalaJS.ClassTypeData({
  s_Predef$$less$colon$less: 0
}, false, "scala.Predef$$less$colon$less", ScalaJS.d.O, {
  s_Predef$$less$colon$less: 1,
  s_Serializable: 1,
  Ljava_io_Serializable: 1,
  F1: 1,
  O: 1
});
ScalaJS.c.s_Predef$$less$colon$less.prototype.$classData = ScalaJS.d.s_Predef$$less$colon$less;
/** @constructor */
ScalaJS.c.s_Predef$any2stringadd$ = (function() {
  ScalaJS.c.O.call(this)
});
ScalaJS.c.s_Predef$any2stringadd$.prototype = new ScalaJS.h.O();
ScalaJS.c.s_Predef$any2stringadd$.prototype.constructor = ScalaJS.c.s_Predef$any2stringadd$;
/** @constructor */
ScalaJS.h.s_Predef$any2stringadd$ = (function() {
  /*<skip>*/
});
ScalaJS.h.s_Predef$any2stringadd$.prototype = ScalaJS.c.s_Predef$any2stringadd$.prototype;
ScalaJS.c.s_Predef$any2stringadd$.prototype.$$plus$extension__O__T__T = (function($$this, other) {
  return (("" + ScalaJS.m.sjsr_RuntimeString().valueOf__O__T($$this)) + other)
});
ScalaJS.is.s_Predef$any2stringadd$ = (function(obj) {
  return (!(!((obj && obj.$classData) && obj.$classData.ancestors.s_Predef$any2stringadd$)))
});
ScalaJS.as.s_Predef$any2stringadd$ = (function(obj) {
  return ((ScalaJS.is.s_Predef$any2stringadd$(obj) || (obj === null)) ? obj : ScalaJS.throwClassCastException(obj, "scala.Predef$any2stringadd$"))
});
ScalaJS.isArrayOf.s_Predef$any2stringadd$ = (function(obj, depth) {
  return (!(!(((obj && obj.$classData) && (obj.$classData.arrayDepth === depth)) && obj.$classData.arrayBase.ancestors.s_Predef$any2stringadd$)))
});
ScalaJS.asArrayOf.s_Predef$any2stringadd$ = (function(obj, depth) {
  return ((ScalaJS.isArrayOf.s_Predef$any2stringadd$(obj, depth) || (obj === null)) ? obj : ScalaJS.throwArrayCastException(obj, "Lscala.Predef$any2stringadd$;", depth))
});
ScalaJS.d.s_Predef$any2stringadd$ = new ScalaJS.ClassTypeData({
  s_Predef$any2stringadd$: 0
}, false, "scala.Predef$any2stringadd$", ScalaJS.d.O, {
  s_Predef$any2stringadd$: 1,
  O: 1
});
ScalaJS.c.s_Predef$any2stringadd$.prototype.$classData = ScalaJS.d.s_Predef$any2stringadd$;
ScalaJS.n.s_Predef$any2stringadd = (void 0);
ScalaJS.m.s_Predef$any2stringadd = (function() {
  if ((!ScalaJS.n.s_Predef$any2stringadd)) {
    ScalaJS.n.s_Predef$any2stringadd = new ScalaJS.c.s_Predef$any2stringadd$().init___()
  };
  return ScalaJS.n.s_Predef$any2stringadd
});
/** @constructor */
ScalaJS.c.s_StringContext = (function() {
  ScalaJS.c.O.call(this);
  this.parts$1 = null
});
ScalaJS.c.s_StringContext.prototype = new ScalaJS.h.O();
ScalaJS.c.s_StringContext.prototype.constructor = ScalaJS.c.s_StringContext;
/** @constructor */
ScalaJS.h.s_StringContext = (function() {
  /*<skip>*/
});
ScalaJS.h.s_StringContext.prototype = ScalaJS.c.s_StringContext.prototype;
ScalaJS.c.s_StringContext.prototype.productPrefix__T = (function() {
  return "StringContext"
});
ScalaJS.c.s_StringContext.prototype.productArity__I = (function() {
  return 1
});
ScalaJS.c.s_StringContext.prototype.equals__O__Z = (function(x$1) {
  if ((this === x$1)) {
    return true
  } else if (ScalaJS.is.s_StringContext(x$1)) {
    var StringContext$1 = ScalaJS.as.s_StringContext(x$1);
    return ScalaJS.anyRefEqEq(this.parts$1, StringContext$1.parts$1)
  } else {
    return false
  }
});
ScalaJS.c.s_StringContext.prototype.productElement__I__O = (function(x$1) {
  switch (x$1) {
    case 0:
      {
        return this.parts$1;
        break
      };
    default:
      throw new ScalaJS.c.jl_IndexOutOfBoundsException().init___T(ScalaJS.objectToString(x$1));
  }
});
ScalaJS.c.s_StringContext.prototype.toString__T = (function() {
  return ScalaJS.m.sr_ScalaRunTime().$$undtoString__s_Product__T(this)
});
ScalaJS.c.s_StringContext.prototype.checkLengths__sc_Seq__V = (function(args) {
  if ((this.parts$1.length__I() !== ((args.length__I() + 1) | 0))) {
    throw new ScalaJS.c.jl_IllegalArgumentException().init___T((((("wrong number of arguments (" + args.length__I()) + ") for interpolated string with ") + this.parts$1.length__I()) + " parts"))
  }
});
ScalaJS.c.s_StringContext.prototype.s__sc_Seq__T = (function(args) {
  return this.standardInterpolator__F1__sc_Seq__T(new ScalaJS.c.sjsr_AnonFunction1().init___sjs_js_Function1((function(this$2) {
    return (function(str$2) {
      var str = ScalaJS.as.T(str$2);
      var this$1 = ScalaJS.m.s_StringContext();
      return this$1.treatEscapes0__p1__T__Z__T(str, false)
    })
  })(this)), args)
});
ScalaJS.c.s_StringContext.prototype.standardInterpolator__F1__sc_Seq__T = (function(process, args) {
  this.checkLengths__sc_Seq__V(args);
  var pi = this.parts$1.iterator__sc_Iterator();
  var ai = args.iterator__sc_Iterator();
  var bldr = new ScalaJS.c.jl_StringBuilder().init___T(ScalaJS.as.T(process.apply__O__O(pi.next__O())));
  while (ai.hasNext__Z()) {
    bldr.append__O__jl_StringBuilder(ai.next__O());
    bldr.append__T__jl_StringBuilder(ScalaJS.as.T(process.apply__O__O(pi.next__O())))
  };
  return bldr.content$1
});
ScalaJS.c.s_StringContext.prototype.init___sc_Seq = (function(parts) {
  this.parts$1 = parts;
  return this
});
ScalaJS.c.s_StringContext.prototype.hashCode__I = (function() {
  var this$2 = ScalaJS.m.s_util_hashing_MurmurHash3();
  return this$2.productHash__s_Product__I__I(this, (-889275714))
});
ScalaJS.c.s_StringContext.prototype.productIterator__sc_Iterator = (function() {
  return new ScalaJS.c.sr_ScalaRunTime$$anon$1().init___s_Product(this)
});
ScalaJS.is.s_StringContext = (function(obj) {
  return (!(!((obj && obj.$classData) && obj.$classData.ancestors.s_StringContext)))
});
ScalaJS.as.s_StringContext = (function(obj) {
  return ((ScalaJS.is.s_StringContext(obj) || (obj === null)) ? obj : ScalaJS.throwClassCastException(obj, "scala.StringContext"))
});
ScalaJS.isArrayOf.s_StringContext = (function(obj, depth) {
  return (!(!(((obj && obj.$classData) && (obj.$classData.arrayDepth === depth)) && obj.$classData.arrayBase.ancestors.s_StringContext)))
});
ScalaJS.asArrayOf.s_StringContext = (function(obj, depth) {
  return ((ScalaJS.isArrayOf.s_StringContext(obj, depth) || (obj === null)) ? obj : ScalaJS.throwArrayCastException(obj, "Lscala.StringContext;", depth))
});
ScalaJS.d.s_StringContext = new ScalaJS.ClassTypeData({
  s_StringContext: 0
}, false, "scala.StringContext", ScalaJS.d.O, {
  s_StringContext: 1,
  s_Serializable: 1,
  Ljava_io_Serializable: 1,
  s_Product: 1,
  s_Equals: 1,
  O: 1
});
ScalaJS.c.s_StringContext.prototype.$classData = ScalaJS.d.s_StringContext;
/** @constructor */
ScalaJS.c.s_StringContext$ = (function() {
  ScalaJS.c.O.call(this)
});
ScalaJS.c.s_StringContext$.prototype = new ScalaJS.h.O();
ScalaJS.c.s_StringContext$.prototype.constructor = ScalaJS.c.s_StringContext$;
/** @constructor */
ScalaJS.h.s_StringContext$ = (function() {
  /*<skip>*/
});
ScalaJS.h.s_StringContext$.prototype = ScalaJS.c.s_StringContext$.prototype;
ScalaJS.c.s_StringContext$.prototype.treatEscapes0__p1__T__Z__T = (function(str, strict) {
  var len = ScalaJS.i.sjsr_RuntimeString$class__length__sjsr_RuntimeString__I(str);
  var x1 = ScalaJS.i.sjsr_RuntimeString$class__indexOf__sjsr_RuntimeString__I__I(str, 92);
  switch (x1) {
    case (-1):
      {
        return str;
        break
      };
    default:
      return this.replace$1__p1__I__T__Z__I__T(x1, str, strict, len);
  }
});
ScalaJS.c.s_StringContext$.prototype.loop$1__p1__I__I__T__Z__I__jl_StringBuilder__T = (function(i, next, str$1, strict$1, len$1, b$1) {
  _loop: while (true) {
    if ((next >= 0)) {
      if ((next > i)) {
        b$1.append__jl_CharSequence__I__I__jl_StringBuilder(str$1, i, next)
      };
      var idx = ((next + 1) | 0);
      if ((idx >= len$1)) {
        throw new ScalaJS.c.s_StringContext$InvalidEscapeException().init___T__I(str$1, next)
      };
      var index = idx;
      var x1 = ScalaJS.i.sjsr_RuntimeString$class__charAt__sjsr_RuntimeString__I__C(str$1, index);
      switch (x1) {
        case 98:
          {
            var c = 8;
            break
          };
        case 116:
          {
            var c = 9;
            break
          };
        case 110:
          {
            var c = 10;
            break
          };
        case 102:
          {
            var c = 12;
            break
          };
        case 114:
          {
            var c = 13;
            break
          };
        case 34:
          {
            var c = 34;
            break
          };
        case 39:
          {
            var c = 39;
            break
          };
        case 92:
          {
            var c = 92;
            break
          };
        default:
          if (((48 <= x1) && (x1 <= 55))) {
            if (strict$1) {
              throw new ScalaJS.c.s_StringContext$InvalidEscapeException().init___T__I(str$1, next)
            };
            var index$1 = idx;
            var leadch = ScalaJS.i.sjsr_RuntimeString$class__charAt__sjsr_RuntimeString__I__C(str$1, index$1);
            var oct = ((leadch - 48) | 0);
            idx = ((idx + 1) | 0);
            if ((idx < len$1)) {
              var index$2 = idx;
              var jsx$2 = (48 <= ScalaJS.i.sjsr_RuntimeString$class__charAt__sjsr_RuntimeString__I__C(str$1, index$2))
            } else {
              var jsx$2 = false
            };
            if (jsx$2) {
              var index$3 = idx;
              var jsx$1 = (ScalaJS.i.sjsr_RuntimeString$class__charAt__sjsr_RuntimeString__I__C(str$1, index$3) <= 55)
            } else {
              var jsx$1 = false
            };
            if (jsx$1) {
              var jsx$3 = oct;
              var index$4 = idx;
              oct = ((((ScalaJS.imul(jsx$3, 8) + ScalaJS.i.sjsr_RuntimeString$class__charAt__sjsr_RuntimeString__I__C(str$1, index$4)) | 0) - 48) | 0);
              idx = ((idx + 1) | 0);
              if (((idx < len$1) && (leadch <= 51))) {
                var index$5 = idx;
                var jsx$5 = (48 <= ScalaJS.i.sjsr_RuntimeString$class__charAt__sjsr_RuntimeString__I__C(str$1, index$5))
              } else {
                var jsx$5 = false
              };
              if (jsx$5) {
                var index$6 = idx;
                var jsx$4 = (ScalaJS.i.sjsr_RuntimeString$class__charAt__sjsr_RuntimeString__I__C(str$1, index$6) <= 55)
              } else {
                var jsx$4 = false
              };
              if (jsx$4) {
                var jsx$6 = oct;
                var index$7 = idx;
                oct = ((((ScalaJS.imul(jsx$6, 8) + ScalaJS.i.sjsr_RuntimeString$class__charAt__sjsr_RuntimeString__I__C(str$1, index$7)) | 0) - 48) | 0);
                idx = ((idx + 1) | 0)
              }
            };
            idx = ((idx - 1) | 0);
            var c = (oct & 65535)
          } else {
            var c;
            throw new ScalaJS.c.s_StringContext$InvalidEscapeException().init___T__I(str$1, next)
          };
      };
      idx = ((idx + 1) | 0);
      b$1.append__C__jl_StringBuilder(c);
      var temp$i = idx;
      var temp$next = ScalaJS.i.sjsr_RuntimeString$class__indexOf__sjsr_RuntimeString__I__I__I(str$1, 92, idx);
      i = temp$i;
      next = temp$next;
      continue _loop
    } else {
      if ((i < len$1)) {
        b$1.append__jl_CharSequence__I__I__jl_StringBuilder(str$1, i, len$1)
      };
      return b$1.content$1
    }
  }
});
ScalaJS.c.s_StringContext$.prototype.replace$1__p1__I__T__Z__I__T = (function(first, str$1, strict$1, len$1) {
  var b = new ScalaJS.c.jl_StringBuilder().init___();
  return this.loop$1__p1__I__I__T__Z__I__jl_StringBuilder__T(0, first, str$1, strict$1, len$1, b)
});
ScalaJS.is.s_StringContext$ = (function(obj) {
  return (!(!((obj && obj.$classData) && obj.$classData.ancestors.s_StringContext$)))
});
ScalaJS.as.s_StringContext$ = (function(obj) {
  return ((ScalaJS.is.s_StringContext$(obj) || (obj === null)) ? obj : ScalaJS.throwClassCastException(obj, "scala.StringContext$"))
});
ScalaJS.isArrayOf.s_StringContext$ = (function(obj, depth) {
  return (!(!(((obj && obj.$classData) && (obj.$classData.arrayDepth === depth)) && obj.$classData.arrayBase.ancestors.s_StringContext$)))
});
ScalaJS.asArrayOf.s_StringContext$ = (function(obj, depth) {
  return ((ScalaJS.isArrayOf.s_StringContext$(obj, depth) || (obj === null)) ? obj : ScalaJS.throwArrayCastException(obj, "Lscala.StringContext$;", depth))
});
ScalaJS.d.s_StringContext$ = new ScalaJS.ClassTypeData({
  s_StringContext$: 0
}, false, "scala.StringContext$", ScalaJS.d.O, {
  s_StringContext$: 1,
  s_Serializable: 1,
  Ljava_io_Serializable: 1,
  O: 1
});
ScalaJS.c.s_StringContext$.prototype.$classData = ScalaJS.d.s_StringContext$;
ScalaJS.n.s_StringContext = (void 0);
ScalaJS.m.s_StringContext = (function() {
  if ((!ScalaJS.n.s_StringContext)) {
    ScalaJS.n.s_StringContext = new ScalaJS.c.s_StringContext$().init___()
  };
  return ScalaJS.n.s_StringContext
});
/** @constructor */
ScalaJS.c.s_Unit$ = (function() {
  ScalaJS.c.O.call(this)
});
ScalaJS.c.s_Unit$.prototype = new ScalaJS.h.O();
ScalaJS.c.s_Unit$.prototype.constructor = ScalaJS.c.s_Unit$;
/** @constructor */
ScalaJS.h.s_Unit$ = (function() {
  /*<skip>*/
});
ScalaJS.h.s_Unit$.prototype = ScalaJS.c.s_Unit$.prototype;
ScalaJS.c.s_Unit$.prototype.toString__T = (function() {
  return "object scala.Unit"
});
ScalaJS.is.s_Unit$ = (function(obj) {
  return (!(!((obj && obj.$classData) && obj.$classData.ancestors.s_Unit$)))
});
ScalaJS.as.s_Unit$ = (function(obj) {
  return ((ScalaJS.is.s_Unit$(obj) || (obj === null)) ? obj : ScalaJS.throwClassCastException(obj, "scala.Unit$"))
});
ScalaJS.isArrayOf.s_Unit$ = (function(obj, depth) {
  return (!(!(((obj && obj.$classData) && (obj.$classData.arrayDepth === depth)) && obj.$classData.arrayBase.ancestors.s_Unit$)))
});
ScalaJS.asArrayOf.s_Unit$ = (function(obj, depth) {
  return ((ScalaJS.isArrayOf.s_Unit$(obj, depth) || (obj === null)) ? obj : ScalaJS.throwArrayCastException(obj, "Lscala.Unit$;", depth))
});
ScalaJS.d.s_Unit$ = new ScalaJS.ClassTypeData({
  s_Unit$: 0
}, false, "scala.Unit$", ScalaJS.d.O, {
  s_Unit$: 1,
  s_AnyValCompanion: 1,
  s_Specializable: 1,
  O: 1
});
ScalaJS.c.s_Unit$.prototype.$classData = ScalaJS.d.s_Unit$;
ScalaJS.n.s_Unit = (void 0);
ScalaJS.m.s_Unit = (function() {
  if ((!ScalaJS.n.s_Unit)) {
    ScalaJS.n.s_Unit = new ScalaJS.c.s_Unit$().init___()
  };
  return ScalaJS.n.s_Unit
});
/** @constructor */
ScalaJS.c.s_concurrent_impl_AbstractPromise = (function() {
  ScalaJS.c.O.call(this);
  this.state$1 = null
});
ScalaJS.c.s_concurrent_impl_AbstractPromise.prototype = new ScalaJS.h.O();
ScalaJS.c.s_concurrent_impl_AbstractPromise.prototype.constructor = ScalaJS.c.s_concurrent_impl_AbstractPromise;
/** @constructor */
ScalaJS.h.s_concurrent_impl_AbstractPromise = (function() {
  /*<skip>*/
});
ScalaJS.h.s_concurrent_impl_AbstractPromise.prototype = ScalaJS.c.s_concurrent_impl_AbstractPromise.prototype;
ScalaJS.c.s_concurrent_impl_AbstractPromise.prototype.updateState__O__O__Z = (function(oldState, newState) {
  if ((this.state$1 === oldState)) {
    this.state$1 = newState;
    return true
  } else {
    return false
  }
});
ScalaJS.is.s_concurrent_impl_AbstractPromise = (function(obj) {
  return (!(!((obj && obj.$classData) && obj.$classData.ancestors.s_concurrent_impl_AbstractPromise)))
});
ScalaJS.as.s_concurrent_impl_AbstractPromise = (function(obj) {
  return ((ScalaJS.is.s_concurrent_impl_AbstractPromise(obj) || (obj === null)) ? obj : ScalaJS.throwClassCastException(obj, "scala.concurrent.impl.AbstractPromise"))
});
ScalaJS.isArrayOf.s_concurrent_impl_AbstractPromise = (function(obj, depth) {
  return (!(!(((obj && obj.$classData) && (obj.$classData.arrayDepth === depth)) && obj.$classData.arrayBase.ancestors.s_concurrent_impl_AbstractPromise)))
});
ScalaJS.asArrayOf.s_concurrent_impl_AbstractPromise = (function(obj, depth) {
  return ((ScalaJS.isArrayOf.s_concurrent_impl_AbstractPromise(obj, depth) || (obj === null)) ? obj : ScalaJS.throwArrayCastException(obj, "Lscala.concurrent.impl.AbstractPromise;", depth))
});
ScalaJS.d.s_concurrent_impl_AbstractPromise = new ScalaJS.ClassTypeData({
  s_concurrent_impl_AbstractPromise: 0
}, false, "scala.concurrent.impl.AbstractPromise", ScalaJS.d.O, {
  s_concurrent_impl_AbstractPromise: 1,
  O: 1
});
ScalaJS.c.s_concurrent_impl_AbstractPromise.prototype.$classData = ScalaJS.d.s_concurrent_impl_AbstractPromise;
/** @constructor */
ScalaJS.c.s_concurrent_impl_CallbackRunnable = (function() {
  ScalaJS.c.O.call(this);
  this.executor$1 = null;
  this.onComplete$1 = null;
  this.value$1 = null
});
ScalaJS.c.s_concurrent_impl_CallbackRunnable.prototype = new ScalaJS.h.O();
ScalaJS.c.s_concurrent_impl_CallbackRunnable.prototype.constructor = ScalaJS.c.s_concurrent_impl_CallbackRunnable;
/** @constructor */
ScalaJS.h.s_concurrent_impl_CallbackRunnable = (function() {
  /*<skip>*/
});
ScalaJS.h.s_concurrent_impl_CallbackRunnable.prototype = ScalaJS.c.s_concurrent_impl_CallbackRunnable.prototype;
ScalaJS.c.s_concurrent_impl_CallbackRunnable.prototype.run__V = (function() {
  ScalaJS.m.s_Predef().require__Z__V((this.value$1 !== null));
  try {
    this.onComplete$1.apply__O__O(this.value$1)
  } catch (ex) {
    ex = ScalaJS.wrapJavaScriptException(ex);
    if (ScalaJS.is.jl_Throwable(ex)) {
      var ex6 = ex;
      matchEnd8: {
        var o11 = ScalaJS.m.s_util_control_NonFatal().unapply__jl_Throwable__s_Option(ex6);
        if ((!o11.isEmpty__Z())) {
          var e = ScalaJS.as.jl_Throwable(o11.get__O());
          this.executor$1.reportFailure__jl_Throwable__V(e);
          (void 0);
          break matchEnd8
        };
        throw ScalaJS.unwrapJavaScriptException(ex6)
      }
    } else {
      throw ScalaJS.unwrapJavaScriptException(ex)
    }
  }
});
ScalaJS.c.s_concurrent_impl_CallbackRunnable.prototype.init___s_concurrent_ExecutionContext__F1 = (function(executor, onComplete) {
  this.executor$1 = executor;
  this.onComplete$1 = onComplete;
  this.value$1 = null;
  return this
});
ScalaJS.c.s_concurrent_impl_CallbackRunnable.prototype.executeWithValue__s_util_Try__V = (function(v) {
  ScalaJS.m.s_Predef().require__Z__V((this.value$1 === null));
  this.value$1 = v;
  try {
    this.executor$1.execute__jl_Runnable__V(this)
  } catch (ex) {
    ex = ScalaJS.wrapJavaScriptException(ex);
    if (ScalaJS.is.jl_Throwable(ex)) {
      var ex6 = ex;
      matchEnd8: {
        var o11 = ScalaJS.m.s_util_control_NonFatal().unapply__jl_Throwable__s_Option(ex6);
        if ((!o11.isEmpty__Z())) {
          var t = ScalaJS.as.jl_Throwable(o11.get__O());
          this.executor$1.reportFailure__jl_Throwable__V(t);
          (void 0);
          break matchEnd8
        };
        throw ScalaJS.unwrapJavaScriptException(ex6)
      }
    } else {
      throw ScalaJS.unwrapJavaScriptException(ex)
    }
  }
});
ScalaJS.is.s_concurrent_impl_CallbackRunnable = (function(obj) {
  return (!(!((obj && obj.$classData) && obj.$classData.ancestors.s_concurrent_impl_CallbackRunnable)))
});
ScalaJS.as.s_concurrent_impl_CallbackRunnable = (function(obj) {
  return ((ScalaJS.is.s_concurrent_impl_CallbackRunnable(obj) || (obj === null)) ? obj : ScalaJS.throwClassCastException(obj, "scala.concurrent.impl.CallbackRunnable"))
});
ScalaJS.isArrayOf.s_concurrent_impl_CallbackRunnable = (function(obj, depth) {
  return (!(!(((obj && obj.$classData) && (obj.$classData.arrayDepth === depth)) && obj.$classData.arrayBase.ancestors.s_concurrent_impl_CallbackRunnable)))
});
ScalaJS.asArrayOf.s_concurrent_impl_CallbackRunnable = (function(obj, depth) {
  return ((ScalaJS.isArrayOf.s_concurrent_impl_CallbackRunnable(obj, depth) || (obj === null)) ? obj : ScalaJS.throwArrayCastException(obj, "Lscala.concurrent.impl.CallbackRunnable;", depth))
});
ScalaJS.d.s_concurrent_impl_CallbackRunnable = new ScalaJS.ClassTypeData({
  s_concurrent_impl_CallbackRunnable: 0
}, false, "scala.concurrent.impl.CallbackRunnable", ScalaJS.d.O, {
  s_concurrent_impl_CallbackRunnable: 1,
  s_concurrent_OnCompleteRunnable: 1,
  jl_Runnable: 1,
  O: 1
});
ScalaJS.c.s_concurrent_impl_CallbackRunnable.prototype.$classData = ScalaJS.d.s_concurrent_impl_CallbackRunnable;
/** @constructor */
ScalaJS.c.s_concurrent_impl_Promise$ = (function() {
  ScalaJS.c.O.call(this)
});
ScalaJS.c.s_concurrent_impl_Promise$.prototype = new ScalaJS.h.O();
ScalaJS.c.s_concurrent_impl_Promise$.prototype.constructor = ScalaJS.c.s_concurrent_impl_Promise$;
/** @constructor */
ScalaJS.h.s_concurrent_impl_Promise$ = (function() {
  /*<skip>*/
});
ScalaJS.h.s_concurrent_impl_Promise$.prototype = ScalaJS.c.s_concurrent_impl_Promise$.prototype;
ScalaJS.c.s_concurrent_impl_Promise$.prototype.scala$concurrent$impl$Promise$$resolveTry__s_util_Try__s_util_Try = (function(source) {
  if (ScalaJS.is.s_util_Failure(source)) {
    var x2 = ScalaJS.as.s_util_Failure(source);
    var t = x2.exception$2;
    return this.resolver__p1__jl_Throwable__s_util_Try(t)
  } else {
    return source
  }
});
ScalaJS.c.s_concurrent_impl_Promise$.prototype.resolver__p1__jl_Throwable__s_util_Try = (function(throwable) {
  if (ScalaJS.is.sr_NonLocalReturnControl(throwable)) {
    var x2 = ScalaJS.as.sr_NonLocalReturnControl(throwable);
    return new ScalaJS.c.s_util_Success().init___O(x2.value$mcZ$sp$f)
  } else if (ScalaJS.is.s_util_control_ControlThrowable(throwable)) {
    var x3 = ScalaJS.as.s_util_control_ControlThrowable(throwable);
    return new ScalaJS.c.s_util_Failure().init___jl_Throwable(new ScalaJS.c.ju_concurrent_ExecutionException().init___T__jl_Throwable("Boxed ControlThrowable", ScalaJS.as.jl_Throwable(x3)))
  } else if (ScalaJS.is.jl_InterruptedException(throwable)) {
    var x4 = ScalaJS.as.jl_InterruptedException(throwable);
    return new ScalaJS.c.s_util_Failure().init___jl_Throwable(new ScalaJS.c.ju_concurrent_ExecutionException().init___T__jl_Throwable("Boxed InterruptedException", x4))
  } else if (ScalaJS.is.jl_Error(throwable)) {
    var x5 = ScalaJS.as.jl_Error(throwable);
    return new ScalaJS.c.s_util_Failure().init___jl_Throwable(new ScalaJS.c.ju_concurrent_ExecutionException().init___T__jl_Throwable("Boxed Error", x5))
  } else {
    return new ScalaJS.c.s_util_Failure().init___jl_Throwable(throwable)
  }
});
ScalaJS.is.s_concurrent_impl_Promise$ = (function(obj) {
  return (!(!((obj && obj.$classData) && obj.$classData.ancestors.s_concurrent_impl_Promise$)))
});
ScalaJS.as.s_concurrent_impl_Promise$ = (function(obj) {
  return ((ScalaJS.is.s_concurrent_impl_Promise$(obj) || (obj === null)) ? obj : ScalaJS.throwClassCastException(obj, "scala.concurrent.impl.Promise$"))
});
ScalaJS.isArrayOf.s_concurrent_impl_Promise$ = (function(obj, depth) {
  return (!(!(((obj && obj.$classData) && (obj.$classData.arrayDepth === depth)) && obj.$classData.arrayBase.ancestors.s_concurrent_impl_Promise$)))
});
ScalaJS.asArrayOf.s_concurrent_impl_Promise$ = (function(obj, depth) {
  return ((ScalaJS.isArrayOf.s_concurrent_impl_Promise$(obj, depth) || (obj === null)) ? obj : ScalaJS.throwArrayCastException(obj, "Lscala.concurrent.impl.Promise$;", depth))
});
ScalaJS.d.s_concurrent_impl_Promise$ = new ScalaJS.ClassTypeData({
  s_concurrent_impl_Promise$: 0
}, false, "scala.concurrent.impl.Promise$", ScalaJS.d.O, {
  s_concurrent_impl_Promise$: 1,
  O: 1
});
ScalaJS.c.s_concurrent_impl_Promise$.prototype.$classData = ScalaJS.d.s_concurrent_impl_Promise$;
ScalaJS.n.s_concurrent_impl_Promise = (void 0);
ScalaJS.m.s_concurrent_impl_Promise = (function() {
  if ((!ScalaJS.n.s_concurrent_impl_Promise)) {
    ScalaJS.n.s_concurrent_impl_Promise = new ScalaJS.c.s_concurrent_impl_Promise$().init___()
  };
  return ScalaJS.n.s_concurrent_impl_Promise
});
/** @constructor */
ScalaJS.c.s_math_Equiv$ = (function() {
  ScalaJS.c.O.call(this)
});
ScalaJS.c.s_math_Equiv$.prototype = new ScalaJS.h.O();
ScalaJS.c.s_math_Equiv$.prototype.constructor = ScalaJS.c.s_math_Equiv$;
/** @constructor */
ScalaJS.h.s_math_Equiv$ = (function() {
  /*<skip>*/
});
ScalaJS.h.s_math_Equiv$.prototype = ScalaJS.c.s_math_Equiv$.prototype;
ScalaJS.c.s_math_Equiv$.prototype.init___ = (function() {
  ScalaJS.n.s_math_Equiv = this;
  return this
});
ScalaJS.is.s_math_Equiv$ = (function(obj) {
  return (!(!((obj && obj.$classData) && obj.$classData.ancestors.s_math_Equiv$)))
});
ScalaJS.as.s_math_Equiv$ = (function(obj) {
  return ((ScalaJS.is.s_math_Equiv$(obj) || (obj === null)) ? obj : ScalaJS.throwClassCastException(obj, "scala.math.Equiv$"))
});
ScalaJS.isArrayOf.s_math_Equiv$ = (function(obj, depth) {
  return (!(!(((obj && obj.$classData) && (obj.$classData.arrayDepth === depth)) && obj.$classData.arrayBase.ancestors.s_math_Equiv$)))
});
ScalaJS.asArrayOf.s_math_Equiv$ = (function(obj, depth) {
  return ((ScalaJS.isArrayOf.s_math_Equiv$(obj, depth) || (obj === null)) ? obj : ScalaJS.throwArrayCastException(obj, "Lscala.math.Equiv$;", depth))
});
ScalaJS.d.s_math_Equiv$ = new ScalaJS.ClassTypeData({
  s_math_Equiv$: 0
}, false, "scala.math.Equiv$", ScalaJS.d.O, {
  s_math_Equiv$: 1,
  s_Serializable: 1,
  Ljava_io_Serializable: 1,
  s_math_LowPriorityEquiv: 1,
  O: 1
});
ScalaJS.c.s_math_Equiv$.prototype.$classData = ScalaJS.d.s_math_Equiv$;
ScalaJS.n.s_math_Equiv = (void 0);
ScalaJS.m.s_math_Equiv = (function() {
  if ((!ScalaJS.n.s_math_Equiv)) {
    ScalaJS.n.s_math_Equiv = new ScalaJS.c.s_math_Equiv$().init___()
  };
  return ScalaJS.n.s_math_Equiv
});
/** @constructor */
ScalaJS.c.s_math_Fractional$ = (function() {
  ScalaJS.c.O.call(this)
});
ScalaJS.c.s_math_Fractional$.prototype = new ScalaJS.h.O();
ScalaJS.c.s_math_Fractional$.prototype.constructor = ScalaJS.c.s_math_Fractional$;
/** @constructor */
ScalaJS.h.s_math_Fractional$ = (function() {
  /*<skip>*/
});
ScalaJS.h.s_math_Fractional$.prototype = ScalaJS.c.s_math_Fractional$.prototype;
ScalaJS.is.s_math_Fractional$ = (function(obj) {
  return (!(!((obj && obj.$classData) && obj.$classData.ancestors.s_math_Fractional$)))
});
ScalaJS.as.s_math_Fractional$ = (function(obj) {
  return ((ScalaJS.is.s_math_Fractional$(obj) || (obj === null)) ? obj : ScalaJS.throwClassCastException(obj, "scala.math.Fractional$"))
});
ScalaJS.isArrayOf.s_math_Fractional$ = (function(obj, depth) {
  return (!(!(((obj && obj.$classData) && (obj.$classData.arrayDepth === depth)) && obj.$classData.arrayBase.ancestors.s_math_Fractional$)))
});
ScalaJS.asArrayOf.s_math_Fractional$ = (function(obj, depth) {
  return ((ScalaJS.isArrayOf.s_math_Fractional$(obj, depth) || (obj === null)) ? obj : ScalaJS.throwArrayCastException(obj, "Lscala.math.Fractional$;", depth))
});
ScalaJS.d.s_math_Fractional$ = new ScalaJS.ClassTypeData({
  s_math_Fractional$: 0
}, false, "scala.math.Fractional$", ScalaJS.d.O, {
  s_math_Fractional$: 1,
  s_Serializable: 1,
  Ljava_io_Serializable: 1,
  O: 1
});
ScalaJS.c.s_math_Fractional$.prototype.$classData = ScalaJS.d.s_math_Fractional$;
ScalaJS.n.s_math_Fractional = (void 0);
ScalaJS.m.s_math_Fractional = (function() {
  if ((!ScalaJS.n.s_math_Fractional)) {
    ScalaJS.n.s_math_Fractional = new ScalaJS.c.s_math_Fractional$().init___()
  };
  return ScalaJS.n.s_math_Fractional
});
/** @constructor */
ScalaJS.c.s_math_Integral$ = (function() {
  ScalaJS.c.O.call(this)
});
ScalaJS.c.s_math_Integral$.prototype = new ScalaJS.h.O();
ScalaJS.c.s_math_Integral$.prototype.constructor = ScalaJS.c.s_math_Integral$;
/** @constructor */
ScalaJS.h.s_math_Integral$ = (function() {
  /*<skip>*/
});
ScalaJS.h.s_math_Integral$.prototype = ScalaJS.c.s_math_Integral$.prototype;
ScalaJS.is.s_math_Integral$ = (function(obj) {
  return (!(!((obj && obj.$classData) && obj.$classData.ancestors.s_math_Integral$)))
});
ScalaJS.as.s_math_Integral$ = (function(obj) {
  return ((ScalaJS.is.s_math_Integral$(obj) || (obj === null)) ? obj : ScalaJS.throwClassCastException(obj, "scala.math.Integral$"))
});
ScalaJS.isArrayOf.s_math_Integral$ = (function(obj, depth) {
  return (!(!(((obj && obj.$classData) && (obj.$classData.arrayDepth === depth)) && obj.$classData.arrayBase.ancestors.s_math_Integral$)))
});
ScalaJS.asArrayOf.s_math_Integral$ = (function(obj, depth) {
  return ((ScalaJS.isArrayOf.s_math_Integral$(obj, depth) || (obj === null)) ? obj : ScalaJS.throwArrayCastException(obj, "Lscala.math.Integral$;", depth))
});
ScalaJS.d.s_math_Integral$ = new ScalaJS.ClassTypeData({
  s_math_Integral$: 0
}, false, "scala.math.Integral$", ScalaJS.d.O, {
  s_math_Integral$: 1,
  s_Serializable: 1,
  Ljava_io_Serializable: 1,
  O: 1
});
ScalaJS.c.s_math_Integral$.prototype.$classData = ScalaJS.d.s_math_Integral$;
ScalaJS.n.s_math_Integral = (void 0);
ScalaJS.m.s_math_Integral = (function() {
  if ((!ScalaJS.n.s_math_Integral)) {
    ScalaJS.n.s_math_Integral = new ScalaJS.c.s_math_Integral$().init___()
  };
  return ScalaJS.n.s_math_Integral
});
/** @constructor */
ScalaJS.c.s_math_Numeric$ = (function() {
  ScalaJS.c.O.call(this)
});
ScalaJS.c.s_math_Numeric$.prototype = new ScalaJS.h.O();
ScalaJS.c.s_math_Numeric$.prototype.constructor = ScalaJS.c.s_math_Numeric$;
/** @constructor */
ScalaJS.h.s_math_Numeric$ = (function() {
  /*<skip>*/
});
ScalaJS.h.s_math_Numeric$.prototype = ScalaJS.c.s_math_Numeric$.prototype;
ScalaJS.is.s_math_Numeric$ = (function(obj) {
  return (!(!((obj && obj.$classData) && obj.$classData.ancestors.s_math_Numeric$)))
});
ScalaJS.as.s_math_Numeric$ = (function(obj) {
  return ((ScalaJS.is.s_math_Numeric$(obj) || (obj === null)) ? obj : ScalaJS.throwClassCastException(obj, "scala.math.Numeric$"))
});
ScalaJS.isArrayOf.s_math_Numeric$ = (function(obj, depth) {
  return (!(!(((obj && obj.$classData) && (obj.$classData.arrayDepth === depth)) && obj.$classData.arrayBase.ancestors.s_math_Numeric$)))
});
ScalaJS.asArrayOf.s_math_Numeric$ = (function(obj, depth) {
  return ((ScalaJS.isArrayOf.s_math_Numeric$(obj, depth) || (obj === null)) ? obj : ScalaJS.throwArrayCastException(obj, "Lscala.math.Numeric$;", depth))
});
ScalaJS.d.s_math_Numeric$ = new ScalaJS.ClassTypeData({
  s_math_Numeric$: 0
}, false, "scala.math.Numeric$", ScalaJS.d.O, {
  s_math_Numeric$: 1,
  s_Serializable: 1,
  Ljava_io_Serializable: 1,
  O: 1
});
ScalaJS.c.s_math_Numeric$.prototype.$classData = ScalaJS.d.s_math_Numeric$;
ScalaJS.n.s_math_Numeric = (void 0);
ScalaJS.m.s_math_Numeric = (function() {
  if ((!ScalaJS.n.s_math_Numeric)) {
    ScalaJS.n.s_math_Numeric = new ScalaJS.c.s_math_Numeric$().init___()
  };
  return ScalaJS.n.s_math_Numeric
});
/** @constructor */
ScalaJS.c.s_math_Ordered$ = (function() {
  ScalaJS.c.O.call(this)
});
ScalaJS.c.s_math_Ordered$.prototype = new ScalaJS.h.O();
ScalaJS.c.s_math_Ordered$.prototype.constructor = ScalaJS.c.s_math_Ordered$;
/** @constructor */
ScalaJS.h.s_math_Ordered$ = (function() {
  /*<skip>*/
});
ScalaJS.h.s_math_Ordered$.prototype = ScalaJS.c.s_math_Ordered$.prototype;
ScalaJS.is.s_math_Ordered$ = (function(obj) {
  return (!(!((obj && obj.$classData) && obj.$classData.ancestors.s_math_Ordered$)))
});
ScalaJS.as.s_math_Ordered$ = (function(obj) {
  return ((ScalaJS.is.s_math_Ordered$(obj) || (obj === null)) ? obj : ScalaJS.throwClassCastException(obj, "scala.math.Ordered$"))
});
ScalaJS.isArrayOf.s_math_Ordered$ = (function(obj, depth) {
  return (!(!(((obj && obj.$classData) && (obj.$classData.arrayDepth === depth)) && obj.$classData.arrayBase.ancestors.s_math_Ordered$)))
});
ScalaJS.asArrayOf.s_math_Ordered$ = (function(obj, depth) {
  return ((ScalaJS.isArrayOf.s_math_Ordered$(obj, depth) || (obj === null)) ? obj : ScalaJS.throwArrayCastException(obj, "Lscala.math.Ordered$;", depth))
});
ScalaJS.d.s_math_Ordered$ = new ScalaJS.ClassTypeData({
  s_math_Ordered$: 0
}, false, "scala.math.Ordered$", ScalaJS.d.O, {
  s_math_Ordered$: 1,
  O: 1
});
ScalaJS.c.s_math_Ordered$.prototype.$classData = ScalaJS.d.s_math_Ordered$;
ScalaJS.n.s_math_Ordered = (void 0);
ScalaJS.m.s_math_Ordered = (function() {
  if ((!ScalaJS.n.s_math_Ordered)) {
    ScalaJS.n.s_math_Ordered = new ScalaJS.c.s_math_Ordered$().init___()
  };
  return ScalaJS.n.s_math_Ordered
});
/** @constructor */
ScalaJS.c.s_math_Ordering$ = (function() {
  ScalaJS.c.O.call(this)
});
ScalaJS.c.s_math_Ordering$.prototype = new ScalaJS.h.O();
ScalaJS.c.s_math_Ordering$.prototype.constructor = ScalaJS.c.s_math_Ordering$;
/** @constructor */
ScalaJS.h.s_math_Ordering$ = (function() {
  /*<skip>*/
});
ScalaJS.h.s_math_Ordering$.prototype = ScalaJS.c.s_math_Ordering$.prototype;
ScalaJS.c.s_math_Ordering$.prototype.init___ = (function() {
  ScalaJS.n.s_math_Ordering = this;
  return this
});
ScalaJS.is.s_math_Ordering$ = (function(obj) {
  return (!(!((obj && obj.$classData) && obj.$classData.ancestors.s_math_Ordering$)))
});
ScalaJS.as.s_math_Ordering$ = (function(obj) {
  return ((ScalaJS.is.s_math_Ordering$(obj) || (obj === null)) ? obj : ScalaJS.throwClassCastException(obj, "scala.math.Ordering$"))
});
ScalaJS.isArrayOf.s_math_Ordering$ = (function(obj, depth) {
  return (!(!(((obj && obj.$classData) && (obj.$classData.arrayDepth === depth)) && obj.$classData.arrayBase.ancestors.s_math_Ordering$)))
});
ScalaJS.asArrayOf.s_math_Ordering$ = (function(obj, depth) {
  return ((ScalaJS.isArrayOf.s_math_Ordering$(obj, depth) || (obj === null)) ? obj : ScalaJS.throwArrayCastException(obj, "Lscala.math.Ordering$;", depth))
});
ScalaJS.d.s_math_Ordering$ = new ScalaJS.ClassTypeData({
  s_math_Ordering$: 0
}, false, "scala.math.Ordering$", ScalaJS.d.O, {
  s_math_Ordering$: 1,
  s_Serializable: 1,
  Ljava_io_Serializable: 1,
  s_math_LowPriorityOrderingImplicits: 1,
  O: 1
});
ScalaJS.c.s_math_Ordering$.prototype.$classData = ScalaJS.d.s_math_Ordering$;
ScalaJS.n.s_math_Ordering = (void 0);
ScalaJS.m.s_math_Ordering = (function() {
  if ((!ScalaJS.n.s_math_Ordering)) {
    ScalaJS.n.s_math_Ordering = new ScalaJS.c.s_math_Ordering$().init___()
  };
  return ScalaJS.n.s_math_Ordering
});
/** @constructor */
ScalaJS.c.s_package$ = (function() {
  ScalaJS.c.O.call(this);
  this.AnyRef$1 = null;
  this.Traversable$1 = null;
  this.Iterable$1 = null;
  this.Seq$1 = null;
  this.IndexedSeq$1 = null;
  this.Iterator$1 = null;
  this.List$1 = null;
  this.Nil$1 = null;
  this.$$colon$colon$1 = null;
  this.$$plus$colon$1 = null;
  this.$$colon$plus$1 = null;
  this.Stream$1 = null;
  this.$$hash$colon$colon$1 = null;
  this.Vector$1 = null;
  this.StringBuilder$1 = null;
  this.Range$1 = null;
  this.BigDecimal$1 = null;
  this.BigInt$1 = null;
  this.Equiv$1 = null;
  this.Fractional$1 = null;
  this.Integral$1 = null;
  this.Numeric$1 = null;
  this.Ordered$1 = null;
  this.Ordering$1 = null;
  this.Either$1 = null;
  this.Left$1 = null;
  this.Right$1 = null;
  this.bitmap$0$1 = 0
});
ScalaJS.c.s_package$.prototype = new ScalaJS.h.O();
ScalaJS.c.s_package$.prototype.constructor = ScalaJS.c.s_package$;
/** @constructor */
ScalaJS.h.s_package$ = (function() {
  /*<skip>*/
});
ScalaJS.h.s_package$.prototype = ScalaJS.c.s_package$.prototype;
ScalaJS.c.s_package$.prototype.init___ = (function() {
  ScalaJS.n.s_package = this;
  this.AnyRef$1 = new ScalaJS.c.s_package$$anon$1().init___();
  this.Traversable$1 = ScalaJS.m.sc_Traversable();
  this.Iterable$1 = ScalaJS.m.sc_Iterable();
  this.Seq$1 = ScalaJS.m.sc_Seq();
  this.IndexedSeq$1 = ScalaJS.m.sc_IndexedSeq();
  this.Iterator$1 = ScalaJS.m.sc_Iterator();
  this.List$1 = ScalaJS.m.sci_List();
  this.Nil$1 = ScalaJS.m.sci_Nil();
  this.$$colon$colon$1 = ScalaJS.m.sci_$colon$colon();
  this.$$plus$colon$1 = ScalaJS.m.sc_$plus$colon();
  this.$$colon$plus$1 = ScalaJS.m.sc_$colon$plus();
  this.Stream$1 = ScalaJS.m.sci_Stream();
  this.$$hash$colon$colon$1 = ScalaJS.m.sci_Stream$$hash$colon$colon();
  this.Vector$1 = ScalaJS.m.sci_Vector();
  this.StringBuilder$1 = ScalaJS.m.scm_StringBuilder();
  this.Range$1 = ScalaJS.m.sci_Range();
  this.Equiv$1 = ScalaJS.m.s_math_Equiv();
  this.Fractional$1 = ScalaJS.m.s_math_Fractional();
  this.Integral$1 = ScalaJS.m.s_math_Integral();
  this.Numeric$1 = ScalaJS.m.s_math_Numeric();
  this.Ordered$1 = ScalaJS.m.s_math_Ordered();
  this.Ordering$1 = ScalaJS.m.s_math_Ordering();
  this.Either$1 = ScalaJS.m.s_util_Either();
  this.Left$1 = ScalaJS.m.s_util_Left();
  this.Right$1 = ScalaJS.m.s_util_Right();
  return this
});
ScalaJS.is.s_package$ = (function(obj) {
  return (!(!((obj && obj.$classData) && obj.$classData.ancestors.s_package$)))
});
ScalaJS.as.s_package$ = (function(obj) {
  return ((ScalaJS.is.s_package$(obj) || (obj === null)) ? obj : ScalaJS.throwClassCastException(obj, "scala.package$"))
});
ScalaJS.isArrayOf.s_package$ = (function(obj, depth) {
  return (!(!(((obj && obj.$classData) && (obj.$classData.arrayDepth === depth)) && obj.$classData.arrayBase.ancestors.s_package$)))
});
ScalaJS.asArrayOf.s_package$ = (function(obj, depth) {
  return ((ScalaJS.isArrayOf.s_package$(obj, depth) || (obj === null)) ? obj : ScalaJS.throwArrayCastException(obj, "Lscala.package$;", depth))
});
ScalaJS.d.s_package$ = new ScalaJS.ClassTypeData({
  s_package$: 0
}, false, "scala.package$", ScalaJS.d.O, {
  s_package$: 1,
  O: 1
});
ScalaJS.c.s_package$.prototype.$classData = ScalaJS.d.s_package$;
ScalaJS.n.s_package = (void 0);
ScalaJS.m.s_package = (function() {
  if ((!ScalaJS.n.s_package)) {
    ScalaJS.n.s_package = new ScalaJS.c.s_package$().init___()
  };
  return ScalaJS.n.s_package
});
/** @constructor */
ScalaJS.c.s_package$$anon$1 = (function() {
  ScalaJS.c.O.call(this)
});
ScalaJS.c.s_package$$anon$1.prototype = new ScalaJS.h.O();
ScalaJS.c.s_package$$anon$1.prototype.constructor = ScalaJS.c.s_package$$anon$1;
/** @constructor */
ScalaJS.h.s_package$$anon$1 = (function() {
  /*<skip>*/
});
ScalaJS.h.s_package$$anon$1.prototype = ScalaJS.c.s_package$$anon$1.prototype;
ScalaJS.c.s_package$$anon$1.prototype.toString__T = (function() {
  return "object AnyRef"
});
ScalaJS.is.s_package$$anon$1 = (function(obj) {
  return (!(!((obj && obj.$classData) && obj.$classData.ancestors.s_package$$anon$1)))
});
ScalaJS.as.s_package$$anon$1 = (function(obj) {
  return ((ScalaJS.is.s_package$$anon$1(obj) || (obj === null)) ? obj : ScalaJS.throwClassCastException(obj, "scala.package$$anon$1"))
});
ScalaJS.isArrayOf.s_package$$anon$1 = (function(obj, depth) {
  return (!(!(((obj && obj.$classData) && (obj.$classData.arrayDepth === depth)) && obj.$classData.arrayBase.ancestors.s_package$$anon$1)))
});
ScalaJS.asArrayOf.s_package$$anon$1 = (function(obj, depth) {
  return ((ScalaJS.isArrayOf.s_package$$anon$1(obj, depth) || (obj === null)) ? obj : ScalaJS.throwArrayCastException(obj, "Lscala.package$$anon$1;", depth))
});
ScalaJS.d.s_package$$anon$1 = new ScalaJS.ClassTypeData({
  s_package$$anon$1: 0
}, false, "scala.package$$anon$1", ScalaJS.d.O, {
  s_package$$anon$1: 1,
  s_Specializable: 1,
  O: 1
});
ScalaJS.c.s_package$$anon$1.prototype.$classData = ScalaJS.d.s_package$$anon$1;
/** @constructor */
ScalaJS.c.s_reflect_AnyValManifest = (function() {
  ScalaJS.c.O.call(this);
  this.toString$1 = null;
  this.hashCode$1 = 0
});
ScalaJS.c.s_reflect_AnyValManifest.prototype = new ScalaJS.h.O();
ScalaJS.c.s_reflect_AnyValManifest.prototype.constructor = ScalaJS.c.s_reflect_AnyValManifest;
/** @constructor */
ScalaJS.h.s_reflect_AnyValManifest = (function() {
  /*<skip>*/
});
ScalaJS.h.s_reflect_AnyValManifest.prototype = ScalaJS.c.s_reflect_AnyValManifest.prototype;
ScalaJS.c.s_reflect_AnyValManifest.prototype.equals__O__Z = (function(that) {
  return (this === that)
});
ScalaJS.c.s_reflect_AnyValManifest.prototype.toString__T = (function() {
  return this.toString$1
});
ScalaJS.c.s_reflect_AnyValManifest.prototype.init___T = (function(toString) {
  this.toString$1 = toString;
  this.hashCode$1 = ScalaJS.m.jl_System().identityHashCode__O__I(this);
  return this
});
ScalaJS.c.s_reflect_AnyValManifest.prototype.hashCode__I = (function() {
  return this.hashCode$1
});
ScalaJS.is.s_reflect_AnyValManifest = (function(obj) {
  return (!(!((obj && obj.$classData) && obj.$classData.ancestors.s_reflect_AnyValManifest)))
});
ScalaJS.as.s_reflect_AnyValManifest = (function(obj) {
  return ((ScalaJS.is.s_reflect_AnyValManifest(obj) || (obj === null)) ? obj : ScalaJS.throwClassCastException(obj, "scala.reflect.AnyValManifest"))
});
ScalaJS.isArrayOf.s_reflect_AnyValManifest = (function(obj, depth) {
  return (!(!(((obj && obj.$classData) && (obj.$classData.arrayDepth === depth)) && obj.$classData.arrayBase.ancestors.s_reflect_AnyValManifest)))
});
ScalaJS.asArrayOf.s_reflect_AnyValManifest = (function(obj, depth) {
  return ((ScalaJS.isArrayOf.s_reflect_AnyValManifest(obj, depth) || (obj === null)) ? obj : ScalaJS.throwArrayCastException(obj, "Lscala.reflect.AnyValManifest;", depth))
});
ScalaJS.d.s_reflect_AnyValManifest = new ScalaJS.ClassTypeData({
  s_reflect_AnyValManifest: 0
}, false, "scala.reflect.AnyValManifest", ScalaJS.d.O, {
  s_reflect_AnyValManifest: 1,
  s_reflect_Manifest: 1,
  s_reflect_ClassTag: 1,
  s_Equals: 1,
  s_reflect_ClassManifestDeprecatedApis: 1,
  s_reflect_OptManifest: 1,
  s_Serializable: 1,
  Ljava_io_Serializable: 1,
  O: 1
});
ScalaJS.c.s_reflect_AnyValManifest.prototype.$classData = ScalaJS.d.s_reflect_AnyValManifest;
/** @constructor */
ScalaJS.c.s_reflect_ClassManifestFactory$ = (function() {
  ScalaJS.c.O.call(this);
  this.Byte$1 = null;
  this.Short$1 = null;
  this.Char$1 = null;
  this.Int$1 = null;
  this.Long$1 = null;
  this.Float$1 = null;
  this.Double$1 = null;
  this.Boolean$1 = null;
  this.Unit$1 = null;
  this.Any$1 = null;
  this.Object$1 = null;
  this.AnyVal$1 = null;
  this.Nothing$1 = null;
  this.Null$1 = null
});
ScalaJS.c.s_reflect_ClassManifestFactory$.prototype = new ScalaJS.h.O();
ScalaJS.c.s_reflect_ClassManifestFactory$.prototype.constructor = ScalaJS.c.s_reflect_ClassManifestFactory$;
/** @constructor */
ScalaJS.h.s_reflect_ClassManifestFactory$ = (function() {
  /*<skip>*/
});
ScalaJS.h.s_reflect_ClassManifestFactory$.prototype = ScalaJS.c.s_reflect_ClassManifestFactory$.prototype;
ScalaJS.c.s_reflect_ClassManifestFactory$.prototype.init___ = (function() {
  ScalaJS.n.s_reflect_ClassManifestFactory = this;
  this.Byte$1 = ScalaJS.m.s_reflect_ManifestFactory().Byte$1;
  this.Short$1 = ScalaJS.m.s_reflect_ManifestFactory().Short$1;
  this.Char$1 = ScalaJS.m.s_reflect_ManifestFactory().Char$1;
  this.Int$1 = ScalaJS.m.s_reflect_ManifestFactory().Int$1;
  this.Long$1 = ScalaJS.m.s_reflect_ManifestFactory().Long$1;
  this.Float$1 = ScalaJS.m.s_reflect_ManifestFactory().Float$1;
  this.Double$1 = ScalaJS.m.s_reflect_ManifestFactory().Double$1;
  this.Boolean$1 = ScalaJS.m.s_reflect_ManifestFactory().Boolean$1;
  this.Unit$1 = ScalaJS.m.s_reflect_ManifestFactory().Unit$1;
  this.Any$1 = ScalaJS.m.s_reflect_ManifestFactory().Any$1;
  this.Object$1 = ScalaJS.m.s_reflect_ManifestFactory().Object$1;
  this.AnyVal$1 = ScalaJS.m.s_reflect_ManifestFactory().AnyVal$1;
  this.Nothing$1 = ScalaJS.m.s_reflect_ManifestFactory().Nothing$1;
  this.Null$1 = ScalaJS.m.s_reflect_ManifestFactory().Null$1;
  return this
});
ScalaJS.is.s_reflect_ClassManifestFactory$ = (function(obj) {
  return (!(!((obj && obj.$classData) && obj.$classData.ancestors.s_reflect_ClassManifestFactory$)))
});
ScalaJS.as.s_reflect_ClassManifestFactory$ = (function(obj) {
  return ((ScalaJS.is.s_reflect_ClassManifestFactory$(obj) || (obj === null)) ? obj : ScalaJS.throwClassCastException(obj, "scala.reflect.ClassManifestFactory$"))
});
ScalaJS.isArrayOf.s_reflect_ClassManifestFactory$ = (function(obj, depth) {
  return (!(!(((obj && obj.$classData) && (obj.$classData.arrayDepth === depth)) && obj.$classData.arrayBase.ancestors.s_reflect_ClassManifestFactory$)))
});
ScalaJS.asArrayOf.s_reflect_ClassManifestFactory$ = (function(obj, depth) {
  return ((ScalaJS.isArrayOf.s_reflect_ClassManifestFactory$(obj, depth) || (obj === null)) ? obj : ScalaJS.throwArrayCastException(obj, "Lscala.reflect.ClassManifestFactory$;", depth))
});
ScalaJS.d.s_reflect_ClassManifestFactory$ = new ScalaJS.ClassTypeData({
  s_reflect_ClassManifestFactory$: 0
}, false, "scala.reflect.ClassManifestFactory$", ScalaJS.d.O, {
  s_reflect_ClassManifestFactory$: 1,
  O: 1
});
ScalaJS.c.s_reflect_ClassManifestFactory$.prototype.$classData = ScalaJS.d.s_reflect_ClassManifestFactory$;
ScalaJS.n.s_reflect_ClassManifestFactory = (void 0);
ScalaJS.m.s_reflect_ClassManifestFactory = (function() {
  if ((!ScalaJS.n.s_reflect_ClassManifestFactory)) {
    ScalaJS.n.s_reflect_ClassManifestFactory = new ScalaJS.c.s_reflect_ClassManifestFactory$().init___()
  };
  return ScalaJS.n.s_reflect_ClassManifestFactory
});
ScalaJS.is.s_reflect_ClassTag = (function(obj) {
  return (!(!((obj && obj.$classData) && obj.$classData.ancestors.s_reflect_ClassTag)))
});
ScalaJS.as.s_reflect_ClassTag = (function(obj) {
  return ((ScalaJS.is.s_reflect_ClassTag(obj) || (obj === null)) ? obj : ScalaJS.throwClassCastException(obj, "scala.reflect.ClassTag"))
});
ScalaJS.isArrayOf.s_reflect_ClassTag = (function(obj, depth) {
  return (!(!(((obj && obj.$classData) && (obj.$classData.arrayDepth === depth)) && obj.$classData.arrayBase.ancestors.s_reflect_ClassTag)))
});
ScalaJS.asArrayOf.s_reflect_ClassTag = (function(obj, depth) {
  return ((ScalaJS.isArrayOf.s_reflect_ClassTag(obj, depth) || (obj === null)) ? obj : ScalaJS.throwArrayCastException(obj, "Lscala.reflect.ClassTag;", depth))
});
ScalaJS.d.s_reflect_ClassTag = new ScalaJS.ClassTypeData({
  s_reflect_ClassTag: 0
}, true, "scala.reflect.ClassTag", (void 0), {
  s_reflect_ClassTag: 1,
  s_Equals: 1,
  s_reflect_ClassManifestDeprecatedApis: 1,
  s_reflect_OptManifest: 1,
  s_Serializable: 1,
  Ljava_io_Serializable: 1,
  O: 1
});
/** @constructor */
ScalaJS.c.s_reflect_ClassTag$ = (function() {
  ScalaJS.c.O.call(this);
  this.ObjectTYPE$1 = null;
  this.NothingTYPE$1 = null;
  this.NullTYPE$1 = null;
  this.Byte$1 = null;
  this.Short$1 = null;
  this.Char$1 = null;
  this.Int$1 = null;
  this.Long$1 = null;
  this.Float$1 = null;
  this.Double$1 = null;
  this.Boolean$1 = null;
  this.Unit$1 = null;
  this.Any$1 = null;
  this.Object$1 = null;
  this.AnyVal$1 = null;
  this.AnyRef$1 = null;
  this.Nothing$1 = null;
  this.Null$1 = null
});
ScalaJS.c.s_reflect_ClassTag$.prototype = new ScalaJS.h.O();
ScalaJS.c.s_reflect_ClassTag$.prototype.constructor = ScalaJS.c.s_reflect_ClassTag$;
/** @constructor */
ScalaJS.h.s_reflect_ClassTag$ = (function() {
  /*<skip>*/
});
ScalaJS.h.s_reflect_ClassTag$.prototype = ScalaJS.c.s_reflect_ClassTag$.prototype;
ScalaJS.c.s_reflect_ClassTag$.prototype.init___ = (function() {
  ScalaJS.n.s_reflect_ClassTag = this;
  this.ObjectTYPE$1 = ScalaJS.d.O.getClassOf();
  this.NothingTYPE$1 = ScalaJS.d.sr_Nothing$.getClassOf();
  this.NullTYPE$1 = ScalaJS.d.sr_Null$.getClassOf();
  this.Byte$1 = ScalaJS.m.s_reflect_package().Manifest$1.Byte$1;
  this.Short$1 = ScalaJS.m.s_reflect_package().Manifest$1.Short$1;
  this.Char$1 = ScalaJS.m.s_reflect_package().Manifest$1.Char$1;
  this.Int$1 = ScalaJS.m.s_reflect_package().Manifest$1.Int$1;
  this.Long$1 = ScalaJS.m.s_reflect_package().Manifest$1.Long$1;
  this.Float$1 = ScalaJS.m.s_reflect_package().Manifest$1.Float$1;
  this.Double$1 = ScalaJS.m.s_reflect_package().Manifest$1.Double$1;
  this.Boolean$1 = ScalaJS.m.s_reflect_package().Manifest$1.Boolean$1;
  this.Unit$1 = ScalaJS.m.s_reflect_package().Manifest$1.Unit$1;
  this.Any$1 = ScalaJS.m.s_reflect_package().Manifest$1.Any$1;
  this.Object$1 = ScalaJS.m.s_reflect_package().Manifest$1.Object$1;
  this.AnyVal$1 = ScalaJS.m.s_reflect_package().Manifest$1.AnyVal$1;
  this.AnyRef$1 = ScalaJS.m.s_reflect_package().Manifest$1.AnyRef$1;
  this.Nothing$1 = ScalaJS.m.s_reflect_package().Manifest$1.Nothing$1;
  this.Null$1 = ScalaJS.m.s_reflect_package().Manifest$1.Null$1;
  return this
});
ScalaJS.c.s_reflect_ClassTag$.prototype.apply__jl_Class__s_reflect_ClassTag = (function(runtimeClass1) {
  return (ScalaJS.anyRefEqEq(ScalaJS.d.B.getClassOf(), runtimeClass1) ? ScalaJS.m.s_reflect_ClassTag().Byte$1 : (ScalaJS.anyRefEqEq(ScalaJS.d.S.getClassOf(), runtimeClass1) ? ScalaJS.m.s_reflect_ClassTag().Short$1 : (ScalaJS.anyRefEqEq(ScalaJS.d.C.getClassOf(), runtimeClass1) ? ScalaJS.m.s_reflect_ClassTag().Char$1 : (ScalaJS.anyRefEqEq(ScalaJS.d.I.getClassOf(), runtimeClass1) ? ScalaJS.m.s_reflect_ClassTag().Int$1 : (ScalaJS.anyRefEqEq(ScalaJS.d.J.getClassOf(), runtimeClass1) ? ScalaJS.m.s_reflect_ClassTag().Long$1 : (ScalaJS.anyRefEqEq(ScalaJS.d.F.getClassOf(), runtimeClass1) ? ScalaJS.m.s_reflect_ClassTag().Float$1 : (ScalaJS.anyRefEqEq(ScalaJS.d.D.getClassOf(), runtimeClass1) ? ScalaJS.m.s_reflect_ClassTag().Double$1 : (ScalaJS.anyRefEqEq(ScalaJS.d.Z.getClassOf(), runtimeClass1) ? ScalaJS.m.s_reflect_ClassTag().Boolean$1 : (ScalaJS.anyRefEqEq(ScalaJS.d.V.getClassOf(), runtimeClass1) ? ScalaJS.m.s_reflect_ClassTag().Unit$1 : (ScalaJS.anyRefEqEq(this.ObjectTYPE$1, runtimeClass1) ? ScalaJS.m.s_reflect_ClassTag().Object$1 : (ScalaJS.anyRefEqEq(this.NothingTYPE$1, runtimeClass1) ? ScalaJS.m.s_reflect_ClassTag().Nothing$1 : (ScalaJS.anyRefEqEq(this.NullTYPE$1, runtimeClass1) ? ScalaJS.m.s_reflect_ClassTag().Null$1 : new ScalaJS.c.s_reflect_ClassTag$$anon$1().init___jl_Class(runtimeClass1)))))))))))))
});
ScalaJS.is.s_reflect_ClassTag$ = (function(obj) {
  return (!(!((obj && obj.$classData) && obj.$classData.ancestors.s_reflect_ClassTag$)))
});
ScalaJS.as.s_reflect_ClassTag$ = (function(obj) {
  return ((ScalaJS.is.s_reflect_ClassTag$(obj) || (obj === null)) ? obj : ScalaJS.throwClassCastException(obj, "scala.reflect.ClassTag$"))
});
ScalaJS.isArrayOf.s_reflect_ClassTag$ = (function(obj, depth) {
  return (!(!(((obj && obj.$classData) && (obj.$classData.arrayDepth === depth)) && obj.$classData.arrayBase.ancestors.s_reflect_ClassTag$)))
});
ScalaJS.asArrayOf.s_reflect_ClassTag$ = (function(obj, depth) {
  return ((ScalaJS.isArrayOf.s_reflect_ClassTag$(obj, depth) || (obj === null)) ? obj : ScalaJS.throwArrayCastException(obj, "Lscala.reflect.ClassTag$;", depth))
});
ScalaJS.d.s_reflect_ClassTag$ = new ScalaJS.ClassTypeData({
  s_reflect_ClassTag$: 0
}, false, "scala.reflect.ClassTag$", ScalaJS.d.O, {
  s_reflect_ClassTag$: 1,
  s_Serializable: 1,
  Ljava_io_Serializable: 1,
  O: 1
});
ScalaJS.c.s_reflect_ClassTag$.prototype.$classData = ScalaJS.d.s_reflect_ClassTag$;
ScalaJS.n.s_reflect_ClassTag = (void 0);
ScalaJS.m.s_reflect_ClassTag = (function() {
  if ((!ScalaJS.n.s_reflect_ClassTag)) {
    ScalaJS.n.s_reflect_ClassTag = new ScalaJS.c.s_reflect_ClassTag$().init___()
  };
  return ScalaJS.n.s_reflect_ClassTag
});
/** @constructor */
ScalaJS.c.s_reflect_ClassTag$$anon$1 = (function() {
  ScalaJS.c.O.call(this);
  this.runtimeClass1$1$1 = null
});
ScalaJS.c.s_reflect_ClassTag$$anon$1.prototype = new ScalaJS.h.O();
ScalaJS.c.s_reflect_ClassTag$$anon$1.prototype.constructor = ScalaJS.c.s_reflect_ClassTag$$anon$1;
/** @constructor */
ScalaJS.h.s_reflect_ClassTag$$anon$1 = (function() {
  /*<skip>*/
});
ScalaJS.h.s_reflect_ClassTag$$anon$1.prototype = ScalaJS.c.s_reflect_ClassTag$$anon$1.prototype;
ScalaJS.c.s_reflect_ClassTag$$anon$1.prototype.newArray__I__O = (function(len) {
  return ScalaJS.i.s_reflect_ClassTag$class__newArray__s_reflect_ClassTag__I__O(this, len)
});
ScalaJS.c.s_reflect_ClassTag$$anon$1.prototype.equals__O__Z = (function(x) {
  return ScalaJS.i.s_reflect_ClassTag$class__equals__s_reflect_ClassTag__O__Z(this, x)
});
ScalaJS.c.s_reflect_ClassTag$$anon$1.prototype.toString__T = (function() {
  return ScalaJS.i.s_reflect_ClassTag$class__prettyprint$1__s_reflect_ClassTag__jl_Class__T(this, this.runtimeClass1$1$1)
});
ScalaJS.c.s_reflect_ClassTag$$anon$1.prototype.runtimeClass__jl_Class = (function() {
  return this.runtimeClass1$1$1
});
ScalaJS.c.s_reflect_ClassTag$$anon$1.prototype.init___jl_Class = (function(runtimeClass1$1) {
  this.runtimeClass1$1$1 = runtimeClass1$1;
  return this
});
ScalaJS.c.s_reflect_ClassTag$$anon$1.prototype.hashCode__I = (function() {
  return ScalaJS.m.sr_ScalaRunTime().hash__O__I(this.runtimeClass1$1$1)
});
ScalaJS.is.s_reflect_ClassTag$$anon$1 = (function(obj) {
  return (!(!((obj && obj.$classData) && obj.$classData.ancestors.s_reflect_ClassTag$$anon$1)))
});
ScalaJS.as.s_reflect_ClassTag$$anon$1 = (function(obj) {
  return ((ScalaJS.is.s_reflect_ClassTag$$anon$1(obj) || (obj === null)) ? obj : ScalaJS.throwClassCastException(obj, "scala.reflect.ClassTag$$anon$1"))
});
ScalaJS.isArrayOf.s_reflect_ClassTag$$anon$1 = (function(obj, depth) {
  return (!(!(((obj && obj.$classData) && (obj.$classData.arrayDepth === depth)) && obj.$classData.arrayBase.ancestors.s_reflect_ClassTag$$anon$1)))
});
ScalaJS.asArrayOf.s_reflect_ClassTag$$anon$1 = (function(obj, depth) {
  return ((ScalaJS.isArrayOf.s_reflect_ClassTag$$anon$1(obj, depth) || (obj === null)) ? obj : ScalaJS.throwArrayCastException(obj, "Lscala.reflect.ClassTag$$anon$1;", depth))
});
ScalaJS.d.s_reflect_ClassTag$$anon$1 = new ScalaJS.ClassTypeData({
  s_reflect_ClassTag$$anon$1: 0
}, false, "scala.reflect.ClassTag$$anon$1", ScalaJS.d.O, {
  s_reflect_ClassTag$$anon$1: 1,
  s_reflect_ClassTag: 1,
  s_Equals: 1,
  s_reflect_ClassManifestDeprecatedApis: 1,
  s_reflect_OptManifest: 1,
  s_Serializable: 1,
  Ljava_io_Serializable: 1,
  O: 1
});
ScalaJS.c.s_reflect_ClassTag$$anon$1.prototype.$classData = ScalaJS.d.s_reflect_ClassTag$$anon$1;
/** @constructor */
ScalaJS.c.s_reflect_ManifestFactory$ = (function() {
  ScalaJS.c.O.call(this);
  this.Byte$1 = null;
  this.Short$1 = null;
  this.Char$1 = null;
  this.Int$1 = null;
  this.Long$1 = null;
  this.Float$1 = null;
  this.Double$1 = null;
  this.Boolean$1 = null;
  this.Unit$1 = null;
  this.scala$reflect$ManifestFactory$$ObjectTYPE$1 = null;
  this.scala$reflect$ManifestFactory$$NothingTYPE$1 = null;
  this.scala$reflect$ManifestFactory$$NullTYPE$1 = null;
  this.Any$1 = null;
  this.Object$1 = null;
  this.AnyRef$1 = null;
  this.AnyVal$1 = null;
  this.Null$1 = null;
  this.Nothing$1 = null
});
ScalaJS.c.s_reflect_ManifestFactory$.prototype = new ScalaJS.h.O();
ScalaJS.c.s_reflect_ManifestFactory$.prototype.constructor = ScalaJS.c.s_reflect_ManifestFactory$;
/** @constructor */
ScalaJS.h.s_reflect_ManifestFactory$ = (function() {
  /*<skip>*/
});
ScalaJS.h.s_reflect_ManifestFactory$.prototype = ScalaJS.c.s_reflect_ManifestFactory$.prototype;
ScalaJS.c.s_reflect_ManifestFactory$.prototype.init___ = (function() {
  ScalaJS.n.s_reflect_ManifestFactory = this;
  this.Byte$1 = new ScalaJS.c.s_reflect_ManifestFactory$$anon$6().init___();
  this.Short$1 = new ScalaJS.c.s_reflect_ManifestFactory$$anon$7().init___();
  this.Char$1 = new ScalaJS.c.s_reflect_ManifestFactory$$anon$8().init___();
  this.Int$1 = new ScalaJS.c.s_reflect_ManifestFactory$$anon$9().init___();
  this.Long$1 = new ScalaJS.c.s_reflect_ManifestFactory$$anon$10().init___();
  this.Float$1 = new ScalaJS.c.s_reflect_ManifestFactory$$anon$11().init___();
  this.Double$1 = new ScalaJS.c.s_reflect_ManifestFactory$$anon$12().init___();
  this.Boolean$1 = new ScalaJS.c.s_reflect_ManifestFactory$$anon$13().init___();
  this.Unit$1 = new ScalaJS.c.s_reflect_ManifestFactory$$anon$14().init___();
  this.scala$reflect$ManifestFactory$$ObjectTYPE$1 = ScalaJS.d.O.getClassOf();
  this.scala$reflect$ManifestFactory$$NothingTYPE$1 = ScalaJS.d.sr_Nothing$.getClassOf();
  this.scala$reflect$ManifestFactory$$NullTYPE$1 = ScalaJS.d.sr_Null$.getClassOf();
  this.Any$1 = new ScalaJS.c.s_reflect_ManifestFactory$$anon$1().init___();
  this.Object$1 = new ScalaJS.c.s_reflect_ManifestFactory$$anon$2().init___();
  this.AnyRef$1 = this.Object$1;
  this.AnyVal$1 = new ScalaJS.c.s_reflect_ManifestFactory$$anon$3().init___();
  this.Null$1 = new ScalaJS.c.s_reflect_ManifestFactory$$anon$4().init___();
  this.Nothing$1 = new ScalaJS.c.s_reflect_ManifestFactory$$anon$5().init___();
  return this
});
ScalaJS.is.s_reflect_ManifestFactory$ = (function(obj) {
  return (!(!((obj && obj.$classData) && obj.$classData.ancestors.s_reflect_ManifestFactory$)))
});
ScalaJS.as.s_reflect_ManifestFactory$ = (function(obj) {
  return ((ScalaJS.is.s_reflect_ManifestFactory$(obj) || (obj === null)) ? obj : ScalaJS.throwClassCastException(obj, "scala.reflect.ManifestFactory$"))
});
ScalaJS.isArrayOf.s_reflect_ManifestFactory$ = (function(obj, depth) {
  return (!(!(((obj && obj.$classData) && (obj.$classData.arrayDepth === depth)) && obj.$classData.arrayBase.ancestors.s_reflect_ManifestFactory$)))
});
ScalaJS.asArrayOf.s_reflect_ManifestFactory$ = (function(obj, depth) {
  return ((ScalaJS.isArrayOf.s_reflect_ManifestFactory$(obj, depth) || (obj === null)) ? obj : ScalaJS.throwArrayCastException(obj, "Lscala.reflect.ManifestFactory$;", depth))
});
ScalaJS.d.s_reflect_ManifestFactory$ = new ScalaJS.ClassTypeData({
  s_reflect_ManifestFactory$: 0
}, false, "scala.reflect.ManifestFactory$", ScalaJS.d.O, {
  s_reflect_ManifestFactory$: 1,
  O: 1
});
ScalaJS.c.s_reflect_ManifestFactory$.prototype.$classData = ScalaJS.d.s_reflect_ManifestFactory$;
ScalaJS.n.s_reflect_ManifestFactory = (void 0);
ScalaJS.m.s_reflect_ManifestFactory = (function() {
  if ((!ScalaJS.n.s_reflect_ManifestFactory)) {
    ScalaJS.n.s_reflect_ManifestFactory = new ScalaJS.c.s_reflect_ManifestFactory$().init___()
  };
  return ScalaJS.n.s_reflect_ManifestFactory
});
/** @constructor */
ScalaJS.c.s_reflect_ManifestFactory$ClassTypeManifest = (function() {
  ScalaJS.c.O.call(this);
  this.prefix$1 = null;
  this.runtimeClass$1 = null;
  this.typeArguments$1 = null
});
ScalaJS.c.s_reflect_ManifestFactory$ClassTypeManifest.prototype = new ScalaJS.h.O();
ScalaJS.c.s_reflect_ManifestFactory$ClassTypeManifest.prototype.constructor = ScalaJS.c.s_reflect_ManifestFactory$ClassTypeManifest;
/** @constructor */
ScalaJS.h.s_reflect_ManifestFactory$ClassTypeManifest = (function() {
  /*<skip>*/
});
ScalaJS.h.s_reflect_ManifestFactory$ClassTypeManifest.prototype = ScalaJS.c.s_reflect_ManifestFactory$ClassTypeManifest.prototype;
ScalaJS.c.s_reflect_ManifestFactory$ClassTypeManifest.prototype.runtimeClass__jl_Class = (function() {
  return this.runtimeClass$1
});
ScalaJS.c.s_reflect_ManifestFactory$ClassTypeManifest.prototype.init___s_Option__jl_Class__sci_List = (function(prefix, runtimeClass, typeArguments) {
  this.prefix$1 = prefix;
  this.runtimeClass$1 = runtimeClass;
  this.typeArguments$1 = typeArguments;
  return this
});
ScalaJS.is.s_reflect_ManifestFactory$ClassTypeManifest = (function(obj) {
  return (!(!((obj && obj.$classData) && obj.$classData.ancestors.s_reflect_ManifestFactory$ClassTypeManifest)))
});
ScalaJS.as.s_reflect_ManifestFactory$ClassTypeManifest = (function(obj) {
  return ((ScalaJS.is.s_reflect_ManifestFactory$ClassTypeManifest(obj) || (obj === null)) ? obj : ScalaJS.throwClassCastException(obj, "scala.reflect.ManifestFactory$ClassTypeManifest"))
});
ScalaJS.isArrayOf.s_reflect_ManifestFactory$ClassTypeManifest = (function(obj, depth) {
  return (!(!(((obj && obj.$classData) && (obj.$classData.arrayDepth === depth)) && obj.$classData.arrayBase.ancestors.s_reflect_ManifestFactory$ClassTypeManifest)))
});
ScalaJS.asArrayOf.s_reflect_ManifestFactory$ClassTypeManifest = (function(obj, depth) {
  return ((ScalaJS.isArrayOf.s_reflect_ManifestFactory$ClassTypeManifest(obj, depth) || (obj === null)) ? obj : ScalaJS.throwArrayCastException(obj, "Lscala.reflect.ManifestFactory$ClassTypeManifest;", depth))
});
ScalaJS.d.s_reflect_ManifestFactory$ClassTypeManifest = new ScalaJS.ClassTypeData({
  s_reflect_ManifestFactory$ClassTypeManifest: 0
}, false, "scala.reflect.ManifestFactory$ClassTypeManifest", ScalaJS.d.O, {
  s_reflect_ManifestFactory$ClassTypeManifest: 1,
  s_reflect_Manifest: 1,
  s_reflect_ClassTag: 1,
  s_Equals: 1,
  s_reflect_ClassManifestDeprecatedApis: 1,
  s_reflect_OptManifest: 1,
  s_Serializable: 1,
  Ljava_io_Serializable: 1,
  O: 1
});
ScalaJS.c.s_reflect_ManifestFactory$ClassTypeManifest.prototype.$classData = ScalaJS.d.s_reflect_ManifestFactory$ClassTypeManifest;
/** @constructor */
ScalaJS.c.s_reflect_NoManifest$ = (function() {
  ScalaJS.c.O.call(this)
});
ScalaJS.c.s_reflect_NoManifest$.prototype = new ScalaJS.h.O();
ScalaJS.c.s_reflect_NoManifest$.prototype.constructor = ScalaJS.c.s_reflect_NoManifest$;
/** @constructor */
ScalaJS.h.s_reflect_NoManifest$ = (function() {
  /*<skip>*/
});
ScalaJS.h.s_reflect_NoManifest$.prototype = ScalaJS.c.s_reflect_NoManifest$.prototype;
ScalaJS.c.s_reflect_NoManifest$.prototype.toString__T = (function() {
  return "<?>"
});
ScalaJS.is.s_reflect_NoManifest$ = (function(obj) {
  return (!(!((obj && obj.$classData) && obj.$classData.ancestors.s_reflect_NoManifest$)))
});
ScalaJS.as.s_reflect_NoManifest$ = (function(obj) {
  return ((ScalaJS.is.s_reflect_NoManifest$(obj) || (obj === null)) ? obj : ScalaJS.throwClassCastException(obj, "scala.reflect.NoManifest$"))
});
ScalaJS.isArrayOf.s_reflect_NoManifest$ = (function(obj, depth) {
  return (!(!(((obj && obj.$classData) && (obj.$classData.arrayDepth === depth)) && obj.$classData.arrayBase.ancestors.s_reflect_NoManifest$)))
});
ScalaJS.asArrayOf.s_reflect_NoManifest$ = (function(obj, depth) {
  return ((ScalaJS.isArrayOf.s_reflect_NoManifest$(obj, depth) || (obj === null)) ? obj : ScalaJS.throwArrayCastException(obj, "Lscala.reflect.NoManifest$;", depth))
});
ScalaJS.d.s_reflect_NoManifest$ = new ScalaJS.ClassTypeData({
  s_reflect_NoManifest$: 0
}, false, "scala.reflect.NoManifest$", ScalaJS.d.O, {
  s_reflect_NoManifest$: 1,
  s_reflect_OptManifest: 1,
  s_Serializable: 1,
  Ljava_io_Serializable: 1,
  O: 1
});
ScalaJS.c.s_reflect_NoManifest$.prototype.$classData = ScalaJS.d.s_reflect_NoManifest$;
ScalaJS.n.s_reflect_NoManifest = (void 0);
ScalaJS.m.s_reflect_NoManifest = (function() {
  if ((!ScalaJS.n.s_reflect_NoManifest)) {
    ScalaJS.n.s_reflect_NoManifest = new ScalaJS.c.s_reflect_NoManifest$().init___()
  };
  return ScalaJS.n.s_reflect_NoManifest
});
/** @constructor */
ScalaJS.c.s_reflect_package$ = (function() {
  ScalaJS.c.O.call(this);
  this.ClassManifest$1 = null;
  this.Manifest$1 = null
});
ScalaJS.c.s_reflect_package$.prototype = new ScalaJS.h.O();
ScalaJS.c.s_reflect_package$.prototype.constructor = ScalaJS.c.s_reflect_package$;
/** @constructor */
ScalaJS.h.s_reflect_package$ = (function() {
  /*<skip>*/
});
ScalaJS.h.s_reflect_package$.prototype = ScalaJS.c.s_reflect_package$.prototype;
ScalaJS.c.s_reflect_package$.prototype.init___ = (function() {
  ScalaJS.n.s_reflect_package = this;
  this.ClassManifest$1 = ScalaJS.m.s_reflect_ClassManifestFactory();
  this.Manifest$1 = ScalaJS.m.s_reflect_ManifestFactory();
  return this
});
ScalaJS.is.s_reflect_package$ = (function(obj) {
  return (!(!((obj && obj.$classData) && obj.$classData.ancestors.s_reflect_package$)))
});
ScalaJS.as.s_reflect_package$ = (function(obj) {
  return ((ScalaJS.is.s_reflect_package$(obj) || (obj === null)) ? obj : ScalaJS.throwClassCastException(obj, "scala.reflect.package$"))
});
ScalaJS.isArrayOf.s_reflect_package$ = (function(obj, depth) {
  return (!(!(((obj && obj.$classData) && (obj.$classData.arrayDepth === depth)) && obj.$classData.arrayBase.ancestors.s_reflect_package$)))
});
ScalaJS.asArrayOf.s_reflect_package$ = (function(obj, depth) {
  return ((ScalaJS.isArrayOf.s_reflect_package$(obj, depth) || (obj === null)) ? obj : ScalaJS.throwArrayCastException(obj, "Lscala.reflect.package$;", depth))
});
ScalaJS.d.s_reflect_package$ = new ScalaJS.ClassTypeData({
  s_reflect_package$: 0
}, false, "scala.reflect.package$", ScalaJS.d.O, {
  s_reflect_package$: 1,
  O: 1
});
ScalaJS.c.s_reflect_package$.prototype.$classData = ScalaJS.d.s_reflect_package$;
ScalaJS.n.s_reflect_package = (void 0);
ScalaJS.m.s_reflect_package = (function() {
  if ((!ScalaJS.n.s_reflect_package)) {
    ScalaJS.n.s_reflect_package = new ScalaJS.c.s_reflect_package$().init___()
  };
  return ScalaJS.n.s_reflect_package
});
/** @constructor */
ScalaJS.c.s_util_DynamicVariable = (function() {
  ScalaJS.c.O.call(this);
  this.scala$util$DynamicVariable$$init$f = null;
  this.tl$1 = null
});
ScalaJS.c.s_util_DynamicVariable.prototype = new ScalaJS.h.O();
ScalaJS.c.s_util_DynamicVariable.prototype.constructor = ScalaJS.c.s_util_DynamicVariable;
/** @constructor */
ScalaJS.h.s_util_DynamicVariable = (function() {
  /*<skip>*/
});
ScalaJS.h.s_util_DynamicVariable.prototype = ScalaJS.c.s_util_DynamicVariable.prototype;
ScalaJS.c.s_util_DynamicVariable.prototype.toString__T = (function() {
  return (("DynamicVariable(" + this.tl$1.get__O()) + ")")
});
ScalaJS.c.s_util_DynamicVariable.prototype.init___O = (function(init) {
  this.scala$util$DynamicVariable$$init$f = init;
  this.tl$1 = new ScalaJS.c.s_util_DynamicVariable$$anon$1().init___s_util_DynamicVariable(this);
  return this
});
ScalaJS.is.s_util_DynamicVariable = (function(obj) {
  return (!(!((obj && obj.$classData) && obj.$classData.ancestors.s_util_DynamicVariable)))
});
ScalaJS.as.s_util_DynamicVariable = (function(obj) {
  return ((ScalaJS.is.s_util_DynamicVariable(obj) || (obj === null)) ? obj : ScalaJS.throwClassCastException(obj, "scala.util.DynamicVariable"))
});
ScalaJS.isArrayOf.s_util_DynamicVariable = (function(obj, depth) {
  return (!(!(((obj && obj.$classData) && (obj.$classData.arrayDepth === depth)) && obj.$classData.arrayBase.ancestors.s_util_DynamicVariable)))
});
ScalaJS.asArrayOf.s_util_DynamicVariable = (function(obj, depth) {
  return ((ScalaJS.isArrayOf.s_util_DynamicVariable(obj, depth) || (obj === null)) ? obj : ScalaJS.throwArrayCastException(obj, "Lscala.util.DynamicVariable;", depth))
});
ScalaJS.d.s_util_DynamicVariable = new ScalaJS.ClassTypeData({
  s_util_DynamicVariable: 0
}, false, "scala.util.DynamicVariable", ScalaJS.d.O, {
  s_util_DynamicVariable: 1,
  O: 1
});
ScalaJS.c.s_util_DynamicVariable.prototype.$classData = ScalaJS.d.s_util_DynamicVariable;
/** @constructor */
ScalaJS.c.s_util_Either = (function() {
  ScalaJS.c.O.call(this)
});
ScalaJS.c.s_util_Either.prototype = new ScalaJS.h.O();
ScalaJS.c.s_util_Either.prototype.constructor = ScalaJS.c.s_util_Either;
/** @constructor */
ScalaJS.h.s_util_Either = (function() {
  /*<skip>*/
});
ScalaJS.h.s_util_Either.prototype = ScalaJS.c.s_util_Either.prototype;
ScalaJS.c.s_util_Either.prototype.fold__F1__F1__O = (function(fa, fb) {
  if (ScalaJS.is.s_util_Left(this)) {
    var x2 = ScalaJS.as.s_util_Left(this);
    var a = x2.a$2;
    return fa.apply__O__O(a)
  } else if (ScalaJS.is.s_util_Right(this)) {
    var x3 = ScalaJS.as.s_util_Right(this);
    var b = x3.b$2;
    return fb.apply__O__O(b)
  } else {
    throw new ScalaJS.c.s_MatchError().init___O(this)
  }
});
ScalaJS.is.s_util_Either = (function(obj) {
  return (!(!((obj && obj.$classData) && obj.$classData.ancestors.s_util_Either)))
});
ScalaJS.as.s_util_Either = (function(obj) {
  return ((ScalaJS.is.s_util_Either(obj) || (obj === null)) ? obj : ScalaJS.throwClassCastException(obj, "scala.util.Either"))
});
ScalaJS.isArrayOf.s_util_Either = (function(obj, depth) {
  return (!(!(((obj && obj.$classData) && (obj.$classData.arrayDepth === depth)) && obj.$classData.arrayBase.ancestors.s_util_Either)))
});
ScalaJS.asArrayOf.s_util_Either = (function(obj, depth) {
  return ((ScalaJS.isArrayOf.s_util_Either(obj, depth) || (obj === null)) ? obj : ScalaJS.throwArrayCastException(obj, "Lscala.util.Either;", depth))
});
ScalaJS.d.s_util_Either = new ScalaJS.ClassTypeData({
  s_util_Either: 0
}, false, "scala.util.Either", ScalaJS.d.O, {
  s_util_Either: 1,
  O: 1
});
ScalaJS.c.s_util_Either.prototype.$classData = ScalaJS.d.s_util_Either;
/** @constructor */
ScalaJS.c.s_util_Either$ = (function() {
  ScalaJS.c.O.call(this)
});
ScalaJS.c.s_util_Either$.prototype = new ScalaJS.h.O();
ScalaJS.c.s_util_Either$.prototype.constructor = ScalaJS.c.s_util_Either$;
/** @constructor */
ScalaJS.h.s_util_Either$ = (function() {
  /*<skip>*/
});
ScalaJS.h.s_util_Either$.prototype = ScalaJS.c.s_util_Either$.prototype;
ScalaJS.is.s_util_Either$ = (function(obj) {
  return (!(!((obj && obj.$classData) && obj.$classData.ancestors.s_util_Either$)))
});
ScalaJS.as.s_util_Either$ = (function(obj) {
  return ((ScalaJS.is.s_util_Either$(obj) || (obj === null)) ? obj : ScalaJS.throwClassCastException(obj, "scala.util.Either$"))
});
ScalaJS.isArrayOf.s_util_Either$ = (function(obj, depth) {
  return (!(!(((obj && obj.$classData) && (obj.$classData.arrayDepth === depth)) && obj.$classData.arrayBase.ancestors.s_util_Either$)))
});
ScalaJS.asArrayOf.s_util_Either$ = (function(obj, depth) {
  return ((ScalaJS.isArrayOf.s_util_Either$(obj, depth) || (obj === null)) ? obj : ScalaJS.throwArrayCastException(obj, "Lscala.util.Either$;", depth))
});
ScalaJS.d.s_util_Either$ = new ScalaJS.ClassTypeData({
  s_util_Either$: 0
}, false, "scala.util.Either$", ScalaJS.d.O, {
  s_util_Either$: 1,
  O: 1
});
ScalaJS.c.s_util_Either$.prototype.$classData = ScalaJS.d.s_util_Either$;
ScalaJS.n.s_util_Either = (void 0);
ScalaJS.m.s_util_Either = (function() {
  if ((!ScalaJS.n.s_util_Either)) {
    ScalaJS.n.s_util_Either = new ScalaJS.c.s_util_Either$().init___()
  };
  return ScalaJS.n.s_util_Either
});
/** @constructor */
ScalaJS.c.s_util_Either$LeftProjection = (function() {
  ScalaJS.c.O.call(this);
  this.e$1 = null
});
ScalaJS.c.s_util_Either$LeftProjection.prototype = new ScalaJS.h.O();
ScalaJS.c.s_util_Either$LeftProjection.prototype.constructor = ScalaJS.c.s_util_Either$LeftProjection;
/** @constructor */
ScalaJS.h.s_util_Either$LeftProjection = (function() {
  /*<skip>*/
});
ScalaJS.h.s_util_Either$LeftProjection.prototype = ScalaJS.c.s_util_Either$LeftProjection.prototype;
ScalaJS.c.s_util_Either$LeftProjection.prototype.productPrefix__T = (function() {
  return "LeftProjection"
});
ScalaJS.c.s_util_Either$LeftProjection.prototype.productArity__I = (function() {
  return 1
});
ScalaJS.c.s_util_Either$LeftProjection.prototype.equals__O__Z = (function(x$1) {
  if ((this === x$1)) {
    return true
  } else if (ScalaJS.is.s_util_Either$LeftProjection(x$1)) {
    var LeftProjection$1 = ScalaJS.as.s_util_Either$LeftProjection(x$1);
    return ScalaJS.anyRefEqEq(this.e$1, LeftProjection$1.e$1)
  } else {
    return false
  }
});
ScalaJS.c.s_util_Either$LeftProjection.prototype.productElement__I__O = (function(x$1) {
  switch (x$1) {
    case 0:
      {
        return this.e$1;
        break
      };
    default:
      throw new ScalaJS.c.jl_IndexOutOfBoundsException().init___T(ScalaJS.objectToString(x$1));
  }
});
ScalaJS.c.s_util_Either$LeftProjection.prototype.toString__T = (function() {
  return ScalaJS.m.sr_ScalaRunTime().$$undtoString__s_Product__T(this)
});
ScalaJS.c.s_util_Either$LeftProjection.prototype.hashCode__I = (function() {
  var this$2 = ScalaJS.m.s_util_hashing_MurmurHash3();
  return this$2.productHash__s_Product__I__I(this, (-889275714))
});
ScalaJS.c.s_util_Either$LeftProjection.prototype.productIterator__sc_Iterator = (function() {
  return new ScalaJS.c.sr_ScalaRunTime$$anon$1().init___s_Product(this)
});
ScalaJS.c.s_util_Either$LeftProjection.prototype.init___s_util_Either = (function(e) {
  this.e$1 = e;
  return this
});
ScalaJS.is.s_util_Either$LeftProjection = (function(obj) {
  return (!(!((obj && obj.$classData) && obj.$classData.ancestors.s_util_Either$LeftProjection)))
});
ScalaJS.as.s_util_Either$LeftProjection = (function(obj) {
  return ((ScalaJS.is.s_util_Either$LeftProjection(obj) || (obj === null)) ? obj : ScalaJS.throwClassCastException(obj, "scala.util.Either$LeftProjection"))
});
ScalaJS.isArrayOf.s_util_Either$LeftProjection = (function(obj, depth) {
  return (!(!(((obj && obj.$classData) && (obj.$classData.arrayDepth === depth)) && obj.$classData.arrayBase.ancestors.s_util_Either$LeftProjection)))
});
ScalaJS.asArrayOf.s_util_Either$LeftProjection = (function(obj, depth) {
  return ((ScalaJS.isArrayOf.s_util_Either$LeftProjection(obj, depth) || (obj === null)) ? obj : ScalaJS.throwArrayCastException(obj, "Lscala.util.Either$LeftProjection;", depth))
});
ScalaJS.d.s_util_Either$LeftProjection = new ScalaJS.ClassTypeData({
  s_util_Either$LeftProjection: 0
}, false, "scala.util.Either$LeftProjection", ScalaJS.d.O, {
  s_util_Either$LeftProjection: 1,
  s_Serializable: 1,
  Ljava_io_Serializable: 1,
  s_Product: 1,
  s_Equals: 1,
  O: 1
});
ScalaJS.c.s_util_Either$LeftProjection.prototype.$classData = ScalaJS.d.s_util_Either$LeftProjection;
/** @constructor */
ScalaJS.c.s_util_Either$MergeableEither$ = (function() {
  ScalaJS.c.O.call(this)
});
ScalaJS.c.s_util_Either$MergeableEither$.prototype = new ScalaJS.h.O();
ScalaJS.c.s_util_Either$MergeableEither$.prototype.constructor = ScalaJS.c.s_util_Either$MergeableEither$;
/** @constructor */
ScalaJS.h.s_util_Either$MergeableEither$ = (function() {
  /*<skip>*/
});
ScalaJS.h.s_util_Either$MergeableEither$.prototype = ScalaJS.c.s_util_Either$MergeableEither$.prototype;
ScalaJS.c.s_util_Either$MergeableEither$.prototype.merge$extension__s_util_Either__O = (function($$this) {
  if (ScalaJS.is.s_util_Left($$this)) {
    var x2 = ScalaJS.as.s_util_Left($$this);
    var a = x2.a$2;
    return a
  } else if (ScalaJS.is.s_util_Right($$this)) {
    var x3 = ScalaJS.as.s_util_Right($$this);
    var a$2 = x3.b$2;
    return a$2
  } else {
    throw new ScalaJS.c.s_MatchError().init___O($$this)
  }
});
ScalaJS.is.s_util_Either$MergeableEither$ = (function(obj) {
  return (!(!((obj && obj.$classData) && obj.$classData.ancestors.s_util_Either$MergeableEither$)))
});
ScalaJS.as.s_util_Either$MergeableEither$ = (function(obj) {
  return ((ScalaJS.is.s_util_Either$MergeableEither$(obj) || (obj === null)) ? obj : ScalaJS.throwClassCastException(obj, "scala.util.Either$MergeableEither$"))
});
ScalaJS.isArrayOf.s_util_Either$MergeableEither$ = (function(obj, depth) {
  return (!(!(((obj && obj.$classData) && (obj.$classData.arrayDepth === depth)) && obj.$classData.arrayBase.ancestors.s_util_Either$MergeableEither$)))
});
ScalaJS.asArrayOf.s_util_Either$MergeableEither$ = (function(obj, depth) {
  return ((ScalaJS.isArrayOf.s_util_Either$MergeableEither$(obj, depth) || (obj === null)) ? obj : ScalaJS.throwArrayCastException(obj, "Lscala.util.Either$MergeableEither$;", depth))
});
ScalaJS.d.s_util_Either$MergeableEither$ = new ScalaJS.ClassTypeData({
  s_util_Either$MergeableEither$: 0
}, false, "scala.util.Either$MergeableEither$", ScalaJS.d.O, {
  s_util_Either$MergeableEither$: 1,
  O: 1
});
ScalaJS.c.s_util_Either$MergeableEither$.prototype.$classData = ScalaJS.d.s_util_Either$MergeableEither$;
ScalaJS.n.s_util_Either$MergeableEither = (void 0);
ScalaJS.m.s_util_Either$MergeableEither = (function() {
  if ((!ScalaJS.n.s_util_Either$MergeableEither)) {
    ScalaJS.n.s_util_Either$MergeableEither = new ScalaJS.c.s_util_Either$MergeableEither$().init___()
  };
  return ScalaJS.n.s_util_Either$MergeableEither
});
/** @constructor */
ScalaJS.c.s_util_Either$RightProjection = (function() {
  ScalaJS.c.O.call(this);
  this.e$1 = null
});
ScalaJS.c.s_util_Either$RightProjection.prototype = new ScalaJS.h.O();
ScalaJS.c.s_util_Either$RightProjection.prototype.constructor = ScalaJS.c.s_util_Either$RightProjection;
/** @constructor */
ScalaJS.h.s_util_Either$RightProjection = (function() {
  /*<skip>*/
});
ScalaJS.h.s_util_Either$RightProjection.prototype = ScalaJS.c.s_util_Either$RightProjection.prototype;
ScalaJS.c.s_util_Either$RightProjection.prototype.productPrefix__T = (function() {
  return "RightProjection"
});
ScalaJS.c.s_util_Either$RightProjection.prototype.productArity__I = (function() {
  return 1
});
ScalaJS.c.s_util_Either$RightProjection.prototype.equals__O__Z = (function(x$1) {
  if ((this === x$1)) {
    return true
  } else if (ScalaJS.is.s_util_Either$RightProjection(x$1)) {
    var RightProjection$1 = ScalaJS.as.s_util_Either$RightProjection(x$1);
    return ScalaJS.anyRefEqEq(this.e$1, RightProjection$1.e$1)
  } else {
    return false
  }
});
ScalaJS.c.s_util_Either$RightProjection.prototype.productElement__I__O = (function(x$1) {
  switch (x$1) {
    case 0:
      {
        return this.e$1;
        break
      };
    default:
      throw new ScalaJS.c.jl_IndexOutOfBoundsException().init___T(ScalaJS.objectToString(x$1));
  }
});
ScalaJS.c.s_util_Either$RightProjection.prototype.toString__T = (function() {
  return ScalaJS.m.sr_ScalaRunTime().$$undtoString__s_Product__T(this)
});
ScalaJS.c.s_util_Either$RightProjection.prototype.hashCode__I = (function() {
  var this$2 = ScalaJS.m.s_util_hashing_MurmurHash3();
  return this$2.productHash__s_Product__I__I(this, (-889275714))
});
ScalaJS.c.s_util_Either$RightProjection.prototype.productIterator__sc_Iterator = (function() {
  return new ScalaJS.c.sr_ScalaRunTime$$anon$1().init___s_Product(this)
});
ScalaJS.c.s_util_Either$RightProjection.prototype.init___s_util_Either = (function(e) {
  this.e$1 = e;
  return this
});
ScalaJS.c.s_util_Either$RightProjection.prototype.flatMap__F1__s_util_Either = (function(f) {
  var x1 = this.e$1;
  if (ScalaJS.is.s_util_Left(x1)) {
    var x2 = ScalaJS.as.s_util_Left(x1);
    var a = x2.a$2;
    return new ScalaJS.c.s_util_Left().init___O(a)
  } else if (ScalaJS.is.s_util_Right(x1)) {
    var x3 = ScalaJS.as.s_util_Right(x1);
    var b = x3.b$2;
    return ScalaJS.as.s_util_Either(f.apply__O__O(b))
  } else {
    throw new ScalaJS.c.s_MatchError().init___O(x1)
  }
});
ScalaJS.is.s_util_Either$RightProjection = (function(obj) {
  return (!(!((obj && obj.$classData) && obj.$classData.ancestors.s_util_Either$RightProjection)))
});
ScalaJS.as.s_util_Either$RightProjection = (function(obj) {
  return ((ScalaJS.is.s_util_Either$RightProjection(obj) || (obj === null)) ? obj : ScalaJS.throwClassCastException(obj, "scala.util.Either$RightProjection"))
});
ScalaJS.isArrayOf.s_util_Either$RightProjection = (function(obj, depth) {
  return (!(!(((obj && obj.$classData) && (obj.$classData.arrayDepth === depth)) && obj.$classData.arrayBase.ancestors.s_util_Either$RightProjection)))
});
ScalaJS.asArrayOf.s_util_Either$RightProjection = (function(obj, depth) {
  return ((ScalaJS.isArrayOf.s_util_Either$RightProjection(obj, depth) || (obj === null)) ? obj : ScalaJS.throwArrayCastException(obj, "Lscala.util.Either$RightProjection;", depth))
});
ScalaJS.d.s_util_Either$RightProjection = new ScalaJS.ClassTypeData({
  s_util_Either$RightProjection: 0
}, false, "scala.util.Either$RightProjection", ScalaJS.d.O, {
  s_util_Either$RightProjection: 1,
  s_Serializable: 1,
  Ljava_io_Serializable: 1,
  s_Product: 1,
  s_Equals: 1,
  O: 1
});
ScalaJS.c.s_util_Either$RightProjection.prototype.$classData = ScalaJS.d.s_util_Either$RightProjection;
/** @constructor */
ScalaJS.c.s_util_Left$ = (function() {
  ScalaJS.c.O.call(this)
});
ScalaJS.c.s_util_Left$.prototype = new ScalaJS.h.O();
ScalaJS.c.s_util_Left$.prototype.constructor = ScalaJS.c.s_util_Left$;
/** @constructor */
ScalaJS.h.s_util_Left$ = (function() {
  /*<skip>*/
});
ScalaJS.h.s_util_Left$.prototype = ScalaJS.c.s_util_Left$.prototype;
ScalaJS.c.s_util_Left$.prototype.toString__T = (function() {
  return "Left"
});
ScalaJS.is.s_util_Left$ = (function(obj) {
  return (!(!((obj && obj.$classData) && obj.$classData.ancestors.s_util_Left$)))
});
ScalaJS.as.s_util_Left$ = (function(obj) {
  return ((ScalaJS.is.s_util_Left$(obj) || (obj === null)) ? obj : ScalaJS.throwClassCastException(obj, "scala.util.Left$"))
});
ScalaJS.isArrayOf.s_util_Left$ = (function(obj, depth) {
  return (!(!(((obj && obj.$classData) && (obj.$classData.arrayDepth === depth)) && obj.$classData.arrayBase.ancestors.s_util_Left$)))
});
ScalaJS.asArrayOf.s_util_Left$ = (function(obj, depth) {
  return ((ScalaJS.isArrayOf.s_util_Left$(obj, depth) || (obj === null)) ? obj : ScalaJS.throwArrayCastException(obj, "Lscala.util.Left$;", depth))
});
ScalaJS.d.s_util_Left$ = new ScalaJS.ClassTypeData({
  s_util_Left$: 0
}, false, "scala.util.Left$", ScalaJS.d.O, {
  s_util_Left$: 1,
  s_Serializable: 1,
  Ljava_io_Serializable: 1,
  O: 1
});
ScalaJS.c.s_util_Left$.prototype.$classData = ScalaJS.d.s_util_Left$;
ScalaJS.n.s_util_Left = (void 0);
ScalaJS.m.s_util_Left = (function() {
  if ((!ScalaJS.n.s_util_Left)) {
    ScalaJS.n.s_util_Left = new ScalaJS.c.s_util_Left$().init___()
  };
  return ScalaJS.n.s_util_Left
});
/** @constructor */
ScalaJS.c.s_util_Right$ = (function() {
  ScalaJS.c.O.call(this)
});
ScalaJS.c.s_util_Right$.prototype = new ScalaJS.h.O();
ScalaJS.c.s_util_Right$.prototype.constructor = ScalaJS.c.s_util_Right$;
/** @constructor */
ScalaJS.h.s_util_Right$ = (function() {
  /*<skip>*/
});
ScalaJS.h.s_util_Right$.prototype = ScalaJS.c.s_util_Right$.prototype;
ScalaJS.c.s_util_Right$.prototype.toString__T = (function() {
  return "Right"
});
ScalaJS.is.s_util_Right$ = (function(obj) {
  return (!(!((obj && obj.$classData) && obj.$classData.ancestors.s_util_Right$)))
});
ScalaJS.as.s_util_Right$ = (function(obj) {
  return ((ScalaJS.is.s_util_Right$(obj) || (obj === null)) ? obj : ScalaJS.throwClassCastException(obj, "scala.util.Right$"))
});
ScalaJS.isArrayOf.s_util_Right$ = (function(obj, depth) {
  return (!(!(((obj && obj.$classData) && (obj.$classData.arrayDepth === depth)) && obj.$classData.arrayBase.ancestors.s_util_Right$)))
});
ScalaJS.asArrayOf.s_util_Right$ = (function(obj, depth) {
  return ((ScalaJS.isArrayOf.s_util_Right$(obj, depth) || (obj === null)) ? obj : ScalaJS.throwArrayCastException(obj, "Lscala.util.Right$;", depth))
});
ScalaJS.d.s_util_Right$ = new ScalaJS.ClassTypeData({
  s_util_Right$: 0
}, false, "scala.util.Right$", ScalaJS.d.O, {
  s_util_Right$: 1,
  s_Serializable: 1,
  Ljava_io_Serializable: 1,
  O: 1
});
ScalaJS.c.s_util_Right$.prototype.$classData = ScalaJS.d.s_util_Right$;
ScalaJS.n.s_util_Right = (void 0);
ScalaJS.m.s_util_Right = (function() {
  if ((!ScalaJS.n.s_util_Right)) {
    ScalaJS.n.s_util_Right = new ScalaJS.c.s_util_Right$().init___()
  };
  return ScalaJS.n.s_util_Right
});
/** @constructor */
ScalaJS.c.s_util_Try = (function() {
  ScalaJS.c.O.call(this)
});
ScalaJS.c.s_util_Try.prototype = new ScalaJS.h.O();
ScalaJS.c.s_util_Try.prototype.constructor = ScalaJS.c.s_util_Try;
/** @constructor */
ScalaJS.h.s_util_Try = (function() {
  /*<skip>*/
});
ScalaJS.h.s_util_Try.prototype = ScalaJS.c.s_util_Try.prototype;
ScalaJS.is.s_util_Try = (function(obj) {
  return (!(!((obj && obj.$classData) && obj.$classData.ancestors.s_util_Try)))
});
ScalaJS.as.s_util_Try = (function(obj) {
  return ((ScalaJS.is.s_util_Try(obj) || (obj === null)) ? obj : ScalaJS.throwClassCastException(obj, "scala.util.Try"))
});
ScalaJS.isArrayOf.s_util_Try = (function(obj, depth) {
  return (!(!(((obj && obj.$classData) && (obj.$classData.arrayDepth === depth)) && obj.$classData.arrayBase.ancestors.s_util_Try)))
});
ScalaJS.asArrayOf.s_util_Try = (function(obj, depth) {
  return ((ScalaJS.isArrayOf.s_util_Try(obj, depth) || (obj === null)) ? obj : ScalaJS.throwArrayCastException(obj, "Lscala.util.Try;", depth))
});
ScalaJS.d.s_util_Try = new ScalaJS.ClassTypeData({
  s_util_Try: 0
}, false, "scala.util.Try", ScalaJS.d.O, {
  s_util_Try: 1,
  O: 1
});
ScalaJS.c.s_util_Try.prototype.$classData = ScalaJS.d.s_util_Try;
/** @constructor */
ScalaJS.c.s_util_control_Breaks = (function() {
  ScalaJS.c.O.call(this);
  this.scala$util$control$Breaks$$breakException$1 = null
});
ScalaJS.c.s_util_control_Breaks.prototype = new ScalaJS.h.O();
ScalaJS.c.s_util_control_Breaks.prototype.constructor = ScalaJS.c.s_util_control_Breaks;
/** @constructor */
ScalaJS.h.s_util_control_Breaks = (function() {
  /*<skip>*/
});
ScalaJS.h.s_util_control_Breaks.prototype = ScalaJS.c.s_util_control_Breaks.prototype;
ScalaJS.c.s_util_control_Breaks.prototype.init___ = (function() {
  this.scala$util$control$Breaks$$breakException$1 = new ScalaJS.c.s_util_control_BreakControl().init___();
  return this
});
ScalaJS.is.s_util_control_Breaks = (function(obj) {
  return (!(!((obj && obj.$classData) && obj.$classData.ancestors.s_util_control_Breaks)))
});
ScalaJS.as.s_util_control_Breaks = (function(obj) {
  return ((ScalaJS.is.s_util_control_Breaks(obj) || (obj === null)) ? obj : ScalaJS.throwClassCastException(obj, "scala.util.control.Breaks"))
});
ScalaJS.isArrayOf.s_util_control_Breaks = (function(obj, depth) {
  return (!(!(((obj && obj.$classData) && (obj.$classData.arrayDepth === depth)) && obj.$classData.arrayBase.ancestors.s_util_control_Breaks)))
});
ScalaJS.asArrayOf.s_util_control_Breaks = (function(obj, depth) {
  return ((ScalaJS.isArrayOf.s_util_control_Breaks(obj, depth) || (obj === null)) ? obj : ScalaJS.throwArrayCastException(obj, "Lscala.util.control.Breaks;", depth))
});
ScalaJS.d.s_util_control_Breaks = new ScalaJS.ClassTypeData({
  s_util_control_Breaks: 0
}, false, "scala.util.control.Breaks", ScalaJS.d.O, {
  s_util_control_Breaks: 1,
  O: 1
});
ScalaJS.c.s_util_control_Breaks.prototype.$classData = ScalaJS.d.s_util_control_Breaks;
ScalaJS.is.s_util_control_ControlThrowable = (function(obj) {
  return (!(!((obj && obj.$classData) && obj.$classData.ancestors.s_util_control_ControlThrowable)))
});
ScalaJS.as.s_util_control_ControlThrowable = (function(obj) {
  return ((ScalaJS.is.s_util_control_ControlThrowable(obj) || (obj === null)) ? obj : ScalaJS.throwClassCastException(obj, "scala.util.control.ControlThrowable"))
});
ScalaJS.isArrayOf.s_util_control_ControlThrowable = (function(obj, depth) {
  return (!(!(((obj && obj.$classData) && (obj.$classData.arrayDepth === depth)) && obj.$classData.arrayBase.ancestors.s_util_control_ControlThrowable)))
});
ScalaJS.asArrayOf.s_util_control_ControlThrowable = (function(obj, depth) {
  return ((ScalaJS.isArrayOf.s_util_control_ControlThrowable(obj, depth) || (obj === null)) ? obj : ScalaJS.throwArrayCastException(obj, "Lscala.util.control.ControlThrowable;", depth))
});
ScalaJS.d.s_util_control_ControlThrowable = new ScalaJS.ClassTypeData({
  s_util_control_ControlThrowable: 0
}, true, "scala.util.control.ControlThrowable", (void 0), {
  s_util_control_ControlThrowable: 1,
  s_util_control_NoStackTrace: 1,
  O: 1
});
/** @constructor */
ScalaJS.c.s_util_control_NoStackTrace$ = (function() {
  ScalaJS.c.O.call(this);
  this.$$undnoSuppression$1 = false
});
ScalaJS.c.s_util_control_NoStackTrace$.prototype = new ScalaJS.h.O();
ScalaJS.c.s_util_control_NoStackTrace$.prototype.constructor = ScalaJS.c.s_util_control_NoStackTrace$;
/** @constructor */
ScalaJS.h.s_util_control_NoStackTrace$ = (function() {
  /*<skip>*/
});
ScalaJS.h.s_util_control_NoStackTrace$.prototype = ScalaJS.c.s_util_control_NoStackTrace$.prototype;
ScalaJS.c.s_util_control_NoStackTrace$.prototype.init___ = (function() {
  ScalaJS.n.s_util_control_NoStackTrace = this;
  this.$$undnoSuppression$1 = false;
  return this
});
ScalaJS.is.s_util_control_NoStackTrace$ = (function(obj) {
  return (!(!((obj && obj.$classData) && obj.$classData.ancestors.s_util_control_NoStackTrace$)))
});
ScalaJS.as.s_util_control_NoStackTrace$ = (function(obj) {
  return ((ScalaJS.is.s_util_control_NoStackTrace$(obj) || (obj === null)) ? obj : ScalaJS.throwClassCastException(obj, "scala.util.control.NoStackTrace$"))
});
ScalaJS.isArrayOf.s_util_control_NoStackTrace$ = (function(obj, depth) {
  return (!(!(((obj && obj.$classData) && (obj.$classData.arrayDepth === depth)) && obj.$classData.arrayBase.ancestors.s_util_control_NoStackTrace$)))
});
ScalaJS.asArrayOf.s_util_control_NoStackTrace$ = (function(obj, depth) {
  return ((ScalaJS.isArrayOf.s_util_control_NoStackTrace$(obj, depth) || (obj === null)) ? obj : ScalaJS.throwArrayCastException(obj, "Lscala.util.control.NoStackTrace$;", depth))
});
ScalaJS.d.s_util_control_NoStackTrace$ = new ScalaJS.ClassTypeData({
  s_util_control_NoStackTrace$: 0
}, false, "scala.util.control.NoStackTrace$", ScalaJS.d.O, {
  s_util_control_NoStackTrace$: 1,
  s_Serializable: 1,
  Ljava_io_Serializable: 1,
  O: 1
});
ScalaJS.c.s_util_control_NoStackTrace$.prototype.$classData = ScalaJS.d.s_util_control_NoStackTrace$;
ScalaJS.n.s_util_control_NoStackTrace = (void 0);
ScalaJS.m.s_util_control_NoStackTrace = (function() {
  if ((!ScalaJS.n.s_util_control_NoStackTrace)) {
    ScalaJS.n.s_util_control_NoStackTrace = new ScalaJS.c.s_util_control_NoStackTrace$().init___()
  };
  return ScalaJS.n.s_util_control_NoStackTrace
});
/** @constructor */
ScalaJS.c.s_util_control_NonFatal$ = (function() {
  ScalaJS.c.O.call(this)
});
ScalaJS.c.s_util_control_NonFatal$.prototype = new ScalaJS.h.O();
ScalaJS.c.s_util_control_NonFatal$.prototype.constructor = ScalaJS.c.s_util_control_NonFatal$;
/** @constructor */
ScalaJS.h.s_util_control_NonFatal$ = (function() {
  /*<skip>*/
});
ScalaJS.h.s_util_control_NonFatal$.prototype = ScalaJS.c.s_util_control_NonFatal$.prototype;
ScalaJS.c.s_util_control_NonFatal$.prototype.apply__jl_Throwable__Z = (function(t) {
  return (!(ScalaJS.is.jl_VirtualMachineError(t) || (ScalaJS.is.jl_ThreadDeath(t) || (ScalaJS.is.jl_InterruptedException(t) || (ScalaJS.is.jl_LinkageError(t) || ScalaJS.is.s_util_control_ControlThrowable(t))))))
});
ScalaJS.c.s_util_control_NonFatal$.prototype.unapply__jl_Throwable__s_Option = (function(t) {
  return (this.apply__jl_Throwable__Z(t) ? new ScalaJS.c.s_Some().init___O(t) : ScalaJS.m.s_None())
});
ScalaJS.is.s_util_control_NonFatal$ = (function(obj) {
  return (!(!((obj && obj.$classData) && obj.$classData.ancestors.s_util_control_NonFatal$)))
});
ScalaJS.as.s_util_control_NonFatal$ = (function(obj) {
  return ((ScalaJS.is.s_util_control_NonFatal$(obj) || (obj === null)) ? obj : ScalaJS.throwClassCastException(obj, "scala.util.control.NonFatal$"))
});
ScalaJS.isArrayOf.s_util_control_NonFatal$ = (function(obj, depth) {
  return (!(!(((obj && obj.$classData) && (obj.$classData.arrayDepth === depth)) && obj.$classData.arrayBase.ancestors.s_util_control_NonFatal$)))
});
ScalaJS.asArrayOf.s_util_control_NonFatal$ = (function(obj, depth) {
  return ((ScalaJS.isArrayOf.s_util_control_NonFatal$(obj, depth) || (obj === null)) ? obj : ScalaJS.throwArrayCastException(obj, "Lscala.util.control.NonFatal$;", depth))
});
ScalaJS.d.s_util_control_NonFatal$ = new ScalaJS.ClassTypeData({
  s_util_control_NonFatal$: 0
}, false, "scala.util.control.NonFatal$", ScalaJS.d.O, {
  s_util_control_NonFatal$: 1,
  O: 1
});
ScalaJS.c.s_util_control_NonFatal$.prototype.$classData = ScalaJS.d.s_util_control_NonFatal$;
ScalaJS.n.s_util_control_NonFatal = (void 0);
ScalaJS.m.s_util_control_NonFatal = (function() {
  if ((!ScalaJS.n.s_util_control_NonFatal)) {
    ScalaJS.n.s_util_control_NonFatal = new ScalaJS.c.s_util_control_NonFatal$().init___()
  };
  return ScalaJS.n.s_util_control_NonFatal
});
/** @constructor */
ScalaJS.c.s_util_hashing_MurmurHash3 = (function() {
  ScalaJS.c.O.call(this)
});
ScalaJS.c.s_util_hashing_MurmurHash3.prototype = new ScalaJS.h.O();
ScalaJS.c.s_util_hashing_MurmurHash3.prototype.constructor = ScalaJS.c.s_util_hashing_MurmurHash3;
/** @constructor */
ScalaJS.h.s_util_hashing_MurmurHash3 = (function() {
  /*<skip>*/
});
ScalaJS.h.s_util_hashing_MurmurHash3.prototype = ScalaJS.c.s_util_hashing_MurmurHash3.prototype;
ScalaJS.c.s_util_hashing_MurmurHash3.prototype.mixLast__I__I__I = (function(hash, data) {
  var k = data;
  k = ScalaJS.imul(k, (-862048943));
  k = ScalaJS.m.jl_Integer().rotateLeft__I__I__I(k, 15);
  k = ScalaJS.imul(k, 461845907);
  return (hash ^ k)
});
ScalaJS.c.s_util_hashing_MurmurHash3.prototype.mix__I__I__I = (function(hash, data) {
  var h = this.mixLast__I__I__I(hash, data);
  h = ScalaJS.m.jl_Integer().rotateLeft__I__I__I(h, 13);
  return ((ScalaJS.imul(h, 5) + (-430675100)) | 0)
});
ScalaJS.c.s_util_hashing_MurmurHash3.prototype.avalanche__p1__I__I = (function(hash) {
  var h = hash;
  h = (h ^ ((h >>> 16) | 0));
  h = ScalaJS.imul(h, (-2048144789));
  h = (h ^ ((h >>> 13) | 0));
  h = ScalaJS.imul(h, (-1028477387));
  h = (h ^ ((h >>> 16) | 0));
  return h
});
ScalaJS.c.s_util_hashing_MurmurHash3.prototype.unorderedHash__sc_TraversableOnce__I__I = (function(xs, seed) {
  var a = new ScalaJS.c.sr_IntRef().init___I(0);
  var b = new ScalaJS.c.sr_IntRef().init___I(0);
  var n = new ScalaJS.c.sr_IntRef().init___I(0);
  var c = new ScalaJS.c.sr_IntRef().init___I(1);
  xs.foreach__F1__V(new ScalaJS.c.sjsr_AnonFunction1().init___sjs_js_Function1((function(this$2$1, a$1, b$1, n$1, c$1) {
    return (function(x$2) {
      var h = ScalaJS.m.sr_ScalaRunTime().hash__O__I(x$2);
      a$1.elem$1 = ((a$1.elem$1 + h) | 0);
      b$1.elem$1 = (b$1.elem$1 ^ h);
      if ((h !== 0)) {
        c$1.elem$1 = ScalaJS.imul(c$1.elem$1, h)
      };
      n$1.elem$1 = ((n$1.elem$1 + 1) | 0)
    })
  })(this, a, b, n, c)));
  var h$1 = seed;
  h$1 = this.mix__I__I__I(h$1, a.elem$1);
  h$1 = this.mix__I__I__I(h$1, b.elem$1);
  h$1 = this.mixLast__I__I__I(h$1, c.elem$1);
  return this.finalizeHash__I__I__I(h$1, n.elem$1)
});
ScalaJS.c.s_util_hashing_MurmurHash3.prototype.productHash__s_Product__I__I = (function(x, seed) {
  var arr = x.productArity__I();
  if ((arr === 0)) {
    return ScalaJS.objectHashCode(x.productPrefix__T())
  } else {
    var h = seed;
    var i = 0;
    while ((i < arr)) {
      h = this.mix__I__I__I(h, ScalaJS.m.sr_ScalaRunTime().hash__O__I(x.productElement__I__O(i)));
      i = ((i + 1) | 0)
    };
    return this.finalizeHash__I__I__I(h, arr)
  }
});
ScalaJS.c.s_util_hashing_MurmurHash3.prototype.finalizeHash__I__I__I = (function(hash, length) {
  return this.avalanche__p1__I__I((hash ^ length))
});
ScalaJS.c.s_util_hashing_MurmurHash3.prototype.orderedHash__sc_TraversableOnce__I__I = (function(xs, seed) {
  var n = new ScalaJS.c.sr_IntRef().init___I(0);
  var h = new ScalaJS.c.sr_IntRef().init___I(seed);
  xs.foreach__F1__V(new ScalaJS.c.sjsr_AnonFunction1().init___sjs_js_Function1((function(this$2$1, n$1, h$1) {
    return (function(x$2) {
      h$1.elem$1 = this$2$1.mix__I__I__I(h$1.elem$1, ScalaJS.m.sr_ScalaRunTime().hash__O__I(x$2));
      n$1.elem$1 = ((n$1.elem$1 + 1) | 0)
    })
  })(this, n, h)));
  return this.finalizeHash__I__I__I(h.elem$1, n.elem$1)
});
ScalaJS.c.s_util_hashing_MurmurHash3.prototype.listHash__sci_List__I__I = (function(xs, seed) {
  var n = 0;
  var h = seed;
  var elems = xs;
  while ((!elems.isEmpty__Z())) {
    var head = elems.head__O();
    var tail = ScalaJS.as.sci_List(elems.tail__O());
    h = this.mix__I__I__I(h, ScalaJS.m.sr_ScalaRunTime().hash__O__I(head));
    n = ((n + 1) | 0);
    elems = tail
  };
  return this.finalizeHash__I__I__I(h, n)
});
ScalaJS.is.s_util_hashing_MurmurHash3 = (function(obj) {
  return (!(!((obj && obj.$classData) && obj.$classData.ancestors.s_util_hashing_MurmurHash3)))
});
ScalaJS.as.s_util_hashing_MurmurHash3 = (function(obj) {
  return ((ScalaJS.is.s_util_hashing_MurmurHash3(obj) || (obj === null)) ? obj : ScalaJS.throwClassCastException(obj, "scala.util.hashing.MurmurHash3"))
});
ScalaJS.isArrayOf.s_util_hashing_MurmurHash3 = (function(obj, depth) {
  return (!(!(((obj && obj.$classData) && (obj.$classData.arrayDepth === depth)) && obj.$classData.arrayBase.ancestors.s_util_hashing_MurmurHash3)))
});
ScalaJS.asArrayOf.s_util_hashing_MurmurHash3 = (function(obj, depth) {
  return ((ScalaJS.isArrayOf.s_util_hashing_MurmurHash3(obj, depth) || (obj === null)) ? obj : ScalaJS.throwArrayCastException(obj, "Lscala.util.hashing.MurmurHash3;", depth))
});
ScalaJS.d.s_util_hashing_MurmurHash3 = new ScalaJS.ClassTypeData({
  s_util_hashing_MurmurHash3: 0
}, false, "scala.util.hashing.MurmurHash3", ScalaJS.d.O, {
  s_util_hashing_MurmurHash3: 1,
  O: 1
});
ScalaJS.c.s_util_hashing_MurmurHash3.prototype.$classData = ScalaJS.d.s_util_hashing_MurmurHash3;
/** @constructor */
ScalaJS.c.s_util_hashing_package$ = (function() {
  ScalaJS.c.O.call(this)
});
ScalaJS.c.s_util_hashing_package$.prototype = new ScalaJS.h.O();
ScalaJS.c.s_util_hashing_package$.prototype.constructor = ScalaJS.c.s_util_hashing_package$;
/** @constructor */
ScalaJS.h.s_util_hashing_package$ = (function() {
  /*<skip>*/
});
ScalaJS.h.s_util_hashing_package$.prototype = ScalaJS.c.s_util_hashing_package$.prototype;
ScalaJS.c.s_util_hashing_package$.prototype.byteswap32__I__I = (function(v) {
  var hc = ScalaJS.imul(v, (-1640532531));
  hc = ScalaJS.m.jl_Integer().reverseBytes__I__I(hc);
  return ScalaJS.imul(hc, (-1640532531))
});
ScalaJS.is.s_util_hashing_package$ = (function(obj) {
  return (!(!((obj && obj.$classData) && obj.$classData.ancestors.s_util_hashing_package$)))
});
ScalaJS.as.s_util_hashing_package$ = (function(obj) {
  return ((ScalaJS.is.s_util_hashing_package$(obj) || (obj === null)) ? obj : ScalaJS.throwClassCastException(obj, "scala.util.hashing.package$"))
});
ScalaJS.isArrayOf.s_util_hashing_package$ = (function(obj, depth) {
  return (!(!(((obj && obj.$classData) && (obj.$classData.arrayDepth === depth)) && obj.$classData.arrayBase.ancestors.s_util_hashing_package$)))
});
ScalaJS.asArrayOf.s_util_hashing_package$ = (function(obj, depth) {
  return ((ScalaJS.isArrayOf.s_util_hashing_package$(obj, depth) || (obj === null)) ? obj : ScalaJS.throwArrayCastException(obj, "Lscala.util.hashing.package$;", depth))
});
ScalaJS.d.s_util_hashing_package$ = new ScalaJS.ClassTypeData({
  s_util_hashing_package$: 0
}, false, "scala.util.hashing.package$", ScalaJS.d.O, {
  s_util_hashing_package$: 1,
  O: 1
});
ScalaJS.c.s_util_hashing_package$.prototype.$classData = ScalaJS.d.s_util_hashing_package$;
ScalaJS.n.s_util_hashing_package = (void 0);
ScalaJS.m.s_util_hashing_package = (function() {
  if ((!ScalaJS.n.s_util_hashing_package)) {
    ScalaJS.n.s_util_hashing_package = new ScalaJS.c.s_util_hashing_package$().init___()
  };
  return ScalaJS.n.s_util_hashing_package
});
/** @constructor */
ScalaJS.c.sc_$colon$plus$ = (function() {
  ScalaJS.c.O.call(this)
});
ScalaJS.c.sc_$colon$plus$.prototype = new ScalaJS.h.O();
ScalaJS.c.sc_$colon$plus$.prototype.constructor = ScalaJS.c.sc_$colon$plus$;
/** @constructor */
ScalaJS.h.sc_$colon$plus$ = (function() {
  /*<skip>*/
});
ScalaJS.h.sc_$colon$plus$.prototype = ScalaJS.c.sc_$colon$plus$.prototype;
ScalaJS.is.sc_$colon$plus$ = (function(obj) {
  return (!(!((obj && obj.$classData) && obj.$classData.ancestors.sc_$colon$plus$)))
});
ScalaJS.as.sc_$colon$plus$ = (function(obj) {
  return ((ScalaJS.is.sc_$colon$plus$(obj) || (obj === null)) ? obj : ScalaJS.throwClassCastException(obj, "scala.collection.$colon$plus$"))
});
ScalaJS.isArrayOf.sc_$colon$plus$ = (function(obj, depth) {
  return (!(!(((obj && obj.$classData) && (obj.$classData.arrayDepth === depth)) && obj.$classData.arrayBase.ancestors.sc_$colon$plus$)))
});
ScalaJS.asArrayOf.sc_$colon$plus$ = (function(obj, depth) {
  return ((ScalaJS.isArrayOf.sc_$colon$plus$(obj, depth) || (obj === null)) ? obj : ScalaJS.throwArrayCastException(obj, "Lscala.collection.$colon$plus$;", depth))
});
ScalaJS.d.sc_$colon$plus$ = new ScalaJS.ClassTypeData({
  sc_$colon$plus$: 0
}, false, "scala.collection.$colon$plus$", ScalaJS.d.O, {
  sc_$colon$plus$: 1,
  O: 1
});
ScalaJS.c.sc_$colon$plus$.prototype.$classData = ScalaJS.d.sc_$colon$plus$;
ScalaJS.n.sc_$colon$plus = (void 0);
ScalaJS.m.sc_$colon$plus = (function() {
  if ((!ScalaJS.n.sc_$colon$plus)) {
    ScalaJS.n.sc_$colon$plus = new ScalaJS.c.sc_$colon$plus$().init___()
  };
  return ScalaJS.n.sc_$colon$plus
});
/** @constructor */
ScalaJS.c.sc_$plus$colon$ = (function() {
  ScalaJS.c.O.call(this)
});
ScalaJS.c.sc_$plus$colon$.prototype = new ScalaJS.h.O();
ScalaJS.c.sc_$plus$colon$.prototype.constructor = ScalaJS.c.sc_$plus$colon$;
/** @constructor */
ScalaJS.h.sc_$plus$colon$ = (function() {
  /*<skip>*/
});
ScalaJS.h.sc_$plus$colon$.prototype = ScalaJS.c.sc_$plus$colon$.prototype;
ScalaJS.is.sc_$plus$colon$ = (function(obj) {
  return (!(!((obj && obj.$classData) && obj.$classData.ancestors.sc_$plus$colon$)))
});
ScalaJS.as.sc_$plus$colon$ = (function(obj) {
  return ((ScalaJS.is.sc_$plus$colon$(obj) || (obj === null)) ? obj : ScalaJS.throwClassCastException(obj, "scala.collection.$plus$colon$"))
});
ScalaJS.isArrayOf.sc_$plus$colon$ = (function(obj, depth) {
  return (!(!(((obj && obj.$classData) && (obj.$classData.arrayDepth === depth)) && obj.$classData.arrayBase.ancestors.sc_$plus$colon$)))
});
ScalaJS.asArrayOf.sc_$plus$colon$ = (function(obj, depth) {
  return ((ScalaJS.isArrayOf.sc_$plus$colon$(obj, depth) || (obj === null)) ? obj : ScalaJS.throwArrayCastException(obj, "Lscala.collection.$plus$colon$;", depth))
});
ScalaJS.d.sc_$plus$colon$ = new ScalaJS.ClassTypeData({
  sc_$plus$colon$: 0
}, false, "scala.collection.$plus$colon$", ScalaJS.d.O, {
  sc_$plus$colon$: 1,
  O: 1
});
ScalaJS.c.sc_$plus$colon$.prototype.$classData = ScalaJS.d.sc_$plus$colon$;
ScalaJS.n.sc_$plus$colon = (void 0);
ScalaJS.m.sc_$plus$colon = (function() {
  if ((!ScalaJS.n.sc_$plus$colon)) {
    ScalaJS.n.sc_$plus$colon = new ScalaJS.c.sc_$plus$colon$().init___()
  };
  return ScalaJS.n.sc_$plus$colon
});
/** @constructor */
ScalaJS.c.sc_AbstractIterator = (function() {
  ScalaJS.c.O.call(this)
});
ScalaJS.c.sc_AbstractIterator.prototype = new ScalaJS.h.O();
ScalaJS.c.sc_AbstractIterator.prototype.constructor = ScalaJS.c.sc_AbstractIterator;
/** @constructor */
ScalaJS.h.sc_AbstractIterator = (function() {
  /*<skip>*/
});
ScalaJS.h.sc_AbstractIterator.prototype = ScalaJS.c.sc_AbstractIterator.prototype;
ScalaJS.c.sc_AbstractIterator.prototype.seq__sc_TraversableOnce = (function() {
  return this
});
ScalaJS.c.sc_AbstractIterator.prototype.copyToArray__O__I__V = (function(xs, start) {
  ScalaJS.i.sc_TraversableOnce$class__copyToArray__sc_TraversableOnce__O__I__V(this, xs, start)
});
ScalaJS.c.sc_AbstractIterator.prototype.init___ = (function() {
  return this
});
ScalaJS.c.sc_AbstractIterator.prototype.toList__sci_List = (function() {
  var this$1 = ScalaJS.m.sci_List();
  var cbf = this$1.ReusableCBFInstance$2;
  return ScalaJS.as.sci_List(ScalaJS.i.sc_TraversableOnce$class__to__sc_TraversableOnce__scg_CanBuildFrom__O(this, cbf))
});
ScalaJS.c.sc_AbstractIterator.prototype.isEmpty__Z = (function() {
  return ScalaJS.i.sc_Iterator$class__isEmpty__sc_Iterator__Z(this)
});
ScalaJS.c.sc_AbstractIterator.prototype.toString__T = (function() {
  return ScalaJS.i.sc_Iterator$class__toString__sc_Iterator__T(this)
});
ScalaJS.c.sc_AbstractIterator.prototype.foreach__F1__V = (function(f) {
  ScalaJS.i.sc_Iterator$class__foreach__sc_Iterator__F1__V(this, f)
});
ScalaJS.c.sc_AbstractIterator.prototype.toBuffer__scm_Buffer = (function() {
  var this$1 = ScalaJS.m.scm_ArrayBuffer();
  var cbf = this$1.ReusableCBFInstance$2;
  return ScalaJS.as.scm_Buffer(ScalaJS.i.sc_TraversableOnce$class__to__sc_TraversableOnce__scg_CanBuildFrom__O(this, cbf))
});
ScalaJS.c.sc_AbstractIterator.prototype.size__I = (function() {
  return ScalaJS.i.sc_TraversableOnce$class__size__sc_TraversableOnce__I(this)
});
ScalaJS.c.sc_AbstractIterator.prototype.toStream__sci_Stream = (function() {
  return ScalaJS.i.sc_Iterator$class__toStream__sc_Iterator__sci_Stream(this)
});
ScalaJS.c.sc_AbstractIterator.prototype.addString__scm_StringBuilder__T__T__T__scm_StringBuilder = (function(b, start, sep, end) {
  return ScalaJS.i.sc_TraversableOnce$class__addString__sc_TraversableOnce__scm_StringBuilder__T__T__T__scm_StringBuilder(this, b, start, sep, end)
});
ScalaJS.c.sc_AbstractIterator.prototype.$$div$colon__O__F2__O = (function(z, op) {
  return ScalaJS.i.sc_TraversableOnce$class__foldLeft__sc_TraversableOnce__O__F2__O(this, z, op)
});
ScalaJS.c.sc_AbstractIterator.prototype.isTraversableAgain__Z = (function() {
  return false
});
ScalaJS.c.sc_AbstractIterator.prototype.copyToArray__O__I__I__V = (function(xs, start, len) {
  ScalaJS.i.sc_Iterator$class__copyToArray__sc_Iterator__O__I__I__V(this, xs, start, len)
});
ScalaJS.c.sc_AbstractIterator.prototype.toArray__s_reflect_ClassTag__O = (function(evidence$1) {
  return ScalaJS.i.sc_TraversableOnce$class__toArray__sc_TraversableOnce__s_reflect_ClassTag__O(this, evidence$1)
});
ScalaJS.is.sc_AbstractIterator = (function(obj) {
  return (!(!((obj && obj.$classData) && obj.$classData.ancestors.sc_AbstractIterator)))
});
ScalaJS.as.sc_AbstractIterator = (function(obj) {
  return ((ScalaJS.is.sc_AbstractIterator(obj) || (obj === null)) ? obj : ScalaJS.throwClassCastException(obj, "scala.collection.AbstractIterator"))
});
ScalaJS.isArrayOf.sc_AbstractIterator = (function(obj, depth) {
  return (!(!(((obj && obj.$classData) && (obj.$classData.arrayDepth === depth)) && obj.$classData.arrayBase.ancestors.sc_AbstractIterator)))
});
ScalaJS.asArrayOf.sc_AbstractIterator = (function(obj, depth) {
  return ((ScalaJS.isArrayOf.sc_AbstractIterator(obj, depth) || (obj === null)) ? obj : ScalaJS.throwArrayCastException(obj, "Lscala.collection.AbstractIterator;", depth))
});
ScalaJS.d.sc_AbstractIterator = new ScalaJS.ClassTypeData({
  sc_AbstractIterator: 0
}, false, "scala.collection.AbstractIterator", ScalaJS.d.O, {
  sc_AbstractIterator: 1,
  sc_Iterator: 1,
  sc_TraversableOnce: 1,
  sc_GenTraversableOnce: 1,
  O: 1
});
ScalaJS.c.sc_AbstractIterator.prototype.$classData = ScalaJS.d.sc_AbstractIterator;
/** @constructor */
ScalaJS.c.sc_AbstractTraversable = (function() {
  ScalaJS.c.O.call(this)
});
ScalaJS.c.sc_AbstractTraversable.prototype = new ScalaJS.h.O();
ScalaJS.c.sc_AbstractTraversable.prototype.constructor = ScalaJS.c.sc_AbstractTraversable;
/** @constructor */
ScalaJS.h.sc_AbstractTraversable = (function() {
  /*<skip>*/
});
ScalaJS.h.sc_AbstractTraversable.prototype = ScalaJS.c.sc_AbstractTraversable.prototype;
ScalaJS.c.sc_AbstractTraversable.prototype.copyToArray__O__I__V = (function(xs, start) {
  ScalaJS.i.sc_TraversableOnce$class__copyToArray__sc_TraversableOnce__O__I__V(this, xs, start)
});
ScalaJS.c.sc_AbstractTraversable.prototype.toList__sci_List = (function() {
  var this$1 = ScalaJS.m.sci_List();
  var cbf = this$1.ReusableCBFInstance$2;
  return ScalaJS.as.sci_List(ScalaJS.i.sc_TraversableLike$class__to__sc_TraversableLike__scg_CanBuildFrom__O(this, cbf))
});
ScalaJS.c.sc_AbstractTraversable.prototype.mkString__T__T__T__T = (function(start, sep, end) {
  return ScalaJS.i.sc_TraversableOnce$class__mkString__sc_TraversableOnce__T__T__T__T(this, start, sep, end)
});
ScalaJS.c.sc_AbstractTraversable.prototype.foldLeft__O__F2__O = (function(z, op) {
  return ScalaJS.i.sc_TraversableOnce$class__foldLeft__sc_TraversableOnce__O__F2__O(this, z, op)
});
ScalaJS.c.sc_AbstractTraversable.prototype.filter__F1__O = (function(p) {
  return ScalaJS.i.sc_TraversableLike$class__filterImpl__sc_TraversableLike__F1__Z__O(this, p, false)
});
ScalaJS.c.sc_AbstractTraversable.prototype.toBuffer__scm_Buffer = (function() {
  var this$1 = ScalaJS.m.scm_ArrayBuffer();
  var cbf = this$1.ReusableCBFInstance$2;
  return ScalaJS.as.scm_Buffer(ScalaJS.i.sc_TraversableLike$class__to__sc_TraversableLike__scg_CanBuildFrom__O(this, cbf))
});
ScalaJS.c.sc_AbstractTraversable.prototype.addString__scm_StringBuilder__T__T__T__scm_StringBuilder = (function(b, start, sep, end) {
  return ScalaJS.i.sc_TraversableOnce$class__addString__sc_TraversableOnce__scm_StringBuilder__T__T__T__scm_StringBuilder(this, b, start, sep, end)
});
ScalaJS.c.sc_AbstractTraversable.prototype.repr__O = (function() {
  return this
});
ScalaJS.c.sc_AbstractTraversable.prototype.$$div$colon__O__F2__O = (function(z, op) {
  return this.foldLeft__O__F2__O(z, op)
});
ScalaJS.c.sc_AbstractTraversable.prototype.isTraversableAgain__Z = (function() {
  return true
});
ScalaJS.c.sc_AbstractTraversable.prototype.toArray__s_reflect_ClassTag__O = (function(evidence$1) {
  return ScalaJS.i.sc_TraversableOnce$class__toArray__sc_TraversableOnce__s_reflect_ClassTag__O(this, evidence$1)
});
ScalaJS.c.sc_AbstractTraversable.prototype.map__F1__scg_CanBuildFrom__O = (function(f, bf) {
  return ScalaJS.i.sc_TraversableLike$class__map__sc_TraversableLike__F1__scg_CanBuildFrom__O(this, f, bf)
});
ScalaJS.c.sc_AbstractTraversable.prototype.nonEmpty__Z = (function() {
  return ScalaJS.i.sc_TraversableOnce$class__nonEmpty__sc_TraversableOnce__Z(this)
});
ScalaJS.c.sc_AbstractTraversable.prototype.newBuilder__scm_Builder = (function() {
  return this.companion__scg_GenericCompanion().newBuilder__scm_Builder()
});
ScalaJS.c.sc_AbstractTraversable.prototype.stringPrefix__T = (function() {
  return ScalaJS.i.sc_TraversableLike$class__stringPrefix__sc_TraversableLike__T(this)
});
ScalaJS.is.sc_AbstractTraversable = (function(obj) {
  return (!(!((obj && obj.$classData) && obj.$classData.ancestors.sc_AbstractTraversable)))
});
ScalaJS.as.sc_AbstractTraversable = (function(obj) {
  return ((ScalaJS.is.sc_AbstractTraversable(obj) || (obj === null)) ? obj : ScalaJS.throwClassCastException(obj, "scala.collection.AbstractTraversable"))
});
ScalaJS.isArrayOf.sc_AbstractTraversable = (function(obj, depth) {
  return (!(!(((obj && obj.$classData) && (obj.$classData.arrayDepth === depth)) && obj.$classData.arrayBase.ancestors.sc_AbstractTraversable)))
});
ScalaJS.asArrayOf.sc_AbstractTraversable = (function(obj, depth) {
  return ((ScalaJS.isArrayOf.sc_AbstractTraversable(obj, depth) || (obj === null)) ? obj : ScalaJS.throwArrayCastException(obj, "Lscala.collection.AbstractTraversable;", depth))
});
ScalaJS.d.sc_AbstractTraversable = new ScalaJS.ClassTypeData({
  sc_AbstractTraversable: 0
}, false, "scala.collection.AbstractTraversable", ScalaJS.d.O, {
  sc_AbstractTraversable: 1,
  sc_Traversable: 1,
  sc_GenTraversable: 1,
  scg_GenericTraversableTemplate: 1,
  sc_TraversableLike: 1,
  sc_GenTraversableLike: 1,
  sc_Parallelizable: 1,
  sc_TraversableOnce: 1,
  sc_GenTraversableOnce: 1,
  scg_FilterMonadic: 1,
  scg_HasNewBuilder: 1,
  O: 1
});
ScalaJS.c.sc_AbstractTraversable.prototype.$classData = ScalaJS.d.sc_AbstractTraversable;
ScalaJS.is.sc_GenMap = (function(obj) {
  return (!(!((obj && obj.$classData) && obj.$classData.ancestors.sc_GenMap)))
});
ScalaJS.as.sc_GenMap = (function(obj) {
  return ((ScalaJS.is.sc_GenMap(obj) || (obj === null)) ? obj : ScalaJS.throwClassCastException(obj, "scala.collection.GenMap"))
});
ScalaJS.isArrayOf.sc_GenMap = (function(obj, depth) {
  return (!(!(((obj && obj.$classData) && (obj.$classData.arrayDepth === depth)) && obj.$classData.arrayBase.ancestors.sc_GenMap)))
});
ScalaJS.asArrayOf.sc_GenMap = (function(obj, depth) {
  return ((ScalaJS.isArrayOf.sc_GenMap(obj, depth) || (obj === null)) ? obj : ScalaJS.throwArrayCastException(obj, "Lscala.collection.GenMap;", depth))
});
ScalaJS.d.sc_GenMap = new ScalaJS.ClassTypeData({
  sc_GenMap: 0
}, true, "scala.collection.GenMap", (void 0), {
  sc_GenMap: 1,
  sc_GenIterable: 1,
  sc_GenTraversable: 1,
  scg_GenericTraversableTemplate: 1,
  scg_HasNewBuilder: 1,
  sc_GenMapLike: 1,
  s_Equals: 1,
  sc_GenIterableLike: 1,
  sc_GenTraversableLike: 1,
  sc_Parallelizable: 1,
  sc_GenTraversableOnce: 1,
  O: 1
});
ScalaJS.is.sc_GenSeq = (function(obj) {
  return (!(!((obj && obj.$classData) && obj.$classData.ancestors.sc_GenSeq)))
});
ScalaJS.as.sc_GenSeq = (function(obj) {
  return ((ScalaJS.is.sc_GenSeq(obj) || (obj === null)) ? obj : ScalaJS.throwClassCastException(obj, "scala.collection.GenSeq"))
});
ScalaJS.isArrayOf.sc_GenSeq = (function(obj, depth) {
  return (!(!(((obj && obj.$classData) && (obj.$classData.arrayDepth === depth)) && obj.$classData.arrayBase.ancestors.sc_GenSeq)))
});
ScalaJS.asArrayOf.sc_GenSeq = (function(obj, depth) {
  return ((ScalaJS.isArrayOf.sc_GenSeq(obj, depth) || (obj === null)) ? obj : ScalaJS.throwArrayCastException(obj, "Lscala.collection.GenSeq;", depth))
});
ScalaJS.d.sc_GenSeq = new ScalaJS.ClassTypeData({
  sc_GenSeq: 0
}, true, "scala.collection.GenSeq", (void 0), {
  sc_GenSeq: 1,
  sc_GenIterable: 1,
  sc_GenTraversable: 1,
  scg_GenericTraversableTemplate: 1,
  scg_HasNewBuilder: 1,
  sc_GenSeqLike: 1,
  s_Equals: 1,
  sc_GenIterableLike: 1,
  sc_GenTraversableLike: 1,
  sc_Parallelizable: 1,
  sc_GenTraversableOnce: 1,
  O: 1
});
ScalaJS.is.sc_GenSet = (function(obj) {
  return (!(!((obj && obj.$classData) && obj.$classData.ancestors.sc_GenSet)))
});
ScalaJS.as.sc_GenSet = (function(obj) {
  return ((ScalaJS.is.sc_GenSet(obj) || (obj === null)) ? obj : ScalaJS.throwClassCastException(obj, "scala.collection.GenSet"))
});
ScalaJS.isArrayOf.sc_GenSet = (function(obj, depth) {
  return (!(!(((obj && obj.$classData) && (obj.$classData.arrayDepth === depth)) && obj.$classData.arrayBase.ancestors.sc_GenSet)))
});
ScalaJS.asArrayOf.sc_GenSet = (function(obj, depth) {
  return ((ScalaJS.isArrayOf.sc_GenSet(obj, depth) || (obj === null)) ? obj : ScalaJS.throwArrayCastException(obj, "Lscala.collection.GenSet;", depth))
});
ScalaJS.d.sc_GenSet = new ScalaJS.ClassTypeData({
  sc_GenSet: 0
}, true, "scala.collection.GenSet", (void 0), {
  sc_GenSet: 1,
  scg_GenericSetTemplate: 1,
  sc_GenIterable: 1,
  sc_GenTraversable: 1,
  scg_GenericTraversableTemplate: 1,
  scg_HasNewBuilder: 1,
  sc_GenSetLike: 1,
  s_Equals: 1,
  F1: 1,
  sc_GenIterableLike: 1,
  sc_GenTraversableLike: 1,
  sc_Parallelizable: 1,
  sc_GenTraversableOnce: 1,
  O: 1
});
ScalaJS.is.sc_GenTraversable = (function(obj) {
  return (!(!((obj && obj.$classData) && obj.$classData.ancestors.sc_GenTraversable)))
});
ScalaJS.as.sc_GenTraversable = (function(obj) {
  return ((ScalaJS.is.sc_GenTraversable(obj) || (obj === null)) ? obj : ScalaJS.throwClassCastException(obj, "scala.collection.GenTraversable"))
});
ScalaJS.isArrayOf.sc_GenTraversable = (function(obj, depth) {
  return (!(!(((obj && obj.$classData) && (obj.$classData.arrayDepth === depth)) && obj.$classData.arrayBase.ancestors.sc_GenTraversable)))
});
ScalaJS.asArrayOf.sc_GenTraversable = (function(obj, depth) {
  return ((ScalaJS.isArrayOf.sc_GenTraversable(obj, depth) || (obj === null)) ? obj : ScalaJS.throwArrayCastException(obj, "Lscala.collection.GenTraversable;", depth))
});
ScalaJS.d.sc_GenTraversable = new ScalaJS.ClassTypeData({
  sc_GenTraversable: 0
}, true, "scala.collection.GenTraversable", (void 0), {
  sc_GenTraversable: 1,
  scg_GenericTraversableTemplate: 1,
  scg_HasNewBuilder: 1,
  sc_GenTraversableLike: 1,
  sc_Parallelizable: 1,
  sc_GenTraversableOnce: 1,
  O: 1
});
ScalaJS.is.sc_GenTraversableOnce = (function(obj) {
  return (!(!((obj && obj.$classData) && obj.$classData.ancestors.sc_GenTraversableOnce)))
});
ScalaJS.as.sc_GenTraversableOnce = (function(obj) {
  return ((ScalaJS.is.sc_GenTraversableOnce(obj) || (obj === null)) ? obj : ScalaJS.throwClassCastException(obj, "scala.collection.GenTraversableOnce"))
});
ScalaJS.isArrayOf.sc_GenTraversableOnce = (function(obj, depth) {
  return (!(!(((obj && obj.$classData) && (obj.$classData.arrayDepth === depth)) && obj.$classData.arrayBase.ancestors.sc_GenTraversableOnce)))
});
ScalaJS.asArrayOf.sc_GenTraversableOnce = (function(obj, depth) {
  return ((ScalaJS.isArrayOf.sc_GenTraversableOnce(obj, depth) || (obj === null)) ? obj : ScalaJS.throwArrayCastException(obj, "Lscala.collection.GenTraversableOnce;", depth))
});
ScalaJS.d.sc_GenTraversableOnce = new ScalaJS.ClassTypeData({
  sc_GenTraversableOnce: 0
}, true, "scala.collection.GenTraversableOnce", (void 0), {
  sc_GenTraversableOnce: 1,
  O: 1
});
ScalaJS.is.sc_IndexedSeq = (function(obj) {
  return (!(!((obj && obj.$classData) && obj.$classData.ancestors.sc_IndexedSeq)))
});
ScalaJS.as.sc_IndexedSeq = (function(obj) {
  return ((ScalaJS.is.sc_IndexedSeq(obj) || (obj === null)) ? obj : ScalaJS.throwClassCastException(obj, "scala.collection.IndexedSeq"))
});
ScalaJS.isArrayOf.sc_IndexedSeq = (function(obj, depth) {
  return (!(!(((obj && obj.$classData) && (obj.$classData.arrayDepth === depth)) && obj.$classData.arrayBase.ancestors.sc_IndexedSeq)))
});
ScalaJS.asArrayOf.sc_IndexedSeq = (function(obj, depth) {
  return ((ScalaJS.isArrayOf.sc_IndexedSeq(obj, depth) || (obj === null)) ? obj : ScalaJS.throwArrayCastException(obj, "Lscala.collection.IndexedSeq;", depth))
});
ScalaJS.d.sc_IndexedSeq = new ScalaJS.ClassTypeData({
  sc_IndexedSeq: 0
}, true, "scala.collection.IndexedSeq", (void 0), {
  sc_IndexedSeq: 1,
  sc_IndexedSeqLike: 1,
  sc_Seq: 1,
  sc_SeqLike: 1,
  sc_GenSeq: 1,
  sc_GenSeqLike: 1,
  sc_Iterable: 1,
  sc_IterableLike: 1,
  s_Equals: 1,
  sc_GenIterable: 1,
  sc_GenIterableLike: 1,
  sc_Traversable: 1,
  sc_GenTraversable: 1,
  scg_GenericTraversableTemplate: 1,
  sc_TraversableLike: 1,
  sc_GenTraversableLike: 1,
  sc_Parallelizable: 1,
  sc_TraversableOnce: 1,
  sc_GenTraversableOnce: 1,
  scg_FilterMonadic: 1,
  scg_HasNewBuilder: 1,
  s_PartialFunction: 1,
  F1: 1,
  O: 1
});
ScalaJS.is.sc_IndexedSeqLike = (function(obj) {
  return (!(!((obj && obj.$classData) && obj.$classData.ancestors.sc_IndexedSeqLike)))
});
ScalaJS.as.sc_IndexedSeqLike = (function(obj) {
  return ((ScalaJS.is.sc_IndexedSeqLike(obj) || (obj === null)) ? obj : ScalaJS.throwClassCastException(obj, "scala.collection.IndexedSeqLike"))
});
ScalaJS.isArrayOf.sc_IndexedSeqLike = (function(obj, depth) {
  return (!(!(((obj && obj.$classData) && (obj.$classData.arrayDepth === depth)) && obj.$classData.arrayBase.ancestors.sc_IndexedSeqLike)))
});
ScalaJS.asArrayOf.sc_IndexedSeqLike = (function(obj, depth) {
  return ((ScalaJS.isArrayOf.sc_IndexedSeqLike(obj, depth) || (obj === null)) ? obj : ScalaJS.throwArrayCastException(obj, "Lscala.collection.IndexedSeqLike;", depth))
});
ScalaJS.d.sc_IndexedSeqLike = new ScalaJS.ClassTypeData({
  sc_IndexedSeqLike: 0
}, true, "scala.collection.IndexedSeqLike", (void 0), {
  sc_IndexedSeqLike: 1,
  sc_SeqLike: 1,
  sc_GenSeqLike: 1,
  sc_IterableLike: 1,
  sc_GenIterableLike: 1,
  sc_TraversableLike: 1,
  sc_GenTraversableLike: 1,
  sc_Parallelizable: 1,
  sc_TraversableOnce: 1,
  sc_GenTraversableOnce: 1,
  scg_FilterMonadic: 1,
  scg_HasNewBuilder: 1,
  s_Equals: 1,
  O: 1
});
ScalaJS.is.sc_Iterable = (function(obj) {
  return (!(!((obj && obj.$classData) && obj.$classData.ancestors.sc_Iterable)))
});
ScalaJS.as.sc_Iterable = (function(obj) {
  return ((ScalaJS.is.sc_Iterable(obj) || (obj === null)) ? obj : ScalaJS.throwClassCastException(obj, "scala.collection.Iterable"))
});
ScalaJS.isArrayOf.sc_Iterable = (function(obj, depth) {
  return (!(!(((obj && obj.$classData) && (obj.$classData.arrayDepth === depth)) && obj.$classData.arrayBase.ancestors.sc_Iterable)))
});
ScalaJS.asArrayOf.sc_Iterable = (function(obj, depth) {
  return ((ScalaJS.isArrayOf.sc_Iterable(obj, depth) || (obj === null)) ? obj : ScalaJS.throwArrayCastException(obj, "Lscala.collection.Iterable;", depth))
});
ScalaJS.d.sc_Iterable = new ScalaJS.ClassTypeData({
  sc_Iterable: 0
}, true, "scala.collection.Iterable", (void 0), {
  sc_Iterable: 1,
  sc_IterableLike: 1,
  s_Equals: 1,
  sc_GenIterable: 1,
  sc_GenIterableLike: 1,
  sc_Traversable: 1,
  sc_GenTraversable: 1,
  scg_GenericTraversableTemplate: 1,
  sc_TraversableLike: 1,
  sc_GenTraversableLike: 1,
  sc_Parallelizable: 1,
  sc_TraversableOnce: 1,
  sc_GenTraversableOnce: 1,
  scg_FilterMonadic: 1,
  scg_HasNewBuilder: 1,
  O: 1
});
/** @constructor */
ScalaJS.c.sc_Iterator$ = (function() {
  ScalaJS.c.O.call(this);
  this.empty$1 = null
});
ScalaJS.c.sc_Iterator$.prototype = new ScalaJS.h.O();
ScalaJS.c.sc_Iterator$.prototype.constructor = ScalaJS.c.sc_Iterator$;
/** @constructor */
ScalaJS.h.sc_Iterator$ = (function() {
  /*<skip>*/
});
ScalaJS.h.sc_Iterator$.prototype = ScalaJS.c.sc_Iterator$.prototype;
ScalaJS.c.sc_Iterator$.prototype.init___ = (function() {
  ScalaJS.n.sc_Iterator = this;
  this.empty$1 = new ScalaJS.c.sc_Iterator$$anon$2().init___();
  return this
});
ScalaJS.is.sc_Iterator$ = (function(obj) {
  return (!(!((obj && obj.$classData) && obj.$classData.ancestors.sc_Iterator$)))
});
ScalaJS.as.sc_Iterator$ = (function(obj) {
  return ((ScalaJS.is.sc_Iterator$(obj) || (obj === null)) ? obj : ScalaJS.throwClassCastException(obj, "scala.collection.Iterator$"))
});
ScalaJS.isArrayOf.sc_Iterator$ = (function(obj, depth) {
  return (!(!(((obj && obj.$classData) && (obj.$classData.arrayDepth === depth)) && obj.$classData.arrayBase.ancestors.sc_Iterator$)))
});
ScalaJS.asArrayOf.sc_Iterator$ = (function(obj, depth) {
  return ((ScalaJS.isArrayOf.sc_Iterator$(obj, depth) || (obj === null)) ? obj : ScalaJS.throwArrayCastException(obj, "Lscala.collection.Iterator$;", depth))
});
ScalaJS.d.sc_Iterator$ = new ScalaJS.ClassTypeData({
  sc_Iterator$: 0
}, false, "scala.collection.Iterator$", ScalaJS.d.O, {
  sc_Iterator$: 1,
  O: 1
});
ScalaJS.c.sc_Iterator$.prototype.$classData = ScalaJS.d.sc_Iterator$;
ScalaJS.n.sc_Iterator = (void 0);
ScalaJS.m.sc_Iterator = (function() {
  if ((!ScalaJS.n.sc_Iterator)) {
    ScalaJS.n.sc_Iterator = new ScalaJS.c.sc_Iterator$().init___()
  };
  return ScalaJS.n.sc_Iterator
});
ScalaJS.is.sc_LinearSeq = (function(obj) {
  return (!(!((obj && obj.$classData) && obj.$classData.ancestors.sc_LinearSeq)))
});
ScalaJS.as.sc_LinearSeq = (function(obj) {
  return ((ScalaJS.is.sc_LinearSeq(obj) || (obj === null)) ? obj : ScalaJS.throwClassCastException(obj, "scala.collection.LinearSeq"))
});
ScalaJS.isArrayOf.sc_LinearSeq = (function(obj, depth) {
  return (!(!(((obj && obj.$classData) && (obj.$classData.arrayDepth === depth)) && obj.$classData.arrayBase.ancestors.sc_LinearSeq)))
});
ScalaJS.asArrayOf.sc_LinearSeq = (function(obj, depth) {
  return ((ScalaJS.isArrayOf.sc_LinearSeq(obj, depth) || (obj === null)) ? obj : ScalaJS.throwArrayCastException(obj, "Lscala.collection.LinearSeq;", depth))
});
ScalaJS.d.sc_LinearSeq = new ScalaJS.ClassTypeData({
  sc_LinearSeq: 0
}, true, "scala.collection.LinearSeq", (void 0), {
  sc_LinearSeq: 1,
  sc_LinearSeqLike: 1,
  sc_Seq: 1,
  sc_SeqLike: 1,
  sc_GenSeq: 1,
  sc_GenSeqLike: 1,
  sc_Iterable: 1,
  sc_IterableLike: 1,
  s_Equals: 1,
  sc_GenIterable: 1,
  sc_GenIterableLike: 1,
  sc_Traversable: 1,
  sc_GenTraversable: 1,
  scg_GenericTraversableTemplate: 1,
  sc_TraversableLike: 1,
  sc_GenTraversableLike: 1,
  sc_Parallelizable: 1,
  sc_TraversableOnce: 1,
  sc_GenTraversableOnce: 1,
  scg_FilterMonadic: 1,
  scg_HasNewBuilder: 1,
  s_PartialFunction: 1,
  F1: 1,
  O: 1
});
ScalaJS.is.sc_LinearSeqLike = (function(obj) {
  return (!(!((obj && obj.$classData) && obj.$classData.ancestors.sc_LinearSeqLike)))
});
ScalaJS.as.sc_LinearSeqLike = (function(obj) {
  return ((ScalaJS.is.sc_LinearSeqLike(obj) || (obj === null)) ? obj : ScalaJS.throwClassCastException(obj, "scala.collection.LinearSeqLike"))
});
ScalaJS.isArrayOf.sc_LinearSeqLike = (function(obj, depth) {
  return (!(!(((obj && obj.$classData) && (obj.$classData.arrayDepth === depth)) && obj.$classData.arrayBase.ancestors.sc_LinearSeqLike)))
});
ScalaJS.asArrayOf.sc_LinearSeqLike = (function(obj, depth) {
  return ((ScalaJS.isArrayOf.sc_LinearSeqLike(obj, depth) || (obj === null)) ? obj : ScalaJS.throwArrayCastException(obj, "Lscala.collection.LinearSeqLike;", depth))
});
ScalaJS.d.sc_LinearSeqLike = new ScalaJS.ClassTypeData({
  sc_LinearSeqLike: 0
}, true, "scala.collection.LinearSeqLike", (void 0), {
  sc_LinearSeqLike: 1,
  sc_SeqLike: 1,
  sc_GenSeqLike: 1,
  sc_IterableLike: 1,
  sc_GenIterableLike: 1,
  sc_TraversableLike: 1,
  sc_GenTraversableLike: 1,
  sc_Parallelizable: 1,
  sc_TraversableOnce: 1,
  sc_GenTraversableOnce: 1,
  scg_FilterMonadic: 1,
  scg_HasNewBuilder: 1,
  s_Equals: 1,
  O: 1
});
ScalaJS.is.sc_LinearSeqOptimized = (function(obj) {
  return (!(!((obj && obj.$classData) && obj.$classData.ancestors.sc_LinearSeqOptimized)))
});
ScalaJS.as.sc_LinearSeqOptimized = (function(obj) {
  return ((ScalaJS.is.sc_LinearSeqOptimized(obj) || (obj === null)) ? obj : ScalaJS.throwClassCastException(obj, "scala.collection.LinearSeqOptimized"))
});
ScalaJS.isArrayOf.sc_LinearSeqOptimized = (function(obj, depth) {
  return (!(!(((obj && obj.$classData) && (obj.$classData.arrayDepth === depth)) && obj.$classData.arrayBase.ancestors.sc_LinearSeqOptimized)))
});
ScalaJS.asArrayOf.sc_LinearSeqOptimized = (function(obj, depth) {
  return ((ScalaJS.isArrayOf.sc_LinearSeqOptimized(obj, depth) || (obj === null)) ? obj : ScalaJS.throwArrayCastException(obj, "Lscala.collection.LinearSeqOptimized;", depth))
});
ScalaJS.d.sc_LinearSeqOptimized = new ScalaJS.ClassTypeData({
  sc_LinearSeqOptimized: 0
}, true, "scala.collection.LinearSeqOptimized", (void 0), {
  sc_LinearSeqOptimized: 1,
  sc_LinearSeqLike: 1,
  sc_SeqLike: 1,
  sc_GenSeqLike: 1,
  sc_IterableLike: 1,
  sc_GenIterableLike: 1,
  sc_TraversableLike: 1,
  sc_GenTraversableLike: 1,
  sc_Parallelizable: 1,
  sc_TraversableOnce: 1,
  sc_GenTraversableOnce: 1,
  scg_FilterMonadic: 1,
  scg_HasNewBuilder: 1,
  s_Equals: 1,
  O: 1
});
ScalaJS.is.sc_Map = (function(obj) {
  return (!(!((obj && obj.$classData) && obj.$classData.ancestors.sc_Map)))
});
ScalaJS.as.sc_Map = (function(obj) {
  return ((ScalaJS.is.sc_Map(obj) || (obj === null)) ? obj : ScalaJS.throwClassCastException(obj, "scala.collection.Map"))
});
ScalaJS.isArrayOf.sc_Map = (function(obj, depth) {
  return (!(!(((obj && obj.$classData) && (obj.$classData.arrayDepth === depth)) && obj.$classData.arrayBase.ancestors.sc_Map)))
});
ScalaJS.asArrayOf.sc_Map = (function(obj, depth) {
  return ((ScalaJS.isArrayOf.sc_Map(obj, depth) || (obj === null)) ? obj : ScalaJS.throwArrayCastException(obj, "Lscala.collection.Map;", depth))
});
ScalaJS.d.sc_Map = new ScalaJS.ClassTypeData({
  sc_Map: 0
}, true, "scala.collection.Map", (void 0), {
  sc_Map: 1,
  sc_MapLike: 1,
  scg_Subtractable: 1,
  s_PartialFunction: 1,
  F1: 1,
  sc_GenMap: 1,
  sc_GenMapLike: 1,
  sc_Iterable: 1,
  sc_IterableLike: 1,
  s_Equals: 1,
  sc_GenIterable: 1,
  sc_GenIterableLike: 1,
  sc_Traversable: 1,
  sc_GenTraversable: 1,
  scg_GenericTraversableTemplate: 1,
  sc_TraversableLike: 1,
  sc_GenTraversableLike: 1,
  sc_Parallelizable: 1,
  sc_TraversableOnce: 1,
  sc_GenTraversableOnce: 1,
  scg_FilterMonadic: 1,
  scg_HasNewBuilder: 1,
  O: 1
});
ScalaJS.is.sc_Seq = (function(obj) {
  return (!(!((obj && obj.$classData) && obj.$classData.ancestors.sc_Seq)))
});
ScalaJS.as.sc_Seq = (function(obj) {
  return ((ScalaJS.is.sc_Seq(obj) || (obj === null)) ? obj : ScalaJS.throwClassCastException(obj, "scala.collection.Seq"))
});
ScalaJS.isArrayOf.sc_Seq = (function(obj, depth) {
  return (!(!(((obj && obj.$classData) && (obj.$classData.arrayDepth === depth)) && obj.$classData.arrayBase.ancestors.sc_Seq)))
});
ScalaJS.asArrayOf.sc_Seq = (function(obj, depth) {
  return ((ScalaJS.isArrayOf.sc_Seq(obj, depth) || (obj === null)) ? obj : ScalaJS.throwArrayCastException(obj, "Lscala.collection.Seq;", depth))
});
ScalaJS.d.sc_Seq = new ScalaJS.ClassTypeData({
  sc_Seq: 0
}, true, "scala.collection.Seq", (void 0), {
  sc_Seq: 1,
  sc_SeqLike: 1,
  sc_GenSeq: 1,
  sc_GenSeqLike: 1,
  sc_Iterable: 1,
  sc_IterableLike: 1,
  s_Equals: 1,
  sc_GenIterable: 1,
  sc_GenIterableLike: 1,
  sc_Traversable: 1,
  sc_GenTraversable: 1,
  scg_GenericTraversableTemplate: 1,
  sc_TraversableLike: 1,
  sc_GenTraversableLike: 1,
  sc_Parallelizable: 1,
  sc_TraversableOnce: 1,
  sc_GenTraversableOnce: 1,
  scg_FilterMonadic: 1,
  scg_HasNewBuilder: 1,
  s_PartialFunction: 1,
  F1: 1,
  O: 1
});
ScalaJS.is.sc_Set = (function(obj) {
  return (!(!((obj && obj.$classData) && obj.$classData.ancestors.sc_Set)))
});
ScalaJS.as.sc_Set = (function(obj) {
  return ((ScalaJS.is.sc_Set(obj) || (obj === null)) ? obj : ScalaJS.throwClassCastException(obj, "scala.collection.Set"))
});
ScalaJS.isArrayOf.sc_Set = (function(obj, depth) {
  return (!(!(((obj && obj.$classData) && (obj.$classData.arrayDepth === depth)) && obj.$classData.arrayBase.ancestors.sc_Set)))
});
ScalaJS.asArrayOf.sc_Set = (function(obj, depth) {
  return ((ScalaJS.isArrayOf.sc_Set(obj, depth) || (obj === null)) ? obj : ScalaJS.throwArrayCastException(obj, "Lscala.collection.Set;", depth))
});
ScalaJS.d.sc_Set = new ScalaJS.ClassTypeData({
  sc_Set: 0
}, true, "scala.collection.Set", (void 0), {
  sc_Set: 1,
  sc_SetLike: 1,
  scg_Subtractable: 1,
  sc_GenSet: 1,
  scg_GenericSetTemplate: 1,
  sc_GenSetLike: 1,
  sc_Iterable: 1,
  sc_IterableLike: 1,
  s_Equals: 1,
  sc_GenIterable: 1,
  sc_GenIterableLike: 1,
  sc_Traversable: 1,
  sc_GenTraversable: 1,
  scg_GenericTraversableTemplate: 1,
  sc_TraversableLike: 1,
  sc_GenTraversableLike: 1,
  sc_Parallelizable: 1,
  sc_TraversableOnce: 1,
  sc_GenTraversableOnce: 1,
  scg_FilterMonadic: 1,
  scg_HasNewBuilder: 1,
  F1: 1,
  O: 1
});
ScalaJS.is.sc_SetLike = (function(obj) {
  return (!(!((obj && obj.$classData) && obj.$classData.ancestors.sc_SetLike)))
});
ScalaJS.as.sc_SetLike = (function(obj) {
  return ((ScalaJS.is.sc_SetLike(obj) || (obj === null)) ? obj : ScalaJS.throwClassCastException(obj, "scala.collection.SetLike"))
});
ScalaJS.isArrayOf.sc_SetLike = (function(obj, depth) {
  return (!(!(((obj && obj.$classData) && (obj.$classData.arrayDepth === depth)) && obj.$classData.arrayBase.ancestors.sc_SetLike)))
});
ScalaJS.asArrayOf.sc_SetLike = (function(obj, depth) {
  return ((ScalaJS.isArrayOf.sc_SetLike(obj, depth) || (obj === null)) ? obj : ScalaJS.throwArrayCastException(obj, "Lscala.collection.SetLike;", depth))
});
ScalaJS.d.sc_SetLike = new ScalaJS.ClassTypeData({
  sc_SetLike: 0
}, true, "scala.collection.SetLike", (void 0), {
  sc_SetLike: 1,
  scg_Subtractable: 1,
  sc_GenSetLike: 1,
  F1: 1,
  sc_IterableLike: 1,
  sc_GenIterableLike: 1,
  sc_TraversableLike: 1,
  sc_GenTraversableLike: 1,
  sc_Parallelizable: 1,
  sc_TraversableOnce: 1,
  sc_GenTraversableOnce: 1,
  scg_FilterMonadic: 1,
  scg_HasNewBuilder: 1,
  s_Equals: 1,
  O: 1
});
ScalaJS.is.sc_TraversableLike = (function(obj) {
  return (!(!((obj && obj.$classData) && obj.$classData.ancestors.sc_TraversableLike)))
});
ScalaJS.as.sc_TraversableLike = (function(obj) {
  return ((ScalaJS.is.sc_TraversableLike(obj) || (obj === null)) ? obj : ScalaJS.throwClassCastException(obj, "scala.collection.TraversableLike"))
});
ScalaJS.isArrayOf.sc_TraversableLike = (function(obj, depth) {
  return (!(!(((obj && obj.$classData) && (obj.$classData.arrayDepth === depth)) && obj.$classData.arrayBase.ancestors.sc_TraversableLike)))
});
ScalaJS.asArrayOf.sc_TraversableLike = (function(obj, depth) {
  return ((ScalaJS.isArrayOf.sc_TraversableLike(obj, depth) || (obj === null)) ? obj : ScalaJS.throwArrayCastException(obj, "Lscala.collection.TraversableLike;", depth))
});
ScalaJS.d.sc_TraversableLike = new ScalaJS.ClassTypeData({
  sc_TraversableLike: 0
}, true, "scala.collection.TraversableLike", (void 0), {
  sc_TraversableLike: 1,
  sc_GenTraversableLike: 1,
  sc_Parallelizable: 1,
  sc_TraversableOnce: 1,
  sc_GenTraversableOnce: 1,
  scg_FilterMonadic: 1,
  scg_HasNewBuilder: 1,
  O: 1
});
ScalaJS.is.sc_TraversableOnce = (function(obj) {
  return (!(!((obj && obj.$classData) && obj.$classData.ancestors.sc_TraversableOnce)))
});
ScalaJS.as.sc_TraversableOnce = (function(obj) {
  return ((ScalaJS.is.sc_TraversableOnce(obj) || (obj === null)) ? obj : ScalaJS.throwClassCastException(obj, "scala.collection.TraversableOnce"))
});
ScalaJS.isArrayOf.sc_TraversableOnce = (function(obj, depth) {
  return (!(!(((obj && obj.$classData) && (obj.$classData.arrayDepth === depth)) && obj.$classData.arrayBase.ancestors.sc_TraversableOnce)))
});
ScalaJS.asArrayOf.sc_TraversableOnce = (function(obj, depth) {
  return ((ScalaJS.isArrayOf.sc_TraversableOnce(obj, depth) || (obj === null)) ? obj : ScalaJS.throwArrayCastException(obj, "Lscala.collection.TraversableOnce;", depth))
});
ScalaJS.d.sc_TraversableOnce = new ScalaJS.ClassTypeData({
  sc_TraversableOnce: 0
}, true, "scala.collection.TraversableOnce", (void 0), {
  sc_TraversableOnce: 1,
  sc_GenTraversableOnce: 1,
  O: 1
});
/** @constructor */
ScalaJS.c.scg_GenMapFactory = (function() {
  ScalaJS.c.O.call(this)
});
ScalaJS.c.scg_GenMapFactory.prototype = new ScalaJS.h.O();
ScalaJS.c.scg_GenMapFactory.prototype.constructor = ScalaJS.c.scg_GenMapFactory;
/** @constructor */
ScalaJS.h.scg_GenMapFactory = (function() {
  /*<skip>*/
});
ScalaJS.h.scg_GenMapFactory.prototype = ScalaJS.c.scg_GenMapFactory.prototype;
ScalaJS.c.scg_GenMapFactory.prototype.apply__sc_Seq__sc_GenMap = (function(elems) {
  var this$1 = new ScalaJS.c.scm_MapBuilder().init___sc_GenMap(this.empty__sc_GenMap());
  return ScalaJS.as.sc_GenMap(ScalaJS.as.scm_Builder(ScalaJS.i.scg_Growable$class__$plus$plus$eq__scg_Growable__sc_TraversableOnce__scg_Growable(this$1, elems)).result__O())
});
ScalaJS.is.scg_GenMapFactory = (function(obj) {
  return (!(!((obj && obj.$classData) && obj.$classData.ancestors.scg_GenMapFactory)))
});
ScalaJS.as.scg_GenMapFactory = (function(obj) {
  return ((ScalaJS.is.scg_GenMapFactory(obj) || (obj === null)) ? obj : ScalaJS.throwClassCastException(obj, "scala.collection.generic.GenMapFactory"))
});
ScalaJS.isArrayOf.scg_GenMapFactory = (function(obj, depth) {
  return (!(!(((obj && obj.$classData) && (obj.$classData.arrayDepth === depth)) && obj.$classData.arrayBase.ancestors.scg_GenMapFactory)))
});
ScalaJS.asArrayOf.scg_GenMapFactory = (function(obj, depth) {
  return ((ScalaJS.isArrayOf.scg_GenMapFactory(obj, depth) || (obj === null)) ? obj : ScalaJS.throwArrayCastException(obj, "Lscala.collection.generic.GenMapFactory;", depth))
});
ScalaJS.d.scg_GenMapFactory = new ScalaJS.ClassTypeData({
  scg_GenMapFactory: 0
}, false, "scala.collection.generic.GenMapFactory", ScalaJS.d.O, {
  scg_GenMapFactory: 1,
  O: 1
});
ScalaJS.c.scg_GenMapFactory.prototype.$classData = ScalaJS.d.scg_GenMapFactory;
/** @constructor */
ScalaJS.c.scg_GenMapFactory$MapCanBuildFrom = (function() {
  ScalaJS.c.O.call(this);
  this.$$outer$f = null
});
ScalaJS.c.scg_GenMapFactory$MapCanBuildFrom.prototype = new ScalaJS.h.O();
ScalaJS.c.scg_GenMapFactory$MapCanBuildFrom.prototype.constructor = ScalaJS.c.scg_GenMapFactory$MapCanBuildFrom;
/** @constructor */
ScalaJS.h.scg_GenMapFactory$MapCanBuildFrom = (function() {
  /*<skip>*/
});
ScalaJS.h.scg_GenMapFactory$MapCanBuildFrom.prototype = ScalaJS.c.scg_GenMapFactory$MapCanBuildFrom.prototype;
ScalaJS.c.scg_GenMapFactory$MapCanBuildFrom.prototype.apply__scm_Builder = (function() {
  var this$1 = this.$$outer$f;
  return new ScalaJS.c.scm_MapBuilder().init___sc_GenMap(this$1.empty__sc_GenMap())
});
ScalaJS.c.scg_GenMapFactory$MapCanBuildFrom.prototype.apply__O__scm_Builder = (function(from) {
  ScalaJS.as.sc_GenMap(from);
  var this$1 = this.$$outer$f;
  return new ScalaJS.c.scm_MapBuilder().init___sc_GenMap(this$1.empty__sc_GenMap())
});
ScalaJS.c.scg_GenMapFactory$MapCanBuildFrom.prototype.init___scg_GenMapFactory = (function($$outer) {
  if (($$outer === null)) {
    throw ScalaJS.unwrapJavaScriptException(null)
  } else {
    this.$$outer$f = $$outer
  };
  return this
});
ScalaJS.is.scg_GenMapFactory$MapCanBuildFrom = (function(obj) {
  return (!(!((obj && obj.$classData) && obj.$classData.ancestors.scg_GenMapFactory$MapCanBuildFrom)))
});
ScalaJS.as.scg_GenMapFactory$MapCanBuildFrom = (function(obj) {
  return ((ScalaJS.is.scg_GenMapFactory$MapCanBuildFrom(obj) || (obj === null)) ? obj : ScalaJS.throwClassCastException(obj, "scala.collection.generic.GenMapFactory$MapCanBuildFrom"))
});
ScalaJS.isArrayOf.scg_GenMapFactory$MapCanBuildFrom = (function(obj, depth) {
  return (!(!(((obj && obj.$classData) && (obj.$classData.arrayDepth === depth)) && obj.$classData.arrayBase.ancestors.scg_GenMapFactory$MapCanBuildFrom)))
});
ScalaJS.asArrayOf.scg_GenMapFactory$MapCanBuildFrom = (function(obj, depth) {
  return ((ScalaJS.isArrayOf.scg_GenMapFactory$MapCanBuildFrom(obj, depth) || (obj === null)) ? obj : ScalaJS.throwArrayCastException(obj, "Lscala.collection.generic.GenMapFactory$MapCanBuildFrom;", depth))
});
ScalaJS.d.scg_GenMapFactory$MapCanBuildFrom = new ScalaJS.ClassTypeData({
  scg_GenMapFactory$MapCanBuildFrom: 0
}, false, "scala.collection.generic.GenMapFactory$MapCanBuildFrom", ScalaJS.d.O, {
  scg_GenMapFactory$MapCanBuildFrom: 1,
  scg_CanBuildFrom: 1,
  O: 1
});
ScalaJS.c.scg_GenMapFactory$MapCanBuildFrom.prototype.$classData = ScalaJS.d.scg_GenMapFactory$MapCanBuildFrom;
/** @constructor */
ScalaJS.c.scg_GenTraversableFactory$GenericCanBuildFrom = (function() {
  ScalaJS.c.O.call(this);
  this.$$outer$f = null
});
ScalaJS.c.scg_GenTraversableFactory$GenericCanBuildFrom.prototype = new ScalaJS.h.O();
ScalaJS.c.scg_GenTraversableFactory$GenericCanBuildFrom.prototype.constructor = ScalaJS.c.scg_GenTraversableFactory$GenericCanBuildFrom;
/** @constructor */
ScalaJS.h.scg_GenTraversableFactory$GenericCanBuildFrom = (function() {
  /*<skip>*/
});
ScalaJS.h.scg_GenTraversableFactory$GenericCanBuildFrom.prototype = ScalaJS.c.scg_GenTraversableFactory$GenericCanBuildFrom.prototype;
ScalaJS.c.scg_GenTraversableFactory$GenericCanBuildFrom.prototype.apply__scm_Builder = (function() {
  return this.$$outer$f.newBuilder__scm_Builder()
});
ScalaJS.c.scg_GenTraversableFactory$GenericCanBuildFrom.prototype.apply__O__scm_Builder = (function(from) {
  var from$1 = ScalaJS.as.sc_GenTraversable(from);
  return from$1.companion__scg_GenericCompanion().newBuilder__scm_Builder()
});
ScalaJS.c.scg_GenTraversableFactory$GenericCanBuildFrom.prototype.init___scg_GenTraversableFactory = (function($$outer) {
  if (($$outer === null)) {
    throw ScalaJS.unwrapJavaScriptException(null)
  } else {
    this.$$outer$f = $$outer
  };
  return this
});
ScalaJS.is.scg_GenTraversableFactory$GenericCanBuildFrom = (function(obj) {
  return (!(!((obj && obj.$classData) && obj.$classData.ancestors.scg_GenTraversableFactory$GenericCanBuildFrom)))
});
ScalaJS.as.scg_GenTraversableFactory$GenericCanBuildFrom = (function(obj) {
  return ((ScalaJS.is.scg_GenTraversableFactory$GenericCanBuildFrom(obj) || (obj === null)) ? obj : ScalaJS.throwClassCastException(obj, "scala.collection.generic.GenTraversableFactory$GenericCanBuildFrom"))
});
ScalaJS.isArrayOf.scg_GenTraversableFactory$GenericCanBuildFrom = (function(obj, depth) {
  return (!(!(((obj && obj.$classData) && (obj.$classData.arrayDepth === depth)) && obj.$classData.arrayBase.ancestors.scg_GenTraversableFactory$GenericCanBuildFrom)))
});
ScalaJS.asArrayOf.scg_GenTraversableFactory$GenericCanBuildFrom = (function(obj, depth) {
  return ((ScalaJS.isArrayOf.scg_GenTraversableFactory$GenericCanBuildFrom(obj, depth) || (obj === null)) ? obj : ScalaJS.throwArrayCastException(obj, "Lscala.collection.generic.GenTraversableFactory$GenericCanBuildFrom;", depth))
});
ScalaJS.d.scg_GenTraversableFactory$GenericCanBuildFrom = new ScalaJS.ClassTypeData({
  scg_GenTraversableFactory$GenericCanBuildFrom: 0
}, false, "scala.collection.generic.GenTraversableFactory$GenericCanBuildFrom", ScalaJS.d.O, {
  scg_GenTraversableFactory$GenericCanBuildFrom: 1,
  scg_CanBuildFrom: 1,
  O: 1
});
ScalaJS.c.scg_GenTraversableFactory$GenericCanBuildFrom.prototype.$classData = ScalaJS.d.scg_GenTraversableFactory$GenericCanBuildFrom;
/** @constructor */
ScalaJS.c.scg_GenericCompanion = (function() {
  ScalaJS.c.O.call(this)
});
ScalaJS.c.scg_GenericCompanion.prototype = new ScalaJS.h.O();
ScalaJS.c.scg_GenericCompanion.prototype.constructor = ScalaJS.c.scg_GenericCompanion;
/** @constructor */
ScalaJS.h.scg_GenericCompanion = (function() {
  /*<skip>*/
});
ScalaJS.h.scg_GenericCompanion.prototype = ScalaJS.c.scg_GenericCompanion.prototype;
ScalaJS.c.scg_GenericCompanion.prototype.apply__sc_Seq__sc_GenTraversable = (function(elems) {
  if (elems.isEmpty__Z()) {
    return this.empty__sc_GenTraversable()
  } else {
    var b = this.newBuilder__scm_Builder();
    b.$$plus$plus$eq__sc_TraversableOnce__scg_Growable(elems);
    return ScalaJS.as.sc_GenTraversable(b.result__O())
  }
});
ScalaJS.c.scg_GenericCompanion.prototype.empty__sc_GenTraversable = (function() {
  return ScalaJS.as.sc_GenTraversable(this.newBuilder__scm_Builder().result__O())
});
ScalaJS.is.scg_GenericCompanion = (function(obj) {
  return (!(!((obj && obj.$classData) && obj.$classData.ancestors.scg_GenericCompanion)))
});
ScalaJS.as.scg_GenericCompanion = (function(obj) {
  return ((ScalaJS.is.scg_GenericCompanion(obj) || (obj === null)) ? obj : ScalaJS.throwClassCastException(obj, "scala.collection.generic.GenericCompanion"))
});
ScalaJS.isArrayOf.scg_GenericCompanion = (function(obj, depth) {
  return (!(!(((obj && obj.$classData) && (obj.$classData.arrayDepth === depth)) && obj.$classData.arrayBase.ancestors.scg_GenericCompanion)))
});
ScalaJS.asArrayOf.scg_GenericCompanion = (function(obj, depth) {
  return ((ScalaJS.isArrayOf.scg_GenericCompanion(obj, depth) || (obj === null)) ? obj : ScalaJS.throwArrayCastException(obj, "Lscala.collection.generic.GenericCompanion;", depth))
});
ScalaJS.d.scg_GenericCompanion = new ScalaJS.ClassTypeData({
  scg_GenericCompanion: 0
}, false, "scala.collection.generic.GenericCompanion", ScalaJS.d.O, {
  scg_GenericCompanion: 1,
  O: 1
});
ScalaJS.c.scg_GenericCompanion.prototype.$classData = ScalaJS.d.scg_GenericCompanion;
/** @constructor */
ScalaJS.c.sci_$colon$colon$ = (function() {
  ScalaJS.c.O.call(this)
});
ScalaJS.c.sci_$colon$colon$.prototype = new ScalaJS.h.O();
ScalaJS.c.sci_$colon$colon$.prototype.constructor = ScalaJS.c.sci_$colon$colon$;
/** @constructor */
ScalaJS.h.sci_$colon$colon$ = (function() {
  /*<skip>*/
});
ScalaJS.h.sci_$colon$colon$.prototype = ScalaJS.c.sci_$colon$colon$.prototype;
ScalaJS.c.sci_$colon$colon$.prototype.toString__T = (function() {
  return "::"
});
ScalaJS.is.sci_$colon$colon$ = (function(obj) {
  return (!(!((obj && obj.$classData) && obj.$classData.ancestors.sci_$colon$colon$)))
});
ScalaJS.as.sci_$colon$colon$ = (function(obj) {
  return ((ScalaJS.is.sci_$colon$colon$(obj) || (obj === null)) ? obj : ScalaJS.throwClassCastException(obj, "scala.collection.immutable.$colon$colon$"))
});
ScalaJS.isArrayOf.sci_$colon$colon$ = (function(obj, depth) {
  return (!(!(((obj && obj.$classData) && (obj.$classData.arrayDepth === depth)) && obj.$classData.arrayBase.ancestors.sci_$colon$colon$)))
});
ScalaJS.asArrayOf.sci_$colon$colon$ = (function(obj, depth) {
  return ((ScalaJS.isArrayOf.sci_$colon$colon$(obj, depth) || (obj === null)) ? obj : ScalaJS.throwArrayCastException(obj, "Lscala.collection.immutable.$colon$colon$;", depth))
});
ScalaJS.d.sci_$colon$colon$ = new ScalaJS.ClassTypeData({
  sci_$colon$colon$: 0
}, false, "scala.collection.immutable.$colon$colon$", ScalaJS.d.O, {
  sci_$colon$colon$: 1,
  s_Serializable: 1,
  Ljava_io_Serializable: 1,
  O: 1
});
ScalaJS.c.sci_$colon$colon$.prototype.$classData = ScalaJS.d.sci_$colon$colon$;
ScalaJS.n.sci_$colon$colon = (void 0);
ScalaJS.m.sci_$colon$colon = (function() {
  if ((!ScalaJS.n.sci_$colon$colon)) {
    ScalaJS.n.sci_$colon$colon = new ScalaJS.c.sci_$colon$colon$().init___()
  };
  return ScalaJS.n.sci_$colon$colon
});
/** @constructor */
ScalaJS.c.sci_HashMap$Merger = (function() {
  ScalaJS.c.O.call(this)
});
ScalaJS.c.sci_HashMap$Merger.prototype = new ScalaJS.h.O();
ScalaJS.c.sci_HashMap$Merger.prototype.constructor = ScalaJS.c.sci_HashMap$Merger;
/** @constructor */
ScalaJS.h.sci_HashMap$Merger = (function() {
  /*<skip>*/
});
ScalaJS.h.sci_HashMap$Merger.prototype = ScalaJS.c.sci_HashMap$Merger.prototype;
ScalaJS.is.sci_HashMap$Merger = (function(obj) {
  return (!(!((obj && obj.$classData) && obj.$classData.ancestors.sci_HashMap$Merger)))
});
ScalaJS.as.sci_HashMap$Merger = (function(obj) {
  return ((ScalaJS.is.sci_HashMap$Merger(obj) || (obj === null)) ? obj : ScalaJS.throwClassCastException(obj, "scala.collection.immutable.HashMap$Merger"))
});
ScalaJS.isArrayOf.sci_HashMap$Merger = (function(obj, depth) {
  return (!(!(((obj && obj.$classData) && (obj.$classData.arrayDepth === depth)) && obj.$classData.arrayBase.ancestors.sci_HashMap$Merger)))
});
ScalaJS.asArrayOf.sci_HashMap$Merger = (function(obj, depth) {
  return ((ScalaJS.isArrayOf.sci_HashMap$Merger(obj, depth) || (obj === null)) ? obj : ScalaJS.throwArrayCastException(obj, "Lscala.collection.immutable.HashMap$Merger;", depth))
});
ScalaJS.d.sci_HashMap$Merger = new ScalaJS.ClassTypeData({
  sci_HashMap$Merger: 0
}, false, "scala.collection.immutable.HashMap$Merger", ScalaJS.d.O, {
  sci_HashMap$Merger: 1,
  O: 1
});
ScalaJS.c.sci_HashMap$Merger.prototype.$classData = ScalaJS.d.sci_HashMap$Merger;
ScalaJS.is.sci_Iterable = (function(obj) {
  return (!(!((obj && obj.$classData) && obj.$classData.ancestors.sci_Iterable)))
});
ScalaJS.as.sci_Iterable = (function(obj) {
  return ((ScalaJS.is.sci_Iterable(obj) || (obj === null)) ? obj : ScalaJS.throwClassCastException(obj, "scala.collection.immutable.Iterable"))
});
ScalaJS.isArrayOf.sci_Iterable = (function(obj, depth) {
  return (!(!(((obj && obj.$classData) && (obj.$classData.arrayDepth === depth)) && obj.$classData.arrayBase.ancestors.sci_Iterable)))
});
ScalaJS.asArrayOf.sci_Iterable = (function(obj, depth) {
  return ((ScalaJS.isArrayOf.sci_Iterable(obj, depth) || (obj === null)) ? obj : ScalaJS.throwArrayCastException(obj, "Lscala.collection.immutable.Iterable;", depth))
});
ScalaJS.d.sci_Iterable = new ScalaJS.ClassTypeData({
  sci_Iterable: 0
}, true, "scala.collection.immutable.Iterable", (void 0), {
  sci_Iterable: 1,
  sc_Iterable: 1,
  sc_IterableLike: 1,
  s_Equals: 1,
  sc_GenIterable: 1,
  sc_GenIterableLike: 1,
  sci_Traversable: 1,
  s_Immutable: 1,
  sc_Traversable: 1,
  sc_GenTraversable: 1,
  scg_GenericTraversableTemplate: 1,
  sc_TraversableLike: 1,
  sc_GenTraversableLike: 1,
  sc_Parallelizable: 1,
  sc_TraversableOnce: 1,
  sc_GenTraversableOnce: 1,
  scg_FilterMonadic: 1,
  scg_HasNewBuilder: 1,
  O: 1
});
/** @constructor */
ScalaJS.c.sci_List$$anon$1 = (function() {
  ScalaJS.c.O.call(this)
});
ScalaJS.c.sci_List$$anon$1.prototype = new ScalaJS.h.O();
ScalaJS.c.sci_List$$anon$1.prototype.constructor = ScalaJS.c.sci_List$$anon$1;
/** @constructor */
ScalaJS.h.sci_List$$anon$1 = (function() {
  /*<skip>*/
});
ScalaJS.h.sci_List$$anon$1.prototype = ScalaJS.c.sci_List$$anon$1.prototype;
ScalaJS.c.sci_List$$anon$1.prototype.init___ = (function() {
  return this
});
ScalaJS.c.sci_List$$anon$1.prototype.apply__O__O = (function(x) {
  return this
});
ScalaJS.c.sci_List$$anon$1.prototype.toString__T = (function() {
  return "<function1>"
});
ScalaJS.is.sci_List$$anon$1 = (function(obj) {
  return (!(!((obj && obj.$classData) && obj.$classData.ancestors.sci_List$$anon$1)))
});
ScalaJS.as.sci_List$$anon$1 = (function(obj) {
  return ((ScalaJS.is.sci_List$$anon$1(obj) || (obj === null)) ? obj : ScalaJS.throwClassCastException(obj, "scala.collection.immutable.List$$anon$1"))
});
ScalaJS.isArrayOf.sci_List$$anon$1 = (function(obj, depth) {
  return (!(!(((obj && obj.$classData) && (obj.$classData.arrayDepth === depth)) && obj.$classData.arrayBase.ancestors.sci_List$$anon$1)))
});
ScalaJS.asArrayOf.sci_List$$anon$1 = (function(obj, depth) {
  return ((ScalaJS.isArrayOf.sci_List$$anon$1(obj, depth) || (obj === null)) ? obj : ScalaJS.throwArrayCastException(obj, "Lscala.collection.immutable.List$$anon$1;", depth))
});
ScalaJS.d.sci_List$$anon$1 = new ScalaJS.ClassTypeData({
  sci_List$$anon$1: 0
}, false, "scala.collection.immutable.List$$anon$1", ScalaJS.d.O, {
  sci_List$$anon$1: 1,
  F1: 1,
  O: 1
});
ScalaJS.c.sci_List$$anon$1.prototype.$classData = ScalaJS.d.sci_List$$anon$1;
/** @constructor */
ScalaJS.c.sci_ListSet$ListSetBuilder = (function() {
  ScalaJS.c.O.call(this);
  this.elems$1 = null;
  this.seen$1 = null
});
ScalaJS.c.sci_ListSet$ListSetBuilder.prototype = new ScalaJS.h.O();
ScalaJS.c.sci_ListSet$ListSetBuilder.prototype.constructor = ScalaJS.c.sci_ListSet$ListSetBuilder;
/** @constructor */
ScalaJS.h.sci_ListSet$ListSetBuilder = (function() {
  /*<skip>*/
});
ScalaJS.h.sci_ListSet$ListSetBuilder.prototype = ScalaJS.c.sci_ListSet$ListSetBuilder.prototype;
ScalaJS.c.sci_ListSet$ListSetBuilder.prototype.result__sci_ListSet = (function() {
  var this$2 = this.elems$1;
  var z = ScalaJS.m.sci_ListSet$EmptyListSet();
  var this$3 = this$2.scala$collection$mutable$ListBuffer$$start$6;
  var acc = z;
  var these = this$3;
  while ((!these.isEmpty__Z())) {
    var x$1$2 = acc;
    var x$2$2 = these.head__O();
    var x$1 = ScalaJS.as.sci_ListSet(x$1$2);
    acc = new ScalaJS.c.sci_ListSet$Node().init___sci_ListSet__O(x$1, x$2$2);
    these = ScalaJS.as.sc_LinearSeqOptimized(these.tail__O())
  };
  return ScalaJS.as.sci_ListSet(acc)
});
ScalaJS.c.sci_ListSet$ListSetBuilder.prototype.init___ = (function() {
  return (ScalaJS.c.sci_ListSet$ListSetBuilder.prototype.init___sci_ListSet.call(this, ScalaJS.m.sci_ListSet$EmptyListSet()), this)
});
ScalaJS.c.sci_ListSet$ListSetBuilder.prototype.$$plus$eq__O__scg_Growable = (function(elem) {
  return this.$$plus$eq__O__sci_ListSet$ListSetBuilder(elem)
});
ScalaJS.c.sci_ListSet$ListSetBuilder.prototype.init___sci_ListSet = (function(initial) {
  var this$1 = new ScalaJS.c.scm_ListBuffer().init___().$$plus$plus$eq__sc_TraversableOnce__scm_ListBuffer(initial);
  this.elems$1 = ScalaJS.as.scm_ListBuffer(ScalaJS.i.sc_SeqLike$class__reverse__sc_SeqLike__O(this$1));
  var this$2 = new ScalaJS.c.scm_HashSet().init___();
  this.seen$1 = ScalaJS.as.scm_HashSet(ScalaJS.i.scg_Growable$class__$plus$plus$eq__scg_Growable__sc_TraversableOnce__scg_Growable(this$2, initial));
  return this
});
ScalaJS.c.sci_ListSet$ListSetBuilder.prototype.result__O = (function() {
  return this.result__sci_ListSet()
});
ScalaJS.c.sci_ListSet$ListSetBuilder.prototype.sizeHintBounded__I__sc_TraversableLike__V = (function(size, boundingColl) {
  ScalaJS.i.scm_Builder$class__sizeHintBounded__scm_Builder__I__sc_TraversableLike__V(this, size, boundingColl)
});
ScalaJS.c.sci_ListSet$ListSetBuilder.prototype.$$plus$eq__O__scm_Builder = (function(elem) {
  return this.$$plus$eq__O__sci_ListSet$ListSetBuilder(elem)
});
ScalaJS.c.sci_ListSet$ListSetBuilder.prototype.sizeHint__I__V = (function(size) {
  /*<skip>*/
});
ScalaJS.c.sci_ListSet$ListSetBuilder.prototype.$$plus$eq__O__sci_ListSet$ListSetBuilder = (function(x) {
  var this$1 = this.seen$1;
  if ((!ScalaJS.i.scm_FlatHashTable$class__containsElem__scm_FlatHashTable__O__Z(this$1, x))) {
    this.elems$1.$$plus$eq__O__scm_ListBuffer(x);
    this.seen$1.$$plus$eq__O__scm_HashSet(x)
  };
  return this
});
ScalaJS.c.sci_ListSet$ListSetBuilder.prototype.$$plus$plus$eq__sc_TraversableOnce__scg_Growable = (function(xs) {
  return ScalaJS.i.scg_Growable$class__$plus$plus$eq__scg_Growable__sc_TraversableOnce__scg_Growable(this, xs)
});
ScalaJS.is.sci_ListSet$ListSetBuilder = (function(obj) {
  return (!(!((obj && obj.$classData) && obj.$classData.ancestors.sci_ListSet$ListSetBuilder)))
});
ScalaJS.as.sci_ListSet$ListSetBuilder = (function(obj) {
  return ((ScalaJS.is.sci_ListSet$ListSetBuilder(obj) || (obj === null)) ? obj : ScalaJS.throwClassCastException(obj, "scala.collection.immutable.ListSet$ListSetBuilder"))
});
ScalaJS.isArrayOf.sci_ListSet$ListSetBuilder = (function(obj, depth) {
  return (!(!(((obj && obj.$classData) && (obj.$classData.arrayDepth === depth)) && obj.$classData.arrayBase.ancestors.sci_ListSet$ListSetBuilder)))
});
ScalaJS.asArrayOf.sci_ListSet$ListSetBuilder = (function(obj, depth) {
  return ((ScalaJS.isArrayOf.sci_ListSet$ListSetBuilder(obj, depth) || (obj === null)) ? obj : ScalaJS.throwArrayCastException(obj, "Lscala.collection.immutable.ListSet$ListSetBuilder;", depth))
});
ScalaJS.d.sci_ListSet$ListSetBuilder = new ScalaJS.ClassTypeData({
  sci_ListSet$ListSetBuilder: 0
}, false, "scala.collection.immutable.ListSet$ListSetBuilder", ScalaJS.d.O, {
  sci_ListSet$ListSetBuilder: 1,
  scm_Builder: 1,
  scg_Growable: 1,
  scg_Clearable: 1,
  O: 1
});
ScalaJS.c.sci_ListSet$ListSetBuilder.prototype.$classData = ScalaJS.d.sci_ListSet$ListSetBuilder;
ScalaJS.is.sci_Map = (function(obj) {
  return (!(!((obj && obj.$classData) && obj.$classData.ancestors.sci_Map)))
});
ScalaJS.as.sci_Map = (function(obj) {
  return ((ScalaJS.is.sci_Map(obj) || (obj === null)) ? obj : ScalaJS.throwClassCastException(obj, "scala.collection.immutable.Map"))
});
ScalaJS.isArrayOf.sci_Map = (function(obj, depth) {
  return (!(!(((obj && obj.$classData) && (obj.$classData.arrayDepth === depth)) && obj.$classData.arrayBase.ancestors.sci_Map)))
});
ScalaJS.asArrayOf.sci_Map = (function(obj, depth) {
  return ((ScalaJS.isArrayOf.sci_Map(obj, depth) || (obj === null)) ? obj : ScalaJS.throwArrayCastException(obj, "Lscala.collection.immutable.Map;", depth))
});
ScalaJS.d.sci_Map = new ScalaJS.ClassTypeData({
  sci_Map: 0
}, true, "scala.collection.immutable.Map", (void 0), {
  sci_Map: 1,
  sci_MapLike: 1,
  sc_Map: 1,
  sc_MapLike: 1,
  scg_Subtractable: 1,
  s_PartialFunction: 1,
  F1: 1,
  sc_GenMap: 1,
  sc_GenMapLike: 1,
  sci_Iterable: 1,
  sc_Iterable: 1,
  sc_IterableLike: 1,
  s_Equals: 1,
  sc_GenIterable: 1,
  sc_GenIterableLike: 1,
  sci_Traversable: 1,
  s_Immutable: 1,
  sc_Traversable: 1,
  sc_GenTraversable: 1,
  scg_GenericTraversableTemplate: 1,
  sc_TraversableLike: 1,
  sc_GenTraversableLike: 1,
  sc_Parallelizable: 1,
  sc_TraversableOnce: 1,
  sc_GenTraversableOnce: 1,
  scg_FilterMonadic: 1,
  scg_HasNewBuilder: 1,
  O: 1
});
/** @constructor */
ScalaJS.c.sci_Range$ = (function() {
  ScalaJS.c.O.call(this);
  this.MAX$undPRINT$1 = 0
});
ScalaJS.c.sci_Range$.prototype = new ScalaJS.h.O();
ScalaJS.c.sci_Range$.prototype.constructor = ScalaJS.c.sci_Range$;
/** @constructor */
ScalaJS.h.sci_Range$ = (function() {
  /*<skip>*/
});
ScalaJS.h.sci_Range$.prototype = ScalaJS.c.sci_Range$.prototype;
ScalaJS.c.sci_Range$.prototype.init___ = (function() {
  ScalaJS.n.sci_Range = this;
  this.MAX$undPRINT$1 = 512;
  return this
});
ScalaJS.is.sci_Range$ = (function(obj) {
  return (!(!((obj && obj.$classData) && obj.$classData.ancestors.sci_Range$)))
});
ScalaJS.as.sci_Range$ = (function(obj) {
  return ((ScalaJS.is.sci_Range$(obj) || (obj === null)) ? obj : ScalaJS.throwClassCastException(obj, "scala.collection.immutable.Range$"))
});
ScalaJS.isArrayOf.sci_Range$ = (function(obj, depth) {
  return (!(!(((obj && obj.$classData) && (obj.$classData.arrayDepth === depth)) && obj.$classData.arrayBase.ancestors.sci_Range$)))
});
ScalaJS.asArrayOf.sci_Range$ = (function(obj, depth) {
  return ((ScalaJS.isArrayOf.sci_Range$(obj, depth) || (obj === null)) ? obj : ScalaJS.throwArrayCastException(obj, "Lscala.collection.immutable.Range$;", depth))
});
ScalaJS.d.sci_Range$ = new ScalaJS.ClassTypeData({
  sci_Range$: 0
}, false, "scala.collection.immutable.Range$", ScalaJS.d.O, {
  sci_Range$: 1,
  s_Serializable: 1,
  Ljava_io_Serializable: 1,
  O: 1
});
ScalaJS.c.sci_Range$.prototype.$classData = ScalaJS.d.sci_Range$;
ScalaJS.n.sci_Range = (void 0);
ScalaJS.m.sci_Range = (function() {
  if ((!ScalaJS.n.sci_Range)) {
    ScalaJS.n.sci_Range = new ScalaJS.c.sci_Range$().init___()
  };
  return ScalaJS.n.sci_Range
});
ScalaJS.is.sci_Set = (function(obj) {
  return (!(!((obj && obj.$classData) && obj.$classData.ancestors.sci_Set)))
});
ScalaJS.as.sci_Set = (function(obj) {
  return ((ScalaJS.is.sci_Set(obj) || (obj === null)) ? obj : ScalaJS.throwClassCastException(obj, "scala.collection.immutable.Set"))
});
ScalaJS.isArrayOf.sci_Set = (function(obj, depth) {
  return (!(!(((obj && obj.$classData) && (obj.$classData.arrayDepth === depth)) && obj.$classData.arrayBase.ancestors.sci_Set)))
});
ScalaJS.asArrayOf.sci_Set = (function(obj, depth) {
  return ((ScalaJS.isArrayOf.sci_Set(obj, depth) || (obj === null)) ? obj : ScalaJS.throwArrayCastException(obj, "Lscala.collection.immutable.Set;", depth))
});
ScalaJS.d.sci_Set = new ScalaJS.ClassTypeData({
  sci_Set: 0
}, true, "scala.collection.immutable.Set", (void 0), {
  sci_Set: 1,
  sc_Set: 1,
  sc_SetLike: 1,
  scg_Subtractable: 1,
  sc_GenSet: 1,
  scg_GenericSetTemplate: 1,
  sc_GenSetLike: 1,
  F1: 1,
  sci_Iterable: 1,
  sc_Iterable: 1,
  sc_IterableLike: 1,
  s_Equals: 1,
  sc_GenIterable: 1,
  sc_GenIterableLike: 1,
  sci_Traversable: 1,
  s_Immutable: 1,
  sc_Traversable: 1,
  sc_GenTraversable: 1,
  scg_GenericTraversableTemplate: 1,
  sc_TraversableLike: 1,
  sc_GenTraversableLike: 1,
  sc_Parallelizable: 1,
  sc_TraversableOnce: 1,
  sc_GenTraversableOnce: 1,
  scg_FilterMonadic: 1,
  scg_HasNewBuilder: 1,
  O: 1
});
/** @constructor */
ScalaJS.c.sci_Stream$$hash$colon$colon$ = (function() {
  ScalaJS.c.O.call(this)
});
ScalaJS.c.sci_Stream$$hash$colon$colon$.prototype = new ScalaJS.h.O();
ScalaJS.c.sci_Stream$$hash$colon$colon$.prototype.constructor = ScalaJS.c.sci_Stream$$hash$colon$colon$;
/** @constructor */
ScalaJS.h.sci_Stream$$hash$colon$colon$ = (function() {
  /*<skip>*/
});
ScalaJS.h.sci_Stream$$hash$colon$colon$.prototype = ScalaJS.c.sci_Stream$$hash$colon$colon$.prototype;
ScalaJS.is.sci_Stream$$hash$colon$colon$ = (function(obj) {
  return (!(!((obj && obj.$classData) && obj.$classData.ancestors.sci_Stream$$hash$colon$colon$)))
});
ScalaJS.as.sci_Stream$$hash$colon$colon$ = (function(obj) {
  return ((ScalaJS.is.sci_Stream$$hash$colon$colon$(obj) || (obj === null)) ? obj : ScalaJS.throwClassCastException(obj, "scala.collection.immutable.Stream$$hash$colon$colon$"))
});
ScalaJS.isArrayOf.sci_Stream$$hash$colon$colon$ = (function(obj, depth) {
  return (!(!(((obj && obj.$classData) && (obj.$classData.arrayDepth === depth)) && obj.$classData.arrayBase.ancestors.sci_Stream$$hash$colon$colon$)))
});
ScalaJS.asArrayOf.sci_Stream$$hash$colon$colon$ = (function(obj, depth) {
  return ((ScalaJS.isArrayOf.sci_Stream$$hash$colon$colon$(obj, depth) || (obj === null)) ? obj : ScalaJS.throwArrayCastException(obj, "Lscala.collection.immutable.Stream$$hash$colon$colon$;", depth))
});
ScalaJS.d.sci_Stream$$hash$colon$colon$ = new ScalaJS.ClassTypeData({
  sci_Stream$$hash$colon$colon$: 0
}, false, "scala.collection.immutable.Stream$$hash$colon$colon$", ScalaJS.d.O, {
  sci_Stream$$hash$colon$colon$: 1,
  O: 1
});
ScalaJS.c.sci_Stream$$hash$colon$colon$.prototype.$classData = ScalaJS.d.sci_Stream$$hash$colon$colon$;
ScalaJS.n.sci_Stream$$hash$colon$colon = (void 0);
ScalaJS.m.sci_Stream$$hash$colon$colon = (function() {
  if ((!ScalaJS.n.sci_Stream$$hash$colon$colon)) {
    ScalaJS.n.sci_Stream$$hash$colon$colon = new ScalaJS.c.sci_Stream$$hash$colon$colon$().init___()
  };
  return ScalaJS.n.sci_Stream$$hash$colon$colon
});
/** @constructor */
ScalaJS.c.sci_Stream$ConsWrapper = (function() {
  ScalaJS.c.O.call(this);
  this.tl$1 = null
});
ScalaJS.c.sci_Stream$ConsWrapper.prototype = new ScalaJS.h.O();
ScalaJS.c.sci_Stream$ConsWrapper.prototype.constructor = ScalaJS.c.sci_Stream$ConsWrapper;
/** @constructor */
ScalaJS.h.sci_Stream$ConsWrapper = (function() {
  /*<skip>*/
});
ScalaJS.h.sci_Stream$ConsWrapper.prototype = ScalaJS.c.sci_Stream$ConsWrapper.prototype;
ScalaJS.c.sci_Stream$ConsWrapper.prototype.init___F0 = (function(tl) {
  this.tl$1 = tl;
  return this
});
ScalaJS.c.sci_Stream$ConsWrapper.prototype.$$hash$colon$colon__O__sci_Stream = (function(hd) {
  var tl = this.tl$1;
  return new ScalaJS.c.sci_Stream$Cons().init___O__F0(hd, tl)
});
ScalaJS.is.sci_Stream$ConsWrapper = (function(obj) {
  return (!(!((obj && obj.$classData) && obj.$classData.ancestors.sci_Stream$ConsWrapper)))
});
ScalaJS.as.sci_Stream$ConsWrapper = (function(obj) {
  return ((ScalaJS.is.sci_Stream$ConsWrapper(obj) || (obj === null)) ? obj : ScalaJS.throwClassCastException(obj, "scala.collection.immutable.Stream$ConsWrapper"))
});
ScalaJS.isArrayOf.sci_Stream$ConsWrapper = (function(obj, depth) {
  return (!(!(((obj && obj.$classData) && (obj.$classData.arrayDepth === depth)) && obj.$classData.arrayBase.ancestors.sci_Stream$ConsWrapper)))
});
ScalaJS.asArrayOf.sci_Stream$ConsWrapper = (function(obj, depth) {
  return ((ScalaJS.isArrayOf.sci_Stream$ConsWrapper(obj, depth) || (obj === null)) ? obj : ScalaJS.throwArrayCastException(obj, "Lscala.collection.immutable.Stream$ConsWrapper;", depth))
});
ScalaJS.d.sci_Stream$ConsWrapper = new ScalaJS.ClassTypeData({
  sci_Stream$ConsWrapper: 0
}, false, "scala.collection.immutable.Stream$ConsWrapper", ScalaJS.d.O, {
  sci_Stream$ConsWrapper: 1,
  O: 1
});
ScalaJS.c.sci_Stream$ConsWrapper.prototype.$classData = ScalaJS.d.sci_Stream$ConsWrapper;
/** @constructor */
ScalaJS.c.sci_StreamIterator$LazyCell = (function() {
  ScalaJS.c.O.call(this);
  this.st$1 = null;
  this.v$1 = null;
  this.$$outer$f = null;
  this.bitmap$0$1 = false
});
ScalaJS.c.sci_StreamIterator$LazyCell.prototype = new ScalaJS.h.O();
ScalaJS.c.sci_StreamIterator$LazyCell.prototype.constructor = ScalaJS.c.sci_StreamIterator$LazyCell;
/** @constructor */
ScalaJS.h.sci_StreamIterator$LazyCell = (function() {
  /*<skip>*/
});
ScalaJS.h.sci_StreamIterator$LazyCell.prototype = ScalaJS.c.sci_StreamIterator$LazyCell.prototype;
ScalaJS.c.sci_StreamIterator$LazyCell.prototype.init___sci_StreamIterator__F0 = (function($$outer, st) {
  this.st$1 = st;
  if (($$outer === null)) {
    throw ScalaJS.unwrapJavaScriptException(null)
  } else {
    this.$$outer$f = $$outer
  };
  return this
});
ScalaJS.c.sci_StreamIterator$LazyCell.prototype.v$lzycompute__p1__sci_Stream = (function() {
  if ((!this.bitmap$0$1)) {
    this.v$1 = ScalaJS.as.sci_Stream(this.st$1.apply__O());
    this.bitmap$0$1 = true
  };
  this.st$1 = null;
  return this.v$1
});
ScalaJS.c.sci_StreamIterator$LazyCell.prototype.v__sci_Stream = (function() {
  return ((!this.bitmap$0$1) ? this.v$lzycompute__p1__sci_Stream() : this.v$1)
});
ScalaJS.is.sci_StreamIterator$LazyCell = (function(obj) {
  return (!(!((obj && obj.$classData) && obj.$classData.ancestors.sci_StreamIterator$LazyCell)))
});
ScalaJS.as.sci_StreamIterator$LazyCell = (function(obj) {
  return ((ScalaJS.is.sci_StreamIterator$LazyCell(obj) || (obj === null)) ? obj : ScalaJS.throwClassCastException(obj, "scala.collection.immutable.StreamIterator$LazyCell"))
});
ScalaJS.isArrayOf.sci_StreamIterator$LazyCell = (function(obj, depth) {
  return (!(!(((obj && obj.$classData) && (obj.$classData.arrayDepth === depth)) && obj.$classData.arrayBase.ancestors.sci_StreamIterator$LazyCell)))
});
ScalaJS.asArrayOf.sci_StreamIterator$LazyCell = (function(obj, depth) {
  return ((ScalaJS.isArrayOf.sci_StreamIterator$LazyCell(obj, depth) || (obj === null)) ? obj : ScalaJS.throwArrayCastException(obj, "Lscala.collection.immutable.StreamIterator$LazyCell;", depth))
});
ScalaJS.d.sci_StreamIterator$LazyCell = new ScalaJS.ClassTypeData({
  sci_StreamIterator$LazyCell: 0
}, false, "scala.collection.immutable.StreamIterator$LazyCell", ScalaJS.d.O, {
  sci_StreamIterator$LazyCell: 1,
  O: 1
});
ScalaJS.c.sci_StreamIterator$LazyCell.prototype.$classData = ScalaJS.d.sci_StreamIterator$LazyCell;
/** @constructor */
ScalaJS.c.sci_StringOps = (function() {
  ScalaJS.c.O.call(this);
  this.repr$1 = null
});
ScalaJS.c.sci_StringOps.prototype = new ScalaJS.h.O();
ScalaJS.c.sci_StringOps.prototype.constructor = ScalaJS.c.sci_StringOps;
/** @constructor */
ScalaJS.h.sci_StringOps = (function() {
  /*<skip>*/
});
ScalaJS.h.sci_StringOps.prototype = ScalaJS.c.sci_StringOps.prototype;
ScalaJS.c.sci_StringOps.prototype.seq__sc_TraversableOnce = (function() {
  var $$this = this.repr$1;
  return new ScalaJS.c.sci_WrappedString().init___T($$this)
});
ScalaJS.c.sci_StringOps.prototype.copyToArray__O__I__V = (function(xs, start) {
  ScalaJS.i.sc_TraversableOnce$class__copyToArray__sc_TraversableOnce__O__I__V(this, xs, start)
});
ScalaJS.c.sci_StringOps.prototype.apply__I__O = (function(idx) {
  var $$this = this.repr$1;
  return ScalaJS.bC(ScalaJS.i.sjsr_RuntimeString$class__charAt__sjsr_RuntimeString__I__C($$this, idx))
});
ScalaJS.c.sci_StringOps.prototype.lengthCompare__I__I = (function(len) {
  return ScalaJS.i.sc_IndexedSeqOptimized$class__lengthCompare__sc_IndexedSeqOptimized__I__I(this, len)
});
ScalaJS.c.sci_StringOps.prototype.sameElements__sc_GenIterable__Z = (function(that) {
  return ScalaJS.i.sc_IndexedSeqOptimized$class__sameElements__sc_IndexedSeqOptimized__sc_GenIterable__Z(this, that)
});
ScalaJS.c.sci_StringOps.prototype.isEmpty__Z = (function() {
  return ScalaJS.i.sc_IndexedSeqOptimized$class__isEmpty__sc_IndexedSeqOptimized__Z(this)
});
ScalaJS.c.sci_StringOps.prototype.toList__sci_List = (function() {
  var this$1 = ScalaJS.m.sci_List();
  var cbf = this$1.ReusableCBFInstance$2;
  return ScalaJS.as.sci_List(ScalaJS.i.sc_TraversableLike$class__to__sc_TraversableLike__scg_CanBuildFrom__O(this, cbf))
});
ScalaJS.c.sci_StringOps.prototype.thisCollection__sc_Traversable = (function() {
  var $$this = this.repr$1;
  return new ScalaJS.c.sci_WrappedString().init___T($$this)
});
ScalaJS.c.sci_StringOps.prototype.equals__O__Z = (function(x$1) {
  return ScalaJS.m.sci_StringOps().equals$extension__T__O__Z(this.repr$1, x$1)
});
ScalaJS.c.sci_StringOps.prototype.mkString__T__T__T__T = (function(start, sep, end) {
  return ScalaJS.i.sc_TraversableOnce$class__mkString__sc_TraversableOnce__T__T__T__T(this, start, sep, end)
});
ScalaJS.c.sci_StringOps.prototype.toString__T = (function() {
  var $$this = this.repr$1;
  return $$this
});
ScalaJS.c.sci_StringOps.prototype.foreach__F1__V = (function(f) {
  ScalaJS.i.sc_IndexedSeqOptimized$class__foreach__sc_IndexedSeqOptimized__F1__V(this, f)
});
ScalaJS.c.sci_StringOps.prototype.reverse__O = (function() {
  return ScalaJS.i.sc_IndexedSeqOptimized$class__reverse__sc_IndexedSeqOptimized__O(this)
});
ScalaJS.c.sci_StringOps.prototype.filter__F1__O = (function(p) {
  return ScalaJS.i.sc_TraversableLike$class__filterImpl__sc_TraversableLike__F1__Z__O(this, p, false)
});
ScalaJS.c.sci_StringOps.prototype.toBuffer__scm_Buffer = (function() {
  return ScalaJS.i.sc_IndexedSeqLike$class__toBuffer__sc_IndexedSeqLike__scm_Buffer(this)
});
ScalaJS.c.sci_StringOps.prototype.size__I = (function() {
  var $$this = this.repr$1;
  return ScalaJS.i.sjsr_RuntimeString$class__length__sjsr_RuntimeString__I($$this)
});
ScalaJS.c.sci_StringOps.prototype.iterator__sc_Iterator = (function() {
  var $$this = this.repr$1;
  return new ScalaJS.c.sc_IndexedSeqLike$Elements().init___sc_IndexedSeqLike__I__I(this, 0, ScalaJS.i.sjsr_RuntimeString$class__length__sjsr_RuntimeString__I($$this))
});
ScalaJS.c.sci_StringOps.prototype.length__I = (function() {
  var $$this = this.repr$1;
  return ScalaJS.i.sjsr_RuntimeString$class__length__sjsr_RuntimeString__I($$this)
});
ScalaJS.c.sci_StringOps.prototype.toStream__sci_Stream = (function() {
  var $$this = this.repr$1;
  var this$2 = new ScalaJS.c.sc_IndexedSeqLike$Elements().init___sc_IndexedSeqLike__I__I(this, 0, ScalaJS.i.sjsr_RuntimeString$class__length__sjsr_RuntimeString__I($$this));
  return ScalaJS.i.sc_Iterator$class__toStream__sc_Iterator__sci_Stream(this$2)
});
ScalaJS.c.sci_StringOps.prototype.thisCollection__sc_Seq = (function() {
  var $$this = this.repr$1;
  return new ScalaJS.c.sci_WrappedString().init___T($$this)
});
ScalaJS.c.sci_StringOps.prototype.addString__scm_StringBuilder__T__T__T__scm_StringBuilder = (function(b, start, sep, end) {
  return ScalaJS.i.sc_TraversableOnce$class__addString__sc_TraversableOnce__scm_StringBuilder__T__T__T__scm_StringBuilder(this, b, start, sep, end)
});
ScalaJS.c.sci_StringOps.prototype.repr__O = (function() {
  return this.repr$1
});
ScalaJS.c.sci_StringOps.prototype.$$div$colon__O__F2__O = (function(z, op) {
  var $$this = this.repr$1;
  return ScalaJS.i.sc_IndexedSeqOptimized$class__foldl__sc_IndexedSeqOptimized__I__I__O__F2__O(this, 0, ScalaJS.i.sjsr_RuntimeString$class__length__sjsr_RuntimeString__I($$this), z, op)
});
ScalaJS.c.sci_StringOps.prototype.hashCode__I = (function() {
  return ScalaJS.m.sci_StringOps().hashCode$extension__T__I(this.repr$1)
});
ScalaJS.c.sci_StringOps.prototype.copyToArray__O__I__I__V = (function(xs, start, len) {
  ScalaJS.i.sc_IndexedSeqOptimized$class__copyToArray__sc_IndexedSeqOptimized__O__I__I__V(this, xs, start, len)
});
ScalaJS.c.sci_StringOps.prototype.isTraversableAgain__Z = (function() {
  return true
});
ScalaJS.c.sci_StringOps.prototype.init___T = (function(repr) {
  this.repr$1 = repr;
  return this
});
ScalaJS.c.sci_StringOps.prototype.toArray__s_reflect_ClassTag__O = (function(evidence$1) {
  return ScalaJS.i.sjsr_RuntimeString$class__toCharArray__sjsr_RuntimeString__AC(this.repr$1)
});
ScalaJS.c.sci_StringOps.prototype.toCollection__O__sc_Seq = (function(repr) {
  this.repr$1;
  var repr$1 = ScalaJS.as.T(repr);
  return new ScalaJS.c.sci_WrappedString().init___T(repr$1)
});
ScalaJS.c.sci_StringOps.prototype.newBuilder__scm_Builder = (function() {
  return (this.repr$1, new ScalaJS.c.scm_StringBuilder().init___())
});
ScalaJS.c.sci_StringOps.prototype.stringPrefix__T = (function() {
  return ScalaJS.i.sc_TraversableLike$class__stringPrefix__sc_TraversableLike__T(this)
});
ScalaJS.is.sci_StringOps = (function(obj) {
  return (!(!((obj && obj.$classData) && obj.$classData.ancestors.sci_StringOps)))
});
ScalaJS.as.sci_StringOps = (function(obj) {
  return ((ScalaJS.is.sci_StringOps(obj) || (obj === null)) ? obj : ScalaJS.throwClassCastException(obj, "scala.collection.immutable.StringOps"))
});
ScalaJS.isArrayOf.sci_StringOps = (function(obj, depth) {
  return (!(!(((obj && obj.$classData) && (obj.$classData.arrayDepth === depth)) && obj.$classData.arrayBase.ancestors.sci_StringOps)))
});
ScalaJS.asArrayOf.sci_StringOps = (function(obj, depth) {
  return ((ScalaJS.isArrayOf.sci_StringOps(obj, depth) || (obj === null)) ? obj : ScalaJS.throwArrayCastException(obj, "Lscala.collection.immutable.StringOps;", depth))
});
ScalaJS.d.sci_StringOps = new ScalaJS.ClassTypeData({
  sci_StringOps: 0
}, false, "scala.collection.immutable.StringOps", ScalaJS.d.O, {
  sci_StringOps: 1,
  sci_StringLike: 1,
  s_math_Ordered: 1,
  jl_Comparable: 1,
  sc_IndexedSeqOptimized: 1,
  sc_IndexedSeqLike: 1,
  sc_SeqLike: 1,
  sc_GenSeqLike: 1,
  sc_IterableLike: 1,
  sc_GenIterableLike: 1,
  sc_TraversableLike: 1,
  sc_GenTraversableLike: 1,
  sc_Parallelizable: 1,
  sc_TraversableOnce: 1,
  sc_GenTraversableOnce: 1,
  scg_FilterMonadic: 1,
  scg_HasNewBuilder: 1,
  s_Equals: 1,
  O: 1
});
ScalaJS.c.sci_StringOps.prototype.$classData = ScalaJS.d.sci_StringOps;
/** @constructor */
ScalaJS.c.sci_StringOps$ = (function() {
  ScalaJS.c.O.call(this)
});
ScalaJS.c.sci_StringOps$.prototype = new ScalaJS.h.O();
ScalaJS.c.sci_StringOps$.prototype.constructor = ScalaJS.c.sci_StringOps$;
/** @constructor */
ScalaJS.h.sci_StringOps$ = (function() {
  /*<skip>*/
});
ScalaJS.h.sci_StringOps$.prototype = ScalaJS.c.sci_StringOps$.prototype;
ScalaJS.c.sci_StringOps$.prototype.equals$extension__T__O__Z = (function($$this, x$1) {
  if (ScalaJS.is.sci_StringOps(x$1)) {
    var StringOps$1 = ((x$1 === null) ? null : ScalaJS.as.sci_StringOps(x$1).repr$1);
    return ScalaJS.anyRefEqEq($$this, StringOps$1)
  } else {
    return false
  }
});
ScalaJS.c.sci_StringOps$.prototype.hashCode$extension__T__I = (function($$this) {
  return ScalaJS.objectHashCode($$this)
});
ScalaJS.is.sci_StringOps$ = (function(obj) {
  return (!(!((obj && obj.$classData) && obj.$classData.ancestors.sci_StringOps$)))
});
ScalaJS.as.sci_StringOps$ = (function(obj) {
  return ((ScalaJS.is.sci_StringOps$(obj) || (obj === null)) ? obj : ScalaJS.throwClassCastException(obj, "scala.collection.immutable.StringOps$"))
});
ScalaJS.isArrayOf.sci_StringOps$ = (function(obj, depth) {
  return (!(!(((obj && obj.$classData) && (obj.$classData.arrayDepth === depth)) && obj.$classData.arrayBase.ancestors.sci_StringOps$)))
});
ScalaJS.asArrayOf.sci_StringOps$ = (function(obj, depth) {
  return ((ScalaJS.isArrayOf.sci_StringOps$(obj, depth) || (obj === null)) ? obj : ScalaJS.throwArrayCastException(obj, "Lscala.collection.immutable.StringOps$;", depth))
});
ScalaJS.d.sci_StringOps$ = new ScalaJS.ClassTypeData({
  sci_StringOps$: 0
}, false, "scala.collection.immutable.StringOps$", ScalaJS.d.O, {
  sci_StringOps$: 1,
  O: 1
});
ScalaJS.c.sci_StringOps$.prototype.$classData = ScalaJS.d.sci_StringOps$;
ScalaJS.n.sci_StringOps = (void 0);
ScalaJS.m.sci_StringOps = (function() {
  if ((!ScalaJS.n.sci_StringOps)) {
    ScalaJS.n.sci_StringOps = new ScalaJS.c.sci_StringOps$().init___()
  };
  return ScalaJS.n.sci_StringOps
});
/** @constructor */
ScalaJS.c.sci_VectorBuilder = (function() {
  ScalaJS.c.O.call(this);
  this.blockIndex$1 = 0;
  this.lo$1 = 0;
  this.depth$1 = 0;
  this.display0$1 = null;
  this.display1$1 = null;
  this.display2$1 = null;
  this.display3$1 = null;
  this.display4$1 = null;
  this.display5$1 = null
});
ScalaJS.c.sci_VectorBuilder.prototype = new ScalaJS.h.O();
ScalaJS.c.sci_VectorBuilder.prototype.constructor = ScalaJS.c.sci_VectorBuilder;
/** @constructor */
ScalaJS.h.sci_VectorBuilder = (function() {
  /*<skip>*/
});
ScalaJS.h.sci_VectorBuilder.prototype = ScalaJS.c.sci_VectorBuilder.prototype;
ScalaJS.c.sci_VectorBuilder.prototype.display3__AO = (function() {
  return this.display3$1
});
ScalaJS.c.sci_VectorBuilder.prototype.init___ = (function() {
  this.display0$1 = ScalaJS.newArrayObject(ScalaJS.d.O.getArrayOf(), [32]);
  this.depth$1 = 1;
  this.blockIndex$1 = 0;
  this.lo$1 = 0;
  return this
});
ScalaJS.c.sci_VectorBuilder.prototype.depth__I = (function() {
  return this.depth$1
});
ScalaJS.c.sci_VectorBuilder.prototype.$$plus$eq__O__scg_Growable = (function(elem) {
  return this.$$plus$eq__O__sci_VectorBuilder(elem)
});
ScalaJS.c.sci_VectorBuilder.prototype.display5$und$eq__AO__V = (function(x$1) {
  this.display5$1 = x$1
});
ScalaJS.c.sci_VectorBuilder.prototype.display0__AO = (function() {
  return this.display0$1
});
ScalaJS.c.sci_VectorBuilder.prototype.display4__AO = (function() {
  return this.display4$1
});
ScalaJS.c.sci_VectorBuilder.prototype.display2$und$eq__AO__V = (function(x$1) {
  this.display2$1 = x$1
});
ScalaJS.c.sci_VectorBuilder.prototype.$$plus$eq__O__sci_VectorBuilder = (function(elem) {
  if ((this.lo$1 >= this.display0$1.u["length"])) {
    var newBlockIndex = ((this.blockIndex$1 + 32) | 0);
    var xor = (this.blockIndex$1 ^ newBlockIndex);
    ScalaJS.i.sci_VectorPointer$class__gotoNextBlockStartWritable__sci_VectorPointer__I__I__V(this, newBlockIndex, xor);
    this.blockIndex$1 = newBlockIndex;
    this.lo$1 = 0
  };
  this.display0$1.u[this.lo$1] = elem;
  this.lo$1 = ((this.lo$1 + 1) | 0);
  return this
});
ScalaJS.c.sci_VectorBuilder.prototype.result__O = (function() {
  return this.result__sci_Vector()
});
ScalaJS.c.sci_VectorBuilder.prototype.display1$und$eq__AO__V = (function(x$1) {
  this.display1$1 = x$1
});
ScalaJS.c.sci_VectorBuilder.prototype.sizeHintBounded__I__sc_TraversableLike__V = (function(size, boundingColl) {
  ScalaJS.i.scm_Builder$class__sizeHintBounded__scm_Builder__I__sc_TraversableLike__V(this, size, boundingColl)
});
ScalaJS.c.sci_VectorBuilder.prototype.display4$und$eq__AO__V = (function(x$1) {
  this.display4$1 = x$1
});
ScalaJS.c.sci_VectorBuilder.prototype.display1__AO = (function() {
  return this.display1$1
});
ScalaJS.c.sci_VectorBuilder.prototype.display5__AO = (function() {
  return this.display5$1
});
ScalaJS.c.sci_VectorBuilder.prototype.result__sci_Vector = (function() {
  var size = ((this.blockIndex$1 + this.lo$1) | 0);
  if ((size === 0)) {
    var this$1 = ScalaJS.m.sci_Vector();
    return this$1.NIL$6
  };
  var s = new ScalaJS.c.sci_Vector().init___I__I__I(0, size, 0);
  var depth = this.depth$1;
  ScalaJS.i.sci_VectorPointer$class__initFrom__sci_VectorPointer__sci_VectorPointer__I__V(s, this, depth);
  if ((this.depth$1 > 1)) {
    var xor = ((size - 1) | 0);
    ScalaJS.i.sci_VectorPointer$class__gotoPos__sci_VectorPointer__I__I__V(s, 0, xor)
  };
  return s
});
ScalaJS.c.sci_VectorBuilder.prototype.$$plus$eq__O__scm_Builder = (function(elem) {
  return this.$$plus$eq__O__sci_VectorBuilder(elem)
});
ScalaJS.c.sci_VectorBuilder.prototype.sizeHint__I__V = (function(size) {
  /*<skip>*/
});
ScalaJS.c.sci_VectorBuilder.prototype.depth$und$eq__I__V = (function(x$1) {
  this.depth$1 = x$1
});
ScalaJS.c.sci_VectorBuilder.prototype.display2__AO = (function() {
  return this.display2$1
});
ScalaJS.c.sci_VectorBuilder.prototype.display0$und$eq__AO__V = (function(x$1) {
  this.display0$1 = x$1
});
ScalaJS.c.sci_VectorBuilder.prototype.$$plus$plus$eq__sc_TraversableOnce__scg_Growable = (function(xs) {
  return ScalaJS.as.sci_VectorBuilder(ScalaJS.i.scg_Growable$class__$plus$plus$eq__scg_Growable__sc_TraversableOnce__scg_Growable(this, xs))
});
ScalaJS.c.sci_VectorBuilder.prototype.display3$und$eq__AO__V = (function(x$1) {
  this.display3$1 = x$1
});
ScalaJS.is.sci_VectorBuilder = (function(obj) {
  return (!(!((obj && obj.$classData) && obj.$classData.ancestors.sci_VectorBuilder)))
});
ScalaJS.as.sci_VectorBuilder = (function(obj) {
  return ((ScalaJS.is.sci_VectorBuilder(obj) || (obj === null)) ? obj : ScalaJS.throwClassCastException(obj, "scala.collection.immutable.VectorBuilder"))
});
ScalaJS.isArrayOf.sci_VectorBuilder = (function(obj, depth) {
  return (!(!(((obj && obj.$classData) && (obj.$classData.arrayDepth === depth)) && obj.$classData.arrayBase.ancestors.sci_VectorBuilder)))
});
ScalaJS.asArrayOf.sci_VectorBuilder = (function(obj, depth) {
  return ((ScalaJS.isArrayOf.sci_VectorBuilder(obj, depth) || (obj === null)) ? obj : ScalaJS.throwArrayCastException(obj, "Lscala.collection.immutable.VectorBuilder;", depth))
});
ScalaJS.d.sci_VectorBuilder = new ScalaJS.ClassTypeData({
  sci_VectorBuilder: 0
}, false, "scala.collection.immutable.VectorBuilder", ScalaJS.d.O, {
  sci_VectorBuilder: 1,
  sci_VectorPointer: 1,
  scm_Builder: 1,
  scg_Growable: 1,
  scg_Clearable: 1,
  O: 1
});
ScalaJS.c.sci_VectorBuilder.prototype.$classData = ScalaJS.d.sci_VectorBuilder;
/** @constructor */
ScalaJS.c.sci_WrappedString$ = (function() {
  ScalaJS.c.O.call(this)
});
ScalaJS.c.sci_WrappedString$.prototype = new ScalaJS.h.O();
ScalaJS.c.sci_WrappedString$.prototype.constructor = ScalaJS.c.sci_WrappedString$;
/** @constructor */
ScalaJS.h.sci_WrappedString$ = (function() {
  /*<skip>*/
});
ScalaJS.h.sci_WrappedString$.prototype = ScalaJS.c.sci_WrappedString$.prototype;
ScalaJS.c.sci_WrappedString$.prototype.newBuilder__scm_Builder = (function() {
  var this$3 = new ScalaJS.c.scm_StringBuilder().init___();
  var f = new ScalaJS.c.sjsr_AnonFunction1().init___sjs_js_Function1((function(this$2) {
    return (function(x$2) {
      var x = ScalaJS.as.T(x$2);
      return new ScalaJS.c.sci_WrappedString().init___T(x)
    })
  })(this));
  return new ScalaJS.c.scm_Builder$$anon$1().init___scm_Builder__F1(this$3, f)
});
ScalaJS.is.sci_WrappedString$ = (function(obj) {
  return (!(!((obj && obj.$classData) && obj.$classData.ancestors.sci_WrappedString$)))
});
ScalaJS.as.sci_WrappedString$ = (function(obj) {
  return ((ScalaJS.is.sci_WrappedString$(obj) || (obj === null)) ? obj : ScalaJS.throwClassCastException(obj, "scala.collection.immutable.WrappedString$"))
});
ScalaJS.isArrayOf.sci_WrappedString$ = (function(obj, depth) {
  return (!(!(((obj && obj.$classData) && (obj.$classData.arrayDepth === depth)) && obj.$classData.arrayBase.ancestors.sci_WrappedString$)))
});
ScalaJS.asArrayOf.sci_WrappedString$ = (function(obj, depth) {
  return ((ScalaJS.isArrayOf.sci_WrappedString$(obj, depth) || (obj === null)) ? obj : ScalaJS.throwArrayCastException(obj, "Lscala.collection.immutable.WrappedString$;", depth))
});
ScalaJS.d.sci_WrappedString$ = new ScalaJS.ClassTypeData({
  sci_WrappedString$: 0
}, false, "scala.collection.immutable.WrappedString$", ScalaJS.d.O, {
  sci_WrappedString$: 1,
  O: 1
});
ScalaJS.c.sci_WrappedString$.prototype.$classData = ScalaJS.d.sci_WrappedString$;
ScalaJS.n.sci_WrappedString = (void 0);
ScalaJS.m.sci_WrappedString = (function() {
  if ((!ScalaJS.n.sci_WrappedString)) {
    ScalaJS.n.sci_WrappedString = new ScalaJS.c.sci_WrappedString$().init___()
  };
  return ScalaJS.n.sci_WrappedString
});
/** @constructor */
ScalaJS.c.scm_ArrayBuilder = (function() {
  ScalaJS.c.O.call(this)
});
ScalaJS.c.scm_ArrayBuilder.prototype = new ScalaJS.h.O();
ScalaJS.c.scm_ArrayBuilder.prototype.constructor = ScalaJS.c.scm_ArrayBuilder;
/** @constructor */
ScalaJS.h.scm_ArrayBuilder = (function() {
  /*<skip>*/
});
ScalaJS.h.scm_ArrayBuilder.prototype = ScalaJS.c.scm_ArrayBuilder.prototype;
ScalaJS.c.scm_ArrayBuilder.prototype.sizeHintBounded__I__sc_TraversableLike__V = (function(size, boundingColl) {
  ScalaJS.i.scm_Builder$class__sizeHintBounded__scm_Builder__I__sc_TraversableLike__V(this, size, boundingColl)
});
ScalaJS.is.scm_ArrayBuilder = (function(obj) {
  return (!(!((obj && obj.$classData) && obj.$classData.ancestors.scm_ArrayBuilder)))
});
ScalaJS.as.scm_ArrayBuilder = (function(obj) {
  return ((ScalaJS.is.scm_ArrayBuilder(obj) || (obj === null)) ? obj : ScalaJS.throwClassCastException(obj, "scala.collection.mutable.ArrayBuilder"))
});
ScalaJS.isArrayOf.scm_ArrayBuilder = (function(obj, depth) {
  return (!(!(((obj && obj.$classData) && (obj.$classData.arrayDepth === depth)) && obj.$classData.arrayBase.ancestors.scm_ArrayBuilder)))
});
ScalaJS.asArrayOf.scm_ArrayBuilder = (function(obj, depth) {
  return ((ScalaJS.isArrayOf.scm_ArrayBuilder(obj, depth) || (obj === null)) ? obj : ScalaJS.throwArrayCastException(obj, "Lscala.collection.mutable.ArrayBuilder;", depth))
});
ScalaJS.d.scm_ArrayBuilder = new ScalaJS.ClassTypeData({
  scm_ArrayBuilder: 0
}, false, "scala.collection.mutable.ArrayBuilder", ScalaJS.d.O, {
  scm_ArrayBuilder: 1,
  s_Serializable: 1,
  Ljava_io_Serializable: 1,
  scm_Builder: 1,
  scg_Growable: 1,
  scg_Clearable: 1,
  O: 1
});
ScalaJS.c.scm_ArrayBuilder.prototype.$classData = ScalaJS.d.scm_ArrayBuilder;
/** @constructor */
ScalaJS.c.scm_ArrayOps$ofBoolean = (function() {
  ScalaJS.c.O.call(this);
  this.repr$1 = null
});
ScalaJS.c.scm_ArrayOps$ofBoolean.prototype = new ScalaJS.h.O();
ScalaJS.c.scm_ArrayOps$ofBoolean.prototype.constructor = ScalaJS.c.scm_ArrayOps$ofBoolean;
/** @constructor */
ScalaJS.h.scm_ArrayOps$ofBoolean = (function() {
  /*<skip>*/
});
ScalaJS.h.scm_ArrayOps$ofBoolean.prototype = ScalaJS.c.scm_ArrayOps$ofBoolean.prototype;
ScalaJS.c.scm_ArrayOps$ofBoolean.prototype.seq__sc_TraversableOnce = (function() {
  var $$this = this.repr$1;
  return new ScalaJS.c.scm_WrappedArray$ofBoolean().init___AZ($$this)
});
ScalaJS.c.scm_ArrayOps$ofBoolean.prototype.copyToArray__O__I__V = (function(xs, start) {
  ScalaJS.i.sc_TraversableOnce$class__copyToArray__sc_TraversableOnce__O__I__V(this, xs, start)
});
ScalaJS.c.scm_ArrayOps$ofBoolean.prototype.apply__I__O = (function(idx) {
  var $$this = this.repr$1;
  return $$this.u[idx]
});
ScalaJS.c.scm_ArrayOps$ofBoolean.prototype.lengthCompare__I__I = (function(len) {
  return ScalaJS.i.sc_IndexedSeqOptimized$class__lengthCompare__sc_IndexedSeqOptimized__I__I(this, len)
});
ScalaJS.c.scm_ArrayOps$ofBoolean.prototype.sameElements__sc_GenIterable__Z = (function(that) {
  return ScalaJS.i.sc_IndexedSeqOptimized$class__sameElements__sc_IndexedSeqOptimized__sc_GenIterable__Z(this, that)
});
ScalaJS.c.scm_ArrayOps$ofBoolean.prototype.isEmpty__Z = (function() {
  return ScalaJS.i.sc_IndexedSeqOptimized$class__isEmpty__sc_IndexedSeqOptimized__Z(this)
});
ScalaJS.c.scm_ArrayOps$ofBoolean.prototype.toList__sci_List = (function() {
  var this$1 = ScalaJS.m.sci_List();
  var cbf = this$1.ReusableCBFInstance$2;
  return ScalaJS.as.sci_List(ScalaJS.i.sc_TraversableLike$class__to__sc_TraversableLike__scg_CanBuildFrom__O(this, cbf))
});
ScalaJS.c.scm_ArrayOps$ofBoolean.prototype.thisCollection__sc_Traversable = (function() {
  var $$this = this.repr$1;
  return new ScalaJS.c.scm_WrappedArray$ofBoolean().init___AZ($$this)
});
ScalaJS.c.scm_ArrayOps$ofBoolean.prototype.equals__O__Z = (function(x$1) {
  return ScalaJS.m.scm_ArrayOps$ofBoolean().equals$extension__AZ__O__Z(this.repr$1, x$1)
});
ScalaJS.c.scm_ArrayOps$ofBoolean.prototype.mkString__T__T__T__T = (function(start, sep, end) {
  return ScalaJS.i.sc_TraversableOnce$class__mkString__sc_TraversableOnce__T__T__T__T(this, start, sep, end)
});
ScalaJS.c.scm_ArrayOps$ofBoolean.prototype.toString__T = (function() {
  return ScalaJS.i.sc_TraversableLike$class__toString__sc_TraversableLike__T(this)
});
ScalaJS.c.scm_ArrayOps$ofBoolean.prototype.foreach__F1__V = (function(f) {
  ScalaJS.i.sc_IndexedSeqOptimized$class__foreach__sc_IndexedSeqOptimized__F1__V(this, f)
});
ScalaJS.c.scm_ArrayOps$ofBoolean.prototype.reverse__O = (function() {
  return ScalaJS.i.sc_IndexedSeqOptimized$class__reverse__sc_IndexedSeqOptimized__O(this)
});
ScalaJS.c.scm_ArrayOps$ofBoolean.prototype.filter__F1__O = (function(p) {
  return ScalaJS.i.sc_TraversableLike$class__filterImpl__sc_TraversableLike__F1__Z__O(this, p, false)
});
ScalaJS.c.scm_ArrayOps$ofBoolean.prototype.toBuffer__scm_Buffer = (function() {
  return ScalaJS.i.sc_IndexedSeqLike$class__toBuffer__sc_IndexedSeqLike__scm_Buffer(this)
});
ScalaJS.c.scm_ArrayOps$ofBoolean.prototype.size__I = (function() {
  var $$this = this.repr$1;
  return $$this.u["length"]
});
ScalaJS.c.scm_ArrayOps$ofBoolean.prototype.iterator__sc_Iterator = (function() {
  var $$this = this.repr$1;
  return new ScalaJS.c.sc_IndexedSeqLike$Elements().init___sc_IndexedSeqLike__I__I(this, 0, $$this.u["length"])
});
ScalaJS.c.scm_ArrayOps$ofBoolean.prototype.length__I = (function() {
  var $$this = this.repr$1;
  return $$this.u["length"]
});
ScalaJS.c.scm_ArrayOps$ofBoolean.prototype.toStream__sci_Stream = (function() {
  var $$this = this.repr$1;
  var this$2 = new ScalaJS.c.sc_IndexedSeqLike$Elements().init___sc_IndexedSeqLike__I__I(this, 0, $$this.u["length"]);
  return ScalaJS.i.sc_Iterator$class__toStream__sc_Iterator__sci_Stream(this$2)
});
ScalaJS.c.scm_ArrayOps$ofBoolean.prototype.thisCollection__sc_Seq = (function() {
  var $$this = this.repr$1;
  return new ScalaJS.c.scm_WrappedArray$ofBoolean().init___AZ($$this)
});
ScalaJS.c.scm_ArrayOps$ofBoolean.prototype.addString__scm_StringBuilder__T__T__T__scm_StringBuilder = (function(b, start, sep, end) {
  return ScalaJS.i.sc_TraversableOnce$class__addString__sc_TraversableOnce__scm_StringBuilder__T__T__T__scm_StringBuilder(this, b, start, sep, end)
});
ScalaJS.c.scm_ArrayOps$ofBoolean.prototype.init___AZ = (function(repr) {
  this.repr$1 = repr;
  return this
});
ScalaJS.c.scm_ArrayOps$ofBoolean.prototype.repr__O = (function() {
  return this.repr$1
});
ScalaJS.c.scm_ArrayOps$ofBoolean.prototype.$$div$colon__O__F2__O = (function(z, op) {
  var $$this = this.repr$1;
  return ScalaJS.i.sc_IndexedSeqOptimized$class__foldl__sc_IndexedSeqOptimized__I__I__O__F2__O(this, 0, $$this.u["length"], z, op)
});
ScalaJS.c.scm_ArrayOps$ofBoolean.prototype.hashCode__I = (function() {
  return ScalaJS.m.scm_ArrayOps$ofBoolean().hashCode$extension__AZ__I(this.repr$1)
});
ScalaJS.c.scm_ArrayOps$ofBoolean.prototype.copyToArray__O__I__I__V = (function(xs, start, len) {
  ScalaJS.i.scm_ArrayOps$class__copyToArray__scm_ArrayOps__O__I__I__V(this, xs, start, len)
});
ScalaJS.c.scm_ArrayOps$ofBoolean.prototype.isTraversableAgain__Z = (function() {
  return true
});
ScalaJS.c.scm_ArrayOps$ofBoolean.prototype.toArray__s_reflect_ClassTag__O = (function(evidence$1) {
  return ScalaJS.i.scm_ArrayOps$class__toArray__scm_ArrayOps__s_reflect_ClassTag__O(this, evidence$1)
});
ScalaJS.c.scm_ArrayOps$ofBoolean.prototype.toCollection__O__sc_Seq = (function(repr) {
  this.repr$1;
  var repr$1 = ScalaJS.asArrayOf.Z(repr, 1);
  return new ScalaJS.c.scm_WrappedArray$ofBoolean().init___AZ(repr$1)
});
ScalaJS.c.scm_ArrayOps$ofBoolean.prototype.newBuilder__scm_Builder = (function() {
  return (this.repr$1, new ScalaJS.c.scm_ArrayBuilder$ofBoolean().init___())
});
ScalaJS.c.scm_ArrayOps$ofBoolean.prototype.stringPrefix__T = (function() {
  return ScalaJS.i.sc_TraversableLike$class__stringPrefix__sc_TraversableLike__T(this)
});
ScalaJS.is.scm_ArrayOps$ofBoolean = (function(obj) {
  return (!(!((obj && obj.$classData) && obj.$classData.ancestors.scm_ArrayOps$ofBoolean)))
});
ScalaJS.as.scm_ArrayOps$ofBoolean = (function(obj) {
  return ((ScalaJS.is.scm_ArrayOps$ofBoolean(obj) || (obj === null)) ? obj : ScalaJS.throwClassCastException(obj, "scala.collection.mutable.ArrayOps$ofBoolean"))
});
ScalaJS.isArrayOf.scm_ArrayOps$ofBoolean = (function(obj, depth) {
  return (!(!(((obj && obj.$classData) && (obj.$classData.arrayDepth === depth)) && obj.$classData.arrayBase.ancestors.scm_ArrayOps$ofBoolean)))
});
ScalaJS.asArrayOf.scm_ArrayOps$ofBoolean = (function(obj, depth) {
  return ((ScalaJS.isArrayOf.scm_ArrayOps$ofBoolean(obj, depth) || (obj === null)) ? obj : ScalaJS.throwArrayCastException(obj, "Lscala.collection.mutable.ArrayOps$ofBoolean;", depth))
});
ScalaJS.d.scm_ArrayOps$ofBoolean = new ScalaJS.ClassTypeData({
  scm_ArrayOps$ofBoolean: 0
}, false, "scala.collection.mutable.ArrayOps$ofBoolean", ScalaJS.d.O, {
  scm_ArrayOps$ofBoolean: 1,
  scm_ArrayOps: 1,
  sc_CustomParallelizable: 1,
  scm_ArrayLike: 1,
  scm_IndexedSeqOptimized: 1,
  sc_IndexedSeqOptimized: 1,
  scm_IndexedSeqLike: 1,
  sc_IndexedSeqLike: 1,
  sc_SeqLike: 1,
  sc_GenSeqLike: 1,
  sc_IterableLike: 1,
  sc_GenIterableLike: 1,
  sc_TraversableLike: 1,
  sc_GenTraversableLike: 1,
  sc_Parallelizable: 1,
  sc_TraversableOnce: 1,
  sc_GenTraversableOnce: 1,
  scg_FilterMonadic: 1,
  scg_HasNewBuilder: 1,
  s_Equals: 1,
  O: 1
});
ScalaJS.c.scm_ArrayOps$ofBoolean.prototype.$classData = ScalaJS.d.scm_ArrayOps$ofBoolean;
/** @constructor */
ScalaJS.c.scm_ArrayOps$ofBoolean$ = (function() {
  ScalaJS.c.O.call(this)
});
ScalaJS.c.scm_ArrayOps$ofBoolean$.prototype = new ScalaJS.h.O();
ScalaJS.c.scm_ArrayOps$ofBoolean$.prototype.constructor = ScalaJS.c.scm_ArrayOps$ofBoolean$;
/** @constructor */
ScalaJS.h.scm_ArrayOps$ofBoolean$ = (function() {
  /*<skip>*/
});
ScalaJS.h.scm_ArrayOps$ofBoolean$.prototype = ScalaJS.c.scm_ArrayOps$ofBoolean$.prototype;
ScalaJS.c.scm_ArrayOps$ofBoolean$.prototype.hashCode$extension__AZ__I = (function($$this) {
  return ScalaJS.objectHashCode($$this)
});
ScalaJS.c.scm_ArrayOps$ofBoolean$.prototype.equals$extension__AZ__O__Z = (function($$this, x$1) {
  if (ScalaJS.is.scm_ArrayOps$ofBoolean(x$1)) {
    var ofBoolean$1 = ((x$1 === null) ? null : ScalaJS.as.scm_ArrayOps$ofBoolean(x$1).repr$1);
    return ($$this === ofBoolean$1)
  } else {
    return false
  }
});
ScalaJS.is.scm_ArrayOps$ofBoolean$ = (function(obj) {
  return (!(!((obj && obj.$classData) && obj.$classData.ancestors.scm_ArrayOps$ofBoolean$)))
});
ScalaJS.as.scm_ArrayOps$ofBoolean$ = (function(obj) {
  return ((ScalaJS.is.scm_ArrayOps$ofBoolean$(obj) || (obj === null)) ? obj : ScalaJS.throwClassCastException(obj, "scala.collection.mutable.ArrayOps$ofBoolean$"))
});
ScalaJS.isArrayOf.scm_ArrayOps$ofBoolean$ = (function(obj, depth) {
  return (!(!(((obj && obj.$classData) && (obj.$classData.arrayDepth === depth)) && obj.$classData.arrayBase.ancestors.scm_ArrayOps$ofBoolean$)))
});
ScalaJS.asArrayOf.scm_ArrayOps$ofBoolean$ = (function(obj, depth) {
  return ((ScalaJS.isArrayOf.scm_ArrayOps$ofBoolean$(obj, depth) || (obj === null)) ? obj : ScalaJS.throwArrayCastException(obj, "Lscala.collection.mutable.ArrayOps$ofBoolean$;", depth))
});
ScalaJS.d.scm_ArrayOps$ofBoolean$ = new ScalaJS.ClassTypeData({
  scm_ArrayOps$ofBoolean$: 0
}, false, "scala.collection.mutable.ArrayOps$ofBoolean$", ScalaJS.d.O, {
  scm_ArrayOps$ofBoolean$: 1,
  O: 1
});
ScalaJS.c.scm_ArrayOps$ofBoolean$.prototype.$classData = ScalaJS.d.scm_ArrayOps$ofBoolean$;
ScalaJS.n.scm_ArrayOps$ofBoolean = (void 0);
ScalaJS.m.scm_ArrayOps$ofBoolean = (function() {
  if ((!ScalaJS.n.scm_ArrayOps$ofBoolean)) {
    ScalaJS.n.scm_ArrayOps$ofBoolean = new ScalaJS.c.scm_ArrayOps$ofBoolean$().init___()
  };
  return ScalaJS.n.scm_ArrayOps$ofBoolean
});
/** @constructor */
ScalaJS.c.scm_ArrayOps$ofByte = (function() {
  ScalaJS.c.O.call(this);
  this.repr$1 = null
});
ScalaJS.c.scm_ArrayOps$ofByte.prototype = new ScalaJS.h.O();
ScalaJS.c.scm_ArrayOps$ofByte.prototype.constructor = ScalaJS.c.scm_ArrayOps$ofByte;
/** @constructor */
ScalaJS.h.scm_ArrayOps$ofByte = (function() {
  /*<skip>*/
});
ScalaJS.h.scm_ArrayOps$ofByte.prototype = ScalaJS.c.scm_ArrayOps$ofByte.prototype;
ScalaJS.c.scm_ArrayOps$ofByte.prototype.seq__sc_TraversableOnce = (function() {
  var $$this = this.repr$1;
  return new ScalaJS.c.scm_WrappedArray$ofByte().init___AB($$this)
});
ScalaJS.c.scm_ArrayOps$ofByte.prototype.copyToArray__O__I__V = (function(xs, start) {
  ScalaJS.i.sc_TraversableOnce$class__copyToArray__sc_TraversableOnce__O__I__V(this, xs, start)
});
ScalaJS.c.scm_ArrayOps$ofByte.prototype.apply__I__O = (function(idx) {
  var $$this = this.repr$1;
  return $$this.u[idx]
});
ScalaJS.c.scm_ArrayOps$ofByte.prototype.lengthCompare__I__I = (function(len) {
  return ScalaJS.i.sc_IndexedSeqOptimized$class__lengthCompare__sc_IndexedSeqOptimized__I__I(this, len)
});
ScalaJS.c.scm_ArrayOps$ofByte.prototype.sameElements__sc_GenIterable__Z = (function(that) {
  return ScalaJS.i.sc_IndexedSeqOptimized$class__sameElements__sc_IndexedSeqOptimized__sc_GenIterable__Z(this, that)
});
ScalaJS.c.scm_ArrayOps$ofByte.prototype.isEmpty__Z = (function() {
  return ScalaJS.i.sc_IndexedSeqOptimized$class__isEmpty__sc_IndexedSeqOptimized__Z(this)
});
ScalaJS.c.scm_ArrayOps$ofByte.prototype.toList__sci_List = (function() {
  var this$1 = ScalaJS.m.sci_List();
  var cbf = this$1.ReusableCBFInstance$2;
  return ScalaJS.as.sci_List(ScalaJS.i.sc_TraversableLike$class__to__sc_TraversableLike__scg_CanBuildFrom__O(this, cbf))
});
ScalaJS.c.scm_ArrayOps$ofByte.prototype.thisCollection__sc_Traversable = (function() {
  var $$this = this.repr$1;
  return new ScalaJS.c.scm_WrappedArray$ofByte().init___AB($$this)
});
ScalaJS.c.scm_ArrayOps$ofByte.prototype.equals__O__Z = (function(x$1) {
  return ScalaJS.m.scm_ArrayOps$ofByte().equals$extension__AB__O__Z(this.repr$1, x$1)
});
ScalaJS.c.scm_ArrayOps$ofByte.prototype.mkString__T__T__T__T = (function(start, sep, end) {
  return ScalaJS.i.sc_TraversableOnce$class__mkString__sc_TraversableOnce__T__T__T__T(this, start, sep, end)
});
ScalaJS.c.scm_ArrayOps$ofByte.prototype.toString__T = (function() {
  return ScalaJS.i.sc_TraversableLike$class__toString__sc_TraversableLike__T(this)
});
ScalaJS.c.scm_ArrayOps$ofByte.prototype.foreach__F1__V = (function(f) {
  ScalaJS.i.sc_IndexedSeqOptimized$class__foreach__sc_IndexedSeqOptimized__F1__V(this, f)
});
ScalaJS.c.scm_ArrayOps$ofByte.prototype.reverse__O = (function() {
  return ScalaJS.i.sc_IndexedSeqOptimized$class__reverse__sc_IndexedSeqOptimized__O(this)
});
ScalaJS.c.scm_ArrayOps$ofByte.prototype.filter__F1__O = (function(p) {
  return ScalaJS.i.sc_TraversableLike$class__filterImpl__sc_TraversableLike__F1__Z__O(this, p, false)
});
ScalaJS.c.scm_ArrayOps$ofByte.prototype.toBuffer__scm_Buffer = (function() {
  return ScalaJS.i.sc_IndexedSeqLike$class__toBuffer__sc_IndexedSeqLike__scm_Buffer(this)
});
ScalaJS.c.scm_ArrayOps$ofByte.prototype.size__I = (function() {
  var $$this = this.repr$1;
  return $$this.u["length"]
});
ScalaJS.c.scm_ArrayOps$ofByte.prototype.iterator__sc_Iterator = (function() {
  var $$this = this.repr$1;
  return new ScalaJS.c.sc_IndexedSeqLike$Elements().init___sc_IndexedSeqLike__I__I(this, 0, $$this.u["length"])
});
ScalaJS.c.scm_ArrayOps$ofByte.prototype.length__I = (function() {
  var $$this = this.repr$1;
  return $$this.u["length"]
});
ScalaJS.c.scm_ArrayOps$ofByte.prototype.toStream__sci_Stream = (function() {
  var $$this = this.repr$1;
  var this$2 = new ScalaJS.c.sc_IndexedSeqLike$Elements().init___sc_IndexedSeqLike__I__I(this, 0, $$this.u["length"]);
  return ScalaJS.i.sc_Iterator$class__toStream__sc_Iterator__sci_Stream(this$2)
});
ScalaJS.c.scm_ArrayOps$ofByte.prototype.thisCollection__sc_Seq = (function() {
  var $$this = this.repr$1;
  return new ScalaJS.c.scm_WrappedArray$ofByte().init___AB($$this)
});
ScalaJS.c.scm_ArrayOps$ofByte.prototype.addString__scm_StringBuilder__T__T__T__scm_StringBuilder = (function(b, start, sep, end) {
  return ScalaJS.i.sc_TraversableOnce$class__addString__sc_TraversableOnce__scm_StringBuilder__T__T__T__scm_StringBuilder(this, b, start, sep, end)
});
ScalaJS.c.scm_ArrayOps$ofByte.prototype.repr__O = (function() {
  return this.repr$1
});
ScalaJS.c.scm_ArrayOps$ofByte.prototype.$$div$colon__O__F2__O = (function(z, op) {
  var $$this = this.repr$1;
  return ScalaJS.i.sc_IndexedSeqOptimized$class__foldl__sc_IndexedSeqOptimized__I__I__O__F2__O(this, 0, $$this.u["length"], z, op)
});
ScalaJS.c.scm_ArrayOps$ofByte.prototype.hashCode__I = (function() {
  return ScalaJS.m.scm_ArrayOps$ofByte().hashCode$extension__AB__I(this.repr$1)
});
ScalaJS.c.scm_ArrayOps$ofByte.prototype.copyToArray__O__I__I__V = (function(xs, start, len) {
  ScalaJS.i.scm_ArrayOps$class__copyToArray__scm_ArrayOps__O__I__I__V(this, xs, start, len)
});
ScalaJS.c.scm_ArrayOps$ofByte.prototype.isTraversableAgain__Z = (function() {
  return true
});
ScalaJS.c.scm_ArrayOps$ofByte.prototype.init___AB = (function(repr) {
  this.repr$1 = repr;
  return this
});
ScalaJS.c.scm_ArrayOps$ofByte.prototype.toArray__s_reflect_ClassTag__O = (function(evidence$1) {
  return ScalaJS.i.scm_ArrayOps$class__toArray__scm_ArrayOps__s_reflect_ClassTag__O(this, evidence$1)
});
ScalaJS.c.scm_ArrayOps$ofByte.prototype.toCollection__O__sc_Seq = (function(repr) {
  this.repr$1;
  var repr$1 = ScalaJS.asArrayOf.B(repr, 1);
  return new ScalaJS.c.scm_WrappedArray$ofByte().init___AB(repr$1)
});
ScalaJS.c.scm_ArrayOps$ofByte.prototype.newBuilder__scm_Builder = (function() {
  return (this.repr$1, new ScalaJS.c.scm_ArrayBuilder$ofByte().init___())
});
ScalaJS.c.scm_ArrayOps$ofByte.prototype.stringPrefix__T = (function() {
  return ScalaJS.i.sc_TraversableLike$class__stringPrefix__sc_TraversableLike__T(this)
});
ScalaJS.is.scm_ArrayOps$ofByte = (function(obj) {
  return (!(!((obj && obj.$classData) && obj.$classData.ancestors.scm_ArrayOps$ofByte)))
});
ScalaJS.as.scm_ArrayOps$ofByte = (function(obj) {
  return ((ScalaJS.is.scm_ArrayOps$ofByte(obj) || (obj === null)) ? obj : ScalaJS.throwClassCastException(obj, "scala.collection.mutable.ArrayOps$ofByte"))
});
ScalaJS.isArrayOf.scm_ArrayOps$ofByte = (function(obj, depth) {
  return (!(!(((obj && obj.$classData) && (obj.$classData.arrayDepth === depth)) && obj.$classData.arrayBase.ancestors.scm_ArrayOps$ofByte)))
});
ScalaJS.asArrayOf.scm_ArrayOps$ofByte = (function(obj, depth) {
  return ((ScalaJS.isArrayOf.scm_ArrayOps$ofByte(obj, depth) || (obj === null)) ? obj : ScalaJS.throwArrayCastException(obj, "Lscala.collection.mutable.ArrayOps$ofByte;", depth))
});
ScalaJS.d.scm_ArrayOps$ofByte = new ScalaJS.ClassTypeData({
  scm_ArrayOps$ofByte: 0
}, false, "scala.collection.mutable.ArrayOps$ofByte", ScalaJS.d.O, {
  scm_ArrayOps$ofByte: 1,
  scm_ArrayOps: 1,
  sc_CustomParallelizable: 1,
  scm_ArrayLike: 1,
  scm_IndexedSeqOptimized: 1,
  sc_IndexedSeqOptimized: 1,
  scm_IndexedSeqLike: 1,
  sc_IndexedSeqLike: 1,
  sc_SeqLike: 1,
  sc_GenSeqLike: 1,
  sc_IterableLike: 1,
  sc_GenIterableLike: 1,
  sc_TraversableLike: 1,
  sc_GenTraversableLike: 1,
  sc_Parallelizable: 1,
  sc_TraversableOnce: 1,
  sc_GenTraversableOnce: 1,
  scg_FilterMonadic: 1,
  scg_HasNewBuilder: 1,
  s_Equals: 1,
  O: 1
});
ScalaJS.c.scm_ArrayOps$ofByte.prototype.$classData = ScalaJS.d.scm_ArrayOps$ofByte;
/** @constructor */
ScalaJS.c.scm_ArrayOps$ofByte$ = (function() {
  ScalaJS.c.O.call(this)
});
ScalaJS.c.scm_ArrayOps$ofByte$.prototype = new ScalaJS.h.O();
ScalaJS.c.scm_ArrayOps$ofByte$.prototype.constructor = ScalaJS.c.scm_ArrayOps$ofByte$;
/** @constructor */
ScalaJS.h.scm_ArrayOps$ofByte$ = (function() {
  /*<skip>*/
});
ScalaJS.h.scm_ArrayOps$ofByte$.prototype = ScalaJS.c.scm_ArrayOps$ofByte$.prototype;
ScalaJS.c.scm_ArrayOps$ofByte$.prototype.hashCode$extension__AB__I = (function($$this) {
  return ScalaJS.objectHashCode($$this)
});
ScalaJS.c.scm_ArrayOps$ofByte$.prototype.equals$extension__AB__O__Z = (function($$this, x$1) {
  if (ScalaJS.is.scm_ArrayOps$ofByte(x$1)) {
    var ofByte$1 = ((x$1 === null) ? null : ScalaJS.as.scm_ArrayOps$ofByte(x$1).repr$1);
    return ($$this === ofByte$1)
  } else {
    return false
  }
});
ScalaJS.is.scm_ArrayOps$ofByte$ = (function(obj) {
  return (!(!((obj && obj.$classData) && obj.$classData.ancestors.scm_ArrayOps$ofByte$)))
});
ScalaJS.as.scm_ArrayOps$ofByte$ = (function(obj) {
  return ((ScalaJS.is.scm_ArrayOps$ofByte$(obj) || (obj === null)) ? obj : ScalaJS.throwClassCastException(obj, "scala.collection.mutable.ArrayOps$ofByte$"))
});
ScalaJS.isArrayOf.scm_ArrayOps$ofByte$ = (function(obj, depth) {
  return (!(!(((obj && obj.$classData) && (obj.$classData.arrayDepth === depth)) && obj.$classData.arrayBase.ancestors.scm_ArrayOps$ofByte$)))
});
ScalaJS.asArrayOf.scm_ArrayOps$ofByte$ = (function(obj, depth) {
  return ((ScalaJS.isArrayOf.scm_ArrayOps$ofByte$(obj, depth) || (obj === null)) ? obj : ScalaJS.throwArrayCastException(obj, "Lscala.collection.mutable.ArrayOps$ofByte$;", depth))
});
ScalaJS.d.scm_ArrayOps$ofByte$ = new ScalaJS.ClassTypeData({
  scm_ArrayOps$ofByte$: 0
}, false, "scala.collection.mutable.ArrayOps$ofByte$", ScalaJS.d.O, {
  scm_ArrayOps$ofByte$: 1,
  O: 1
});
ScalaJS.c.scm_ArrayOps$ofByte$.prototype.$classData = ScalaJS.d.scm_ArrayOps$ofByte$;
ScalaJS.n.scm_ArrayOps$ofByte = (void 0);
ScalaJS.m.scm_ArrayOps$ofByte = (function() {
  if ((!ScalaJS.n.scm_ArrayOps$ofByte)) {
    ScalaJS.n.scm_ArrayOps$ofByte = new ScalaJS.c.scm_ArrayOps$ofByte$().init___()
  };
  return ScalaJS.n.scm_ArrayOps$ofByte
});
/** @constructor */
ScalaJS.c.scm_ArrayOps$ofChar = (function() {
  ScalaJS.c.O.call(this);
  this.repr$1 = null
});
ScalaJS.c.scm_ArrayOps$ofChar.prototype = new ScalaJS.h.O();
ScalaJS.c.scm_ArrayOps$ofChar.prototype.constructor = ScalaJS.c.scm_ArrayOps$ofChar;
/** @constructor */
ScalaJS.h.scm_ArrayOps$ofChar = (function() {
  /*<skip>*/
});
ScalaJS.h.scm_ArrayOps$ofChar.prototype = ScalaJS.c.scm_ArrayOps$ofChar.prototype;
ScalaJS.c.scm_ArrayOps$ofChar.prototype.seq__sc_TraversableOnce = (function() {
  var $$this = this.repr$1;
  return new ScalaJS.c.scm_WrappedArray$ofChar().init___AC($$this)
});
ScalaJS.c.scm_ArrayOps$ofChar.prototype.copyToArray__O__I__V = (function(xs, start) {
  ScalaJS.i.sc_TraversableOnce$class__copyToArray__sc_TraversableOnce__O__I__V(this, xs, start)
});
ScalaJS.c.scm_ArrayOps$ofChar.prototype.apply__I__O = (function(idx) {
  var $$this = this.repr$1;
  return ScalaJS.bC($$this.u[idx])
});
ScalaJS.c.scm_ArrayOps$ofChar.prototype.lengthCompare__I__I = (function(len) {
  return ScalaJS.i.sc_IndexedSeqOptimized$class__lengthCompare__sc_IndexedSeqOptimized__I__I(this, len)
});
ScalaJS.c.scm_ArrayOps$ofChar.prototype.sameElements__sc_GenIterable__Z = (function(that) {
  return ScalaJS.i.sc_IndexedSeqOptimized$class__sameElements__sc_IndexedSeqOptimized__sc_GenIterable__Z(this, that)
});
ScalaJS.c.scm_ArrayOps$ofChar.prototype.isEmpty__Z = (function() {
  return ScalaJS.i.sc_IndexedSeqOptimized$class__isEmpty__sc_IndexedSeqOptimized__Z(this)
});
ScalaJS.c.scm_ArrayOps$ofChar.prototype.toList__sci_List = (function() {
  var this$1 = ScalaJS.m.sci_List();
  var cbf = this$1.ReusableCBFInstance$2;
  return ScalaJS.as.sci_List(ScalaJS.i.sc_TraversableLike$class__to__sc_TraversableLike__scg_CanBuildFrom__O(this, cbf))
});
ScalaJS.c.scm_ArrayOps$ofChar.prototype.thisCollection__sc_Traversable = (function() {
  var $$this = this.repr$1;
  return new ScalaJS.c.scm_WrappedArray$ofChar().init___AC($$this)
});
ScalaJS.c.scm_ArrayOps$ofChar.prototype.equals__O__Z = (function(x$1) {
  return ScalaJS.m.scm_ArrayOps$ofChar().equals$extension__AC__O__Z(this.repr$1, x$1)
});
ScalaJS.c.scm_ArrayOps$ofChar.prototype.mkString__T__T__T__T = (function(start, sep, end) {
  return ScalaJS.i.sc_TraversableOnce$class__mkString__sc_TraversableOnce__T__T__T__T(this, start, sep, end)
});
ScalaJS.c.scm_ArrayOps$ofChar.prototype.toString__T = (function() {
  return ScalaJS.i.sc_TraversableLike$class__toString__sc_TraversableLike__T(this)
});
ScalaJS.c.scm_ArrayOps$ofChar.prototype.foreach__F1__V = (function(f) {
  ScalaJS.i.sc_IndexedSeqOptimized$class__foreach__sc_IndexedSeqOptimized__F1__V(this, f)
});
ScalaJS.c.scm_ArrayOps$ofChar.prototype.reverse__O = (function() {
  return ScalaJS.i.sc_IndexedSeqOptimized$class__reverse__sc_IndexedSeqOptimized__O(this)
});
ScalaJS.c.scm_ArrayOps$ofChar.prototype.filter__F1__O = (function(p) {
  return ScalaJS.i.sc_TraversableLike$class__filterImpl__sc_TraversableLike__F1__Z__O(this, p, false)
});
ScalaJS.c.scm_ArrayOps$ofChar.prototype.toBuffer__scm_Buffer = (function() {
  return ScalaJS.i.sc_IndexedSeqLike$class__toBuffer__sc_IndexedSeqLike__scm_Buffer(this)
});
ScalaJS.c.scm_ArrayOps$ofChar.prototype.size__I = (function() {
  var $$this = this.repr$1;
  return $$this.u["length"]
});
ScalaJS.c.scm_ArrayOps$ofChar.prototype.iterator__sc_Iterator = (function() {
  var $$this = this.repr$1;
  return new ScalaJS.c.sc_IndexedSeqLike$Elements().init___sc_IndexedSeqLike__I__I(this, 0, $$this.u["length"])
});
ScalaJS.c.scm_ArrayOps$ofChar.prototype.length__I = (function() {
  var $$this = this.repr$1;
  return $$this.u["length"]
});
ScalaJS.c.scm_ArrayOps$ofChar.prototype.init___AC = (function(repr) {
  this.repr$1 = repr;
  return this
});
ScalaJS.c.scm_ArrayOps$ofChar.prototype.toStream__sci_Stream = (function() {
  var $$this = this.repr$1;
  var this$2 = new ScalaJS.c.sc_IndexedSeqLike$Elements().init___sc_IndexedSeqLike__I__I(this, 0, $$this.u["length"]);
  return ScalaJS.i.sc_Iterator$class__toStream__sc_Iterator__sci_Stream(this$2)
});
ScalaJS.c.scm_ArrayOps$ofChar.prototype.thisCollection__sc_Seq = (function() {
  var $$this = this.repr$1;
  return new ScalaJS.c.scm_WrappedArray$ofChar().init___AC($$this)
});
ScalaJS.c.scm_ArrayOps$ofChar.prototype.addString__scm_StringBuilder__T__T__T__scm_StringBuilder = (function(b, start, sep, end) {
  return ScalaJS.i.sc_TraversableOnce$class__addString__sc_TraversableOnce__scm_StringBuilder__T__T__T__scm_StringBuilder(this, b, start, sep, end)
});
ScalaJS.c.scm_ArrayOps$ofChar.prototype.repr__O = (function() {
  return this.repr$1
});
ScalaJS.c.scm_ArrayOps$ofChar.prototype.$$div$colon__O__F2__O = (function(z, op) {
  var $$this = this.repr$1;
  return ScalaJS.i.sc_IndexedSeqOptimized$class__foldl__sc_IndexedSeqOptimized__I__I__O__F2__O(this, 0, $$this.u["length"], z, op)
});
ScalaJS.c.scm_ArrayOps$ofChar.prototype.hashCode__I = (function() {
  return ScalaJS.m.scm_ArrayOps$ofChar().hashCode$extension__AC__I(this.repr$1)
});
ScalaJS.c.scm_ArrayOps$ofChar.prototype.copyToArray__O__I__I__V = (function(xs, start, len) {
  ScalaJS.i.scm_ArrayOps$class__copyToArray__scm_ArrayOps__O__I__I__V(this, xs, start, len)
});
ScalaJS.c.scm_ArrayOps$ofChar.prototype.isTraversableAgain__Z = (function() {
  return true
});
ScalaJS.c.scm_ArrayOps$ofChar.prototype.toArray__s_reflect_ClassTag__O = (function(evidence$1) {
  return ScalaJS.i.scm_ArrayOps$class__toArray__scm_ArrayOps__s_reflect_ClassTag__O(this, evidence$1)
});
ScalaJS.c.scm_ArrayOps$ofChar.prototype.toCollection__O__sc_Seq = (function(repr) {
  this.repr$1;
  var repr$1 = ScalaJS.asArrayOf.C(repr, 1);
  return new ScalaJS.c.scm_WrappedArray$ofChar().init___AC(repr$1)
});
ScalaJS.c.scm_ArrayOps$ofChar.prototype.newBuilder__scm_Builder = (function() {
  return (this.repr$1, new ScalaJS.c.scm_ArrayBuilder$ofChar().init___())
});
ScalaJS.c.scm_ArrayOps$ofChar.prototype.stringPrefix__T = (function() {
  return ScalaJS.i.sc_TraversableLike$class__stringPrefix__sc_TraversableLike__T(this)
});
ScalaJS.is.scm_ArrayOps$ofChar = (function(obj) {
  return (!(!((obj && obj.$classData) && obj.$classData.ancestors.scm_ArrayOps$ofChar)))
});
ScalaJS.as.scm_ArrayOps$ofChar = (function(obj) {
  return ((ScalaJS.is.scm_ArrayOps$ofChar(obj) || (obj === null)) ? obj : ScalaJS.throwClassCastException(obj, "scala.collection.mutable.ArrayOps$ofChar"))
});
ScalaJS.isArrayOf.scm_ArrayOps$ofChar = (function(obj, depth) {
  return (!(!(((obj && obj.$classData) && (obj.$classData.arrayDepth === depth)) && obj.$classData.arrayBase.ancestors.scm_ArrayOps$ofChar)))
});
ScalaJS.asArrayOf.scm_ArrayOps$ofChar = (function(obj, depth) {
  return ((ScalaJS.isArrayOf.scm_ArrayOps$ofChar(obj, depth) || (obj === null)) ? obj : ScalaJS.throwArrayCastException(obj, "Lscala.collection.mutable.ArrayOps$ofChar;", depth))
});
ScalaJS.d.scm_ArrayOps$ofChar = new ScalaJS.ClassTypeData({
  scm_ArrayOps$ofChar: 0
}, false, "scala.collection.mutable.ArrayOps$ofChar", ScalaJS.d.O, {
  scm_ArrayOps$ofChar: 1,
  scm_ArrayOps: 1,
  sc_CustomParallelizable: 1,
  scm_ArrayLike: 1,
  scm_IndexedSeqOptimized: 1,
  sc_IndexedSeqOptimized: 1,
  scm_IndexedSeqLike: 1,
  sc_IndexedSeqLike: 1,
  sc_SeqLike: 1,
  sc_GenSeqLike: 1,
  sc_IterableLike: 1,
  sc_GenIterableLike: 1,
  sc_TraversableLike: 1,
  sc_GenTraversableLike: 1,
  sc_Parallelizable: 1,
  sc_TraversableOnce: 1,
  sc_GenTraversableOnce: 1,
  scg_FilterMonadic: 1,
  scg_HasNewBuilder: 1,
  s_Equals: 1,
  O: 1
});
ScalaJS.c.scm_ArrayOps$ofChar.prototype.$classData = ScalaJS.d.scm_ArrayOps$ofChar;
/** @constructor */
ScalaJS.c.scm_ArrayOps$ofChar$ = (function() {
  ScalaJS.c.O.call(this)
});
ScalaJS.c.scm_ArrayOps$ofChar$.prototype = new ScalaJS.h.O();
ScalaJS.c.scm_ArrayOps$ofChar$.prototype.constructor = ScalaJS.c.scm_ArrayOps$ofChar$;
/** @constructor */
ScalaJS.h.scm_ArrayOps$ofChar$ = (function() {
  /*<skip>*/
});
ScalaJS.h.scm_ArrayOps$ofChar$.prototype = ScalaJS.c.scm_ArrayOps$ofChar$.prototype;
ScalaJS.c.scm_ArrayOps$ofChar$.prototype.hashCode$extension__AC__I = (function($$this) {
  return ScalaJS.objectHashCode($$this)
});
ScalaJS.c.scm_ArrayOps$ofChar$.prototype.equals$extension__AC__O__Z = (function($$this, x$1) {
  if (ScalaJS.is.scm_ArrayOps$ofChar(x$1)) {
    var ofChar$1 = ((x$1 === null) ? null : ScalaJS.as.scm_ArrayOps$ofChar(x$1).repr$1);
    return ($$this === ofChar$1)
  } else {
    return false
  }
});
ScalaJS.is.scm_ArrayOps$ofChar$ = (function(obj) {
  return (!(!((obj && obj.$classData) && obj.$classData.ancestors.scm_ArrayOps$ofChar$)))
});
ScalaJS.as.scm_ArrayOps$ofChar$ = (function(obj) {
  return ((ScalaJS.is.scm_ArrayOps$ofChar$(obj) || (obj === null)) ? obj : ScalaJS.throwClassCastException(obj, "scala.collection.mutable.ArrayOps$ofChar$"))
});
ScalaJS.isArrayOf.scm_ArrayOps$ofChar$ = (function(obj, depth) {
  return (!(!(((obj && obj.$classData) && (obj.$classData.arrayDepth === depth)) && obj.$classData.arrayBase.ancestors.scm_ArrayOps$ofChar$)))
});
ScalaJS.asArrayOf.scm_ArrayOps$ofChar$ = (function(obj, depth) {
  return ((ScalaJS.isArrayOf.scm_ArrayOps$ofChar$(obj, depth) || (obj === null)) ? obj : ScalaJS.throwArrayCastException(obj, "Lscala.collection.mutable.ArrayOps$ofChar$;", depth))
});
ScalaJS.d.scm_ArrayOps$ofChar$ = new ScalaJS.ClassTypeData({
  scm_ArrayOps$ofChar$: 0
}, false, "scala.collection.mutable.ArrayOps$ofChar$", ScalaJS.d.O, {
  scm_ArrayOps$ofChar$: 1,
  O: 1
});
ScalaJS.c.scm_ArrayOps$ofChar$.prototype.$classData = ScalaJS.d.scm_ArrayOps$ofChar$;
ScalaJS.n.scm_ArrayOps$ofChar = (void 0);
ScalaJS.m.scm_ArrayOps$ofChar = (function() {
  if ((!ScalaJS.n.scm_ArrayOps$ofChar)) {
    ScalaJS.n.scm_ArrayOps$ofChar = new ScalaJS.c.scm_ArrayOps$ofChar$().init___()
  };
  return ScalaJS.n.scm_ArrayOps$ofChar
});
/** @constructor */
ScalaJS.c.scm_ArrayOps$ofDouble = (function() {
  ScalaJS.c.O.call(this);
  this.repr$1 = null
});
ScalaJS.c.scm_ArrayOps$ofDouble.prototype = new ScalaJS.h.O();
ScalaJS.c.scm_ArrayOps$ofDouble.prototype.constructor = ScalaJS.c.scm_ArrayOps$ofDouble;
/** @constructor */
ScalaJS.h.scm_ArrayOps$ofDouble = (function() {
  /*<skip>*/
});
ScalaJS.h.scm_ArrayOps$ofDouble.prototype = ScalaJS.c.scm_ArrayOps$ofDouble.prototype;
ScalaJS.c.scm_ArrayOps$ofDouble.prototype.seq__sc_TraversableOnce = (function() {
  var $$this = this.repr$1;
  return new ScalaJS.c.scm_WrappedArray$ofDouble().init___AD($$this)
});
ScalaJS.c.scm_ArrayOps$ofDouble.prototype.copyToArray__O__I__V = (function(xs, start) {
  ScalaJS.i.sc_TraversableOnce$class__copyToArray__sc_TraversableOnce__O__I__V(this, xs, start)
});
ScalaJS.c.scm_ArrayOps$ofDouble.prototype.apply__I__O = (function(idx) {
  var $$this = this.repr$1;
  return $$this.u[idx]
});
ScalaJS.c.scm_ArrayOps$ofDouble.prototype.lengthCompare__I__I = (function(len) {
  return ScalaJS.i.sc_IndexedSeqOptimized$class__lengthCompare__sc_IndexedSeqOptimized__I__I(this, len)
});
ScalaJS.c.scm_ArrayOps$ofDouble.prototype.sameElements__sc_GenIterable__Z = (function(that) {
  return ScalaJS.i.sc_IndexedSeqOptimized$class__sameElements__sc_IndexedSeqOptimized__sc_GenIterable__Z(this, that)
});
ScalaJS.c.scm_ArrayOps$ofDouble.prototype.isEmpty__Z = (function() {
  return ScalaJS.i.sc_IndexedSeqOptimized$class__isEmpty__sc_IndexedSeqOptimized__Z(this)
});
ScalaJS.c.scm_ArrayOps$ofDouble.prototype.toList__sci_List = (function() {
  var this$1 = ScalaJS.m.sci_List();
  var cbf = this$1.ReusableCBFInstance$2;
  return ScalaJS.as.sci_List(ScalaJS.i.sc_TraversableLike$class__to__sc_TraversableLike__scg_CanBuildFrom__O(this, cbf))
});
ScalaJS.c.scm_ArrayOps$ofDouble.prototype.thisCollection__sc_Traversable = (function() {
  var $$this = this.repr$1;
  return new ScalaJS.c.scm_WrappedArray$ofDouble().init___AD($$this)
});
ScalaJS.c.scm_ArrayOps$ofDouble.prototype.equals__O__Z = (function(x$1) {
  return ScalaJS.m.scm_ArrayOps$ofDouble().equals$extension__AD__O__Z(this.repr$1, x$1)
});
ScalaJS.c.scm_ArrayOps$ofDouble.prototype.init___AD = (function(repr) {
  this.repr$1 = repr;
  return this
});
ScalaJS.c.scm_ArrayOps$ofDouble.prototype.mkString__T__T__T__T = (function(start, sep, end) {
  return ScalaJS.i.sc_TraversableOnce$class__mkString__sc_TraversableOnce__T__T__T__T(this, start, sep, end)
});
ScalaJS.c.scm_ArrayOps$ofDouble.prototype.toString__T = (function() {
  return ScalaJS.i.sc_TraversableLike$class__toString__sc_TraversableLike__T(this)
});
ScalaJS.c.scm_ArrayOps$ofDouble.prototype.foreach__F1__V = (function(f) {
  ScalaJS.i.sc_IndexedSeqOptimized$class__foreach__sc_IndexedSeqOptimized__F1__V(this, f)
});
ScalaJS.c.scm_ArrayOps$ofDouble.prototype.reverse__O = (function() {
  return ScalaJS.i.sc_IndexedSeqOptimized$class__reverse__sc_IndexedSeqOptimized__O(this)
});
ScalaJS.c.scm_ArrayOps$ofDouble.prototype.filter__F1__O = (function(p) {
  return ScalaJS.i.sc_TraversableLike$class__filterImpl__sc_TraversableLike__F1__Z__O(this, p, false)
});
ScalaJS.c.scm_ArrayOps$ofDouble.prototype.toBuffer__scm_Buffer = (function() {
  return ScalaJS.i.sc_IndexedSeqLike$class__toBuffer__sc_IndexedSeqLike__scm_Buffer(this)
});
ScalaJS.c.scm_ArrayOps$ofDouble.prototype.size__I = (function() {
  var $$this = this.repr$1;
  return $$this.u["length"]
});
ScalaJS.c.scm_ArrayOps$ofDouble.prototype.iterator__sc_Iterator = (function() {
  var $$this = this.repr$1;
  return new ScalaJS.c.sc_IndexedSeqLike$Elements().init___sc_IndexedSeqLike__I__I(this, 0, $$this.u["length"])
});
ScalaJS.c.scm_ArrayOps$ofDouble.prototype.length__I = (function() {
  var $$this = this.repr$1;
  return $$this.u["length"]
});
ScalaJS.c.scm_ArrayOps$ofDouble.prototype.toStream__sci_Stream = (function() {
  var $$this = this.repr$1;
  var this$2 = new ScalaJS.c.sc_IndexedSeqLike$Elements().init___sc_IndexedSeqLike__I__I(this, 0, $$this.u["length"]);
  return ScalaJS.i.sc_Iterator$class__toStream__sc_Iterator__sci_Stream(this$2)
});
ScalaJS.c.scm_ArrayOps$ofDouble.prototype.thisCollection__sc_Seq = (function() {
  var $$this = this.repr$1;
  return new ScalaJS.c.scm_WrappedArray$ofDouble().init___AD($$this)
});
ScalaJS.c.scm_ArrayOps$ofDouble.prototype.addString__scm_StringBuilder__T__T__T__scm_StringBuilder = (function(b, start, sep, end) {
  return ScalaJS.i.sc_TraversableOnce$class__addString__sc_TraversableOnce__scm_StringBuilder__T__T__T__scm_StringBuilder(this, b, start, sep, end)
});
ScalaJS.c.scm_ArrayOps$ofDouble.prototype.repr__O = (function() {
  return this.repr$1
});
ScalaJS.c.scm_ArrayOps$ofDouble.prototype.$$div$colon__O__F2__O = (function(z, op) {
  var $$this = this.repr$1;
  return ScalaJS.i.sc_IndexedSeqOptimized$class__foldl__sc_IndexedSeqOptimized__I__I__O__F2__O(this, 0, $$this.u["length"], z, op)
});
ScalaJS.c.scm_ArrayOps$ofDouble.prototype.hashCode__I = (function() {
  return ScalaJS.m.scm_ArrayOps$ofDouble().hashCode$extension__AD__I(this.repr$1)
});
ScalaJS.c.scm_ArrayOps$ofDouble.prototype.copyToArray__O__I__I__V = (function(xs, start, len) {
  ScalaJS.i.scm_ArrayOps$class__copyToArray__scm_ArrayOps__O__I__I__V(this, xs, start, len)
});
ScalaJS.c.scm_ArrayOps$ofDouble.prototype.isTraversableAgain__Z = (function() {
  return true
});
ScalaJS.c.scm_ArrayOps$ofDouble.prototype.toArray__s_reflect_ClassTag__O = (function(evidence$1) {
  return ScalaJS.i.scm_ArrayOps$class__toArray__scm_ArrayOps__s_reflect_ClassTag__O(this, evidence$1)
});
ScalaJS.c.scm_ArrayOps$ofDouble.prototype.toCollection__O__sc_Seq = (function(repr) {
  this.repr$1;
  var repr$1 = ScalaJS.asArrayOf.D(repr, 1);
  return new ScalaJS.c.scm_WrappedArray$ofDouble().init___AD(repr$1)
});
ScalaJS.c.scm_ArrayOps$ofDouble.prototype.newBuilder__scm_Builder = (function() {
  return (this.repr$1, new ScalaJS.c.scm_ArrayBuilder$ofDouble().init___())
});
ScalaJS.c.scm_ArrayOps$ofDouble.prototype.stringPrefix__T = (function() {
  return ScalaJS.i.sc_TraversableLike$class__stringPrefix__sc_TraversableLike__T(this)
});
ScalaJS.is.scm_ArrayOps$ofDouble = (function(obj) {
  return (!(!((obj && obj.$classData) && obj.$classData.ancestors.scm_ArrayOps$ofDouble)))
});
ScalaJS.as.scm_ArrayOps$ofDouble = (function(obj) {
  return ((ScalaJS.is.scm_ArrayOps$ofDouble(obj) || (obj === null)) ? obj : ScalaJS.throwClassCastException(obj, "scala.collection.mutable.ArrayOps$ofDouble"))
});
ScalaJS.isArrayOf.scm_ArrayOps$ofDouble = (function(obj, depth) {
  return (!(!(((obj && obj.$classData) && (obj.$classData.arrayDepth === depth)) && obj.$classData.arrayBase.ancestors.scm_ArrayOps$ofDouble)))
});
ScalaJS.asArrayOf.scm_ArrayOps$ofDouble = (function(obj, depth) {
  return ((ScalaJS.isArrayOf.scm_ArrayOps$ofDouble(obj, depth) || (obj === null)) ? obj : ScalaJS.throwArrayCastException(obj, "Lscala.collection.mutable.ArrayOps$ofDouble;", depth))
});
ScalaJS.d.scm_ArrayOps$ofDouble = new ScalaJS.ClassTypeData({
  scm_ArrayOps$ofDouble: 0
}, false, "scala.collection.mutable.ArrayOps$ofDouble", ScalaJS.d.O, {
  scm_ArrayOps$ofDouble: 1,
  scm_ArrayOps: 1,
  sc_CustomParallelizable: 1,
  scm_ArrayLike: 1,
  scm_IndexedSeqOptimized: 1,
  sc_IndexedSeqOptimized: 1,
  scm_IndexedSeqLike: 1,
  sc_IndexedSeqLike: 1,
  sc_SeqLike: 1,
  sc_GenSeqLike: 1,
  sc_IterableLike: 1,
  sc_GenIterableLike: 1,
  sc_TraversableLike: 1,
  sc_GenTraversableLike: 1,
  sc_Parallelizable: 1,
  sc_TraversableOnce: 1,
  sc_GenTraversableOnce: 1,
  scg_FilterMonadic: 1,
  scg_HasNewBuilder: 1,
  s_Equals: 1,
  O: 1
});
ScalaJS.c.scm_ArrayOps$ofDouble.prototype.$classData = ScalaJS.d.scm_ArrayOps$ofDouble;
/** @constructor */
ScalaJS.c.scm_ArrayOps$ofDouble$ = (function() {
  ScalaJS.c.O.call(this)
});
ScalaJS.c.scm_ArrayOps$ofDouble$.prototype = new ScalaJS.h.O();
ScalaJS.c.scm_ArrayOps$ofDouble$.prototype.constructor = ScalaJS.c.scm_ArrayOps$ofDouble$;
/** @constructor */
ScalaJS.h.scm_ArrayOps$ofDouble$ = (function() {
  /*<skip>*/
});
ScalaJS.h.scm_ArrayOps$ofDouble$.prototype = ScalaJS.c.scm_ArrayOps$ofDouble$.prototype;
ScalaJS.c.scm_ArrayOps$ofDouble$.prototype.equals$extension__AD__O__Z = (function($$this, x$1) {
  if (ScalaJS.is.scm_ArrayOps$ofDouble(x$1)) {
    var ofDouble$1 = ((x$1 === null) ? null : ScalaJS.as.scm_ArrayOps$ofDouble(x$1).repr$1);
    return ($$this === ofDouble$1)
  } else {
    return false
  }
});
ScalaJS.c.scm_ArrayOps$ofDouble$.prototype.hashCode$extension__AD__I = (function($$this) {
  return ScalaJS.objectHashCode($$this)
});
ScalaJS.is.scm_ArrayOps$ofDouble$ = (function(obj) {
  return (!(!((obj && obj.$classData) && obj.$classData.ancestors.scm_ArrayOps$ofDouble$)))
});
ScalaJS.as.scm_ArrayOps$ofDouble$ = (function(obj) {
  return ((ScalaJS.is.scm_ArrayOps$ofDouble$(obj) || (obj === null)) ? obj : ScalaJS.throwClassCastException(obj, "scala.collection.mutable.ArrayOps$ofDouble$"))
});
ScalaJS.isArrayOf.scm_ArrayOps$ofDouble$ = (function(obj, depth) {
  return (!(!(((obj && obj.$classData) && (obj.$classData.arrayDepth === depth)) && obj.$classData.arrayBase.ancestors.scm_ArrayOps$ofDouble$)))
});
ScalaJS.asArrayOf.scm_ArrayOps$ofDouble$ = (function(obj, depth) {
  return ((ScalaJS.isArrayOf.scm_ArrayOps$ofDouble$(obj, depth) || (obj === null)) ? obj : ScalaJS.throwArrayCastException(obj, "Lscala.collection.mutable.ArrayOps$ofDouble$;", depth))
});
ScalaJS.d.scm_ArrayOps$ofDouble$ = new ScalaJS.ClassTypeData({
  scm_ArrayOps$ofDouble$: 0
}, false, "scala.collection.mutable.ArrayOps$ofDouble$", ScalaJS.d.O, {
  scm_ArrayOps$ofDouble$: 1,
  O: 1
});
ScalaJS.c.scm_ArrayOps$ofDouble$.prototype.$classData = ScalaJS.d.scm_ArrayOps$ofDouble$;
ScalaJS.n.scm_ArrayOps$ofDouble = (void 0);
ScalaJS.m.scm_ArrayOps$ofDouble = (function() {
  if ((!ScalaJS.n.scm_ArrayOps$ofDouble)) {
    ScalaJS.n.scm_ArrayOps$ofDouble = new ScalaJS.c.scm_ArrayOps$ofDouble$().init___()
  };
  return ScalaJS.n.scm_ArrayOps$ofDouble
});
/** @constructor */
ScalaJS.c.scm_ArrayOps$ofFloat = (function() {
  ScalaJS.c.O.call(this);
  this.repr$1 = null
});
ScalaJS.c.scm_ArrayOps$ofFloat.prototype = new ScalaJS.h.O();
ScalaJS.c.scm_ArrayOps$ofFloat.prototype.constructor = ScalaJS.c.scm_ArrayOps$ofFloat;
/** @constructor */
ScalaJS.h.scm_ArrayOps$ofFloat = (function() {
  /*<skip>*/
});
ScalaJS.h.scm_ArrayOps$ofFloat.prototype = ScalaJS.c.scm_ArrayOps$ofFloat.prototype;
ScalaJS.c.scm_ArrayOps$ofFloat.prototype.seq__sc_TraversableOnce = (function() {
  var $$this = this.repr$1;
  return new ScalaJS.c.scm_WrappedArray$ofFloat().init___AF($$this)
});
ScalaJS.c.scm_ArrayOps$ofFloat.prototype.copyToArray__O__I__V = (function(xs, start) {
  ScalaJS.i.sc_TraversableOnce$class__copyToArray__sc_TraversableOnce__O__I__V(this, xs, start)
});
ScalaJS.c.scm_ArrayOps$ofFloat.prototype.apply__I__O = (function(idx) {
  var $$this = this.repr$1;
  return $$this.u[idx]
});
ScalaJS.c.scm_ArrayOps$ofFloat.prototype.lengthCompare__I__I = (function(len) {
  return ScalaJS.i.sc_IndexedSeqOptimized$class__lengthCompare__sc_IndexedSeqOptimized__I__I(this, len)
});
ScalaJS.c.scm_ArrayOps$ofFloat.prototype.sameElements__sc_GenIterable__Z = (function(that) {
  return ScalaJS.i.sc_IndexedSeqOptimized$class__sameElements__sc_IndexedSeqOptimized__sc_GenIterable__Z(this, that)
});
ScalaJS.c.scm_ArrayOps$ofFloat.prototype.isEmpty__Z = (function() {
  return ScalaJS.i.sc_IndexedSeqOptimized$class__isEmpty__sc_IndexedSeqOptimized__Z(this)
});
ScalaJS.c.scm_ArrayOps$ofFloat.prototype.toList__sci_List = (function() {
  var this$1 = ScalaJS.m.sci_List();
  var cbf = this$1.ReusableCBFInstance$2;
  return ScalaJS.as.sci_List(ScalaJS.i.sc_TraversableLike$class__to__sc_TraversableLike__scg_CanBuildFrom__O(this, cbf))
});
ScalaJS.c.scm_ArrayOps$ofFloat.prototype.thisCollection__sc_Traversable = (function() {
  var $$this = this.repr$1;
  return new ScalaJS.c.scm_WrappedArray$ofFloat().init___AF($$this)
});
ScalaJS.c.scm_ArrayOps$ofFloat.prototype.equals__O__Z = (function(x$1) {
  return ScalaJS.m.scm_ArrayOps$ofFloat().equals$extension__AF__O__Z(this.repr$1, x$1)
});
ScalaJS.c.scm_ArrayOps$ofFloat.prototype.mkString__T__T__T__T = (function(start, sep, end) {
  return ScalaJS.i.sc_TraversableOnce$class__mkString__sc_TraversableOnce__T__T__T__T(this, start, sep, end)
});
ScalaJS.c.scm_ArrayOps$ofFloat.prototype.toString__T = (function() {
  return ScalaJS.i.sc_TraversableLike$class__toString__sc_TraversableLike__T(this)
});
ScalaJS.c.scm_ArrayOps$ofFloat.prototype.foreach__F1__V = (function(f) {
  ScalaJS.i.sc_IndexedSeqOptimized$class__foreach__sc_IndexedSeqOptimized__F1__V(this, f)
});
ScalaJS.c.scm_ArrayOps$ofFloat.prototype.reverse__O = (function() {
  return ScalaJS.i.sc_IndexedSeqOptimized$class__reverse__sc_IndexedSeqOptimized__O(this)
});
ScalaJS.c.scm_ArrayOps$ofFloat.prototype.filter__F1__O = (function(p) {
  return ScalaJS.i.sc_TraversableLike$class__filterImpl__sc_TraversableLike__F1__Z__O(this, p, false)
});
ScalaJS.c.scm_ArrayOps$ofFloat.prototype.toBuffer__scm_Buffer = (function() {
  return ScalaJS.i.sc_IndexedSeqLike$class__toBuffer__sc_IndexedSeqLike__scm_Buffer(this)
});
ScalaJS.c.scm_ArrayOps$ofFloat.prototype.size__I = (function() {
  var $$this = this.repr$1;
  return $$this.u["length"]
});
ScalaJS.c.scm_ArrayOps$ofFloat.prototype.init___AF = (function(repr) {
  this.repr$1 = repr;
  return this
});
ScalaJS.c.scm_ArrayOps$ofFloat.prototype.iterator__sc_Iterator = (function() {
  var $$this = this.repr$1;
  return new ScalaJS.c.sc_IndexedSeqLike$Elements().init___sc_IndexedSeqLike__I__I(this, 0, $$this.u["length"])
});
ScalaJS.c.scm_ArrayOps$ofFloat.prototype.length__I = (function() {
  var $$this = this.repr$1;
  return $$this.u["length"]
});
ScalaJS.c.scm_ArrayOps$ofFloat.prototype.toStream__sci_Stream = (function() {
  var $$this = this.repr$1;
  var this$2 = new ScalaJS.c.sc_IndexedSeqLike$Elements().init___sc_IndexedSeqLike__I__I(this, 0, $$this.u["length"]);
  return ScalaJS.i.sc_Iterator$class__toStream__sc_Iterator__sci_Stream(this$2)
});
ScalaJS.c.scm_ArrayOps$ofFloat.prototype.thisCollection__sc_Seq = (function() {
  var $$this = this.repr$1;
  return new ScalaJS.c.scm_WrappedArray$ofFloat().init___AF($$this)
});
ScalaJS.c.scm_ArrayOps$ofFloat.prototype.addString__scm_StringBuilder__T__T__T__scm_StringBuilder = (function(b, start, sep, end) {
  return ScalaJS.i.sc_TraversableOnce$class__addString__sc_TraversableOnce__scm_StringBuilder__T__T__T__scm_StringBuilder(this, b, start, sep, end)
});
ScalaJS.c.scm_ArrayOps$ofFloat.prototype.repr__O = (function() {
  return this.repr$1
});
ScalaJS.c.scm_ArrayOps$ofFloat.prototype.$$div$colon__O__F2__O = (function(z, op) {
  var $$this = this.repr$1;
  return ScalaJS.i.sc_IndexedSeqOptimized$class__foldl__sc_IndexedSeqOptimized__I__I__O__F2__O(this, 0, $$this.u["length"], z, op)
});
ScalaJS.c.scm_ArrayOps$ofFloat.prototype.hashCode__I = (function() {
  return ScalaJS.m.scm_ArrayOps$ofFloat().hashCode$extension__AF__I(this.repr$1)
});
ScalaJS.c.scm_ArrayOps$ofFloat.prototype.copyToArray__O__I__I__V = (function(xs, start, len) {
  ScalaJS.i.scm_ArrayOps$class__copyToArray__scm_ArrayOps__O__I__I__V(this, xs, start, len)
});
ScalaJS.c.scm_ArrayOps$ofFloat.prototype.isTraversableAgain__Z = (function() {
  return true
});
ScalaJS.c.scm_ArrayOps$ofFloat.prototype.toArray__s_reflect_ClassTag__O = (function(evidence$1) {
  return ScalaJS.i.scm_ArrayOps$class__toArray__scm_ArrayOps__s_reflect_ClassTag__O(this, evidence$1)
});
ScalaJS.c.scm_ArrayOps$ofFloat.prototype.toCollection__O__sc_Seq = (function(repr) {
  this.repr$1;
  var repr$1 = ScalaJS.asArrayOf.F(repr, 1);
  return new ScalaJS.c.scm_WrappedArray$ofFloat().init___AF(repr$1)
});
ScalaJS.c.scm_ArrayOps$ofFloat.prototype.newBuilder__scm_Builder = (function() {
  return (this.repr$1, new ScalaJS.c.scm_ArrayBuilder$ofFloat().init___())
});
ScalaJS.c.scm_ArrayOps$ofFloat.prototype.stringPrefix__T = (function() {
  return ScalaJS.i.sc_TraversableLike$class__stringPrefix__sc_TraversableLike__T(this)
});
ScalaJS.is.scm_ArrayOps$ofFloat = (function(obj) {
  return (!(!((obj && obj.$classData) && obj.$classData.ancestors.scm_ArrayOps$ofFloat)))
});
ScalaJS.as.scm_ArrayOps$ofFloat = (function(obj) {
  return ((ScalaJS.is.scm_ArrayOps$ofFloat(obj) || (obj === null)) ? obj : ScalaJS.throwClassCastException(obj, "scala.collection.mutable.ArrayOps$ofFloat"))
});
ScalaJS.isArrayOf.scm_ArrayOps$ofFloat = (function(obj, depth) {
  return (!(!(((obj && obj.$classData) && (obj.$classData.arrayDepth === depth)) && obj.$classData.arrayBase.ancestors.scm_ArrayOps$ofFloat)))
});
ScalaJS.asArrayOf.scm_ArrayOps$ofFloat = (function(obj, depth) {
  return ((ScalaJS.isArrayOf.scm_ArrayOps$ofFloat(obj, depth) || (obj === null)) ? obj : ScalaJS.throwArrayCastException(obj, "Lscala.collection.mutable.ArrayOps$ofFloat;", depth))
});
ScalaJS.d.scm_ArrayOps$ofFloat = new ScalaJS.ClassTypeData({
  scm_ArrayOps$ofFloat: 0
}, false, "scala.collection.mutable.ArrayOps$ofFloat", ScalaJS.d.O, {
  scm_ArrayOps$ofFloat: 1,
  scm_ArrayOps: 1,
  sc_CustomParallelizable: 1,
  scm_ArrayLike: 1,
  scm_IndexedSeqOptimized: 1,
  sc_IndexedSeqOptimized: 1,
  scm_IndexedSeqLike: 1,
  sc_IndexedSeqLike: 1,
  sc_SeqLike: 1,
  sc_GenSeqLike: 1,
  sc_IterableLike: 1,
  sc_GenIterableLike: 1,
  sc_TraversableLike: 1,
  sc_GenTraversableLike: 1,
  sc_Parallelizable: 1,
  sc_TraversableOnce: 1,
  sc_GenTraversableOnce: 1,
  scg_FilterMonadic: 1,
  scg_HasNewBuilder: 1,
  s_Equals: 1,
  O: 1
});
ScalaJS.c.scm_ArrayOps$ofFloat.prototype.$classData = ScalaJS.d.scm_ArrayOps$ofFloat;
/** @constructor */
ScalaJS.c.scm_ArrayOps$ofFloat$ = (function() {
  ScalaJS.c.O.call(this)
});
ScalaJS.c.scm_ArrayOps$ofFloat$.prototype = new ScalaJS.h.O();
ScalaJS.c.scm_ArrayOps$ofFloat$.prototype.constructor = ScalaJS.c.scm_ArrayOps$ofFloat$;
/** @constructor */
ScalaJS.h.scm_ArrayOps$ofFloat$ = (function() {
  /*<skip>*/
});
ScalaJS.h.scm_ArrayOps$ofFloat$.prototype = ScalaJS.c.scm_ArrayOps$ofFloat$.prototype;
ScalaJS.c.scm_ArrayOps$ofFloat$.prototype.hashCode$extension__AF__I = (function($$this) {
  return ScalaJS.objectHashCode($$this)
});
ScalaJS.c.scm_ArrayOps$ofFloat$.prototype.equals$extension__AF__O__Z = (function($$this, x$1) {
  if (ScalaJS.is.scm_ArrayOps$ofFloat(x$1)) {
    var ofFloat$1 = ((x$1 === null) ? null : ScalaJS.as.scm_ArrayOps$ofFloat(x$1).repr$1);
    return ($$this === ofFloat$1)
  } else {
    return false
  }
});
ScalaJS.is.scm_ArrayOps$ofFloat$ = (function(obj) {
  return (!(!((obj && obj.$classData) && obj.$classData.ancestors.scm_ArrayOps$ofFloat$)))
});
ScalaJS.as.scm_ArrayOps$ofFloat$ = (function(obj) {
  return ((ScalaJS.is.scm_ArrayOps$ofFloat$(obj) || (obj === null)) ? obj : ScalaJS.throwClassCastException(obj, "scala.collection.mutable.ArrayOps$ofFloat$"))
});
ScalaJS.isArrayOf.scm_ArrayOps$ofFloat$ = (function(obj, depth) {
  return (!(!(((obj && obj.$classData) && (obj.$classData.arrayDepth === depth)) && obj.$classData.arrayBase.ancestors.scm_ArrayOps$ofFloat$)))
});
ScalaJS.asArrayOf.scm_ArrayOps$ofFloat$ = (function(obj, depth) {
  return ((ScalaJS.isArrayOf.scm_ArrayOps$ofFloat$(obj, depth) || (obj === null)) ? obj : ScalaJS.throwArrayCastException(obj, "Lscala.collection.mutable.ArrayOps$ofFloat$;", depth))
});
ScalaJS.d.scm_ArrayOps$ofFloat$ = new ScalaJS.ClassTypeData({
  scm_ArrayOps$ofFloat$: 0
}, false, "scala.collection.mutable.ArrayOps$ofFloat$", ScalaJS.d.O, {
  scm_ArrayOps$ofFloat$: 1,
  O: 1
});
ScalaJS.c.scm_ArrayOps$ofFloat$.prototype.$classData = ScalaJS.d.scm_ArrayOps$ofFloat$;
ScalaJS.n.scm_ArrayOps$ofFloat = (void 0);
ScalaJS.m.scm_ArrayOps$ofFloat = (function() {
  if ((!ScalaJS.n.scm_ArrayOps$ofFloat)) {
    ScalaJS.n.scm_ArrayOps$ofFloat = new ScalaJS.c.scm_ArrayOps$ofFloat$().init___()
  };
  return ScalaJS.n.scm_ArrayOps$ofFloat
});
/** @constructor */
ScalaJS.c.scm_ArrayOps$ofInt = (function() {
  ScalaJS.c.O.call(this);
  this.repr$1 = null
});
ScalaJS.c.scm_ArrayOps$ofInt.prototype = new ScalaJS.h.O();
ScalaJS.c.scm_ArrayOps$ofInt.prototype.constructor = ScalaJS.c.scm_ArrayOps$ofInt;
/** @constructor */
ScalaJS.h.scm_ArrayOps$ofInt = (function() {
  /*<skip>*/
});
ScalaJS.h.scm_ArrayOps$ofInt.prototype = ScalaJS.c.scm_ArrayOps$ofInt.prototype;
ScalaJS.c.scm_ArrayOps$ofInt.prototype.seq__sc_TraversableOnce = (function() {
  var $$this = this.repr$1;
  return new ScalaJS.c.scm_WrappedArray$ofInt().init___AI($$this)
});
ScalaJS.c.scm_ArrayOps$ofInt.prototype.copyToArray__O__I__V = (function(xs, start) {
  ScalaJS.i.sc_TraversableOnce$class__copyToArray__sc_TraversableOnce__O__I__V(this, xs, start)
});
ScalaJS.c.scm_ArrayOps$ofInt.prototype.apply__I__O = (function(idx) {
  var $$this = this.repr$1;
  return $$this.u[idx]
});
ScalaJS.c.scm_ArrayOps$ofInt.prototype.lengthCompare__I__I = (function(len) {
  return ScalaJS.i.sc_IndexedSeqOptimized$class__lengthCompare__sc_IndexedSeqOptimized__I__I(this, len)
});
ScalaJS.c.scm_ArrayOps$ofInt.prototype.sameElements__sc_GenIterable__Z = (function(that) {
  return ScalaJS.i.sc_IndexedSeqOptimized$class__sameElements__sc_IndexedSeqOptimized__sc_GenIterable__Z(this, that)
});
ScalaJS.c.scm_ArrayOps$ofInt.prototype.isEmpty__Z = (function() {
  return ScalaJS.i.sc_IndexedSeqOptimized$class__isEmpty__sc_IndexedSeqOptimized__Z(this)
});
ScalaJS.c.scm_ArrayOps$ofInt.prototype.toList__sci_List = (function() {
  var this$1 = ScalaJS.m.sci_List();
  var cbf = this$1.ReusableCBFInstance$2;
  return ScalaJS.as.sci_List(ScalaJS.i.sc_TraversableLike$class__to__sc_TraversableLike__scg_CanBuildFrom__O(this, cbf))
});
ScalaJS.c.scm_ArrayOps$ofInt.prototype.thisCollection__sc_Traversable = (function() {
  var $$this = this.repr$1;
  return new ScalaJS.c.scm_WrappedArray$ofInt().init___AI($$this)
});
ScalaJS.c.scm_ArrayOps$ofInt.prototype.equals__O__Z = (function(x$1) {
  return ScalaJS.m.scm_ArrayOps$ofInt().equals$extension__AI__O__Z(this.repr$1, x$1)
});
ScalaJS.c.scm_ArrayOps$ofInt.prototype.mkString__T__T__T__T = (function(start, sep, end) {
  return ScalaJS.i.sc_TraversableOnce$class__mkString__sc_TraversableOnce__T__T__T__T(this, start, sep, end)
});
ScalaJS.c.scm_ArrayOps$ofInt.prototype.toString__T = (function() {
  return ScalaJS.i.sc_TraversableLike$class__toString__sc_TraversableLike__T(this)
});
ScalaJS.c.scm_ArrayOps$ofInt.prototype.foreach__F1__V = (function(f) {
  ScalaJS.i.sc_IndexedSeqOptimized$class__foreach__sc_IndexedSeqOptimized__F1__V(this, f)
});
ScalaJS.c.scm_ArrayOps$ofInt.prototype.reverse__O = (function() {
  return ScalaJS.i.sc_IndexedSeqOptimized$class__reverse__sc_IndexedSeqOptimized__O(this)
});
ScalaJS.c.scm_ArrayOps$ofInt.prototype.filter__F1__O = (function(p) {
  return ScalaJS.i.sc_TraversableLike$class__filterImpl__sc_TraversableLike__F1__Z__O(this, p, false)
});
ScalaJS.c.scm_ArrayOps$ofInt.prototype.toBuffer__scm_Buffer = (function() {
  return ScalaJS.i.sc_IndexedSeqLike$class__toBuffer__sc_IndexedSeqLike__scm_Buffer(this)
});
ScalaJS.c.scm_ArrayOps$ofInt.prototype.size__I = (function() {
  var $$this = this.repr$1;
  return $$this.u["length"]
});
ScalaJS.c.scm_ArrayOps$ofInt.prototype.iterator__sc_Iterator = (function() {
  var $$this = this.repr$1;
  return new ScalaJS.c.sc_IndexedSeqLike$Elements().init___sc_IndexedSeqLike__I__I(this, 0, $$this.u["length"])
});
ScalaJS.c.scm_ArrayOps$ofInt.prototype.init___AI = (function(repr) {
  this.repr$1 = repr;
  return this
});
ScalaJS.c.scm_ArrayOps$ofInt.prototype.length__I = (function() {
  var $$this = this.repr$1;
  return $$this.u["length"]
});
ScalaJS.c.scm_ArrayOps$ofInt.prototype.toStream__sci_Stream = (function() {
  var $$this = this.repr$1;
  var this$2 = new ScalaJS.c.sc_IndexedSeqLike$Elements().init___sc_IndexedSeqLike__I__I(this, 0, $$this.u["length"]);
  return ScalaJS.i.sc_Iterator$class__toStream__sc_Iterator__sci_Stream(this$2)
});
ScalaJS.c.scm_ArrayOps$ofInt.prototype.thisCollection__sc_Seq = (function() {
  var $$this = this.repr$1;
  return new ScalaJS.c.scm_WrappedArray$ofInt().init___AI($$this)
});
ScalaJS.c.scm_ArrayOps$ofInt.prototype.addString__scm_StringBuilder__T__T__T__scm_StringBuilder = (function(b, start, sep, end) {
  return ScalaJS.i.sc_TraversableOnce$class__addString__sc_TraversableOnce__scm_StringBuilder__T__T__T__scm_StringBuilder(this, b, start, sep, end)
});
ScalaJS.c.scm_ArrayOps$ofInt.prototype.repr__O = (function() {
  return this.repr$1
});
ScalaJS.c.scm_ArrayOps$ofInt.prototype.$$div$colon__O__F2__O = (function(z, op) {
  var $$this = this.repr$1;
  return ScalaJS.i.sc_IndexedSeqOptimized$class__foldl__sc_IndexedSeqOptimized__I__I__O__F2__O(this, 0, $$this.u["length"], z, op)
});
ScalaJS.c.scm_ArrayOps$ofInt.prototype.hashCode__I = (function() {
  return ScalaJS.m.scm_ArrayOps$ofInt().hashCode$extension__AI__I(this.repr$1)
});
ScalaJS.c.scm_ArrayOps$ofInt.prototype.copyToArray__O__I__I__V = (function(xs, start, len) {
  ScalaJS.i.scm_ArrayOps$class__copyToArray__scm_ArrayOps__O__I__I__V(this, xs, start, len)
});
ScalaJS.c.scm_ArrayOps$ofInt.prototype.isTraversableAgain__Z = (function() {
  return true
});
ScalaJS.c.scm_ArrayOps$ofInt.prototype.toArray__s_reflect_ClassTag__O = (function(evidence$1) {
  return ScalaJS.i.scm_ArrayOps$class__toArray__scm_ArrayOps__s_reflect_ClassTag__O(this, evidence$1)
});
ScalaJS.c.scm_ArrayOps$ofInt.prototype.toCollection__O__sc_Seq = (function(repr) {
  this.repr$1;
  var repr$1 = ScalaJS.asArrayOf.I(repr, 1);
  return new ScalaJS.c.scm_WrappedArray$ofInt().init___AI(repr$1)
});
ScalaJS.c.scm_ArrayOps$ofInt.prototype.newBuilder__scm_Builder = (function() {
  return (this.repr$1, new ScalaJS.c.scm_ArrayBuilder$ofInt().init___())
});
ScalaJS.c.scm_ArrayOps$ofInt.prototype.stringPrefix__T = (function() {
  return ScalaJS.i.sc_TraversableLike$class__stringPrefix__sc_TraversableLike__T(this)
});
ScalaJS.is.scm_ArrayOps$ofInt = (function(obj) {
  return (!(!((obj && obj.$classData) && obj.$classData.ancestors.scm_ArrayOps$ofInt)))
});
ScalaJS.as.scm_ArrayOps$ofInt = (function(obj) {
  return ((ScalaJS.is.scm_ArrayOps$ofInt(obj) || (obj === null)) ? obj : ScalaJS.throwClassCastException(obj, "scala.collection.mutable.ArrayOps$ofInt"))
});
ScalaJS.isArrayOf.scm_ArrayOps$ofInt = (function(obj, depth) {
  return (!(!(((obj && obj.$classData) && (obj.$classData.arrayDepth === depth)) && obj.$classData.arrayBase.ancestors.scm_ArrayOps$ofInt)))
});
ScalaJS.asArrayOf.scm_ArrayOps$ofInt = (function(obj, depth) {
  return ((ScalaJS.isArrayOf.scm_ArrayOps$ofInt(obj, depth) || (obj === null)) ? obj : ScalaJS.throwArrayCastException(obj, "Lscala.collection.mutable.ArrayOps$ofInt;", depth))
});
ScalaJS.d.scm_ArrayOps$ofInt = new ScalaJS.ClassTypeData({
  scm_ArrayOps$ofInt: 0
}, false, "scala.collection.mutable.ArrayOps$ofInt", ScalaJS.d.O, {
  scm_ArrayOps$ofInt: 1,
  scm_ArrayOps: 1,
  sc_CustomParallelizable: 1,
  scm_ArrayLike: 1,
  scm_IndexedSeqOptimized: 1,
  sc_IndexedSeqOptimized: 1,
  scm_IndexedSeqLike: 1,
  sc_IndexedSeqLike: 1,
  sc_SeqLike: 1,
  sc_GenSeqLike: 1,
  sc_IterableLike: 1,
  sc_GenIterableLike: 1,
  sc_TraversableLike: 1,
  sc_GenTraversableLike: 1,
  sc_Parallelizable: 1,
  sc_TraversableOnce: 1,
  sc_GenTraversableOnce: 1,
  scg_FilterMonadic: 1,
  scg_HasNewBuilder: 1,
  s_Equals: 1,
  O: 1
});
ScalaJS.c.scm_ArrayOps$ofInt.prototype.$classData = ScalaJS.d.scm_ArrayOps$ofInt;
/** @constructor */
ScalaJS.c.scm_ArrayOps$ofInt$ = (function() {
  ScalaJS.c.O.call(this)
});
ScalaJS.c.scm_ArrayOps$ofInt$.prototype = new ScalaJS.h.O();
ScalaJS.c.scm_ArrayOps$ofInt$.prototype.constructor = ScalaJS.c.scm_ArrayOps$ofInt$;
/** @constructor */
ScalaJS.h.scm_ArrayOps$ofInt$ = (function() {
  /*<skip>*/
});
ScalaJS.h.scm_ArrayOps$ofInt$.prototype = ScalaJS.c.scm_ArrayOps$ofInt$.prototype;
ScalaJS.c.scm_ArrayOps$ofInt$.prototype.hashCode$extension__AI__I = (function($$this) {
  return ScalaJS.objectHashCode($$this)
});
ScalaJS.c.scm_ArrayOps$ofInt$.prototype.equals$extension__AI__O__Z = (function($$this, x$1) {
  if (ScalaJS.is.scm_ArrayOps$ofInt(x$1)) {
    var ofInt$1 = ((x$1 === null) ? null : ScalaJS.as.scm_ArrayOps$ofInt(x$1).repr$1);
    return ($$this === ofInt$1)
  } else {
    return false
  }
});
ScalaJS.is.scm_ArrayOps$ofInt$ = (function(obj) {
  return (!(!((obj && obj.$classData) && obj.$classData.ancestors.scm_ArrayOps$ofInt$)))
});
ScalaJS.as.scm_ArrayOps$ofInt$ = (function(obj) {
  return ((ScalaJS.is.scm_ArrayOps$ofInt$(obj) || (obj === null)) ? obj : ScalaJS.throwClassCastException(obj, "scala.collection.mutable.ArrayOps$ofInt$"))
});
ScalaJS.isArrayOf.scm_ArrayOps$ofInt$ = (function(obj, depth) {
  return (!(!(((obj && obj.$classData) && (obj.$classData.arrayDepth === depth)) && obj.$classData.arrayBase.ancestors.scm_ArrayOps$ofInt$)))
});
ScalaJS.asArrayOf.scm_ArrayOps$ofInt$ = (function(obj, depth) {
  return ((ScalaJS.isArrayOf.scm_ArrayOps$ofInt$(obj, depth) || (obj === null)) ? obj : ScalaJS.throwArrayCastException(obj, "Lscala.collection.mutable.ArrayOps$ofInt$;", depth))
});
ScalaJS.d.scm_ArrayOps$ofInt$ = new ScalaJS.ClassTypeData({
  scm_ArrayOps$ofInt$: 0
}, false, "scala.collection.mutable.ArrayOps$ofInt$", ScalaJS.d.O, {
  scm_ArrayOps$ofInt$: 1,
  O: 1
});
ScalaJS.c.scm_ArrayOps$ofInt$.prototype.$classData = ScalaJS.d.scm_ArrayOps$ofInt$;
ScalaJS.n.scm_ArrayOps$ofInt = (void 0);
ScalaJS.m.scm_ArrayOps$ofInt = (function() {
  if ((!ScalaJS.n.scm_ArrayOps$ofInt)) {
    ScalaJS.n.scm_ArrayOps$ofInt = new ScalaJS.c.scm_ArrayOps$ofInt$().init___()
  };
  return ScalaJS.n.scm_ArrayOps$ofInt
});
/** @constructor */
ScalaJS.c.scm_ArrayOps$ofLong = (function() {
  ScalaJS.c.O.call(this);
  this.repr$1 = null
});
ScalaJS.c.scm_ArrayOps$ofLong.prototype = new ScalaJS.h.O();
ScalaJS.c.scm_ArrayOps$ofLong.prototype.constructor = ScalaJS.c.scm_ArrayOps$ofLong;
/** @constructor */
ScalaJS.h.scm_ArrayOps$ofLong = (function() {
  /*<skip>*/
});
ScalaJS.h.scm_ArrayOps$ofLong.prototype = ScalaJS.c.scm_ArrayOps$ofLong.prototype;
ScalaJS.c.scm_ArrayOps$ofLong.prototype.seq__sc_TraversableOnce = (function() {
  var $$this = this.repr$1;
  return new ScalaJS.c.scm_WrappedArray$ofLong().init___AJ($$this)
});
ScalaJS.c.scm_ArrayOps$ofLong.prototype.copyToArray__O__I__V = (function(xs, start) {
  ScalaJS.i.sc_TraversableOnce$class__copyToArray__sc_TraversableOnce__O__I__V(this, xs, start)
});
ScalaJS.c.scm_ArrayOps$ofLong.prototype.apply__I__O = (function(idx) {
  var $$this = this.repr$1;
  return $$this.u[idx]
});
ScalaJS.c.scm_ArrayOps$ofLong.prototype.lengthCompare__I__I = (function(len) {
  return ScalaJS.i.sc_IndexedSeqOptimized$class__lengthCompare__sc_IndexedSeqOptimized__I__I(this, len)
});
ScalaJS.c.scm_ArrayOps$ofLong.prototype.sameElements__sc_GenIterable__Z = (function(that) {
  return ScalaJS.i.sc_IndexedSeqOptimized$class__sameElements__sc_IndexedSeqOptimized__sc_GenIterable__Z(this, that)
});
ScalaJS.c.scm_ArrayOps$ofLong.prototype.init___AJ = (function(repr) {
  this.repr$1 = repr;
  return this
});
ScalaJS.c.scm_ArrayOps$ofLong.prototype.isEmpty__Z = (function() {
  return ScalaJS.i.sc_IndexedSeqOptimized$class__isEmpty__sc_IndexedSeqOptimized__Z(this)
});
ScalaJS.c.scm_ArrayOps$ofLong.prototype.toList__sci_List = (function() {
  var this$1 = ScalaJS.m.sci_List();
  var cbf = this$1.ReusableCBFInstance$2;
  return ScalaJS.as.sci_List(ScalaJS.i.sc_TraversableLike$class__to__sc_TraversableLike__scg_CanBuildFrom__O(this, cbf))
});
ScalaJS.c.scm_ArrayOps$ofLong.prototype.thisCollection__sc_Traversable = (function() {
  var $$this = this.repr$1;
  return new ScalaJS.c.scm_WrappedArray$ofLong().init___AJ($$this)
});
ScalaJS.c.scm_ArrayOps$ofLong.prototype.equals__O__Z = (function(x$1) {
  return ScalaJS.m.scm_ArrayOps$ofLong().equals$extension__AJ__O__Z(this.repr$1, x$1)
});
ScalaJS.c.scm_ArrayOps$ofLong.prototype.mkString__T__T__T__T = (function(start, sep, end) {
  return ScalaJS.i.sc_TraversableOnce$class__mkString__sc_TraversableOnce__T__T__T__T(this, start, sep, end)
});
ScalaJS.c.scm_ArrayOps$ofLong.prototype.toString__T = (function() {
  return ScalaJS.i.sc_TraversableLike$class__toString__sc_TraversableLike__T(this)
});
ScalaJS.c.scm_ArrayOps$ofLong.prototype.foreach__F1__V = (function(f) {
  ScalaJS.i.sc_IndexedSeqOptimized$class__foreach__sc_IndexedSeqOptimized__F1__V(this, f)
});
ScalaJS.c.scm_ArrayOps$ofLong.prototype.reverse__O = (function() {
  return ScalaJS.i.sc_IndexedSeqOptimized$class__reverse__sc_IndexedSeqOptimized__O(this)
});
ScalaJS.c.scm_ArrayOps$ofLong.prototype.filter__F1__O = (function(p) {
  return ScalaJS.i.sc_TraversableLike$class__filterImpl__sc_TraversableLike__F1__Z__O(this, p, false)
});
ScalaJS.c.scm_ArrayOps$ofLong.prototype.toBuffer__scm_Buffer = (function() {
  return ScalaJS.i.sc_IndexedSeqLike$class__toBuffer__sc_IndexedSeqLike__scm_Buffer(this)
});
ScalaJS.c.scm_ArrayOps$ofLong.prototype.size__I = (function() {
  var $$this = this.repr$1;
  return $$this.u["length"]
});
ScalaJS.c.scm_ArrayOps$ofLong.prototype.iterator__sc_Iterator = (function() {
  var $$this = this.repr$1;
  return new ScalaJS.c.sc_IndexedSeqLike$Elements().init___sc_IndexedSeqLike__I__I(this, 0, $$this.u["length"])
});
ScalaJS.c.scm_ArrayOps$ofLong.prototype.length__I = (function() {
  var $$this = this.repr$1;
  return $$this.u["length"]
});
ScalaJS.c.scm_ArrayOps$ofLong.prototype.toStream__sci_Stream = (function() {
  var $$this = this.repr$1;
  var this$2 = new ScalaJS.c.sc_IndexedSeqLike$Elements().init___sc_IndexedSeqLike__I__I(this, 0, $$this.u["length"]);
  return ScalaJS.i.sc_Iterator$class__toStream__sc_Iterator__sci_Stream(this$2)
});
ScalaJS.c.scm_ArrayOps$ofLong.prototype.thisCollection__sc_Seq = (function() {
  var $$this = this.repr$1;
  return new ScalaJS.c.scm_WrappedArray$ofLong().init___AJ($$this)
});
ScalaJS.c.scm_ArrayOps$ofLong.prototype.addString__scm_StringBuilder__T__T__T__scm_StringBuilder = (function(b, start, sep, end) {
  return ScalaJS.i.sc_TraversableOnce$class__addString__sc_TraversableOnce__scm_StringBuilder__T__T__T__scm_StringBuilder(this, b, start, sep, end)
});
ScalaJS.c.scm_ArrayOps$ofLong.prototype.repr__O = (function() {
  return this.repr$1
});
ScalaJS.c.scm_ArrayOps$ofLong.prototype.$$div$colon__O__F2__O = (function(z, op) {
  var $$this = this.repr$1;
  return ScalaJS.i.sc_IndexedSeqOptimized$class__foldl__sc_IndexedSeqOptimized__I__I__O__F2__O(this, 0, $$this.u["length"], z, op)
});
ScalaJS.c.scm_ArrayOps$ofLong.prototype.hashCode__I = (function() {
  return ScalaJS.m.scm_ArrayOps$ofLong().hashCode$extension__AJ__I(this.repr$1)
});
ScalaJS.c.scm_ArrayOps$ofLong.prototype.copyToArray__O__I__I__V = (function(xs, start, len) {
  ScalaJS.i.scm_ArrayOps$class__copyToArray__scm_ArrayOps__O__I__I__V(this, xs, start, len)
});
ScalaJS.c.scm_ArrayOps$ofLong.prototype.isTraversableAgain__Z = (function() {
  return true
});
ScalaJS.c.scm_ArrayOps$ofLong.prototype.toArray__s_reflect_ClassTag__O = (function(evidence$1) {
  return ScalaJS.i.scm_ArrayOps$class__toArray__scm_ArrayOps__s_reflect_ClassTag__O(this, evidence$1)
});
ScalaJS.c.scm_ArrayOps$ofLong.prototype.toCollection__O__sc_Seq = (function(repr) {
  this.repr$1;
  var repr$1 = ScalaJS.asArrayOf.J(repr, 1);
  return new ScalaJS.c.scm_WrappedArray$ofLong().init___AJ(repr$1)
});
ScalaJS.c.scm_ArrayOps$ofLong.prototype.newBuilder__scm_Builder = (function() {
  return (this.repr$1, new ScalaJS.c.scm_ArrayBuilder$ofLong().init___())
});
ScalaJS.c.scm_ArrayOps$ofLong.prototype.stringPrefix__T = (function() {
  return ScalaJS.i.sc_TraversableLike$class__stringPrefix__sc_TraversableLike__T(this)
});
ScalaJS.is.scm_ArrayOps$ofLong = (function(obj) {
  return (!(!((obj && obj.$classData) && obj.$classData.ancestors.scm_ArrayOps$ofLong)))
});
ScalaJS.as.scm_ArrayOps$ofLong = (function(obj) {
  return ((ScalaJS.is.scm_ArrayOps$ofLong(obj) || (obj === null)) ? obj : ScalaJS.throwClassCastException(obj, "scala.collection.mutable.ArrayOps$ofLong"))
});
ScalaJS.isArrayOf.scm_ArrayOps$ofLong = (function(obj, depth) {
  return (!(!(((obj && obj.$classData) && (obj.$classData.arrayDepth === depth)) && obj.$classData.arrayBase.ancestors.scm_ArrayOps$ofLong)))
});
ScalaJS.asArrayOf.scm_ArrayOps$ofLong = (function(obj, depth) {
  return ((ScalaJS.isArrayOf.scm_ArrayOps$ofLong(obj, depth) || (obj === null)) ? obj : ScalaJS.throwArrayCastException(obj, "Lscala.collection.mutable.ArrayOps$ofLong;", depth))
});
ScalaJS.d.scm_ArrayOps$ofLong = new ScalaJS.ClassTypeData({
  scm_ArrayOps$ofLong: 0
}, false, "scala.collection.mutable.ArrayOps$ofLong", ScalaJS.d.O, {
  scm_ArrayOps$ofLong: 1,
  scm_ArrayOps: 1,
  sc_CustomParallelizable: 1,
  scm_ArrayLike: 1,
  scm_IndexedSeqOptimized: 1,
  sc_IndexedSeqOptimized: 1,
  scm_IndexedSeqLike: 1,
  sc_IndexedSeqLike: 1,
  sc_SeqLike: 1,
  sc_GenSeqLike: 1,
  sc_IterableLike: 1,
  sc_GenIterableLike: 1,
  sc_TraversableLike: 1,
  sc_GenTraversableLike: 1,
  sc_Parallelizable: 1,
  sc_TraversableOnce: 1,
  sc_GenTraversableOnce: 1,
  scg_FilterMonadic: 1,
  scg_HasNewBuilder: 1,
  s_Equals: 1,
  O: 1
});
ScalaJS.c.scm_ArrayOps$ofLong.prototype.$classData = ScalaJS.d.scm_ArrayOps$ofLong;
/** @constructor */
ScalaJS.c.scm_ArrayOps$ofLong$ = (function() {
  ScalaJS.c.O.call(this)
});
ScalaJS.c.scm_ArrayOps$ofLong$.prototype = new ScalaJS.h.O();
ScalaJS.c.scm_ArrayOps$ofLong$.prototype.constructor = ScalaJS.c.scm_ArrayOps$ofLong$;
/** @constructor */
ScalaJS.h.scm_ArrayOps$ofLong$ = (function() {
  /*<skip>*/
});
ScalaJS.h.scm_ArrayOps$ofLong$.prototype = ScalaJS.c.scm_ArrayOps$ofLong$.prototype;
ScalaJS.c.scm_ArrayOps$ofLong$.prototype.equals$extension__AJ__O__Z = (function($$this, x$1) {
  if (ScalaJS.is.scm_ArrayOps$ofLong(x$1)) {
    var ofLong$1 = ((x$1 === null) ? null : ScalaJS.as.scm_ArrayOps$ofLong(x$1).repr$1);
    return ($$this === ofLong$1)
  } else {
    return false
  }
});
ScalaJS.c.scm_ArrayOps$ofLong$.prototype.hashCode$extension__AJ__I = (function($$this) {
  return ScalaJS.objectHashCode($$this)
});
ScalaJS.is.scm_ArrayOps$ofLong$ = (function(obj) {
  return (!(!((obj && obj.$classData) && obj.$classData.ancestors.scm_ArrayOps$ofLong$)))
});
ScalaJS.as.scm_ArrayOps$ofLong$ = (function(obj) {
  return ((ScalaJS.is.scm_ArrayOps$ofLong$(obj) || (obj === null)) ? obj : ScalaJS.throwClassCastException(obj, "scala.collection.mutable.ArrayOps$ofLong$"))
});
ScalaJS.isArrayOf.scm_ArrayOps$ofLong$ = (function(obj, depth) {
  return (!(!(((obj && obj.$classData) && (obj.$classData.arrayDepth === depth)) && obj.$classData.arrayBase.ancestors.scm_ArrayOps$ofLong$)))
});
ScalaJS.asArrayOf.scm_ArrayOps$ofLong$ = (function(obj, depth) {
  return ((ScalaJS.isArrayOf.scm_ArrayOps$ofLong$(obj, depth) || (obj === null)) ? obj : ScalaJS.throwArrayCastException(obj, "Lscala.collection.mutable.ArrayOps$ofLong$;", depth))
});
ScalaJS.d.scm_ArrayOps$ofLong$ = new ScalaJS.ClassTypeData({
  scm_ArrayOps$ofLong$: 0
}, false, "scala.collection.mutable.ArrayOps$ofLong$", ScalaJS.d.O, {
  scm_ArrayOps$ofLong$: 1,
  O: 1
});
ScalaJS.c.scm_ArrayOps$ofLong$.prototype.$classData = ScalaJS.d.scm_ArrayOps$ofLong$;
ScalaJS.n.scm_ArrayOps$ofLong = (void 0);
ScalaJS.m.scm_ArrayOps$ofLong = (function() {
  if ((!ScalaJS.n.scm_ArrayOps$ofLong)) {
    ScalaJS.n.scm_ArrayOps$ofLong = new ScalaJS.c.scm_ArrayOps$ofLong$().init___()
  };
  return ScalaJS.n.scm_ArrayOps$ofLong
});
/** @constructor */
ScalaJS.c.scm_ArrayOps$ofRef = (function() {
  ScalaJS.c.O.call(this);
  this.repr$1 = null
});
ScalaJS.c.scm_ArrayOps$ofRef.prototype = new ScalaJS.h.O();
ScalaJS.c.scm_ArrayOps$ofRef.prototype.constructor = ScalaJS.c.scm_ArrayOps$ofRef;
/** @constructor */
ScalaJS.h.scm_ArrayOps$ofRef = (function() {
  /*<skip>*/
});
ScalaJS.h.scm_ArrayOps$ofRef.prototype = ScalaJS.c.scm_ArrayOps$ofRef.prototype;
ScalaJS.c.scm_ArrayOps$ofRef.prototype.seq__sc_TraversableOnce = (function() {
  var $$this = this.repr$1;
  return new ScalaJS.c.scm_WrappedArray$ofRef().init___AO($$this)
});
ScalaJS.c.scm_ArrayOps$ofRef.prototype.copyToArray__O__I__V = (function(xs, start) {
  ScalaJS.i.sc_TraversableOnce$class__copyToArray__sc_TraversableOnce__O__I__V(this, xs, start)
});
ScalaJS.c.scm_ArrayOps$ofRef.prototype.apply__I__O = (function(index) {
  var $$this = this.repr$1;
  return $$this.u[index]
});
ScalaJS.c.scm_ArrayOps$ofRef.prototype.lengthCompare__I__I = (function(len) {
  return ScalaJS.i.sc_IndexedSeqOptimized$class__lengthCompare__sc_IndexedSeqOptimized__I__I(this, len)
});
ScalaJS.c.scm_ArrayOps$ofRef.prototype.sameElements__sc_GenIterable__Z = (function(that) {
  return ScalaJS.i.sc_IndexedSeqOptimized$class__sameElements__sc_IndexedSeqOptimized__sc_GenIterable__Z(this, that)
});
ScalaJS.c.scm_ArrayOps$ofRef.prototype.isEmpty__Z = (function() {
  return ScalaJS.i.sc_IndexedSeqOptimized$class__isEmpty__sc_IndexedSeqOptimized__Z(this)
});
ScalaJS.c.scm_ArrayOps$ofRef.prototype.toList__sci_List = (function() {
  var this$1 = ScalaJS.m.sci_List();
  var cbf = this$1.ReusableCBFInstance$2;
  return ScalaJS.as.sci_List(ScalaJS.i.sc_TraversableLike$class__to__sc_TraversableLike__scg_CanBuildFrom__O(this, cbf))
});
ScalaJS.c.scm_ArrayOps$ofRef.prototype.thisCollection__sc_Traversable = (function() {
  var $$this = this.repr$1;
  return new ScalaJS.c.scm_WrappedArray$ofRef().init___AO($$this)
});
ScalaJS.c.scm_ArrayOps$ofRef.prototype.equals__O__Z = (function(x$1) {
  return ScalaJS.m.scm_ArrayOps$ofRef().equals$extension__AO__O__Z(this.repr$1, x$1)
});
ScalaJS.c.scm_ArrayOps$ofRef.prototype.mkString__T__T__T__T = (function(start, sep, end) {
  return ScalaJS.i.sc_TraversableOnce$class__mkString__sc_TraversableOnce__T__T__T__T(this, start, sep, end)
});
ScalaJS.c.scm_ArrayOps$ofRef.prototype.toString__T = (function() {
  return ScalaJS.i.sc_TraversableLike$class__toString__sc_TraversableLike__T(this)
});
ScalaJS.c.scm_ArrayOps$ofRef.prototype.foreach__F1__V = (function(f) {
  ScalaJS.i.sc_IndexedSeqOptimized$class__foreach__sc_IndexedSeqOptimized__F1__V(this, f)
});
ScalaJS.c.scm_ArrayOps$ofRef.prototype.reverse__O = (function() {
  return ScalaJS.i.sc_IndexedSeqOptimized$class__reverse__sc_IndexedSeqOptimized__O(this)
});
ScalaJS.c.scm_ArrayOps$ofRef.prototype.filter__F1__O = (function(p) {
  return ScalaJS.i.sc_TraversableLike$class__filterImpl__sc_TraversableLike__F1__Z__O(this, p, false)
});
ScalaJS.c.scm_ArrayOps$ofRef.prototype.toBuffer__scm_Buffer = (function() {
  return ScalaJS.i.sc_IndexedSeqLike$class__toBuffer__sc_IndexedSeqLike__scm_Buffer(this)
});
ScalaJS.c.scm_ArrayOps$ofRef.prototype.size__I = (function() {
  var $$this = this.repr$1;
  return $$this.u["length"]
});
ScalaJS.c.scm_ArrayOps$ofRef.prototype.init___AO = (function(repr) {
  this.repr$1 = repr;
  return this
});
ScalaJS.c.scm_ArrayOps$ofRef.prototype.iterator__sc_Iterator = (function() {
  var $$this = this.repr$1;
  return new ScalaJS.c.sc_IndexedSeqLike$Elements().init___sc_IndexedSeqLike__I__I(this, 0, $$this.u["length"])
});
ScalaJS.c.scm_ArrayOps$ofRef.prototype.length__I = (function() {
  var $$this = this.repr$1;
  return $$this.u["length"]
});
ScalaJS.c.scm_ArrayOps$ofRef.prototype.toStream__sci_Stream = (function() {
  var $$this = this.repr$1;
  var this$2 = new ScalaJS.c.sc_IndexedSeqLike$Elements().init___sc_IndexedSeqLike__I__I(this, 0, $$this.u["length"]);
  return ScalaJS.i.sc_Iterator$class__toStream__sc_Iterator__sci_Stream(this$2)
});
ScalaJS.c.scm_ArrayOps$ofRef.prototype.thisCollection__sc_Seq = (function() {
  var $$this = this.repr$1;
  return new ScalaJS.c.scm_WrappedArray$ofRef().init___AO($$this)
});
ScalaJS.c.scm_ArrayOps$ofRef.prototype.addString__scm_StringBuilder__T__T__T__scm_StringBuilder = (function(b, start, sep, end) {
  return ScalaJS.i.sc_TraversableOnce$class__addString__sc_TraversableOnce__scm_StringBuilder__T__T__T__scm_StringBuilder(this, b, start, sep, end)
});
ScalaJS.c.scm_ArrayOps$ofRef.prototype.repr__O = (function() {
  return this.repr$1
});
ScalaJS.c.scm_ArrayOps$ofRef.prototype.$$div$colon__O__F2__O = (function(z, op) {
  var $$this = this.repr$1;
  return ScalaJS.i.sc_IndexedSeqOptimized$class__foldl__sc_IndexedSeqOptimized__I__I__O__F2__O(this, 0, $$this.u["length"], z, op)
});
ScalaJS.c.scm_ArrayOps$ofRef.prototype.hashCode__I = (function() {
  return ScalaJS.m.scm_ArrayOps$ofRef().hashCode$extension__AO__I(this.repr$1)
});
ScalaJS.c.scm_ArrayOps$ofRef.prototype.copyToArray__O__I__I__V = (function(xs, start, len) {
  ScalaJS.i.scm_ArrayOps$class__copyToArray__scm_ArrayOps__O__I__I__V(this, xs, start, len)
});
ScalaJS.c.scm_ArrayOps$ofRef.prototype.isTraversableAgain__Z = (function() {
  return true
});
ScalaJS.c.scm_ArrayOps$ofRef.prototype.toArray__s_reflect_ClassTag__O = (function(evidence$1) {
  return ScalaJS.i.scm_ArrayOps$class__toArray__scm_ArrayOps__s_reflect_ClassTag__O(this, evidence$1)
});
ScalaJS.c.scm_ArrayOps$ofRef.prototype.toCollection__O__sc_Seq = (function(repr) {
  this.repr$1;
  var repr$1 = ScalaJS.asArrayOf.O(repr, 1);
  return new ScalaJS.c.scm_WrappedArray$ofRef().init___AO(repr$1)
});
ScalaJS.c.scm_ArrayOps$ofRef.prototype.newBuilder__scm_Builder = (function() {
  return ScalaJS.m.scm_ArrayOps$ofRef().newBuilder$extension__AO__scm_ArrayBuilder$ofRef(this.repr$1)
});
ScalaJS.c.scm_ArrayOps$ofRef.prototype.stringPrefix__T = (function() {
  return ScalaJS.i.sc_TraversableLike$class__stringPrefix__sc_TraversableLike__T(this)
});
ScalaJS.is.scm_ArrayOps$ofRef = (function(obj) {
  return (!(!((obj && obj.$classData) && obj.$classData.ancestors.scm_ArrayOps$ofRef)))
});
ScalaJS.as.scm_ArrayOps$ofRef = (function(obj) {
  return ((ScalaJS.is.scm_ArrayOps$ofRef(obj) || (obj === null)) ? obj : ScalaJS.throwClassCastException(obj, "scala.collection.mutable.ArrayOps$ofRef"))
});
ScalaJS.isArrayOf.scm_ArrayOps$ofRef = (function(obj, depth) {
  return (!(!(((obj && obj.$classData) && (obj.$classData.arrayDepth === depth)) && obj.$classData.arrayBase.ancestors.scm_ArrayOps$ofRef)))
});
ScalaJS.asArrayOf.scm_ArrayOps$ofRef = (function(obj, depth) {
  return ((ScalaJS.isArrayOf.scm_ArrayOps$ofRef(obj, depth) || (obj === null)) ? obj : ScalaJS.throwArrayCastException(obj, "Lscala.collection.mutable.ArrayOps$ofRef;", depth))
});
ScalaJS.d.scm_ArrayOps$ofRef = new ScalaJS.ClassTypeData({
  scm_ArrayOps$ofRef: 0
}, false, "scala.collection.mutable.ArrayOps$ofRef", ScalaJS.d.O, {
  scm_ArrayOps$ofRef: 1,
  scm_ArrayOps: 1,
  sc_CustomParallelizable: 1,
  scm_ArrayLike: 1,
  scm_IndexedSeqOptimized: 1,
  sc_IndexedSeqOptimized: 1,
  scm_IndexedSeqLike: 1,
  sc_IndexedSeqLike: 1,
  sc_SeqLike: 1,
  sc_GenSeqLike: 1,
  sc_IterableLike: 1,
  sc_GenIterableLike: 1,
  sc_TraversableLike: 1,
  sc_GenTraversableLike: 1,
  sc_Parallelizable: 1,
  sc_TraversableOnce: 1,
  sc_GenTraversableOnce: 1,
  scg_FilterMonadic: 1,
  scg_HasNewBuilder: 1,
  s_Equals: 1,
  O: 1
});
ScalaJS.c.scm_ArrayOps$ofRef.prototype.$classData = ScalaJS.d.scm_ArrayOps$ofRef;
/** @constructor */
ScalaJS.c.scm_ArrayOps$ofRef$ = (function() {
  ScalaJS.c.O.call(this)
});
ScalaJS.c.scm_ArrayOps$ofRef$.prototype = new ScalaJS.h.O();
ScalaJS.c.scm_ArrayOps$ofRef$.prototype.constructor = ScalaJS.c.scm_ArrayOps$ofRef$;
/** @constructor */
ScalaJS.h.scm_ArrayOps$ofRef$ = (function() {
  /*<skip>*/
});
ScalaJS.h.scm_ArrayOps$ofRef$.prototype = ScalaJS.c.scm_ArrayOps$ofRef$.prototype;
ScalaJS.c.scm_ArrayOps$ofRef$.prototype.newBuilder$extension__AO__scm_ArrayBuilder$ofRef = (function($$this) {
  return new ScalaJS.c.scm_ArrayBuilder$ofRef().init___s_reflect_ClassTag(ScalaJS.m.s_reflect_ClassTag().apply__jl_Class__s_reflect_ClassTag(ScalaJS.m.sr_ScalaRunTime().arrayElementClass__O__jl_Class(ScalaJS.objectGetClass($$this))))
});
ScalaJS.c.scm_ArrayOps$ofRef$.prototype.hashCode$extension__AO__I = (function($$this) {
  return ScalaJS.objectHashCode($$this)
});
ScalaJS.c.scm_ArrayOps$ofRef$.prototype.equals$extension__AO__O__Z = (function($$this, x$1) {
  if (ScalaJS.is.scm_ArrayOps$ofRef(x$1)) {
    var ofRef$1 = ((x$1 === null) ? null : ScalaJS.as.scm_ArrayOps$ofRef(x$1).repr$1);
    return ($$this === ofRef$1)
  } else {
    return false
  }
});
ScalaJS.is.scm_ArrayOps$ofRef$ = (function(obj) {
  return (!(!((obj && obj.$classData) && obj.$classData.ancestors.scm_ArrayOps$ofRef$)))
});
ScalaJS.as.scm_ArrayOps$ofRef$ = (function(obj) {
  return ((ScalaJS.is.scm_ArrayOps$ofRef$(obj) || (obj === null)) ? obj : ScalaJS.throwClassCastException(obj, "scala.collection.mutable.ArrayOps$ofRef$"))
});
ScalaJS.isArrayOf.scm_ArrayOps$ofRef$ = (function(obj, depth) {
  return (!(!(((obj && obj.$classData) && (obj.$classData.arrayDepth === depth)) && obj.$classData.arrayBase.ancestors.scm_ArrayOps$ofRef$)))
});
ScalaJS.asArrayOf.scm_ArrayOps$ofRef$ = (function(obj, depth) {
  return ((ScalaJS.isArrayOf.scm_ArrayOps$ofRef$(obj, depth) || (obj === null)) ? obj : ScalaJS.throwArrayCastException(obj, "Lscala.collection.mutable.ArrayOps$ofRef$;", depth))
});
ScalaJS.d.scm_ArrayOps$ofRef$ = new ScalaJS.ClassTypeData({
  scm_ArrayOps$ofRef$: 0
}, false, "scala.collection.mutable.ArrayOps$ofRef$", ScalaJS.d.O, {
  scm_ArrayOps$ofRef$: 1,
  O: 1
});
ScalaJS.c.scm_ArrayOps$ofRef$.prototype.$classData = ScalaJS.d.scm_ArrayOps$ofRef$;
ScalaJS.n.scm_ArrayOps$ofRef = (void 0);
ScalaJS.m.scm_ArrayOps$ofRef = (function() {
  if ((!ScalaJS.n.scm_ArrayOps$ofRef)) {
    ScalaJS.n.scm_ArrayOps$ofRef = new ScalaJS.c.scm_ArrayOps$ofRef$().init___()
  };
  return ScalaJS.n.scm_ArrayOps$ofRef
});
/** @constructor */
ScalaJS.c.scm_ArrayOps$ofShort = (function() {
  ScalaJS.c.O.call(this);
  this.repr$1 = null
});
ScalaJS.c.scm_ArrayOps$ofShort.prototype = new ScalaJS.h.O();
ScalaJS.c.scm_ArrayOps$ofShort.prototype.constructor = ScalaJS.c.scm_ArrayOps$ofShort;
/** @constructor */
ScalaJS.h.scm_ArrayOps$ofShort = (function() {
  /*<skip>*/
});
ScalaJS.h.scm_ArrayOps$ofShort.prototype = ScalaJS.c.scm_ArrayOps$ofShort.prototype;
ScalaJS.c.scm_ArrayOps$ofShort.prototype.seq__sc_TraversableOnce = (function() {
  var $$this = this.repr$1;
  return new ScalaJS.c.scm_WrappedArray$ofShort().init___AS($$this)
});
ScalaJS.c.scm_ArrayOps$ofShort.prototype.copyToArray__O__I__V = (function(xs, start) {
  ScalaJS.i.sc_TraversableOnce$class__copyToArray__sc_TraversableOnce__O__I__V(this, xs, start)
});
ScalaJS.c.scm_ArrayOps$ofShort.prototype.apply__I__O = (function(idx) {
  var $$this = this.repr$1;
  return $$this.u[idx]
});
ScalaJS.c.scm_ArrayOps$ofShort.prototype.lengthCompare__I__I = (function(len) {
  return ScalaJS.i.sc_IndexedSeqOptimized$class__lengthCompare__sc_IndexedSeqOptimized__I__I(this, len)
});
ScalaJS.c.scm_ArrayOps$ofShort.prototype.sameElements__sc_GenIterable__Z = (function(that) {
  return ScalaJS.i.sc_IndexedSeqOptimized$class__sameElements__sc_IndexedSeqOptimized__sc_GenIterable__Z(this, that)
});
ScalaJS.c.scm_ArrayOps$ofShort.prototype.isEmpty__Z = (function() {
  return ScalaJS.i.sc_IndexedSeqOptimized$class__isEmpty__sc_IndexedSeqOptimized__Z(this)
});
ScalaJS.c.scm_ArrayOps$ofShort.prototype.toList__sci_List = (function() {
  var this$1 = ScalaJS.m.sci_List();
  var cbf = this$1.ReusableCBFInstance$2;
  return ScalaJS.as.sci_List(ScalaJS.i.sc_TraversableLike$class__to__sc_TraversableLike__scg_CanBuildFrom__O(this, cbf))
});
ScalaJS.c.scm_ArrayOps$ofShort.prototype.init___AS = (function(repr) {
  this.repr$1 = repr;
  return this
});
ScalaJS.c.scm_ArrayOps$ofShort.prototype.thisCollection__sc_Traversable = (function() {
  var $$this = this.repr$1;
  return new ScalaJS.c.scm_WrappedArray$ofShort().init___AS($$this)
});
ScalaJS.c.scm_ArrayOps$ofShort.prototype.equals__O__Z = (function(x$1) {
  return ScalaJS.m.scm_ArrayOps$ofShort().equals$extension__AS__O__Z(this.repr$1, x$1)
});
ScalaJS.c.scm_ArrayOps$ofShort.prototype.mkString__T__T__T__T = (function(start, sep, end) {
  return ScalaJS.i.sc_TraversableOnce$class__mkString__sc_TraversableOnce__T__T__T__T(this, start, sep, end)
});
ScalaJS.c.scm_ArrayOps$ofShort.prototype.toString__T = (function() {
  return ScalaJS.i.sc_TraversableLike$class__toString__sc_TraversableLike__T(this)
});
ScalaJS.c.scm_ArrayOps$ofShort.prototype.foreach__F1__V = (function(f) {
  ScalaJS.i.sc_IndexedSeqOptimized$class__foreach__sc_IndexedSeqOptimized__F1__V(this, f)
});
ScalaJS.c.scm_ArrayOps$ofShort.prototype.reverse__O = (function() {
  return ScalaJS.i.sc_IndexedSeqOptimized$class__reverse__sc_IndexedSeqOptimized__O(this)
});
ScalaJS.c.scm_ArrayOps$ofShort.prototype.filter__F1__O = (function(p) {
  return ScalaJS.i.sc_TraversableLike$class__filterImpl__sc_TraversableLike__F1__Z__O(this, p, false)
});
ScalaJS.c.scm_ArrayOps$ofShort.prototype.toBuffer__scm_Buffer = (function() {
  return ScalaJS.i.sc_IndexedSeqLike$class__toBuffer__sc_IndexedSeqLike__scm_Buffer(this)
});
ScalaJS.c.scm_ArrayOps$ofShort.prototype.size__I = (function() {
  var $$this = this.repr$1;
  return $$this.u["length"]
});
ScalaJS.c.scm_ArrayOps$ofShort.prototype.iterator__sc_Iterator = (function() {
  var $$this = this.repr$1;
  return new ScalaJS.c.sc_IndexedSeqLike$Elements().init___sc_IndexedSeqLike__I__I(this, 0, $$this.u["length"])
});
ScalaJS.c.scm_ArrayOps$ofShort.prototype.length__I = (function() {
  var $$this = this.repr$1;
  return $$this.u["length"]
});
ScalaJS.c.scm_ArrayOps$ofShort.prototype.toStream__sci_Stream = (function() {
  var $$this = this.repr$1;
  var this$2 = new ScalaJS.c.sc_IndexedSeqLike$Elements().init___sc_IndexedSeqLike__I__I(this, 0, $$this.u["length"]);
  return ScalaJS.i.sc_Iterator$class__toStream__sc_Iterator__sci_Stream(this$2)
});
ScalaJS.c.scm_ArrayOps$ofShort.prototype.thisCollection__sc_Seq = (function() {
  var $$this = this.repr$1;
  return new ScalaJS.c.scm_WrappedArray$ofShort().init___AS($$this)
});
ScalaJS.c.scm_ArrayOps$ofShort.prototype.addString__scm_StringBuilder__T__T__T__scm_StringBuilder = (function(b, start, sep, end) {
  return ScalaJS.i.sc_TraversableOnce$class__addString__sc_TraversableOnce__scm_StringBuilder__T__T__T__scm_StringBuilder(this, b, start, sep, end)
});
ScalaJS.c.scm_ArrayOps$ofShort.prototype.repr__O = (function() {
  return this.repr$1
});
ScalaJS.c.scm_ArrayOps$ofShort.prototype.$$div$colon__O__F2__O = (function(z, op) {
  var $$this = this.repr$1;
  return ScalaJS.i.sc_IndexedSeqOptimized$class__foldl__sc_IndexedSeqOptimized__I__I__O__F2__O(this, 0, $$this.u["length"], z, op)
});
ScalaJS.c.scm_ArrayOps$ofShort.prototype.hashCode__I = (function() {
  return ScalaJS.m.scm_ArrayOps$ofShort().hashCode$extension__AS__I(this.repr$1)
});
ScalaJS.c.scm_ArrayOps$ofShort.prototype.copyToArray__O__I__I__V = (function(xs, start, len) {
  ScalaJS.i.scm_ArrayOps$class__copyToArray__scm_ArrayOps__O__I__I__V(this, xs, start, len)
});
ScalaJS.c.scm_ArrayOps$ofShort.prototype.isTraversableAgain__Z = (function() {
  return true
});
ScalaJS.c.scm_ArrayOps$ofShort.prototype.toArray__s_reflect_ClassTag__O = (function(evidence$1) {
  return ScalaJS.i.scm_ArrayOps$class__toArray__scm_ArrayOps__s_reflect_ClassTag__O(this, evidence$1)
});
ScalaJS.c.scm_ArrayOps$ofShort.prototype.toCollection__O__sc_Seq = (function(repr) {
  this.repr$1;
  var repr$1 = ScalaJS.asArrayOf.S(repr, 1);
  return new ScalaJS.c.scm_WrappedArray$ofShort().init___AS(repr$1)
});
ScalaJS.c.scm_ArrayOps$ofShort.prototype.newBuilder__scm_Builder = (function() {
  return (this.repr$1, new ScalaJS.c.scm_ArrayBuilder$ofShort().init___())
});
ScalaJS.c.scm_ArrayOps$ofShort.prototype.stringPrefix__T = (function() {
  return ScalaJS.i.sc_TraversableLike$class__stringPrefix__sc_TraversableLike__T(this)
});
ScalaJS.is.scm_ArrayOps$ofShort = (function(obj) {
  return (!(!((obj && obj.$classData) && obj.$classData.ancestors.scm_ArrayOps$ofShort)))
});
ScalaJS.as.scm_ArrayOps$ofShort = (function(obj) {
  return ((ScalaJS.is.scm_ArrayOps$ofShort(obj) || (obj === null)) ? obj : ScalaJS.throwClassCastException(obj, "scala.collection.mutable.ArrayOps$ofShort"))
});
ScalaJS.isArrayOf.scm_ArrayOps$ofShort = (function(obj, depth) {
  return (!(!(((obj && obj.$classData) && (obj.$classData.arrayDepth === depth)) && obj.$classData.arrayBase.ancestors.scm_ArrayOps$ofShort)))
});
ScalaJS.asArrayOf.scm_ArrayOps$ofShort = (function(obj, depth) {
  return ((ScalaJS.isArrayOf.scm_ArrayOps$ofShort(obj, depth) || (obj === null)) ? obj : ScalaJS.throwArrayCastException(obj, "Lscala.collection.mutable.ArrayOps$ofShort;", depth))
});
ScalaJS.d.scm_ArrayOps$ofShort = new ScalaJS.ClassTypeData({
  scm_ArrayOps$ofShort: 0
}, false, "scala.collection.mutable.ArrayOps$ofShort", ScalaJS.d.O, {
  scm_ArrayOps$ofShort: 1,
  scm_ArrayOps: 1,
  sc_CustomParallelizable: 1,
  scm_ArrayLike: 1,
  scm_IndexedSeqOptimized: 1,
  sc_IndexedSeqOptimized: 1,
  scm_IndexedSeqLike: 1,
  sc_IndexedSeqLike: 1,
  sc_SeqLike: 1,
  sc_GenSeqLike: 1,
  sc_IterableLike: 1,
  sc_GenIterableLike: 1,
  sc_TraversableLike: 1,
  sc_GenTraversableLike: 1,
  sc_Parallelizable: 1,
  sc_TraversableOnce: 1,
  sc_GenTraversableOnce: 1,
  scg_FilterMonadic: 1,
  scg_HasNewBuilder: 1,
  s_Equals: 1,
  O: 1
});
ScalaJS.c.scm_ArrayOps$ofShort.prototype.$classData = ScalaJS.d.scm_ArrayOps$ofShort;
/** @constructor */
ScalaJS.c.scm_ArrayOps$ofShort$ = (function() {
  ScalaJS.c.O.call(this)
});
ScalaJS.c.scm_ArrayOps$ofShort$.prototype = new ScalaJS.h.O();
ScalaJS.c.scm_ArrayOps$ofShort$.prototype.constructor = ScalaJS.c.scm_ArrayOps$ofShort$;
/** @constructor */
ScalaJS.h.scm_ArrayOps$ofShort$ = (function() {
  /*<skip>*/
});
ScalaJS.h.scm_ArrayOps$ofShort$.prototype = ScalaJS.c.scm_ArrayOps$ofShort$.prototype;
ScalaJS.c.scm_ArrayOps$ofShort$.prototype.hashCode$extension__AS__I = (function($$this) {
  return ScalaJS.objectHashCode($$this)
});
ScalaJS.c.scm_ArrayOps$ofShort$.prototype.equals$extension__AS__O__Z = (function($$this, x$1) {
  if (ScalaJS.is.scm_ArrayOps$ofShort(x$1)) {
    var ofShort$1 = ((x$1 === null) ? null : ScalaJS.as.scm_ArrayOps$ofShort(x$1).repr$1);
    return ($$this === ofShort$1)
  } else {
    return false
  }
});
ScalaJS.is.scm_ArrayOps$ofShort$ = (function(obj) {
  return (!(!((obj && obj.$classData) && obj.$classData.ancestors.scm_ArrayOps$ofShort$)))
});
ScalaJS.as.scm_ArrayOps$ofShort$ = (function(obj) {
  return ((ScalaJS.is.scm_ArrayOps$ofShort$(obj) || (obj === null)) ? obj : ScalaJS.throwClassCastException(obj, "scala.collection.mutable.ArrayOps$ofShort$"))
});
ScalaJS.isArrayOf.scm_ArrayOps$ofShort$ = (function(obj, depth) {
  return (!(!(((obj && obj.$classData) && (obj.$classData.arrayDepth === depth)) && obj.$classData.arrayBase.ancestors.scm_ArrayOps$ofShort$)))
});
ScalaJS.asArrayOf.scm_ArrayOps$ofShort$ = (function(obj, depth) {
  return ((ScalaJS.isArrayOf.scm_ArrayOps$ofShort$(obj, depth) || (obj === null)) ? obj : ScalaJS.throwArrayCastException(obj, "Lscala.collection.mutable.ArrayOps$ofShort$;", depth))
});
ScalaJS.d.scm_ArrayOps$ofShort$ = new ScalaJS.ClassTypeData({
  scm_ArrayOps$ofShort$: 0
}, false, "scala.collection.mutable.ArrayOps$ofShort$", ScalaJS.d.O, {
  scm_ArrayOps$ofShort$: 1,
  O: 1
});
ScalaJS.c.scm_ArrayOps$ofShort$.prototype.$classData = ScalaJS.d.scm_ArrayOps$ofShort$;
ScalaJS.n.scm_ArrayOps$ofShort = (void 0);
ScalaJS.m.scm_ArrayOps$ofShort = (function() {
  if ((!ScalaJS.n.scm_ArrayOps$ofShort)) {
    ScalaJS.n.scm_ArrayOps$ofShort = new ScalaJS.c.scm_ArrayOps$ofShort$().init___()
  };
  return ScalaJS.n.scm_ArrayOps$ofShort
});
/** @constructor */
ScalaJS.c.scm_ArrayOps$ofUnit = (function() {
  ScalaJS.c.O.call(this);
  this.repr$1 = null
});
ScalaJS.c.scm_ArrayOps$ofUnit.prototype = new ScalaJS.h.O();
ScalaJS.c.scm_ArrayOps$ofUnit.prototype.constructor = ScalaJS.c.scm_ArrayOps$ofUnit;
/** @constructor */
ScalaJS.h.scm_ArrayOps$ofUnit = (function() {
  /*<skip>*/
});
ScalaJS.h.scm_ArrayOps$ofUnit.prototype = ScalaJS.c.scm_ArrayOps$ofUnit.prototype;
ScalaJS.c.scm_ArrayOps$ofUnit.prototype.seq__sc_TraversableOnce = (function() {
  var $$this = this.repr$1;
  return new ScalaJS.c.scm_WrappedArray$ofUnit().init___Asr_BoxedUnit($$this)
});
ScalaJS.c.scm_ArrayOps$ofUnit.prototype.copyToArray__O__I__V = (function(xs, start) {
  ScalaJS.i.sc_TraversableOnce$class__copyToArray__sc_TraversableOnce__O__I__V(this, xs, start)
});
ScalaJS.c.scm_ArrayOps$ofUnit.prototype.apply__I__O = (function(idx) {
  var $$this = this.repr$1;
  $$this.u[idx]
});
ScalaJS.c.scm_ArrayOps$ofUnit.prototype.lengthCompare__I__I = (function(len) {
  return ScalaJS.i.sc_IndexedSeqOptimized$class__lengthCompare__sc_IndexedSeqOptimized__I__I(this, len)
});
ScalaJS.c.scm_ArrayOps$ofUnit.prototype.sameElements__sc_GenIterable__Z = (function(that) {
  return ScalaJS.i.sc_IndexedSeqOptimized$class__sameElements__sc_IndexedSeqOptimized__sc_GenIterable__Z(this, that)
});
ScalaJS.c.scm_ArrayOps$ofUnit.prototype.isEmpty__Z = (function() {
  return ScalaJS.i.sc_IndexedSeqOptimized$class__isEmpty__sc_IndexedSeqOptimized__Z(this)
});
ScalaJS.c.scm_ArrayOps$ofUnit.prototype.toList__sci_List = (function() {
  var this$1 = ScalaJS.m.sci_List();
  var cbf = this$1.ReusableCBFInstance$2;
  return ScalaJS.as.sci_List(ScalaJS.i.sc_TraversableLike$class__to__sc_TraversableLike__scg_CanBuildFrom__O(this, cbf))
});
ScalaJS.c.scm_ArrayOps$ofUnit.prototype.thisCollection__sc_Traversable = (function() {
  var $$this = this.repr$1;
  return new ScalaJS.c.scm_WrappedArray$ofUnit().init___Asr_BoxedUnit($$this)
});
ScalaJS.c.scm_ArrayOps$ofUnit.prototype.equals__O__Z = (function(x$1) {
  return ScalaJS.m.scm_ArrayOps$ofUnit().equals$extension__Asr_BoxedUnit__O__Z(this.repr$1, x$1)
});
ScalaJS.c.scm_ArrayOps$ofUnit.prototype.mkString__T__T__T__T = (function(start, sep, end) {
  return ScalaJS.i.sc_TraversableOnce$class__mkString__sc_TraversableOnce__T__T__T__T(this, start, sep, end)
});
ScalaJS.c.scm_ArrayOps$ofUnit.prototype.toString__T = (function() {
  return ScalaJS.i.sc_TraversableLike$class__toString__sc_TraversableLike__T(this)
});
ScalaJS.c.scm_ArrayOps$ofUnit.prototype.foreach__F1__V = (function(f) {
  ScalaJS.i.sc_IndexedSeqOptimized$class__foreach__sc_IndexedSeqOptimized__F1__V(this, f)
});
ScalaJS.c.scm_ArrayOps$ofUnit.prototype.reverse__O = (function() {
  return ScalaJS.i.sc_IndexedSeqOptimized$class__reverse__sc_IndexedSeqOptimized__O(this)
});
ScalaJS.c.scm_ArrayOps$ofUnit.prototype.filter__F1__O = (function(p) {
  return ScalaJS.i.sc_TraversableLike$class__filterImpl__sc_TraversableLike__F1__Z__O(this, p, false)
});
ScalaJS.c.scm_ArrayOps$ofUnit.prototype.toBuffer__scm_Buffer = (function() {
  return ScalaJS.i.sc_IndexedSeqLike$class__toBuffer__sc_IndexedSeqLike__scm_Buffer(this)
});
ScalaJS.c.scm_ArrayOps$ofUnit.prototype.size__I = (function() {
  var $$this = this.repr$1;
  return $$this.u["length"]
});
ScalaJS.c.scm_ArrayOps$ofUnit.prototype.iterator__sc_Iterator = (function() {
  var $$this = this.repr$1;
  return new ScalaJS.c.sc_IndexedSeqLike$Elements().init___sc_IndexedSeqLike__I__I(this, 0, $$this.u["length"])
});
ScalaJS.c.scm_ArrayOps$ofUnit.prototype.length__I = (function() {
  var $$this = this.repr$1;
  return $$this.u["length"]
});
ScalaJS.c.scm_ArrayOps$ofUnit.prototype.toStream__sci_Stream = (function() {
  var $$this = this.repr$1;
  var this$2 = new ScalaJS.c.sc_IndexedSeqLike$Elements().init___sc_IndexedSeqLike__I__I(this, 0, $$this.u["length"]);
  return ScalaJS.i.sc_Iterator$class__toStream__sc_Iterator__sci_Stream(this$2)
});
ScalaJS.c.scm_ArrayOps$ofUnit.prototype.init___Asr_BoxedUnit = (function(repr) {
  this.repr$1 = repr;
  return this
});
ScalaJS.c.scm_ArrayOps$ofUnit.prototype.thisCollection__sc_Seq = (function() {
  var $$this = this.repr$1;
  return new ScalaJS.c.scm_WrappedArray$ofUnit().init___Asr_BoxedUnit($$this)
});
ScalaJS.c.scm_ArrayOps$ofUnit.prototype.addString__scm_StringBuilder__T__T__T__scm_StringBuilder = (function(b, start, sep, end) {
  return ScalaJS.i.sc_TraversableOnce$class__addString__sc_TraversableOnce__scm_StringBuilder__T__T__T__scm_StringBuilder(this, b, start, sep, end)
});
ScalaJS.c.scm_ArrayOps$ofUnit.prototype.repr__O = (function() {
  return this.repr$1
});
ScalaJS.c.scm_ArrayOps$ofUnit.prototype.$$div$colon__O__F2__O = (function(z, op) {
  var $$this = this.repr$1;
  return ScalaJS.i.sc_IndexedSeqOptimized$class__foldl__sc_IndexedSeqOptimized__I__I__O__F2__O(this, 0, $$this.u["length"], z, op)
});
ScalaJS.c.scm_ArrayOps$ofUnit.prototype.hashCode__I = (function() {
  return ScalaJS.m.scm_ArrayOps$ofUnit().hashCode$extension__Asr_BoxedUnit__I(this.repr$1)
});
ScalaJS.c.scm_ArrayOps$ofUnit.prototype.copyToArray__O__I__I__V = (function(xs, start, len) {
  ScalaJS.i.scm_ArrayOps$class__copyToArray__scm_ArrayOps__O__I__I__V(this, xs, start, len)
});
ScalaJS.c.scm_ArrayOps$ofUnit.prototype.isTraversableAgain__Z = (function() {
  return true
});
ScalaJS.c.scm_ArrayOps$ofUnit.prototype.toArray__s_reflect_ClassTag__O = (function(evidence$1) {
  return ScalaJS.i.scm_ArrayOps$class__toArray__scm_ArrayOps__s_reflect_ClassTag__O(this, evidence$1)
});
ScalaJS.c.scm_ArrayOps$ofUnit.prototype.toCollection__O__sc_Seq = (function(repr) {
  this.repr$1;
  var repr$1 = ScalaJS.asArrayOf.sr_BoxedUnit(repr, 1);
  return new ScalaJS.c.scm_WrappedArray$ofUnit().init___Asr_BoxedUnit(repr$1)
});
ScalaJS.c.scm_ArrayOps$ofUnit.prototype.newBuilder__scm_Builder = (function() {
  return (this.repr$1, new ScalaJS.c.scm_ArrayBuilder$ofUnit().init___())
});
ScalaJS.c.scm_ArrayOps$ofUnit.prototype.stringPrefix__T = (function() {
  return ScalaJS.i.sc_TraversableLike$class__stringPrefix__sc_TraversableLike__T(this)
});
ScalaJS.is.scm_ArrayOps$ofUnit = (function(obj) {
  return (!(!((obj && obj.$classData) && obj.$classData.ancestors.scm_ArrayOps$ofUnit)))
});
ScalaJS.as.scm_ArrayOps$ofUnit = (function(obj) {
  return ((ScalaJS.is.scm_ArrayOps$ofUnit(obj) || (obj === null)) ? obj : ScalaJS.throwClassCastException(obj, "scala.collection.mutable.ArrayOps$ofUnit"))
});
ScalaJS.isArrayOf.scm_ArrayOps$ofUnit = (function(obj, depth) {
  return (!(!(((obj && obj.$classData) && (obj.$classData.arrayDepth === depth)) && obj.$classData.arrayBase.ancestors.scm_ArrayOps$ofUnit)))
});
ScalaJS.asArrayOf.scm_ArrayOps$ofUnit = (function(obj, depth) {
  return ((ScalaJS.isArrayOf.scm_ArrayOps$ofUnit(obj, depth) || (obj === null)) ? obj : ScalaJS.throwArrayCastException(obj, "Lscala.collection.mutable.ArrayOps$ofUnit;", depth))
});
ScalaJS.d.scm_ArrayOps$ofUnit = new ScalaJS.ClassTypeData({
  scm_ArrayOps$ofUnit: 0
}, false, "scala.collection.mutable.ArrayOps$ofUnit", ScalaJS.d.O, {
  scm_ArrayOps$ofUnit: 1,
  scm_ArrayOps: 1,
  sc_CustomParallelizable: 1,
  scm_ArrayLike: 1,
  scm_IndexedSeqOptimized: 1,
  sc_IndexedSeqOptimized: 1,
  scm_IndexedSeqLike: 1,
  sc_IndexedSeqLike: 1,
  sc_SeqLike: 1,
  sc_GenSeqLike: 1,
  sc_IterableLike: 1,
  sc_GenIterableLike: 1,
  sc_TraversableLike: 1,
  sc_GenTraversableLike: 1,
  sc_Parallelizable: 1,
  sc_TraversableOnce: 1,
  sc_GenTraversableOnce: 1,
  scg_FilterMonadic: 1,
  scg_HasNewBuilder: 1,
  s_Equals: 1,
  O: 1
});
ScalaJS.c.scm_ArrayOps$ofUnit.prototype.$classData = ScalaJS.d.scm_ArrayOps$ofUnit;
/** @constructor */
ScalaJS.c.scm_ArrayOps$ofUnit$ = (function() {
  ScalaJS.c.O.call(this)
});
ScalaJS.c.scm_ArrayOps$ofUnit$.prototype = new ScalaJS.h.O();
ScalaJS.c.scm_ArrayOps$ofUnit$.prototype.constructor = ScalaJS.c.scm_ArrayOps$ofUnit$;
/** @constructor */
ScalaJS.h.scm_ArrayOps$ofUnit$ = (function() {
  /*<skip>*/
});
ScalaJS.h.scm_ArrayOps$ofUnit$.prototype = ScalaJS.c.scm_ArrayOps$ofUnit$.prototype;
ScalaJS.c.scm_ArrayOps$ofUnit$.prototype.hashCode$extension__Asr_BoxedUnit__I = (function($$this) {
  return ScalaJS.objectHashCode($$this)
});
ScalaJS.c.scm_ArrayOps$ofUnit$.prototype.equals$extension__Asr_BoxedUnit__O__Z = (function($$this, x$1) {
  if (ScalaJS.is.scm_ArrayOps$ofUnit(x$1)) {
    var ofUnit$1 = ((x$1 === null) ? null : ScalaJS.as.scm_ArrayOps$ofUnit(x$1).repr$1);
    return ($$this === ofUnit$1)
  } else {
    return false
  }
});
ScalaJS.is.scm_ArrayOps$ofUnit$ = (function(obj) {
  return (!(!((obj && obj.$classData) && obj.$classData.ancestors.scm_ArrayOps$ofUnit$)))
});
ScalaJS.as.scm_ArrayOps$ofUnit$ = (function(obj) {
  return ((ScalaJS.is.scm_ArrayOps$ofUnit$(obj) || (obj === null)) ? obj : ScalaJS.throwClassCastException(obj, "scala.collection.mutable.ArrayOps$ofUnit$"))
});
ScalaJS.isArrayOf.scm_ArrayOps$ofUnit$ = (function(obj, depth) {
  return (!(!(((obj && obj.$classData) && (obj.$classData.arrayDepth === depth)) && obj.$classData.arrayBase.ancestors.scm_ArrayOps$ofUnit$)))
});
ScalaJS.asArrayOf.scm_ArrayOps$ofUnit$ = (function(obj, depth) {
  return ((ScalaJS.isArrayOf.scm_ArrayOps$ofUnit$(obj, depth) || (obj === null)) ? obj : ScalaJS.throwArrayCastException(obj, "Lscala.collection.mutable.ArrayOps$ofUnit$;", depth))
});
ScalaJS.d.scm_ArrayOps$ofUnit$ = new ScalaJS.ClassTypeData({
  scm_ArrayOps$ofUnit$: 0
}, false, "scala.collection.mutable.ArrayOps$ofUnit$", ScalaJS.d.O, {
  scm_ArrayOps$ofUnit$: 1,
  O: 1
});
ScalaJS.c.scm_ArrayOps$ofUnit$.prototype.$classData = ScalaJS.d.scm_ArrayOps$ofUnit$;
ScalaJS.n.scm_ArrayOps$ofUnit = (void 0);
ScalaJS.m.scm_ArrayOps$ofUnit = (function() {
  if ((!ScalaJS.n.scm_ArrayOps$ofUnit)) {
    ScalaJS.n.scm_ArrayOps$ofUnit = new ScalaJS.c.scm_ArrayOps$ofUnit$().init___()
  };
  return ScalaJS.n.scm_ArrayOps$ofUnit
});
ScalaJS.is.scm_Buffer = (function(obj) {
  return (!(!((obj && obj.$classData) && obj.$classData.ancestors.scm_Buffer)))
});
ScalaJS.as.scm_Buffer = (function(obj) {
  return ((ScalaJS.is.scm_Buffer(obj) || (obj === null)) ? obj : ScalaJS.throwClassCastException(obj, "scala.collection.mutable.Buffer"))
});
ScalaJS.isArrayOf.scm_Buffer = (function(obj, depth) {
  return (!(!(((obj && obj.$classData) && (obj.$classData.arrayDepth === depth)) && obj.$classData.arrayBase.ancestors.scm_Buffer)))
});
ScalaJS.asArrayOf.scm_Buffer = (function(obj, depth) {
  return ((ScalaJS.isArrayOf.scm_Buffer(obj, depth) || (obj === null)) ? obj : ScalaJS.throwArrayCastException(obj, "Lscala.collection.mutable.Buffer;", depth))
});
ScalaJS.d.scm_Buffer = new ScalaJS.ClassTypeData({
  scm_Buffer: 0
}, true, "scala.collection.mutable.Buffer", (void 0), {
  scm_Buffer: 1,
  scm_BufferLike: 1,
  scg_Subtractable: 1,
  sc_script_Scriptable: 1,
  scg_Shrinkable: 1,
  scg_Growable: 1,
  scg_Clearable: 1,
  scm_Seq: 1,
  scm_SeqLike: 1,
  scm_Cloneable: 1,
  s_Cloneable: 1,
  jl_Cloneable: 1,
  sc_Seq: 1,
  sc_SeqLike: 1,
  sc_GenSeq: 1,
  sc_GenSeqLike: 1,
  s_PartialFunction: 1,
  F1: 1,
  scm_Iterable: 1,
  sc_Iterable: 1,
  sc_IterableLike: 1,
  s_Equals: 1,
  sc_GenIterable: 1,
  sc_GenIterableLike: 1,
  scm_Traversable: 1,
  s_Mutable: 1,
  sc_Traversable: 1,
  sc_GenTraversable: 1,
  scg_GenericTraversableTemplate: 1,
  sc_TraversableLike: 1,
  sc_GenTraversableLike: 1,
  sc_Parallelizable: 1,
  sc_TraversableOnce: 1,
  sc_GenTraversableOnce: 1,
  scg_FilterMonadic: 1,
  scg_HasNewBuilder: 1,
  O: 1
});
ScalaJS.is.scm_Builder = (function(obj) {
  return (!(!((obj && obj.$classData) && obj.$classData.ancestors.scm_Builder)))
});
ScalaJS.as.scm_Builder = (function(obj) {
  return ((ScalaJS.is.scm_Builder(obj) || (obj === null)) ? obj : ScalaJS.throwClassCastException(obj, "scala.collection.mutable.Builder"))
});
ScalaJS.isArrayOf.scm_Builder = (function(obj, depth) {
  return (!(!(((obj && obj.$classData) && (obj.$classData.arrayDepth === depth)) && obj.$classData.arrayBase.ancestors.scm_Builder)))
});
ScalaJS.asArrayOf.scm_Builder = (function(obj, depth) {
  return ((ScalaJS.isArrayOf.scm_Builder(obj, depth) || (obj === null)) ? obj : ScalaJS.throwArrayCastException(obj, "Lscala.collection.mutable.Builder;", depth))
});
ScalaJS.d.scm_Builder = new ScalaJS.ClassTypeData({
  scm_Builder: 0
}, true, "scala.collection.mutable.Builder", (void 0), {
  scm_Builder: 1,
  scg_Growable: 1,
  scg_Clearable: 1,
  O: 1
});
/** @constructor */
ScalaJS.c.scm_Builder$$anon$1 = (function() {
  ScalaJS.c.O.call(this);
  this.self$1 = null;
  this.f$1$1 = null
});
ScalaJS.c.scm_Builder$$anon$1.prototype = new ScalaJS.h.O();
ScalaJS.c.scm_Builder$$anon$1.prototype.constructor = ScalaJS.c.scm_Builder$$anon$1;
/** @constructor */
ScalaJS.h.scm_Builder$$anon$1 = (function() {
  /*<skip>*/
});
ScalaJS.h.scm_Builder$$anon$1.prototype = ScalaJS.c.scm_Builder$$anon$1.prototype;
ScalaJS.c.scm_Builder$$anon$1.prototype.init___scm_Builder__F1 = (function($$outer, f$1) {
  this.f$1$1 = f$1;
  this.self$1 = $$outer;
  return this
});
ScalaJS.c.scm_Builder$$anon$1.prototype.equals__O__Z = (function(that) {
  return ScalaJS.i.s_Proxy$class__equals__s_Proxy__O__Z(this, that)
});
ScalaJS.c.scm_Builder$$anon$1.prototype.$$plus$eq__O__scg_Growable = (function(elem) {
  return this.$$plus$eq__O__scm_Builder$$anon$1(elem)
});
ScalaJS.c.scm_Builder$$anon$1.prototype.toString__T = (function() {
  return ScalaJS.i.s_Proxy$class__toString__s_Proxy__T(this)
});
ScalaJS.c.scm_Builder$$anon$1.prototype.$$plus$plus$eq__sc_TraversableOnce__scm_Builder$$anon$1 = (function(xs) {
  return (this.self$1.$$plus$plus$eq__sc_TraversableOnce__scg_Growable(xs), this)
});
ScalaJS.c.scm_Builder$$anon$1.prototype.result__O = (function() {
  return this.f$1$1.apply__O__O(this.self$1.result__O())
});
ScalaJS.c.scm_Builder$$anon$1.prototype.sizeHintBounded__I__sc_TraversableLike__V = (function(size, boundColl) {
  this.self$1.sizeHintBounded__I__sc_TraversableLike__V(size, boundColl)
});
ScalaJS.c.scm_Builder$$anon$1.prototype.$$plus$eq__O__scm_Builder = (function(elem) {
  return this.$$plus$eq__O__scm_Builder$$anon$1(elem)
});
ScalaJS.c.scm_Builder$$anon$1.prototype.$$plus$eq__O__scm_Builder$$anon$1 = (function(x) {
  return (this.self$1.$$plus$eq__O__scm_Builder(x), this)
});
ScalaJS.c.scm_Builder$$anon$1.prototype.hashCode__I = (function() {
  return ScalaJS.i.s_Proxy$class__hashCode__s_Proxy__I(this)
});
ScalaJS.c.scm_Builder$$anon$1.prototype.sizeHint__I__V = (function(size) {
  this.self$1.sizeHint__I__V(size)
});
ScalaJS.c.scm_Builder$$anon$1.prototype.$$plus$plus$eq__sc_TraversableOnce__scg_Growable = (function(xs) {
  return this.$$plus$plus$eq__sc_TraversableOnce__scm_Builder$$anon$1(xs)
});
ScalaJS.is.scm_Builder$$anon$1 = (function(obj) {
  return (!(!((obj && obj.$classData) && obj.$classData.ancestors.scm_Builder$$anon$1)))
});
ScalaJS.as.scm_Builder$$anon$1 = (function(obj) {
  return ((ScalaJS.is.scm_Builder$$anon$1(obj) || (obj === null)) ? obj : ScalaJS.throwClassCastException(obj, "scala.collection.mutable.Builder$$anon$1"))
});
ScalaJS.isArrayOf.scm_Builder$$anon$1 = (function(obj, depth) {
  return (!(!(((obj && obj.$classData) && (obj.$classData.arrayDepth === depth)) && obj.$classData.arrayBase.ancestors.scm_Builder$$anon$1)))
});
ScalaJS.asArrayOf.scm_Builder$$anon$1 = (function(obj, depth) {
  return ((ScalaJS.isArrayOf.scm_Builder$$anon$1(obj, depth) || (obj === null)) ? obj : ScalaJS.throwArrayCastException(obj, "Lscala.collection.mutable.Builder$$anon$1;", depth))
});
ScalaJS.d.scm_Builder$$anon$1 = new ScalaJS.ClassTypeData({
  scm_Builder$$anon$1: 0
}, false, "scala.collection.mutable.Builder$$anon$1", ScalaJS.d.O, {
  scm_Builder$$anon$1: 1,
  s_Proxy: 1,
  scm_Builder: 1,
  scg_Growable: 1,
  scg_Clearable: 1,
  O: 1
});
ScalaJS.c.scm_Builder$$anon$1.prototype.$classData = ScalaJS.d.scm_Builder$$anon$1;
/** @constructor */
ScalaJS.c.scm_FlatHashTable$ = (function() {
  ScalaJS.c.O.call(this)
});
ScalaJS.c.scm_FlatHashTable$.prototype = new ScalaJS.h.O();
ScalaJS.c.scm_FlatHashTable$.prototype.constructor = ScalaJS.c.scm_FlatHashTable$;
/** @constructor */
ScalaJS.h.scm_FlatHashTable$ = (function() {
  /*<skip>*/
});
ScalaJS.h.scm_FlatHashTable$.prototype = ScalaJS.c.scm_FlatHashTable$.prototype;
ScalaJS.c.scm_FlatHashTable$.prototype.newThreshold__I__I__I = (function(_loadFactor, size) {
  var assertion = (_loadFactor < 500);
  if ((!assertion)) {
    throw new ScalaJS.c.jl_AssertionError().init___O(("assertion failed: " + "loadFactor too large; must be < 0.5"))
  };
  return new ScalaJS.c.sjsr_RuntimeLong().init___I(size).$$times__sjsr_RuntimeLong__sjsr_RuntimeLong(new ScalaJS.c.sjsr_RuntimeLong().init___I(_loadFactor)).$$div__sjsr_RuntimeLong__sjsr_RuntimeLong(new ScalaJS.c.sjsr_RuntimeLong().init___I(1000)).toInt__I()
});
ScalaJS.is.scm_FlatHashTable$ = (function(obj) {
  return (!(!((obj && obj.$classData) && obj.$classData.ancestors.scm_FlatHashTable$)))
});
ScalaJS.as.scm_FlatHashTable$ = (function(obj) {
  return ((ScalaJS.is.scm_FlatHashTable$(obj) || (obj === null)) ? obj : ScalaJS.throwClassCastException(obj, "scala.collection.mutable.FlatHashTable$"))
});
ScalaJS.isArrayOf.scm_FlatHashTable$ = (function(obj, depth) {
  return (!(!(((obj && obj.$classData) && (obj.$classData.arrayDepth === depth)) && obj.$classData.arrayBase.ancestors.scm_FlatHashTable$)))
});
ScalaJS.asArrayOf.scm_FlatHashTable$ = (function(obj, depth) {
  return ((ScalaJS.isArrayOf.scm_FlatHashTable$(obj, depth) || (obj === null)) ? obj : ScalaJS.throwArrayCastException(obj, "Lscala.collection.mutable.FlatHashTable$;", depth))
});
ScalaJS.d.scm_FlatHashTable$ = new ScalaJS.ClassTypeData({
  scm_FlatHashTable$: 0
}, false, "scala.collection.mutable.FlatHashTable$", ScalaJS.d.O, {
  scm_FlatHashTable$: 1,
  O: 1
});
ScalaJS.c.scm_FlatHashTable$.prototype.$classData = ScalaJS.d.scm_FlatHashTable$;
ScalaJS.n.scm_FlatHashTable = (void 0);
ScalaJS.m.scm_FlatHashTable = (function() {
  if ((!ScalaJS.n.scm_FlatHashTable)) {
    ScalaJS.n.scm_FlatHashTable = new ScalaJS.c.scm_FlatHashTable$().init___()
  };
  return ScalaJS.n.scm_FlatHashTable
});
/** @constructor */
ScalaJS.c.scm_FlatHashTable$NullSentinel$ = (function() {
  ScalaJS.c.O.call(this)
});
ScalaJS.c.scm_FlatHashTable$NullSentinel$.prototype = new ScalaJS.h.O();
ScalaJS.c.scm_FlatHashTable$NullSentinel$.prototype.constructor = ScalaJS.c.scm_FlatHashTable$NullSentinel$;
/** @constructor */
ScalaJS.h.scm_FlatHashTable$NullSentinel$ = (function() {
  /*<skip>*/
});
ScalaJS.h.scm_FlatHashTable$NullSentinel$.prototype = ScalaJS.c.scm_FlatHashTable$NullSentinel$.prototype;
ScalaJS.c.scm_FlatHashTable$NullSentinel$.prototype.toString__T = (function() {
  return "NullSentinel"
});
ScalaJS.c.scm_FlatHashTable$NullSentinel$.prototype.hashCode__I = (function() {
  return 0
});
ScalaJS.is.scm_FlatHashTable$NullSentinel$ = (function(obj) {
  return (!(!((obj && obj.$classData) && obj.$classData.ancestors.scm_FlatHashTable$NullSentinel$)))
});
ScalaJS.as.scm_FlatHashTable$NullSentinel$ = (function(obj) {
  return ((ScalaJS.is.scm_FlatHashTable$NullSentinel$(obj) || (obj === null)) ? obj : ScalaJS.throwClassCastException(obj, "scala.collection.mutable.FlatHashTable$NullSentinel$"))
});
ScalaJS.isArrayOf.scm_FlatHashTable$NullSentinel$ = (function(obj, depth) {
  return (!(!(((obj && obj.$classData) && (obj.$classData.arrayDepth === depth)) && obj.$classData.arrayBase.ancestors.scm_FlatHashTable$NullSentinel$)))
});
ScalaJS.asArrayOf.scm_FlatHashTable$NullSentinel$ = (function(obj, depth) {
  return ((ScalaJS.isArrayOf.scm_FlatHashTable$NullSentinel$(obj, depth) || (obj === null)) ? obj : ScalaJS.throwArrayCastException(obj, "Lscala.collection.mutable.FlatHashTable$NullSentinel$;", depth))
});
ScalaJS.d.scm_FlatHashTable$NullSentinel$ = new ScalaJS.ClassTypeData({
  scm_FlatHashTable$NullSentinel$: 0
}, false, "scala.collection.mutable.FlatHashTable$NullSentinel$", ScalaJS.d.O, {
  scm_FlatHashTable$NullSentinel$: 1,
  O: 1
});
ScalaJS.c.scm_FlatHashTable$NullSentinel$.prototype.$classData = ScalaJS.d.scm_FlatHashTable$NullSentinel$;
ScalaJS.n.scm_FlatHashTable$NullSentinel = (void 0);
ScalaJS.m.scm_FlatHashTable$NullSentinel = (function() {
  if ((!ScalaJS.n.scm_FlatHashTable$NullSentinel)) {
    ScalaJS.n.scm_FlatHashTable$NullSentinel = new ScalaJS.c.scm_FlatHashTable$NullSentinel$().init___()
  };
  return ScalaJS.n.scm_FlatHashTable$NullSentinel
});
/** @constructor */
ScalaJS.c.scm_GrowingBuilder = (function() {
  ScalaJS.c.O.call(this);
  this.empty$1 = null;
  this.elems$1 = null
});
ScalaJS.c.scm_GrowingBuilder.prototype = new ScalaJS.h.O();
ScalaJS.c.scm_GrowingBuilder.prototype.constructor = ScalaJS.c.scm_GrowingBuilder;
/** @constructor */
ScalaJS.h.scm_GrowingBuilder = (function() {
  /*<skip>*/
});
ScalaJS.h.scm_GrowingBuilder.prototype = ScalaJS.c.scm_GrowingBuilder.prototype;
ScalaJS.c.scm_GrowingBuilder.prototype.init___scg_Growable = (function(empty) {
  this.empty$1 = empty;
  this.elems$1 = empty;
  return this
});
ScalaJS.c.scm_GrowingBuilder.prototype.$$plus$eq__O__scm_GrowingBuilder = (function(x) {
  return (this.elems$1.$$plus$eq__O__scg_Growable(x), this)
});
ScalaJS.c.scm_GrowingBuilder.prototype.$$plus$eq__O__scg_Growable = (function(elem) {
  return this.$$plus$eq__O__scm_GrowingBuilder(elem)
});
ScalaJS.c.scm_GrowingBuilder.prototype.result__O = (function() {
  return this.elems$1
});
ScalaJS.c.scm_GrowingBuilder.prototype.sizeHintBounded__I__sc_TraversableLike__V = (function(size, boundingColl) {
  ScalaJS.i.scm_Builder$class__sizeHintBounded__scm_Builder__I__sc_TraversableLike__V(this, size, boundingColl)
});
ScalaJS.c.scm_GrowingBuilder.prototype.$$plus$eq__O__scm_Builder = (function(elem) {
  return this.$$plus$eq__O__scm_GrowingBuilder(elem)
});
ScalaJS.c.scm_GrowingBuilder.prototype.sizeHint__I__V = (function(size) {
  /*<skip>*/
});
ScalaJS.c.scm_GrowingBuilder.prototype.$$plus$plus$eq__sc_TraversableOnce__scg_Growable = (function(xs) {
  return ScalaJS.i.scg_Growable$class__$plus$plus$eq__scg_Growable__sc_TraversableOnce__scg_Growable(this, xs)
});
ScalaJS.is.scm_GrowingBuilder = (function(obj) {
  return (!(!((obj && obj.$classData) && obj.$classData.ancestors.scm_GrowingBuilder)))
});
ScalaJS.as.scm_GrowingBuilder = (function(obj) {
  return ((ScalaJS.is.scm_GrowingBuilder(obj) || (obj === null)) ? obj : ScalaJS.throwClassCastException(obj, "scala.collection.mutable.GrowingBuilder"))
});
ScalaJS.isArrayOf.scm_GrowingBuilder = (function(obj, depth) {
  return (!(!(((obj && obj.$classData) && (obj.$classData.arrayDepth === depth)) && obj.$classData.arrayBase.ancestors.scm_GrowingBuilder)))
});
ScalaJS.asArrayOf.scm_GrowingBuilder = (function(obj, depth) {
  return ((ScalaJS.isArrayOf.scm_GrowingBuilder(obj, depth) || (obj === null)) ? obj : ScalaJS.throwArrayCastException(obj, "Lscala.collection.mutable.GrowingBuilder;", depth))
});
ScalaJS.d.scm_GrowingBuilder = new ScalaJS.ClassTypeData({
  scm_GrowingBuilder: 0
}, false, "scala.collection.mutable.GrowingBuilder", ScalaJS.d.O, {
  scm_GrowingBuilder: 1,
  scm_Builder: 1,
  scg_Growable: 1,
  scg_Clearable: 1,
  O: 1
});
ScalaJS.c.scm_GrowingBuilder.prototype.$classData = ScalaJS.d.scm_GrowingBuilder;
/** @constructor */
ScalaJS.c.scm_HashTable$ = (function() {
  ScalaJS.c.O.call(this)
});
ScalaJS.c.scm_HashTable$.prototype = new ScalaJS.h.O();
ScalaJS.c.scm_HashTable$.prototype.constructor = ScalaJS.c.scm_HashTable$;
/** @constructor */
ScalaJS.h.scm_HashTable$ = (function() {
  /*<skip>*/
});
ScalaJS.h.scm_HashTable$.prototype = ScalaJS.c.scm_HashTable$.prototype;
ScalaJS.c.scm_HashTable$.prototype.powerOfTwo__I__I = (function(target) {
  var c = ((target - 1) | 0);
  c = (c | ((c >>> 1) | 0));
  c = (c | ((c >>> 2) | 0));
  c = (c | ((c >>> 4) | 0));
  c = (c | ((c >>> 8) | 0));
  c = (c | ((c >>> 16) | 0));
  return ((c + 1) | 0)
});
ScalaJS.is.scm_HashTable$ = (function(obj) {
  return (!(!((obj && obj.$classData) && obj.$classData.ancestors.scm_HashTable$)))
});
ScalaJS.as.scm_HashTable$ = (function(obj) {
  return ((ScalaJS.is.scm_HashTable$(obj) || (obj === null)) ? obj : ScalaJS.throwClassCastException(obj, "scala.collection.mutable.HashTable$"))
});
ScalaJS.isArrayOf.scm_HashTable$ = (function(obj, depth) {
  return (!(!(((obj && obj.$classData) && (obj.$classData.arrayDepth === depth)) && obj.$classData.arrayBase.ancestors.scm_HashTable$)))
});
ScalaJS.asArrayOf.scm_HashTable$ = (function(obj, depth) {
  return ((ScalaJS.isArrayOf.scm_HashTable$(obj, depth) || (obj === null)) ? obj : ScalaJS.throwArrayCastException(obj, "Lscala.collection.mutable.HashTable$;", depth))
});
ScalaJS.d.scm_HashTable$ = new ScalaJS.ClassTypeData({
  scm_HashTable$: 0
}, false, "scala.collection.mutable.HashTable$", ScalaJS.d.O, {
  scm_HashTable$: 1,
  O: 1
});
ScalaJS.c.scm_HashTable$.prototype.$classData = ScalaJS.d.scm_HashTable$;
ScalaJS.n.scm_HashTable = (void 0);
ScalaJS.m.scm_HashTable = (function() {
  if ((!ScalaJS.n.scm_HashTable)) {
    ScalaJS.n.scm_HashTable = new ScalaJS.c.scm_HashTable$().init___()
  };
  return ScalaJS.n.scm_HashTable
});
ScalaJS.is.scm_IndexedSeq = (function(obj) {
  return (!(!((obj && obj.$classData) && obj.$classData.ancestors.scm_IndexedSeq)))
});
ScalaJS.as.scm_IndexedSeq = (function(obj) {
  return ((ScalaJS.is.scm_IndexedSeq(obj) || (obj === null)) ? obj : ScalaJS.throwClassCastException(obj, "scala.collection.mutable.IndexedSeq"))
});
ScalaJS.isArrayOf.scm_IndexedSeq = (function(obj, depth) {
  return (!(!(((obj && obj.$classData) && (obj.$classData.arrayDepth === depth)) && obj.$classData.arrayBase.ancestors.scm_IndexedSeq)))
});
ScalaJS.asArrayOf.scm_IndexedSeq = (function(obj, depth) {
  return ((ScalaJS.isArrayOf.scm_IndexedSeq(obj, depth) || (obj === null)) ? obj : ScalaJS.throwArrayCastException(obj, "Lscala.collection.mutable.IndexedSeq;", depth))
});
ScalaJS.d.scm_IndexedSeq = new ScalaJS.ClassTypeData({
  scm_IndexedSeq: 0
}, true, "scala.collection.mutable.IndexedSeq", (void 0), {
  scm_IndexedSeq: 1,
  scm_IndexedSeqLike: 1,
  sc_IndexedSeq: 1,
  sc_IndexedSeqLike: 1,
  scm_Seq: 1,
  scm_SeqLike: 1,
  scm_Cloneable: 1,
  s_Cloneable: 1,
  jl_Cloneable: 1,
  sc_Seq: 1,
  sc_SeqLike: 1,
  sc_GenSeq: 1,
  sc_GenSeqLike: 1,
  s_PartialFunction: 1,
  F1: 1,
  scm_Iterable: 1,
  sc_Iterable: 1,
  sc_IterableLike: 1,
  s_Equals: 1,
  sc_GenIterable: 1,
  sc_GenIterableLike: 1,
  scm_Traversable: 1,
  s_Mutable: 1,
  sc_Traversable: 1,
  sc_GenTraversable: 1,
  scg_GenericTraversableTemplate: 1,
  sc_TraversableLike: 1,
  sc_GenTraversableLike: 1,
  sc_Parallelizable: 1,
  sc_TraversableOnce: 1,
  sc_GenTraversableOnce: 1,
  scg_FilterMonadic: 1,
  scg_HasNewBuilder: 1,
  O: 1
});
/** @constructor */
ScalaJS.c.scm_LazyBuilder = (function() {
  ScalaJS.c.O.call(this);
  this.parts$1 = null
});
ScalaJS.c.scm_LazyBuilder.prototype = new ScalaJS.h.O();
ScalaJS.c.scm_LazyBuilder.prototype.constructor = ScalaJS.c.scm_LazyBuilder;
/** @constructor */
ScalaJS.h.scm_LazyBuilder = (function() {
  /*<skip>*/
});
ScalaJS.h.scm_LazyBuilder.prototype = ScalaJS.c.scm_LazyBuilder.prototype;
ScalaJS.c.scm_LazyBuilder.prototype.init___ = (function() {
  this.parts$1 = new ScalaJS.c.scm_ListBuffer().init___();
  return this
});
ScalaJS.c.scm_LazyBuilder.prototype.$$plus$plus$eq__sc_TraversableOnce__scm_LazyBuilder = (function(xs) {
  return (this.parts$1.$$plus$eq__O__scm_ListBuffer(xs), this)
});
ScalaJS.c.scm_LazyBuilder.prototype.$$plus$eq__O__scg_Growable = (function(elem) {
  return this.$$plus$eq__O__scm_LazyBuilder(elem)
});
ScalaJS.c.scm_LazyBuilder.prototype.$$plus$eq__O__scm_LazyBuilder = (function(x) {
  var jsx$1 = this.parts$1;
  ScalaJS.m.sci_List();
  var xs = new ScalaJS.c.sjs_js_WrappedArray().init___sjs_js_Array([x]);
  var this$2 = ScalaJS.m.sci_List();
  var cbf = this$2.ReusableCBFInstance$2;
  jsx$1.$$plus$eq__O__scm_ListBuffer(ScalaJS.as.sci_List(ScalaJS.i.sc_TraversableLike$class__to__sc_TraversableLike__scg_CanBuildFrom__O(xs, cbf)));
  return this
});
ScalaJS.c.scm_LazyBuilder.prototype.sizeHintBounded__I__sc_TraversableLike__V = (function(size, boundingColl) {
  ScalaJS.i.scm_Builder$class__sizeHintBounded__scm_Builder__I__sc_TraversableLike__V(this, size, boundingColl)
});
ScalaJS.c.scm_LazyBuilder.prototype.$$plus$eq__O__scm_Builder = (function(elem) {
  return this.$$plus$eq__O__scm_LazyBuilder(elem)
});
ScalaJS.c.scm_LazyBuilder.prototype.sizeHint__I__V = (function(size) {
  /*<skip>*/
});
ScalaJS.c.scm_LazyBuilder.prototype.$$plus$plus$eq__sc_TraversableOnce__scg_Growable = (function(xs) {
  return this.$$plus$plus$eq__sc_TraversableOnce__scm_LazyBuilder(xs)
});
ScalaJS.is.scm_LazyBuilder = (function(obj) {
  return (!(!((obj && obj.$classData) && obj.$classData.ancestors.scm_LazyBuilder)))
});
ScalaJS.as.scm_LazyBuilder = (function(obj) {
  return ((ScalaJS.is.scm_LazyBuilder(obj) || (obj === null)) ? obj : ScalaJS.throwClassCastException(obj, "scala.collection.mutable.LazyBuilder"))
});
ScalaJS.isArrayOf.scm_LazyBuilder = (function(obj, depth) {
  return (!(!(((obj && obj.$classData) && (obj.$classData.arrayDepth === depth)) && obj.$classData.arrayBase.ancestors.scm_LazyBuilder)))
});
ScalaJS.asArrayOf.scm_LazyBuilder = (function(obj, depth) {
  return ((ScalaJS.isArrayOf.scm_LazyBuilder(obj, depth) || (obj === null)) ? obj : ScalaJS.throwArrayCastException(obj, "Lscala.collection.mutable.LazyBuilder;", depth))
});
ScalaJS.d.scm_LazyBuilder = new ScalaJS.ClassTypeData({
  scm_LazyBuilder: 0
}, false, "scala.collection.mutable.LazyBuilder", ScalaJS.d.O, {
  scm_LazyBuilder: 1,
  scm_Builder: 1,
  scg_Growable: 1,
  scg_Clearable: 1,
  O: 1
});
ScalaJS.c.scm_LazyBuilder.prototype.$classData = ScalaJS.d.scm_LazyBuilder;
ScalaJS.is.scm_LinkedListLike = (function(obj) {
  return (!(!((obj && obj.$classData) && obj.$classData.ancestors.scm_LinkedListLike)))
});
ScalaJS.as.scm_LinkedListLike = (function(obj) {
  return ((ScalaJS.is.scm_LinkedListLike(obj) || (obj === null)) ? obj : ScalaJS.throwClassCastException(obj, "scala.collection.mutable.LinkedListLike"))
});
Sc