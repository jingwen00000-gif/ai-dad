"use client";

import { useState } from "react";
import { Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { CITIES, CITY_BY_CODE, PRESENCE_STATUS } from "@/lib/mock-data";
import type { DadPresence } from "@/lib/types";
import { useAppStore } from "@/store/app-store";

const WEATHER: DadPresence["weather"][] = [
  { emoji: "☀️", label: "Sunny" },
  { emoji: "⛅", label: "Cloudy" },
  { emoji: "🌧️", label: "Rainy" },
  { emoji: "❄️", label: "Snowy" },
];

const selectClass =
  "h-12 w-full rounded-2xl border-2 border-input bg-card px-4 text-base font-semibold outline-none focus-visible:border-ring";

export default function ParentSettings() {
  const presence = useAppStore((s) => s.dadPresence);
  const setPresence = useAppStore((s) => s.setPresence);
  const kids = useAppStore((s) => s.children);
  const sendDadMessage = useAppStore((s) => s.sendDadMessage);
  const resetDemo = useAppStore((s) => s.resetDemo);

  const [to, setTo] = useState(kids[0].id);
  const [text, setText] = useState("");
  const [sent, setSent] = useState(false);

  return (
    <div className="max-w-3xl">
      <h1 className="text-3xl font-extrabold">Settings</h1>

      <section className="mt-6 rounded-3xl bg-card p-6">
        <h2 className="text-xl font-extrabold">Where are you? 🌏</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Kids see your city on &ldquo;Where&apos;s Dad&rdquo;. Only the city is shared — never your exact location.
        </p>
        <div className="mt-4 grid gap-4 sm:grid-cols-3">
          <div className="grid gap-2">
            <Label htmlFor="city">City</Label>
            <select id="city" className={selectClass} value={presence.cityCode} onChange={(e) => setPresence({ cityCode: e.target.value })}>
              {CITIES.map((c) => (
                <option key={c.code} value={c.code}>
                  {c.flag} {c.name}
                </option>
              ))}
            </select>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="status">Status</Label>
            <select
              id="status"
              className={selectClass}
              value={presence.status}
              onChange={(e) => setPresence({ status: e.target.value as DadPresence["status"] })}
            >
              {Object.entries(PRESENCE_STATUS).map(([value, s]) => (
                <option key={value} value={value}>
                  {s.emoji} {s.label.replace("Dad is ", "")}
                </option>
              ))}
            </select>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="weather">Weather</Label>
            <select
              id="weather"
              className={selectClass}
              value={presence.weather.label}
              onChange={(e) => setPresence({ weather: WEATHER.find((w) => w.label === e.target.value)! })}
            >
              {WEATHER.map((w) => (
                <option key={w.label} value={w.label}>
                  {w.emoji} {w.label}
                </option>
              ))}
            </select>
          </div>
        </div>
        <p className="mt-3 text-sm font-semibold">
          Now showing: {CITY_BY_CODE[presence.cityCode].flag} {CITY_BY_CODE[presence.cityCode].name} ·{" "}
          {PRESENCE_STATUS[presence.status].label}
        </p>
      </section>

      <form
        className="mt-4 rounded-3xl bg-card p-6"
        onSubmit={(e) => {
          e.preventDefault();
          if (!text.trim()) return;
          sendDadMessage(to, text.trim());
          setText("");
          setSent(true);
          setTimeout(() => setSent(false), 2500);
        }}
      >
        <h2 className="text-xl font-extrabold">Leave a message 💌</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Written by you, read aloud in your voice. Dad AI never makes up messages on your behalf.
        </p>
        <div className="mt-4 grid gap-2">
          <Label htmlFor="to">For</Label>
          <select id="to" className={selectClass} value={to} onChange={(e) => setTo(e.target.value)}>
            {kids.map((k) => (
              <option key={k.id} value={k.id}>
                {k.nickname}
              </option>
            ))}
          </select>
        </div>
        <div className="mt-4 grid gap-2">
          <Label htmlFor="msg">Message</Label>
          <Textarea id="msg" value={text} maxLength={500} onChange={(e) => setText(e.target.value)} placeholder="Hi buddy, today I saw…" />
        </div>
        <Button type="submit" className="mt-4" disabled={!text.trim()}>
          <Send /> Send
        </Button>
        {sent && <p className="mt-3 font-bold text-success">Sent! It&apos;s waiting on their &ldquo;Where&apos;s Dad&rdquo; page.</p>}
      </form>

      <section className="mt-4 rounded-3xl bg-card p-6">
        <h2 className="text-xl font-extrabold">Screen time</h2>
        <p className="mt-1 text-muted-foreground">Daily limit: 30 minutes · Allowed 07:00–21:00</p>
        <p className="mt-1 text-xs text-muted-foreground">Editable once accounts are connected.</p>
      </section>

      <section className="mt-4 rounded-3xl border-2 border-dashed p-6">
        <h2 className="text-lg font-extrabold">Demo data</h2>
        <p className="mt-1 text-sm text-muted-foreground">Everything here is sample data saved in this browser.</p>
        <Button variant="outline" className="mt-3" onClick={resetDemo}>
          Reset demo
        </Button>
      </section>
    </div>
  );
}
