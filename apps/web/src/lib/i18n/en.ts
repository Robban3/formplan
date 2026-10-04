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

  // Sign-in and sign-up
  'auth.neutralSignupNotice': 'If that address isn’t already registered, you’ll get a confirmation email. Already have an account — sign in.',
  'auth.err.invalidLogin': 'Wrong email or password. If you just created the account, confirm it from the email first.',
  'auth.err.linkInvalid': 'This link is no longer valid. Request a new reset link.',
  'auth.err.throttled': 'Please wait a moment before trying again.',
  'auth.err.tooMany': 'Too many attempts — wait a moment and try again.',
  'auth.err.pwned': 'That password appears in known data breaches — pick another.',
  'auth.err.weakPassword': 'That password doesn’t meet the requirements. {detail}',
  'auth.err.linkUnverified': 'The link could not be verified.',
  'auth.err.notConfigured': 'Sign-in is not configured.',
  'auth.err.generic': 'Something went wrong. Please try again.',
  'auth.err.googleFailed': 'Couldn’t open Google sign-in. Please try again.',

  'auth.accountCreated': 'Account created!',
  'auth.accountCreatedCheckMail': 'Account created! Check your email and confirm to sign in.',
  'auth.needEmailFirst': 'Enter your email address first.',
  'auth.resetSent': 'If an account exists for that address, we’ve sent a reset link. Check your inbox (and spam).',
  'auth.passwordUpdated': 'Your password has been updated.',

  'auth.tagline': 'AI-generated',
  'auth.verifyingReset': 'Verifying your reset link…',
  'auth.newPassword': 'New password',
  'auth.newPasswordSub': 'Choose a new password for your account.',
  'auth.saving': 'Saving…',
  'auth.saveNewPassword': 'Save new password',
  'auth.createAccount': 'Create account',
  'auth.welcomeBack': 'Welcome back',
  'auth.createAccountSub': 'Get started in under a minute',
  'auth.signInSub': 'Sign in to continue your journey',
  'auth.openingGoogle': 'Opening Google…',
  'auth.continueWithGoogle': 'Continue with Google',
  'auth.tabPassword': 'Password',
  'auth.tabMagicLink': 'Magic link',
  'auth.creatingAccount': 'Creating account…',
  'auth.signingIn': 'Signing in…',
  'auth.signIn': 'Sign in',
  'auth.haveAccount': 'Already have an account?',
  'auth.noAccount': 'Don’t have an account?',
  'auth.linkSent': 'Link sent',
  'auth.checkYourMail': 'Check your email!',
  'auth.sending': 'Sending…',
  'auth.sendMagicLink': 'Send sign-in link',
  'auth.emailPlaceholder': 'you@example.com',
  'auth.passwordPlaceholder': 'Password',
  'auth.forgotPassword': 'Forgot your password?',
  'auth.or': 'or',
  'auth.secureNotice': 'Secure, encrypted sign-in',
  'auth.newPasswordPlaceholder': 'New password (at least {min} characters)',
  'auth.passwordWithMin': 'Password (at least {min} characters)',

  // Landing page selling points
  'landing.savesTime': 'Saves you time',
  'landing.savesTimeDesc': 'AI builds your plan in seconds',
  'landing.personal': '100% personal',
  'landing.personalDesc': 'Tailored to your goals, your situation and your preferences',
  'landing.research': 'Backed by research',
  'landing.researchDesc': 'Evidence-based methods for maximum results',
  'landing.secure': 'Safe and secure',
  'landing.secureDesc': 'Your data is always protected',
  'landing.results': 'Built for results',
  'landing.resultsDesc': 'Focused on long-term progress',

  // Onboarding — steps
  'onb.step.goal': 'Your goal',
  'onb.step.level': 'Experience',
  'onb.step.equipment': 'Equipment',
  'onb.step.schedule': 'Schedule',
  'onb.step.diet': 'Nutrition',
  'onb.step.body': 'About you',

  // Goal subtitles (labels come from goal.*)
  'onb.goal.lose_weight.desc': 'Fat loss & calorie deficit',
  'onb.goal.build_muscle.desc': 'Strength & hypertrophy',
  'onb.goal.maintain.desc': 'Balance & wellbeing',
  'onb.goal.improve_endurance.desc': 'Stamina & heart rate',

  // Level subtitles (labels come from level.*)
  'onb.level.beginner.desc': '0–1 years of training',
  'onb.level.intermediate.desc': '1–3 years of training',
  'onb.level.advanced.desc': '3+ years of training',

  // Equipment. The VALUES stay Swedish — only the label is translated.
  'equip.gym': 'Full gym',
  'equip.dumbbells': 'Dumbbells',
  'equip.barbell': 'Barbell',
  'equip.bands': 'Resistance bands',
  'equip.pullupBar': 'Pull-up bar',
  'equip.kettlebells': 'Kettlebells',
  'equip.bodyweight': 'No equipment (bodyweight)',

  // Allergies
  'allergy.gluten': 'Gluten',
  'allergy.lactose': 'Lactose',
  'allergy.nuts': 'Nuts',
  'allergy.eggs': 'Eggs',
  'allergy.fish': 'Fish',
  'allergy.soy': 'Soy',
  'allergy.vegetarian': 'Vegetarian',
  'allergy.vegan': 'Vegan',

  // Onboarding — questions and buttons
  'onb.q.goal': 'What’s your goal?',
  'onb.q.goalSub': 'We’ll tailor your plan around it.',
  'onb.q.level': 'Training experience?',
  'onb.q.levelSub': 'Pick the level that fits best.',
  'onb.q.equipment': 'What equipment do you have?',
  'onb.q.equipmentSub': 'Select everything that applies.',
  'onb.q.days': 'How many days a week?',
  'onb.q.daysSub': 'Choose how often you want to train.',
  'onb.q.allergies': 'Allergies or dietary restrictions?',
  'onb.q.allergiesSub': 'Optional — skip if none.',
  'onb.back': 'Back',
  'onb.cancel': 'Cancel',
  'onb.continue': 'Continue',
  'onb.skip': 'Skip',
  'onb.createPlan': 'Create my plan',
  'onb.stepOf': 'Step {n} of {total}',
  'onb.skipAndCreate': 'Skip and create my plan',
  'onb.field.age': 'Age',
  'onb.field.weight': 'Weight',
  'onb.field.height': 'Height',
  'onb.calorieGoal': 'Calorie goal',
  'onb.caloriePlaceholder': 'Leave empty = auto',
  'onb.calorieHint': 'Left empty, it’s calculated from your goal and body.',
  'onb.err.mockPlan': 'Couldn’t open the sample plan',
  'onb.err.needGoalLevel': 'Choose a goal and training level before creating a plan.',
  'onb.err.needEquipment': 'Select at least one type of equipment.',

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
