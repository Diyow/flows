export type Language = 'en' | 'id';

export const translations = {
    en: {
        // Header
        appName: 'FLOWS',
        tagline: 'Flood Level Observation & Warning System',
        updated: 'Updated',
        admin: 'Admin',
        publicView: 'Public View',
        signOut: 'Sign Out',

        // Status
        safe: 'SAFE',
        warning: 'WARNING',
        danger: 'DANGER',
        safeMessage: 'Water levels and flow are normal',
        warningMessage: 'Elevated readings detected - Stay alert',
        dangerMessage: 'Critical conditions - Evacuate immediately!',

        // Metrics
        waterLevel: 'Water Level',
        flowRate: 'Flow Rate',
        levelWarning: 'Level Warning',
        levelDanger: 'Level Danger',
        flowWarning: 'Flow Warning',
        flowDanger: 'Flow Danger',
        status: 'Status',
        currentReading: 'Current Reading',

        // Gauge
        waterLevelGauge: 'Water Level Gauge',

        // Chart
        hourHistory: '24-Hour History',

        // Weather
        weather: 'Weather Forecast',
        temperature: 'Temperature',
        humidity: 'Humidity',
        wind: 'Wind',
        rainChance: 'Rain Chance',
        forecast: 'Forecast',
        today: 'Today',
        noWeatherData: 'Weather data unavailable',
        highRainWarning: 'High rainfall expected - Flood risk elevated',

        // Map
        sensorLocation: 'Sensor Location',
        sensorInfo: 'Water Level Sensor',
        viewOnMaps: 'View on Google Maps',
        sensorDisclaimer: '⚠️ This is an example sensor location for prototype demonstration. Data shown is simulated.',

        // Emergency
        emergencyContacts: 'Emergency Contacts',
        police: 'Police',
        ambulance: 'Ambulance',
        fireDept: 'Fire Department',
        emergencyHotline: 'Emergency Hotline',
        tapToCall: 'Tap a contact to call directly from your phone',

        // Safety
        safetyGuidelines: 'Safety Guidelines',
        doMonitor: 'Monitor water levels regularly during rainy season',
        doSupplies: 'Keep emergency supplies ready (food, water, flashlight)',
        doRoutes: 'Know your evacuation routes in advance',
        dontWalk: 'Never walk or drive through flood waters',
        dontContact: 'Avoid contact with flood water (contamination risk)',
        dontReturn: "Don't return home until authorities confirm safety",

        // Admin
        adminDashboard: 'Admin Dashboard',
        deviceStatus: 'Device Status',
        online: 'Online',
        offline: 'Offline',
        sensorConnection: 'Sensor connection',
        lastUpdate: 'Last Update',
        currentLevel: 'Current Level',
        currentFlow: 'Current flow',
        thresholdSettings: 'Threshold Settings',
        waterLevelThresholds: 'Water Level Thresholds',
        flowRateThresholds: 'Flow Rate Thresholds',
        warningLevel: 'Warning Level',
        dangerLevel: 'Danger Level',
        warningFlow: 'Warning Flow',
        dangerFlow: 'Danger Flow',
        warningsLowerThanDanger: 'Warning thresholds must be lower than danger thresholds',
        saveChanges: 'Save Changes',
        saving: 'Saving...',
        saved: 'Saved!',
        manualControls: 'Manual Controls',
        testAlarmDescription: 'Use these controls to manually trigger system actions for testing purposes.',
        testAlarm: 'Test Alarm',
        testAlarmNote: 'This will create a test event in the logs without affecting real alerts',
        currentThresholds: 'Current Thresholds',
        eventLogs: 'Event Logs',
        noEvents: 'No events recorded yet',
        showingEvents: 'Showing {count} most recent events',
        alert: 'Alert',
        info: 'Info',

        // Login
        adminLogin: 'Admin Login',
        accessDashboard: 'Access the monitoring dashboard',
        firebaseNotConfigured: 'Firebase Not Configured',
        firebaseNotConfiguredDesc: 'To enable authentication, please configure your Firebase credentials.',
        emailAddress: 'Email Address',
        password: 'Password',
        signIn: 'Sign In',
        signingIn: 'Signing in...',
        demoMode: 'Demo Mode',
        demoModeDesc: 'The app is running without Firebase. Data is stored locally and will reset on page reload.',
        protectedArea: 'Protected area for authorized personnel only',
        invalidCredentials: 'Invalid email or password. Please try again.',
        backToDashboard: 'Back to Dashboard',

        // Footer
        allRightsReserved: 'All Rights Reserved',
        loggedInAs: 'Logged in as',
        adminPanel: 'FLOWS Admin Panel',
    },

    id: {
        // Header
        appName: 'FLOWS',
        tagline: 'Sistem Observasi & Peringatan Tingkat Banjir',
        updated: 'Diperbarui',
        admin: 'Admin',
        publicView: 'Tampilan Publik',
        signOut: 'Keluar',

        // Status
        safe: 'AMAN',
        warning: 'WASPADA',
        danger: 'BAHAYA',
        safeMessage: 'Ketinggian dan aliran air normal',
        warningMessage: 'Pembacaan meningkat - Tetap waspada',
        dangerMessage: 'Kondisi kritis - Segera evakuasi!',

        // Metrics
        waterLevel: 'Ketinggian Air',
        flowRate: 'Laju Aliran',
        levelWarning: 'Peringatan Level',
        levelDanger: 'Bahaya Level',
        flowWarning: 'Peringatan Aliran',
        flowDanger: 'Bahaya Aliran',
        status: 'Status',
        currentReading: 'Pembacaan Saat Ini',

        // Gauge
        waterLevelGauge: 'Pengukur Ketinggian Air',

        // Chart
        hourHistory: 'Riwayat 24 Jam',

        // Weather
        weather: 'Prakiraan Cuaca',
        temperature: 'Suhu',
        humidity: 'Kelembaban',
        wind: 'Angin',
        rainChance: 'Peluang Hujan',
        forecast: 'Prakiraan',
        today: 'Hari Ini',
        noWeatherData: 'Data cuaca tidak tersedia',
        highRainWarning: 'Curah hujan tinggi diperkirakan - Risiko banjir meningkat',

        // Map
        sensorLocation: 'Lokasi Sensor',
        sensorInfo: 'Sensor Ketinggian Air',
        viewOnMaps: 'Lihat di Google Maps',
        sensorDisclaimer: '⚠️ Ini adalah contoh lokasi sensor untuk demonstrasi prototipe. Data yang ditampilkan adalah simulasi.',

        // Emergency
        emergencyContacts: 'Kontak Darurat',
        police: 'Polisi',
        ambulance: 'Ambulans',
        fireDept: 'Pemadam Kebakaran',
        emergencyHotline: 'Hotline Darurat',
        tapToCall: 'Ketuk kontak untuk menelepon langsung dari ponsel Anda',

        // Safety
        safetyGuidelines: 'Panduan Keselamatan',
        doMonitor: 'Pantau ketinggian air secara teratur selama musim hujan',
        doSupplies: 'Siapkan persediaan darurat (makanan, air, senter)',
        doRoutes: 'Ketahui rute evakuasi Anda sebelumnya',
        dontWalk: 'Jangan pernah berjalan atau berkendara melewati air banjir',
        dontContact: 'Hindari kontak dengan air banjir (risiko kontaminasi)',
        dontReturn: 'Jangan kembali ke rumah sampai pihak berwenang mengonfirmasi keamanan',

        // Admin
        adminDashboard: 'Dashboard Admin',
        deviceStatus: 'Status Perangkat',
        online: 'Online',
        offline: 'Offline',
        sensorConnection: 'Koneksi sensor',
        lastUpdate: 'Pembaruan Terakhir',
        currentLevel: 'Level Saat Ini',
        currentFlow: 'Aliran saat ini',
        thresholdSettings: 'Pengaturan Ambang Batas',
        waterLevelThresholds: 'Ambang Ketinggian Air',
        flowRateThresholds: 'Ambang Laju Aliran',
        warningLevel: 'Level Peringatan',
        dangerLevel: 'Level Bahaya',
        warningFlow: 'Aliran Peringatan',
        dangerFlow: 'Aliran Bahaya',
        warningsLowerThanDanger: 'Ambang peringatan harus lebih rendah dari ambang bahaya',
        saveChanges: 'Simpan Perubahan',
        saving: 'Menyimpan...',
        saved: 'Tersimpan!',
        manualControls: 'Kontrol Manual',
        testAlarmDescription: 'Gunakan kontrol ini untuk memicu tindakan sistem secara manual untuk tujuan pengujian.',
        testAlarm: 'Tes Alarm',
        testAlarmNote: 'Ini akan membuat event tes di log tanpa memengaruhi peringatan nyata',
        currentThresholds: 'Ambang Batas Saat Ini',
        eventLogs: 'Log Event',
        noEvents: 'Belum ada event yang tercatat',
        showingEvents: 'Menampilkan {count} event terbaru',
        alert: 'Peringatan',
        info: 'Info',

        // Login
        adminLogin: 'Login Admin',
        accessDashboard: 'Akses dashboard pemantauan',
        firebaseNotConfigured: 'Firebase Tidak Dikonfigurasi',
        firebaseNotConfiguredDesc: 'Untuk mengaktifkan autentikasi, silakan konfigurasi kredensial Firebase Anda.',
        emailAddress: 'Alamat Email',
        password: 'Kata Sandi',
        signIn: 'Masuk',
        signingIn: 'Sedang masuk...',
        demoMode: 'Mode Demo',
        demoModeDesc: 'Aplikasi berjalan tanpa Firebase. Data disimpan secara lokal dan akan direset saat halaman dimuat ulang.',
        protectedArea: 'Area terlindungi hanya untuk personel yang berwenang',
        invalidCredentials: 'Email atau kata sandi salah. Silakan coba lagi.',
        backToDashboard: 'Kembali ke Dashboard',

        // Footer
        allRightsReserved: 'Hak Cipta Dilindungi',
        loggedInAs: 'Masuk sebagai',
        adminPanel: 'Panel Admin FLOWS',
    },
} as const;

export type TranslationKey = keyof typeof translations.en;
