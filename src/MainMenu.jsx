/* eslint-disable react/prop-types */
import {
  DefaultMainMenu,
  TldrawUiMenuGroup,
  TldrawUiMenuItem,
  EditSubmenu,
  ViewSubmenu,
  // ExportFileContentSubMenu,
  ToggleTransparentBgMenuItem,
  TldrawUiMenuSubmenu,
  ExtrasGroup,
  PreferencesGroup,
  TldrawUiButton,
  useActions,
  useExportAs,
  useUiEvents,
  useIsDarkMode,
} from "tldraw";
import useMediaQuery from "./useMediaQuery";

const Star = ({ style }) => (
  <img
    style={{
      transform: "rotate(20deg)",
      position: "absolute",
      width: 20,
      ...style,
    }}
    src="/star.svg"
    alt="New updates!"
  />
);

const CustomMainMenu = ({
  editor,
  showUpdate,
  setShowUpdate,
  latestUpdateTime,
}) => {
  const actions = useActions();
  const exportAs = useExportAs();
  const trackEvent = useUiEvents();
  const isDarkMode = useIsDarkMode();

  const isMobile = useMediaQuery("(max-width: 414px)");

  const openFile = () => {
    // Open file selection dialog
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".json";
    input.onchange = (event) => {
      const file = event.target.files[0];
      const reader = new FileReader();
      reader.onload = (event) => {
        const hasShapesOnPage =
          Array.from(editor.getCurrentPageShapeIds().values()).length > 0;
        let name = file.name.replace(".json", "");
        if (hasShapesOnPage) {
          const seed = Date.now();
          const id = "page:" + seed;
          editor.createPage({ name, id });
          editor.setCurrentPage(id);
        } else {
          editor.updatePage({ id: editor.getCurrentPageId(), name });
        }
        const jsonData = JSON.parse(event.target.result);
        // Backwards compatability: Append createdAt so defaults work
        const now = Date.now();
        jsonData.shapes = jsonData.shapes.map((shape) => ({
          ...shape,
          meta: { createdAt: now },
        }));
        editor.putContentOntoCurrentPage(jsonData, { select: true });
      };
      reader.readAsText(file);
    };
    input.click();
  };

  const saveFile = () => {
    let ids = Array.from(editor.getCurrentPageShapeIds().values());
    if (ids.length === 0) return;
    let name = editor.getCurrentPage()?.name || "Untitled";
    trackEvent("export-as", { format: "json", source: "user" });
    exportAs(ids, "json", name);
  };

  const whatsNew = () => {
    fetch("/tutorial.json")
      .then((response) => {
        if (response.ok) return response.json();
      })
      .then((tutorial) => {
        const seed = Date.now();
        const id = "page:how-to" + seed;
        editor.createPage({ name: "How to", id });
        editor.setCurrentPage(id);
        editor.putContentOntoCurrentPage(tutorial);
        // Set local item that visited update
        localStorage.setItem("lastUpdateSeen", latestUpdateTime);
        setShowUpdate(false);
      });
  };

  return (
    <div>
      <DefaultMainMenu>
        <TldrawUiMenuGroup id="file">
          <TldrawUiMenuItem
            id="Open file"
            label="Open file"
            icon="external-link"
            readonlyOk
            onSelect={openFile}
          />
          <TldrawUiMenuItem
            id="Save file"
            label="Save file"
            icon="external-link"
            readonlyOk
            onSelect={saveFile}
          />
        </TldrawUiMenuGroup>
        <TldrawUiMenuGroup id="file">
          <EditSubmenu />
          <ViewSubmenu />
          <TldrawUiMenuSubmenu
            id="export-all-as"
            label="context-menu.export-all-as"
            size="small"
          >
            <TldrawUiMenuGroup id="export-all-as-group">
              <TldrawUiMenuItem {...actions["export-all-as-svg"]} />
              <TldrawUiMenuItem {...actions["export-all-as-png"]} />
              <TldrawUiMenuItem {...actions["export-all-as-json"]} />
            </TldrawUiMenuGroup>
            <TldrawUiMenuGroup id="export-all-as-bg">
              <ToggleTransparentBgMenuItem />
            </TldrawUiMenuGroup>
          </TldrawUiMenuSubmenu>
        </TldrawUiMenuGroup>
        <ExtrasGroup />
        <PreferencesGroup />
        <TldrawUiMenuGroup id="other">
          <TldrawUiMenuItem
            id="github link"
            label="Github"
            icon="external-link"
            readonlyOk
            onSelect={() => {
              window.open(
                "https://github.com/dennishansen/holograph",
                "_blank"
              );
            }}
          />
          <TldrawUiMenuItem
            id="twitter link"
            label="Follow me on X"
            icon="external-link"
            readonlyOk
            onSelect={() => window.open("https://x.com/dennizor")}
          />
          {isMobile && (
            <div style={{ backgroundColor: showUpdate ? "#FFE1E2" : "unset" }}>
              <TldrawUiMenuItem
                id="whats new"
                label={showUpdate ? "New stuff!" : "How to"}
                icon={<Star />}
                readonlyOk
                onSelect={whatsNew}
                style={{
                  backgroundColor: isDarkMode
                    ? "rgb(26, 26, 28)"
                    : "rgb(237, 240, 242)",
                }}
              />
            </div>
          )}
        </TldrawUiMenuGroup>
      </DefaultMainMenu>
      {!isMobile && (
        <TldrawUiButton
          type={"normal"}
          title={"Whats new"}
          style={{
            backgroundColor: isDarkMode
              ? "rgb(26, 26, 28)"
              : "rgb(237, 240, 242)",
            position: "absolute",
            top: 0,
            right: showUpdate ? -89 : -71,
          }}
          onClick={whatsNew}
        >
          {showUpdate ? (
            <>
              {"New stuff!"}
              <Star style={{ top: -2, right: -6 }} />
            </>
          ) : (
            "How to"
          )}
        </TldrawUiButton>
      )}
      {showUpdate && isMobile && (
        <Star
          style={{
            top: 0,
            left: 20,
          }}
        />
      )}
    </div>
  );
};

export default CustomMainMenu;
