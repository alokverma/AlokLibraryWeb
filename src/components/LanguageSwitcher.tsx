import { useLanguage } from '../context/LanguageContext';

export const LanguageSwitcher = () => {
  const { language, setLanguage } = useLanguage();

  return (
    <div className="flex items-center space-x-2">
      <button
        onClick={() => setLanguage('en')}
        className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
          language === 'en'
            ? 'bg-blue-600 text-white'
            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
        }`}
        type="button"
      >
        English
      </button>
      <button
        onClick={() => setLanguage('hi')}
        className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
          language === 'hi'
            ? 'bg-blue-600 text-white'
            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
        }`}
        type="button"
      >
        हिंदी
      </button>
    </div>
  );
};

