import { useState } from 'react';
import { HiStar } from 'react-icons/hi';

const StarRating = ({ rating = 0, onRate, readonly = false, size = 20 }) => {
  const [hoverRating, setHoverRating] = useState(0);

  const currentDisplayRating = hoverRating || rating;

  return (
    <div
      className="stars-container"
      role={readonly ? 'img' : 'radiogroup'}
      aria-label={`Rating: ${rating} out of 5 stars`}
      onMouseLeave={() => !readonly && setHoverRating(0)}
    >
      {[1, 2, 3, 4, 5].map((star) => {
        const isFilled = star <= currentDisplayRating;
        return (
          <button
            key={star}
            type="button"
            className={`star-btn ${isFilled ? 'filled' : ''}`}
            disabled={readonly}
            onClick={() => !readonly && onRate && onRate(star)}
            onMouseEnter={() => !readonly && setHoverRating(star)}
            onFocus={() => !readonly && setHoverRating(star)}
            onBlur={() => !readonly && setHoverRating(0)}
            aria-label={`${star} star${star > 1 ? 's' : ''}`}
            aria-checked={star === rating}
            role={readonly ? 'presentation' : 'radio'}
            style={{ fontSize: size }}
          >
            <HiStar />
          </button>
        );
      })}
    </div>
  );
};

export default StarRating;
