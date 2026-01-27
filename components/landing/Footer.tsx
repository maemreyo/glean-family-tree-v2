export default function Footer() {
  return (
    <footer className="w-full border-t bg-background py-6">
      <div className="container flex flex-col items-center justify-between gap-4 md:h-16 md:flex-row md:py-0">
        <div className="flex flex-col items-center gap-4 px-8 md:flex-row md:gap-2 md:px-0">
          <p className="text-center text-sm leading-loose text-muted-foreground md:text-left">
            Built by{" "}
            <a
              href="https://github.com/maemreyo"
              target="_blank"
              rel="noreferrer"
              className="font-medium underline underline-offset-4"
            >
              zaob.ogn
            </a>
            .
          </p>
        </div>
      </div>
    </footer>
  );
}
