import "./index.css";
import "./App.css";

import _ from "lodash";
import { useCallback, useEffect, useState, useRef } from "react";
import { Tldraw } from "tldraw";
import castInput from "./castInput";

// TODO: fractions lol

// TODO: Propagate when arrows are made or when they are edited

export default function StoreEventsExample() {
  const [editor, setEditor] = useState();
  const cellCache = useRef();

  const getCellValues = (editor) =>
    editor.store.allRecords().reduce((acc, record) => {
      if (record.type === "geo" && record?.props?.geo === "ellipse") {
        acc[record.id] = record.props.text;
      }
      return acc;
    }, {});

  const setAppToState = useCallback((editor) => {
    setEditor(editor);
    cellCache.current = getCellValues(editor);
  }, []);

  const propagate = (id) => {
    let propagators = [];
    let arrows = [];
    const cells = [];
    let cellValues = getCellValues(editor);

    editor.store.allRecords().forEach((record) => {
      const { type, typeName, props } = record;
      if (typeName === "shape")
        if (type === "arrow") {
          arrows.push(record);
        } else if (type === "geo") {
          // eslint-disable-next-line react/prop-types
          const { geo } = props;
          if (geo === "rectangle") {
            propagators.push(record);
          } else if (geo === "ellipse") {
            cells.push(record);
          }
        }
    });

    // Get input and output cells
    let inputCells = [];
    let outputCells = [];

    arrows.forEach((arrow) => {
      const { start, end, text } = arrow.props;
      if (end.boundShapeId === id) {
        const cellId = start.boundShapeId;
        let inputCell = cells.find((cell) => cell.id === cellId);
        let modifiedInputCell = { ...inputCell, variableName: text };
        inputCells.push(modifiedInputCell);
      } else if (start.boundShapeId === id) {
        const cellId = end.boundShapeId;
        let outputCell = cells.find((cell) => cell.id === cellId);
        let modifiedOutputCell = { ...outputCell, variableName: text };
        outputCells.push(modifiedOutputCell);
      }
    });

    let newValues = {};
    inputCells.forEach((inputCell) => {
      const { props, variableName } = inputCell;
      // eslint-disable-next-line react/prop-types
      newValues[variableName] = props.text;
    });

    const argumentNames = Object.keys(newValues);
    const argumentValues = Object.values(newValues).map((value) =>
      castInput(value)
    );
    let propagator = propagators.find((prop) => prop.id === id);
    if (!propagator) return; // Unattached arrow
    let functionBody = propagator.props.text;
    if (!functionBody.includes("return")) {
      functionBody = `return ${functionBody}`;
    }
    let result;
    try {
      const func = new Function(argumentNames, functionBody);
      result = func(...argumentValues);
    } catch (error) {
      // console.error(error);
      return;
    }

    // console.log("result", result);

    if (result === undefined) return;

    // Queue up updates to cells
    outputCells.forEach((outputCell) => {
      const { id } = outputCell;

      if (typeof result === "number") {
        result = parseFloat(result.toFixed(1));
      }

      // Remove quotes or double quotes if they exist
      let resultString = JSON.stringify(result);
      if (resultString.startsWith('"') && resultString.endsWith('"')) {
        resultString = resultString.slice(1, -1); // string
      }

      // Update cell if the result is different
      // eslint-disable-next-line react/prop-types
      if (resultString !== cellValues[id]) {
        editor.store.update(outputCell.id, (record) => ({
          id,
          ...record,
          props: { ...record.props, text: resultString },
        }));
      }
    });
  };

  useEffect(() => {
    if (!editor) return;

    //[1]
    const handleChangeEvent = (change) => {
      // Added
      for (const record of Object.values(change.changes.added)) {
        if (record.typeName === "shape") {
          // console.log(`created shape (${JSON.stringify(record)})\n`);
          // console.log("created shape", record);
          // propagate();
        }
      }

      // Updated
      for (const [from, to] of Object.values(change.changes.updated)) {
        if (from.id.startsWith("shape") && to.id.startsWith("shape")) {
          let diff = _.reduce(
            from,
            (result, value, key) =>
              _.isEqual(value, to[key])
                ? result
                : result.concat([key, to[key]]),
            []
          );
          if (diff?.[0] === "props") {
            diff = _.reduce(
              from.props,
              (result, value, key) =>
                _.isEqual(value, to.props[key])
                  ? result
                  : result.concat([key, to.props[key]]),
              []
            );
          }
          // console.log(`updated shape (${JSON.stringify(diff)})\n`);
          if (to?.props?.geo === "ellipse") {
            const propagatorIdsToUpdate = editor.store
              .allRecords()
              .filter(
                (record) =>
                  record.type === "arrow" &&
                  record.props.start.boundShapeId === to.id
              )
              .map((record) => record.props.end.boundShapeId);
            // console.log("propagatorIdsToUpdate", propagatorIdsToUpdate);
            propagatorIdsToUpdate.forEach((id) => {
              propagate(id);
            });
          } else if (to?.props?.geo === "rectangle") {
            // console.log("updated rectangle", to);
            propagate(to.id);
          }
          // console.log("from", from);
          // console.log("to", to);
          // propagate();
        }
      }

      // Removed
      for (const record of Object.values(change.changes.removed)) {
        if (record.typeName === "shape") {
          // console.log(`deleted shape (${record.type})\n`);
          // console.log("deleted shape", record);
          // console.log("all records", editor.store.allRecords());
          // propagate();
        }
      }
    };

    // [2]
    const cleanupFunction = editor.store.listen(handleChangeEvent, {
      source: "user",
      scope: "all",
    });

    return () => {
      cleanupFunction();
    };
  }, [editor]);

  return (
    <div style={{ display: "flex", width: "100%" }}>
      <Tldraw onMount={setAppToState} persistenceKey="holograph-1" />
    </div>
  );
}
