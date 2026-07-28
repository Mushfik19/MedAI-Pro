export interface ResponseMeta {
  request_id: string
}

export interface CursorMeta extends ResponseMeta {
  next_cursor: string | null
  has_more: boolean
}

export interface ApiEnvelope<TData> {
  data: TData
  meta: ResponseMeta
}

export interface ApiCollectionEnvelope<TData> {
  data: readonly TData[]
  meta: CursorMeta
}
