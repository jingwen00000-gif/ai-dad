/**
 * 单文件在线版用的“迷你路由”：替代 next/link 和 next/navigation。
 * 路由记在内存里，同时同步到地址栏 #hash（只用字母、数字、连字符），
 * 例如 /kid/stories/dino-space ⇄ #kid--stories--dino-space。
 */
import * as React from "react";

type Listener = () => void;
const listeners = new Set<Listener>();

export function pathToName(path: string): string {
  return path.replace(/^\/+|\/+$/g, "").split("/").filter(Boolean).join("--");
}

export function nameToPath(name: string): string {
  return name ? "/" + name.split("--").join("/") : "/";
}

function readHash(): string {
  try {
    return nameToPath(decodeURIComponent(window.location.hash.slice(1)));
  } catch {
    return "/";
  }
}

let current = typeof window === "undefined" ? "/" : readHash();

function emit() {
  listeners.forEach((l) => l());
}

if (typeof window !== "undefined") {
  window.addEventListener("hashchange", () => {
    const next = readHash();
    if (next !== current) {
      current = next;
      emit();
      window.scrollTo(0, 0);
    }
  });
}

export function navigate(href: string) {
  const [path, anchor] = href.split("#");
  const target = path || current;
  const changed = target !== current;
  current = target;
  try {
    const name = pathToName(target);
    if (window.location.hash.slice(1) !== name) window.location.hash = name;
  } catch {
    // 地址栏不可写时只用内存路由
  }
  if (changed) emit();
  requestAnimationFrame(() => {
    if (anchor) document.getElementById(anchor)?.scrollIntoView({ behavior: "smooth", block: "start" });
    else if (changed) window.scrollTo(0, 0);
  });
}

export function usePathname(): string {
  return React.useSyncExternalStore(
    (cb) => {
      listeners.add(cb);
      return () => listeners.delete(cb);
    },
    () => current,
    () => "/",
  );
}

export function useRouter() {
  return { push: navigate, replace: navigate, back: () => history.back(), refresh: () => undefined };
}

export function useParams() {
  return {};
}

export function notFound(): never {
  throw new Error("notFound");
}

type LinkProps = Omit<React.AnchorHTMLAttributes<HTMLAnchorElement>, "href"> & { href: string };

const Link = React.forwardRef<HTMLAnchorElement, LinkProps>(function Link({ href, onClick, ...rest }, ref) {
  const [path, anchor] = href.split("#");
  const shown = "#" + (path ? pathToName(path) : anchor ?? "");
  return (
    <a
      ref={ref}
      href={shown}
      onClick={(e) => {
        onClick?.(e);
        if (e.defaultPrevented || e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;
        e.preventDefault();
        navigate(href);
      }}
      {...rest}
    />
  );
});

export default Link;
