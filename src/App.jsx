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
import overrides from "./overrides";
import appendCreatedAt from "./appendCreatedAt";

const latestUpdateTime = 1721928965296;

let mounted = false;

const ignoredKeys = [
  "meta.result",
  "meta.code",
  "meta.nextClick",
  "meta.click",
  "meta.errorColorCache",
];

const allKeysInArray = (obj, arr) => {
  return Object.keys(obj).every((key) => arr.some((str) => key.includes(str)));
};

export default function StoreEventsExample() {
  const [editor, setEditor] = useState();
  const [showUpdate, setShowUpdate] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);
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
          tutorial = appendCreatedAt(tutorial);
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

    localStorage.setItem("lastUpdateSeen", lastUpdateSeen);

    // Observe dark mode changes
    const targetNode = document.querySelector("#root > div > div.tl-container");

    // Create a MutationObserver instance
    const observer = new MutationObserver((mutationsList) => {
      for (const mutation of mutationsList) {
        if (
          mutation.type === "attributes" &&
          mutation.attributeName === "data-color-mode"
        ) {
          // Handle the change
          const newMode = mutation.target.getAttribute("data-color-mode");
          const newIsDarkMode = newMode === "dark";
          setIsDarkMode(newIsDarkMode);
        }
      }
    });

    // Configuration for the observer
    const config = {
      attributes: true, // Watch for attribute changes
      attributeFilter: ["data-color-mode"], // Only observe the specific attribute
    };

    // Start observing the target node
    observer.observe(targetNode, config);

    // Add created meta for backwards compat with setting defaults
    let shapesWithNewMeta = [];
    for (let record of allRecords) {
      if (record.typeName === "shape" && !record.meta.createdAt) {
        shapesWithNewMeta.push({
          id: record.id,
          meta: { createdAt: Date.now() },
        });
      }
    }
    editor.updateShapes(shapesWithNewMeta, isDarkMode);
  }, [editor, isDarkMode]);

  useEffect(() => {
    if (!editor) return;

    //[1]
    const handleChangeEvent = (change) => {
      // Added
      for (const record of Object.values(change.changes.added)) {
        if (record.typeName === "shape") {
          // Add code formatting to rectangles
          if (record.props.geo === "rectangle") {
            // Set defaults
            if (!editor.getShape(record.id).meta.createdAt) {
              // Set defaults if its newly created
              editor.updateShape({
                id: record.id,
                props: { fill: "semi", font: "mono" }, // NOTE: always adding classes
                meta: { createdAt: Date.now() },
              });
            }
          } else if (record.props.geo === "ellipse") {
            // Set defaults
            if (!editor.getShape(record.id).meta.createdAt) {
              // Set defaults if its newly created
              editor.updateShape({
                id: record.id,
                props: { fill: "semi", font: "mono" },
                meta: { createdAt: Date.now() },
              });
            }
          } else if (record.type === "text") {
            // Set defaults
            if (!editor.getShape(record.id).meta.createdAt) {
              // Set defaults if its newly created
              editor.updateShape({
                id: record.id,
                props: { font: "draw" },
                meta: { createdAt: Date.now() },
              });
            }
          }

          // console.log(`created shape (${JSON.stringify(record)})\n`);
        }
      }

      // Updated
      for (const [from, to] of Object.values(change.changes.updated)) {
        if (from.id.startsWith("shape") && to.id.startsWith("shape")) {
          let diff = deepDiff(from, to);
          let ignore = allKeysInArray(diff, ignoredKeys);

          // // console.log("metalast: ", diff["meta.lastUpdated"]);
          // if (diff["meta.lastUpdated"]) {
          //   ignore = true;
          // }
          // console.log("Ignoring change", ignore);
          if (ignore) {
            // Ignore changes that should not trigger a re-propagation
          } else if (to.typeName === "shape") {
            if (to.type === "arrow") {
              let startId = to.props.start.boundShapeId;
              let endId = to.props.end.boundShapeId;
              let newStart = diff["props.start.boundShapeId"] && endId;
              let newEnd = diff["props.end.boundShapeId"] && startId;
              let newlySolid = diff["props.dash"] && to.props.dash === "draw";
              if (newStart || newEnd || newlySolid) {
                update(startId, editor);
              }
              if (diff["props.text"] && startId && endId) {
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
          editor.updateShape({
            id: shape.id,
            meta: { nextClick: { ...pagePoint, timeStamp: Date.now() } },
          });
          update(shape.id, editor);
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
    <div style={{ position: "absolute", inset: 0 }}>
      <Tldraw
        onMount={setAppToState}
        persistenceKey="holograph-1"
        components={editor ? components : {}} // Makes hooks usable
        overrides={overrides}
      />
      <Analytics />
    </div>
  );
}
