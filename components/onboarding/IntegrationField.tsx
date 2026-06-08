"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

interface IntegrationFieldProps {
  id: string;
  label: string;
  description?: string;
  value: string;
  onChange: (value: string) => void;
  type?: "text" | "password" | "email";
  placeholder?: string;
  multiline?: boolean;
}

export function IntegrationField({
  id,
  label,
  description,
  value,
  onChange,
  type = "text",
  placeholder,
  multiline = false,
}: IntegrationFieldProps) {
  return (
    <div className="space-y-2">
      <Label htmlFor={id} className="text-[#272b30]">
        {label}
      </Label>
      {description && (
        <p className="text-sm text-[#6a7178]">{description}</p>
      )}
      {multiline ? (
        <Textarea
          id={id}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          rows={4}
          className="border-[#dee2e6] bg-white focus-visible:border-[#5cb7f3] focus-visible:ring-[#5cb7f3]/20"
        />
      ) : (
        <Input
          id={id}
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="border-[#dee2e6] bg-white focus-visible:border-[#5cb7f3] focus-visible:ring-[#5cb7f3]/20"
        />
      )}
    </div>
  );
}
