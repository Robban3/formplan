/**
 * Texten på Om-sidan, per språk.
 *
 * Marknadsföringstext hör hemma här av samma skäl som FAQ:n och recepten:
 * ordlistan är för korta gränssnittssträngar, och sex funktionskort plus två
 * stycken löptext hade gjort den svårare att överblicka.
 *
 * Ikon, bakgrund och färg är språkoberoende och ligger kvar i AboutPage —
 * det är layout, inte innehåll.
 */

import type { Lang } from '../i18n'

export interface AboutFeature {
  title: string
  desc: string
}

export interface AboutContent {
  features: AboutFeature[]
  heroTitle: string
  heroBody: string
  missionTitle: string
  missionBody: string
  madeIn: string
  copyright: string
}

const SV: AboutContent = {
  features: [
    {
      title: 'AI-genererade träningsprogram',
      desc: 'Få ett komplett träningsschema byggt kring dina mål, din erfarenhetsnivå och den utrustning du har tillgång till — hemma eller på gym.',
    },
    {
      title: 'Kostdagbok & makrospårning',
      desc: 'Logga måltider snabbt med vår livsmedelsdatabas. Följ protein, kolhydrater, fett och kalorier dag för dag.',
    },
    {
      title: 'Personliga mål',
      desc: 'Sätt konkreta mål — vikt, styrka eller kondition — och se dina framsteg spåras automatiskt i realtid.',
    },
    {
      title: 'Analys & progression',
      desc: 'Visualisera din viktkurva med rullande medelvärde, följ personbästa per övning och se hur ditt kaloriintag förhåller sig till ditt mål.',
    },
    {
      title: 'Utmaningar',
      desc: 'Ta dig an tidsbegränsade utmaningar för att hålla motivationen uppe — från 30-dagarsträning till hydreringsvanor.',
    },
    {
      title: 'AI-coach',
      desc: 'Ställ frågor om träning och kost direkt i appen. Coachen känner till din data och ger svar anpassade till dig.',
    },
  ],
  heroTitle: 'Träna smartare, inte hårdare',
  heroBody:
    'FormPlan är din personliga hälsoapp som kombinerar AI-genererade träningsprogram med noggrann kostspårning. Oavsett om du vill bygga muskler, gå ner i vikt eller bara röra på dig mer — FormPlan anpassar sig efter dig och följer med på hela resan.',
  missionTitle: 'Vår tanke',
  missionBody:
    'Vi tror att bra träning och hållbar kost inte ska kräva en personlig tränare eller dietist. Genom att kombinera modern AI med ett enkelt gränssnitt vill vi göra det lätt för alla att ta kontroll över sin hälsa — på sina egna villkor.',
  madeIn: 'Designad och utvecklad i Sverige',
  copyright: '© 2026 FormPlan. Alla rättigheter förbehållna.',
}

const EN: AboutContent = {
  features: [
    {
      title: 'AI-generated training programs',
      desc: 'Get a complete training plan built around your goals, your experience and the equipment you have — at home or at the gym.',
    },
    {
      title: 'Food diary & macro tracking',
      desc: 'Log meals quickly from our food database. Follow protein, carbs, fat and calories day by day.',
    },
    {
      title: 'Personal goals',
      desc: 'Set concrete goals — weight, strength or endurance — and watch your progress tracked automatically in real time.',
    },
    {
      title: 'Analytics & progression',
      desc: 'Visualise your weight curve with a rolling average, follow personal bests per exercise, and see how your calorie intake compares with your target.',
    },
    {
      title: 'Challenges',
      desc: 'Take on time-limited challenges to keep your motivation up — from 30-day training streaks to hydration habits.',
    },
    {
      title: 'AI coach',
      desc: 'Ask questions about training and nutrition right in the app. The coach knows your data and gives answers tailored to you.',
    },
  ],
  heroTitle: 'Train smarter, not harder',
  heroBody:
    'FormPlan is your personal health app, combining AI-generated training programs with careful nutrition tracking. Whether you want to build muscle, lose weight or simply move more — FormPlan adapts to you and stays with you the whole way.',
  missionTitle: 'Why we built it',
  missionBody:
    'We believe good training and sustainable eating shouldn’t require a personal trainer or a dietitian. By combining modern AI with a simple interface, we want to make it easy for anyone to take control of their health — on their own terms.',
  madeIn: 'Designed and built in Sweden',
  copyright: '© 2026 FormPlan. All rights reserved.',
}

export function aboutContent(lang: Lang): AboutContent {
  return lang === 'sv' ? SV : EN
}
