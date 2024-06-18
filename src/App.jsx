import "./index.css";
import "./App.css";

import { useCallback, useEffect, useState } from "react";
import { Tldraw } from "tldraw";
import deepDiff from "./deepDiff";
import CustomHelpMenu from "./CustomHelpMenu";
import CustomMainMenu from "./CustomMainMenu";
import SharePanel from "./SharePanel";
import { Analytics } from "@vercel/analytics/react";
import update from "./update";

const ignoredKeys = ["meta.result", "meta.code"];

export default function StoreEventsExample() {
  const [editor, setEditor] = useState();

  const getIsFirstVisit = () => {
    if (!localStorage.getItem("visited")) {
      localStorage.setItem("visited", "true");
      return true;
    } else {
      return false;
    }
  };

  const setAppToState = useCallback((editor) => {
    setEditor(editor);
  }, []);

  // Load tutorial to current page if its empty and its the first load
  useEffect(() => {
    if (!editor) return;
    const allRecords = editor.store.allRecords();
    const canvasRecords = allRecords.filter(
      ({ id }) => id.startsWith("shape") || id.startsWith("asset")
    );
    if (canvasRecords.length === 0 && getIsFirstVisit()) {
      fetch("/tutorial.json")
        .then((response) => {
          if (response.ok) return response.json();
        })
        .then((tutorial) => {
          editor.createAssets(tutorial.assets);
          editor.createShapes(tutorial.shapes);
        });
      // .catch((error) => console.error(error));
    }
  }, [editor]);

  useEffect(() => {
    if (!editor) return;

    //[1]
    const handleChangeEvent = (change) => {
      // Added
      for (const record of Object.values(change.changes.added)) {
        if (record.typeName === "shape") {
          // console.log(`created shape (${JSON.stringify(record)})\n`);
        }
      }

      // Updated
      for (const [from, to] of Object.values(change.changes.updated)) {
        if (from.id.startsWith("shape") && to.id.startsWith("shape")) {
          let diff = deepDiff(from, to);
          // console.log("diff: ", diff);

          if (Object.keys(diff).every((key) => ignoredKeys.includes(key))) {
            // Ignore changes that should not trigger a re-propagation
          } else if (to.typeName === "shape") {
            if (to.type === "arrow") {
              let startId = to.props.start.boundShapeId;
              let endId = to.props.end.boundShapeId;
              let newStart = diff["props.start.boundShapeId"] && endId;
              let newEnd = diff["props.end.boundShapeId"] && startId;
              if (newStart || newEnd) {
                // Newly connected arrow
                update(startId, editor);
              }
              if (diff["props.text"] && startId && endId) {
                // Updated arrow text
                update(startId, editor);
              }
            } else {
              // All other changes trigger propagation.
              // This can be optimized to only updating based on connected arrows.
              update(to.id, editor);
            }
          }
        }
      }

      // Removed
      for (const record of Object.values(change.changes.removed)) {
        if (record.typeName === "shape") {
          // console.log(`deleted shape: `, record);
        }
      }
    };

    const cleanupFunction = editor.store.listen(handleChangeEvent, {
      source: "user",
      scope: "all",
    });

    return () => {
      cleanupFunction();
    };
  }, [editor]);

  const components = {
    HelpMenu: CustomHelpMenu,
    MainMenu: (...props) => <CustomMainMenu {...props} editor={editor} />,
    SharePanel,
  };

  return (
    <div style={{ display: "flex", width: "100%" }}>
      <Tldraw
        onMount={setAppToState}
        persistenceKey="holograph-1"
        components={components}
      />
      <Analytics />
    </div>
  );
}
