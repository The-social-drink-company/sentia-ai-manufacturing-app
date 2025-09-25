import React from 'react'
export default function UserButton() {
  return (
    <ClerkUserButton
      appearance={{
        elements: {
          avatarBox: "h-8 w-8",
        },
      }}
      showName={true}
      Url="/sign-in"
    />
  )
}
