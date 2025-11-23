export const CategoryController = {
    GetCategories: 'api/categories',
    CreateCategory: 'api/categories',
    GetCategoryId: (id: any) => `api/categories/${id}`,
    Update: 'api/categories',
    Delete: (id: any) => `api/categories/${id}`

}
