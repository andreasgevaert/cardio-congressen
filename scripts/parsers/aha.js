import * as cheerio from "cheerio";
import { fetchHtml, clean, extractDeadline } from "./utils.js";

export async function parseAHA(congress) {
  if (!congress.sourceUrl?.includes("heart.org")) {
    return congress;
  }

  const html = await fetchHtml(congress.sourceUrl);
  const $ = cheerio.load(html);

  const text = clean($("body").text());

  const deadline = extractDeadline(text);

  if (deadline) {
    congress.abstractDeadline = deadline;
  }

  congress.lastChecked = new Date().toISOString();

  return congress;
}
