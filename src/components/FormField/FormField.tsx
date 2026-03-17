import './FormField.css'

interface BaseProps {
  label: string
  required?: boolean
  error?: string
  helperText?: string
}

type InputProps    = BaseProps & { type?: 'text'|'email'|'tel'|'number'|'password' } & Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'>
type SelectProps   = BaseProps & { type: 'select'; options: {value:string;label:string}[] } & Omit<React.SelectHTMLAttributes<HTMLSelectElement>, 'type'>
type TextareaProps = BaseProps & { type: 'textarea'; rows?: number } & Omit<React.TextareaHTMLAttributes<HTMLTextAreaElement>, 'type'>
type CheckboxProps = BaseProps & { type: 'checkbox' } & Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'>

type Props = InputProps | SelectProps | TextareaProps | CheckboxProps

export default function FormField(props: Props) {
  const { label, required, error, helperText, type = 'text', ...rest } = props

  if (type === 'checkbox') {
    const inputRest = rest as Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'>
    return (
      <label className="form-checkbox">
        <input type="checkbox" {...inputRest} />
        <span>{label}{required && ' *'}</span>
        {error && <span className="form-field__error">{error}</span>}
      </label>
    )
  }

  return (
    <div className={`form-field${error ? ' form-field--error' : ''}`}>
      <label className="form-field__label">{label}{required && <span className="form-field__req"> *</span>}</label>
      {type === 'select' ? (
        <select className="form-field__input" {...(rest as React.SelectHTMLAttributes<HTMLSelectElement>)}>
          {(props as SelectProps).options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
      ) : type === 'textarea' ? (
        <textarea className="form-field__input" rows={(props as TextareaProps).rows || 4} {...(rest as React.TextareaHTMLAttributes<HTMLTextAreaElement>)} />
      ) : (
        <input type={type as string} className="form-field__input" {...(rest as React.InputHTMLAttributes<HTMLInputElement>)} />
      )}
      {helperText && !error && <p className="form-field__hint">{helperText}</p>}
      {error && <p className="form-field__error">{error}</p>}
    </div>
  )
}
