"use client";

type TopRightButtonsProps = {
  onSelectRoom?: () => void;
  onProductInfo?: () => void;
  className?: string;
};

export default function TopRightButtons({
  onSelectRoom,
  onProductInfo,
  className,
}: TopRightButtonsProps) {
  return (
    <div className={className ?? "top-right"}>
      <button className="tr-btn" onClick={onSelectRoom}>
        <span className="tr-btn-icon fa fa-th-large" aria-hidden="true"></span>
        <span className="tr-btn-label">Select Room</span>
      </button>
      <button className="tr-btn" onClick={onProductInfo}>
        <span className="tr-btn-icon fa fa-info-circle" aria-hidden="true"></span>
        <span className="tr-btn-label">Product Info</span>
      </button>
    </div>
  );
}
