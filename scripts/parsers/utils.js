import { parse, format } from "date-fns";

export async function fetchHtml(url) {
  const res = await fetch(url, {
    headers: {
      "user-agent": "cardio-congress-tracker/1.0"
    }
  });

  if (!res.ok) {
    throw new Error(`${res.status} ${url}`);
  }

  return await res.text();
}

export function clean(text = "") {
  return text
    .replace(/\s+/g, " ")
    .replace(/&nbsp;/g, " ")
    .trim();
}

export function parseDateString(value) {
  if (!value) return "";

  const formats = [
    "d MMMM yyyy",
    "dd MMMM yyyy",
    "d MMM yyyy",
    "dd MMM yyyy",
    "MMMM d yyyy",
    "MMM d yyyy"
  ];

  for (const fmt of formats) {
    try {
      const parsed = parse(value, fmt, new Date());
      if (!isNaN(parsed)) {
        return format(parsed, "yyyy-MM-dd");
      }
    } catch {}
  }

  return "";
}

export function extractDeadline(text) {
  const patterns = [
    /abstract.{0,80}deadline.{0,40}?([0-3]?\d\s+[A-Za-z]+\s+20\d{2})/i,
    /abstract.{0,80}submission.{0,40}?([0-3]?\d\s+[A-Za-z]+\s+20\d{2})/i,
    /deadline for abstract submission.{0,40}?([0-3]?\d\s+[A-Za-z]+\s+20\d{2})/i
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) {
      return parseDateString(match[1]) || match[1];
    }
  }

  return "";
}
