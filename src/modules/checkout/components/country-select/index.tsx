"use client"

import { HttpTypes } from "@medusajs/types"
import { forwardRef } from "react"
import { Label } from "@medusajs/ui"
import NativeSelect, {
  NativeSelectProps,
} from "@modules/common/components/native-select"

type CountrySelectProps = Omit<NativeSelectProps, "placeholder"> & {
  region?: HttpTypes.StoreRegion
  placeholder?: string
}

const CountrySelect = forwardRef<HTMLSelectElement, CountrySelectProps>(
  (
    {
      placeholder = "Country",
      region,
      defaultValue,
      className,
      name,
      autoComplete,
      required,
      ...props
    },
    ref
  ) => {
    return (
      <div className="flex flex-col w-full">
        <Label htmlFor={name} className="mb-2 text-ui-fg-base">
          Country
          {required && <span className="text-rose-500">*</span>}
        </Label>
        <NativeSelect
          ref={ref}
          name={name}
          id={name}
          required={required}
          autoComplete={autoComplete}
          placeholder="Select a country"
          className={className}
          defaultValue={defaultValue}
          {...props}
        >
          {region?.countries?.map((country) => (
            <option key={country.iso_2} value={country.iso_2}>
              {country.display_name}
            </option>
          ))}
        </NativeSelect>
      </div>
    )
  }
)

CountrySelect.displayName = "CountrySelect"

export default CountrySelect
