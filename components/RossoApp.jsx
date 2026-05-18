'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  Globe, Menu, X, ChevronRight, ChevronLeft, ChevronDown,
  Wrench, Gauge, ShieldCheck, Timer, Truck, Sparkles,
  Car, MapPin, Calendar, Clock, User, Phone, Mail, MessageCircle,
  Cog, Battery, Snowflake, Disc, Zap, Search, AlertTriangle,
  Check, Plus, Upload, FileText, Award, Star, ArrowRight,
  Building2, Home, ArrowUpRight, Send, Instagram, Facebook,
  LayoutDashboard, Copy, RefreshCw
} from 'lucide-react';
import {
  saveBooking, loadDraft, saveDraft, clearDraft, formatBookingMessage
} from '@/lib/bookings';

// ─────────────────────────────────────────────────────────────
// TRANSLATIONS
// ─────────────────────────────────────────────────────────────
const translations = {
  en: {
    nav: { home: 'Home', services: 'Services', book: 'Book Service', about: 'About', contact: 'Contact' },
    hero: {
      tagline: 'BACK ROLLING IN NO TIME',
      title1: 'PRECISION',
      title2: 'IN MOTION',
      subtitle: 'Authorized luxury service for BMW, MINI, Range Rover and Jaguar. Operated by master technicians. Engineered for those who refuse compromise.',
      cta: 'Book Your Service',
      stats: [
        { value: '12K+', label: 'Vehicles Serviced' },
        { value: '5', label: 'Years of Expertise' },
        { value: '24H', label: 'Avg. Turnaround' },
        { value: '100%', label: 'Genuine Parts' },
      ]
    },
    why: {
      eyebrow: '— WHY ROSSO',
      title: 'Built for the Marques That Matter',
      subtitle: 'Six pillars that define every service we deliver.',
      items: [
        { title: 'Marque Specialists', desc: 'Technicians trained exclusively on BMW, MINI, Range Rover and Jaguar architectures.' },
        { title: 'Premium Diagnostics', desc: 'Dealer-grade diagnostic systems with full ECU read access and live data telemetry.' },
        { title: 'Genuine Parts Only', desc: 'OEM-sourced components with full traceability and manufacturer warranty.' },
        { title: 'Rapid Turnaround', desc: 'Most services completed within 48 hours. Loaner vehicles available on request.' },
        { title: 'Mobile Service', desc: 'Our team comes to your home or office. Premium care, on your schedule.' },
        { title: 'White-Glove Experience', desc: 'Lounge, espresso, status updates, and your car returned cleaner than you left it.' },
      ]
    },
    services: {
      eyebrow: '— THE GARAGE',
      title: 'Services',
      subtitle: 'From routine maintenance to complete restorations.',
      items: [
        { code: '01', title: 'Engine & Mechanical', desc: 'Complete engine diagnostics, timing systems, gaskets, full mechanical overhauls.' },
        { code: '02', title: 'Electrical & ECU', desc: 'Coding, programming, module replacement, advanced wiring diagnostics.' },
        { code: '03', title: 'Brakes & Suspension', desc: 'Performance pads, rotors, air suspension, ride-height calibration.' },
        { code: '04', title: 'Climate Systems', desc: 'A/C diagnostics, compressor service, recharge, cabin air quality.' },
        { code: '05', title: 'Transmission', desc: 'Gearbox service, mechatronic units, DSG/ZF fluid replacement.' },
        { code: '06', title: 'Bodywork & Detail', desc: 'Paint correction, ceramic coating, interior detailing, light bodywork.' },
      ]
    },
    booking: {
      eyebrow: '— RESERVATION',
      title: 'Book Your Service',
      subtitle: 'Seven steps. Two minutes. Direct to our service team via WhatsApp.',
      steps: ['Brand', 'Model', 'Chassis', 'Service', 'Location', 'Schedule', 'Contact'],
      step1: { title: 'Select Your Marque', subtitle: 'Choose the manufacturer of your vehicle.' },
      step2: { title: 'Select Your Model', subtitle: 'Choose the specific model and trim.' },
      step3: { title: 'Chassis Identification', subtitle: 'Enter your VIN or chassis number for accurate service records.', label: 'VIN / Chassis Number', placeholder: 'e.g. WBAVA31050NL27420', helper: '17 characters — usually found on the dashboard or driver-side door frame.' },
      step4: {
        title: 'Service Request',
        subtitle: 'Tell us what your vehicle needs.',
        quickLabel: 'Quick Select',
        descLabel: 'Describe the issue',
        descPlaceholder: 'Example: oil change, brake noise on cold start, engine vibration at idle, AC not cooling, suspension knock over bumps, gearbox jerking, full inspection...',
        sparesQuestion: 'Are you requesting a spare part?',
        sparesYes: 'Yes',
        sparesNo: 'No',
        partName: 'Part name',
        partNamePh: 'e.g. Front brake pads',
        partDesc: 'Part description',
        partDescPh: 'Specifications, part number, or details',
        partImage: 'Upload image (optional)',
        partImageHint: 'Drop image or click to browse',
        partNotes: 'Additional notes',
        partNotesPh: 'Anything else we should know about the part',
        quickServices: ['Oil Change', 'Diagnostics', 'Brake Service', 'A/C Service', 'Full Inspection', 'Battery Service', 'Suspension', 'Electrical', 'Mechanical', 'Emergency'],
      },
      step5: {
        title: 'Service Location',
        subtitle: 'Where would you like the service performed?',
        center: 'Service Center Visit',
        centerDesc: 'Bring your vehicle to the ROSSO workshop. Lounge, espresso, status updates included.',
        mobile: 'Mobile / Home Service',
        mobileDesc: 'Our team and equipment come to you. Available for selected services.',
        address: 'Address',
        addressPh: 'Building, street, district, city',
        mapsLink: 'Google Maps link (optional)',
        mapsLinkPh: 'Paste a maps.google.com link to your location',
        locNotes: 'Access notes',
        locNotesPh: 'Gate code, parking instructions, contact at location...',
      },
      step6: {
        title: 'Choose Date & Time',
        subtitle: 'Select your preferred appointment.',
        dateLabel: 'Appointment Date',
        timeLabel: 'Appointment Time',
        timeSlots: ['09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00', '18:00']
      },
      step7: {
        title: 'Your Contact Details',
        subtitle: 'How should we reach you?',
        name: 'Full Name',
        namePh: 'Your full name',
        phone: 'Phone Number',
        phonePh: '+20 1XX XXX XXXX',
        whatsapp: 'WhatsApp Number',
        whatsappPh: 'If different from phone',
        email: 'Email (optional)',
        emailPh: 'you@example.com',
      },
      back: 'Back',
      next: 'Continue',
      submit: 'Confirm Booking via WhatsApp',
      required: 'Required',
      brands: ['BMW', 'MINI', 'Range Rover', 'Jaguar'],
      brandTags: ['Bavarian Engineering', 'British Icon', 'Off-Road Royalty', 'British Performance']
    },
    faq: {
      eyebrow: '— ANSWERS',
      title: 'Frequently Asked',
      items: [
        { q: 'Are you an authorized service center?', a: 'ROSSO operates as an independent premium specialist focused exclusively on BMW, MINI, Range Rover and Jaguar. We use OEM and dealer-grade diagnostic equipment and genuine parts.' },
        { q: 'Does servicing with ROSSO affect my warranty?', a: 'No. As long as we use genuine parts and follow manufacturer service intervals — which we always do — your manufacturer warranty remains valid under regional consumer law.' },
        { q: 'How long does a typical service take?', a: 'Routine maintenance is usually completed within 4–8 hours. More complex repairs typically take 24–48 hours. We provide accurate timelines after diagnosis.' },
        { q: 'Can you collect and deliver my vehicle?', a: 'Yes. We offer pickup and drop-off within the city, and our mobile service unit can perform many services at your home or office.' },
        { q: 'How do I pay?', a: 'We accept all major cards, bank transfer, and cash. A detailed invoice is issued before any work begins — no surprises.' },
        { q: 'Do you handle insurance claims?', a: 'Yes — we work with major insurers and can manage the paperwork on your behalf for covered repairs.' },
      ]
    },
    footer: {
      tagline: 'Back Rolling In No Time.',
      contact: 'Contact',
      hours: 'Hours',
      hoursDays: 'Saturday — Thursday',
      hoursTime: '09:00 — 19:00',
      address: 'Street 3, Industrial Area, New Cairo 3, Cairo, Egypt',
      openMaps: 'Open in Google Maps',
      quick: 'Navigate',
      legal: 'Legal',
      privacy: 'Privacy',
      terms: 'Terms',
      copy: '© 2026 ROSSO Automotive. All rights reserved.'
    },
    common: { language: 'EN', whatsapp: 'WhatsApp Us' }
  },
  ar: {
    nav: { home: 'الرئيسية', services: 'الخدمات', book: 'احجز خدمتك', about: 'من نحن', contact: 'تواصل معنا' },
    hero: {
      tagline: 'عودة سريعة إلى الطريق',
      title1: 'الدقة',
      title2: 'في الحركة',
      subtitle: 'خدمة فاخرة معتمدة لسيارات BMW و MINI و Range Rover و Jaguar. على يد فنيين خبراء، لمن لا يقبلون أنصاف الحلول.',
      cta: 'احجز خدمتك الآن',
      stats: [
        { value: '+12K', label: 'سيارة تمت خدمتها' },
        { value: '5', label: 'سنوات من الخبرة' },
        { value: '24س', label: 'متوسط زمن التسليم' },
        { value: '100٪', label: 'قطع غيار أصلية' },
      ]
    },
    why: {
      eyebrow: '— لماذا روسو',
      title: 'صُمّمنا لأرقى العلامات',
      subtitle: 'ستة مرتكزات تحدد كل خدمة نقدمها.',
      items: [
        { title: 'فنيون متخصصون', desc: 'فنيون مدربون حصرياً على هندسة BMW و MINI و Range Rover و Jaguar.' },
        { title: 'تشخيص متقدم', desc: 'أنظمة تشخيص بمستوى الوكيل المعتمد مع قراءة كاملة لوحدات التحكم.' },
        { title: 'قطع غيار أصلية', desc: 'مكونات من المصنع الأصلي مع ضمان كامل وقابلية تتبّع.' },
        { title: 'تسليم سريع', desc: 'معظم الخدمات تكتمل خلال 48 ساعة. سيارات بديلة متاحة عند الطلب.' },
        { title: 'خدمة متنقلة', desc: 'فريقنا يأتي إليك في المنزل أو المكتب. خدمة فاخرة بمواعيدك.' },
        { title: 'تجربة استثنائية', desc: 'صالة انتظار، قهوة، تحديثات لحظية، وسيارتك أنظف ممّا سلّمتها.' },
      ]
    },
    services: {
      eyebrow: '— الورشة',
      title: 'خدماتنا',
      subtitle: 'من الصيانة الدورية حتى الترميم الكامل.',
      items: [
        { code: '٠١', title: 'المحرك والميكانيكا', desc: 'تشخيص المحرك، أنظمة التوقيت، الإصلاحات الميكانيكية الشاملة.' },
        { code: '٠٢', title: 'الكهرباء والتحكم', desc: 'برمجة وحدات ECU، استبدال الموديولات، تشخيص الأسلاك المتقدم.' },
        { code: '٠٣', title: 'الفرامل والمساعدات', desc: 'بطانات أداء، أقراص، تعليق هوائي، معايرة الارتفاع.' },
        { code: '٠٤', title: 'أنظمة التكييف', desc: 'تشخيص التكييف، خدمة الضاغط، شحن الفريون، تنقية الهواء.' },
        { code: '٠٥', title: 'ناقل الحركة', desc: 'صيانة الجيربوكس، وحدات الميكاترونيك، تغيير زيوت DSG/ZF.' },
        { code: '٠٦', title: 'الهيكل والتلميع', desc: 'تصحيح الطلاء، طلاء سيراميك، تنظيف داخلي، أعمال هيكل خفيفة.' },
      ]
    },
    booking: {
      eyebrow: '— الحجز',
      title: 'احجز خدمتك',
      subtitle: 'سبع خطوات. دقيقتان. مباشرة إلى فريقنا عبر واتساب.',
      steps: ['الماركة', 'الموديل', 'الشاسيه', 'الخدمة', 'الموقع', 'الموعد', 'البيانات'],
      step1: { title: 'اختر علامتك التجارية', subtitle: 'اختر الشركة المصنّعة لسيارتك.' },
      step2: { title: 'اختر الموديل', subtitle: 'اختر الموديل المحدد.' },
      step3: { title: 'رقم الشاسيه', subtitle: 'أدخل رقم VIN أو الشاسيه لسجل خدمة دقيق.', label: 'رقم VIN / الشاسيه', placeholder: 'مثال: WBAVA31050NL27420', helper: '17 رمزاً — عادةً على لوحة العدادات أو إطار باب السائق.' },
      step4: {
        title: 'طلب الخدمة',
        subtitle: 'أخبرنا بما تحتاجه سيارتك.',
        quickLabel: 'اختيار سريع',
        descLabel: 'صف المشكلة',
        descPlaceholder: 'مثال: تغيير زيت، صوت فرامل عند البرودة، اهتزاز في المحرك، التكييف لا يبرّد، صوت تعليق على المطبّات، فحص شامل...',
        sparesQuestion: 'هل تطلب قطعة غيار؟',
        sparesYes: 'نعم',
        sparesNo: 'لا',
        partName: 'اسم القطعة',
        partNamePh: 'مثال: بطانات فرامل أمامية',
        partDesc: 'وصف القطعة',
        partDescPh: 'المواصفات أو رقم القطعة',
        partImage: 'رفع صورة (اختياري)',
        partImageHint: 'أسقط الصورة أو انقر للاختيار',
        partNotes: 'ملاحظات إضافية',
        partNotesPh: 'أي تفاصيل أخرى عن القطعة',
        quickServices: ['تغيير الزيت', 'تشخيص', 'خدمة الفرامل', 'خدمة التكييف', 'فحص شامل', 'البطارية', 'التعليق', 'كهرباء', 'ميكانيكا', 'طوارئ'],
      },
      step5: {
        title: 'موقع الخدمة',
        subtitle: 'أين تفضّل تنفيذ الخدمة؟',
        center: 'زيارة مركز الخدمة',
        centerDesc: 'أحضر سيارتك إلى ورشة روسو. صالة، قهوة، تحديثات.',
        mobile: 'خدمة منزلية / متنقلة',
        mobileDesc: 'فريقنا ومعداتنا يأتون إليك. متاحة لخدمات مختارة.',
        address: 'العنوان',
        addressPh: 'المبنى، الشارع، الحي، المدينة',
        mapsLink: 'رابط خرائط جوجل (اختياري)',
        mapsLinkPh: 'الصق رابط موقعك من خرائط جوجل',
        locNotes: 'ملاحظات الوصول',
        locNotesPh: 'كود البوابة، تعليمات الموقف، جهة الاتصال...',
      },
      step6: {
        title: 'اختر التاريخ والوقت',
        subtitle: 'حدد موعدك المفضّل.',
        dateLabel: 'تاريخ الموعد',
        timeLabel: 'وقت الموعد',
        timeSlots: ['٠٩:٠٠', '١٠:٠٠', '١١:٠٠', '١٢:٠٠', '١٣:٠٠', '١٤:٠٠', '١٥:٠٠', '١٦:٠٠', '١٧:٠٠', '١٨:٠٠']
      },
      step7: {
        title: 'بياناتك',
        subtitle: 'كيف نتواصل معك؟',
        name: 'الاسم الكامل',
        namePh: 'اسمك بالكامل',
        phone: 'رقم الهاتف',
        phonePh: '+20 1XX XXX XXXX',
        whatsapp: 'رقم واتساب',
        whatsappPh: 'إذا اختلف عن الهاتف',
        email: 'البريد الإلكتروني (اختياري)',
        emailPh: 'you@example.com',
      },
      back: 'رجوع',
      next: 'متابعة',
      submit: 'تأكيد الحجز عبر واتساب',
      required: 'مطلوب',
      brands: ['BMW', 'MINI', 'Range Rover', 'Jaguar'],
      brandTags: ['هندسة بافارية', 'أيقونة بريطانية', 'ملك الطرق الوعرة', 'أداء بريطاني']
    },
    faq: {
      eyebrow: '— الإجابات',
      title: 'الأسئلة الشائعة',
      items: [
        { q: 'هل أنتم مركز خدمة معتمد؟', a: 'يعمل روسو كمتخصص فاخر مستقل يركّز حصرياً على BMW و MINI و Range Rover و Jaguar. نستخدم معدات تشخيص بمستوى الوكيل وقطع غيار أصلية.' },
        { q: 'هل تؤثر الخدمة لدى روسو على ضمان السيارة؟', a: 'لا. ما دمنا نستخدم قطع غيار أصلية ونتبع جداول الصيانة من الشركة المصنّعة — وهذا ما نفعله دائماً — يبقى الضمان سارياً.' },
        { q: 'كم تستغرق الخدمة عادةً؟', a: 'الصيانة الدورية تكتمل عادةً خلال 4–8 ساعات. الإصلاحات الأكثر تعقيداً تستغرق 24–48 ساعة. نقدّم جدولاً دقيقاً بعد التشخيص.' },
        { q: 'هل توفّرون استلام وتوصيل السيارة؟', a: 'نعم. نوفّر خدمة استلام وتوصيل داخل المدينة، ووحدتنا المتنقلة تنفّذ كثيراً من الخدمات في منزلك أو مكتبك.' },
        { q: 'كيف يمكنني الدفع؟', a: 'نقبل جميع البطاقات الرئيسية، التحويل البنكي، والنقد. تُصدر فاتورة تفصيلية قبل بدء أي عمل — بلا مفاجآت.' },
        { q: 'هل تتعاملون مع مطالبات التأمين؟', a: 'نعم — نتعامل مع كبرى شركات التأمين ويمكننا إدارة الأوراق نيابةً عنك للإصلاحات المغطاة.' },
      ]
    },
    footer: {
      tagline: 'عودة سريعة إلى الطريق.',
      contact: 'تواصل معنا',
      hours: 'مواعيد العمل',
      hoursDays: 'السبت — الخميس',
      hoursTime: '٠٩:٠٠ — ١٩:٠٠',
      address: 'شارع 3، المنطقة الصناعية، القاهرة الجديدة 3، القاهرة، مصر',
      openMaps: 'افتح في خرائط جوجل',
      quick: 'تنقّل',
      legal: 'قانوني',
      privacy: 'الخصوصية',
      terms: 'الشروط',
      copy: '© 2026 روسو للسيارات. جميع الحقوق محفوظة.'
    },
    common: { language: 'AR', whatsapp: 'تواصل عبر واتساب' }
  }
};

const MODELS = {
  BMW: ['116', '118', '120', '316', '318', '320', '330', '520', '530', '730', 'X1', 'X3', 'X4', 'X5', 'X6', 'X7', 'M2', 'M3', 'M4', 'M5'],
  MINI: ['Cooper', 'Cooper S', 'Countryman', 'Clubman', 'JCW'],
  'Range Rover': ['Evoque', 'Velar', 'Sport', 'Vogue', 'Defender'],
  Jaguar: ['XE', 'XF', 'XJ', 'F-Pace', 'E-Pace', 'F-Type']
};

const QUICK_ICONS = [Wrench, Search, Disc, Snowflake, ShieldCheck, Battery, Cog, Zap, Wrench, AlertTriangle];

// ─────────────────────────────────────────────────────────────
// ROSSO LOGO COMPONENT
// ─────────────────────────────────────────────────────────────
const RossoLogo = ({ className = '', size = 'md' }) => {
  const sizes = { sm: 'text-xl', md: 'text-2xl', lg: 'text-5xl', xl: 'text-7xl' };
  return (
    <div className={`inline-flex items-baseline ${className}`}>
      <span style={{ fontFamily: "'Audiowide', sans-serif", letterSpacing: '-0.04em' }}
            className={`${sizes[size]} font-normal text-[#E10600] leading-none`}>
        ROSSO
      </span>
      <span className="text-[#E10600] text-xs ml-0.5">®</span>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────
// BUSINESS INFO — single source of truth
// ─────────────────────────────────────────────────────────────
const BUSINESS = {
  phone: '+201101139997',
  phoneDisplay: '+20 110 113 9997',
  whatsappNumber: '201101139997',
  whatsappUrl: 'https://wa.me/201101139997',
  mapsUrl: 'https://maps.app.goo.gl/D8RtZDZzfygNJ85D7',
  mapsEmbedUrl: 'https://www.google.com/maps/place/ROSSO+Auto+Service/@29.9714364,31.4853452,17z',
  coords: { lat: 29.9714364, lng: 31.4853452 },
  social: {
    instagram: 'https://www.instagram.com/rosso_as/?hl=en',
    facebook: 'https://www.facebook.com/profile.php?id=61586938598802',
  },
};

// ─────────────────────────────────────────────────────────────
// MAIN APP
// ─────────────────────────────────────────────────────────────
export default function RossoApp() {
  const [lang, setLang] = useState('en');
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const t = translations[lang];
  const isRTL = lang === 'ar';

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 30);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const bodyFont = isRTL ? "'Tajawal', sans-serif" : "'Archivo', sans-serif";

  const scrollTo = (id) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    setMenuOpen(false);
  };

  return (
    <div dir={isRTL ? 'rtl' : 'ltr'} className="min-h-screen bg-[#0A0A0A] text-white selection:bg-[#E10600] selection:text-white"
         style={{ fontFamily: bodyFont }}>
      <Navbar lang={lang} setLang={setLang} scrolled={scrolled} menuOpen={menuOpen} setMenuOpen={setMenuOpen} t={t} scrollTo={scrollTo} isRTL={isRTL} />
      <Hero t={t} scrollTo={scrollTo} isRTL={isRTL} />
      <MarqueeTicker isRTL={isRTL} />
      <WhyChoose t={t} isRTL={isRTL} />
      <Services t={t} isRTL={isRTL} />
      <BookingSection t={t} lang={lang} isRTL={isRTL} />
      <FAQ t={t} isRTL={isRTL} />
      <Footer t={t} isRTL={isRTL} scrollTo={scrollTo} />
      <FloatingWhatsApp />
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// NAVBAR
// ─────────────────────────────────────────────────────────────
function Navbar({ lang, setLang, scrolled, menuOpen, setMenuOpen, t, scrollTo, isRTL }) {
  const links = [
    { id: 'home', label: t.nav.home },
    { id: 'services', label: t.nav.services },
    { id: 'booking', label: t.nav.book },
    { id: 'faq', label: t.nav.contact }
  ];

  return (
    <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${scrolled ? 'bg-black/85 backdrop-blur-xl border-b border-white/5' : 'bg-transparent'}`}>
      <div className="max-w-[1400px] mx-auto px-5 md:px-10 h-16 md:h-20 flex items-center justify-between">
        <button onClick={() => scrollTo('home')} className="cursor-pointer">
          <RossoLogo size="md" />
        </button>

        <nav className="hidden lg:flex items-center gap-10">
          {links.map(l => (
            <button key={l.id} onClick={() => scrollTo(l.id)}
                    className="text-xs uppercase tracking-[0.2em] text-white/70 hover:text-white transition-colors relative group">
              {l.label}
              <span className="absolute -bottom-1 left-0 right-0 h-px bg-[#E10600] scale-x-0 group-hover:scale-x-100 transition-transform origin-left" />
            </button>
          ))}
        </nav>

        <div className="flex items-center gap-3 md:gap-5">
          <button onClick={() => setLang(lang === 'en' ? 'ar' : 'en')}
                  className="hidden md:flex items-center gap-2 px-3 py-1.5 border border-white/15 hover:border-[#E10600] hover:bg-[#E10600]/10 transition-all text-xs uppercase tracking-widest">
            <Globe size={12} />
            <span>{lang === 'en' ? 'AR' : 'EN'}</span>
          </button>
          <button onClick={() => scrollTo('booking')}
                  className="hidden md:inline-flex items-center gap-2 bg-[#E10600] hover:bg-[#FF1A0F] text-white px-5 py-2.5 text-xs uppercase tracking-widest font-bold transition-all">
            {t.nav.book}
            <ArrowRight size={14} className={isRTL ? 'rotate-180' : ''} />
          </button>
          <button onClick={() => setMenuOpen(!menuOpen)} className="lg:hidden text-white">
            {menuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {menuOpen && (
        <div className="lg:hidden absolute top-full left-0 right-0 bg-black/95 backdrop-blur-xl border-b border-white/5 anim-fade-in">
          <div className="px-5 py-6 flex flex-col gap-1">
            {links.map(l => (
              <button key={l.id} onClick={() => scrollTo(l.id)}
                      className="py-3 px-2 text-start uppercase tracking-widest text-sm text-white/80 hover:text-[#E10600] border-b border-white/5">
                {l.label}
              </button>
            ))}
            <div className="flex gap-3 mt-4">
              <button onClick={() => setLang(lang === 'en' ? 'ar' : 'en')}
                      className="flex-1 py-3 border border-white/15 text-xs uppercase tracking-widest">
                {lang === 'en' ? 'العربية' : 'English'}
              </button>
              <button onClick={() => scrollTo('booking')}
                      className="flex-1 py-3 bg-[#E10600] text-xs uppercase tracking-widest font-bold">
                {t.nav.book}
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}

// ─────────────────────────────────────────────────────────────
// HERO
// ─────────────────────────────────────────────────────────────
function Hero({ t, scrollTo, isRTL }) {
  return (
    <section id="home" className="relative min-h-screen flex items-end overflow-hidden grain">
      {/* Layered cinematic background */}
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-gradient-to-br from-[#1a0000] via-[#0A0A0A] to-black" />
        <div className="absolute inset-0" style={{
          backgroundImage: 'radial-gradient(circle at 30% 50%, rgba(225,6,0,0.18) 0%, transparent 50%), radial-gradient(circle at 80% 20%, rgba(225,6,0,0.10) 0%, transparent 40%)'
        }} />
        {/* SVG car silhouette */}
        <svg className="absolute bottom-0 right-0 w-[140%] md:w-[80%] h-auto opacity-[0.07] -mb-20 -mr-20" viewBox="0 0 1200 400" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M50 320 L150 320 C150 290, 180 270, 220 270 L380 270 C420 270, 450 280, 480 240 L580 180 C620 140, 680 130, 760 130 L900 130 C960 130, 1010 160, 1040 220 L1100 240 C1130 250, 1140 280, 1140 320 L1050 320 C1050 360, 1020 380, 980 380 C940 380, 910 360, 910 320 L290 320 C290 360, 260 380, 220 380 C180 380, 150 360, 150 320 Z" stroke="#E10600" strokeWidth="2" fill="rgba(225,6,0,0.05)"/>
          <circle cx="220" cy="320" r="45" stroke="#E10600" strokeWidth="2" fill="none"/>
          <circle cx="220" cy="320" r="25" stroke="#E10600" strokeWidth="1" fill="none"/>
          <circle cx="980" cy="320" r="45" stroke="#E10600" strokeWidth="2" fill="none"/>
          <circle cx="980" cy="320" r="25" stroke="#E10600" strokeWidth="1" fill="none"/>
        </svg>
        {/* Grid */}
        <div className="absolute inset-0 opacity-[0.15]" style={{
          backgroundImage: 'linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)',
          backgroundSize: '60px 60px'
        }} />
        <div className="absolute bottom-0 left-0 right-0 h-40 bg-gradient-to-t from-[#0A0A0A] to-transparent" />
      </div>

      {/* Vertical side text */}
      <div className={`hidden md:flex absolute ${isRTL ? 'right-6' : 'left-6'} top-1/2 -translate-y-1/2 flex-col items-center gap-6 text-[10px] uppercase tracking-[0.4em] text-white/30`}
           style={{ writingMode: 'vertical-rl', transform: 'translateY(-50%) rotate(180deg)' }}>
        <span>EST. 2021 — NEW CAIRO</span>
      </div>

      <div className="relative max-w-[1400px] mx-auto px-5 md:px-10 py-32 md:py-40 w-full">
        <div className="anim-fade-up flex items-center gap-3 mb-6" style={{ animationDelay: '0.1s' }}>
          <span className="w-12 h-px bg-[#E10600]" />
          <span className="text-[10px] md:text-xs uppercase tracking-[0.4em] text-[#E10600] font-bold">{t.hero.tagline}</span>
        </div>

        <h1 className="anim-fade-up display-font leading-[0.85] text-[18vw] md:text-[12vw] lg:text-[10rem] tracking-tight uppercase"
            style={{ animationDelay: '0.2s' }}>
          <span className="block">{t.hero.title1}</span>
          <span className="block text-[#E10600] italic">{t.hero.title2}</span>
        </h1>

        <p className="anim-fade-up max-w-xl text-white/60 text-base md:text-lg mt-8 md:mt-10 leading-relaxed"
           style={{ animationDelay: '0.4s' }}>
          {t.hero.subtitle}
        </p>

        <div className="anim-fade-up mt-10 md:mt-12 flex flex-col sm:flex-row items-start sm:items-center gap-5" style={{ animationDelay: '0.5s' }}>
          <button onClick={() => scrollTo('booking')}
                  className="group bg-[#E10600] hover:bg-white hover:text-black text-white px-8 py-4 text-xs uppercase tracking-[0.25em] font-bold flex items-center gap-3 transition-all duration-300 anim-pulse-red">
            {t.hero.cta}
            <ArrowRight size={16} className={`group-hover:translate-x-1 transition-transform ${isRTL ? 'rotate-180 group-hover:-translate-x-1' : ''}`} />
          </button>
          <div className="flex items-center gap-3 text-xs uppercase tracking-widest text-white/40">
            <div className="flex">
              {[...Array(5)].map((_, i) => (
                <Star key={i} size={12} fill="#E10600" className="text-[#E10600]" />
              ))}
            </div>
            <span>4.9 / 5</span>
          </div>
        </div>

        {/* Stats strip */}
        <div className="anim-fade-up mt-16 md:mt-24 grid grid-cols-2 md:grid-cols-4 gap-px bg-white/10 border-y border-white/10" style={{ animationDelay: '0.7s' }}>
          {t.hero.stats.map((stat, i) => (
            <div key={i} className="bg-[#0A0A0A] px-5 py-6 md:py-8 flex flex-col gap-2 hover:bg-[#E10600]/10 transition-colors group">
              <span className="mono-font text-3xl md:text-5xl text-white group-hover:text-[#E10600] transition-colors">
                {stat.value}
              </span>
              <span className="text-[10px] md:text-xs uppercase tracking-[0.2em] text-white/40">
                {stat.label}
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─────────────────────────────────────────────────────────────
// MARQUEE TICKER
// ─────────────────────────────────────────────────────────────
function MarqueeTicker({ isRTL }) {
  const items = ['BMW', 'MINI', 'RANGE ROVER', 'JAGUAR', 'AUTHORIZED SPECIALIST', 'GENUINE PARTS', 'DEALER-GRADE DIAGNOSTICS'];
  return (
    <div className="relative bg-[#E10600] py-5 overflow-hidden border-y border-black/20">
      <div className="flex anim-ticker whitespace-nowrap">
        {[...Array(2)].map((_, i) => (
          <div key={i} className="flex items-center gap-12 px-6 shrink-0">
            {items.map((item, j) => (
              <div key={j} className="flex items-center gap-12 shrink-0">
                <span className="mono-font text-lg md:text-2xl text-white tracking-wider">{item}</span>
                <span className="w-2 h-2 bg-white rounded-full" />
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// WHY CHOOSE
// ─────────────────────────────────────────────────────────────
function WhyChoose({ t, isRTL }) {
  const icons = [Wrench, Gauge, ShieldCheck, Timer, Truck, Sparkles];
  return (
    <section className="relative py-24 md:py-40 px-5 md:px-10 bg-[#0A0A0A] grain">
      <div className="max-w-[1400px] mx-auto">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-10 mb-16 md:mb-24">
          <div className="max-w-2xl">
            <span className="text-xs uppercase tracking-[0.4em] text-[#E10600] font-bold">{t.why.eyebrow}</span>
            <h2 className="display-font text-5xl md:text-7xl mt-5 leading-[0.95] uppercase">
              {t.why.title}
            </h2>
          </div>
          <p className="text-white/50 text-lg max-w-md">{t.why.subtitle}</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-px bg-white/5 border border-white/5">
          {t.why.items.map((item, i) => {
            const Icon = icons[i];
            return (
              <div key={i}
                   className="group relative bg-[#0A0A0A] p-8 md:p-10 hover:bg-[#141414] transition-all duration-500 cursor-pointer overflow-hidden">
                <div className="absolute top-0 left-0 right-0 h-px bg-[#E10600] origin-left scale-x-0 group-hover:scale-x-100 transition-transform duration-500" />
                <div className="absolute top-5 right-5 text-[10px] mono-font text-white/20 group-hover:text-[#E10600] transition-colors">
                  0{i + 1}
                </div>
                <Icon size={36} strokeWidth={1} className="text-[#E10600] mb-8 group-hover:scale-110 transition-transform duration-500" />
                <h3 className="display-font text-xl md:text-2xl uppercase mb-4 leading-tight">{item.title}</h3>
                <p className="text-white/50 text-sm leading-relaxed">{item.desc}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

// ─────────────────────────────────────────────────────────────
// SERVICES
// ─────────────────────────────────────────────────────────────
function Services({ t, isRTL }) {
  return (
    <section id="services" className="relative py-24 md:py-40 px-5 md:px-10 bg-[#080808] overflow-hidden">
      {/* Diagonal red accent */}
      <div className="absolute top-0 right-0 w-1/2 h-full opacity-[0.04] pointer-events-none"
           style={{ background: 'linear-gradient(45deg, transparent, #E10600 50%, transparent)' }} />

      <div className="max-w-[1400px] mx-auto relative">
        <div className="mb-16 md:mb-24">
          <span className="text-xs uppercase tracking-[0.4em] text-[#E10600] font-bold">{t.services.eyebrow}</span>
          <div className="flex flex-col lg:flex-row lg:items-end gap-8 mt-5">
            <h2 className="display-font text-6xl md:text-8xl lg:text-9xl uppercase leading-[0.85]">{t.services.title}</h2>
            <p className="text-white/50 text-lg max-w-md lg:mb-4">{t.services.subtitle}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 md:gap-6">
          {t.services.items.map((service, i) => (
            <div key={i}
                 className="group relative bg-gradient-to-br from-[#141414] to-[#0A0A0A] border border-white/5 p-8 md:p-10 hover:border-[#E10600]/50 transition-all duration-500 cursor-pointer overflow-hidden">
              {/* Hover gradient */}
              <div className="absolute inset-0 bg-gradient-to-br from-[#E10600]/0 via-transparent to-[#E10600]/0 group-hover:from-[#E10600]/10 group-hover:to-[#E10600]/5 transition-all duration-700" />

              <div className="relative">
                <div className="flex items-start justify-between mb-12">
                  <span className="mono-font text-4xl text-[#E10600]">{service.code}</span>
                  <ArrowUpRight size={20} className="text-white/30 group-hover:text-[#E10600] group-hover:rotate-45 transition-all duration-500" />
                </div>
                <h3 className="display-font text-2xl md:text-3xl uppercase mb-4 leading-tight group-hover:text-[#E10600] transition-colors">
                  {service.title}
                </h3>
                <p className="text-white/50 text-sm leading-relaxed">{service.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─────────────────────────────────────────────────────────────
// BOOKING SECTION
// ─────────────────────────────────────────────────────────────
const EMPTY_BOOKING = {
  brand: '', model: '', vin: '', description: '', quickServices: [],
  needsSpare: null, sparePart: { name: '', desc: '', notes: '' },
  locationType: '', address: '', mapsLink: '', locNotes: '',
  date: '', time: '', name: '', phone: '', whatsapp: '', email: ''
};

function isValidEmail(v) {
  if (!v) return true; // optional
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim());
}

function isValidPhone(v) {
  const digits = (v || '').replace(/\D/g, '');
  return digits.length >= 7;
}

function BookingSection({ t, lang, isRTL }) {
  const [step, setStep] = useState(0);
  const [data, setData] = useState(EMPTY_BOOKING);
  const [submitting, setSubmitting] = useState(false);
  const [confirmation, setConfirmation] = useState(null); // saved booking record
  const [draftRestored, setDraftRestored] = useState(false);
  const [showErrors, setShowErrors] = useState(false);

  const totalSteps = 7;
  const today = new Date().toISOString().split('T')[0];

  // Restore draft once on mount
  useEffect(() => {
    const draft = loadDraft();
    if (draft && draft.data) {
      setData({ ...EMPTY_BOOKING, ...draft.data, sparePart: { ...EMPTY_BOOKING.sparePart, ...(draft.data.sparePart || {}) } });
      if (typeof draft.step === 'number') setStep(Math.min(Math.max(draft.step, 0), totalSteps - 1));
      setDraftRestored(true);
      const tm = setTimeout(() => setDraftRestored(false), 5000);
      return () => clearTimeout(tm);
    }
  }, []);

  // Autosave draft as the user fills the form (skip the success state)
  useEffect(() => {
    if (confirmation) return;
    const hasAny =
      data.brand || data.model || data.vin || data.description ||
      data.name || data.phone || data.date || data.locationType ||
      data.quickServices.length > 0;
    if (hasAny) saveDraft(data, step);
  }, [data, step, confirmation]);

  // Reset error highlight when the user advances
  useEffect(() => { setShowErrors(false); }, [step]);

  const stepError = (s = step) => {
    switch (s) {
      case 0: return data.brand ? null : (lang === 'ar' ? 'اختر العلامة التجارية للمتابعة.' : 'Select a brand to continue.');
      case 1: return data.model ? null : (lang === 'ar' ? 'اختر الموديل.' : 'Pick your model.');
      case 2: return data.vin.length >= 5 ? null : (lang === 'ar' ? 'أدخل 5 أحرف على الأقل من رقم الشاسيه.' : 'Enter at least 5 characters of the VIN / chassis number.');
      case 3:
        if (data.description.trim().length >= 5 || data.quickServices.length > 0) return null;
        return lang === 'ar' ? 'اختر خدمة سريعة أو صف المشكلة (5 أحرف على الأقل).' : 'Pick a quick service or describe the issue (5+ chars).';
      case 4:
        if (!data.locationType) return lang === 'ar' ? 'اختر موقع الخدمة.' : 'Choose a service location.';
        if (data.locationType === 'mobile' && data.address.trim().length <= 3) return lang === 'ar' ? 'أدخل عنوانك للخدمة المتنقلة.' : 'Enter an address for mobile service.';
        return null;
      case 5:
        if (!data.date) return lang === 'ar' ? 'اختر تاريخ الموعد.' : 'Pick a date.';
        if (!data.time) return lang === 'ar' ? 'اختر وقت الموعد.' : 'Pick a time slot.';
        return null;
      case 6:
        if (data.name.trim().length <= 1) return lang === 'ar' ? 'أدخل اسمك بالكامل.' : 'Enter your full name.';
        if (!isValidPhone(data.phone)) return lang === 'ar' ? 'أدخل رقم هاتف صالحًا (7 أرقام على الأقل).' : 'Enter a valid phone number (7+ digits).';
        if (!isValidEmail(data.email)) return lang === 'ar' ? 'البريد الإلكتروني غير صالح.' : 'Email format looks invalid.';
        return null;
      default: return null;
    }
  };

  const canProceed = () => stepError() === null;

  const goNext = () => {
    if (canProceed()) {
      setStep(s => Math.min(s + 1, totalSteps - 1));
    } else {
      setShowErrors(true);
    }
  };

  const handleSubmit = () => {
    if (!canProceed()) { setShowErrors(true); return; }
    setSubmitting(true);

    const record = saveBooking(data, { lang });
    const message = encodeURIComponent(formatBookingMessage(record, lang === 'ar'));

    setTimeout(() => {
      try { window.open(`${BUSINESS.whatsappUrl}?text=${message}`, '_blank'); } catch {}
      clearDraft();
      setSubmitting(false);
      setConfirmation(record);
    }, 600);
  };

  const startNew = () => {
    setConfirmation(null);
    setData(EMPTY_BOOKING);
    setStep(0);
    clearDraft();
  };

  const resendWhatsApp = () => {
    if (!confirmation) return;
    const msg = encodeURIComponent(formatBookingMessage(confirmation, lang === 'ar'));
    window.open(`${BUSINESS.whatsappUrl}?text=${msg}`, '_blank');
  };

  const progressPct = Math.round(((step + 1) / totalSteps) * 100);
  const currentError = showErrors ? stepError() : null;

  return (
    <section id="booking" className="relative py-24 md:py-40 px-5 md:px-10 bg-gradient-to-b from-[#0A0A0A] via-[#0c0000] to-[#0A0A0A] overflow-hidden">
      {/* Side label */}
      <div className={`hidden lg:block absolute top-40 ${isRTL ? 'right-10' : 'left-10'} text-[10px] uppercase tracking-[0.5em] text-white/20`}
           style={{ writingMode: 'vertical-rl' }}>
        RESERVATION / 01–07
      </div>

      <div className="max-w-[1100px] mx-auto relative">
        <div className="text-center mb-16 md:mb-20">
          <span className="text-xs uppercase tracking-[0.4em] text-[#E10600] font-bold">{t.booking.eyebrow}</span>
          <h2 className="display-font text-5xl md:text-7xl mt-5 uppercase leading-[0.9]">{t.booking.title}</h2>
          <p className="text-white/50 text-base md:text-lg mt-6 max-w-xl mx-auto">{t.booking.subtitle}</p>
        </div>

        {/* Premium location strip */}
        <a
          href={BUSINESS.mapsUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="group block mb-10 md:mb-14 relative bg-gradient-to-r from-[#141414] via-[#0c0000] to-[#141414] border border-white/10 hover:border-[#E10600]/60 transition-all duration-500 overflow-hidden">
          {/* hover overlay */}
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-[#E10600]/5 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />

          <div className="relative flex flex-col sm:flex-row items-stretch">
            {/* icon block */}
            <div className="flex items-center justify-center sm:w-20 py-5 sm:py-0 bg-[#E10600]/10 border-b sm:border-b-0 sm:border-e border-[#E10600]/20">
              <MapPin size={22} className="text-[#E10600] group-hover:scale-110 transition-transform duration-300" />
            </div>

            {/* text block */}
            <div className="flex-1 px-5 sm:px-6 py-4 sm:py-5 flex flex-col justify-center gap-1">
              <div className="text-[10px] mono-font tracking-widest text-[#E10600]">ROSSO AUTO SERVICE</div>
              <div className="text-sm md:text-base text-white/80 leading-relaxed">{t.footer.address}</div>
            </div>

            {/* CTA block */}
            <div className="flex items-center gap-2 px-5 sm:px-6 py-4 sm:py-5 border-t sm:border-t-0 sm:border-s border-white/5 text-xs uppercase tracking-widest text-white/70 group-hover:text-[#E10600] transition-colors">
              <span>{t.footer.openMaps}</span>
              <ArrowUpRight size={14} className="group-hover:rotate-45 transition-transform duration-300" />
            </div>
          </div>
        </a>

        {confirmation ? (
          <BookingSuccess
            record={confirmation}
            isRTL={isRTL}
            lang={lang}
            onNew={startNew}
            onResend={resendWhatsApp}
          />
        ) : (
        <>
        {/* Progress tracker */}
        <div className="mb-10 md:mb-14">
          {draftRestored && (
            <div className="mb-4 flex items-center justify-between gap-3 px-4 py-3 bg-[#E10600]/10 border border-[#E10600]/30 text-xs text-white/80">
              <span className="flex items-center gap-2">
                <RefreshCw size={12} className="text-[#E10600]" />
                {lang === 'ar' ? 'تم استعادة مسودة محفوظة.' : 'Restored your saved draft.'}
              </span>
              <button
                onClick={() => { clearDraft(); setData(EMPTY_BOOKING); setStep(0); setDraftRestored(false); }}
                className="text-[10px] uppercase tracking-widest text-white/60 hover:text-[#E10600] transition-colors">
                {lang === 'ar' ? 'بدء جديد' : 'Start fresh'}
              </button>
            </div>
          )}

          <div className="flex items-center gap-1 md:gap-3 overflow-x-auto scrollbar-hide pb-2">
            {t.booking.steps.map((label, i) => (
              <React.Fragment key={i}>
                <button
                  type="button"
                  onClick={() => i <= step && setStep(i)}
                  disabled={i > step}
                  className="flex flex-col items-center gap-2 shrink-0 group disabled:cursor-not-allowed">
                  <div className={`relative w-9 h-9 md:w-11 md:h-11 flex items-center justify-center transition-all duration-500 ${
                    i < step ? 'bg-[#E10600] text-white group-hover:bg-[#FF1A0F]' :
                    i === step ? 'bg-[#E10600] text-white red-glow' :
                    'bg-white/5 border border-white/10 text-white/40'
                  }`}>
                    {i < step ? <Check size={16} /> : <span className="mono-font text-xs">0{i + 1}</span>}
                  </div>
                  <span className={`text-[9px] md:text-[10px] uppercase tracking-widest whitespace-nowrap transition-colors ${
                    i <= step ? 'text-white' : 'text-white/30'
                  }`}>
                    {label}
                  </span>
                </button>
                {i < t.booking.steps.length - 1 && (
                  <div className={`h-px flex-1 min-w-[20px] mt-[-20px] transition-all duration-500 ${
                    i < step ? 'bg-[#E10600]' : 'bg-white/10'
                  }`} />
                )}
              </React.Fragment>
            ))}
          </div>

          {/* Linear progress bar */}
          <div className="mt-4 flex items-center gap-3">
            <div className="flex-1 h-1 bg-white/5 overflow-hidden">
              <div
                className="h-full bg-[#E10600] transition-all duration-500"
                style={{ width: `${progressPct}%` }}
              />
            </div>
            <span className="mono-font text-[10px] text-white/40 shrink-0">{progressPct}%</span>
          </div>
        </div>

        {/* Steps */}
        <div className="bg-gradient-to-br from-[#141414] to-[#0a0a0a] border border-white/10 p-6 md:p-12 min-h-[480px] relative overflow-hidden">
          {/* corner accents */}
          <div className="absolute top-0 left-0 w-12 h-12 border-t-2 border-l-2 border-[#E10600]" />
          <div className="absolute top-0 right-0 w-12 h-12 border-t-2 border-r-2 border-[#E10600]" />
          <div className="absolute bottom-0 left-0 w-12 h-12 border-b-2 border-l-2 border-[#E10600]" />
          <div className="absolute bottom-0 right-0 w-12 h-12 border-b-2 border-r-2 border-[#E10600]" />

          <div key={step} className="anim-fade-up">
            {step === 0 && <Step1 t={t} data={data} setData={setData} />}
            {step === 1 && <Step2 t={t} data={data} setData={setData} />}
            {step === 2 && <Step3 t={t} data={data} setData={setData} />}
            {step === 3 && <Step4 t={t} data={data} setData={setData} />}
            {step === 4 && <Step5 t={t} data={data} setData={setData} />}
            {step === 5 && <Step6 t={t} data={data} setData={setData} today={today} />}
            {step === 6 && <Step7 t={t} data={data} setData={setData} showErrors={showErrors} />}
          </div>
        </div>

        {/* Inline validation feedback */}
        {currentError && (
          <div className="mt-4 flex items-center gap-2 px-4 py-3 bg-[#E10600]/10 border border-[#E10600]/40 text-sm text-white/90 anim-fade-up">
            <AlertTriangle size={14} className="text-[#E10600] shrink-0" />
            <span>{currentError}</span>
          </div>
        )}

        {/* Controls */}
        <div className="mt-8 flex items-center justify-between gap-4">
          <button
            onClick={() => setStep(Math.max(0, step - 1))}
            disabled={step === 0}
            className="px-5 md:px-8 py-3.5 border border-white/15 hover:border-white/40 text-xs uppercase tracking-widest disabled:opacity-30 disabled:cursor-not-allowed transition-all flex items-center gap-2">
            <ChevronLeft size={16} className={isRTL ? 'rotate-180' : ''} />
            {t.booking.back}
          </button>

          {step < totalSteps - 1 ? (
            <button
              onClick={goNext}
              className={`flex-1 md:flex-none md:px-12 py-3.5 text-white text-xs uppercase tracking-widest font-bold transition-all flex items-center justify-center gap-2 ${
                canProceed()
                  ? 'bg-[#E10600] hover:bg-[#FF1A0F]'
                  : 'bg-white/10 text-white/40 hover:bg-white/15'
              }`}>
              {t.booking.next}
              <ChevronRight size={16} className={isRTL ? 'rotate-180' : ''} />
            </button>
          ) : (
            <button
              onClick={() => !submitting && handleSubmit()}
              disabled={submitting}
              className={`flex-1 md:flex-none md:px-12 py-3.5 text-white text-xs uppercase tracking-widest font-bold transition-all flex items-center justify-center gap-3 ${
                canProceed() && !submitting
                  ? 'bg-[#25D366] hover:bg-[#1ebd57]'
                  : 'bg-white/10 text-white/40'
              }`}>
              {submitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  {isRTL ? 'جارٍ الإرسال...' : 'Sending...'}
                </>
              ) : (
                <>
                  <MessageCircle size={16} />
                  {t.booking.submit}
                </>
              )}
            </button>
          )}
        </div>
        </>
        )}
      </div>
    </section>
  );
}

// ─────────────────────────────────────────────────────────────
// BOOKING SUCCESS SCREEN
// ─────────────────────────────────────────────────────────────
function BookingSuccess({ record, isRTL, lang, onNew, onResend }) {
  const [copied, setCopied] = useState(false);
  const copyRef = () => {
    try {
      navigator.clipboard.writeText(record.id);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {}
  };

  const d = record.data;
  const L = (en, ar) => (lang === 'ar' ? ar : en);

  return (
    <div className="anim-fade-up bg-gradient-to-br from-[#141414] to-[#0a0a0a] border border-white/10 p-8 md:p-12 relative overflow-hidden">
      <div className="absolute top-0 left-0 w-12 h-12 border-t-2 border-l-2 border-[#25D366]" />
      <div className="absolute top-0 right-0 w-12 h-12 border-t-2 border-r-2 border-[#25D366]" />
      <div className="absolute bottom-0 left-0 w-12 h-12 border-b-2 border-l-2 border-[#25D366]" />
      <div className="absolute bottom-0 right-0 w-12 h-12 border-b-2 border-r-2 border-[#25D366]" />

      <div className="text-center mb-10">
        <div className="inline-flex items-center justify-center w-20 h-20 bg-[#25D366]/15 border border-[#25D366]/40 rounded-full mb-6">
          <Check size={36} className="text-[#25D366]" strokeWidth={2} />
        </div>
        <span className="text-xs uppercase tracking-[0.4em] text-[#25D366] font-bold">
          {L('Booking Saved', 'تم حفظ الحجز')}
        </span>
        <h3 className="display-font text-3xl md:text-5xl uppercase mt-4 leading-tight">
          {L('We\'ll be in touch', 'سنتواصل معك قريبًا')}
        </h3>
        <p className="text-white/50 mt-4 max-w-lg mx-auto">
          {L(
            'Your booking has been recorded and a WhatsApp draft was opened with our service team.',
            'تم تسجيل حجزك وفتح رسالة واتساب مع فريق الخدمة.'
          )}
        </p>
      </div>

      {/* Reference */}
      <div className="max-w-md mx-auto mb-8 p-5 bg-black/40 border border-white/10 flex items-center justify-between gap-3">
        <div>
          <div className="text-[10px] uppercase tracking-widest text-white/40">{L('Reference', 'مرجع الحجز')}</div>
          <div className="mono-font text-lg text-white mt-1">{record.id}</div>
        </div>
        <button
          onClick={copyRef}
          className="px-3 py-2 border border-white/15 hover:border-[#E10600] hover:text-[#E10600] text-[10px] uppercase tracking-widest flex items-center gap-2 transition-all">
          {copied ? <Check size={12} /> : <Copy size={12} />}
          {copied ? L('Copied', 'تم النسخ') : L('Copy', 'نسخ')}
        </button>
      </div>

      {/* Mini summary */}
      <div className="max-w-2xl mx-auto grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm mb-10">
        <SummaryRow label={L('Vehicle', 'السيارة')} value={`${d.brand} ${d.model}`} />
        <SummaryRow label={L('Appointment', 'الموعد')} value={`${d.date} · ${d.time}`} mono />
        <SummaryRow label={L('Location', 'الموقع')} value={d.locationType === 'center' ? L('Service Center', 'المركز') : L('Mobile', 'منزلي')} />
        <SummaryRow label={L('Contact', 'التواصل')} value={d.phone} />
      </div>

      {/* Actions */}
      <div className="flex flex-col sm:flex-row items-stretch justify-center gap-3 max-w-2xl mx-auto">
        <button
          onClick={onResend}
          className="flex-1 py-3.5 px-6 bg-[#25D366] hover:bg-[#1ebd57] text-white text-xs uppercase tracking-widest font-bold transition-all flex items-center justify-center gap-2">
          <MessageCircle size={14} />
          {L('Reopen WhatsApp', 'إعادة فتح واتساب')}
        </button>
        <a
          href="/dashboard"
          className="flex-1 py-3.5 px-6 border border-white/15 hover:border-[#E10600] hover:bg-[#E10600]/10 text-white text-xs uppercase tracking-widest font-bold transition-all flex items-center justify-center gap-2">
          <LayoutDashboard size={14} />
          {L('Open Dashboard', 'لوحة الحجوزات')}
        </a>
        <button
          onClick={onNew}
          className="flex-1 py-3.5 px-6 border border-white/15 hover:border-white/40 text-white/80 text-xs uppercase tracking-widest font-bold transition-all flex items-center justify-center gap-2">
          <Plus size={14} />
          {L('New Booking', 'حجز جديد')}
        </button>
      </div>
    </div>
  );
}

function SummaryRow({ label, value, mono }) {
  return (
    <div className="flex justify-between border-b border-white/5 py-2">
      <span className="text-white/40">{label}</span>
      <span className={`text-white/90 ${mono ? 'mono-font text-xs' : ''}`}>{value || '—'}</span>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// BOOKING STEPS
// ─────────────────────────────────────────────────────────────
function StepHeader({ num, title, subtitle }) {
  return (
    <div className="mb-8 md:mb-10">
      <div className="flex items-center gap-3 mb-3">
        <span className="mono-font text-[#E10600] text-sm">STEP / 0{num}</span>
        <span className="flex-1 h-px bg-white/10" />
      </div>
      <h3 className="display-font text-3xl md:text-4xl uppercase leading-tight">{title}</h3>
      <p className="text-white/50 mt-3">{subtitle}</p>
    </div>
  );
}

// STEP 1: Brand
function Step1({ t, data, setData }) {
  const brandSvgs = {
    'BMW': (
      <div className="w-16 h-16 rounded-full border-2 border-current flex items-center justify-center">
        <div className="grid grid-cols-2 grid-rows-2 w-10 h-10 rounded-full overflow-hidden border border-current">
          <div className="bg-current/10" /><div className="bg-current" />
          <div className="bg-current" /><div className="bg-current/10" />
        </div>
      </div>
    ),
    'MINI': (
      <div className="display-font text-3xl tracking-tighter">MINI</div>
    ),
    'Range Rover': (
      <div className="flex flex-col items-center">
        <div className="mono-font text-xs tracking-[0.3em]">RANGE</div>
        <div className="w-full h-px bg-current my-1" />
        <div className="mono-font text-xs tracking-[0.3em]">ROVER</div>
      </div>
    ),
    'Jaguar': (
      <div className="display-font italic text-2xl tracking-wider">JAGUAR</div>
    )
  };

  return (
    <>
      <StepHeader num={1} title={t.booking.step1.title} subtitle={t.booking.step1.subtitle} />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {['BMW', 'MINI', 'Range Rover', 'Jaguar'].map((brand, i) => (
          <button
            key={brand}
            onClick={() => setData({ ...data, brand, model: '' })}
            className={`group aspect-square relative overflow-hidden border transition-all duration-500 ${
              data.brand === brand
                ? 'border-[#E10600] bg-[#E10600]/10 text-white red-glow'
                : 'border-white/10 bg-black/30 text-white/60 hover:border-white/30 hover:text-white'
            }`}>
            <div className="absolute top-3 left-3 text-[10px] mono-font opacity-50">0{i + 1}</div>
            <div className="h-full flex flex-col items-center justify-center gap-4 p-4">
              {brandSvgs[brand]}
              <div className="text-center">
                <div className="display-font text-sm uppercase tracking-widest">{brand}</div>
                <div className="text-[9px] uppercase tracking-widest opacity-50 mt-1">{t.booking.brandTags[i]}</div>
              </div>
            </div>
            {data.brand === brand && (
              <div className="absolute top-3 right-3 w-6 h-6 bg-[#E10600] rounded-full flex items-center justify-center">
                <Check size={14} />
              </div>
            )}
          </button>
        ))}
      </div>
    </>
  );
}

// STEP 2: Model
function Step2({ t, data, setData }) {
  const [search, setSearch] = useState('');
  const models = MODELS[data.brand] || [];
  const filtered = models.filter(m => m.toLowerCase().includes(search.toLowerCase()));

  return (
    <>
      <StepHeader num={2} title={t.booking.step2.title} subtitle={`${data.brand} — ${models.length} ${t.common.language === 'AR' ? 'موديل متاح' : 'models available'}`} />

      <div className="relative mb-6">
        <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={t.common.language === 'AR' ? 'ابحث عن موديلك...' : 'Search for your model...'}
          className="w-full bg-black/30 border border-white/10 focus:border-[#E10600] outline-none py-4 pl-12 pr-4 text-sm placeholder-white/30 transition-colors"
        />
      </div>

      <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2.5 max-h-[300px] overflow-y-auto pr-2 scrollbar-hide">
        {filtered.map(model => (
          <button
            key={model}
            onClick={() => setData({ ...data, model })}
            className={`py-4 px-3 border text-sm uppercase tracking-widest transition-all duration-300 ${
              data.model === model
                ? 'border-[#E10600] bg-[#E10600] text-white'
                : 'border-white/10 bg-black/30 text-white/70 hover:border-white/30 hover:text-white'
            }`}>
            {model}
          </button>
        ))}
      </div>
    </>
  );
}

// STEP 3: VIN
function Step3({ t, data, setData }) {
  return (
    <>
      <StepHeader num={3} title={t.booking.step3.title} subtitle={t.booking.step3.subtitle} />

      <div className="max-w-2xl">
        <label className="text-xs uppercase tracking-widest text-white/50 mb-3 block">{t.booking.step3.label}</label>
        <input
          type="text"
          value={data.vin}
          onChange={(e) => setData({ ...data, vin: e.target.value.toUpperCase() })}
          placeholder={t.booking.step3.placeholder}
          maxLength={17}
          className="w-full bg-black/30 border-2 border-white/10 focus:border-[#E10600] outline-none py-5 px-5 mono-font text-lg md:text-2xl tracking-widest placeholder-white/20 transition-all"
        />
        <div className="flex items-center justify-between mt-3">
          <p className="text-xs text-white/40">{t.booking.step3.helper}</p>
          <span className={`text-xs mono-font ${data.vin.length >= 5 ? 'text-[#E10600]' : 'text-white/30'}`}>
            {data.vin.length}/17
          </span>
        </div>

        {/* VIN diagram */}
        <div className="mt-10 p-6 bg-black/30 border border-white/5">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 bg-[#E10600]/10 border border-[#E10600]/30 flex items-center justify-center text-[#E10600] shrink-0">
              <FileText size={20} />
            </div>
            <div className="text-sm text-white/60 leading-relaxed">
              {t.common.language === 'AR'
                ? 'يساعدنا رقم الشاسيه على الوصول إلى السجل الكامل للمركبة، وجدول الخدمة من الشركة المصنّعة، وطلب القطع الصحيحة قبل الموعد.'
                : 'Your VIN lets us pull complete vehicle history, manufacturer service schedule, and order correct parts before your appointment.'}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

// STEP 4: Service
function Step4({ t, data, setData }) {
  const toggleQuick = (svc) => {
    const exists = data.quickServices.includes(svc);
    setData({ ...data, quickServices: exists ? data.quickServices.filter(s => s !== svc) : [...data.quickServices, svc] });
  };

  return (
    <>
      <StepHeader num={4} title={t.booking.step4.title} subtitle={t.booking.step4.subtitle} />

      <div className="mb-6">
        <label className="text-xs uppercase tracking-widest text-white/50 mb-3 block">{t.booking.step4.quickLabel}</label>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-2">
          {t.booking.step4.quickServices.map((svc, i) => {
            const Icon = QUICK_ICONS[i];
            const active = data.quickServices.includes(svc);
            return (
              <button
                key={svc}
                onClick={() => toggleQuick(svc)}
                className={`relative p-3 border text-xs uppercase tracking-wider transition-all duration-300 flex flex-col items-center gap-2 ${
                  active
                    ? 'border-[#E10600] bg-[#E10600]/10 text-white'
                    : 'border-white/10 bg-black/30 text-white/60 hover:border-white/30'
                }`}>
                <Icon size={18} className={active ? 'text-[#E10600]' : ''} />
                <span className="text-center leading-tight">{svc}</span>
                {active && <Check size={10} className="absolute top-1.5 right-1.5 text-[#E10600]" />}
              </button>
            );
          })}
        </div>
      </div>

      <div className="mb-6">
        <label className="text-xs uppercase tracking-widest text-white/50 mb-3 block">{t.booking.step4.descLabel}</label>
        <textarea
          value={data.description}
          onChange={(e) => setData({ ...data, description: e.target.value })}
          placeholder={t.booking.step4.descPlaceholder}
          rows={5}
          className="w-full bg-black/30 border border-white/10 focus:border-[#E10600] outline-none py-4 px-4 text-sm placeholder-white/30 transition-colors resize-none leading-relaxed"
        />
      </div>

      {/* Spare part toggle */}
      <div className="border-t border-white/5 pt-6">
        <label className="text-xs uppercase tracking-widest text-white/50 mb-3 block">{t.booking.step4.sparesQuestion}</label>
        <div className="flex gap-3">
          {[{ val: true, label: t.booking.step4.sparesYes }, { val: false, label: t.booking.step4.sparesNo }].map(opt => (
            <button
              key={String(opt.val)}
              onClick={() => setData({ ...data, needsSpare: opt.val })}
              className={`px-8 py-3 border text-xs uppercase tracking-widest transition-all ${
                data.needsSpare === opt.val
                  ? 'border-[#E10600] bg-[#E10600] text-white'
                  : 'border-white/10 bg-black/30 text-white/60 hover:border-white/30'
              }`}>
              {opt.label}
            </button>
          ))}
        </div>

        {data.needsSpare === true && (
          <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4 anim-fade-up">
            <input
              type="text"
              placeholder={t.booking.step4.partNamePh}
              value={data.sparePart.name}
              onChange={(e) => setData({ ...data, sparePart: { ...data.sparePart, name: e.target.value } })}
              className="bg-black/30 border border-white/10 focus:border-[#E10600] outline-none py-3 px-4 text-sm placeholder-white/30 transition-colors"
            />
            <input
              type="text"
              placeholder={t.booking.step4.partDescPh}
              value={data.sparePart.desc}
              onChange={(e) => setData({ ...data, sparePart: { ...data.sparePart, desc: e.target.value } })}
              className="bg-black/30 border border-white/10 focus:border-[#E10600] outline-none py-3 px-4 text-sm placeholder-white/30 transition-colors"
            />
            <textarea
              placeholder={t.booking.step4.partNotesPh}
              value={data.sparePart.notes}
              onChange={(e) => setData({ ...data, sparePart: { ...data.sparePart, notes: e.target.value } })}
              rows={2}
              className="md:col-span-2 bg-black/30 border border-white/10 focus:border-[#E10600] outline-none py-3 px-4 text-sm placeholder-white/30 transition-colors resize-none"
            />
          </div>
        )}
      </div>
    </>
  );
}

// STEP 5: Location
function Step5({ t, data, setData }) {
  return (
    <>
      <StepHeader num={5} title={t.booking.step5.title} subtitle={t.booking.step5.subtitle} />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        {[
          { key: 'center', icon: Building2, title: t.booking.step5.center, desc: t.booking.step5.centerDesc },
          { key: 'mobile', icon: Home, title: t.booking.step5.mobile, desc: t.booking.step5.mobileDesc }
        ].map(opt => {
          const Icon = opt.icon;
          const active = data.locationType === opt.key;
          return (
            <button
              key={opt.key}
              onClick={() => setData({ ...data, locationType: opt.key })}
              className={`relative p-6 md:p-8 border text-start transition-all duration-300 ${
                active ? 'border-[#E10600] bg-[#E10600]/10 red-glow' : 'border-white/10 bg-black/30 hover:border-white/30'
              }`}>
              <Icon size={28} strokeWidth={1.5} className={`mb-4 ${active ? 'text-[#E10600]' : 'text-white/60'}`} />
              <h4 className="display-font text-lg uppercase mb-2">{opt.title}</h4>
              <p className="text-sm text-white/50 leading-relaxed">{opt.desc}</p>
              {active && (
                <div className="absolute top-4 right-4 w-7 h-7 bg-[#E10600] rounded-full flex items-center justify-center">
                  <Check size={16} />
                </div>
              )}
            </button>
          );
        })}
      </div>

      {data.locationType === 'mobile' && (
        <div className="anim-fade-up space-y-4 pt-6 border-t border-white/5">
          <div>
            <label className="text-xs uppercase tracking-widest text-white/50 mb-2 block">{t.booking.step5.address}</label>
            <input
              type="text"
              value={data.address}
              onChange={(e) => setData({ ...data, address: e.target.value })}
              placeholder={t.booking.step5.addressPh}
              className="w-full bg-black/30 border border-white/10 focus:border-[#E10600] outline-none py-3 px-4 text-sm placeholder-white/30 transition-colors"
            />
          </div>
          <div>
            <label className="text-xs uppercase tracking-widest text-white/50 mb-2 block">{t.booking.step5.mapsLink}</label>
            <div className="relative">
              <MapPin size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30" />
              <input
                type="text"
                value={data.mapsLink}
                onChange={(e) => setData({ ...data, mapsLink: e.target.value })}
                placeholder={t.booking.step5.mapsLinkPh}
                className="w-full bg-black/30 border border-white/10 focus:border-[#E10600] outline-none py-3 pl-12 pr-4 text-sm placeholder-white/30 transition-colors"
              />
            </div>
          </div>
          <div>
            <label className="text-xs uppercase tracking-widest text-white/50 mb-2 block">{t.booking.step5.locNotes}</label>
            <textarea
              value={data.locNotes}
              onChange={(e) => setData({ ...data, locNotes: e.target.value })}
              placeholder={t.booking.step5.locNotesPh}
              rows={2}
              className="w-full bg-black/30 border border-white/10 focus:border-[#E10600] outline-none py-3 px-4 text-sm placeholder-white/30 transition-colors resize-none"
            />
          </div>
        </div>
      )}
    </>
  );
}

// STEP 6: Date/Time
function Step6({ t, data, setData, today }) {
  return (
    <>
      <StepHeader num={6} title={t.booking.step6.title} subtitle={t.booking.step6.subtitle} />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div>
          <label className="text-xs uppercase tracking-widest text-white/50 mb-3 flex items-center gap-2">
            <Calendar size={14} />
            {t.booking.step6.dateLabel}
          </label>
          <input
            type="date"
            min={today}
            value={data.date}
            onChange={(e) => setData({ ...data, date: e.target.value })}
            className="w-full bg-black/30 border-2 border-white/10 focus:border-[#E10600] outline-none py-4 px-4 mono-font text-lg transition-colors"
            style={{ colorScheme: 'dark' }}
          />
        </div>

        <div>
          <label className="text-xs uppercase tracking-widest text-white/50 mb-3 flex items-center gap-2">
            <Clock size={14} />
            {t.booking.step6.timeLabel}
          </label>
          <div className="grid grid-cols-3 gap-2 max-h-[260px] overflow-y-auto pr-2 scrollbar-hide">
            {t.booking.step6.timeSlots.map(slot => (
              <button
                key={slot}
                onClick={() => setData({ ...data, time: slot })}
                className={`py-3 border mono-font text-sm transition-all ${
                  data.time === slot
                    ? 'border-[#E10600] bg-[#E10600] text-white'
                    : 'border-white/10 bg-black/30 text-white/70 hover:border-white/30'
                }`}>
                {slot}
              </button>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}

// STEP 7: Customer Info
function Step7({ t, data, setData, showErrors }) {
  const fields = [
    { key: 'name', label: t.booking.step7.name, ph: t.booking.step7.namePh, icon: User, type: 'text', required: true },
    { key: 'phone', label: t.booking.step7.phone, ph: t.booking.step7.phonePh, icon: Phone, type: 'tel', required: true },
    { key: 'whatsapp', label: t.booking.step7.whatsapp, ph: t.booking.step7.whatsappPh, icon: MessageCircle, type: 'tel', required: false },
    { key: 'email', label: t.booking.step7.email, ph: t.booking.step7.emailPh, icon: Mail, type: 'email', required: false }
  ];

  const invalidFor = (key) => {
    if (!showErrors) return false;
    const v = (data[key] || '').toString().trim();
    if (key === 'name') return v.length <= 1;
    if (key === 'phone') return v.replace(/\D/g, '').length < 7;
    if (key === 'email') return v.length > 0 && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
    return false;
  };

  return (
    <>
      <StepHeader num={7} title={t.booking.step7.title} subtitle={t.booking.step7.subtitle} />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {fields.map(field => {
          const Icon = field.icon;
          const invalid = invalidFor(field.key);
          return (
            <div key={field.key}>
              <label className="text-xs uppercase tracking-widest text-white/50 mb-2 flex items-center gap-2">
                <Icon size={12} />
                {field.label}
                {field.required && <span className="text-[#E10600]">*</span>}
              </label>
              <input
                type={field.type}
                value={data[field.key]}
                onChange={(e) => setData({ ...data, [field.key]: e.target.value })}
                placeholder={field.ph}
                aria-invalid={invalid || undefined}
                className={`w-full bg-black/30 border outline-none py-3.5 px-4 text-sm placeholder-white/30 transition-colors ${
                  invalid ? 'border-[#E10600] bg-[#E10600]/5' : 'border-white/10 focus:border-[#E10600]'
                }`}
              />
            </div>
          );
        })}
      </div>

      {/* Summary preview */}
      <div className="mt-8 p-6 bg-black/40 border border-white/5">
        <div className="text-xs uppercase tracking-widest text-[#E10600] mb-4">
          {t.common.language === 'AR' ? 'ملخص الحجز' : 'Booking Summary'}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
          <div className="flex justify-between border-b border-white/5 py-2">
            <span className="text-white/40">{t.common.language === 'AR' ? 'السيارة' : 'Vehicle'}</span>
            <span className="text-white/90">{data.brand} {data.model}</span>
          </div>
          <div className="flex justify-between border-b border-white/5 py-2">
            <span className="text-white/40">VIN</span>
            <span className="text-white/90 mono-font text-xs">{data.vin}</span>
          </div>
          <div className="flex justify-between border-b border-white/5 py-2">
            <span className="text-white/40">{t.common.language === 'AR' ? 'الموقع' : 'Location'}</span>
            <span className="text-white/90">{data.locationType === 'center' ? (t.common.language === 'AR' ? 'المركز' : 'Center') : (t.common.language === 'AR' ? 'منزلي' : 'Mobile')}</span>
          </div>
          <div className="flex justify-between border-b border-white/5 py-2">
            <span className="text-white/40">{t.common.language === 'AR' ? 'الموعد' : 'Appointment'}</span>
            <span className="text-white/90 mono-font">{data.date} · {data.time}</span>
          </div>
        </div>
      </div>
    </>
  );
}

// ─────────────────────────────────────────────────────────────
// FAQ
// ─────────────────────────────────────────────────────────────
function FAQ({ t, isRTL }) {
  const [open, setOpen] = useState(0);

  return (
    <section id="faq" className="relative py-24 md:py-40 px-5 md:px-10 bg-[#0A0A0A]">
      <div className="max-w-[1100px] mx-auto">
        <div className="mb-16">
          <span className="text-xs uppercase tracking-[0.4em] text-[#E10600] font-bold">{t.faq.eyebrow}</span>
          <h2 className="display-font text-5xl md:text-7xl mt-5 uppercase leading-[0.9]">{t.faq.title}</h2>
        </div>

        <div className="space-y-px bg-white/5">
          {t.faq.items.map((item, i) => (
            <div key={i} className="bg-[#0A0A0A]">
              <button
                onClick={() => setOpen(open === i ? -1 : i)}
                className="w-full px-5 md:px-8 py-5 md:py-7 flex items-center gap-6 text-start hover:bg-white/[0.02] transition-colors">
                <span className="mono-font text-sm text-[#E10600] shrink-0">0{i + 1}</span>
                <h3 className="display-font flex-1 text-lg md:text-xl uppercase leading-tight">{item.q}</h3>
                <div className={`w-10 h-10 border border-white/10 flex items-center justify-center shrink-0 transition-all ${open === i ? 'bg-[#E10600] border-[#E10600] rotate-45' : ''}`}>
                  <Plus size={16} />
                </div>
              </button>
              {open === i && (
                <div className="px-5 md:px-8 pb-7 anim-fade-up">
                  <div className="ml-0 md:ml-12 pl-0 md:pl-6 md:border-l border-[#E10600]/30">
                    <p className="text-white/60 leading-relaxed">{item.a}</p>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─────────────────────────────────────────────────────────────
// FOOTER
// ─────────────────────────────────────────────────────────────
function Footer({ t, isRTL, scrollTo }) {
  return (
    <footer className="relative bg-black border-t border-white/5">
      {/* huge wordmark */}
      <div className="overflow-hidden py-12 md:py-20 border-b border-white/5">
        <div className="max-w-[1400px] mx-auto px-5 md:px-10">
          <div style={{ fontFamily: "'Audiowide', sans-serif" }}
               className="text-[20vw] md:text-[18vw] text-[#E10600] leading-none tracking-tighter">
            ROSSO®
          </div>
        </div>
      </div>

      <div className="max-w-[1400px] mx-auto px-5 md:px-10 py-16 md:py-20">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10 md:gap-8 mb-16">
          <div className="md:col-span-2">
            <RossoLogo size="md" />
            <p className="text-white/50 mt-5 max-w-sm leading-relaxed">{t.footer.tagline}</p>
            <div className="flex gap-3 mt-6">
              {[
                { Icon: Instagram, href: BUSINESS.social.instagram, label: 'Instagram' },
                { Icon: Facebook, href: BUSINESS.social.facebook, label: 'Facebook' },
                { Icon: MessageCircle, href: BUSINESS.whatsappUrl, label: 'WhatsApp' },
              ].map(({ Icon, href, label }) => (
                <a
                  key={label}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={label}
                  className="group relative w-10 h-10 border border-white/10 hover:border-[#E10600] flex items-center justify-center transition-all duration-300 overflow-hidden">
                  <span className="absolute inset-0 bg-[#E10600] translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
                  <Icon size={16} className="relative z-10 group-hover:scale-110 group-hover:text-white transition-all duration-300" />
                </a>
              ))}
            </div>
          </div>

          <div>
            <h4 className="text-xs uppercase tracking-[0.3em] text-[#E10600] mb-5">{t.footer.contact}</h4>
            <ul className="space-y-3 text-sm text-white/60">
              <li>
                <a href={`tel:${BUSINESS.phone}`}
                   className="flex items-start gap-3 hover:text-white transition-colors group">
                  <Phone size={14} className="mt-0.5 text-[#E10600] group-hover:scale-110 transition-transform" />
                  <span dir="ltr">{BUSINESS.phoneDisplay}</span>
                </a>
              </li>
              <li>
                <a href={BUSINESS.whatsappUrl}
                   target="_blank" rel="noopener noreferrer"
                   className="flex items-start gap-3 hover:text-white transition-colors group">
                  <MessageCircle size={14} className="mt-0.5 text-[#E10600] group-hover:scale-110 transition-transform" />
                  <span>WhatsApp</span>
                </a>
              </li>
              <li>
                <a href={BUSINESS.mapsUrl}
                   target="_blank" rel="noopener noreferrer"
                   className="flex items-start gap-3 hover:text-white transition-colors group">
                  <MapPin size={14} className="mt-0.5 text-[#E10600] group-hover:scale-110 transition-transform shrink-0" />
                  <span className="leading-relaxed">{t.footer.address}</span>
                </a>
              </li>
            </ul>

            <a href={BUSINESS.mapsUrl}
               target="_blank" rel="noopener noreferrer"
               className="group mt-5 inline-flex items-center gap-2 px-4 py-2.5 border border-[#E10600]/40 hover:border-[#E10600] hover:bg-[#E10600] transition-all duration-300 text-xs uppercase tracking-widest text-white">
              <MapPin size={12} className="text-[#E10600] group-hover:text-white transition-colors" />
              <span>{t.footer.openMaps}</span>
              <ArrowUpRight size={12} className="group-hover:rotate-45 transition-transform duration-300" />
            </a>
          </div>

          <div>
            <h4 className="text-xs uppercase tracking-[0.3em] text-[#E10600] mb-5">{t.footer.hours}</h4>
            <div className="text-sm text-white/60 mb-6">
              <div>{t.footer.hoursDays}</div>
              <div className="mono-font text-white/80 mt-1">{t.footer.hoursTime}</div>
            </div>

            <h4 className="text-xs uppercase tracking-[0.3em] text-[#E10600] mb-3">{t.footer.quick}</h4>
            <ul className="space-y-2 text-sm text-white/60">
              <li><button onClick={() => scrollTo('home')} className="hover:text-[#E10600] transition-colors">{t.nav.home}</button></li>
              <li><button onClick={() => scrollTo('services')} className="hover:text-[#E10600] transition-colors">{t.nav.services}</button></li>
              <li><button onClick={() => scrollTo('booking')} className="hover:text-[#E10600] transition-colors">{t.nav.book}</button></li>
            </ul>
          </div>
        </div>

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pt-8 border-t border-white/5 text-xs text-white/40 uppercase tracking-wider">
          <div>{t.footer.copy}</div>
          <div className="flex gap-6">
            <a href="#" className="hover:text-white transition-colors">{t.footer.privacy}</a>
            <a href="#" className="hover:text-white transition-colors">{t.footer.terms}</a>
          </div>
        </div>
      </div>
    </footer>
  );
}

// ─────────────────────────────────────────────────────────────
// FLOATING WHATSAPP
// ─────────────────────────────────────────────────────────────
function FloatingWhatsApp() {
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 1500);
    return () => clearTimeout(t);
  }, []);

  return (
    <a
      href={BUSINESS.whatsappUrl}
      target="_blank"
      rel="noopener noreferrer"
      className={`fixed bottom-6 right-6 z-40 w-14 h-14 md:w-16 md:h-16 bg-[#25D366] rounded-full flex items-center justify-center text-white anim-pulse-red transition-all duration-500 hover:scale-110 ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}
      style={{ boxShadow: '0 10px 40px -10px rgba(37,211,102,0.6)' }}
      aria-label="Contact via WhatsApp">
      <svg viewBox="0 0 24 24" className="w-7 h-7 md:w-8 md:h-8 fill-current" xmlns="http://www.w3.org/2000/svg">
        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.464 3.488"/>
      </svg>
    </a>
  );
}
