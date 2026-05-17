import * as cheerio from "cheerio";
import { fetchHtml, clean, extractDeadline } from "./utils.js";

const ESC_KEYWORDS = [
  "ESC Congress",
  "Heart Failure",
  "Preventive Cardiology",
  "Digital & AI",
  "Heart Rhythm",
  "Myocardial",
  "Cardiovascular Imaging",
  "EACVI",
  "EHRA",
  "EAPC",
  "HFA"
];

export async function parseESC(congress) {
  if (!congress.sourceUrl?.includes("escardio.org")) {
    return congress;
  }

  const html = await fetchHtml(congress.sourceUrl);
  const $ = cheerio.load(html);

  const bodyText = clean($("body").text());

  const deadline = extractDeadline(bodyText);
  if (deadline) {
    congress.abstractDeadline = deadline;
  }

  const title = clean($("title").text());

  for (const keyword of ESC_KEYWORDS) {
    if (title.includes(keyword) && !congress.notes?.includes("ESC parser")) {
      congress.notes = `${congress.notes || ""} ESC parser`.trim();
    }
  }

  congress.lastChecked = new Date().toISOString();

  return congress;
}
