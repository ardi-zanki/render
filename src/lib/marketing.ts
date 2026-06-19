import type { LucideIcon } from "lucide-react";
import {
  BadgeCheck,
  Building2,
  Camera,
  CloudSun,
  CreditCard,
  FileCheck2,
  FolderKanban,
  ImageIcon,
  Layers3,
  LockKeyhole,
  MessageSquareText,
  Palette,
  RefreshCcw,
  ShieldCheck,
  Sparkles,
  Wand2,
  Zap,
} from "lucide-react";

export type MarketingFeature = {
  icon: LucideIcon;
  title: string;
  desc: string;
};

export type ShowcaseItem = {
  title: string;
  src: string;
  className?: string;
};

export type BlogPost = {
  slug: string;
  title: string;
  excerpt: string;
  category: string;
  date: string;
  readTime: string;
  image: string;
  body: string[];
};

export const publicNavItems = [
  { label: "Fitur", href: "/features" },
  { label: "Harga", href: "/pricing" },
  { label: "Blog", href: "/blog" },
  { label: "Kontak", href: "/contact" },
];

export const landingNavItems = [
  { label: "Fitur", href: "#fitur" },
  { label: "Showcase", href: "#showcase" },
  { label: "Cara Kerja", href: "#cara-kerja" },
  { label: "Harga", href: "#harga" },
  { label: "FAQ", href: "#faq" },
];

export const features: MarketingFeature[] = [
  {
    icon: Camera,
    title: "Input fleksibel",
    desc: "Mulai dari screenshot, sketsa, foto ruang, atau referensi visual.",
  },
  {
    icon: Palette,
    title: "Arahan visual jelas",
    desc: "Atur gaya, mood, cahaya, dan detail yang perlu dijaga.",
  },
  {
    icon: CloudSun,
    title: "Mood cepat dibandingkan",
    desc: "Coba beberapa suasana sebelum produksi visual final.",
  },
  {
    icon: FolderKanban,
    title: "Project rapi",
    desc: "Simpan referensi, output, dan revisi dalam satu tempat.",
  },
  {
    icon: RefreshCcw,
    title: "Variasi mudah dibuat",
    desc: "Buat opsi baru dari arahan atau hasil sebelumnya.",
  },
  {
    icon: BadgeCheck,
    title: "Siap direview",
    desc: "Gunakan output untuk diskusi internal atau review klien.",
  },
];

export const featureGroups: MarketingFeature[] = [
  {
    icon: Wand2,
    title: "AI render dari materi awal",
    desc: "Ubah visual kasar menjadi opsi presentasi awal untuk interior, eksterior, fasad, dan ruang komersial.",
  },
  {
    icon: Layers3,
    title: "Riwayat versi per project",
    desc: "Lacak hasil render, variasi, dan keputusan desain tanpa mencari ulang di folder atau chat.",
  },
  {
    icon: MessageSquareText,
    title: "Catatan brief yang jelas",
    desc: "Arahan visual tersimpan bersama render agar konteks review tidak hilang saat project bergerak.",
  },
  {
    icon: CreditCard,
    title: "Paket kredit fleksibel",
    desc: "Gunakan kredit saat ada eksplorasi atau revisi. Cocok untuk studio yang ritme project-nya berubah.",
  },
  {
    icon: ShieldCheck,
    title: "Workflow akun aman",
    desc: "Autentikasi, verifikasi email, dan pengaturan akun menjaga workspace tetap berada di tangan tim.",
  },
  {
    icon: ImageIcon,
    title: "Output mudah dipakai",
    desc: "Hasil dapat ditinjau, diunduh, dan dibawa ke presentasi internal atau diskusi klien.",
  },
];

export const showcase: ShowcaseItem[] = [
  {
    title: "Bedroom suite hangat",
    src: "/marketing/renderai-bedroom.png",
    className: "md:row-span-2",
  },
  {
    title: "Studio kolaborasi",
    src: "/marketing/renderai-studio.png",
  },
  {
    title: "Living area premium",
    src: "/marketing/renderai-living.png",
  },
  {
    title: "Fasad residence kontemporer",
    src: "/marketing/renderai-facade.png",
    className: "md:col-span-2",
  },
];

export const workflowSteps = [
  {
    step: "01",
    title: "Unggah materi desain",
    desc: "Mulai dari screenshot, foto ruang, atau sketsa.",
  },
  {
    step: "02",
    title: "Lengkapi arahan visual",
    desc: "Pilih gaya, mood, cahaya, dan detail penting.",
  },
  {
    step: "03",
    title: "Review dan bagikan",
    desc: "Simpan hasil, bandingkan, lalu bagikan.",
  },
];

export const faqs = [
  {
    q: "Apa itu RenderAI?",
    a: "RenderAI adalah workspace render berbasis AI untuk membantu tim arsitektur dan interior membuat opsi visual, menata project, dan menyimpan hasil dalam satu alur kerja.",
  },
  {
    q: "Input seperti apa yang bisa digunakan?",
    a: "Anda bisa memulai dari screenshot desain, foto ruang, sketsa, atau visual referensi. Hasil terbaik tetap bergantung pada kualitas input dan arahan visual yang diberikan.",
  },
  {
    q: "Apa bedanya dengan membuat render manual?",
    a: "RenderAI mempercepat eksplorasi konsep dan komunikasi awal. Render manual tetap penting untuk visual final detail, sementara RenderAI membantu tim memilih arah visual lebih cepat.",
  },
  {
    q: "Apakah hasilnya bisa dipakai untuk diskusi klien?",
    a: "Bisa. Hasil render dapat disimpan per project, diunduh, dan dibagikan sebagai bahan diskusi, mood approval, atau perbandingan opsi desain.",
  },
  {
    q: "Bagaimana sistem kreditnya?",
    a: "RenderAI memakai kredit agar penggunaan lebih fleksibel. Anda bisa membeli paket saat diperlukan dan memakai kredit tersebut untuk proses render berikutnya.",
  },
];

export const blogPosts: BlogPost[] = [
  {
    slug: "mempercepat-review-konsep-interior",
    title: "Cara mempercepat review konsep interior tanpa kehilangan arah desain",
    excerpt:
      "Alur sederhana untuk mengubah screenshot awal menjadi opsi visual yang lebih mudah disetujui klien.",
    category: "Workflow",
    date: "18 Juni 2026",
    readTime: "5 menit",
    image: "/marketing/renderai-living.png",
    body: [
      "Review konsep sering melambat bukan karena tim kekurangan ide, tetapi karena visual awal belum cukup jelas untuk dibandingkan. RenderAI membantu mengubah materi awal menjadi beberapa arah visual yang bisa dibahas lebih konkret.",
      "Mulai dengan satu screenshot model atau foto ruang yang paling representatif. Tambahkan arahan singkat tentang gaya, pencahayaan, elemen yang harus dipertahankan, dan mood yang ingin diuji.",
      "Setelah opsi keluar, pilih dua atau tiga visual terbaik untuk diskusi. Cara ini menjaga percakapan tetap fokus pada keputusan desain, bukan pada menebak maksud dari brief.",
    ],
  },
  {
    slug: "mengelola-revisi-render-dengan-rapi",
    title: "Mengelola revisi render agar tidak tercecer di chat dan folder",
    excerpt:
      "Kenapa project, versi, dan catatan brief sebaiknya disimpan bersama sejak eksplorasi pertama.",
    category: "Project",
    date: "14 Juni 2026",
    readTime: "4 menit",
    image: "/marketing/renderai-studio.png",
    body: [
      "Revisi yang tercecer membuat tim sulit menjawab pertanyaan sederhana: visual mana yang disetujui, apa yang berubah, dan kenapa arah tertentu ditinggalkan.",
      "Dengan menyimpan render per project, setiap output memiliki konteks. Tim bisa melihat input, arahan, dan hasil dalam satu tempat sebelum membuat variasi berikutnya.",
      "Kebiasaan ini terlihat kecil, tetapi sangat membantu saat project punya banyak stakeholder dan keputusan harus dilacak beberapa minggu kemudian.",
    ],
  },
  {
    slug: "memilih-paket-kredit-render-ai",
    title: "Memilih paket kredit render AI sesuai ritme project studio",
    excerpt:
      "Panduan praktis untuk menentukan kapan mulai kecil dan kapan menambah kapasitas eksplorasi visual.",
    category: "Pricing",
    date: "9 Juni 2026",
    readTime: "3 menit",
    image: "/marketing/renderai-facade.png",
    body: [
      "Kebutuhan render AI biasanya naik turun mengikuti fase project. Di awal, studio butuh banyak eksplorasi mood. Setelah arah terkunci, kebutuhan bergeser ke revisi dan presentasi.",
      "Paket kecil cocok untuk mencoba alur atau project tunggal. Paket lebih besar lebih efisien ketika tim sedang menangani beberapa project aktif atau sering membuat variasi untuk review.",
      "Yang penting bukan membeli paket terbesar, melainkan menjaga kapasitas visual sesuai ritme keputusan tim.",
    ],
  },
];

export const contactOptions = [
  {
    icon: MessageSquareText,
    title: "Diskusi kebutuhan studio",
    desc: "Ceritakan workflow render yang sedang berjalan dan titik yang ingin dipercepat.",
  },
  {
    icon: FileCheck2,
    title: "Bantuan akun dan pembayaran",
    desc: "Kami bantu cek verifikasi email, paket kredit, transaksi, atau akses akun.",
  },
  {
    icon: LockKeyhole,
    title: "Privasi dan data",
    desc: "Tanyakan pemrosesan data, materi unggahan, dan penghapusan akun.",
  },
];

export const audience = [
  {
    icon: Building2,
    title: "Studio arsitektur",
    desc: "Menyiapkan opsi fasad, massa bangunan, dan mood eksterior untuk diskusi awal.",
  },
  {
    icon: Sparkles,
    title: "Interior designer",
    desc: "Mencoba gaya, palet, ambience, dan pencahayaan sebelum produksi visual final.",
  },
  {
    icon: Zap,
    title: "Developer dan kontraktor",
    desc: "Membuat visual pembanding yang cepat untuk presentasi konsep dan koordinasi tim.",
  },
];
