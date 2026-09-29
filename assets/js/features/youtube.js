// Ayudas para reconocer enlaces de YouTube y convertirlos en reproductores.

const YOUTUBE_HOSTS = ["youtube.com", "www.youtube.com", "m.youtube.com", "youtu.be", "www.youtu.be"];

function parseYoutube(value) {
  try {
    const url = new URL(value);
    return ["http:", "https:"].includes(url.protocol) && YOUTUBE_HOSTS.includes(url.hostname) ? url : null;
  } catch {
    return null;
  }
}

export const isYoutubeUrl = (value) => Boolean(parseYoutube(value));

/** Devuelve la URL para embeber un video o playlist, o null si no se puede. */
export function youtubeEmbedUrl(value) {
  const url = parseYoutube(value);
  if (!url) return null;
  const parts = url.pathname.split("/").filter(Boolean);
  const videoId = url.hostname.includes("youtu.be")
    ? parts[0]
    : url.searchParams.get("v") || (["embed", "shorts", "live"].includes(parts[0]) ? parts[1] : null);
  const list = url.searchParams.get("list");
  if (list) return `https://www.youtube-nocookie.com/embed/videoseries?list=${encodeURIComponent(list)}`;
  if (videoId && /^[\w-]{11}$/.test(videoId)) return `https://www.youtube-nocookie.com/embed/${videoId}`;
  if (parts[0] === "user" && parts[1])
    return `https://www.youtube-nocookie.com/embed?listType=user_uploads&list=${encodeURIComponent(parts[1])}`;
  return null;
}
