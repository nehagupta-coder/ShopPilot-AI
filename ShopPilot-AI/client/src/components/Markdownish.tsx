export function Markdownish({ text }: { text: string }) {
  const blocks = text.split("\n");
  return (
    <div className="prose-chat space-y-1 text-[15px] leading-relaxed">
      {blocks.map((line, i) => {
        if (!line.trim()) return <div key={i} className="h-2" />;
        const html = line
          .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
          .replace(/^✓ /g, "<span class='text-forest-600'>✓</span> ");
        return <p key={i} dangerouslySetInnerHTML={{ __html: html }} />;
      })}
    </div>
  );
}
