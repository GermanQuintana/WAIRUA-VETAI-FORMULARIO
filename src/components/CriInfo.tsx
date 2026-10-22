import { useId, useState } from 'react';

/** Supplementary help: hover, keyboard focus, or tap. Clinical warnings stay visible. */
export default function CriInfo({ label, text }: { label: string; text: string }) {
  const id = useId();
  const [open, setOpen] = useState(false);
  const [offset, setOffset] = useState(0);
  const place = (element: HTMLElement) => {
    const rect = element.getBoundingClientRect();
    const width = Math.min(280, window.innerWidth - 70);
    setOffset(Math.min(Math.max(12, rect.left), window.innerWidth - width - 12) - rect.left);
    setOpen(true);
  };
  return (
    <span className="cri-info" onMouseEnter={(event) => {
      place(event.currentTarget);
    }} onMouseLeave={() => setOpen(false)}>
      <button type="button" className="cri-info-trigger" aria-label={label} aria-describedby={open ? id : undefined}
        onFocus={(event) => {
          place(event.currentTarget.parentElement!);
        }} onBlur={() => setOpen(false)} onClick={() => setOpen(true)} onKeyDown={(event) => {
          if (event.key === 'Escape') { setOpen(false); event.stopPropagation(); }
        }}>i</button>
      {open && <span role="tooltip" id={id} className="cri-info-tip" style={{ left: offset }}>{text}</span>}
    </span>
  );
}
