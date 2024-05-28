function incrementString(str) {
  let i = str.length - 1;
  while (i >= 0) {
    if (str[i] === "z") {
      str = str.substring(0, i) + "a" + str.substring(i + 1);
      i--;
    } else {
      str =
        str.substring(0, i) +
        String.fromCharCode(str.charCodeAt(i) + 1) +
        str.substring(i + 1);
      return str;
    }
  }
  return "a" + str;
}

function getUniqueName(existingStrings = []) {
  let newString = "a";
  while (existingStrings.includes(newString)) {
    newString = incrementString(newString);
  }
  return newString;
}

export default getUniqueName;
