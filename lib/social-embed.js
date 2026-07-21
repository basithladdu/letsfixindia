const YOUTUBE_ID = /^[A-Za-z0-9_-]{11}$/;
const INSTAGRAM_ID = /^[A-Za-z0-9_-]{5,64}$/;
const X_POST_ID = /^\d{5,25}$/;

export function parseSocialPostUrl(value) {
  let url;
  try {
    url = new URL(String(value || "").trim());
  } catch {
    return null;
  }
  if (url.protocol !== "https:") return null;

  const host = url.hostname.toLowerCase().replace(/^www\./, "").replace(/^m\./, "");
  const parts = url.pathname.split("/").filter(Boolean);

  if (["x.com", "twitter.com"].includes(host)) {
    const statusIndex = parts.indexOf("status");
    const handle = statusIndex === 1 ? parts[0] : "";
    const id = statusIndex === 1 ? parts[2] : "";
    if (!/^[A-Za-z0-9_]{1,20}$/.test(handle) || !X_POST_ID.test(id || "")) return null;
    return {
      platform: "x",
      platformName: "X",
      id,
      canonicalUrl: `https://x.com/${handle}/status/${id}`,
      embedUrl: `https://platform.twitter.com/embed/Tweet.html?id=${id}&dnt=true&theme=light`,
    };
  }

  if (host === "instagram.com") {
    const kind = parts[0] === "reels" ? "reel" : parts[0];
    const id = parts[1] || "";
    if (!["p", "reel", "tv"].includes(kind) || !INSTAGRAM_ID.test(id)) return null;
    return {
      platform: "instagram",
      platformName: kind === "reel" ? "Instagram Reel" : "Instagram",
      id,
      canonicalUrl: `https://www.instagram.com/${kind}/${id}/`,
      embedUrl: `https://www.instagram.com/${kind}/${id}/embed/captioned/`,
    };
  }

  if (["youtube.com", "youtube-nocookie.com", "youtu.be"].includes(host)) {
    let id = "";
    if (host === "youtu.be") id = parts[0] || "";
    else if (parts[0] === "watch") id = url.searchParams.get("v") || "";
    else if (["shorts", "embed", "live"].includes(parts[0])) id = parts[1] || "";
    if (!YOUTUBE_ID.test(id)) return null;
    return {
      platform: "youtube",
      platformName: "YouTube",
      id,
      canonicalUrl: `https://www.youtube.com/watch?v=${id}`,
      embedUrl: `https://www.youtube-nocookie.com/embed/${id}?playsinline=1&rel=0`,
    };
  }

  return null;
}
