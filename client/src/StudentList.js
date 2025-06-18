import React, { useEffect, useState, useMemo, Fragment } from 'react';
import { Link } from 'react-router-dom';
import { PlusIcon, EyeIcon, PencilIcon, TrashIcon, ArrowDownTrayIcon, ArrowPathIcon } from '@heroicons/react/24/outline';
import { Dialog, Transition } from '@headlessui/react';

const StudentList = () => {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentStudent, setCurrentStudent] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    cfHandle: '',
  });

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(4); // Number of students per page

  const API_BASE_URL = 'http://localhost:5050/api/students';

  const fetchStudents = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(API_BASE_URL);
      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }
      const data = await res.json();
      setStudents(data);
      setCurrentPage(1); // Reset to first page after fetching new data
    } catch (err) {
      console.error("Failed to fetch students:", err);
      setError("Failed to load students. Please ensure the backend is running.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStudents();
  }, []);

  const openModal = (student = null) => {
    setCurrentStudent(student);
    if (student) {
      setFormData({
        name: student.name || '',
        email: student.email || '',
        phone: student.phone || '',
        cfHandle: student.cfHandle || '',
      });
    } else {
      setFormData({ name: '', email: '', phone: '', cfHandle: '' });
    }
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setCurrentStudent(null);
  };

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      let res;
      if (currentStudent) {
        res = await fetch(`${API_BASE_URL}/${currentStudent._id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData),
        });
      } else {
        res = await fetch(API_BASE_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData),
        });
      }

      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }
      closeModal();
      fetchStudents(); // Refresh the list
    } catch (err) {
      console.error("Failed to save student:", err);
      setError("Failed to save student data. Please check your inputs.");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this student?")) {
      setLoading(true);
      try {
        const res = await fetch(`${API_BASE_URL}/${id}`, {
          method: 'DELETE',
        });
        if (!res.ok) {
          throw new Error(`HTTP error! status: ${res.status}`);
        }
        fetchStudents(); // Refresh the list
      } catch (err) {
        console.error("Failed to delete student:", err);
        setError("Failed to delete student.");
      } finally {
        setLoading(false);
      }
    }
  };

  const handleSyncAll = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('http://localhost:5050/api/sync-all-codeforces-data', {
        method: 'POST',
      });
      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }
      alert('Codeforces data sync process initiated on backend. Data will update shortly.');
      setTimeout(fetchStudents, 4000); // Refetch after 4 seconds to allow backend processing
    } catch (err) {
      console.error("Failed to initiate sync:", err);
      setError("Failed to initiate Codeforces sync. Check backend logs.");
    } finally {
      setLoading(false);
    }
  };

  const exportToCsv = () => {
    if (!students.length) {
      alert("No student data to export.");
      return;
    }

    const headers = [
      "Name", "Email", "Phone", "Codeforces Handle",
      "Current Rating", "Max Rating", "Last Synced", "Reminders Sent", "Auto Email"
    ];
    const rows = students.map(s => [
      s.name || '',
      s.email || '',
      s.phone || '',
      s.cfHandle || '',
      s.rating || '-',
      s.maxRating || '-',
      s.cfLastSynced ? new Date(s.cfLastSynced).toLocaleString() : 'Never',
      s.reminderCount || 0,
      s.reminderDisabled ? "Disabled" : "Enabled"
    ]);

    let csvContent = headers.join(",") + "\n";
    rows.forEach(row => {
      csvContent += row.map(field => `"${String(field).replace(/"/g, '""')}"`).join(",") + "\n";
    });

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.setAttribute('download', 'students_data.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Pagination Logic
  const indexOfLastStudent = currentPage * itemsPerPage;
  const indexOfFirstStudent = indexOfLastStudent - itemsPerPage;
  const currentStudents = useMemo(() => {
    return students.slice(indexOfFirstStudent, indexOfLastStudent);
  }, [students, indexOfFirstStudent, indexOfLastStudent]);

  const totalPages = Math.ceil(students.length / itemsPerPage);

  const paginate = (pageNumber) => {
    if (pageNumber > 0 && pageNumber <= totalPages) {
      setCurrentPage(pageNumber);
    }
  };

  // Function to render page numbers with ellipses
  const renderPageNumbers = () => {
    const pageNumbers = [];
    const maxPageNumbersToShow = 5; // e.g., 1 2 3 ... 7
    let startPage = Math.max(1, currentPage - Math.floor(maxPageNumbersToShow / 2));
    let endPage = Math.min(totalPages, startPage + maxPageNumbersToShow - 1);

    if (endPage - startPage + 1 < maxPageNumbersToShow) {
      startPage = Math.max(1, endPage - maxPageNumbersToShow + 1);
    }

    if (startPage > 1) {
      pageNumbers.push(1);
      if (startPage > 2) {
        pageNumbers.push('...');
      }
    }

    for (let i = startPage; i <= endPage; i++) {
      pageNumbers.push(i);
    }

    if (endPage < totalPages) {
      if (endPage < totalPages - 1) {
        pageNumbers.push('...');
      }
      pageNumbers.push(totalPages);
    }

    return pageNumbers.map((number, index) => (
      <button
        key={index} // Using index here is fine because the array is transient for rendering
        onClick={() => typeof number === 'number' && paginate(number)}
        disabled={typeof number !== 'number' || number === currentPage}
        className={`px-3 py-1 rounded-md text-sm font-medium ${
          typeof number === 'number' && number === currentPage
            ? 'bg-blue-600 text-white'
            : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-600'
        } ${typeof number !== 'number' ? 'cursor-default' : ''}`}
      >
        {number}
      </button>
    ));
  };


  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header with responsive buttons */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-6 gap-3">
        <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100 text-center sm:text-left mb-3 sm:mb-0">
          Student List
        </h1>
        <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
          <button
            onClick={handleSyncAll}
            className="w-full sm:w-auto px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors flex items-center justify-center gap-2 text-sm sm:text-base"
          >
            <ArrowPathIcon className="h-5 w-5" /> Sync All CF Data
          </button>
          <button
            onClick={exportToCsv}
            className="w-full sm:w-auto px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors flex items-center justify-center gap-2 text-sm sm:text-base"
          >
            <ArrowDownTrayIcon className="h-5 w-5" /> Export CSV
          </button>
          <button
            onClick={() => openModal()}
            className="w-full sm:w-auto px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors flex items-center justify-center gap-2 text-sm sm:text-base"
          >
            <PlusIcon className="h-5 w-5" /> Add Student
          </button>
        </div>
      </div>

      {loading && <p className="text-center text-lg text-blue-500 dark:text-blue-300">Loading students...</p>}
      {error && <p className="text-center text-red-500 text-lg">{error}</p>}

      {!loading && !error && students.length === 0 && (
        <p className="text-center text-gray-500 dark:text-gray-400">No students found. Add one!</p>
      )}

      {!loading && !error && students.length > 0 && (
        <div className="bg-white dark:bg-gray-800 shadow-xl rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full leading-normal table-auto md:table-fixed">
              <thead>
                <tr className="bg-gray-100 dark:bg-gray-700">
                  <th className="px-3 py-3 border-b-2 border-gray-200 dark:border-gray-600 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider md:px-5">
                    Name
                  </th>
                  <th className="px-3 py-3 border-b-2 border-gray-200 dark:border-gray-600 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider md:px-5 hidden sm:table-cell">
                    Email
                  </th>
                  <th className="px-3 py-3 border-b-2 border-gray-200 dark:border-gray-600 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider md:px-5">
                    CF Handle
                  </th>
                  <th className="px-3 py-3 border-b-2 border-gray-200 dark:border-gray-600 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider md:px-5">
                    Rating
                  </th>
                  <th className="px-3 py-3 border-b-2 border-gray-200 dark:border-gray-600 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider md:px-5 hidden md:table-cell">
                    Last Synced
                  </th>
                  <th className="px-3 py-3 border-b-2 border-gray-200 dark:border-gray-600 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider md:px-5">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {currentStudents.map((student) => (
                  <tr key={student._id} className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                    <td className="px-3 py-3 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm md:px-5">
                      {student.name}
                    </td>
                    <td className="px-3 py-3 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm md:px-5 hidden sm:table-cell">
                      {student.email}
                    </td>
                    <td className="px-3 py-3 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm md:px-5">
                      {student.cfHandle || '-'}
                    </td>
                    <td className="px-3 py-3 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm md:px-5">
                      {student.currentRating || '-'}
                    </td>
                    <td className="px-3 py-3 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm md:px-5 hidden md:table-cell">
                      {student.cfLastSynced ? new Date(student.cfLastSynced).toLocaleDateString() : 'Never'}
                    </td>
                    <td className="px-3 py-3 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm md:px-5">
                      <div className="flex items-center justify-center sm:justify-start space-x-2 sm:space-x-3">
                        <Link to={`/student/${student._id}`} title="View Profile" className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-200 transition-colors">
                          <EyeIcon className="h-5 w-5" />
                        </Link>
                        <button onClick={() => openModal(student)} title="Edit Student" className="text-yellow-600 hover:text-yellow-800 dark:text-yellow-400 dark:hover:text-yellow-200 transition-colors">
                          <PencilIcon className="h-5 w-5" />
                        </button>
                        <button onClick={() => handleDelete(student._id)} title="Delete Student" className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-200 transition-colors">
                          <TrashIcon className="h-5 w-5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Pagination Controls */}
      {!loading && !error && students.length > itemsPerPage && (
        <div className="flex flex-col sm:flex-row justify-between items-center space-y-3 sm:space-y-0 sm:space-x-2 mt-8">
          <div className="text-gray-700 dark:text-gray-300 text-sm sm:text-base">
            Page {currentPage} of {totalPages}
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => paginate(currentPage - 1)}
              disabled={currentPage === 1}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base"
            >
              Previous
            </button>
            {renderPageNumbers()}
            <button
              onClick={() => paginate(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base"
            >
              Next
            </button>
          </div>
        </div>
      )}

      {/* Add/Edit Student Modal */}
      <Transition appear show={isModalOpen} as={Fragment}>
        <Dialog as="div" className="relative z-10" onClose={closeModal}>
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-black bg-opacity-25" />
          </Transition.Child>

          <div className="fixed inset-0 overflow-y-auto">
            <div className="flex min-h-full items-center justify-center p-4 text-center">
              <Transition.Child
                as={Fragment}
                enter="ease-out duration-300"
                enterFrom="opacity-0 scale-95"
                enterTo="opacity-100 scale-100"
                leave="ease-in duration-200"
                leaveFrom="opacity-100 scale-100"
                leaveTo="opacity-0 scale-95"
              >
                <Dialog.Panel className="w-full max-w-sm sm:max-w-md transform overflow-hidden rounded-2xl bg-white dark:bg-gray-900 p-6 text-left align-middle shadow-xl transition-all">
                  <Dialog.Title
                    as="h3"
                    className="text-lg font-medium leading-6 text-gray-900 dark:text-gray-100"
                  >
                    {currentStudent ? "Edit Student" : "Add New Student"}
                  </Dialog.Title>
                  <div className="mt-4">
                    <form onSubmit={handleSubmit} className="space-y-4">
                      <div>
                        <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                          Name
                        </label>
                        <input
                          type="text"
                          name="name"
                          id="name"
                          value={formData.name}
                          onChange={handleFormChange}
                          required
                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                        />
                      </div>
                      <div>
                        <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                          Email
                        </label>
                        <input
                          type="email"
                          name="email"
                          id="email"
                          value={formData.email}
                          onChange={handleFormChange}
                          required
                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                        />
                      </div>
                      <div>
                        <label htmlFor="phone" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                          Phone
                        </label>
                        <input
                          type="text"
                          name="phone"
                          id="phone"
                          value={formData.phone}
                          onChange={handleFormChange}
                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                        />
                      </div>
                      <div>
                        <label htmlFor="cfHandle" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                          Codeforces Handle
                        </label>
                        <input
                          type="text"
                          name="cfHandle"
                          id="cfHandle"
                          value={formData.cfHandle}
                          onChange={handleFormChange}
                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                        />
                      </div>
                      <div className="mt-6 flex justify-end space-x-3">
                        <button
                          type="button"
                          className="inline-flex justify-center rounded-md border border-transparent bg-gray-200 dark:bg-gray-700 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-gray-500 focus-visible:ring-offset-2"
                          onClick={closeModal}
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          className="inline-flex justify-center rounded-md border border-transparent bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
                          disabled={loading}
                        >
                          {loading ? 'Saving...' : (currentStudent ? "Update" : "Add")}
                        </button>
                      </div>
                    </form>
                  </div>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </Dialog>
      </Transition>
    </div>
  );
};

export default StudentList;
