export class ReviewsController {
    static readonly AddReview = 'api/Reviews';
    static readonly GetProductReviews = (productId: string) => `api/Reviews/product/${productId}`;
    static readonly UpdateReview = (reviewId: string) => `api/Reviews/${reviewId}`;
    static readonly DeleteReview = (reviewId: string) => `api/Reviews/${reviewId}`;
}
