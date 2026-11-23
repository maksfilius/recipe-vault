import Link from "next/link";
import { ArrowRight, Link2, PanelRightOpen, PencilLine } from "lucide-react";

const ways = [
  {
    icon: Link2,
    title: "Paste a recipe link",
    detail: "Drop a link into the box above or into your library. Keep & Cook reads the ingredients and steps and keeps the link to the original.",
    href: "/#try-it",
    action: "Try a link",
  },
  {
    icon: PanelRightOpen,
    title: "Save from Chrome",
    detail: "On a recipe page, click the Keep & Cook icon. Read and cook right there, and save the recipe when it’s a keeper.",
    href: "/chrome-extension",
    action: "How the extension works",
  },
  {
    icon: PencilLine,
    title: "Write it down yourself",
    detail: "Add family recipes by hand, with ingredients, steps, a photo and where it came from.",
    href: "/login?next=%2Fdashboard%3Fadd%3Dmanual",
    action: "Add a recipe",
  },
] as const;

export default function WaysToSave() {
  return (
    <section id="ways-to-save" aria-labelledby="ways-to-save-title" className="scroll-mt-20 border-b border-border bg-card px-5 py-20 sm:px-8 sm:py-28">
      <div className="mx-auto grid max-w-6xl gap-12 lg:grid-cols-[minmax(0,.8fr)_minmax(0,1.2fr)] lg:gap-20">
        <div>
          <h2 id="ways-to-save-title" className="font-display text-balance text-4xl leading-[1.12] tracking-[-0.025em] text-foreground sm:text-5xl">Three ways to fill your cookbook.</h2>
          <p className="mt-6 max-w-md text-lg leading-8 text-muted-foreground">Every recipe lands in the same private library, and you check it before it’s saved.</p>
        </div>
        <ul className="border-t border-border">
          {ways.map(({ icon: Icon, title, detail, href, action }) => (
            <li key={title} className="grid gap-x-6 gap-y-3 border-b border-border py-8 sm:grid-cols-[2.5rem_minmax(0,1fr)]">
              <Icon aria-hidden="true" className="text-primary" size={26} strokeWidth={1.5} />
              <div>
                <h3 className="font-display text-2xl text-foreground">{title}</h3>
                <p className="mt-2 max-w-[38rem] leading-7 text-muted-foreground">{detail}</p>
                <Link href={href} className="mt-3 inline-flex min-h-11 items-center gap-2 font-semibold text-primary underline-offset-4 hover:underline">
                  {action} <ArrowRight aria-hidden="true" size={18} />
                </Link>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
