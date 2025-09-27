import React, { useState } from 'react';
import {
  UserGroupIcon,
  PlusIcon,
  MagnifyingGlassIcon,
  PencilIcon,
  EyeIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  CalendarDaysIcon,
  BriefcaseIcon,
  AcademicCapIcon,
  ShieldCheckIcon,
  ExclamationTriangleIcon,
  ChartBarIcon,
  PhoneIcon,
  EnvelopeIcon,
  MapPinIcon
} from '@heroicons/react/24/outline';

export default function PersonnelManagement() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDepartment, setSelectedDepartment] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [selectedView, setSelectedView] = useState('list');

  const personnel = [
    {
      id: 'EMP-001',
      name: 'Sarah Johnson',
      position: 'Production Manager',
      department: 'Operations',
      email: 'sarah.johnson@sentia.com',
      phone: '+1 (555) 123-4567',
      location: 'Floor A',
      status: 'active',
      shift: 'Day Shift',
      hired: '2022-03-15',
      salary: '$75,000',
      performance: 94,
      certifications: ['Lean Manufacturing', 'Six Sigma Green Belt'],
      skills: ['Team Leadership', 'Process Optimization', 'Quality Control']
    },
    {
      id: 'EMP-002',
      name: 'Mike Chen',
      position: 'Quality Inspector',
      department: 'Quality',
      email: 'mike.chen@sentia.com',
      phone: '+1 (555) 234-5678',
      location: 'QC Lab',
      status: 'active',
      shift: 'Day Shift',
      hired: '2021-08-22',
      salary: '$58,000',
      performance: 97,
      certifications: ['ISO 9001', 'Statistical Process Control'],
      skills: ['Inspection', 'Data Analysis', 'Problem Solving']
    },
    {
      id: 'EMP-003',
      name: 'Emma Davis',
      position: 'Machine Operator',
      department: 'Production',
      email: 'emma.davis@sentia.com',
      phone: '+1 (555) 345-6789',
      location: 'Line 2',
      status: 'active',
      shift: 'Night Shift',
      hired: '2023-01-10',
      salary: '$45,000',
      performance: 89,
      certifications: ['Machine Safety', 'OSHA 10'],
      skills: ['Equipment Operation', 'Maintenance', 'Safety Protocols']
    },
    {
      id: 'EMP-004',
      name: 'Tom Wilson',
      position: 'Maintenance Technician',
      department: 'Maintenance',
      email: 'tom.wilson@sentia.com',
      phone: '+1 (555) 456-7890',
      location: 'Workshop',
      status: 'on_leave',
      shift: 'Day Shift',
      hired: '2020-05-18',
      salary: '$62,000',
      performance: 91,
      certifications: ['Electrical Safety', 'Hydraulics'],
      skills: ['Troubleshooting', 'Preventive Maintenance', 'Welding']
    },
    {
      id: 'EMP-005',
      name: 'Lisa Wang',
      position: 'Safety Coordinator',
      department: 'Safety',
      email: 'lisa.wang@sentia.com',
      phone: '+1 (555) 567-8901',
      location: 'Office B',
      status: 'active',
      shift: 'Day Shift',
      hired: '2019-11-30',
      salary: '$68,000',
      performance: 96,
      certifications: ['OSHA 30', 'Emergency Response'],
      skills: ['Risk Assessment', 'Training', 'Compliance']
    },
    {
      id: 'EMP-006',
      name: 'David Brown',
      position: 'Inventory Clerk',
      department: 'Logistics',
      email: 'david.brown@sentia.com',
      phone: '+1 (555) 678-9012',
      location: 'Warehouse',
      status: 'probation',
      shift: 'Evening Shift',
      hired: '2024-07-01',
      salary: '$38,000',
      performance: 78,
      certifications: ['Forklift Operation'],
      skills: ['Inventory Management', 'Data Entry', 'Organization']
    }
  ];

  const departments = ['Operations', 'Quality', 'Production', 'Maintenance', 'Safety', 'Logistics'];
  const statusOptions = ['active', 'on_leave', 'probation', 'terminated'];

  const filteredPersonnel = personnel.filter(person => {
    const matchesSearch = person.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         person.position.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         person.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesDepartment = selectedDepartment === 'all' || person.department === selectedDepartment;
    const matchesStatus = selectedStatus === 'all' || person.status === selectedStatus;
    return matchesSearch && matchesDepartment && matchesStatus;
  });

  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return 'text-green-600 bg-green-100';
      case 'on_leave': return 'text-blue-600 bg-blue-100';
      case 'probation': return 'text-yellow-600 bg-yellow-100';
      case 'terminated': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'active': return <CheckCircleIcon className="w-4 h-4" />;
      case 'on_leave': return <ClockIcon className="w-4 h-4" />;
      case 'probation': return <ExclamationTriangleIcon className="w-4 h-4" />;
      case 'terminated': return <XCircleIcon className="w-4 h-4" />;
      default: return <ClockIcon className="w-4 h-4" />;
    }
  };

  const getPerformanceColor = (score) => {
    if (score >= 95) return 'text-green-600';
    if (score >= 85) return 'text-blue-600';
    if (score >= 75) return 'text-yellow-600';
    return 'text-red-600';
  };

  const departmentStats = departments.map(dept => ({
    name: dept,
    count: personnel.filter(p => p.department === dept).length,
    active: personnel.filter(p => p.department === dept && p.status === 'active').length
  }));

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
      {/* Header */}
      <div className="p-6 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
              <UserGroupIcon className="w-6 h-6 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                Personnel Management
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Manage workforce, performance, and employee information
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <div className="flex rounded-lg border border-gray-300 dark:border-gray-600">
              <button
                onClick={() => setSelectedView('list')}
                className={`px-3 py-2 text-sm font-medium rounded-l-lg ${
                  selectedView === 'list'
                    ? 'bg-blue-600 text-white'
                    : 'bg-white text-gray-700 hover:bg-gray-50 dark:bg-gray-700 dark:text-gray-300'
                }`}
              >
                List View
              </button>
              <button
                onClick={() => setSelectedView('cards')}
                className={`px-3 py-2 text-sm font-medium rounded-r-lg border-l ${
                  selectedView === 'cards'
                    ? 'bg-blue-600 text-white border-blue-600'
                    : 'bg-white text-gray-700 hover:bg-gray-50 border-gray-300 dark:bg-gray-700 dark:text-gray-300 dark:border-gray-600'
                }`}
              >
                Card View
              </button>
            </div>
            <button className="bg-green-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-green-700 transition-colors flex items-center space-x-2">
              <PlusIcon className="w-4 h-4" />
              <span>Add Employee</span>
            </button>
          </div>
        </div>
      </div>

      <div className="p-6">
        {/* Filters and Search */}
        <div className="mb-6 flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0 lg:space-x-4">
          <div className="flex items-center space-x-4">
            <div className="relative">
              <MagnifyingGlassIcon className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search personnel..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              />
            </div>

            <select
              value={selectedDepartment}
              onChange={(e) => setSelectedDepartment(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            >
              <option value="all">All Departments</option>
              {departments.map(dept => (
                <option key={dept} value={dept}>{dept}</option>
              ))}
            </select>

            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            >
              <option value="all">All Status</option>
              {statusOptions.map(status => (
                <option key={status} value={status}>
                  {status.replace('', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-500">
              {filteredPersonnel.length} of {personnel.length} employees
            </span>
          </div>
        </div>

        {/* Department Statistics */}
        <div className="mb-8 grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {departmentStats.map((dept) => (
            <div key={dept.name} className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
              <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">{dept.name}</h4>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{dept.count}</p>
              <p className="text-xs text-gray-500">
                {dept.active} active, {dept.count - dept.active} other
              </p>
            </div>
          ))}
        </div>

        {/* Personnel List/Cards */}
        {selectedView === 'list' ? (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Employee
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Position & Department
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Performance
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Contact
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {filteredPersonnel.map((person) => (
                  <tr key={person.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10">
                          <div className="h-10 w-10 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                            <span className="text-sm font-medium text-green-600 dark:text-green-400">
                              {person.name.split(' ').map(n => n[0]).join('')}
                            </span>
                          </div>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900 dark:text-white">
                            {person.name}
                          </div>
                          <div className="text-sm text-gray-500">
                            {person.id} • {person.shift}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900 dark:text-white">{person.position}</div>
                      <div className="text-sm text-gray-500">{person.department}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(person.status)}`}>
                        {getStatusIcon(person.status)}
                        <span className="ml-1 capitalize">{person.status.replace('', ' ')}</span>
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <span className={`text-sm font-medium ${getPerformanceColor(person.performance)}`}>
                          {person.performance}%
                        </span>
                        <div className="ml-2 w-16 bg-gray-200 dark:bg-gray-600 rounded-full h-2">
                          <div
                            className={`h-2 rounded-full ${
                              person.performance >= 95 ? 'bg-green-500' :
                              person.performance >= 85 ? 'bg-blue-500' :
                              person.performance >= 75 ? 'bg-yellow-500' : 'bg-red-500'
                            }`}
                            style={{ width: `${person.performance}%` }}
                          ></div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <div className="flex items-center space-x-2 mb-1">
                        <EnvelopeIcon className="w-3 h-3" />
                        <span>{person.email}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <PhoneIcon className="w-3 h-3" />
                        <span>{person.phone}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex items-center space-x-2">
                        <button className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300">
                          <EyeIcon className="w-4 h-4" />
                        </button>
                        <button className="text-green-600 hover:text-green-900 dark:text-green-400 dark:hover:text-green-300">
                          <PencilIcon className="w-4 h-4" />
                        </button>
                        <button className="text-purple-600 hover:text-purple-900 dark:text-purple-400 dark:hover:text-purple-300">
                          <ChartBarIcon className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredPersonnel.map((person) => (
              <div key={person.id} className="bg-gray-50 dark:bg-gray-700 rounded-lg p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <div className="h-12 w-12 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                      <span className="text-lg font-medium text-green-600 dark:text-green-400">
                        {person.name.split(' ').map(n => n[0]).join('')}
                      </span>
                    </div>
                    <div>
                      <h3 className="font-medium text-gray-900 dark:text-white">{person.name}</h3>
                      <p className="text-sm text-gray-500">{person.id}</p>
                    </div>
                  </div>
                  <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(person.status)}`}>
                    {getStatusIcon(person.status)}
                    <span className="ml-1 capitalize">{person.status.replace('', ' ')}</span>
                  </span>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <BriefcaseIcon className="w-4 h-4 text-gray-400" />
                    <span className="text-sm text-gray-900 dark:text-white">{person.position}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <UserGroupIcon className="w-4 h-4 text-gray-400" />
                    <span className="text-sm text-gray-500">{person.department}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <MapPinIcon className="w-4 h-4 text-gray-400" />
                    <span className="text-sm text-gray-500">{person.location}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <ChartBarIcon className="w-4 h-4 text-gray-400" />
                    <span className={`text-sm font-medium ${getPerformanceColor(person.performance)}`}>
                      Performance: {person.performance}%
                    </span>
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-600">
                  <div className="flex items-center justify-between">
                    <div className="text-xs text-gray-500">
                      Hired: {person.hired}
                    </div>
                    <div className="flex space-x-2">
                      <button className="p-1 text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300">
                        <EyeIcon className="w-4 h-4" />
                      </button>
                      <button className="p-1 text-green-600 hover:text-green-800 dark:text-green-400 dark:hover:text-green-300">
                        <PencilIcon className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Quick Actions */}
        <div className="mt-8">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Personnel Actions
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { label: 'Performance Review', icon: ChartBarIcon, color: 'blue' },
              { label: 'Training Schedule', icon: AcademicCapIcon, color: 'green' },
              { label: 'Payroll Report', icon: BriefcaseIcon, color: 'purple' },
              { label: 'Safety Training', icon: ShieldCheckIcon, color: 'red' }
            ].map((action, _index) => (
              <button
                key={index}
                className={`flex items-center justify-center space-x-2 p-3 rounded-lg border-2 border-dashed border-${action.color}-200 hover:border-${action.color}-400 hover:bg-${action.color}-50 dark:hover:bg-${action.color}-900/20 transition-all duration-200`}
              >
                <action.icon className={`w-5 h-5 text-${action.color}-600`} />
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  {action.label}
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}