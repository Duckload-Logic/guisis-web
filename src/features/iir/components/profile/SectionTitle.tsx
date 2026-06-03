export default function SectionTitle({ title }: { title: string }) {
  return (
    <div className="flex items-center gap-2">
      <div className="h-1 w-12 rounded-full bg-primary" />
      <h3 className="text-xs font-bold uppercase text-muted-foreground/80">
        {title}
      </h3>
    </div>
  );
}
