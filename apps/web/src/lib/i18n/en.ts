/**
 * English.
 *
 * Typed as `Record<TextKey, string>` against sv.ts, so a Swedish string added
 * without a translation here fails `tsc`. Don't widen that type to make a
 * build pass — the error is the point.
 *
 * Goal suggestions are parsed back by goalTracker, so the phrasing has to be
 * something the parser recognises. Keep verbs in the lists in
 * goalTracker.ts (lose/drop, weigh/reach, drink, train, complete) and the
 * numbers followed by a unit it knows.
 */

import type { TextKey } from './sv'

export const en: Record<TextKey, string> = {
  // Tab bar
  'nav.home': 'Home',
  'nav.nutrition': 'Nutrition',
  'nav.training': 'Training',
  'nav.analytics': 'Analytics',
  'nav.more': 'More',

  // The More menu
  'more.goals': 'My goals',
  'more.challenges': 'Challenges',
  'more.aiCoach': 'AI coach',
  'more.measurements': 'Body measurements',
  'more.recipes': 'Recipes',
  'more.profile': 'Profile',
  'more.settings': 'Settings',
  'more.notifications': 'Notifications',
  'more.reminders': 'Reminders',
  'more.appleHealth': 'Apple Health',
  'more.help': 'Help & support',
  'more.about': 'About',
  'more.privacy': 'Privacy policy',

  // In-page tab rows
  'tab.overview': 'Overview',
  'tab.trends': 'Trends',
  'tab.calories': 'Calories',
  'tab.today': 'Today',
  'tab.week': 'Week',
  'tab.details': 'Details',
  'tab.all': 'All',
  'goals.tab.active': 'Active goals',
  'goals.tab.past': 'Past goals',

  // Page headings not in the menu
  'page.customWorkouts': 'My workouts',
  'page.myPlan': 'My plan',
  'page.weekPlanning': 'Weekly planning',
  'page.macros': 'Macros',
  'page.mealPlan': 'Meal plan',
  'page.aboutApp': 'About FormPlan',
  'page.water': 'Water',

  // Subscription
  'billing.premiumActive': 'Premium active ✓',
  'billing.thanks': 'Thanks for supporting FormPlan!',
  'billing.manage': 'Manage subscription',
  'billing.trial': 'Free trial',
  'billing.trialLeftOne': '{days} day left free',
  'billing.trialLeftMany': '{days} days left free',
  'billing.trialOver': 'Your free trial has ended',
  'billing.becomePremiumHint': 'Go Premium to keep using FormPlan.',
  'billing.upgradeCta': 'Upgrade to Premium – SEK {price}/month',
  'billing.becomePremiumCta': 'Go Premium – SEK {price}/month',

  // Meals
  'meal.frukost': 'Breakfast',
  'meal.lunch': 'Lunch',
  'meal.middag': 'Dinner',
  'meal.mellanmar': 'Snack',

  // Training goals in the profile
  'goal.lose_weight': 'Lose weight',
  'goal.build_muscle': 'Build muscle',
  'goal.maintain': 'Stay in shape',
  'goal.improve_endurance': 'Improve endurance',

  // Experience level
  'level.beginner': 'Beginner',
  'level.intermediate': 'Intermediate',
  'level.advanced': 'Advanced',

  // Diet focus
  'diet.balanced': 'Balanced',
  'diet.high_protein': 'High protein',
  'diet.vegetarian': 'Vegetarian',
  'diet.low_carb': 'Low carb',
  'diet.balanced.desc': '30% protein · 30% fat · 40% carbs',
  'diet.high_protein.desc': '40% protein · 25% fat · 35% carbs',
  'diet.vegetarian.desc': 'No meat at all',
  'diet.low_carb.desc': '35% protein · 45% fat · 20% carbs',

  // Common
  'common.error': 'Something went wrong',
  'common.adding': 'Adding…',

  // Auth
  'auth.linkExpired': 'This link has expired or has already been used. Request a new one.',

  // Goals page
  'goals.trackingAutomatic': 'Tracked automatically ✓',
  'goals.trackingManual': 'Manual',

  'goals.suggest.weekly3': 'Train 3 times a week',
  'goals.suggest.weekly4': 'Train 4 times a week',
  'goals.suggest.water.metric.high': 'Drink 2.5 liters of water a day',
  'goals.suggest.water.metric.low': 'Drink 2 liters of water a day',
  'goals.suggest.water.imperial.high': 'Drink 100 fl oz of water a day',
  'goals.suggest.water.imperial.low': 'Drink 80 fl oz of water a day',
  'goals.suggest.lose.metric': 'Lose 5 kg',
  'goals.suggest.lose.imperial': 'Lose 10 lbs',
  'goals.suggest.weigh.metric': 'Weigh 75 kg',
  'goals.suggest.weigh.imperial': 'Weigh 165 lbs',
  'goals.suggest.total50': 'Complete 50 workouts',
  'goals.suggest.run.metric': 'Run 5 km without stopping',
  'goals.suggest.run.imperial': 'Run 3 miles without stopping',
  'goals.suggest.pullups': 'Do 10 pull-ups in a row',

  // Live goal status
  'goals.status.weekly': '{done} of {target} workouts this week',
  'goals.status.total': '{done} of {target} workouts total',
  'goals.status.water': '{done} of {target} today',
  'goals.status.weightTarget': '{current} now · target {target}',
  'goals.status.weightLoss': '{done} of {target} lost',
  'goals.status.needWeight': 'Log your weight in Analytics → Trends',

  // Language setting
  'settings.language': 'Language',
  'settings.languageSub': 'Follows your phone’s language by default',
  'settings.language.auto': 'Automatic',
  'settings.language.sv': 'Swedish',
  'settings.language.en': 'English',
}
