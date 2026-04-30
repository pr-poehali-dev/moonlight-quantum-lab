import { icons, type LucideProps } from "lucide-react"

interface IconProps extends LucideProps {
  name: string
  fallback?: string
}

const Icon = ({ name, fallback = "CircleAlert", ...props }: IconProps) => {
  const LucideIcon = (icons as Record<string, React.FC<LucideProps>>)[name] || (icons as Record<string, React.FC<LucideProps>>)[fallback]
  if (!LucideIcon) return null
  return <LucideIcon {...props} />
}

export default Icon
