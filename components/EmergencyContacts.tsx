'use client';

import { Phone, Ambulance, Shield, Flame } from 'lucide-react';
import { useTranslation } from '@/context/LanguageContext';
import { TranslationKey } from '@/lib/translations';

interface EmergencyContact {
    nameKey: TranslationKey;
    number: string;
    icon: React.ComponentType<{ className?: string }>;
    color: string;
}

const emergencyContacts: EmergencyContact[] = [
    { nameKey: 'police', number: '110', icon: Shield, color: 'text-blue-400' },
    { nameKey: 'ambulance', number: '118', icon: Ambulance, color: 'text-red-400' },
    { nameKey: 'fireDept', number: '113', icon: Flame, color: 'text-orange-400' },
    { nameKey: 'emergencyHotline', number: '112', icon: Phone, color: 'text-green-400' },
];

export function EmergencyContacts() {
    const { t } = useTranslation();

    return (
        <div className="p-6 rounded-2xl bg-gray-800/50 border border-gray-700">
            <div className="flex items-center gap-2 mb-4">
                <Phone className="w-5 h-5 text-red-400" />
                <h3 className="text-lg font-semibold text-white">{t('emergencyContacts')}</h3>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {emergencyContacts.map((contact) => {
                    const Icon = contact.icon;
                    return (
                        <a
                            key={contact.nameKey}
                            href={`tel:${contact.number}`}
                            className="flex flex-col items-center p-4 rounded-xl bg-gray-900/50 border border-gray-700 hover:border-gray-500 transition-all hover:scale-105"
                        >
                            <Icon className={`w-8 h-8 mb-2 ${contact.color}`} />
                            <span className="text-gray-400 text-xs uppercase tracking-wide">{t(contact.nameKey)}</span>
                            <span className="text-white font-bold text-xl">{contact.number}</span>
                        </a>
                    );
                })}
            </div>

            <p className="mt-4 text-center text-gray-500 text-sm">
                {t('tapToCall')}
            </p>
        </div>
    );
}
