const removeIndexes = (shapes) => {
  // eslint-disable-next-line no-unused-vars
  const newShapes = shapes.map(({ index, ...shape }) => shape);
  return newShapes;
};

const overrides = {
  actions(_editor, actions) {
    const newActions = {
      ...actions,
      "duplicate-with-connections": {
        id: "duplicate-with-connections",
        label: "Duplicate with Connections",
        readonlyOk: true,
        kbd: "$b",
        onSelect() {
          let selectedShapes = _editor.getSelectedShapes();
          console.log("selectedShapes", selectedShapes);
          let idLookup = {};
          let newShapes = [];

          for (let shape of selectedShapes) {
            let { id, type, x, y } = shape;
            id = getId();
            idLookup[shape.id] = id;
            if (type === "geo") {
              x += 100;
              y += 100;
              newShapes.push({ ...shape, id, x, y });
            }
          }

          const records = _editor.store.allRecords();
          for (let record of records) {
            let { type, props } = record;
            if (type === "arrow") {
              const { start, end } = props;
              const startIdOfNewShape = idLookup[start.boundShapeId];
              const endIdOfNewShape = idLookup[end.boundShapeId];
              if (startIdOfNewShape || endIdOfNewShape) {
                const newStartId = startIdOfNewShape || start.boundShapeId;
                const newEndId = endIdOfNewShape || end.boundShapeId;
                const newStart = { ...start, boundShapeId: newStartId };
                const newEnd = { ...end, boundShapeId: newEndId };
                const id = getId();
                props = { ...props, start: newStart, end: newEnd };
                newShapes.push({ ...record, id, props });
              }
            }
          }

          const shapesWithoutIndexes = removeIndexes(newShapes);
          _editor.createShapes(shapesWithoutIndexes, { select: true });
          _editor.deselect(...Object.keys(idLookup));
          _editor.select(...Object.keys(idLookup).map((id) => idLookup[id]));
        },
      },
      "Delete with connections": {
        id: "delete-with-connections",
        label: "Delete with Connections",
        readonlyOk: true,
        kbd: "$j",
        onSelect() {
          const selectedShapes = _editor
            .getSelectedShapes()
            .filter(({ type }) => type === "geo");
          const connectedArrows = _editor.store
            .allRecords()
            .filter(({ type, props }) => {
              if (type === "arrow") {
                const endId = props.end.boundShapeId;
                const startId = props.start.boundShapeId;
                for (let shape of selectedShapes) {
                  if (shape.id === endId || shape.id === startId) {
                    return true;
                  }
                }
              }
            });
          _editor.deleteShapes([...connectedArrows, ...selectedShapes]);
        },
      },
      "Toggle debug mode": {
        id: "toggle-debug-mode",
        label: "Toggle debug mode",
        readonlyOk: true,
        kbd: "$k",
        onSelect() {
          document.debugPropagation = !document.debugPropagation;
          document.toasts.addToast({
            id: "debug-propagation",
            description: `Debug propagation mode ${
              document.debugPropagation ? "enabled" : "disabled"
            }`,
          });
        },
      },
    };

    return newActions;
  },
};

const getId = (prefix = "shape") =>
  `${prefix}:${Math.random().toString(36).split(".")[1]}`;
export default overrides;
