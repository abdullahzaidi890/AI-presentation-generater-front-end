import { bgCss } from '../themes'
import type { Slide, Theme } from '../types/schema'

/** Renders one 16:9 slide. Sizes use container units (cqw) so the same markup works for thumbnails and big previews. */
export function SlideView({ slide, theme, className = '', footer }: { slide: Slide; theme: Theme; className?: string; footer?: string }) {
  const b = slide.bullets
  const half = Math.ceil(b.length / 2)
  const bulletList = (items: string[], size: number) => (
    <ul style={{ fontSize: `${size}cqw`, color: theme.text, fontFamily: theme.font_body }} className="space-y-[1.2cqw]">
      {items.map((t, i) => (
        <li key={i} className="flex gap-[1.2cqw]">
          <span style={{ color: theme.accent }} aria-hidden="true">•</span>
          <span>{t}</span>
        </li>
      ))}
    </ul>
  )
  const heading = (size: number, center = false) => (
    <h3 style={{ fontSize: `${size}cqw`, color: theme.title, fontFamily: theme.font_heading }} className={`font-bold leading-tight ${center ? 'text-center' : ''}`}>
      {slide.title || 'Untitled'}
    </h3>
  )
  const bar = <div style={{ background: theme.accent }} className="my-[1.6cqw] h-[0.5cqw] w-[8cqw]" />

  let body
  if (slide.layout === 'title' || slide.layout === 'closing') {
    body = (
      <div className="flex h-full flex-col items-center justify-center text-center">
        {heading(5.2, true)}
        <div style={{ background: theme.accent }} className="my-[2cqw] h-[0.5cqw] w-[8cqw]" />
        {slide.layout === 'closing' && b.length > 1 ? bulletList(b, 2.2) : (
          <p style={{ fontSize: '2.4cqw', color: theme.text, fontFamily: theme.font_body }}>{b[0]}</p>
        )}
      </div>
    )
  } else if (slide.layout === 'quote') {
    body = (
      <div>
        {heading(3)}
        <blockquote style={{ color: theme.accent, fontFamily: theme.font_body }} className="mt-[6cqw] px-[4cqw] text-[3.4cqw] italic">“{b[0] ?? ''}”</blockquote>
        {b[1] && <p style={{ color: theme.muted, fontFamily: theme.font_body }} className="mt-[3cqw] px-[4cqw] text-[2.2cqw]">— {b[1]}</p>}
      </div>
    )
  } else if (slide.layout === 'two_column') {
    body = (<div>{heading(3.8)}{bar}<div className="grid grid-cols-2 gap-[4cqw]">{bulletList(b.slice(0, half), 2.2)}{bulletList(b.slice(half), 2.2)}</div></div>)
  } else if (slide.layout === 'chart') {
    body = (
      <div>
        {heading(3.8)}{bar}
        <div className="grid grid-cols-2 gap-[4cqw]">
          {bulletList(b, 2.2)}
          <div style={{ borderColor: theme.accent, color: theme.muted, fontFamily: theme.font_body }} className="flex h-[26cqw] items-center justify-center rounded-[1.5cqw] border-[0.25cqw] p-[2cqw] text-center text-[1.8cqw] italic">
            Suggested visual: {slide.visual_suggestion || 'chart or diagram'}
          </div>
        </div>
      </div>
    )
  } else {
    body = (<div>{heading(3.8)}{bar}{bulletList(b, 2.6)}</div>)
  }
  return (
    <div style={{ containerType: 'inline-size' }} className={className}>
      <div style={{ background: bgCss(theme), aspectRatio: '16 / 9', padding: '5cqw 6cqw', position: 'relative' }} className="overflow-hidden rounded-lg">
        {body}
        {footer && <span style={{ position: 'absolute', left: '6cqw', bottom: '1.8cqw', fontSize: '1.3cqw', color: theme.muted, fontFamily: theme.font_body }}>{footer}</span>}
      </div>
    </div>
  )
}
