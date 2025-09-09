import { prisma } from '../lib/prisma.js';

/**
 * Personnel Service - Manages staff and personnel data
 * Replaces fake/mock person names with real database-driven personnel
 */
class PersonnelService {
  constructor() {
    this.cache = new Map();
    this.cacheTimeout = 5 * 60 * 1000; // 5 minutes
  }

  /**
   * Get all active personnel
   */
  async getAllPersonnel() {
    const cacheKey = 'all_personnel';
    const cached = this.cache.get(cacheKey);
    
    if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
      return cached.data;
    }

    try {
      const personnel = await prisma.user.findMany({
        where: {
          isActive: true,
          deleted_at: null
        },
        select: {
          id: true,
          username: true,
          first_name: true,
          last_name: true,
          display_name: true,
          email: true,
          role: true,
          department: true,
          createdAt: true
        },
        orderBy: [
          { last_name: 'asc' },
          { first_name: 'asc' }
        ]
      });

      // Transform to include formatted full name
      const transformedPersonnel = personnel.map(person => ({
        ...person,
        full_name: this.formatFullName(person),
        display_name: person.display_name || this.formatFullName(person)
      }));

      this.cache.set(cacheKey, {
        data: transformedPersonnel,
        timestamp: Date.now()
      });

      return transformedPersonnel;
    } catch (error) {
      console.error('Error fetching personnel:', error);
      return [];
    }
  }

  /**
   * Get personnel by role(s)
   */
  async getPersonnelByRole(roles) {
    if (!Array.isArray(roles)) {
      roles = [roles];
    }

    const cacheKey = `personnel_roles_${roles.join('_')}`;
    const cached = this.cache.get(cacheKey);
    
    if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
      return cached.data;
    }

    try {
      const personnel = await prisma.user.findMany({
        where: {
          isActive: true,
          deleted_at: null,
          role: {
            in: roles
          }
        },
        select: {
          id: true,
          username: true,
          first_name: true,
          last_name: true,
          display_name: true,
          email: true,
          role: true,
          department: true
        },
        orderBy: [
          { last_name: 'asc' },
          { first_name: 'asc' }
        ]
      });

      const transformedPersonnel = personnel.map(person => ({
        ...person,
        full_name: this.formatFullName(person),
        display_name: person.display_name || this.formatFullName(person)
      }));

      this.cache.set(cacheKey, {
        data: transformedPersonnel,
        timestamp: Date.now()
      });

      return transformedPersonnel;
    } catch (error) {
      console.error('Error fetching personnel by role:', error);
      return [];
    }
  }

  /**
   * Get personnel by department
   */
  async getPersonnelByDepartment(department) {
    const cacheKey = `personnel_dept_${department}`;
    const cached = this.cache.get(cacheKey);
    
    if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
      return cached.data;
    }

    try {
      const personnel = await prisma.user.findMany({
        where: {
          isActive: true,
          deleted_at: null,
          department: department
        },
        select: {
          id: true,
          username: true,
          first_name: true,
          last_name: true,
          display_name: true,
          email: true,
          role: true,
          department: true
        },
        orderBy: [
          { last_name: 'asc' },
          { first_name: 'asc' }
        ]
      });

      const transformedPersonnel = personnel.map(person => ({
        ...person,
        full_name: this.formatFullName(person),
        display_name: person.display_name || this.formatFullName(person)
      }));

      this.cache.set(cacheKey, {
        data: transformedPersonnel,
        timestamp: Date.now()
      });

      return transformedPersonnel;
    } catch (error) {
      console.error('Error fetching personnel by department:', error);
      return [];
    }
  }

  /**
   * Get random personnel member (for testing/fallback)
   */
  async getRandomPersonnel(filters = {}) {
    const personnel = await this.getAllPersonnel();
    
    if (personnel.length === 0) {
      return this.getFallbackPersonnel();
    }

    // Apply filters if provided
    let filteredPersonnel = personnel;
    
    if (filters.role) {
      filteredPersonnel = personnel.filter(p => 
        Array.isArray(filters.role) 
          ? filters.role.includes(p.role)
          : p.role === filters.role
      );
    }
    
    if (filters.department) {
      filteredPersonnel = filteredPersonnel.filter(p => p.department === filters.department);
    }

    if (filteredPersonnel.length === 0) {
      return this.getFallbackPersonnel();
    }

    const randomIndex = Math.floor(Math.random() * filteredPersonnel.length);
    return filteredPersonnel[randomIndex];
  }

  /**
   * Get specific personnel by ID
   */
  async getPersonnelById(id) {
    try {
      const person = await prisma.user.findUnique({
        where: {
          id: id,
          isActive: true,
          deleted_at: null
        },
        select: {
          id: true,
          username: true,
          first_name: true,
          last_name: true,
          display_name: true,
          email: true,
          role: true,
          department: true
        }
      });

      if (!person) {
        return null;
      }

      return {
        ...person,
        full_name: this.formatFullName(person),
        display_name: person.display_name || this.formatFullName(person)
      };
    } catch (error) {
      console.error('Error fetching personnel by ID:', error);
      return null;
    }
  }

  /**
   * Create new personnel record
   */
  async createPersonnel(personnelData) {
    try {
      const person = await prisma.user.create({
        data: {
          username: personnelData.username,
          email: personnelData.email,
          first_name: personnelData.first_name,
          last_name: personnelData.last_name,
          display_name: personnelData.display_name,
          role: personnelData.role || 'operator',
          department: personnelData.department,
          isActive: true,
          is_admin: personnelData.is_admin || false,
          force_password_change: true,
          approved: true
        },
        select: {
          id: true,
          username: true,
          first_name: true,
          last_name: true,
          display_name: true,
          email: true,
          role: true,
          department: true
        }
      });

      // Clear cache
      this.clearCache();

      return {
        ...person,
        full_name: this.formatFullName(person),
        display_name: person.display_name || this.formatFullName(person)
      };
    } catch (error) {
      console.error('Error creating personnel:', error);
      throw error;
    }
  }

  /**
   * Update personnel record
   */
  async updatePersonnel(id, updates) {
    try {
      const person = await prisma.user.update({
        where: { id },
        data: updates,
        select: {
          id: true,
          username: true,
          first_name: true,
          last_name: true,
          display_name: true,
          email: true,
          role: true,
          department: true
        }
      });

      // Clear cache
      this.clearCache();

      return {
        ...person,
        full_name: this.formatFullName(person),
        display_name: person.display_name || this.formatFullName(person)
      };
    } catch (error) {
      console.error('Error updating personnel:', error);
      throw error;
    }
  }

  /**
   * Soft delete personnel (deactivate)
   */
  async deactivatePersonnel(id) {
    try {
      await prisma.user.update({
        where: { id },
        data: {
          isActive: false,
          deleted_at: new Date()
        }
      });

      // Clear cache
      this.clearCache();

      return true;
    } catch (error) {
      console.error('Error deactivating personnel:', error);
      throw error;
    }
  }

  /**
   * Get personnel suitable for specific roles/tasks
   */
  async getPersonnelForTask(taskType) {
    const roleMapping = {
      'quality_inspector': ['manager', 'admin'],
      'production_operator': ['operator', 'manager', 'admin'],
      'supervisor': ['manager', 'admin'],
      'technician': ['operator', 'manager'],
      'manager': ['manager', 'admin'],
      'quality_control': ['manager', 'admin']
    };

    const roles = roleMapping[taskType] || ['operator', 'manager', 'admin'];
    return await this.getPersonnelByRole(roles);
  }

  /**
   * Format full name from first and last name
   */
  formatFullName(person) {
    if (!person.first_name && !person.last_name) {
      return person.username || 'Unknown User';
    }
    
    const firstName = person.first_name || '';
    const lastName = person.last_name || '';
    
    return `${firstName} ${lastName}`.trim();
  }

  /**
   * Get fallback personnel when no real data is available
   */
  getFallbackPersonnel() {
    return {
      id: 'fallback-user',
      username: 'system',
      first_name: 'System',
      last_name: 'User',
      full_name: 'System User',
      display_name: 'System User',
      email: 'system@sentia.com',
      role: 'operator',
      department: 'Production'
    };
  }

  /**
   * Clear cache
   */
  clearCache() {
    this.cache.clear();
  }

  /**
   * Get departments list
   */
  async getDepartments() {
    const cacheKey = 'departments';
    const cached = this.cache.get(cacheKey);
    
    if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
      return cached.data;
    }

    try {
      const departments = await prisma.user.findMany({
        where: {
          isActive: true,
          deleted_at: null,
          department: {
            not: null
          }
        },
        select: {
          department: true
        },
        distinct: ['department']
      });

      const departmentList = departments
        .map(d => d.department)
        .filter(dept => dept)
        .sort();

      this.cache.set(cacheKey, {
        data: departmentList,
        timestamp: Date.now()
      });

      return departmentList;
    } catch (error) {
      console.error('Error fetching departments:', error);
      return ['Production', 'Quality Control', 'Maintenance', 'Administration'];
    }
  }

  /**
   * Get roles list
   */
  async getRoles() {
    const cacheKey = 'roles';
    const cached = this.cache.get(cacheKey);
    
    if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
      return cached.data;
    }

    try {
      const roles = await prisma.user.findMany({
        where: {
          isActive: true,
          deleted_at: null
        },
        select: {
          role: true
        },
        distinct: ['role']
      });

      const roleList = roles
        .map(r => r.role)
        .filter(role => role)
        .sort();

      this.cache.set(cacheKey, {
        data: roleList,
        timestamp: Date.now()
      });

      return roleList;
    } catch (error) {
      console.error('Error fetching roles:', error);
      return ['admin', 'manager', 'operator', 'viewer'];
    }
  }
}

// Export singleton instance
export const personnelService = new PersonnelService();
export default personnelService;