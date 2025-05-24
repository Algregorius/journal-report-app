import { useEffect, useState } from 'react'
import axios from 'axios'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'
import * as XLSX from 'xlsx'
import { Toaster, toast } from 'react-hot-toast'
import { useSearchParams } from 'react-router-dom'
import { jsPDF } from 'jspdf'
import autoTable from 'jspdf-autotable'

const sampleData = [
  { Date: '2025-01-01', Account: 'Cash', Description: 'Initial balance', Debit: 1000, Credit: '' },
  { Date: '2025-01-02', Account: 'Bank', Description: 'Deposit', Debit: 500, Credit: '' },
  { Date: '2025-01-03', Account: 'Cash', Description: 'Office Supplies', Debit: '', Credit: 200 },
  { Date: '2025-01-04', Account: 'Revenue', Description: 'Service income', Debit: '', Credit: 300 },
  { Date: '2025-01-05', Account: 'Expense', Description: 'Electricity', Debit: 100, Credit: '' },
  { Date: '2025-01-06', Account: 'Cash', Description: 'Snacks', Debit: 50, Credit: '' },
  { Date: '2025-01-07', Account: 'Bank', Description: 'Withdraw', Debit: '', Credit: 100 },
  { Date: '2025-01-08', Account: 'Cash', Description: 'Client Payment', Debit: 1000, Credit: '' },
  { Date: '2025-01-09', Account: 'Expense', Description: 'Internet', Debit: 200, Credit: '' },
  { Date: '2025-01-10', Account: 'Revenue', Description: 'Extra Service', Debit: '', Credit: 500 },
]

export default function JournalReportPage() {
  const [isLoggedIn, setIsLoggedIn] = useState(() => !!localStorage.getItem('role'))
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [filterText, setFilterText] = useState('')
  const [sortField, setSortField] = useState('Date')
  const [sortAsc, setSortAsc] = useState(true)
  const [editRowIndex, setEditRowIndex] = useState(null)
  const [editedRow, setEditedRow] = useState({})
  const rowsPerPage = 5

  const login = () => {
    if (!username || !password) {
      toast.error('Username and password are required')
      return
    }

    if (username === 'admin' && password === 'admin') {
      localStorage.setItem('role', 'admin')
      toast.success('Logged in as admin')
      setIsLoggedIn(true)
    } else if (username === 'staff' && password === 'staff') {
      localStorage.setItem('role', 'staff')
      toast.success('Logged in as staff')
      setIsLoggedIn(true)
    } else if (username === 'viewer' && password === 'viewer') {
      localStorage.setItem('role', 'viewer')
      toast.success('Logged in as viewer')
      setIsLoggedIn(true)
    } else {
      toast.error('Invalid credentials')
    }
  }

  const logout = () => {
    localStorage.removeItem('role')
    toast('Logged out')
    setIsLoggedIn(false)
  }

  const exportExcel = () => {
    const worksheet = XLSX.utils.json_to_sheet(sampleData)
    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Journal Report')
    XLSX.writeFile(workbook, 'journal-report.xlsx')
    toast.success('Excel exported!')
  }

  const exportPDF = () => {
    const doc = new jsPDF()
    doc.text('Journal Report', 14, 15)
    const tableColumn = ['Date', 'Account', 'Description', 'Debit', 'Credit']
    const tableRows = sampleData.map(row => [row.Date, row.Account, row.Description, row.Debit, row.Credit])
    autoTable(doc, {
      head: [tableColumn],
      body: tableRows,
      startY: 20
    })
    doc.save('journal-report.pdf')
    toast.success('PDF exported!')
  }

  const userRole = localStorage.getItem('role') || 'guest'
  const isStaff = userRole === 'staff'
  const isViewer = userRole === 'viewer'
  const isAdmin = userRole === 'admin'

  const filteredData = sampleData.filter(
    (row) =>
      row.Date.includes(filterText) ||
      row.Account.toLowerCase().includes(filterText.toLowerCase()) ||
      row.Description.toLowerCase().includes(filterText.toLowerCase())
  )

  const sortedData = [...filteredData].sort((a, b) => {
    const aVal = a[sortField] || ''
    const bVal = b[sortField] || ''
    if (typeof aVal === 'number' && typeof bVal === 'number') {
      return sortAsc ? aVal - bVal : bVal - aVal
    } else {
      return sortAsc ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal)
    }
  })

  const indexOfLastRow = currentPage * rowsPerPage
  const indexOfFirstRow = indexOfLastRow - rowsPerPage
  const currentRows = sortedData.slice(indexOfFirstRow, indexOfLastRow)
  const totalPages = Math.ceil(sortedData.length / rowsPerPage)

  const handlePageChange = (page) => setCurrentPage(page)
  const handleSort = (field) => {
    if (field === sortField) {
      setSortAsc(!sortAsc)
    } else {
      setSortField(field)
      setSortAsc(true)
    }
  }

  const handleEdit = (index) => {
    setEditRowIndex(index)
    setEditedRow({ ...currentRows[index] })
  }

  const handleDelete = (index) => {
    const globalIndex = (currentPage - 1) * rowsPerPage + index
    sampleData.splice(globalIndex, 1)
    toast.success('Row deleted')
  }

  const handleSave = () => {
    const globalIndex = (currentPage - 1) * rowsPerPage + editRowIndex
    sampleData[globalIndex] = editedRow
    setEditRowIndex(null)
    toast.success('Row updated')
  }

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setEditedRow(prev => ({ ...prev, [name]: value }))
  }

  if (!isLoggedIn) {
    return (
      <div className="flex flex-col items-center justify-center h-screen space-y-4">
        <h1 className="text-2xl font-bold">Login</h1>
        <p className="text-sm text-gray-600">Try: admin/admin, staff/staff, viewer/viewer</p>
        <input
          type="text"
          placeholder="Username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          className="px-4 py-2 border rounded w-64"
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="px-4 py-2 border rounded w-64"
        />
        <button
          onClick={login}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Login
        </button>
      </div>
    )
  }

  return (
    <div className="bg-gray-50 text-black min-h-screen p-6 dark:bg-gray-900 dark:text-white">
      <Toaster position="top-right" />

      {(isAdmin || isViewer) && (
        <div className="mb-4 flex flex-col md:flex-row md:items-center gap-2">
          <input
            type="text"
            placeholder="Filter by date, account, or description"
            value={filterText}
            onChange={(e) => {
              setFilterText(e.target.value)
              setCurrentPage(1)
            }}
            className="px-4 py-2 rounded border w-full dark:bg-gray-800 dark:text-white"
          />
          <button onClick={exportExcel} className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700">Export Excel</button>
          <button onClick={exportPDF} className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700">Export PDF</button>
        </div>
      )}

      {(isAdmin || isViewer || isStaff) && (
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="bg-gray-200 dark:bg-gray-700">
                {['Date', 'Account', 'Description', 'Debit', 'Credit'].map((col) => (
                  <th
                    key={col}
                    onClick={() => handleSort(col)}
                    className="cursor-pointer px-4 py-2 text-left hover:underline"
                  >
                    {col} {sortField === col ? (sortAsc ? '▲' : '▼') : ''}
                  </th>
                ))}
                {(isAdmin || isStaff) && <th className="px-4 py-2">Actions</th>}
              </tr>
            </thead>
            <tbody>
              {currentRows.map((row, i) => (
                <tr key={i} className="border-b border-gray-300 dark:border-gray-600">
                  {editRowIndex === i ? (
                    <>
                      {['Date', 'Account', 'Description', 'Debit', 'Credit'].map((field) => (
                        <td key={field} className="px-4 py-2">
                          <input
                            name={field}
                            value={editedRow[field]}
                            onChange={handleInputChange}
                            className="w-full bg-gray-100 dark:bg-gray-800 text-black dark:text-white border rounded px-2 py-1"
                          />
                        </td>
                      ))}
                      <td className="px-4 py-2">
                        <button onClick={handleSave} className="text-green-600 hover:underline mr-2">Save</button>
                        <button onClick={() => setEditRowIndex(null)} className="text-gray-600 hover:underline">Cancel</button>
                      </td>
                    </>
                  ) : (
                    <>
                      <td className="px-4 py-2">{row.Date}</td>
                      <td className="px-4 py-2">{row.Account}</td>
                      <td className="px-4 py-2">{row.Description}</td>
                      <td className="px-4 py-2">{row.Debit}</td>
                      <td className="px-4 py-2">{row.Credit}</td>
                      {(isAdmin || isStaff) && (
                        <td className="px-4 py-2">
                          <button onClick={() => handleEdit(i)} className="text-blue-600 hover:underline mr-2">Edit</button>
                          <button onClick={() => handleDelete(i)} className="text-red-600 hover:underline">Delete</button>
                        </td>
                      )}
                    </>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
          <div className="mt-4 flex justify-center gap-2">
            {[...Array(totalPages)].map((_, i) => (
              <button
                key={i}
                className={`px-3 py-1 rounded ${currentPage === i + 1 ? 'bg-blue-600 text-white' : 'bg-gray-300 dark:bg-gray-700'}`}
                onClick={() => handlePageChange(i + 1)}
              >
                {i + 1}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
