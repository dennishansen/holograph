/* eslint-disable react/prop-types */
import {
  DefaultMainMenu,
  TldrawUiMenuGroup,
  TldrawUiMenuItem,
  EditSubmenu,
  ViewSubmenu,
  ExportFileContentSubMenu,
  ExtrasGroup,
  PreferencesGroup,
  TldrawUiButton,
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
  const isMobile = useMediaQuery("(max-width: 414px)");

  const importJSON = (editor) => {
    // Open file selection dialog
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".json";
    input.onchange = (event) => {
      const file = event.target.files[0];
      const reader = new FileReader();
      reader.onload = (event) => {
        const jsonData = JSON.parse(event.target.result);
        editor.putContentOntoCurrentPage(jsonData, { select: true });
      };
      reader.readAsText(file);
    };
    input.click();

    // Close the menu
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
        <EditSubmenu />
        <ViewSubmenu />
        <ExportFileContentSubMenu />
        <div
          style={{
            height: "1px",
            margin: "4px 0",
            backgroundColor: "var(--color-divider)",
          }}
        ></div>
        <TldrawUiMenuItem
          id="import"
          label="Import JSON"
          icon="external-link"
          readonlyOk
          onSelect={() => importJSON(editor)}
        />
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
                  backgroundColor: "rgb(237, 240, 242)",
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
            backgroundColor: "rgb(237, 240, 242)",
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
