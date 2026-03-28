import { ExternalLink, Github } from "lucide-react";
import licenseText from "../../../LICENSE?raw";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

const REPOSITORY_URL = "https://github.com/kristofer-hoch/data-fabric-entity-export-manager";

export function Header(): JSX.Element {
  return (
    <header className="border-b border-border/70 bg-white/95 backdrop-blur">
      <div className="mx-auto grid max-w-7xl grid-cols-2 items-center gap-4 px-4 py-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-start">
          <p className="text-left font-[Poppins] text-lg font-semibold tracking-tight text-[#182126]">
            Datafabric Entity Data Downloader
          </p>
        </div>

        <div className="flex items-center justify-end gap-2">
          <Button variant="outline" size="sm" asChild>
            <a href={REPOSITORY_URL} target="_blank" rel="noreferrer">
              <Github />
              GitHub
              <ExternalLink />
            </a>
          </Button>

          <Dialog>
            <DialogTrigger asChild>
              <Button variant="ghost" size="sm">
                License
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-3xl">
              <DialogHeader>
                <DialogTitle>License</DialogTitle>
                <DialogDescription>Contents of the repository LICENSE file.</DialogDescription>
              </DialogHeader>
              <div className="max-h-[65vh] overflow-auto rounded-lg border bg-muted/25 p-4">
                <pre className="whitespace-pre-wrap break-words font-mono text-xs leading-6 text-foreground">
                  {licenseText}
                </pre>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>
    </header>
  );
}
