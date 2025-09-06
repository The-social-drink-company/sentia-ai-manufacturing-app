import { devLog } from '../../../lib/devLog.js';\nimport React, { useState, useEffect } from 'react'
import { 
  BuildingOfficeIcon,
  PlusIcon,
  PencilIcon,
  EyeIcon,
  GlobeAltIcon,
  BanknotesIcon
} from '@heroicons/react/24/outline'

function AdminEntities() {
  const [entities, setEntities] = useState([])
  const [loading, setLoading] = useState(true)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [selectedEntity, setSelectedEntity] = useState(null)

  useEffect(() => {
    fetchEntities()
  }, [])

  const fetchEntities = async () => {
    try {
      const response = await fetch('/api/admin/global/entities', {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('authToken')}` }
      })
      if (response.ok) {
        const data = await response.json()
        setEntities(data.entities || [])
      }
    } catch (error) {
      devLog.error('Failed to fetch entities:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleCreateEntity = async (entityData) => {
    try {
      const response = await fetch('/api/admin/entities', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        },
        body: JSON.stringify(entityData)
      })
      
      if (response.ok) {
        fetchEntities()
        setShowCreateModal(false)
      }
    } catch (error) {
      devLog.error('Failed to create entity:', error)
    }
  }

  if (loading) {
    return (
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center', 
        minHeight: '400px' 
      }}>
        <div>Loading entities...</div>
      </div>
    )
  }

  return (
    <div style={{ padding: '24px', backgroundColor: '#f9fafb', minHeight: '100vh' }}>
      {/* Header */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        marginBottom: '32px' 
      }}>
        <div>
          <h1 style={{ 
            fontSize: '28px', 
            fontWeight: '700', 
            color: '#1f2937', 
            marginBottom: '8px',
            display: 'flex',
            alignItems: 'center',
            gap: '12px'
          }}>
            <BuildingOfficeIcon style={{ width: '32px', height: '32px' }} />
            Entities & Regions
          </h1>
          <p style={{ color: '#6b7280' }}>
            Manage multi-entity operations across UK, EU, and USA regions
          </p>
        </div>
        
        <button
          onClick={() => setShowCreateModal(true)}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            backgroundColor: '#2563eb',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            padding: '12px 24px',
            fontSize: '14px',
            fontWeight: '500',
            cursor: 'pointer'
          }}
        >
          <PlusIcon style={{ width: '16px', height: '16px' }} />
          Add Entity
        </button>
      </div>

      {/* Feature Flag Notice */}
      <div style={{
        backgroundColor: '#eff6ff',
        border: '1px solid #bfdbfe',
        borderRadius: '8px',
        padding: '16px',
        marginBottom: '24px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <GlobeAltIcon style={{ width: '20px', height: '20px', color: '#2563eb' }} />
          <span style={{ fontSize: '14px', color: '#1e40af', fontWeight: '500' }}>
            Global Feature Active
          </span>
        </div>
        <p style={{ fontSize: '14px', color: '#1e40af', margin: '4px 0 0 28px' }}>
          Multi-entity management is enabled. Changes here affect global operations.
        </p>
      </div>

      {/* Stats Cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
        gap: '16px',
        marginBottom: '32px'
      }}>
        {[
          { label: 'Active Entities', value: entities.filter(e => e.is_active).length, color: '#10b981' },
          { label: 'UK Entities', value: entities.filter(e => e.region === 'UK').length, color: '#2563eb' },
          { label: 'EU Entities', value: entities.filter(e => e.region === 'EU').length, color: '#7c3aed' },
          { label: 'USA Entities', value: entities.filter(e => e.region === 'USA').length, color: '#dc2626' }
        ].map((stat) => (
          <div
            key={stat.label}
            style={{
              backgroundColor: 'white',
              border: '1px solid #e5e7eb',
              borderRadius: '8px',
              padding: '20px',
              boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)'
            }}
          >
            <div style={{ 
              fontSize: '32px', 
              fontWeight: '700', 
              color: stat.color,
              marginBottom: '4px'
            }}>
              {stat.value}
            </div>
            <div style={{ fontSize: '14px', color: '#6b7280' }}>
              {stat.label}
            </div>
          </div>
        ))}
      </div>

      {/* Entities Table */}
      <div style={{
        backgroundColor: 'white',
        border: '1px solid #e5e7eb',
        borderRadius: '8px',
        overflow: 'hidden',
        boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)'
      }}>
        <div style={{ 
          padding: '20px 24px',
          borderBottom: '1px solid #e5e7eb',
          backgroundColor: '#f9fafb'
        }}>
          <h2 style={{ fontSize: '18px', fontWeight: '600', color: '#1f2937', margin: 0 }}>
            Entity Directory
          </h2>
        </div>

        {entities.length === 0 ? (
          <div style={{ 
            textAlign: 'center', 
            padding: '48px 24px',
            color: '#6b7280'
          }}>
            <BuildingOfficeIcon style={{ 
              width: '48px', 
              height: '48px', 
              color: '#d1d5db',
              margin: '0 auto 16px'
            }} />
            <h3 style={{ fontSize: '16px', fontWeight: '500', margin: '0 0 8px 0' }}>
              No entities configured
            </h3>
            <p style={{ fontSize: '14px', margin: 0 }}>
              Create your first entity to enable multi-region operations
            </p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ backgroundColor: '#f9fafb' }}>
                  <th style={{ 
                    padding: '12px 24px', 
                    textAlign: 'left', 
                    fontSize: '12px', 
                    fontWeight: '500', 
                    color: '#6b7280',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em'
                  }}>
                    Entity
                  </th>
                  <th style={{ 
                    padding: '12px 24px', 
                    textAlign: 'left', 
                    fontSize: '12px', 
                    fontWeight: '500', 
                    color: '#6b7280',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em'
                  }}>
                    Region
                  </th>
                  <th style={{ 
                    padding: '12px 24px', 
                    textAlign: 'left', 
                    fontSize: '12px', 
                    fontWeight: '500', 
                    color: '#6b7280',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em'
                  }}>
                    Currency
                  </th>
                  <th style={{ 
                    padding: '12px 24px', 
                    textAlign: 'left', 
                    fontSize: '12px', 
                    fontWeight: '500', 
                    color: '#6b7280',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em'
                  }}>
                    Status
                  </th>
                  <th style={{ 
                    padding: '12px 24px', 
                    textAlign: 'right', 
                    fontSize: '12px', 
                    fontWeight: '500', 
                    color: '#6b7280',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em'
                  }}>
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {entities.map((entity, index) => (
                  <tr 
                    key={entity.id}
                    style={{ 
                      borderTop: index > 0 ? '1px solid #f3f4f6' : 'none'
                    }}
                  >
                    <td style={{ padding: '16px 24px' }}>
                      <div>
                        <div style={{ 
                          fontWeight: '500', 
                          color: '#1f2937',
                          marginBottom: '2px'
                        }}>
                          {entity.name}
                        </div>
                        <div style={{ 
                          fontSize: '12px', 
                          color: '#6b7280'
                        }}>
                          {entity.display_name}
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: '16px 24px' }}>
                      <div style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                        backgroundColor: 
                          entity.region === 'UK' ? '#eff6ff' :
                          entity.region === 'EU' ? '#f3e8ff' : '#fef2f2',
                        color: 
                          entity.region === 'UK' ? '#1d4ed8' :
                          entity.region === 'EU' ? '#7c3aed' : '#dc2626',
                        padding: '4px 8px',
                        borderRadius: '4px',
                        fontSize: '12px',
                        fontWeight: '500'
                      }}>
                        <GlobeAltIcon style={{ width: '12px', height: '12px' }} />
                        {entity.region}
                      </div>
                    </td>
                    <td style={{ padding: '16px 24px' }}>
                      <div style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                        fontSize: '14px',
                        color: '#1f2937'
                      }}>
                        <BanknotesIcon style={{ width: '14px', height: '14px', color: '#6b7280' }} />
                        {entity.currency_code}
                      </div>
                    </td>
                    <td style={{ padding: '16px 24px' }}>
                      <div style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                        backgroundColor: entity.is_active ? '#ecfdf5' : '#fef2f2',
                        color: entity.is_active ? '#166534' : '#dc2626',
                        padding: '4px 8px',
                        borderRadius: '12px',
                        fontSize: '12px',
                        fontWeight: '500'
                      }}>
                        <div style={{
                          width: '6px',
                          height: '6px',
                          borderRadius: '50%',
                          backgroundColor: entity.is_active ? '#10b981' : '#ef4444'
                        }} />
                        {entity.is_active ? 'Active' : 'Inactive'}
                      </div>
                    </td>
                    <td style={{ padding: '16px 24px', textAlign: 'right' }}>
                      <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                        <button
                          onClick={() => setSelectedEntity(entity)}
                          style={{
                            padding: '8px',
                            backgroundColor: '#f3f4f6',
                            border: '1px solid #d1d5db',
                            borderRadius: '6px',
                            cursor: 'pointer',
                            color: '#374151'
                          }}
                          title="View Details"
                        >
                          <EyeIcon style={{ width: '16px', height: '16px' }} />
                        </button>
                        <button
                          style={{
                            padding: '8px',
                            backgroundColor: '#f3f4f6',
                            border: '1px solid #d1d5db',
                            borderRadius: '6px',
                            cursor: 'pointer',
                            color: '#374151'
                          }}
                          title="Edit Entity"
                        >
                          <PencilIcon style={{ width: '16px', height: '16px' }} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Entity Detail Modal */}
      {selectedEntity && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            backgroundColor: 'white',
            borderRadius: '8px',
            padding: '24px',
            maxWidth: '500px',
            width: '90%',
            maxHeight: '80vh',
            overflow: 'auto'
          }}>
            <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '16px' }}>
              {selectedEntity.name}
            </h3>
            
            <div style={{ marginBottom: '16px' }}>
              <strong>Region:</strong> {selectedEntity.region}
            </div>
            <div style={{ marginBottom: '16px' }}>
              <strong>Currency:</strong> {selectedEntity.currency_code}
            </div>
            <div style={{ marginBottom: '16px' }}>
              <strong>Type:</strong> {selectedEntity.entity_type}
            </div>
            <div style={{ marginBottom: '16px' }}>
              <strong>Status:</strong> {selectedEntity.is_active ? 'Active' : 'Inactive'}
            </div>
            
            <button
              onClick={() => setSelectedEntity(null)}
              style={{
                backgroundColor: '#6b7280',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                padding: '8px 16px',
                cursor: 'pointer'
              }}
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default AdminEntities