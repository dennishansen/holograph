import getUniqueName from "./getUniqueName";
import castInput from "./castInput";
import _ from "lodash";

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

const wait = async (arg, delay) => {
  return new Promise((resolve) => setTimeout(() => resolve(arg), delay));
};

const errorString = "error-3n5al";

const propTypes = {
  x: "number",
  y: "number",
  rotation: "number",
  isLocked: "boolean",
  opacity: "number",
  id: "string",
  type: "string",
  w: "number",
  h: "number",
  geo: "string",
  color: "string",
  labelColor: "string",
  fill: "string",
  dash: "string",
  size: "string",
  font: "string",
  text: "string",
  align: "string",
  verticalAlign: "string",
  growY: "number",
  url: "string",
  parentId: "string",
  index: "string",
  typeName: "string",
  points: "object",
};

const colors = [
  "black",
  "grey",
  "light-violet",
  "violet",
  "blue",
  "light-blue",
  "yellow",
  "orange",
  "green",
  "light-green",
  "light-red",
  "red",
  "white",
];

const getValue = (obj, path) => {
  return path.split(".").reduce((acc, key) => acc && acc[key], obj);
};

const isInQuotes = (str) => {
  return str.length > 1 && str.startsWith('"') && str.endsWith('"');
};

const isInSingleQuotes = (str) => {
  return str.length > 1 && str.startsWith("'") && str.endsWith("'");
};

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

const getPropValue = (arrowText, shape) => {
  if (arrowText === "'click'") {
    if (shape?.meta?.click) {
      return JSON.stringify(shape.meta.click);
    }
  } else if (arrowText === "'self'") {
    return JSON.stringify(shape);
  } else {
    const propKey = arrowText.slice(1, -1);
    const isBaseProp = basePropsKeys.includes(propKey);
    const propValuePath = isBaseProp ? propKey : "props." + propKey;
    const propValue = getValue(shape, propValuePath);

    if (propValuePath === "props.text") {
      return propValue;
    } else {
      return JSON.stringify(truncateDecimals(propValue));
    }
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

const setNewProps = (arrowText, source, newProps) => {
  // Prop
  const propName = arrowText.slice(1, -1);
  let value;
  const propType = propTypes[propName];
  if (propType === "string") {
    if (source.length > 1 && source.startsWith('"') && source.endsWith('"')) {
      // Remove quotes if they exist (TODO: Cleanup)
      source = source.slice(1, -1);
    }
    value = source; // Allow all text to come in as a string
  } else if (source === "") {
    // Do nothing if its an empty string
  } else if (propType === "number") {
    value = Number(source);
  } else if (propType === "boolean") {
    value = Boolean(castInput(source)); //  Enable dynamic JS typing
  } else if (propType === "object") {
    value = castInput(source);
  } else {
    value = castInput(source); // Catch all
  }

  // Throw any prop value errors
  if (propName === "color" && value !== undefined && !colors.includes(value)) {
    // Alert showing the valid colors
    document.toasts.addToast({
      id: "bad-color",
      title: "Invalid Color",
      description: "Please choose from: " + colors.join(", "),
      severity: "error",
    });
    value = undefined;
  }

  // newProps = setNestedProperty(newProps, propName, value);
  if (value !== undefined) {
    newProps[propName] = value;
  }
  return newProps;
};

const sizeMap = {
  s: {
    offset: 4,
    borderRadius: 4,
  },
  m: {
    offset: 6,
    borderRadius: 6,
  },
  l: {
    offset: 7,
    borderRadius: 8,
  },
  xl: {
    offset: 10,
    borderRadius: 12,
  },
};

const highlightShape = (currentShape, propagationId) => {
  const {
    id,
    props: { geo, size },
  } = currentShape;
  const svg = document.getElementById(id);
  if (!svg) return;
  svg.classList.add("is-propagating-" + propagationId);
  const { offset, borderRadius } = sizeMap[size];
  if (geo === "rectangle") {
    svg.style.outlineOffset = `${offset}px`;
    svg.style.borderRadius = `${borderRadius}px`;
  } else if (geo === "ellipse") {
    svg.style.outlineOffset = `${offset}px`;
    svg.style.borderRadius = "50%";
  }
};

const unhightlightShapes = (propagationId) => {
  const classId = "is-propagating-" + propagationId;
  const propagatingShapes = document.getElementsByClassName(classId);
  while (propagatingShapes.length) {
    propagatingShapes[0].classList.remove(classId);
  }
};

const update = async (id, editor) => {
  const currentShape = editor.getShape(id);

  if (!currentShape) return;

  const propagationId = performance.now().toString().replace(".", "");
  const debugPropagation = document.debugPropagation;
  debugPropagation && highlightShape(currentShape, propagationId);

  const arrows = editor.getArrowsBoundTo(id);
  let inputArrows = [];
  let outputArrows = [];
  arrows.forEach(({ arrowId, handleId }) => {
    if (handleId === "start") {
      outputArrows.push(editor.getShape(arrowId));
    } else {
      inputArrows.push(editor.getShape(arrowId));
    }
  });

  const { props, meta = {} } = currentShape;
  let code = meta.code;
  let newCode;
  let codeHasChanged = false;
  let result = meta.result;
  let newResult;
  let resultHasChanged = false;
  let lastArgUpdate = meta.lastArgUpdate;
  let nextClick = meta.nextClick;
  let click = meta.click;
  let errorColorCache = meta.errorColorCache || "none";
  let nextErrorColorCache;
  let errorColorCacheHasChanged = false;
  let nextColor;

  // Log red shapes
  let debug = false;
  if (currentShape?.props?.fill === "pattern" && import.meta.env.DEV)
    debug = true;
  const log = (...args) => debug && console.log(...args);
  log("-------------------------------");
  log("update ", currentShape?.props?.text, currentShape?.props?.geo, id);

  // Try to rerun propagator function if its a rectangle
  if (props?.geo === "rectangle") {
    const nextArgUpdate = meta.nextArgUpdate;
    // TODO: THis is always true i think
    const argsHaveChanged = nextArgUpdate !== lastArgUpdate;
    const neverRan = !("result" in meta);

    // Check code and update code
    newCode = props.text;
    codeHasChanged = code !== newCode;
    code = newCode;
    let error;

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
        const isSettingProp = isInQuotes(arrowText);
        if (start.boundShapeId && !isSettingProp) {
          const shape = editor.getShape(start.boundShapeId);
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
        }
      });
      let functionBody = code.includes("return") ? code : `return ${code}`;
      // Run function
      let newResultRaw;

      try {
        log("argNames", argNames);
        log("argValues", argValues);
        log("functionBody", functionBody);
        argNames.push("fetch");
        argValues.push(fetch);
        argNames.push("wait");
        argValues.push(wait);
        argNames.push("editor");
        argValues.push(editor);
        // argNames.push("currentShape");
        // argValues.push(currentShape);
        const AsyncFunction = Object.getPrototypeOf(
          async function () {}
        ).constructor;
        const func = new AsyncFunction(argNames, functionBody);
        newResultRaw = await func(...argValues);
      } catch (newError) {
        error = newError;
        log("error", error);
      }

      log("newResultRaw", newResultRaw);

      // Update the result if it is valid
      if (newResultRaw !== undefined) {
        let newResultString = JSON.stringify(truncateDecimals(newResultRaw));
        if (typeof newResultString === "string") {
          // Valid result
          newResult = newResultString;
          log("newResult", newResult);
        }
      }

      // Assign error string if there is an error
      if (error) {
        newResult = errorString;
      }

      resultHasChanged = result !== newResult;

      // Handle any function errors
      if (error) {
        log("the error is: ", error);
        // Set error if it isn't already set
        if (errorColorCache === "none") {
          nextColor = "red";
          nextErrorColorCache = props.color;
        }
        // Set results to error code
      } else {
        // Succeeded. Set color if there was an error last run
        if (errorColorCache !== "none") {
          // console.log("errorColorCache", errorColorCache);
          nextColor = errorColorCache;
          nextErrorColorCache = "none";
        }
      }

      // Detect if color cache has changed
      if (nextErrorColorCache !== errorColorCache) {
        errorColorCacheHasChanged = true;
      }
    } else {
      // Otherwise send through old result
      newResult = result;
    }
  }

  // Check if there's a click fired
  const firstClick = !click && nextClick !== undefined;
  const clickFired = !_.isEqual(click, nextClick) || firstClick;
  if (clickFired) {
    click = nextClick;
  } else {
    // Clicks should only propagate when clicked
    outputArrows = outputArrows.filter(
      (arrow) => arrow.props.text !== "'click'"
    );
  }

  // Collect downstream changes
  let downstreamShapes = [];
  outputArrows.forEach((arrow) => {
    const { text: arrowText, end, dash } = arrow.props;
    let endShape;
    try {
      endShape = editor.getShape(end.boundShapeId);
    } catch (e) {
      // console.log("error", e);
    }
    if (dash !== "dashed" && endShape) {
      // let { nextArgUpdate } = meta;
      let nextArgUpdate;

      // Get source value
      let source = getValueFromShape(arrowText, currentShape, newResult, click);

      // Set to desintation
      let newProps = {};
      if (source === undefined || source === errorString) {
        // No result or code error
      } else if (isInQuotes(arrowText)) {
        // Prop
        newProps = setNewProps(arrowText, source, newProps);
      } else if (endShape.props.geo === "rectangle") {
        // Arg
        log("nextArgUpdate getting updated");
        nextArgUpdate = Date.now(); // Notify node to recompute
      } else if (
        source !== undefined &&
        (!arrowText || isInSingleQuotes(arrowText))
      ) {
        // Text
        if (isInQuotes(source)) {
          // Strip quotes when appearing as text
          source = source.slice(1, -1);
        }
        newProps.text = source;
      }

      log("source", source);
      log("newProps", newProps);
      log("nextArgUpdate", nextArgUpdate);

      const { baseProps, customProps } = splitProps(newProps);

      const nextArgUpdateObject = nextArgUpdate ? { nextArgUpdate } : {};
      const newMeta = {
        ...nextArgUpdateObject,
        // Tell tldraw handler not to fire PERFORMANCE RELEASE
        // lastUpdated: Date.now(),
      };
      const metaObject =
        Object.keys(newMeta).length > 0 ? { meta: newMeta } : {}; // TODO: delete
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
    }
  });

  // Update current shape and Propagate to downstream shapes
  const resultObject =
    resultHasChanged && newResult !== undefined ? { result: newResult } : {};
  const codeObject =
    codeHasChanged && newCode !== undefined ? { code: newCode } : {};
  const clickObject = clickFired ? { click } : {};
  const errorColorCacheObject = errorColorCacheHasChanged
    ? { errorColorCache: nextErrorColorCache }
    : {};
  const newMeta = {
    ...codeObject,
    ...resultObject,
    ...clickObject,
    ...errorColorCacheObject,
  };
  const newProps = nextColor ? { color: nextColor } : {};
  let newCurrentShape;
  let areNewMeta = Object.keys(newMeta).length > 0;
  let newMetaObject = areNewMeta ? { meta: newMeta } : {};
  let areNewProps = Object.keys(newProps).length > 0;
  let newPropsObject = areNewProps ? { props: newProps } : {};
  if (areNewMeta || areNewProps) {
    newCurrentShape = { id, ...newMetaObject, ...newPropsObject };
  }

  log("newCurrentShape", newCurrentShape);
  log("downstreamShapes", downstreamShapes);

  let newShapes = downstreamShapes;
  if (newCurrentShape) {
    newShapes = [newCurrentShape, ...downstreamShapes];
  }

  if (debugPropagation) {
    await wait(null, 1000);
  }

  if (newShapes.length > 0) {
    editor.updateShapes(newShapes);
  }

  unhightlightShapes(propagationId);
};

export default update;
