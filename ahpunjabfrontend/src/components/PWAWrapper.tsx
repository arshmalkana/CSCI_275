export default function PWAWrapper({ children }: { children: React.ReactNode }) {
  return <div className="h-full w-full safe-top">{children}</div>
}
