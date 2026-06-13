import type { LucideIcon } from 'lucide-react'
import {
  Home,
  Leaf,
  Dumbbell,
  BarChart3,
  MoreHorizontal,
  ChevronRight,
  ChevronLeft,
  Check,
  Play,
  Pause,
  X,
  Plus,
  Flame,
  User,
  Settings,
  Bell,
  Clock,
  Heart,
  HelpCircle,
  Info,
  LogOut,
  Target,
  BookOpen,
  Droplet,
  Utensils,
  GlassWater,
  Trophy,
  Share2,
  Bot,
  Zap,
  TrendingUp,
  MessageSquare,
  Star,
  Award,
  Send,
  ChevronUp,
  ChevronDown,
  Ruler,
  ShoppingCart,
  Camera,
  ScanBarcode,
  Search,
} from 'lucide-react'

interface IconProps {
  className?: string
}

function wrap(Icon: LucideIcon, strokeWidth = 1.75) {
  return function LucideWrapped({ className }: IconProps) {
    return <Icon className={className} strokeWidth={strokeWidth} />
  }
}

export const HomeIcon = wrap(Home)
export const LeafIcon = wrap(Leaf)
export const DumbbellIcon = wrap(Dumbbell)
export const BarChartIcon = wrap(BarChart3)
export const MoreHorizontalIcon = wrap(MoreHorizontal)
export const ChevronRightIcon = wrap(ChevronRight, 2)
export const ChevronLeftIcon = wrap(ChevronLeft, 2)
export const CheckIcon = wrap(Check, 2.5)
export const PlayIcon = wrap(Play, 2)
export const PauseIcon = wrap(Pause, 2)
export const XIcon = wrap(X, 2)
export const PlusIcon = wrap(Plus, 2)
export const FireIcon = wrap(Flame)
export const UserIcon = wrap(User)
export const SettingsIcon = wrap(Settings)
export const BellIcon = wrap(Bell)
export const ClockIcon = wrap(Clock)
export const HeartIcon = wrap(Heart)
export const HelpCircleIcon = wrap(HelpCircle)
export const InfoIcon = wrap(Info)
export const LogOutIcon = wrap(LogOut)
export const TargetIcon = wrap(Target)
export const BookOpenIcon = wrap(BookOpen)
export const DropletIcon = wrap(Droplet)
export const UtensilsIcon = wrap(Utensils)
/** Lucide `glass-water` — vattenlogg & snabbval */
export const GlassWaterIcon = wrap(GlassWater)
/** @deprecated Använd GlassWaterIcon */
export const WaterGlassIcon = GlassWaterIcon
export const TrophyIcon = wrap(Trophy)
export const ShareIcon = wrap(Share2)
export const BotIcon = wrap(Bot)
export const ZapIcon = wrap(Zap)
export const TrendingUpIcon = wrap(TrendingUp)
export const MessageSquareIcon = wrap(MessageSquare)
export const StarIcon = wrap(Star)
export const AwardIcon = wrap(Award)
export const SendIcon = wrap(Send, 2)
export const ChevronUpIcon = wrap(ChevronUp, 2)
export const ChevronDownIcon = wrap(ChevronDown, 2)
export const RulerIcon = wrap(Ruler)
export const ShoppingCartIcon = wrap(ShoppingCart)
export const CameraIcon = wrap(Camera)
export const ScanBarcodeIcon = wrap(ScanBarcode)
export const SearchIcon = wrap(Search)
