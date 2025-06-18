import Student from '../models/Student.js';
import axios from 'axios';
import sendMail from './sendMail.js';

export const getProblemRating = async (problemName, contestId, problemIndex) => {
  if (problemIndex) {
    const charCode = problemIndex.toUpperCase().charCodeAt(0);
    if (charCode >= 'A'.charCodeAt(0) && charCode <= 'Z'.charCodeAt(0)) {
      return 800 + (charCode - 'A'.charCodeAt(0)) * 200;
    }
  }
  return 1200;
};

export const syncCodeforcesDataForStudent = async (student) => {
  try {
    const handle = student.cfHandle;
    if (!handle) {
      console.warn(`Student ${student.name} has no Codeforces handle.`);
      return;
    }
    const userInfoRes = await axios.get(`https://codeforces.com/api/user.info?handles=${handle}`);
    const userInfo = userInfoRes.data.result[0];
    student.avatar = userInfo.avatar;
    student.rank = userInfo.rank;
    student.rating = userInfo.rating;
    student.maxRating = userInfo.maxRating;
    student.titlePhoto = userInfo.titlePhoto;
    student.currentRating = userInfo.rating || 0;
    student.maxRating = userInfo.maxRating || 0;
    const ratingRes = await axios.get(`https://codeforces.com/api/user.rating?handle=${handle}`);
    const contestHistory = (ratingRes.data.result || []).map(contest => ({
      contestId: contest.contestId,
      contestName: contest.contestName,
      date: new Date(contest.ratingUpdateTimeSeconds * 1000).toISOString(),
      rank: contest.rank,
      oldRating: contest.oldRating,
      newRating: contest.newRating,
      ratingChange: contest.newRating - contest.oldRating,
      unsolvedProblems: null,
    }));
    student.contestHistory = contestHistory;
    const submissionsRes = await axios.get(`https://codeforces.com/api/user.status?handle=${handle}&from=1&count=5000`);
    const submissions = submissionsRes.data.result || [];
    const solvedProblems = [];
    const problemBuckets = {};
    const dailySolvedCounts = {};
    const uniqueSolvedProblems = new Set();
    for (const submission of submissions) {
      if (submission.verdict === 'OK') {
        const problemId = `${submission.problem.contestId}-${submission.problem.index}`;
        const problemRating = submission.problem.rating || await getProblemRating(submission.problem.name, submission.problem.contestId, submission.problem.index);
        if (!uniqueSolvedProblems.has(problemId)) {
          uniqueSolvedProblems.add(problemId);
          solvedProblems.push({
            date: new Date(submission.creationTimeSeconds * 1000).toISOString(),
            rating: problemRating,
            name: submission.problem.name,
            index: submission.problem.index,
          });
          const bucketKey = Math.floor(problemRating / 100) * 100;
          problemBuckets[bucketKey] = (problemBuckets[bucketKey] || 0) + 1;
        }
        const submissionDate = new Date(submission.creationTimeSeconds * 1000);
        const dateKey = submissionDate.toISOString().split('T')[0];
        dailySolvedCounts[dateKey] = (dailySolvedCounts[dateKey] || 0) + 1;
      }
    }
    const problemHistory = Object.keys(dailySolvedCounts).map(dateKey => ({
      date: new Date(dateKey).toISOString(),
      solved: dailySolvedCounts[dateKey],
    }));
    student.problemStats = {
      solved: solvedProblems,
      buckets: problemBuckets,
      history: problemHistory,
    };
    student.cfLastSynced = new Date();
    await student.save();
    console.log(`Synced ${student.name} (${handle})`);
  } catch (err) {
    console.error(`Failed to sync ${student.cfHandle}:`, err.message);
    if (err.response) {
      console.error('Codeforces API Error Data:', err.response.data);
    }
  }
};

export const syncAllStudents = async () => {
  const students = await Student.find({ cfHandle: { $exists: true, $ne: '' } });
  for (const student of students) {
    await syncCodeforcesDataForStudent(student);
  }
  console.log('All students synced');
};

export const checkInactivityAndNotify = async () => {
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const students = await Student.find({ reminderDisabled: { $ne: true } });
  for (const student of students) {
    const recentActivity = student.problemStats?.history?.some(
      h => new Date(h.date) >= sevenDaysAgo && h.solved > 0
    );
    if (!recentActivity) {
      try {
        await sendMail({
          to: student.email,
          subject: "Keep Solving on Codeforces!",
          text: `Hi ${student.name},\n\nWe noticed you haven't made any Codeforces submissions in the last 7 days. Keep up your problem solving!`,
          html: `<p>Hi ${student.name},</p><p>We noticed you haven't made any Codeforces submissions in the last 7 days. Keep up your problem solving!</p>`
        });
        student.reminderCount = (student.reminderCount || 0) + 1;
        await student.save();
        console.log(`Reminder sent to ${student.name}`);
      } catch (emailErr) {
        console.error(`Failed to send email to ${student.name}:`, emailErr.message);
      }
    }
  }
};