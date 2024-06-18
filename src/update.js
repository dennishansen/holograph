import getUniqueName from "./getUniqueName";
import castInput from "./castInput";

const basePropsKeys = [
  "parentId",
  "id",
  "typeName",
  "type",
  "x",
  "y",
  "rotation",
  "index",
  "opacity",
  "isLocked",
];

const errorString = "invalid-code-kSfd73";

const getValue = (obj, path) => {
  return path.split(".").reduce((acc, key) => acc && acc[key], obj);
};

const isInQuotes = (str) =>
  str.length > 1 && str.startsWith('"') && str.endsWith('"');
const isInSingleQuotes = (str) =>
  str.length > 1 && str.startsWith("'") && str.endsWith("'");

const truncateDecimals = (value) => {
  if (typeof value === "number") {
    value = parseFloat(Math.round(value * 100) / 100);
  }
  return value;
};

const getValueFromShape = (arrowText, shape, result) => {
  if (isInSingleQuotes(arrowText)) {
    // Prop
    return getPropValue(arrowText, shape);
  } else if (shape.props.geo === "ellipse") {
    // Text
    return shape.props.text;
  } else if (shape.props.geo === "rectangle") {
    // Return
    return result;
  }
  return undefined;
};

const getPropValue = (arrowText, currentShape) => {
  const propKey = arrowText.slice(1, -1);
  const isBaseProp = basePropsKeys.includes(propKey);
  const propValuePath = isBaseProp ? propKey : "props." + propKey;
  const propValue = getValue(currentShape, propValuePath);

  if (propValuePath === "props.text") {
    return propValue;
  } else {
    return JSON.stringify(truncateDecimals(propValue));
  }
};

const splitProps = (newProps) => {
  let baseProps = {};
  let customProps = {};
  Object.entries(newProps).forEach(([key, value]) => {
    if (basePropsKeys.includes(key)) {
      baseProps[key] = value;
    } else {
      customProps[key] = value;
    }
  });
  return { baseProps, customProps };
};

const getObjects = (records, currentId) => {
  let inputArrows = [];
  let outputArrows = [];
  let currentShape;
  records.forEach((record) => {
    const { id, type, typeName } = record;
    if (typeName === "shape") {
      if (id === currentId) {
        currentShape = record;
      }
      if (type === "arrow") {
        if (currentId === record.props.end.boundShapeId) {
          inputArrows.push(record);
        }
        if (currentId === record.props.start.boundShapeId) {
          outputArrows.push(record);
        }
      }
    }
  });

  return { currentShape, outputArrows, inputArrows };
};

const update = (id, editor) => {
  const records = editor.store.allRecords();
  const { currentShape, outputArrows, inputArrows } = getObjects(records, id);
  if (!currentShape) return;
  const { props, meta = {} } = currentShape;
  let code = meta.code;
  let newCode;
  let codeHasChanged = false;
  let result = meta.result;
  let newResult;
  let resultHasChanged = false;
  let lastArgUpdate = meta.lastArgUpdate;

  // Log red shapes
  let debug = false;
  // if (currentShape?.props?.color === "red") debug = true;
  const log = (...args) => debug && console.log(...args);
  log("-------------------------------");
  log("update ", currentShape?.props?.text, currentShape?.props?.geo, id);

  // Try to rerun propagator function if its a rectangle
  if (props?.geo === "rectangle") {
    const nextArgUpdate = meta.nextArgUpdate;
    const argsHaveChanged = nextArgUpdate !== lastArgUpdate;
    const neverRan = !("result" in meta);

    // Check code and update code
    newCode = props.text;
    codeHasChanged = code !== newCode;
    code = newCode;

    // Rerun function if args have changed or if its never ran
    if (argsHaveChanged || codeHasChanged || neverRan) {
      log("argsHaveChanged", argsHaveChanged);
      log("codeHasChanged", codeHasChanged);
      log("neverRan", neverRan);
      // Get new args
      let argNames = [];
      let argValues = [];
      inputArrows.forEach((arrow) => {
        const { text: arrowText, start } = arrow.props;
        const shape = records.find(({ id }) => id === start.boundShapeId);
        if (!shape) return;
        const { meta = {} } = shape;
        const source = getValueFromShape(arrowText, shape, meta.result);
        let name;
        if (isInSingleQuotes(arrowText)) {
          // Allow props to come in as arguments
          name = arrowText.slice(1, -1);
        } else if (arrowText !== "") {
          name = arrowText;
        } else {
          // Give anonymous args a unique name
          name = getUniqueName(argNames);
        }
        argNames.push(name);
        argValues.push(castInput(source));
      });
      let functionBody = code.includes("return") ? code : `return ${code}`;

      // Run function
      let newResultRaw;
      try {
        log("argNames", argNames);
        log("argValues", argValues);
        log("functionBody", functionBody);
        const func = new Function(argNames, functionBody);
        newResultRaw = func(...argValues);
      } catch (error) {
        // log(error);
      }

      log("newResultRaw", newResultRaw);

      // Update the result if it is valid
      if (newResultRaw !== undefined) {
        let newResultString = JSON.stringify(truncateDecimals(newResultRaw));
        if (typeof newResultString === "string") {
          // Valid result
          if (isInQuotes(newResultString)) {
            newResultString = newResultString.slice(1, -1);
          }
          newResult = newResultString;
          log("newResult", newResult);
        }
      } else {
        // Invalid result
        newResult = errorString;
      }
      resultHasChanged = result !== newResult;
    } else {
      // Otherwise send through old result
      newResult = result;
    }
  }

  // Collect downstream changes
  let downstreamShapes = [];
  outputArrows.forEach((arrow) => {
    const { text: arrowText, end } = arrow.props;
    const endShape = records.find(({ id }) => id === end.boundShapeId);
    if (!endShape) return;
    const { meta = {} } = endShape;
    let { nextArgUpdate } = meta;

    // Get source value
    let source = getValueFromShape(arrowText, currentShape, newResult);

    // Set to desintation
    let newProps = {};
    if (source === undefined || source === errorString) {
      // Error
    } else if (isInQuotes(arrowText)) {
      // Prop
      const propName = arrowText.slice(1, -1);
      //// Allow all text to come in as a string
      const value = propName === "text" ? source : castInput(source);
      newProps[propName] = value;
    } else if (endShape.props.geo === "rectangle") {
      // Arg
      nextArgUpdate = Date.now(); // Notify node to recompute
    } else if (
      source !== undefined &&
      (!arrowText || isInSingleQuotes(arrowText))
    ) {
      // Text
      newProps.text = source;
    }

    log("source", source);
    log("newProps", newProps);
    log("nextArgUpdate", nextArgUpdate);

    const { baseProps, customProps } = splitProps(newProps);

    const nextArgUpdateObject = nextArgUpdate ? { nextArgUpdate } : {};
    const newMeta = { ...nextArgUpdateObject };
    const metaObject = Object.keys(newMeta).length > 0 ? { meta: newMeta } : {};
    const propsObject =
      Object.keys(customProps).length > 0 ? { props: customProps } : {};

    let numberBaseProps = Object.keys(baseProps).length;
    let numberProps = Object.keys(propsObject).length;
    let numberMeta = Object.keys(metaObject).length;
    if (numberBaseProps + numberProps + numberMeta > 0) {
      downstreamShapes.push({
        id: endShape.id,
        ...baseProps,
        ...propsObject,
        ...metaObject,
      });
    }
  });

  // Update current shape and Propagate to downstream shapes
  const resultObject =
    resultHasChanged && newResult !== undefined ? { result: newResult } : {};
  const codeObject =
    codeHasChanged && newCode !== undefined ? { code: newCode } : {};
  const newMeta = { ...codeObject, ...resultObject };
  let newCurrentShape;
  if (Object.keys(newMeta).length > 0) {
    newCurrentShape = { id, meta: newMeta };
  }

  log("newCurrentShape", newCurrentShape);
  log("downstreamShapes", downstreamShapes);

  let newShapes = downstreamShapes;
  if (newCurrentShape) {
    newShapes = [newCurrentShape, ...downstreamShapes];
  }
  if (newShapes.length > 0) {
    editor.updateShapes(newShapes);
  }
};

export default update;
