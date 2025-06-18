import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, BarChart, Bar, CartesianGrid, Legend } from "recharts";
import HeatMapGrid from "react-heatmap-grid";

const CONTEST_FILTERS = [
  { label: "30 days", value: 30 },
  { label: "90 days", value: 90 },
  { label: "365 days", value: 365 },
];
const PROBLEM_FILTERS = [
  { label: "7 days", value: 7 },
  { label: "30 days", value: 30 },
  { label: "90 days", value: 90 },
];

function daysAgo(date) {
  if (!date) {
    return Infinity;
  }
  const d = new Date(date);
  if (isNaN(d.getTime())) {
    console.error("Invalid date string passed to daysAgo:", date);
    return Infinity;
  }
  const diff = Date.now() - d.getTime();
  return diff / (1000 * 60 * 60 * 24);
}

const StudentProfile = () => {
  const { id } = useParams();
  const [student, setStudent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [contestFilter, setContestFilter] = useState(30);
  const [problemFilter, setProblemFilter] = useState(90);

  const API_BASE_URL = 'http://localhost:5050/api/students';

  useEffect(() => {
    const fetchStudent = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`${API_BASE_URL}/${id}`);
        if (!res.ok) {
          throw new Error(`HTTP error! status: ${res.status}`);
        }
        const data = await res.json();
        setStudent(data);
        console.log("Fetched Student Data:", data);
      } catch (err) {
        console.error("Failed to fetch student profile:", err);
        setError("Failed to load student profile. Please ensure the backend is running and data exists.");
      } finally {
        setLoading(false);
      }
    };
    fetchStudent();
  }, [id]);

  if (loading)
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="text-lg text-gray-500 dark:text-gray-200">Loading student profile...</div>
      </div>
    );

  if (error)
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="text-lg text-red-500 dark:text-red-400">{error}</div>
      </div>
    );

  if (!student)
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="text-lg text-gray-500 dark:text-gray-200">Student not found.</div>
      </div>
    );

  const filteredContests = (student.contestHistory || [])
    .filter((c) => daysAgo(c.date) <= contestFilter)
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  const ratingGraphData = filteredContests.map((c) => ({
    name: c.contestName,
    rating: c.newRating,
    date: new Date(c.date).toLocaleDateString(),
  }));

  const buckets = student.problemStats?.buckets || {};
  const history = student.problemStats?.history || [];

  const allBucketRatings = Object.keys(buckets).map(Number);
  const filteredHistoryForStats = history.filter(
    (h) => daysAgo(h.date) <= problemFilter
  );
  const totalSolved = filteredHistoryForStats.reduce((sum, h) => sum + (h.solved || 0), 0);
  const mostDifficult = totalSolved === 0
  ? 0
  : (allBucketRatings.length > 0
      ? Math.max(...allBucketRatings)
      : "-");

  let sumOfRatingsTimesCount = 0;
  let totalProblemsInBuckets = 0;
  Object.entries(buckets).forEach(([ratingStr, count]) => {
    const rating = Number(ratingStr);
    sumOfRatingsTimesCount += rating * count;
    totalProblemsInBuckets += count;
  });
  const avgRating =
    totalProblemsInBuckets > 0
      ? (sumOfRatingsTimesCount / totalProblemsInBuckets).toFixed(1)
      : "-";

  const daysWithActivity = new Set(
    filteredHistoryForStats.map((h) => new Date(h.date).toDateString())
  ).size;
  const avgPerDay =
    daysWithActivity > 0 ? (totalSolved / daysWithActivity).toFixed(2) : "-";

  const barData = Object.keys(buckets)
    .sort((a, b) => parseInt(a) - parseInt(b))
    .map((rating) => ({
      rating,
      count: buckets[rating],
    }));

  const heatmapDays = problemFilter;
  const numWeeks = Math.ceil(heatmapDays / 7);

  const heatmap = Array(7)
    .fill(0)
    .map(() => Array(numWeeks).fill(0));

  history.forEach((h) => {
    const d = new Date(h.date);
    const daysAgoVal = daysAgo(d);

    if (daysAgoVal >= 0 && daysAgoVal < heatmapDays) {
      const dayOfWeek = d.getDay();
      const weekIndex = numWeeks - 1 - Math.floor(daysAgoVal / 7);

      if (weekIndex >= 0 && weekIndex < numWeeks) {
        heatmap[dayOfWeek][weekIndex] += h.solved;
      }
    }
  });

  const heatmapXLabels = Array(numWeeks)
    .fill(0)
    .map((_, i) => {
      const date = new Date();
      const daysOffset = (numWeeks - 1 - i) * 7;
      date.setDate(date.getDate() - daysOffset);

      return `${date.getMonth() + 1}/${date.getDate()}`;
    });

  const reminderCount = student.reminderCount || 0;
  const reminderDisabled = student.reminderDisabled;

  const lastSynced = student.cfLastSynced
    ? new Date(student.cfLastSynced).toLocaleString()
    : "Never";

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 font-sans">
      <div className="container max-w-3xl mx-auto p-4 my-8">
        <div className="bg-white dark:bg-gray-900 dark:text-white rounded-2xl shadow-xl overflow-hidden transition-colors">
          <div className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white p-8 md:p-10">
            <div className="flex flex-col md:flex-row items-center">
              <div className="md:w-1/4 flex justify-center mb-6 md:mb-0">
                <div className="h-36 w-36 rounded-full border-4 border-white shadow-lg overflow-hidden bg-gray-200 dark:bg-gray-800 flex items-center justify-center">
                  {student.titlePhoto || student.avatar ? (
                  <img
                    src={student.titlePhoto || student.avatar}
                    alt={student.name}
                    className="h-full w-full object-cover"
                    onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = `https://placehold.co/144x144/cbd5e1/475569?text=${student.name ? student.name[0] : '?'}`;
                    }}
                  />
                  ) : (
                  <span className="text-5xl font-bold text-blue-700 dark:text-blue-200">
                    {student.name && student.name.length > 0
                    ? student.name[0]
                    : "?"}
                  </span>
                  )}
                </div>
              </div>
              <div className="md:w-3/4 text-center md:text-left md:pl-8">
                <h1 className="text-3xl md:text-4xl font-bold mb-2">
                  {student.name || "No Name"}
                </h1>
                <h2 className="text-lg md:text-xl font-medium mb-4 text-blue-100">
                  Codeforces:{" "}
                  <span className="font-mono">{student.cfHandle || "-"}</span>
                </h2>
                <div className="flex flex-wrap justify-center md:justify-start gap-3">
                  <div className="flex items-center bg-white bg-opacity-20 rounded-full px-4 py-1">
                    <span className="text-sm mx-auto sm:mx-0">{student.email || "No email"}</span>
                  </div>
                  <div className="flex items-center bg-white bg-opacity-20 rounded-full px-4 py-1">
                    <span className="text-sm mx-auto sm:mx-0">{student.phone || "No phone"}</span>
                  </div>
                </div>
                <div className="flex flex-wrap gap-3 mt-4">
                  <div className="bg-white bg-opacity-20 rounded-full px-4 py-1 text-sm mx-auto sm:mx-0">
                    <span className="font-semibold">Current Rating:</span>{" "}
                    {student.currentRating || "-"}
                  </div>
                  <div className="bg-white bg-opacity-20 rounded-full px-4 py-1 text-sm mx-auto sm:mx-0">
                    <span className="font-semibold">Max Rating:</span>{" "}
                    {student.maxRating || "-"}
                  </div>
                  <div className="bg-white bg-opacity-20 rounded-full px-4 py-1 text-sm mx-auto sm:mx-0">
                    <span className="font-semibold">Last Synced:</span>{" "}
                    {lastSynced}
                  </div>
                </div>
                <div className="flex flex-wrap gap-3 mt-4">
                  <div className="bg-white bg-opacity-20 rounded-full px-4 py-1 text-sm mx-auto sm:mx-0">
                    <span className="font-semibold">Reminders Sent:</span>{" "}
                    {reminderCount}
                  </div>
                  <div className="bg-white bg-opacity-20 rounded-full px-4 py-1 text-sm mx-auto sm:mx-0">
                    <span className="font-semibold">Auto Email:</span>{" "}
                    {reminderDisabled ? "Disabled" : "Enabled"}
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="p-6 md:p-10 bg-gray-50 dark:bg-gray-900 dark:text-white transition-colors">
            <div className="mb-8">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-2 gap-2">
                <h2 className="text-xl font-bold text-gray-800 dark:text-white flex items-center">
                  Contest History
                </h2>
                <div className="flex flex-wrap justify-center sm:justify-start gap-2">
                  {CONTEST_FILTERS.map((f) => (
                    <button
                      key={f.value}
                      onClick={() => setContestFilter(f.value)}
                      className={`px-3 py-1 rounded-full text-sm mx-auto sm:mx-0 font-semibold transition-colors ${
                        contestFilter === f.value
                          ? "bg-blue-600 text-white"
                          : "bg-gray-200 dark:bg-gray-800 text-gray-700 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-700"
                      }`}
                    >
                      {f.label}
                    </button>
                  ))}
                </div>
              </div>
              <div className="w-full h-64 mb-4">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={ratingGraphData}>
                    <XAxis dataKey="date" interval="preserveStartEnd" />
                    <YAxis domain={['auto', 'auto']} />
                    <Tooltip />
                    <Line
                      type="monotone"
                      dataKey="rating"
                      stroke="#2563eb"
                      strokeWidth={2}
                      dot={false}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm mx-auto sm:mx-0 bg-white dark:bg-gray-900 dark:text-white rounded table-auto">
                  <thead>
                    <tr className="bg-gray-100 dark:bg-gray-800">
                      <th className="px-2 py-2 text-left">Contest</th>
                      <th className="px-2 py-2 text-left">Date</th>
                      <th className="px-2 py-2 text-left">Rank</th>
                      <th className="px-2 py-2 text-left hidden sm:table-cell">Old Rating</th>
                      <th className="px-2 py-2 text-left">New Rating</th>
                      <th className="px-2 py-2 text-left hidden sm:table-cell">Change</th>
                      <th className="px-2 py-2 text-left hidden md:table-cell">Unsolved</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredContests.length > 0 ? (
                      filteredContests.map((c) => (
                        <tr key={c.contestId} className="border-t border-gray-200 dark:border-gray-700">
                          <td className="px-2 py-2">{c.contestName}</td>
                          <td className="px-2 py-2">
                            {new Date(c.date).toLocaleDateString()}
                          </td>
                          <td className="px-2 py-2">{c.rank}</td>
                          <td className="px-2 py-2 hidden sm:table-cell">{c.oldRating}</td>
                          <td className="px-2 py-2">{c.newRating}</td>
                          <td
                            className={`px-2 py-2 hidden sm:table-cell ${
                              c.ratingChange > 0
                                ? "text-green-600"
                                : c.ratingChange < 0
                                ? "text-red-600"
                                : ""
                            }`}
                          >
                            {c.ratingChange > 0 ? "+" : ""}
                            {c.ratingChange}
                          </td>
                          <td className="px-2 py-2 hidden md:table-cell">
                            {c.unsolvedProblems ?? "-"}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="7" className="text-center px-2 py-4 text-gray-500 dark:text-gray-400">
                          No contest data for the selected period.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
            <div>
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-2 gap-2">
                <h2 className="text-xl font-bold text-gray-800 dark:text-white flex items-center">
                  Problem Solving Data
                </h2>
                <div className="flex flex-wrap justify-center sm:justify-start gap-2">
                  {PROBLEM_FILTERS.map((f) => (
                    <button
                      key={f.value}
                      onClick={() => setProblemFilter(f.value)}
                      className={`px-3 py-1 rounded-full text-sm mx-auto sm:mx-0 font-semibold transition-colors ${
                        problemFilter === f.value
                          ? "bg-blue-600 text-white"
                          : "bg-gray-200 dark:bg-gray-800 text-gray-700 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-700"
                      }`}
                    >
                      {f.label}
                    </button>
                  ))}
                </div>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 mb-4">
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-3 text-center">
                  <div className="text-xs text-gray-500 dark:text-gray-300">Most Difficult</div>
                  <div className="font-bold text-lg">{mostDifficult}</div>
                </div>
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-3 text-center">
                  <div className="text-xs text-gray-500 dark:text-gray-300">Total Solved</div>
                  <div className="font-bold text-lg">{totalSolved}</div>
                </div>
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-3 text-center">
                  <div className="text-xs text-gray-500 dark:text-gray-300">Avg Rating <span className="text-gray-400">(All-Time)</span></div>
                  <div className="font-bold text-lg">{avgRating}</div>
                </div>
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-3 text-center">
                  <div className="text-xs text-gray-500 dark:text-gray-300">Avg/Day</div>
                  <div className="font-bold text-lg">{avgPerDay}</div>
                </div>
              </div>
              <div className="w-full h-64 mb-4">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={barData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="rating" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="count" fill="#2563eb" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div>
                <h3 className="text-md font-semibold mb-2">Submission Heatmap (last {problemFilter} days)</h3>
                <div className="overflow-x-auto py-2">
                  {numWeeks > 0 && heatmapXLabels.length > 0 && heatmap.flat().some(val => val > 0) ? (
                    <HeatMapGrid
                      xLabels={heatmapXLabels}
                      yLabels={[
                        "Sun",
                        "Mon",
                        "Tue",
                        "Wed",
                        "Thu",
                        "Fri",
                        "Sat",
                      ]}
                      data={heatmap}
                      background={(x, y, val) =>
                        val
                          ? `rgba(37, 99, 235, ${Math.min(0.1 + val / 10, 1)})`
                          : (x % 2 === 0 ? '#f3f4f6' : '#e5e7eb')
                      }
                      cellStyle={(x, y, val) => ({
                        border: "1px solid #fff",
                        fontSize: "10px",
                        color: val > 0 ? "#111" : "#888",
                        textAlign: "center",
                      })}
                      cellRender={(x, y, val) => val > 0 ? val : ''}
                      square
                    />
                  ) : (
                    <p className="text-center text-gray-500 dark:text-gray-400 mt-4">
                      No recent submission data for heatmap for the selected period.
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
          <div className="bg-gray-100 dark:bg-gray-900 dark:text-white p-4 text-center text-sm mx-auto sm:mx-0 text-gray-500 dark:text-gray-300 border-t border-gray-200 dark:border-gray-700 transition-colors">
            <Link to="/" className="text-blue-600 hover:underline font-medium">
              &larr; Back to List
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudentProfile;