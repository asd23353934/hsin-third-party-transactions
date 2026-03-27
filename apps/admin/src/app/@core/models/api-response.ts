export interface APIResponse<T> {
  data: T
}

export interface APIPaginationResponse<T> {
  data: {
    data:  T
    total: number
    page:  number
    limit: number
  }
}
