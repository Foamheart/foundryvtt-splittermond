export function checkValueRange(value, min, max) {
    // return value < min ? min : (value > max ? max : value);
    return Math.min(Math.max(value, min), max);
  }
  
export function modifikatorString(mod) {
    return mod == 0 ? '' : ((mod < 0 ? '' : '+') + mod);
  }
