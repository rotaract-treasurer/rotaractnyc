'use client';

import { useState, useEffect, useRef } from 'react';
import { cn } from '@/lib/utils/cn';

// ── Country data ──

interface Country {
  name: string;
  code: string;
  dial: string;
  flag: string;
}

// Curated top list — common countries for NYC-based Rotaract
const CURATED_COUNTRIES: Country[] = [
  { name: 'United States', code: 'US', dial: '+1', flag: '🇺🇸' },
  { name: 'Canada', code: 'CA', dial: '+1', flag: '🇨🇦' },
  { name: 'United Kingdom', code: 'GB', dial: '+44', flag: '🇬🇧' },
  { name: 'India', code: 'IN', dial: '+91', flag: '🇮🇳' },
  { name: 'Nigeria', code: 'NG', dial: '+234', flag: '🇳🇬' },
  { name: 'Ghana', code: 'GH', dial: '+233', flag: '🇬🇭' },
  { name: 'Kenya', code: 'KE', dial: '+254', flag: '🇰🇪' },
  { name: 'South Africa', code: 'ZA', dial: '+27', flag: '🇿🇦' },
  { name: 'Philippines', code: 'PH', dial: '+63', flag: '🇵🇭' },
  { name: 'Mexico', code: 'MX', dial: '+52', flag: '🇲🇽' },
  { name: 'Brazil', code: 'BR', dial: '+55', flag: '🇧🇷' },
  { name: 'Colombia', code: 'CO', dial: '+57', flag: '🇨🇴' },
  { name: 'Jamaica', code: 'JM', dial: '+1', flag: '🇯🇲' },
  { name: 'Trinidad & Tobago', code: 'TT', dial: '+1', flag: '🇹🇹' },
  { name: 'Dominican Republic', code: 'DO', dial: '+1', flag: '🇩🇴' },
  { name: 'Haiti', code: 'HT', dial: '+509', flag: '🇭🇹' },
  { name: 'Germany', code: 'DE', dial: '+49', flag: '🇩🇪' },
  { name: 'France', code: 'FR', dial: '+33', flag: '🇫🇷' },
  { name: 'China', code: 'CN', dial: '+86', flag: '🇨🇳' },
  { name: 'Japan', code: 'JP', dial: '+81', flag: '🇯🇵' },
  { name: 'South Korea', code: 'KR', dial: '+82', flag: '🇰🇷' },
  { name: 'Australia', code: 'AU', dial: '+61', flag: '🇦🇺' },
];

// Full alphabetical list
const ALL_COUNTRIES: Country[] = [
  { name: 'Afghanistan', code: 'AF', dial: '+93', flag: '🇦🇫' },
  { name: 'Albania', code: 'AL', dial: '+355', flag: '🇦🇱' },
  { name: 'Algeria', code: 'DZ', dial: '+213', flag: '🇩🇿' },
  { name: 'Andorra', code: 'AD', dial: '+376', flag: '🇦🇩' },
  { name: 'Angola', code: 'AO', dial: '+244', flag: '🇦🇴' },
  { name: 'Antigua & Barbuda', code: 'AG', dial: '+1', flag: '🇦🇬' },
  { name: 'Argentina', code: 'AR', dial: '+54', flag: '🇦🇷' },
  { name: 'Armenia', code: 'AM', dial: '+374', flag: '🇦🇲' },
  { name: 'Australia', code: 'AU', dial: '+61', flag: '🇦🇺' },
  { name: 'Austria', code: 'AT', dial: '+43', flag: '🇦🇹' },
  { name: 'Azerbaijan', code: 'AZ', dial: '+994', flag: '🇦🇿' },
  { name: 'Bahamas', code: 'BS', dial: '+1', flag: '🇧🇸' },
  { name: 'Bahrain', code: 'BH', dial: '+973', flag: '🇧🇭' },
  { name: 'Bangladesh', code: 'BD', dial: '+880', flag: '🇧🇩' },
  { name: 'Barbados', code: 'BB', dial: '+1', flag: '🇧🇧' },
  { name: 'Belarus', code: 'BY', dial: '+375', flag: '🇧🇾' },
  { name: 'Belgium', code: 'BE', dial: '+32', flag: '🇧🇪' },
  { name: 'Belize', code: 'BZ', dial: '+501', flag: '🇧🇿' },
  { name: 'Benin', code: 'BJ', dial: '+229', flag: '🇧🇯' },
  { name: 'Bhutan', code: 'BT', dial: '+975', flag: '🇧🇹' },
  { name: 'Bolivia', code: 'BO', dial: '+591', flag: '🇧🇴' },
  { name: 'Bosnia & Herzegovina', code: 'BA', dial: '+387', flag: '🇧🇦' },
  { name: 'Botswana', code: 'BW', dial: '+267', flag: '🇧🇼' },
  { name: 'Brazil', code: 'BR', dial: '+55', flag: '🇧🇷' },
  { name: 'Brunei', code: 'BN', dial: '+673', flag: '🇧🇳' },
  { name: 'Bulgaria', code: 'BG', dial: '+359', flag: '🇧🇬' },
  { name: 'Burkina Faso', code: 'BF', dial: '+226', flag: '🇧🇫' },
  { name: 'Burundi', code: 'BI', dial: '+257', flag: '🇧🇮' },
  { name: 'Cabo Verde', code: 'CV', dial: '+238', flag: '🇨🇻' },
  { name: 'Cambodia', code: 'KH', dial: '+855', flag: '🇰🇭' },
  { name: 'Cameroon', code: 'CM', dial: '+237', flag: '🇨🇲' },
  { name: 'Canada', code: 'CA', dial: '+1', flag: '🇨🇦' },
  { name: 'Central African Republic', code: 'CF', dial: '+236', flag: '🇨🇫' },
  { name: 'Chad', code: 'TD', dial: '+235', flag: '🇹🇩' },
  { name: 'Chile', code: 'CL', dial: '+56', flag: '🇨🇱' },
  { name: 'China', code: 'CN', dial: '+86', flag: '🇨🇳' },
  { name: 'Colombia', code: 'CO', dial: '+57', flag: '🇨🇴' },
  { name: 'Comoros', code: 'KM', dial: '+269', flag: '🇰🇲' },
  { name: 'Congo (DRC)', code: 'CD', dial: '+243', flag: '🇨🇩' },
  { name: 'Congo (Republic)', code: 'CG', dial: '+242', flag: '🇨🇬' },
  { name: 'Costa Rica', code: 'CR', dial: '+506', flag: '🇨🇷' },
  { name: 'Croatia', code: 'HR', dial: '+385', flag: '🇭🇷' },
  { name: 'Cuba', code: 'CU', dial: '+53', flag: '🇨🇺' },
  { name: 'Cyprus', code: 'CY', dial: '+357', flag: '🇨🇾' },
  { name: 'Czech Republic', code: 'CZ', dial: '+420', flag: '🇨🇿' },
  { name: 'Denmark', code: 'DK', dial: '+45', flag: '🇩🇰' },
  { name: 'Djibouti', code: 'DJ', dial: '+253', flag: '🇩🇯' },
  { name: 'Dominica', code: 'DM', dial: '+1', flag: '🇩🇲' },
  { name: 'Dominican Republic', code: 'DO', dial: '+1', flag: '🇩🇴' },
  { name: 'Ecuador', code: 'EC', dial: '+593', flag: '🇪🇨' },
  { name: 'Egypt', code: 'EG', dial: '+20', flag: '🇪🇬' },
  { name: 'El Salvador', code: 'SV', dial: '+503', flag: '🇸🇻' },
  { name: 'Equatorial Guinea', code: 'GQ', dial: '+240', flag: '🇬🇶' },
  { name: 'Eritrea', code: 'ER', dial: '+291', flag: '🇪🇷' },
  { name: 'Estonia', code: 'EE', dial: '+372', flag: '🇪🇪' },
  { name: 'Eswatini', code: 'SZ', dial: '+268', flag: '🇸🇿' },
  { name: 'Ethiopia', code: 'ET', dial: '+251', flag: '🇪🇹' },
  { name: 'Fiji', code: 'FJ', dial: '+679', flag: '🇫🇯' },
  { name: 'Finland', code: 'FI', dial: '+358', flag: '🇫🇮' },
  { name: 'France', code: 'FR', dial: '+33', flag: '🇫🇷' },
  { name: 'Gabon', code: 'GA', dial: '+241', flag: '🇬🇦' },
  { name: 'Gambia', code: 'GM', dial: '+220', flag: '🇬🇲' },
  { name: 'Georgia', code: 'GE', dial: '+995', flag: '🇬🇪' },
  { name: 'Germany', code: 'DE', dial: '+49', flag: '🇩🇪' },
  { name: 'Ghana', code: 'GH', dial: '+233', flag: '🇬🇭' },
  { name: 'Greece', code: 'GR', dial: '+30', flag: '🇬🇷' },
  { name: 'Grenada', code: 'GD', dial: '+1', flag: '🇬🇩' },
  { name: 'Guatemala', code: 'GT', dial: '+502', flag: '🇬🇹' },
  { name: 'Guinea', code: 'GN', dial: '+224', flag: '🇬🇳' },
  { name: 'Guinea-Bissau', code: 'GW', dial: '+245', flag: '🇬🇼' },
  { name: 'Guyana', code: 'GY', dial: '+592', flag: '🇬🇾' },
  { name: 'Haiti', code: 'HT', dial: '+509', flag: '🇭🇹' },
  { name: 'Honduras', code: 'HN', dial: '+504', flag: '🇭🇳' },
  { name: 'Hungary', code: 'HU', dial: '+36', flag: '🇭🇺' },
  { name: 'Iceland', code: 'IS', dial: '+354', flag: '🇮🇸' },
  { name: 'India', code: 'IN', dial: '+91', flag: '🇮🇳' },
  { name: 'Indonesia', code: 'ID', dial: '+62', flag: '🇮🇩' },
  { name: 'Iran', code: 'IR', dial: '+98', flag: '🇮🇷' },
  { name: 'Iraq', code: 'IQ', dial: '+964', flag: '🇮🇶' },
  { name: 'Ireland', code: 'IE', dial: '+353', flag: '🇮🇪' },
  { name: 'Israel', code: 'IL', dial: '+972', flag: '🇮🇱' },
  { name: 'Italy', code: 'IT', dial: '+39', flag: '🇮🇹' },
  { name: 'Ivory Coast', code: 'CI', dial: '+225', flag: '🇨🇮' },
  { name: 'Jamaica', code: 'JM', dial: '+1', flag: '🇯🇲' },
  { name: 'Japan', code: 'JP', dial: '+81', flag: '🇯🇵' },
  { name: 'Jordan', code: 'JO', dial: '+962', flag: '🇯🇴' },
  { name: 'Kazakhstan', code: 'KZ', dial: '+7', flag: '🇰🇿' },
  { name: 'Kenya', code: 'KE', dial: '+254', flag: '🇰🇪' },
  { name: 'Kiribati', code: 'KI', dial: '+686', flag: '🇰🇮' },
  { name: 'Kuwait', code: 'KW', dial: '+965', flag: '🇰🇼' },
  { name: 'Kyrgyzstan', code: 'KG', dial: '+996', flag: '🇰🇬' },
  { name: 'Laos', code: 'LA', dial: '+856', flag: '🇱🇦' },
  { name: 'Latvia', code: 'LV', dial: '+371', flag: '🇱🇻' },
  { name: 'Lebanon', code: 'LB', dial: '+961', flag: '🇱🇧' },
  { name: 'Lesotho', code: 'LS', dial: '+266', flag: '🇱🇸' },
  { name: 'Liberia', code: 'LR', dial: '+231', flag: '🇱🇷' },
  { name: 'Libya', code: 'LY', dial: '+218', flag: '🇱🇾' },
  { name: 'Liechtenstein', code: 'LI', dial: '+423', flag: '🇱🇮' },
  { name: 'Lithuania', code: 'LT', dial: '+370', flag: '🇱🇹' },
  { name: 'Luxembourg', code: 'LU', dial: '+352', flag: '🇱🇺' },
  { name: 'Madagascar', code: 'MG', dial: '+261', flag: '🇲🇬' },
  { name: 'Malawi', code: 'MW', dial: '+265', flag: '🇲🇼' },
  { name: 'Malaysia', code: 'MY', dial: '+60', flag: '🇲🇾' },
  { name: 'Maldives', code: 'MV', dial: '+960', flag: '🇲🇻' },
  { name: 'Mali', code: 'ML', dial: '+223', flag: '🇲🇱' },
  { name: 'Malta', code: 'MT', dial: '+356', flag: '🇲🇹' },
  { name: 'Mauritania', code: 'MR', dial: '+222', flag: '🇲🇷' },
  { name: 'Mauritius', code: 'MU', dial: '+230', flag: '🇲🇺' },
  { name: 'Mexico', code: 'MX', dial: '+52', flag: '🇲🇽' },
  { name: 'Moldova', code: 'MD', dial: '+373', flag: '🇲🇩' },
  { name: 'Monaco', code: 'MC', dial: '+377', flag: '🇲🇨' },
  { name: 'Mongolia', code: 'MN', dial: '+976', flag: '🇲🇳' },
  { name: 'Montenegro', code: 'ME', dial: '+382', flag: '🇲🇪' },
  { name: 'Morocco', code: 'MA', dial: '+212', flag: '🇲🇦' },
  { name: 'Mozambique', code: 'MZ', dial: '+258', flag: '🇲🇿' },
  { name: 'Myanmar', code: 'MM', dial: '+95', flag: '🇲🇲' },
  { name: 'Namibia', code: 'NA', dial: '+264', flag: '🇳🇦' },
  { name: 'Nepal', code: 'NP', dial: '+977', flag: '🇳🇵' },
  { name: 'Netherlands', code: 'NL', dial: '+31', flag: '🇳🇱' },
  { name: 'New Zealand', code: 'NZ', dial: '+64', flag: '🇳🇿' },
  { name: 'Nicaragua', code: 'NI', dial: '+505', flag: '🇳🇮' },
  { name: 'Niger', code: 'NE', dial: '+227', flag: '🇳🇪' },
  { name: 'Nigeria', code: 'NG', dial: '+234', flag: '🇳🇬' },
  { name: 'North Korea', code: 'KP', dial: '+850', flag: '🇰🇵' },
  { name: 'North Macedonia', code: 'MK', dial: '+389', flag: '🇲🇰' },
  { name: 'Norway', code: 'NO', dial: '+47', flag: '🇳🇴' },
  { name: 'Oman', code: 'OM', dial: '+968', flag: '🇴🇲' },
  { name: 'Pakistan', code: 'PK', dial: '+92', flag: '🇵🇰' },
  { name: 'Palestine', code: 'PS', dial: '+970', flag: '🇵🇸' },
  { name: 'Panama', code: 'PA', dial: '+507', flag: '🇵🇦' },
  { name: 'Papua New Guinea', code: 'PG', dial: '+675', flag: '🇵🇬' },
  { name: 'Paraguay', code: 'PY', dial: '+595', flag: '🇵🇾' },
  { name: 'Peru', code: 'PE', dial: '+51', flag: '🇵🇪' },
  { name: 'Philippines', code: 'PH', dial: '+63', flag: '🇵🇭' },
  { name: 'Poland', code: 'PL', dial: '+48', flag: '🇵🇱' },
  { name: 'Portugal', code: 'PT', dial: '+351', flag: '🇵🇹' },
  { name: 'Qatar', code: 'QA', dial: '+974', flag: '🇶🇦' },
  { name: 'Romania', code: 'RO', dial: '+40', flag: '🇷🇴' },
  { name: 'Russia', code: 'RU', dial: '+7', flag: '🇷🇺' },
  { name: 'Rwanda', code: 'RW', dial: '+250', flag: '🇷🇼' },
  { name: 'Saint Kitts & Nevis', code: 'KN', dial: '+1', flag: '🇰🇳' },
  { name: 'Saint Lucia', code: 'LC', dial: '+1', flag: '🇱🇨' },
  { name: 'Saint Vincent', code: 'VC', dial: '+1', flag: '🇻🇨' },
  { name: 'Samoa', code: 'WS', dial: '+685', flag: '🇼🇸' },
  { name: 'Saudi Arabia', code: 'SA', dial: '+966', flag: '🇸🇦' },
  { name: 'Senegal', code: 'SN', dial: '+221', flag: '🇸🇳' },
  { name: 'Serbia', code: 'RS', dial: '+381', flag: '🇷🇸' },
  { name: 'Sierra Leone', code: 'SL', dial: '+232', flag: '🇸🇱' },
  { name: 'Singapore', code: 'SG', dial: '+65', flag: '🇸🇬' },
  { name: 'Slovakia', code: 'SK', dial: '+421', flag: '🇸🇰' },
  { name: 'Slovenia', code: 'SI', dial: '+386', flag: '🇸🇮' },
  { name: 'Somalia', code: 'SO', dial: '+252', flag: '🇸🇴' },
  { name: 'South Africa', code: 'ZA', dial: '+27', flag: '🇿🇦' },
  { name: 'South Korea', code: 'KR', dial: '+82', flag: '🇰🇷' },
  { name: 'South Sudan', code: 'SS', dial: '+211', flag: '🇸🇸' },
  { name: 'Spain', code: 'ES', dial: '+34', flag: '🇪🇸' },
  { name: 'Sri Lanka', code: 'LK', dial: '+94', flag: '🇱🇰' },
  { name: 'Sudan', code: 'SD', dial: '+249', flag: '🇸🇩' },
  { name: 'Suriname', code: 'SR', dial: '+597', flag: '🇸🇷' },
  { name: 'Sweden', code: 'SE', dial: '+46', flag: '🇸🇪' },
  { name: 'Switzerland', code: 'CH', dial: '+41', flag: '🇨🇭' },
  { name: 'Syria', code: 'SY', dial: '+963', flag: '🇸🇾' },
  { name: 'Taiwan', code: 'TW', dial: '+886', flag: '🇹🇼' },
  { name: 'Tajikistan', code: 'TJ', dial: '+992', flag: '🇹🇯' },
  { name: 'Tanzania', code: 'TZ', dial: '+255', flag: '🇹🇿' },
  { name: 'Thailand', code: 'TH', dial: '+66', flag: '🇹🇭' },
  { name: 'Togo', code: 'TG', dial: '+228', flag: '🇹🇬' },
  { name: 'Tonga', code: 'TO', dial: '+676', flag: '🇹🇴' },
  { name: 'Trinidad & Tobago', code: 'TT', dial: '+1', flag: '🇹🇹' },
  { name: 'Tunisia', code: 'TN', dial: '+216', flag: '🇹🇳' },
  { name: 'Turkey', code: 'TR', dial: '+90', flag: '🇹🇷' },
  { name: 'Turkmenistan', code: 'TM', dial: '+993', flag: '🇹🇲' },
  { name: 'Uganda', code: 'UG', dial: '+256', flag: '🇺🇬' },
  { name: 'Ukraine', code: 'UA', dial: '+380', flag: '🇺🇦' },
  { name: 'United Arab Emirates', code: 'AE', dial: '+971', flag: '🇦🇪' },
  { name: 'United Kingdom', code: 'GB', dial: '+44', flag: '🇬🇧' },
  { name: 'United States', code: 'US', dial: '+1', flag: '🇺🇸' },
  { name: 'Uruguay', code: 'UY', dial: '+598', flag: '🇺🇾' },
  { name: 'Uzbekistan', code: 'UZ', dial: '+998', flag: '🇺🇿' },
  { name: 'Venezuela', code: 'VE', dial: '+58', flag: '🇻🇪' },
  { name: 'Vietnam', code: 'VN', dial: '+84', flag: '🇻🇳' },
  { name: 'Yemen', code: 'YE', dial: '+967', flag: '🇾🇪' },
  { name: 'Zambia', code: 'ZM', dial: '+260', flag: '🇿🇲' },
  { name: 'Zimbabwe', code: 'ZW', dial: '+263', flag: '🇿🇼' },
];

const ALL_COMBINED = [...CURATED_COUNTRIES, ...ALL_COUNTRIES];

/** Try to parse an existing phone string into { countryCode, dialCode, number } */
function parsePhone(phone: string): { countryCode: string; dialCode: string; number: string } {
  if (!phone) return { countryCode: 'US', dialCode: '+1', number: '' };

  const stripped = phone.replace(/\s/g, '');
  const dialCodes = Array.from(new Set(ALL_COMBINED.map((c) => c.dial))).sort(
    (a, b) => b.length - a.length,
  );

  for (const dial of dialCodes) {
    if (stripped.startsWith(dial)) {
      const country = ALL_COMBINED.find((c) => c.dial === dial);
      return {
        countryCode: country?.code || 'US',
        dialCode: dial,
        number: stripped.slice(dial.length),
      };
    }
  }

  return { countryCode: 'US', dialCode: '+1', number: phone };
}

// ── Component ──

interface PhoneInputProps {
  label?: string;
  value: string;
  onChange: (fullNumber: string) => void;
  required?: boolean;
  error?: string;
  helperText?: string;
  placeholder?: string;
}

export default function PhoneInput({
  label,
  value,
  onChange,
  required,
  error,
  helperText,
  placeholder = '(555) 000-0000',
}: PhoneInputProps) {
  const parsed = parsePhone(value);
  const [selectedCode, setSelectedCode] = useState(parsed.countryCode);
  const [dialCode, setDialCode] = useState(parsed.dialCode);
  const [localNumber, setLocalNumber] = useState(parsed.number);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [showAll, setShowAll] = useState(false);
  const [search, setSearch] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  // Re-parse when parent value changes
  useEffect(() => {
    const p = parsePhone(value);
    setSelectedCode(p.countryCode);
    setDialCode(p.dialCode);
    setLocalNumber(p.number);
  }, [value]);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
        setShowAll(false);
        setSearch('');
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  // Focus search when dropdown opens
  useEffect(() => {
    if (dropdownOpen && searchRef.current) {
      searchRef.current.focus();
    }
  }, [dropdownOpen]);

  const handleSelect = (country: Country) => {
    setSelectedCode(country.code);
    setDialCode(country.dial);
    setDropdownOpen(false);
    setShowAll(false);
    setSearch('');
    onChange(localNumber ? `${country.dial}${localNumber}` : '');
  };

  const handleNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const num = e.target.value.replace(/[^\d]/g, '');
    setLocalNumber(num);
    onChange(num ? `${dialCode}${num}` : '');
  };

  const selectedCountry = ALL_COMBINED.find((c) => c.code === selectedCode) || CURATED_COUNTRIES[0];

  const filterCountries = (list: Country[]) => {
    if (!search) return list;
    const s = search.toLowerCase();
    return list.filter(
      (c) =>
        c.name.toLowerCase().includes(s) ||
        c.dial.includes(s) ||
        c.code.toLowerCase().includes(s),
    );
  };

  const filteredCurated = filterCountries(CURATED_COUNTRIES);
  const filteredAll = filterCountries(ALL_COUNTRIES);

  const inputId = label?.toLowerCase().replace(/\s+/g, '-');

  return (
    <div className="w-full" ref={containerRef}>
      {label && (
        <label htmlFor={inputId} className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
          {label}
          {required && <span className="text-red-500 ml-0.5">*</span>}
        </label>
      )}
      <div className="relative flex">
        {/* Country code button */}
        <button
          type="button"
          onClick={() => { setDropdownOpen(!dropdownOpen); setShowAll(false); setSearch(''); }}
          className={cn(
            'flex items-center gap-1 px-3 py-2.5 rounded-l-xl border border-r-0 border-gray-300 bg-gray-50 text-sm whitespace-nowrap',
            'hover:bg-gray-100 transition-colors',
            'dark:bg-gray-800 dark:border-gray-700 dark:hover:bg-gray-700',
            'focus:outline-none focus:ring-2 focus:ring-cranberry-500/20',
            error && 'border-red-500',
          )}
        >
          <span className="text-base leading-none">{selectedCountry.flag}</span>
          <span className="text-gray-600 dark:text-gray-300">{dialCode}</span>
          <svg aria-hidden="true" className={cn('w-3.5 h-3.5 text-gray-400 transition-transform', dropdownOpen && 'rotate-180')} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="m6 9 6 6 6-6" /></svg>
        </button>

        {/* Phone number input */}
        <input
          id={inputId}
          type="tel"
          value={localNumber}
          onChange={handleNumberChange}
          placeholder={placeholder}
          required={required}
          className={cn(
            'flex-1 min-w-0 rounded-r-xl border border-gray-300 bg-white px-4 py-2.5 text-sm',
            'placeholder:text-gray-400 transition-colors duration-150',
            'focus:outline-none focus:ring-2 focus:ring-cranberry-500/20 focus:border-cranberry-500',
            'dark:bg-gray-900 dark:border-gray-700 dark:text-gray-100',
            error && 'border-red-500 focus:ring-red-500/20 focus:border-red-500',
          )}
        />

        {/* Dropdown */}
        {dropdownOpen && (
          <div className="absolute top-full left-0 mt-1 w-72 max-h-80 overflow-auto bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl shadow-lg z-50">
            {/* Search */}
            <div className="sticky top-0 bg-white dark:bg-gray-900 p-2 border-b border-gray-100 dark:border-gray-800">
              <input
                ref={searchRef}
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search country…"
                className="w-full px-3 py-1.5 text-sm rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 focus:outline-none focus:ring-1 focus:ring-cranberry-500/30 dark:text-gray-100 placeholder:text-gray-400"
              />
            </div>

            {/* Curated list */}
            {filteredCurated.length > 0 && (
              <div>
                <div className="px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-gray-400">
                  Common
                </div>
                {filteredCurated.map((c) => (
                  <button
                    key={`curated-${c.code}`}
                    type="button"
                    onClick={() => handleSelect(c)}
                    className={cn(
                      'w-full flex items-center gap-3 px-3 py-2 text-sm hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors',
                      selectedCode === c.code && 'bg-cranberry-50 dark:bg-cranberry-900/20',
                    )}
                  >
                    <span className="text-base">{c.flag}</span>
                    <span className="flex-1 text-left text-gray-900 dark:text-gray-100">{c.name}</span>
                    <span className="text-gray-400 text-xs">{c.dial}</span>
                  </button>
                ))}
              </div>
            )}

            {/* Expand all */}
            {!showAll && !search && (
              <button
                type="button"
                onClick={() => setShowAll(true)}
                className="w-full px-3 py-2.5 text-xs font-medium text-cranberry hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors border-t border-gray-100 dark:border-gray-800"
              >
                Show all countries ▾
              </button>
            )}

            {/* All countries (shown on search or expand) */}
            {(showAll || search) && filteredAll.length > 0 && (
              <div>
                {!search && (
                  <div className="px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-gray-400 border-t border-gray-100 dark:border-gray-800">
                    All Countries
                  </div>
                )}
                {filteredAll.map((c) => (
                  <button
                    key={`all-${c.code}`}
                    type="button"
                    onClick={() => handleSelect(c)}
                    className={cn(
                      'w-full flex items-center gap-3 px-3 py-2 text-sm hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors',
                      selectedCode === c.code && 'bg-cranberry-50 dark:bg-cranberry-900/20',
                    )}
                  >
                    <span className="text-base">{c.flag}</span>
                    <span className="flex-1 text-left text-gray-900 dark:text-gray-100">{c.name}</span>
                    <span className="text-gray-400 text-xs">{c.dial}</span>
                  </button>
                ))}
              </div>
            )}

            {filteredCurated.length === 0 && filteredAll.length === 0 && (
              <p className="px-3 py-4 text-sm text-gray-400 text-center">No countries found</p>
            )}
          </div>
        )}
      </div>
      {error && <p className="mt-1.5 text-sm text-red-600 dark:text-red-400">{error}</p>}
      {helperText && !error && <p className="mt-1.5 text-sm text-gray-500 dark:text-gray-400">{helperText}</p>}
    </div>
  );
}
