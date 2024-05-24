function deepDiff(obj1, obj2, parentKey = "", result = {}) {
  for (let key in obj2) {
    const fullKey = parentKey ? `${parentKey}.${key}` : key;
    if (obj1[key] === undefined) {
      result[fullKey] = obj2[key];
    } else if (typeof obj2[key] === "object" && obj2[key] !== null) {
      if (typeof obj1[key] !== "object" || obj1[key] === null) {
        result[fullKey] = obj2[key];
      } else {
        deepDiff(obj1[key], obj2[key], fullKey, result);
      }
    } else if (obj1[key] !== obj2[key]) {
      result[fullKey] = obj2[key];
    }
  }
  return result;
}

export default deepDiff;
