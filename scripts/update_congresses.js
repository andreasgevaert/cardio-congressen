// Node 20+. This script keeps data/congresses.json formatted and ready for extension.
// Fully reliable abstract extraction usually needs one parser per society website.
// Add society-specific parsers below as URLs change.

import fs from "node:fs/promises";

import { parseESC } from "./parsers/esc.js";
import { parseAHA } from "./parsers/aha.js";
import { parseACC } from "./parsers/acc.js";
import { parseHFSA } from "./parsers/hfsa.js";
import { parseASE } from "./parsers/ase.js";
import { parseISHLT } from "./parsers/ishlt.js";
import { parseBSC } from "./parsers/bsc.js";

const DATA_FILE = "data/congresses.json";

function clean(value) {
  return String(value || "").replace(/\s+/g, " ").trim();
}

async function fetchText(url) {
  const res = await fetch(url, { headers: { "user-agent": "cardio-congress-tracker/1.0" } });
  if (!res.ok) throw new Error(`${res.status} ${url}`);
  return res.text();
}

function findAbstractDeadline(html) {
  const text = clean(html.replace(/<[^>]+>/g, " "));
  const m = text.match(/(?:abstract|abstracts).{0,80}(?:deadline|submission).{0,80}?([0-3]?\d\s+[A-Za-z]+\s+20\d{2}|[A-Za-z]+\s+[0-3]?\d,\s+20\d{2})/i);
  return m ? clean(m[1]) : "";
}

async function main() {
  const raw = await fs.readFile(DATA_FILE, "utf8");
  const congresses = JSON.parse(raw);

  for (const c of congresses) {
    if (!c.sourceUrl) continue;
    try {
      const html = await fetchText(c.sourceUrl);
      const foundDeadline = findAbstractDeadline(html);
      if (foundDeadline && !c.abstractDeadlineText) c.abstractDeadlineText = foundDeadline;
      c.lastChecked = new Date().toISOString().slice(0, 10);
    } catch (err) {
      c.lastChecked = new Date().toISOString().slice(0, 10);
      c.checkError = String(err.message || err);
    }
  }

  await fs.writeFile(DATA_FILE, JSON.stringify(congresses, null, 2) + "\n");
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
