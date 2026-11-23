import { ArrowRight } from "lucide-react";
import { Button } from "@/src/components/ui/button";
import { env } from "@/src/lib/env";

// The store link arrives through NEXT_PUBLIC_CHROME_EXTENSION_URL once the listing is public;
// until then the button stays visibly unavailable instead of pointing nowhere.
export default function AddToChrome() {
  if (env.chromeExtensionUrl) {
    return <Button asChild size="lg"><a href={env.chromeExtensionUrl} target="_blank" rel="noopener noreferrer">Add to Chrome <ArrowRight aria-hidden="true" /></a></Button>;
  }
  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
      <Button size="lg" disabled aria-describedby="add-to-chrome-status">Add to Chrome <ArrowRight aria-hidden="true" /></Button>
      <span id="add-to-chrome-status" className="text-sm text-muted-foreground">Coming soon to the Chrome Web Store.</span>
    </div>
  );
}
