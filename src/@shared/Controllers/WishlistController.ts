export const WishlistController = {
    GetWishlistItems: 'api/wishlist',
    AddToWishlist: 'api/wishlist',
    RemoveFromWishlist: (id: any) => `api/wishlist/${id}`,

}
