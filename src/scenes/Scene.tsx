import type { Scene as SceneData } from "./format";
import { PhoneHome, PhoneList, PhoneTextSize } from "./kit/iphone";
import { WindowsDesktop, WindowsLock } from "./kit/windows";

/** Draws one screen of the kit from its scene data. */
export function Scene({ scene }: { scene: SceneData }) {
  switch (scene.screen) {
    case "iphone/home":
      return <PhoneHome />;
    case "iphone/list":
      return <PhoneList scene={scene} />;
    case "iphone/text-size":
      return <PhoneTextSize scene={scene} />;
    case "windows/desktop":
      return <WindowsDesktop scene={scene} />;
    case "windows/lock":
      return <WindowsLock />;
  }
}
