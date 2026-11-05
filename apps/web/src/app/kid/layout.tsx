import { KidShell } from "@/components/kid/kid-shell";

export default function KidLayout({ children }: { children: React.ReactNode }) {
  return <KidShell>{children}</KidShell>;
}
