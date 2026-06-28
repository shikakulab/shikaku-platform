type StarRatingProps = {
  rating: number;
  max?: number;
  size?: "sm" | "md" | "lg";
  showValue?: boolean;
};

const sizeClasses = {
  sm: "text-sm",
  md: "text-lg",
  lg: "text-2xl",
};

export function StarRating({
  rating,
  max = 5,
  size = "md",
  showValue = false,
}: StarRatingProps) {
  const rounded = Math.round(rating * 10) / 10;

  return (
    <span className={`inline-flex items-center gap-1 ${sizeClasses[size]}`}>
      {showValue && (
        <span className="mr-1 font-bold text-[#f4c150]">{rounded.toFixed(1)}</span>
      )}
      {Array.from({ length: max }, (_, i) => {
        const filled = rating >= i + 1;
        const half = !filled && rating >= i + 0.5;
        return (
          <span
            key={i}
            className={
              filled || half ? "text-[#f4c150]" : "text-gray-300"
            }
            aria-hidden="true"
          >
            {filled ? "★" : half ? "★" : "☆"}
          </span>
        );
      })}
    </span>
  );
}
