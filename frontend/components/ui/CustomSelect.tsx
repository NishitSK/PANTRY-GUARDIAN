'use client'
import React, { useState, useRef, useEffect } from 'react'
import { ChevronDown, Check } from 'lucide-react'

export interface SelectOption {
  label: string
  value: string
  icon?: React.ReactNode
}

interface CustomSelectProps {
  options: SelectOption[]
  value: string
  onChange: (value: string) => void
  placeholder?: string
  disabled?: boolean
  className?: string
}

export default function CustomSelect({
  options,
  value,
  onChange,
  placeholder = 'Select an option',
  disabled = false,
  className = ''
}: CustomSelectProps) {
  const [isOpen, setIsOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  const selectedOption = options.find(opt => opt.value === value)

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  const handleSelect = (optionValue: string) => {
    onChange(optionValue)
    setIsOpen(false)
  }

  return (
    <div className={`relative ${className}`} ref={containerRef}>
      <button
        type="button"
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        className={`
          w-full h-full flex items-center justify-between px-5 py-3 text-left
          border rounded-2xl transition-all duration-200
          focus:outline-none focus:ring-2 focus:ring-primary/20
          ${disabled 
            ? 'bg-muted/50 text-muted-foreground cursor-not-allowed border-transparent' 
            : 'bg-muted/30 hover:bg-muted/50 text-foreground border-transparent hover:border-primary/20'
          }
          ${isOpen ? 'ring-2 ring-primary/20 border-primary/30 bg-background' : ''}
        `}
      >
        <span className="flex items-center gap-2 truncate">
          {selectedOption ? (
            <>
              {selectedOption.icon && <span className="text-primary">{selectedOption.icon}</span>}
              <span className="font-medium">{selectedOption.label}</span>
            </>
          ) : (
            <span className="text-muted-foreground">{placeholder}</span>
          )}
        </span>
        <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform duration-200 ${isOpen ? 'transform rotate-180 text-primary' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute z-50 w-full mt-2 bg-card border border-border/50 rounded-2xl shadow-xl shadow-black/10 max-h-60 overflow-auto py-2 animate-in fade-in zoom-in-95 duration-100">
          {options.length === 0 ? (
            <div className="px-4 py-3 text-sm text-muted-foreground text-center">
              No options available
            </div>
          ) : (
            options.map((option) => {
              const isSelected = option.value === value
              return (
                <button
                  key={option.value}
                  type="button"
                  onClick={(e) => {
                    e.preventDefault()
                    e.stopPropagation()
                    const valToPass = option.value || (option as any)._id || ''
                    handleSelect(valToPass)
                  }}
                  className={`
                    w-full flex items-center justify-between px-4 py-2.5 text-sm text-left
                    transition-colors duration-150
                    ${isSelected
                      ? 'bg-primary/10 text-primary font-medium' 
                      : 'text-foreground hover:bg-muted/50'
                    }
                  `}
                >
                  <span className="flex items-center gap-3">
                    {option.icon && <span className={isSelected ? 'text-primary' : 'text-muted-foreground'}>{option.icon}</span>}
                    <span>{option.label}</span>
                  </span>
                  {isSelected && <Check className="w-4 h-4" />}
                </button>
              )
            })
          )}
        </div>
      )}
    </div>
  )
}
