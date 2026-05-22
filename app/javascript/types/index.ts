import { UserType } from "./user"

export type FlashData = {
  notice?: string
  alert?: string
}

export type SharedProps = {
  auth?: {
    user: UserType
  }
}
