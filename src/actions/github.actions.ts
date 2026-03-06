// src/actions/github.actions.ts
"use server";

import { Octokit } from "octokit";
import prisma from "@/lib/prisma";

const octokit = new Octokit({ auth: process.env.GITHUB_TOKEN });

export async function processGithubProfile(userId: string, githubUsername: string) {
  try {
    // 1. The GraphQL Query
    // This fetches the exact contribution graph number and up to 100 of your top owned, non-forked repos.
    const query = `
      query getGithubStats($username: String!) {
        user(login: $username) {
          contributionsCollection {
            contributionCalendar {
              totalContributions
            }
          }
          repositories(first: 100, ownerAffiliations: OWNER, isFork: false, orderBy: {field: STARGAZERS, direction: DESC}) {
            nodes {
              stargazerCount
              languages(first: 3, orderBy: {field: SIZE, direction: DESC}) {
                nodes {
                  name
                }
              }
            }
          }
        }
      }
    `;

    // 2. Execute the query
    const response: any = await octokit.graphql(query, {
      username: githubUsername,
    });

    const userData = response.user;
    
    // 3. Extract the real metrics
    const totalCommits = userData.contributionsCollection.contributionCalendar.totalContributions;
    
    const repos = userData.repositories.nodes;
    const totalStars = repos.reduce((sum: number, repo: any) => sum + repo.stargazerCount, 0);

    // 4. Aggregate Top Languages safely
    const languageCounts: Record<string, number> = {};
    
    repos.forEach((repo: any) => {
      if (repo.languages && repo.languages.nodes) {
        repo.languages.nodes.forEach((lang: any) => {
          languageCounts[lang.name] = (languageCounts[lang.name] || 0) + 1;
        });
      }
    });

    const topLanguages = Object.entries(languageCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([language]) => language);

    // 5. Save to Prisma
    const savedProfile = await prisma.githubProfile.upsert({
      where: { userId: userId },
      update: {
        username: githubUsername,
        topLanguages: topLanguages,
        totalStars: totalStars,
        totalCommits: totalCommits, 
      },
      create: {
        userId: userId,
        username: githubUsername,
        topLanguages: topLanguages,
        totalStars: totalStars,
        totalCommits: totalCommits,
      },
    });

    return { success: true, data: savedProfile };

  } catch (error) {
    console.error("GitHub API Error:", error);
    return { success: false, error: "Failed to fetch exact GitHub data. Check your username and token permissions." };
  }
}