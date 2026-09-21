"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import "./admin.css";

/**
 * Media admin.
 *
 * Uploads go to /api/upload (a Pages Function backed by the MEDIA KV
 * namespace) and come back as /api/file/<key> URLs that can be used anywhere on
 * the site. The token is kept in localStorage on this device only — it is
 * compared server-side against the ADMIN_TOKEN variable, so a wrong token gets
 * 401 rather than access.
 */

type MediaFile = {
  key: string;
  name: string;
  type: string;
  size: number;
  uploaded: string | null;
  url: string;
};

const TOKEN_KEY = "portfolio-admin-token";

function humanSize(bytes: number) {
  if (!bytes) return "0 B";
  const units = ["B", "KB", "MB", "GB"];
  const i = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  return `${(bytes / Math.pow(1024, i)).toFixed(i === 0 ? 0 : 1)} ${units[i]}`;
}

function extensionOf(name: string) {
  const m = /\.([a-z0-9]+)$/i.exec(name);
  return m ? m[1].toUpperCase() : "FILE";
}

export default function AdminPage() {
  const [token, setToken] = useState("");
  const [files, setFiles] = useState<MediaFile[]>([]);
  const [status, setStatus] = useState("");
  const [isError, setIsError] = useState(false);
  const [busy, setBusy] = useState(false);
  const [over, setOver] = useState(false);
  const [query, setQuery] = useState("");
  const inputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    try {
      setToken(window.localStorage.getItem(TOKEN_KEY) || "");
    } catch {
      /* storage blocked: the field just starts empty */
    }
  }, []);

  const say = useCallback((message: string, error = false) => {
    setStatus(message);
    setIsError(error);
  }, []);

  const refresh = useCallback(
    async (withToken?: string) => {
      const t = withToken ?? token;
      try {
        const res = await fetch("/api/list", {
          headers: t ? { "x-admin-token": t } : undefined,
        });
        const data = await res.json();
        if (!res.ok) {
          say(data.error || `could not list (${res.status})`, true);
          return;
        }
        setFiles(data.files || []);
        say(`${data.count} file${data.count === 1 ? "" : "s"} stored`);
      } catch {
        say("could not reach the API — is this running on Cloudflare Pages?", true);
      }
    },
    [token, say]
  );

  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const saveToken = useCallback(() => {
    try {
      window.localStorage.setItem(TOKEN_KEY, token);
    } catch {
      /* not fatal: uploads still work for this session */
    }
    say("key saved on this device");
    refresh(token);
  }, [token, say, refresh]);

  const upload = useCallback(
    async (list: FileList | File[] | null) => {
      const chosen = list ? Array.from(list) : [];
      if (!chosen.length) return;
      if (!token) {
        say("enter your admin key first", true);
        return;
      }
      setBusy(true);
      let done = 0;
      const failures: string[] = [];
      for (const file of chosen) {
        say(`uploading ${file.name} …`);
        const body = new FormData();
        body.append("file", file);
        try {
          const res = await fetch("/api/upload", {
            method: "POST",
            headers: { "x-admin-token": token },
            body,
          });
          const data = await res.json();
          if (res.ok) done++;
          else failures.push(`${file.name}: ${data.error || res.status}`);
        } catch {
          failures.push(`${file.name}: network error`);
        }
      }
      setBusy(false);
      if (failures.length) say(`uploaded ${done}, failed ${failures.length}\n${failures.join("\n")}`, true);
      else say(`uploaded ${done} file${done === 1 ? "" : "s"}`);
      refresh();
    },
    [token, say, refresh]
  );

  const remove = useCallback(
    async (file: MediaFile) => {
      if (!window.confirm(`Delete ${file.name}? This cannot be undone.`)) return;
      try {
        const res = await fetch("/api/delete", {
          method: "POST",
          headers: { "x-admin-token": token, "content-type": "application/json" },
          body: JSON.stringify({ key: file.key }),
        });
        const data = await res.json();
        if (!res.ok) say(data.error || "delete failed", true);
        else say(`deleted ${file.name}`);
      } catch {
        say("delete failed", true);
      }
      refresh();
    },
    [token, say, refresh]
  );

  const copy = useCallback(
    async (file: MediaFile) => {
      const url = `${window.location.origin}${file.url}`;
      try {
        await navigator.clipboard.writeText(url);
        say(`copied ${url}`);
      } catch {
        say(url);
      }
    },
    [say]
  );

  const shown = query
    ? files.filter((f) => f.name.toLowerCase().includes(query.toLowerCase()))
    : files;

  const totalBytes = files.reduce((sum, f) => sum + (f.size || 0), 0);

  return (
    <main className="adm">
      <div className="adm-wrap">
        <h1>Media admin</h1>
        <p className="sub">
          Upload images, documents and files. Each one lands at{" "}
          <code>/api/file/&lt;name&gt;</code> and can be linked from anywhere on the
          site. Storage: <code>{humanSize(totalBytes)}</code> in {files.length} file
          {files.length === 1 ? "" : "s"}.
        </p>

        <section className="adm-card">
          <div className="adm-row">
            <input
              type="password"
              value={token}
              placeholder="admin key"
              aria-label="admin key"
              onChange={(e) => setToken(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") saveToken();
              }}
            />
            <button type="button" className="primary" onClick={saveToken}>
              Save key
            </button>
            <button type="button" onClick={() => refresh()} disabled={busy}>
              Refresh
            </button>
          </div>
          <p className="hint">
            The key is the <b>ADMIN_TOKEN</b> value set on the Cloudflare Pages
            project. It is stored in this browser only and checked on the server for
            every upload and delete.
          </p>
        </section>

        <section
          className={`adm-card drop ${over ? "over" : ""}`}
          onClick={() => inputRef.current?.click()}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") inputRef.current?.click();
          }}
          role="button"
          tabIndex={0}
          onDragOver={(e) => {
            e.preventDefault();
            setOver(true);
          }}
          onDragLeave={() => setOver(false)}
          onDrop={(e) => {
            e.preventDefault();
            setOver(false);
            upload(e.dataTransfer.files);
          }}
        >
          <strong>{busy ? "Uploading…" : "Drop files here, or click to choose"}</strong>
          <span>Images, PDFs, certificates, archives — anything up to 24 MB each</span>
          <input
            ref={inputRef}
            type="file"
            multiple
            hidden
            onChange={(e) => {
              upload(e.target.files);
              e.target.value = "";
            }}
          />
        </section>

        <div className={`status ${isError ? "error" : ""}`} role="status" aria-live="polite">
          {status}
        </div>

        <section className="adm-card" style={{ marginTop: 18 }}>
          <div className="adm-row" style={{ marginBottom: 14 }}>
            <input
              type="search"
              value={query}
              placeholder="filter by name"
              aria-label="filter uploads"
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>

          {shown.length === 0 ? (
            <p className="empty">
              {files.length === 0
                ? "Nothing uploaded yet."
                : "No file matches that filter."}
            </p>
          ) : (
            <div className="grid">
              {shown.map((file) => (
                <div className="file" key={file.key}>
                  <div className="thumb">
                    {file.type.startsWith("image/") ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={file.url} alt={file.name} loading="lazy" />
                    ) : (
                      <span className="ext">{extensionOf(file.name)}</span>
                    )}
                  </div>
                  <div className="meta">
                    <div className="fname" title={file.name}>
                      {file.name}
                    </div>
                    <div className="fsize">{humanSize(file.size)}</div>
                    <div className="actions">
                      <button type="button" onClick={() => copy(file)}>
                        Copy URL
                      </button>
                      <button
                        type="button"
                        className="danger"
                        onClick={() => remove(file)}
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
