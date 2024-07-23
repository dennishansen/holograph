import "./index.css";
import "./App.css";

import { useCallback, useEffect, useState } from "react";
import { Tldraw } from "tldraw";
import deepDiff from "./deepDiff";
import Toolbar from "./Toolbar";
import HelpMenu from "./HelpMenu";
import MainMenu from "./MainMenu";
import SharePanel from "./SharePanel";
import { Analytics } from "@vercel/analytics/react";
import update from "./update";

const latestUpdateTime = 1721409313220;

let mounted = false;

const ignoredKeys = [
  "meta.result",
  "meta.code",
  "meta.nextClick",
  "meta.click",
];

const allKeysInArray = (obj, arr) => {
  return Object.keys(obj).every((key) => arr.some((str) => key.includes(str)));
};

export default function StoreEventsExample() {
  const [editor, setEditor] = useState();
  const [showUpdate, setShowUpdate] = useState(false);
  // Last update: lazy arrows

  const setAppToState = useCallback((editor) => {
    setEditor(editor);
  }, []);

  // Load logic
  useEffect(() => {
    if (!editor) return;
    if (mounted) return;
    mounted = true; // prevent rerunning and screwing this up

    const allRecords = editor.store.allRecords();

    const lastVisit = localStorage.getItem("lastVisit");
    const backwardsCompatVisited = localStorage.getItem("visited");
    const isFirstVisit = lastVisit === null && backwardsCompatVisited !== true; // backwards compatibility

    const canvasRecords = allRecords.filter(
      ({ id }) => id.startsWith("shape") || id.startsWith("asset")
    );
    // Load tutorial to current page if its empty and its the first load
    const showTutorial = canvasRecords.length === 0 && isFirstVisit;
    if (showTutorial) {
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

    // Set last visit to now
    const visitTime = Date.now();
    localStorage.setItem("lastVisit", visitTime);

    // Show an update if the last update seen is older than the latest update
    let lastUpdateSeen = localStorage.getItem("lastUpdateSeen");
    if (showTutorial) {
      lastUpdateSeen = visitTime;
    }
    setShowUpdate(!showTutorial && lastUpdateSeen < latestUpdateTime);
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
          let ignore = allKeysInArray(diff, ignoredKeys);
          if (ignore) {
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
          import.meta.env.DEV && console.log(`deleted shape: `, record);
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

  useEffect(() => {
    if (!editor) return;

    const handleEvent = (data) => {
      if (data.name === "pointer_down") {
        const point = data.point;
        const pagePoint = editor.screenToPage(point);
        const shape = editor.getShapeAtPoint(pagePoint, {
          hitInside: true,
          // hitLocked: true, // Can't update locked shapes
        });
        if (shape !== undefined) {
          const dashed =
            editor.store
              .allRecords()
              .find((record) => record?.props?.start?.boundShapeId === shape.id)
              ?.props?.dash === "dashed";

          if (!dashed) {
            editor.updateShape({
              id: shape.id,
              meta: { nextClick: { ...pagePoint, timeStamp: Date.now() } },
            });
            update(shape.id, editor);
          }
        }
      } else if (data.name === "pointer_move") {
        // Hover events, etc
      }
    };

    editor.on("event", handleEvent);
  }, [editor]);

  const components = {
    HelpMenu,
    MainMenu: (...props) => (
      <MainMenu
        {...props}
        editor={editor}
        showUpdate={showUpdate}
        latestUpdateTime={latestUpdateTime}
        setShowUpdate={setShowUpdate}
      />
    ),
    SharePanel,
    Toolbar,
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
