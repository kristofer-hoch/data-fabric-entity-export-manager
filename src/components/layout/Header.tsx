import { ExternalLink, FileText, Github, Menu } from "lucide-react";
import licenseText from "../../../LICENSE?raw";
import packageJson from "../../../package.json";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const REPOSITORY_URL = "https://github.com/kristofer-hoch/data-fabric-entity-export-manager";

export function Header(): JSX.Element {
  const [isLicenseOpen, setIsLicenseOpen] = useState(false);

  return (
    <header className="border-b border-[#182126]/10 bg-white/90 backdrop-blur">
      <div className="mx-auto grid max-w-7xl grid-cols-2 items-center gap-4 px-4 py-5 sm:px-6 lg:px-8">
        <div className="flex items-center justify-start">
          <div className="space-y-1">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#fa4616]">UiPath Data Fabric</p>
            <p className="font-display text-lg font-semibold tracking-tight text-[#182126] sm:text-xl">Entity Export Manager</p>
          </div>
        </div>

        <div className="flex items-center justify-end gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <Menu />
                Menu
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56 rounded-2xl border-[#182126]/10 bg-white/95 p-2 shadow-soft">
              <DropdownMenuItem asChild className="rounded-xl">
                <a href={REPOSITORY_URL} target="_blank" rel="noreferrer">
                  <Github />
                  GitHub
                  <ExternalLink className="ml-auto" />
                </a>
              </DropdownMenuItem>
              <DropdownMenuItem className="rounded-xl" onSelect={(event) => {
                event.preventDefault();
                setIsLicenseOpen(true);
              }}>
                <FileText />
                License
              </DropdownMenuItem>
              <DropdownMenuSeparator className="bg-[#182126]/10" />
              <div className="px-2 py-2 text-xs text-muted-foreground">
                Version {packageJson.version}
              </div>
            </DropdownMenuContent>
          </DropdownMenu>

          <Dialog open={isLicenseOpen} onOpenChange={setIsLicenseOpen}>
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
