'use client'

import { useEffect, useState } from 'react'
import { adminApi } from '@/lib/api/admin'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Loader2, Search, CheckCircle, XCircle, User, Edit, X } from 'lucide-react'
import toast from 'react-hot-toast'

interface EditUserModalProps {
  user: any
  onClose: () => void
  onSave: () => void
}

function EditUserModal({ user, onClose, onSave }: EditUserModalProps) {
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    firstName: user.firstName || '',
    lastName: user.lastName || '',
    email: user.email || '',
    username: user.username || '',
    bio: user.bio || '',
    location: user.location || '',
    website: user.website || '',
    phone: user.phone || '',
    payoutMethod: user.payoutMethod || '',
    paypalEmail: user.paypalEmail || '',
    payoneerEmail: user.payoneerEmail || ''
  })
  const [roleData, setRoleData] = useState(user.role)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      // Update profile
      const profileResponse = await adminApi.updateUserProfile(user.id, {
        ...formData,
        payoutMethod: formData.payoutMethod || null,
        paypalEmail: formData.paypalEmail || null,
        payoneerEmail: formData.payoneerEmail || null
      })

      if (!profileResponse.success) {
        throw new Error(profileResponse.message || 'Failed to update profile')
      }

      // Update role if changed
      if (roleData !== user.role) {
        const roleResponse = await adminApi.updateUserRole(user.id, roleData)
        if (!roleResponse.success) {
          throw new Error(roleResponse.message || 'Failed to update role')
        }
      }

      toast.success('User updated successfully')
      onSave()
      onClose()
    } catch (error: any) {
      console.error('Failed to update user:', error)
      toast.error(error.message || 'Failed to update user')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-200 flex items-center justify-between">
          <h2 className="text-xl font-bold">Edit User Profile</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">First Name</label>
              <Input
                value={formData.firstName}
                onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Last Name</label>
              <Input
                value={formData.lastName}
                onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <Input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Username</label>
              <Input
                value={formData.username}
                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
            <select
              value={roleData}
              onChange={(e) => setRoleData(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
            >
              <option value="CLIENT">Client</option>
              <option value="FREELANCER">Freelancer</option>
              <option value="ADMIN">Admin</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Bio</label>
            <textarea
              value={formData.bio}
              onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
              rows={3}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
              <Input
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
              <Input
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Website</label>
            <Input
              type="url"
              value={formData.website}
              onChange={(e) => setFormData({ ...formData, website: e.target.value })}
            />
          </div>

          {/* Payout Settings Section */}
          <div className="pt-4 border-t border-gray-200">
            <h3 className="text-lg font-medium mb-4">Payout Settings</h3>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Payout Method</label>
              <select
                value={formData.payoutMethod}
                onChange={(e) => setFormData({ ...formData, payoutMethod: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              >
                <option value="">Not Set</option>
                <option value="STRIPE">Stripe Connect</option>
                <option value="PAYPAL">PayPal</option>
                <option value="PAYONEER">Payoneer</option>
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">PayPal Email</label>
                <Input
                  type="email"
                  value={formData.paypalEmail}
                  onChange={(e) => setFormData({ ...formData, paypalEmail: e.target.value })}
                  placeholder="paypal@example.com"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Payoneer Email</label>
                <Input
                  type="email"
                  value={formData.payoneerEmail}
                  onChange={(e) => setFormData({ ...formData, payoneerEmail: e.target.value })}
                  placeholder="payoneer@example.com"
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  Saving...
                </>
              ) : (
                'Save Changes'
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filters, setFilters] = useState({
    role: '',
    isVerified: undefined as boolean | undefined,
    page: 1,
    limit: 20
  })
  const [editingUser, setEditingUser] = useState<any>(null)

  useEffect(() => {
    fetchUsers()
  }, [filters])

  const fetchUsers = async () => {
    try {
      setLoading(true)
      const response = await adminApi.getUsers({
        ...filters,
        search: searchTerm
      })
      if (response.success) {
        setUsers(response.data.users)
      }
    } catch (error: any) {
      console.error('Failed to fetch users:', error)
      toast.error('Failed to load users')
    } finally {
      setLoading(false)
    }
  }

  const handleUpdateUserStatus = async (userId: string, updates: { isVerified?: boolean; isAvailable?: boolean }) => {
    try {
      const response = await adminApi.updateUserStatus(userId, updates)
      if (response.success) {
        toast.success('User status updated')
        fetchUsers()
      }
    } catch (error: any) {
      console.error('Failed to update user:', error)
      toast.error(error.message || 'Failed to update user')
    }
  }

  const handleSearch = () => {
    fetchUsers()
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    })
  }

  return (
    <div className="p-8">
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Users Management</h1>
        <p className="text-gray-600 mt-2">Monitor and manage all platform users</p>
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Search by email, username, or name..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                  className="pl-10"
                />
              </div>
            </div>
            <select
              value={filters.role}
              onChange={(e) => setFilters({ ...filters, role: e.target.value })}
              className="px-3 py-2 border border-gray-300 rounded-md"
            >
              <option value="">All Roles</option>
              <option value="CLIENT">Client</option>
              <option value="FREELANCER">Freelancer</option>
              <option value="ADMIN">Admin</option>
            </select>
            <select
              value={filters.isVerified === undefined ? '' : filters.isVerified.toString()}
              onChange={(e) => setFilters({
                ...filters,
                isVerified: e.target.value === '' ? undefined : e.target.value === 'true'
              })}
              className="px-3 py-2 border border-gray-300 rounded-md"
            >
              <option value="">All Users</option>
              <option value="true">Verified</option>
              <option value="false">Unverified</option>
            </select>
            <Button onClick={handleSearch}>
              <Search className="w-4 h-4 mr-2" />
              Search
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Users List */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        </div>
      ) : (
        <div className="space-y-4">
          {users.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center text-gray-500">
                No users found
              </CardContent>
            </Card>
          ) : (
            users.map((user: any) => (
              <Card key={user.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      {/* User Header */}
                      <div className="flex items-center gap-4 mb-3">
                        <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold text-lg">
                          {user.username.charAt(0).toUpperCase()}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-3">
                            <h3 className="text-lg font-semibold text-gray-900">
                              {user.firstName} {user.lastName}
                            </h3>
                            <span className={`px-2 py-1 rounded text-xs font-medium ${
                              user.role === 'CLIENT' ? 'bg-blue-100 text-blue-800' :
                              user.role === 'FREELANCER' ? 'bg-purple-100 text-purple-800' :
                              'bg-red-100 text-red-800'
                            }`}>
                              {user.role}
                            </span>
                            {user.isVerified ? (
                              <span className="px-2 py-1 bg-green-100 text-green-800 rounded text-xs font-medium flex items-center gap-1">
                                <CheckCircle className="w-3 h-3" />
                                Verified
                              </span>
                            ) : (
                              <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded text-xs font-medium flex items-center gap-1">
                                <XCircle className="w-3 h-3" />
                                Unverified
                              </span>
                            )}
                            {!user.isAvailable && (
                              <span className="px-2 py-1 bg-gray-100 text-gray-800 rounded text-xs font-medium">
                                Unavailable
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-gray-600 mt-1">@{user.username}</p>
                          <p className="text-sm text-gray-600">{user.email}</p>
                        </div>
                      </div>

                      {/* User Stats */}
                      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-sm">
                        <div>
                          <p className="text-gray-600">Total Spent</p>
                          <p className="font-bold text-green-600">{formatCurrency(user.totalSpent)}</p>
                        </div>
                        <div>
                          <p className="text-gray-600">Total Earned</p>
                          <p className="font-bold text-blue-600">{formatCurrency(user.totalEarnings)}</p>
                        </div>
                        <div>
                          <p className="text-gray-600">Rating</p>
                          <p className="font-medium">{user.rating ? user.rating.toFixed(1) : 'N/A'}</p>
                        </div>
                        <div>
                          <p className="text-gray-600">Projects (Client)</p>
                          <p className="font-medium">{user._count.clientProjects}</p>
                        </div>
                        <div>
                          <p className="text-gray-600">Projects (Freelancer)</p>
                          <p className="font-medium">{user._count.freelancerProjects}</p>
                        </div>
                      </div>

                      {/* Activity Stats */}
                      {user.role === 'FREELANCER' && (
                        <div className="mt-3 grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                          <div>
                            <p className="text-gray-600">Services</p>
                            <p className="font-medium">{user._count.freelancerServices}</p>
                          </div>
                          <div>
                            <p className="text-gray-600">Service Orders</p>
                            <p className="font-medium">{user._count.freelancerServiceOrders}</p>
                          </div>
                          <div>
                            <p className="text-gray-600">Client Orders</p>
                            <p className="font-medium">{user._count.clientServiceOrders}</p>
                          </div>
                        </div>
                      )}

                      {/* Metadata */}
                      <div className="mt-4 pt-4 border-t border-gray-200 flex items-center gap-4 text-xs text-gray-500">
                        <span>Joined: {formatDate(user.createdAt)}</span>
                        <span>-</span>
                        <span>Last Active: {formatDate(user.lastActiveAt)}</span>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="ml-4 flex flex-col gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setEditingUser(user)}
                      >
                        <Edit className="w-4 h-4 mr-2" />
                        Edit
                      </Button>
                      {!user.isVerified && (
                        <Button
                          size="sm"
                          onClick={() => handleUpdateUserStatus(user.id, { isVerified: true })}
                          className="bg-green-600 hover:bg-green-700"
                        >
                          <CheckCircle className="w-4 h-4 mr-2" />
                          Verify
                        </Button>
                      )}
                      {user.isVerified && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleUpdateUserStatus(user.id, { isVerified: false })}
                          className="text-red-600 border-red-600 hover:bg-red-50"
                        >
                          <XCircle className="w-4 h-4 mr-2" />
                          Unverify
                        </Button>
                      )}
                      {user.isAvailable ? (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleUpdateUserStatus(user.id, { isAvailable: false })}
                        >
                          Mark Unavailable
                        </Button>
                      ) : (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleUpdateUserStatus(user.id, { isAvailable: true })}
                        >
                          Mark Available
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      )}

      {/* Edit User Modal */}
      {editingUser && (
        <EditUserModal
          user={editingUser}
          onClose={() => setEditingUser(null)}
          onSave={fetchUsers}
        />
      )}
    </div>
  )
}
