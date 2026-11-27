import { Fragment } from 'react';

/**
 * Strips `**bold**` markers for clean aria-label / plain-text usage.
 */
export function stripBoldMarkers(text: string): string {
  return text.replace(/\*\*(.*?)\*\*/g, '$1');
}

/**
 * Renders inline `**bold**` segments as semantic <strong> elements
 * without inventing HTML or using dangerouslySetInnerHTML.
 */
export function RichText({ text }: { text: string }) {
  const parts = text.split(/(\*\*.*?\*\*)/g);
  return (
    <>
      {parts.map((part, i) => {
        if (part.startsWith('**') && part.endsWith('**')) {
          return (
            <strong key={i} className="font-semibold text-[#efe8dc]">
              {part.slice(2, -2)}
            </strong>
          );
        }
        return <Fragment key={i}>{part}</Fragment>;
      })}
    </>
  );
}
