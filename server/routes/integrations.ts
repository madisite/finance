import { RequestHandler } from "express";

type KimaiTimesheet = {
  id?: number;
  begin?: string;
  end?: string;
  duration?: number;
  description?: string;
  project?: string | { name?: string };
  activity?: string | { name?: string };
};

export const handleKimaiSummary: RequestHandler = async (req, res) => {
  if (!process.env.KIMAI_API_URL || !process.env.KIMAI_API_TOKEN) {
    res.status(503).json({ configured: false, message: "Configure KIMAI_API_URL and KIMAI_API_TOKEN to load timesheets." });
    return;
  }

  const url = new URL("timesheets", `${process.env.KIMAI_API_URL.replace(/\/$/, "")}/api/`);
  url.searchParams.set("size", "100");
  if (typeof req.query.begin === "string") url.searchParams.set("begin", req.query.begin);
  if (typeof req.query.end === "string") url.searchParams.set("end", req.query.end);

  try {
    const response = await fetch(url, { headers: { Accept: "application/json", Authorization: `Bearer ${process.env.KIMAI_API_TOKEN}` } });
    const data = await response.json() as KimaiTimesheet[] | { message?: string };
    if (!response.ok) {
      res.status(response.status).json({ configured: true, message: "Kimai rejected the request.", detail: data });
      return;
    }
    const timesheets = Array.isArray(data) ? data : [];
    const totalSeconds = timesheets.reduce((sum, item) => sum + Number(item.duration ?? 0), 0);
    res.json({ configured: true, totalSeconds, totalHours: Number((totalSeconds / 3600).toFixed(2)), count: timesheets.length, timesheets: timesheets.slice(0, 8).map(normalizeTimesheet) });
  } catch (error) {
    console.error("Kimai request failed:", error);
    res.status(502).json({ configured: true, message: "Unable to reach Kimai." });
  }
};

export const handleCreateLumaGeneration: RequestHandler = async (req, res) => {
  if (!process.env.LUMA_API_KEY) {
    res.status(503).json({ configured: false, message: "Configure LUMA_API_KEY to create Luma AI generations." });
    return;
  }
  const prompt = typeof req.body?.prompt === "string" ? req.body.prompt.trim() : "";
  if (!prompt) {
    res.status(400).json({ message: "A prompt is required." });
    return;
  }

  try {
    const response = await fetch(`${(process.env.LUMA_API_URL ?? "https://api.lumalabs.ai").replace(/\/$/, "")}/dream-machine/v1/generations`, {
      method: "POST",
      headers: { Accept: "application/json", "Content-Type": "application/json", Authorization: `Bearer ${process.env.LUMA_API_KEY}` },
      body: JSON.stringify({ prompt, model: process.env.LUMA_MODEL ?? "ray-2", resolution: process.env.LUMA_RESOLUTION ?? "720p" }),
    });
    const data = await response.json() as Record<string, unknown>;
    if (!response.ok) {
      res.status(response.status).json({ configured: true, message: "Luma AI rejected the generation request.", detail: data });
      return;
    }
    res.status(202).json(normalizeLuma(data));
  } catch (error) {
    console.error("Luma request failed:", error);
    res.status(502).json({ configured: true, message: "Unable to reach Luma AI." });
  }
};

export const handleGetLumaGeneration: RequestHandler = async (req, res) => {
  if (!process.env.LUMA_API_KEY) {
    res.status(503).json({ configured: false, message: "Configure LUMA_API_KEY to read Luma AI generations." });
    return;
  }
  try {
    const response = await fetch(`${(process.env.LUMA_API_URL ?? "https://api.lumalabs.ai").replace(/\/$/, "")}/dream-machine/v1/generations/${encodeURIComponent(req.params.id)}`, {
      headers: { Accept: "application/json", Authorization: `Bearer ${process.env.LUMA_API_KEY}` },
    });
    const data = await response.json() as Record<string, unknown>;
    if (!response.ok) {
      res.status(response.status).json({ configured: true, message: "Luma AI could not load this generation.", detail: data });
      return;
    }
    res.json(normalizeLuma(data));
  } catch (error) {
    console.error("Luma status request failed:", error);
    res.status(502).json({ configured: true, message: "Unable to reach Luma AI." });
  }
};

function normalizeTimesheet(item: KimaiTimesheet) {
  return {
    id: item.id,
    begin: item.begin,
    end: item.end,
    duration: Number(item.duration ?? 0),
    description: item.description ?? "Untitled work",
    project: typeof item.project === "string" ? item.project : item.project?.name ?? "Unassigned project",
    activity: typeof item.activity === "string" ? item.activity : item.activity?.name ?? "Unassigned activity",
  };
}

function normalizeLuma(data: Record<string, unknown>) {
  return { id: data.id, state: data.state ?? data.status ?? "queued", videoUrl: data.assets && typeof data.assets === "object" ? (data.assets as { video?: string }).video : undefined, createdAt: data.created_at ?? data.createdAt };
}