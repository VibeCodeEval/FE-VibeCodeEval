type TopNavBarProps = {
  title?: string
}

export function TopNavBar({ title = "마스터 대시보드" }: TopNavBarProps) {
  return (
    <header
      className="sticky top-0 z-30 flex items-center justify-between px-6"
      style={{
        height: "80px",
        paddingTop: "20px",
        paddingBottom: "20px",
        backgroundColor: "#FFFFFF",
        borderBottom: "1px solid #E5E5E5",
      }}
    >
      {/* Left side - Title */}
      <h1
        className="font-semibold"
        style={{
          fontSize: "24px",
          fontWeight: 600,
          color: "#1A1A1A",
        }}
      >
        {title}
      </h1>

      {/* Right side - Profile Cluster */}
    </header>
  )
}
