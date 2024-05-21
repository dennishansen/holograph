import "./index.css";
import "./App.css";

import _ from "lodash";
import { useCallback, useEffect, useState, useRef } from "react";
import { Tldraw } from "tldraw";

// TODO: fractions lol

function popRandonItem(set) {
  const array = Array.from(set);
  const randomIndex = Math.floor(Math.random() * array.length);
  const randomItem = array[randomIndex];
  set.delete(randomItem);
  return randomItem;
}

let nUpdates = 0;

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

  const propagate = () => {
    let propagators = [];
    let arrows = [];
    const cells = [];
    let cachedCellValues = JSON.parse(JSON.stringify(cellCache.current));
    let oldCellValues = getCellValues(editor);
    let newCellValues = oldCellValues;

    console.log("cachedCellValues", cachedCellValues);
    console.log("oldCellValues", oldCellValues);
    console.log("newCellValues", newCellValues);

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

    console.log("propagators", propagators);
    console.log("cells", cells);

    let propagatorStack = new Set(propagators.map((prop) => prop.id));
    let iterations = 0;

    // Loop through all propagators
    while (propagatorStack.size > 0) {
      console.log("propagatorStack", propagatorStack);
      iterations++;
      if (iterations > 100) {
        console.log("Over 100 propagators iterations. Breaking");
        propagatorStack = new Set();
        break;
      }

      // }
      // get any propagator
      let id = popRandonItem(propagatorStack);
      let inputCells = [];
      let outputCells = [];

      // console.log("propagator", propagator);

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

      // console.log("inputCells", inputCells);
      // console.log("outputCells", outputCells);

      // Get old and new values
      let oldValues = {};
      let newValues = {};
      inputCells.forEach((inputCell) => {
        const { id, props, variableName } = inputCell;
        // eslint-disable-next-line react/prop-types
        newValues[variableName] = props.text;
        oldValues[variableName] = oldCellValues[id];
      });

      // Recompute if any values have changed
      if (!_.isEqual(oldValues, newValues)) {
        const argumentNames = Object.keys(newValues);
        const argumentValues = Object.values(newValues).map((value) =>
          Number(value)
        );
        let propagator = propagators.find((prop) => prop.id === id);
        let functionBody = propagator.props.text;
        if (!functionBody.includes("return")) {
          functionBody = `return ${functionBody}`;
        }
        const func = new Function(argumentNames, functionBody);
        const result = func(...argumentValues);

        // Queue up updates to cells
        outputCells.forEach((outputCell) => {
          const { id } = outputCell;

          const resultString = String(result);
          // eslint-disable-next-line react/prop-types
          if (resultString !== newCellValues[id]) {
            console.log("update id:", id);
            console.log("update from: ", newCellValues[id]);
            console.log("update to: ", resultString);
            newCellValues[id] = resultString;

            // Pop affected propagators back into the queue
            arrows.forEach((arrow) => {
              const { start, end } = arrow.props;
              if (start.boundShapeId === outputCell.id) {
                propagatorStack.add(end.boundShapeId);
              }
            });
          }
        });
      }
    }

    nUpdates++;
    if (nUpdates > 10) {
      console.log("Over 10 updates. Breaking");
      return;
    }

    const updates = Object.keys(newCellValues).reduce((acc, id) => {
      if (oldCellValues[id] !== newCellValues[id]) {
        acc[id] = newCellValues[id];
      }
      return acc;
    }, {});

    // Update cell cache
    cellCache.current = newCellValues;

    console.log("updates", updates);

    const updateKeys = Object.keys(updates);
    updateKeys.forEach((id) => {
      console.log("updated cell", updates[id]);
      // Update cells in UI after cache update
      editor.store.update(id, (record) => ({
        id,
        ...record,
        props: { ...record.props, text: updates[id] },
      }));
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
          propagate();
        }
      }

      // Updated
      for (const [from, to] of Object.values(change.changes.updated)) {
        // console.log("updated shape", change.changes.updated);
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
          // console.log("updated shape", diff);
          // console.log("from", from);
          // console.log("to", to);
          propagate();
        }
      }

      // Removed
      for (const record of Object.values(change.changes.removed)) {
        if (record.typeName === "shape") {
          // console.log(`deleted shape (${record.type})\n`);
          // console.log("deleted shape", record);
          // console.log("all records", editor.store.allRecords());
          propagate();
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
