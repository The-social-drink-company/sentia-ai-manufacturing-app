import { UserButton, useUser } from '@clerk/clerk-react'

const UserProfile = () => {
  const { user, isLoaded } = useUser()

  if (!isLoaded) {
    return <div className="h-8 w-8 animate-pulse rounded-full bg-gray-300" />
  }

  return (
    <div className="flex items-center gap-3">
      <div className="hidden text-right md:block">
        <p className="text-sm font-medium text-gray-900">
          {user?.fullName || user?.primaryEmailAddress?.emailAddress}
        </p>
        <p className="text-xs text-gray-500">Enterprise</p>
      </div>
      <UserButton
        appearance={{
          elements: {
            avatarBox: 'w-10 h-10',
          },
        }}
        afterSignOutUrl="/"
      />
    </div>
  )
}

export default UserProfile
