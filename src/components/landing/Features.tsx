import { ArrowUpRight, BookOpen, Heart, Search } from "lucide-react";

const features = [
  {
    icon: BookOpen,
    title: "One place for your recipes",
    detail: "Save a recipe from a website or write your own. Ingredients, steps and the original source stay together.",
  },
  {
    icon: Search,
    title: "Find it when you need it",
    detail: "Search your library, browse collections and tags, and keep the recipes you repeat close at hand.",
  },
  {
    icon: Heart,
    title: "Cook from a clear page",
    detail: "Open the ingredients and steps on your phone or laptop, with a focused cooking view when you’re ready.",
  },
];

export default function Features() {
  return (
    <section id="features" className="scroll-mt-20 border-b border-border bg-card px-5 py-20 sm:px-8 sm:py-28">
      <div className="mx-auto max-w-6xl">
        <div className="grid gap-5 md:grid-cols-[minmax(0,1fr)_minmax(0,.9fr)] md:gap-16">
          <h2 className="font-display text-balance text-4xl leading-[1.12] tracking-[-0.025em] text-foreground sm:text-5xl">From a good find to a recipe you’ll use again.</h2>
          <p className="max-w-md text-lg leading-8 text-muted-foreground md:pt-2">Keep &amp; Cook gives a recipe a useful home, with the original creator’s link always in reach.</p>
        </div>
        <div className="mt-14 grid border-t border-border md:grid-cols-3">
          {features.map(({ icon: Icon, title, detail }) => (
            <div key={title} className="border-b border-border py-8 md:border-b-0 md:border-r md:px-8 md:first:pl-0 md:last:border-r-0 md:last:pr-0">
              <Icon className="text-primary" size={26} strokeWidth={1.5} aria-hidden="true" />
              <h3 className="mt-6 font-display text-2xl text-foreground">{title}</h3>
              <p className="mt-3 max-w-sm leading-7 text-muted-foreground">{detail}</p>
            </div>
          ))}
        </div>
        <a href="#extension" className="mt-10 inline-flex min-h-11 items-center gap-2 font-semibold text-primary underline-offset-4 hover:underline">
          See the Chrome extension <ArrowUpRight aria-hidden="true" size={18} />
        </a>
      </div>
    </section>
  );
}
