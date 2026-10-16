// Windows 11 screens for the drawing kit, drawn at 1280x720.
import type { Scene } from "../format";
import { Art } from "./iphone";
import { WIN_ICONS, WIN_START } from "./art";

type Desktop = Extract<Scene, { screen: "windows/desktop" }>;
type AppWindow = Desktop["windows"][number];

const SCREEN_W = 1280;
const SCREEN_H = 720;

function Icon({ name, size }: { name: keyof typeof WIN_ICONS; size?: number }) {
  return <Art html={WIN_ICONS[name](size)} />;
}

function Taskbar({ startOpen, openApps }: { startOpen: boolean; openApps: Set<string> }) {
  return (
    <div className="w-taskbar">
      <span className={`w-tb-btn${startOpen ? " is-active" : ""}`} data-target="start-button">
        <Art html={WIN_START} />
      </span>
      <span className="w-tb-btn"><Icon name="search" /></span>
      <span className="w-tb-btn"><Icon name="folder" size={26} /></span>
      <span className="w-tb-btn"><Icon name="browser" size={26} /></span>
      <span className={`w-tb-btn${openApps.has("mail") ? " is-active" : ""}`}><Icon name="mail" size={26} /></span>
      <span className="w-tb-btn"><Icon name="teams" size={26} /></span>
      {openApps.has("snipping-tool") && <span className="w-tb-btn is-active"><Icon name="snip" size={26} /></span>}
      <div className="w-tray">
        <Icon name="wifi" />
        <Icon name="speaker" />
        <Icon name="battery" />
        <span>
          9:41 AM
          <br />
          10/15/2026
        </span>
      </div>
    </div>
  );
}

function TitleBar({ icon, title }: { icon: keyof typeof WIN_ICONS; title: string }) {
  return (
    <div className="w-titlebar">
      <Icon name={icon} size={16} />
      {title}
      <span className="w-caption">
        <span>–</span>
        <span>▢</span>
        <span>✕</span>
      </span>
    </div>
  );
}

function Window({ win, z }: { win: AppWindow; z: number }) {
  if (win.app === "mail") {
    return (
      <div className="w-win w-mail" style={{ zIndex: z }}>
        <TitleBar icon="mail" title={`${win.subject || "Untitled"} - Message`} />
        <div className="w-ribbon">
          <span>File</span>
          <b>Message</b>
          <span>Insert</span>
          <span>Format text</span>
          <span>Review</span>
        </div>
        <div className="w-mail-tools">
          <span className="w-send">Send</span>
        </div>
        <div className="w-field"><span>To</span><span>{win.to}</span></div>
        <div className="w-field"><span>Subject</span><span>{win.subject}</span></div>
        {win.body && <div className="w-mail-text">{win.body}</div>}
        <div className="w-mail-body" data-target="mail-body" />
      </div>
    );
  }
  return (
    <div className="w-win w-snipwin" style={{ zIndex: z }}>
      <TitleBar icon="snip" title="Snipping Tool" />
      <div className="w-snip-tools">
        <span className="w-new" data-target="snip-new">+ New</span>
        <span className="w-chip">▭ Rectangle</span>
        <span className="w-chip">No delay</span>
      </div>
      <div className="w-snip-hint">Click New to take a picture of your screen.</div>
    </div>
  );
}

const PINNED: { name: keyof typeof WIN_ICONS; label: string }[] = [
  { name: "browser", label: "Edge" },
  { name: "word", label: "Word" },
  { name: "excel", label: "Excel" },
  { name: "mail", label: "Outlook" },
  { name: "teams", label: "Teams" },
  { name: "photos", label: "Photos" },
  { name: "settings", label: "Settings" },
  { name: "store", label: "Store" },
  { name: "calculator", label: "Calculator" },
  { name: "notepad", label: "Notepad" },
  { name: "clock", label: "Clock" },
  { name: "folder", label: "File Explorer" },
];

function StartMenu({ start }: { start: NonNullable<Desktop["start"]> }) {
  const searching = start.view === "search";
  return (
    <div className="w-start">
      <div className="w-start-search" data-target="start-search">
        <Icon name="search" size={16} />
        {searching ? (
          <span className="sc-caret" data-part="typing" data-text={start.query}>
            {start.query}
          </span>
        ) : (
          <span className="is-placeholder">Search for apps, settings, and documents</span>
        )}
      </div>

      {searching ? (
        <>
          <div className="w-tabs">
            <b>All</b>
            <span>Apps</span>
            <span>Documents</span>
            <span>Web</span>
            <span>More</span>
          </div>
          <div className="w-results" data-reveal-after="">
            <div>
              <h4>Best match</h4>
              <div className="w-best" data-target="result-snipping-tool">
                <Icon name="snip" size={36} />
                <span>
                  {start.query}
                  <small>App</small>
                </span>
              </div>
              <h4>Apps</h4>
              <div className="w-result"><Icon name="paint" size={24} /><span>Paint<small>App</small></span></div>
              <div className="w-result"><Icon name="photos" size={24} /><span>Photos<small>App</small></span></div>
              <h4>Search the web</h4>
              <div className="w-result"><Icon name="search" size={20} /><span>{start.query.toLowerCase()}<small>See more search results</small></span></div>
            </div>
            <div className="w-detail">
              <Icon name="snip" size={56} />
              {start.query}
              <small>App</small>
              <ul>
                <li>Open</li>
                <li>Pin to Start</li>
                <li>Pin to taskbar</li>
              </ul>
            </div>
          </div>
        </>
      ) : (
        <>
          <div className="w-start-head"><span>Pinned</span><span>All ›</span></div>
          <div className="w-pinned">
            {PINNED.map((app) => (
              <div className="w-app" key={app.label}>
                <Icon name={app.name} size={32} />
                {app.label}
              </div>
            ))}
          </div>
          <div className="w-start-head"><span>Recommended</span><span>More ›</span></div>
          <div className="w-recent">
            {["Weekly schedule", "Client intake form", "Team meeting notes", "Supply order"].map((f, i) => (
              <div key={f}>
                <Icon name="doc" />
                <span>
                  {f}
                  <small>{i < 2 ? "Yesterday" : "Monday"}</small>
                </span>
              </div>
            ))}
          </div>
        </>
      )}

      <div className="w-start-foot">
        <span className="w-account" data-target="start-account">
          <span className="w-avatar">YN</span>
          Your Name
        </span>
        <Icon name="power" />
      </div>

      {start.account_menu && (
        <div className="w-flyout">
          <div className="w-flyout-who">
            <span className="w-avatar is-big">YN</span>
            <span>
              <b>Your Name</b>
              <small>Your work account</small>
            </span>
          </div>
          <div className="w-flyout-item">Change account settings</div>
          <div className="w-flyout-item" data-target="account-lock">Lock</div>
          <div className="w-flyout-item">Sign out</div>
        </div>
      )}
    </div>
  );
}

export function WindowsDesktop({ scene }: { scene: Desktop }) {
  const openApps = new Set(scene.windows.map((w) => w.app));
  const [bx, by, bw, bh] = scene.snip?.box ?? [0, 0, 0, 0];
  return (
    <div className="ip-scr">
      <div className="w-wall" />
      {scene.windows.map((win, i) => (
        <Window key={i} win={win} z={10 + i} />
      ))}
      {scene.toast && (
        <div className="w-toast" data-target="toast">
          <div className="w-toast-app"><Icon name="snip" size={16} />Snipping Tool</div>
          <b>{scene.toast.title}</b>
          {scene.toast.body}
        </div>
      )}
      {scene.menu && (
        <div
          className="w-menu"
          style={{ left: (scene.menu.at[0] / 100) * SCREEN_W, top: (scene.menu.at[1] / 100) * SCREEN_H }}
          data-part="menu"
        >
          {scene.menu.items.map((item, i) => (
            <div key={i} className={item.disabled ? "is-disabled" : undefined} data-target={item.id}>
              {item.label}
            </div>
          ))}
        </div>
      )}
      {scene.mouse && (
        <div className="w-mouse">
          <div className="w-mouse-body">
            <div className="w-mouse-btn is-left" />
            <div className="w-mouse-btn is-right" data-target="mouse-right" data-part="mouse-right" />
            <div className="w-mouse-wheel" />
          </div>
          Your mouse
        </div>
      )}
      <Taskbar startOpen={Boolean(scene.start)} openApps={openApps} />
      {scene.start && <StartMenu start={scene.start} />}
      {scene.snip && (
        <div className="w-snip">
          <div className="w-snip-bar">
            <i className="is-on" />
            <i />
            <i />
            <i />
          </div>
          <div
            className="w-snip-box"
            data-part="snip-box"
            data-w={(bw / 100) * SCREEN_W}
            data-h={(bh / 100) * SCREEN_H}
            style={{ left: (bx / 100) * SCREEN_W, top: (by / 100) * SCREEN_H, width: (bw / 100) * SCREEN_W, height: (bh / 100) * SCREEN_H }}
          />
        </div>
      )}
    </div>
  );
}

export function WindowsLock() {
  return (
    <div className="ip-scr">
      <div className="w-wall is-lock" />
      <div className="w-lock" data-target="lock-clock">
        <span className="w-lock-time">9:41</span>
        <span className="w-lock-date">Thursday, October 15</span>
      </div>
      <div className="w-lock-icons" style={{ color: "#fff" }}>
        <Icon name="wifi" size={20} />
        <Icon name="battery" size={26} />
      </div>
    </div>
  );
}
