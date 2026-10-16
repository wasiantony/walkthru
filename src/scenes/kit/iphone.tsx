// iPhone screens for the drawing kit, drawn at 390x844.
import type { Scene } from "../format";
import { TEXT_SIZE_STOPS } from "../format";
import { PHONE_CHECK, PHONE_DOCK_APPS, PHONE_GLYPH_ART, PHONE_HOME_APPS, PHONE_SEARCH, PHONE_STATUS_ICONS } from "./art";

type Of<S extends Scene["screen"]> = Extract<Scene, { screen: S }>;

// Fixed artwork from art.ts only; never walkthrough data.
export function Art({ html, className }: { html: string; className?: string }) {
  return <span className={className} style={{ display: "contents" }} dangerouslySetInnerHTML={{ __html: html }} />;
}

function Status({ dark = false }: { dark?: boolean }) {
  return (
    <div className={`ip-status${dark ? " ip-on-dark" : ""}`}>
      <span>9:41</span>
      <Art html={PHONE_STATUS_ICONS} />
    </div>
  );
}

export function PhoneHome() {
  return (
    <div className="ip-scr ip-home">
      <Status dark />
      <div className="ip-grid">
        {PHONE_HOME_APPS.map((app) => (
          <div className="ip-cell" key={app.label} data-target={app.id}>
            <span className="ip-tile">
              <Art html={`<svg viewBox="0 0 64 64">${app.art}</svg>`} />
            </span>
            <span>{app.label}</span>
          </div>
        ))}
      </div>
      <div className="ip-searchpill">Search</div>
      <div className="ip-dock">
        {PHONE_DOCK_APPS.map((app) => (
          <span className="ip-tile" key={app.label}>
            <Art html={`<svg viewBox="0 0 64 64">${app.art}</svg>`} />
          </span>
        ))}
      </div>
      <div className="ip-homebar ip-on-dark" />
    </div>
  );
}

function NavBar({ title, back }: { title: string; back: string }) {
  return (
    <div className="ip-navbar">
      <span className="ip-back">
        <b>‹</b>
        {back}
      </span>
      {title}
    </div>
  );
}

type Group = Of<"iphone/list">["groups"][number];
type Row = Extract<Group, { rows: unknown }>["rows"][number];

function ListRow({ row }: { row: Row }) {
  return (
    <div className={`ip-row${row.icon ? " has-icon" : ""}${row.avatar ? " is-profile" : ""}`} data-target={row.id}>
      {row.avatar && <span className="ip-avatar">{row.avatar}</span>}
      {row.icon && (
        <span className="ip-ico" style={{ background: row.icon.color }}>
          <Art html={`<svg viewBox="0 0 20 20">${PHONE_GLYPH_ART[row.icon.glyph]}</svg>`} />
        </span>
      )}
      <span className="ip-label">
        {row.label}
        {row.sub && <span className="ip-sub">{row.sub}</span>}
      </span>
      {row.value && <span className="ip-value">{row.value}</span>}
      {row.accessory === "chevron" && <span className="ip-chev" />}
      {(row.accessory === "switch-off" || row.accessory === "switch-on") && (
        <span className={`ip-switch${row.accessory === "switch-on" ? " is-on" : ""}`} />
      )}
    </div>
  );
}

function ListGroup({ group }: { group: Group }) {
  const header = "header" in group && group.header ? <p className="ip-sechead">{group.header}</p> : null;
  if ("kind" in group && group.kind === "appearance") {
    return (
      <>
        {header}
        <div className="ip-group">
          <div className="ip-appearance">
            <div className="ip-mode">
              <div className="ip-mini"><i /><i /><i /></div>
              Light
              <span className="ip-radio is-on"><Art html={PHONE_CHECK} /></span>
            </div>
            <div className="ip-mode">
              <div className="ip-mini is-dark"><i /><i /><i /></div>
              Dark
              <span className="ip-radio" />
            </div>
          </div>
          <div className="ip-row">
            <span className="ip-label">Automatic</span>
            <span className="ip-switch" />
          </div>
        </div>
      </>
    );
  }
  if ("kind" in group && group.kind === "brightness") {
    return (
      <>
        {header}
        <div className="ip-group">
          <div className="ip-bright">
            <Art html='<svg width="16" height="16" viewBox="0 0 20 20"><circle cx="10" cy="10" r="4" fill="#8e8e93"/></svg>' />
            <i />
            <Art html='<svg width="22" height="22" viewBox="0 0 20 20"><circle cx="10" cy="10" r="5" fill="#8e8e93"/></svg>' />
          </div>
        </div>
      </>
    );
  }
  return (
    <>
      {header}
      <div className="ip-group">
        {"rows" in group && group.rows.map((row, i) => <ListRow key={i} row={row} />)}
      </div>
    </>
  );
}

export function PhoneList({ scene }: { scene: Of<"iphone/list"> }) {
  return (
    <div className="ip-scr ip-ios">
      <Status />
      {scene.back && <NavBar title={scene.title} back={scene.back} />}
      <div className={`ip-scroller${scene.back ? " has-nav" : ""}`} data-part="scroller" data-scroll-to={scene.scroll_to}>
        {scene.large && <div className="ip-large-title">{scene.title}</div>}
        {scene.search && (
          <div className="ip-search">
            <Art html={PHONE_SEARCH} />
            Search
          </div>
        )}
        {scene.groups.map((group, i) => (
          <ListGroup key={i} group={group} />
        ))}
      </div>
      <div className="ip-homebar" />
    </div>
  );
}

export function PhoneTextSize({ scene }: { scene: Of<"iphone/text-size"> }) {
  const last = TEXT_SIZE_STOPS.length - 1;
  return (
    <div className="ip-scr ip-ios">
      <Status />
      <NavBar title={scene.title} back={scene.back} />
      <div className="ip-page">
        <p
          className="ip-sample"
          data-target="text-size-sample"
          data-part="sample"
          data-sizes={TEXT_SIZE_STOPS.join(",")}
          style={{ fontSize: TEXT_SIZE_STOPS[scene.value] }}
        >
          {scene.sample}
        </p>
      </div>
      <div className="ip-sizer" data-target="text-size-slider">
        <span className="ip-a1">A</span>
        <div className="ip-track" data-part="track">
          <div className="ip-track-line" />
          {TEXT_SIZE_STOPS.map((_, i) => (
            <div key={i} className="ip-tick" style={{ left: `${(i / last) * 100}%` }} />
          ))}
          <div className="ip-thumb" data-part="thumb" style={{ left: `${(scene.value / last) * 100}%` }} />
        </div>
        <span className="ip-a2">A</span>
      </div>
      <div className="ip-homebar" />
    </div>
  );
}
