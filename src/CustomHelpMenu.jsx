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
      <div
        style={{
          color: "rgba(0, 0, 0, 0.4)",
          textAlign: "left",
          padding: "12px 12px",
          margin: 0,
        }}
      >
        <p style={{ margin: 0 }}>Holograph</p>
        <div style={{ height: 4 }}></div>
        <p
          style={{
            margin: 0,
            userSelect: "text",
          }}
        >
          dennis@holograph.so
        </p>
      </div>
    </DefaultHelpMenu>
  );
};

export default CustomHelpMenu;
