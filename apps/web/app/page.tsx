import Editor from "./editor";
import { APP_NAME } from "@code2img/shared";

// Brand styling: accentuate the "2" in Code2Img (split is stable on the validated brand name).
const [brandHead, brandTail] = APP_NAME.split("2") as [string, string];

export default function Page() {
  return (
    <>
      <header className="topbar">
        <a href="/" className="brand">
          {brandHead}
          <span>2</span>
          {brandTail}
        </a>
        <span className="status">
          <kbd>Ctrl/⌘+E</kbd> export · <kbd>Ctrl/⌘+K</kbd> copy link
        </span>
      </header>
      <Editor />
    </>
  );
}
