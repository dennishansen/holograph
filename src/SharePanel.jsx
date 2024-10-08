import {
  TldrawUiButton,
  TldrawUiPopover,
  TldrawUiPopoverContent,
  TldrawUiPopoverTrigger,
  useIsDarkMode,
} from "tldraw";

// import { get } from "@vercel/edge-config";

const SharePanel = () => {
  const isDarkMode = useIsDarkMode();
  return (
    <div style={{ display: "flex", margin: "8px 8px 0 0" }}>
      <TldrawUiPopover id="explore">
        <TldrawUiPopoverTrigger>
          <TldrawUiButton
            type={"normal"}
            title={"explore"}
            style={{
              backgroundColor: isDarkMode
                ? "rgb(26, 26, 28)"
                : "rgb(237, 240, 242)",
            }}
          >
            Explore
          </TldrawUiButton>
        </TldrawUiPopoverTrigger>
        <TldrawUiPopoverContent side="bottom" align="end" sideOffset={6}>
          <div style={{ padding: 12, paddingTop: 2 }}>
            <h2
              style={{
                textAlign: "left",
                marginBottom: 0,
                color: "rgb(46, 46, 46)",
              }}
            >
              Explore creations
            </h2>
            <p
              style={{
                userSelect: "text",
                maxWidth: 240,
                marginTop: 6,
                textAlign: "left",
                color: "rgb(46, 46, 46)",
              }}
            >
              Dowload and import some cool creations from our public google
              drive.
            </p>
            <TldrawUiButton
              type={"normal"}
              style={{
                color: "white",
                backgroundColor: "rgb(49, 130, 237)",
              }}
              onClick={() => {
                window.open(
                  "https://drive.google.com/drive/folders/1ddDGEl5p1L0G-bDnIblqxUUMOoD6hqqX?usp=sharing",
                  "_blank"
                );
              }}
            >
              Open Google Drive
            </TldrawUiButton>
          </div>
        </TldrawUiPopoverContent>
      </TldrawUiPopover>
      <div style={{ width: 6 }} />
      <TldrawUiPopover id="publish">
        <TldrawUiPopoverTrigger>
          <TldrawUiButton
            type={"normal"}
            style={{
              color: "white",
              backgroundColor: "rgb(49, 130, 237)",
            }}
          >
            Publish
          </TldrawUiButton>
        </TldrawUiPopoverTrigger>
        <TldrawUiPopoverContent side="bottom" align="end" sideOffset={6}>
          <div style={{ padding: 12, paddingTop: 2 }}>
            <h2
              style={{
                textAlign: "left",
                marginBottom: 0,
                color: "rgb(46, 46, 46)",
              }}
            >
              Publish your creation
            </h2>
            <p
              style={{
                userSelect: "text",
                maxWidth: 240,
                marginTop: 6,
                textAlign: "left",
                color: "rgb(46, 46, 46)",
              }}
            >
              Get your creation into the public google drive by tweeting it at
              @dennizor or exporting it as JSON and emailing it to
              dennis@holograph.so.
            </p>
            <div style={{ display: "flex" }}>
              <TldrawUiButton
                type={"normal"}
                style={{
                  color: "white",
                  backgroundColor: "rgb(49, 130, 237)",
                }}
                onClick={() => window.open("https://x.com/dennizor")}
              >
                Tweet at me
              </TldrawUiButton>
              <div style={{ width: 6 }} />
              <TldrawUiButton
                type={"normal"}
                style={{ backgroundColor: "rgb(237, 240, 242)" }}
                onClick={() => window.open("mailto:dennis@holograph.so")}
              >
                Email me
              </TldrawUiButton>
            </div>
          </div>
        </TldrawUiPopoverContent>
      </TldrawUiPopover>
    </div>
  );
};

export default SharePanel;
