export const LookupController = {
    GetCountries: 'api/Lookup/Countries',
    GetCitiesByCountryId: (id: any) => `api/Lookup/countries/${id}/Cities`

}
