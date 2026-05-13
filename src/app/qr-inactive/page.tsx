export default function QRInactivePage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--bg)] px-4">
      <div className="max-w-sm text-center">
        <div className="mb-4 text-5xl">⏸</div>
        <h1 className="text-xl font-bold text-[var(--text)] mb-2">QR Code Paused</h1>
        <p className="text-sm text-[var(--muted2)]">
          This QR code has been temporarily deactivated by its owner.
        </p>
      </div>
    </div>
  )
}
