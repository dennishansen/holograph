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
} from "tldraw";

const CustomMainMenu = ({ editor }) => {
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
        </TldrawUiMenuGroup>
      </DefaultMainMenu>
    </div>
  );
};

export default CustomMainMenu;
