import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  // Create a test user
  const userId = 'test-user-id' // This would be the Supabase Auth user ID in production

  const user = await prisma.user.upsert({
    where: { userId },
    update: {},
    create: {
      userId,
      name: 'Test User',
      email: 'test@example.com',
    },
  })

  console.log(`Created user: ${user.name}`)

  // Create tags
  const tags = [
    { name: 'Array', color: '#FF5733' },
    { name: 'String', color: '#33FF57' },
    { name: 'Hash Table', color: '#3357FF' },
    { name: 'Dynamic Programming', color: '#F033FF' },
    { name: 'Math', color: '#FF33A8' },
  ]

  for (const tag of tags) {
    await prisma.tag.upsert({
      where: { name_userId: { name: tag.name, userId: user.id } },
      update: { color: tag.color },
      create: {
        name: tag.name,
        color: tag.color,
        userId: user.id,
      },
    })
  }

  console.log('Created tags')

  // Create problems
  const problems = [
    {
      title: 'Two Sum',
      platformId: '1',
      platform: 'LeetCode',
      difficulty: 'Easy',
      url: 'https://leetcode.com/problems/two-sum/',
      description: 'Given an array of integers nums and an integer target, return indices of the two numbers such that they add up to target.',
      status: 'Solved',
      tags: ['Array', 'Hash Table'],
    },
    {
      title: 'Add Two Numbers',
      platformId: '2',
      platform: 'LeetCode',
      difficulty: 'Medium',
      url: 'https://leetcode.com/problems/add-two-numbers/',
      description: 'You are given two non-empty linked lists representing two non-negative integers.',
      status: 'Attempted',
      tags: ['Linked List', 'Math'],
    },
    {
      title: 'Longest Substring Without Repeating Characters',
      platformId: '3',
      platform: 'LeetCode',
      difficulty: 'Medium',
      url: 'https://leetcode.com/problems/longest-substring-without-repeating-characters/',
      description: 'Given a string s, find the length of the longest substring without repeating characters.',
      status: 'Todo',
      tags: ['String', 'Hash Table', 'Sliding Window'],
    },
  ]

  for (const problem of problems) {
    const createdProblem = await prisma.problem.create({
      data: {
        title: problem.title,
        platformId: problem.platformId,
        platform: problem.platform,
        difficulty: problem.difficulty,
        url: problem.url,
        description: problem.description,
        status: problem.status,
        userId: user.id,
      },
    })

    // Create tags for the problem
    for (const tagName of problem.tags) {
      // Find or create the tag
      let tag = await prisma.tag.findFirst({
        where: {
          name: tagName,
          userId: user.id,
        },
      })

      if (!tag) {
        tag = await prisma.tag.create({
          data: {
            name: tagName,
            color: '#' + Math.floor(Math.random() * 16777215).toString(16), // Random color
            userId: user.id,
          },
        })
      }

      // Create the problem-tag relationship
      await prisma.problemTag.create({
        data: {
          problemId: createdProblem.id,
          tagId: tag.id,
        },
      })
    }
  }

  console.log('Created problems with tags')

  // Create submissions
  const submissions = [
    {
      problemTitle: 'Two Sum',
      code: `function twoSum(nums, target) {
  const map = new Map();
  for (let i = 0; i < nums.length; i++) {
    const complement = target - nums[i];
    if (map.has(complement)) {
      return [map.get(complement), i];
    }
    map.set(nums[i], i);
  }
  return null;
}`,
      language: 'JavaScript',
      status: 'Accepted',
      runtime: '76 ms',
      memory: '42.5 MB',
      submittedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
    },
    {
      problemTitle: 'Two Sum',
      code: `function twoSum(nums, target) {
  for (let i = 0; i < nums.length; i++) {
    for (let j = i + 1; j < nums.length; j++) {
      if (nums[i] + nums[j] === target) {
        return [i, j];
      }
    }
  }
  return null;
}`,
      language: 'JavaScript',
      status: 'Accepted',
      runtime: '92 ms',
      memory: '42.1 MB',
      submittedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3 days ago
    },
    {
      problemTitle: 'Add Two Numbers',
      code: `function addTwoNumbers(l1, l2) {
  // Incomplete solution
  let dummy = new ListNode(0);
  let curr = dummy;
  let carry = 0;
  
  // Missing implementation
  
  return dummy.next;
}`,
      language: 'JavaScript',
      status: 'Wrong Answer',
      runtime: null,
      memory: null,
      submittedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // 1 day ago
      errors: [
        {
          errorMessage: 'Input: l1 = [2,4,3], l2 = [5,6,4] Output: [] Expected: [7,0,8]',
          errorType: 'Logic Error',
          testCase: 'l1 = [2,4,3], l2 = [5,6,4]',
        }
      ]
    }
  ]

  for (const submission of submissions) {
    const problem = await prisma.problem.findFirst({
      where: {
        title: submission.problemTitle,
        userId: user.id,
      },
    })

    if (problem) {
      const createdSubmission = await prisma.submission.create({
        data: {
          code: submission.code,
          language: submission.language,
          status: submission.status,
          runtime: submission.runtime,
          memory: submission.memory,
          submittedAt: submission.submittedAt,
          problemId: problem.id,
          userId: user.id,
        },
      })

      // Create errors if any
      if (submission.errors) {
        for (const error of submission.errors) {
          await prisma.error.create({
            data: {
              errorMessage: error.errorMessage,
              errorType: error.errorType,
              testCase: error.testCase,
              submissionId: createdSubmission.id,
            },
          })
        }
      }
    }
  }

  console.log('Created submissions with errors')

  // Create activity records
  const today = new Date()
  const activities = [
    {
      date: new Date(today.getFullYear(), today.getMonth(), today.getDate() - 2),
      problemsSolved: 1,
      problemsAttempted: 0,
      streakCount: 1,
    },
    {
      date: new Date(today.getFullYear(), today.getMonth(), today.getDate() - 1),
      problemsSolved: 0,
      problemsAttempted: 1,
      streakCount: 2,
    },
    {
      date: new Date(today.getFullYear(), today.getMonth(), today.getDate()),
      problemsSolved: 0,
      problemsAttempted: 0,
      streakCount: 0,
    }
  ]

  for (const activity of activities) {
    await prisma.activity.upsert({
      where: {
        date_userId: {
          date: activity.date,
          userId: user.id,
        }
      },
      update: {
        problemsSolved: activity.problemsSolved,
        problemsAttempted: activity.problemsAttempted,
        streakCount: activity.streakCount,
      },
      create: {
        date: activity.date,
        problemsSolved: activity.problemsSolved,
        problemsAttempted: activity.problemsAttempted,
        streakCount: activity.streakCount,
        userId: user.id,
      },
    })
  }

  console.log('Created activity records')

  // Create statistics
  await prisma.statistics.upsert({
    where: { userId: user.id },
    update: {
      totalSolved: 1,
      easyCount: 1,
      mediumCount: 0,
      hardCount: 0,
      streak: 0,
      lastSolved: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
    },
    create: {
      totalSolved: 1,
      easyCount: 1,
      mediumCount: 0,
      hardCount: 0,
      streak: 0,
      lastSolved: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
      userId: user.id,
    },
  })

  console.log('Created statistics')

  // Create preferences
  await prisma.preference.upsert({
    where: { userId: user.id },
    update: {
      theme: 'system',
      codeEditorTheme: 'vs-dark',
      notifications: true,
      dailyGoal: 1,
    },
    create: {
      theme: 'system',
      codeEditorTheme: 'vs-dark',
      notifications: true,
      dailyGoal: 1,
      userId: user.id,
    },
  })

  console.log('Created preferences')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  }) 
 
 
 