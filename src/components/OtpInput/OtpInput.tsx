import { useRef, ClipboardEvent } from 'react'
import './OtpInput.css'

interface Props {
  value: string
  onChange: (val: string) => void
  length?: number
}

export default function OtpInput({ value, onChange, length = 6 }: Props) {
  const refs = useRef<(HTMLInputElement | null)[]>([])
  const digits = value.padEnd(length, ' ').split('').slice(0, length)

  const handleChange = (i: number, ch: string) => {
    const d = ch.replace(/\D/g, '').slice(-1)
    const arr = digits.map(x => x.trim() ? x : '')
    arr[i] = d
    onChange(arr.join(''))
    if (d && i < length - 1) refs.current[i + 1]?.focus()
  }

  const handleKeyDown = (i: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !digits[i].trim() && i > 0) {
      refs.current[i - 1]?.focus()
    }
  }

  const handlePaste = (e: ClipboardEvent) => {
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, length)
    onChange(pasted)
    refs.current[Math.min(pasted.length, length - 1)]?.focus()
    e.preventDefault()
  }

  return (
    <div className="otp-input" onPaste={handlePaste}>
      {Array.from({ length }).map((_, i) => (
        <input
          key={i}
          ref={el => (refs.current[i] = el)}
          type="text"
          inputMode="numeric"
          maxLength={1}
          value={digits[i].trim()}
          onChange={e => handleChange(i, e.target.value)}
          onKeyDown={e => handleKeyDown(i, e)}
          className="otp-input__box"
        />
      ))}
    </div>
  )
}
