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
  const importJSON = () => {
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
        <TldrawUiMenuGroup id="import">
          <TldrawUiMenuItem
            id="import"
            label="Import JSON"
            icon="external-link"
            readonlyOk
            onSelect={importJSON}
          />
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
        </TldrawUiMenuGroup>
      </DefaultMainMenu>
    </div>
  );
};

export default CustomMainMenu;
