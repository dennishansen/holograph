import {
  DefaultHelpMenu,
  DefaultHelpMenuContent,
  TldrawUiMenuGroup,
  TldrawUiMenuItem,
} from "tldraw";

const CustomHelpMenu = () => {
  return (
    <DefaultHelpMenu>
      <TldrawUiMenuGroup id="example">
        <TldrawUiMenuItem
          id="like"
          label="Github + How to"
          icon="external-link"
          readonlyOk
          onSelect={() => {
            window.open("https://github.com/dennishansen/holograph", "_blank");
          }}
        />
      </TldrawUiMenuGroup>
      <DefaultHelpMenuContent />
      <div
        style={{
          backgroundColor: "rgb(232, 232, 232)",
          height: 1,
          marginTop: 2,
        }}
      ></div>
      <p
        style={{
          color: "rgba(0, 0, 0, 0.4)",
          textAlign: "left",
          padding: "5px 10px 7px 10px",
          margin: 0,
        }}
      >
        Holograph
      </p>
    </DefaultHelpMenu>
  );
};

export default CustomHelpMenu;
