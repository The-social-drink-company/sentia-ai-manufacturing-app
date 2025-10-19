/**
 * Organization Switcher Component
 *
 * Allows users to switch between organizations they belong to
 *
 * @module src/components/auth/OrganizationSwitcher
 */

import { Fragment } from 'react'
import { useOrganization, useOrganizationList, useUser } from '@clerk/clerk-react'
import { Menu, Transition } from '@headlessui/react'
import { ChevronDownIcon, PlusIcon, BuildingOfficeIcon } from '@heroicons/react/24/outline'
import { useNavigate } from 'react-router-dom'

export function OrganizationSwitcher() {
  const { organization } = useOrganization()
  const { organizationList, setActive } = useOrganizationList()
  const { user } = useUser()
  const navigate = useNavigate()

  if (!user) {
    return null
  }

  const handleOrganizationSwitch = async (orgId: string) => {
    if (setActive) {
      await setActive({ organization: orgId })
      // Optionally navigate to dashboard of the selected organization
      window.location.href = '/dashboard'
    }
  }

  const handleCreateOrganization = () => {
    // Navigate to onboarding flow
    navigate('/onboarding')
  }

  return (
    <Menu as="div" className="relative inline-block text-left">
      <div>
        <Menu.Button className="inline-flex w-full justify-between items-center gap-x-2 rounded-md bg-white px-4 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50">
          <div className="flex items-center gap-2">
            <BuildingOfficeIcon className="h-5 w-5 text-gray-400" />
            <span className="truncate max-w-[200px]">
              {organization?.name || 'Select Organization'}
            </span>
          </div>
          <ChevronDownIcon className="h-5 w-5 text-gray-400" aria-hidden="true" />
        </Menu.Button>
      </div>

      <Transition
        as={Fragment}
        enter="transition ease-out duration-100"
        enterFrom="transform opacity-0 scale-95"
        enterTo="transform opacity-100 scale-100"
        leave="transition ease-in duration-75"
        leaveFrom="transform opacity-100 scale-100"
        leaveTo="transform opacity-0 scale-95"
      >
        <Menu.Items className="absolute left-0 z-10 mt-2 w-72 origin-top-left rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
          <div className="py-1">
            {/* Current Organization */}
            {organization && (
              <div className="px-4 py-3 border-b border-gray-200">
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                  Current Organization
                </p>
                <div className="mt-2 flex items-center gap-2">
                  <div className="w-10 h-10 rounded-lg bg-blue-600 flex items-center justify-center text-white font-bold text-lg">
                    {organization.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-900">
                      {organization.name}
                    </p>
                    <p className="text-xs text-gray-500">
                      {organization.slug}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Other Organizations */}
            {organizationList && organizationList.length > 0 && (
              <div className="py-1">
                <p className="px-4 py-2 text-xs font-medium text-gray-500 uppercase tracking-wide">
                  Switch Organization
                </p>
                {organizationList
                  .filter(org => org.organization.id !== organization?.id)
                  .map((orgItem) => (
                    <Menu.Item key={orgItem.organization.id}>
                      {({ active }) => (
                        <button
                          onClick={() => handleOrganizationSwitch(orgItem.organization.id)}
                          className={`${
                            active ? 'bg-gray-100' : ''
                          } group flex w-full items-center gap-3 px-4 py-3 text-sm text-gray-700`}
                        >
                          <div className="w-8 h-8 rounded-lg bg-gray-200 flex items-center justify-center text-gray-600 font-semibold text-sm">
                            {orgItem.organization.name.charAt(0).toUpperCase()}
                          </div>
                          <div className="flex-1 text-left">
                            <p className="font-medium">{orgItem.organization.name}</p>
                            <p className="text-xs text-gray-500">{orgItem.organization.slug}</p>
                          </div>
                        </button>
                      )}
                    </Menu.Item>
                  ))}
              </div>
            )}

            {/* Create New Organization */}
            <div className="py-1 border-t border-gray-200">
              <Menu.Item>
                {({ active }) => (
                  <button
                    onClick={handleCreateOrganization}
                    className={`${
                      active ? 'bg-gray-100' : ''
                    } group flex w-full items-center gap-3 px-4 py-3 text-sm text-gray-700`}
                  >
                    <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center">
                      <PlusIcon className="h-5 w-5 text-blue-600" />
                    </div>
                    <span className="font-medium text-blue-600">
                      Create New Organization
                    </span>
                  </button>
                )}
              </Menu.Item>
            </div>
          </div>
        </Menu.Items>
      </Transition>
    </Menu>
  )
}
